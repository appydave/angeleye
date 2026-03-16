# AGENTS.md — AngelEye Wave 7b: Data Split

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Split `angeleye-data.ts` into 4 focused service files. Pure refactor — no behaviour changes.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in beforeEach, `rm(testDir)` in afterEach
- Write queue: module-level `Promise<void>` in `angeleye-data.ts` — moves to `registry.service.ts`
- All service files live in `server/src/services/`
- All imports use `.js` extension (ESM — do not use `.ts`)
- 173 tests currently passing (129 server / 44 client)

---

## Why This Split

`angeleye-data.ts` has 6 responsibilities in 371 lines. B012 (ambient intelligence) needs to write pattern cache files. If B012 shares the same write queue as the registry, pattern mining would block registry updates on every hook event. The split gives each service its own module boundary and allows B012's `pattern.service.ts` to have its own independent write queue.

This is a pure refactor. No function signatures change. No behaviour changes. All tests pass unchanged — only import paths in routes and tests update.

---

## Source File Structure (read before starting)

`server/src/services/angeleye-data.ts` — 371 lines, 6 responsibilities:

| Lines   | Exports                                                                                      | Destination            |
| ------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| 1–31    | `_setDataDir`, path helpers (`_sessionsDir` etc)                                             | `registry.service.ts`  |
| 33–51   | `initAngelEyeDirs`                                                                           | `registry.service.ts`  |
| 53–61   | `writeEvent`                                                                                 | `sessions.service.ts`  |
| 63–125  | `readRegistry`, `updateRegistry`, `_doUpdateRegistry`, `writeQueue`                          | `registry.service.ts`  |
| 127–155 | `getSessionEvents`, `archiveSession`                                                         | `sessions.service.ts`  |
| 159–217 | `readWorkspaces`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace`, `writeWorkspaces` | `workspace.service.ts` |
| 219–370 | `backfillTranscripts`, `transcriptToEvents`, `BackfillResult`                                | `backfill.service.ts`  |

---

## Blast Radius: Files That Import angeleye-data.ts

### Routes (import paths must be updated in SP04)

| Route file                        | Currently imports                                                   |
| --------------------------------- | ------------------------------------------------------------------- |
| `server/src/routes/hooks.ts`      | `writeEvent, updateRegistry, archiveSession`                        |
| `server/src/routes/sessions.ts`   | `readRegistry, getSessionEvents, updateRegistry, readWorkspaces`    |
| `server/src/routes/workspaces.ts` | `readWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace` |
| `server/src/routes/backfill.ts`   | `backfillTranscripts`                                               |

### Tests (import paths must be updated in SP04)

| Test file                                   | Currently imports                        |
| ------------------------------------------- | ---------------------------------------- |
| `server/src/services/angeleye-data.test.ts` | `_setDataDir`, various service functions |
| `server/src/routes/sessions.test.ts`        | `_setDataDir`, possibly others           |
| `server/src/routes/hooks.test.ts`           | `_setDataDir`                            |
| `server/src/routes/backfill.test.ts`        | `_setDataDir`, `backfillTranscripts`     |
| `server/src/routes/workspaces.test.ts`      | `_setDataDir`                            |

Read each file before updating to confirm exact imports.

---

## SP01 — Extract registry.service.ts

### What to build

Create `server/src/services/registry.service.ts` containing:

- All path helpers (`_baseDir`, `_sessionsDir`, `_archiveDir`, `_registryPath`, `_workspacesPath`)
- `_setDataDir()` — **critical for test isolation** — also resets `writeQueue`
- `initAngelEyeDirs()`
- `writeQueue` (module-level singleton)
- `readRegistry()`
- `updateRegistry()` (calls `_doUpdateRegistry()`)
- `_doUpdateRegistry()` (private implementation — does not need to be exported)

### Critical constraint

`_setDataDir` must reset the write queue:

```ts
export function _setDataDir(dir: string): void {
  _baseDir = dir;
  writeQueue = Promise.resolve();
}
```

This is unchanged from the original — just move it exactly.

### Done when

- `registry.service.ts` exists with all listed exports
- `angeleye-data.ts` still exists (will be deleted in SP04 — do not delete yet)
- The new file is self-contained: no imports from `angeleye-data.ts`
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — routes still import from angeleye-data.ts for now)

---

## SP02 — Extract sessions.service.ts

### What to build

Create `server/src/services/sessions.service.ts` containing:

- `writeEvent()`
- `getSessionEvents()`
- `archiveSession()`

These functions use path helpers (`_sessionsDir()`, `_archiveDir()`). Import them from `registry.service.ts`:

```ts
import { _sessionsDir, _archiveDir } from './registry.service.js';
```

### Done when

- `sessions.service.ts` exists with all three exports
- Imports path helpers from `registry.service.ts` (not from `angeleye-data.ts`)
- `angeleye-data.ts` still exists (do not delete yet)
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)

---

## SP03 — Extract workspace.service.ts

### What to build

Create `server/src/services/workspace.service.ts` containing:

- `readWorkspaces()`
- `createWorkspace()`
- `updateWorkspace()`
- `deleteWorkspace()`
- `writeWorkspaces()` (internal helper — keep it in this file, does not need to be exported)

Import path helper from `registry.service.ts`:

```ts
import { _workspacesPath } from './registry.service.js';
```

### Done when

- `workspace.service.ts` exists with all listed exports
- Imports `_workspacesPath` from `registry.service.ts`
- `angeleye-data.ts` still exists (do not delete yet)
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)

---

## SP04 — Extract backfill.service.ts + Cleanup

### What to build

This unit does three things:

**1. Create `server/src/services/backfill.service.ts`** containing:

- `BackfillResult` interface
- `transcriptToEvents()` (internal helper — does not need to be exported)
- `backfillTranscripts()`

Import dependencies from the new service files:

```ts
import { _sessionsDir, _registryPath, readRegistry, updateRegistry } from './registry.service.js';
import { writeEvent } from './sessions.service.js';
```

Read `angeleye-data.ts` lines 219–370 carefully before writing — `backfillTranscripts` calls `updateRegistry` and `writeEvent`, and uses path helpers.

**2. Update all route imports** (4 files):

| Route           | Old import                            | New import                                                                                                                                             |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hooks.ts`      | `from '../services/angeleye-data.js'` | `writeEvent, archiveSession` from `sessions.service.js`; `updateRegistry` from `registry.service.js`                                                   |
| `sessions.ts`   | `from '../services/angeleye-data.js'` | `readRegistry, updateRegistry` from `registry.service.js`; `getSessionEvents` from `sessions.service.js`; `readWorkspaces` from `workspace.service.js` |
| `workspaces.ts` | `from '../services/angeleye-data.js'` | All 4 functions from `workspace.service.js`                                                                                                            |
| `backfill.ts`   | `from '../services/angeleye-data.js'` | `backfillTranscripts` from `backfill.service.js`                                                                                                       |

**3. Update all test imports** (5 files):

All test files that import `_setDataDir` should get it from `registry.service.js`.
All test files that import service functions should get them from the new split files.
The old `angeleye-data.test.ts` file should be renamed or split to match the new file structure — or left as-is and updated to import from the new service files. Read the file first to decide the cleanest approach.

**4. Delete `angeleye-data.ts`** — only after all routes and tests compile clean.

### Done when

- `backfill.service.ts` exists with correct exports
- `angeleye-data.ts` is deleted
- All 4 route files import from the new service files
- All test files import from the new service files (no references to `angeleye-data` remain)
- `npm run typecheck` passes clean — zero references to the deleted file
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean after every unit
2. `npm run lint` passes clean after every unit
3. `npm test` passes — 173 tests, no regressions
4. No `console.log` left in any new file
5. All imports use `.js` extension (ESM convention)
6. SP01 → SP02 → SP03 → SP04 strictly sequential — each unit leaves `angeleye-data.ts` in place until SP04

---

## Learnings from Wave 6

- `_setDataDir` write queue reset: `writeQueue = Promise.resolve()` — this is the test isolation mechanism; do not break it
- Atomic writes: `write to .tmp then rename()` pattern used in registry + workspace writes — preserve exactly
- `apiFailure(res, msg, code)` not `apiError`
- All imports use `.js` extension in ESM TypeScript projects
- `_doUpdateRegistry` is a private implementation function — does not need to be exported from registry.service.ts
