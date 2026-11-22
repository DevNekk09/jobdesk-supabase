# Jobdesk V1.4.0 — GitHub + Supabase (PostgreSQL)

**Source repository for the shared Designer & Production Jobdesk.** React + Vite frontend, Node.js 22 HTTP backend, and Supabase PostgreSQL. This release replaces SQLite persistence. It starts with **zero sample jobs, zero demo members, zero sample spaces, and no demo mode**. The backend creates one internal `Shared team` service identity when first used, solely to record activity in the PIN-free test workspace.

> **SECURITY NOTICE:** This release deliberately has no login/PIN, per the original testing requirement. **Anyone who knows the deployed URL can read and modify work and customer information, including deleting it.** Browser name selection is not authentication. Do NOT use real customer data or expose this publicly until authentication and authorization are implemented. A private GitHub repository does not protect a publicly accessible app URL.

## What is included

- Shared Designer jobdesks with configurable names, member management **in Settings only**.
- Shared Production jobdesk for all members and production progress tracking.
- Team Overview metrics and compact Personal cards: Active, Due in 3 days, Overdue.
- Default monthly filter (current Malaysia month), with other months/all-months.
- Per-browser temporary team member selection and named PC (in browser + Supabase device registry).
- REST API, optimistic job version updates, PostgreSQL transactions for job updates/deletes.
- GitHub Actions CI checks, static build, SQL schema, diagnostics, and environment variable template.

## Repository structure

```text
app/                    React UI source and CSS
frontend/               Vite HTML and browser entry
public/                 Icons
api.ts                  API source (transpiled into api.mjs during build)
server.mjs              REQUIRED Node.js entry — serves /api/* and dist/
lib/database.mjs        Server-only pg Pool + Supabase PostgreSQL adapter
lib/sql.mjs             SQL translator and table namespace safety
supabase/schema.sql     Private jobdesk schema, tables and indexes (no sample data)
scripts/                Database check and optional live smoke test
tests/                  Credential-free validation
.github/workflows/      GitHub Actions build + checks
build.mjs               npm run build → dist/ and api.mjs
.env.example            Placeholder config ONLY (never enter real secrets here)
```

**GitHub should contain the source files**, not `node_modules/`, `dist/`, `.env`, or database dumps. The build command creates both `dist/` and `api.mjs`.

## Quick setup

1. Create a **private** GitHub repository and upload the **contents of this extracted folder**, not the ZIP itself. See [GitHub + Hostinger](HOSTINGER_GITHUB_DEPLOY.md).
2. Create a Supabase project. The Postgres schema is applied automatically by the Node server at startup, or manually via `supabase/schema.sql` in Supabase SQL Editor. It creates tables only, **no example data**.
3. In Supabase dashboard → **Connect → Session pooler**, copy the connection string. Insert your actual password (URL-encode special characters). Keep the secret **server-side**.
4. Configure Hostinger Environment Variables (see `.env.example`): `DATABASE_URL`, `APP_URL`, optionally `PG_POOL_MAX`. The database URL **must not** be prefixed `VITE_` and must never appear in frontend source.
5. Deploy the GitHub repository as a **Node.js Web App / Framework Other**, with Node.js 22, build command `npm run build`, **entry file `server.mjs`**, and `npm start` if a start command is requested.
6. Test `/api/health` (JSON 200) and `/api/bootstrap` (JSON arrays) before using the web UI.
7. In the empty Jobdesk UI, use Settings → Team members to add real users, which creates Designer spaces; add Production users there too. No dummy records are auto-added.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for database setup, risks and troubleshooting.

## Develop and verify

Requires Node.js >=22.13 and npm. For local work, load `DATABASE_URL` from your shell or `.env` loader — Node does not automatically read `.env.example`.

```bash
npm install
npm run build
npm run test:offline
npm start
# optional; requires a reachable Supabase database and reads current workspace:
npm run db:check
npm run test:smoke
```

`test:offline` needs no credentials; `test:smoke` and `db:check` require a live Supabase project. The repository does not bundle any production credentials or data.

## Existing SQLite data

This is a **new PostgreSQL database**, not an in-place SQLite migration. It **does not delete any old SQLite file**, and it **does not automatically import historical real jobs**. Keep your old Jobdesk SQLite backup untouched; import/ETL is a separate reviewed operation. Do not assume existing jobs have been moved to Supabase.

## Important hosting note

Hostinger must start `server.mjs`. Publishing only `dist/` as a static site will return HTML 404/403 for `/api/*`, exactly like earlier failures. See [deployment steps](HOSTINGER_GITHUB_DEPLOY.md). If the backend is running but the database cannot connect, `/api/health` responds with JSON 503 and a startup log entry.

## Status

Repository source is ready to upload; offline syntax/schema/SQL translator tests can be run without credentials. Live Supabase project provisioning and Hostinger routing **must be verified on your own connected project**. This package has no API keys or remote project connection.
