# Known Issues, Access Gaps & Pending Inputs

The runnable project currently consists only of a verified scaffold. No production product flows or database features are implemented. Entries below are verified limitations or prerequisites, not claims of runtime failures.

| ID | Status | Issue / impact | Workaround or next action |
| --- | --- | --- | --- |
| K-001 | OPEN | Catalog, database schema/migrations, auth, customer ordering, admin/KDS, reports, QR lifecycle, and POS integration are not implemented; the home page is only a scaffold notice. The server-only database client is only an access boundary, not a connected or query-ready feature. | Continue one queued task at a time after owner authorization; do not present the scaffold as a usable ordering service. |
| K-002 | BLOCKED (access) | Supabase/database variables and credentials are absent, so connectivity, migrations, seed, and restore cannot be verified. | Keep secrets out of Git/chat. Provide them through the approved environment when database verification is required; do not attempt a production reset. |
| K-003 | OPEN | Docker, Docker Compose, `psql`, and the Supabase CLI are unavailable in this sandbox. | Validate relevant database/deployment work in a suitably provisioned development/staging/VPS environment; do not claim local Docker verification. |
| K-004 | OPEN (go-live input) | No logo/photos, operating-hours confirmation, final price confirmation, or product descriptions are present in the repository. | Leave assets/descriptions absent and prices unconfirmed where specified. Owner/cafe must supply and confirm before go-live. |
| K-005 | OPEN (go-live input) | Production domain, Owner bootstrap values, and cashier API documentation/access are not provided. | Use only documented defaults for development; keep cashier mode disabled and do not invent integration behavior. |
| K-006 | RESOLVED (scaffold baseline) | No lint/typecheck/test/build baseline could run before a project manifest existed. | F1-T01 added scripts; clean install, lint, typecheck, unit tests (11 total after F1-T02), and production build pass. Playwright E2E remains queued for Fase 4. |
| K-007 | NON-BLOCKING diagnostic | `npm ls --depth=0` labels Next's optional `@img/sharp-wasm32` and its `@emnapi/runtime` dependency as extraneous; `npm explain sharp` traces them to Next's optional `sharp` peer. | Clean `npm ci`, Next production build, and audit pass. Recheck when the image-upload feature is introduced; do not add image-processing features early just to silence this diagnostic. |

No workaround may introduce online payment, customer accounts, fake business data, or weakened security checks.
