export const DEV_ACCESS_CODES = new Set([
  "DEMO-2026-TEST",
  "AL3X-PROC-STA1",
  "OPEN-DOOR-FREE",
]);

export type AccessCodeError = "" | "length" | "unknown";

export function formatAccessCode(value: string) {
  const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);

  return raw.match(/.{1,4}/g)?.join("-") ?? "";
}

export function validateAccessCode(value: string):
  | { ok: true; code: string }
  | { ok: false; error: Exclude<AccessCodeError, ""> } {
  const formatted = formatAccessCode(value);

  if (formatted.replace(/-/g, "").length !== 12) {
    return { ok: false, error: "length" };
  }

  if (!DEV_ACCESS_CODES.has(formatted)) {
    return { ok: false, error: "unknown" };
  }

  return { ok: true, code: formatted };
}
