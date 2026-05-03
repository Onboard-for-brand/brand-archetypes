import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectString = process.env.NEONDB_CONNECT_STRING;

if (!connectString) {
  throw new Error("NEONDB_CONNECT_STRING is not set. Add it to .env.local.");
}

const sql = neon(connectString);

export const db = drizzle(sql, { schema });
