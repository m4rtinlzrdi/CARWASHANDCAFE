# Repository & Environment Audit

**Audit date:** 2026-11-17 (UTC)
**Phase:** 0 — pre-development audit
**Branch:** `arena/aef8f2ab-carwashandcafe`
**Starting commit:** `c8473ea65bdc695476293c654c2e523b0dcba7df` (`Initial commit`)

## Initial repository state

- The active branch matches the branch supplied for this session; no branch switch or new branch was needed.
- The working tree was clean before changes. There were no local user edits to preserve or overwrite.
- One tracked file existed: `README.md`. The only commit was `c8473ea` (`Initial commit`).
- The repository had no application source, package manifest/lockfile, test setup, database schema or migrations, Docker configuration, or public brand assets.
- No nested `asia-cafe/` directory exists. The repository root is the appropriate project root.
- Git remote name `origin` is configured; its URL was not needed for this audit.

## Runtime and available tools

| Tool | Observed version/state |
| --- | --- |
| OS | Linux x86_64 |
| Node.js | `v22.22.3` |
| npm | `10.9.8` |
| Yarn | `1.22.22` (installed; not selected by repository metadata) |
| Corepack | `0.34.6` |
| pnpm | Not installed |
| Docker / Docker Compose | Not installed |
| `psql` | Not installed |
| Supabase CLI | Not installed |

There is no existing package manager choice because there is no `package.json` or lockfile. npm is available and is the lowest-friction provisional choice; the actual package manager, `packageManager` pin, and supported dependency versions must be selected and checked in Phase 1. Node 22.22.3 is the runtime currently available. Compatibility with specific Next.js/Drizzle/library versions is **not yet verified**, because no dependency versions have been selected or installed.

## Dependencies, build, and assets

- No dependencies are declared or installed; dependency vulnerability/compatibility checks are therefore not applicable yet.
- No `package.json`, `tsconfig.json`, Next.js configuration, Drizzle configuration, test configuration, or lockfile exists.
- No `public/brand/` assets, logo, or cafe photography were present. No brand asset or product description has been invented.
- No application build or migration status can be reported; these do not exist in the starting repository.

## Environment and Supabase access

At audit time there were no `.env` files, and none of the required project environment variables were present in the process environment. Only variable **names/presence** were checked; no values were printed or stored. The required names are listed, with blank secret fields, in the root `.env.example`.

Supabase connectivity and migration status could not be checked because no Supabase/database credentials or configuration were available. This is an access limitation, not a connection failure. No database connection was attempted. The Supabase CLI and local PostgreSQL client are also unavailable in this environment.

## Baseline commands and compatibility

- Git branch/status/history and tracked files were inspected before any edits.
- Node, npm, Yarn, Corepack, Docker, Compose, `psql`, and Supabase CLI availability were checked.
- No lint, typecheck, unit-test, E2E, or production-build command exists to run. They are recorded as **not runnable at baseline**, not as passing and not as a hidden failure. They become applicable after Phase 1 establishes scripts.
- No Docker build could be run because Docker is not installed and no Dockerfile exists.

## Implementation plan

Proceed in the dependency order recorded in [WORK_QUEUE.md](WORK_QUEUE.md): establish a pinned application toolchain and server-only environment contract; implement schema/migrations and idempotent seed; establish centralized, tested pricing; then build authentication/admin, catalog, guest ordering, cashier/KDS operations, QR, POS adapter, and final deployment/verification. Do not begin Phase 1 until the owner explicitly says `lanjut`.

## Principal risks and constraints

1. **No runnable foundation yet.** All app/dependency compatibility and code quality gates remain unverified until Phase 1.
2. **No database access.** Supabase connection, migration execution, seed verification, and restore testing require credentials and a suitable environment.
3. **Production tooling unavailable locally.** Docker/VPS deployment and container health checks must be validated later in a capable environment.
4. **Sensitive transaction rules.** Server-side pricing/snapshots, guest QR tokens, idempotent order creation, role checks, payment marking, audit logging, and rate limits must be designed and tested before exposing write paths.
5. **Operational/brand inputs remain unconfirmed.** Hours, selected prices, logo/photos, descriptions, domain, Owner bootstrap values, and cashier API details must not be fabricated. Keep cashier mode disabled and KDS available until the cafe supplies official POS documentation.
6. **No online payment.** Do not add a gateway, online payment route, payment SDK, or customer account/login flow.

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for pending access and go-live inputs, and [DECISIONS.md](DECISIONS.md) for adopted defaults and open decisions.

## F1-T01 follow-up (2026-11-17)

The inventory above is the pre-development baseline, not the current repository state. After the owner authorized continuation with “terus bekerja,” F1-T01 added and verified a pinned Next.js/React/TypeScript/Tailwind toolchain and a clearly non-functional app scaffold. See [TEST_REPORT.md](TEST_REPORT.md) and [WORK_QUEUE.md](WORK_QUEUE.md) for versions and evidence. F1-T02 and database-dependent checks remain pending; no Supabase connection has been attempted.
