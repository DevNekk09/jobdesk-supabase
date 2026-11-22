# Jobdesk v1.3.1 — Hostinger Deployment Repair

## What was repaired

- Fixed Vite build output from `public-built/` to `dist/`, matching the Hostinger log.
- Updated `server.mjs` to serve `dist/`.
- Added `main: server.mjs` and updated package version to 1.3.1.
- Included compiled `dist/` for deployment convenience.
- Retained all frontend, API, migrations, and user feature logic from v1.3.0 without modifications.

## Hostinger → Deployments → Redeploy → Build settings

| Field | Value |
|---|---|
| Framework | Other (Node.js server app) |
| Node.js | 22 |
| Root | project root (`package.json` directory) |
| Package manager | npm |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | `server.mjs` |
| Start command (if offered) | `npm start` |

Set `APP_URL` to your exact site origin without trailing slash. Preserve your existing `DB_PATH` environment variable and back up the database. For persistence across Hostinger deployments, use an absolute `DB_PATH` outside the versioned deployment folders.

After successful deployment, check `/api/health` (expect `{"ok":true,"app":"Jobdesk"}`) and create/read a test job.

**Caution:** This is still an open test build. It provides no secure authentication, even though it records browser names.
