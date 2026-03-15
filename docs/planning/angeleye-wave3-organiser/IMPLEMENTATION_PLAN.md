# IMPLEMENTATION_PLAN.md — AngelEye Wave 3: Organiser View

**Goal**: Build the Organiser view — inbox of unassigned sessions, named workspaces, drag-to-assign, folder inference badge. Adds workspace CRUD API and all data service functions.
**Started**: 2026-03-15
**Target**: Fully functional Organiser view. Sessions can be named, assigned to workspaces, and dragged between them. Folder inference suggests workspaces from cwd. All new server code has tests.

## Summary

- Total: 4 | Complete: 0 | In Progress: 0 | Pending: 4 | Failed: 0

## Pending

- [~] W01-workspace-api — Workspace CRUD: readWorkspaces/writeWorkspaces/createWorkspace/updateWorkspace/deleteWorkspace in angeleye-data.ts; GET/POST /api/workspaces, PATCH/DELETE /api/workspaces/:id routes; full tests
- [ ] W02-organiser-ui — OrganiserView: fetch sessions + workspaces, inbox section (workspace_id: null), workspace cards section, create-workspace form, click-to-assign sessions (no drag yet)
- [ ] W03-drag-assign — dnd-kit DndContext: draggable session cards, droppable workspace zones + inbox, PATCH /api/sessions/:id on drop
- [ ] W04-folder-inference — Folder inference badge: if session cwd matches a known project pattern, show "Looks like X?" badge with confirm/dismiss — never auto-assign

## In Progress

## Complete

## Failed / Needs Retry

## Notes & Decisions

- Workspace data lives in ~/.claude/angeleye/workspaces.json (already initialised by initAngelEyeDirs)
- WorkspaceEntry type: { id: string, name: string, tags: string[], created_at: string }
- Session assignment: PATCH /api/sessions/:id with { workspace_id } — already exists from wave 2
- dnd-kit installed: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities in client workspace
- Build order: W01 → W02 → W03 → W04 (each depends on previous)
- W02 and W03 are split deliberately: get working UI first, add drag as enhancement
- Folder inference: suggestion only, never auto-assign. Show badge with "Looks like [project]?" + Confirm / Dismiss buttons. Dismissed inference stored in session tags as "inference:dismissed"
- Known project patterns: derive from cwd last 2 segments — match against existing workspace names (fuzzy, case-insensitive). No hardcoded list.
