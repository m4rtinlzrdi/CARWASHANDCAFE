# ASIA Car Wash & Cafe

A guest-first digital menu and ordering system for ASIA Car Wash & Cafe, with a separate Owner/Staff admin and kitchen display. Customers order as guests and pay only at the physical cashier; there is no online payment flow.

> **Project status:** Phase 1 foundation is in progress. The repository has a runnable Next.js scaffold and a server-only, lazy database access boundary; catalog, database schema/migrations, authentication, ordering, and admin features are not implemented yet.

## Project source of truth

- [Master Prompt v5](docs/MASTER_PROMPT_v5.md) — product, business, security, workflow, and acceptance requirements.
- [Work queue](docs/WORK_QUEUE.md) — phased tasks and current statuses.
- [AI handoff](docs/AI_HANDOFF.md) — current task and exact next step.
- [Decisions](docs/DECISIONS.md) and [repository audit](docs/REPOSITORY_AUDIT.md) — recorded assumptions and starting baseline.

The repository root is the application root; do not create a second nested `asia-cafe/` project directory.

## Toolchain

- Node.js `22.22.3` (see `.nvmrc`; `package.json` declares supported engine ranges).
- npm `10.9.8` (pinned in `package.json`).
- Next.js App Router, React, TypeScript, Tailwind CSS, ESLint, and Vitest versions are pinned in `package.json` and `package-lock.json`.

## Local development

```bash
npm ci
npm run dev
```

The current home page is explicitly a scaffold notice; no ordering or admin action is available yet. The environment contract is validated lazily on the server, and database access is available only through the server-only Drizzle client. The scaffold and its tests do not require a database connection or real credentials; schema and migrations are a later Phase 1 task.

To prepare local configuration for future server features, copy `.env.example` to `.env.local` and fill only the values needed for the task. Production requires the documented server-side variables, strong secrets, and HTTPS service URLs. `KASIR_MODE` defaults to `disabled`; do not enable webhook mode without the cafe's official API documentation and credentials.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`.env.example` documents the validated environment contract with sensitive fields blank and cashier integration disabled. Keep actual credentials in a local ignored environment file or deployment environment, never in Git, frontend code, logs, or chat. `SUPABASE_SERVICE_ROLE_KEY`, database credentials, and other secrets must remain in server-only code paths; no browser Supabase client is provided.
