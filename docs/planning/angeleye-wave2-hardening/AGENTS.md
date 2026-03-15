# AGENTS.md — AngelEye Wave 2: Hardening

You are a background agent implementing one work unit for AngelEye — a session intelligence layer for Claude Code.
Read this file fully before writing any code. It is your complete reference.

---

## Project Overview

**App**: AngelEye — watches Claude Code sessions in real time, writes events to JSONL flat files, broadcasts via Socket.io to a React UI.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript + Socket.io (npm workspaces: client/, server/, shared/)
**Worktree**: `/Users/davidcruwys/dev/ad/apps/angeleye-wave2/` — do ALL work here, not in the main repo
**Wave goal**: Hardening — add missing tests for AngelEye-specific code, fix stale tests, add PATCH endpoint, fix bugs found along the way.

---

## Build & Run Commands

```bash
# From worktree root (/Users/davidcruwys/dev/ad/apps/angeleye-wave2/)
npm run typecheck          # type check all workspaces — must pass before marking done
npm test                   # run all tests (server + client)
npm run lint               # eslint
npm run build -w shared    # build shared types (required before server/client can see them)

# Run tests in a single workspace:
npm test --workspace server
npm test --workspace client
```

**Typecheck and all tests must pass clean before marking any work unit done.**

---

## Directory Structure

```
angeleye-wave2/
├── shared/src/
│   ├── angeleye.ts        ← AngelEye types (AngelEyeEvent, RegistryEntry, etc.)
│   ├── types.ts           ← AppyStack shared types (ApiResponse, Socket events)
│   ├── constants.ts       ← ROUTES, SOCKET_EVENTS constants
│   └── index.ts           ← re-exports everything
├── server/src/
│   ├── config/
│   │   ├── env.ts         ← validated env (PORT=5051, CLIENT_URL=http://localhost:5050)
│   │   └── logger.ts      ← pino logger
│   ├── helpers/
│   │   └── response.ts    ← apiSuccess(res, data), apiError(res, msg, code)
│   ├── middleware/
│   ├── routes/
│   │   ├── health.ts      ← GET /health (reference pattern for route tests)
│   │   ├── hooks.ts       ← POST /hooks/:event (W03 target)
│   │   ├── sessions.ts    ← GET /api/sessions, GET /api/sessions/:id/events (W04+W05 target)
│   │   └── info.ts
│   ├── services/
│   │   └── angeleye-data.ts  ← JSONL write, registry R/W with write queue, archive (W02 target)
│   └── index.ts           ← Express app + Socket.io server (exports app + httpServer)
├── client/src/
│   ├── components/        ← AppShell, Header, Sidebar, ContentPanel
│   ├── contexts/
│   │   └── NavContext.tsx ← useNav() hook, activeView state
│   ├── views/
│   │   ├── ObserverView.tsx   ← live Socket.io feed
│   │   ├── OrganiserView.tsx  ← stub
│   │   └── SettingsView.tsx   ← stub
│   └── App.tsx            ← renders <AppShell /> (no DemoPage — it was deleted)
└── docs/planning/angeleye-wave2-hardening/
    ├── IMPLEMENTATION_PLAN.md
    └── AGENTS.md           ← this file
```

---

## AngelEye Data Layout

```
~/.claude/angeleye/
  registry.json              ← index of all sessions (created/updated by data service)
  sessions/
    session-<id>.jsonl       ← one per active session, one JSON line per event
  archive/
    session-<id>.jsonl       ← rotated here at SessionEnd
  workspaces.json            ← named workspace configs
```

**In tests**: always use `os.tmpdir()` + a unique subdirectory. Never use `~/.claude/angeleye/` in tests — that would corrupt real data.

---

## Core Types (shared/src/angeleye.ts)

```typescript
export type AngelEyeEventType =
  | 'session_start'
  | 'user_prompt'
  | 'tool_use'
  | 'stop'
  | 'session_end'
  | 'subagent_start'
  | 'subagent_stop';

export type AngelEyeSource = 'hook' | 'transcript';

export interface AngelEyeEvent {
  id: string;
  session_id: string;
  ts: string; // ISO8601
  source: AngelEyeSource;
  event: AngelEyeEventType;
  cwd?: string;
  agent_id?: string;
  prompt?: string; // user_prompt events
  tool?: string; // tool_use events
  tool_use_id?: string;
  tool_summary?: Record<string, unknown>;
  result?: string;
  reason?: string;
  last_message?: string;
  agent_type?: string;
}

export interface RegistryEntry {
  session_id: string;
  project: string;
  project_dir: string;
  started_at: string;
  last_active: string;
  name: string | null;
  tags: string[];
  workspace_id: string | null;
  status: 'active' | 'ended';
  source: AngelEyeSource;
}

export type Registry = Record<string, RegistryEntry>;
```

---

## Route Pattern (copy from health.test.ts)

Server route tests use supertest with a minimal Express app — do NOT import the full `index.ts` unless you need Socket.io:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from './health.js';

const app = express();
app.use(healthRouter);

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
```

For routes that need Socket.io (`hooks.ts`), inject a minimal mock `io`:

```typescript
import { vi } from 'vitest';
import { createHooksRouter } from './hooks.js';

const mockIo = { emit: vi.fn() };
const app = express();
app.use(express.json());
app.use(createHooksRouter(mockIo as any));
```

---

## Data Service Test Pattern (W02)

Use real tmpdir — no fs mocks. Override the module-level constants via dependency injection pattern or by overriding process.env before import:

```typescript
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-test-'));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});
```

**Important**: `angeleye-data.ts` uses module-level constants (REGISTRY_PATH etc.) derived from `homedir()`. To test without touching real data, you have two options:

1. Export the constants and override them in tests (preferred — minimal refactor)
2. Set `HOME` env var before module import (works but brittle)

Preferred approach: refactor `angeleye-data.ts` to accept an optional `dataDir` override (defaults to real path, overridable in tests). This is the right fix — it also enables multiple AngelEye data locations in future.

---

## PATCH /api/sessions/:id (W05)

Add to `server/src/routes/sessions.ts`:

```typescript
// PATCH /api/sessions/:id — update name, tags, workspace_id
router.patch('/api/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tags, workspace_id } = req.body as {
      name?: string | null;
      tags?: string[];
      workspace_id?: string | null;
    };
    const updates: Partial<RegistryEntry> = {};
    if (name !== undefined) updates.name = name;
    if (tags !== undefined) updates.tags = tags;
    if (workspace_id !== undefined) updates.workspace_id = workspace_id;
    await updateRegistry(id, updates);
    const registry = await readRegistry();
    const entry = registry[id];
    if (!entry) {
      return apiError(res, 'Session not found', 404);
    }
    apiSuccess(res, entry);
  } catch (err) {
    next(err);
  }
});
```

---

## App.test.tsx Fix (W01)

**Problem**: `App.tsx` now renders `<AppShell />` (which renders `<ObserverView />`). The old tests assert `status-grid` and `tech-stack` test IDs from the deleted `DemoPage`. These IDs don't exist in the current component tree.

**Fix**: Replace DemoPage-specific assertions with assertions that work with the current AppShell structure:

- The app renders (no crash)
- Header is present
- Sidebar navigation items are present
- Observer view is the default active view

Keep the test lightweight — ObserverView has Socket.io which will fail to connect in tests. Mock `useSocket` and `useServerStatus` (these are already mocked in the existing test setup via MSW).

Check `client/src/test/msw/handlers.ts` for existing MSW handler patterns to follow.

---

## Quality Gates (all must pass before marking work unit done)

1. `npm run typecheck` passes with zero errors
2. `npm run lint` passes with zero errors
3. `npm test` passes with zero failures (all workspaces)
4. New tests use real files (tmpdir) or real Express — no mocking filesystem or Express internals
5. Only mock at true external boundaries: `io.emit` for Socket.io, not the data service itself
6. No `console.log` — use `logger.info/error` from `server/src/config/logger.ts`
7. Imports use `.js` extension (ESM)

---

## Anti-Patterns to Avoid

- **Do not mock `fs` or `node:fs/promises`** — use real tmpdir for file operations
- **Do not mock `angeleye-data.ts` functions in route tests** — test them with real file I/O; mocking the data layer in route tests means the route tests don't test actual behaviour
- **Do not add test IDs (`data-testid`) to production code just to make tests pass** — write tests that assert meaningful user-visible content instead
- **Do not use `any` types** — narrow properly with `unknown`
- **Do not return non-200 from hook endpoint** — Claude Code treats it as failure
- **Do not skip stop_hook_active guard test** — it's a critical safety gate
- **Do not write to `server/src/index.ts` beyond adding route imports**
- **Do not import from `@appystack/shared` without running `npm run build -w shared` first**
- **Skill files must be named `SKILL.md`** — `~/.claude/skills/<name>/SKILL.md`

---

## Key Files to Read Before Starting

- `server/src/routes/health.test.ts` — canonical route test pattern (supertest, minimal app)
- `server/src/app.test.ts` — Socket.io test pattern (start httpServer on port 0)
- `client/src/App.test.tsx` — client test pattern (MSW, express stub server) — this is W01 target
- `client/src/test/msw/handlers.ts` — MSW handler patterns
- `server/src/services/angeleye-data.ts` — all functions, write queue, self-healing logic
- `server/src/routes/hooks.ts` — stop guard, EVENT_MAP, summariseTool, registry lifecycle
- `server/src/routes/sessions.ts` — GET endpoints, PATCH to be added

---

## Write Queue Note (critical for W02)

`angeleye-data.ts` uses a module-level `writeQueue` promise chain:

```typescript
let writeQueue: Promise<void> = Promise.resolve();
export function updateRegistry(...) {
  writeQueue = writeQueue.then(() => _doUpdateRegistry(...));
  return writeQueue;
}
```

In tests, the queue persists across test cases within a file. To test serialization properly:

- Run multiple `updateRegistry` calls concurrently (don't await between them)
- Assert the final file state is correct after awaiting all
- Each test should use a fresh tmpdir to avoid registry state leaking between tests

---

## Learnings

(Updated by coordinator as wave completes)
