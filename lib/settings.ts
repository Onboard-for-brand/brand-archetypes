import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";

export const ACTIVE_MODEL_KEY = "active_model";
export const DEFAULT_ACTIVE_MODEL = "anthropic/claude-sonnet-4.6";

export async function getActiveModel(): Promise<string> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, ACTIVE_MODEL_KEY));
  return row?.value ?? DEFAULT_ACTIVE_MODEL;
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
