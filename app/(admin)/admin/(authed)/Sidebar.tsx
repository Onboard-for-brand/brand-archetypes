"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { type ComponentType, type SVGProps } from "react";
import { popSpring } from "@/components/ui/motion";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { href: "/admin/access-codes", label: "Access Code", icon: KeyIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center px-4 pb-3 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Onboarding for Brand"
          className="h-5 w-auto select-none"
          draggable={false}
        />
      </div>

      <LayoutGroup id="admin-sidebar-nav">
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-fg)]"
                    : "text-[var(--color-fg-muted)] hover:bg-[oklch(0.96_0_0)] hover:text-[var(--color-fg)]",
                ].join(" ")}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 -z-0 rounded-md bg-[oklch(0.94_0_0)]"
                    transition={popSpring}
                  />
                ) : null}
                <Icon
                  className={[
                    "relative z-10 size-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[var(--color-fg)]"
                      : "text-[var(--color-fg-subtle)] group-hover:text-[var(--color-fg-muted)]",
                  ].join(" ")}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="mt-auto border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[12px] font-medium">{email}</span>
            <span className="text-[10px] text-[var(--color-fg-subtle)]">
              Admin
            </span>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-fg-subtle)] transition-colors hover:bg-[oklch(0.94_0_0)] hover:text-[var(--color-fg)]"
            >
              <SignOutIcon className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2" />
      <path d="m17 6 3 3" />
      <path d="m14 9 3 3" />
    </svg>
  );
}

function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
