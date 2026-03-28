# Wave-Based Agent Workflow Visualization — Design Document

**Created**: 2026-03-28
**Source**: Omi transcript (07:07 BKK) + chain-visualization-exploration.md + bmad-lifecycle-handover.md + existing Mochaccino mockups
**Status**: Design specification — ready for mockup construction

---

## 1. Vision

AngelEye currently shows sessions as flat lists (Observer) or classified grids (Organiser). Neither view answers the question a multi-agent workflow user actually asks:

> "Where is Story 2.4 right now? Who's working on it? What did the last agent decide? What happens next?"

The **Wave Visualization** is the answer. It shows a complete agent workflow as a horizontal wave of steps — past, present, and future — with the ability to drill into any step and see the live conversation, the intelligence being extracted, and the handover controls for moving work forward.

This is not a dashboard. It is a **live performance instrument** — glanceable from a second monitor while David is running BMAD agents across 6+ terminals.

---

## 2. The Wave Concept

A **wave** is a single end-to-end execution of a workflow template. For BMAD story lifecycles, one wave = one story passing through all agents:

```
Bob CS → Bob VS → Amelia DS → Nate DR → Taylor CS → Taylor RA → Lisa CU → Ship
```

Each node in the wave represents an **agent session** — a Claude Code terminal window running a specific agent with a specific action code.

### Wave States

| State                | Visual                                      | Meaning                                        |
| -------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Done**             | Solid node, green border                    | Agent completed successfully                   |
| **Active**           | Glowing node, amber border, pulse animation | Currently running in a terminal                |
| **Pending**          | Ghosted node, 45% opacity                   | Future step, not yet started                   |
| **Conditional Pass** | Amber dashed border                         | Completed with conditions (triggers backtrack) |
| **Failed**           | Red border                                  | Agent reported failure (test fail, rejection)  |
| **Skipped**          | Dotted border, strikethrough label          | Ceremony reduction (e.g., Epic 0 skips VS)     |

### Backtrack Visualization

When Nate's DR returns a CONDITIONAL PASS, the workflow doesn't continue forward — it curves back to Amelia for patches, then returns to Nate for re-review. This is visualized as:

- A **curved return arrow** (SVG) arcing above the wave from the DR node back to the DS node
- The backtracked DS node appears as an **inline retry** (DS₂) with a badge showing "patch"
- The re-review DR node appears as DR₂
- Original DR₁ retains its conditional-pass styling

For stories with 3+ backtracks, the inline retry badges become crowded — at that point, an expandable **backtrack timeline** drops down below the wave showing each attempt as a mini-row.

---

## 3. Three-Panel Layout

The wave visualization is a single-screen layout with three panels plus a top wave bar:

```
┌─────────────────────────────────────────────────────────┐
│  WAVE BAR (horizontal scroll)                           │
│  [Bob CS]──[Bob VS]──[Amelia DS]──●[Nate DR]──○ ○ ○    │
├────────────┬──────────────────────┬─────────────────────┤
│  LEFT      │  CENTER              │  RIGHT              │
│  Agent     │  Conversation        │  Audit Log          │
│  Profile   │  Transcript          │  (Intelligence)     │
│            │                      │                     │
│  Name      │  User prompts        │  Predicates fired   │
│  Role      │  Claude responses    │  Observations       │
│  Avatar    │  Tool calls          │  Classifications    │
│  Stats     │  (terminal mirror)   │  Extractions        │
│            │                      │                     │
│  Handover  │                      │  Copy/Send          │
│  Controls  │                      │  Controls           │
├────────────┴──────────────────────┴─────────────────────┤
│  STATUS BAR: Story 2.4 · Step 4/8 · DR · 22m elapsed   │
└─────────────────────────────────────────────────────────┘
```

### 3.1 Wave Bar (Top)

A horizontal track of step nodes, left-to-right in execution order.

- **Done steps**: Solid, clickable — clicking loads that step's transcript and audit log into the panels below
- **Active step**: Highlighted with a pulsing indicator, auto-selected on load
- **Pending steps**: Ghosted (opacity 0.45), showing agent name and action code but no session data
- **Curved return lines**: SVG arcs above the wave for backtracks (visible when they exist)
- **Oversight badge**: Below any step that has an associated oversight/Sentinel session — dashed connector, eye icon, tooltip with oversight session details

The wave bar scrolls horizontally if the workflow has many steps (backtracks expand it). The active step is always centered on initial load.

### 3.2 Left Panel — Agent Profile

Shows the identity and context of whichever step is selected in the wave bar.

| Field            | Example                               |
| ---------------- | ------------------------------------- |
| **Agent Name**   | Nate                                  |
| **Role**         | Reviewer                              |
| **Action Code**  | DR (Delivery Review)                  |
| **Avatar**       | Color-coded circle (green for Nate)   |
| **Session ID**   | `f2d9a07c` (truncated, full on hover) |
| **Project**      | app.supportsignal.com.au              |
| **Duration**     | 22m                                   |
| **Context Used** | 38%                                   |
| **Tools Used**   | Read: 47, Grep: 12, Bash: 8           |
| **Model**        | claude-opus-4-6                       |

Below the stats, **Handover Controls**:

- **Verdict badge**: Shows the detected verdict (PASS / CONDITIONAL PASS / REJECT / pending)
- **"Copy Handover" button**: Copies the handover context (story file section written by this agent) to clipboard
- **"Send to Next" button**: Prepares a paste-back message for the next agent (self-contained, no external references)
- **"Backtrack" button**: Visible only on CONDITIONAL PASS / REJECT — prepares patch instructions for the previous agent

### 3.3 Center Panel — Conversation Transcript

A vertical chat-style view mirroring the terminal session for the selected step. This is the core reading experience.

- **User prompts**: Left-aligned, showing the trigger command (e.g., `/bmad-dr DR 2.4`)
- **Claude responses**: Right-aligned (or full-width), with markdown rendering
- **Tool calls**: Collapsed by default, expandable — shows tool name, file path, and a summary (e.g., "Read server/src/index.ts lines 1-50")
- **Sub-agent blocks**: For agents like Nate who spawn sub-agents, these appear as nested, indented sections with their own tool call summaries
- **Timestamps**: Subtle, relative (e.g., "2m ago")
- **Auto-scroll**: Follows new content when viewing the active step, paused when viewing a completed step

Data source: The JSONL session file for this session, parsed and rendered. For completed steps, the full transcript is loaded from archive. For the active step, new entries are streamed via Socket.io.

### 3.4 Right Panel — Audit Log (Intelligence)

The analytical layer. Shows what AngelEye has extracted from this session in real-time.

Organized into four sections matching the four analysis patterns:

#### Predicates (Boolean signals)

A compact grid of predicate badges. Fired predicates are highlighted; unfired are dimmed.

```
[P01 feature_construction ✓] [P02 frustration ✗] [P03 playwright ✗]
[P04 git_commit ✓]          [P05 file_creation ✓] [P06 test_run ✓]
[P18 bmad_session ✓]        [P19 skill_invoked ✓]  ...
```

Each badge is clickable — shows the evidence (which event or text triggered it) in a tooltip.

#### Observations (Free-text analysis)

Timestamped analyst notes generated by the enrichment pipeline:

```
10:04  Session opened with /bmad-dr DR 2.4 — fresh window, bias isolation confirmed
10:12  Heavy Read usage on test files — reviewer is checking test coverage
10:18  DR verdict detected: CONDITIONAL PASS — 2 patches required
10:19  Patch 1: "Add error boundary to ChainView component"
10:20  Patch 2: "Update test for backtrack scenario edge case"
```

#### Classifications (Categorical)

Key-value pairs:

```
Session Type:    REVIEW
Session Scale:   moderate (est. 30-45 min)
Tool Pattern:    read-heavy
Workflow Role:   reviewer
BMAD Identity:   Nate
BMAD Action:     DR
Story ID:        2.4
Epic ID:         2
```

#### Extractions (Structured values)

The concrete outputs AngelEye has pulled from this session:

```
Trigger Command:   /bmad-dr
Trigger Args:      DR 2.4
Verdict:           CONDITIONAL PASS
Patch Count:       2
Patches:           [expandable list]
Final Artifact:    Review Intelligence section written
Final State:       awaiting-patches
```

At the bottom: **Copy/Send Controls**

- **"Copy Extractions"**: Copies the structured extraction data as JSON
- **"Copy Observations"**: Copies the observation log as markdown
- **"Export Audit"**: Downloads the full audit (all four sections) as a JSON file

---

## 4. Agent Definitions

Each BMAD agent has a fixed identity in the wave visualization:

| Agent        | Role              | Actions        | Color              | Avatar |
| ------------ | ----------------- | -------------- | ------------------ | ------ |
| **Bob**      | Planner           | WN, CS, VS     | `#4a7fb5` (blue)   | B      |
| **Amelia**   | Builder           | DS             | `#c07030` (orange) | A      |
| **Nate**     | Reviewer          | DR             | `#5a9a3c` (green)  | N      |
| **Taylor**   | Tester            | SAT CS, SAT RA | `#8a6ab5` (purple) | T      |
| **Lisa**     | Advisor / Curator | CU             | `#b56a8a` (pink)   | L      |
| **Ship**     | (mechanical)      | SHIP           | `#8a8a8a` (gray)   | ⚙      |
| **Sentinel** | Coordinator       | OW (Overwatch) | `#d4860a` (amber)  | 👁     |

Sentinel/Overwatch is not a step in the wave — it runs in parallel as an oversight session. It appears as a floating badge beneath whichever steps it was observing.

---

## 5. The Four Analysis Patterns

These are the lenses through which AngelEye processes every session event:

### 5.1 Predicate Analysis

**Question**: "Did X happen in this session?"
**Output**: Boolean (true/false)
**Examples**: Was a git commit made? Was a test run? Was frustration detected? Is this a BMAD session?
**Implementation**: 25 predicates (P01-P25), three detection tiers (deterministic, heuristic, LLM)
**UI**: Badge grid with green (fired) / gray (not fired) states

### 5.2 Observation Analysis

**Question**: "What is noteworthy about what just happened?"
**Output**: Free-text timestamped note
**Examples**: "Heavy file creation burst — likely scaffolding a new component", "Context at 62% — approaching fresh-window threshold"
**Implementation**: Generated by heuristic rules + LLM analysis of event sequences
**UI**: Scrolling log with timestamps, newest at bottom

### 5.3 Classification Analysis

**Question**: "What category does this session/event belong to?"
**Output**: Categorical label from a defined set
**Examples**: Session type (BUILD/REVIEW/TEST), scale (micro/light/moderate/heavy/epic), tool pattern (read-heavy, write-heavy, balanced)
**Implementation**: 13 classifiers (C01-C13) + 3 domain overlay classifiers (C14-C16) + BMAD-specific (C17-C21)
**UI**: Key-value list with category badges

### 5.4 Extraction Analysis

**Question**: "What concrete value can be pulled from this event?"
**Output**: Structured data (string, number, enum, or object)
**Examples**: Trigger command (`/bmad-dr`), story ID (`2.4`), DR verdict (`CONDITIONAL PASS`), patch list, commit hash
**Implementation**: 4 extractors (E01-E04) with domain-specific extensions
**UI**: Labeled fields with copy buttons

---

## 6. Sub-Agent Visualization

Nate's DR step is the most complex — he spawns up to 6 sub-agents to analyze different aspects of the code:

```
Nate DR
├── Code Quality Agent → reads source, checks patterns
├── Test Coverage Agent → analyzes test files
├── Security Agent → scans for vulnerabilities
├── Architecture Agent → checks structural decisions
├── Documentation Agent → reviews docs/comments
└── Summary Agent → synthesizes findings into verdict
```

In the center panel, sub-agent work appears as **collapsible nested blocks**:

```
▼ Sub-agent: Code Quality (2m 14s)
    Read client/src/views/ChainView.tsx
    Read client/src/components/StepNode.tsx
    Grep "TODO|FIXME|HACK" across client/src/
    → Finding: 2 TODOs in ChainView, recommend addressing before merge

▼ Sub-agent: Test Coverage (1m 08s)
    Read client/src/test/ChainView.test.tsx
    Bash: npm test -- --coverage
    → Finding: 78% coverage, missing edge case for backtrack rendering
```

In the right audit panel, sub-agent findings roll up into the parent session's extractions.

---

## 7. Workflow Example — Story 5.1

Concrete walkthrough of how the wave visualization displays Story 5.1:

### Step 1: Bob CS (Create Story)

- **Wave bar**: First node lit green (done)
- **Left panel**: Bob, Planner, CS, blue avatar
- **Center**: Shows Bob reading the epic, PRD, and previous stories, then writing the story file
- **Right**: P18 (bmad_session) ✓, E01: `/bmad-sm`, E02: `CS 5.1`, Classification: KNOWLEDGE session

### Step 2: Bob VS (Validate Story)

- **Wave bar**: Second node lit green (done)
- **Left panel**: Bob, Planner, VS, blue avatar, fresh window badge
- **Center**: Bob re-reads the story file and source code, validates acceptance criteria, makes corrections
- **Right**: Observation: "2 AC items tightened — added specific error messages"

### Step 3: Amelia DS (Develop Story)

- **Wave bar**: Third node lit green (done)
- **Left panel**: Amelia, Builder, DS, orange avatar, fresh window badge
- **Center**: Full implementation session — file creation, test writing, refactoring
- **Right**: P01 (feature_construction) ✓, P04 (git_commit) ✓, Context used: 58%, E03: Dev Agent Record written

### Step 4: Nate DR (Delivery Review) — ACTIVE

- **Wave bar**: Fourth node glowing amber (active), pulsing
- **Left panel**: Nate, Reviewer, DR, green avatar, fresh window badge, model: opus-4-6
- **Center**: Live streaming — Nate is currently reviewing code diff, spawning sub-agents
- **Right**: Predicates updating in real-time, observations appearing as analysis proceeds
- **Verdict**: Pending (no verdict detected yet)

### Steps 5-8: Ghosted

- **Wave bar**: Nodes 5-8 at 45% opacity — Taylor CS, Taylor RA, Lisa CU, Ship
- **Left panel**: Shows expected agent info (pre-populated from workflow template)
- **Center**: "Waiting for Step 4 to complete"
- **Right**: Empty — no intelligence yet

### If Nate Returns CONDITIONAL PASS

1. DR node changes to amber dashed border
2. Curved SVG arrow appears arcing from DR back to DS
3. A new DS₂ node appears (inline retry, with "patch" badge)
4. After patches applied, a new DR₂ node appears
5. Wave extends: `... DS → DR₁ → DS₂ → DR₂ → Taylor CS → ...`

---

## 8. Data Requirements

### What Must Exist Before Building

| Requirement                                                   | Status            | Blocks                         |
| ------------------------------------------------------------- | ----------------- | ------------------------------ |
| E01 trigger_command extractor                                 | Implemented       | —                              |
| E02 trigger_arguments extractor                               | Implemented       | —                              |
| E03 final_artifact extractor                                  | Planned (Phase 1) | Verdict detection              |
| C14-C16 domain overlay classifiers                            | Planned (Phase 3) | Agent identity mapping         |
| bmad-v6.json overlay config                                   | Not started       | C14-C16                        |
| Affinity group correlator (Signal 1: shared story IDs)        | Planned (Phase 4) | Grouping sessions into waves   |
| Affinity group correlator (Signal 6: command chain detection) | Planned (Phase 4) | Ordering steps within a wave   |
| E01/E02 backfill across 894 sessions                          | Not started       | Historical wave reconstruction |

### JSON Document Structures

#### Wave Definition

```json
{
  "waveId": "wave-story-5.1",
  "groupType": "story_unit",
  "domain": "bmad-v6",
  "storyId": "5.1",
  "epicId": "5",
  "status": "in_progress",
  "currentStep": 4,
  "totalSteps": 8,
  "backtracks": 0,
  "agents": ["Bob", "Amelia", "Nate", "Taylor", "Lisa"],
  "steps": [
    {
      "position": 1,
      "agentName": "Bob",
      "role": "planner",
      "actionCode": "CS",
      "state": "done",
      "sessionId": "a1b2c3d4",
      "fullSessionId": "a1b2c3d4-...",
      "durationLabel": "8m",
      "projectSlug": "app.supportsignal.com.au",
      "contextPercent": 22,
      "model": "claude-opus-4-6",
      "verdict": null,
      "predicatesFired": ["P18", "P19"],
      "extractors": {
        "E01": "/bmad-sm",
        "E02": "CS 5.1"
      }
    }
  ],
  "backtrackArrows": [],
  "oversightSessions": [
    {
      "sessionId": "sentinel-001",
      "observingSteps": [3, 4],
      "agentName": "Sentinel"
    }
  ]
}
```

#### Agent Metadata Profile

```json
{
  "agentName": "Nate",
  "role": "reviewer",
  "color": "#5a9a3c",
  "avatarLetter": "N",
  "actions": ["DR"],
  "typicalContextPercent": "30-50",
  "freshWindowRequired": true,
  "differentModelRecommended": true,
  "subAgents": [
    "Code Quality",
    "Test Coverage",
    "Security",
    "Architecture",
    "Documentation",
    "Summary"
  ],
  "outputs": ["Review Intelligence section", "Delivery Review section"],
  "verdictTypes": ["PASS", "CONDITIONAL PASS", "REJECT"]
}
```

---

## 9. Relationship to Existing Views

The wave visualization fits into AngelEye's progressive disclosure hierarchy:

```
Level 0: Observer (flat session list — existing)
Level 1: Sprint Board (Kanban — all active stories as cards)
Level 2: Wave Visualization (this document — single story lifecycle)
Level 3: Session Detail (existing Observer event feed, enriched)
```

**Entry points to the wave view:**

- Click a story card on the Sprint Board → opens wave for that story
- Direct URL: `/wave/{storyId}` (e.g., `/wave/5.1`)
- From Observer: click a session that belongs to an affinity group → opens wave with that step highlighted

**Exit points from the wave view:**

- Click an agent step → drill down to Level 3 Session Detail
- Breadcrumb: Sprint Board > Epic 5 > Story 5.1
- Back button → returns to Sprint Board

---

## 10. Validation Strategy

### Phase 1: Static Mockup (Mochaccino)

Build 3-4 HTML mockups using Mochaccino with manually constructed JSON data:

1. **Story 2.4 — Clean run**: 8 steps, 4 done, 1 active, 3 pending, 0 backtracks (use existing `_default.json` sample data)
2. **Story 2.3 — With backtrack**: DR returns CONDITIONAL PASS, DS₂ and DR₂ appear, curved return arrow visible
3. **Story 0.2 — Ceremony reduction**: Epic 0 story that skips VS and SAT, showing skipped nodes
4. **Story 2.4 — Full audit panel**: Same wave but focused on the right panel showing predicates, observations, classifications, and extractions for the active DR step

### Phase 2: Story 2.4 Provenance

Read the actual JSONL session files for Story 2.4's completed steps. Parse them to populate the wave view with real data. Verify that:

- Agent names are correctly detected from trigger commands
- Step ordering matches the actual execution sequence
- Duration and context usage are accurate
- Tool call summaries are readable

### Phase 3: Story 2.5 (End of Epic 2)

Run Story 2.5 through the full BMAD lifecycle with AngelEye hooks active. This is the live test — the wave visualization should update in real-time as each agent completes.

### Phase 4: Epic 2 Retrospective

Use the wave visualization to display all of Epic 2's stories side by side (Sprint Board view) and drill into individual story waves. This proves out the full progressive disclosure hierarchy.

---

## 11. Menu / Navigation

The wave visualization adds a new entry to AngelEye's sidebar navigation:

| Nav Item      | Icon | View                                    |
| ------------- | ---- | --------------------------------------- |
| Observer      | 👁   | Flat session list (existing)            |
| Organiser     | 📋   | Classified grid (existing)              |
| **Workflows** | 🔄   | Sprint Board → Wave Visualization (new) |
| Settings      | ⚙    | Preferences (existing)                  |

"Workflows" is the umbrella name. It defaults to the Sprint Board (Level 1), from which you drill into individual Wave views (Level 2).

---

## 12. External Roles

Beyond the core BMAD agents in the wave, three external roles interact with the system:

### Sentinel (Overwatch)

- Runs in parallel to the wave, not as a step within it
- Monitors multiple active waves simultaneously
- Coordinates inter-agent communication when agents can't directly talk to each other
- Shown as floating badges beneath the steps it observes
- Future: may have its own panel view showing all waves it's watching

### Advisor

- Documentation-focused guidance role
- Provides context about existing patterns, KDD entries, and architectural decisions
- Not always present — activated when Lisa or Amelia need domain knowledge
- Shown as a secondary badge (book icon) on steps where active

### Relay Team

- Meta-role for improving the workflow structure itself
- Analyzes completed waves to suggest: ceremony reductions, step reordering, handover template improvements
- Not visualized in real-time — outputs appear as retrospective annotations on completed waves

---

## 13. Implementation Priority

1. **Mochaccino mockups** (immediate) — 3-4 HTML files with hardcoded then API-driven data
2. **Agent metadata profiles** (JSON config, ~30 min manual authoring)
3. **Wave bar component** (React) — horizontal step nodes with state styling
4. **Three-panel layout** (React) — left/center/right responsive panels
5. **Audit log panel** (React) — four-section intelligence display
6. **Socket.io streaming** — live transcript + predicate updates for active steps
7. **Backtrack SVG rendering** — curved return arrows
8. **Sub-agent collapsible blocks** — nested transcript rendering
9. **Handover controls** — copy/send/backtrack buttons with clipboard integration
10. **Sprint Board integration** — card click → wave view navigation

---

## Appendix A: CSS Design Tokens

Consistent with existing AngelEye Mochaccino mockups:

```css
--bg: #e8e0d4; /* Linen background */
--bg-card: #f5f0e8; /* Card surface */
--primary: #c8841a; /* Amber accent */
--text: #3a3530; /* Primary text */
--text-muted: #8a8580; /* Secondary text */
--green: #5a9a3c; /* Done / success */
--amber: #d4860a; /* Active / warning */
--red: #c05040; /* Failed / error */
--blue: #4a7fb5; /* Bob */
--orange: #c07030; /* Amelia */
--green-agent: #5a9a3c; /* Nate */
--purple: #8a6ab5; /* Taylor */
--pink: #b56a8a; /* Lisa */
--gray-agent: #8a8a8a; /* Ship */
--font-brand: 'Bebas Neue', sans-serif;
--font-body: system-ui, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', monospace;
```

## Appendix B: Signals AngelEye Must Capture

1. Story status transitions in sprint-status.yaml
2. DR verdict (PASS / CONDITIONAL PASS / REJECT)
3. SAT pass/fail count
4. Context usage at session end
5. Backtrack events (DR→DS→DR cycles)
6. Epic 0 injection points
7. Agent model used per step (bias isolation verification)
8. Time per step
9. KDD recurrence counts (threshold: 3 triggers pattern promotion)
10. Deferred DR items (may trigger Epic 0 interleave)
