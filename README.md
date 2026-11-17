# ASIA Car Wash & Cafe

A guest-first digital menu and ordering system for ASIA Car Wash & Cafe, with a separate Owner/Staff admin and kitchen display. Customers order as guests and pay only at the physical cashier; there is no online payment flow.

> **Project status:** Phase 0 (pre-development audit) is complete. This repository does not yet contain a runnable application.

## Project source of truth

- [Master Prompt v5](docs/MASTER_PROMPT_v5.md) — complete product, business, security, workflow, and acceptance requirements.
- [Work queue](docs/WORK_QUEUE.md) — phased tasks and current statuses.
- [AI handoff](docs/AI_HANDOFF.md) — current task and the exact next step.
- [Decisions](docs/DECISIONS.md) and [repository audit](docs/REPOSITORY_AUDIT.md) — recorded baseline and assumptions.

The repository root is the application root; do not create a second nested `asia-cafe/` project directory.

## Target architecture

Next.js App Router, TypeScript, and Tailwind CSS; Supabase PostgreSQL with versioned Drizzle migrations; server-only data access; custom Owner/Staff authentication; and VPS + Docker deployment. The cashier integration is disabled by default, with KDS as the fallback.

## Development setup

Setup instructions and runnable commands will be added in Phase 1 after the project toolchain and dependency versions are selected. `.env.example` documents the expected environment-variable names with no real credentials. Keep actual secrets in a local ignored environment file or the deployment environment, never in Git.
