import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";

export const ACTIVE_MODEL_KEY = "active_model";
export const DEFAULT_ACTIVE_MODEL = "claude-sonnet-4-6";

export async function getActiveModel(): Promise<string> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, ACTIVE_MODEL_KEY));
  return normalizeModelId(row?.value ?? DEFAULT_ACTIVE_MODEL);
}

/**
 * Defensive normalizer — strips legacy OpenRouter `anthropic/` prefix and
 * converts `4.6` → `4-6` so any old value persisted before the provider swap
 * still resolves to a valid Anthropic-direct model id.
 */
function normalizeModelId(id: string): string {
  const stripped = id.replace(/^anthropic\//, "");
  return stripped.replace(/(\d)\.(\d)/g, "$1-$2");
}

export async function setActiveModel(value: string) {
  await db
    .insert(appSettings)
    .values({ key: ACTIVE_MODEL_KEY, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: sql`now()` },
    });
}
