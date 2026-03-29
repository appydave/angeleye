# Spec 1: Workflow Schema & Storage

**Issue**: ANG-5 (child of ANG-2)
**Status**: Draft for review
**Author**: Spec Writer agent
**Date**: 2026-03-29

---

## 1. Purpose

This spec defines the TypeScript types, storage format, lifecycle rules, and integration points for AngelEye's station-based workflow system. It covers:

- Workflow type configuration (templates)
- Workflow instance runtime state
- Station instances, backtracks, and session bindings
- Storage location and file format
- Lifecycle: create, advance, close
- Integration with existing registry and domain overlays

---

## 2. Existing Type Inventory

The following types already exist in `shared/src/angeleye.ts` and are the canonical definitions. This spec documents their intended semantics and usage contracts. No new types are introduced unless explicitly noted.

### 2.1 Workflow Type Configuration (Template)

These types describe the **static** definition of a workflow. They are loaded from JSON config files and never mutated at runtime.

```typescript
// shared/src/angeleye.ts (existing)

type CeremonyLevel = 'full' | 'reduced' | 'minimal';

interface SkipRule {
  station_action: string; // action_code of the station that may be skipped
  condition: string; // human-readable condition (not machine-evaluated)
}

interface StationConfig {
  position: number; // ordinal index, 0-based
  action_code: string; // e.g. "WN", "CS", "DS", "SAT-CS"
  role: string; // generic role: "planner", "builder", etc.
  identity: string | null; // domain identity: "Bob", "Amelia", etc. Null for SHIP
  requires_fresh_session: boolean; // true = new Claude Code session expected
  can_spawn_subagents: boolean; // true = station may launch sub-agents (e.g. DR)
  backtrack_target: boolean; // true = downstream stations can send work back here
}

interface WorkflowType {
  id: string; // unique key, e.g. "regular_story"
  name: string; // display name, e.g. "Regular Story"
  domain: string; // overlay domain, e.g. "bmad-v6"
  stations: StationConfig[]; // ordered station sequence
  ceremony_level: CeremonyLevel; // controls which stations are mandatory
  skip_rules: SkipRule[]; // advisory skip conditions (human-evaluated)
}
```

**Storage**: JSON files in `server/src/config/workflows/`. One file per workflow type.

| File                      | Workflow Type ID     | Stations                                         | Status                 |
| ------------------------- | -------------------- | ------------------------------------------------ | ---------------------- |
| `bmad-regular-story.json` | `regular_story`      | 9 (WN, CS, VS, DS, DR, SAT-CS, SAT-RA, CU, SHIP) | Fully defined          |
| `bmad-epic-zero.json`     | `epic_zero`          | 5 (WN, CS, DS, CU, SHIP)                         | Fully defined          |
| _(future)_                | `epic_retrospective` | TBD                                              | Awaiting data analysis |

**Invariants**:

- `stations` must be ordered by ascending `position` with no gaps starting from 0.
- `action_code` must be unique within a workflow type.
- `skip_rules` reference station action codes that exist in the same workflow type.
- At least one station must have `backtrack_target: true` (the pipeline needs somewhere to send work back).

### 2.2 Workflow Instance (Runtime State)

A workflow instance is created when a concrete work item enters the pipeline. It tracks live execution state.

```typescript
// shared/src/angeleye.ts (existing)

type WorkflowStatus = 'not_started' | 'in_progress' | 'closed';

interface WorkflowInstance {
  instance_id: string; // UUID, generated at creation
  workflow_type_id: string; // references WorkflowType.id
  work_item_id: string; // story/epic ID, e.g. "2.5", "0.1"
  work_item_label: string; // human-readable label, e.g. "Story 2.5: Auth refactor"
  status: WorkflowStatus; // lifecycle state
  current_station: number; // position of the currently active station
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp, updated on every state change
  stations: StationInstance[]; // runtime state for each station
  backtracks: BacktrackRecord[]; // ordered log of backtrack events
  metadata: Record<string, unknown>; // extensible bag for future fields
}
```

### 2.3 Station Instance (Per-Station Runtime State)

Each station in a workflow instance has a corresponding `StationInstance` tracking its execution.

```typescript
// shared/src/angeleye.ts (existing)

type StationState = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'backtracked';

interface StationInstance {
  position: number; // matches StationConfig.position
  action_code: string; // matches StationConfig.action_code
  state: StationState; // current state of this station
  session_ids: string[]; // Claude Code session IDs bound to this station
  started_at: string | null; // ISO 8601, set when state -> in_progress
  completed_at: string | null; // ISO 8601, set when state -> completed
  duration_ms: number | null; // elapsed ms from started_at to completed_at
  context_used_pct: number | null; // context window usage at completion (0.0-1.0)
  subagent_count: number; // number of sub-agents spawned during this station
  verdict: string | null; // outcome signal: "PASS", "CONDITIONAL PASS", "REJECT", "FAIL", or null
}
```

### 2.4 Backtrack Record

Backtracks log when a downstream station sends work back to an earlier station.

```typescript
// shared/src/angeleye.ts (existing)

interface BacktrackRecord {
  from_station: number; // position of the station that triggered the backtrack
  to_station: number; // position of the target station (must have backtrack_target: true)
  reason: string; // human-readable reason, e.g. "CONDITIONAL PASS with 3 patches"
  timestamp: string; // ISO 8601
}
```

---

## 3. Storage Design

### 3.1 Storage Location

Workflow instances persist as a single JSON file:

```
~/.claude/angeleye/workflows.json
```

This follows the established pattern for AngelEye runtime data:

- `~/.claude/angeleye/registry.json` -- session registry
- `~/.claude/angeleye/workspaces.json` -- workspace definitions
- `~/.claude/angeleye/workflows.json` -- workflow instances **(new)**

**Rationale**: Co-locating with registry and workspaces keeps all AngelEye state in one directory. The file is small (tens of instances at most) and benefits from atomic read/write rather than JSONL append.

### 3.2 File Format

```typescript
// workflows.json schema
interface WorkflowStore {
  version: 1; // schema version for future migrations
  instances: Record<string, WorkflowInstance>; // keyed by instance_id
  updated_at: string; // ISO 8601, last write timestamp
}
```

**Example**:

```json
{
  "version": 1,
  "instances": {
    "wf-a1b2c3d4": {
      "instance_id": "wf-a1b2c3d4",
      "workflow_type_id": "regular_story",
      "work_item_id": "2.5",
      "work_item_label": "Story 2.5: Session archive query",
      "status": "in_progress",
      "current_station": 3,
      "created_at": "2026-03-29T10:00:00Z",
      "updated_at": "2026-03-29T14:30:00Z",
      "stations": [
        {
          "position": 0,
          "action_code": "WN",
          "state": "completed",
          "session_ids": ["abc-001"],
          "started_at": "2026-03-29T10:00:00Z",
          "completed_at": "2026-03-29T10:05:00Z",
          "duration_ms": 300000,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 1,
          "action_code": "CS",
          "state": "completed",
          "session_ids": ["abc-002"],
          "started_at": "2026-03-29T10:10:00Z",
          "completed_at": "2026-03-29T10:45:00Z",
          "duration_ms": 2100000,
          "context_used_pct": 0.15,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 2,
          "action_code": "VS",
          "state": "completed",
          "session_ids": ["abc-002"],
          "started_at": "2026-03-29T10:50:00Z",
          "completed_at": "2026-03-29T11:00:00Z",
          "duration_ms": 600000,
          "context_used_pct": 0.2,
          "subagent_count": 0,
          "verdict": "PASS"
        },
        {
          "position": 3,
          "action_code": "DS",
          "state": "in_progress",
          "session_ids": ["abc-003"],
          "started_at": "2026-03-29T11:15:00Z",
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 4,
          "action_code": "DR",
          "state": "not_started",
          "session_ids": [],
          "started_at": null,
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 5,
          "action_code": "SAT-CS",
          "state": "not_started",
          "session_ids": [],
          "started_at": null,
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 6,
          "action_code": "SAT-RA",
          "state": "not_started",
          "session_ids": [],
          "started_at": null,
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 7,
          "action_code": "CU",
          "state": "not_started",
          "session_ids": [],
          "started_at": null,
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        },
        {
          "position": 8,
          "action_code": "SHIP",
          "state": "not_started",
          "session_ids": [],
          "started_at": null,
          "completed_at": null,
          "duration_ms": null,
          "context_used_pct": null,
          "subagent_count": 0,
          "verdict": null
        }
      ],
      "backtracks": [],
      "metadata": {}
    }
  },
  "updated_at": "2026-03-29T14:30:00Z"
}
```

### 3.3 Write Strategy

- **Read-modify-write** with the full file (not JSONL append). The file is small enough that atomic replacement is safe.
- **Write triggers**: workflow creation, station state change, session binding, backtrack, workflow close.
- **No file locking**: AngelEye server is single-process. If this changes, add advisory locking.
- **Backup**: Before each write, copy the previous version to `workflows.json.bak` (single-depth backup, not versioned).

### 3.4 Relationship to Existing Storage

| File                                      | Contents                                   | Relationship to workflows                                                                                                     |
| ----------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `registry.json`                           | Per-session classification data            | Sessions reference workflow instances via `group_ids` on RegistryEntry. The registry does NOT store workflow state.           |
| `workspaces.json`                         | Workspace definitions + session membership | Workflows are orthogonal to workspaces. A session can belong to both a workspace and a workflow station.                      |
| `workflows.json`                          | Workflow instances + station state         | References sessions by ID in `StationInstance.session_ids`. References workflow types by ID.                                  |
| `server/src/config/workflows/*.json`      | Workflow type definitions (static)         | Loaded at server startup. Immutable at runtime.                                                                               |
| `server/src/config/overlays/bmad-v6.json` | Domain overlay mappings                    | Used by the session-to-station router to resolve `workflow_role`, `workflow_identity`, `workflow_action` on registry entries. |

---

## 4. Workflow Lifecycle

### 4.1 Creation

**Trigger**: Bob runs the `WN` (Work Negotiation) command. This is the explicit entry point.

**Process**:

1. AngelEye detects a session with `trigger_command` matching a WN-mapped overlay entry.
2. The overlay resolution yields `workflow_action: "WN"` and `workflow_role: "planner"`.
3. A new `WorkflowInstance` is created with:
   - `instance_id`: generated UUID (format: `wf-` + 8 hex chars)
   - `workflow_type_id`: determined from trigger arguments or defaulting to `regular_story`
   - `work_item_id`: extracted from `trigger_arguments` (e.g., "2.5" from "WN 2.5")
   - `work_item_label`: set from trigger arguments or left as the work_item_id initially
   - `status`: `in_progress` (WN itself is the first active station)
   - `current_station`: 0
   - `stations`: initialized from the WorkflowType config, all set to `not_started` except position 0 which is `in_progress`
   - `backtracks`: empty array
4. The WN session is bound to `stations[0].session_ids`.
5. The instance is written to `workflows.json`.
6. Socket event `workflow:created` is emitted.

**No historical reconstruction**: Existing affinity groups remain as historical data. Workflows are prospective only (per David's directive).

### 4.2 Station Advancement

**Trigger**: A new session is detected whose overlay resolution maps to the next station in sequence.

**Process**:

1. Session-to-station router identifies the workflow instance and target station (covered in Spec 2).
2. Current station is marked `completed` (with `completed_at`, `duration_ms`, `verdict` if available).
3. Target station is marked `in_progress` (with `started_at`, session ID bound).
4. `WorkflowInstance.current_station` is updated.
5. `WorkflowInstance.updated_at` is set.
6. Write to `workflows.json`.
7. Socket event `workflow:updated` is emitted.

**Same-agent sequential stations**: Bob runs CS then VS in the same session. This binds one session ID to two stations. Both stations get the same session_id in their `session_ids` array.

**Station skipping**: If a station's action_code matches a `skip_rule` and the human (David) confirms the skip, the station's state is set to `skipped` and advancement continues to the next station. Skip evaluation is human-driven, not automatic.

### 4.3 Backtracking

**Triggers**:

- DR station verdict: `CONDITIONAL PASS` or `REJECT`
- SAT-RA station: test failures
- SHIP station: CI red

**Process**:

1. The triggering station detects a backtrack condition (via verdict or failure signal).
2. A `BacktrackRecord` is appended to `WorkflowInstance.backtracks`.
3. The triggering station's state is set to `backtracked`.
4. The target station (identified by `backtrack_target: true`, typically DS at position 3) is reset to `in_progress`.
5. `current_station` is updated to the target station's position.
6. Socket event `workflow:backtrack` is emitted with the backtrack record.

**Backtrack target resolution**: Walk backwards from the triggering station to find the nearest station with `backtrack_target: true`. In Regular Story, this is typically DS (position 3). In Epic Zero, DS (position 2) or CS (position 1).

**Re-entry after backtrack**: When the target station completes again, the pipeline resumes forward from that point. The previously-backtracked downstream stations are reset to `not_started`.

### 4.4 Closing

**Trigger**: SHIP station completion + CI green. Manual close as fallback.

**Auto-close conditions**:

1. SHIP station state is `completed`.
2. SHIP station verdict contains a CI-green signal (e.g., `verdict: "PASS"` or CI status detected).
3. All non-skipped stations are `completed`.

**Process**:

1. `WorkflowInstance.status` is set to `closed`.
2. `WorkflowInstance.updated_at` is set.
3. All station `completed_at` timestamps are finalized.
4. Write to `workflows.json`.
5. Socket event `workflow:closed` is emitted.

**Manual close**: David can close a workflow at any time via UI action, regardless of station states. This sets status to `closed` without requiring all stations to be completed.

---

## 5. Station State Machine

Each station follows this state machine:

```
                    ┌──────────────┐
                    │  not_started │
                    └──────┬───────┘
                           │ session bound / advancement
                           v
                    ┌──────────────┐
              ┌─────│  in_progress  │─────┐
              │     └──────┬───────┘     │
              │            │             │
         skip confirmed    │ completed   │ backtrack from downstream
              │            │             │
              v            v             v
        ┌──────────┐ ┌───────────┐ ┌─────────────┐
        │  skipped  │ │ completed │ │ backtracked  │
        └──────────┘ └───────────┘ └──────┬──────┘
                                          │ re-entry
                                          v
                                   ┌──────────────┐
                                   │  in_progress  │
                                   └──────────────┘
```

**Transitions**:
| From | To | Trigger |
|------|----|---------|
| `not_started` | `in_progress` | Session bound to this station |
| `not_started` | `skipped` | Skip rule confirmed by human |
| `in_progress` | `completed` | Station work finished, verdict set |
| `in_progress` | `backtracked` | Downstream station triggers backtrack |
| `backtracked` | `in_progress` | New session bound for re-work |
| `completed` | `backtracked` | Downstream backtrack resets this station |

**Invalid transitions**: `skipped` is terminal. `completed` cannot go to `in_progress` directly (must go through `backtracked` first if re-work is needed).

---

## 6. Workflow Type Registry

### 6.1 Loading

Workflow type configs are loaded from `server/src/config/workflows/*.json` at server startup. They are immutable at runtime.

```typescript
// Proposed loading pattern (not yet implemented)
function loadWorkflowTypes(): Map<string, WorkflowType> {
  // Read all JSON files from server/src/config/workflows/
  // Validate each against WorkflowType interface
  // Return map keyed by WorkflowType.id
}
```

### 6.2 Current Workflow Types

**Regular Story** (`regular_story`):

```
[WN] -> [CS] -> [VS] -> [DS] -> [DR] -> [SAT-CS] -> [SAT-RA] -> [CU] -> [SHIP]
 Bob     Bob     Bob    Amelia   Nate    Taylor      Taylor       Lisa     Ship
```

- 9 stations, ceremony_level: `full`, 0 skip rules
- All stations require fresh sessions except SAT-CS and SAT-RA (Taylor reuses session)

**Epic Zero** (`epic_zero`):

```
[WN] -> [CS] -> [DS] -> [CU] -> [SHIP]
 Bob     Bob    Amelia   Lisa     Ship
```

- 5 stations, ceremony_level: `minimal`, 4 skip rules (VS, DR, SAT-CS, SAT-RA)
- Streamlined pipeline for maintenance/small work items

**Epic Retrospective** (`epic_retrospective`):

- **Not yet defined**. Station sequence requires observation data analysis.
- A placeholder config should NOT be created until sufficient data exists to define concrete stations.

### 6.3 Adding New Workflow Types

To add a new workflow type:

1. Create a JSON file in `server/src/config/workflows/` following the `WorkflowType` schema.
2. Ensure `id` is unique across all workflow types.
3. Ensure `domain` matches an existing overlay (e.g., `bmad-v6`).
4. Station `action_code` values should correspond to actions defined in the domain overlay for correct session-to-station routing.
5. Restart the server to pick up the new config.

---

## 7. Integration Points

### 7.1 Registry Entry -> Workflow

The `RegistryEntry` already has fields populated by the classifier/overlay resolver:

- `workflow_role`: generic role (planner, builder, etc.)
- `workflow_identity`: domain identity (Bob, Amelia, etc.)
- `workflow_action`: action code (WN, CS, DS, etc.)
- `group_ids`: affinity group memberships

These fields are the **input signals** for the session-to-station router (Spec 2). The registry does not store workflow instance references directly; the workflow store owns that relationship via `StationInstance.session_ids`.

### 7.2 Domain Overlay -> Workflow Type

The domain overlay (`bmad-v6.json`) maps slash commands to role/identity/action tuples. The `action` values in the overlay must align with `StationConfig.action_code` values in workflow type configs for routing to work.

Example overlay entry for Bob's story management:

```json
{
  "command": "/bmad-sm",
  "role": "planner",
  "identity": "Bob",
  "actions": ["WN", "CS", "VS"]
}
```

The specific action within the list is disambiguated by `trigger_arguments` (e.g., "CS 2.5" -> action is "CS", work_item is "2.5").

### 7.3 Socket Events

| Event                | Payload                                       | When                                  |
| -------------------- | --------------------------------------------- | ------------------------------------- |
| `workflow:created`   | `WorkflowInstance`                            | New workflow instantiated             |
| `workflow:updated`   | `WorkflowInstance`                            | Station state change, session binding |
| `workflow:backtrack` | `{ instance_id, backtrack: BacktrackRecord }` | Backtrack event                       |
| `workflow:closed`    | `WorkflowInstance`                            | Workflow completed or manually closed |

These events are emitted by the server and consumed by the client for real-time UI updates.

---

## 8. Constraints & Non-Goals

### Constraints

- **No code in this spec.** This is a specification document. Implementation follows in separate tasks.
- **Prospective only.** No historical reconstruction of affinity groups into workflow instances.
- **No human gates.** The pipeline flows without approval gates. David reviews output at the end.
- **Single-process.** No concurrent access to `workflows.json`. No file locking needed.
- **Sentinel is external.** Sentinel is a separate Claude Code session that AngelEye passively observes. It is not a workflow station.

### Non-Goals (covered by other specs)

- **Session-to-station routing algorithm** -> Spec 2
- **Workflow UI views** -> Spec 3
- **Orchestration / automated station launching** -> Spec 4
- **API endpoints and socket event definitions** -> Spec 5
- **Developer inspection screens** -> Spec 6

---

## 9. Open Design Decisions

These are not blockers for implementation but should be resolved during build:

1. **Instance ID format**: Spec proposes `wf-` + 8 hex chars. Alternative: full UUID. The prefix aids debugging when IDs appear in logs.

2. **Work item ID extraction**: The `trigger_arguments` field carries the work item ID (e.g., "CS 2.5" -> "2.5"). The exact parsing rules need definition. Current approach: first token after the action code is the work item ID.

3. **Workflow type selection**: When Bob runs WN, how does AngelEye know which workflow type to use? Options:
   - Explicit in trigger arguments (e.g., "WN epic_zero 0.3")
   - Default to `regular_story` unless otherwise specified
   - Prompt David for confirmation

4. **Concurrent workflows**: Multiple workflow instances can be active simultaneously (different work items). No cross-workflow constraints are defined. The stacked pipeline UI (Spec 3) handles display.

5. **Backtrack depth**: Can a workflow backtrack multiple times to the same station? Yes -- each backtrack appends a new `BacktrackRecord`. The station cycles through `in_progress -> completed -> backtracked -> in_progress` as many times as needed.

---

## 10. Summary of Storage Artifacts

| Artifact                | Path                                      | Format                 | Mutability                                 |
| ----------------------- | ----------------------------------------- | ---------------------- | ------------------------------------------ |
| Workflow type configs   | `server/src/config/workflows/*.json`      | JSON (`WorkflowType`)  | Immutable at runtime, edited by developers |
| Workflow instance store | `~/.claude/angeleye/workflows.json`       | JSON (`WorkflowStore`) | Read-modify-write by server                |
| Session registry        | `~/.claude/angeleye/registry.json`        | JSON (`Registry`)      | Read-modify-write by server                |
| Domain overlay          | `server/src/config/overlays/bmad-v6.json` | JSON (`DomainOverlay`) | Immutable at runtime                       |
