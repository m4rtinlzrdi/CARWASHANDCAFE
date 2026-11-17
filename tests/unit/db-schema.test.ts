import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = resolve(process.cwd(), "db/migrations");
const initialMigration = readFileSync(resolve(migrationsDirectory, "0000_initial_schema.sql"), "utf8");
const integrityMigration = readFileSync(resolve(migrationsDirectory, "0001_rls_and_integrity_triggers.sql"), "utf8");
const journal = JSON.parse(readFileSync(resolve(migrationsDirectory, "meta/_journal.json"), "utf8")) as {
  entries: Array<{ idx: number; tag: string }>;
};

const expectedTables = [
  "addon_categories",
  "addons",
  "audit_logs",
  "categories",
  "kasir_sync_logs",
  "kasir_sync_queue",
  "menu_item_addons",
  "menu_items",
  "menu_variants",
  "order_counters",
  "order_items",
  "order_status_logs",
  "orders",
  "payments",
  "promotion_targets",
  "promotions",
  "sessions",
  "settings",
  "table_requests",
  "table_sessions",
  "tables",
  "user_recovery_codes",
  "users",
].sort();

const tableNames = (sql: string) =>
  [...sql.matchAll(/CREATE TABLE "([^\"]+)"/g)].map((match) => match[1]).sort();

describe("versioned database schema", () => {
  it("contains the required 23-table inventory and ordered migration journal", () => {
    const createdTables = tableNames(initialMigration);
    const rlsTables = [...integrityMigration.matchAll(/ALTER TABLE "public"\."([^\"]+)" ENABLE ROW LEVEL SECURITY/g)]
      .map((match) => match[1])
      .sort();

    expect(createdTables).toEqual(expectedTables);
    expect(createdTables).toHaveLength(23);
    expect([...initialMigration.matchAll(/CREATE TYPE "public"\./g)]).toHaveLength(14);
    expect(rlsTables).toEqual(expectedTables);
    expect(journal.entries.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_initial_schema" },
      { idx: 1, tag: "0001_rls_and_integrity_triggers" },
    ]);
  });

  it("preserves critical money, payment, history, and polling constraints", () => {
    expect(initialMigration).toContain('"menu_items_price_nonnegative" CHECK ("menu_items"."price" >= 0)');
    expect(initialMigration).toContain('"order_items_quantity_positive" CHECK ("order_items"."quantity" > 0)');
    expect(initialMigration).toContain('"menu_items"."discount_value" BETWEEN 1 AND 100');
    expect(initialMigration).toContain('"promotions"."discount_value" BETWEEN 1 AND 100');
    expect(initialMigration).toContain('"promotions"."end_at" > "promotions"."start_at"');
    expect(initialMigration).toContain('"orders"."payment_status" = \'paid\' AND "orders"."payment_method" IS NOT NULL AND "orders"."paid_at" IS NOT NULL');
    expect(initialMigration).toContain('FOREIGN KEY ("session_id","table_id") REFERENCES "public"."table_sessions"("id","table_id") ON DELETE restrict');
    expect(initialMigration).toContain('CREATE INDEX "orders_created_at_idx"');
    expect(initialMigration).toContain('CREATE INDEX "orders_status_payment_idx"');
    expect(initialMigration).toContain('CREATE INDEX "orders_table_idx"');
    expect(initialMigration).toContain('CREATE INDEX "orders_updated_at_idx"');
    expect(initialMigration).toContain('WHERE "menu_items"."deleted_at" IS NULL');
    expect(initialMigration).toContain('CREATE UNIQUE INDEX "table_sessions_one_open_per_table_unique"');
  });

  it("enables default-deny RLS and adds append-only, updated-at, and polymorphic-target integrity", () => {
    expect(integrityMigration.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(23);
    expect(integrityMigration).not.toMatch(/CREATE\s+POLICY/i);
    expect(integrityMigration.match(/CREATE TRIGGER .* BEFORE UPDATE ON /g)).toHaveLength(20);
    expect(integrityMigration).toContain('BEFORE UPDATE OR DELETE ON "public"."audit_logs"');
    expect(integrityMigration).toContain('BEFORE TRUNCATE ON "public"."audit_logs"');
    expect(integrityMigration).toContain("CREATE OR REPLACE FUNCTION public.validate_promotion_target()");
    expect(integrityMigration).toContain("FOR KEY SHARE");
    expect(integrityMigration).toContain("prevent_referenced_promotion_target_delete");
    expect(integrityMigration).toContain("menu_items_protect_promotion_targets");
    expect(integrityMigration).toContain("categories_protect_promotion_targets");
    expect(`${initialMigration}\n${integrityMigration}`).not.toMatch(/\b(DROP DATABASE|DROP SCHEMA|DROP TABLE|TRUNCATE TABLE|DELETE FROM|INSERT INTO)\b/i);
  });
});
