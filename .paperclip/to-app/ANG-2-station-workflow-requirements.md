# Requirements Outline: AngelEye Station-Based Workflow System

**Status**: Revised — incorporates David's feedback on workflow type accuracy
**Source**: Brain docs (`workflow-model.md`, `angeleye-fundamentals.md`), app feature spec (`workflow-feature-requirements.md`)

---

## 1. What Is a "Station"?

A **station** is a step in a production-line metaphor where a specialized agent performs a defined action on a work item (story, epic, task).

**Key properties:**

- **Position** — ordinal in the workflow sequence
- **Action code** — short identifier (WN, CS, VS, DS, DR, SAT-CS, SAT-RA, CU, SHIP)
- **Agent role** (generic) — planner, builder, reviewer, tester, advisor, shipper
- **Agent identity** (domain-specific) — Bob, Amelia, Nate, Taylor, Lisa
- **State** — not_started | in_progress | completed | skipped | backtracked
- **Session binding** — 0-N Claude Code sessions executing this station
- **Sub-agents** — some stations spawn parallel background agents (e.g., Nate's 6-aspect delivery review)

A station is **enabled** when a backing session exists. Stations without sessions appear disabled/pending in the UI.

---

## 2. What Is the Workflow That Moves Between Stations?

A **workflow** is a named production line — a template (Workflow Type) that defines an ordered sequence of stations. Work items enter at the gatekeeper station (WN) and progress through the chain.

### The Regular Story workflow (canonical, 9 stations):

```
[WN]    → [CS]    → [VS]    → [DS]     → [DR]    → [SAT-CS]  → [SAT-RA]  → [CU]    → [SHIP]
 Bob      Bob       Bob      Amelia     Nate      Taylor      Taylor      Lisa      Ship
 gate     create    validate  build      review    create      execute     curate    commit
          story     story     code       delivery  tests       tests       KDD       push+CI
```

### Workflow types

| Type                   | Stations                                  | Status                             |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| **Regular Story**      | WN→CS→VS→DS→DR→SAT-CS→SAT-RA→CU→SHIP      | Fully defined from observed data   |
| **Epic Zero**          | TBD — station sequence not yet determined | Known type, awaiting data analysis |
| **Epic Retrospective** | TBD — station sequence not yet determined | Known type, awaiting data analysis |

> **Note**: Only Regular Story has a defined station sequence based on evidence from real session data. Epic Zero and Epic Retrospective are recognized workflow types, but their station sequences have not been analyzed from actual observations. They should not be given concrete station definitions until that analysis is complete.

### Key workflow mechanics:

- **Handover contract** — the story file is the baton; each agent writes to a specific section
- **Backtracking** — downstream agents (DR, SAT, CI) can send work back to earlier stations (typically DS). Visualized as dashed return arcs
- **Gatekeeper (WN)** — Bob decides what enters the line and which workflow type to use. Visually separated from the main pipeline
- **Workflow instance** — a live execution tracking: current station, station states, backtrack history, status (not_started | in_progress | closed)

---

## 3. Key Entities, Actors, and Interactions

### Entities

| Entity                | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| **Workflow Type**     | Template defining station sequence, skip rules, ceremony level            |
| **Workflow Instance** | Live execution of a type for a specific work item                         |
| **Station (Config)**  | Template definition of a step (position, role, action code)               |
| **Station Instance**  | Runtime state of a station (state, session bindings, verdict)             |
| **Backtrack Record**  | Log of a pipeline jump-back (from station, to station, reason)            |
| **Session**           | Claude Code session — passively observed, bound to stations               |
| **Domain Overlay**    | Maps trigger commands to roles/identities/actions (primary router signal) |
| **Affinity Group**    | Retroactive session correlation (historical); workflows are prospective   |

### Actors

**Station agents** (in-pipeline):

- **Bob** (planner) — WN gatekeeper, CS story creation, VS validation
- **Amelia** (builder) — DS development/code
- **Nate** (reviewer) — DR delivery review (spawns 6 sub-agents)
- **Taylor** (tester) — SAT-CS test creation, SAT-RA test execution
- **Lisa** (advisor) — CU curation of KDD
- **Ship** (shipper) — commit, push, CI

**Out-of-workflow agents** (cross-cutting, not stations):

- **Sentinel** — shadows all stations, accumulates cross-step context, personal assistant
- **Relay** — monitors handover quality between stations, flags gaps
- **Documentation Agent** — maintains canonical BMAD/system docs

**Human actor**:

- **David** — creator/user. Initiates sessions, confirms ambiguous associations, reviews workflow state. AngelEye is his observability instrument.

### Key Interactions

1. **Session → Station binding** (session-to-station router): explicit hints → story ID match → agent identity match → human confirmation fallback
2. **Station → Station handover**: via story file sections; Relay monitors quality
3. **Backtrack loop**: DR/SAT/CI → earlier station (typically DS) with reason
4. **Sub-agent spawning**: stations can launch 0-N parallel sub-agents (especially DR)
5. **Socket events**: real-time updates (workflow:created, workflow:updated, workflow:backtrack, workflow:associated)

---

## 4. Major Functional Areas Requiring Detailed Specs

Each area below should become its own spec document:

### Spec 1: Workflow Schema & Storage

- TypeScript/Zod types for WorkflowType, WorkflowInstance, StationInstance, BacktrackRecord
- Workflow type configuration files (JSON) — only Regular Story gets a concrete config; Epic Zero and Epic Retrospective configs should be placeholder/provisional until data analysis completes
- Storage format and location (recommended: `workflows.json`)
- Relationship to existing registry.json and domain overlays

### Spec 2: Session-to-Station Router

- Automatic association algorithm (overlay hints → story ID → agent identity)
- Ambiguous association handling (pending queue, human confirmation UI)
- Multi-command sessions (one session → multiple station bindings)
- Edge cases: no overlay match, multiple candidates

### Spec 3: Workflows View UI

- List view (all workflow instances, filtering, search)
- Pipeline view (station nodes, states, live chat panel)
- Backtracking visualization (dashed arrows, virtual station cards)
- Out-of-workflow agent indicators (Sentinel sidebar, Relay annotations)
- Sub-agent panel (expandable, status badges)

### Spec 4: Workflow Lifecycle & Orchestration

- Workflow creation trigger (WN vs first real station)
- Station state transitions and rules
- Backtrack detection and recording (DR verdicts, SAT failures, CI red)
- Workflow close detection (Ship + CI green? Manual?)
- Human-in-the-loop gates (which transitions need David's approval)

### Spec 5: API Endpoints & Socket Events

- REST endpoints for workflow CRUD and session association
- Socket event definitions and payloads
- Integration with existing observer event feed and mock views API

### Spec 6: Developer Inspection Screens

- Schema inspector (workflow type configs, field definitions)
- Data inspector (browse instances, raw JSON, relationships)
- Grounded in real data — no fake mocks

---

## Open Questions for David

1. **Workflow creation trigger**: Created when Bob runs WN, or when first real station (CS) starts?
2. **Historical reconstruction**: Should existing affinity groups be retroactively promoted to workflow instances?
3. **Human gates**: Which station transitions require your explicit approval before proceeding?
4. **Sentinel nature**: Is Sentinel a separate Claude Code session that AngelEye observes, or an AngelEye-native feature?
5. **Sub-agent detection**: How does AngelEye know about Nate's sub-agents? SubagentStart/Stop hooks? Session content parsing?
6. **Multi-workflow display**: When parallel stories are active, tabs or stacked pipelines?
7. **Workflow close signal**: Ship completion + CI green? Or manual close?
8. **Spec priority**: Which of the 6 spec areas should be detailed first?

---

**Next step**: David reviews this outline, answers open questions, and approves the structure before detailed specs are written.
