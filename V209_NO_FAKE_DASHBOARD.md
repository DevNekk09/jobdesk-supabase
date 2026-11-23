# Jobdesk V2.0.9 — Remove fake dashboard before actual app

## User-reported issue
Mobile browser shows a dark logo bar and "Team overview" blank white panel before the actual dashboard loads. The screenshot is NOT the real dashboard.

## Root cause
There were TWO artificial first-load UIs: a static data-preboot markup in index.html AND an initial-workspace React view returned while /api/bootstrap is pending.

## Changes
- Remove both artificial Team overview placeholders and all interim loading UI/spinners.
- Render actual dashboard only after bootstrap resolves. Until ready the page has only its theme background; no misleading title or fake controls.
- Retain React's explicit failed bootstrap message and Retry control.
- If compiled JavaScript does not load, show an actionable Reload Jobdesk error after 12 seconds (or immediately on legacy-bundle network error), not an indefinite blank page.
- The legacy Jekyll/compiled fallback still injects versioned production JS/CSS; keep compatibility with both Pages publishing modes.
- All workspace data, users, Admin PIN and Supabase API remain unchanged. Frontend-only.

## Regression
Test delayed bootstrap without placeholder and missing compiled script with recovery; keep legacy publisher browser test.
