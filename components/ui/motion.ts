import type { Transition } from "motion/react";

// Spring tuned for small UI surfaces (popovers, pills, dialogs).
// Echoes the feel of motion-primitives.com presets — soft, snappy, no overshoot.
export const popSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.6,
};

export const sheetSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.7,
};

export const popInitial = { opacity: 0, scale: 0.96, y: -4 };
export const popAnimate = { opacity: 1, scale: 1, y: 0 };
export const popExit = { opacity: 0, scale: 0.96, y: -4 };
