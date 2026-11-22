# V1.4.0 — GitHub + Supabase PostgreSQL

- Rebuilt as source GitHub repository with Hostinger Node.js entry file.
- Replaced SQLite with a server-only Supabase PostgreSQL connection via `pg`.
- Added `supabase/schema.sql` for private PostgreSQL schema and five application tables.
- Removed auto-created sample Designer spaces, fake users/jobs and the frontend demo mode.
- Preserved six V1.3.0 workflow features: Settings-only member management, shared Production, Team Overview, temporary browser profiles, Personal status cards and current-month filtering.
- Updated atomic job creation (RETURNING id), edit/version conflict handling, trash deletion and activity logging to PostgreSQL transactions.
- Added GitHub Actions build checks, SQL translator tests, `.env.example`, live diagnostic scripts and deployment documentation.
- Breaking storage change: **does not import SQLite data automatically**. Preserve your old DB backup.
- Not hardened for public production usage: no authentication/PIN, as requested for testing.
