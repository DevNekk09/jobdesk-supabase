# V2.3 GitHub Pages deployment stability

The repository is configured with a branch-based GitHub Pages publisher, which runs the default Jekyll "pages build and deployment" workflow. The previous separate actions/deploy-pages job competed with Jekyll, sometimes failing after its own build succeeded, and previously could publish a different app version.

The custom build workflow now ONLY:
1. npm ci
2. build:pages (Vite)
3. verify compiled assets
4. commit the two precompiled fallback assets to main with [skip ci]

Jekyll remains the sole Pages publisher, consuming index.html and the versioned compiled JS/CSS from the main branch. This avoids two publishers racing for the live website.

Raw index's precompiled bundle cache query is bumped to v230, forcing browsers/CDN to fetch the new V2.3 bundle. No database or Supabase changes.
If GitHub Pages is later switched to Source=GitHub Actions, the workflow needs its Pages artifact/deploy job re-enabled.

## Task Ticket release refresh

The previous fixed v230 query remained unchanged across several UI releases. The branch publisher can also serve the previous bundle because commits pushed with GITHUB_TOKEN do not start a Pages build. Once the precompiled assets are present on main, publish a direct non-workflow commit with a new matching CSS/JS cache key. This release uses `230-ticket20-e4edd65`. This does not require another Supabase deployment. For fully automated future releases, migrate Pages Source to GitHub Actions and use a single artifact deployment workflow instead of the legacy branch publisher; do not run both publishers.
