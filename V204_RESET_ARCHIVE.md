# Jobdesk V2.0.4 — Admin reset and archive cleanup

- **Full database reset** in Settings > General > Danger zone, restricted to a verified Admin PIN session.
- Requires typed RESET JOBDESK, review dialog and explicit confirmation; no automatic reset at deployment.
- In a single database transaction clears activity, jobs (including Trash / Cancelled archive), device profiles, legacy staff sessions/invites, workspace tokens, spaces and non-system staff members.
- Preserves Admin PIN/hash, admin session infrastructure, schema, and reserved Admin/Team member system profiles. No external Google Drive/URL files are deleted.
- Admin can now permanently delete a Cancelled (Archived) job directly from its details, in addition to Trash jobs, with the same version guard and FK-safe activity cleanup.
- No new schema migrations. No changes to Admin PIN, public shared editing or UI theme.
- **High risk / irreversible**: create a database backup before manually invoking Full database reset.
