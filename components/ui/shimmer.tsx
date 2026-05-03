"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface ShimmerProps {
  className?: string;
  duration?: number;
  /** Render the shimmer as an absolute overlay inside its parent. */
  overlay?: boolean;
}

/**
 * Single horizontal gradient sweep. Drop inside a `position: relative`
 * parent (or pass `overlay`) to highlight a fresh element once.
 */
export function Shimmer({
  className,
  duration = 1.4,
  overlay = true,
}: ShimmerProps) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ x: "-120%" }}
      animate={{ x: "220%" }}
      transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "pointer-events-none block w-1/2",
        overlay && "absolute inset-y-0 left-0",
        "bg-gradient-to-r from-transparent via-[var(--color-fg)]/12 to-transparent",
        className,
      )}
    />
  );
}
