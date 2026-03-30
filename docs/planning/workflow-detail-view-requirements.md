# Workflow Detail View — Requirements

**Status**: Requirements — ready for Extend planning
**Parent**: `docs/planning/workflow-feature-requirements.md` (R3.2, R3.3 scope)
**Provenance**: User feedback on 2026-03-30 after workflow router campaign delivery, gap analysis against chain-story-pipeline mockup
**Screenshots**: User provided 3 images — current list view, pipeline mockup (Story 2.4), chat panel mockup (BMAD-ADVISOR session)

---

## Context — What Exists Today

The **workflow router campaign** (2026-03-30) delivered:

- Session-to-station router: parses `workflow_action`, maps role+action to station, creates workflow instances
- Seed endpoint: `POST /api/workflows/seed` populates from existing registry
- List view: 7-column table (Work Item, Type, Status, Progress, Current Station, Sessions, Last Updated)
- 11 real workflows visible, 573+ tests passing

**What the user sees** (screenshot 1): A flat table with all workflows showing "In Progress" and "0/9 stations" progress. No drill-down. No way to create new workflows manually. "Last Updated" shows seed time, not session activity.

**What the user wants** (screenshots 2 & 3): Click a workflow row → see the pipeline with agent avatars, station states, durations, backtracks. Click a station → see the session's chat transcript below.

---

## Gap 1 — List View Fixes (data accuracy)

### G1.1 Progress shows "0/9 stations" for everything

**Problem**: `progressLabel()` counts `state === 'completed'` stations. The router marks stations as `in_progress` but nothing ever marks them `completed`. All populated stations show as 0/9.

**Fix**: Change progress to show stations with sessions: `"5/9 active"` or use a hybrid: `"3 done · 1 active · 5 pending"`. Or implement station completion detection (see G3).

### G1.2 Everything says "In Progress"

**Problem**: All workflows are `in_progress`. No lifecycle transition to `closed`. User knows only Story 5.1 is truly active — the rest are effectively done.

**Fix**: Implement workflow status inference (see G3). At minimum, show last-session age: if > 7 days with all stations populated, status could be "Stale" or "Likely Complete".

### G1.3 "Last Updated" is misleading

**Problem**: Shows `updated_at` on the workflow record (seed time), not the most recent session activity.

**Fix**: Compute `last_active` from the most recent `last_active` across all sessions in all stations. Requires a registry lookup at display time or a denormalized field on the workflow.

### G1.4 "Current Station" semantics

**Problem**: Shows highest-position station with sessions. For Story 0.2 this shows "CU — Lisa" (position 7), but Story 0.2 may be fully complete through CU. It's the "furthest reached" station, not the "currently active" one.

**Fix**: Show the station with the most recent session activity, not the highest position. Or show the first station that still has `state !== 'completed'`.

### G1.5 No re-seed button after initial seed

**Problem**: Seed button only appears in empty state. Once workflows exist, no way to pick up new sessions from the UI.

**Fix**: Add a "Sync Sessions" button in the header bar (next to Refresh). Delivery review already flagged this.

### G1.6 No manual workflow creation

**Problem**: No way to say "I'm starting Story 3.1 now" and create a blank workflow instance.

**Fix**: Add a "New Workflow" button → modal with: workflow type selector, work item ID, work item label. Calls `POST /api/workflows`.

---

## Gap 2 — Pipeline Detail View (R3.2)

This is the **primary deliverable**. Mockup reference: `chain-story-pipeline` design.

### G2.1 Row click navigation

Clicking a workflow row opens a detail view. Options:

- **Option A**: Replace list view with detail view (back button to return) — simpler, no routing changes
- **Option B**: Side panel (like Observer focus panel) — can compare workflows
- **Option C**: Full page with URL route — bookmarkable

**Recommendation**: Option A — replace content area, with a "← Back to Workflows" breadcrumb. Matches mockup pattern.

### G2.2 Pipeline component

Horizontal pipeline showing all stations as connected nodes:

- Each node shows: agent avatar (colored circle with initial), agent name, station action code (WN, CS, DS, etc.)
- Station states: **done** (green border, checkmark), **active** (amber border, pulse, elevated shadow), **pending** (grayed out, 45% opacity), **backtracked** (amber dashed border)
- Connectors between nodes: solid arrow (done→done), dashed arrow (towards pending)
- Duration display under active/completed stations
- Project slug under each station (from session's `project` field)

### G2.3 Station data display

Per station, show:

- `action_code` prominently (WN, CS, DS, DR, SAT-CS, SAT-RA, CU, SHIP)
- Agent identity (Bob, Amelia, Nate, Taylor, Lisa) with avatar
- Session count badge if > 1
- Duration (from `started_at` to `completed_at`, or elapsed if in progress)
- Sub-agent count badge (from `subagent_count`)
- Verdict badge for review/test stations (PASS, CONDITIONAL_PASS, REJECT)

### G2.4 Workflow header

Above the pipeline:

- Work item label + ID (e.g. "Story 2.4 — 2.4")
- Workflow type + domain (e.g. "bmad-v6 · 9 lifecycle steps")
- Affinity group (if known)
- Status pill (In Progress, Complete, Not Started)

---

## Gap 3 — Station Lifecycle & Completion

### G3.1 Station completion detection

A station should be marked `completed` when:

- Its session(s) have ended (all `status === 'ended'` in registry)
- For review stations (DR): verdict is PASS or station has no pending backtracks
- For test stations (SAT-CS, SAT-RA): similar verdict check

**Simpler initial approach**: A station with at least one session where `status === 'ended'` in the registry is `completed`. This can be computed at seed time or on-demand.

### G3.2 Workflow completion detection

A workflow is `closed` when:

- All stations that have sessions are `completed`
- The SHIP station has been reached, OR
- The highest station is CU/SHIP and its session has ended

**Even simpler**: If all non-pending stations have ended sessions and the workflow hasn't been touched in 24+ hours, infer it's done.

### G3.3 Backtrack detection (future — noted but not in scope for this campaign)

When DR returns CONDITIONAL_PASS, a backtrack record should be created. This requires event-level parsing from session transcripts — defer to a later campaign.

---

## Gap 4 — Chat Panel (R3.2 "live chat view")

### G4.1 Station session viewer

When clicking a station node in the pipeline:

- Show the session transcript below the pipeline
- Reuse Observer's event rendering (human messages, Claude responses, tool calls)
- If the station has multiple sessions, show a session selector tab bar

### G4.2 Data source

Session events are stored in JSONL files at `~/.claude/projects/<path>/<session_id>.jsonl`. The existing Observer view already reads and renders these via the events API (`GET /api/sessions/:id/events`).

The pipeline chat panel calls the same API, just scoped to the selected station's `session_ids[0]`.

### G4.3 Chat panel layout

Split the detail view vertically:

- **Top**: Pipeline visualization (fixed height, ~200px)
- **Bottom**: Chat panel (scrollable, takes remaining height)
- Station selector highlights which node is selected
- Click a different station → chat panel loads that station's session

### G4.4 Session metadata bar

At the top of the chat panel (matching mockup screenshot 3):

- Agent name + project context (e.g. "BMAD-ADVISOR · app.supportsignal.com.au")
- Session type badge (BUILD, PLAN, etc.)
- Session ID (truncated)
- Duration / tool call count / prompt count (from registry metadata)
- Note field (existing bookmark note if any)

---

## Gap 5 — Missing Data Fields

Fields in the schema that exist but aren't populated by the router:

| Field                      | Status       | Action Needed                             |
| -------------------------- | ------------ | ----------------------------------------- |
| `station.completed_at`     | Always null  | Set when session ends                     |
| `station.duration_ms`      | Always null  | Compute from session timestamps           |
| `station.context_used_pct` | Always null  | Parse from session events (future)        |
| `station.subagent_count`   | Always 0     | Parse from session events (future)        |
| `station.verdict`          | Always null  | Parse from DR/SAT session events (future) |
| `workflow.backtracks`      | Always empty | Requires event parsing (future)           |

**For this campaign**: Populate `completed_at` and `duration_ms` from registry session data. Defer `context_used_pct`, `subagent_count`, `verdict`, and `backtracks` — these require transcript parsing.

---

## Implementation Priority for Next Campaign

### Must Have (this campaign)

1. Pipeline visualization component (G2.2)
2. Row click → detail view navigation (G2.1)
3. Workflow header (G2.4)
4. Station data display (G2.3)
5. Fix progress display (G1.1)
6. Chat panel with session transcript (G4.1, G4.2, G4.3)

### Should Have (this campaign if time permits)

7. Station completion detection (G3.1)
8. Re-seed / sync button (G1.5)
9. Session metadata bar in chat panel (G4.4)
10. Fix "Last Updated" to use session activity (G1.3)

### Nice to Have (defer if needed)

11. Manual workflow creation (G1.6)
12. Workflow completion detection (G3.2)
13. Populate `completed_at` / `duration_ms` fields (Gap 5)

### Out of Scope (future campaigns)

- Backtrack visualization (R3.3) — requires transcript parsing
- Sub-agent panel (R3.5) — requires event-level parsing
- Out-of-workflow agents (R3.4) — Phase 4
- Socket real-time updates (R5.3) — not needed while seed-based
- Historical reconstruction from affinity groups

---

## Design Reference

- **Pipeline CSS/layout**: `.mochaccino/designs/chain-story-pipeline/index.html` — the canonical mockup
- **Chat panel pattern**: `.mochaccino/designs/chain-session-detail/index.html` — session enrichment view
- **Color palette**: Linen system (`--bg: #e8e0d4`, `--primary: #c8841a`, etc.)
- **Agent avatar colors**: Blue (Bob), Green (Amelia), Orange (Nate?), Purple (Taylor), Pink (Lisa)

---

**Created**: 2026-03-30
