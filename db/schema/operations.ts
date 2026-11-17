import { relations, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { kasirSyncLogStatusEnum, kasirSyncQueueStatusEnum, tableRequestStatusEnum, tableRequestTypeEnum } from "./enums";
import { orders } from "./orders";
import { tableSessions } from "./locations";
import { users } from "./users";

export const tableRequests = pgTable(
  "table_requests",
  {
    id: id(),
    tableId: uuid("table_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    type: tableRequestTypeEnum("type").notNull(),
    status: tableRequestStatusEnum("status").notNull().default("pending"),
    handledBy: uuid("handled_by").references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("table_requests_session_created_idx").on(table.sessionId, table.createdAt),
    index("table_requests_status_created_idx").on(table.status, table.createdAt),
    foreignKey({
      columns: [table.sessionId, table.tableId],
      foreignColumns: [tableSessions.id, tableSessions.tableId],
      name: "table_requests_session_table_matches_table_session",
    }).onDelete("restrict"),
    check(
      "table_requests_handler_matches_status",
      sql`(${table.status} = 'pending' AND ${table.handledBy} IS NULL) OR (${table.status} = 'handled' AND ${table.handledBy} IS NOT NULL)`,
    ),
  ],
);

export const kasirSyncQueue = pgTable(
  "kasir_sync_queue",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    status: kasirSyncQueueStatusEnum("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("kasir_sync_queue_order_unique").on(table.orderId),
    index("kasir_sync_queue_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
    check("kasir_sync_queue_retry_count_nonnegative", sql`${table.retryCount} >= 0`),
  ],
);

export const kasirSyncLogs = pgTable(
  "kasir_sync_logs",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull(),
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>().notNull(),
    responsePayload: jsonb("response_payload").$type<Record<string, unknown> | null>(),
    status: kasirSyncLogStatusEnum("status").notNull(),
    retryCount: integer("retry_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
  },
  (table) => [
    unique("kasir_sync_logs_idempotency_key_unique").on(table.idempotencyKey),
    index("kasir_sync_logs_order_created_idx").on(table.orderId, table.createdAt),
    index("kasir_sync_logs_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
    check("kasir_sync_logs_retry_count_nonnegative", sql`${table.retryCount} >= 0`),
  ],
);

export const settings = pgTable(
  "settings",
  {
    id: id(),
    key: text("key").notNull(),
    value: jsonb("value").$type<unknown>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [unique("settings_key_unique").on(table.key)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    changes: jsonb("changes").$type<Record<string, unknown> | null>(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_entity_created_idx").on(table.entity, table.entityId, table.createdAt),
  ],
);

export const tableRequestsRelations = relations(tableRequests, ({ one }) => ({
  tableSession: one(tableSessions, {
    fields: [tableRequests.sessionId, tableRequests.tableId],
    references: [tableSessions.id, tableSessions.tableId],
  }),
  handledByUser: one(users, { fields: [tableRequests.handledBy], references: [users.id] }),
}));

export const kasirSyncQueueRelations = relations(kasirSyncQueue, ({ one }) => ({
  order: one(orders, { fields: [kasirSyncQueue.orderId], references: [orders.id] }),
}));

export const kasirSyncLogsRelations = relations(kasirSyncLogs, ({ one }) => ({
  order: one(orders, { fields: [kasirSyncLogs.orderId], references: [orders.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
