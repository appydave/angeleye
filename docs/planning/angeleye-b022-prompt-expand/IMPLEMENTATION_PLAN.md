# IMPLEMENTATION_PLAN.md — AngelEye B022: Prompt Expand

**Goal**: Show full user_prompt content in the focus panel (click to expand/collapse), plus tooltip quick win on session list row.
**Started**: 2026-03-17
**Target**: WP01 complete — typecheck clean, client baseline maintained (44 passing).

---

## Summary

- Total: 1 | Complete: 1 | In Progress: 0 | Pending: 0 | Failed: 0

---

## Pending

_(none)_

---

## In Progress

_(none)_

## Complete

- [x] WP01 — Prompt expand in focus panel + session row tooltip (B022). Typecheck clean, lint clean, 44 client tests passing.

---

## Complete

_(none)_

---

## Failed / Needs Retry

_(none)_

---

## Notes & Decisions

- WP01 is pure frontend — `ObserverView.tsx` only. No server changes, no new routes.
- `expandedPrompts: Set<string>` keyed by `event.id` — mirrors existing `expandedGroups` pattern.
- Prompts ≤80 chars are not truncated by `eventSummary` so no expand needed — only show toggle when `event.prompt` length > 80.
- Reset `expandedPrompts` on session change (when `focusedId` changes) — matches `expandedGroups` behaviour.
- Session list row tooltip: `title={s.entry.first_real_prompt ?? undefined}` on the bottom-row span — one line, no new state.
- No new client tests required — `ObserverView` is not covered by the existing client test suite.
