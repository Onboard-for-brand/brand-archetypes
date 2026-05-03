"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";

const RETURN_DURATION_SECONDS = 0.24;
const RETURN_IDLE_DELAY = 90;
const MIN_VISIBLE_PROGRESS = 0.06;
const RETURN_EASING = (t: number) => 1 - (1 - t) ** 4;
const LOGO_WIDTH_VW = 103.5;
const LOGO_HEIGHT_VW = LOGO_WIDTH_VW * (355 / 2000);

export function EdupunkBounceFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const footer = footerRef.current;

    if (!footer || !lenis) {
      return;
    }

    const footerElement = footer;
    const lenisInstance = lenis;
    let isReturning = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    function clearIdleTimer() {
      if (!idleTimer) {
        return;
      }

      clearTimeout(idleTimer);
      idleTimer = undefined;
    }

    function restingScrollY() {
      const cta = document.querySelector<HTMLElement>('[data-section="cta"]');
      const targetElement = cta ?? footerElement;
      const targetTop =
        targetElement.getBoundingClientRect().top + window.scrollY;

      return Math.max(0, targetTop);
    }

    function visibleProgress() {
      const rect = footerElement.getBoundingClientRect();
      const height = Math.max(rect.height, 1);

      return Math.min(Math.max((window.innerHeight - rect.top) / height, 0), 1);
    }

    function returnToCta() {
      const progress = visibleProgress();

      if (isReturning || progress < MIN_VISIBLE_PROGRESS) {
        return;
      }

      isReturning = true;
      clearIdleTimer();

      lenisInstance.scrollTo(restingScrollY(), {
        duration: RETURN_DURATION_SECONDS,
        easing: RETURN_EASING,
        force: true,
        lock: false,
        onComplete: () => {
          isReturning = false;
        },
      });
    }

    function scheduleReturn() {
      clearIdleTimer();

      if (isReturning || visibleProgress() < MIN_VISIBLE_PROGRESS) {
        return;
      }

      const scrollSnapshot = lenisInstance.scroll;

      idleTimer = setTimeout(() => {
        idleTimer = undefined;

        if (isReturning || visibleProgress() < MIN_VISIBLE_PROGRESS) {
          return;
        }

        if (Math.abs(lenisInstance.scroll - scrollSnapshot) > 0.5) {
          scheduleReturn();
          return;
        }

        returnToCta();
      }, RETURN_IDLE_DELAY);
    }

    function handleScroll() {
      if (isReturning) {
        clearIdleTimer();
        return;
      }

      scheduleReturn();
    }

    const offScroll = lenisInstance.on("scroll", handleScroll);

    window.addEventListener("resize", scheduleReturn);
    scheduleReturn();

    return () => {
      clearIdleTimer();
      offScroll();
      window.removeEventListener("resize", scheduleReturn);
    };
  }, [lenis]);

  return (
    <section
      ref={footerRef}
      data-section="brand-archetypes-footer"
      aria-hidden="true"
      className="relative z-0 w-full overflow-hidden bg-black"
      style={{ height: `${LOGO_HEIGHT_VW}vw` }}
    >
      <Image
        src="/brand-archetypes-logo.svg"
        width={2000}
        height={355}
        alt=""
        unoptimized
        loading="eager"
        draggable={false}
        className="absolute left-1/2 top-0 block max-w-none -translate-x-1/2 select-none"
        style={{
          width: `${LOGO_WIDTH_VW}vw`,
          height: "auto",
        }}
      />
    </section>
  );
}
