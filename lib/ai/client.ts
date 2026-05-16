import "server-only";

import {
  streamText,
  tool,
  convertToModelMessages,
  type UIMessage,
  type ModelMessage,
  type StreamTextOnFinishCallback,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

import { loadSystemPrompt } from "./system-prompt";
import { TurnAnalysisSchema, type TurnAnalysis } from "./tool-schema";
import { getActiveModel } from "@/lib/settings";
import type { RadarSnapshot } from "@/lib/radar-session";

/**
 * Overrides the v5 framework's default bilingual protocol. Applied as an
 * explicit instruction appended to the system prompt so it takes priority
 * over the framework's "ask each question in both languages" rule.
 */
const LANGUAGE_OVERRIDE = `
[OUTPUT POLICY — OVERRIDES THE FRAMEWORK'S BILINGUAL & FORMATTING PROTOCOL]

REPORT DELIVERY (read this first — it shapes how you end the interview)
This product produces a portrait report for the user automatically as soon
as the full 42-question interview is complete. The report is unconditional:
you do not ask permission, you do not offer it as a choice, you do not
phrase it as "would you like one". When you reach the end of the framework
you simply announce that it is ready. The UI then renders a card with one
button that opens it.

LANGUAGE
• CQ1 is the only turn that may be bilingual (English + Chinese), since the
  user's native language has not yet been declared.
• Once the user answers CQ1, you MUST switch to the user's native language
  ONLY. No English fallback, no parallel translation, no parenthetical
  glosses.

TURN STRUCTURE — every turn calls emitTurnAnalysis with three text fields:
• "bridge"    — conversational narrative the user sees. On CQ1: include the
                framework's full welcome paragraphs. After CQ1: a brief 1–2
                sentence acknowledgment of their last answer. May be empty.
• "question"  — the next question, on its own. Do NOT repeat content already
                in "bridge". This is rendered as its own visually distinct
                block in the UI.
• "reasoning" — internal analytical notes (Mode signals, archetype reads,
                follow-up planning). NEVER shown to the user. The user must
                never see your meta-commentary about them.

QUESTION KEY DISCIPLINE
• "nextQuestionKey" is the canonical key for the exact framework question you
  are asking in this turn.
• Allowed values are only: CQ1, CQ2, CQ3, CQ4, CQ5, Q1 through Q42, and DONE.
• Never invent semantic or temporary keys such as "CQ-terminology". If a term
  needs clarification, ask the next canonical framework question and fold the
  clarification into the bridge/question wording.

END OF INTERVIEW (the single turn that follows the user's Q42 answer)
The framework's tail asks you to compose three markdown documents inline. DO
NOT do that — those files are generated client-side from the per-turn
analyses you have already emitted.

This turn announces the finished report and the conversation ends. The
user's input box is locked from this point on; you will not receive further
messages. Set:

• "bridge"          → a brief announcement that the report has been
                      generated. State it as a fact, in the user's native
                      language. Examples (do not copy verbatim):
                      "I've generated your portrait report. It's ready
                      whenever you are." / "你的画像报告已经生成好了，准备
                      好了就打开看看。" One additional sentence of warmth is
                      fine. Not a question, no "would you like to", no
                      archetype reveal, no summary.
• "question"        → "" (empty string).
• "nextQuestionKey" → "DONE".
• "cta"             → { "kind": "report-offer" }.

The bridge renders first; once it finishes streaming the UI inserts a card
below it with a single button ("Show me the portrait") that opens the
report. Do not solicit more answers, do not promise to continue, do not
emit "cta" on any later turn (there are none).

Always reply by calling the emitTurnAnalysis tool.
`.trim();

interface StreamTurnArgs {
  /** Access code identifying the session — passed through to onAnalysis. */
  code: string;
  /** Full UI message history from the client (system prompt is server-side only). */
  messages: UIMessage[];
  /** Current radar state for the AI's context (injected as the last user-side context block). */
  radarSnapshot: RadarSnapshot;
  /** Server-side hook fired when the AI emits the structured tool call. */
  onAnalysis: (analysis: TurnAnalysis) => Promise<void> | void;
  /** Optional extra system-side nudge for kickoff turns / phase transitions. */
  systemNudge?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish?: StreamTextOnFinishCallback<any>;
}

/**
 * Single entry point for one interview turn. Wraps `streamText` with:
 *   • v5 framework loaded as the system prompt (Anthropic ephemeral cache)
 *   • Anthropic provider, optionally proxied via `ANTHROPIC_BASE_URL`
 *   • forced tool call to `emitTurnAnalysis` (the canonical structured output)
 *   • UIMessage[] history bridged via `convertToModelMessages`
 *
 * Returns the streaming result — the route handler is responsible for piping
 * it back to the client via `result.toUIMessageStreamResponse()`.
 */
export async function streamTurn(args: StreamTurnArgs) {
  const [systemPrompt, modelId] = await Promise.all([
    loadSystemPrompt(),
    getActiveModel(),
  ]);

  const anthropic = createAnthropic({
    apiKey: process.env.API_KEY!,
    baseURL: "https://claudecn.top/v1",
  });

  const fullSystem = [
    systemPrompt,
    LANGUAGE_OVERRIDE,
    args.systemNudge,
  ]
    .filter(Boolean)
    .join("\n\n");

  const contextBlock = buildContextBlock(args.radarSnapshot);

  // System message goes into messages[] so we can attach Anthropic ephemeral
  // cache control to it (the `system: string` shorthand on streamText doesn't
  // support per-message providerOptions).
  const modelMessages: ModelMessage[] = [
    {
      role: "system",
      content: fullSystem,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    ...(await convertToModelMessages(args.messages)),
    { role: "user", content: contextBlock },
  ];

  return streamText({
    model: anthropic(modelId),
    messages: modelMessages,
    allowSystemInMessages: true,
    tools: {
      emitTurnAnalysis: tool({
        description:
          "Emit the structured analysis for this turn — the bilingual question wording, " +
          "user-facing analysis, archetype/journey/internal-structure deltas, terminology " +
          "additions, and the next question key. Required every turn.",
        inputSchema: TurnAnalysisSchema,
        execute: async (input) => {
          await args.onAnalysis(input);
          return { ok: true };
        },
      }),
    },
    toolChoice: { type: "tool", toolName: "emitTurnAnalysis" },
    onFinish: args.onFinish,
  });
}

/**
 * Synthesizes a small context block injected as the latest user-side message.
 * Tells the AI where the session currently stands so it can keep tone /
 * personalization consistent across turns.
 */
function buildContextBlock(radar: RadarSnapshot): string {
  const top = Object.entries(radar.archetypeScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, v]) => `${id}=${v.toFixed(2)}`)
    .join(", ");

  const internal = `why=${radar.internalStructure.why.toFixed(
    2,
  )}, how=${radar.internalStructure.how.toFixed(
    2,
  )}, want=${radar.internalStructure.want.toFixed(2)}`;

  return [
    "[SESSION_CONTEXT]",
    `top archetype scores: ${top || "(none yet)"}`,
    `journey position: ${radar.journeyPosition.toFixed(2)}`,
    `internal structure: ${internal}`,
    `primary archetype: ${radar.primaryId ?? "(undetermined)"}`,
    "Reply only by calling the emitTurnAnalysis tool.",
  ].join("\n");
}
