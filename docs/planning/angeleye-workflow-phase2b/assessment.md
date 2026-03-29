# Campaign Assessment — angeleye-workflow-phase2b

**Goal**: Phase 2b — Project Registry config loader + Inspector screens (Schema + Data tabs)
**Backlog items**: B057, B058, B059
**Started**: 2026-03-29
**Completed**: 2026-03-29
**Result**: 4/4 work units complete, 0 failed

## What Was Delivered

| WU   | Description                                                                        | Outcome                                                       |
| ---- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| WU01 | ProjectConfig shared type + cached config loader service + /api/projects endpoints | Complete — 10 tests, follows workflow-type.service.ts pattern |
| WU02 | Inspector API routes (/api/inspector/types, /api/inspector/summary)                | Complete — 7 tests, aggregates sessions/workflows             |
| WU03 | InspectorView + SchemaTab + nav integration                                        | Complete — tab-based view, 3 collapsible sections             |
| WU04 | DataTab with live data (sessions summary, workflows, affinity groups)              | Complete — useInspectorData hook, parallel fetches            |

## Delivery Review Findings

6-dimension review ran post-completion. 4 patches proposed, 3 applied:

- **Applied**: Extracted shared `CollapsibleSection.tsx` (was duplicated in SchemaTab + DataTab)
- **Applied**: Env-overridable `SHARED_TYPES_PATH` in inspector route
- **Applied**: Added `description` field to validation guard in project-config.service.ts
- **Skipped**: BH-002/EC-006 `current_station` off-by-one — investigated and confirmed as false positive (field is 0-based, used correctly as array index)

## What Worked Well

- Wave parallelism: 2 agents per wave, no file conflicts
- Config loader pattern copied cleanly from workflow-type.service.ts — consistent codebase
- NavContext + viewMap pattern made adding the Inspector view trivial (2-line change)
- Delivery review caught real duplication (CollapsibleSection) early

## What Didn't Work

- Only 1 of 4 agents auto-committed (WU03) — the others left changes uncommitted despite AGENTS.md instructions
- Integration test for "real project configs" failed due to `process.cwd()` difference between vitest and nodemon — fixed by switching to `import.meta.dirname`

## Suggestions for Next Campaign

- Pre-existing test failures in `env.test.ts` (6 failures), `correlator.service.test.ts` (1), and `backfill.test.ts` (typecheck) should be addressed in a maintenance wave
- Consider adding a `useInspector` + `useInspectorData` hook merge if the Inspector view grows — currently fine as separate hooks
- B063 (`project_dir` on WorkflowInstance) is a natural follow-on
