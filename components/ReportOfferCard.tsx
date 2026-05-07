"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

interface Props {
  /** Access code, used to build the report URL. */
  code: string;
}

/**
 * Inline end-of-interview card. Rendered below an AI turn that has
 * `cta: { kind: "report-offer" }`. No border, no background — sits as a
 * special left-aligned moment within the chat scroll, not a popup.
 *
 * The interview is closed at this point: the only path forward is opening
 * the report. Each text node renders both EN and ZH; the i18n CSS classes
 * flip which is visible based on `html[data-language]`.
 */
export function ReportOfferCard({ code }: Props) {
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
        <Link href={`/${encodeURIComponent(code)}`} style={btnFilledStyle}>
          <span className="i18n-en i18n-inline">Show me the portrait</span>
          <span className="i18n-zh i18n-inline">看我的画像</span>
        </Link>
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
