# Jobdesk V1.5.0 — GitHub Pages + Supabase

Shared Designer and Production job management. **No Hostinger needed.**

- **Frontend**: https://devnekk09.github.io/jobdesk-supabase/
- **Backend**: Supabase Edge Function `jobdesk-api`
- **Database**: Supabase PostgreSQL (private `jobdesk` schema)
- **Access**: private workspace invitation link; no email registration or PIN during testing
- **Demo data**: none

## Features

- Shared Designer Jobdesks and Production Jobdesk
- Manage members exclusively in Settings
- Team Overview, deadlines, priorities and month filtering (defaults to current month)
- Personal Active / Due within 3 Days / Overdue summary
- Temporary names and PC/device labels stored per browser
- Activity history and shared PostgreSQL persistence

## Deploy

1. In GitHub **Settings → Pages**, choose **GitHub Actions** as the source.
2. The `Deploy Jobdesk frontend preview to GitHub Pages` workflow builds the React/Vite app and publishes `dist`.
3. Supabase project `Jobdesk` already contains the private tables and deployed `jobdesk-api` function.
4. Open the **private invitation URL** provided by the workspace administrator, containing `?workspace=...`; the token is stored locally in the browser.

**Full setup, security warnings, and troubleshooting:** [SUPABASE_GITHUB_ONLY.md](SUPABASE_GITHUB_ONLY.md)

### Security

This is intentionally a shared testing workspace. Anyone holding an invitation link can access and change all jobs. Do not use sensitive customer information until authentication and per-role access rules are implemented. Do not put `DATABASE_URL`, service-role keys, or invitation tokens in frontend or GitHub source code.

The private PostgreSQL schema is accessed only via Edge Functions. It is not exposed to the Supabase Data API.

### Source layout

- `app/`, `frontend/`, `index.html`: React/Vite frontend
- `supabase/functions/jobdesk-api/`: Supabase Edge API and database adapter
- `supabase/schema.sql`: Private PostgreSQL schema, with no sample records
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment
- `api.ts`: Original shared job API logic, also adapted for Supabase Edge Functions
- `server.mjs`: Retained for optional local Node.js development, not required for the deployed website

### Develop

```bash
npm install
npm run verify:source
npm run test:offline
npm run build:pages
```

GitHub Actions checks the compiled output. The deployed frontend does not need `npm start` or a running Node.js server.
