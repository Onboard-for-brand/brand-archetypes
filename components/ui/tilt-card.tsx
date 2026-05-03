"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on either axis. */
  max?: number;
  /** Disable the effect (e.g. on touch). */
  disabled?: boolean;
}

/**
 * Card that rotates a few degrees around its own axes following the cursor.
 * Wrap any block element. Children get a subtle 3D feel; preserve-3d is set
 * so nested layers can lift further with translateZ if desired.
 */
export function TiltCard({
  children,
  className,
  max = 6,
  disabled,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.pointerType === "touch") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{
        rotateX: disabled ? 0 : rotateX,
        rotateY: disabled ? 0 : rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 800,
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
