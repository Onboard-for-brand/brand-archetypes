import { NextResponse } from "next/server";
import { fetchClaudeModels } from "@/lib/ai-models";

export const runtime = "nodejs";

export async function GET() {
  const models = await fetchClaudeModels();
  return NextResponse.json({ models });
}
