import { z } from "zod";
import type { UIMessage } from "ai";
import { streamTurn } from "@/lib/ai/client";
import { RadarStateSchema } from "@/lib/radar-session";

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

  const result = await streamTurn({
    code,
    messages: messages as UIMessage[],
    radarSnapshot,
    systemNudge:
      kickoff && messages.length === 0 ? KICKOFF_NUDGE : undefined,
    // Phase 1: no persistence. Phase 2 will write to DB here.
    onAnalysis: async (a) => {
      console.log("[turn] tool fired", {
        next: a.nextQuestionKey,
        archetypeDeltas: a.archetypeDeltas,
        journeyDelta: a.journeyDelta,
        internalStructureDelta: a.internalStructureDelta,
        modeUpdate: a.modeUpdate,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
