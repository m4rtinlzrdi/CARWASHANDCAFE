# Work Queue

Source requirements: [`MASTER_PROMPT_v5.md`](MASTER_PROMPT_v5.md). Status is `TODO`, `IN PROGRESS`, `COMPLETED`, or `BLOCKED`. A phase/task marked `TODO` is not authorization to start it.

**Current branch:** `arena/aef8f2ab-carwashandcafe`
**Current phase:** Fase 0 — completed
**Next authorized work:** none until the owner says `lanjut`. The next task would be F1-T01.

## Fase 0 — Pre-development audit & plan — COMPLETED

### F0-T01 — Audit repository, runtime, dependencies, environment, and assets
- **Status:** COMPLETED
- **Goal:** Establish the initial branch/tree, repo structure, runtime/tooling, dependency/build state, env-variable presence, Supabase access, and assets without exposing secrets or overwriting work.
- **Prerequisites:** None.
- **Likely files:** `docs/REPOSITORY_AUDIT.md`, `docs/TEST_REPORT.md`.
- **Acceptance:** Branch/tree verified; no local work overwritten; tools/dependencies/runtime recorded; env variable names checked without values; unavailable Supabase/Docker checks clearly marked; unavailable baseline scripts not represented as passing.
- **Risk/dependency:** Supabase and production checks require credentials/tooling not available at audit time.

### F0-T02 — Capture project assumptions and secure environment template
- **Status:** COMPLETED
- **Goal:** Persist v5 requirements and record decisions/defaults, risks, environment contract, and secret-handling rules.
- **Prerequisites:** F0-T01.
- **Likely files:** `docs/MASTER_PROMPT_v5.md`, `docs/DECISIONS.md`, `docs/KNOWN_ISSUES.md`, `.env.example`, `.gitignore`, `README.md`.
- **Acceptance:** Full source prompt retained; required variable names present with no real secrets; cashier mode defaults to disabled; `.env` files ignored while `.env.example` remains trackable; unknown business facts are explicitly unconfirmed.
- **Risk/dependency:** Owner/cafe inputs remain go-live prerequisites; never invent them.

### F0-T03 — Build handoff, phased task plan, and baseline report
- **Status:** COMPLETED
- **Goal:** Create continuity records and an ordered, testable work queue for all phases.
- **Prerequisites:** F0-T01 and F0-T02.
- **Likely files:** `docs/WORK_QUEUE.md`, `docs/AI_HANDOFF.md`, `docs/SESSION_LOG.md`, `docs/TEST_REPORT.md`.
- **Acceptance:** Phase/task statuses, prerequisites, likely files, acceptance checks, risks, next task, and “wait for `lanjut`” instruction are recorded.

## Fase 1 — Foundation & database — TODO (not started)

### F1-T01 — Bootstrap and pin the application toolchain
- **Status:** TODO
- **Goal:** Create the Next.js App Router + TypeScript + Tailwind foundation, select/pin Node/package-manager/dependency versions, and establish lint/typecheck/test/build scripts.
- **Prerequisites:** Owner says `lanjut`; Fase 0 complete.
- **Likely files:** `package.json`, lockfile, Next/TypeScript/Tailwind configs, `app/`, `tests/`, `.gitignore`.
- **Acceptance:** Clean install and the configured empty-app lint/typecheck/test/build commands work; chosen engines and package manager are documented; no payment-gateway package is added.
- **Risk:** Verify exact dependency engine requirements; Node `v22.22.3` and npm `10.9.8` are only the observed sandbox versions.

### F1-T02 — Validate environment contract and server-only database access
- **Status:** TODO
- **Goal:** Add Zod validation for required/optional environment values and a server-only Supabase/PostgreSQL connection boundary.
- **Prerequisites:** F1-T01.
- **Likely files:** `lib/env.ts`, database client/config, `.env.example`, unit tests.
- **Acceptance:** Invalid/missing production configuration fails clearly; secrets never enter client bundles/logs; no browser Supabase client; `KASIR_MODE` defaults to `disabled`.
- **Risk:** Actual connection tests wait for safe non-production credentials.

### F1-T03 — Create versioned Drizzle schema and migrations
- **Status:** TODO
- **Goal:** Model the required catalog, settings, admin/session, location/QR, order/item, payment-record, audit, request, and cashier-outbox data with constraints and indexes from the spec.
- **Prerequisites:** F1-T01 and F1-T02; schema review before migration execution.
- **Likely files:** `db/schema/`, `db/migrations/`, Drizzle config, schema tests/docs.
- **Acceptance:** Migrations are versioned, deterministic, non-destructive, and coherent with the documented relations; no production database reset or hidden alternate migration mechanism.
- **Risk:** Price snapshots, token uniqueness, idempotency, RLS, and enum/state design affect later phases; do not mix Drizzle with a competing migration mechanism.

### F1-T04 — Implement idempotent initial seed and integrity checks
- **Status:** TODO
- **Goal:** Seed the exact 13 categories, 71 products, 7 add-ons, 25 locations, specified settings, and Owner bootstrap behavior from the source spec.
- **Prerequisites:** F1-T03; seed inputs checked against Master Prompt §§2 and 12.
- **Likely files:** `db/seed.ts`, seed fixtures, seed verification tests.
- **Acceptance:** Running seed twice creates no duplicates; count checks match the spec; the two unconfirmed featured prices remain hidden; descriptions/assets are not fabricated; QR tokens are random.
- **Risk:** Do not rename/reprice catalog entries or seed unconfirmed business facts as confirmed.

### F1-T05 — Implement centralized pricing and unit tests
- **Status:** TODO
- **Goal:** Put all authoritative price, add-on, variant, discount, tax/service, rounding, and snapshot calculations in `lib/pricing.ts`.
- **Prerequisites:** F1-T03; coordinate inputs with F1-T04.
- **Likely files:** `lib/pricing.ts`, pricing types, `tests/unit/pricing.*`.
- **Acceptance:** At least 15 meaningful cases pass; no negative discounted prices; 11% exclusive default is explicit/configurable; all arithmetic is deterministic and uses integer rupiah.
- **Risk:** Never trust client totals or alter historical order snapshots when product prices change.

### F1-T06 — Establish design tokens and Phase 1 quality gate/docs
- **Status:** TODO
- **Goal:** Add the required brand tokens and verify foundation/migrations/seeds/pricing; add accurate local setup instructions.
- **Prerequisites:** F1-T01–F1-T05.
- **Likely files:** Tailwind/theme config, initial UI styles, `README.md`, `docs/TEST_REPORT.md`.
- **Acceptance:** Required color tokens exist; tests and lint/typecheck/build pass; migration and seed run twice in a safe test database; README setup is reproducible; no payment gateway dependency exists.
- **Risk:** WCAG contrast and final visual assets need separate validation; do not use fabricated logo assets.

## Fase 2 — Owner/Staff auth & admin shell — TODO

### F2-T01 — Finalize auth schema and threat model
- **Status:** TODO · **Depends on:** F1 schema
- **Goal/files:** Review admin, password, session, TOTP, recovery-code, lockout, and audit data model; update `db/` and security notes.
- **Acceptance/risk:** No plaintext passwords or session/TOTP recovery secrets; retain token hashes and auditable state changes.

### F2-T02 — Password login, validation, lockout, and rate limiting
- **Status:** TODO · **Depends on:** F2-T01
- **Goal/files:** Implement argon2id credentials, login service/route, five-failure lockout and login throttling (`lib/auth/`, API, unit/integration tests).
- **Acceptance/risk:** Five failed attempts lock the account; generic customer-facing errors; test without weakening production controls.

### F2-T03 — Secure session lifecycle and cookie handling
- **Status:** TODO · **Depends on:** F2-T02
- **Goal/files:** Hashed/revocable session tokens, expiry, secure httpOnly/SameSite cookies, logout/session checks (`lib/auth/`, tests).
- **Acceptance/risk:** Verify cookie attributes and revocation; never log raw tokens.

### F2-T04 — Server-side roles, CSRF, and audit helpers
- **Status:** TODO · **Depends on:** F2-T02
- **Goal/files:** `requireRole`, CSRF protection for writes, Owner/Staff authorization, reusable audit logging (`lib/auth/`, `lib/audit.ts`, API tests).
- **Acceptance/risk:** Every Owner-only endpoint rejects Staff with 403; unauthorized payment/status actions fail closed.

### F2-T05 — Owner TOTP and recovery-code lifecycle
- **Status:** TODO · **Depends on:** F2-T03
- **Goal/files:** Encrypted TOTP secret storage, mandatory Owner enrollment, optional Staff 2FA, ten one-use hashed recovery codes.
- **Acceptance/risk:** Verify setup/challenge/recovery/replay behavior and key handling; do not log codes or secrets.

### F2-T06 — Admin login, shell, and shared AvatarButton
- **Status:** TODO · **Depends on:** F2-T02–F2-T05
- **Goal/files:** Admin login/layout/navigation, password-change/2FA/logout menu, shared profile avatar in customer/admin headers.
- **Acceptance/risk:** No customer login/register UI; accessible menu and role-aware dashboard links; all actions functional.

### F2-T07 — Auth regression and security quality gate
- **Status:** TODO · **Depends on:** F2-T01–F2-T06
- **Goal/files:** Integration/E2E security tests and `docs/TEST_REPORT.md` updates.
- **Acceptance/risk:** Lockout, CSRF, cookie, session revocation, 2FA/recovery, Owner-vs-Staff, and audit cases pass; no auth bypass added for tests.

## Fase 3 — Products, promotions, and settings — TODO

### F3-T01 — Category, product, and add-on CRUD
- **Status:** TODO · **Depends on:** F1 schema, F2 role guards
- **Goal/files:** Owner-authorized data/services/API and admin screens for categories/products/add-ons, availability, soft delete/restore.
- **Acceptance/risk:** Persisted changes appear via menu API within 30 seconds; soft delete and restore work; validate every mutation.

### F3-T02 — Product variants, mappings, and price adjustments
- **Status:** TODO · **Depends on:** F3-T01, pricing core
- **Goal/files:** Configure Hot/Cold and product variants, allowed add-on/category mappings, availability, and price deltas.
- **Acceptance/risk:** Match Master Prompt §2 defaults; owner can disable Hot per item; never fabricate new menu options.

### F3-T03 — Promotions, discounts, featured items, and banners
- **Status:** TODO · **Depends on:** F3-T01, F1-T05
- **Goal/files:** Promotion CRUD and server pricing/menu presentation for date-bounded discounts and featured content.
- **Acceptance/risk:** Discount boundaries/timezone and negative-price safeguards tested; hidden unconfirmed items stay hidden.

### F3-T04 — Secure image upload and storage
- **Status:** TODO · **Depends on:** F2 authorization, storage configuration
- **Goal/files:** Browser WebP compression, server magic-byte validation, Sharp processing/EXIF removal, Supabase Storage integration.
- **Acceptance/risk:** Reject non-images and files over 5 MB; validate content rather than trusting extensions; no Cloudinary.

### F3-T05 — Business settings and catalog regression gate
- **Status:** TODO · **Depends on:** F3-T01–F3-T04
- **Goal/files:** Owner-editable operational settings, admin forms, menu-cache behavior, tests and report.
- **Acceptance/risk:** Changes persist, authorization/audit coverage exists, price/status updates meet the 30-second requirement.

## Fase 4 — Customer website — TODO

### F4-T01 — Customer shell, home page, intro, and navigation
- **Status:** TODO · **Depends on:** F2 shared avatar, F3 read APIs
- **Goal/files:** Mobile-first `/`, header, exactly two bottom-nav items, first-visit intro/skip, service/home sections.
- **Acceptance/risk:** 390×844 primary CTA visible without scrolling; QR entry bypasses intro; reduced-motion respected; no extra customer tabs/login.

### F4-T02 — Menu browsing and product detail
- **Status:** TODO · **Depends on:** F3 catalog APIs
- **Goal/files:** `/menu`, groups/categories, search/filters, product sheet/detail, availability, featured carousel.
- **Acceptance/risk:** 13-category grouping, hidden unavailable/unconfirmed items, accessible loading/error/empty states, no invented descriptions.

### F4-T03 — Guest cart and server price validation
- **Status:** TODO · **Depends on:** F1 pricing, F3 catalog
- **Goal/files:** Versioned localStorage cart, edit/remove/options, floating cart UI, `POST /api/cart/validate`.
- **Acceptance/risk:** Cart survives refresh; server detects changed price/unavailable items and requires approval; client totals are never authoritative.

### F4-T04 — Checkout and idempotent order creation
- **Status:** TODO · **Depends on:** F1 order schema/pricing, F2 auth-independent public guards, F3 settings
- **Goal/files:** Guest checkout, location validation, privacy consent, hours check, rate limiting, server order creation.
- **Acceptance/risk:** Only fixed “Bayar di Kasir” information; client sends no price/payment state; duplicate key creates one order; closed cafe cannot accept checkout.

### F4-T05 — Order tracking, device history, receipt, and reorder
- **Status:** TODO · **Depends on:** F4-T04, F5 status/payment services
- **Goal/files:** Polling order route, random access token, device-local order history, digital bill/paid receipt and reorder.
- **Acceptance/risk:** Guest cannot enumerate other orders; unpaid bill is not labeled paid receipt; status/payment remain server-authoritative.

### F4-T06 — PWA, privacy, SEO, and resilient states
- **Status:** TODO · **Depends on:** F4-T01–F4-T05
- **Goal/files:** Manifest/service worker, offline read-only menu behavior, `/privacy`, metadata/JSON-LD/sitemap, network error/loading states.
- **Acceptance/risk:** Checkout/tracking disabled offline; do not cache private order data or secrets; verify reduced motion and basic accessibility.

### F4-T07 — Customer E2E and mobile quality gate
- **Status:** TODO · **Depends on:** F4-T01–F4-T06
- **Goal/files:** Playwright tests at 390×844 across QR→menu→cart→checkout→tracking and failure cases.
- **Acceptance/risk:** Two tabs only; avatar behavior; cashier-only checkout; cart persistence; changed price; closed cafe; duplicate submission all verified.

## Fase 5 — Orders, cashier payments, KDS, and reporting — TODO

### F5-T01 — Order state machine, polling, and kitchen release modes
- **Status:** TODO · **Depends on:** F1 order schema, F4 order flow
- **Goal/files:** Validated server transitions, customer/admin polling, immediate/after_paid KDS grouping.
- **Acceptance/risk:** State transitions are explicit; Staff actions authorized; status updates reach customers within 10 seconds.

### F5-T02 — KDS and order operations UI
- **Status:** TODO · **Depends on:** F2 admin shell, F5-T01
- **Goal/files:** Kitchen/cashier columns, queue updates, audio/visual cues and order detail.
- **Acceptance/risk:** Loading/empty/error states; after_paid orders remain in “Menunggu Pembayaran” until paid.

### F5-T03 — Physical cashier payment marking
- **Status:** TODO · **Depends on:** F2 role/audit, F1 payment schema, F5-T01
- **Goal/files:** Staff-only `markOrderPaid` service/UI recording Tunai/EDC/QRIS kasir and payment/audit rows.
- **Acceptance/risk:** No anonymous/client payment-state mutation; second mark rejected; session/role verified; physical payment only.

### F5-T04 — Cancel, void, refunds-at-cashier notes, and table requests
- **Status:** TODO · **Depends on:** F5-T01, F5-T03
- **Goal/files:** Five-minute unpaid customer cancel, staff cancel/item void with reason, manual cashier-return note, call-server/bill request cooldown.
- **Acceptance/risk:** Recalculate totals and audit; 2-minute table cooldown; no automatic online refund.

### F5-T05 — Reports and CSV exports
- **Status:** TODO · **Depends on:** F5-T01–F5-T04
- **Goal/files:** Owner-authorized WIB reports and safe CSV export from order/payment snapshots.
- **Acceptance/risk:** Report totals reconcile with order items/payments; product price edits do not rewrite historical orders; escape CSV formula payloads.

### F5-T06 — Cross-role transaction and regression tests
- **Status:** TODO · **Depends on:** F5-T01–F5-T05
- **Goal/files:** Integration/E2E tests for order state, payment, audit, cooldown, cancel/void, reports.
- **Acceptance/risk:** Anonymous writes rejected; status/payment visible within target; duplicate paid action rejected; all financial values reconcile.

## Fase 6 — Locations & QR — TODO

### F6-T01 — Location management and secure QR token lifecycle
- **Status:** TODO · **Depends on:** F1 locations schema, F2 Owner authorization
- **Goal/files:** Manage 23 regular tables, VIP Room, waiting/car-wash location; random token creation/regeneration.
- **Acceptance/risk:** Tokens are unguessable; old token invalid after regeneration; used locations cannot be deleted.

### F6-T02 — QR entry gate and print-ready cards
- **Status:** TODO · **Depends on:** F6-T01, F4 menu entry
- **Goal/files:** `/m/[qrToken]` validation/location assignment, friendly invalid-token state, print-ready A4 QR cards using domain setting.
- **Acceptance/risk:** No sequential IDs in public URL; domain comes from configured site URL; no fabricated live domain.

### F6-T03 — QR and location acceptance tests
- **Status:** TODO · **Depends on:** F6-T01–F6-T02
- **Goal/files:** Unit/integration/E2E and print layout checks.
- **Acceptance/risk:** Valid/invalid/regenerated token, location validation, non-deletable used location, A4 print verified.

## Fase 7 — Cashier integration — TODO

### F7-T01 — Adapter contract and disabled-safe KDS fallback
- **Status:** TODO · **Depends on:** F5 order model
- **Goal/files:** `kasirAdapter` interface, mapping, disabled mode, development-only labeled stub, safe error semantics.
- **Acceptance/risk:** KDS remains the primary path; stub is not presented as real POS integration; no undocumented API assumptions.

### F7-T02 — Outbox, worker/cron, retries, and logs
- **Status:** TODO · **Depends on:** F7-T01, F1 outbox schema
- **Goal/files:** Durable queue, retry schedule/backoff, timeout/duplicate handling, authenticated scheduled worker.
- **Acceptance/risk:** Worker endpoint requires `CRON_SECRET`; no Redis/BullMQ; external POS outage never loses web orders.

### F7-T03 — Official API/webhook integration, only if documentation is supplied
- **Status:** TODO (may become BLOCKED) · **Depends on:** Official POS docs, credentials, and owner approval
- **Goal/files:** Implement only documented API/auth/signature details and integration tests.
- **Acceptance/risk:** Verify webhook signature/timestamp and secrets; otherwise leave integration disabled and document it as incomplete.

### F7-T04 — Admin integration controls and retry verification
- **Status:** TODO · **Depends on:** F7-T01–F7-T03
- **Goal/files:** Integration settings, queue/log view, manual resend, stub-based protocol tests.
- **Acceptance/risk:** Test success, timeout, HTTP 500, duplicate delivery, retry schedule, manual retry; stub tests do not count as real-POS verification.

## Fase 8 — End-to-end verification & production deployment — TODO

### F8-T01 — Security, regression, accessibility, and light-load quality gate
- **Status:** TODO · **Depends on:** F1–F7
- **Goal/files:** Full required tests, security/authorization audit, 30-user light-load run, mobile accessibility/performance checks.
- **Acceptance/risk:** Report actual evidence, including failures and Lighthouse measurements; no check is waived to claim release readiness.

### F8-T02 — Production Docker/VPS, HTTPS, health, and worker setup
- **Status:** TODO · **Depends on:** F8-T01, owner-approved VPS/domain/access
- **Goal/files:** Multi-stage Dockerfile, compose app/worker, Nginx or Caddy, HTTPS, health checks, restart/log rotation/monitoring.
- **Acceptance/risk:** Supabase remains primary DB; secrets stay in deployment environment; production changes require a safe migration plan.

### F8-T03 — Deployment, backup/restore, rollback, and operations docs
- **Status:** TODO · **Depends on:** F8-T02
- **Goal/files:** `docs/DEPLOYMENT.md`, backup/restore/rollback runbooks, staged migration procedure, monitoring and incident checklist.
- **Acceptance/risk:** Restore tested in non-production; no destructive production reset or automatic DB rollback.

### F8-T04 — Staging end-to-end UAT and go-live readiness
- **Status:** TODO · **Depends on:** F8-T01–F8-T03 and owner/cafe confirmations
- **Goal/files:** Record QR→menu→order→KDS→physical payment marking→receipt→report scenario and go-live checklist.
- **Acceptance/risk:** Real-device QR scans, Owner 2FA, confirmed hours/prices/assets/domain/privacy/kitchen mode, backup restore, worker, HTTPS and monitoring verified.
- **Blocker policy:** If owner data, official POS docs, or production access is missing, mark only the dependent task BLOCKED; continue independent safe work and do not claim production readiness.
