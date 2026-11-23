# Jobdesk V2.0.8 — GitHub Pages dual-deployment recovery

## Confirmed root cause
The repo has two independent Pages publishing mechanisms: 
- custom GitHub Actions Vite build, publishing /dist (compiled React)
- automatic GitHub Pages Jekyll build, publishing the raw main branch.

Jekyll publishes the uncompiled index.html which references /frontend/main.tsx, and retains the literal %BASE_URL% token, leaving a fake Team overview and broken image. Previous CI green was misleading because it only tested Vite preview.

## Compatibility repair
- Keep Vite custom workflow unchanged for compiled releases.
- Additionally publish exact compiled production JS+CSS to root assets/ on main, where the legacy Jekyll branch publisher can serve them.
- Raw index detects its raw .tsx entry and loads the prebuilt JS+CSS from /jobdesk-supabase/assets/.
- Compiled Vite index does not execute the raw fallback (no duplicate React mounting).
- Raw fallback icon uses absolute /jobdesk-supabase/icon.svg to avoid literal env placeholder.
- No database changes, authentication changes, or new loading screen.

Recommended permanent repository configuration: Settings > Pages > Build and deployment > Source = GitHub Actions. Once that is set, legacy compatibility can be removed.
