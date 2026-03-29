# IMPLEMENTATION_PLAN.md — Phase 3: Field Propagation + Dashboard Promotion

**Goal**: Propagate Phase 2c fields across all views (Inspector, Settings patches), promote campaign dashboard + infographic mockups to real React views in the main nav.
**Backlog**: B065-B074
**Started**: 2026-03-29
**Target**: Phase 2c fields visible in Inspector + Settings (patched); campaign dashboard and infographic are real nav items consuming live data.

## Summary

- Total: 10 | Complete: 10 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Pending

## In Progress

## Complete

- [x] WU01 — **stats.ts DRY fix** (B065): Replaced inline counting in stats.ts and inspector.ts with countByType() import. Updated inspector.test.ts expectations. 554 server tests passing.
- [x] WU02 — **Server tests for countByFields + stats fields** (B069): 6 new tests covering empty registry, mixed entries, missing fields, and /api/stats fields response. Commit 08ef0aa8.
- [x] WU03 — **Fix totalDelta() math** (B067): Replaced halving with sum-of-positive-deltas. Fixed pre-existing lint error. Commit 0cf21d15.
- [x] WU04 — **Import SessionType from shared** (B066): Removed local SessionType, imported from @appystack/shared. TYPE_ORDER readonly, TYPE_COLORS typed as Record<SessionType, string>.
- [x] WU05 — **Add accordion + field data tests** (B068): 3 new tests — accordion expand/collapse, field stats rendering, delta rendering after sync. 51 client tests passing. Commit cb134dc4.
- [x] WU06+WU07 — **Inspector Phase 2c extension** (B070+B071): Added countByFields to inspector summary API. Added Phase 2c Field Distributions section to DataTab with collapsible sub-sections for all 8 fields.
- [x] WU08 — **CampaignDashboardView** (B072): 13-card Chart.js dashboard. Cards 4-7,9 upgraded from MOCK to LIVE using stats.fields. Installed chart.js + react-chartjs-2. Commit 4af87a7a.
- [x] WU09 — **CampaignInfographicView** (B073): 13-section table/bar infographic. Classifiers section uses live stats.fields for 5 of 7 groups. No Chart.js dependency.
- [x] WU10 — **Wire nav + ContentPanel** (B074): Added Dashboard + Infographic to Main nav group. Registered both views in ContentPanel viewMap. Commit fac2b0a1.

## Failed / Needs Retry

## Wave Plan

**Wave 1** (3 parallel agents — server-only patches, no file conflicts):
| Agent | WU | Files touched |
|-------|-----|---------------|
| A | WU01 | `server/src/routes/stats.ts`, `server/src/routes/inspector.ts` |
| B | WU02 | `server/src/test/` (new test file: `stats-fields.test.ts` or append to existing) |
| C | WU03 | `client/src/views/SettingsView.tsx` (totalDelta function only) |

**Wave 2** (3 parallel agents — client patches + inspector, no file conflicts):
| Agent | WU | Files touched |
|-------|-----|---------------|
| D | WU04 | `client/src/views/SettingsView.tsx` (type imports + TYPE_ORDER/TYPE_COLORS) |
| E | WU05 | `client/src/views/SettingsView.test.tsx` |
| F | WU06+WU07 | `server/src/routes/inspector.ts`, `client/src/hooks/useInspectorData.ts`, `client/src/components/inspector/DataTab.tsx` |

**Conflict guard Wave 2**: WU04 edits SettingsView type declarations (top of file). WU03 must complete first since it edits the same file. WU05 only touches the test file.

**Wave 3** (3 parallel agents — new views + nav wiring):
| Agent | WU | Files touched |
|-------|-----|---------------|
| G | WU08 | `client/src/views/CampaignDashboardView.tsx` (NEW) |
| H | WU09 | `client/src/views/CampaignInfographicView.tsx` (NEW) |
| I | WU10 | `client/src/config/nav.ts`, `client/src/components/ContentPanel.tsx` |

## Notes & Decisions

- **WU03 before WU04**: Both touch SettingsView.tsx. WU03 fixes totalDelta (small function edit), WU04 refactors type imports (top-of-file). Run WU03 in wave 1 so WU04 sees clean state.
- **WU06+WU07 combined**: Inspector summary API extension + DataTab UI are tightly coupled. One agent handles both.
- **Chart.js for dashboard only**: Dashboard uses Chart.js (doughnut, bar, line). Infographic uses pure HTML tables + CSS bars. This matches the mockup designs.
- **Three API endpoints for dashboard/infographic views**: `/api/stats`, `/api/sessions?limit=2000`, `/api/mock-views/campaign-infographic`. All exist today. No new server endpoints needed.
- **Mock data overlay pattern**: Dashboard + Infographic views render live data where available, fall back to mock JSON for sections not yet powered by live APIs (BUILD accuracy, machine comparison, etc.). Same hybrid approach as the mockups.
