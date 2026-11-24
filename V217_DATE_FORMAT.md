# Jobdesk V2.1.7 — Day / Month / Year dates
- All date displays use DD/MM/YYYY instead of month-name or year-first format.
- Date input fields for creating and editing jobs accept DD/MM/YYYY and validate actual calendar dates (including leap years).
- API and Supabase continue using ISO YYYY-MM-DD; due-date sorting, month filtering, overdue logic, and server validation remain unchanged.
- Date/time activity timestamps show DD/MM/YYYY HH:mm in Malaysia-local time.
- Job-list CSV exports display dates in DD/MM/YYYY.
- Dashboard priority watch shows day plus MM/YYYY under it.
- Desktop and phone share the same UI, with responsive browser regression tests.
- Database, Admin PIN, jobs and access control unchanged.
