# ASIA Car Wash & Cafe

A guest-first digital menu and ordering system for ASIA Car Wash & Cafe, with a separate Owner/Staff admin and kitchen display. Customers order as guests and pay only at the physical cashier; there is no online payment flow.

> **Project status:** Phase 1 foundation is in progress. The repository now has a runnable Next.js scaffold, but catalog, database, authentication, ordering, and admin features are not implemented yet.

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

The current home page is explicitly a scaffold notice; no ordering or admin action is available yet. No environment file or external service is required to run this scaffold. Environment validation and database access will be added in a later Phase 1 task.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`.env.example` documents the expected future environment-variable names with sensitive fields blank and cashier integration disabled. Keep actual credentials in a local ignored environment file or deployment environment, never in Git, frontend code, logs, or chat.
