# Chain Visualization Exploration

**Purpose**: UX exploration of how to visualize conversation chains, affinity groups, and multi-session workflows in AngelEye.

**Created**: 2026-03-27

**Context**: David runs 6+ terminal windows simultaneously for a single BMAD story lifecycle (Bob WN, Bob VS, Amelia DS, Nate DR, Taylor CS/RA, Lisa CU). These sessions span multiple project directories, form sequential chains with conditional branching, and include oversight sessions that observe but don't participate. AngelEye currently shows sessions as flat lists in the Observer and Organiser views. There is no way to see "Story 2.4 is in progress, currently at the DR step, with one backtrack from a previous conditional pass."

**Related docs**:

- Pipeline extension plan: `pipeline-extension-plan.md` (affinity group data model, domain overlays)
- BMAD lifecycle handover: `../workflow-orchestration/bmad-lifecycle-handover.md` (chain structure, routing decisions, backtrack patterns)
- BMAD session inventory: `../workflow-orchestration/bmad-session-inventory.md` (real session data for ~85 sessions)
- Data architecture: `data-architecture.md` (registry, session index, three data stores)

---

## 1. Problem Statement

AngelEye knows about individual sessions. It can tell you that session `f2d9a...` is a BUILD session in the SupportSignal project, started at 10:04, used 47 tools, and is currently active. What it cannot tell you:

- **That session belongs to Story 2.4.** It is the DS (Develop Story) step, preceded by Bob's VS and followed by Nate's DR.
- **The chain is healthy.** Story 2.4 has progressed through 4 of 8 steps with no backtracks.
- **Three other stories are in flight.** Story 2.3 is stuck at DR (conditional pass, waiting for patches). Story 0.2 was interleaved before 2.4. Story 2.5 hasn't started.
- **An oversight session is watching.** David's bmad-overwatch session is open in a 7th terminal, reviewing agent output but not in the chain.
- **The chain crosses folders.** The DS session runs in `app.supportsignal.com.au/`, but the CU session will run in `brains/`, and the Ship step targets both.

This is hard because:

1. **Chains are implicit.** No session declares "I am step 4 of chain X." Chain membership must be inferred from extractors (E01/E02), temporal proximity, shared file mutations, and domain overlay matching.
2. **Chains are not strictly linear.** DR can reject, sending the chain back to DS. SAT can fail, looping back. Epic 0 stories interleave between Epic 2 stories. The "pipeline" has conditional branches, retries, and injections.
3. **Chains span heterogeneous directories.** A single story lifecycle touches the app repo, the brains repo, and sometimes signal-studio. AngelEye groups by `project_dir` today, which scatters chain members across groups.
4. **Multiple chains coexist.** At any given moment, 2-4 story chains may be active, plus planning sessions, plus ad hoc work. The visualization must show all of them without becoming a wall of noise.
5. **Oversight is orthogonal.** Observer sessions relate to chains but are not steps in them. They need to be visible without cluttering the chain flow.

---

## 2. User Stories

### David as Sprint Manager

> "I just sat down. What's the state of the sprint? Which stories are done, which are in progress, which are blocked?"

Needs: Dashboard-level view of all active chains, their current position, and any that need attention. Equivalent to a standup board.

### David as Chain Operator

> "I'm running Story 2.4. Which step am I on? Did the DR pass? What do I launch next?"

Needs: Single-chain detail showing ordered steps, which are complete, which is current, and what the next action is. The "launch pad" for the next terminal command.

### David as Debugger

> "Story 2.3 has been stuck for two days. What happened? Where did it go wrong?"

Needs: Chain history with backtrack visibility. Show the DR rejection, the patch cycle, the re-review. Temporal information about gaps (was it stuck waiting for a human decision, or was the session running for 3 hours?).

### David as Retrospective Analyst

> "How efficient was Epic 2? How many backtracks? Which stories were clean, which were messy?"

Needs: Epic-level aggregate view. Total sessions per story, backtrack count, total duration, ceremony compliance (did they skip VS on a story that shouldn't have skipped it?).

### David as Oversight Controller

> "My overwatch session noticed something wrong in Amelia's DS output. I need to paste back a correction. Which chain does this attach to?"

Needs: Oversight sessions shown alongside the chain they observe, with a clear visual distinction from chain steps. Ability to see what the oversight session produced (paste-back messages) and which chain step it targeted.

---

## 3. Dimension Analysis

### 3.1 Linear Chain View

**Data required**: Affinity group with `group_type: 'story_unit'`, ordered `session_ids`, domain overlay providing agent identity (C15) and action code (C16) per session, E03 (final_artifact) for deliverable tracking.

**Visual metaphors**:

- **Metro line**: Stations on a rail line, each station is a chain step. Filled circles for complete, hollow for pending, pulsing for active. Works well for the canonical 8-step BMAD chain because the number of steps is small and fixed.
- **Breadcrumb trail**: Compact horizontal list showing `Bob WN > Bob CS > Bob VS > [Amelia DS] > Nate DR > ...` with the current step highlighted. Suitable for inline display within a card or header.
- **Progress stepper**: Like a checkout flow (Step 1 of 8). Each step has a name, agent avatar, and status badge. Familiar pattern from e-commerce UX.

**Tradeoffs**: The linear view is the simplest to understand but breaks down when backtracks occur. A rejected DR creates a fork: do you show the rejected DR inline and the retry as a second DR node? Or do you show only the latest attempt?

**Edge cases**: Epic 0 stories with reduced ceremony (skip VS, skip SAT) have shorter chains. The visualization must not hard-code 8 steps. Chains can also be extended if a DR rejects and the story goes back through DS and DR again.

### 3.2 Branching and Backtracking

**Data required**: Chain step ordering from affinity group metadata, DR verdict (from E03 or a BMAD-specific extractor), backtrack indicators (C17-C21 reserved BMAD classifiers: `bmad_is_backtrack`), session timestamps for ordering retries.

**Visual metaphors**:

- **Git branch graph**: Main line with branches for backtracks. DR rejection creates a branch that loops back to DS, then a new DR node merges back to the main line. Familiar to developers but can become visually complex with multiple retries.
- **Annotated linear with retry badges**: Keep the linear view but add a small "retry: 2" badge on the DR step, with an expandable panel showing the rejection history. Simpler visually but hides the backtrack structure.
- **State machine diagram**: Nodes for each step, directed edges for transitions including backward edges. Shows all possible paths but may be too abstract for operational use.
- **Inline loop notation**: Show the linear chain with a curved arrow from DR back to DS, annotated with the condition ("CONDITIONAL PASS: 3 patches"). Compact and informative but only works for simple loops.

**Tradeoffs**: Full graph fidelity (showing every session including rejected attempts) provides complete history but becomes noisy. Collapsed view (only showing the latest successful attempt per step) is cleaner but hides retry cost. Recommendation: default to collapsed, expand on click.

**Edge cases**: A DR that returns CONDITIONAL PASS and then the patches succeed on re-review vs. a DR that returns REJECT requiring a full rework from CS. These are qualitatively different backtracks and should be visually distinguished (minor loop vs. major reset).

### 3.3 Temporal View

**Data required**: `started_at` and `last_active` per session (already in RegistryEntry), session duration computed from these, gaps between consecutive chain steps (waiting-for-human time vs. working time).

**Visual metaphors**:

- **Gantt chart**: Horizontal time axis, one row per session (or per chain step). Session blocks show active duration. Gaps between blocks are visible as empty space. Overlapping sessions (concurrent chains) stack vertically. Classic project management view.
- **Timeline with event markers**: Vertical time axis, events plotted as dots or short bars. Compact but less readable for overlapping sessions.
- **Flame graph**: Stacked time slices showing what was running when. Good for understanding concurrency but unfamiliar outside profiling tools.

**Tradeoffs**: Gantt is the most natural fit for "what ran when" but the time axis creates scaling problems. Story 2.2 took 54 minutes. Story 2.1 took 3 hours. Showing both on the same axis either compresses 2.2 into a sliver or stretches 2.1 across the screen. Solution: normalize per-chain (each chain gets its own proportional view) or provide zoomable time axis.

**Edge cases**: Sessions that overlap in time because David runs multiple chains concurrently. The temporal view must handle 3 chains running in parallel without them visually colliding. Also: marathon sessions (DS at 40-70% context, possibly 2+ hours) vs. micro sessions (Ship at 10-15% context, 5 minutes).

### 3.4 Cross-Folder Awareness

**Data required**: `project_dir` per session (already in RegistryEntry), mapping from directory to human-readable project name (from C06 `project_attribution`), domain overlay `match_patterns.project_dir_contains`.

**Visual metaphors**:

- **Color coding**: Each project directory gets a color. Chain steps inherit the color of their project. A BMAD chain would show warm tones for app sessions, cool tones for brain sessions, neutral for ship/CI.
- **Swimlane by folder**: Horizontal lanes, one per project directory. Chain arrows cross lanes when a step runs in a different directory. Shows the physical distribution of work.
- **Small tag/badge**: Compact text badge on each session node showing the project name. Less visually dominant than color coding but more explicit.

**Tradeoffs**: Color coding is immediate and non-verbal but requires a legend and fails for colorblind users. Folder swimlanes are precise but add vertical space and may look sparse (most steps are in the same folder). Badge approach is accessible but adds text clutter.

**Edge cases**: Some sessions read from multiple directories (P18 `has_cross_project_reads`). The "folder" badge should reflect the primary project, not every directory touched. Also: sessions started from a different CWD than where they do their work (P10 `is_cwd_incidental`).

### 3.5 Zoom Levels

**Data required**: Affinity group hierarchy (story_unit inside epic_sprint inside project_phase), per-group summary metrics (session count, backtrack count, total duration, completion status).

**Levels**:

| Level              | Shows                                            | Typical count | Click to drill into |
| ------------------ | ------------------------------------------------ | ------------- | ------------------- |
| **Sprint board**   | All active epics/stories as cards                | 5-15 stories  | Story chain         |
| **Story chain**    | All steps in one story's lifecycle               | 5-10 sessions | Session detail      |
| **Session detail** | Single session's events, predicates, classifiers | 1 session     | N/A (bottom)        |

**Progressive disclosure strategy**:

1. **Sprint board** (default view for the chain visualization page): Cards per story, grouped by epic. Each card shows: story ID, title, current step name, agent avatar, progress bar (steps complete / total), health badge (green/amber/red), duration. Click a card to drill into that story's chain.

2. **Story chain** (drill-down): Full chain visualization for one story. Shows all steps in order, with backtrack history, temporal info, cross-folder indicators. A sidebar or panel shows the chain metadata (total duration, backtrack count, oversight sessions). Click a step to see session detail.

3. **Session detail** (deepest level): Reuses the existing ObserverView event feed or a variant of it. Shows the session's event stream, predicates, classifiers, extractors. This already exists in the Observer; the chain view just needs to link to it.

**Tradeoffs**: Three levels is enough for the BMAD use case. A fourth level (epic overview aggregating multiple stories) may be needed for retrospective analysis but adds complexity. Start with three, add the fourth when David asks for retrospective views.

### 3.6 Status and Health

**Data required**: Chain completion status (derived from which steps have sessions vs. expected steps from domain overlay), DR verdict (E03 or BMAD-specific), SAT pass/fail counts, CI status (E03 on ship step), time-since-last-activity (is the chain stalled?).

**Health states**:

| State            | Meaning                                           | Visual                                  |
| ---------------- | ------------------------------------------------- | --------------------------------------- |
| **Complete**     | All steps done, shipped, CI green                 | Solid green check                       |
| **In progress**  | Active session running on current step            | Pulsing blue dot (matches ObserverView) |
| **Waiting**      | Last step finished, next not started, <4h gap     | Amber clock                             |
| **Stalled**      | Last step finished >4h ago, next not started      | Red warning                             |
| **Blocked**      | DR rejected or SAT failed, needs human decision   | Red exclamation, action required        |
| **Backtracking** | Currently in a retry loop (DS after DR rejection) | Amber loop arrow                        |

**Tradeoffs**: Health computation depends on knowing the expected chain structure (which steps should exist) and the current position. Without a domain overlay, AngelEye cannot distinguish "chain is complete at 5 steps" from "chain skipped 3 steps." The overlay is essential for accurate health reporting. Without it, health degrades to a simpler model: "active / idle / ended."

### 3.7 Oversight Sessions

**Data required**: C14 `workflow_role` = "observer" (from domain overlay or heuristic), temporal correlation between oversight session and chain sessions (P18 `has_cross_project_reads` where the read targets are chain session artifacts), paste-back detection (oversight session contains text that later appears in a chain session's first prompt).

**Visual metaphors**:

- **Floating annotation**: Oversight sessions appear as small note icons attached to the chain step they were observing. Click to expand the oversight session detail. Non-intrusive, doesn't break the chain flow.
- **Parallel lane**: A dedicated "oversight" lane below the chain, showing oversight sessions aligned temporally with the chain steps they overlap. More visible but uses screen space.
- **Sidebar panel**: When viewing a chain, a collapsible sidebar lists all oversight sessions that touched this chain. Completely separate from the chain visualization.
- **Dashed connector**: Oversight session shown as a node outside the chain, connected by a dashed line to the step(s) it observed. Visually distinct from chain flow (dashed vs solid arrows).

**Tradeoffs**: Floating annotations are elegant but hard to place when multiple oversight interactions target the same step. A parallel lane is clearer but makes the visualization wider. The sidebar approach is the simplest to implement but loses spatial context. Dashed connectors scale well but add visual complexity.

**Edge cases**: David sometimes runs oversight during a session (real-time observation of DS while Amelia works). The oversight session overlaps temporally with the chain session. Also: oversight sessions that observe multiple chains simultaneously (the overwatch session watching Story 2.2 and 0.1 at the same time).

### 3.8 Multiple Active Chains

**Data required**: All affinity groups with `group_type: 'story_unit'` that have at least one session active or recent (last 24-48h), plus their parent `epic_sprint` groups.

**Visual metaphors**:

- **Card grid**: One card per active story, arranged in a grid. Each card is a mini-chain (compressed progress stepper). Good for 3-8 concurrent chains. Degrades at 15+.
- **Swimlane board**: Columns represent lifecycle stages (CS, VS, DS, DR, SAT, CU, Ship). Cards represent stories. Each card sits in the column of its current step. Kanban-like.
- **Stacked timelines**: Multiple horizontal timelines, one per chain, sharing a time axis. Shows concurrency and temporal relationships between chains.
- **Nested accordion**: Epics as top-level accordions, stories as nested items, each expandable to show chain detail. Dense but structured.

**Tradeoffs**: Card grid is the most dashboard-friendly and works well for the typical case (3-5 active stories). Swimlane board is more informative but assumes all chains share the same stage vocabulary (true for BMAD, not true for ad hoc chains). Stacked timelines show temporal relationships but become tall with many chains.

---

## 4. Candidate Layouts

### 4.1 Pipeline/Swimlane

Horizontal flow showing each chain step as a node in a pipeline. Agent lanes run horizontally. Multiple chains stack vertically.

```
STORY 2.4  [healthy]                                                    <=== chain header
 ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
 │ Bob      │ Bob      │ Bob      │ Amelia   │ Nate     │ Taylor   │ Lisa     │
 │ WN       │ CS       │ VS       │ DS       │ DR       │ CS+RA    │ CU       │
 │ [done]   │ [done]   │ [done]   │ [ACTIVE] │          │          │          │ ──> Ship
 │ 3m       │ 12m      │ 18m      │ 47m...   │          │          │          │
 │ ss-app   │ ss-app   │ ss-app   │ ss-app   │          │          │          │
 └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                      ^
                                   overwatch (floating note icon)

STORY 2.3  [blocked - DR conditional pass, awaiting patches]
 ┌──────────┬──────────┬──────────┬──────────┬──────────┐
 │ Bob      │ Bob      │ Amelia   │ Nate     │ Nate     │
 │ WN+CS    │ VS       │ DS       │ DR (1)   │ DR (2)   │
 │ [done]   │ [done]   │ [done]   │ [REJECT] │ [waiting]│ ............
 │ 8m       │ 15m      │ 1h12m   │ 34m      │          │
 └──────────┴──────────┴──────────┴──────────┴──────────┘
                                    └── backtrack to DS ──┘
                                        3 patches applied

STORY 0.2  [complete]
 ┌──────────┬──────────┬──────────┬──────────┐
 │ Bob      │ Amelia   │ Lisa     │ Ship     │           (reduced ceremony — no VS, no SAT)
 │ CS       │ DS       │ CU       │ [done]   │
 │ [done]   │ [done]   │ [done]   │ [done]   │
 │ 5m       │ 28m      │ 10m      │ 3m       │
 └──────────┴──────────┴──────────┴──────────┘
```

**Pros**:

- Immediately communicates chain position and health
- Backtrack history is visible inline (DR attempt 1 vs attempt 2)
- Variable chain length naturally accommodated (Epic 0 shorter chains)
- Familiar pipeline/CI metaphor
- Natural place for health badges and duration info per step

**Cons**:

- Horizontal space constrained for chains with many backtracks
- Does not show temporal relationships between chains (Story 0.2 was interleaved between 2.3 and 2.4 but this isn't visible)
- Cross-folder awareness is secondary (small text badge, not spatially encoded)
- Oversight sessions awkward to place (floating notes can crowd)

**Best for dimensions**: Linear chain (excellent), branching/backtracking (good), status/health (excellent), zoom levels (good as story-level view), multiple chains (good with vertical stacking).

**Weak on dimensions**: Temporal view (poor), cross-folder (fair), oversight (fair).

### 4.2 Timeline/Gantt

Horizontal time axis. Each chain gets a horizontal band. Sessions are blocks positioned by their start/end times. Blocks are colored by agent and labeled with the action code.

```
TIME ──>   10:00    10:30    11:00    11:30    12:00    12:30    13:00
           ┊        ┊        ┊        ┊        ┊        ┊        ┊
Story 2.4  ┊ [Bob WN]·[Bob CS]··[Bob VS]·····[Amelia DS ▓▓▓▓▓▓▓▓▓▓▓▓▓>
           ┊                                            (still running)
           ┊
Story 2.3  [Amelia DS ▓▓▓▓▓▓]·····[Nate DR ▓▓▓▓]  GAP  [Nate DR-2 ▓▓>
           ┊                  (COND PASS)  ^        (waiting for patches)
           ┊                               └─ paste-back from overwatch
           ┊
Story 0.2  ┊        [Bob CS]·[Amelia DS ▓▓▓▓▓]·[Lisa CU]·[Ship]
           ┊                                     (interleaved)
           ┊
Overwatch  [─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───>
           ┊  (continuous observation session, always open)
           ┊
Legend:  ▓▓▓ = active/running   ··· = gap (human idle)   ─── = oversight
        [  ] = completed session
```

**Pros**:

- Temporal relationships crystal clear (what ran when, what overlapped)
- Gaps visible immediately (where was the human bottleneck?)
- Concurrent chains easy to compare (what was David juggling at 11:00?)
- Oversight sessions naturally positioned on the time axis
- Duration proportionally represented (marathon DS sessions visually larger)

**Cons**:

- Loses the "chain step" structure — you see blocks in time, not a pipeline of named steps
- Long time spans compress short sessions into invisible slivers
- Backtrack structure less obvious (two DR blocks are just two blocks, the causal relationship needs annotation)
- Harder to answer "what step is this chain on?" at a glance
- Requires scrollable/zoomable time axis to be usable

**Best for dimensions**: Temporal (excellent), multiple chains (excellent), oversight (excellent), cross-folder (good via color coding blocks).

**Weak on dimensions**: Linear chain (poor — structure not explicit), status/health (fair — derivable but not primary), branching/backtracking (fair — needs annotation).

### 4.3 Graph/DAG

Directed acyclic graph where nodes are sessions and edges represent handover relationships. Layout flows generally left-to-right but allows branching, merging, and non-linear paths.

```
                    ┌──────────────────────────────────────────────┐
                    │              STORY 2.4                       │
                    │                                              │
    ┌─────┐   ┌─────┐   ┌─────┐   ┌─────────┐                    │
    │Bob  │──>│Bob  │──>│Bob  │──>│Amelia   │──> (next: Nate DR) │
    │ WN  │   │ CS  │   │ VS  │   │ DS ▓▓▓  │                    │
    │ 3m  │   │ 12m │   │ 18m │   │ 47m...  │                    │
    └─────┘   └─────┘   └─────┘   └────┬────┘                    │
                                        │                         │
                                   ┌────┴────┐                    │
                                   │overwatch│ (dashed edge)      │
                                   │ note    │                    │
                                   └─────────┘                    │
                    └──────────────────────────────────────────────┘

                    ┌──────────────────────────────────────────────┐
                    │              STORY 2.3                       │
                    │                                              │
    ┌─────┐   ┌─────┐   ┌─────────┐   ┌─────┐                    │
    │Bob  │──>│Bob  │──>│Amelia   │──>│Nate │──╮                  │
    │WN+CS│   │ VS  │   │ DS      │   │ DR  │  │ CONDITIONAL     │
    └─────┘   └─────┘   └────┬────┘   │COND │  │ PASS            │
                              ^       └─────┘  │                  │
                              │                 │                  │
                              │   ┌─────────┐   │                  │
                              └───│Amelia   │<──╯ (backtrack)     │
                                  │DS patch │                     │
                                  └────┬────┘                     │
                                       │                          │
                                  ┌────┴────┐                     │
                                  │Nate    │ (retry)              │
                                  │ DR (2) │                      │
                                  └─────────┘                     │
                    └──────────────────────────────────────────────┘
```

**Pros**:

- Backtracking is first-class — the graph literally shows the backward edge
- Complex workflows (multiple backtracks, conditional branches) render naturally
- Oversight sessions connect via dashed edges without disrupting the main flow
- Most accurate representation of the actual dependency structure
- Works for non-BMAD workflows that don't follow a linear chain

**Cons**:

- Layout is hard to compute automatically (DAG layout algorithms are non-trivial)
- Can become visually complex quickly (Story 2.3 with 2 backtracks already has 7 nodes and crossing edges)
- "What step is this chain on?" requires following the graph to the terminal node
- At epic level (10+ stories), the graph becomes unmanageable
- Less familiar to non-developers than pipeline or board views

**Best for dimensions**: Branching/backtracking (excellent), oversight (excellent), cross-folder (good via node coloring).

**Weak on dimensions**: Multiple chains (poor — doesn't scale), temporal (poor — no time axis), zoom levels (poor — hard to collapse).

### 4.4 Board/Kanban

Columns represent lifecycle stages. Cards represent stories. Each card sits in the column of its current active step. Cards move right as stories progress.

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────────────┐
│   PLAN      │   BUILD     │   REVIEW    │   TEST      │   CURATE    │   SHIP       │
│  (WN,CS,VS) │   (DS)      │   (DR)      │  (SAT)      │   (CU)      │              │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼──────────────┤
│             │ ┌─────────┐ │             │             │             │              │
│             │ │Story 2.4│ │             │             │             │              │
│             │ │Amelia DS│ │             │             │             │              │
│             │ │▓ active │ │             │             │             │              │
│             │ │47m      │ │             │             │             │              │
│             │ └─────────┘ │             │             │             │              │
│             │             │ ┌─────────┐ │             │             │              │
│             │             │ │Story 2.3│ │             │             │              │
│             │             │ │Nate DR  │ │             │             │              │
│             │             │ │! blocked│ │             │             │              │
│             │             │ │retry 2  │ │             │             │              │
│             │             │ └─────────┘ │             │             │              │
│             │             │             │             │             │ ┌──────────┐ │
│             │             │             │             │             │ │Story 0.2 │ │
│             │             │             │             │             │ │ [done]   │ │
│             │             │             │             │             │ └──────────┘ │
│ ┌─────────┐ │             │             │             │             │              │
│ │Story 2.5│ │             │             │             │             │              │
│ │not start│ │             │             │             │             │              │
│ └─────────┘ │             │             │             │             │              │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴──────────────┘
```

**Pros**:

- Instantly answers "what's the state of the sprint?" (the primary David-as-Sprint-Manager question)
- Familiar Kanban/Trello/Linear metaphor
- Multiple concurrent chains visible simultaneously without overlap
- Health status is positional (column = progress) + visual (badges for blocked/backtracking)
- Very compact — 10 stories fit comfortably
- Natural for the sprint board zoom level

**Cons**:

- Loses chain detail — you see where each story is but not the history of how it got there
- Backtracks are hidden (Story 2.3 shows "retry 2" badge but not the DR-DS-DR loop)
- No temporal information (no sense of duration per step or gaps)
- Cross-folder awareness is invisible (cards don't show which directory the current step runs in)
- Oversight sessions don't fit naturally (no column for "observing")
- Stage columns are domain-specific — requires overlay to define them

**Best for dimensions**: Multiple chains (excellent), status/health (excellent), zoom levels (excellent as sprint-level view).

**Weak on dimensions**: Linear chain detail (poor), branching/backtracking (poor), temporal (none), oversight (poor), cross-folder (poor).

---

## 5. Progressive Disclosure Strategy

No single layout handles all 8 dimensions well. The solution is a layered approach where each zoom level uses the layout best suited to its purpose.

### Level 1: Sprint Board (Board/Kanban)

The landing view for the chain visualization page. Shows all active stories as cards in stage columns. This is the "what needs my attention" view.

**Enter**: Navigate to the Chain view from the sidebar.
**Contains**: One card per active story unit (affinity group with `group_type: 'story_unit'` and recent activity). Columns from the domain overlay's action sequence, collapsed into phases (Plan, Build, Review, Test, Curate, Ship).
**Actions**: Click a card to drill into its chain. Hover for a quick summary tooltip. Filter by epic, by health status, by date range.
**Data source**: Affinity groups collection + registry entries for latest step.

### Level 2: Story Chain (Pipeline/Swimlane)

Drill-down from a sprint board card. Shows the full lifecycle of one story with all steps, backtracks, and oversight connections.

**Enter**: Click a story card on the sprint board.
**Contains**: Horizontal pipeline of chain steps. Each step shows agent identity, action code, duration, status, and project badge. Backtracks shown inline with retry badges and expandable history. Oversight sessions as floating annotations.
**Actions**: Click a step to see session detail. Expand backtracks to see rejection reasons. Toggle timeline mode (switches to a Gantt overlay on the same view, showing the same chain but with a time axis).
**Data source**: Affinity group session list + registry entries for each session + extractors for E01-E04.

### Level 3: Session Detail (Existing Observer)

Deepest drill-down. Shows a single session's full event stream, predicates, classifiers, and extractors.

**Enter**: Click a chain step in the story chain view.
**Contains**: Reuse the existing ObserverView event feed, enriched with the session's predicates/classifiers/extractors panel (from the planned Enrichment Detail mockup, Mockup 2 in the mochaccino brief).
**Data source**: RegistryEntry + session-index enrichment data.

### Navigation Pattern

```
Chain View (new sidebar item)
  │
  ├── Sprint Board (default)
  │     │
  │     ├── Story 2.4 card ──> Story Chain view
  │     │                        │
  │     │                        ├── DS step ──> Session Detail
  │     │                        ├── DR step ──> Session Detail
  │     │                        └── (etc.)
  │     │
  │     ├── Story 2.3 card ──> Story Chain view
  │     └── (etc.)
  │
  └── Timeline Toggle (optional future)
        Gantt view of all chains on shared time axis
```

The Sprint Board uses the **Board/Kanban** layout because it handles multiple chains and status at a glance.
The Story Chain uses the **Pipeline/Swimlane** layout because it shows chain structure, backtracks, and step detail clearly.
The Session Detail reuses the **Observer** because it already exists and is well-understood.

The **Timeline/Gantt** view is a toggle or alternative mode on the Sprint Board for temporal analysis. It is not the default because temporal questions ("when did things run?") are less frequent than status questions ("what's the state of the sprint?").

The **Graph/DAG** view is reserved for complex backtrack analysis and may not be needed in v1. If a story has 3+ backtracks, the pipeline view's inline retry badges may become crowded, and a DAG view of that specific story's execution graph becomes the escape hatch.

---

## 6. Data Requirements

Everything described above depends on data that does not yet exist in the AngelEye data model. Here is what must be built, in dependency order.

### Must Have (blocks any chain visualization)

| Requirement                                                                   | Source                                    | Status                                          |
| ----------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| **E01 trigger_command** — which skill/command launched a session              | `classifier.service.ts` Tier 1 extraction | **Implemented** (2026-03-27)                    |
| **E02 trigger_arguments** — arguments including story ID                      | `classifier.service.ts` Tier 1 extraction | **Implemented** (2026-03-27)                    |
| **C14-C16 domain overlay classifiers** — workflow role, identity, action      | Overlay loader + Tier 1/2 classification  | Planned (Phase 3 in pipeline-extension-plan.md) |
| **Affinity group collection** — `affinity-groups.json` with group definitions | Affinity correlator pipeline              | Planned (Phase 4)                               |
| **Affinity correlator Signal 1** — group sessions by shared E02 story IDs     | Post-classification step                  | Planned (Phase 4, Step 2)                       |
| **Backfill E01/E02 across existing 894 sessions**                             | One-time sync pass                        | Not started                                     |

### Should Have (enhances chain visualization significantly)

| Requirement                                                                      | Source                                            | Status                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- |
| **E03 final_artifact** — DR verdict, commit hash, produced file                  | Tier 2 heuristic on closing window                | Planned (Phase 1)         |
| **Affinity correlator Signal 6** — command chain detection from domain overlay   | Post-classification step                          | Planned (Phase 4, Step 3) |
| **Domain overlay: bmad-v6.json** — the first concrete overlay config             | Manual authoring                                  | Planned (Phase 3, Step 2) |
| **Chain step ordering** — expected sequence from overlay action list             | Derived from overlay `role_mappings` action order | Not designed              |
| **BMAD-specific classifiers C17-C21** — story ID, chain position, backtrack flag | Overlay-driven classification                     | Reserved IDs only         |

### Nice to Have (future enhancement)

| Requirement                                                                                                     | Source                                  | Status                       |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------- |
| **Affinity correlator Signals 2-5** — handover refs, cross-project reads, temporal clustering, shared mutations | Post-classification step                | Planned (Phase 4, Steps 4-5) |
| **E04 final_state** — LLM summary of session deliverable                                                        | Tier 3 LLM enrichment                   | Planned (Phase 1)            |
| **Oversight detection** — identifying observer sessions and linking them to chains                              | C14 = "observer" + temporal correlation | Not designed                 |
| **Health computation engine** — chain health derived from step completeness + verdicts                          | Server-side derived data                | Not designed                 |
| **Epic-level aggregation** — rolling up story metrics into epic and sprint views                                | Affinity group hierarchy queries        | Not designed                 |

### Critical Path

The minimum viable chain visualization requires:

1. E01/E02 backfill (already implemented, needs backfill run)
2. bmad-v6 overlay authored (manual, small effort)
3. C14-C16 overlay classification (medium effort)
4. Affinity group collection + Signal 1 correlator (medium effort)
5. Sprint Board UI (frontend, medium effort)
6. Story Chain UI (frontend, medium-large effort)

Steps 1-4 are backend/pipeline. Steps 5-6 are frontend. The frontend can be prototyped with mock data before the pipeline is complete.

---

## 7. Recommendation

### Prototype First: Sprint Board + Pipeline Drill-Down

Build the **Board/Kanban sprint view** as the primary chain visualization, with **Pipeline/Swimlane drill-down** for individual story chains. This combination covers 6 of 8 dimensions at acceptable quality:

| Dimension              | Coverage  | Handled by                                                         |
| ---------------------- | --------- | ------------------------------------------------------------------ |
| Linear chain           | Excellent | Pipeline drill-down                                                |
| Branching/backtracking | Good      | Pipeline with inline retry badges                                  |
| Temporal               | Fair      | Duration badges on steps; Gantt toggle as future enhancement       |
| Cross-folder           | Fair      | Project badge on each step node                                    |
| Zoom levels            | Excellent | Board (sprint) > Pipeline (story) > Observer (session)             |
| Status/health          | Excellent | Board column position + health badges                              |
| Oversight              | Fair      | Floating annotations on pipeline; board cards don't show oversight |
| Multiple chains        | Excellent | Board shows all stories simultaneously                             |

### Why Not Start With the Graph or Timeline?

The **Graph/DAG** is the most accurate representation but the hardest to implement (layout algorithms, edge routing, scaling) and the hardest to read for the most common question ("what's the state of the sprint?"). It should be reserved for complex backtrack analysis, not the default view.

The **Timeline/Gantt** is excellent for temporal analysis but David's primary question is positional ("where is each story in the lifecycle?") not temporal ("when did things run?"). Temporal can be added as a toggle mode on the sprint board later.

### What to Build First on the Backend

Before any UI work, the **affinity group correlator** must exist. The UI is meaningless without groups to display. Recommended sequence:

1. Run E01/E02 backfill across all 894 sessions (already implemented, just needs a sync run)
2. Author the bmad-v6 overlay JSON (manual, 30 minutes)
3. Implement C14-C16 overlay resolution in classifier.service.ts
4. Implement the simplest affinity correlator: Signal 1 (shared E02 story IDs within a time window) + Signal 6 (command chain detection)
5. Create `affinity-groups.json` store
6. Add `/api/chains` endpoint returning groups with their sessions
7. Build the Sprint Board UI with mock data while steps 2-6 are in progress, then wire to real data

### What to Mockup Next

Before building, create Mochaccino mockups for:

1. **Sprint Board** — the Kanban view with 4-5 story cards in various states (active, blocked, complete, not started)
2. **Story Chain Pipeline** — the drill-down for Story 2.4 showing 8 steps with one currently active, and for Story 2.3 showing a backtrack from DR
3. **Story Chain with Timeline Toggle** — the same Story 2.4 chain but with a time axis overlaid, showing session durations and gaps

These three mockups would validate the progressive disclosure strategy before any code is written.

---

**Next action**: Author the bmad-v6 overlay JSON and run E01/E02 backfill to get real affinity group data. Then generate the three mockups above with `/mochaccino` to validate the layout before implementation.
