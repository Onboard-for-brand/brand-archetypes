import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { accessCodes } from "@/db/schema";
import { generateAccessCode } from "@/lib/access-code-gen";

export async function GET() {
  const rows = await db
    .select()
    .from(accessCodes)
    .orderBy(desc(accessCodes.createdAt));
  return NextResponse.json({ codes: rows });
}

const createSchema = z.object({
  note: z.string().max(500).optional().nullable(),
  recipientName: z.string().max(120).optional().nullable(),
  recipientEmail: z.string().email().max(200).optional().nullable().or(z.literal("")),
  expiresAt: z.string().datetime().optional().nullable().or(z.literal("")),
  modelOverride: z.string().max(120).optional().nullable().or(z.literal("")),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { note, recipientName, recipientEmail, expiresAt, modelOverride } =
    parsed.data;

  // Try up to 5 times to avoid collision (extremely unlikely with 12 chars from 31-letter alphabet)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode();
    try {
      const [row] = await db
        .insert(accessCodes)
        .values({
          code,
          note: note || null,
          recipientName: recipientName || null,
          recipientEmail: recipientEmail || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          modelOverride: modelOverride || null,
        })
        .returning();
      return NextResponse.json({ code: row });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("duplicate key")) continue;
      throw err;
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique code after 5 attempts" },
    { status: 500 },
  );
}
