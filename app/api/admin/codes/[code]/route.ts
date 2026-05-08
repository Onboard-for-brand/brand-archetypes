import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { accessCodes } from "@/db/schema";
import { markCodeCompleted } from "@/lib/ai/persistence";

export const runtime = "nodejs";
// markCodeCompleted runs three parallel AI generations (summary + report +
// context). Each can take ~10-20s on Opus; bumping the limit prevents the
// admin PATCH from being killed mid-generation.
export const maxDuration = 90;

const codeFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const patchSchema = z.object({
  status: z.enum(["issued", "active", "completed", "revoked"]).optional(),
  note: z.string().max(500).optional().nullable(),
});

interface Params {
  params: Promise<{ code: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const { code } = await params;
  if (!codeFormat.test(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};
  if (data.status !== undefined) update.status = data.status;
  if (data.note !== undefined) update.note = data.note?.trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Detect transition into "completed" — only fire the brand-summary AI
  // call when the status actually crosses into completed (not on every
  // idempotent update).
  const [previous] = await db
    .select({ status: accessCodes.status })
    .from(accessCodes)
    .where(eq(accessCodes.code, code));
  if (!previous) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
  const transitioningToCompleted =
    data.status === "completed" && previous.status !== "completed";

  const [row] = await db
    .update(accessCodes)
    .set(update)
    .where(eq(accessCodes.code, code))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  if (transitioningToCompleted) {
    // Runs the brand-summary generation if it isn't already populated.
    // This adds ~1–3s of latency to the PATCH but keeps the admin path
    // and the AI cta path in sync on the same trigger.
    await markCodeCompleted(code);
  }

  return NextResponse.json({ code: row });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { code } = await params;
  if (!codeFormat.test(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }
  const [row] = await db
    .delete(accessCodes)
    .where(eq(accessCodes.code, code))
    .returning();
  if (!row) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
