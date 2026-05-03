import { NextResponse } from "next/server";
import { z } from "zod";
import { loadMessages, loadSessionState } from "@/lib/ai/persistence";
import { emptyRadarState, type RadarSnapshot } from "@/lib/radar-session";
import type { TurnAnalysis } from "@/lib/ai/tool-schema";

export const runtime = "nodejs";

const querySchema = z.object({
  code: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/u, "bad code format"),
});

/**
 * Resume payload returned to the client. Each historical turn is converted
 * into the minimum the UI needs to re-render: role + text content +
 * (assistant only) the analysis JSON so the chat block can recover bridge /
 * question rendering identically to a freshly-streamed turn.
 */
export interface SessionResume {
  code: string;
  exists: boolean;
  radarState: RadarSnapshot;
  mode: string | null;
  nextQuestionKey: string;
  nativeLanguage: string | null;
  messages: ResumeMessage[];
}

export interface ResumeMessage {
  id: string;
  seq: number;
  role: "user" | "assistant";
  text: string;
  analysis: TurnAnalysis | null;
  createdAt: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ code: url.searchParams.get("code") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { code } = parsed.data;

  const [session, msgs] = await Promise.all([
    loadSessionState(code),
    loadMessages(code),
  ]);

  const payload: SessionResume = session
    ? {
        code,
        exists: true,
        radarState: session.radarState,
        mode: session.mode,
        nextQuestionKey: session.nextQuestionKey,
        nativeLanguage: session.nativeLanguage,
        messages: msgs.map((m) => ({
          id: m.id,
          seq: m.seq,
          role: m.role as "user" | "assistant",
          text: m.contentText ?? "",
          analysis: (m.analysis as TurnAnalysis | null) ?? null,
          createdAt: m.createdAt.toISOString(),
        })),
      }
    : {
        code,
        exists: false,
        radarState: emptyRadarState(),
        mode: null,
        nextQuestionKey: "CQ1",
        nativeLanguage: null,
        messages: [],
      };

  return NextResponse.json(payload);
}
