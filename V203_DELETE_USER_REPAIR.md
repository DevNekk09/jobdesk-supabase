# Jobdesk V2.0.3 — Delete User hotfix

## Root cause
The Delete User endpoint performs an atomic soft-delete and also revokes old staff sessions and unused invitations. Its SQL adapter only qualified five standard tables with the private `jobdesk` schema. Two existing tables, `staff_sessions` and `staff_invites`, were left unqualified, so PostgreSQL could not resolve them on the default search path. The Delete User transaction therefore failed and rolled back.

## Changes
- Add `staff_sessions` and `staff_invites` to the SQL compatibility translator in both root Node and deployed Supabase Edge Function, keeping both sources identical.
- Keep user soft-deletion, old Jobdesk space archiving, device-profile removal, session revocation and activity history intact and in one transaction.
- Add regression tests for both translated UPDATE statements and their entire Delete User flow.
- Preserve the V2.0.2 open shared workspace: all visitors can view/edit jobs without a private link, but **only Admin PIN mode** can manage users and perform permanent deletions.
- No new migrations, no data reset, no changes to original Admin PIN, original Admin Panel or green UI.

## Evidence / verification
Supabase PostgreSQL inspection confirmed `to_regclass('staff_sessions')` and `to_regclass('staff_invites')` return NULL while `to_regclass('jobdesk.staff_sessions')` and `to_regclass('jobdesk.staff_invites')` resolve. Both qualified UPDATE operations pass EXPLAIN without touching user records.

CI runs SQL adapter translation, offline regression tests and Playwright desktop/mobile browser flows. Real account deletion in production is intentionally **not** executed as part of verification.

## Operation
Open the normal Jobdesk URL → enter existing Admin mode PIN → Settings → Team members → Manage user → Delete user → Confirm. The user is soft-deleted and their linked Jobdesk disappears from the sidebar; jobs and activity remain retained.
