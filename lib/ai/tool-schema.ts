import { z } from "zod";
import { RadarDeltasSchema } from "@/lib/radar-session";

/**
 * The single tool the AI must call every turn.
 *
 *   • `bridge`    — conversational narrative shown to the user. Welcome
 *                   paragraphs (CQ1 only) + brief acknowledgment of the
 *                   user's last answer + light segue. In the user's native
 *                   language ONLY after CQ1.
 *   • `question`  — the next question itself, presented as its own visually
 *                   prominent block in the UI. ALWAYS populated.
 *   • `reasoning` — internal analytical notes (Mode signals, archetype
 *                   reads). NEVER rendered to the user; persisted for admin.
 *   • radar delta fields come from `RadarDeltasSchema`.
 */
export const TurnAnalysisSchema = RadarDeltasSchema.extend({
  bridge: z
    .string()
    .describe(
      "Conversational narrative the user reads. Welcome message on CQ1 only; " +
        "thereafter, a brief 1–2 sentence acknowledgment of their last " +
        "answer + light segue. In the user's native language only after " +
        "CQ1 (CQ1 itself may be bilingual). Empty string is allowed when " +
        "no bridge feels natural.",
    ),
  question: z
    .string()
    .describe(
      "The actual question for this turn, presented on its own. Do NOT " +
        "duplicate `bridge` content here. In the user's native language " +
        "only after CQ1 (CQ1 itself may be bilingual).",
    ),
  reasoning: z
    .string()
    .describe(
      "Internal analytical notes — Mode signals, archetype hypotheses, " +
        "what to probe next. NEVER shown to the user. Used for logs.",
    ),
  nextQuestionKey: z.string(),
  /** Set on CQ1; subsequent turns may echo it for clarity. */
  nativeLanguage: z.string().optional(),
  terminologyAdditions: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .optional(),
  modeUpdate: z.enum(["A", "B", "C"]).optional(),
});

export type TurnAnalysis = z.infer<typeof TurnAnalysisSchema>;
