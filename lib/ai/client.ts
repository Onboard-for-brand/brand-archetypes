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
