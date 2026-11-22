# Jobdesk V2.0.1 — Removed-user sidebar repair

## Root cause
V2.0 soft-deleted members by setting `users.deleted_at` and clearing the member's
`job_spaces.owner_user_id`. The underlying Jobdesk space remained in the database.
The sidebar treated every unowned space as an active designer space, so the
removed person's name continued to appear in navigation.

## Repair
- Add nullable `jobdesk.job_spaces.archived_at` without deleting rows or altering Admin PIN.
- Archive linked spaces when a member is removed. Keep jobs, activity and space records
  for historical reference. Revoke existing staff sessions and unused invitations.
- Hide archived spaces in Supabase bootstrap, member assignment and space management.
- For an already-deleted member, backfill **only** unowned spaces whose name exactly
  matches a deleted member AND no active member of the same name.
- Keep standalone, manually-created unowned spaces visible.
- Optimistically remove the deleted member and archived desks from the sidebar
  after a successful API write. If another browser archives the currently viewed
  desk, return navigation to **All designers**.
- Return a clear conflict if someone tries to create a member with the name
  of an archived Jobdesk; history is intentionally not silently transferred.

## Data and Admin invariants
- Existing jobs, documents, activity, user profiles and space rows stay preserved.
- No demo data, no destructive migration and no Hostinger.
- Admin Settings design, six-digit PIN and server-side PIN verification are unchanged.

## Deployment
1. Run the non-destructive SQL from `supabase/v201_archive_deleted_member_jobspaces.sql`.
2. Verify `archived_at` exists and existing orphaned deleted-member space is archived.
3. Deploy the four `jobdesk-api` Edge Function source files together.
4. Merge to main and let GitHub Actions compile and publish the frontend.
5. Verify `npm run test:offline` and Playwright desktop/mobile tests.
6. Set GitHub Pages Source to GitHub Actions, to prevent an old branch workflow
   from publishing raw frontend files.

## Scope limitation
Archiving is not permanent deletion. Historic jobs may still contain the removed
member's name as author, assigned user or space metadata. These historical records
are intentionally preserved; they are not sidebar navigation entries.
