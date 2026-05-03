"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { I18nText } from "@/components/I18nText";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Logo } from "@/components/Logo";

interface SiteHeaderProps {
  onRed?: boolean;
  revealOnScroll?: boolean;
}

const REVEAL_SCROLL_Y = 120;

export function SiteHeader({
  onRed = false,
  revealOnScroll = false,
}: SiteHeaderProps) {
  const [isRevealed, setIsRevealed] = useState(!revealOnScroll);
  const revealStyle: CSSProperties | undefined = revealOnScroll
    ? {
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        transform: isRevealed ? "translateY(0)" : "translateY(-100%)",
        opacity: isRevealed ? 1 : 0,
        pointerEvents: isRevealed ? "auto" : "none",
        transition: "transform 0.18s ease, opacity 0.18s ease",
      }
    : undefined;

  useEffect(() => {
    if (!revealOnScroll) {
      return;
    }

    function updateRevealState() {
      setIsRevealed(window.scrollY > REVEAL_SCROLL_Y);
    }

    updateRevealState();
    window.addEventListener("scroll", updateRevealState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateRevealState);
    };
  }, [revealOnScroll]);

  return (
    <header
      style={revealStyle}
      className={[
        "site-header",
        onRed ? "is-on-red" : "",
        revealOnScroll ? "is-reveal-on-scroll" : "",
        isRevealed ? "is-visible" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="site-header__inner">
        <Logo onRed={onRed} />
        <div className="site-header__actions">
          <nav className="site-header__nav" aria-label="Main navigation">
            <Link href="/">
              <I18nText zh="首页" en="home" />
            </Link>
          </nav>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
