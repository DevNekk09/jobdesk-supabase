# Jobdesk V2.1.3 — No Drag Sidebar & Responsive Screen Audit

## Sidebar
- Removed designer name drag-and-drop, six-dot handle, pointer capture handlers and Alt+Arrow keyboard reordering.
- Kept tap/click to open a Designer Jobdesk, with selected designer rising to the top. The last selected designer is stored as a per-browser preference.
- Previous manual drag order is no longer used; no database changes.
- Kept Production in the separate sidebar footer directly above Settings.

## Responsive layout
- Fluid sidebar width on desktop, with a tablet midrange and mobile off-canvas sidebar that fits viewport width.
- Main content and topbar respect the remaining viewport width; clipping and flex overflow protections for long names.
- Mobile: two-column statistic cards, filter controls wrap within screen, tab bars and very wide desktop tables scroll inside their own panels.
- Dashboard and Settings grids use smaller layouts below tablet breakpoints; short-height mobile sidebar keeps Production and Settings visible.
- Modal width/height constrained within visible viewport, preserving scrolling.
- Kept dark green theme, existing features, animations preferences and all workflow data.

## Validation
- Playwright coverage includes screen sizes 320, 390, 768, 900, 1024 and 1366 px across Team overview, personal designer, Production, Settings.
- Separate regression verifies the drag feature is absent and selection still prioritizes a designer after reload.
- Frontend only. Admin PIN, Supabase schema, jobs, users and backend access unchanged.
