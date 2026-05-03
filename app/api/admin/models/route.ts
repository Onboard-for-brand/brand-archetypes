import { NextResponse } from "next/server";
import { fetchAnthropicModels } from "@/lib/openrouter";

export async function GET() {
  try {
    const models = await fetchAnthropicModels();
    return NextResponse.json({ models });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load models", detail: message },
      { status: 502 },
    );
  }
}
