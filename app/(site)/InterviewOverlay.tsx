"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import gsap from "gsap";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RadarChart } from "@/components/RadarChart";
import { useRadarSession } from "@/hooks/useRadarSession";
import { RadarDeltasSchema, type RadarDeltas } from "@/lib/radar-session";
import { archetypes, type ArchetypeId } from "@/lib/archetypes";
import type { TurnAnalysis } from "@/lib/ai/tool-schema";

interface ResumeMessage {
  id: string;
  seq: number;
  role: "user" | "assistant";
  text: string;
  analysis: TurnAnalysis | null;
  createdAt: string;
}

interface ResumePayload {
  code: string;
  exists: boolean;
  radarState: {
    archetypeScores: Record<ArchetypeId, number>;
    primaryId: ArchetypeId | null;
    journeyPosition: number;
    internalStructure: { why: number; how: number; want: number };
  };
  mode: string | null;
  nextQuestionKey: string;
  nativeLanguage: string | null;
  messages: ResumeMessage[];
}

/**
 * Reconstruct a UIMessage from a persisted DB row. Assistant rows that
 * carry the structured `analysis` get a `tool-emitTurnAnalysis` part so
 * `MessageBlock` finds the same `bridge` / `question` it would on a fresh
 * stream. User rows just get a text part.
 */
function resumeMessageToUI(m: ResumeMessage): UIMessage {
  if (m.role === "assistant" && m.analysis) {
    return {
      id: m.id,
      role: "assistant",
      parts: [
        {
          type: "tool-emitTurnAnalysis",
          toolCallId: m.id,
          state: "output-available",
          input: m.analysis,
          output: { ok: true },
        },
      ],
    } as UIMessage;
  }
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.text }],
  } as UIMessage;
}

/** Flip to `true` to expose the radar score-override panel in the top-right. */
const DEBUG_RADAR_ENABLED = false;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Props {
  code: string;
}

export function InterviewOverlay({ code }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const session = useRadarSession();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const [input, setInput] = useState("");

  // Resume hydration state — flips to `true` once the resume fetch resolves.
  const [resumed, setResumed] = useState(false);

  // Debug — top-right panel for overriding individual archetype scores live.
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugScores, setDebugScores] = useState<
    Partial<Record<ArchetypeId, number>>
  >({});

  const radarScores: Record<ArchetypeId, number> = {
    ...session.state.archetypeScores,
    ...debugScores,
  };

  // Stable transport — `prepareSendMessagesRequest` runs at send time and
  // reads the latest radar snapshot via the ref so the AI gets current state.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/interview/turn",
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: {
            id,
            code,
            messages,
            radarSnapshot: sessionRef.current.snapshot(),
            kickoff: messages.length === 0,
          },
        }),
      }),
    [code],
  );

  const chat = useChat({
    transport,
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName !== "emitTurnAnalysis") return;
      // The tool call carries the full TurnAnalysis but we only need the
      // radar-deltas subset. RadarDeltasSchema strips/validates exactly that slice.
      const parsed = RadarDeltasSchema.safeParse(toolCall.input);
      console.log("[overlay] tool received", {
        ok: parsed.success,
        deltas: parsed.success ? parsed.data : null,
        rawInput: toolCall.input,
      });
      if (parsed.success) {
        sessionRef.current.applyDeltas(parsed.data as RadarDeltas);
      }
    },
  });

  const isStreaming =
    chat.status === "streaming" || chat.status === "submitted";

  // Auto-scroll on AI replies — anchor the previous USER message's "YOU"
  // marker to the top of the chat viewport (with the 4px scroll-margin).
  // Effect: YOU + user content + AI marker + AI content all visible below.
  // On kickoff (no prior user message) fall back to the AI marker.
  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastAssistantId =
    lastMessage && lastMessage.role === "assistant" ? lastMessage.id : null;
  let prevUserIdScan: string | null = null;
  for (let i = chat.messages.length - 2; i >= 0; i--) {
    if (chat.messages[i].role === "user") {
      prevUserIdScan = chat.messages[i].id;
      break;
    }
  }
  const prevUserId = lastAssistantId ? prevUserIdScan : null;

  useEffect(() => {
    if (!lastAssistantId) return;
    const container = chatScrollRef.current;
    if (!container) return;
    const targetId = prevUserId ?? lastAssistantId;
    const marker = container.querySelector<HTMLElement>(
      `[data-msg-marker="${targetId}"]`,
    );
    if (marker) marker.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [lastAssistantId, prevUserId]);

  // Dynamic bottom padding so the scroll floor is exactly "last YOU at top":
  // padding = clientHeight - (lastUserHeight + gap + lastAIHeight). If that's
  // negative (content already exceeds viewport) padding goes to 0 and the
  // user can scroll freely past YOU to read everything.
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    // Find the most recent user message id (irrespective of trailing role).
    let lastUserId: string | null = null;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === "user") {
        lastUserId = chat.messages[i].id;
        break;
      }
    }
    const tailId = chat.messages[chat.messages.length - 1]?.id ?? null;

    function recompute() {
      if (!container) return;
      if (!lastUserId) {
        container.style.paddingBottom = "0px";
        return;
      }
      const gap = 20;
      const userBlock = container.querySelector<HTMLElement>(
        `[data-msg-block="${lastUserId}"]`,
      );
      const tailBlock =
        tailId && tailId !== lastUserId
          ? container.querySelector<HTMLElement>(`[data-msg-block="${tailId}"]`)
          : null;
      if (!userBlock) {
        container.style.paddingBottom = "0px";
        return;
      }
      const userHeight = userBlock.offsetHeight;
      const tailHeight = tailBlock ? tailBlock.offsetHeight + gap : 0;
      const padding = container.clientHeight - userHeight - gap - tailHeight;
      container.style.paddingBottom = `${Math.max(0, padding)}px`;
    }

    recompute();

    const observer = new ResizeObserver(() => recompute());
    observer.observe(container);
    if (lastUserId) {
      const u = container.querySelector<HTMLElement>(
        `[data-msg-block="${lastUserId}"]`,
      );
      if (u) observer.observe(u);
    }
    if (tailId && tailId !== lastUserId) {
      const t = container.querySelector<HTMLElement>(
        `[data-msg-block="${tailId}"]`,
      );
      if (t) observer.observe(t);
    }
    return () => observer.disconnect();
  }, [chat.messages.length, lastAssistantId]);

  // Resume on mount: pull the persisted session + message log, hydrate the
  // radar polygon, and reconstruct UIMessages from the DB rows so they show
  // up identically to freshly-streamed turns.
  const setMessages = chat.setMessages;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/interview/session?code=${encodeURIComponent(code)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`session fetch ${res.status}`);
        const data = (await res.json()) as ResumePayload;
        if (cancelled) return;

        if (data.exists) {
          sessionRef.current.hydrate({
            archetypeScores: data.radarState.archetypeScores,
            primaryId: data.radarState.primaryId,
            journeyPosition: data.radarState.journeyPosition,
            internalStructure: data.radarState.internalStructure,
          });

          if (data.messages.length > 0) {
            setMessages(data.messages.map(resumeMessageToUI));
          }
        }
      } catch (err) {
        console.warn("[overlay] resume failed", err);
      } finally {
        if (!cancelled) setResumed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, setMessages]);

  // AI speaks first: only fire after resume is settled and there are no
  // existing messages.
  const kickedOffRef = useRef(false);
  useEffect(() => {
    if (!resumed) return;
    if (kickedOffRef.current) return;
    if (chat.messages.length > 0) return;
    if (chat.status !== "ready") return;
    kickedOffRef.current = true;
    chat.sendMessage();
  }, [chat, resumed]);

  // Entry slide-in animation.
  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".interview-block", { willChange: "transform" });
      gsap.set(".interview-block--radar", { xPercent: 105 });
      gsap.set(".interview-block--chat", { yPercent: -105 });
      gsap.set(".interview-block--input", { yPercent: 105 });
      // Reveal the container with a transparent backdrop — the dark fill
      // fades in over the slide-in so the screen never hard-cuts to black.
      gsap.set(containerRef.current, {
        autoAlpha: 1,
        backgroundColor: "rgba(10, 10, 10, 0)",
      });

      const tl = gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.out" },
      });
      tl.to(
        containerRef.current,
        {
          backgroundColor: "rgba(10, 10, 10, 1)",
          duration: 1.0,
          ease: "power2.out",
        },
        0,
      )
        .to(".interview-block--radar", { xPercent: 0 }, 0)
        .to(".interview-block--chat", { yPercent: 0 }, 0.28)
        .to(".interview-block--input", { yPercent: 0 }, 0.56)
        .add(() => {
          gsap.set(".interview-block", { clearProps: "willChange,transform" });
        });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  function submit() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    chat.sendMessage({ text });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        padding: 6,
        display: "grid",
        gridTemplateColumns: "minmax(0, 38fr) minmax(0, 62fr)",
        gap: 6,
        overflow: "hidden",
        visibility: "hidden",
        zIndex: 30,
      }}
    >
      {/* Left column — chat history (top) + input (bottom) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) auto",
          gap: 6,
          minHeight: 0,
        }}
      >
        <section
          className="interview-block interview-block--chat"
          style={{
            background: "#ffffff",
            minHeight: 0,
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr)",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontFamily: "var(--font-framework)",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--brand-archetypes-gray-500)",
              padding: "20px 32px 16px",
              borderBottom: "1px solid var(--brand-archetypes-gray-200)",
            }}
          >
            <span>SESSION</span>
            <span>CODE / {code}</span>
          </header>

          <div
            ref={chatScrollRef}
            data-lenis-prevent
            style={{
              overflow: "auto",
              minHeight: 0,
              padding: "20px 32px 0",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {chat.messages.length === 0 && (!resumed || isStreaming) ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-framework)",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--brand-archetypes-gray-500)",
                }}
              >
                {!resumed ? "LOADING SESSION…" : "CONNECTING…"}
              </p>
            ) : (
              chat.messages.map((m) => <MessageBlock key={m.id} message={m} />)
            )}
            {chat.error ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-framework)",
                  fontSize: 11,
                  letterSpacing: 1,
                  color: "var(--brand-archetypes-red)",
                }}
              >
                ERROR · {chat.error.message}
              </p>
            ) : null}
          </div>
        </section>

        <section
          className="interview-block interview-block--input"
          style={{
            background: "#ffffff",
            padding: "20px 24px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 200,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-framework)",
              fontSize: 10,
              letterSpacing: 2,
              color: "var(--brand-archetypes-gray-500)",
            }}
          >
            YOUR RESPONSE
          </div>
          <textarea
            name="interview-response"
            placeholder="Type here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-body-en)",
              fontSize: 15,
              lineHeight: 1.6,
              minHeight: 110,
              background: "transparent",
              color: "var(--brand-archetypes-black)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-framework)",
              fontSize: 10,
              letterSpacing: 1.5,
              color: "var(--brand-archetypes-gray-500)",
            }}
          >
            <span>{isStreaming ? "STREAMING…" : `${input.length} CHARS`}</span>
            <span>⌘ ENTER · SUBMIT</span>
          </div>
        </section>
      </div>

      {/* Right column — radar */}
      <section
        className="interview-block interview-block--radar"
        style={{
          background: "#ffffff",
          padding: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <RadarChart
          scores={radarScores}
          primaryId={session.state.primaryId}
          size={720}
        />
      </section>

      {DEBUG_RADAR_ENABLED ? (
        <RadarDebugPanel
          open={debugOpen}
          onToggle={() => setDebugOpen((v) => !v)}
          sessionScores={session.state.archetypeScores}
          debugScores={debugScores}
          onChange={setDebugScores}
        />
      ) : null}
    </div>
  );
}

function RadarDebugPanel({
  open,
  onToggle,
  sessionScores,
  debugScores,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  sessionScores: Record<ArchetypeId, number>;
  debugScores: Partial<Record<ArchetypeId, number>>;
  onChange: (next: Partial<Record<ArchetypeId, number>>) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 40,
        fontFamily: "var(--font-framework)",
        fontSize: 10,
        letterSpacing: 1.5,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: open ? 28 : 56,
          height: 28,
          background: open
            ? "var(--brand-archetypes-red)"
            : "var(--brand-archetypes-black)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-framework)",
          fontSize: 11,
          letterSpacing: 1.5,
        }}
      >
        {open ? "×" : "DBG"}
      </button>
      {open ? (
        <div
          style={{
            marginTop: 6,
            background: "var(--brand-archetypes-black)",
            color: "var(--brand-archetypes-white)",
            padding: 14,
            width: 280,
            maxHeight: "calc(100dvh - 64px)",
            overflow: "auto",
            border: "1px solid var(--brand-archetypes-white)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ opacity: 0.6 }}>RADAR · SCORES</span>
            <button
              type="button"
              onClick={() => onChange({})}
              style={{
                background: "transparent",
                color: "var(--brand-archetypes-white)",
                border: "1px solid rgba(255,255,255,0.4)",
                padding: "2px 8px",
                fontFamily: "var(--font-framework)",
                fontSize: 9,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              RESET
            </button>
          </div>

          {archetypes.map((a) => {
            const live = sessionScores[a.id] ?? 0;
            const override = debugScores[a.id];
            const value = override ?? live;
            const isOverridden = override !== undefined;
            return (
              <div
                key={a.id}
                style={{ display: "flex", flexDirection: "column", gap: 3 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    opacity: isOverridden ? 1 : 0.7,
                    color: isOverridden
                      ? "var(--brand-archetypes-red)"
                      : "var(--brand-archetypes-white)",
                  }}
                >
                  <span>{a.nameEn.toUpperCase()}</span>
                  <span>{value.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={value}
                  onChange={(e) =>
                    onChange({
                      ...debugScores,
                      [a.id]: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: "100%", accentColor: "#e53935" }}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface AnalysisPayload {
  bridge?: string;
  question?: string;
}

function MessageBlock({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  // Forced tool call: assistant turns land as tool-input parts. The user-
  // visible content lives in `input.bridge` (narrative) and `input.question`
  // (the question itself). `reasoning` is intentionally ignored — internal.
  let bridge = "";
  let question = "";
  if (!isUser) {
    for (const part of message.parts) {
      if (part.type === "tool-emitTurnAnalysis") {
        const p = part as { type: string; input?: unknown };
        if (p.input && typeof p.input === "object") {
          const a = p.input as AnalysisPayload;
          if (typeof a.bridge === "string") bridge = a.bridge;
          if (typeof a.question === "string") question = a.question;
        }
      }
    }
  }

  if (isUser && !text) return null;
  if (!isUser && !bridge && !question) return null;

  return (
    <div
      data-msg-block={message.id}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        data-msg-marker={message.id}
        style={{
          fontFamily: "var(--font-framework)",
          fontSize: 9,
          letterSpacing: 2,
          color: "var(--brand-archetypes-gray-500)",
          scrollMarginTop: 4,
        }}
      >
        {isUser ? "YOU" : "AI"}
      </div>

      {isUser ? (
        <div
          style={{
            fontFamily: "var(--font-body-en)",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--brand-archetypes-black)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
      ) : (
        <>
          {bridge ? (
            <div
              style={{
                fontFamily: "var(--font-body-en)",
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--brand-archetypes-gray-500)",
                whiteSpace: "pre-wrap",
              }}
            >
              {bridge}
            </div>
          ) : null}
          {question ? (
            <div
              style={{
                paddingLeft: 12,
                borderLeft: "2px solid var(--brand-archetypes-red)",
                fontFamily: "var(--font-body-en)",
                fontSize: 14,
                lineHeight: 1.55,
                fontWeight: 600,
                color: "var(--brand-archetypes-black)",
                whiteSpace: "pre-wrap",
              }}
            >
              {question}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
