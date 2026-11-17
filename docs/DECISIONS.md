# Decisions & Assumptions

Decisions follow the attached Master Prompt v5, preserved in [MASTER_PROMPT_v5.md](MASTER_PROMPT_v5.md). “Adopted” means an explicit project requirement/default, not evidence that a feature is implemented. Do not change these without owner approval.

## Recorded decisions

| ID | Decision | Rationale / consequence | Status |
| --- | --- | --- | --- |
| D-001 | The complete Master Prompt v5 is the project requirements source of truth. | Keeps the product, security, acceptance, recovery, and deployment rules available across sessions. | Adopted |
| D-002 | The current repository root is the application root; do not create a nested `asia-cafe/` directory. | This checkout already represents the project and contains no existing application to relocate. | Adopted |
| D-003 | Target stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, Drizzle migrations, Vitest, and Playwright. | Matches the requirements. Exact package versions and the package manager are not pinned yet; choose and verify them in Phase 1. | Adopted stack; versions pending |
| D-004 | All data access and privileged Supabase use stay server-side. RLS is enabled with no anonymous data-reading policy; no browser Supabase client. | Keeps the service-role key off the client and makes the Next.js server the access boundary. | Adopted |
| D-005 | Customers are always guests. Admin login is for Owner/Staff only; Owner requires TOTP 2FA. | No customer registration, account/profile, or customer login. | Adopted |
| D-006 | Payment is recorded only after physical payment at the cashier. `KASIR_MODE=disabled` and the KDS fallback are the safe defaults. | No payment gateway, payment SDK, online payment route, or online checkout method may be introduced. Staff-only payment marking is a sensitive action. | Adopted |
| D-007 | The primary deployment target is a Dockerized VPS; Supabase PostgreSQL remains the database. | Vercel or a database-provider change requires owner approval. Production secrets belong in server/deployment configuration, not Git. | Adopted |
| D-008 | Use a documented `.env.example` with empty sensitive fields; ignore real `.env` files and never print/store secret values. | Environment validation is to be implemented in Phase 1. Existing secret configuration was absent during the audit. | Adopted |
| D-009 | npm is the provisional package-manager recommendation because it is installed; no repository metadata currently selects a manager. | Make the final choice, pin it in project metadata, and verify dependency engine ranges in Phase 1. Do not treat Yarn's presence as a project choice. | Provisional |
| D-010 | Product descriptions, brand assets, operating facts, and external POS behavior are not invented. | Missing owner inputs stay blank/unconfirmed; cashier integration stays disabled until official documentation and access are provided. | Adopted |
| D-011 | Store timestamps in UTC and display/report them in `Asia/Jakarta` (WIB). | Keeps persisted ordering consistent while matching cafe-local times. | Adopted |

## Defaults requiring confirmation before go-live

The Master Prompt defines defaults so development can proceed without guessing. These are **not** confirmed cafe facts and must be checked before production: operating hours; exclusive 11% tax/service setting; two unconfirmed seed prices and all other current menu prices; product descriptions; logo and photos; site domain; Owner email/initial credential process; WhatsApp requirement; whether checkout can change location; kitchen release mode; add-on/variant mapping; and cashier API documentation/credentials. See Master Prompt v5 §2 and the go-live checklist in §13/§17.

## Architecture and delivery risks

- Keep authoritative price calculation, discount/tax calculation, snapshots, and idempotency on the server; the browser never supplies totals or payment state.
- Custom admin authentication is security-sensitive: password hashing, session token hashing/revocation, secure cookie attributes, CSRF protection, lockout/rate limits, Owner TOTP, recovery codes, role authorization, and audit logging need explicit tests.
- QR/order tokens must be unguessable; locations must be validated server-side. Duplicate checkout requests must not duplicate orders.
- Polling, rate limiting, and outbox retries must work across production instances; process-memory-only state is not an acceptable production design.
- Backups, restore, migrations, and application rollback need independent verification; a code rollback must not trigger a destructive database rollback.
- The app is not yet built, so none of these controls has implementation evidence.

## Phase plan

Fase 0 audit and durable documentation → Fase 1 foundation/database/pricing → Fase 2 Owner/Staff auth/admin shell → Fase 3 catalog/promotions/settings → Fase 4 customer experience → Fase 5 order/KDS/cashier payment/reporting → Fase 6 locations/QR → Fase 7 cashier adapter/outbox → Fase 8 integrated verification and VPS deployment. Detailed task sequencing and gates are in [WORK_QUEUE.md](WORK_QUEUE.md). Do not advance phases without the owner's `lanjut` instruction.
