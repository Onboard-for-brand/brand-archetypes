import { z } from "zod";
import type { UIMessage } from "ai";
import { streamTurn } from "@/lib/ai/client";
import {
  ensureSession,
  reserveSeqs,
  writeUserTurn,
  writeAssistantTurn,
} from "@/lib/ai/persistence";
import { RadarStateSchema } from "@/lib/radar-session";
import type { TurnAnalysis } from "@/lib/ai/tool-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  messages: z.array(z.unknown()), // UIMessage[] — not narrowing, AI SDK validates downstream
  radarSnapshot: RadarStateSchema,
  kickoff: z.boolean().optional(),
});

const KICKOFF_NUDGE =
  "[CONTROL] No prior user message exists. This is the very first turn (CQ1). " +
  "Per the language policy, CQ1 is the only turn that may be bilingual. " +
  "Deliver the welcome message and then ask CQ1 — both in English and Chinese — " +
  "as the user's native language is not yet known. Reply via the emitTurnAnalysis tool.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "bad_request", details: parsed.error.flatten() }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const { code, messages, radarSnapshot, kickoff } = parsed.data;
  const isKickoff = kickoff === true && messages.length === 0;

  // Ensure a session row exists, then reserve seqs up front. Kickoff turns
  // skip the user write (no actual user input).
  await ensureSession(code);
  const reserveCount = isKickoff ? 1 : 2;
  const startSeq = await reserveSeqs(code, reserveCount);
  const userSeq = isKickoff ? null : startSeq;
  const assistantSeq = isKickoff ? startSeq : startSeq + 1;

  // Persist the user's turn immediately so it survives a stream crash.
  if (!isKickoff && userSeq !== null) {
    const lastUserText = extractLastUserText(messages as UIMessage[]);
    if (lastUserText) {
      await writeUserTurn({ code, seq: userSeq, text: lastUserText });
    }
  }

  // Capture the AI's structured analysis when the tool call resolves; the
  // assistant row + radar/sessions state update lands in `onFinish` once
  // the entire stream is done.
  let captured: TurnAnalysis | null = null;

  const result = await streamTurn({
    code,
    messages: messages as UIMessage[],
    radarSnapshot,
    systemNudge: isKickoff ? KICKOFF_NUDGE : undefined,
    onAnalysis: async (a) => {
      captured = a;
      console.log("[turn] tool fired", {
        next: a.nextQuestionKey,
        archetypeDeltas: a.archetypeDeltas,
      });
    },
    onFinish: async ({ text }) => {
      if (!captured) {
        console.warn("[turn] stream finished but no tool analysis was captured");
        return;
      }
      try {
        await writeAssistantTurn({
          code,
          seq: assistantSeq,
          text: text ?? "",
          analysis: captured,
        });
      } catch (err) {
        console.error("[turn] writeAssistantTurn failed", err);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}
