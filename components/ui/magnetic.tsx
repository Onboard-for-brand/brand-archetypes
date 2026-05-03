"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import {
  forwardRef,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

interface MagneticButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  /** Multiplier for the pointer offset; 0 = none, 1 = 1:1 follow. */
  strength?: number;
  /** Distance (px) the pointer needs to be from the button to start pulling. */
  radius?: number;
  children: ReactNode;
}

/**
 * Button that gently follows the cursor with a spring. The translation snaps
 * back when the cursor leaves. Wraps a real <button>, so all native props,
 * focus ring, and form behavior remain intact.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    { strength = 0.28, radius = 80, className, children, ...rest },
    forwardedRef,
  ) {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useSpring(useMotionValue(0), {
      stiffness: 280,
      damping: 18,
      mass: 0.5,
    });
    const y = useSpring(useMotionValue(0), {
      stiffness: 280,
      damping: 18,
      mass: 0.5,
    });

    function handleMove(event: PointerEvent<HTMLButtonElement>) {
      if (event.pointerType === "touch") return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const max = radius + Math.max(rect.width, rect.height) / 2;
      const ratio = distance > max ? 0 : 1 - distance / max;
      x.set(dx * strength * ratio);
      y.set(dy * strength * ratio);
    }

    function reset() {
      x.set(0);
      y.set(0);
    }

    return (
      <motion.button
        ref={(node) => {
          ref.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ x, y }}
        className={cn("will-change-transform", className)}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
