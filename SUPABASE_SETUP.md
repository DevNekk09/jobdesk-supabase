# Connecting Jobdesk to Supabase (PostgreSQL)

1. In Supabase, create/open your desired project. Find **Connect → Session pooler** connection details. Copy the connection string and enter your actual database password; URL-encode special password characters. A **session pooler (port 5432)** is appropriate for a persistent Node server such as Hostinger, especially on IPv4 networks. Use the specific host supplied by your project; do not copy sample placeholder values as-is.
2. In Supabase **SQL Editor**, you can execute `supabase/schema.sql` once. The Node server also executes this idempotent schema on startup, using an advisory lock to avoid duplicate first-run migrations. It creates a private `jobdesk` schema, five tables and indexes. It inserts **zero sample jobs or members**.
3. Hostinger → Web App → **Environment variables**:

```text
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<ENCODED_PASSWORD>@<YOUR_POOLER_HOST>:5432/postgres?sslmode=require
APP_URL=https://<YOUR_EXACT_JOBDESK_DOMAIN>
PG_POOL_MAX=5
```

- Credentials must be added only in Hostinger server environment variables and must never be saved to GitHub, browser storage, frontend `.env` or screenshots.
- `APP_URL` must match the real HTTPS domain exactly. It is used to validate browser write origins.
- Node database connections use `pg` directly, not the public Supabase JavaScript Data API. Do **not** expose the `jobdesk` schema through Supabase Data API and do not place the database password in the React code.
- **No RLS/auth user policies are configured**: the database is protected by private schema and server credentials, but the **application itself is openly writable** until real auth is added.
- To connect to a project already holding unrelated tables, the app only creates/uses `jobdesk.*`; it does not delete or modify `public.*`.

After deploying, check these endpoints in your own domain:

- `GET /api/health` should be HTTP 200 JSON: `{"ok":true,"app":"Jobdesk"}`
- `GET /api/bootstrap` should be HTTP 200 JSON containing `users`, `jobs`, `spaces`, `devices`, `activity` arrays.
- With an empty project, those arrays should be empty (apart from the invisible internal `Shared team` identity, excluded from member lists).

### Troubleshooting

- **HTML 404 / 403:** Hostinger is not routing traffic to `server.mjs`; redeploy as Node.js Web App, not static frontend. Check Entry file and Runtime Logs.
- **JSON 503:** Node server runs, but `DATABASE_URL` is absent/invalid, the Supabase project is paused/unreachable, or SQL permissions are insufficient. Check server Runtime Logs for the specific error.
- **Origin not allowed (403 on POST/PATCH):** Check `APP_URL` exactly matches HTTPS site URL.
- **Workspace check failed (403 on POST/PATCH):** Reload app so the CSRF cookie from `/api/bootstrap` and token are in sync; allow same-site cookies.
- **Existing SQLite records missing:** This is a fresh PostgreSQL schema. Old SQLite data has not been moved. Preserve SQLite backup for a separate reviewed migration.

### Security warning

This testing build currently allows all URL visitors to read or modify records; Supabase hosting does not itself secure unauthenticated Jobdesk actions. Enable actual user authentication and enforce role permissions before using client or business data on a publicly reachable URL.
