ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."user_recovery_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."menu_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."addons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."addon_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."menu_item_addons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."promotion_targets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."tables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."table_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."order_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."order_status_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."table_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."kasir_sync_queue" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."kasir_sync_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER "users_set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "user_recovery_codes_set_updated_at" BEFORE UPDATE ON "public"."user_recovery_codes" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "sessions_set_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "menu_items_set_updated_at" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "menu_variants_set_updated_at" BEFORE UPDATE ON "public"."menu_variants" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "addons_set_updated_at" BEFORE UPDATE ON "public"."addons" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "addon_categories_set_updated_at" BEFORE UPDATE ON "public"."addon_categories" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "menu_item_addons_set_updated_at" BEFORE UPDATE ON "public"."menu_item_addons" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "promotions_set_updated_at" BEFORE UPDATE ON "public"."promotions" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "promotion_targets_set_updated_at" BEFORE UPDATE ON "public"."promotion_targets" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "tables_set_updated_at" BEFORE UPDATE ON "public"."tables" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "table_sessions_set_updated_at" BEFORE UPDATE ON "public"."table_sessions" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "order_counters_set_updated_at" BEFORE UPDATE ON "public"."order_counters" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "order_items_set_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "payments_set_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "table_requests_set_updated_at" BEFORE UPDATE ON "public"."table_requests" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "kasir_sync_queue_set_updated_at" BEFORE UPDATE ON "public"."kasir_sync_queue" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER "settings_set_updated_at" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
  RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE TRIGGER "audit_logs_no_update_delete" BEFORE UPDATE OR DELETE ON "public"."audit_logs" FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();--> statement-breakpoint
CREATE TRIGGER "audit_logs_no_truncate" BEFORE TRUNCATE ON "public"."audit_logs" FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_log_mutation();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.validate_promotion_target()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.target_type = 'item' THEN
    PERFORM 1 FROM public.menu_items WHERE id = NEW.target_id FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'promotion target menu item % does not exist', NEW.target_id
        USING ERRCODE = '23503';
    END IF;
  ELSIF NEW.target_type = 'category' THEN
    PERFORM 1 FROM public.categories WHERE id = NEW.target_id FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'promotion target category % does not exist', NEW.target_id
        USING ERRCODE = '23503';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER "promotion_targets_validate_target" BEFORE INSERT OR UPDATE OF "target_type", "target_id" ON "public"."promotion_targets" FOR EACH ROW EXECUTE FUNCTION public.validate_promotion_target();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.prevent_referenced_promotion_target_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.promotion_targets
    WHERE target_type = TG_ARGV[0]::public.promotion_target_type
      AND target_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'cannot hard-delete % % while a promotion targets it', TG_ARGV[0], OLD.id
      USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;--> statement-breakpoint

CREATE TRIGGER "menu_items_protect_promotion_targets" BEFORE DELETE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION public.prevent_referenced_promotion_target_delete('item');--> statement-breakpoint
CREATE TRIGGER "categories_protect_promotion_targets" BEFORE DELETE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION public.prevent_referenced_promotion_target_delete('category');
