import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { orderStatusEnum, paymentMethodEnum, paymentStatusEnum } from "./enums";
import { menuItems } from "./catalog";
import { tableSessions } from "./locations";
import { users } from "./users";

export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: text("order_number").notNull(),
    publicToken: text("public_token").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    sessionId: uuid("session_id").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    tableId: uuid("table_id").notNull(),
    locationSnapshot: text("location_snapshot").notNull(),
    vehiclePlate: text("vehicle_plate"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    paymentMethod: paymentMethodEnum("payment_method"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: uuid("paid_by").references(() => users.id, { onDelete: "restrict" }),
    needsCashierAdjustment: boolean("needs_cashier_adjustment").notNull().default(false),
    orderStatus: orderStatusEnum("order_status").notNull().default("received"),
    cancelReason: text("cancel_reason"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("orders_order_number_unique").on(table.orderNumber),
    unique("orders_public_token_unique").on(table.publicToken),
    unique("orders_idempotency_key_unique").on(table.idempotencyKey),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_status_payment_idx").on(table.orderStatus, table.paymentStatus),
    index("orders_table_idx").on(table.tableId),
    index("orders_updated_at_idx").on(table.updatedAt),
    index("orders_payment_paid_at_idx").on(table.paymentStatus, table.paidAt),
    foreignKey({
      columns: [table.sessionId, table.tableId],
      foreignColumns: [tableSessions.id, tableSessions.tableId],
      name: "orders_session_table_matches_table_session",
    }).onDelete("restrict"),
    check(
      "orders_amounts_nonnegative",
      sql`${table.subtotal} >= 0 AND ${table.discount} >= 0 AND ${table.tax} >= 0 AND ${table.total} >= 0`,
    ),
    check(
      "orders_tax_rate_range",
      sql`${table.taxRate} >= 0 AND ${table.taxRate} <= 100`,
    ),
    check(
      "orders_payment_state_consistent",
      sql`(
        ${table.paymentStatus} = 'unpaid' AND ${table.paymentMethod} IS NULL AND ${table.paidAt} IS NULL
      ) OR (
        ${table.paymentStatus} = 'paid' AND ${table.paymentMethod} IS NOT NULL AND ${table.paidAt} IS NOT NULL
      )`,
    ),
    check(
      "orders_cancel_reason_required",
      sql`(${table.orderStatus} = 'cancelled' AND ${table.cancelReason} IS NOT NULL AND length(trim(${table.cancelReason})) > 0) OR (${table.orderStatus} <> 'cancelled')`,
    ),
  ],
);

export const orderCounters = pgTable(
  "order_counters",
  {
    date: date("date", { mode: "string" }).primaryKey(),
    lastNumber: integer("last_number").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [check("order_counters_last_number_nonnegative", sql`${table.lastNumber} >= 0`)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict" }),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    priceSnapshot: integer("price_snapshot").notNull(),
    variantSnapshot: jsonb("variant_snapshot").$type<Record<string, unknown> | null>(),
    addonsSnapshot: jsonb("addons_snapshot").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
    discountSnapshot: jsonb("discount_snapshot").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    lineTotal: integer("line_total").notNull(),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_menu_item_idx").on(table.menuItemId),
    check("order_items_price_nonnegative", sql`${table.priceSnapshot} >= 0`),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_line_total_nonnegative", sql`${table.lineTotal} >= 0`),
    check(
      "order_items_void_reason_required",
      sql`(${table.voidedAt} IS NULL AND ${table.voidReason} IS NULL) OR (${table.voidedAt} IS NOT NULL AND ${table.voidReason} IS NOT NULL AND length(trim(${table.voidReason})) > 0)`,
    ),
  ],
);

export const orderStatusLogs = pgTable(
  "order_status_logs",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull(),
    changedBy: uuid("changed_by").references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [index("order_status_logs_order_created_idx").on(table.orderId, table.createdAt)],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    method: paymentMethodEnum("method").notNull(),
    amount: integer("amount").notNull(),
    receivedBy: uuid("received_by").references(() => users.id, { onDelete: "restrict" }),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("payments_order_unique").on(table.orderId),
    check("payments_amount_nonnegative", sql`${table.amount} >= 0`),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tableSession: one(tableSessions, {
    fields: [orders.sessionId, orders.tableId],
    references: [tableSessions.id, tableSessions.tableId],
  }),
  paidByUser: one(users, { fields: [orders.paidBy], references: [users.id] }),
  items: many(orderItems),
  statusLogs: many(orderStatusLogs),
  payment: one(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  order: one(orders, { fields: [orderStatusLogs.orderId], references: [orders.id] }),
  changedByUser: one(users, { fields: [orderStatusLogs.changedBy], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  receivedByUser: one(users, { fields: [payments.receivedBy], references: [users.id] }),
}));
