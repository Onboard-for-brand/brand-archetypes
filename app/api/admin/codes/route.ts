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

  const note = parsed.data.note?.trim() || null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode();
    try {
      const [row] = await db
        .insert(accessCodes)
        .values({ code, note })
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
