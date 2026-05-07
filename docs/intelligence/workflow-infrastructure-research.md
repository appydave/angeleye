# Workflow Infrastructure Research

Re-runnable evidence map of AngelEye's workflow-related code: types, services, hooks, and the dormant/live boundary. No proposed fixes — that's a follow-up doc.

## Executive Summary

AngelEye carries a fully-typed factory workflow model — `WorkflowType`, `StationConfig`, `WorkflowInstance`, `StationInstance`, `AffinityGroup`, `DomainOverlay` — plus three services (`workflow-type`, `workflow`, `workflow-router`, `correlator`) and four routes. **None of it runs automatically.** The entire workflow layer is gated behind two manual HTTP endpoints (`POST /api/workflows/seed`, `POST /api/affinity-groups/correlate`) that are only invoked from one client button (`WorkflowsView.tsx:73`) and from no scheduled job. The persistence files (`workflows.json`, `affinity-groups.json`) do not exist on disk in `~/.claude/angeleye/` (verified 2026-05-07).

The live ingestion pipeline (hooks → classifier → registry) writes only three workflow-shaped fields per session: `workflow_role`, `workflow_identity`, `workflow_action`. These are derived synchronously inside `classifySession` from `overlay.service.ts` matching `trigger_command` against `bmad-v6.json`. They are 100% BMAD-domain at present — no overlay exists for RuFlo, Ralphy, or any other workflow framework. `WorkflowDomain` (mentioned in handover-2026-05-07-corpus-cleared.md:78) does **not** exist as a type — the actual interface is `DomainOverlay` (`shared/src/angeleye.ts:324`).

Approximately **2,349 LOC** of dormant infrastructure (server services + routes + client UI + JSON configs) sits behind one button-press, and `WorkflowInstance.metadata: Record<string, unknown>` is the only escape hatch for non-BMAD framework state.

## Factory Model — Type Signatures

All in `shared/src/angeleye.ts`. Re-exported from `shared/src/index.ts:21-44`.

### CeremonyLevel, StationState, WorkflowStatus

```ts
// shared/src/angeleye.ts:357-361
export type CeremonyLevel = 'full' | 'reduced' | 'minimal';
export type StationState = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'backtracked';
export type WorkflowStatus = 'not_started' | 'in_progress' | 'closed';
```

`StationState` declares `'skipped'` and `'backtracked'` but neither is ever written. Search confirms only `'not_started'` (workflow.service.ts:87), `'in_progress'` (workflow-router.service.ts:298), and `'completed'` (workflow-router.service.ts:315) appear in writes.

### StationConfig (template)

```ts
// shared/src/angeleye.ts:368-376
export interface StationConfig {
  position: number;
  action_code: string;
  role: string;
  identity: string | null;
  requires_fresh_session: boolean;
  can_spawn_subagents: boolean;
  backtrack_target: boolean;
}
```

JSDoc-free. The three boolean flags (`requires_fresh_session`, `can_spawn_subagents`, `backtrack_target`) are read in `bmad-regular-story.json` and `bmad-epic-zero.json` but never consulted by any service code. Grep confirms zero readers outside the JSON files themselves.

### WorkflowType (factory blueprint)

```ts
// shared/src/angeleye.ts:378-385
export interface WorkflowType {
  id: string;
  name: string;
  domain: string;
  stations: StationConfig[];
  ceremony_level: CeremonyLevel;
  skip_rules: SkipRule[];
}
```

Loaded from `server/src/config/workflows/*.json` by `workflow-type.service.ts:16-57`. Two configs ship: `bmad-regular-story` (9 stations) and `bmad-epic-zero` (5 stations). Both `domain: "bmad-v6"`.

`SkipRule` is defined (`shared/src/angeleye.ts:363-366`) as `{ station_action: string; condition: string }` — purely descriptive. `epic-zero` has 4 skip rules (lines 53-64), `regular_story` has none. Nothing reads `skip_rules` at runtime.

`ceremony_level` is loaded but never read by any service. Zero references outside the JSON configs.

### StationInstance (runtime row)

```ts
// shared/src/angeleye.ts:387-398
export interface StationInstance {
  position: number;
  action_code: string;
  state: StationState;
  session_ids: string[];
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  context_used_pct: number | null;
  subagent_count: number;
  verdict: string | null;
}
```

Created in `workflow.service.ts:84-95` with placeholders. Fields actually mutated by `workflow-router.service.ts`:

- `state`, `started_at`, `completed_at`, `duration_ms`, `session_ids` — yes (lines 287-329)
- `context_used_pct`, `subagent_count`, `verdict` — never written, locked to `null` / `0` / `null`

### WorkflowInstance (work-item rollup)

```ts
// shared/src/angeleye.ts:418-431
export interface WorkflowInstance {
  instance_id: string;
  workflow_type_id: string;
  work_item_id: string;
  work_item_label: string;
  project_dir?: string;
  status: WorkflowStatus;
  current_station: number;
  created_at: string;
  updated_at: string;
  stations: StationInstance[];
  backtracks: BacktrackRecord[];
  metadata: Record<string, unknown>;
}
```

`BacktrackRecord` (`shared/src/angeleye.ts:400-405`) defines `{ from_station, to_station, reason, timestamp }` but workflow-router never writes one (see `workflow.service.ts:108` initialises `backtracks: []`, no `.push` exists anywhere in non-test code). Backtrack detection lives in `correlator.service.ts:260-275` but writes to `AffinityGroup.metadata`, not `WorkflowInstance.backtracks`. Two parallel backtrack mechanisms — neither flows to `WorkflowInstance.backtracks`.

`metadata: Record<string, unknown>` is the only typed escape hatch on the entire model. Nothing writes to it (initialised `{}` at line 109, never mutated).

### AffinityGroup (cross-session cluster)

```ts
// shared/src/angeleye.ts:338-351
export type AffinityGroupType = 'story_unit' | 'epic_sprint' | 'project_phase' | 'ad_hoc';
export type AffinityConfidence = 'deterministic' | 'heuristic' | 'inferred';

export interface AffinityGroup {
  group_id: string;
  group_type: AffinityGroupType;
  label: string;
  session_ids: string[];
  confidence: AffinityConfidence;
  domain_overlay?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}
```

`AffinityGroupType` declares 4 variants. `correlator.service.ts` only emits `'story_unit'` (line 82) and `'ad_hoc'` (lines 137, 188). **`'epic_sprint'` and `'project_phase'` are never produced.** `AffinityConfidence` declares 3; correlator emits only `'deterministic'` (line 81) and `'heuristic'` (lines 136, 187) — `'inferred'` is unused.

### DomainOverlay (skill → role mapping)

```ts
// shared/src/angeleye.ts:318-334
export interface DomainRoleMapping {
  role: string; // builder, reviewer, tester, planner, observer, orchestrator, advisor, shipper
  identity: string | null; // Bob, Amelia, Nate, ...
  actions: string[]; // WN, CS, VS, DS, DR, ...
}

export interface DomainOverlay {
  domain: string; // e.g., "bmad-v6"
  role_mappings: Record<string, DomainRoleMapping>; // key = "/bmad-sm" etc.
}

export interface OverlayResult {
  domain: string;
  role: string;
  identity: string | null;
  action: string | null;
}
```

Loaded by `overlay.service.ts:17-44` from `server/src/config/overlays/*.json`. **Only one overlay exists**: `bmad-v6.json` (15 mappings, all `/bmad-*`). `OverlayResult.action` is just `triggerArguments` passed through verbatim (`overlay.service.ts:81`) — there's no validation against `DomainRoleMapping.actions`.

**Naming clarification**: `WorkflowDomain` does NOT exist anywhere in the codebase. The handover doc (`docs/planning/handover-2026-05-07-corpus-cleared.md:78`) calls it `WorkflowDomain` but the actual type is `DomainOverlay`. Grep verified.

### ProjectConfig (loosely related)

```ts
// shared/src/angeleye.ts:409-416
export interface ProjectConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  repository?: string;
  tags?: string[];
}
```

Loaded from `server/src/config/projects/*.json` (3 files: angeleye, flivideo, supportsignal). Used by `project-config.service.ts` (out of scope for workflow lineage but co-located).

## Live Services — Today vs Name

### `correlator.service.ts` (511 LOC)

**What its name suggests**: continuously correlate ingested sessions into clusters as they arrive.

**What it actually does**:

- Pure synchronous function `correlateAffinityGroups(entries)` (line 407) that takes the full registry as an array and emits an entire `{ groups, session_group_map }` snapshot.
- **Stateless and batch-only.** No incremental write path. No subscribers to `io.emit`. No file watcher.
- Three signals run in parallel: shared story id from `trigger_arguments` (`signalStoryId`, line 41), temporal proximity within 4 hr of overlay-resolved sessions (`signalTemporalProximity`, line 99), cross-project file access (`signalCrossProjectAccess`, line 149).
- Persists to `affinity-groups.json` via `saveAffinityGroups` (line 498); writes `group_ids[]` back to each session via `updateSessionGroupIds` (line 505).
- **Only invoked** from `POST /api/affinity-groups/correlate` (`server/src/routes/affinity.ts:50`). No cron, no startup job, no sync hook.
- Storage file `affinity-groups.json` does NOT exist on disk in `~/.claude/angeleye/` as of 2026-05-07.

**Confidence map**: `'deterministic'` only when story IDs match in `trigger_arguments`. Otherwise `'heuristic'`. Never `'inferred'`.

**Subagent unsafe**: `correlateAffinityGroups` does not filter by `session_kind` (`grep` confirms zero refs to `session_kind` or `teammate_id` in this file). Subagent sessions enter the pool with their parent's story id and inflate counts.

### `workflow-router.service.ts` (399 LOC)

**What its name suggests**: routes incoming session events to the appropriate workflow station as they happen.

**What it actually does**:

- Single entry point `seedWorkflowsFromRegistry({ dryRun })` (line 115). Batch seed-from-existing-registry, not a router.
- Hard-coded to **one** workflow type: `getWorkflowType('regular_story')` (line 140). `epic_zero` is never instantiated. No selection logic exists.
- Hard-coded to **one** trigger filter: `cmd.startsWith('bmad')` (line 154). Anything non-BMAD silently skipped.
- Builds a `Map<role:actionCode, StationConfig>` (line 61), parses `workflow_action` like `"DS 2.4"` (line 39), groups sessions by story id, idempotently appends to `StationInstance.session_ids`, marks station `in_progress` then `completed` if all member sessions have `status === 'ended'`.
- **Only invoked** from `POST /api/workflows/seed` (`server/src/routes/workflows.ts:102`). One concurrency guard (`seedInProgress`, line 111).
- Storage file `workflows.json` does NOT exist on disk as of 2026-05-07.

**Limitations baked in**:

- Closes a workflow only when "the highest-position station has sessions OR ≥half the stations are populated AND all populated stations are completed" (line 338-345). Does not enforce sequential completion.
- No backtrack tracking despite `BacktrackRecord` and `StationState='backtracked'` existing.
- No subagent filter — same `session_kind` blindness as correlator.
- The fallback `lookupStation` (line 88-99) does an action-code-only scan and **logs a warning** when role mismatches: this is a known surfaceable signal that real sessions don't fit the rigid regular_story template (e.g. `/bmad-sat CU` resolves to `advisor:CU`).

### `workflow.service.ts` (148 LOC)

**What its name suggests**: workflow CRUD.

**What it actually does**: exactly that — `readWorkflows`, `getWorkflow`, `createWorkflow`, `updateWorkflow`, with a serial write queue. Pure persistence. Nothing surprising. Initialises 7 station fields (lines 84-95); only 5 are ever updated downstream.

### `workflow-type.service.ts` (86 LOC)

**What its name suggests**: workflow type CRUD.

**What it actually does**: read-only loader from `server/src/config/workflows/*.json` with module-level cache (line 7). No write path. `_resetCache` is test-only (line 77).

### `overlay.service.ts` (92 LOC)

**What its name suggests**: domain overlay resolver.

**What it actually does**: synchronous load of all `*.json` from `server/src/config/overlays/` at module init, then `resolveOverlay(triggerCommand, triggerArguments)` does a simple key lookup with/without leading slash. No writes. No file-watch. **The only overlay loaded today is `bmad-v6.json`**.

The shape of `OverlayResult.action` is deceptively named — it's just the raw `triggerArguments` string passed through unchanged (line 81). It is not validated against `DomainRoleMapping.actions[]`.

### `classifier.service.ts` (1565 LOC) — workflow touchpoints

The live classifier writes 3 overlay-derived fields per session via `classifySession`:

```ts
// classifier.service.ts:790-794
const overlayResult = resolveOverlay(trigger_command, trigger_arguments);
const workflow_role = overlayResult?.role ?? null;
const workflow_identity = overlayResult?.identity ?? null;
const workflow_action = overlayResult?.action ?? null;
```

Returned via spread (lines 857-859). These are the **only fields** that bridge the live ingest path into the workflow factory model. Everything else (`StationInstance`, `WorkflowInstance`, `AffinityGroup`) is computed off these three fields by the dormant batch services.

The classifier separately recognises BMAD/RuFlo/Ralphy in its **subtype** logic (`build.bmad_orchestrator`, `build.bmad_agent`, `build.ruflo_orchestrator`, `build.ralphy_campaign` — lines 1123-1147). 4 references confirmed via grep. These subtype signals are **not** wired into the workflow factory model; they only set `subtype_heuristic`.

## Classifier Path — Field Population Map

What hooks → classifier → registry actually writes per session:

### Hook events — what gets set

`server/src/routes/hooks.ts`:

| Event              | Line range | Workflow-related fields written                                           |
| ------------------ | ---------- | ------------------------------------------------------------------------- |
| `session_start`    | 195-215    | `session_kind`, `teammate_id` (via `detectTeammate`). Nothing workflow.   |
| `user_prompt`      | 271-280    | `first_real_prompt` (early capture). Nothing workflow.                    |
| `tool_use` / other | 264-281    | Just `last_active`, `project_dir`. Nothing workflow.                      |
| `stop`             | 216-242    | Full `classifySession` spread → includes `workflow_role/identity/action`. |
| `session_end`      | 243-263    | Full `classifySession` spread again + `status: 'ended'`.                  |

So `workflow_role`, `workflow_identity`, `workflow_action` are written **twice** (on `stop` and again on `session_end`) by the same path. **No hook ever writes** `WorkflowType`, `WorkflowInstance`, `StationInstance`, `AffinityGroup`, or any field on `DomainOverlay`.

### Classifier output — full field list

`classifier.service.ts:830-868` returns ~36 fields. The workflow-shaped ones:

- `workflow_role` (string|null) — from `overlay.role`
- `workflow_identity` (string|null) — from `overlay.identity`
- `workflow_action` (string|null) — from `overlay.action`, which is just raw `trigger_arguments`
- `trigger_command` (string|null) — from first prompt's `/cmd` (line 436)
- `trigger_arguments` (string|null) — first line of args after `/cmd`, capped at 50 chars (line 449)
- `subtype_heuristic` — may carry `build.bmad_orchestrator` / `build.bmad_agent` / `build.ruflo_orchestrator` / `build.ralphy_campaign` (lines 1123-1147)

### Registry — full RegistryEntry workflow surface

`shared/src/angeleye.ts:208-291` declares these workflow-related fields on `RegistryEntry`:

- `trigger_command`, `trigger_arguments` — written by hooks.ts (line 240)
- `workflow_role`, `workflow_identity`, `workflow_action` — written by hooks.ts (line 240)
- `group_ids?: string[]` — written ONLY by `correlator.service.ts:509` via `updateSessionGroupIds`. Manual-trigger only.

That's the complete workflow-related write surface on the registry. No `workflow_instance_id`, no `station_position`, no `workflow_type_id` exists on `RegistryEntry`. **The registry has no per-session foreign key into `WorkflowInstance`.** The relationship is reverse-only: `WorkflowInstance.stations[].session_ids` holds the FK into the registry.

## The Gap — Concrete Inventory

| Concept                                                 | Defined in        | Read by                                                                                                                                   | Written by                                          | Status                         |
| ------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------ |
| `WorkflowType`                                          | `angeleye.ts:378` | `workflow-router:140`, `workflows.ts:75`, `inspector.ts:23`, client `WorkflowsView.tsx`, `WorkflowDetailView.tsx`, `WorkflowPipeline.tsx` | `workflow-type.service.ts` (read-only from JSON)    | Loaded from 2 configs          |
| `StationConfig`                                         | `angeleye.ts:368` | `workflow-router:61-101`, `WorkflowPipeline.tsx:135`                                                                                      | None (lives in JSON only)                           | 9-station + 5-station configs  |
| `WorkflowInstance`                                      | `angeleye.ts:418` | `workflow-router:240`, `workflow.service.ts`, client UI                                                                                   | `workflow.service.ts:81,121` (router calls only)    | File never written on disk     |
| `StationInstance`                                       | `angeleye.ts:387` | `workflow-router:287-329`                                                                                                                 | `workflow.service.ts:84`, `workflow-router:287-329` | Same as above                  |
| `BacktrackRecord`                                       | `angeleye.ts:400` | None                                                                                                                                      | None                                                | **0 readers, 0 writers**       |
| `AffinityGroup`                                         | `angeleye.ts:342` | `correlator`, `affinity.ts`, `mock-views`, client `DataTab.tsx`                                                                           | `correlator:498` (manual POST only)                 | File never written on disk     |
| `AffinityGroupType: epic_sprint`                        | `angeleye.ts:338` | None                                                                                                                                      | None                                                | **Defined but unused variant** |
| `AffinityGroupType: project_phase`                      | `angeleye.ts:338` | None                                                                                                                                      | None                                                | **Defined but unused variant** |
| `AffinityConfidence: inferred`                          | `angeleye.ts:340` | None                                                                                                                                      | None                                                | **Defined but unused variant** |
| `StationState: skipped`                                 | `angeleye.ts:359` | None                                                                                                                                      | None                                                | **Defined but unused variant** |
| `StationState: backtracked`                             | `angeleye.ts:359` | None                                                                                                                                      | None                                                | **Defined but unused variant** |
| `CeremonyLevel`                                         | `angeleye.ts:357` | None (loaded as JSON field but never read)                                                                                                | None                                                | **0 readers**                  |
| `SkipRule`                                              | `angeleye.ts:363` | None                                                                                                                                      | None (lives in JSON)                                | **0 readers**                  |
| `DomainOverlay` (a.k.a. WorkflowDomain in handover doc) | `angeleye.ts:324` | `overlay.service.ts`                                                                                                                      | None (read-only from JSON)                          | **Only `bmad-v6` defined**     |
| `OverlayResult`                                         | `angeleye.ts:329` | `classifier.service.ts:791`                                                                                                               | `overlay.service.ts:76`                             | Live, on every session         |
| `RegistryEntry.workflow_role`                           | `angeleye.ts:267` | `correlator`, `mock-views`, `workflow-router`                                                                                             | `hooks.ts:240` (via classifier spread)              | Live, BMAD only                |
| `RegistryEntry.workflow_identity`                       | `angeleye.ts:268` | `correlator`, `mock-views`                                                                                                                | `hooks.ts:240`                                      | Live, BMAD only                |
| `RegistryEntry.workflow_action`                         | `angeleye.ts:269` | `correlator`, `mock-views`, `workflow-router`                                                                                             | `hooks.ts:240`                                      | Live, raw `trigger_arguments`  |
| `RegistryEntry.group_ids`                               | `angeleye.ts:280` | `mock-views.ts:485`                                                                                                                       | `correlator:509` (manual POST only)                 | Empty in practice              |

### Trigger surface (entry points to the dormant infrastructure)

| Trigger                               | Effect                                                    | Source                    |
| ------------------------------------- | --------------------------------------------------------- | ------------------------- |
| `POST /api/workflows/seed`            | Runs `seedWorkflowsFromRegistry` over the entire registry | `routes/workflows.ts:102` |
| `POST /api/affinity-groups/correlate` | Runs `correlateAffinityGroups` over entire registry       | `routes/affinity.ts:50`   |
| `POST /api/workflows`                 | Manually create a single workflow instance                | `routes/workflows.ts:51`  |
| Client "Seed" button                  | Calls `/api/workflows/seed`                               | `WorkflowsView.tsx:73`    |

No cron job, no scheduler, no `sync.service` integration, no hook trigger, no Socket.IO emitter for workflow updates. The infrastructure is fully manual.

### LOC estimate

Approximate dormant-or-near-dormant infrastructure (server services + routes + client UI + JSON configs):

| File                         | LOC      |
| ---------------------------- | -------- |
| `correlator.service.ts`      | 511      |
| `workflow-router.service.ts` | 399      |
| `workflow.service.ts`        | 148      |
| `workflow-type.service.ts`   | 86       |
| `overlay.service.ts`         | 92       |
| `routes/workflows.ts`        | 118      |
| `routes/affinity.ts`         | 82       |
| `WorkflowPipeline.tsx`       | 299      |
| `WorkflowsView.tsx`          | 226      |
| `WorkflowDetailView.tsx`     | 159      |
| `useWorkflows.ts`            | 47       |
| `bmad-regular-story.json`    | 90       |
| `bmad-epic-zero.json`        | 65       |
| `bmad-v6.json` (overlay)     | 27       |
| **Total**                    | **2349** |

(Excludes shared types, tests, mock-views consumption, inspector/diagnostics rollups.)

## Implications for the BMAD-Phase / Ruflo Workflow Problem

Three observations that pin down where the BMAD-phase question and the Ruflo problem live:

1. **The classifier already names the frameworks but throws the result away.** `subtype_heuristic` carries `build.bmad_orchestrator`, `build.bmad_agent`, `build.ruflo_orchestrator`, `build.ralphy_campaign` (`classifier.service.ts:1123-1147`) yet there is no path from `subtype_heuristic` into `WorkflowType` selection. `seedWorkflowsFromRegistry` (`workflow-router.service.ts:140,154`) hard-codes `regular_story` and `cmd.startsWith('bmad')`. RuFlo and Ralphy sessions classified as such are invisible to the workflow seed. There is no `workflow_type_id` field on `RegistryEntry`.

2. **`workflow_action` is the choke point.** `seedWorkflowsFromRegistry` requires `entry.workflow_action` to route a session (line 157), and that field is just `trigger_arguments` passed through `overlay.service.ts:81` unchanged. For a non-BMAD session the overlay returns `null` and `workflow_action` is `null` — the router skips it. The `OverlayResult.action` field is structurally connected to `DomainRoleMapping.actions[]` but no validation occurs. **No "phase" concept exists on the model** — there is `StationConfig.position` (an int) and `WorkflowInstance.current_station` (an int), but neither is named with phase semantics, and `WorkflowType` has no notion of "phases that contain stations".

3. **Subagent contamination is unhandled in workflow code.** Both `correlator.service.ts` and `workflow-router.service.ts` ignore `session_kind` (verified: zero references). This compounds the open issue tracked in `docs/architecture/known-issues.md` — 33% of raw JSONLs are Mechanism B subagents, and any future workflow seed will mis-attribute their story IDs to the parent workflow instance.

The closest existing escape hatches:

- `WorkflowInstance.metadata: Record<string, unknown>` (`shared/src/angeleye.ts:430`) — typed but never written.
- `AffinityGroup.metadata?: Record<string, unknown>` (`shared/src/angeleye.ts:350`) — written by `correlator.service.ts:282-285` (chain steps + backtracks). Currently used to encode chain ordering, not phase.

The handover doc's phrase **"WorkflowDomain with role_mappings"** (`docs/planning/handover-2026-05-07-corpus-cleared.md:78`) is referring to `DomainOverlay`. That type is a per-skill-command lookup — it does not model phases or framework lifecycles. It sits one level below where a "BMAD phase" concept would need to live (which would be on `WorkflowType` itself, or a new `WorkflowPhase` interface above `StationConfig`).
