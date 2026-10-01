# Phase 2A-8 — V1 readiness audit (Preview only)

Date: 2026-10-01. Base: fcec451c7387e0ebe1fb2314a59ec1a3352a310a, branch phase-2a-1.
No production, DNS, provider, paid service or business schema changes.

## Confirmed defects fixed

- Mobile CSS hid search and notification bell, and hid the profile icon while leaving its button blank. Compact responsive header now keeps these controls and date/time; ticker uses its own scrollable row. Desktop design retained.
- Mobile sidebar closes with Escape, locks background scroll and exposes expanded/control semantics. Profile menu dismisses on Escape/outside click and has an accessible account label.
- Unimplemented company/sustainability menu entries no longer pretend to work. IT/help use the existing request form; corporate communications uses existing news. Admin entry now uses client navigation. Demo metadata removed.
- Upcoming event KPI counted only the three displayed cards. It now counts all accessible future published events in the SAME dashboard SQL query, preserving target-audience rules and the three-card limit.
- Own profile could not show the employee's own leave type. Self is now included alongside bound manager/HR, with explicit deny still respected. Other employees still receive only operational absence data.
- Profile/company, inventory and room image inputs accepted forged PNG/JPEG/WebP labels. They now share the existing CMS byte-signature and 200,000-byte validation. Inline storage unchanged; this is format validation, not malware scanning.
- Added Turkish 404 and error boundary, labelled 403. No technical error payload exposed.
- Long cells/forms receive overflow safeguards; current table horizontal scrolling retained.

## Regression evidence

259/259 tests pass, including original Phases 1–7. Typecheck and Next production build pass.
New integration coverage: all seven roles login, one-query fresh session/RBAC, dashboard/agenda/search, permitted and forbidden service access, override refresh, inactive-session denial, logout; bootstrap refuses nonempty systems; forged image rejection; seeds create no business data; event count beyond three cards.
Existing tests cover owner-only request/leave/suggestion/notification/assets, audience-filtered content/search, birthday year omission, hidden/inactive directory users, exact approver and overrides, approval/ledger replay, room overlap and notification deduplication.
Tests use isolated PGlite PostgreSQL, not real company records. This is not a seven-account live browser login test or a multi-connection Neon load test.

## Query / integrity audit

Session identity uses one fresh joined SQL snapshot; no extra layout/middleware identity fetch exists. Server dynamic rendering/no-store remain necessary for per-user privacy. Main dashboard queries run in parallel; directory and external feeds load separately. No cross-request authorization cache introduced.
List services use joined/bounded SQL and pagination; bell uses unread COUNT and recent limit 8; availability is set-based. No row-by-row network reads found in audited list paths. Writes may intentionally fan out notifications within transactions; no queue introduced.
Existing indexes cover owner/status/date, assignment active user/item, permission joins, directory trigram search, meeting room/range and unread notifications. Existing partial unique active-assignment index, approval guards, unique leave debit, deferred consistency triggers, GiST meeting overlap exclusion and recipient/event notification uniqueness preserved. No migration needed.
Live Neon EXPLAIN/query timings and effective pooled hostname/region were not accessible. Vercel config specifies fra1; process-scoped pg Pool remains max 3. No infrastructure change made from assumptions.

## Preview measurement method and limits

Authenticated SUPER_ADMIN warm Link/router navigation, same cloud browser, three samples per listed destination; click → URL networkidle wait → rendered main heading observation. Includes automation overhead; NOT raw browser TTFB, SQL time or function cold start. No forced cold-start claim.
Before p50 milliseconds: users 313, departments 329, inventory 322, admin requests 334, admin leave 293, directory 312, own requests 284, calendar 290. Dashboard median 377 (9 returns). Admin overview 313/446 (2 samples).
Post-deployment results are reported in the completion message. Measured routes do not reproduce old 2–4 second warm delays, so no speculative DB/auth refactor was made.
Desktop live viewport was 1363×936, no document horizontal overflow observed. The available browser API does not offer viewport resizing; real tablet/mobile and touch-swipe validation remains a release gate. Responsive CSS inspection and fixes do not substitute for actual devices.

## Auth / files / audit logs

Login throttling, salted scrypt hashes, token hashes, forced initial password change, reset invalidation, fresh role/override checks and inactive-user checks preserved. Production cookie is __Host-, HttpOnly, Secure, SameSite=Lax, path=/; remember-me adds max-age. CSRF origin and JSON checks remain server-side.
Protected documents and workflow/suggestion attachments check access before download. File names reject control/path characters and supported file formats/size are bounded; no filesystem path writes. Current inline DB storage is limited to small attachments (~200 KB), no antivirus or external storage purchased.
Business services record user/role/reset, inventory/assignment, content/document, request/leave/balance/approval, suggestion, room/reservation changes. Read/search/page-view events are not added to AuditLog. Historical completeness of real Neon audit rows was not certified.

## Secrets and environment

Current GitHub tree has no .env/private-key/credential file. Source pattern scan and built client JS scan found no connection-string/private-key/token literals or server-secret variable references. This is current-tree/build evidence, not a complete historical-secret scan or Vercel account-secret audit. No secret values are included here.

| Name | Purpose / production requirement |
| --- | --- |
| DATABASE_URL | Required in Preview and production. Use separate production database/branch and pooled SSL connection. Verify isolation before running build migrations. |
| BOOTSTRAP_ADMIN_EMAIL | Only for initial bootstrap on an empty database. Not needed after first admin. |
| BOOTSTRAP_ADMIN_USERNAME | Only for initial bootstrap on an empty database. |
| BOOTSTRAP_ADMIN_PASSWORD | Canonical initial bootstrap secret. Remove from deployment env after first admin and forced password change; not required for normal login/build on a populated DB. |
| BOOTSTRAPADMIN_PASSWORD | Legacy compatibility alias in vercel-build only. Canonical is BOOTSTRAP_ADMIN_PASSWORD; remove alias after initial setup. No secret changed in this task. |
| APP_URL | Optional additional trusted origin for request validation. Set to exact production HTTPS origin if used; request's own origin is already accepted. |
| PASSWORD_MIN_LENGTH | Optional password policy, current default 6. Agree production policy before launch; no silent change to existing credentials. |
| MEETING_MAX_HOURS | Optional reservation duration limit; default 8 hours. |
| NODE_ENV | Framework-managed; production build enables secure cookie behavior. |
| VERCEL | Platform-provided; selects trusted Vercel forwarding header for login rate limiting. |

Bootstrap only succeeds while users table is empty, with transaction/lock, and never overwrites an existing admin. Existing admin untouched.

## Backup / migration / rollback

Neon supports history-based restore subject to project/plan settings. Actual retention, current plan and latest recoverable point were NOT read from the account. Confirm them in Neon before launch; do not assume a retention duration.
Reference: https://github.com/neondatabase/website/blob/main/content/docs/postgres/backup-restore/branch-restore.md
Keep an encrypted pg_dump custom-format backup outside the database, with agreed retention/access; validate pg_restore on an isolated nonproduction database. Do not purchase a service automatically.
`npm run db:migrate` executes existing idempotent SQL 001–008, then system seed; Vercel `vercel-build` runs this before Next build. Seeds contain roles/permissions/categories/config, not fake employees or transactions.
Migrations run as successive files, not one release-wide transaction and have no automated down migration. A failed build can follow a successful DB change; reverting Vercel code alone does not revert data/schema. Snapshot/export before schema releases, test restores, prefer compatible forward fixes and coordinate rollback with DB recovery. This phase adds no SQL migration.

## Production gates (not executed)

1. Confirm separate production DATABASE_URL and Preview isolation, SSL/pooling and region.
2. Review environment scopes and password policy; initialize SUPER_ADMIN only if empty, force change, remove bootstrap password/alias afterward.
3. Verify Neon retention; make encrypted backup and rehearse restore.
4. Run migrations on a disposable copy, then approved production target. Confirm no test business data in production.
5. Complete real mobile/tablet/touch and seven-role live browser login/navigation/logout smoke checks.
6. Verify HTTPS/domain, protected download access, first real employee and representative approval/reservation flow.
7. Record last good code deployment and matching DB recovery point.
8. Obtain explicit production release approval. No production merge/deployment or DNS change in Phase 2A-8.
