# AGENTS.md — AngelEye Workflow Router

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Build the session-to-station router — creates workflow instances from existing BMAD session data, associates sessions with stations, and makes the Workflows page show real data.

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
- **Nav config** lives in `client/src/config/nav.ts`
- **View routing** lives in `client/src/components/ContentPanel.tsx` (viewMap record)
- **Scroll pattern**: All views use `h-full min-h-0 overflow-y-auto` on the outermost scrollable container
- **Test baseline**: 36 test files, all passing. Do not break existing tests.

---

## Directory Structure (this campaign)

```
# Server — new files
server/src/services/workflow-router.service.ts          ← WU01: routing logic
server/src/services/workflow-router.service.test.ts     ← WU03: router unit tests

# Server — patches
server/src/routes/workflows.ts                          ← WU02: add POST /api/workflows/seed
server/src/routes/workflows.test.ts                     ← WU03: extend with seed endpoint tests

# Client — patches
client/src/views/WorkflowsView.tsx                      ← WU04: add seed button to empty state
```

---

## Existing Functions to Reuse (DO NOT reimplement)

### workflow.service.ts

```typescript
import { readWorkflows, createWorkflow, updateWorkflow, getWorkflow } from './workflow.service.js';
// createWorkflow({ workflow_type_id, work_item_id, work_item_label, project_dir?, stations })
// updateWorkflow(instanceId, partialUpdates) — merges and writes atomically
// readWorkflows() → WorkflowInstance[]
```

### workflow-type.service.ts

```typescript
import { getWorkflowTypes, getWorkflowType } from './workflow-type.service.js';
// getWorkflowType('regular_story') → WorkflowType with stations[]
// Each station has: position, action_code, role, identity
```

### registry.service.ts

```typescript
import { readRegistry } from './registry.service.js';
// Returns: Record<string, RegistryEntry> — the full registry from disk (not paginated)
```

---

## Routing Logic — The Core Algorithm

### Step 1: Parse `workflow_action`

Every routable BMAD session has a `workflow_action` field like `"DS 2.2"` or `"wn"`.

```typescript
function parseAction(
  action: string | null | undefined
): { actionCode: string; storyId: string | null } | null {
  if (!action) return null;
  const trimmed = action.trim();
  // "wn" or "WN" → gatekeeper, no story
  if (trimmed.toLowerCase() === 'wn') return { actionCode: 'WN', storyId: null };
  // "DS 2.2" → actionCode=DS, storyId=2.2
  const parts = trimmed.split(/\s+/, 2);
  if (parts.length === 2) return { actionCode: parts[0]!.toUpperCase(), storyId: parts[1]! };
  // Single token that's not "wn" — try as action code without story
  return { actionCode: trimmed.toUpperCase(), storyId: null };
}
```

### Step 2: Map (role + actionCode) to station action_code

The `workflow_role` field disambiguates which station. This is critical because "CS" from a tester is SAT-CS, not CS.

```typescript
// Build from the workflow type config's stations array
// For regular_story:
//   planner + WN → WN     (position 0)
//   planner + CS → CS     (position 1)
//   planner + VS → VS     (position 2)
//   builder + DS → DS     (position 3)
//   reviewer + DR → DR    (position 4)
//   tester + CS → SAT-CS  (position 5)
//   tester + RA → SAT-RA  (position 6)
//   advisor + CU → CU     (position 7)
//   shipper + * → SHIP    (position 8)
```

Build a lookup map from the workflow type's stations:

- For each station, the key is `{station.role}:{station.action_code}`
- Special cases for compound action codes: SAT-CS has role=tester, so the lookup key is `tester:CS` (strip the SAT- prefix from the station code to get what the session reports)
- Shipper maps by role alone (action is null in session data)

**Concrete mapping function:**

```typescript
function buildStationMap(type: WorkflowType): Map<string, StationConfig> {
  const map = new Map<string, StationConfig>();
  for (const station of type.stations) {
    // Standard: role:action_code
    map.set(`${station.role}:${station.action_code}`, station);
    // For SAT-* stations, also map role:suffix (e.g. tester:CS for SAT-CS)
    if (station.action_code.startsWith('SAT-')) {
      const suffix = station.action_code.slice(4);
      map.set(`${station.role}:${suffix}`, station);
    }
    // For shipper, also map role alone (sessions may have null action)
    if (station.role === 'shipper') {
      map.set(`${station.role}:`, station);
    }
  }
  return map;
}
```

Lookup: `stationMap.get(\`${role}:${actionCode}\`)`— if not found, try`stationMap.get(\`${role}:\`)`.

### Step 3: Find or create workflow instance

- Group routable sessions by storyId
- For each storyId, check if a workflow instance already exists with that work_item_id
- If not, create one via `createWorkflow()` with workflow_type_id = 'regular_story'
- work_item_label = `"Story ${storyId}"`

### Step 4: Associate sessions with stations

For each session routed to a station:

- Find the station in the workflow instance by position
- Add the session_id to station.session_ids (if not already there — idempotency)
- If session_ids was empty, mark station state as 'in_progress', set started_at
- Update workflow status to 'in_progress' if it was 'not_started'
- Update current_station to the highest in-progress or completed position
- Save via `updateWorkflow()`

### Step 5: Return summary

```typescript
interface SeedResult {
  workflows_created: number;
  workflows_updated: number;
  sessions_routed: number;
  sessions_unroutable: number;
  unroutable_reasons: Array<{ session_id: string; reason: string }>;
}
```

---

## Data Available in Registry Entries

Every registry entry has these fields (relevant to routing):

```typescript
interface RegistryEntry {
  session_id: string;
  trigger_command?: string | null; // e.g. "bmad-dev", "bmad-sm", "bmad-sat"
  trigger_arguments?: string | null; // raw args (not used for routing — workflow_action is cleaner)
  workflow_role?: string | null; // "builder", "planner", "tester", "reviewer", "advisor", "shipper", "observer"
  workflow_identity?: string | null; // "Amelia", "Bob", "Taylor", "Nate", "Lisa", null
  workflow_action?: string | null; // "DS 2.2", "CS 0.2", "wn", "DR 2.3", null
  started_at?: string;
  // ... many other fields not needed for routing
}
```

**A session is routable if**: `trigger_command` starts with `"bmad"` AND `workflow_action` is truthy.

**Unroutable BMAD sessions** (log but don't fail):

- `bmad-oversight` — observer role, no story
- `bmad-relay` — no role/action
- `bmad-retrospective` — no role/action
- `bmad-ship` — shipper but no story_id (could be associated by temporal proximity later)
- Any bmad-\* session with null workflow_action

---

## Existing Workflow Config — Regular Story (9 stations)

```
Position 0: WN      role=planner    identity=Bob
Position 1: CS      role=planner    identity=Bob
Position 2: VS      role=planner    identity=Bob
Position 3: DS      role=builder    identity=Amelia
Position 4: DR      role=reviewer   identity=Nate
Position 5: SAT-CS  role=tester     identity=Taylor
Position 6: SAT-RA  role=tester     identity=Taylor
Position 7: CU      role=advisor    identity=Lisa
Position 8: SHIP    role=shipper    identity=null
```

---

## Real Data (what the seed will process)

From the live API (200-session page), 43 BMAD sessions exist:

**Routable (31 sessions across 6 stories):**

| Story | Sessions | Stations covered                          |
| ----- | -------- | ----------------------------------------- |
| 0.2   | 6        | CU, CS (SAT-CS), DR, DS, VS, CS (planner) |
| 2.2   | 4        | CS (SAT-CS), CU, DR, DS                   |
| 2.3   | 5        | CU, RA (SAT-RA), CS (SAT-CS), DS, DR      |
| 2.5   | 5        | CU, CS (SAT-CS), DR, DS, VS               |
| 2.6   | 5        | CU, CS (SAT-CS), VS, DS, DR               |
| 5.1   | 2        | VS, CS (planner)                          |

**Plus 3 WN gatekeeper sessions** (no story — not associated with any workflow instance).

**Unroutable (12 sessions):** oversight (2), relay (1), retrospective (1), ship (5), bmad-sm with null action (1), bmad-dr with null action (1), bmad-sm with story-only arg "2.3" (1).

Note: `bmad-sm 2.3` has workflow_action="2.3" which is just a story_id with no action_code. The router should handle this: if parsing yields no action_code but has a story_id, log as unroutable with reason "action code missing".

---

## Anti-Patterns to Avoid

- **Do not use `console.log`** — use `logger`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()`
- **Do not add React Query** — project doesn't use it
- **Do not place hooks after early returns** — all hooks before any conditional return
- **Do not put views in `client/src/pages/`** — use `client/src/views/`
- **Do not forget to export new types from `shared/src/index.ts`** if adding any
- **Do not read registry via API for seeding** — use `readRegistry()` directly from service (gets all entries, not paginated)
- **Do not create duplicate workflows on re-seed** — check for existing instance by work_item_id before creating
- **Do not duplicate session_ids in station arrays** — check before pushing
- **Do not hardcode station mappings** — derive from the workflow type config's stations array

---

## Success Criteria (all work units)

1. `npm run typecheck` clean
2. `npm test` — all tests passing (pre-existing pass count maintained + new tests)
3. `npm run lint` clean
4. `POST /api/workflows/seed` creates workflow instances from real registry data
5. `GET /api/workflows` returns populated workflow instances with sessions associated to stations
6. Re-running seed is idempotent — no duplicates
7. WorkflowsView shows real workflows with progress, status, current station, session counts
8. Unroutable sessions are logged, not errored
9. Router correctly disambiguates tester+CS → SAT-CS vs planner+CS → CS

---

## Learnings from Prior Waves

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: write to `.tmp` then `rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- All server imports use `.js` extension (ESM)
- Agents must commit their changes — don't leave uncommitted
- Rebuild shared (`npm run build --workspace shared`) after changing shared types
- **Hook error handling**: always check `!res.ok` before `.json()`, and add `else` branch when `json.status !== 'ok'`
- **enqueueWrite re-throw pattern**: `writeQueue = result.catch(() => {})` keeps queue alive, `return result` lets caller see the error
- **Config loader pattern**: workflow-type.service.ts is the canonical pattern for static JSON config loaders
- **Linen palette**: `--bg-page: #e8e0d4`, `--bg-surface: #ede7dc`, `--bg-card: #f5f1eb`, `--accent-amber: #c8841a`
- **import.meta.dirname** works in ESM for resolving paths relative to the source file (not process.cwd())
- **Delivery review caught real duplication early** — worth running at campaign completion
- **Wave parallelism works well at 2-3 agents/wave** — no conflicts when file ownership is clearly documented
- **stats.ts duplicated countByType logic** — 4/5 delivery review dimensions flagged this; always use shared functions
- **Hardcoded types in client drift silently** — import from shared package, derive constants from the type
- **Scroll pattern is mandatory** — every view needs `h-full min-h-0 overflow-y-auto` on the outer container
- **MockupsView.tsx is the ONLY mockup index** — never create standalone index.html files for mockup registration
- **Only 1 of 4 agents auto-committed in Phase 2b** — agents MUST commit after completing their work unit
- **Read actual files before designing data shapes** — design from memory causes correction passes
