import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { getServerEnv } from "@/lib/env";
import { schema } from "@/db/schema";

type DatabaseGlobal = typeof globalThis & {
  __asiaPostgresClient?: Sql;
  __asiaDrizzleDatabase?: PostgresJsDatabase<typeof schema>;
};

const globalForDatabase = globalThis as DatabaseGlobal;

/**
 * Create the lazy Drizzle connection only when server code first needs it.
 * Remote database connections require TLS encryption; local Postgres can remain
 * unencrypted for development. `prepare: false` supports
 * Supabase transaction poolers.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  const { DATABASE_URL, NODE_ENV } = getServerEnv();

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required before opening a database connection.");
  }

  if (!globalForDatabase.__asiaPostgresClient) {
    const hostname = new URL(DATABASE_URL).hostname.replace(/^\[|\]$/g, "");
    const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(hostname);

    globalForDatabase.__asiaPostgresClient = postgres(DATABASE_URL, {
      max: NODE_ENV === "development" ? 1 : 5,
      prepare: false,
      ssl: isLocalDatabase ? false : "require",
      connect_timeout: 10,
      idle_timeout: 20,
    });
  }

  if (!globalForDatabase.__asiaDrizzleDatabase) {
    globalForDatabase.__asiaDrizzleDatabase = drizzle(
      globalForDatabase.__asiaPostgresClient,
      { schema },
    );
  }

  return globalForDatabase.__asiaDrizzleDatabase;
}
