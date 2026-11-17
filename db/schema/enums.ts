import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "staff"]);
export const catalogGroupEnum = pgEnum("catalog_group", ["food", "drink"]);
export const priceStatusEnum = pgEnum("price_status", ["confirmed", "unconfirmed"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
export const promotionKindEnum = pgEnum("promotion_kind", ["discount", "info"]);
export const promotionTargetTypeEnum = pgEnum("promotion_target_type", ["item", "category"]);
export const tableTypeEnum = pgEnum("table_type", ["regular", "vip", "waiting"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "edc", "qris_cashier"]);
export const orderStatusEnum = pgEnum("order_status", ["received", "processing", "ready", "completed", "cancelled"]);
export const tableRequestTypeEnum = pgEnum("table_request_type", ["waiter", "bill"]);
export const tableRequestStatusEnum = pgEnum("table_request_status", ["pending", "handled"]);
export const kasirSyncQueueStatusEnum = pgEnum("kasir_sync_queue_status", ["pending", "processing", "sent", "failed"]);
export const kasirSyncLogStatusEnum = pgEnum("kasir_sync_log_status", ["pending", "sent", "failed"]);
