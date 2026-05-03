"use client";

import { useEffect } from "react";
import { I18nText } from "@/components/I18nText";
import { Venn } from "@/components/Venn";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAILTO =
  "mailto:hello@onboardingforbrand.com?subject=Access%20code%20request%20%2F%20%E7%94%B3%E8%AF%B7%E8%AE%BF%E9%97%AE%E7%A0%81";
const EMAIL = "hello@onboardingforbrand.com";

export function HowToGetPanel({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey, { capture: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey, { capture: true });
    };
  }, [open, onClose]);

  return (
    <div
      className={`how-to-get-panel ${open ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="How to get an access code"
    >
      <button
        type="button"
        className="how-to-get-panel__close"
        onClick={onClose}
        aria-label="Close"
      >
        <svg
          className="how-to-get-panel__close-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <path d="M6 6 18 18" />
          <path d="M6 18 18 6" />
        </svg>
      </button>

      <div className="how-to-get-panel__scroll" data-lenis-prevent>
        <div className="how-to-get-panel__inner">
          <h1 className="how-to-get-panel__title">
            Brand as
            <br />
            Educational Journey
            <span className="how-to-get-panel__title-sub">品牌即教育之旅</span>
          </h1>

          <hr className="how-to-get-panel__rule" />

          <div className="how-to-get-panel__split">
            <div>
              <p>
                You can&apos;t get there by bus, only by{" "}
                <strong>hard work and risk</strong> and by{" "}
                <strong>not quite knowing what you&apos;re doing</strong>.
              </p>
              <p>
                What you&apos;ll discover will be wonderful. What you&apos;ll
                discover will be <strong>yourself</strong>.
              </p>
            </div>

            <div className="how-to-get-panel__split-zh">
              <p>
                建立品牌不是最终目标；目标是让品牌成为每个人成长和创造性行动的反应容器
                —— 用「真·善·美」的标准去改造现实。
              </p>
            </div>
          </div>

          <div className="how-to-get-panel__layers">
            <div className="how-to-get-panel__layer">
              <div className="how-to-get-panel__layer-label">whyTO</div>
              <div className="how-to-get-panel__layer-sub">
                : context · 语境
              </div>
              <p className="how-to-get-panel__layer-desc">
                Where this brand sits in time, history, the spiritual climate
                of the era. Why now, why this.
              </p>
            </div>
            <div className="how-to-get-panel__layer">
              <div className="how-to-get-panel__layer-label">howTO</div>
              <div className="how-to-get-panel__layer-sub">
                : knowledge · 方法
              </div>
              <p className="how-to-get-panel__layer-desc">
                The methodology, the framework, the operational discipline that
                turns conviction into a brand that can be passed on.
              </p>
            </div>
            <div className="how-to-get-panel__layer">
              <div className="how-to-get-panel__layer-label">wantTO</div>
              <div className="how-to-get-panel__layer-sub">
                : desire · 欲望
              </div>
              <p className="how-to-get-panel__layer-desc">
                The Flame of Desire (欲望之火) — the archetype-shaped engine
                beneath every decision the brand makes.
              </p>
            </div>
          </div>

          <p className="how-to-get-panel__contact">
            <I18nText
              en={
                <>
                  Access codes are issued in small batches alongside curated
                  cohorts and partner programs. For now, please reach out to{" "}
                  <a className="how-to-get-panel__email" href={MAILTO}>
                    {EMAIL}
                  </a>{" "}
                  with a short note about why you&apos;d like to take the
                  journey.
                </>
              }
              zh={
                <>
                  访问码会随策划性活动与合作项目分批发放。在此之前，请发送邮件至{" "}
                  <a className="how-to-get-panel__email" href={MAILTO}>
                    {EMAIL}
                  </a>
                  ，简单介绍你希望开启这段旅程的原因。
                </>
              }
            />
          </p>

          <hr className="how-to-get-panel__rule how-to-get-panel__rule--soft" />

          <div className="how-to-get-panel__cohost">
            <div className="how-to-get-panel__cohost-mark">
              <Venn />
            </div>
            <div>
              <div className="how-to-get-panel__cohost-eyebrow">CoHost</div>
              <div className="how-to-get-panel__cohost-name">EDUPUNK</div>
              <div className="how-to-get-panel__cohost-meta">
                DLC: Brand as Educational Journey · Version: Processta 1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
