# IMPLEMENTATION_PLAN.md — AngelEye Workflow Detail

**Goal**: Make workflows clickable — row click opens pipeline visualization with station nodes, agent avatars, state badges, and a session chat panel below. Fix list view data accuracy (progress, re-seed).
**Started**: 2026-03-30
**Target**: Click any workflow row → see horizontal pipeline + session transcript for selected station.

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — List view fixes: progress counts stations with sessions, Sync Sessions button in header, row click → detail view, placeholder detail view created
- [x] WU02 — Pipeline component: `WorkflowPipeline.tsx` with station nodes, colored avatars, state badges (done/active/pending), connectors, selection highlighting
- [x] WU04 — Session events panel: `SessionEventsPanel.tsx` with event rendering (prompts, tools, subagents), multi-session tabs, loading/error states
- [x] WU05 — Station completion enrichment: stations marked completed when all sessions ended, workflow status → closed, duration_ms computed. 5 new tests (578 server total)
- [x] WU03 — Workflow detail view: full `WorkflowDetailView.tsx` with header, pipeline component, session events panel, station click → session loading, multi-session tabs, status pill

## Failed / Needs Retry

## Notes & Decisions

- Wave 1: WU01, WU02, WU04, WU05 (independent — 4 agents in parallel)
- Wave 2: WU03 (assembles Wave 1 outputs — depends on pipeline component + events panel)
- Pipeline design reference: `.mochaccino/designs/chain-story-pipeline/index.html`
- Chat panel reuses existing `GET /api/sessions/:id/events` endpoint
- Detail view is a conditional render inside WorkflowsView (selectedWorkflowId state), not a new nav item
- Agent avatar colors: Blue=Bob(planner), Green=Amelia(builder), Orange=Nate(reviewer), Purple=Taylor(tester), Pink=Lisa(advisor), Gray=shipper
- ObserverView has `buildFocusRows()` and event rendering — WU04 should extract a reusable pattern, not copy-paste
