# Jobdesk V2.0.5 — Full inspection repair
- Admin Delete User now detaches **active jobs** from archived designer desks and inactive assignments within the same transaction; historical closed/trashed jobs and activity are retained.
- Reserved Admin and Team member identities cannot be deleted through an arbitrary user ID.
- Editing older jobs with a legacy archived desk or inactive assignee safely normalizes them to All Jobs, while new assignments cannot target archived staff/desks.
- Deleted jobs cannot be edited using generic status or note endpoints; Cancelled/Archived jobs can only move to Trash or be permanently deleted.
- Empty workspace Quick Add works with zero members/desks, using the shared All Jobs list.
- Admin-only JSON backup download added to General > Danger zone before reset.
- Reset UI clears stale cards once the server confirms success.
- Verified Admin PIN and shared editing rules are unchanged. No schema migration and **no actual data reset** as part of this patch.
- External artwork links are metadata: purging a job does not delete objects from third-party storage.
