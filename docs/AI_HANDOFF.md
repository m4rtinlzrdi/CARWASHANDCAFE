# AI Handoff

**Project:** ASIA Car Wash & Cafe
**Updated:** 2026-11-17 (UTC)
**Current phase:** Fase 1 — **IN PROGRESS**
**Last completed task:** F1-T03 — **COMPLETED** (versioned Drizzle schema and migrations)
**Current branch:** `arena/a1b6bb37-carwashandcafe`
**Starting point:** PR #1 was merged into `main` at `9ee9401bea860c00e783c4de2adc30017af318c8`. That merge contains F1-T02; F1-T03 was not included in the old PR and was completed on this active branch. Inspect `git status --short --branch` and `git log -1 --oneline` before resuming.

## Completed in F1-T03

- Pinned Drizzle Kit `0.31.11` and `@next/env` `16.4.6`; added `db:generate` and guarded `db:migrate` scripts. `db:generate` works without `DATABASE_URL`; the config loads environment files only for migration execution.
- Added a 23-table schema with 14 PostgreSQL enums, UUID IDs, `timestamptz` fields, integer rupiah amounts, constraints/indexes, and restrictive historical foreign keys. `order_counters.date` remains the specified natural primary key.
- Added `0000_initial_schema.sql` and `0001_rls_and_integrity_triggers.sql`; all tables enable RLS with no anon/authenticated policies. Custom triggers maintain `updated_at`, enforce append-only audit logs, validate polymorphic promotion targets, and protect referenced targets from hard deletion.
- Typed the server-only Drizzle client against the schema, added schema contract tests and `docs/DB_SCHEMA.md`, and updated the README and continuity docs.
- **No seed rows were added. No database connection was attempted and no migration was applied.**

## Verification and limits

- `npm ci --registry=https://registry.npmjs.org`: PASS; 279 packages installed.
- `npm run db:generate -- --name=initial_schema`: PASS; generated the 23-table migration without a database connection.
- Final `npm run db:generate -- --name=verify_final`: PASS; no schema changes. `npx drizzle-kit check`: PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS (14 total: 10 environment, 3 schema-contract, 1 scaffold smoke test).
- `npm run build`: PASS; Next.js `16.4.6` compiled and statically generated `/` and `/_not-found`.
- `npm audit --omit=dev --audit-level=moderate`: PASS (0 vulnerabilities). Full audit remains blocked by 19 high dev-toolchain findings through `picomatch`, also present in the F1-T02 base lockfile. The moderate Drizzle loader advisory is avoided with an `esbuild@0.25.12` override, outside `@esbuild-kit/core-utils@3.3.2`'s declared `~0.18.20` range; Drizzle CLI versioning/generation pass but broader loader compatibility is unverified (K-008 / D-016). Do not run `npm audit fix --force`.
- Database connection/migration execution: NOT RUN. No database URL was inspected or used; migrations remain unapplied.

## Current limits and project constraints

- The home page remains a scaffold notice. No seed, customer menu/order flow, admin/auth/KDS, payment marking, reports, QR lifecycle, or POS integration is implemented.
- Do not claim the migration was executed or that database connectivity works. Do not connect without safe non-production credentials and explicit migration review.
- Preserve cashier-only payment, guest-only ordering, exactly two customer navigation tabs (Beranda and Menu), Owner/Staff-only admin login, mandatory Owner 2FA, and no online payment gateway/route.
- `KASIR_MODE` stays `disabled` until the cafe supplies official API documentation and safe credentials.

## Next task — wait for owner authorization

**Next queued task:** F1-T04 — Implement the idempotent initial seed and integrity checks. The owner's `lanjutkann` instruction authorized F1-T03 only. **Do not start F1-T04 or any later task until the owner gives another instruction.**

## Do not repeat or change

- Do not redo F1-T01–F1-T03 unless a regression is demonstrated; inspect Git status/diff first.
- Do not run `db:migrate`, `db:seed`, `drizzle-kit push`, or any destructive database command without safe non-production access and required review.
- Do not add a payment gateway, online payment route, customer account/auth flow, invented business data, or undocumented cashier behavior.
- Do not read, log, commit, or expose secret values.

## Continuation prompt

> Continue ASIA Car Wash & Cafe according to `docs/MASTER_PROMPT_v5.md` and the repository state. Read `docs/AI_HANDOFF.md`, `docs/WORK_QUEUE.md`, `docs/DECISIONS.md`, `docs/TEST_REPORT.md`, and `docs/DB_SCHEMA.md`; inspect `git status` and the diff. Fase 0 and F1-T01–F1-T03 are complete. Do not start F1-T04 until the owner gives a new authorization. No database connection or migration has been performed.
