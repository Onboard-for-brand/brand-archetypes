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
        <div className="mb-8 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Onboarding for Brand"
            className="h-7 w-auto select-none"
            draggable={false}
          />
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <LoginForm next={next} />
        </div>
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
