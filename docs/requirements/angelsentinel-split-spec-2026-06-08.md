---
id: req-2026-06-08-angelsentinel-split
title: Split AngelEye into AngelSentinel (collector) + AngelEye (control plane)
category: ingestion
status: open
created_at: 2026-06-08T06:40:00+07:00
evidence_sources:
  - ~/dev/ad/apps/angeleye (full codebase map)
  - ~/dev/ad/apps/appysentinel (Sentinel pattern reference)
  - dark-factory memory: appystack-vs-sentinel, watchtower-sentinel-bus-direction, tool-usage-telemetry-for-self-evolution
requested_by: marshall (via watchtower-engine q-20260608-angelsentinel-spec)
---

> **Scope of this document.** This is a _design spec for Ralphy to build later_ — it does NOT implement anything. The research behind it was **read-only**: no AngelEye code was modified; the only write is this file. Claims are tagged `verified(path)` / `inference` / `unknown`. Paths are relative to each app's repo root unless absolute.

---

## 0. TL;DR — the headline split

AngelEye today is one Express+React monorepo that does **two jobs in one process**: it _collects_ Claude Code telemetry (hook ingestion, transcript reading, classification of liveness/session-class) **and** it _visualises_ it (React dashboard + query/CRUD API). The Sentinel pattern (from `appysentinel`) says these are two products: an always-on headless **collector** that never runs `claude`, and a separate **viewer/control plane**.

**The split:**

| New product                  | Role                                                                                                                                                 | What it owns                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AngelSentinel**            | Always-on collector. Never runs `claude`. Ingests hooks, reads sessions, owns the data store, exposes liveness + a read API + a real-time event bus. | hook ingestion endpoints, session/transcript readers, collectors, registry store (sole writer), liveness API, Socket.io event broadcast, **tool-usage telemetry** |
| **AngelEye** (Control Plane) | The dashboard. Visualisation + organisation + workflow viz. Reads from AngelSentinel; runs classification/enrichment on top.                         | React client, viz/query/CRUD API, classifier, correlator, workflow + workspace + enrichment services, mock-views                                                  |

**Approximate file count (server/src + shared, the contended code):**

- **→ AngelSentinel:** ~9 server modules (3 routes + 6 services) + Socket.io broadcast + the wire-format slice of `shared/`. verified(`server/src/routes/hooks.ts`, `health.ts`, `diagnostics.ts`; `server/src/services/registry.service.ts`, `sessions.service.ts`, `backfill.service.ts`, `teammate-detection.service.ts`, `subprocess-detection.service.ts`, `session-class.service.ts`, `schema-auditor.service.ts`)
- **→ AngelEye Control Plane:** all of `client/` + ~12 server routes + ~16 services + all `config/overlays|workflows|projects`. verified(see §3)

Rough tally of the _server_ split: **~10 modules → Sentinel, ~28 modules → Control Plane** (client is wholly Control Plane). inference(counts derived from the file map in §2–§3)

---

## 1. What a "Sentinel" is (pattern characterisation)

Source of truth: `~/dev/ad/apps/appysentinel`.

A **Sentinel** is a _per-machine, always-on, headless observer process_ that collects data from local (and remote-via-SSH) sources, normalises each record into a common **Signal envelope**, exposes it through a small Access zone (REST / CLI / MCP), and pushes it onward. It carries **no dashboard** — visualisation ("Viewers") is a strictly separate concern. verified(`~/dev/ad/apps/appysentinel/README.md` L3 "Per-machine, observer-only local data coordinator boilerplate")

Trait check against AngelEye's needs:

| Sentinel trait               | appysentinel evidence                                                                                                                  | AngelEye fit                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Always-on observer/collector | `packages/template/scripts/install-service.sh` (launchd/systemd) — verified                                                            | AngelEye's ingest is already an always-listening HTTP endpoint; just needs daemonising                                                 |
| Ingests events               | Signal envelope `id/ts/source/machine/kind/name/severity/attributes/payload` — verified(`docs/appysentinel-spec.md §6`)                | AngelEye's `AngelEyeEvent` is the same shape, Claude-Code-specialised — verified(`shared/src/angeleye.ts`)                             |
| Never runs `claude`          | running Sentinel process never spawns claude; scaffold CLI calls `claude -p` once at install only — verified(`CONTEXT.md §5`)          | AngelEye ingest never runs claude today; the **enrichment loop** is the only LLM path, and it lives Control-Plane-side — keep it there |
| Pub/sub                      | `SignalBus` baked primitive (`packages/core/src/bus.ts`) — verified                                                                    | AngelEye has Socket.io broadcast in `index.ts` — same role; Sentinel inherits it                                                       |
| Replay log                   | NOT a baked primitive; achieved via `jsonl-store` recipe (append-only JSONL, replayable) — inference(`docs/appysentinel-spec.md §7.2`) | AngelEye already appends per-session JSONL — verified(`sessions.service.ts writeEvent`). This _is_ the replay log.                     |

**Key correction to dark-factory memory `watchtower-sentinel-bus-direction`:** the phrase "SSE pub/sub + replay log" describes an _intended_ design, not a baked appysentinel primitive. In appysentinel, external SSE is explicitly a _Viewer_ concern, not part of the Sentinel's Access zone. inference(`docs/appysentinel-spec.md §7.2`). **For AngelSentinel we override that default**: because AngelEye's live dashboard needs a push channel and one already exists (Socket.io), AngelSentinel keeps the realtime broadcast. The replay log = the existing append-only per-session JSONL.

> **Decision point for David:** AngelSentinel could be (a) rebuilt _on top of_ the appysentinel boilerplate (adopt `createSentinel()` + Signal envelope + recipes), or (b) carved out of the existing AngelEye code as a standalone Node process that keeps the current `AngelEyeEvent`/registry shapes. **Recommendation: (b) for v1** — least risk, keeps the proven classification stack intact — then converge the envelope toward appysentinel's Signal shape in a v2. unknown(which path David wants — flagged, not decided here)

---

## 2. AngelSentinel — what moves here (the collector half)

Everything in this section is currently inside `~/dev/ad/apps/angeleye/server/` and `shared/` and would relocate to a new `~/dev/ad/apps/angelsentinel/` (or a `packages/sentinel` workspace — see §6).

### 2.1 Hook ingestion endpoints

- `server/src/routes/hooks.ts` — **the primary Sentinel endpoint.** `POST /hooks/:event` receives all 30 Claude Code hook event types, normalises into `AngelEyeEvent`, writes JSONL, updates the registry, triggers session-class resolution on `stop`/`session_end`, and broadcasts via Socket.io. Also `GET /api/hooks/supported` (install-skill discovery). verified(`server/src/routes/hooks.ts`)
  - ⚠️ **Refactor required (see §5-A):** this file is ~385 lines doing routing + a session state machine + detector calls + registry writes + broadcast. The HTTP handler must become a thin wrapper over an extracted `ingest.service.ts`.

### 2.2 Liveness API

- `server/src/routes/health.ts` — `GET /health` liveness. AngelSentinel must own this; it is the process the constellation preflight (`constellation-status.sh`) and the watchtower reaper key off. verified(`server/src/routes/health.ts`; dark-factory memory `constellation-preflight-marshall-not-blind`)
- `server/src/routes/diagnostics.ts` — `GET /api/diagnostics` (registry health counts, subagent stats, orphan counts). Ingestion-health observability → Sentinel. verified(`server/src/routes/diagnostics.ts`)

### 2.3 Session readers / collectors

- `server/src/services/backfill.service.ts` — scans `~/.claude/projects/*/` for Claude Code JSONL transcripts and imports new sessions. Includes `extractCustomTitle` + `extractSkillPrompt` (XML parse of `/command` expansions). verified
- `server/src/services/teammate-detection.service.ts` — reads raw JSONL first lines for `<teammate-message teammate_id="…">` (Mechanism B subagent detection). verified
- `server/src/services/subprocess-detection.service.ts` — detects Mechanism C headless skill subprocesses from event-count + prompt heuristics. verified
- `server/src/services/session-class.service.ts` — derives `SessionClass` (`dialog`/`agent_run`/`machine_signal`/`subagent_leg`), incl. Paperclip/ALS-delamain cwd regexes + canonical project naming. verified
- `server/src/services/schema-auditor.service.ts` — non-blocking schema-surprise observation → `schema-observations.jsonl`. Runs on every hook event. verified

> **Boundary call:** `session-class` and `teammate/subprocess` detection are _structural_ facts about a session (what kind of process produced it), derived from the raw transcript — not interpretive classification. They belong with the collector. The _semantic_ classifier (BUILD/TEST/RESEARCH…) stays Control-Plane. inference

### 2.4 The data store (sole writer)

- `server/src/services/registry.service.ts` — the core store. `readRegistry`/`updateRegistry` with a serial write queue + atomic rename; all path helpers; `initAngelEyeDirs` on startup. Data root `~/.claude/angeleye/`. verified
- `server/src/services/sessions.service.ts` — `writeEvent` (append JSONL = the replay log), `getSessionEvents`, `writeSessionName` (writes back into Claude Code's own JSONL), `archiveSession`, `backupUpstreamJSONL`, `getRawTranscript`. verified

> **CRITICAL INVARIANT — single writer.** Today the serial write queue in `registry.service.ts` only protects _within one Node process_. After the split, **AngelSentinel is the SOLE writer** of `~/.claude/angeleye/registry.json` and the JSONL store. AngelEye Control Plane must NOT write the registry directly — it reads via AngelSentinel's API (or, for the classifier/enrichment which _do_ mutate rows, via a dedicated AngelSentinel write endpoint — see §4). Two processes writing the same file = corruption. verified(`registry.service.ts` write-queue is process-local; cross-process race is real — agent inference confirmed)

### 2.5 Realtime bus

- Socket.io server (currently created in `server/src/index.ts`, injected via `createHooksRouter(io)`) → moves to AngelSentinel, because the Sentinel is what receives hook events. The AngelEye client connects to **AngelSentinel's** socket for the live feed (`angeleye:event`, `angeleye:registry`). verified(`server/src/index.ts`; `shared/src/types.ts` ServerToClientEvents)

### 2.6 Shared types AngelSentinel needs

From `shared/src/angeleye.ts`: `AngelEyeEvent`, `AngelEyeEventType` (30 event names), `RegistryEntry`, `SessionClass`, `Registry`, `SessionLiveness`. From `shared/src/constants.ts`: `ANGELEYE_EVENTS`, `SOCKET_EVENTS`. From `shared/src/types.ts`: the Socket.io contracts. verified(`shared/src/*`)

---

## 3. AngelEye Control Plane — what stays (the viewer half)

### 3.1 The whole client

- All of `client/` — React 19 + Vite 7 + Tailwind v4. Views: `ObserverView`, `OrganiserView`, `WorkflowsView`, `WorkflowDetailView`, `InspectorView`, `SettingsView`, `CampaignDashboardView`, `CampaignInfographicView`, `MockupsView`, `DiagnosticsView`. verified(`client/src/components/views/*`)
  - The client's Socket.io connection (`useSocket.ts`) re-points from the old server to **AngelSentinel's** socket URL. verified(`client/src/hooks/useSocket.ts`)
  - `useServerStatus.ts` polls `/health` + `/api/info` → must poll AngelSentinel's `/health`. verified

### 3.2 Viz / query / CRUD API (stays in an AngelEye server)

`server/src/routes/`: `sessions.ts` (rich filters + PATCH name/tags/workspace/note + raw-transcript + enrich), `workspaces.ts`, `workflows.ts`, `affinity.ts`, `stats.ts`, `sync.ts`, `backfill.ts` (the _trigger_ endpoint; the collector logic moves — see §5-C), `inspector.ts`, `mock-views.ts`, `preferences.ts`, `projects.ts`, `git-sync.ts`, `info.ts`. verified

### 3.3 Interpretive services (stay)

`server/src/services/`: `classifier.service.ts` (BUILD/TEST/RESEARCH/… — pure rules, no LLM), `sync.service.ts`, `correlator.service.ts` (affinity groups), `workflow.service.ts`, `workflow-router.service.ts`, `workflow-type.service.ts`, `overlay.service.ts`, `enrichment.service.ts` (the only LLM path; per-session sidecars), `workspace.service.ts`, `project-config.service.ts`, `preferences.service.ts`, `git-sync.service.ts`, `mock-views.service.ts`, `sample-data.service.ts`, `voice-dictionary.ts`. verified

- Config: `server/src/config/overlays/`, `config/workflows/`, `config/projects/`. verified

### 3.4 Shared types AngelEye-only

`WorkflowInstance`, `WorkflowType`, `StationConfig/Instance`, `AffinityGroup`, `DomainOverlay`, `EnrichmentPass`, `ProjectConfig`, `DiagnosticsResponse`, all of `git-sync.ts`. verified(`shared/src/*`)

---

## 4. How the two halves communicate

```
Claude Code hooks ──POST /hooks/:event──▶ ┌─────────────────────────────┐
~/.claude/projects/*.jsonl ──read──────▶  │       ANGELSENTINEL         │
                                          │ (always-on, headless,       │
                                          │  SOLE writer of the store)  │
                                          │                             │
                                          │  • registry.json (write)    │
                                          │  • per-session JSONL (write)│
                                          │  • /health, /api/diagnostics│
                                          │  • GET read API (registry,  │
                                          │    sessions, events)        │
                                          │  • Socket.io broadcast      │
                                          │  • tool-usage telemetry     │
                                          └───────┬──────────────┬──────┘
                                       Socket.io  │   REST (read) │  REST (write-on-behalf)
                                        live feed  │   + replay    │  e.g. PATCH tags after classify
                                                   ▼               ▼
                                          ┌─────────────────────────────┐
                                          │     ANGELEYE CONTROL PLANE  │
                                          │  • React dashboard          │
                                          │  • classifier / correlator  │
                                          │  • workflows / workspaces   │
                                          │  • enrichment (LLM)         │
                                          └─────────────────────────────┘
```

**Contract options (recommend C1):**

- **C1 — REST + Socket.io (recommended).** AngelSentinel exposes `GET /api/registry`, `GET /api/sessions`, `GET /api/sessions/:id/events`, plus a guarded write surface (`PATCH /api/sessions/:id` for classifier/enrichment/UI-edit results) so the Control Plane never touches files. Realtime via existing Socket.io. Clean process boundary, survives either side restarting. inference
- **C2 — shared filesystem, Sentinel-only writes.** Control Plane reads `~/.claude/angeleye/*` directly (read-only), writes go through a narrow Sentinel endpoint. Lower latency, but couples both to the on-disk schema and risks an accidental Control-Plane write. inference
- **C3 — appysentinel Access zone.** If we adopt the boilerplate (path (a) in §1), the contract becomes appysentinel's `api-binding` + `mcp-binding` Access recipes. Most future-aligned, most work. inference

> The mutation question (classifier/enrichment/UI edits _change_ registry rows) is the crux: with a single-writer Sentinel, those mutations must be **sent to** AngelSentinel, not written by the Control Plane. C1's guarded write endpoint is the clean answer. verified(single-writer invariant, §2.4)

---

## 5. Daemonisation — AngelSentinel needs a real production start

**Current state — there is NO production serve for the collector.** verified:

- Dev: `npm run dev` → `concurrently` runs Vite client + tsx server (ports 5050/5051). verified(`package.json`)
- Persistent-dev: `scripts/start.sh` → Overmind reads `Procfile` (`client` + `server` both `npm run dev`). verified(`Procfile`, `scripts/start.sh`)
- "Production": `docker-compose.yml` → `node server/dist/index.js`, single process serving built client statically on 5501, `restart: unless-stopped`. verified(`docker-compose.yml`, `Dockerfile`, `server/src/index.ts` L101-108)
- **No launchd/systemd, no `npm run serve`, no daemon for a headless collector.** verified(absence in `package.json` scripts)

**Required for AngelSentinel:**

1. A headless production entrypoint — `angelsentinel/src/index.ts` that starts ONLY the collector (hooks + readers + store + socket + read API), no Vite, no client. inference
2. A `npm run serve` / compiled `node dist/index.js` production command. inference
3. A **launchd/systemd service installer**, modelled on `appysentinel/packages/template/scripts/install-service.sh` (+ `launchd.plist` / `systemd.service`). This is what makes it _actually_ always-on and auto-restart-on-crash — the missing piece called out in dark-factory memory (`constellation-preflight: AngelEye load-bearing for reaper; started but not daemonized`). verified(appysentinel installer exists; AngelEye daemon absent)
4. A PID file + `/health` so the constellation preflight and watchtower reaper can detect liveness and restart deterministically. inference

> **AngelEye Control Plane** keeps the existing dev/Docker story — it's a normal dashboard app, started on demand. Only AngelSentinel needs to be a service.

---

## 6. Repo / workspace structure (Ralphy build target)

Two viable shapes — **recommend B1**:

- **B1 — two repos.** `~/dev/ad/apps/angelsentinel/` (new) + `~/dev/ad/apps/angeleye/` (slimmed to control plane). A small shared types package published or path-linked. Cleanest product boundary; matches "constellation of single-responsibility apps" (dark-factory memory `dark-factory-is-a-constellation-of-apps`). inference
- **B2 — monorepo workspaces.** Keep one repo, add `packages/sentinel` + `packages/control-plane` + `packages/shared`. Less churn, but blurs the "two products" story and keeps a single deploy unit. inference

**Shared types split (either shape):** break `shared/src/angeleye.ts` (485 lines, verified) into `sentinel-types.ts` (wire format: `AngelEyeEvent`, `RegistryEntry`, `SessionClass`, `Registry`) and `control-types.ts` (workflow/affinity/enrichment/overlay/diagnostics). §5-B refactor. verified(monolithic shared file confirmed)

---

## 7. NEW capability — tool-usage telemetry for self-evolution

This is the headline _new feature_ the split unlocks (dark-factory memory `tool-usage-telemetry-for-self-evolution`). AngelSentinel **already ingests every tool call** via hooks — so the data is sitting in the JSONL store; nothing new needs to be captured, only aggregated.

**What's already captured per `PostToolUse` → `tool_use` event** verified(`server/src/routes/hooks.ts` L101-106, `summariseTool`):

- `event.tool` — tool name (`Bash`, `Write`, `Read`, `Edit`, `mcp__<server>__<tool>`, …)
- `event.tool_use_id`
- `event.tool_summary` — tool-specific (Bash→command, Write→file+lines, mcp→`{mcp_server, mcp_tool}`)
- `event.result`
- **Skill/command invocations** arrive as `user_prompt` events with expanded XML; `extractSkillPrompt()` already reconstructs `/command args` → `trigger_command` + `trigger_arguments`. verified(`backfill.service.ts` L40-52)

**Spec the feature — a usage roll-up the factory can act on:**

1. **Aggregator (Sentinel side).** A `tool-usage.service.ts` in AngelSentinel that rolls up the JSONL into a usage table keyed by _artifact_ — skill / command / workflow / MCP-tool / built-in-tool — with: `count`, `count_7d`, `count_30d`, `last_used_at`, `first_seen_at`, `distinct_sessions`, `distinct_projects`. Recompute incrementally on each relevant hook event; persist to `~/.claude/angeleye/tool-usage.json`. inference
2. **Classification of artifact type.** Parse `mcp__a__b` → MCP; `/x` (from `trigger_command`) → skill/command (cross-reference the plugin/skill registry to label skill vs command vs workflow); bare tool names → built-in. inference. ⚠️ Distinguishing _skill_ vs _command_ vs _workflow_ from the trigger alone may need the skills/plugin registry as a lookup — `unknown` whether that registry is reachable from AngelSentinel; flag for build. unknown
3. **Read API.** `GET /api/tool-usage` (+ filters: since, type, project) on AngelSentinel. inference
4. **Self-evolution signals.** Derived flags per artifact: `heavy` (top-quantile count) → candidate to _optimise_; `dead` (zero uses in 30d AND exists in registry) → candidate to _deprecate / fix description_; `never_used` (in skills registry, never seen) → description-discoverability problem. Feeds the reassessment loop (dark-factory memory `capability-placement-and-reassessment`, `tool-usage-telemetry-for-self-evolution`). inference
5. **Control-Plane view.** A new AngelEye "Usage" view rendering the roll-up — heavy/dead/never-used columns, sparklines from the 7d/30d counts. inference
6. **Open design choice (matches the memory's undecided note):** _AngelEye-retrospective_ (aggregate from already-stored JSONL, what's specced above) **vs** _hook-counters_ (increment counters live at ingest). Recommend retrospective for v1 — zero new ingest-path code, recomputes from the source of truth, backfills history for free. unknown(David hasn't decided; memory records both options)

---

## 8. "Could use a big refactor" — found during the read

Carry these into the split rather than copying the debt across. All verified unless noted:

- **A. `hooks.ts` does too much** (~385 lines: router + session state machine + detector calls + registry writes + broadcast). Extract `ingest.service.ts`; HTTP handler becomes a thin wrapper. This is _also a prerequisite_ for the clean Sentinel boundary. verified
- **B. `shared/src/angeleye.ts` is monolithic** (485 lines, wire-format mixed with interpretive types). Split per §6. verified
- **C. `backfill.service.ts` + `sync.service.ts` are fused** — `runSync` calls backfill (Sentinel concern) _and_ classify (Control-Plane concern), so you can't import without classifying. Must be cleaved along the split line. inference
- **D. `SESSION_NOISE_EVENTS` hardcoded in the client** (`SessionEventsPanel.tsx`) — should be a `shared/` constant so new high-volume events filter without a client code change. verified
- **E. `project-config.service.ts` cache never invalidates** — module Map, needs restart to pick up a new project JSON; worse once two processes each hold their own cache. verified
- **F. workflow router hardcodes `regular_story`** — `bmad-epic-zero.json` exists but is dead code; `seedWorkflowsFromRegistry` should take the workflow type as a param. verified(`CONTEXT.md` constraints)
- **G. `registry.service.ts` write-queue grows unbounded** — module-level chained `Promise`, no pruning; fine at current scale, needs a cap for true high-frequency collector operation. inference
- **H. `seedInProgress` boolean can lock permanently** — if seed throws before `finally`, requires restart; use a timeout lock with auto-release. verified(`CONTEXT.md` constraints)

---

## 9. Acceptance Criteria (for the eventual Ralphy build — NOT this spec)

- [ ] AngelSentinel runs headless with no client/Vite dependency and a production `serve` command.
- [ ] AngelSentinel installs as a launchd (macOS) service that auto-restarts on crash, with a PID file + `/health`.
- [ ] AngelSentinel is the **sole writer** of `~/.claude/angeleye/registry.json` and the JSONL store; the Control Plane performs zero direct writes.
- [ ] All 30 hook events still ingest correctly through AngelSentinel (parity with current `hooks.ts`).
- [ ] AngelEye Control Plane renders the live feed via AngelSentinel's Socket.io and reads sessions via AngelSentinel's REST API.
- [ ] Classifier/enrichment/UI edits mutate rows **via AngelSentinel's write endpoint**, not the filesystem.
- [ ] `GET /api/tool-usage` returns per-artifact counts (total/7d/30d), `last_used_at`, and `heavy`/`dead`/`never_used` flags, computed from the existing JSONL.
- [ ] An AngelEye "Usage" view renders the roll-up.
- [ ] Refactors A–H are addressed or explicitly deferred with a note.
- [ ] No regression in constellation preflight: `constellation-status.sh` detects AngelSentinel via `/health`.

---

## 10. Open decisions for David (surfaced, not buried)

1. **Build path:** carve standalone from existing code (recommended v1) **vs** rebuild on the `appysentinel` boilerplate. unknown
2. **Repo shape:** two repos (recommended) **vs** monorepo workspaces. unknown
3. **Comms contract:** REST+Socket.io with a guarded write endpoint (recommended) **vs** shared-fs-read **vs** appysentinel Access zone. unknown
4. **Telemetry approach:** retrospective aggregation (recommended v1) **vs** live hook-counters. unknown
5. **Naming:** confirm "AngelSentinel" for the collector and "AngelEye" retained for the control plane (per ticket `name_chosen`). verified(ticket arg `name_chosen: AngelSentinel`)

---

_Written read-only by a Watchtower Swagger (ticket `q-20260608-angelsentinel-spec`). No AngelEye code was modified. This document is the only artifact written._
