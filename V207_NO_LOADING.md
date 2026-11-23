# Jobdesk V2.0.7 — Remove startup loading

- Removed the centred "Opening your workspace…" view and its animated spinner.
- While the initial API request runs, users see the stable Jobdesk workspace frame with sidebar brand and Team overview header, not a splash.
- The static HTML boot fallback uses the same workspace frame (without animations). Only if JavaScript fails to start after 12 seconds does it reveal Reload Jobdesk.
- Error/retry screens remain to report actual connection failures.
- No Supabase, database, Admin PIN, users, jobs, or workflow changes.
- Added browser regression covering a delayed API response and ensuring no splash/spinner.
