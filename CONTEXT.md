---
generated: 2026-04-05
generator: system-context
status: snapshot
sources:
  - CLAUDE.md
  - STEERING.md
  - package.json
  - shared/src/types.ts
  - shared/src/angeleye.ts
  - server/src/index.ts
  - server/src/routes/hooks.ts
  - server/src/services/registry.service.ts
  - server/src/services/classifier.service.ts
  - server/src/services/sync.service.ts
  - server/src/services/backfill.service.ts
  - server/src/services/correlator.service.ts
  - server/src/services/workflow-router.service.ts
  - server/src/services/workflow.service.ts
  - server/src/services/git-sync.service.ts
  - server/src/services/overlay.service.ts
  - client/src/App.tsx
  - client/src/components/AppShell.tsx
  - client/src/views/
  - client/src/components/
  - .mochaccino/samples/
  - docs/
regenerate: 'Run /system-context in the repo root'
---

# AngelEye — System Context

## Purpose

Real-time command centre for monitoring, classifying, and organising Claude Code sessions across concurrent projects — turning invisible JSONL transcript data into an operational dashboard that shows what work happened, how sessions relate, and where a multi-agent workflow currently stands.

## Core Abstractions

- **Session** — A single Claude Code conversation identified by `session_id`. Has lifecycle (`active`/`ended`), rule-based classification metadata (type, scale, tool pattern, 20+ boolean predicates), and an event history stored as JSONL. Lives as a `RegistryEntry` in `registry.json`. The session is the atomic unit everything else aggregates over.
- **Event** — An `AngelEyeEvent` normalized from one of 24 Claude Code hook event types or backfilled from JSONL transcripts. Each event captures timestamp, source (`hook`/`transcript`), event type, and type-specific payload (prompt text, tool summary, error, etc.). Events are append-only JSONL per session under `~/.claude/angeleye/sessions/`.
- **Classification** — A multi-tier enrichment pipeline that labels sessions without LLM calls. Tier 1 (deterministic counts/pattern matching), Tier 2 (regex/heuristic: voice dictation, brain writes, cross-session refs, closing ceremony). Assigns `SessionType` (BUILD/TEST/RESEARCH/KNOWLEDGE/OPS/ORIENTATION), `SessionScale`, `ToolPattern`, `SessionSubtype`, plus Phase 2c behavioural classifiers (`DelegationStyle`, `OpeningStyle`, `ClosingStyle`, `OutputType`, etc.). Tier 3 (LLM enrichment) is designed but not yet built.
- **Affinity Group** — Cross-session correlation that clusters related sessions into business units. Types: `story_unit` (deterministic, shared story ID), `epic_sprint`, `project_phase`, `ad_hoc` (temporal proximity heuristic). The correlator uses story-ID extraction (Signal 1) and temporal clustering (Signal 2) with type-guarded merge to prevent story units merging with ad-hoc clusters.
- **Workflow** — A factory production-line model. `WorkflowType` is a pure JSON config defining stations in sequence (e.g., BMAD Regular Story has 9 stations from WN through SHIP). `WorkflowInstance` tracks runtime state per work item (story). The workflow router seeds instances from registry data by parsing `trigger_command` + `workflow_action` + `workflow_role` to associate sessions with stations. Stations progress through `not_started` → `in_progress` → `completed`, with completion detected when all associated sessions have ended.

## Key Workflows

### Hook ingestion — live session monitoring

1. Claude Code fires a hook event (one of 24 types) via HTTP POST to `/hooks/:event`
2. The hooks router normalises the payload into an `AngelEyeEvent`, writes it to the session's JSONL file, and updates the registry entry (timestamp, project_dir)
3. On `stop` and `session_end` events, the classifier runs over all accumulated events and writes classification results (type, scale, predicates, overlay matches) back to the registry
4. The event is broadcast via Socket.io to all connected clients, which update the Observer view in real time

### Sync — bulk transcript backfill and reclassification

1. User triggers `POST /api/sync` (optionally with `?force=true` to reclassify already-typed sessions)
2. The backfill service scans `~/.claude/projects/*/` for JSONL transcript files, extracting events from entries that aren't yet in the registry (custom-title extraction, skill-prompt parsing from XML tags)
3. Every session is then classified (or reclassified if forced), and the correlator runs to discover/update affinity groups
4. A `SyncResult` is returned with before/after type counts, per-project breakdown, and field-level diffs

### Workflow seeding — associating sessions with production-line stations

1. User triggers `POST /api/workflows/seed` (or dry-run variant)
2. The workflow router reads all registry entries, filters to BMAD sessions (`trigger_command` starts with `bmad`), parses `workflow_action` to extract action code + story ID
3. Sessions are grouped by story ID; for each group, the router finds or creates a `WorkflowInstance`, then associates sessions with the correct station by matching `role:actionCode` against the station map
4. Station states are updated (in_progress/completed), workflow status is derived, and results are written to `workflows.json`

### Dashboard operation — daily use

1. User opens the React client; the AppShell renders Header + Sidebar + ContentPanel with view routing via NavContext
2. **Observer** view shows live sessions with real-time Socket.io updates. **Organiser** view allows workspace assignment and session annotation. **Workflows** view shows pipeline visualisation with station progress. **Inspector** view provides schema and data inspection.
3. Mochaccino mockups (HTML in `.mochaccino/designs/`) fetch from `/api/mock-views/*` endpoints with automatic sample-data fallback from `.mochaccino/samples/`

## Design Decisions

- **Observer-only architecture**: AngelEye receives POST events from Claude Code's hook system but never controls or modifies sessions. A `stop_hook_active` guard in the hooks router prevents infinite loops when AngelEye's own session fires hooks.
  - _Alternative considered_: Bidirectional control (sending commands back to Claude Code)
  - _Why rejected_: Hook system is fire-and-forget by design; adding control would require session injection, which doesn't exist in the Claude Code API

- **Flat-file storage, not a database**: All state lives in JSON/JSONL under `~/.claude/angeleye/`. Registry writes use a serial promise queue (`writeQueue`) with atomic temp-file-then-rename to handle concurrent hook events safely.
  - _Alternative considered_: SQLite or Postgres
  - _Why rejected_: Local dev tool with ~1000 sessions; file-based storage is zero-dependency, human-readable, and trivially inspectable. The serial queue handles the only concurrency risk (simultaneous hook POSTs).

- **Tier 1+2 classification without LLM**: All current classification is deterministic (pattern matching, counts, regex). This keeps classification instant, free, and reproducible.
  - _Alternative considered_: LLM-first classification from the start
  - _Why rejected_: Cost and latency for 1000+ sessions; deterministic rules cover ~70% of classification needs. Tier 3 LLM enrichment is planned for the remaining 22 items that require semantic understanding.

- **Domain overlays as pluggable JSON configs**: Workflow role/identity/action detection uses JSON config files (`server/src/config/overlays/`), not hardcoded logic. Currently ships with BMAD v6 overlay. Station definitions are also pure JSON in `server/src/config/workflows/`.
  - _Alternative considered_: Hardcoded role mapping per domain
  - _Why rejected_: BMAD isn't the only workflow — the overlay pattern allows adding new domains without code changes

- **Session scale gates classification accuracy**: Micro/light sessions are demoted from BUILD to ORIENTATION because scale (based on tool call count) is the strongest predictor of classification accuracy. A 3-event session classified as BUILD is almost always wrong.
  - _Alternative considered_: Classify all sessions equally regardless of size
  - _Why rejected_: Validated against 924-session analysis campaign — small sessions consistently misclassified without scale gating

## Non-obvious Constraints

- **Hook events must always return `{ continue: true }`**: Even on errors, the hooks endpoint returns 200 with `continue: true`. Returning an error or non-200 would block Claude Code's hook pipeline and potentially hang the session. The entire hooks handler is wrapped in a try/catch that swallows errors for this reason.
- **Rate limiting excludes `/hooks/*`**: Hooks are internal machine events that can fire in rapid bursts (especially `pre_tool_use` and `tool_use` pairs). Rate limiting would silently drop events. Only `/api/*` routes are rate-limited.
- **Backfill skill-prompt extraction is fragile**: When Claude Code expands a skill (e.g., `/bmad-sm WN`), the JSONL records XML like `<command-name>bmad-sm</command-name><command-args>WN</command-args>`. The backfill's original `content.startsWith('<')` filter was discarding all skill-triggered prompts. The `extractSkillPrompt()` regex parser is the fix — if Claude Code changes its XML format, backfill breaks silently.
- **Registry concurrent writes rely on the serial promise queue**: There is no file lock. The `writeQueue` serialises writes within a single Node process, but if two AngelEye instances pointed at the same data directory, they would corrupt `registry.json`. This is acceptable because AngelEye is a local single-instance tool.
- **`progress` entries dominate JSONL transcripts**: ~75% of entries in hook-heavy sessions are `progress` type. Parsers that iterate all lines without filtering will be slow. The backfill service already skips these.
- **Git sync operates on the AngelEye repo itself**: The git-sync service uses a promise-chain mutex (`withGitLock`) to prevent concurrent `git fetch` / `git pull` races. It derives state (clean/dirty/behind/ahead/diverged) from the repo containing AngelEye's own source code — not the monitored projects.
- **Workflow router only handles `regular_story` type**: The seed function hardcodes `getWorkflowType('regular_story')`. Epic Zero and other workflow types exist as configs but have no routing logic yet.

## Expert Mental Model

- **AngelEye is a read-side projection, not a write-side system**: The system consumes events and builds increasingly rich views (registry → classification → affinity groups → workflows). It never generates events or controls sessions. Every piece of state can be rebuilt from the raw JSONL event files by running sync. If the registry gets corrupted, `POST /api/sync?force=true` regenerates everything from transcripts.
- **Classification is layered, not monolithic**: Think of Tier 1 (counts), Tier 2 (patterns), and domain overlays as independent passes that each add fields to the same `RegistryEntry`. They can run in any order and are idempotent. Adding a new classifier means adding a new function that reads events and writes fields — the pipeline doesn't need restructuring.
- **The factory metaphor is the key to workflow understanding**: Sessions aren't "steps in a process" — they're workers arriving at stations on a production line. Multiple sessions can work the same station (retries, backtracks). A station is "completed" when all its sessions have ended, not when one session succeeds. The workflow is "closed" when either the final station has sessions or substantial coverage is reached — it doesn't require every station to be visited.
- **Affinity groups and workflows solve different problems**: Affinity groups are bottom-up discovery ("these sessions seem related based on shared story IDs or temporal proximity"). Workflows are top-down structure ("this story should pass through these 9 stations in order"). A session can belong to an affinity group AND be routed to a workflow station — the two systems complement, not compete.
- **The mochaccino layer is a design sandbox**: `.mochaccino/` contains standalone HTML mockups that hit the same API endpoints as the React client. They exist for rapid UI prototyping without touching the React build pipeline. The generic catch-all at `/api/mock-views/:name` serves any JSON file from `.mochaccino/samples/` — no server code needed for new mockups.

## Scope Limits

- Does NOT execute Claude Code sessions — observes and classifies only. The observer-only architecture is a fundamental design constraint, not a missing feature.
- Does NOT have LLM enrichment yet — 22 of 58 defined classification items require Tier 3 (semantic understanding). The infrastructure (API client, enrichment queue, batch processing) is designed but not implemented.
- Does NOT aggregate across machines — registry and event files are local to `~/.claude/angeleye/` on the current machine. Multi-machine sync (B044) is a backlog item.
- Does NOT have authentication — local dev tool running on localhost, trusts all incoming requests. Not designed for multi-user or networked deployment.
- Does NOT replace Claude Code's built-in `/insights` — captures a different dimension (work-type classification, cross-session correlation, workflow tracking vs. token usage and cost).
- Does NOT handle non-BMAD workflows yet — the workflow router only seeds `regular_story` instances. Epic Zero configs exist but have no routing logic. Non-BMAD domains would need new overlay configs and router extensions.

## Failure Modes

- **Silent event loss from hook errors**: If the hooks endpoint throws after writing the event but before updating the registry, the event exists in the session JSONL but the registry entry may have stale `last_active` or missing classification. Running `POST /api/sync?force=true` heals this by re-reading all events and reclassifying.
- **Registry corruption from process crash during write**: The atomic temp-file-then-rename pattern protects against partial writes, but if the process crashes between writing the temp file and the rename, a `.tmp` file is left orphaned. The registry itself remains intact (last successful write). The orphaned `.tmp` file is harmless but never cleaned up automatically.
- **Backfill misses sessions when JSONL format changes**: The backfill parser expects specific JSONL entry structures (e.g., `type: 'custom-title'`, `<command-name>` XML tags). If Claude Code changes these formats, new sessions are silently skipped. The `repaired` counter in `BackfillResult` only counts event-file repairs, not format mismatches.
- **Correlator over-merging via union-find bridges**: Before the type guard fix, story_unit groups were being merged with ad_hoc temporal clusters when sessions appeared in both signals. The fix prevents cross-type merges, but if a new signal type is added without a type guard, the same over-merging can recur.
- **Workflow router produces `unroutable` sessions without clear user notification**: Sessions missing `workflow_action`, `workflow_role`, or a matching station config are counted in `unroutable_reasons` in the seed result, but there's no UI surface for reviewing these. The only way to see them is by inspecting the API response to `POST /api/workflows/seed`.
- **Git sync mutex doesn't prevent Overmind restart races**: If the server restarts (via Overmind) while a git operation is in progress, the promise-chain mutex is lost. A concurrent `git fetch` from a new process and the dying process's `git pull` can interleave. In practice this is rare because git operations are fast, but it can produce confusing error messages.
