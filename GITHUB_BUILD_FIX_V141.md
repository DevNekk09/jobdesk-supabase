# V1.4.1 GitHub Actions `UNRESOLVED_ENTRY` fix

## What failed

The previous archive **did include** `frontend/index.html`, but the GitHub Actions checkout did not contain it at build time. This is usually a partial/misplaced GitHub upload. The remote repository is not directly inspected by this package.

## Change

- Root `index.html` now contains the production Vite entry and imports `/frontend/main.tsx`.
- `npm run build` explicitly builds the root `index.html` into `dist/` and transpiles `api.ts` into `api.mjs`.
- `npm run verify:source` validates mandatory files before any dependency installation; GitHub Actions also checks that entry/source files were **committed to Git**.
- All Jobdesk frontend, API, Supabase schema, and zero-demo-data behavior are preserved from V1.4.0.

## Fix existing GitHub repository

1. Extract `Jobdesk_V1.4.1_GITHUB_CI_ENTRY_FIXED_FULL_SOURCE.zip`.
2. Upload **contents of its root**, retaining directory structure, into the **root** of `DevNekk09/jobdesk-supabase`, not inside a nested directory.
3. Verify in GitHub file browser: `index.html`, `frontend/main.tsx`, `build.mjs`, `api.ts`, `server.mjs`, `app/page.tsx`, `.github/workflows/verify.yml`.
4. Commit changes to `main` and rerun workflow `Verify Jobdesk source`.
5. For Hostinger use a **Node.js Web App**, entry file `server.mjs`, start `npm start`, and `DATABASE_URL` configured on server. Do NOT use GitHub Pages.

Git CLI alternative from the extracted repository root (replace `<repo-path>`):

```bash
git clone https://github.com/DevNekk09/jobdesk-supabase.git
# Copy ALL extracted Jobdesk V1.4.1 files into the clone, preserving folders.
cd jobdesk-supabase
git add -A
git commit -m "fix: restore Vite root entry and verify GitHub source"
git push origin main
```

**No credentials or sample jobs are bundled.** This patch does not create or modify a live Supabase database.
