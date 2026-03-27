# AGENTS.md — AngelEye Wave 11: Full Hook Coverage

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Wave goal**: Complete expansion from 7→24 hook event subscriptions. Server-side code is done — this wave updates the install skill and wires settings.json.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
npm run build --workspace shared   # Must run if shared types change
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT `apiError`
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in `beforeEach`, `rm(testDir)` in `afterEach`
- All service files live in `server/src/services/`
- All imports use `.js` extension (ESM — do not use `.ts`)
- **Baseline**: 316 server tests passing (6 pre-existing failures in `env.test.ts` — ignore), 44 client tests passing
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry at `~/.claude/angeleye/registry.json`; session events at `~/.claude/angeleye/sessions/session-<id>.jsonl`
- Claude Code session files at `~/.claude/projects/<encoded-path>/<session_id>.jsonl`
- Write queue for registry is in `registry.service.ts`
- `getDataDir()` is exported from `registry.service.ts` — use it to build paths inside `~/.claude/angeleye/`
- No `console.log` in server files — use `logger.info` / `logger.warn` / `logger.error`
- All 24 event types and their payload extraction are already committed in `hooks.ts`
- Schema auditor at `server/src/services/schema-auditor.service.ts` logs unexpected payload shapes

---

## The 24 Hook Events

### Original 7 (tight payload extraction)

SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd, SubagentStart, SubagentStop

### Wave 11 additions (raw payload with truncation)

PostToolUseFailure, StopFailure, WorktreeCreate, WorktreeRemove, CwdChanged, PreToolUse, InstructionsLoaded, PreCompact, PostCompact, PermissionRequest, Notification, TeammateIdle, TaskCompleted, ConfigChange, Elicitation, ElicitationResult, FileChanged

---

## WU01 — Update Install Skill (7→24 hooks)

### What to change

**File**: `~/.claude/skills/angeleye-install/SKILL.md`

Update the hook list from 7 to all 24. Each hook uses the same curl pattern:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "command",
      "command": "curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/<EventName> || true"
    }
  ]
}
```

### Safety guardrails (CRITICAL)

`~/.claude/settings.json` is shared across ALL Claude Code sessions and may contain hooks from other tools or other users' configurations. The install skill MUST:

1. **Only touch AngelEye entries** — identify by `localhost:5051` in the command string
2. **Preserve all non-AngelEye hooks** — if a hook event (e.g. `PostToolUse`) has entries from other tools, keep them. Only remove/replace entries containing `localhost:5051`
3. **Be additive within arrays** — each hook event key in settings.json maps to an array. Append the AngelEye entry; don't replace the array
4. **Document the blast radius** — 24 hooks means 24 curl commands per session. Note this in the skill output so users understand what they're enabling
5. **Support partial installs** — if some hooks are already wired, skip them (idempotent). Report what was added vs what was already present

### Install skill output format

After running, the skill should report:

```
AngelEye hooks installed (24 events).
- Added: 17 new hooks (PostToolUseFailure, StopFailure, ...)
- Already present: 7 hooks (SessionStart, UserPromptSubmit, ...)
Restart Claude Code for hooks to take effect.
Server: http://localhost:5051 | UI: http://localhost:5050

Note: 24 hook commands fire per session via curl. If AngelEye
server isn't running, commands fail silently (|| true).
```

### The full event list for the skill

```
SessionStart        → /hooks/SessionStart
UserPromptSubmit    → /hooks/UserPromptSubmit
PostToolUse         → /hooks/PostToolUse
Stop                → /hooks/Stop
SessionEnd          → /hooks/SessionEnd
SubagentStart       → /hooks/SubagentStart
SubagentStop        → /hooks/SubagentStop
PostToolUseFailure  → /hooks/PostToolUseFailure
StopFailure         → /hooks/StopFailure
WorktreeCreate      → /hooks/WorktreeCreate
WorktreeRemove      → /hooks/WorktreeRemove
CwdChanged          → /hooks/CwdChanged
PreToolUse          → /hooks/PreToolUse
InstructionsLoaded  → /hooks/InstructionsLoaded
PreCompact          → /hooks/PreCompact
PostCompact         → /hooks/PostCompact
PermissionRequest   → /hooks/PermissionRequest
Notification        → /hooks/Notification
TeammateIdle        → /hooks/TeammateIdle
TaskCompleted       → /hooks/TaskCompleted
ConfigChange        → /hooks/ConfigChange
Elicitation         → /hooks/Elicitation
ElicitationResult   → /hooks/ElicitationResult
FileChanged         → /hooks/FileChanged
```

### Done when

- Skill SKILL.md lists all 24 hooks
- Safety guardrails documented in the skill instructions
- Idempotent: running twice produces same result
- Non-AngelEye hooks are explicitly preserved

---

## WU02 — Wire Settings.json + End-to-End Verification

### What to do

1. Read current `~/.claude/settings.json`
2. Add 17 new hook entries (the original 7 should already be present)
3. Preserve all non-AngelEye entries
4. Write back with 2-space indentation

### Verification checklist

After wiring, verify in a NEW Claude Code session (hooks load at session start):

1. Start a session — confirm `session_start` event appears in AngelEye JSONL
2. Read a nonexistent file — confirm `tool_failure` event captured
3. Run `/compact` — confirm `pre_compact` + `post_compact` captured
4. Check AngelEye UI still renders (no crash from new event types in stream)

### Done when

- `~/.claude/settings.json` has all 24 hook entries
- No non-AngelEye hooks were removed or modified
- At least one new event type verified in the JSONL output
- AngelEye UI loads without errors

---

## Quality Gates (all units)

1. Install skill is idempotent — safe to run multiple times
2. No non-AngelEye hooks modified in settings.json
3. `npm run typecheck` clean (already passing — don't regress)
4. `npm test` — server 316 passing, client 44 passing
5. `npm run lint` clean
6. All 24 event types present in EVENT_MAP (`server/src/routes/hooks.ts`)
7. All 24 event types present in ANGELEYE_EVENTS (`shared/src/constants.ts`)
8. All 24 event types present in AngelEyeEventType union (`shared/src/angeleye.ts`)

---

## Learnings from Prior Waves

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: `write to .tmp then rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- Path helpers exported from `registry.service.ts` — import from there
- All server imports use `.js` extension (ESM)
- Agents must commit their changes — don't leave uncommitted
- Rebuild shared (`npm run build --workspace shared`) after changing shared types
- `ORIGINAL_EVENTS` set in hooks.ts determines which events get custom extraction vs raw payload
- `STRIP_FROM_PAYLOAD` set filters common fields out of the raw payload bucket
