"use client";

/**
 * End-state dialog shown over the chat overlay when a code is complete.
 * Lets the user grab three markdown documents and copy a shareable URL.
 *
 *   • Doc 01 raw transcript — assembled client-side from message history
 *     (no AI call needed; the data is already on hand)
 *   • Doc 02 brand report   — pre-rendered server-side via `generateBrandReport`,
 *     cached in `sessions.report_md`
 *   • Doc 03 AI context     — pre-rendered via `generateAiContext`,
 *     cached in `sessions.context_md`
 *
 * Dialog only opens once all three artifacts have landed; while server is
 * still generating, the chat shows the report-offer card in its
 * "generating" state.
 */

import { useState, type SVGProps } from "react";
import { motion } from "motion/react";
import { questionByKey } from "@/lib/questions";
import type { TurnAnalysis } from "@/lib/ai/tool-schema";

interface DialogTurn {
  role: "user" | "assistant";
  text: string;
  analysis: TurnAnalysis | null;
}

interface Props {
  open: boolean;
  code: string;
  brandSummary: string | null;
  /** AI-generated brand report markdown — null while generating / on failure. */
  reportMd: string | null;
  /** AI-generated context profile markdown — null while generating / on failure. */
  contextMd: string | null;
  turns: DialogTurn[];
}

const ARCHIVE_HOST = "onboardingforbrand.com";

export function EndStateDialog({
  open,
  code,
  brandSummary,
  reportMd,
  contextMd,
  turns,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shareHover, setShareHover] = useState(false);

  if (!open) return null;

  const rawMd = buildRawDataMarkdown({ code, turns });

  const shareUrl = `${ARCHIVE_HOST}/${code}`;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 10, 10, 0.6)",
          backdropFilter: "blur(2px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          background: "var(--brand-archetypes-white)",
          padding: "var(--space-6)",
        }}
      >
        <div style={eyebrowStyle}>
          INTERVIEW COMPLETE
          <span style={eyebrowSepStyle}>{"///"}</span>
          BRAND ARCHETYPES
        </div>
        <h2 id="end-dialog-title" style={titleStyle}>
          Your portrait is ready.
        </h2>
        {brandSummary ? (
          <p style={summaryStyle}>{brandSummary}</p>
        ) : null}

        <div style={cardsStyle}>
          <DocCard
            num="01"
            title="Raw interview data"
            titleZh="原始访谈数据"
            desc="The complete transcript — every question, every answer, every analytical note."
            descZh="完整访谈记录——每一个问题、每一个回答、每一段分析。"
            onDownload={() =>
              downloadMd(`Brand-Interview-Raw-Data-${code}.md`, rawMd)
            }
          />
          <DocCard
            featured
            num="02"
            title="Your report"
            titleZh="你的报告"
            desc="Your portrait in full sentences. Composition, journey, and what to watch — re-read at decision points."
            descZh="完整句子写成的画像——人格构成、旅程阶段、需要警觉的地方。"
            onDownload={() =>
              reportMd && downloadMd(`Brand-Report-${code}.md`, reportMd)
            }
          />
          <DocCard
            num="03"
            title="AI-ready context"
            titleZh="AI 就绪文档"
            desc="Drop into Claude / ChatGPT — the model adopts your archetype, voice, and constraints."
            descZh="放入任意 AI——模型将自动采用你的人格、语调与约束。"
            onDownload={() =>
              contextMd &&
              downloadMd(`Brand-Context-Profile-${code}.md`, contextMd)
            }
          />
        </div>

        <div style={shareRowStyle}>
          <a
            href={`/${code}`}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => setShareHover(true)}
            onMouseLeave={() => setShareHover(false)}
            onFocus={() => setShareHover(true)}
            onBlur={() => setShareHover(false)}
            style={{
              color: shareHover
                ? "var(--brand-archetypes-red)"
                : "var(--brand-archetypes-black)",
              fontFamily: "var(--font-framework)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationThickness: 1,
              transition: "color 160ms ease",
              outline: "none",
            }}
          >
            {shareUrl}
          </a>
          <button
            type="button"
            onClick={handleShare}
            style={shareButtonStyle}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy share link"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── card subcomponent ────────────────────────────────────────────────────

interface DocCardProps {
  featured?: boolean;
  num: string;
  title: string;
  titleZh: string;
  desc: string;
  descZh: string;
  onDownload: () => void;
}

function DocCard({
  featured,
  num,
  title,
  titleZh,
  desc,
  descZh,
  onDownload,
}: DocCardProps) {
  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-5)",
        border: featured
          ? "2px solid var(--brand-archetypes-red)"
          : "1px solid var(--brand-archetypes-gray-300)",
        background: "var(--brand-archetypes-white)",
      }}
    >
      <div
        style={{
          color: "var(--brand-archetypes-gray-500)",
          fontFamily: "var(--font-framework)",
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        Document {num}
        {featured ? " ★" : ""}
      </div>
      <h3
        style={{
          marginTop: "var(--space-3)",
          marginBottom: "var(--space-3)",
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          lineHeight: 1.2,
          color: "#000",
        }}
      >
        <span className="i18n-en i18n-block">{title}</span>
        <span className="i18n-zh i18n-block">{titleZh}</span>
      </h3>
      <p
        style={{
          flex: 1,
          marginBottom: "var(--space-7)",
          color: "var(--brand-archetypes-gray-700)",
          fontSize: "var(--text-sm)",
          lineHeight: 1.65,
        }}
      >
        <span className="i18n-en i18n-block">{desc}</span>
        <span className="i18n-zh i18n-block">{descZh}</span>
      </p>
      <button
        type="button"
        onClick={onDownload}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          padding: "10px 16px",
          border: "1.5px solid var(--brand-archetypes-red)",
          background: featured
            ? "var(--brand-archetypes-red)"
            : "transparent",
          color: featured
            ? "var(--brand-archetypes-white)"
            : "var(--brand-archetypes-red)",
          fontFamily: "var(--font-body-en)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        ↓ Download
      </button>
    </article>
  );
}

// ─── markdown builders ────────────────────────────────────────────────────

function buildRawDataMarkdown(ctx: {
  code: string;
  turns: DialogTurn[];
}): string {
  const lines: string[] = [];
  lines.push(`# Brand Interview · Raw Data`);
  lines.push("");
  lines.push(`- **Session code:** ${ctx.code}`);
  lines.push(`- **Total messages:** ${ctx.turns.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Pair user/assistant into Q&A blocks where possible
  let pendingKey: string | null = null;
  let pendingEn = "";
  let pendingZh = "";
  for (const m of ctx.turns) {
    if (m.role === "assistant") {
      const key = m.analysis?.nextQuestionKey ?? null;
      if (key && key !== "DONE") {
        pendingKey = key;
        const q = questionByKey(key);
        pendingEn = q?.promptEn ?? "";
        pendingZh = q?.promptZh ?? "";
      } else {
        pendingKey = null;
      }
    } else if (m.role === "user") {
      lines.push(`## ${pendingKey ?? "—"}`);
      lines.push("");
      if (pendingEn) {
        lines.push(`**Question (EN):** ${pendingEn}`);
        lines.push("");
      }
      if (pendingZh) {
        lines.push(`**Question (ZH):** ${pendingZh}`);
        lines.push("");
      }
      lines.push("**Response:**");
      lines.push("");
      lines.push(m.text || "_(empty)_");
      lines.push("");
      lines.push("---");
      lines.push("");
      pendingKey = null;
    }
  }
  return lines.join("\n");
}

// ─── helpers ──────────────────────────────────────────────────────────────

function downloadMd(name: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── styles + icons ───────────────────────────────────────────────────────

const eyebrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  color: "var(--brand-archetypes-gray-500)",
  fontFamily: "var(--font-framework)",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
} as const;

const eyebrowSepStyle = {
  margin: "0 0.5em",
  color: "var(--brand-archetypes-red)",
} as const;

const titleStyle = {
  margin: "var(--space-3) 0 0",
  fontFamily: "var(--font-heading)",
  fontSize: "var(--text-2xl)",
  fontWeight: 700,
  lineHeight: 1.15,
  color: "#000",
} as const;

const summaryStyle = {
  margin: "var(--space-3) 0 0",
  color: "var(--brand-archetypes-gray-700)",
  fontSize: "var(--text-base)",
  fontWeight: 500,
  lineHeight: 1.5,
} as const;

const cardsStyle = {
  marginTop: "var(--space-6)",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "var(--space-4)",
} as const;

const shareRowStyle = {
  marginTop: "var(--space-5)",
  paddingTop: "var(--space-4)",
  borderTop: "1px solid var(--brand-archetypes-gray-200)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  flexWrap: "wrap" as const,
};

const shareButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  border: "1.5px solid var(--brand-archetypes-black)",
  background: "var(--brand-archetypes-black)",
  color: "var(--brand-archetypes-white)",
  fontFamily: "var(--font-body-en)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  cursor: "pointer",
} as const;

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
