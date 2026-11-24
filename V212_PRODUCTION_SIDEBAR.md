# Jobdesk V2.1.2 — Production sidebar placement
- Moved the existing shared Production Jobdesk link and its stage shortcuts out of the scrollable Designer Jobdesks section.
- Production now sits in the standalone sidebar footer directly above Settings, with a subtle divider separating the links.
- The six stage shortcuts are retained when Production is selected; their list is independently scrollable and height capped, so Settings remains accessible on phones.
- Designer Jobdesks drag-and-drop, automatic selected-desk sorting, and independent scrolling are unchanged.
- No backend, Supabase database, jobs, member data, Admin PIN, or access-control modifications.
- Desktop/mobile regression tests verify production navigation hierarchy and placement, stage shortcuts, and Settings access.
