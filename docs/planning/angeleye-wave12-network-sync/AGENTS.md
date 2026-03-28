# AGENTS.md — AngelEye Wave 12: Network Sync

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Wave goal**: Add git-based network sync — poll for upstream changes every 2 minutes, show a flashing pill in the header, one-click pull with server restart.

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
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` from `server/src/helpers/response.js` — NOT `apiError`
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in `beforeEach`, `rm(testDir)` in `afterEach`
- All service files live in `server/src/services/`
- All route files live in `server/src/routes/`
- All imports use `.js` extension (ESM — do not use `.ts` in imports)
- **Test baseline**: 385 server tests passing (7 pre-existing failures in env.test.ts + backfill — ignore), 42 client tests passing (2 pre-existing failures — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry at `~/.claude/angeleye/registry.json`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- Env vars validated via Zod in `server/src/config/env.ts` — extend schema there
- `.env` loaded from monorepo root (parent of server/)
- `process.cwd()` is `server/` when nodemon runs — monorepo root is `path.resolve(process.cwd(), '..')`
- Routes are mounted in `server/src/index.ts` — follow existing patterns
- Rate limiting applies to `/api/*` routes — git-sync routes will be rate-limited (fine for 2-min polling)
- Header component is at `client/src/components/Header.tsx` — currently just branding (left) + version badge (right)
- CSS variables in `client/src/styles/index.css` — linen palette, amber primary (`--color-primary: #c8841a`)
- No React Query in the project — use plain `fetch` + `useState` + `useEffect` for polling

---

## Existing File Structure (relevant to this wave)

```
server/src/
├── config/
│   ├── env.ts                  ← Zod env schema (extend for GIT_SYNC_POLL_MS)
│   └── logger.ts
├── helpers/
│   └── response.ts             ← apiSuccess(), apiFailure()
├── routes/
│   ├── sync.ts                 ← DATA sync (backfill+classify) — DO NOT TOUCH
│   └── ...                     ← other routes
├── services/
│   ├── sync.service.ts         ← DATA sync service — DO NOT TOUCH
│   └── ...                     ← other services
└── index.ts                    ← app setup + route mounting

client/src/
├── components/
│   └── Header.tsx              ← add GitSyncPill here
├── hooks/
│   ├── useSocket.ts
│   └── useServerStatus.ts
└── styles/
    └── index.css               ← add sync-pulse keyframe

shared/src/
├── angeleye.ts                 ← existing types
└── index.ts                    ← re-exports
```

---

## WU01 — Shared Types

**Create**: `shared/src/git-sync.ts`
**Modify**: `shared/src/index.ts` (add re-export)

```typescript
// shared/src/git-sync.ts

export type GitSyncState =
  | 'clean'
  | 'behind'
  | 'dirty'
  | 'ahead'
  | 'diverged'
  | 'error'
  | 'pulling';

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitSyncStatus {
  state: GitSyncState;
  branch: string;
  localCommit: string;
  remoteCommit: string;
  behind: number;
  ahead: number;
  dirty: boolean;
  lastChecked: string;
  error?: string;
  behindCommits?: CommitSummary[];
}

export interface GitPullResult {
  success: boolean;
  previousCommit: string;
  newCommit: string;
  commitsPulled: number;
  error?: string;
  restartTriggered: boolean;
}
```

Add to `shared/src/index.ts`:

```typescript
export type { GitSyncState, GitSyncStatus, GitPullResult, CommitSummary } from './git-sync.js';
```

**Run after**: `npm run build --workspace shared` — downstream packages import from built output.

### Done when

- Types compile cleanly
- `npm run typecheck` passes
- Re-export visible from `@appystack/shared`

---

## WU02 — Git Sync Service

**Create**: `server/src/services/git-sync.service.ts`

### Core design

Use `child_process.execFile` (NOT `exec`) — no shell injection risk.

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'path';
import { logger } from '../config/logger.js';
import type { GitSyncState, GitSyncStatus, GitPullResult, CommitSummary } from '@appystack/shared';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(process.cwd(), '..');

async function git(args: string[], timeoutMs = 15_000): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: REPO_ROOT,
    timeout: timeoutMs,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return stdout.trim();
}
```

### Promise-chain mutex

Prevent concurrent git operations (poll vs pull race):

```typescript
let lockChain = Promise.resolve();

function withGitLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = lockChain.then(fn, fn);
  lockChain = next.then(
    () => {},
    () => {}
  );
  return next;
}
```

### checkStatus()

Exported. Wrapped in `withGitLock`. Sequence:

1. `git fetch --quiet` (15s timeout, failure non-fatal → return `error` state)
2. `git rev-parse --abbrev-ref HEAD` → branch
3. `git rev-parse --short HEAD` → localCommit
4. `git rev-parse --short @{upstream}` → remoteCommit (failure → no upstream, return `error`)
5. `git rev-list --left-right --count HEAD...@{upstream}` → parse "ahead\tbehind"
6. `git status --porcelain` (5s timeout) → any output = dirty
7. If behind > 0: `git log --format=%h|%s|%an|%aI HEAD..@{upstream} -10` → parse into `CommitSummary[]`

State derivation:

```typescript
if (dirty) return 'dirty';
if (behind > 0 && ahead > 0) return 'diverged';
if (behind > 0) return 'behind';
if (ahead > 0) return 'ahead';
return 'clean';
```

### pullUpstream()

Exported. Wrapped in `withGitLock`. Steps:

1. Run `git status --porcelain` — if output, refuse: `{ success: false, error: 'Uncommitted changes detected...', restartTriggered: false }`
2. Record `git rev-parse --short HEAD` as previousCommit
3. Run `git pull --rebase` (120s timeout)
4. On failure: run `git rebase --abort` (10s timeout), return `{ success: false, error: '...', restartTriggered: false }`
5. On success: record new HEAD, count commits, trigger restart
6. Restart logic: check `process.env.OVERMIND_SOCKET` — if set, `setTimeout(() => process.exit(0), 2000)`. If not, skip restart and set `restartTriggered: false`.
7. Return `GitPullResult`

### Done when

- All git operations use `execFile` (not `exec`)
- `GIT_TERMINAL_PROMPT=0` set on every call
- Mutex serialises all operations
- `npm run typecheck` passes
- No `console.log` — use `logger`

---

## WU03 — Git Sync Route

**Create**: `server/src/routes/git-sync.ts`
**Modify**: `server/src/index.ts` — add `app.use('/api/git-sync', gitSyncRouter);`

```typescript
import { Router } from 'express';
import { checkStatus, pullUpstream } from '../services/git-sync.service.js';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const status = await checkStatus();
    return apiSuccess(res, status);
  } catch (err) {
    logger.error({ err }, 'git-sync status check failed');
    return apiFailure(res, 'Git sync status check failed', 500);
  }
});

router.post('/pull', async (_req, res) => {
  try {
    const result = await pullUpstream();
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'git-sync pull failed');
    return apiFailure(res, 'Git pull failed', 500);
  }
});

export { router as gitSyncRouter };
```

Mount in `server/src/index.ts` alongside other `/api` routes:

```typescript
import { gitSyncRouter } from './routes/git-sync.js';
// ... after existing route mounts:
app.use('/api/git-sync', gitSyncRouter);
```

### Done when

- `GET /api/git-sync/status` returns `GitSyncStatus`
- `POST /api/git-sync/pull` returns `GitPullResult`
- Route mounted in index.ts
- `npm run typecheck` passes

---

## WU04 — Git Sync Service Tests

**Create**: `server/src/services/git-sync.service.test.ts`

Mock `node:child_process` `execFile` to control git command outputs. Test:

1. **State: clean** — fetch succeeds, rev-list "0\t0", status empty → state `clean`
2. **State: behind** — rev-list "0\t3" → state `behind`, behindCommits populated
3. **State: dirty** — status has output → state `dirty` (even if behind)
4. **State: ahead** — rev-list "2\t0" → state `ahead`
5. **State: diverged** — rev-list "2\t3" → state `diverged`
6. **State: error** — fetch throws → state `error` with message
7. **Pull: success** — clean tree, pull succeeds → `{ success: true, commitsPulled: N }`
8. **Pull: refuse dirty** — status has output → `{ success: false, error: 'Uncommitted changes...' }`
9. **Pull: conflict** — pull throws with CONFLICT → rebase abort called → `{ success: false }`
10. **Mutex: serialisation** — concurrent calls don't interleave

### Done when

- All 10 test cases pass
- `npm test --workspace server` does not regress

---

## WU05 — Git Sync Route Tests

**Create**: `server/src/routes/git-sync.test.ts`

Use supertest against the Express app. Mock the git-sync service module.

1. `GET /status` — 200 + GitSyncStatus shape
2. `GET /status` — service throws → 500 + error message
3. `POST /pull` — success → 200 + GitPullResult shape
4. `POST /pull` — dirty tree → 200 + `{ success: false, error: '...' }`
5. `POST /pull` — service throws → 500 + error message

### Done when

- All 5 test cases pass
- `npm test --workspace server` does not regress

---

## WU06 — Client: Hook + Pill + Modal

### useGitSync.ts

**Create**: `client/src/hooks/useGitSync.ts`

Plain `fetch` + `useState` + `useEffect` polling hook. **No React Query.**

```typescript
const POLL_INTERVAL = 120_000; // 2 minutes default

export function useGitSync() {
  const [status, setStatus] = useState<GitSyncStatus | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<GitPullResult | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/api/git-sync/status');
        const json = await res.json();
        if (mounted && json.status === 'ok') setStatus(json.data);
      } catch {
        /* server down — ignore */
      }
    };
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const pull = async (): Promise<GitPullResult | null> => {
    setPulling(true);
    setPullResult(null);
    try {
      const res = await fetch('/api/git-sync/pull', { method: 'POST' });
      const json = await res.json();
      const result = json.data as GitPullResult;
      setPullResult(result);
      if (result.restartTriggered) {
        // Poll /health until server returns, then reload page
        const pollHealth = setInterval(async () => {
          try {
            const h = await fetch('/health');
            if (h.ok) {
              clearInterval(pollHealth);
              window.location.reload();
            }
          } catch {
            /* still restarting */
          }
        }, 2000);
      } else {
        // Re-check status
        const sr = await fetch('/api/git-sync/status');
        const sj = await sr.json();
        if (sj.status === 'ok') setStatus(sj.data);
      }
      return result;
    } catch {
      return null;
    } finally {
      setPulling(false);
    }
  };

  return { status, pulling, pullResult, pull, clearPullResult: () => setPullResult(null) };
}
```

### GitSyncPill.tsx

**Create**: `client/src/components/GitSyncPill.tsx`

Colour-coded pill. Uses the existing CSS variable palette.

| State    | Background       | Text       | Label          | Animation    |
| -------- | ---------------- | ---------- | -------------- | ------------ |
| clean    | bg-green-600/15  | green-700  | "Synced"       | none         |
| behind   | bg-amber-500     | white      | "N behind"     | `sync-pulse` |
| dirty    | bg-red-500/15    | red-700    | "Dirty"        | none         |
| ahead    | bg-blue-500/15   | blue-700   | "N ahead"      | none         |
| diverged | bg-purple-500/15 | purple-700 | "Diverged"     | none         |
| error    | bg-muted         | muted-fg   | "Sync error"   | none         |
| pulling  | bg-amber-500/15  | amber-700  | "Pulling…"     | spinner      |
| null     | —                | —          | (don't render) | —            |

Clicking `behind` or `diverged` → opens `GitSyncModal`.
Clicking other states → tooltip with branch, commits, last checked.

### GitSyncModal.tsx

**Create**: `client/src/components/GitSyncModal.tsx`

Simple modal overlay:

- Header: "Pull N commits?"
- Body: commit list (sha, message, author, relative time) — max 10
- Footer: "Pull Now" (amber bg) + "Cancel"
- During pull: spinner + "Pulling…"
- Success: "Pulled N commits. Server restarting…" — auto-close after 3s
- Failure: red error text + "Close"

### Header.tsx integration

**Modify**: `client/src/components/Header.tsx`

Add `<GitSyncPill />` in the right-side div, before the version badge:

```tsx
<div className="flex items-center gap-3 ml-auto text-muted-foreground text-sm">
  <GitSyncPill />
  <span className="text-xs">v0.1.0</span>
</div>
```

### CSS keyframe

**Modify**: `client/src/styles/index.css`

```css
@keyframes sync-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

### Done when

- Pill renders in header with correct colour per state
- "behind" state pulses
- Clicking "behind" opens modal with commit list
- "Pull Now" triggers pull and shows success/restart or failure
- After restart, page reloads automatically
- `npm run typecheck` passes
- `npm test --workspace client` does not regress

---

## WU07 — Env Var: GIT_SYNC_POLL_MS

**Modify**: `server/src/config/env.ts`

Add to Zod schema:

```typescript
GIT_SYNC_POLL_MS: z.coerce.number().default(120_000),
```

**Modify**: server info route (or create if needed) to expose `gitSyncPollMs` in the `/api/info` response so the client can read the configured interval instead of hardcoding 120000.

**Modify**: `client/src/hooks/useGitSync.ts` — on first mount, fetch `/api/info` to read `gitSyncPollMs`, use as the interval. Fallback to 120000 if unavailable.

### Done when

- `.env` with `GIT_SYNC_POLL_MS=60000` changes the poll interval
- Client reads the configured value from `/api/info`
- `npm run typecheck` passes

---

## Quality Gates (all units)

1. `npm run typecheck` clean (server + client + shared)
2. `npm test` — server 385+ passing (ignore 7 pre-existing failures), client 42+ passing (ignore 2 pre-existing failures)
3. `npm run lint` clean
4. No `console.log` in server code — use `logger`
5. All imports use `.js` extension (ESM)
6. Response helpers: `apiSuccess()` and `apiFailure()` — never `apiError` or raw `res.json()`
7. New functionality has at least one test covering it
8. `git-sync` naming throughout — no collision with existing `sync.ts` / `sync.service.ts`

---

## Anti-Patterns to Avoid

- **Do not touch `sync.ts` or `sync.service.ts`** — those are data sync (backfill+classify), completely unrelated to git sync
- **Do not use `exec()`** — always `execFile()` for git commands (no shell injection)
- **Do not add React Query** — project doesn't use it; plain fetch + useState + useEffect
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not hardcode poll interval in client** — read from `/api/info`, fallback to 120000
- **Do not auto-push from UI** — this wave is detect+pull only
- **Do not add complex conflict resolution** — abort rebase + warn is sufficient

---

## Learnings from Prior Waves

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: `write to .tmp then rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- Path helpers exported from `registry.service.ts` — import from there
- All server imports use `.js` extension (ESM)
- Agents must commit their changes — don't leave uncommitted
- Rebuild shared (`npm run build --workspace shared`) after changing shared types
- `ORIGINAL_EVENTS` set in hooks.ts determines which events get custom extraction vs raw payload
- `STRIP_FROM_PAYLOAD` set filters common fields out of the raw payload bucket
- Header is minimal (branding left, version right) — pill goes in the right-side div before version badge
- CSS variables are in `client/src/styles/index.css` — linen palette, amber primary
- Existing hooks (useSocket, useServerStatus) use plain fetch — follow the same pattern
