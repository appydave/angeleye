# IMPLEMENTATION_PLAN.md — AngelEye Wave 6: UI Polish

**Goal**: Close the visual gap between AngelEye and the AWB mock design language
**Started**: 2026-03-15
**Completed**: 2026-03-15
**Target**: Surface layer system, correct typography temperature, edge-to-edge views

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] UI01 — Remove ContentPanel p-6: changed to overflow-hidden flex flex-col (views now edge-to-edge)
- [x] UI02 — CSS variable corrections: 4 existing vars warmed, surface-mid + border-raised added as new Tailwind utilities
- [x] UI03 — Observer focused row: bg-primary/10 → bg-surface-mid; border-l-2 border-l-primary preserved
- [x] UI04 — Observer column header: bg-surface added to SESSION/LAST ACTIVITY/WHEN/IDLE header row
- [x] UI05 — Organiser split: workspaces panel gets bg-surface; inbox inherits bg-background by default

## Failed / Needs Retry

## Notes & Decisions

- UI02 dependency confirmed: bg-surface-mid and bg-surface utilities live before UI03/UI04/UI05 ran
- Tailwind v4 @theme block auto-generates utilities from --color-\* variables — no separate mapping needed
- UI05 left panel: DroppableZone already had no bg class, inheriting background correctly — no change needed
- Final: 173 tests passing (129 server + 44 client), typecheck clean, lint clean
