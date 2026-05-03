import { defineConfig } from "drizzle-kit";

const connectString = process.env.NEONDB_CONNECT_STRING;

if (!connectString) {
  throw new Error("NEONDB_CONNECT_STRING is not set. Add it to .env.local.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: connectString,
  },
  strict: true,
  verbose: true,
});
