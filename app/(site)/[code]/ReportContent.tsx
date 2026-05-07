"use client";

/**
 * Report content for a completed interview. Three bands:
 *
 *   • header  — phase progress bar (ROOT / TRUNK / BARK / CANOPY)
 *   • middle  — horizontal: composition on the left, radar + quote on right
 *   • (no footer — quote moved next to radar)
 */

import Link from "next/link";
import { useMemo, type SVGProps } from "react";
import { I18nText } from "@/components/I18nText";
import { RadarChart } from "@/components/RadarChart";
import { archetypes } from "@/lib/archetypes";
import type { RadarSnapshot } from "@/lib/radar-session";

interface Props {
  code: string;
  radarState: RadarSnapshot;
  brandSummary: string | null;
}

export function ReportContent({ code, radarState, brandSummary }: Props) {
  const sorted = useMemo(
    () =>
      archetypes
        .map((a) => ({ ...a, score: radarState.archetypeScores[a.id] ?? 0 }))
        .sort((x, y) => y.score - x.score),
    [radarState.archetypeScores],
  );
  const active = sorted.filter((s) => s.score > 0);
  const primary = active[0] ?? null;
  const secondary = active.slice(1, 3);

  return (
    <main className="report-page">
      {/* HEADER — phase progress */}
      <div className="progress">
        <div className="progress__track">
          <div
            className="progress__seg progress__seg--filled"
            style={{ width: "38.1%" }}
          >
            ROOT ✓
          </div>
          <div
            className="progress__seg progress__seg--filled"
            style={{ width: "31.0%" }}
          >
            TRUNK ✓
          </div>
          <div
            className="progress__seg progress__seg--filled"
            style={{ width: "9.5%" }}
          >
            BARK ✓
          </div>
          <div
            className="progress__seg progress__seg--filled"
            style={{ width: "21.4%" }}
          >
            CANOPY ✓
          </div>
        </div>
      </div>

      {/* MIDDLE — composition (left, red panel) | radar + coda (right) */}
      <div className="report-layout">
        {primary ? (
          <div className="report-portrait">
            <div className="report-portrait__avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primary.avatar} alt={`${primary.nameEn} portrait`} />
            </div>

            <div className="report-portrait__body">
              <div className="report-portrait__eyebrow">
                <I18nText en="Final composition" zh="最终构成" />
              </div>
              <div className="report-portrait__composition">
                <I18nText
                  block
                  en={[primary, ...secondary].map((s) => s.nameEn).join(" + ")}
                  zh={[primary, ...secondary].map((s) => s.nameZh).join(" · ")}
                />
              </div>
              <div className="report-portrait__service">
                <I18nText block en={primary.serviceEn} zh={primary.serviceZh} />
              </div>

              {brandSummary ? (
                <div className="report-portrait__quote">
                  <QuoteIcon className="report-portrait__quote-icon" />
                  <p className="report-portrait__quote-text">{brandSummary}</p>
                </div>
              ) : null}
            </div>

            <div className="report-portrait__footer">
              <div className="report-portrait__code">
                CODE{" "}
                <span className="report-portrait__code-sep">{"///"}</span>{" "}
                {code}
              </div>
              <Link href="/" className="report-portrait__home">
                <span className="report-portrait__home-arrow">←</span>{" "}
                <I18nText en="Go home" zh="返回首页" />
              </Link>
            </div>
          </div>
        ) : null}

        <div className="report-layout__radar">
          <RadarChart
            scores={radarState.archetypeScores}
            primaryId={radarState.primaryId}
            size={620}
          />
          <hr className="divider divider--red divider--short" />
          <div className="report-coda__quote">
            &ldquo;You can&apos;t get there by bus, only by hard work and risk
            and by not quite knowing what you&apos;re doing.&rdquo;
          </div>
        </div>
      </div>
    </main>
  );
}

function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      opacity={0.35}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8 5.00021C8 4.67223 7.83917 4.3651 7.56959 4.17829C7.00011 3.78364 6.39378 4.14699 5.88474 4.43333C5.45666 4.67412 4.88734 5.0476 4.31606 5.58318C3.16181 6.66528 2 8.41492 2 11.0002V19.0002C2 19.5525 2.44772 20.0002 3 20.0002H10C10.5523 20.0002 11 19.5525 11 19.0002V11.0002C11 10.4479 10.5523 10.0002 10 10.0002H8V5.00021Z"
        fill="currentColor"
      />
      <path
        d="M19 5.00021C19 4.67223 18.8392 4.3651 18.5696 4.17829C18.0001 3.78364 17.3938 4.14699 16.8847 4.43333C16.4567 4.67412 15.8873 5.0476 15.3161 5.58318C14.1618 6.66528 13 8.41492 13 11.0002V19.0002C13 19.5525 13.4477 20.0002 14 20.0002H21C21.5523 20.0002 22 19.5525 22 19.0002V11.0002C22 10.4479 21.5523 10.0002 21 10.0002H19V5.00021Z"
        fill="currentColor"
      />
    </svg>
  );
}
