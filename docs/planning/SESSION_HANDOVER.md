# AngelEye — Session Handover (Session 2 → Session 3)

**Date**: 2026-03-15
**Status**: Wave 1 complete (6/6 work units done). Wave 2 planning is next.

---

## 1. What Was Built — Wave 1 Complete

### Nav Shell

The client has a full AppShell layout built with:

- `client/src/components/AppShell.tsx` — root shell; wraps everything in `NavProvider`, renders `Header + Sidebar + ContentPanel` in a full-viewport `flex flex-col h-screen overflow-hidden` layout
- `client/src/components/Header.tsx` — top bar with app name and global actions
- `client/src/components/Sidebar.tsx` — left nav with `SidebarGroup` composables, collapses via `NavContext`
- `client/src/components/SidebarGroup.tsx` — reusable group with items
- `client/src/components/ContentPanel.tsx` — right content area that renders the active view
- `client/src/contexts/NavContext.tsx` — `NavProvider` + `useNav()` hook; state: `activeView`, `collapsed`, `contextNav`; actions: `navigate(viewKey)`, `toggleCollapsed()`, `setContextNav()`
- Three views: `ObserverView.tsx`, `OrganiserView.tsx`, `SettingsView.tsx`

Default view on load: `observer` (set in `NavContext` initial state).

### Wave 1 Work Units — All 6 Complete

| Unit              | Backlog ID | What it does                                                                                                                                                                                                                                                                         |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W01-shared-types  | B001       | `AngelEyeEvent`, `RegistryEntry`, `WorkspaceEntry`, `Registry` types in `shared/src/angeleye.ts`; Socket.io events extended with `ANGELEYE_EVENT`                                                                                                                                    |
| W02-data-service  | B002       | `server/src/services/angeleye-data.ts` — 7 functions: `initAngelEyeDirs`, `writeEvent`, `readRegistry`, `updateRegistry`, `getSessionEvents`, `archiveSession`, plus constants for all data paths                                                                                    |
| W03-hook-endpoint | B003       | `server/src/routes/hooks.ts` — `createHooksRouter(io)`; handles `POST /hooks/:event`; stop hook guard, `EVENT_MAP`, `summariseTool`, registry lifecycle, Socket.io emit                                                                                                              |
| W04-sessions-api  | B004       | `server/src/routes/sessions.ts` — `GET /api/sessions` (registry list) and `GET /api/sessions/:id/events` (JSONL events for a session)                                                                                                                                                |
| W05-observer-ui   | B005       | `client/src/views/ObserverView.tsx` — 3-layer layout (header bar / activity feed / focus panel); Socket.io live feed; idle counters ticking every second with amber-at-8s / red-at-15s colouring; click-to-focus detail panel; `sessionLabel()` shows name → project → hash fallback |
| W06-install-skill | B006       | Two skills at correct paths (see below)                                                                                                                                                                                                                                              |

### Skills — Correct Paths

Both skills are at the flat `~/.claude/skills/<skill-name>/SKILL.md` structure (AppyStack convention):

- `~/.claude/skills/angeleye-install/SKILL.md` — wires 7 HTTP hook URLs into `~/.claude/settings.json`, idempotent, prompts before overwrite
- `~/.claude/skills/angeleye-name-session/SKILL.md` — tags current session in registry via API (PATCH `/api/sessions/:id`) with JSON fallback to direct file write if server is offline

Note: skills were originally placed in a nested `~/.claude/skills/angeleye/install.md` path during build — this was wrong. They were moved to the flat `angeleye-install/SKILL.md` and `angeleye-name-session/SKILL.md` structure. The correct paths are confirmed live in `~/.claude/skills/`.

---

## 2. Current Working State

### What Is Working

- Server on port 5051 accepts `POST /hooks/:event` for all 7 hook events
- `GET /api/sessions` returns registry entries
- `GET /api/sessions/:id/events` returns JSONL events for a session
- Socket.io emits `angeleye:event` to all connected clients on every hook receipt
- ObserverView connects to Socket.io, renders live activity feed sorted by recency, idle counter per session
- Focus panel: click any row to load last 10 events for that session
- Sessions with a `name` display the name; otherwise `project` (last segment of `cwd`); otherwise first 8 chars of session hash
- Skills load in Claude Code and are callable as `/angeleye:install` and `/angeleye:name-session`

### Hook Field Discovery — Critical Finding

Claude Code's HTTP hooks send the user prompt under the field name **`prompt`**, not `user_prompt`.

The `UserPromptSubmit` hook payload uses `prompt` as the key. The hook handler in `hooks.ts` handles both for resilience:

```typescript
const promptText =
  typeof body.prompt === 'string'
    ? body.prompt
    : typeof body.user_prompt === 'string'
      ? body.user_prompt
      : undefined;
```

This was discovered during live testing. The requirements doc at `docs/requirements.md` still says `user_prompt` in the hook schema table — that table is from the docs, not observed reality. Trust the code.

### Skills Directory Structure — Fixed

The previous (wrong) structure was `~/.claude/skills/angeleye/install.md` (nested namespace). The current (correct) AppyStack convention is `~/.claude/skills/angeleye-install/SKILL.md`. Both skills are now at the correct paths and confirmed present.

---

## 3. Known Bugs — Fix in Session 3

### Bug 1: Registry Race Condition (HIGH)

**File**: `server/src/services/angeleye-data.ts` — `updateRegistry()`

**Problem**: `updateRegistry` does a read-modify-write on `registry.json` with no locking:

```typescript
const registry = await readRegistry();   // read
registry[sessionId] = { ...updates };    // modify
await writeFile(REGISTRY_PATH, ...);     // write
```

When multiple Claude Code sessions fire hooks simultaneously (common — you run many concurrent sessions), these async reads race. Session A reads the file, Session B reads the file, Session A writes (with only its entry updated), Session B writes (overwriting A's entry with the stale version it read). Net result: registry entries get stomped silently.

**Fix**: Add a write queue (promise chain) in `angeleye-data.ts`. A simple in-memory serial queue is sufficient:

```typescript
let writeQueue = Promise.resolve();
export function updateRegistry(...) {
  writeQueue = writeQueue.then(() => _doUpdateRegistry(...));
  return writeQueue;
}
```

Alternatively: atomic temp-file-then-rename pattern. Either approach eliminates the interleaving window.

### Bug 2: Sparse Registry Entries (MEDIUM)

**Problem**: Sessions that were already running when hooks were installed (or when the server started) never fired `SessionStart`. Their registry entries were created by the `else` branch in `hooks.ts`:

```typescript
} else {
  await updateRegistry(sessionId, { last_active: ts });
}
```

This produces entries with only `session_id` + `last_active` — no `project`, `cwd`, `started_at`, `name`, `tags`, `workspace_id`, `status` fields.

**Symptoms in Observer**: these sessions show as hash IDs (no project name), and the `status` field is undefined/missing so they fall through the `status === 'active'` filter incorrectly.

**Fix**: In `updateRegistry`, when merging, derive missing fields from the incoming event if available:

- If `project` is missing and `cwd` is present on the event, set `project` from last segment of `cwd`
- If `status` is missing, default it to `'active'`
- If `started_at` is missing, use `ts` from the current event

The hook handler should also pass `cwd` on every `updateRegistry` call (not just `SessionStart`), so sparse entries can self-heal.

### Bug 3: Status Field Missing Causes Wrong Display (MEDIUM)

**Problem**: Registry entries that never had `status` set show as "ended" in Observer's active session count because:

```typescript
const activeSessions = sessions.filter((s) => s.entry.status === 'active');
```

An entry with `status: undefined` fails this check and is treated as inactive.

**Fix**: In `sessionLabel` fallback logic and `activeSessions` filter, treat `undefined` status as `'active'` if `last_active` was recent (within last 5 minutes). Or fix at ingestion — see Bug 2 fix above.

---

## 4. Session 3 Agenda — Priority Order

### Priority 1: Fix Registry Race Condition

- Edit `server/src/services/angeleye-data.ts`
- Add a serial write queue before `updateRegistry`
- This is high priority because it corrupts data silently under normal use (concurrent sessions)

### Priority 2: Fix Sparse Registry Entries

- Update `updateRegistry` to default `status: 'active'` when status is absent
- Pass `cwd` through on all non-SessionStart events so project name can be derived
- Optionally: add a `GET /api/sessions/:id` PATCH endpoint (already referenced in `angeleye-name-session` skill but not yet implemented in sessions router)

### Priority 3: Build Transcript Reader (B007)

**Backlog**: B007 — Transcript reader: scan `~/.claude/projects/`, parse existing JSONL sessions

- Scan `~/.claude/projects/<project-dir>/` for `*.jsonl` files
- Parse JSONL using the schema from `~/dev/upstream/repos/claude-mem/src/utils/transcript-parser.ts` (streaming dedup with `seenKeys` — same message appears multiple times, last occurrence wins)
- Normalise into `AngelEyeEvent` format with `source: 'transcript'`
- Backfill registry with sessions found in transcripts but not currently in registry
- Match on session_id; if already in registry, skip or merge

Reference parsers:

- `~/dev/upstream/repos/claude-mem/src/utils/transcript-parser.ts` — TypeScript transcript parser
- `~/dev/upstream/repos/claude-replay/src/parser.mjs` — turn reconstruction + streaming dedup

### Priority 4: Improve Observer Display

- `sessionLabel()` in `ObserverView.tsx` already handles name → project → hash fallback
- After Bug 2 fix, project names should populate for sparse entries
- Consider deriving project from `cwd` in the UI when `project` is null, rather than falling back to hash

---

## 5. Future Sessions Beyond Session 3

### Session 4 — Organiser View (B008)

`OrganiserView.tsx` is a stub. Build:

- Inbox section: sessions with `workspace_id: null`, sorted by `started_at`
- Named workspaces section: sessions grouped by workspace
- Drag-to-assign (use `@dnd-kit/core` — AppyStack standard)
- Folder inference badge: if `cwd` matches a known project pattern, show "looks like SupportSignal?" — confirm or dismiss, never auto-assign

### Session 5 — /angeleye:context Skill (B010)

New skill at `~/.claude/skills/angeleye-context/SKILL.md`

- Reads the current session's JSONL hot file (or named session from registry)
- Assembles a compact context block: session name, project, recent events, last Stop message
- Usage: `/angeleye:context --last 20` or `/angeleye:context --session abc123`
- Output is Claude-pasteable context, not a display format

### Session 6 — /angeleye:publish Skill (B011)

New skill at `~/.claude/skills/angeleye-publish/SKILL.md`

- Reads session context (calls angeleye:context internally or equivalent)
- Sends to Nano Banana / FliDeck for image generation
- Triggered manually or automatically on Stop events
- Usage: `/angeleye:publish --concept "auth middleware" --direction "circuit board"`
- Deferred: depends on angeleye:context being solid first

### Session 7 — Ambient Intelligence (B012)

- Prompt frequency pattern miner
- Scan all session JSONL files, extract `user_prompt` events, count phrase frequency
- Surface repeated phrases as skill candidates
- "You've typed 'did you commit?' 14 times this week — want a skill?"
- Needs transcript reader (B007) and data archive to be solid first

---

## 6. Key Technical Facts for Session 3

### Ports and URLs

| Service          | Port | URL                                                 |
| ---------------- | ---- | --------------------------------------------------- |
| Client (Vite)    | 5050 | http://localhost:5050                               |
| Server (Express) | 5051 | http://localhost:5051                               |
| Hook endpoint    | 5051 | `POST http://localhost:5051/hooks/:event`           |
| Sessions API     | 5051 | `GET http://localhost:5051/api/sessions`            |
| Session events   | 5051 | `GET http://localhost:5051/api/sessions/:id/events` |

### Data Paths

```
~/.claude/angeleye/
  registry.json              — shared session index
  workspaces.json            — named workspace configs
  sessions/
    session-<id>.jsonl       — one per active session (hot files)
  archive/
    session-<id>.jsonl       — rotated here at SessionEnd
```

### Hook Field Names (observed reality)

| Hook               | Field name in payload                                   | Note                               |
| ------------------ | ------------------------------------------------------- | ---------------------------------- |
| `UserPromptSubmit` | `prompt`                                                | NOT `user_prompt` — docs are wrong |
| `PostToolUse`      | `tool_name`, `tool_input`, `tool_result`, `tool_use_id` |                                    |
| `SessionStart`     | `session_id`, `cwd`, `project_dir`                      |                                    |
| `Stop`             | `reason`, `stop_hook_active`, `last_assistant_message`  |                                    |
| All events         | `session_id`, `cwd`, `hook_event_name`, `agent_id`      | Common fields                      |

### Skills Locations

```
~/.claude/skills/angeleye-install/SKILL.md
~/.claude/skills/angeleye-name-session/SKILL.md
```

Named by AppyStack flat convention: `<skill-slug>/SKILL.md`. Do NOT use nested `angeleye/install.md`.

### Project Root

```
~/dev/ad/apps/angeleye/
```

### Key Planning Files

```
docs/requirements.md                              — full requirements + data architecture
docs/planning/BACKLOG.md                          — all backlog items with status
docs/planning/angeleye-wave-1/IMPLEMENTATION_PLAN.md  — wave 1 plan (all 6 units done)
docs/planning/angeleye-wave-1/AGENTS.md           — reuse as template for wave 2 AGENTS.md
```

### Wave 2 Build Convention

- Use Ralphy in **Extend mode**, not Plan mode (wave 1 used Plan mode — wave 2 should extend what exists)
- Run `/appydave:ralphy` to generate wave 2 plan
- Reference `docs/planning/angeleye-wave-1/AGENTS.md` as template for the new wave's agents file

### Key Source Files to Know

```
server/src/routes/hooks.ts              — hook ingestion, tool summarisation, stop guard
server/src/routes/sessions.ts           — sessions API
server/src/services/angeleye-data.ts    — JSONL write, registry R/W, archive (BUG IS HERE)
shared/src/angeleye.ts                  — all shared types
client/src/views/ObserverView.tsx       — live Observer UI
client/src/contexts/NavContext.tsx      — nav state (activeView, collapsed, contextNav)
client/src/components/AppShell.tsx      — root shell layout
```

### Reference Repos (upstream patterns)

| Repo                                     | Local path                                             | Use for                                |
| ---------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| `disler/claude-code-hooks-observability` | `~/dev/upstream/repos/claude-code-hooks-observability` | Hook patterns, tool summarisation      |
| `es617/claude-replay`                    | `~/dev/upstream/repos/claude-replay`                   | JSONL streaming dedup (`seenKeys`)     |
| `thedotmack/claude-mem`                  | `~/dev/upstream/repos/claude-mem`                      | TypeScript JSONL types + parser        |
| `paperclipai/paperclip`                  | `~/dev/upstream/repos/paperclip`                       | Stream-JSON parser, session continuity |

---

## 7. How to Start Session 3

Paste this to Claude:

> Read the AngelEye handover at `~/dev/ad/apps/angeleye/docs/planning/SESSION_HANDOVER.md`, check the registry race condition fix in `server/src/services/angeleye-data.ts`, then run `/appydave:ralphy` to plan wave 2.

Before starting work, verify server is running:

```bash
cd ~/dev/ad/apps/angeleye
npm run dev
# or check: curl http://localhost:5051/health
```

Check registry for current state:

```bash
cat ~/.claude/angeleye/registry.json
```

---

**Handover written**: 2026-03-15
