# Jobdesk V2.1.6 — Refined Progress Visuals

## Both desktop and phone
- Keep distinct designer/production stage colors while replacing saturated inks/backgrounds/borders with muted corporate colors.
- Job list status badges now use medium-weight labels, pale surfaces, and thin one-pixel borders.
- File progress quick-nav removes thick 3px top borders in favor of subtle 1px rules.
- Progress bars and Production overview indicators use softened tones rather than saturated ink.
- Production sidebar selected status uses subtle weight and 2px accent; modal current step loses the oversized halo.
- Mobile at <=700px keeps the same meaning with compact padding and font sizing.
- Stage text labels, progress logic, permissions, jobs, admin PIN, Supabase and workflows are unchanged.
- CI tests verify desktop/mobile badge contrast styles and that all stage colors remain distinct.

UI standards for future Jobdesk changes: apply and test changes on both desktop and phone.
