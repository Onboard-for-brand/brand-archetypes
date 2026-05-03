import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { accessCodes } from "@/db/schema";
import { getAdminFromCookie } from "@/lib/auth/session";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  // Defense-in-depth alongside middleware
  const session = await getAdminFromCookie();
  if (!session) {
    redirect("/admin/login");
  }

  const codes = await db
    .select()
    .from(accessCodes)
    .orderBy(desc(accessCodes.createdAt));

  return (
    <AdminDashboard
      adminEmail={String(session.sub)}
      initialCodes={codes.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      }))}
    />
  );
}
