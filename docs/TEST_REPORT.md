# Test & Verification Report

**Date:** 2026-11-17 (UTC)
**Scope:** Fase 0 audit, F1-T01 toolchain/scaffold, and F1-T02 environment/database boundary
**Environment:** Linux x86_64; Node.js `v22.22.3`; npm `10.9.8`

## Starting baseline (before any project implementation)

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Branch and clean starting tree | PASS | `git status --short --branch`; active branch was `arena/aef8f2ab-carwashandcafe` and the starting tree was clean. |
| Starting commit / tracked files | PASS | `git log --oneline -8`, `git rev-parse --short HEAD`, and `git ls-files`; base was `c8473ea` with one tracked file (`README.md`). |
| Repository structure and project manifests | PASS (audit) | Initial `find` and manifest checks found no app, package/lockfile, test/build config, migrations, or assets. |
| Environment variable presence | PASS (audit) | Checked required variable names only; all were absent. No values were printed. No `.env` file existed. |
| Supabase connectivity/migration status | NOT RUN | No credentials/configuration or local client were available; there was no migration to inspect. |
| Docker image / compose verification | NOT RUN | Docker was unavailable and no Docker configuration existed at baseline. |

## F1-T01 — Toolchain compatibility and pinned versions

Registry metadata was checked directly with `npm view ... --registry=https://registry.npmjs.org`; all direct dependencies are exact-pinned in `package.json` and locked in `package-lock.json`.

| Component | Pinned version | Compatibility check |
| --- | --- | --- |
| Node.js / npm | Node `22.22.3`; npm `10.9.8` | `.nvmrc`, `packageManager`, and `engines.node` declare the local/runtime baseline; Node 24+ is also permitted by the engine range. |
| Next.js / React | Next `16.4.6`; React and React DOM `19.3.1` | Next requires Node `>=20.9.0` and accepts React `^19.0.0`; the installed runtime and versions meet those ranges. |
| Tailwind CSS | `3.4.19` | Chosen to honor the project requirement for a typed `tailwind.config.ts`; configuration and compiled utility CSS were verified by build. |
| TypeScript | `5.9.3` | Node engine accepts the runtime; satisfies the selected TypeScript-ESLint peer range. Next's build updated `jsx` to `react-jsx` and passed TypeScript validation. |
| ESLint stack | ESLint `10.15.0`; Next plugin `16.4.6`; React Hooks plugin `7.1.1`; TypeScript-ESLint `8.73.0` | Selected plugins advertise ESLint 10 compatibility; Node 22.22.3 satisfies ESLint's `^22.13.0` engine range. |
| Unit-test stack | Vite `8.3.8`; Vitest `5.1.0` | Vite requires Node `^20.19.0 || >=22.12.0`; Vitest requires `^22.12.0 || ^24.0.0 || >=26.0.0`; installed Node 22.22.3 satisfies both. |

## F1-T01 checks

| Check | Result | Evidence |
| --- | --- | --- |
| Clean dependency install | PASS | `npm ci --registry=https://registry.npmjs.org` completed with the pinned lockfile and no peer-resolution warnings. |
| Lint | PASS | `npm run lint` (`eslint .`). |
| Typecheck | PASS | `npm run typecheck` (`tsc --noEmit`). |
| Unit test | PASS | `npm test`; 1 scaffold route smoke test passed. |
| Production build | PASS | `npm run build`; Next.js `16.4.6` compiled and statically generated `/` and `/_not-found`. |
| Dependency audit | PASS | `npm audit --audit-level=moderate --registry=https://registry.npmjs.org`; 0 vulnerabilities. |
| Tailwind build integration | PASS | Generated CSS contains the scaffold utilities `.min-h-screen` and `.max-w-4xl`. |
| Development server smoke test | PASS | `npm run dev` bound to `0.0.0.0:3000`; sandbox request returned HTTP 200, Indonesian scaffold content, and no form/button. Preview server remains running. |
| Payment-gateway dependency check | PASS | No gateway package or online-payment variable was added; payment remains cashier-only. |

## F1-T02 — Environment contract and server-only database boundary

- Added pinned Zod, Drizzle ORM, postgres.js, and `server-only` dependencies.
- `lib/env-schema.ts` is a pure parser: empty optional values normalize to unset; URLs and Postgres protocols are validated; paired Supabase/Upstash values and webhook-mode settings are checked; production requires its documented configuration and HTTPS service URLs; session, TOTP, cron, and (when used) cashier-webhook secrets must be at least 32 characters; the Owner initial password must be at least 12 characters. Errors identify fields/rules without echoing supplied values. Cashier mode defaults to `disabled`; `stub` is forbidden in production.
- `lib/env.ts` is a lazy `server-only` accessor. `server/db/client.ts` lazily constructs Drizzle over postgres.js only when `getDb()` is called, disables prepared statements for transaction poolers, and requires TLS for non-local database hosts. No browser Supabase client was added.

| Check | Result | Evidence |
| --- | --- | --- |
| Clean dependency install | PASS | `npm ci --registry=https://registry.npmjs.org`; 263 packages installed, audit reported 0 vulnerabilities. |
| Environment validation tests | PASS | `npm test`; all 10 tests in `tests/unit/env.test.ts` passed, covering defaults, validation, production requirements, and secret-safe error messages. |
| Full unit suite | PASS | 2 test files, 11 tests passed (10 environment tests plus the existing scaffold smoke test). |
| Lint / typecheck | PASS | `npm run lint` and `npm run typecheck`. |
| Production build | PASS | `npm run build`; Next.js `16.4.6` compiled and statically generated `/` and `/_not-found`. |
| Dependency audit | PASS | `npm audit --audit-level=moderate --registry=https://registry.npmjs.org`; 0 vulnerabilities. |
| Environment template and source boundary | PASS | Verified required names, blank secret fields, disabled cashier default, `.env` ignore rules, no Supabase browser SDK, and no server env imports/references in client modules. Only `.env.example` is tracked. |
| Static browser output secret scan | PASS | `.next/static` contains none of `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `TOTP_ENCRYPTION_KEY`, or `CRON_SECRET`. |
| Database connection | NOT RUN | No credentials were supplied; no connection/query was attempted. Schema/migrations are a later task. |

## Errors found and recovery

1. An initial ESLint 10 + `eslint-config-next` combination emitted peer warnings because its transitive React/import/accessibility plugins only declared ESLint support through v9. The configuration was changed to the direct Next lint plugin, React Hooks plugin, and TypeScript-ESLint `8.73.0`, whose peer metadata supports ESLint 10. An audit of the earlier TypeScript-ESLint `8.56.0` tree found seven moderate advisories; upgrading to `8.73.0` removed them. A fresh `npm ci` and final audit pass with zero vulnerabilities and no peer-resolution warnings.
2. The first Vitest setup used an `esbuild.jsx` option unsupported by Vite 8's Oxc transform and a `.ts` ESM config; the initial unit test failed during JSX import analysis. The config is now `vitest.config.mts` with Oxc automatic JSX runtime; the warning disappeared and the test, lint, and typecheck pass.
3. Next.js normalized `tsconfig.json` from `jsx: "preserve"` to `jsx: "react-jsx"` during the successful build. This is its required React automatic runtime setting; follow-up typecheck passed.

**Non-blocking note:** `npm ls --depth=0` reports Next's optional Sharp WASM support packages as extraneous at the root; `npm explain sharp` traces them to Next's optional `sharp` peer. The clean install, application build, and dependency audit pass. This is tracked in `KNOWN_ISSUES.md` for review when image uploads are implemented.

## Not run / still unavailable

- Supabase connectivity, migrations, and seed: not run; no credentials, schema, or migration exists yet.
- Playwright E2E and mobile-device testing: not run in F1-T01/F1-T02; queued for Fase 4.
- Docker/compose, VPS, production HTTPS, backup/restore, and deployment: not run; Docker and production access are unavailable.
- Lighthouse/performance and full accessibility checks: not applicable to the temporary scaffold page.

These results verify the F1-T01 scaffold/toolchain and F1-T02 environment validation/server-only boundary only. They do **not** indicate that a database is reachable or that schema/migrations, ordering, admin, payment marking, cashier integration, or production deployment works.
