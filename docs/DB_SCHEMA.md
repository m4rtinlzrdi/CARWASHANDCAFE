# Database Schema & Migration Notes

**Scope:** F1-T03 schema and versioned migrations. No seed data or database connection is included.

## Schema map

The Drizzle schema lives in `db/schema/` and is exported from `db/schema/index.ts`.

| Area | Tables |
| --- | --- |
| Owner/Staff credentials | `users`, `user_recovery_codes`, `sessions` |
| Catalog and merchandising | `categories`, `menu_items`, `menu_variants`, `addons`, `addon_categories`, `menu_item_addons`, `promotions`, `promotion_targets` |
| Locations and guest orders | `tables`, `table_sessions`, `orders`, `order_counters`, `order_items`, `order_status_logs`, `payments` |
| Operations and audit | `table_requests`, `kasir_sync_queue`, `kasir_sync_logs`, `settings`, `audit_logs` |

There are 23 tables and 14 PostgreSQL enums. Their values are presentation-independent: roles `owner/staff`; catalog groups `food/drink`; price status `confirmed/unconfirmed`; discount types `percentage/fixed`; promotion kinds `discount/info` and targets `item/category`; table types `regular/vip/waiting`; payment status `unpaid/paid` and methods `cash/edc/qris_cashier`; order status `received/processing/ready/completed/cancelled`; table request types `waiter/bill` and statuses `pending/handled`; cashier queue status `pending/processing/sent/failed`; cashier log status `pending/sent/failed`. The Indonesian UI will map labels separately.

The schema intentionally has no `customer_accounts` or `payment_events` tables and contains no sample/business rows.

## Integrity and storage decisions

- UUID primary keys use PostgreSQL `gen_random_uuid()` defaults. `order_counters.date` is the documented natural primary key for the Asia/Jakarta order-numbering date, so that one table has no extra `id`.
- Timestamps use `timestamptz`; money amounts are integer rupiah. The order tax-rate snapshot is `numeric(5,2)`.
- The only payment methods represented are `cash`, `edc`, and `qris_cashier`; there is no gateway/payment route schema. `orders.payment_status` is limited to unpaid/paid, and a paid row must have both `paid_at` and `payment_method` set.
- Order rows store price, discount, tax, and total snapshots; line rows preserve product name, price, variant, add-ons, discount, quantity, and line total. Void reasons and cancellation reasons are required when their corresponding states are set.
- Foreign keys use `ON DELETE RESTRICT` for historical/order references. Catalog and location records carry soft-delete/active fields. A partial unique index permits only one open `table_session` per location.
- Orders and table requests use a composite `(session_id, table_id)` FK to `table_sessions(id, table_id)`, preventing a session from being paired with another location.
- Menu item discount fields must be all unset or form a valid discount with a start/end window; percentage discounts are 1–100. Promotion end times must be after start times, and information-only promotions cannot carry discount values. Final price calculations and protection against negative discounted totals remain the later centralized server-pricing task.
- `promotion_targets.target_id` is polymorphic as specified. Migration triggers validate item/category targets with a row lock and prevent hard deletion while referenced; use the documented soft-delete flow instead.
- The migrations enable RLS on all 23 tables and intentionally create no policies for `anon` or `authenticated`. Server access must use the controlled server-only database boundary.
- `audit_logs` reject `UPDATE`, `DELETE`, and `TRUNCATE`. Database triggers maintain `updated_at` on the 20 mutable non-log tables.
- Cashier request/response and error fields are storage only; the future adapter must redact secrets and minimize PII before writing payloads.
- TOTP ciphertext, password hashes, recovery-code hashes, and session-token hashes are represented as fields only. Encryption, hashing, auth flows, data retention/anonymization, and transactional payment enforcement are not implemented by this schema task.

## Migration workflow

- `npm run db:generate` creates versioned SQL from the Drizzle schema without connecting to PostgreSQL.
- `npm run db:migrate` applies the checked-in Drizzle migrations and requires `DATABASE_URL`; the config loads local environment files only for this command and fails with a value-free message if the URL is absent.
- Review generated SQL before applying it. Apply only to an explicitly approved safe local/staging database during verification. Do not use unversioned `drizzle-kit push`, reset a database, or apply this initial migration to production as part of F1-T03.
- This task generated and reviewed the migration files but did **not** apply them. No database credentials were inspected and no connection was attempted.

See `docs/TEST_REPORT.md` for verification evidence and limitations.
