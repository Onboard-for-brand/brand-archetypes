import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  pgEnum,
  check,
  index,
} from "drizzle-orm/pg-core";

export const accessCodeStatus = pgEnum("access_code_status", [
  "issued",
  "active",
  "completed",
  "revoked",
]);

export const accessCodes = pgTable(
  "access_codes",
  {
    code: varchar("code", { length: 14 }).primaryKey(),
    status: accessCodeStatus("status").notNull().default("issued"),
    note: text("note"),
    recipientName: text("recipient_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "access_codes_code_format",
      sql`${table.code} ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'`,
    ),
    index("access_codes_status_idx").on(table.status),
    index("access_codes_created_at_idx").on(table.createdAt),
  ],
);

export type AccessCode = typeof accessCodes.$inferSelect;
export type NewAccessCode = typeof accessCodes.$inferInsert;
