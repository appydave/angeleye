# Assessment: AngelEye Workflow Feature Phase 1

**Campaign**: angeleye-workflow-phase1
**Profile**: Development
**Date**: 2026-03-29
**Results**: 5 complete, 0 failed

## Results Summary

| Unit | Description               | Tests Added | Outcome                                                               |
| ---- | ------------------------- | ----------- | --------------------------------------------------------------------- |
| WU01 | Workflow Type Loader      | 9           | Clean — loads 3 configs, caches, handles missing dir + malformed JSON |
| WU02 | Workflow Instance Service | 9           | Clean — full CRUD, atomic writes, serial queue                        |
| WU03 | Workflow API Routes       | 7           | Clean — 4 endpoints, validation, mounted in index.ts                  |
| WU04 | Client Workflows View     | 0 (UI)      | Clean — nav item, list view, useWorkflows hook, ContentPanel wiring   |
| WU05 | Mock-Views Endpoint       | 0 (service) | Clean — getWorkflowsView(), route, sample JSON                        |

**Final test counts**: Server 426 passing (+25), Client 42 passing (+0). All pre-existing failures unchanged.

## What Worked Well

1. **Clean wave execution** — 3 waves, 5 units, 0 failures. Wave 1 (services) and Wave 2 (routes + mock-views) ran in parallel without conflicts.
2. **Type re-exports caught early** — Coordinator noticed shared types weren't exported before launching agents, fixed it pre-emptively.
3. **AGENTS.md from wave 12 carried forward smoothly** — key facts, anti-patterns, and reference patterns were accurate. Agents followed them.
4. **Existing patterns are mature** — workspace service, mock-views, nav config all provided clear copy-paste-adapt templates.
5. **Requirements spec was precise** — R1 + R6 Phase 1 scope was unambiguous, no agent needed clarification.

## What Didn't Work

1. **`useWorkflows` hook had silent failure** — when API returned non-ok status, data stayed null with no error message. Fixed post-audit.
2. **`enqueueWrite` swallowed errors** — callers couldn't detect write failures. `createWorkflow` could return a "successful" instance that was never persisted. Fixed post-audit.
3. **No concurrency test for write queue** — the most architecturally important behavior in workflow.service.ts is untested.
4. **Integration test hardcodes config file count** — `expect(types).toHaveLength(3)` will break when configs are added.

## Key Learnings — Application

- **Hook error handling needs explicit else branches** — the `if (json.status === 'ok')` pattern must have an `else` that sets error state. Silent null data is worse than an error message.
- **enqueueWrite must re-throw** — the queue should continue after failure (so subsequent writes aren't blocked), but the caller must still see the error. Pattern: `writeQueue = result.catch(() => {})` (queue continues) + `return result` (caller gets rejection).
- **Workflow types are static configs, workflow instances are runtime state** — different storage patterns. Configs in `server/src/config/`, instances in `~/.claude/angeleye/`.

## Key Learnings — Ralph Loop

- **5 units across 3 waves is fast** — total agent wall time ~7 minutes. Planning overhead was proportional.
- **Pre-flight checks save agent time** — catching the missing type re-exports before launch prevented both WU01 and WU02 from having to add them (and potentially conflicting).
- **Post-campaign quality audit found 2 HIGH issues** — the offer-then-audit pattern caught real bugs that would have shipped.

## Promote to Main KDD?

1. **Hook error handling pattern** (useWorkflows fix) — check `!res.ok` before `.json()`, add `else` branch for non-ok status
2. **enqueueWrite re-throw pattern** — queue continues, caller sees error
3. **Workflow type configs are pure JSON in server/src/config/workflows/** — loaded once, cached in memory

## Storage Location Review (flagged at campaign start)

**Current**: `workflows.json` in `~/.claude/angeleye/` alongside registry.json and workspaces.json.

**Alternative**: `data/` directory at monorepo root (per CLAUDE.md recommendation for runtime-written files).

**Pros of current location** (`~/.claude/angeleye/`):

- Consistent with registry.json and workspaces.json patterns
- Service code reuses `getDataDir()` from registry.service
- User-scoped data (workflows belong to the user, not the repo)

**Pros of alternative** (`data/`):

- CLAUDE.md says runtime files go in `data/` to avoid nodemon restarts (not relevant here since `~/.claude/` isn't watched)
- Would be self-contained within the monorepo
- Easier to version-control sample workflows

**Recommendation**: Keep current location. The `~/.claude/angeleye/` pattern is correct for user-scoped runtime state. `data/` is for in-repo runtime artifacts. Workflows are personal operational state, not project data.

**Reference docs**:

- `CLAUDE.md` "Data Directory" section — explains why `data/` exists (nodemon restart avoidance)
- `docs/planning/workflow-feature-requirements.md` R1.3 — documents the storage decision

## Suggestions for Next Campaign

1. **Fix MEDIUM audit findings** — add concurrency test for write queue, fix fragile config count assertion, add string length validation on POST
2. **Phase 2 scope** — session-to-station router, workflow socket events, pipeline drill-down view
3. **AGENTS.md updates for Phase 2** — add the hook error handling pattern and enqueueWrite pattern to Learnings section
4. **Consider Zod validation on POST /api/workflows** — manual `typeof` checks work but Zod is the project standard for validation
