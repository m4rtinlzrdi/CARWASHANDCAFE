CREATE TYPE "public"."catalog_group" AS ENUM('food', 'drink');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."kasir_sync_log_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."kasir_sync_queue_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'processing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'edc', 'qris_cashier');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."price_status" AS ENUM('confirmed', 'unconfirmed');--> statement-breakpoint
CREATE TYPE "public"."promotion_kind" AS ENUM('discount', 'info');--> statement-breakpoint
CREATE TYPE "public"."promotion_target_type" AS ENUM('item', 'category');--> statement-breakpoint
CREATE TYPE "public"."table_request_status" AS ENUM('pending', 'handled');--> statement-breakpoint
CREATE TYPE "public"."table_request_type" AS ENUM('waiter', 'bill');--> statement-breakpoint
CREATE TYPE "public"."table_type" AS ENUM('regular', 'vip', 'waiting');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TABLE "addon_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addon_categories_addon_category_unique" UNIQUE("addon_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"group" "catalog_group" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"kasir_product_id" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addons_price_nonnegative" CHECK ("addons"."price" >= 0),
	CONSTRAINT "addons_sort_order_nonnegative" CHECK ("addons"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"group" "catalog_group" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_sort_order_nonnegative" CHECK ("categories"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "menu_item_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_item_addons_item_addon_unique" UNIQUE("menu_item_id","addon_id")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"price_status" "price_status" DEFAULT 'confirmed' NOT NULL,
	"image_url" text,
	"labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"discount_type" "discount_type",
	"discount_value" integer,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"kasir_product_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_items_price_nonnegative" CHECK ("menu_items"."price" >= 0),
	CONSTRAINT "menu_items_sort_order_nonnegative" CHECK ("menu_items"."sort_order" >= 0),
	CONSTRAINT "menu_items_discount_valid" CHECK ((
        "menu_items"."discount_type" IS NULL AND "menu_items"."discount_value" IS NULL AND "menu_items"."start_at" IS NULL AND "menu_items"."end_at" IS NULL
      ) OR (
        "menu_items"."discount_type" = 'percentage' AND "menu_items"."discount_value" BETWEEN 1 AND 100 AND "menu_items"."start_at" IS NOT NULL AND "menu_items"."end_at" IS NOT NULL AND "menu_items"."end_at" > "menu_items"."start_at"
      ) OR (
        "menu_items"."discount_type" = 'fixed' AND "menu_items"."discount_value" > 0 AND "menu_items"."start_at" IS NOT NULL AND "menu_items"."end_at" IS NOT NULL AND "menu_items"."end_at" > "menu_items"."start_at"
      ))
);
--> statement-breakpoint
CREATE TABLE "menu_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_difference" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_variants_item_name_unique" UNIQUE("menu_item_id","name"),
	CONSTRAINT "menu_variants_sort_order_nonnegative" CHECK ("menu_variants"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "promotion_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"target_type" "promotion_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_targets_promotion_target_unique" UNIQUE("promotion_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"kind" "promotion_kind" NOT NULL,
	"discount_type" "discount_type",
	"discount_value" integer,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_end_after_start" CHECK ("promotions"."end_at" > "promotions"."start_at"),
	CONSTRAINT "promotions_sort_order_nonnegative" CHECK ("promotions"."sort_order" >= 0),
	CONSTRAINT "promotions_discount_valid" CHECK ((
        "promotions"."kind" = 'info' AND "promotions"."discount_type" IS NULL AND "promotions"."discount_value" IS NULL
      ) OR (
        "promotions"."kind" = 'discount' AND "promotions"."discount_type" = 'percentage' AND "promotions"."discount_value" BETWEEN 1 AND 100
      ) OR (
        "promotions"."kind" = 'discount' AND "promotions"."discount_type" = 'fixed' AND "promotions"."discount_value" > 0
      ))
);
--> statement-breakpoint
CREATE TABLE "table_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "table_sessions_id_table_unique" UNIQUE("id","table_id"),
	CONSTRAINT "table_sessions_close_after_open" CHECK ("table_sessions"."closed_at" IS NULL OR "table_sessions"."closed_at" >= "table_sessions"."opened_at")
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" text NOT NULL,
	"table_name" text NOT NULL,
	"table_type" "table_type" NOT NULL,
	"qr_token" text NOT NULL,
	"qr_regenerated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tables_table_number_unique" UNIQUE("table_number"),
	CONSTRAINT "tables_qr_token_unique" UNIQUE("qr_token"),
	CONSTRAINT "tables_qr_token_length" CHECK (length("tables"."qr_token") = 16),
	CONSTRAINT "tables_sort_order_nonnegative" CHECK ("tables"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"changes" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kasir_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"status" "kasir_sync_log_status" NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kasir_sync_logs_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "kasir_sync_logs_retry_count_nonnegative" CHECK ("kasir_sync_logs"."retry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kasir_sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "kasir_sync_queue_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kasir_sync_queue_order_unique" UNIQUE("order_id"),
	CONSTRAINT "kasir_sync_queue_retry_count_nonnegative" CHECK ("kasir_sync_queue"."retry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "table_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "table_request_type" NOT NULL,
	"status" "table_request_status" DEFAULT 'pending' NOT NULL,
	"handled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "table_requests_handler_matches_status" CHECK (("table_requests"."status" = 'pending' AND "table_requests"."handled_by" IS NULL) OR ("table_requests"."status" = 'handled' AND "table_requests"."handled_by" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "order_counters" (
	"date" date PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_counters_last_number_nonnegative" CHECK ("order_counters"."last_number" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"price_snapshot" integer NOT NULL,
	"variant_snapshot" jsonb,
	"addons_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discount_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"line_total" integer NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_price_nonnegative" CHECK ("order_items"."price_snapshot" >= 0),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_line_total_nonnegative" CHECK ("order_items"."line_total" >= 0),
	CONSTRAINT "order_items_void_reason_required" CHECK (("order_items"."voided_at" IS NULL AND "order_items"."void_reason" IS NULL) OR ("order_items"."voided_at" IS NOT NULL AND "order_items"."void_reason" IS NOT NULL AND length(trim("order_items"."void_reason")) > 0))
);
--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"public_token" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"session_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"table_id" uuid NOT NULL,
	"location_snapshot" text NOT NULL,
	"vehicle_plate" text,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"tax" integer NOT NULL,
	"total" integer NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_method" "payment_method",
	"paid_at" timestamp with time zone,
	"paid_by" uuid,
	"needs_cashier_adjustment" boolean DEFAULT false NOT NULL,
	"order_status" "order_status" DEFAULT 'received' NOT NULL,
	"cancel_reason" text,
	"consent_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_amounts_nonnegative" CHECK ("orders"."subtotal" >= 0 AND "orders"."discount" >= 0 AND "orders"."tax" >= 0 AND "orders"."total" >= 0),
	CONSTRAINT "orders_tax_rate_range" CHECK ("orders"."tax_rate" >= 0 AND "orders"."tax_rate" <= 100),
	CONSTRAINT "orders_payment_state_consistent" CHECK ((
        "orders"."payment_status" = 'unpaid' AND "orders"."payment_method" IS NULL AND "orders"."paid_at" IS NULL
      ) OR (
        "orders"."payment_status" = 'paid' AND "orders"."payment_method" IS NOT NULL AND "orders"."paid_at" IS NOT NULL
      )),
	CONSTRAINT "orders_cancel_reason_required" CHECK (("orders"."order_status" = 'cancelled' AND "orders"."cancel_reason" IS NOT NULL AND length(trim("orders"."cancel_reason")) > 0) OR ("orders"."order_status" <> 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" integer NOT NULL,
	"received_by" uuid,
	"paid_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_order_unique" UNIQUE("order_id"),
	CONSTRAINT "payments_amount_nonnegative" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone,
	"ip" text,
	"user_agent" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "sessions_expiry_after_creation" CHECK ("sessions"."expires_at" > "sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "user_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_recovery_codes_user_hash_unique" UNIQUE("user_id","code_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"totp_secret_ciphertext" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_failed_attempts_nonnegative" CHECK ("users"."failed_attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "addon_categories" ADD CONSTRAINT "addon_categories_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_categories" ADD CONSTRAINT "addon_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_addons" ADD CONSTRAINT "menu_item_addons_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_addons" ADD CONSTRAINT "menu_item_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_variants" ADD CONSTRAINT "menu_variants_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasir_sync_logs" ADD CONSTRAINT "kasir_sync_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasir_sync_queue" ADD CONSTRAINT "kasir_sync_queue_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_requests" ADD CONSTRAINT "table_requests_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_requests" ADD CONSTRAINT "table_requests_session_table_matches_table_session" FOREIGN KEY ("session_id","table_id") REFERENCES "public"."table_sessions"("id","table_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_table_matches_table_session" FOREIGN KEY ("session_id","table_id") REFERENCES "public"."table_sessions"("id","table_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recovery_codes" ADD CONSTRAINT "user_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addon_categories_category_idx" ON "addon_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "addons_group_active_sort_idx" ON "addons" USING btree ("group","is_active","sort_order");--> statement-breakpoint
CREATE INDEX "categories_group_sort_active_idx" ON "categories" USING btree ("group","sort_order","is_active");--> statement-breakpoint
CREATE INDEX "menu_item_addons_addon_idx" ON "menu_item_addons" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "menu_items_category_sort_active_idx" ON "menu_items" USING btree ("category_id","sort_order") WHERE "menu_items"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "menu_items_available_status_idx" ON "menu_items" USING btree ("is_available","price_status");--> statement-breakpoint
CREATE INDEX "menu_variants_item_sort_idx" ON "menu_variants" USING btree ("menu_item_id","sort_order");--> statement-breakpoint
CREATE INDEX "promotion_targets_target_idx" ON "promotion_targets" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "promotions_active_window_idx" ON "promotions" USING btree ("is_active","start_at","end_at");--> statement-breakpoint
CREATE UNIQUE INDEX "table_sessions_one_open_per_table_unique" ON "table_sessions" USING btree ("table_id") WHERE "table_sessions"."closed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "table_sessions_table_opened_idx" ON "table_sessions" USING btree ("table_id","opened_at");--> statement-breakpoint
CREATE INDEX "tables_active_sort_idx" ON "tables" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" USING btree ("entity","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "kasir_sync_logs_order_created_idx" ON "kasir_sync_logs" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "kasir_sync_logs_status_next_attempt_idx" ON "kasir_sync_logs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "kasir_sync_queue_status_next_attempt_idx" ON "kasir_sync_queue" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "table_requests_session_created_idx" ON "table_requests" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "table_requests_status_created_idx" ON "table_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_menu_item_idx" ON "order_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "order_status_logs_order_created_idx" ON "order_status_logs" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_payment_idx" ON "orders" USING btree ("order_status","payment_status");--> statement-breakpoint
CREATE INDEX "orders_table_idx" ON "orders" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "orders_payment_paid_at_idx" ON "orders" USING btree ("payment_status","paid_at");--> statement-breakpoint
CREATE INDEX "sessions_user_expiry_idx" ON "sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_recovery_codes_user_used_idx" ON "user_recovery_codes" USING btree ("user_id","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_role_active_idx" ON "users" USING btree ("role","is_active");