# Jobdesk V2.1.1 — Faster Startup

## Changes
- Preconnect and DNS-prefetch the existing Supabase Edge API from the HTML head, allowing the browser to start TCP/TLS setup while the JavaScript bundle loads.
- Combine initial idempotent system-account creation (Admin + public Team editor) into one SQL statement, and fetch both records in one SELECT. Reduces four sequential database statements to two, without changing any existing role or PIN protection.
- Prevent visibility/focus refreshes within 30 seconds of a successful bootstrap; manual refreshes and writes still query the server.
- Force a versioned URL for the *legacy GitHub Pages Jekyll* compiled JS/CSS bundle, so browsers refresh the application when upgrading but reuse resources on subsequent navigations.
- Keep GET API no-store and server-authoritative data. No localStorage caching of jobs/customer records. No new fake loading screen.
- Existing API response structure, database schema, Admin PIN, public editing, sidebar drag/sort, and original UI remain unchanged.

## Verification
- Offline regression for merged system identities and API parity.
- Browser regression checks no immediate duplicate bootstrap request after visibility event, while manual Refresh jobs still works.
- No live database reset, user deletion, or data migration.
