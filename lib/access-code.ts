export type AccessCodeError =
  | ""
  | "length"
  | "unknown"
  | "revoked"
  | "completed"
  | "network";

export function formatAccessCode(value: string) {
  const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  return raw.match(/.{1,4}/g)?.join("-") ?? "";
}

export function isCompleteCode(formatted: string) {
  return formatted.replace(/-/g, "").length === 12;
}

export async function verifyAccessCode(value: string): Promise<
  | { ok: true; code: string }
  | { ok: false; error: Exclude<AccessCodeError, ""> }
> {
  const formatted = formatAccessCode(value);
  if (!isCompleteCode(formatted)) {
    return { ok: false, error: "length" };
  }

  try {
    const res = await fetch("/api/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: formatted }),
    });

    const data = (await res.json().catch(() => null)) as
      | { ok: true; code: string }
      | { ok: false; error: Exclude<AccessCodeError, "" | "network"> }
      | null;

    if (!data) return { ok: false, error: "network" };
    if (data.ok) return { ok: true, code: data.code };
    return { ok: false, error: data.error };
  } catch {
    return { ok: false, error: "network" };
  }
}
