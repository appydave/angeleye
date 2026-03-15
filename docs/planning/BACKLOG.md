# Project Backlog — AngelEye

**Last updated**: 2026-03-15
**Total**: 15 | Pending: 2 | In Progress: 0 | Done: 13 | Deferred: 4 | Rejected: 0

## Pending

- [ ] B007 — Transcript reader: scan ~/.claude/projects/, parse existing JSONL sessions | Priority: medium
- [ ] B010 — /angeleye:context skill (assemble session context block for Claude analysis) | Priority: medium

## In Progress

## Done

- [x] B001 — Shared AngelEye types (AngelEyeEvent, RegistryEntry, WorkspaceEntry) | Completed: angeleye-wave-1
- [x] B002 — AngelEye data service (JSONL write, registry, archive) | Completed: angeleye-wave-1
- [x] B003 — Hook endpoint POST /hooks/:event | Completed: angeleye-wave-1
- [x] B004 — Sessions API (GET /api/sessions, GET /api/sessions/:id/events) | Completed: angeleye-wave-1
- [x] B005 — Observer view: live activity feed via Socket.io | Completed: angeleye-wave-1
- [x] B006 — /angeleye:install skill + /angeleye:name-session skill | Completed: angeleye-wave-1
- [x] B008 — Organiser view: inbox + named workspaces + drag-to-assign | Completed: angeleye-wave-3
- [x] B009 — PATCH /api/sessions/:id endpoint (server-side for name-session skill) | Completed: angeleye-wave2-hardening
- [x] B015 — Test coverage: angeleye-data.ts unit tests with real tmpdir | Completed: angeleye-wave2-hardening
- [x] B016 — Test coverage: hooks.ts route tests (stop guard, tool summarisation, lifecycle) | Completed: angeleye-wave2-hardening
- [x] B017 — Test coverage: sessions.ts route tests | Completed: angeleye-wave2-hardening
- [x] B018 — Fix stale App.test.tsx (DemoPage test IDs removed, AppShell assertions added) | Completed: angeleye-wave2-hardening
- [x] B019 — Workspace CRUD API (GET/POST/PATCH/DELETE /api/workspaces) + 10 tests | Completed: angeleye-wave-3

## Deferred

- [-] B011 — /angeleye:publish skill (Nano Banana / FliDeck integration) | Reason: depends on context skill; wave 3+
- [-] B012 — Ambient intelligence / skill suggester (prompt frequency pattern miner) | Reason: needs data archive first; wave 3+
- [-] B013 — Paperclip / OpenClaw / stream-JSON adapter layer | Reason: future provider support; not wave 1
- [-] B014 — Supabase cold archive path | Reason: JSONL flat files sufficient for personal use; add if indexed search needed

## Rejected
