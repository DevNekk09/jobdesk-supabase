# Jobdesk V2.0.0 — Release notes and deployment runbook

## Architecture
- Frontend: GitHub Pages `https://devnekk09.github.io/jobdesk-supabase/`.
- Backend: Supabase Edge Function `jobdesk-api` in the existing Supabase project.
- Database: PostgreSQL in the **private** `jobdesk` schema.
- Hostinger is not required.

## NON-NEGOTIABLE: Admin PIN and Admin Panel preserved
- **The existing Admin PIN value and bcrypt hash were not changed.**
- Original Admin Settings markup and the complete Admin PIN modal markup are byte-for-byte identical to Jobdesk V1.8.0.
- Original Admin lock/unlock mechanism still uses server-verified, time-limited Admin sessions.
- Never store the PIN or hashed PIN in GitHub, public documentation, or frontend source.

## V2 staff access (breaking access improvement)
Previously, anyone with a shared workspace link could select another staff name and attempt staff actions. From V2.0 onwards, **name selection alone cannot authorize writes**.

1. Open the existing workspace link.
2. Admin enters their unchanged Admin PIN via the existing UI.
3. Open **Switch workspace identity** (profile button in the header).
4. Under **Team Access · Private Invitations**, choose a Designer or Production member and click **Generate link**.
5. Share the generated invite URL with that member privately. An invite is valid for **24 hours** and is **single use**.
6. A staff member opens the link on their own browser. It verifies their device and creates a revocable staff session lasting up to **30 days**. No email signup or staff PIN is needed.
7. Staff can sign out using the same identity dialog; Admin can revoke all sessions and unused invitations for that staff member at any time.

A staff member moving to a different browser needs a new invitation. The existing Admin PIN and Admin Panel do not change.

Workspace-link holders who have not redeemed a personal staff invitation can still see shared workspaces, but can no longer write jobs as arbitrary staff members.

## V2 UI and performance changes
- **Cross-month overdue cards**: overdue totals are computed in PostgreSQL across every month, including the personal space view. Clicking Overdue switches to all-month filtering so the list agrees with the card.
- Keep the original green theme, Overview / + / Spaces floating navigation, Jobsheet, Urgent Jobs and Production sections.
- CSS and mobile layouts are unchanged except for compact invitation controls in the identity picker.
- React's existing month-scoped loading, retry-on-refresh and animated success indicators remain.
- npm dependencies are locked in `package-lock.json`; CI and deployment use `npm ci`.
- Playwright browser tests verify desktop/mobile rendering, Admin PIN modal visibility, dock, footer and viewport overflow without writing to the live database.

## Private database changes
The audited, idempotent migration source is `supabase/v200_upgrade.sql`. It adds:
- `jobdesk.staff_invites` — one-time SHA-256 invitation hashes.
- `jobdesk.staff_sessions` — revocable per-device session hashes.
- Foreign-key supporting indexes reported by Supabase Performance Advisor.

**No existing users/jobs/spaces are deleted or reset. No demo data is inserted.** Admin PIN hash is left untouched. Existing `anon` and `authenticated` SQL roles have no access to the private schema.

## Security considerations
- Treat all invitation links as credentials. Send them privately; do not publish them in GitHub issues.
- Staff sessions are bearer tokens plus a browser-held device identifier, not hardware attestation. Stolen browser storage could permit session replay. Full SSO/passkey auth remains an option for more sensitive operations.
- The workspace invitation is still a shared read-access secret. Avoid sensitive customer records until team access requirements and production security reviews are complete.
- `jobdesk` is a non-exposed schema with revoked Data API permissions. RLS is not enabled yet; enabling it requires verification of the backend database role and a dedicated rollout.
- Global Admin PIN failed-attempt lockout is retained exactly as before because the user requested PIN behavior preservation. Monitoring and incident response should cover deliberate lockouts.
- GitHub Pages **Settings → Pages → Source must be GitHub Actions**. The legacy automatic branch publishing workflow can otherwise overwrite the compiled Vite site, and the connector cannot change that account setting.

## Deployment checklist
1. `npm ci`
2. `npm run verify:source`
3. `npm run build` and `npm run build:pages`
4. `npm run test:offline`
5. `npx playwright install chromium` then `npm run test:e2e`
6. Apply `supabase/v200_upgrade.sql` to the existing Supabase project (already done in this deployment).
7. Deploy four Edge Function sources together (index.ts, api.ts, lib/database.mjs, lib/sql.mjs).
8. Merge release branch and deploy GitHub Pages from the compiled Vite artifact.
9. Verify unchanged Admin Settings/PIN markup, admin-auth hash fingerprint and database row counts.
10. Test a real staff invitation in a normal browser before storing sensitive customer information.

## Rollback
- Frontend: revert the V2.0 commit and redeploy the prior GitHub Pages artifact.
- Backend: redeploy the prior Edge Function bundle from the previous GitHub commit.
- The new private tables can remain unused without affecting V1.8.0.
- **Do not delete the newly created tables or reset the database as part of rollback.**

## Validation limitations
CI checks are synthetic/offline browser tests with mocked API responses. They are not a substitute for a live, authenticated multi-device acceptance test, a penetration test or backup/restore drill.
