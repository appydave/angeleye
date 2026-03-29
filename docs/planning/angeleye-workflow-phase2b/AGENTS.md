# AGENTS.md — AngelEye Workflow Phase 2b

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Add developer inspection screens — project registry config loader, schema inspector, and data inspector.

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
- **Test baseline**: 430 server tests (7 pre-existing failures in env.test.ts + backfill — ignore), 42 client tests (2 pre-existing failures — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Station terminology**: always "station", never "step"
- **Views live in `client/src/views/`** not `client/src/pages/`
- **timeAgo utility exists** at `client/src/utils/session-helpers.ts`
- **Inspector components live in `client/src/components/inspector/`** — create this directory

---

## Directory Structure

```
shared/src/angeleye.ts          ← Add ProjectConfig type here
server/src/config/projects/     ← NEW: static JSON project configs
server/src/services/            ← NEW: project-config.service.ts
server/src/routes/              ← NEW: inspector.ts
client/src/views/               ← NEW: InspectorView.tsx
client/src/components/inspector/ ← NEW: SchemaTab.tsx, DataTab.tsx
client/src/hooks/               ← NEW: useInspector.ts
client/src/config/nav.ts        ← EDIT: add inspector nav item
client/src/components/ContentPanel.tsx ← EDIT: add inspector to viewMap
```

---

## Route Pattern — MUST follow Style A

Use the same pattern as `server/src/routes/workflows.ts`:

```typescript
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';

const router = Router();

router.get('/api/inspector/types', async (_req, res, next) => {
  try {
    // ... service calls
    apiSuccess(res, {
      /* data */
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

Mount in `server/src/index.ts` as: `app.use(inspectorRouter);` — no path prefix at mount point.

---

## Config Loader Pattern — MUST follow workflow-type.service.ts

`server/src/services/project-config.service.ts` must mirror this exact pattern:

```typescript
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectConfig } from '@appystack/shared';
import { logger } from '../config/logger.js';

let cache: Map<string, ProjectConfig> | null = null;
let configDir: string = path.resolve(process.cwd(), 'src', 'config', 'projects');

export async function loadProjectConfigs(): Promise<ProjectConfig[]> {
  if (cache) return Array.from(cache.values());
  const loaded = new Map<string, ProjectConfig>();
  // ... read dir, parse JSON, validate shape, cache
  cache = loaded;
  return Array.from(cache.values());
}

export async function getProjectConfigs(): Promise<ProjectConfig[]> {
  return loadProjectConfigs();
}

export async function getProjectConfig(id: string): Promise<ProjectConfig | null> {
  await loadProjectConfigs();
  return cache!.get(id) ?? null;
}

export function _resetCache(): void {
  cache = null;
}
export function _setConfigDir(dir: string): void {
  configDir = dir;
}
```

---

## Test Pattern — Route tests mock services

Follow `server/src/routes/workflows.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../services/project-config.service.js', () => ({
  getProjectConfigs: vi.fn(),
  getProjectConfig: vi.fn(),
}));

import { getProjectConfigs } from '../services/project-config.service.js';
import inspectorRouter from './inspector.js';

const mockGetProjectConfigs = vi.mocked(getProjectConfigs);

let app: express.Express;
beforeEach(() => {
  vi.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use(inspectorRouter);
  app.use(((err, _req, res, _next) => {
    res.status(500).json({ status: 'error', error: err.message });
  }) as express.ErrorRequestHandler);
});
```

Service tests use real filesystem (tmpdir):

```typescript
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
let testDir: string;
beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-project-test-'));
  _resetCache();
  _setConfigDir(testDir);
});
afterEach(async () => {
  _resetCache();
  await rm(testDir, { recursive: true, force: true });
});
```

---

## Client Hook Pattern — MUST follow useWorkflows.ts

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useInspector() {
  const [data, setData] = useState<InspectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inspector/types');
      if (!res.ok) {
        setError('Server returned an error');
        return;
      }
      const json = await res.json();
      if (json.status === 'ok') {
        setData(json.data);
      } else {
        setError('Unexpected response');
      }
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, refresh: load };
}
```

---

## View Registration — 3 files, all required

When creating InspectorView.tsx, you MUST also update:

1. **`client/src/config/nav.ts`** — add to System group:

   ```typescript
   { key: 'inspector', label: 'Inspector', tier: 'secondary' },
   ```

2. **`client/src/components/ContentPanel.tsx`** — add import + viewMap entry:
   ```typescript
   import InspectorView from '../views/InspectorView.js';
   // in viewMap:
   inspector: InspectorView,
   ```

---

## ProjectConfig Type — add to shared/src/angeleye.ts

```typescript
export interface ProjectConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  repository?: string;
  tags?: string[];
}
```

After adding, run `npm run build --workspace shared` before any server/client work.

Also add to `shared/src/index.ts` exports.

---

## View Layout Pattern

Follow the established view pattern (see WorkflowsView.tsx):

```tsx
export default function InspectorView() {
  // All hooks BEFORE any early return (React rules of hooks)
  const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header with tabs */}
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center gap-4">
        <h1 className="text-lg font-semibold text-heading">Inspector</h1>
        {/* Tab buttons */}
      </div>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'schema' ? <SchemaTab /> : <DataTab />}
      </div>
    </div>
  );
}
```

---

## Linen Palette (use these CSS variables)

```
--bg-page: #e8e0d4
--bg-surface: #ede7dc
--bg-card: #f5f1eb
--accent-amber: #c8841a
--text-heading: inherited
--text-body: inherited
--border-border: inherited
```

Use Tailwind classes: `bg-surface`, `bg-card`, `border-border`, `text-heading`, `text-body`.

---

## Anti-Patterns to Avoid

- **Do not create new server routes with prefix mounting** — use full `/api/...` path inside router
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `console.log`** — use `logger`
- **Do not write to `server/src/` at runtime** — nodemon watches it
- **Do not call it "step"** — always "station"
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()`
- **Do not add React Query** — project doesn't use it
- **Do not place hooks after early returns** — all hooks before any conditional return (see .claude/rules/react-hooks.md)
- **Do not put views in `client/src/pages/`** — use `client/src/views/`
- **Do not forget to export new types from `shared/src/index.ts`**

---

## Success Criteria (all work units)

1. `npm run typecheck` clean
2. `npm test` — server 430+ passing, client 42+ passing (pre-existing failures unchanged)
3. `npm run lint` clean
4. New service + route tests written and passing
5. New shared type (ProjectConfig) exported correctly
6. Inspector view accessible via nav, both tabs render
7. Schema tab shows type definitions, workflow configs, project configs
8. Data tab shows session counts by type/project, workflow list, affinity groups

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
- Mock-views pattern: live data first, sample JSON fallback, `apiSuccessWithSource()` for provenance
- **Hook error handling**: always check `!res.ok` before `.json()`, and add `else` branch when `json.status !== 'ok'`
- **enqueueWrite re-throw pattern**: `writeQueue = result.catch(() => {})` keeps queue alive, `return result` lets caller see the error
- **Workflow types already exported from shared**: no need to modify shared/ unless adding new types
- **Views live in `client/src/views/`** not `client/src/pages/`
- **Mock-views catch-all**: generic route at bottom of mock-views.ts serves any `.mochaccino/samples/{name}.json` — no explicit route needed per view
- **HTML mockups use `window.location.hostname`** not `localhost` for API base URL
- **Linen palette**: `--bg-page: #e8e0d4`, `--bg-surface: #ede7dc`, `--bg-card: #f5f1eb`, `--accent-amber: #c8841a`
- **Config loader pattern**: workflow-type.service.ts is the canonical pattern for static JSON config loaders — cached Map, `_resetCache()`, `_setConfigDir()` for tests
