import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** "dark" sits inside dark buttons; "light" sits on light surfaces. */
  variant?: "light" | "dark";
}

export function Kbd({
  className,
  variant = "light",
  ...props
}: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[10px] font-medium leading-none",
        variant === "light"
          ? "border-[var(--color-border)] bg-[oklch(0.97_0_0)] text-[var(--color-fg-muted)] shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]"
          : "border-white/15 bg-white/5 text-white/65 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
