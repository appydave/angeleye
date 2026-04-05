# IMPLEMENTATION_PLAN.md — AngelEye Workflow Router

**Goal**: Make the Workflows page show real data by building the session-to-station router and seeding workflow instances from existing BMAD sessions.
**Started**: 2026-03-30
**Target**: Workflows view populated with 6+ story workflows, sessions correctly associated with stations.

## Summary

- Total: 4 | Complete: 4 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Workflow router service: `server/src/services/workflow-router.service.ts` — parse `workflow_action` field, map role+action_code to station, find-or-create workflow instances, associate sessions with stations, compute station states and workflow status
- [x] WU02 — Seed endpoint + route wiring: `POST /api/workflows/seed` in `server/src/routes/workflows.ts` — reads all registry entries, filters BMAD sessions, runs router, returns summary of created/updated workflows
- [x] WU03 — Router + seed tests: 14 router unit tests + 3 route tests (17 new tests, 565 total passing). Covers parsing, role disambiguation, idempotency, dry run, unroutable reasons.
- [x] WU04 — Seed button in WorkflowsView: "Seed from Sessions" button in empty state, loading state, result message, auto-refresh on success.

## Failed / Needs Retry

## Notes & Decisions

- All 6 stories visible in the current 200-session page: 0.2 (6 sessions), 2.2 (4), 2.3 (5), 2.5 (5), 2.6 (5), 5.1 (2)
- 3 WN gatekeeper sessions have no story_id — these are cross-story, not associated with a specific workflow instance
- 12 unroutable sessions (oversight, relay, retrospective, ship without story IDs) — log as unrouted, don't fail
- Role disambiguation is critical: tester + "CS" → SAT-CS, tester + "RA" → SAT-RA, planner + "CS" → CS
- Seed should be idempotent — re-running should not duplicate workflows or session associations
- Default workflow_type_id = "regular_story" for all stories (epic_zero detection is future work)
- The API only returns 200 sessions per page — seed must use the full registry from disk, not the paginated API
