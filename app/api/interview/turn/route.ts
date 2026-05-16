import { z } from "zod";
import type { UIMessage } from "ai";
import { streamTurn } from "@/lib/ai/client";
import {
  ensureSession,
  loadLatestMessage,
  loadCodeStatus,
  reserveSeqs,
  writeAssistantTurn,
  writeUserTurn,
} from "@/lib/ai/persistence";
import { writeLog, serializeError } from "@/lib/log";
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
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
  messageId: z.string().optional(),
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

  const { code, messages, radarSnapshot, kickoff, trigger } = parsed.data;
  const isKickoff = kickoff === true && messages.length === 0;
  const isRegenerate = trigger === "regenerate-message";

  // Reject turns against codes that no longer accept conversation. Completed
  // codes have already produced the report-offer card — the client locks the
  // input box at that point, but this guard catches stale tabs / direct API
  // calls. `null` = unknown code; bouncing here saves a session-row insert.
  const codeStatus = await loadCodeStatus(code);
  if (codeStatus === null) {
    return new Response(JSON.stringify({ error: "code_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  if (codeStatus === "completed" || codeStatus === "revoked") {
    return new Response(
      JSON.stringify({ error: "code_not_active", status: codeStatus }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Ensure a session row exists, then reserve seqs up front. Kickoff and
  // regenerate turns may skip the user write: retrying a failed assistant
  // response should not append the same user answer twice.
  await ensureSession(code);
  const lastUserText = isKickoff
    ? ""
    : extractLastUserText(messages as UIMessage[]);
  let shouldWriteUserTurn = !isKickoff && lastUserText.length > 0;
  if (isRegenerate && shouldWriteUserTurn) {
    const latest = await loadLatestMessage(code);
    if (latest?.role === "user" && latest.contentText === lastUserText) {
      shouldWriteUserTurn = false;
    }
  }

  const reserveCount = shouldWriteUserTurn ? 2 : 1;
  const startSeq = await reserveSeqs(code, reserveCount);
  const userSeq = shouldWriteUserTurn ? startSeq : null;
  const assistantSeq = shouldWriteUserTurn ? startSeq + 1 : startSeq;

  // Persist the user's turn immediately so it survives a stream crash.
  if (!isKickoff && userSeq !== null) {
    await writeUserTurn({ code, seq: userSeq, text: lastUserText });
  }

  // Capture the AI's structured analysis when the tool call resolves; the
  // assistant row + radar/sessions state update lands in `onFinish` once
  // the entire stream is done.
  let captured: TurnAnalysis | null = null;

  await writeLog({
    type: "info",
    source: "turn.stream",
    code,
    message: isKickoff ? "kickoff" : "user-turn",
    data: { messageCount: messages.length, assistantSeq },
  });

  let result;
  try {
    result = await streamTurn({
      code,
      messages: messages as UIMessage[],
      radarSnapshot,
      systemNudge: isKickoff ? KICKOFF_NUDGE : undefined,
      onAnalysis: async (a) => {
        captured = a;
      },
      onFinish: async ({ text }) => {
        if (!captured) {
          await writeLog({
            type: "warn",
            source: "turn.stream",
            code,
            message: "stream finished without tool analysis",
          });
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
          await writeLog({
            type: "error",
            source: "turn.persist",
            code,
            message: "writeAssistantTurn failed",
            data: { error: serializeError(err) },
          });
          throw err;
        }
      },
    });
  } catch (err) {
    await writeLog({
      type: "error",
      source: "turn.stream",
      code,
      message: "streamTurn setup failed",
      data: { error: serializeError(err) },
    });
    return new Response(JSON.stringify({ error: "ai_call_failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return result.toUIMessageStreamResponse({
    onError: (err) => {
      // Stream-level error from the model provider — log and surface a
      // generic message back to the client.
      void writeLog({
        type: "error",
        source: "turn.stream",
        code,
        message: "stream error",
        data: { error: serializeError(err) },
      });
      return "ai stream failed";
    },
  });
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
