# IMPLEMENTATION_PLAN.md — AngelEye Workflow Polish

**Goal**: Fix router gaps (CU overlay, WN gatekeeper) + redesign chat panel to match mockup (conversation bubbles, collapsible tool groups, header/footer, constrained layout).
**Started**: 2026-03-30
**Target**: Story 2.6 shows CU routed correctly. Chat panel matches `.mochaccino/designs/chat-panel/index.html` mockup with Claude response bubbles, tool call grouping, metadata header/footer.

## Summary

- Total: 12 | Complete: 12 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Router fixes: removed CU from `/bmad-sat` overlay, WN gatekeeper with specific reason, action-code-only fallback in lookupStation. +4 tests.
- [x] WU02 — Chat panel header + footer: ChatHeader (session name, project, type badge, UUID) + ChatFooter (notes input, metadata summary). Integrated with WorkflowDetailView metadata pass-through.
- [x] WU03 — Chat bubble redesign: groupEventsIntoTurns() conversation model, UserBubble (right-aligned amber), ClaudeBubble (left-aligned dark avatar, renders last_message), collapsible ToolCallGroup, DividerRow. Full rewrite of rendering pipeline.
- [x] WU04 — Chat panel layout constraint: 800px max-width centered column below full-width pipeline, flex structure ready for future side panels.
- [x] WU05 — Re-seed + verify: overlay config tests (CU in /bmad-lib, WN in /bmad-sm), verified action-code fallback and WN gatekeeper tests. +2 tests (638 total).
- [x] WU06 — Fix "Last Updated" timestamps: `updated_at` now derived from max session `last_active` instead of seed execution time. Modified `updateWorkflow` to accept explicit timestamp. +2 tests (653 total).
- [x] WU07 — Fix "No response text available": ClaudeBubble now handles null `last_message` gracefully — tool-only turns skip the bubble, empty turns show muted "(no text response)".
- [x] WU08 — Compress detail view header: merged back button + title + type/domain/status onto single row (~44px). Dropped redundant `work_item_id`.
- [x] WU09 — List view cleanup: removed `work_item_id` subtitle, added domain badge next to type name, added warm `#ede7dc` background to chat scroll area.
- [x] WU10 — Chat header: now shows station identity (e.g. "DR — Nate") instead of repeating story name. Falls back to action code if no identity.
- [x] WU11 — Chat panel visual polish: added hover effect on tool call pills, removed non-functional "Add a note" row, kept metadata bar with border-top.
- [x] WU12 — Renamed workflow type: "Regular Story" → "BMAD Story" in config, tests, and mockup samples.

## Failed / Needs Retry

## Notes & Decisions

### Wave 1 (complete)

- WU01, WU02, WU03 (independent — 3 agents in parallel)
- Wave 2: WU04, WU05

### Wave 3 (planned)

- **Parallel group A** (server-side, independent): WU06, WU07, WU12
- **Parallel group B** (client-side, independent): WU08, WU09, WU10, WU11
- All 7 WUs are independent — can run as one wave of up to 7 agents
- WU08 + WU10 both touch WorkflowDetailView.tsx — run WU08 first, WU10 second, or combine into one agent

### Decisions

- CU overlay fix: remove "CU" from `/bmad-sat` actions array only — SAT-CS and SAT-RA untouched
- WN is workflow-agnostic for now — it's a query ("what's the next story?"), not a set
- Claude responses captured in `stop` events as `last_message` field — WU07 investigates why many are null
- Chat panel mockup reference: `.mochaccino/designs/chat-panel/index.html`
- Chat panel will eventually have left/right side panels — center column design must accommodate this
- Chat header content: show station identity (from workflow type config), NOT mockup sample data
- "Regular Story" → "BMAD Story" rename confirmed
- "Add a note" row is non-functional — remove it, keep metadata bar
- `updated_at` bug: currently set to seed execution time, should be latest session activity
  </content>
  </invoke>
