import "server-only";

import { eq, sql, asc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accessCodes,
  messages,
  sessions,
  type AccessCode,
  type Message,
} from "@/db/schema";
import {
  applyRadarDeltas,
  emptyRadarState,
  radarSnapshot,
  type RadarSnapshot,
} from "@/lib/radar-session";
import type { TurnAnalysis } from "./tool-schema";

export type AccessCodeStatus = AccessCode["status"];

/**
 * Quick read-only lookup of an access code's status. Returns null if the
 * code does not exist. Used by the turn route to short-circuit requests
 * against revoked or already-completed codes.
 */
export async function loadCodeStatus(
  code: string,
): Promise<AccessCodeStatus | null> {
  const [row] = await db
    .select({ status: accessCodes.status })
    .from(accessCodes)
    .where(eq(accessCodes.code, code));
  return row?.status ?? null;
}

/**
 * Mark the code as completed AND ensure a brand-summary exists for it.
 *
 * Idempotent — re-running on an already-completed code refreshes the
 * timestamp and skips the summary call if `sessions.brand_summary` is
 * already populated. Called from:
 *   • `writeAssistantTurn` when the AI emits `cta: report-offer` (natural
 *     end-of-interview path)
 *   • the admin PATCH route when an operator flips status to `completed`
 *
 * The brand-summary AI call runs synchronously here. In the natural path
 * this happens inside `streamText`'s `onFinish` callback so the user-facing
 * stream is not delayed; in the admin path it adds ~1–3s to the PATCH.
 */
export async function markCodeCompleted(code: string): Promise<void> {
  await db
    .update(accessCodes)
    .set({ status: "completed", completedAt: sql`now()` })
    .where(eq(accessCodes.code, code));

  const [row] = await db
    .select({
      brandSummary: sessions.brandSummary,
      reportMd: sessions.reportMd,
      contextMd: sessions.contextMd,
    })
    .from(sessions)
    .where(eq(sessions.code, code));
  if (!row) return;

  // Generate the three artifacts in parallel — each is independent. Skip
  // anything already populated so retries / admin re-flips are cheap.
  const { generateBrandSummary, generateBrandReport, generateAiContext } =
    await import("./summarize");

  const tasks: Promise<void>[] = [];

  if (!row.brandSummary) {
    tasks.push(
      (async () => {
        const summary = await generateBrandSummary(code);
        if (!summary) return;
        await db
          .update(sessions)
          .set({ brandSummary: summary, updatedAt: sql`now()` })
          .where(eq(sessions.code, code));
      })(),
    );
  }

  if (!row.reportMd) {
    tasks.push(
      (async () => {
        const md = await generateBrandReport(code);
        if (!md) return;
        await db
          .update(sessions)
          .set({ reportMd: md, updatedAt: sql`now()` })
          .where(eq(sessions.code, code));
      })(),
    );
  }

  if (!row.contextMd) {
    tasks.push(
      (async () => {
        const md = await generateAiContext(code);
        if (!md) return;
        await db
          .update(sessions)
          .set({ contextMd: md, updatedAt: sql`now()` })
          .where(eq(sessions.code, code));
      })(),
    );
  }

  await Promise.all(tasks);
}

/**
 * Ensure a session row exists for `code`. Idempotent — safe to call on every
 * turn. New rows start with an empty radar state and `nextQuestionKey: "CQ1"`.
 *
 * Neon's HTTP driver has no `db.transaction()`. We accept the rare race
 * where two parallel inserts could collide — `ON CONFLICT DO NOTHING`
 * handles it.
 */
export async function ensureSession(code: string): Promise<void> {
  await db
    .insert(sessions)
    .values({
      code,
      radarState: emptyRadarState() as RadarSnapshot,
    })
    .onConflictDoNothing({ target: sessions.code });
}

/**
 * Atomically reserve `n` consecutive seq numbers for `code`.
 * Returns the FIRST reserved seq.
 */
export async function reserveSeqs(code: string, n: number): Promise<number> {
  const [row] = await db
    .update(sessions)
    .set({ lastSeq: sql`${sessions.lastSeq} + ${n}` })
    .where(eq(sessions.code, code))
    .returning({ lastSeq: sessions.lastSeq });
  if (!row) {
    throw new Error(`reserveSeqs: no sessions row for ${code}`);
  }
  return row.lastSeq - n + 1;
}

export async function writeUserTurn(input: {
  code: string;
  seq: number;
  text: string;
}): Promise<void> {
  await db.insert(messages).values({
    code: input.code,
    seq: input.seq,
    role: "user",
    contentText: input.text,
  });
}

/**
 * Insert the assistant message + apply the deltas to the cached session
 * state. Order: insert first (so we have a record even if state update
 * fails), then update sessions.
 */
export async function writeAssistantTurn(input: {
  code: string;
  seq: number;
  /** Final assistant text fallback — usually empty when forced tool call. */
  text: string;
  analysis: TurnAnalysis;
}): Promise<void> {
  const { code, seq, text, analysis } = input;

  await db.insert(messages).values({
    code,
    seq,
    role: "assistant",
    contentText: text || analysis.question || "",
    analysis,
    questionKey: analysis.nextQuestionKey ?? null,
  });

  // Pull current state, apply deltas, write back.
  const [current] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.code, code));
  if (!current) {
    throw new Error(`writeAssistantTurn: no sessions row for ${code}`);
  }

  const nextRadar = radarSnapshot(
    applyRadarDeltas(current.radarState as RadarSnapshot, analysis),
  );

  // Merge terminology additions into the running registry.
  const mergedTerminology: Record<string, string> = {
    ...(current.terminology ?? {}),
  };
  if (analysis.terminologyAdditions) {
    for (const t of analysis.terminologyAdditions) {
      mergedTerminology[t.term] = t.definition;
    }
  }

  await db
    .update(sessions)
    .set({
      radarState: nextRadar,
      terminology: mergedTerminology,
      mode: analysis.modeUpdate ?? current.mode,
      nextQuestionKey: analysis.nextQuestionKey ?? current.nextQuestionKey,
      nativeLanguage: analysis.nativeLanguage ?? current.nativeLanguage,
      updatedAt: sql`now()`,
    })
    .where(eq(sessions.code, code));

  // Q42 ended: AI emitted the report-offer card. The interview is closed —
  // any further turn requests against this code will be rejected by the
  // turn route's status guard.
  if (analysis.cta?.kind === "report-offer") {
    await markCodeCompleted(code);
  }
}

export async function loadSessionState(code: string) {
  const [row] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.code, code));
  return row ?? null;
}

export async function loadMessages(code: string, limit = 100): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.code, code))
    .orderBy(asc(messages.seq))
    .limit(limit);
}
