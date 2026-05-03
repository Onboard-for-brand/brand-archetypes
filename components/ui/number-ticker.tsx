"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export function NumberTicker({
  value,
  duration = 0.9,
  className,
  format,
}: NumberTickerProps) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (raw) => {
    const rounded = Math.round(raw);
    return format ? format(rounded) : rounded.toLocaleString();
  });

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}
