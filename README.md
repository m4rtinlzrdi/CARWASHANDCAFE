# ASIA Car Wash & Cafe — Digital Menu & Cashier System (prototype)

A working prototype of the ASIA ordering system: mobile-first table QR/NFC menu, cash-only
ordering, and a separate authenticated admin/cashier area with daily closing.

## Run locally
    npm install
    npm run dev      # development server
    npm run build    # single self-contained dist/index.html preview

## Routes
- Customer menu: `index.html?table=01` … `?table=23`, `?table=VIP` (also `/menu?table=01` when the
  host rewrites paths to `index.html`). Without a valid table parameter the guest sees a table picker.
- Staff access: the discreet "Staff access" link in the customer menu footer, or `#/admin/login`.
- Admin pages: `#/admin/overview`, `orders`, `menu`, `categories`, `promotions`, `tables`,
  `closings`, `settings`, `change-password`. Every admin page renders the login gate when signed out.
- Hashing: `hash` routing is used for admin pages so the prototype works on static hosting without
  server rewrite rules. If you deploy behind a router, `/admin/...` paths are also parsed.

## Admin credentials
Username `admin`, password `asia123` (initial development credential). You are required to set a new
password on first sign-in. No plaintext password is present in the bundle: only a PBKDF2-SHA256 hash
plus a random salt is stored, and comparisons are constant-time.

## Implemented
Customer
- Automatic table identification from the URL, validated against table records; inactive/invalid tables
  show a clear notice; all 24 identities supported.
- Menu from live product records: categories, signature badges, sold-out states, stock awareness.
- Detail sheet with variants, add-ons, per-item special instructions, quantity, live total; bottom sheet
  on mobile, centered modal on desktop.
- Cart with per-line quantities/removal/customisation display, cart persistence, idempotent checkout
  (duplicate submissions cannot create two orders), price recomputation at submission.
- Cash-only payment: orders are created **UNPAID** and only staff can mark them paid.
- Success screen with order number, table, items, total, payment status and live status progress.

Admin / cashier
- Separate login page and layout, session with 8h expiry, forced first-login password change,
  sign-out, change password, login throttling.
- Orders: operational summary, status tabs, search by order/table/product, today/yesterday/custom/all,
  outstanding-only filter, compact table (mobile card layout), stage-aware actions, order detail,
  cash payment verification with `paidAt`/`paidBy`, payment reopening with audit entry.
- **Reset Harian**: closing confirmation with live figures, mandatory acknowledgement, immutable
  closing snapshot, double-closing blocked per business date, historical orders retained and marked
  read-only, closing history with report + CSV export + print, outstanding payments list.
- Menu Management: KPI cards from real records, premium product grid with search/category/availability/
  low-stock filters, bulk activate/deactivate/change-category/archive, duplicate, delete, SKU
  uniqueness, live customer-card preview, two-column editor (form + preview) matching the reference,
  variants and add-ons with availability and price deltas, optional inventory with stock movements and
  low-stock alerts.
- Table Management: 24 tables, unique permanent URL + real QR code, copy/download, active toggle,
  printable sheet of all 24 labels, embedded customer preview.
- Categories, Promotions (live preview), Settings (business name, display name, sound, password,
  audit log, demo reset/simulate order), Overview with cash KPIs and sales chart.

Data
- Storage keys: `asia_products`, `asia_categories`, `asia_orders`, `asia_settings`, `asia_tables`
  plus `asia_closings`, `asia_audit`, `asia_stock`. An older demo schema is migrated automatically.
- Tabs of the same browser stay in sync via BroadcastChannel with a `storage`-event fallback.

## Known limitations
- **No backend yet.** Data is authoritative only in this browser's localStorage; orders do not reach
  other devices/users. The UI talks to a single store module so it can be moved behind an API.
- **Authentication is client-side.** It hashes and guards routes in the browser, which demonstrates the
  flow but cannot enforce security. Production requires server-side auth, row-level security and
  server-side price/payment validation (Supabase/Postgres recommended).
- Image uploads are compressed to data URLs in localStorage (small quota); production needs cloud storage.
- Cash verification is manual by design; there is no payment gateway, no QRIS, and no automatic paid status.
- The prototype is not print-optimised beyond the table QR label sheet.
