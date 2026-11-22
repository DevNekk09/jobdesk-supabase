# GitHub → Hostinger Node.js Web App deployment

1. Create a **private GitHub repo**, such as `jobdesk-supabase`. Unzip this archive, select all files and folders **inside**, and commit them at the repository root. Do not upload `.env` with passwords or any `.sqlite` data.
2. Hostinger hPanel → **Websites → Create Website / Web App → Import Git Repository**. Authorize GitHub and select this repository's `main` branch. Do not deploy as Static Website, GitHub Pages or legacy PHP/HTML Git integration.
3. In Hostinger **Build / Output Settings**:

| Field | Use |
|---|---|
| App type | Node.js Web App |
| Framework preset | Other (not Static React/Vite) |
| Node.js | 22.x |
| Root | `./` |
| Package manager | npm |
| Build command | `npm run build` |
| Entry file | `server.mjs` (mandatory) |
| Start command | `npm start` if offered |
| Output directory | Blank if offered for server apps. If required, `dist`; it contains only static assets, NOT the server entry. |

4. Add **server-side environment variables**: `DATABASE_URL` from Supabase Session pooler, `APP_URL` set to exact HTTPS domain, optional `PG_POOL_MAX=5`. `PORT` is supplied by Hostinger.
5. Deploy; open Runtime Logs to look for `Jobdesk HTTP listening on port ...` and no Supabase initialization failures.
6. Visit `https://YOUR-DOMAIN/api/health` and `https://YOUR-DOMAIN/api/bootstrap` and confirm **JSON**, then load the web UI.

**First launch is intentionally empty:** go to Settings → Team members to add actual Designer/Production users. No samples are provisioned.

If HTTP 403/HTML 404 continues, verify the site is managed by Hostinger's Node.js Web App runtime and reverse proxy reaches `server.mjs`. Repeatedly uploading ZIPs cannot correct a static-site routing configuration. If `/api/health` is JSON 503, check `DATABASE_URL` and Supabase permissions in Node Runtime Logs.

The source does **not** migrate any prior SQLite records. Back up the existing Jobdesk database first and keep it safe until real historical records are intentionally imported into PostgreSQL.
