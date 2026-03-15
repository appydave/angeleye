# AGENTS.md — AngelEye Wave 4: Polish

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Polish — fix bugs found in UI review, improve session readability.

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
- All fetch calls must have `.catch(() => {})`
- No polling in client views

---

## P01 — Workspace Delete

### What to build

Add a delete button to each `WorkspaceCard` in `client/src/views/OrganiserView.tsx`.

The DELETE API route already exists: `DELETE /api/workspaces/:id → 204`.

### UI change

In `WorkspaceCard`, add a small `✕` button in the workspace card header (right side, next to session count).

- Only show if `sessions.length === 0` OR after a confirmation (`window.confirm`)
- On confirm: call `DELETE /api/workspaces/:id`, then call `onDeleted(workspace.id)` callback
- `onDeleted` in `OrganiserView`: remove workspace from local state, set any sessions with that `workspace_id` back to `null` (return them to inbox)

### Exact interface change

```typescript
interface WorkspaceCardProps {
  workspace: WorkspaceEntry;
  sessions: RegistryEntry[];
  onDeleted: (workspaceId: string) => void; // add this
}
```

### No new tests needed

The DELETE route is already tested in `server/src/routes/workspaces.test.ts`. This is a client-only change.

### Done when

- ✕ button visible on workspace cards
- Clicking it with sessions present shows `window.confirm`
- Clicking it on empty workspace deletes immediately
- Workspace removed from UI, any orphaned sessions return to inbox
- typecheck + lint clean

---

## P02 — Observer Idle Column Label

### What to build

The Observer right column shows `{idleSecs}s` with no header. Add a column header row.

File: `client/src/views/ObserverView.tsx`

### Current structure

The session list renders rows directly in a scrollable div. There is no header row. Add one above the session list with column labels matching the layout:

```
[dot] [name 32 chars] [last event summary — flex-1] [X ago — w-16] [Xs — w-12]
```

Header labels:

- dot column: empty (w-4)
- name: `SESSION` (w-32)
- summary: `LAST ACTIVITY` (flex-1)
- time ago: `WHEN` (w-16, text-right)
- idle: `IDLE` (w-12, text-right)

Style: `font-bebas tracking-wider text-muted-foreground text-xs` — same pattern as other headings but smaller and muted. Add `border-b border-border` below the header row.

### No new tests needed

Client-only cosmetic change.

### Done when

- Column headers visible above session list
- Headers align with their columns
- typecheck + lint clean

---

## P03 — Session Label Fallback

### What to build

Sessions without a project name show raw 8-char UUIDs. Improve the `sessionLabel` function in **both** `ObserverView.tsx` and `OrganiserView.tsx` to use `project_dir` basename as a middle fallback.

### Current logic (both files)

```typescript
function sessionLabel(entry: RegistryEntry): string {
  return entry.name ?? entry.project ?? entry.session_id?.slice(0, 8) ?? 'unknown';
}
```

### New logic

```typescript
function sessionLabel(entry: RegistryEntry): string {
  if (entry.name) return entry.name;
  if (entry.project) return entry.project;
  if (entry.project_dir) {
    const base = entry.project_dir.split('/').filter(Boolean).pop();
    if (base) return base;
  }
  return entry.session_id?.slice(0, 8) ?? 'unknown';
}
```

`project_dir` is already in `RegistryEntry` in `shared/src/angeleye.ts`.

### No new tests needed

Pure client helper change.

### Done when

- Sessions with `project_dir` but no `project` show dirname basename instead of UUID
- typecheck + lint clean

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean
2. `npm run lint` passes clean
3. `npm test` passes (160 tests — no regressions)
4. Run `node scripts/screenshot.mjs` and check output in `/tmp/angeleye-screenshots/`
5. No `console.log` left in production code
6. All fetch calls have `.catch(() => {})`
