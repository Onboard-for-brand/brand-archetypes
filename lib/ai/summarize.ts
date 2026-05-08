import "server-only";

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { eq, asc } from "drizzle-orm";

import { db } from "@/db/client";
import { messages, sessions } from "@/db/schema";
import { archetypesById } from "@/lib/archetypes";
import { questionByKey } from "@/lib/questions";
import type { RadarSnapshot } from "@/lib/radar-session";
import { getActiveModel } from "@/lib/settings";
import type { TurnAnalysis } from "./tool-schema";

/**
 * Shared loader: pulls session + messages once, builds the contextual
 * blocks both the summary and the long-form generators reuse.
 */
async function loadCompletionContext(code: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.code, code));
  if (!session) return null;

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.code, code))
    .orderBy(asc(messages.seq));
  if (msgs.length === 0) return null;

  const radar = session.radarState as RadarSnapshot;
  const primary = radar.primaryId ? archetypesById[radar.primaryId] : null;

  const transcript = msgs
    .map((m) => {
      if (m.role === "user") return `USER: ${m.contentText ?? ""}`;
      const a = m.analysis as TurnAnalysis | null;
      const bridge = a?.bridge?.trim() ?? "";
      const question = a?.question?.trim() ?? "";
      if (bridge || question) {
        return [
          "AI:",
          bridge,
          question ? `[QUESTION] ${question}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
      return `AI: ${m.contentText ?? ""}`;
    })
    .join("\n\n");

  const sortedScores = Object.entries(radar.archetypeScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => `${id}=${v.toFixed(2)}`)
    .join(", ");

  // Section-by-section Q&A — pair user answers with the question they were
  // answering (the prior assistant turn's nextQuestionKey).
  const qaPairs: Array<{ key: string; en: string; zh: string; answer: string }> = [];
  let pendingKey: string | null = null;
  let pendingEn = "";
  let pendingZh = "";
  for (const m of msgs) {
    if (m.role === "assistant") {
      const a = m.analysis as TurnAnalysis | null;
      const key = a?.nextQuestionKey ?? null;
      if (key && key !== "DONE") {
        pendingKey = key;
        const q = questionByKey(key);
        pendingEn = q?.promptEn ?? "";
        pendingZh = q?.promptZh ?? "";
      }
    } else if (m.role === "user" && pendingKey) {
      qaPairs.push({
        key: pendingKey,
        en: pendingEn,
        zh: pendingZh,
        answer: m.contentText ?? "",
      });
      pendingKey = null;
    }
  }

  return {
    session,
    radar,
    primary,
    transcript,
    sortedScores,
    qaPairs,
    language: session.nativeLanguage ?? "Chinese",
  };
}

function makeAnthropic() {
  return createAnthropic({
    apiKey: process.env.API_KEY!,
    baseURL: "https://claudecn.top/v1",
  });
}

/**
 * Generate a single-sentence brand portrait for a finished interview.
 *
 * Reads the full message history + radar snapshot from the DB, runs a
 * focused one-shot Claude call, and returns the trimmed sentence. Returns
 * null if the session has no transcript yet, or if the AI call fails — the
 * caller can decide whether to retry / fall back / leave the column empty.
 *
 * This is a SEPARATE call from the per-turn streamTurn — it fires once when
 * the code transitions to `completed`, regardless of whether the trigger was
 * the AI emitting cta or an admin manually flipping status.
 */
export async function generateBrandSummary(
  code: string,
): Promise<string | null> {
  const ctx = await loadCompletionContext(code);
  if (!ctx) return null;

  const prompt = [
    "You are summarizing a completed brand archetype interview into a single",
    "headline sentence — the brand's portrait in one breath.",
    "",
    `PRIMARY ARCHETYPE: ${ctx.primary ? `${ctx.primary.nameEn} (${ctx.primary.nameZh})` : "undetermined"}`,
    `ARCHETYPE SCORES: ${ctx.sortedScores || "(none)"}`,
    `INTERNAL STRUCTURE (0–4 each): why=${ctx.radar.internalStructure.why.toFixed(1)}, how=${ctx.radar.internalStructure.how.toFixed(1)}, want=${ctx.radar.internalStructure.want.toFixed(1)}`,
    `JOURNEY POSITION (0–1): ${ctx.radar.journeyPosition.toFixed(2)}`,
    "",
    "INTERVIEW TRANSCRIPT:",
    ctx.transcript,
    "",
    "---",
    "",
    `Write ONE sentence portrait of this brand in ${ctx.language}. Hard rules:`,
    "• ≤ 30 Chinese characters, OR ≤ 15 English words",
    "• Concrete to what the user actually said — never generic platitudes",
    "• Headline-like; reads as the brand's compressed identity",
    "• Drop the trailing period",
    "",
    "Output ONLY the sentence. No quotes, no preamble, no explanation.",
  ].join("\n");

  const anthropic = makeAnthropic();
  const modelId = await getActiveModel();

  try {
    const result = await generateText({
      model: anthropic(modelId),
      prompt,
    });
    const cleaned = result.text
      .trim()
      .replace(/^["「『”“]+/, "")
      .replace(/["」』”“]+$/, "")
      .trim();
    return cleaned || null;
  } catch (err) {
    console.error("[summarize] generateBrandSummary failed", err);
    return null;
  }
}

/**
 * Doc 02 — full narrative brand report. Multi-section markdown that reads
 * as a portrait of the brand: composition, journey, voice, what to watch.
 *
 * Output is meant for the user to re-read at decision points; phrasing
 * stays in the user's native language and grounds itself in their actual
 * words from the transcript.
 */
export async function generateBrandReport(
  code: string,
): Promise<string | null> {
  const ctx = await loadCompletionContext(code);
  if (!ctx) return null;

  const prompt = [
    "You are writing a finished brand portrait report — Document 2 of the",
    "Onboarding for Brand framework. The reader is the brand owner. They",
    "should feel \"I see myself\" — not \"I have been analyzed\".",
    "",
    `PRIMARY ARCHETYPE: ${ctx.primary ? `${ctx.primary.nameEn} (${ctx.primary.nameZh})` : "undetermined"}`,
    `ARCHETYPE SCORES: ${ctx.sortedScores || "(none)"}`,
    `INTERNAL STRUCTURE (0–4 each): why=${ctx.radar.internalStructure.why.toFixed(1)}, how=${ctx.radar.internalStructure.how.toFixed(1)}, want=${ctx.radar.internalStructure.want.toFixed(1)}`,
    `JOURNEY POSITION (0–1): ${ctx.radar.journeyPosition.toFixed(2)}`,
    "",
    "INTERVIEW TRANSCRIPT:",
    ctx.transcript,
    "",
    "---",
    "",
    `Write a complete brand report in ${ctx.language} as VALID MARKDOWN.`,
    "Structure:",
    "",
    "# Brand Report",
    "",
    "## Your portrait",
    "(2-3 paragraphs — narrative synthesis of who they are. Use their own",
    " examples and phrases. Name the primary archetype here in context, not",
    " as a label. End with the secondary archetypes and how they balance the",
    " primary.)",
    "",
    "## Where you stand",
    "(1-2 paragraphs — describe the journey stage as a moment, not a category.",
    " What's available now, what's premature, what the next move looks like.)",
    "",
    "## How you speak",
    "(1-2 paragraphs — voice, signature phrases the user actually used,",
    " openings/closings, what they refuse, what they're allergic to.)",
    "",
    "## What to watch",
    "(1 paragraph — the shadow / trap / fear of the primary archetype mapped",
    " to specific patterns visible in the transcript.)",
    "",
    "## What matters most",
    "(3 numbered bullets — the single most important belief; the one pattern",
    " that makes their brand theirs; the #1 thing they never do.)",
    "",
    "Tone rules:",
    "• Address the reader as \"you\" / \"你\".",
    "• Quote their actual words inline when you can.",
    "• Concrete > abstract. Never generic archetype talk.",
    "• Don't list scores. Don't include the framework jargon.",
    "• Drop the trailing whitespace.",
    "",
    "Output ONLY the markdown, starting with `# Brand Report`. No preamble.",
  ].join("\n");

  const anthropic = makeAnthropic();
  const modelId = await getActiveModel();

  try {
    const result = await generateText({
      model: anthropic(modelId),
      prompt,
    });
    const text = result.text.trim();
    return text || null;
  } catch (err) {
    console.error("[summarize] generateBrandReport failed", err);
    return null;
  }
}

/**
 * Doc 03 — AI-ready brand context. Structured markdown a future LLM can
 * ingest and inhabit. Includes identity, behavioral guidelines (Always /
 * Never / Signature Moves), key user quotes, and explicit instructions for
 * how the AI should use the document.
 */
export async function generateAiContext(
  code: string,
): Promise<string | null> {
  const ctx = await loadCompletionContext(code);
  if (!ctx) return null;

  const allScores = Object.entries(ctx.radar.archetypeScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => `  ${id}: ${v.toFixed(3)}`)
    .join("\n");

  const qaBlock = ctx.qaPairs
    .map(
      (p) =>
        `### ${p.key}\nQ (EN): ${p.en}\nQ (ZH): ${p.zh}\nA: ${p.answer || "_(empty)_"}`,
    )
    .join("\n\n");

  const prompt = [
    "You are producing Document 3 of the Onboarding for Brand framework —",
    "an AI-Ready Brand Context Profile. The reader is a future LLM (Claude,",
    "GPT, etc.) that needs to inhabit this brand's voice and judgment when",
    "generating content.",
    "",
    `PRIMARY ARCHETYPE: ${ctx.primary ? `${ctx.primary.nameEn} (${ctx.primary.nameZh})` : "undetermined"}`,
    `ARCHETYPE SCORES: ${ctx.sortedScores || "(none)"}`,
    `INTERNAL STRUCTURE (0–4 each): why=${ctx.radar.internalStructure.why.toFixed(1)}, how=${ctx.radar.internalStructure.how.toFixed(1)}, want=${ctx.radar.internalStructure.want.toFixed(1)}`,
    `JOURNEY POSITION (0–1): ${ctx.radar.journeyPosition.toFixed(2)}`,
    "",
    "FULL Q&A (for your reference — you'll embed all of it verbatim):",
    qaBlock,
    "",
    "---",
    "",
    `Output a complete markdown document in ${ctx.language} (English headings`,
    "are fine — but narrative content matches the user's language). Structure:",
    "",
    "# Brand Context Profile",
    "",
    "## Core Identity",
    "(2-3 sentences capturing the essence — written so an AI immediately knows",
    " who it's speaking as.)",
    "",
    "## Archetype Profile",
    "- Primary: <name> + 1-line evidence from transcript",
    "- Secondary: <names> + how they balance",
    "- Shadow to watch: <archetype's typical trap mapped to their actual risk>",
    "",
    "## Voice",
    "(2-3 sentences on how the brand speaks — pulled from their actual",
    " phrasing, including specific words they prefer or refuse.)",
    "",
    "## Behavioral Guidelines",
    "**Always** (do these):",
    "- 3-5 specific behaviors derived from the interview",
    "**Never** (avoid):",
    "- 3-5 specific anti-patterns derived from the interview",
    "**Signature Moves**:",
    "- 3-5 most recognizable expressions, structures, or moves",
    "",
    "## Key Quotes",
    "(4-6 verbatim quotes from the user that capture tone and stance.)",
    "",
    "## All Archetype Scores",
    "```yaml",
    allScores,
    "```",
    "",
    "## Section-by-Section Q&A",
    "(Embed the FULL Q&A list provided above, verbatim. No summarization.)",
    "",
    "## Instructions for AI",
    "When working within this brand's context:",
    "1. Use their specific examples — similar structures and references.",
    "2. Words they refuse — never use them.",
    "3. Their beliefs — let them inform the angle.",
    "4. Spirit over letter — internalize the sensibility, do not template-match.",
    "5. The litmus test: \"Would this brand actually say or do this?\"",
    "",
    "Output ONLY the markdown, starting with `# Brand Context Profile`.",
    "No preamble.",
  ].join("\n");

  const anthropic = makeAnthropic();
  const modelId = await getActiveModel();

  try {
    const result = await generateText({
      model: anthropic(modelId),
      prompt,
    });
    const text = result.text.trim();
    return text || null;
  } catch (err) {
    console.error("[summarize] generateAiContext failed", err);
    return null;
  }
}
