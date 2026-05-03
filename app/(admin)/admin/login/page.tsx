import { redirect } from "next/navigation";
import { getAdminFromCookie } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const session = await getAdminFromCookie();
  const { from } = await searchParams;
  const next = sanitizeNext(from);

  if (session) {
    redirect(next);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-9 items-center justify-center rounded-md bg-[var(--color-fg)] text-[var(--color-surface)]">
            <span className="font-mono text-sm font-semibold">OB</span>
          </div>
          <h1 className="text-base font-semibold tracking-tight">
            Sign in to Admin
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Onboarding for Brand · Console
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-fg-subtle)]">
          Authorized personnel only.
        </p>
      </div>
    </main>
  );
}

function sanitizeNext(from: string | undefined): string {
  if (!from) return "/admin";
  if (!from.startsWith("/")) return "/admin";
  if (from.startsWith("//")) return "/admin";
  if (from.startsWith("/admin/login")) return "/admin";
  return from;
}
