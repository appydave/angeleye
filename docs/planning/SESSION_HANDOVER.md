# AngelEye — Session Handover (Session 3 → Session 4)

**Date**: 2026-03-15
**Status**: Wave 2 complete. Wave 3 in progress (W01 running in background).

## Session 4 Start Prompt

> Read the AngelEye handover at `~/dev/ad/apps/angeleye/docs/planning/SESSION_HANDOVER.md`, W01 is confirmed complete (116 tests passing). Start by launching the W02 agent prompt below.

## What Was Done This Session

### Git cleanup

- Created `.gitignore` (node_modules excluded permanently)
- All wave 1 code committed for the first time: `feat: wave 1 — AppyStack foundation + AngelEye hook pipeline`

### Wave 2: Hardening — COMPLETE (merged to main)

150 tests passing (106 server / 44 client). All 6 units done.

Key changes:

- `angeleye-data.ts`: added `_setDataDir(dir)` for test isolation (resets paths + write queue)
- New test files: angeleye-data.test.ts (13), hooks.test.ts (14), sessions.test.ts (13)
- New endpoint: PATCH /api/sessions/:id (name/tags/workspace_id)
- Bugs fixed: ObserverView unhandled fetch rejections; env.test.ts wrong port numbers

### Wave 3: Organiser View — IN PROGRESS

Worktree: `/Users/davidcruwys/dev/ad/apps/angeleye-wave3/` (branch: angeleye-wave3)
dnd-kit installed: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

| Unit                 | Status                     |
| -------------------- | -------------------------- |
| W01-workspace-api    | RUNNING (background agent) |
| W02-organiser-ui     | Pending                    |
| W03-drag-assign      | Pending                    |
| W04-folder-inference | Pending                    |

## W01 — What It Builds

Functions in angeleye-data.ts: readWorkspaces, writeWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace

Routes in server/src/routes/workspaces.ts:

- GET /api/workspaces
- POST /api/workspaces (body: { name })
- PATCH /api/workspaces/:id (body: { name?, tags? })
- DELETE /api/workspaces/:id → 204

10 tests in server/src/routes/workspaces.test.ts

## W02 Agent Prompt

Launch this after W01 is confirmed passing:

---

You are implementing W02-organiser-ui for AngelEye wave 3.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye-wave3/docs/planning/angeleye-wave3-organiser/AGENTS.md first.
Worktree: /Users/davidcruwys/dev/ad/apps/angeleye-wave3/

Replace stub at client/src/views/OrganiserView.tsx with functional Organiser.

Read first:

- client/src/views/ObserverView.tsx (patterns, styling)
- client/src/styles/index.css (CSS variables)
- shared/src/angeleye.ts (types)
- server/src/routes/workspaces.ts (API)
- server/src/routes/sessions.ts (PATCH for assignment)

Layout (two-column):

- Left: INBOX — sessions with workspace_id null, sorted by last_active desc
- Right: WORKSPACES — one card per workspace with its sessions inside
- Top: "ORGANISER" heading + "+ New Workspace" button (inline input on click)

Session card shows: project name (or name if set), idle time, status dot
Workspace card shows: workspace name, session count, session list

Click-to-assign: each inbox session has "→ Assign" button → dropdown of workspaces → PATCH /api/sessions/:id { workspace_id }
Create workspace: "+ New Workspace" → inline text input → POST /api/workspaces → update local state

Rules:

- All fetch must have .catch(() => {})
- Fetch on mount only, no polling
- Warm dark palette (bg-background, bg-surface, border-border, text-primary, font-bebas for headings)
- No Socket.io in OrganiserView

## Done when: view renders real data, create workspace works, click-to-assign works, typecheck + lint clean.

## W03 Agent Prompt

Launch after W02 confirmed:

---

You are implementing W03-drag-assign for AngelEye wave 3.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye-wave3/docs/planning/angeleye-wave3-organiser/AGENTS.md first.
Worktree: /Users/davidcruwys/dev/ad/apps/angeleye-wave3/

Add drag-to-assign to OrganiserView (dnd-kit already installed).
Read client/src/views/OrganiserView.tsx first.

Pattern:

- DraggableSession: useDraggable({ id: session.session_id }) from @dnd-kit/core
- DroppableZone: useDroppable({ id }) — id is workspace id OR 'inbox'
- DndContext wraps everything; handleDragEnd: PATCH /api/sessions/:id { workspace_id: targetId (null for inbox) }
- Optimistic state update immediately on drop
- Visual: isDragging → opacity-50; isOver → ring-1 ring-primary

## Done when: drag inbox→workspace, workspace→workspace, workspace→inbox all work. typecheck + lint clean.

## W04 Agent Prompt

Launch after W03 confirmed:

---

You are implementing W04-folder-inference for AngelEye wave 3.
Read AGENTS.md at /Users/davidcruwys/dev/ad/apps/angeleye-wave3/docs/planning/angeleye-wave3-organiser/AGENTS.md first.
Worktree: /Users/davidcruwys/dev/ad/apps/angeleye-wave3/

Add folder inference badge to inbox session cards.
Read client/src/views/OrganiserView.tsx first.

Logic: inferWorkspace(session, workspaces) — fuzzy match last 3 segments of session.project_dir against workspace names (case-insensitive substring match either direction).

Show badge if: match found AND 'inference:dismissed' not in session.tags.
Badge: "Looks like [WorkspaceName]?" with [✓] [✗] buttons (text-xs, subtle)
✓: PATCH session { workspace_id: ws.id }
✗: PATCH session { tags: [...session.tags, 'inference:dismissed'] }

## Done when: badge appears, confirm assigns, dismiss hides. typecheck + lint clean.

## Final Steps After W04

1. cd /Users/davidcruwys/dev/ad/apps/angeleye-wave3 && npm test (should be 160+ passing)
2. npm run typecheck && npm run lint
3. git add -A && git commit -m "feat: wave 3 — Organiser view with workspaces, drag-to-assign, folder inference"
4. git merge angeleye-wave3 --no-ff -m "merge: wave 3 organiser view"
5. git worktree remove ../angeleye-wave3
6. Update BACKLOG: B008 → Done, B009 → Done

## Key Technical Facts

Ports: Client 5050, Server 5051
Test isolation: \_setDataDir(tmpDir) resets paths + write queue
Response helpers: apiSuccess(res, data) and apiFailure(res, msg, code) — NOT apiError
Client reads: response.data.sessions[], response.data.workspaces[], response.data.events[]
Worktree: /Users/davidcruwys/dev/ad/apps/angeleye-wave3/

## Wave 4 Preview (after wave 3)

- B007: Transcript reader — scan ~/.claude/projects/, parse JSONL, backfill registry
- B010: /angeleye:context skill — assemble session history for Claude analysis

**Handover written**: 2026-03-15
