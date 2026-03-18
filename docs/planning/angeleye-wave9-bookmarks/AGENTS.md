# AGENTS.md — AngelEye Wave 9: Bookmarks + Naming + Resilience

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Wave goal**: Star/bookmark sessions with notes, find named sessions, inline rename with JSONL write-back, hook resilience, startup backfill.

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
- All service files live in `server/src/services/`
- All imports use `.js` extension (ESM — do not use `.ts`)
- **Baseline**: 170 server tests passing, 44 client tests passing (6 pre-existing failures in env.test.ts — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry at `~/.claude/angeleye/registry.json`; session events at `~/.claude/angeleye/sessions/session-<id>.jsonl`
- Claude Code session files at `~/.claude/projects/<encoded-path>/<session_id>.jsonl`
- Write queue for registry is in `registry.service.ts`

---

## Service File Structure

```
server/src/services/
  registry.service.ts    — _setDataDir, path helpers, writeQueue, readRegistry, updateRegistry, initAngelEyeDirs
  sessions.service.ts    — writeEvent, getSessionEvents, archiveSession  ← WB02 adds writeSessionName here
  workspace.service.ts   — readWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace
  backfill.service.ts    — backfillTranscripts, BackfillResult
  classifier.service.ts  — classifySession, findFirstRealPrompt
```

---

## WB01 — Schema + PATCH Extension

### What to build

**1. shared/src/angeleye.ts** — add `note` to `RegistryEntry`:

```typescript
note?: string | null;   // free-text annotation, set by user
```

Add alongside the existing optional fields (`is_junk?`, `session_type?`, etc.).

**2. server/src/routes/sessions.ts** — extend PATCH handler:

Current handler destructures `{ name, tags, workspace_id }`. Add `note`:

```typescript
const { name, tags, workspace_id, note } = req.body as {
  name?: string;
  tags?: string[];
  workspace_id?: string | null;
  note?: string | null;
};
if (note !== undefined) updates.note = note;
```

**3. Tests** — add to `server/src/test/sessions.test.ts`:

- PATCH with `note: "interesting auth pattern"` → registry updated
- PATCH with `note: null` → clears existing note
- PATCH with `note` + `name` together → both fields updated

### Done when

- `shared/src/angeleye.ts` has `note?: string | null` on RegistryEntry
- PATCH handler persists `note`
- 3+ new tests pass
- `npm run typecheck` clean, `npm test` baseline maintained

---

## WB02 — JSONL Write-Back Service

### What to build

Add to `server/src/services/sessions.service.ts`:

```typescript
export async function writeSessionName(
  sessionId: string,
  name: string,
  projectDir: string
): Promise<void>;
```

**Logic**:

1. Derive the encoded project path: replace each `/` in `projectDir` with `-` (same encoding Claude Code uses for `~/.claude/projects/` directory names — leading `/` becomes leading `-`)
2. Build the JSONL path: `~/.claude/projects/<encoded>/<sessionId>.jsonl`
3. If the file does not exist — log a warning and return (don't throw; session may predate local install)
4. Append two lines to the file:

```json
{"type":"custom-title","customTitle":"<name>","sessionId":"<sessionId>"}
{"type":"agent-name","agentName":"<name>","sessionId":"<sessionId>"}
```

Each on its own line, terminated with `\n`.

**Call site** — update `server/src/routes/sessions.ts` PATCH handler:

```typescript
if (name !== undefined) {
  updates.name = name;
  // write-back to Claude Code JSONL so claude --resume "name" works
  const entry = registry[id];
  if (entry?.project_dir) {
    await writeSessionName(id, name, entry.project_dir).catch((err) =>
      console.warn('writeSessionName failed (non-fatal):', err)
    );
  }
}
```

**Important**: write-back failure must never fail the PATCH request. Always `.catch()`.

### Path encoding

Claude Code encodes `~/.claude/projects/` directory names by replacing `/` with `-`:

```
/Users/davidcruwys/dev/ad/apps/angeleye
→ -Users-davidcruwys-dev-ad-apps-angeleye
```

The home directory prefix `~` is expanded to the absolute path first. Use `os.homedir()` if needed.

### Tests (write in sessions.service.test.ts or a new write-back test file)

- Creates correct encoded path from project_dir
- Appends both entry types to JSONL
- Does not throw if JSONL file doesn't exist (logs warning, returns)
- Appending twice creates two pairs (both entries present, last wins per Claude Code)

### Done when

- `writeSessionName` exported from `sessions.service.ts`
- PATCH /api/sessions/:id calls it when `name` is provided
- PATCH never fails due to write-back error
- 4+ tests pass
- `npm run typecheck` clean

---

## WB03 — Observer Star System (B028)

### What to build

Update `client/src/views/ObserverView.tsx`.

**1. ★ toggle on session rows**

In each session card row, add a star icon button (left of or right of the session label area):

```tsx
<button
  onClick={() => toggleStar(session)}
  className={`text-sm ${isStarred ? 'text-amber-500' : 'text-muted-foreground opacity-40 hover:opacity-100'}`}
  title={isStarred ? 'Remove bookmark' : 'Bookmark session'}
>
  {isStarred ? '★' : '☆'}
</button>
```

`isStarred` = `session.tags?.includes('starred') ?? false`

`toggleStar` — calls `PATCH /api/sessions/:id` with updated tags array (add or remove `'starred'`).

**2. `All | Starred` filter toggle**

In the Observer column header area, add filter buttons:

```
[ All ]  [ Starred ]
```

State: `filter: 'all' | 'starred'` (default `'all'`).

When `'starred'`: only show sessions where `tags?.includes('starred')`.

**3. Note field in focus panel**

The focus panel (expanded detail view for selected session) already shows recent events. Below the events list, add:

```
Note: [_________________________________]  [Save]
```

- Textarea or single-line input, pre-filled with `session.note ?? ''`
- Save button (or Enter) calls `PATCH /api/sessions/:id` with `{ note: value }`
- Empty string → `PATCH` with `{ note: null }` to clear

**4. Copy-resume button**

In each session card row, add a small clipboard icon button:

```tsx
<button
  onClick={() => navigator.clipboard.writeText(`claude --resume ${session.session_id}`)}
  title="Copy resume command"
  className="text-xs text-muted-foreground hover:text-foreground"
>
  ⎘
</button>
```

Uses UUID — not name — because `claude --resume "name"` is unreliable (no name field in Claude Code's sessions-index.json).

### Done when

- ★ toggle updates tags via PATCH, re-renders immediately (optimistic update)
- `All | Starred` filter works
- Note field saves via PATCH
- Copy-resume copies `claude --resume <uuid>` to clipboard
- `npm run typecheck` clean, 44 client tests still passing

---

## WB04 — Observer Naming System (B029)

### What to build

Update `client/src/views/ObserverView.tsx`.

**1. `All | Named` filter**

Extend the filter bar from WB03 to a three-state toggle:

```
[ All ]  [ Starred ]  [ Named ]
```

`filter: 'all' | 'starred' | 'named'`

When `'named'`: only show sessions where `session.name !== null && session.name !== undefined`.

**2. Inline rename**

The session label currently shows `sessionLabel(session)` (name → project → basename → uuid prefix).

Make it editable:

```tsx
// display mode
<span
  className="cursor-pointer hover:underline"
  onClick={() => setRenamingId(session.session_id)}
  title="Click to rename"
>
  {sessionLabel(session)}
</span>

// edit mode (when renamingId === session.session_id)
<input
  autoFocus
  defaultValue={session.name ?? ''}
  onKeyDown={(e) => {
    if (e.key === 'Enter') commitRename(session, e.currentTarget.value);
    if (e.key === 'Escape') setRenamingId(null);
  }}
  onBlur={(e) => commitRename(session, e.currentTarget.value)}
  className="font-mono text-sm border-b border-amber-500 bg-transparent outline-none"
/>
```

`commitRename` — calls `PATCH /api/sessions/:id` with `{ name: value }`. This triggers the JSONL write-back in WB02. On success, updates local state. On empty string, sends `{ name: null }`.

### Done when

- `All | Named` filter works
- Click on session label enters rename mode
- Enter/blur commits via PATCH (WB02 write-back fires server-side)
- Escape cancels without saving
- `npm run typecheck` clean, 44 client tests still passing

---

## WB05 — Hook Resilience (B024)

### What to build

**Two changes:**

**1. Update `~/.claude/settings.json`**

Replace the 7 HTTP hook entries with command hooks using curl. The command hook receives the payload on stdin and POSTs it:

For each of the 7 hooks (PostToolUse, UserPromptSubmit, SessionStart, SessionEnd, Stop, SubagentStart, SubagentStop):

Replace:

```json
{ "type": "http", "url": "http://localhost:5051/hooks/<Event>", "timeout": 5 }
```

With:

```json
{
  "type": "command",
  "command": "curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/<Event> || true"
}
```

Read the current `~/.claude/settings.json`, make the 7 replacements, write back. Preserve all other hooks (the disler hooks, the screenshot hook, etc.).

**2. Update `/angeleye:install` skill**

The install skill is at `~/.claude/plugins/cache/appydave-plugins/appydave/*/skills/angeleye-install/SKILL.md` (find the latest version).

Update the hook registration section to use the `command` + `curl || true` pattern instead of `type: "http"`.

### Done when

- `~/.claude/settings.json` has no `"type": "http"` entries for AngelEye hooks
- Each replaced hook uses `curl -d @- ... || true`
- Disler hooks and screenshot hook are untouched
- angeleye-install SKILL.md updated to use command pattern
- No tests required (settings file, not app code)

---

## WB06 — Startup Backfill (B031)

### What to build

Update `server/src/index.ts`.

After the existing `await initAngelEyeDirs()` call, add:

```typescript
import { backfillTranscripts } from './services/backfill.service.js';

// Auto-heal: catch up on any sessions missed while server was down
backfillTranscripts()
  .then((result) => {
    if (result.imported > 0) {
      logger.info(
        `Startup backfill: ${result.imported} new sessions, ${result.skipped} already known`
      );
    }
  })
  .catch((err) => {
    logger.warn('Startup backfill failed (non-fatal):', err);
  });
```

**Non-blocking**: use `.then().catch()` not `await` — don't delay server startup.
**Non-fatal**: backfill failure must never prevent the server from starting.

### Done when

- Server starts and fires backfill in background
- Backfill result logged only if `imported > 0` (no noise when nothing to catch up)
- Backfill failure logged as warning, server continues
- `npm run typecheck` clean, no test regressions

---

## WB07 — Housekeeping

### What to do

**1. BACKLOG.md** (`docs/planning/BACKLOG.md`):

- Mark B030 done: `[x] B030 — Investigate Claude Code session name storage | Completed: angeleye-wave9-bookmarks`
- Update B029 note: remove "AngelEye-side rename only" caveat — write-back is now implemented
- Add B031: `[x] B031 — Auto-run backfill on server start | Completed: angeleye-wave9-bookmarks`
- Update totals

**2. SESSION_HANDOVER.md**:

- Rename `docs/planning/SESSION_HANDOVER.md` → `docs/planning/angeleye-wave6-ui/SESSION_HANDOVER-wave6-to-7.md`
- It contains the linen design decision and colour values — worth preserving as historical record

**3. Update BACKLOG.md pending count** to reflect items completed in this wave.

### Done when

- BACKLOG.md updated (B030 done, B029 note fixed, B031 added as done)
- SESSION_HANDOVER.md moved to wave6-ui folder
- No code changes, no tests

---

## Quality Gates (all units)

1. `npm run typecheck` clean after every unit
2. `npm run lint` clean after every unit
3. `npm test` — server baseline 170 passing (ignore 6 pre-existing env.test.ts failures), client 44 passing
4. WB02: write-back failure must never propagate to PATCH response — always `.catch()`
5. WB05: preserve all non-AngelEye hooks (disler, screenshot) — do not overwrite unrelated entries
6. WB06: backfill must be non-blocking and non-fatal
7. No `console.log` in server files (use `logger.info` / `logger.warn`)
8. All imports use `.js` extension (ESM)

---

## Learnings from Wave 8

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: `write to .tmp then rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- Path helpers exported from `registry.service.ts` — import from there
- Sequential is forced when units share the same source file (e.g. ObserverView.tsx — WB03 before WB04)
- `_doUpdateRegistry` is private — not exported
- JSONL write-back: entries with no `parentUuid` are tree-detached metadata — safe to append without affecting conversation history
- `claude --resume "name"` unreliable — copy-resume uses UUID only
