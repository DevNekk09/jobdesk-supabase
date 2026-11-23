-- V2.0.1: preserve historical Jobdesk rows while hiding spaces of removed members.
-- Idempotent and non-destructive: no users/jobs deleted, no Admin PIN changes.
BEGIN;
ALTER TABLE jobdesk.job_spaces
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
-- Backfill only orphan spaces that exactly match an already-deleted member.
-- Unowned spaces created manually, or spaces matching an active member, stay visible.
UPDATE jobdesk.job_spaces AS s
SET archived_at = now()
WHERE s.archived_at IS NULL
  AND s.owner_user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM jobdesk.users AS removed
    WHERE removed.deleted_at IS NOT NULL
      AND lower(btrim(removed.name)) = lower(btrim(s.name))
  )
  AND NOT EXISTS (
    SELECT 1 FROM jobdesk.users AS current_member
    WHERE current_member.deleted_at IS NULL
      AND lower(btrim(current_member.name)) = lower(btrim(s.name))
  );
COMMIT;
