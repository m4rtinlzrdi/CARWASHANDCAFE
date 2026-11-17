import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

const isApplyingMigrations = process.argv.includes("migrate");

if (isApplyingMigrations) {
  loadEnvConfig(process.cwd());
}

const databaseUrl = isApplyingMigrations ? process.env.DATABASE_URL : undefined;

if (isApplyingMigrations && !databaseUrl) {
  throw new Error("DATABASE_URL is required to apply migrations; no connection was attempted.");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: databaseUrl ? { url: databaseUrl } : undefined,
  strict: true,
  verbose: true,
});
