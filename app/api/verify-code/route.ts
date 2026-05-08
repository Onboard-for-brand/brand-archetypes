import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { accessCodes } from "@/db/schema";

const codeFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const bodySchema = z.object({
  code: z.string().max(32),
});

type VerifyError = "length" | "unknown" | "revoked" | "completed";

function fail(error: VerifyError) {
  return NextResponse.json({ ok: false, error });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail("length");

  const code = parsed.data.code.trim().toUpperCase();
  if (!codeFormat.test(code)) return fail("length");

  const [row] = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code));

  if (!row) return fail("unknown");
  if (row.status === "revoked") return fail("revoked");

  // `completed` codes are allowed back into the chat overlay — the
  // InterviewOverlay sees the cta in resumed messages and auto-opens the
  // end-state dialog instead of letting them type.
  if (row.status === "issued") {
    await db
      .update(accessCodes)
      .set({ status: "active", activatedAt: sql`now()` })
      .where(eq(accessCodes.code, code));
  }

  return NextResponse.json({ ok: true, code });
}
