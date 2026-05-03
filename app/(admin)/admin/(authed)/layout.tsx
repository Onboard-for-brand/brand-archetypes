import { redirect } from "next/navigation";
import { getAdminFromCookie } from "@/lib/auth/session";
import { Sidebar } from "./Sidebar";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminFromCookie();
  if (!session) redirect("/admin/login");

  const email = typeof session.sub === "string" ? session.sub : "";

  return (
    <div className="flex min-h-dvh">
      <Sidebar email={email} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
