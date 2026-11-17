# AI Handoff

**Project:** ASIA Car Wash & Cafe
**Updated:** 2026-11-17 (UTC)
**Current phase:** Fase 1 — **IN PROGRESS**
**Last completed task:** F1-T02 — **COMPLETED** (environment contract and server-only database boundary)
**Current branch:** `arena/aef8f2ab-carwashandcafe`
**Git checkpoints:** F1-T01 commit `c9c2135`; F1-T02 commit `69219e0`, pushed to open PR #1. Inspect `git status --short --branch` and `git log -1 --oneline` before resuming.

## Completed in F1-T02

- Pinned Zod `4.6.7`, Drizzle ORM `0.45.4`, postgres.js `3.4.9`, and `server-only` `0.0.1`.
- Added pure Zod environment parsing with safe `KASIR_MODE=disabled` default, URL/protocol checks, production requirements, paired Supabase/Upstash settings, conditional cashier webhook settings, and secret-safe field errors. Production initial Owner passwords must be at least 12 characters; session, TOTP, cron, and cashier webhook secrets (when configured) must be at least 32 characters.
- Added lazy server-only environment access and lazy Drizzle/Postgres.js client construction. Remote database hosts require TLS; `prepare: false` supports transaction poolers. No browser Supabase client was added.
- Updated `.env.example`, README, decisions, known issues, queue, and verification report. Real `.env` files remain ignored; the example's sensitive fields are blank.
- No database connection or query was attempted: no safe credentials were provided. Database schema and migrations remain F1-T03.

## Files created or updated for F1-T02

- `package.json`, `package-lock.json`
- `lib/env-schema.ts`, `lib/env.ts`, `server/db/client.ts`
- `tests/unit/env.test.ts`
- `.env.example`, `README.md`
- `docs/WORK_QUEUE.md`, `docs/DECISIONS.md`, `docs/KNOWN_ISSUES.md`, `docs/TEST_REPORT.md`, this handoff, and `docs/SESSION_LOG.md`

## Verification

- `npm ci --registry=https://registry.npmjs.org`: PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS (11 tests total: 10 environment tests and 1 scaffold smoke test).
- `npm run build`: PASS.
- `npm audit --audit-level=moderate --registry=https://registry.npmjs.org`: PASS (0 vulnerabilities).
- Environment template/ignore and source-boundary checks: PASS; only `.env.example` is tracked, its secret fields are blank, no browser Supabase SDK exists, and no server-secret names were found in `.next/static`.
- Database connection: NOT RUN. See `docs/TEST_REPORT.md` for the detailed evidence and limitations.

## Current limits and project constraints

- The home page remains a scaffold notice. Catalog, schema/migrations, seed, authentication, ordering, admin/KDS, cashier payment marking, reporting, QR lifecycle, and POS integration are not implemented.
- No real secret values should be read into chat, committed, logged, or bundled into browser code. Do not attempt a database connection without safe non-production credentials.
- Preserve cashier-only payment, guest-only ordering, exactly two customer navigation tabs (Beranda and Menu), Owner/Staff-only admin login, mandatory Owner 2FA, and no online payment gateway/route.
- `KASIR_MODE` stays `disabled` unless official cashier API documentation and safe credentials are supplied.

## Next task — wait for owner authorization

**Next queued task:** F1-T03 — Create the versioned Drizzle schema and migrations. F1-T02 is complete; the owner's `lanjutkan` instruction authorized F1-T02 only. **Do not start F1-T03 until the owner gives another instruction.**

## Do not repeat or change

- Do not redo F1-T01/F1-T02 unless a regression is demonstrated; inspect Git status/diff first.
- Do not claim the scaffold is a functioning menu/order/admin system or claim database connectivity.
- Do not add a payment gateway, online payment route, customer account/auth flow, invented business data, or undocumented cashier behavior.
- Do not reset/migrate a real database or expose secrets.

## Continuation prompt

> Continue ASIA Car Wash & Cafe according to `docs/MASTER_PROMPT_v5.md` and the repository state. Read `docs/AI_HANDOFF.md`, `docs/WORK_QUEUE.md`, `docs/DECISIONS.md`, and `docs/TEST_REPORT.md`; inspect `git status` and the diff. Fase 0, F1-T01, and F1-T02 are complete. Do not start F1-T03 or any later task until the owner gives a new authorization. Keep the handoff and test report accurate, and never connect to a database without safe non-production credentials.
