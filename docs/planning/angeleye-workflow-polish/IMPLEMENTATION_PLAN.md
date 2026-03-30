# IMPLEMENTATION_PLAN.md — AngelEye Workflow Polish

**Goal**: Fix router gaps (CU overlay, WN gatekeeper) + redesign chat panel to match mockup (conversation bubbles, collapsible tool groups, header/footer, constrained layout).
**Started**: 2026-03-30
**Target**: Story 2.6 shows CU routed correctly. Chat panel matches `.mochaccino/designs/chat-panel/index.html` mockup with Claude response bubbles, tool call grouping, metadata header/footer.

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Router fixes: removed CU from `/bmad-sat` overlay, WN gatekeeper with specific reason, action-code-only fallback in lookupStation. +4 tests.
- [x] WU02 — Chat panel header + footer: ChatHeader (session name, project, type badge, UUID) + ChatFooter (notes input, metadata summary). Integrated with WorkflowDetailView metadata pass-through.
- [x] WU03 — Chat bubble redesign: groupEventsIntoTurns() conversation model, UserBubble (right-aligned amber), ClaudeBubble (left-aligned dark avatar, renders last_message), collapsible ToolCallGroup, DividerRow. Full rewrite of rendering pipeline.
- [x] WU04 — Chat panel layout constraint: 800px max-width centered column below full-width pipeline, flex structure ready for future side panels.
- [x] WU05 — Re-seed + verify: overlay config tests (CU in /bmad-lib, WN in /bmad-sm), verified action-code fallback and WN gatekeeper tests. +2 tests (638 total).

## Failed / Needs Retry

## Notes & Decisions

- Wave 1: WU01, WU02, WU03 (independent — 3 agents in parallel)
- Wave 2: WU04, WU05 (WU05 depends on WU01 router fix being merged)
- CU overlay fix: remove "CU" from `/bmad-sat` actions array only — SAT-CS and SAT-RA untouched
- WN is workflow-agnostic for now — it's a query ("what's the next story?"), not a set. Future: retroactive attachment when WN discovers story ID, possibly flowing directly into story creation
- Claude responses already captured in `stop` events as `last_message` field — just not displayed. WU03 renders these as Claude bubbles
- Chat panel mockup reference: `.mochaccino/designs/chat-panel/index.html`
- Chat panel will eventually have left/right side panels — center column design must accommodate this
