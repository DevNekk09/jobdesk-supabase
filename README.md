# Jobdesk V2.0.2 — Open Team Workspace

GitHub Pages + Supabase. **No Hostinger, no private link, no staff invitation required.**

**Live website:** https://devnekk09.github.io/jobdesk-supabase/

## Access and responsibilities

- **Everyone who opens the website can view and edit all shared jobs.**
- No email registration, workspace token or staff session is required.
- Optionally choose a team member's name so activity can be attributed on that browser. The name selection is a convenience, **not authenticated identity**.
- The original **Admin PIN and Admin Panel are unchanged**. Managing staff, managing spaces and permanently clearing/deleting records still require a verified Admin session.
- The original green theme, floating navigation, Designer/Production Jobdesks, urgent/deadline cards, save animations, deleted-user Jobdesk archival and other V2.0 functionality remain.

## Deployment

1. GitHub **Settings → Pages → Source**: **GitHub Actions** (compiled Vite frontend).
2. GitHub Actions verifies and builds the app with `npm ci`.
3. The backend is the Supabase Edge Function `jobdesk-api` deployed with `verify_jwt=false`; its business API accesses the private PostgreSQL `jobdesk` schema. No browser database secrets are used.
4. Open **the normal website URL**, without query parameters.

## Security warning

**This is deliberately public write access. Anybody with the website address can read, add, edit, update status, or move jobs to Trash.** They can also choose another staff member's displayed name, so activity attribution is not trustworthy. The Admin PIN only protects Admin-only features; it does not make job data private. Do not put sensitive personal/customer information in this system and do not share the URL with anyone you do not trust. You can later restore authenticated staff access if stronger controls are needed.

## Source code

- `app/`, `frontend/`, `index.html`: React/Vite UI.
- `supabase/functions/jobdesk-api/`: Supabase Edge API, Admin PIN auth, SQL adapter.
- `supabase/schema.sql`: private database schema with no demo data.
- `api.ts`: synchronized Node/Edge business logic for development.

## Development

```sh
npm ci
npm run verify:source
npm run build:pages
npm run test:offline
npm run test:e2e
```
