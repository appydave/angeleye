# IMPLEMENTATION_PLAN.md — AngelEye Wave 7b: Data Split

**Goal**: Split `angeleye-data.ts` (371 lines, 6 responsibilities) into 4 focused service files, each with a single responsibility. Prerequisite for B012 (ambient intelligence).
**Started**: —
**Target**: `angeleye-data.ts` deleted; 4 new service files; all routes updated; 173 tests still passing.

## Summary

- Total: 4 | Complete: 4 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] SP01 — Extract `registry.service.ts` (registry read/write + write queue + initDirs + \_setDataDir + path helpers)
- [x] SP02 — Extract `sessions.service.ts` (writeEvent, getSessionEvents, archiveSession)
- [x] SP03 — Extract `workspace.service.ts` (readWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace)
- [x] SP04 — Extract `backfill.service.ts` + delete angeleye-data.ts + update all routes + update all tests

## Failed / Needs Retry

## Notes & Decisions

- Sequential: SP01 → SP02 → SP03 → SP04 (all extract from the same source file)
- SP04 is the cleanup unit — it extracts the last responsibility, deletes angeleye-data.ts, and updates all route imports and test imports
- The write queue (module-level Promise<void>) stays in registry.service.ts — it owns the registry
- `_setDataDir()` and its write queue reset must remain in registry.service.ts (test isolation depends on it)
- Path helpers (\_sessionsDir, \_archiveDir, \_registryPath, \_workspacesPath) belong in registry.service.ts as they are the canonical data dir accessors; other services import them from there
- Blast radius: 4 route files + 6 test files need import path updates (see AGENTS.md)
- Rationale: B012 needs an isolated write queue for pattern cache; keeping all responsibility in one module would create write queue collision and singleton coupling
