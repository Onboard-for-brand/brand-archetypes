import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveModel, setActiveModel } from "@/lib/settings";

export async function GET() {
  const activeModel = await getActiveModel();
  return NextResponse.json({ activeModel });
}

const patchSchema = z.object({
  activeModel: z
    .string()
    .min(1)
    .max(120)
    .regex(/^anthropic\//, "Only anthropic/* models are allowed"),
});

export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await setActiveModel(parsed.data.activeModel);
  return NextResponse.json({ activeModel: parsed.data.activeModel });
}
