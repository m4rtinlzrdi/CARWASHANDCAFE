import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { tableTypeEnum } from "./enums";
import { users } from "./users";

export const tables = pgTable(
  "tables",
  {
    id: id(),
    tableNumber: text("table_number").notNull(),
    tableName: text("table_name").notNull(),
    tableType: tableTypeEnum("table_type").notNull(),
    qrToken: text("qr_token").notNull(),
    qrRegeneratedAt: timestamp("qr_regenerated_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("tables_table_number_unique").on(table.tableNumber),
    unique("tables_qr_token_unique").on(table.qrToken),
    index("tables_active_sort_idx").on(table.isActive, table.sortOrder),
    check("tables_qr_token_length", sql`length(${table.qrToken}) = 16`),
    check("tables_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const tableSessions = pgTable(
  "table_sessions",
  {
    id: id(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "restrict" }),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("table_sessions_id_table_unique").on(table.id, table.tableId),
    uniqueIndex("table_sessions_one_open_per_table_unique")
      .on(table.tableId)
      .where(sql`${table.closedAt} IS NULL`),
    index("table_sessions_table_opened_idx").on(table.tableId, table.openedAt),
    check(
      "table_sessions_close_after_open",
      sql`${table.closedAt} IS NULL OR ${table.closedAt} >= ${table.openedAt}`,
    ),
  ],
);

export const tablesRelations = relations(tables, ({ many }) => ({ sessions: many(tableSessions) }));

export const tableSessionsRelations = relations(tableSessions, ({ one }) => ({
  table: one(tables, { fields: [tableSessions.tableId], references: [tables.id] }),
  closedByUser: one(users, { fields: [tableSessions.closedBy], references: [users.id] }),
}));
