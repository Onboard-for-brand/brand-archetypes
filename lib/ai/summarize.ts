import "server-only";

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { eq, asc } from "drizzle-orm";

import { db } from "@/db/client";
import { messages, sessions } from "@/db/schema";
import { archetypesById } from "@/lib/archetypes";
import type { RadarSnapshot } from "@/lib/radar-session";
import { getActiveModel } from "@/lib/settings";
import type { TurnAnalysis } from "./tool-schema";

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

  const language = session.nativeLanguage ?? "Chinese";

  const prompt = [
    "You are summarizing a completed brand archetype interview into a single",
    "headline sentence — the brand's portrait in one breath.",
    "",
    `PRIMARY ARCHETYPE: ${primary ? `${primary.nameEn} (${primary.nameZh})` : "undetermined"}`,
    `ARCHETYPE SCORES: ${sortedScores || "(none)"}`,
    `INTERNAL STRUCTURE (0–4 each): why=${radar.internalStructure.why.toFixed(1)}, how=${radar.internalStructure.how.toFixed(1)}, want=${radar.internalStructure.want.toFixed(1)}`,
    `JOURNEY POSITION (0–1): ${radar.journeyPosition.toFixed(2)}`,
    "",
    "INTERVIEW TRANSCRIPT:",
    transcript,
    "",
    "---",
    "",
    `Write ONE sentence portrait of this brand in ${language}. Hard rules:`,
    "• ≤ 30 Chinese characters, OR ≤ 15 English words",
    "• Concrete to what the user actually said — never generic platitudes",
    "• Headline-like; reads as the brand's compressed identity",
    "• Drop the trailing period",
    "",
    "Output ONLY the sentence. No quotes, no preamble, no explanation.",
  ].join("\n");

  const anthropic = createAnthropic({
    apiKey: process.env.API_KEY!,
    baseURL: "https://claudecn.top/v1",
  });
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
    console.error("[summarize] failed", err);
    return null;
  }
}
