# Jobdesk V2.0.6 — favicon and startup recovery

## Changes
- Browser tab now loads the exact existing green sidebar icon (public/icon.svg) with a cache-busting URL. Retired blue favicon assets are replaced with the same SVG.
- Opening brand: left-aligned "Jobdesk" and "KSL Job Management" beside icon, with aligned loading status.
- Static preboot splash is present before JavaScript loads, including a delayed refresh option when assets fail.
- React error boundary and no-data recovery state avoid a fully white viewport after render failure; bootstrap job response is checked before rendering.
- Recoverable API failures expose a Try again action; job lists get Refresh and Show all jobs actions for empty filters.
- Added desktop/mobile regression tests with 5 confirmed jobs, missing JS, API failure, corrupted response, and favicon identity.

No Admin PIN changes, no database reset, no schema migration, no user/job deletion.
