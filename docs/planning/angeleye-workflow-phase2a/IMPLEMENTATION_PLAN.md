# IMPLEMENTATION_PLAN.md — AngelEye Workflow Phase 2a

**Goal**: Extract hardcoded data from two static HTML dashboards into standalone JSON, then build hybrid views that overlay live registry data on top of mock data — proving what we can populate today vs what's still gap.
**Started**: 2026-03-29
**Target**: Two JSON files extracted, two hybrid HTML mockups rendering with mock/live delineation, gap visible at a glance.
**Profile**: Development

## Summary

- Total: 4 | Complete: 4 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Extract campaign-dashboard.json: 14 sections extracted (8 stat boxes + 13 chart datasets) into `.mochaccino/samples/campaign-dashboard.json`. All labels/values match source HTML. Auto-served at `/api/mock-views/campaign-dashboard`.

- [x] WU02 — Extract campaign-infographic.json: 12 data sections extracted (heroStats, schema, 16 session types, 40 subtypes, 39 projects, 45 tools, 7 classifier dimensions, 22 predicates, build accuracy + rules, machines, derived metrics, 25 skills) into `.mochaccino/samples/campaign-infographic.json`. Auto-served at `/api/mock-views/campaign-infographic`.

- [x] WU03 — Hybrid campaign dashboard mockup: 1006-line standalone HTML at `.mochaccino/designs/campaign-dashboard-hybrid/index.html`. Chart.js charts with LIVE/MOCK/PARTIAL badges per section. Fetches from /api/stats + /api/sessions for overlay. LIVE: session types, session scale, top projects. PARTIAL: campaign overview, key predicates. MOCK: delegation style, initiation source, continuity, output type, autonomy, liveness, BUILD accuracy, machines. Summary bar shows coverage percentage.

- [x] WU04 — Hybrid campaign infographic mockup: standalone HTML at `.mochaccino/designs/campaign-infographic-hybrid/index.html`. Pure HTML/CSS tables with green/amber/red dot indicators per section. Two-column comparison tables for session types and projects (analysis vs live with delta column). Gap analysis summary table (Section 13) with 20 rows covering every data dimension. LIVE/PARTIAL/MOCK delineation across all 12 original sections.

## Failed / Needs Retry

## Notes & Decisions

- **Live data sources available**: `GET /api/stats` (session type counts), `GET /api/sessions` (full registry entries with session_type, session_scale, tool_pattern, predicates, trigger_command/args). No live aggregates for C08-C13, subtypes, derived metrics, observations.
- **Live session type values differ from analysis**: Live uses 6 types (BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, ORIENTATION) + unclassified. Analysis used 12+ (BUILD, KNOWLEDGE, RESEARCH, ORIENTATION, OPERATIONS, META, SYSOPS, PLANNING, MIXED, SKILL, SETUP, Unknown). The hybrid view maps OPS→OPERATIONS and flags missing types.
- **Pagination concern**: `GET /api/sessions` is cursor-paginated. For POC, request limit=2000 to get all sessions in one call.
- **JSON served automatically**: The mock-views catch-all route serves any `.mochaccino/samples/{name}.json` at `/api/mock-views/{name}`. No new server code needed.
- **Wave plan**: Wave 1 = WU01 + WU02 (parallel, JSON extraction). Wave 2 = WU03 + WU04 (parallel, hybrid views). Both waves completed with 0 failures.
- **Test results post-campaign**: Server 430 passing (+4 from Phase 1), 7 pre-existing failures. Client 42 passing, 2 pre-existing failures. Typecheck clean. Lint clean.
