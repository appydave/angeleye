# AngelEye — Session Handover (Session 4 → Session 5)

**Date**: 2026-03-15
**Status**: Wave 3 merged. Rate limiter bug fixed. Wave 4 polish planned, ready to build.

## Session 5 Start Prompt

> Read the AngelEye handover at `~/dev/ad/apps/angeleye/docs/planning/SESSION_HANDOVER.md`. Launch the Wave 4 polish agent prompts below in sequence: P01, P02, P03.

---

## What Was Done This Session

### Wave 3 complete — merged to main (160 tests)

W01 workspace API, W02 organiser UI, W03 drag-to-assign, W04 folder inference. All done.

### Bug found and fixed: rate limiter

`apiLimiter` was applied globally — hook traffic (every Claude tool call) shared the
same 100-req/15-min bucket as the UI API. Fixed: rate limiter now scoped to `/api/*` only.
Commit: `fix: exempt /hooks/* from rate limiter`

### Playwright workflow fixed

- `scripts/screenshot.mjs` — headless, run from project root, saves to `/tmp/angeleye-screenshots/`
- `scripts/tour.mjs` — headed, opens on screen, use `node scripts/tour.mjs`
- Playwright MCP config updated to use bundled Chromium (fixes Chrome conflict). Takes effect after Claude Code restart.

### UI review findings (from live Playwright tour)

From actually using the app with real hook data flowing:

**Bugs:**

1. No workspace delete button — can't remove workspaces once created
2. Observer idle column (`{idleSecs}s`) has no header — unlabeled for users

**Readability:** 3. Sessions without `project_dir` show as 8-char UUID fragments — unreadable
(sessions with `project_dir` already show correctly via `project` field)

---

## Wave 4: Polish — PLANNED, ready to build

AGENTS.md at: `docs/planning/angeleye-wave4-polish/AGENTS.md`
Work is in main repo (no worktree needed — client-only changes + no risky server work).

| Unit | What                       | Files touched                        |
| ---- | -------------------------- | ------------------------------------ |
| P01  | Workspace delete button    | client/src/views/OrganiserView.tsx   |
| P02  | Observer idle column label | client/src/views/ObserverView.tsx    |
| P03  | Session label fallback     | ObserverView.tsx + OrganiserView.tsx |

---

## P01 Agent Prompt

---

You are implementing P01 for AngelEye wave 4 polish.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/angeleye-wave4-polish/AGENTS.md first.
Repo: /Users/davidcruwys/dev/ad/apps/angeleye/

Add workspace delete to OrganiserView.
Read client/src/views/OrganiserView.tsx first.

The DELETE /api/workspaces/:id route already exists and is tested. This is client-only.

Add ✕ button to WorkspaceCard header. On click: window.confirm if sessions present, else delete immediately.
DELETE /api/workspaces/:id → remove from local workspaces state → return orphaned sessions to inbox (set workspace_id: null).

Done when: delete works, orphaned sessions return to inbox, typecheck + lint + 160 tests all pass.

---

## P02 Agent Prompt

---

You are implementing P02 for AngelEye wave 4 polish.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/angeleye-wave4-polish/AGENTS.md first.
Repo: /Users/davidcruwys/dev/ad/apps/angeleye/

Add column header row to ObserverView.
Read client/src/views/ObserverView.tsx first.

The idle counter column (idleSecs) has no label. Add a sticky header row above the session list with labels: SESSION, LAST ACTIVITY, WHEN, IDLE — aligned to match the row layout.

Done when: header visible, columns align, typecheck + lint + 160 tests all pass.

---

## P03 Agent Prompt

---

You are implementing P03 for AngelEye wave 4 polish.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/angeleye-wave4-polish/AGENTS.md first.
Repo: /Users/davidcruwys/dev/ad/apps/angeleye/

Improve sessionLabel() in both ObserverView.tsx and OrganiserView.tsx.
Read both files first.

Current: name ?? project ?? session_id.slice(0,8)
New: name ?? project ?? project_dir basename ?? session_id.slice(0,8)

Done when: sessions with project_dir but no project show the dir basename, typecheck + lint + 160 tests all pass.
Run node scripts/screenshot.mjs and verify the output looks correct before reporting done.

---

## After P01/P02/P03

Commit: `fix: wave 4 polish — workspace delete, observer labels, session name fallback`
Push to origin.

Then move to Wave 5:

- B007: Transcript backfill (scan ~/.claude/projects/ JSONL → populate registry)
- B010: /angeleye:context skill

---

## Key Technical Facts

Ports: Client 5050, Server 5051
Test isolation: `_setDataDir(tmpDir)` resets paths + write queue
Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
Client reads: `response.data.sessions[]`, `response.data.workspaces[]`, `response.data.events[]`
Data dir: `~/.claude/angeleye/` (registry.json, workspaces.json, sessions/, archive/)
160 tests currently passing (116 server / 44 client)

**Handover written**: 2026-03-15
