# Workflow Feature — Requirements Specification

**Status**: Requirements draft
**Brain context**: `~/dev/ad/brains/angeleye/workflow-model.md`
**Provenance**: OMI transcripts (2026-03-29), existing chain mockups, existing enrichment pipeline

---

## What We're Building

A **Workflows view** — the third top-level menu alongside Observer and Organizer — that shows agent development workflows as station-based production lines. Sessions are passively associated with workflow stations as they happen. The view provides both a live operational dashboard and a historical workflow browser.

---

## Navigation

The sidebar gains a third view:

```
Observer    — live session feed (existing)
Organiser   — workspace management (existing)
Workflows   — station-based workflow view (NEW)
Settings    — configuration (existing)
```

The existing "Sprint Board" mockup (`chain-sprint-board`) evolves into the Workflows view. The chain-story-pipeline and chain-session-detail mockups provide the drill-down views within Workflows.

---

## R1 — Workflow Schema (TypeScript/Zod)

### R1.1 Workflow Type Configuration

A static schema defining available workflow templates. Stored as JSON configs (like domain overlays).

```
WorkflowType {
  id: string                    // e.g., "regular_story"
  name: string                  // e.g., "Regular Story"
  domain: string                // e.g., "bmad-v6" — links to overlay
  stations: StationConfig[]     // ordered sequence
  ceremony_level: "full" | "reduced" | "minimal"
  skip_rules: SkipRule[]        // conditions for skipping stations
}

StationConfig {
  position: number              // ordinal in sequence
  action_code: string           // WN, CS, VS, DS, DR, SAT-CS, SAT-RA, CU, SHIP
  role: string                  // generic: planner, builder, reviewer, etc.
  identity: string | null       // domain-specific: Bob, Amelia, Nate, etc.
  requires_fresh_session: boolean
  can_spawn_subagents: boolean
  backtrack_target: boolean     // can other stations backtrack to this one?
}

SkipRule {
  station_action: string        // which station can be skipped
  condition: string             // human-readable: "pure refactor with existing test coverage"
}
```

### R1.2 Workflow Instance (Runtime)

A live execution of a workflow type for a specific work item.

```
WorkflowInstance {
  instance_id: string           // UUID
  workflow_type_id: string      // links to WorkflowType
  work_item_id: string          // e.g., "2.5" (story ID)
  work_item_label: string       // e.g., "Real-time notification preferences"
  status: "not_started" | "in_progress" | "closed"
  current_station: number       // position index
  created_at: string
  updated_at: string
  stations: StationInstance[]
  backtracks: BacktrackRecord[]
  metadata: Record<string, unknown>
}

StationInstance {
  position: number
  action_code: string
  state: "not_started" | "in_progress" | "completed" | "skipped" | "backtracked"
  session_ids: string[]         // 0-N sessions bound to this station
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  context_used_pct: number | null
  subagent_count: number
  verdict: string | null        // PASS, CONDITIONAL_PASS, REJECT, FAIL (for DR/SAT)
}

BacktrackRecord {
  from_station: number          // e.g., DR (position 4)
  to_station: number            // e.g., DS (position 3)
  reason: string                // e.g., "CONDITIONAL_PASS with 3 patches"
  timestamp: string
}
```

### R1.3 Storage

Options (decision needed):

- **Option A**: New `workflows.json` file alongside registry.json and workspaces.json
- **Option B**: Extend registry.json with workflow instance references
- **Option C**: New `data/workflows/` directory with one JSON per instance

Recommendation: **Option A** — separate file, consistent with existing patterns (registry.json, workspaces.json, affinity-groups.json).

---

## R2 — Session-to-Station Router

### R2.1 Automatic Association

When a new session event arrives with overlay resolution (workflow_role + workflow_identity + workflow_action), attempt automatic station association:

1. Find active workflow instances matching the session's story ID (from trigger_arguments)
2. Match the action code to a station in the workflow
3. Bind the session to that station
4. Update station state to `in_progress`

### R2.2 Ambiguous Association

When automatic association fails (no story ID, no overlay match, multiple candidates):

- Surface the session in a "pending association" queue in the Workflows view
- Show the session's trigger command, first prompt snippet, and project context
- Let the user drag-and-drop or click to associate with a station
- "Inbox is always the safe default" — never auto-assign when ambiguous

### R2.3 Multi-Command Sessions

A single session may execute multiple commands (e.g., Bob running CS then VS). Handle by:

- Binding the session to multiple stations (one-to-many)
- Each station binding tracks the approximate entry point in the session (event index or timestamp)

---

## R3 — Workflows View UI

### R3.1 List View (Top Level)

Shows all workflow instances (active and recent). Columns:

- Work item ID + label
- Workflow type
- Status (with progress indicator)
- Current station + agent
- Session count
- Last activity

Filter/search by: status, workflow type, date range, agent.

### R3.2 Pipeline View (Drill-Down)

When clicking a workflow instance, shows the station-based pipeline:

- **Stations across the top** as connected nodes (reuse chain-story-pipeline mockup pattern)
- **Enabled stations** have colored borders and agent avatars
- **Disabled stations** (no session yet) are grayed out
- **Active station** has pulse animation and elevated styling
- **Completed stations** have green check marks
- **Backtracked stations** have amber dashed borders

Below the pipeline: **live chat view** of the selected station's session, driven by existing observer/event infrastructure and socket layer.

### R3.3 Backtracking Visualization

When a backtrack occurs:

- Draw a **dashed return arrow** from the source station to the target station
- Optionally show a **virtual station card** at the target position indicating "backtrack from DR"
- The backtrack card links to the specific point in the session conversation where the correction begins

### R3.4 Out-of-Workflow Agents

Sentinel, Relay, and Documentation agents are NOT stations in the pipeline. They appear as:

- **Sentinel**: Persistent companion icon/panel alongside the pipeline — always visible, indicates observation status
- **Relay**: Quality annotations on connectors between stations (e.g., "handover verified" or "handover incomplete")
- **Documentation**: Status indicator showing doc update activity

### R3.5 Sub-Agent Panel

When a station has spawned sub-agents (from SubagentStart/SubagentStop events):

- Show sub-agent count badge on the station node
- Expandable panel below the station showing each sub-agent's status and summary
- Color-coded: running (amber pulse), complete (green), failed (red)

---

## R4 — Developer Inspection Screens

### R4.1 Schema Inspector

A developer-facing view that shows:

- All registered workflow type configurations (JSON)
- Schema field definitions with types
- Live vs configured values comparison

### R4.2 Data Inspector

Browse live workflow data:

- List all workflow instances (past and active)
- View raw JSON for any instance
- Field-level display with relationships highlighted
- Filter by status, date, workflow type

**Key principle from transcript**: "Visualizations must always be grounded in real code or JSON provenance, avoiding fake mocks." These screens render directly from canonical type definitions or stored JSON.

---

## R5 — Integration Points

### R5.1 Existing Infrastructure

| System              | Integration                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| Domain Overlays     | Resolve trigger commands to roles/identities/actions — primary station router signal   |
| Affinity Groups     | Historical workflow reconstruction — translate existing groups into workflow instances |
| Registry            | Source of session metadata for station binding                                         |
| Socket Layer        | Real-time station updates via `angeleye:event`                                         |
| Observer Event Feed | Chat view for selected station's session                                               |
| Mock Views API      | Existing chain endpoints provide the data shape                                        |

### R5.2 New API Endpoints

```
GET  /api/workflows                       — list all instances
GET  /api/workflows/:instanceId           — get instance detail
POST /api/workflows                       — create new instance (manual or auto)
PUT  /api/workflows/:instanceId           — update instance (status, station states)
POST /api/workflows/:instanceId/associate — bind a session to a station
GET  /api/workflow-types                  — list configured workflow types
```

### R5.3 Socket Events (New)

```
'workflow:created'     — new instance
'workflow:updated'     — station state change
'workflow:backtrack'   — backtrack event
'workflow:associated'  — session bound to station
```

---

## R6 — Implementation Priority

### Phase 1 — Schema + Static View

- [ ] Define TypeScript types in `shared/src/angeleye.ts`
- [ ] Create `bmad-regular-story.json` workflow type config
- [ ] Create workflow instance storage (`workflows.json`)
- [ ] Build Workflows list view (static, from stored data)

### Phase 2 — Session Router + Live Binding

- [ ] Implement session-to-station router in sync service
- [ ] Add workflow socket events
- [ ] Build pipeline view with station states
- [ ] Wire to existing observer event feed for chat panel

### Phase 3 — Backtracking + Sub-Agents

- [ ] Detect DR verdict in session events
- [ ] Implement backtrack recording
- [ ] Backtrack visualization (dashed arrows)
- [ ] Sub-agent panel from SubagentStart/SubagentStop events

### Phase 4 — Developer Screens + Polish

- [ ] Schema inspector view
- [ ] Data inspector view
- [ ] Out-of-workflow agent indicators (Sentinel/Relay/Doc)
- [ ] Historical workflow reconstruction from affinity groups

---

## Open Questions

1. **Workflow creation trigger**: Is a workflow instance created when WN runs, or when the first real station (CS) starts?
2. **Affinity group migration**: Should existing affinity groups be retroactively promoted to workflow instances?
3. **Multi-workflow display**: When multiple workflows are active (parallel stories), how does the pipeline view handle it? Tabs? Stacked pipelines?
4. **Workflow close detection**: What signals that a workflow is done? Ship completion + CI green? Manual close?

---

**Created**: 2026-03-29
**Last Updated**: 2026-03-29
