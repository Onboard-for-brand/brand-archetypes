"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Sign in failed");
        setIsSubmitting(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
        disabled={isSubmitting}
      />

      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        required
        disabled={isSubmitting}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !email || !password}
        className="mt-1 inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-fg)] px-4 text-sm font-medium text-[var(--color-surface)] transition-colors hover:bg-[oklch(0.28_0_0)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
  disabled,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-[var(--color-fg-muted)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none transition-colors placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-fg)] focus:ring-2 focus:ring-[var(--color-fg)]/10 disabled:opacity-50"
      />
    </div>
  );
}
