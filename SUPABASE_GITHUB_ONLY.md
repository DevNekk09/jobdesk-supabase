# Jobdesk V1.5.0 — GitHub Pages + Supabase Only

This deployment uses **GitHub Pages for the frontend**, **Supabase Edge Functions for the API**, and **Supabase PostgreSQL for persistence**. Hostinger and Node.js server hosting are **not required**.

## Current resources

- Public frontend: https://devnekk09.github.io/jobdesk-supabase/
- Supabase project: `Jobdesk` (`vsvlutqagtkdtrowaked`)
- Edge Function: `jobdesk-api`, deployed with JWT verification disabled **because a separate private workspace-token check is enforced inside the function**.
- GitHub Pages is a static host; it must build the React app with `npm run build:pages` and deploy the compiled `dist` folder. Do not deploy the repository's raw `index.html`.
- No demo jobs, members, or workspaces are seeded.

## GitHub Pages settings

Set **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow `.github/workflows/deploy-pages.yml` builds and publishes `dist`. GitHub's legacy branch-based Pages deployment can overwrite the correct build if Source remains set to Deploy from a branch.

## Inviting your team (no email or PIN)

The workspace administrator provides a private link shaped like:

`https://devnekk09.github.io/jobdesk-supabase/?workspace=<PRIVATE_TOKEN>`

Opening this link stores the token in that browser only, then removes it from the address bar. Staff select a temporary member name and PC label in the existing UI. Shared jobs are saved to Supabase and appear on other authorised browsers. The same link grants **full shared-admin editing ability** under the current test-mode API; it is not secure role-based authorization.

**Never commit invitation tokens, database passwords, private JWTs, or service-role keys to GitHub.** Only the SHA-256 hash of the invitation is stored in `jobdesk.workspace_access` (private Postgres schema). To revoke a compromised invitation, revoke its hash and distribute a new link.

## Data access and security

Tables are under private `jobdesk` schema with PUBLIC, anon and authenticated SQL permissions revoked. All client data operations flow through `jobdesk-api`. The function accepts requests from the GitHub Pages domain and checks `x-workspace-token` against the private invitation hash before invoking the Jobdesk API.

This is **testing access, not production-grade authentication**. Anyone with the invitation link can view, edit or delete workspace records. Do not store sensitive customer data until proper Auth users, RLS and per-role authorization are implemented. Supabase's database advisor may warn that RLS is disabled on these private tables; see https://supabase.com/docs/guides/database/postgres/row-level-security. Never expose `jobdesk` through the public Data API without first designing and enabling RLS policies.

## Supabase Edge Function

The checked-in source is at `supabase/functions/jobdesk-api/`. It is deployed to the existing Supabase project using Supabase's Edge Functions deployment tools. `SUPABASE_DB_URL` is available to Edge Functions at runtime; do **not** set it in GitHub Pages environment variables.

## Troubleshooting

- Blank white screen: GitHub Pages is probably using a source-branch deployment. Set Source to GitHub Actions and run `Deploy Jobdesk frontend preview to GitHub Pages`.
- "Invitation link required": open the URL containing `?workspace=...` supplied by the workspace administrator.
- "Backend unavailable": check `jobdesk-api` Edge Function logs for database connection or module-import errors.
- Browser CORS errors: make sure the function is active and the request Origin is exactly `https://devnekk09.github.io`.
- Session and temporary member selection are **local browser state**, not secure login.

## Local checks

`npm install`, `npm run verify:source`, `npm run test:offline`, `npm run build:pages`.

No Hostinger deployment or Node.js production server is required.
