"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface MagneticProps {
  children: React.ReactElement;
  strength?: number;
}

export function Magnetic({ children, strength = 30 }: MagneticProps) {
  const magneticRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const magnetic = magneticRef.current;
    if (!magnetic) return;

    const xTo = gsap.quickTo(magnetic, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(magnetic, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = magnetic.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * (strength / 100));
      yTo(y * (strength / 100));
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    magnetic.addEventListener("mousemove", handleMouseMove);
    magnetic.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      magnetic.removeEventListener("mousemove", handleMouseMove);
      magnetic.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={magneticRef} className="magnetic-target inline-block">
      {children}
    </div>
  );
}
