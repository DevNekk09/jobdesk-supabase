-- Jobdesk V2.0: non-destructive security + performance upgrade.
-- No changes to jobdesk.admin_auth or admin PIN. No demo/user/job inserts.
BEGIN;
CREATE TABLE IF NOT EXISTS jobdesk.staff_invites (
 token_hash text PRIMARY KEY CHECK(length(token_hash)=64),
 user_id integer NOT NULL REFERENCES jobdesk.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 redeemed_at timestamptz
);
CREATE TABLE IF NOT EXISTS jobdesk.staff_sessions (
 token_hash text PRIMARY KEY CHECK(length(token_hash)=64),
 user_id integer NOT NULL REFERENCES jobdesk.users(id),
 device_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS activity_user ON jobdesk.activity(user_id);
CREATE INDEX IF NOT EXISTS job_spaces_owner ON jobdesk.job_spaces(owner_user_id);
CREATE INDEX IF NOT EXISTS jobs_assigned ON jobdesk.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS jobs_confirmed_by ON jobdesk.jobs(confirmed_by);
CREATE INDEX IF NOT EXISTS jobs_created_by ON jobdesk.jobs(created_by);
CREATE INDEX IF NOT EXISTS jobs_space ON jobdesk.jobs(space_id);
CREATE INDEX IF NOT EXISTS staff_invites_user ON jobdesk.staff_invites(user_id);
CREATE INDEX IF NOT EXISTS staff_sessions_user ON jobdesk.staff_sessions(user_id);
CREATE INDEX IF NOT EXISTS staff_sessions_device ON jobdesk.staff_sessions(device_key);
REVOKE ALL ON jobdesk.staff_invites,jobdesk.staff_sessions FROM PUBLIC,anon,authenticated;
COMMIT;
