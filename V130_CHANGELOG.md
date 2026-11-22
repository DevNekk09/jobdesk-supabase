# Jobdesk v1.3.0 | 22 November 2026

## User-requested update

1. Member addition, editing and deletion: **Settings → Team members only**. Removed those actions from team bars and overview.
2. The Production Jobdesk remains a single **shared** workflow for Production staff. Individual Designer Jobdesks remain team-visible.
3. Team Overview redesigned: dark forest-green command hero, four operational indicators, designer roster cards, production pulse, priority watch, and compact job table; responsive layouts.
4. Temporary user per browser: select staff name and set voluntary PC label. Remembers selection, attributes activity, and records current device associations in SQLite. A reset to shared testing mode is available. No login, PIN, or hardware fingerprint.
5. Personal desk: Active / Due in 3 days / Overdue metric cards and compact stage bar.
6. Month filter: defaults to Malaysia current month; filters by due-date month, and offers All months.

## Database compatibility

Added `drizzle/0007_device_profiles.sql`: a `device_profiles` table with device ID, user-defined label, member ID, timestamps and an index. Existing tables and rows are not destroyed. Member deletion removes only its device associations and soft-deletes the existing profile; job history is retained.

## Packaging

This release includes the TypeScript/React source, compiled JavaScript + CSS, Node server and migration SQL. No user database included. Production security requires replacing open test mode with authentication before live use.
