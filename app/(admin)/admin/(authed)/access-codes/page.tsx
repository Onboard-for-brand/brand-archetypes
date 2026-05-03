import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { accessCodes, type AccessCode } from "@/db/schema";
import { AccessCodesClient } from "./AccessCodesClient";

export const dynamic = "force-dynamic";

export default async function AccessCodesPage() {
  const rows: AccessCode[] = await db
    .select()
    .from(accessCodes)
    .orderBy(desc(accessCodes.createdAt));

  return <AccessCodesClient initialCodes={rows} />;
}
