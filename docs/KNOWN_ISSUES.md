# Known Issues, Access Gaps & Pending Inputs

No application defects have been observed: the repository contains no application code to exercise. The entries below are verified project limitations or prerequisites, not claims of runtime failures.

| ID | Status | Issue / impact | Workaround or next action |
| --- | --- | --- | --- |
| K-001 | OPEN | No app source, dependency manifest, lockfile, migrations, or test scripts. There is nothing runnable yet. | Bootstrap the project only in Fase 1; then add and run the baseline quality commands. |
| K-002 | BLOCKED (access) | Supabase/database variables and credentials are absent, so connectivity, migrations, seed, and restore cannot be verified. | Keep secrets out of Git/chat. Provide them through the approved environment when database verification is required; do not attempt a production reset. |
| K-003 | OPEN | Docker, Docker Compose, `psql`, and the Supabase CLI are unavailable in this sandbox. | Validate relevant database/deployment work in a suitably provisioned development/staging/VPS environment; do not claim local Docker verification. |
| K-004 | OPEN (go-live input) | No logo/photos, operating-hours confirmation, final price confirmation, or product descriptions are present in the repository. | Leave assets/descriptions absent and prices unconfirmed where specified. Owner/cafe must supply and confirm before go-live. |
| K-005 | OPEN (go-live input) | Production domain, Owner bootstrap values, and cashier API documentation/access are not provided. | Use only documented defaults for development; keep cashier mode disabled and do not invent integration behavior. |
| K-006 | OPEN (verification) | No lint/typecheck/unit/E2E/build baseline can run before an app manifest and scripts exist. | Record as not runnable (not passing); establish scripts in Fase 1 and report their actual results. |

No workaround may introduce online payment, customer accounts, fake business data, or weakened security checks.
