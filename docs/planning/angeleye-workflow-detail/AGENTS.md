# AGENTS.md — AngelEye Workflow Detail

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Make workflow rows clickable — pipeline visualization with station nodes, agent avatars, session chat panel. Fix list view data accuracy.

---

## Build & Run Commands

```bash
# From repo root
npm run build --workspace shared   # Must run if shared types change
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` from `server/src/helpers/response.ts` — NOT `apiError`
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- All service files live in `server/src/services/`
- All route files live in `server/src/routes/`
- All imports use `.js` extension (ESM — do not use `.ts` in imports)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Views live in `client/src/views/`** not `client/src/pages/`
- **Components live in `client/src/components/`**
- **Nav config** lives in `client/src/config/nav.ts`
- **View routing** lives in `client/src/components/ContentPanel.tsx` (viewMap record)
- **Scroll pattern**: All views use `h-full min-h-0 overflow-y-auto` on the outermost scrollable container
- **All hooks before any early return** — React invariant, enforced by `.claude/rules/react-hooks.md`
- **Test baseline**: 38 test files, 626 tests (573 server + 53 client), all passing. Do not break existing tests.

---

## Directory Structure (this campaign)

```
# Client — new files
client/src/components/WorkflowPipeline.tsx          ← WU02: pipeline component
client/src/components/SessionEventsPanel.tsx         ← WU04: session events panel
client/src/views/WorkflowDetailView.tsx              ← WU03: detail view (assembles WU02+WU04)

# Client — patches
client/src/views/WorkflowsView.tsx                   ← WU01: list fixes + row click

# Server — patches
server/src/services/workflow-router.service.ts       ← WU05: station completion
server/src/services/workflow-router.service.test.ts  ← WU05: completion tests
```

---

## Existing Functions to Reuse (DO NOT reimplement)

### workflow.service.ts

```typescript
import { readWorkflows, createWorkflow, updateWorkflow, getWorkflow } from './workflow.service.js';
```

### workflow-type.service.ts

```typescript
import { getWorkflowTypes, getWorkflowType } from './workflow-type.service.js';
```

### registry.service.ts

```typescript
import { readRegistry } from './registry.service.js';
```

### sessions.service.ts

```typescript
import { getSessionEvents } from './sessions.service.js';
// Returns: AngelEyeEvent[] — all events for a session from JSONL
```

### useWorkflows hook (client)

```typescript
import { useWorkflows } from '../hooks/useWorkflows.js';
// Returns: { data: { workflows, types }, loading, error, refresh }
```

### Session events API

```
GET /api/sessions/:id/events → { status: 'ok', data: { events: AngelEyeEvent[] } }
```

---

## Shared Types (read from shared/src/angeleye.ts — do not redefine)

```typescript
// Key types for this campaign:
export type StationState = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'backtracked';
export type WorkflowStatus = 'not_started' | 'in_progress' | 'closed';

export interface StationConfig {
  position: number;
  action_code: string;
  role: string;
  identity: string | null;
  requires_fresh_session: boolean;
  can_spawn_subagents: boolean;
  backtrack_target: boolean;
}

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

export interface AngelEyeEvent {
  event: string; // 'user_prompt', 'tool_use', 'stop', 'session_start', etc.
  timestamp: string;
  session_id: string;
  prompt?: string; // for user_prompt events
  tool?: string; // for tool_use events
  tool_summary?: Record<string, unknown>;
  reason?: string; // for stop events
  agent_type?: string; // for subagent_start events
  // ... other fields
}
```

---

## Pipeline Design Reference

The canonical mockup is at `.mochaccino/designs/chain-story-pipeline/index.html`. Read this file for CSS patterns.

### Agent Avatar Colors (from mockup CSS)

```
--blue: #4a7fb5       → Bob (planner)        → avatar initial "B"
--green: #5a9a3c      → Amelia (builder)     → avatar initial "A"
--orange: #c07030     → Nate (reviewer)      → avatar initial "N"
--purple: #8a6ab5     → Taylor (tester)      → avatar initial "T"
--pink: #b56a8a       → Lisa (advisor)       → avatar initial "L"
--gray-agent: #8a8a8a → shipper (no identity)→ avatar initial "S"
```

### Station State Styling (from mockup CSS)

```
done:     border-color: var(--green-light), green checkmark badge top-right
active:   border-color: var(--primary), elevated shadow, scale(1.04), pulse dot
pending:  opacity: 0.45, border-color: var(--border)
```

### Connector Pattern

Solid arrow between done→done stations, dashed arrow towards pending. 40px wide flex items between step nodes.

### Linen Palette (project-wide)

```
--bg-page: #e8e0d4
--bg-surface: #ede7dc
--bg-card: #f5f1eb
--accent-amber: #c8841a (primary)
--fg: #2a2018
--muted: #7a6e5e
```

Use Tailwind classes where possible. For custom colors, use inline styles or CSS variables.

---

## WU01 — List View Fixes

### What to change in `client/src/views/WorkflowsView.tsx`:

1. **Fix `progressLabel()`**: Change from counting `completed` stations to counting stations with sessions:

   ```typescript
   function progressLabel(workflow: WorkflowInstance): string {
     const active = workflow.stations.filter((s) => s.session_ids.length > 0).length;
     return `${active}/${workflow.stations.length} stations`;
   }
   ```

2. **Add re-seed button** in the header bar (next to Refresh), always visible:

   ```tsx
   <button onClick={handleSeed} disabled={seeding}>
     {seeding ? 'Syncing...' : 'Sync Sessions'}
   </button>
   ```

   Extract the seed logic from the empty state into a named async function `handleSeed`.

3. **Add row click handler**: Add `selectedWorkflowId` state. When set, render `WorkflowDetailView` instead of the table. Pass a `onBack` callback to return to the list.

   ```tsx
   const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
   // ...
   if (selectedWorkflowId) {
     const wf = workflows.find((w) => w.instance_id === selectedWorkflowId);
     const wfType = wf ? typeMap.get(wf.workflow_type_id) : undefined;
     return (
       <WorkflowDetailView workflow={wf} type={wfType} onBack={() => setSelectedWorkflowId(null)} />
     );
   }
   ```

4. **Make rows clickable**: Add `cursor-pointer` and `onClick={() => setSelectedWorkflowId(wf.instance_id)}` to each `<tr>`.

### Tests: Update existing WorkflowsView tests if any, or verify no regressions.

---

## WU02 — Pipeline Component

### File: `client/src/components/WorkflowPipeline.tsx`

**Props:**

```typescript
interface WorkflowPipelineProps {
  workflow: WorkflowInstance;
  type: WorkflowType;
  selectedStation: number | null; // position of selected station
  onStationClick: (position: number) => void;
}
```

**Renders**: A horizontal flex row of station nodes connected by arrows.

**Per station node** (derive from `workflow.stations[i]` + `type.stations[i]`):

- Colored circle avatar with agent initial (from `StationConfig.identity`)
- Agent name below avatar
- Action code in large text (font-bebas)
- Duration if available (`station.duration_ms` or compute from `started_at`)
- Session count badge if `session_ids.length > 1`
- State badge (top-right corner): green checkmark (done), amber pulse dot (active/in_progress), gray circle (pending/not_started)
- Selected station has highlighted border (use `selectedStation` prop)

**Between nodes**: Connector arrows (solid for done→done, dashed otherwise). Use SVG or CSS borders.

**Identity-to-color mapping**: Build a `const identityColor: Record<string, string>` map from the avatar colors above. Fall back to gray for unknown identities.

**No test file needed for this component** — it's a presentational component with no logic.

---

## WU03 — Workflow Detail View

### File: `client/src/views/WorkflowDetailView.tsx`

**Props:**

```typescript
interface WorkflowDetailViewProps {
  workflow: WorkflowInstance;
  type: WorkflowType;
  onBack: () => void;
}
```

**Layout** (vertical split):

```
┌─────────────────────────────────────────┐
│ ← Back to Workflows                     │  ← breadcrumb/back button
│ Story 2.4 — 2.4                         │  ← work_item_label + work_item_id
│ Regular Story · bmad-v6 · In Progress   │  ← type name + domain + status pill
├─────────────────────────────────────────┤
│ [Pipeline Component — WU02]             │  ← fixed height ~200px
├─────────────────────────────────────────┤
│ [Session Events Panel — WU04]           │  ← fills remaining height, scrollable
└─────────────────────────────────────────┘
```

**State**: `selectedStation` (number | null) — defaults to `workflow.current_station`.

**Behavior**:

- Pipeline renders all stations; clicking one sets `selectedStation`
- Session panel loads events for `workflow.stations[selectedStation].session_ids[0]`
- If station has multiple sessions, show a tab bar above the events panel
- If station has no sessions, show "No sessions for this station"

**Scroll pattern**: Outer div `h-full min-h-0 flex flex-col`. Pipeline section `shrink-0`. Events panel `flex-1 overflow-y-auto min-h-0`.

---

## WU04 — Session Events Panel

### File: `client/src/components/SessionEventsPanel.tsx`

**Props:**

```typescript
interface SessionEventsPanelProps {
  sessionId: string | null;
  sessionIds?: string[]; // for multi-session tab bar
  onSessionChange?: (id: string) => void;
}
```

**Data fetching**: `GET /api/sessions/${sessionId}/events` — use `useState` + `useEffect` pattern (no React Query).

**Event rendering**: Simplified version of Observer's event display. For each event:

- `user_prompt`: Right-aligned bubble with prompt text, timestamp
- `tool_use`: Compact line with tool name + summary
- `stop`: Subtle line with "Session ended" or stop reason
- `session_start` / `session_end`: Divider lines
- `subagent_start` / `subagent_stop`: Indented sub-agent markers

**Do NOT copy-paste from ObserverView.** Extract the rendering logic into clean, focused components. The Observer's `buildFocusRows` is ~150 lines of complex grouping. For the workflow panel, a simpler flat list is sufficient:

```tsx
events.map((ev) => <EventRow key={ev.timestamp} event={ev} />);
```

**Multi-session tabs** (when `sessionIds` has > 1 entry):

```tsx
<div className="flex gap-1 border-b border-border px-4 py-1">
  {sessionIds.map((id, i) => (
    <button
      key={id}
      onClick={() => onSessionChange?.(id)}
      className={
        id === sessionId ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
      }
    >
      Session {i + 1}
    </button>
  ))}
</div>
```

**Empty state**: When `sessionId` is null, show "Select a station to view its session."

---

## WU05 — Station Completion Enrichment

### File: `server/src/services/workflow-router.service.ts`

**Change**: After associating sessions with stations in `seedWorkflowsFromRegistry`, cross-reference registry entries to detect completed stations.

**Logic** (add after the session-association loop, before `updateWorkflow`):

```typescript
// Check if stations should be marked completed
for (const station of stations) {
  if (station.state === 'in_progress' && station.session_ids.length > 0) {
    const allEnded = station.session_ids.every((sid) => {
      const entry = registry[sid];
      return entry && entry.status === 'ended';
    });
    if (allEnded) {
      station.state = 'completed';
      station.completed_at = station.completed_at ?? new Date().toISOString();
      // Compute duration from first started_at to last session's last_active
      if (station.started_at && !station.duration_ms) {
        const lastActive = station.session_ids
          .map((sid) => registry[sid]?.last_active)
          .filter(Boolean)
          .sort()
          .pop();
        if (lastActive) {
          station.duration_ms =
            new Date(lastActive).getTime() - new Date(station.started_at).getTime();
        }
      }
    }
  }
}
```

**Also update workflow status**: If all stations with sessions are completed:

```typescript
const allStationsComplete = stations
  .filter((s) => s.session_ids.length > 0)
  .every((s) => s.state === 'completed');
if (allStationsComplete && stations.some((s) => s.session_ids.length > 0)) {
  workflow.status = 'closed' as WorkflowStatus;
}
```

**The `registry` variable**: The registry is already read at the top of `seedWorkflowsFromRegistry`. Pass the entries map into the completion check.

### Tests to add:

1. Station with all ended sessions → state becomes `completed`, `completed_at` set
2. Station with mix of ended and active sessions → stays `in_progress`
3. Workflow with all populated stations completed → status becomes `closed`
4. Duration computation from `started_at` to `last_active`

---

## Anti-Patterns to Avoid

- **Do not use `console.log`** — use `logger`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()`
- **Do not add React Query** — project doesn't use it
- **Do not place hooks after early returns** — all hooks before any conditional return
- **Do not put views in `client/src/pages/`** — use `client/src/views/`
- **Do not put components in `client/src/views/`** — use `client/src/components/`
- **Do not copy-paste from ObserverView** — extract clean, focused rendering
- **Do not create a new nav item** — detail view replaces list view conditionally
- **Do not add URL routing** — use React state for list↔detail toggle
- **Do not forget `h-full min-h-0 overflow-y-auto`** on scrollable containers
- **Do not hardcode station mappings** — derive from workflow type config
- **Do not use inline async handlers in JSX** — extract to named functions

---

## Success Criteria (all work units)

1. `npm run typecheck` clean
2. `npm test` — all tests passing (626 baseline + new tests)
3. `npm run lint` clean
4. Click a workflow row → see pipeline with 9 station nodes
5. Station nodes show correct agent avatar, action code, and state
6. Click a station → session events panel loads that station's transcript
7. Back button returns to workflow list
8. Progress column shows stations with sessions, not just "completed"
9. Sync Sessions button visible in header when workflows exist
10. Stations with all ended sessions marked as `completed`

---

## Learnings from Prior Campaigns

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: write to `.tmp` then `rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- All server imports use `.js` extension (ESM)
- Agents must commit their changes — don't leave uncommitted
- Rebuild shared (`npm run build --workspace shared`) after changing shared types
- **Hook error handling**: always check `!res.ok` before `.json()`, and add `else` branch when `json.status !== 'ok'`
- **enqueueWrite re-throw pattern**: `writeQueue = result.catch(() => {})` keeps queue alive, `return result` lets caller see the error
- **Linen palette**: `--bg-page: #e8e0d4`, `--bg-surface: #ede7dc`, `--bg-card: #f5f1eb`, `--accent-amber: #c8841a`
- **import.meta.dirname** works in ESM for resolving paths relative to the source file
- **Hardcoded types in client drift silently** — import from shared package
- **Scroll pattern is mandatory** — every view needs `h-full min-h-0 overflow-y-auto` on the outer container
- **Only 1 of 4 agents auto-committed in Phase 2b** — agents MUST commit after completing their work unit
- **Read actual files before designing data shapes** — design from memory causes correction passes
- **Shallow clone mutation** — always deep-clone station objects before mutating: `{ ...station, session_ids: [...station.session_ids] }`
- **Seed mutex** — `seedInProgress` flag prevents concurrent seed calls
- **Pre-existing test failures** — check ALL test suites (server + client) not just one workspace
- **Brand name is "AngelEYE"** not "AngelEye" — the EYE portion is uppercase in the header
