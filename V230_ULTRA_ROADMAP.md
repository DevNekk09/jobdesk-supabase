# Jobdesk V2.3.0 — Consolidated Ultra Upgrade

## Delivered
1. V2.2.0 Compact Job Cards: restrained card rows preserving existing table DOM/test selectors, soft progress, 1px borders, native dates. Responsive at 320/390/768/1024/1366 pixels.
2. V2.2.1 One-tap Progress: authorized Designer/Admin can advance the next file-preparation stage directly from a job row with existing API/version checking. Production gets a compact Next step control.
3. V2.2.2 Smart Filter & Search: reusable Today, Next 3 days, Overdue deadline filters with counts across Designer and Production. Search matches job name, reference, designer, stage and priority. React deferred search keeps typing responsive; legacy dropdowns/export remain.
4. V2.2.3 Save & Sync Reliability: a single mutation at a time in the browser protects against double submission; offline banner, disabled quick controls, conflict 409/version handling refreshes from Supabase and warns user without auto-retrying the write. Failed form saves keep the form open.
5. V2.2.4 Production Handover: origin designer and due-date context, files-ready indicator, compact rows, production pagination (24 jobs and Show More). Original stage workflow remains authoritative.
6. V2.3.0 Performance & Accessibility: extracted deadline filters, search and sync helpers, reusable accessible dialog; reduced search rerender work and avoided polling during mutations; focus outlines, responsive layouts and reduced-motion support.

## Deliberately unchanged
Supabase database schema, Admin PIN, roles, shared editing mode, all real job data, API contracts, permanent-delete confirmations and activity history. No data migration or production delete occurred.

## Limitations
This is NOT an offline queued-write system; offline saves are blocked to prevent silent data loss.
The core Home component is still large. Existing workflows and business logic were retained instead of risky full replacement.
Live Supabase two-user race testing requires controlled staging. CI mocks test conflict recovery without changing real jobs.
