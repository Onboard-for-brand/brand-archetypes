"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SVGProps,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { AccessCode } from "@/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { MagneticButton } from "@/components/ui/magnetic";
import { popSpring, sheetSpring } from "@/components/ui/motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Shimmer } from "@/components/ui/shimmer";
import { TiltCard } from "@/components/ui/tilt-card";

type SerializedCode = Omit<
  AccessCode,
  "createdAt" | "activatedAt" | "completedAt"
> & {
  createdAt: string | Date;
  activatedAt: string | Date | null;
  completedAt: string | Date | null;
};

const STATUS_OPTIONS: AccessCode["status"][] = [
  "issued",
  "active",
  "completed",
  "revoked",
];

const STATUS_STYLE: Record<
  AccessCode["status"],
  { label: string; className: string; dotClass: string }
> = {
  issued: {
    label: "未使用",
    className:
      "bg-[oklch(0.95_0_0)] text-[var(--color-fg-muted)] border-[var(--color-border)]",
    dotClass: "bg-[oklch(0.7_0_0)]",
  },
  active: {
    label: "使用中",
    className:
      "bg-[oklch(0.96_0.04_240)] text-[oklch(0.42_0.16_245)] border-[oklch(0.88_0.05_240)]",
    dotClass: "bg-[oklch(0.55_0.18_245)]",
  },
  completed: {
    label: "已完成",
    className:
      "bg-[oklch(0.96_0.04_150)] text-[oklch(0.42_0.14_150)] border-[oklch(0.88_0.05_150)]",
    dotClass: "bg-[oklch(0.55_0.16_150)]",
  },
  revoked: {
    label: "已失效",
    className:
      "bg-[oklch(0.96_0.03_27)] text-[oklch(0.5_0.18_27)] border-[oklch(0.88_0.06_27)]",
    dotClass: "bg-[oklch(0.6_0.2_27)]",
  },
};

export function AccessCodesClient({
  initialCodes,
}: {
  initialCodes: SerializedCode[];
}) {
  const [codes, setCodes] = useState<SerializedCode[]>(initialCodes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<string | null>(null);

  const counts = {
    total: codes.length,
    issued: codes.filter((c) => c.status === "issued").length,
    active: codes.filter((c) => c.status === "active").length,
    completed: codes.filter((c) => c.status === "completed").length,
  };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
        return;
      if (isDialogOpen) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      setIsDialogOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDialogOpen]);

  async function copyToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1400);
    } catch {
      // ignore clipboard failures silently
    }
  }

  async function handleStatusChange(
    code: string,
    nextStatus: AccessCode["status"],
  ) {
    if (nextStatus === "revoked") {
      const confirmed = window.confirm(
        `Revoke ${code}? The recipient will no longer be able to use it.`,
      );
      if (!confirmed) return;
    }

    const previous = codes;
    setCodes((rows) =>
      rows.map((r) => (r.code === code ? { ...r, status: nextStatus } : r)),
    );

    const res = await fetch(`/api/admin/codes/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!res.ok) {
      setCodes(previous);
      window.alert("Failed to update status.");
    }
  }

  return (
    <div className="px-8 py-8">
      <header className="flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-fg-subtle)]">
            Access
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Access Code
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            Issue and distribute codes to interview recipients.
          </p>
        </div>
        <MagneticButton
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-fg)] pl-3.5 pr-2 text-sm font-medium text-[var(--color-surface)] transition-colors hover:bg-[oklch(0.28_0_0)]"
        >
          <PlusIcon className="size-3.5" />
          New code
          <Kbd variant="dark" aria-label="Shortcut: C">
            C
          </Kbd>
        </MagneticButton>
      </header>

      <StatsRow counts={counts} />

      <section className="mt-6">
        {codes.length === 0 ? (
          <EmptyState onCreate={() => setIsDialogOpen(true)} />
        ) : (
          <CodesTable
            codes={codes}
            copiedCode={copiedCode}
            freshCode={freshCode}
            onCopy={copyToClipboard}
            onStatusChange={handleStatusChange}
          />
        )}
      </section>

      <AnimatePresence>
        {isDialogOpen ? (
          <NewCodeDialog
            onClose={() => setIsDialogOpen(false)}
            onCreated={(row) => {
              setCodes((current) => [row, ...current]);
              setIsDialogOpen(false);
              setFreshCode(row.code);
              window.setTimeout(() => {
                setFreshCode((current) =>
                  current === row.code ? null : current,
                );
              }, 1800);
              void copyToClipboard(row.code);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StatsRow({
  counts,
}: {
  counts: { total: number; issued: number; active: number; completed: number };
}) {
  const stats: Array<{
    label: string;
    value: number;
    dot: string;
    accent: string;
  }> = [
    {
      label: "总计",
      value: counts.total,
      dot: "bg-[var(--color-fg)]",
      accent: "text-[var(--color-fg)]",
    },
    {
      label: "未使用",
      value: counts.issued,
      dot: "bg-[oklch(0.7_0_0)]",
      accent: "text-[var(--color-fg)]",
    },
    {
      label: "使用中",
      value: counts.active,
      dot: "bg-[oklch(0.55_0.18_245)]",
      accent: "text-[oklch(0.42_0.16_245)]",
    },
    {
      label: "已完成",
      value: counts.completed,
      dot: "bg-[oklch(0.55_0.16_150)]",
      accent: "text-[oklch(0.42_0.14_150)]",
    },
  ];

  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <TiltCard
          key={s.label}
          max={5}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-fg-subtle)]">
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </div>
          <div
            className={cn(
              "mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums",
              s.accent,
            )}
            style={{ transform: "translateZ(20px)" }}
          >
            <NumberTicker value={s.value} />
          </div>
        </TiltCard>
      ))}
    </section>
  );
}

function CodesTable({
  codes,
  copiedCode,
  freshCode,
  onCopy,
  onStatusChange,
}: {
  codes: SerializedCode[];
  copiedCode: string | null;
  freshCode: string | null;
  onCopy: (code: string) => void;
  onStatusChange: (code: string, next: AccessCode["status"]) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[oklch(0.985_0_0)] text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-fg-subtle)]">
            <th className="px-4 py-2.5">Note</th>
            <th className="px-4 py-2.5">Code</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Created</th>
            <th className="w-px px-3 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {codes.map((row, index) => {
            const isCopied = copiedCode === row.code;
            const isRevoked = row.status === "revoked";
            const isFresh = freshCode === row.code;

            return (
              <motion.tr
                key={row.code}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...popSpring,
                  delay: Math.min(index * 0.025, 0.2),
                }}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="max-w-[420px] px-4 py-3 text-[var(--color-fg-muted)]">
                  {row.note ? (
                    <span className="line-clamp-1 text-[13px]">{row.note}</span>
                  ) : (
                    <span className="text-[var(--color-fg-subtle)]">—</span>
                  )}
                </td>
                <td className="relative overflow-hidden px-4 py-3">
                  {isFresh ? <Shimmer duration={1.4} /> : null}
                  <button
                    type="button"
                    onClick={() => onCopy(row.code)}
                    title={isCopied ? "Copied" : "Click to copy"}
                    className="group relative inline-flex items-center gap-2 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-[oklch(0.96_0_0)]"
                  >
                    <span
                      className={[
                        "font-mono text-[13px] font-medium tracking-tight",
                        isRevoked
                          ? "text-[var(--color-fg-subtle)] line-through"
                          : "text-[var(--color-fg)]",
                      ].join(" ")}
                    >
                      {row.code}
                    </span>
                    <span
                      className={[
                        "text-[var(--color-fg-subtle)] transition-opacity",
                        isCopied
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                    >
                      {isCopied ? (
                        <CheckIcon className="size-3.5 text-[oklch(0.55_0.16_150)]" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    value={row.status}
                    onChange={(next) => onStatusChange(row.code, next)}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">
                  <RelativeTime value={row.createdAt} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {isRevoked ? (
                    <span className="text-[12px] text-[var(--color-fg-subtle)]/50">
                      —
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStatusChange(row.code, "revoked")}
                      className="text-[12px] font-medium text-[var(--color-fg-subtle)] transition-colors hover:text-[var(--color-danger)]"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: AccessCode["status"];
  onChange: (next: AccessCode["status"]) => void;
}) {
  const status = STATUS_STYLE[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Status"
          className={[
            "inline-flex h-6 items-center gap-1.5 rounded-full border pl-2 pr-1.5 text-[11px] font-medium outline-none transition-all",
            status.className,
            "hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-fg)]/15 data-[state=open]:brightness-[0.95]",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={["size-1.5 rounded-full", status.dotClass].join(" ")}
          />
          <span>{status.label}</span>
          <ChevronIcon aria-hidden="true" className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const typed = next as AccessCode["status"];
            if (typed !== value) onChange(typed);
          }}
        >
          {STATUS_OPTIONS.map((opt) => {
            const meta = STATUS_STYLE[opt];
            return (
              <DropdownMenuRadioItem key={opt} value={opt}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={["size-1.5 rounded-full", meta.dotClass].join(" ")}
                  />
                  <span>{meta.label}</span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-[oklch(0.96_0_0)] text-[var(--color-fg-muted)]">
        <KeyIcon className="size-5" />
      </div>
      <h2 className="mt-4 text-sm font-semibold">No codes yet</h2>
      <p className="mt-1 max-w-xs text-xs text-[var(--color-fg-muted)]">
        Issue your first access code to invite a recipient into the interview.
      </p>
      <MagneticButton
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex h-8 items-center gap-2 rounded-md bg-[var(--color-fg)] pl-3 pr-1.5 text-xs font-medium text-[var(--color-surface)] transition-colors hover:bg-[oklch(0.28_0_0)]"
      >
        <PlusIcon className="size-3" />
        Issue code
        <Kbd variant="dark" aria-label="Shortcut: C">
          C
        </Kbd>
      </MagneticButton>
    </div>
  );
}

function NewCodeDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: SerializedCode) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    noteRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || null }),
      });

      const data = (await res.json().catch(() => null)) as {
        code?: SerializedCode;
        error?: string;
      } | null;

      if (!res.ok || !data?.code) {
        setError(data?.error ?? "Failed to create code");
        setIsSubmitting(false);
        return;
      }

      onCreated(data.code);
    } catch {
      setError("Network error. Try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-code-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute inset-0 bg-[oklch(0.18_0_0)]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={sheetSpring}
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25),0_4px_8px_rgba(0,0,0,0.04)]"
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col"
        >
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2
              id="new-code-title"
              className="text-sm font-semibold tracking-tight"
            >
              Issue new access code
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
              A 12-character code will be generated. The note is admin-only.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="note"
                className="text-xs font-medium text-[var(--color-fg-muted)]"
              >
                Note <span className="text-[var(--color-fg-subtle)]">(optional)</span>
              </label>
              <textarea
                ref={noteRef}
                id="note"
                name="note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. For Lily Chen, sent on 2026-05-04"
                className="resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-fg)] focus:ring-2 focus:ring-[var(--color-fg)]/10 disabled:opacity-50"
              />
              <div className="flex justify-end text-[10px] text-[var(--color-fg-subtle)]">
                {note.length}/500
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]"
              >
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[oklch(0.985_0_0)] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-2 rounded-md bg-[var(--color-fg)] pl-3 pr-1.5 text-xs font-medium text-[var(--color-surface)] transition-colors hover:bg-[oklch(0.28_0_0)] disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create code"}
              <Kbd variant="dark" aria-label="Shortcut: Cmd Enter">
                ⌘↵
              </Kbd>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RelativeTime({ value }: { value: string | Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const date = new Date(value);
  const label = formatRelative(value, now);
  return <span title={date.toLocaleString()}>{label}</span>;
}

function formatRelative(value: string | Date, now = Date.now()): string {
  const date = new Date(value);
  const diff = now - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString();
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
