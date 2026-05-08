"use client";

import type { CSSProperties } from "react";

interface Props {
  /** True while the three AI artifacts (summary + report + context) are
   *  still being generated server-side. Card shows a wait state and the
   *  open-dialog button is hidden. */
  generating: boolean;
  /** Open the end-state dialog with download cards + share link. */
  onOpen: () => void;
}

/**
 * Inline end-of-interview card. Rendered below an AI turn that has
 * `cta: { kind: "report-offer" }`. No border, no background — sits as a
 * special left-aligned moment within the chat scroll, not a popup.
 *
 * Two states:
 *   • generating — "report being prepared, ~5 minutes"
 *   • ready      — "your portrait is ready" + button to open dialog
 *
 * Each text node renders both EN and ZH; the i18n CSS classes flip which
 * is visible based on `html[data-language]`.
 */
export function ReportOfferCard({ generating, onOpen }: Props) {
  if (generating) {
    return (
      <div style={wrapStyle}>
        <div className="i18n-en i18n-block" style={eyebrowStyle}>
          GENERATING REPORT
        </div>
        <div className="i18n-zh i18n-block" style={eyebrowStyle}>
          报告生成中
        </div>

        <h3 className="i18n-en i18n-block" style={titleEnStyle}>
          We&apos;re assembling your portrait.
        </h3>
        <h3 className="i18n-zh i18n-block" style={titleZhStyle}>
          正在为你整理画像。
        </h3>

        <p className="i18n-en i18n-block" style={bodyEnStyle}>
          This usually takes about 5 minutes. The window will open
          automatically once it&apos;s ready.
        </p>
        <p className="i18n-zh i18n-block" style={bodyZhStyle}>
          这一步大约需要 5 分钟。完成后会自动为你打开。
        </p>

        <div style={pulseRowStyle}>
          <span style={pulseDotStyle} />
          <span className="i18n-en i18n-inline">Working…</span>
          <span className="i18n-zh i18n-inline">处理中…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div className="i18n-en i18n-block" style={eyebrowStyle}>
        INTERVIEW DONE
      </div>
      <div className="i18n-zh i18n-block" style={eyebrowStyle}>
        访谈结束
      </div>

      <h3 className="i18n-en i18n-block" style={titleEnStyle}>
        We&apos;ve reached the end.
      </h3>
      <h3 className="i18n-zh i18n-block" style={titleZhStyle}>
        我们走到末尾了。
      </h3>

      <p className="i18n-en i18n-block" style={bodyEnStyle}>
        Your portrait is ready.
      </p>
      <p className="i18n-zh i18n-block" style={bodyZhStyle}>
        你的画像已经准备好了。
      </p>

      <div style={actionsStyle}>
        <button type="button" onClick={onOpen} style={btnFilledStyle}>
          <span className="i18n-en i18n-inline">Show me the portrait</span>
          <span className="i18n-zh i18n-inline">看我的画像</span>
        </button>
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  padding: "4px 0",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "var(--font-framework)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "var(--brand-archetypes-red)",
};

const titleEnStyle: CSSProperties = {
  marginTop: 10,
  fontFamily: "var(--font-heading)",
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.25,
  color: "var(--brand-archetypes-black)",
};

const titleZhStyle: CSSProperties = {
  marginTop: 2,
  fontFamily: "var(--font-body-zh)",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  color: "var(--brand-archetypes-gray-700)",
};

const bodyEnStyle: CSSProperties = {
  marginTop: 12,
  maxWidth: 360,
  fontSize: 12,
  lineHeight: 1.65,
  color: "var(--brand-archetypes-gray-700)",
};

const bodyZhStyle: CSSProperties = {
  marginTop: 4,
  maxWidth: 360,
  fontFamily: "var(--font-body-zh)",
  fontSize: 12,
  lineHeight: 1.85,
  color: "var(--brand-archetypes-gray-700)",
};

const actionsStyle: CSSProperties = {
  marginTop: 18,
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const btnBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  border: "1.5px solid var(--brand-archetypes-red)",
  fontFamily: "var(--font-body-en)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

const btnFilledStyle: CSSProperties = {
  ...btnBaseStyle,
  color: "var(--brand-archetypes-white)",
  background: "var(--brand-archetypes-red)",
};

const pulseRowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 18,
  fontFamily: "var(--font-framework)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--brand-archetypes-gray-500)",
};

const pulseDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--brand-archetypes-red)",
  animation: "report-card-pulse 1.4s ease-in-out infinite",
};
