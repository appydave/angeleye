# Project Backlog — AngelEye

**Last updated**: 2026-03-15
**Total**: 20 | Pending: 4 | In Progress: 0 | Done: 17 | Deferred: 2 | Rejected: 0

## Pending

- [x] B020 — v2-linen UI redesign: full light theme, floating cards, dark column header, amber accent | Completed: angeleye-wave7a-linen
- [x] B021 — Split angeleye-data.ts into registry/sessions/workspace/backfill services | Completed: angeleye-wave7b-datasplit
- [x] B012 — Ambient intelligence: rule-based session classification (is_junk, session_type, tool_pattern, first_edited_dir, first_real_prompt) | Completed: angeleye-wave8-intelligence
- [ ] B011 — /angeleye:publish skill (Nano Banana / FliDeck integration) | Priority: medium

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
- [x] B007 — Transcript reader: scan ~/.claude/projects/, parse existing JSONL sessions | Completed: angeleye-wave5-backfill
- [x] B010 — /angeleye:context skill (assemble session context block for Claude analysis) | Completed: angeleye-wave5-backfill

## Deferred

- [-] B013 — Paperclip / OpenClaw / stream-JSON adapter layer | Reason: future provider support; not wave 1
- [-] B014 — Supabase cold archive path | Reason: JSONL flat files sufficient for personal use; add if indexed search needed

## Rejected
