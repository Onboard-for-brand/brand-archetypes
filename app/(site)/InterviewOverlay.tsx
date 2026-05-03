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
import {
  RadarDeltasSchema,
  type RadarDeltas,
} from "@/lib/radar-session";

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

  const isStreaming = chat.status === "streaming" || chat.status === "submitted";

  // Auto-scroll chat to bottom on new tokens.
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages]);

  // AI speaks first: when overlay mounts on a fresh session, fire an empty
  // kickoff turn so the AI delivers the bilingual welcome + CQ1 unprompted.
  const kickedOffRef = useRef(false);
  useEffect(() => {
    if (kickedOffRef.current) return;
    if (chat.messages.length > 0) return;
    if (chat.status !== "ready") return;
    kickedOffRef.current = true;
    chat.sendMessage();
  }, [chat]);

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
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
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
          ref={chatScrollRef}
          className="interview-block interview-block--chat"
          data-lenis-prevent
          style={{
            background: "#ffffff",
            padding: "32px 32px 24px",
            overflow: "auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
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
            }}
          >
            <span>SESSION</span>
            <span>CODE / {code}</span>
          </header>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {chat.messages.length === 0 && isStreaming ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-framework)",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--brand-archetypes-gray-500)",
                }}
              >
                CONNECTING…
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
          scores={session.state.archetypeScores}
          primaryId={session.state.primaryId}
          size={720}
        />
      </section>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontFamily: "var(--font-framework)",
          fontSize: 9,
          letterSpacing: 2,
          color: "var(--brand-archetypes-gray-500)",
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
                fontSize: 14,
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
                paddingLeft: 14,
                borderLeft: "2px solid var(--brand-archetypes-red)",
                fontFamily: "var(--font-body-en)",
                fontSize: 18,
                lineHeight: 1.45,
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
