# IMPLEMENTATION_PLAN.md — AngelEye Workflow Feature Phase 1

**Goal**: Schema + static view — workflow type config loader, workflow instance storage, API endpoints, Workflows list view, mock-views integration.
**Started**: 2026-03-29
**Target**: Workflows nav item visible, list view renders instances from API, workflow types loadable, mock-views endpoint serving workflow data.

---

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Workflow Type Loader: `workflow-type.service.ts` + 9 tests. Loads 3 configs, caches in memory, handles missing dir + malformed JSON gracefully. Server tests: 410 passing.
- [x] WU02 — Workflow Instance Service: `workflow.service.ts` + 9 tests. Full CRUD with atomic writes, serial queue, station initialization. Uses getDataDir() from registry.service. Server tests: 419 passing.
- [x] WU03 — Workflow API Routes: `workflows.ts` + 7 tests. GET/POST /api/workflows, GET /api/workflow-types, GET /api/workflows/:id. Mounted in index.ts before mockViewsRouter. Server tests: 426 passing (merged).
- [x] WU05 — Mock-Views Workflow Endpoint: `getWorkflowsView()` in mock-views.service.ts, GET /api/mock-views/workflows route, sample JSON at .mochaccino/samples/workflows.json. Typecheck + lint clean.
- [x] WU04 — Client Workflows View: `WorkflowsView.tsx` list page + `useWorkflows.ts` hook + nav config + ContentPanel wiring. Status badges, progress display, current station info. Client tests: 42 passing.

## Failed / Needs Retry

## Notes & Decisions

- **Storage location**: `~/.claude/angeleye/workflows.json` alongside registry.json and workspaces.json — matching existing file-crud pattern. **REVIEW AT END**: evaluate whether `data/` directory would be more appropriate (see CLAUDE.md data directory section vs current service patterns).
- **Types already exist**: `shared/src/angeleye.ts` has WorkflowType, WorkflowInstance, StationInstance, BacktrackRecord, etc. — no shared type work needed.
- **Workflow configs exist**: 3 JSON files in `server/src/config/workflows/` (regular-story, lightweight-story, epic-zero).
- **Wave plan**: Wave 1 (WU01+WU02 parallel) → Wave 2 (WU03+WU05 parallel) → Wave 3 (WU04).
- **Nav position**: "Workflows" in Main group after Organiser, before System group.
- **Only Regular Story initially**: workflow type configs for lightweight and epic-zero exist but UI only needs to display whatever is loaded.
- **Station terminology**: use "station" throughout, never "step".
