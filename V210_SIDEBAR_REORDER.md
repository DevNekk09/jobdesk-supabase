# Jobdesk V2.1.0 — Reorderable sidebar + seamless scrolling

## Changes
- Designer names in sidebar can be reordered by dragging the dedicated six-dot grip on desktop and touch devices (Pointer Events with pointer capture and edge auto-scroll).
- Selecting a designer Jobdesk automatically promotes that desk to the top of the designer list.
- Custom list order is saved in localStorage as a per-device UI preference, preserved across reloads. No shared database edits or schema migrations.
- Keyboard alternative: focus a sidebar member and press Alt+ArrowUp / Alt+ArrowDown to rearrange.
- Sidebar width increased from 244px to 268px (+24px) on desktop and 260px to 284px on mobile. Content margin adjusts without overlap.
- Smoother internal sidebar vertical scrolling with subtle scrollbar, scroll containment and touch momentum; manual drag suspends smooth scrolling for accuracy.
- Preserves other sidebar areas and existing Team overview, All jobs, Production, Settings and bottom dock.
- Motion-reduction settings respected.
- Regression tests for dragging, keyboard, auto promotion, persistence, overflow and long-list scrolling.

No Admin PIN changes and no deletion/reset of actual user/job data.
