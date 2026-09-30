# Koyuncu Grup Portal — Phase 2A-1

Next.js / TypeScript, PostgreSQL, database sessions and permission-based administration. Existing dashboard layout is preserved. No public registration or password email delivery.

## Setup

Use Node.js 22+ and a dedicated PostgreSQL database (TLS enabled in production).

1. `npm ci`
2. Set `DATABASE_URL` to the provider's PostgreSQL connection string, retaining its TLS parameters. Set `APP_URL` to the deployment origin. Optional `PASSWORD_MIN_LENGTH` defaults to 6 (maximum password length 128).
3. `npm run db:migrate` creates tables and seeds roles, permissions and employee types. Existing role customizations are preserved.
4. Set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` in a secure local terminal environment, then run `npm run admin:bootstrap`. Only an empty user database can be bootstrapped. Clear these three variables afterward; they are not needed in Vercel. No default credentials exist.
5. `npm run build && npm start`. First administrator login requires a password change.

Set `DATABASE_URL` and `APP_URL` separately for Vercel Production and Preview. Preview must use a separate test database, never production personnel data. Run migration/bootstrap against each target database before its first authenticated use. Never commit environment files or credentials. Missing database configuration fails closed; anonymous login pages can still render.

## Routes

`/`, `/login`, `/forgot-password`, `/change-password`, `/forbidden`.

`/admin`, `/admin/users`, `/admin/users/new`, `/admin/users/:id`, `/admin/users/:id/edit`, `/admin/companies`, `/admin/locations`, `/admin/departments`, `/admin/units`, `/admin/job-titles`, `/admin/roles`, `/admin/settings`.

Authenticated JSON endpoints: `/api/admin/*`; session actions: `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`.

## Authorization and security

Built-in roles: SUPER_ADMIN, ADMIN, HR_ADMIN, IT_ADMIN, CONTENT_ADMIN, MANAGER, EMPLOYEE. Role permissions combine with per-user allow/deny overrides. SUPER_ADMIN retains full access and its built-in role is immutable. Only SUPER_ADMIN manages other super administrators. Organization/user operations use view/create/edit/disable/manage and users.reset_password permissions; custom permission changes require permissions.manage. Backend rechecks current actor permissions inside write transactions.

Passwords use salted scrypt (N=131072,r=8,p=1). Session cookies are HttpOnly/SameSite=Lax and Secure with a __Host- prefix in production. Session tokens are hashed in the database. Default session lifetime is 8 hours, remember-me is 30 days. Password reset/change, account status changes and role/permission changes revoke sessions. Login and password-change attempts are database rate limited. Origin checks, strict validation, parameterized SQL, restrictive response headers and metadata-only audit records are included. Disabled/left users remain stored; no permanent user deletion endpoint exists.

Temporary passwords appear once after create/reset and must be conveyed through your approved internal channel. Forgot password directs the employee to their administrator. Dashboard data remains the existing prototype; this phase does not implement later portal modules.

## Verification

`npm test` runs 24 sequential scenarios against an isolated PGlite PostgreSQL engine, including password/session lifecycle, duplicate identifiers, authorization and escalation denial, organizational cycles, overrides, deactivation, CSRF and rate limits. No external database or real personnel data is used by tests. `npm run build` checks TypeScript and production compilation. These checks do not substitute for deployment database migration and a live administrator login acceptance test.

Vercel uses `vercel-build`: when DATABASE_URL is present, migration runs before Next.js compilation. Optional BOOTSTRAP_ADMIN_* variables create the first administrator only if users is empty. Remove all three bootstrap variables after successful setup. Migration failure blocks deployment.
