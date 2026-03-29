# AGENTS.md — AngelEye Workflow Feature Phase 1

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Build Phase 1 of the Workflow feature — workflow type config loader, workflow instance CRUD, API endpoints, static Workflows list view, mock-views integration.

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
- Test isolation: `_setDataDir(tmpDir)` in `beforeEach`, `rm(testDir)` in `afterEach` (registry pattern)
- All service files live in `server/src/services/`
- All route files live in `server/src/routes/`
- All imports use `.js` extension (ESM — do not use `.ts` in imports)
- **Test baseline**: 401 server tests (7 pre-existing failures in env.test.ts + backfill — ignore), 42 client tests (2 pre-existing failures — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces live at `~/.claude/angeleye/` — workflows.json goes here too
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- Env vars validated via Zod in `server/src/config/env.ts`
- `.env` loaded from monorepo root (parent of server/)
- `process.cwd()` is `server/` when nodemon runs — monorepo root is `path.resolve(process.cwd(), '..')`
- Routes are mounted in `server/src/index.ts` — follow existing patterns
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- Workflow type configs live in `server/src/config/workflows/*.json` — static, loaded at startup
- **Station terminology**: always "station", never "step"

---

## Existing Types (already in shared/src/angeleye.ts — DO NOT recreate)

```typescript
// Configuration types
type CeremonyLevel = 'full' | 'reduced' | 'minimal';
type StationState = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'backtracked';
type WorkflowStatus = 'not_started' | 'in_progress' | 'closed';

interface SkipRule {
  station_action: string;
  condition: string;
}
interface StationConfig {
  position: number;
  action_code: string;
  role: string;
  identity: string | null;
  requires_fresh_session: boolean;
  can_spawn_subagents: boolean;
  backtrack_target: boolean;
}
interface WorkflowType {
  id: string;
  name: string;
  domain: string;
  stations: StationConfig[];
  ceremony_level: CeremonyLevel;
  skip_rules: SkipRule[];
}

// Runtime types
interface StationInstance {
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
interface BacktrackRecord {
  from_station: number;
  to_station: number;
  reason: string;
  timestamp: string;
}
interface WorkflowInstance {
  instance_id: string;
  workflow_type_id: string;
  work_item_id: string;
  work_item_label: string;
  status: WorkflowStatus;
  current_station: number;
  created_at: string;
  updated_at: string;
  stations: StationInstance[];
  backtracks: BacktrackRecord[];
  metadata: Record<string, unknown>;
}
```

Import from `@appystack/shared` (the shared package name).

---

## Existing File Structure (relevant to this campaign)

```
server/src/
├── config/
│   ├── env.ts
│   ├── logger.ts
│   └── workflows/              ← 3 JSON configs (already exist)
│       ├── bmad-regular-story.json
│       ├── bmad-lightweight-story.json
│       └── bmad-epic-zero.json
├── helpers/
│   └── response.ts             ← apiSuccess(), apiFailure(), apiSuccessWithSource()
├── routes/
│   ├── sessions.ts             ← reference pattern for CRUD routes
│   ├── workspaces.ts           ← reference pattern for CRUD routes
│   ├── mock-views.ts           ← reference pattern for mock-views endpoints
│   └── ...
├── services/
│   ├── registry.service.ts     ← reference: atomic write, serial queue, _setDataDir
│   ├── workspace.service.ts    ← reference: CRUD pattern (read, create, update, delete)
│   ├── mock-views.service.ts   ← reference: view model reshaping
│   └── ...
└── index.ts                    ← app setup + route mounting

client/src/
├── components/
│   ├── Header.tsx
│   └── ContentPanel.tsx        ← viewMap — add WorkflowsView here
├── config/
│   └── nav.ts                  ← navConfig — add 'workflows' item here
├── hooks/
│   ├── useSocket.ts            ← reference: plain fetch pattern
│   └── useServerStatus.ts      ← reference: plain fetch pattern
├── pages/
│   ├── ObserverView.tsx        ← reference for view structure
│   └── OrganiserView.tsx       ← reference for view structure
└── styles/
    └── index.css               ← linen palette, amber primary
```

---

## Reference Patterns

### Atomic Write (from registry.service.ts)

```typescript
import { readFile, writeFile, rename, mkdir } from 'fs/promises';

let _baseDir: string = join(homedir(), '.claude', 'angeleye');

export function _setDataDir(dir: string): void {
  _baseDir = dir;
  writeQueue = Promise.resolve();
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn).catch((err) => {
    logger.error({ err }, 'Write failed — queue continues');
  });
  return writeQueue;
}

// Atomic: write .tmp then rename
const tmp = filePath + '.tmp';
await writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
await rename(tmp, filePath);
```

### Route Pattern (from workspaces.ts)

```typescript
import { Router } from 'express';
const router = Router();

router.get('/api/workspaces', async (_req, res, next) => {
  try {
    const workspaces = await readWorkspaces();
    return apiSuccess(res, { workspaces });
  } catch (err) {
    next(err);
  }
});

router.post('/api/workspaces', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return apiFailure(res, 'name is required', 400);
    }
    const ws = await createWorkspace(name);
    return apiSuccess(res, ws);
  } catch (err) {
    next(err);
  }
});

export default router;
```

### Route Mounting (from index.ts)

```typescript
import workspacesRouter from './routes/workspaces.js';
app.use(workspacesRouter); // Router handles its own /api/workspaces prefix
```

### Nav Config (from client/src/config/nav.ts)

```typescript
export const navConfig: NavConfig = [
  {
    label: 'Main',
    items: [
      { key: 'observer', label: 'Observer', tier: 'primary' },
      { key: 'organiser', label: 'Organiser', tier: 'primary' },
      // ADD: { key: 'workflows', label: 'Workflows', tier: 'primary' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'settings', label: 'Settings', tier: 'secondary' },
      { key: 'mockups', label: 'Mockups', tier: 'secondary' },
    ],
  },
];
```

### ContentPanel viewMap (from client/src/components/ContentPanel.tsx)

```typescript
const viewMap: Record<string, React.ComponentType> = {
  observer: ObserverView,
  organiser: OrganiserView,
  settings: SettingsView,
  mockups: MockupsView,
  // ADD: workflows: WorkflowsView,
};
```

### Mock-Views Endpoint Pattern (from mock-views.ts)

```typescript
router.get('/api/mock-views/workflows', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getWorkflowsView();
      if (data.totalCount > 0) {
        return apiSuccessWithSource(res, data, 'live');
      }
    }
    const sample = await loadSample('workflows');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getWorkflowsView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: workflows failed');
    next(err);
  }
});
```

### Client Hook Pattern (from useServerStatus.ts)

```typescript
export function useWorkflows() {
  const [data, setData] = useState<WorkflowsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/workflows');
        const json = await res.json();
        if (mounted && json.status === 'ok') setData(json.data);
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
}
```

---

## Anti-Patterns to Avoid

- **Do not recreate shared types** — WorkflowType, WorkflowInstance, etc. already exist in `shared/src/angeleye.ts`
- **Do not use `exec()`** — always `execFile()` for any shell commands
- **Do not add React Query** — project doesn't use it; plain fetch + useState + useEffect
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `console.log`** — use `logger` from `server/src/config/logger.js`
- **Do not write to `server/src/` at runtime** — nodemon watches it, causes restart loops
- **Do not call it "step"** — always "station"
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()` / `apiSuccessWithSource()`
- **Do not touch existing services** (registry, workspace, sync, backfill, etc.) unless explicitly required

---

## Success Criteria (all work units)

1. `npm run typecheck` clean (server + client + shared)
2. `npm test` — server 401+ passing (ignore 7 pre-existing failures), client 42+ passing (ignore 2 pre-existing failures)
3. `npm run lint` clean
4. No `console.log` in server code — use `logger`
5. All imports use `.js` extension (ESM)
6. Response helpers: `apiSuccess()` and `apiFailure()` — never `apiError` or raw `res.json()`
7. New functionality has at least one test covering it
8. Atomic writes for any file persistence (write .tmp, rename)

---

## Learnings from Prior Waves

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: write to `.tmp` then `rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- All server imports use `.js` extension (ESM)
- Agents must commit their changes — don't leave uncommitted
- Rebuild shared (`npm run build --workspace shared`) after changing shared types
- Header is minimal (branding left, version right)
- CSS variables are in `client/src/styles/index.css` — linen palette, amber primary
- Existing hooks (useSocket, useServerStatus) use plain fetch — follow the same pattern
- Nav uses `NavContext` — state-based routing, no URL router
- ContentPanel viewMap maps nav keys to components — add entry there
- Mock-views pattern: live data first, sample JSON fallback, `apiSuccessWithSource()` for provenance
- `wantsSample(req)` checks `?sample=true` query param
- `loadSample(name)` reads from `.mochaccino/samples/{name}.json`
- Workflow type configs are pure JSON in `server/src/config/workflows/` — match the WorkflowType interface exactly
- **Hook error handling**: always check `!res.ok` before `.json()`, and add `else` branch when `json.status !== 'ok'` — silent null data is worse than an error message
- **enqueueWrite re-throw pattern**: `writeQueue = result.catch(() => {})` keeps queue alive, `return result` lets caller see the error. Both are needed.
- **Workflow types already exported from shared**: `@appystack/shared` re-exports all workflow types (WorkflowType, WorkflowInstance, StationInstance, etc.) — no need for agents to modify shared/
- **Views live in `client/src/views/`** not `client/src/pages/` — this project uses views/ consistently
- **timeAgo utility exists** at `client/src/utils/session-helpers.ts` — reuse it, don't create a new one
