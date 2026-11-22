# Jobdesk v1.3.2 — Hostinger API Startup Diagnostics

## Why the previous deployment showed “Unexpected token '<'”

The browser requested `/api/bootstrap` and attempted to parse the response as JSON. The HTML doctype is evidence it received an HTML page instead, often because Hostinger published the Vite assets as a static website without starting the Node backend. The precise Hostinger app settings cannot be verified from the screenshot alone.

**Configuring `dist` as the output directory by itself is not sufficient.** `dist` contains only the React frontend. The SQLite API must run from `server.mjs`.

## Required Hostinger deployment settings

- Deploy the ZIP as a **Node.js/server-side** application, not static-only React/Vite.
- Framework: Other. Node: 22. Build command: `npm run build`.
- **Entry file: `server.mjs`** (do not leave as `none`).
- **Output directory: blank / not required for Node.js** if the Hostinger UI allows it. The server itself serves the built `dist/` folder. If Hostinger requires an output directory, `dist` is the correct built asset directory, but **Entry file is still required**, and server-side app type must be selected.
- Start command: `npm start`, if there is an editable Start command field.
- Keep `APP_URL` to the exact HTTPS site origin (no path) and `DB_PATH` to the existing **persistent** absolute path.
- Confirm the deployed site at `/api/health`: the actual Node server returns `{"ok":true,"app":"Jobdesk"}` with JSON Content-Type.
- Then load `/api/bootstrap`; the response should be JSON containing `users`, `jobs`, `spaces`, `csrf`. If either shows HTML, fix Hostinger routing/app type rather than replacing the database.

## App-side changes

- Distinguishes non-JSON API responses from invalid JSON, instead of showing `Unexpected token '<'`.
- Error screen links to `/api/health` to simplify diagnosis.
- Basic bootstrap shape validation gives a targeted error if another app responds under the same URL.
- No changes to API, SQLite migrations, jobs, member data, business logic or authentication mode. All v1.3.1 features remain intact.

## Backup and security

Do not delete/recreate the database to address this error; it is an API routing/startup problem. Back up SQLite and preserve `DB_PATH` before redeployment. This remains a password-free **test-only** application, not suitable for sensitive production data.
