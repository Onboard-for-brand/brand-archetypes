"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      document.body.style.cursor = "none";
    }

    const cursor = cursorRef.current;
    if (!cursor) return;

    // Fast tracking for brutalist feel (less spring, more direct)
    const xTo = gsap.quickTo(cursor, "x", {
      duration: 0.1,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(cursor, "y", {
      duration: 0.1,
      ease: "power3.out",
    });

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a") ||
        target.closest("button") ||
        target.closest(".magnetic-target") ||
        target.closest("[data-cursor='hover']")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`pointer-events-none fixed left-0 top-0 z-[100] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white mix-blend-difference transition-transform duration-150 ${
        isHovering ? "scale-[2.5] rotate-45" : "scale-100 rotate-0"
      }`}
      style={{ willChange: "transform" }}
    >
      {/* Optional crosshair inner element for extreme brutalism */}
      <div
        className={`w-full h-[2px] bg-[#e53935] absolute transition-opacity ${isHovering ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`w-[2px] h-full bg-[#e53935] absolute transition-opacity ${isHovering ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
