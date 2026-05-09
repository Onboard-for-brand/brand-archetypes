import "server-only";

import { db } from "@/db/client";
import { logs } from "@/db/schema";

export type LogType = "info" | "warn" | "error";

interface LogInput {
  type: LogType;
  /** Short identifier of the call site (e.g. "summarize.report",
   *  "turn.stream", "admin.codes.patch"). Use dotted lowercase. */
  source: string;
  /** Access code this event belongs to. Pass null for system events. */
  code?: string | null;
  /** Human-readable one-liner. */
  message: string;
  /** Arbitrary structured payload — most commonly an error object. */
  data?: Record<string, unknown>;
}

/**
 * Append a row to the `logs` table. Best-effort: failures are swallowed
 * to console so a broken logging path never breaks the request itself.
 */
export async function writeLog(input: LogInput): Promise<void> {
  const payload = {
    type: input.type,
    source: input.source,
    code: input.code ?? null,
    message: input.message,
    data: input.data ?? null,
  };
  // Mirror to the dev console for live tailing — DB write below is
  // authoritative but the console line shows up immediately in logs.
  const tag = `[${input.type.toUpperCase()}] ${input.source}${input.code ? ` (${input.code})` : ""}`;
  if (input.type === "error") {
    console.error(tag, input.message, input.data ?? "");
  } else if (input.type === "warn") {
    console.warn(tag, input.message, input.data ?? "");
  } else {
    console.log(tag, input.message, input.data ?? "");
  }

  try {
    await db.insert(logs).values(payload);
  } catch (err) {
    console.error("[logs] insert failed", err);
  }
}

/**
 * Serialize an unknown thrown value into a JSON-friendly shape suitable
 * for `data` on an error log. Plain Errors lose their fields under
 * JSON.stringify; we extract them explicitly.
 */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause:
        err.cause !== undefined ? serializeError(err.cause) : undefined,
    };
  }
  if (typeof err === "object" && err !== null) {
    return { value: err as Record<string, unknown> };
  }
  return { value: String(err) };
}
