# Jobdesk V1.8.0 — GitHub Pages + Supabase release

## Scope and design freeze

This release upgrades the existing green Jobdesk frontend and its Supabase Edge API. **No Hostinger** is involved. The **Admin Settings Panel** and **Admin PIN modal** retain the exact V1.6.2 markup and presentation. The existing PIN, user records, and job records are not changed by this release.

## Security (V1.6.3 fixes)

- Only a server-verified Admin session from `jobdesk-api` can be treated as Admin. The Edge wrapper discards any inbound `x-edge-admin-verified` header and appends one only after validating a hash-matched, nonexpired admin session.
- A selected browser member ID cannot impersonate an Admin profile; allowed shared staff roles are Designer, Production/Print and Sales.
- Permanent job deletion and whole-Trash clearing now require Admin authorization. The associated destructive buttons are not shown to non-Admin members.
- Guest/browser users cannot add job notes or perform job-status updates. Workspace URL remains a shared invite link for testing.

**Remaining limitation:** Staff identification uses a selectable browser profile, not individual authentication. A link-holder may still impersonate another staff member's non-Admin identity. Real audit-grade per-person permissions need signed member invitations, passkeys, or Supabase Auth. Do not put sensitive customer data into this testing workspace.

## Architecture (V1.7.0 changes)

- `app/components/Icon.tsx`: reusable icon renderer.
- `app/components/QuickDock.tsx`: stable Overview / Add / Spaces dock.
- `app/components/JobSaveFeedback.tsx`: animated saved-to-Supabase feedback.
- `app/services/jobdesk-api.ts`: typed API request path, admin session headers, JSON handling, a 25-second request timeout.
- `app/lib/dates.ts`: cached Malaysia-timezone formatters.
- `app/styles/fluid.css`: non-Admin fluid animation overrides, imported after the original global green styles.
- `api.ts` and the Edge API route source remain **byte-identical**, preventing mismatched business rules in development.

## Performance & UX (V1.8.0 changes)

- `/api/bootstrap?month=YYYY-MM` requests only jobs due within that month from PostgreSQL. `month=all` intentionally fetches all jobs.
- `available_months` metadata preserves the full month dropdown without fetching all jobs each time.
- Multiple outstanding refreshes are sequenced to avoid stale responses overwriting a newer month.
- Successful server writes update local job state immediately, then refresh the workspace. If the refresh fails, the job is retained and a nonblocking **Retry refresh** message is shown.
- The existing fluid dock, cards and save-success microinteractions remain; reduced-motion accessibility remains enabled.
- Prevent clearing all Trash while a month subset is selected. Choose **All months** before permanently clearing Trash.

## Validation and deployment

```sh
npm install
npm run verify:source
npm run build:pages
npm run test:offline
```

GitHub Actions should report successful source validation, production Vite compilation and offline tests before merging. The deployed Supabase `jobdesk-api` Edge Function must be upgraded with `index.ts`, `api.ts`, `lib/database.mjs` and `lib/sql.mjs` **as one versioned unit**.

GitHub Settings → Pages → Source must be set to **GitHub Actions** so branch-source publishing cannot overwrite the production Vite artifact.

## No data changes

No schema migration, table deletion, seed jobs or edits to existing Supabase job data are required. Existing user IDs and job versions are preserved.