"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 border border-neutral-800 p-8"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Onboarding for Brand
        </p>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
          Email
        </span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-white"
        />
      </label>

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white px-3 py-2 text-sm font-bold uppercase tracking-widest text-black disabled:opacity-40"
      >
        {loading ? "..." : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
