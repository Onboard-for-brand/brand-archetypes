import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { accessCodes } from "@/db/schema";

const codeFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const patchSchema = z.object({
  status: z
    .enum(["issued", "active", "completed", "revoked"])
    .optional(),
  note: z.string().max(500).optional().nullable(),
  recipientName: z.string().max(120).optional().nullable(),
  recipientEmail: z
    .string()
    .email()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal("")),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  modelOverride: z.string().max(120).optional().nullable().or(z.literal("")),
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
  if (data.note !== undefined) update.note = data.note || null;
  if (data.recipientName !== undefined)
    update.recipientName = data.recipientName || null;
  if (data.recipientEmail !== undefined)
    update.recipientEmail = data.recipientEmail || null;
  if (data.expiresAt !== undefined)
    update.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.modelOverride !== undefined)
    update.modelOverride = data.modelOverride || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [row] = await db
    .update(accessCodes)
    .set(update)
    .where(eq(accessCodes.code, code))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
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
