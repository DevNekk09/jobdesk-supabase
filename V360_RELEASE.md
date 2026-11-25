# Jobdesk V3.6 stability release
- No schema, API or PIN changes. Shared editable workspace remains the user's chosen model; identity is not authentication.
- Undo requires exact mutation version and expected stage; suppress Undo when API returns a later writer's state. Dialog close invalidates late responses.
- Today's focus uses global overdue aggregate plus bounded current/next-month reads when needed. Counts missing on network failure are shown as a dash.
- Notification read markers local per browser and actor, bounded to 1000; no server read state or push notifications. Topbar count reflects loaded jobs and recent activity; opening Notifications fetches all months.
- Board stage totals include all matching rows; pagination unchanged. Empty stages may be hidden. Search results memoized with load more.
- Extracted record types, board, notification, hooks, stability helpers. New CSS in a separate stylesheet; full legacy CSS cleanup deferred to avoid regressions.
- Legacy branch Pages source remains; publisher now gates compiled assets on offline and browser regression tests. Release cache-key commit still needed after successful precompiled build. No automatic rollback or Pages settings change claimed.
