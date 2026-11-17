# AI Handoff

**Project:** ASIA Car Wash & Cafe
**Updated:** 2026-11-17 (UTC)
**Current phase:** Fase 0 — **COMPLETED** (audit and plan documented; no application code implemented)
**Current branch:** `arena/aef8f2ab-carwashandcafe`
**Git checkpoint:** Phase 0 audit changes are recorded on this branch; inspect `git status --short` and `git log -1 --oneline` before resuming for the exact current state.

## Completed in this session

- Verified the starting branch/tree and audited repository structure, installed runtime/tools, dependency status, environment-variable presence, Supabase access availability, and brand assets.
- Recorded the source requirements in `docs/MASTER_PROMPT_v5.md` for future sessions.
- Added `.env.example` with all required names, a safe local URL, `KASIR_MODE=disabled`, and no real secret values; added `.gitignore` rules that keep real environment files out of Git.
- Documented baseline facts, constraints, risks, decisions, test limitations, and a phase/task queue.
- No app, dependency install, database connection, or production operation was attempted.

## Files created/updated

- `.env.example`, `.gitignore`, `README.md`
- `docs/MASTER_PROMPT_v5.md`
- `docs/REPOSITORY_AUDIT.md`, `docs/DECISIONS.md`, `docs/KNOWN_ISSUES.md`
- `docs/TEST_REPORT.md`, `docs/WORK_QUEUE.md`, `docs/SESSION_LOG.md`, `docs/AI_HANDOFF.md`

## Tests and open risks

- Starting branch/tree audit: passed; no pre-existing local edits.
- `git diff --check`, UTF-8/whitespace checks, relative Markdown links, required env-name/blank-secret checks, safe cashier default, and `.gitignore` behavior: passed (details in `docs/TEST_REPORT.md`).
- Application lint/typecheck/unit/E2E/build: not runnable because no app manifest/source/scripts exist. This is documented as a baseline limitation, not a pass.
- Supabase/migration checks: not run; credentials/client are absent.
- Docker checks: not run; Docker is unavailable.
- Major outstanding prerequisites: implement the app foundation; obtain appropriate Supabase access for later verification; provision Docker for deployment validation; gather/confirm cafe hours, prices, brand assets/descriptions, production domain, Owner bootstrap process, and cashier API documentation.

## Decisions

See `docs/DECISIONS.md`. In particular: no online payment, no customer accounts, server-only data access, Supabase remains the database, VPS + Docker is the target, and cashier integration stays disabled without official API documentation.

## Next step — do not start without owner instruction

**Next task:** F1-T01 — Bootstrap the pinned Next.js/TypeScript/Tailwind project toolchain. Review the F1 queue entries first. The provisional package-manager recommendation is npm, but pin the actual manager/runtime/dependency versions only after checking their supported engine ranges.

The owner must first say **`lanjut`**. Do not implement Fase 1, install packages, connect to a database, or advance to any later phase before that instruction.

## Do not repeat or change

- Do not overwrite or reset project history or switch branches.
- Do not claim the application, database, tests, or deployment works before it has been run and verified.
- Do not add a payment gateway, online payment page, customer auth/account, invented business data, or an undocumented cashier integration.
- Never put real secrets in Git, logs, frontend code, or chat. Do not print secret values during future environment audits.

## Continuation prompt

> Lanjutkan proyek ASIA Car Wash & Cafe sesuai `docs/MASTER_PROMPT_v5.md` dan kondisi repository saat ini. Baca `docs/AI_HANDOFF.md`, `docs/WORK_QUEUE.md`, `docs/DECISIONS.md`, serta laporan tes yang relevan. Periksa `git status` dan diff sebelum mengubah file. Fase 0 sudah selesai; jangan mengulangnya. Tunggu instruksi owner `lanjut` sebelum memulai F1-T01. Setelah diizinkan, kerjakan hanya F1-T01, jalankan pemeriksaan yang relevan, perbarui handoff/work queue/laporan, lalu berhenti dan jangan lanjut ke task berikutnya.
