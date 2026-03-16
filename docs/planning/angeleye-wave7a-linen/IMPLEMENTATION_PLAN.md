# IMPLEMENTATION_PLAN.md — AngelEye Wave 7a: v2-linen

**Goal**: Full visual redesign from dark theme to warm linen — floating cards, real amber accent, dark column header, light sidebar and header.
**Started**: 2026-03-15
**Target**: App matches v2-linen mochaccino reference at `.mochaccino/designs/v2-linen/observer.html` and `organiser.html`

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] LN01 — CSS palette swap: replace dark palette with linen palette in `index.css`, switch body to system-ui font | All 14 colour variables updated, --color-card added, body font switched. 173 tests pass.
- [x] LN02 — Header: light bg (card), border-bottom, amber ANGELEYE branding | Angel/Eye split span, bg-card, test fix for split-text matcher in App.test.tsx + main.test.tsx.
- [x] LN03 — Sidebar + SidebarGroup: linen bg (surface), amber border-left active state, dark-on-light text | SidebarGroup active → border-l-2 border-l-primary bg-surface-mid; Sidebar.tsx unchanged (already correct).
- [x] LN04 — ObserverView: dark column header, session rows → floating cards (border + shadow + gap) | bg-foreground header, floating cards with border+shadow+gap, amber border-left on focused card.
- [x] LN05 — OrganiserView: linen canvas, card-style session tiles, amber workspace accents | DraggableSession + DraggableWorkspaceSession both bg-background → bg-card + shadow-sm.

## Failed / Needs Retry

## Notes & Decisions

- LN01 is the foundation — run it first. LN02/LN03/LN04/LN05 depend on the new CSS variables.
- After LN01, the remaining 4 units are independent and can run in parallel.
- Reference designs: `.mochaccino/designs/v2-linen/observer.html` and `.mochaccino/designs/v2-linen/organiser.html`
- No data layer changes in this wave — pure visual.
- 173 tests must pass unchanged (no logic touched).
