# Jobdesk v1.3.2 — Hostinger Node.js (Team Workspace + Deployment Fix)

A shared Designer + Production Jobdesk. This release adds a refined Team Overview, temporary per-browser member identification, member management exclusively in Settings, three personal desk metrics, and a default-current-month filter.

## Changes

- **Settings → Team members** is the only place to add, edit, or remove Designer and Production members. Designer desks are shared team views; every Production member works in the **same** Production Jobdesk. No PIN or registration is needed during this test phase.
- **Team Overview** shows a new responsive dashboard, deadline/production metrics, designer desk summaries, production status, and priority jobs.
- **Temporary PC user:** click the name/avatar in the upper-right, enter a voluntary device label (for example, `Studio PC 01`), and select an existing member. The browser remembers the selection using localStorage and the database remembers the chosen label, member, and last-seen date under **Settings → General → Remembered PCs & browsers**. Use **Return to shared test admin** to clear the current device assignment. No hardware fingerprint, IP tracking, email, PIN, or password is collected for this feature.
- **Personal Designer Jobdesk:** Active, Due in 3 days, and Overdue cards above the compact workflow. Metrics can be clicked to filter the job list.
- **Month filter:** shows the **current Malaysia month by default** in Team Overview, personal desks, All Jobs, and Production. Records are grouped by **job due-date month**. Choose a different month or **All months** to see older work and backlog. Changing months never deletes any data.

## Deploy to Hostinger

1. Back up your existing `data/jobdesk.sqlite` and any associated `-wal` and `-shm` files before replacing an installed release. Use a stable `DB_PATH` outside the application folder whenever possible.
2. In Hostinger, create or edit a **Node.js** website and upload/extract the ZIP. The application root is the folder containing `package.json`, `server.mjs` and `api.mjs`.
3. Select **Node.js 22** (or Node 24). Startup: `npm start`, or entry point `server.mjs`. Hostinger must deploy this as a **server-side Node.js application** (not static Vite/React): use **Framework: Other**, **Build command: `npm run build`**, **Entry file: `server.mjs`**, and **leave Output directory blank for server deployment if supported** (otherwise `dist`, but the Entry file must still be configured). Start command: `npm start` if offered. The archive also includes the compiled `dist/` and API, and `npm run build` regenerates them.
4. Set `APP_URL` to the exact final HTTPS origin, e.g. `https://jobdesk.example.my` (no trailing slash/path). Hostinger provides `PORT` automatically.
5. Open the site. Existing SQLite data and job history are retained when the **same DB_PATH** is used. The new `0007_device_profiles.sql` migration creates a device-label table only; it does not clear existing jobs or members.

**Important:** This is a PIN-free, open testing build. Anyone with the URL can read and update jobs and, while shared-test access is enabled, can access workspace administration. The temporary selected name is **identification for convenience, not secure authentication**. Do **not** expose this deployment publicly with private customer information. Enable real authentication and roles before production use.

## Persistence, recovery and API

- Default DB: `data/jobdesk.sqlite`. Use an absolute, persistent, writable `DB_PATH` when replacing releases. The release ZIP deliberately contains **no live database**. **IMPORTANT:** Hostinger deployments rotate build folders; set `DB_PATH` to a persistent writable absolute path outside `hbuilds/current`/versioned build directories. Default `data/jobdesk.sqlite` inside the build tree can be lost when new versions deploy.
- Run a single application instance per SQLite file. Do not overwrite the existing database with an empty `data/` folder.
- `GET /api/health` checks readiness. If an update returns an origin error, confirm `APP_URL` matches the HTTPS address in the browser exactly.
- `/?demo=1` enables local sample data in the browser only. Data created in demo mode is not saved to SQLite.
- If you currently run v1.2.0, extract the new application code over it, but preserve your existing configured DB path and backups. Database migration is automatic on next process start.

### Local smoke checks performed for this ZIP

- Node.js runtime and SQLite schema migration (including upgrade from the v1.2.0 schema with retained job/member data).
- API: bootstrap, create Designer/Production member, register device alias, restore member identity, create job with recorded creator, delete member, reject assigning deleted member to a device.
- Render/interaction: desktop and 390px mobile, Team Overview, personal 3-card metrics, Settings member management, temporary user picker, responsive horizontal overflow and browser JavaScript errors.

**Not yet tested:** actual Hostinger deployment, concurrent real staff sessions, or physical Android/iOS devices. Frontend was compiled locally against the existing v1.2.0 bundled React 19 runtime because npm package downloads were unavailable in the test environment; a normal `npm run build` on Hostinger uses the updated source and Vite dependencies.

## v1.3.1 deployment correction

The previous v1.3.0 compiled assets into `public-built/` while Hostinger had `dist` configured, causing `ERROR: No output directory found after build`. v1.3.1 aligns generated frontend assets, Node static serving, and the precompiled ZIP to **`dist/`**. This change does not modify job, member, or database schema logic. The entry file remains **`server.mjs`**; do not select a static-only Vite/React deployment because it will not run the `/api/*` backend.

The npm audit warning shown in Hostinger logs is separate from the output-directory failure. Review `npm audit` and upgrade only after checking compatibility.

## v1.3.2 API response troubleshooting

If the screen shows an API/non-JSON error, open `/api/health` in the deployed domain. The backend must return `{"ok":true,"app":"Jobdesk"}` as JSON, not the frontend HTML page. If HTML is returned, Hostinger is serving the static build and not routing `/api/*` to `server.mjs`. See `V132_API_DEPLOYMENT_REPAIR.md` for the corrected Node.js settings and persistence guidance.
