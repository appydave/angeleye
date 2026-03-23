# Project Backlog — AngelEye

**Last updated**: 2026-03-23
**Total**: 44 | Pending: 11 | In Progress: 0 | Done: 31 | Deferred: 2 | Rejected: 0

## Pending

- [ ] B011 — /angeleye:publish skill (Nano Banana / FliDeck integration) | Priority: medium

### Observer — Session list pagination

- [ ] B023 — Paginate session list: cursor-based API (`GET /api/sessions?after=<id>&limit=50`), virtual scrolling on client. Currently 690+ sessions loaded at once — will degrade at 2000+. | Priority: medium

### Observer — Named session row design

- [ ] B037 — Named session elevated row treatment: amber left rail, name as flex-1 hero (no 140px cap), project+cwd on secondary dim line, ⚑ named micro-tag. Observer currently truncates long names like "solo-deck-flideck-slide-system" to fit the fixed column. Mockup designed 2026-03-17. | Priority: medium

### Intelligence — Classifier improvements (from angeleye-analysis-1)

- [ ] B038 — Scale-aware BUILD guard: reject BUILD classification for micro (0% accuracy) and light (<15% accuracy) sessions. Use event_count thresholds from the 910-session analysis. | Priority: high
- [ ] B039 — Iron-clad classifier rules: (a) `*run NNN` first prompt = operations.poem_execution, (b) brains/ CWD + light scale = never BUILD, (c) zero tool calls = never BUILD. | Priority: high
- [ ] B040 — PII detection pass: regex scan during backfill for names, emails, IPs, birthdates. Flag sessions with PII in registry. 14 waves of evidence says this is needed. | Priority: medium
- [ ] B041 — Paperclip/autonomous agent detection: identify machine-initiated sessions by prompt fingerprint ("You are agent {uuid}"). Classify as operations.paperclip_agent, not BUILD. | Priority: medium
- [ ] B042 — Voice dictation entity dictionary: canonical lookup of 220+ misheard terms (e.g. "AngelLie"=AngelEye, "nvideo nemoclaw"=NVIDIA NemoClaw). Pre-process prompts before classification. | Priority: low
- [ ] B043 — Promote confirmed subtypes (N >= 3) from 500+ candidates to canonical taxonomy. Analysis complete — needs curation pass. | Priority: medium

### Infrastructure

- [ ] B025 — launchd plist for AngelEye server: always-on persistent service, auto-restart on crash/reboot | Priority: medium
- [ ] B026 — Update create-appystack template with: resilient start.sh (port conflict detection + human-in-loop), dotenv override:true fix, correct VITE_SOCKET_URL | Priority: medium
- [ ] B044 — Multi-machine registry sync: classification rules should apply across machines. M4 Pro registry defaults everything to BUILD. | Priority: low

## In Progress

## Done

- [x] B022 — Expand prompt row on click in focus panel + first_real_prompt tooltip on session row | Completed: angeleye-b022-prompt-expand
- [x] B032 — Unified Sync button replacing backfill + classify | Completed: angeleye-wave10-settings-intelligence
- [x] B033 — Delta tracking: last-sync.json + status line in Settings | Completed: angeleye-wave10-settings-intelligence
- [x] B034 — Classification breakdown panel in Settings | Completed: angeleye-wave10-settings-intelligence
- [x] B035 — Session type legend in Observer (tooltips + ⓘ panel) | Completed: angeleye-wave10-settings-intelligence
- [x] B036 — Backfill extracts /rename names from custom-title JSONL | Completed: angeleye-wave10-settings-intelligence
- [x] B020 — v2-linen UI redesign | Completed: angeleye-wave7a-linen
- [x] B021 — Split angeleye-data.ts into registry/sessions/workspace/backfill services | Completed: angeleye-wave7b-datasplit
- [x] B012 — Ambient intelligence: rule-based session classification | Completed: angeleye-wave8-intelligence
- [x] B027 — Workspace badge on Observer session rows | Completed: angeleye-b027-workspace-badge
- [x] B024 — Replace HTTP hooks with `curl ... || true` command hooks | Completed: angeleye-wave9-bookmarks
- [x] B028 — Star/bookmark: ★ toggle, note field, All|Starred|Named filter, copy-resume (UUID) | Completed: angeleye-wave9-bookmarks
- [x] B029 — Named session filter + inline rename with full JSONL write-back | Completed: angeleye-wave9-bookmarks
- [x] B030 — Investigate Claude Code session name storage (`custom-title` + `agent-name` in JSONL) | Completed: angeleye-wave9-bookmarks
- [x] B031 — Auto-run backfill on server start | Completed: angeleye-wave9-bookmarks
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
