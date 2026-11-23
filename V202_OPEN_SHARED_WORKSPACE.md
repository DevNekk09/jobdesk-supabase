# Jobdesk V2.0.2 — Open shared workspace

## User request
Remove private workspace and staff invitation links. Return to the simple team workflow where **anyone can open the normal website URL and view, add and edit jobs**.

## What changes
- The Edge API no longer checks the shared workspace token.
- The old Admin-issued one-time staff-invitation and bearer-token endpoints are no longer used.
- The frontend loads without a workspace key and clears legacy invitation values in browser storage.
- Staff-name selection is optional. Each browser can remember a chosen active staff name without a sign-in.
- Anyone without a name selected edits under a non-Admin **Team member** system identity, ensuring activity history never incorrectly attributes these edits to Admin.
- Guest/team editors can create, edit, confirm, move between stages, update production, comment and move jobs to Trash.
- **Admin PIN and Admin Panel remain unchanged.** Member management, space management, and permanent deletion still require an authenticated Admin session.
- Existing green UI, desktop/mobile layout, Jobsheet/Urgent metrics, archived-member sidebar fixes and save feedback are preserved.

## Important security implications
This intentionally provides public read and write access. Any person with the URL can view/alter jobs and impersonate a listed staff name. Activity history does not prove which person made changes. The Admin PIN only protects administrative and irreversible actions, not confidentiality of jobs. Do not store sensitive customer data or share this site outside a trusted environment.

## Database
No migration or deletion of existing data. The existing private schema, unused workspace-access records and old staff-session tables remain intact for reversible rollback. The system creates a non-demo `Team member` actor row on first use, only for correctly attributing public edits.

## Verification & rollback
- CI source validation, offline authorization tests, desktop/mobile browser smoke tests and a synthetic create-job flow run before merge.
- Verify the original Admin PIN modal and PIN validation source remain identical.
- Deploy Supabase Edge Function and compiled GitHub Pages on green CI.
- To roll back, redeploy previous V2.0.1 Edge Function source and frontend; historical access records remain untouched.
