# Project Backlog — AngelEye

**Last updated**: 2026-03-29
**Total**: 64 | Pending: 13 | In Progress: 4 | Done: 49 | Deferred: 2 | Rejected: 0

## Pending

- [ ] B011 — /angeleye:publish skill (Nano Banana / FliDeck integration) | Priority: medium
- [ ] B050 — Extract git-sync + feedback-pipeline as AppyStack recipes | Priority: low

### Infrastructure

- [ ] B025 — launchd plist for AngelEye server: always-on persistent service, auto-restart on crash/reboot | Priority: medium
- [ ] B026 — Update create-appystack template with: resilient start.sh (port conflict detection + human-in-loop), dotenv override:true fix, correct VITE_SOCKET_URL | Priority: medium
- [ ] B044 — Multi-machine registry sync: classification rules should apply across machines. M4 Pro registry defaults everything to BUILD. | Priority: low

### Phase 2b — Inspector Screens + Project Registry

- [ ] B057 — Project registry config loader (static JSON in server/src/config/projects/) | Priority: high
- [ ] B058 — Schema inspector screen (renders type definitions + config JSON from real code) | Priority: high
- [ ] B059 — Data inspector screen (browse live registry entries, workflows, affinity groups) | Priority: high
- [ ] B063 — Add `project_dir` field to WorkflowInstance shared type | Priority: medium

### Phase 2c — Deterministic Classifier Extensions

- [ ] B060 — Deterministic classifier extensions (~8 new fields: delegation_style, initiation_source, session_continuity, opening_style, closing_style, autonomy_ratio, session_liveness, output_type) | Priority: high
- [ ] B061 — Top-20 session subtype rules (~60% coverage) | Priority: high
- [ ] B062 — Re-enrich button in Settings (re-run classifier on last N sessions) | Priority: medium

### Phase 4 — LLM Enrichment

- [ ] B064 — Tier 3 LLM batch enrichment runner (see docs/planning/tier3-batch-enrichment-brief.md) | Priority: low

## In Progress

- [~] B056a — Extract campaign-dashboard.json from static HTML | Campaign: angeleye-workflow-phase2a
- [~] B056b — Extract campaign-infographic.json from static HTML | Campaign: angeleye-workflow-phase2a
- [~] B056c — Hybrid campaign dashboard mockup (live/mock overlay) | Campaign: angeleye-workflow-phase2a
- [~] B056d — Hybrid campaign infographic mockup (live/mock overlay) | Campaign: angeleye-workflow-phase2a

## Done

- [x] B051 — Workflow type config loader: read bmad-\*.json from server/src/config/workflows/ | Completed: angeleye-workflow-phase1
- [x] B052 — Workflow instance CRUD: workflows.json storage with atomic writes | Completed: angeleye-workflow-phase1
- [x] B053 — Workflow API endpoints: GET/POST /api/workflows, GET /api/workflow-types | Completed: angeleye-workflow-phase1
- [x] B054 — Workflows list view: new nav item + static list from API | Completed: angeleye-workflow-phase1
- [x] B055 — Mock-views workflow endpoint: GET /api/mock-views/workflows with sample fallback | Completed: angeleye-workflow-phase1
- [x] B045 — Git sync: status polling + pull endpoint + header pill + modal | Completed: angeleye-wave12-network-sync
- [x] B046 — Git sync: server restart coordination (Overmind-aware) | Completed: angeleye-wave12-network-sync
- [x] B047 — Git sync: `GIT_SYNC_POLL_MS` env var configuration | Completed: angeleye-wave12-network-sync
- [x] B048 — Angel skill: field-test evaluate + summary + audit + handoff modes | Completed: angeleye-wave12-network-sync
- [x] B049 — Angel feedback: first real feedback cycle end-to-end | Completed: angeleye-wave12-network-sync
- [x] B038 — Scale-aware BUILD guard: micro/light sessions demoted from BUILD | Completed: commit 3f593607
- [x] B039 — Iron-clad classifier rules (\*run NNN, brains/ + light, zero tool calls) | Completed: commit 3f593607
- [x] B040 — PII detection pass: regex scan for emails, IPs, API keys, birthdates | Completed: commit 9b692fae
- [x] B041 — Paperclip/autonomous agent detection | Completed: commit 3f593607
- [x] B042 — Voice dictation entity dictionary (220+ misheard terms) | Completed: commit 9b692fae
- [x] B043 — Promote confirmed subtypes to canonical taxonomy (26 subtypes) | Completed: commit 9b692fae
- [x] B023 — Paginate session list: cursor-based API + virtual scrolling | Completed: commit 9b692fae
- [x] B037 — Named session elevated row treatment | Completed: commit 9b692fae
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
