# Jobdesk V1.4.2 — GitHub Pages white-screen repair

## Root cause

The existing `.github/workflows/verify.yml` builds `dist/` as a CI check only. The Pages deployment from the main branch publishes the **unbuilt source `index.html`** whose `src="/frontend/main.tsx"` cannot be executed by a web browser. Additionally, absolute asset paths point to the github.io root instead of the `/jobdesk-supabase/` project path.

## Fix

1. Upload the V1.4.2 files to the root of `DevNekk09/jobdesk-supabase` (include hidden `.github/workflows/deploy-pages.yml`).
2. Go to GitHub repository **Settings → Pages → Build and deployment → Source → GitHub Actions**. This is mandatory: **do not use `Deploy from a branch`** for the unbuilt Vite source.
3. Commit to `main`. In **Actions**, open **Deploy Jobdesk frontend preview to GitHub Pages** and confirm both build/deploy jobs are green. If necessary use **Run workflow**.
4. Check `https://devnekk09.github.io/jobdesk-supabase/`, hard refresh Ctrl+Shift+R.

## Critical architecture limitation

GitHub Pages **only serves static files**. Jobdesk V1.4.x uses `server.mjs` to connect securely to Supabase PostgreSQL using private `DATABASE_URL` and to provide `/api/*` endpoints. These endpoints **cannot run on GitHub Pages**; a working, shared Jobdesk requires a Node.js host. The Pages build will now show the app's actionable deployment notice rather than a white screen. To use the full Jobdesk, deploy the same repository to **Hostinger as a Node.js Web App**, build command `npm run build`, entry `server.mjs`, with `DATABASE_URL` set in Hostinger Environment Variables, not GitHub Pages secrets or client code. Open the Hostinger Web App URL, not the Pages preview.

**Security:** V1.4.x has no authentication/PIN and must not be exposed to real users or customers. `DATABASE_URL`, service keys and Postgres passwords must NEVER be placed in `VITE_*` environment variables, committed to GitHub, or embedded into Pages frontend.

## Preserved

No demo data, SQL schema changes, data deletion, or modifications to customer jobs. The server build and API code remain unchanged except build/base support. The existing CI test remains in place.
