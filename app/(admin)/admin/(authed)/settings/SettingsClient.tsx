"use client";

import { motion } from "motion/react";
import { useState, type SVGProps } from "react";
import { popSpring } from "@/components/ui/motion";
import { cn } from "@/lib/cn";
import type { AIModel } from "@/lib/ai-models";

export function SettingsClient({
  models,
  activeModel,
}: {
  models: AIModel[];
  activeModel: string;
}) {
  const [selected, setSelected] = useState(activeModel);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    if (id === selected || isSaving) return;
    const previous = selected;

    setError(null);
    setSelected(id);
    setIsSaving(true);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeModel: id }),
    });

    setIsSaving(false);

    if (!res.ok) {
      setSelected(previous);
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Failed to save");
    }
  }

  return (
    <div className="px-8 py-8">
      <header className="border-b border-[var(--color-border)] pb-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-fg-subtle)]">
          Configuration
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Choose the Anthropic model that powers user-facing interviews.
          Changes apply to new conversations.
        </p>
      </header>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">
            Active model
          </h2>
          <span className="font-mono text-[11px] text-[var(--color-fg-subtle)]">
            {models.length} available
          </span>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-3 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}

        {models.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-12 text-center">
            <p className="text-sm font-medium">
              Could not load model catalog
            </p>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
              Failed to load models. Refresh to retry.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model, index) => (
              <ModelCard
                key={model.id}
                model={model}
                index={index}
                isActive={selected === model.id}
                isSaving={isSaving && selected === model.id}
                onSelect={() => handleSelect(model.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ModelCard({
  model,
  index,
  isActive,
  isSaving,
  onSelect,
}: {
  model: AIModel;
  index: number;
  isActive: boolean;
  isSaving: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...popSpring,
        delay: Math.min(index * 0.03, 0.25),
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative flex w-full flex-col gap-3 overflow-hidden rounded-lg border bg-[var(--color-surface)] p-5 text-left outline-none transition-colors",
        isActive
          ? "border-[var(--color-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
      )}
    >
      {isActive ? (
        <motion.span
          layoutId="settings-active-ring"
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[var(--color-fg)]/8"
          transition={popSpring}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold">
              {model.name ?? model.id}
            </h3>
            {isActive ? <ActiveBadge saving={isSaving} /> : null}
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-fg-subtle)]">
            {model.id}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-subtle)]">
        {model.context_length ? (
          <span className="inline-flex items-center gap-1">
            <ContextIcon className="size-3" />
            {formatTokens(model.context_length)} ctx
          </span>
        ) : null}
        <PricingTag pricing={model.pricing ?? null} />
      </div>
    </motion.button>
  );
}

function ActiveBadge({ saving }: { saving: boolean }) {
  return (
    <span className="inline-flex h-4 shrink-0 items-center gap-1 rounded-full bg-[var(--color-fg)] px-1.5 text-[9px] font-medium uppercase tracking-wider text-[var(--color-surface)]">
      {saving ? (
        <SpinnerIcon className="size-2.5 animate-spin" />
      ) : (
        <DotIcon className="size-1.5" />
      )}
      Active
    </span>
  );
}

function PricingTag({
  pricing,
}: {
  pricing: { prompt?: string | null; completion?: string | null } | null;
}) {
  if (!pricing) return null;
  const inPrice = formatPerMillion(pricing.prompt);
  const outPrice = formatPerMillion(pricing.completion);
  if (!inPrice && !outPrice) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <CoinIcon className="size-3" />
      {inPrice ?? "—"} / {outPrice ?? "—"} per 1M
    </span>
  );
}

function formatPerMillion(value: string | null | undefined): string | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return null;
  const perMillion = n * 1_000_000;
  if (perMillion >= 100) return `$${perMillion.toFixed(0)}`;
  if (perMillion >= 10) return `$${perMillion.toFixed(1)}`;
  return `$${perMillion.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function ContextIcon(props: SVGProps<SVGSVGElement>) {
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
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10v4M11 10v4M15 10v4M19 10v4" />
    </svg>
  );
}

function CoinIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5h4a2 2 0 1 1 0 4h-2a2 2 0 1 0 0 4h4" />
    </svg>
  );
}

function DotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 8" fill="currentColor" {...props}>
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
}

function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  );
}
