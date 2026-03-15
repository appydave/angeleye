# IMPLEMENTATION_PLAN.md — AngelEye Wave 6: UI Polish

**Goal**: Close the visual gap between AngelEye and the AWB mock design language
**Started**: 2026-03-15
**Target**: Surface layer system, correct typography temperature, edge-to-edge views

## Summary

- Total: 5 | Complete: 0 | In Progress: 0 | Pending: 5 | Failed: 0

## Pending

- [ ] UI01 — Remove ContentPanel p-6: change p-6 to edge-to-edge layout (highest impact, 5 min)
- [ ] UI02 — CSS variable corrections: surface, surface-mid (new), border, border-raised (new), muted-foreground temperature fix
- [ ] UI03 — Observer focused row: replace bg-primary/10 with bg-surface-mid; keep border-l-2 border-l-primary
- [ ] UI04 — Observer column header: add bg-surface to header row so it sits above data rows visually
- [ ] UI05 — Organiser split: inbox scroll area bg-background, workspaces scroll area bg-surface (directional visual coding)

## In Progress

## Complete

## Failed / Needs Retry

## Notes & Decisions

- UI01 is independent and highest-impact — do it first and screenshot before/after
- UI02 must be done before UI03/UI04/UI05 since they depend on the new CSS variables
- No font changes in this wave — DM Sans/DM Mono is a separate decision
- Run node scripts/screenshot.mjs after each unit to verify visually
