# AGENTS.md — AngelEye Wave 6: Hardening

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Hardening — fix two correctness bugs before they cause data loss; fix test gaps that hide real failure modes; clean up the worst duplication.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
node scripts/screenshot.mjs   # capture screenshots after changes
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in beforeEach, `rm(testDir)` in afterEach
- Write queue: module-level singleton in `server/src/services/angeleye-data.ts`
- Data dir: `~/.claude/angeleye/` (registry.json, workspaces.json, sessions/, archive/)
- 165 tests currently passing (121 server / 44 client)
- All fetch calls must have `.catch(() => {})`
- No polling in client views

---

## H01 — Fix Write Queue

### What to build

The write queue in `angeleye-data.ts` halts permanently if any write fails — a rejected promise stops the chain and no further writes proceed until the server restarts. Fix this by adding a `.catch()` to the chain so failures are logged but the queue continues.

### Exact file to change

`server/src/services/angeleye-data.ts` — around line 76 in `updateRegistry`.

### Current code

```ts
writeQueue = writeQueue.then(() => _doUpdateRegistry(sessionId, updates));
return writeQueue;
```

### Fix

```ts
writeQueue = writeQueue
  .then(() => _doUpdateRegistry(sessionId, updates))
  .catch((err) => {
    logger.error({ err, sessionId }, 'Registry write failed — queue continues');
  });
return writeQueue;
```

### Done when

- `.catch()` exists on the write queue chain
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## H02 — Atomic Registry Writes

### What to build

`registry.json` and `workspaces.json` are written with a single `writeFile()` call. If the process is killed mid-write, the file is truncated and unreadable. Fix both write paths to use a write-to-tmp then rename pattern, which is atomic on POSIX systems.

### Exact file to change

`server/src/services/angeleye-data.ts` — `_doUpdateRegistry` (around line 114) and `writeWorkspaces` (around line 166).

### Change pattern

For each `writeFile(targetPath, content)` call, replace with:

```ts
const tmp = targetPath + '.tmp';
await writeFile(tmp, content);
await rename(tmp, targetPath);
```

`rename` is already imported from `fs/promises` — do not add a new import.

### Done when

- Both `registry.json` and `workspaces.json` write paths use the tmp+rename pattern
- No `.tmp` file is left behind on success
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## H03 — Extract session-helpers.ts

### What to build

`sessionLabel`, `timeAgo`, and `statusDot` are identical functions defined separately in both `ObserverView.tsx` and `OrganiserView.tsx`. Extract them to a shared utility file and import in both views.

### Files to change

1. **Create**: `client/src/utils/session-helpers.ts`
2. **Edit**: `client/src/views/ObserverView.tsx` — delete local copies, add import
3. **Edit**: `client/src/views/OrganiserView.tsx` — delete local copies, add import

### New file content pattern

```ts
import type { RegistryEntry } from '@appystack-template/shared';

export function sessionLabel(entry: RegistryEntry): string {
  // copy exact implementation from either view — they are identical
}

export function timeAgo(iso: string): string {
  // copy exact implementation
}

export function statusDot(lastActive: string): string {
  // copy exact implementation
}
```

Read the current implementations from the view files before writing the utility — use the exact code as it exists, do not rewrite the logic.

### Done when

- `client/src/utils/session-helpers.ts` exists with all three exported functions
- Neither `ObserverView.tsx` nor `OrganiserView.tsx` defines these functions locally
- Both views import from `../utils/session-helpers`
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## H04 — Fix initAngelEyeDirs Startup

### What to build

`initAngelEyeDirs()` is called defensively inside `hooks.ts` on every request because it was never properly awaited at startup in `index.ts`. This is a compensating pattern for a missing `await`. Fix the root cause: await it in `index.ts` before `httpServer.listen()`, then remove the defensive call from `hooks.ts`.

### Files to change

1. **Edit**: `server/src/index.ts` — find `httpServer.listen(...)` and ensure `await initAngelEyeDirs()` precedes it (it may already be there but not awaited — check the exact code before editing)
2. **Edit**: `server/src/routes/hooks.ts` — remove the `initAngelEyeDirs()` call (find it and delete the line + any now-unused import)

### Done when

- `server/src/index.ts` awaits `initAngelEyeDirs()` before `httpServer.listen()`
- `server/src/routes/hooks.ts` has no `initAngelEyeDirs` reference
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## H05 — Validate workspace_id on PATCH /sessions/:id

### What to build

`PATCH /api/sessions/:id` accepts `workspace_id` in the body and writes it without checking whether that workspace actually exists. Add validation: if `workspace_id` is a non-null string, read the workspaces file and return 404 if the id is not found.

### File to change

`server/src/routes/sessions.ts` — the PATCH handler.

### Implementation pattern

```ts
if (updates.workspace_id !== null && updates.workspace_id !== undefined) {
  const workspaces = await getWorkspaces();
  const exists = workspaces.some((w) => w.id === updates.workspace_id);
  if (!exists) {
    return apiFailure(res, 'Workspace not found', 404);
  }
}
```

Add this check after parsing the body but before calling `updateRegistry`.

### New test to add

Add one test to `server/src/routes/sessions.test.ts`:

```ts
it('returns 404 when workspace_id does not exist', async () => {
  // create a session in the registry first
  // PATCH it with a workspace_id that was never created
  // assert 404 response
});
```

### Done when

- PATCH with an unknown `workspace_id` returns 404
- PATCH with `workspace_id: null` still works (clears the assignment)
- PATCH with a valid `workspace_id` still works
- New test passes
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165+ tests — no regressions)

---

## T01 — Backfill Writes Events to Disk

### What to build

The most critical untested behaviour: after `backfillTranscripts()` runs, does it actually write events to the sessions directory? Add a test that verifies this end-to-end with a fixture.

### File to change

`server/src/routes/backfill.test.ts`

### Test outline

```ts
it('writes events to sessions dir from fixture transcripts', async () => {
  // Set up a fixture claudeProjectsDir with:
  //   projects/-test-session-abc/
  //     sessions/
  //       some-uuid.jsonl  (JSONL with 2 user prompt entries + 1 tool_use entry)
  // Call backfillTranscripts(fixtureDir) directly (service-level call)
  // Assert: sessions dir contains session-test-session-abc.jsonl
  // Read and parse the JSONL file
  // Assert: 3 events total
  // Assert each event has: session_id, source: 'transcript', correct event_type
});
```

Build the fixture inline in the test — do not read from real `~/.claude/projects`.

### Done when

- Test exists and passes
- Test uses a local fixture, not the real Claude projects dir
- `npm test --workspace server` passes

---

## T02 — getSessionEvents Handles Malformed JSONL

### What to build

Document the current defensive behaviour: if a JSONL file contains a malformed line, `getSessionEvents` returns `[]` without throwing. Add a test that verifies this.

### File to change

`server/src/services/angeleye-data.test.ts`

### Test outline

```ts
it('returns [] without throwing when JSONL contains a malformed line', async () => {
  // Write a JSONL file with: one valid event line + one malformed line ("{bad json")
  // Call getSessionEvents(sessionId)
  // Assert: no error thrown
  // Assert: returns [] (current implementation has no per-line guard — whole parse fails)
  // Comment: "current implementation wraps the full parse; per-line recovery is a future improvement"
});
```

### Done when

- Test exists and passes
- Comment in test documents that this is the current defensive behaviour (not ideal, but documented)
- `npm test --workspace server` passes

---

## T03 — GET /sessions Sorted Newest-First

### What to build

Verify that `GET /api/sessions` returns sessions ordered newest-first by `last_active`. This ordering is assumed by the UI but currently untested.

### File to change

`server/src/routes/sessions.test.ts`

### Test outline

```ts
it('returns sessions sorted newest-first by last_active', async () => {
  // Create registry with two sessions:
  //   session-a: last_active '2026-03-01T10:00:00Z'
  //   session-b: last_active '2026-03-15T10:00:00Z'
  // GET /api/sessions
  // Assert response.body.data.sessions[0].session_id === 'session-b'
  // Assert response.body.data.sessions[1].session_id === 'session-a'
});
```

### Done when

- Test exists and passes (or reveals a sorting bug that should then be fixed)
- `npm test --workspace server` passes

---

## T04 — Hook Without session_id Creates session-unknown

### What to build

When a hook payload arrives without a `session_id` field, the server should write to `session-unknown.jsonl`. Add a test to verify this behaviour.

### File to change

`server/src/routes/hooks.test.ts`

### Test outline

```ts
it('writes to session-unknown.jsonl when session_id is missing', async () => {
  // POST /hooks/UserPromptSubmit with body that has no session_id field
  // Assert: response 200 with { continue: true }
  // Assert: sessions dir contains a file matching session-unknown.jsonl
  // Read the file, parse JSONL lines
  // Assert: at least one event with session_id === 'unknown'
});
```

### Done when

- Test exists and passes
- `npm test --workspace server` passes

---

## T05 — PATCH /sessions Rejects Non-Array tags

### What to build

Document the current gap: `PATCH /api/sessions/:id` with `{ tags: "not-an-array" }` currently writes bad data without validation. Add a test that documents the current behaviour. This is a documentation test — it asserts what happens today, not what should happen ideally.

### File to change

`server/src/routes/sessions.test.ts`

### Test outline

```ts
it('documents: PATCH with non-array tags currently writes without error (known gap)', async () => {
  // PATCH /api/sessions/:id with { tags: "not-an-array" }
  // Assert: response is 200 (current behaviour — no validation)
  // Comment: "tags validation is a known gap — add Zod body schema in a future wave"
});
```

### Done when

- Test exists and passes (documenting current behaviour)
- Comment in test names the gap explicitly
- `npm test --workspace server` passes

---

## T06 — Rewrite Non-Deterministic Backfill Route Test

### What to build

The existing backfill route test (around lines 89–102 in `backfill.test.ts`) sends `{ claudeProjectsDir }` in the body but the route ignores it and scans the real `~/.claude/projects`. This makes the test non-deterministic — it passes on machines with sessions and may fail on machines without. Rewrite this test to only assert response shape.

### File to change

`server/src/routes/backfill.test.ts` — find and replace the non-deterministic test.

### Rewrite

```ts
it('returns backfill result shape', async () => {
  // POST /api/backfill (no body or empty body)
  // Assert response 200
  // Assert response.body.data has shape: { scanned: number, imported: number, skipped: number, errors: number }
  // Comment: "route scans real ~/.claude/projects; service-level tests (T01) cover actual write behaviour"
});
```

### Done when

- The non-deterministic test is replaced with the shape-only assertion
- Test passes on a clean machine (no real Claude sessions required)
- `npm test --workspace server` passes

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean
2. `npm run lint` passes clean
3. `npm test` passes (165+ tests — no regressions)
4. No `console.log` left in production code
5. All fetch calls have `.catch(() => {})`
