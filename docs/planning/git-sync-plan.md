# Git-Based Sync Plan for AngelEye

## 1. Simplified Scope

AngelEye is a dev tool running on David's local network across multiple machines. The sync feature serves one primary use case:

**David pushes a commit on one machine. Every other AngelEye instance detects the update within 2 minutes and shows a flashing button. One click pulls the update.**

### What is in scope

- **Poll for upstream changes** — `GET /api/git-sync/status` runs `git fetch --quiet` + commit comparison every 2 minutes
- **One-click pull** — `POST /api/git-sync/pull` runs `git pull --rebase` and reports success/failure
- **Header indicator** — colour-coded pill in the header showing sync state (clean, behind, dirty, error)
- **Pull confirmation modal** — shows commit count and summary before pulling
- **Server restart coordination** — after pull, signal Overmind to restart processes

### What is out of scope (for now)

- **Push from UI** — David pushes from his dev machine via CLI. No push button needed.
- **Conflict resolution UI** — if pull fails, abort and warn. David resolves manually.
- **Multi-repo support** — AngelEye is a single repo. No repo picker needed.
- **Webhook/SSE push notifications** — polling at 2-minute intervals is sufficient.

---

## 2. Server Design

### 2.1 API Routes

New file: `server/src/routes/git-sync.ts`

```
GET  /api/git-sync/status   → GitSyncStatus
POST /api/git-sync/pull     → GitPullResult
```

Both routes are mounted at `/api/git-sync` in `server/src/index.ts`.

### 2.2 State Machine

The status endpoint returns one of these states, modelled after FliHub:

| State      | Meaning                                  | Colour |
| ---------- | ---------------------------------------- | ------ |
| `clean`    | HEAD matches upstream, no local changes  | Green  |
| `behind`   | Upstream has commits not yet pulled      | Orange |
| `dirty`    | Uncommitted local changes exist          | Red    |
| `ahead`    | Local commits not pushed (informational) | Blue   |
| `diverged` | Both ahead and behind                    | Purple |
| `error`    | Git command failed                       | Grey   |
| `pulling`  | Pull operation in progress               | Amber  |

```ts
type GitSyncState = 'clean' | 'behind' | 'dirty' | 'ahead' | 'diverged' | 'error' | 'pulling';

interface GitSyncStatus {
  state: GitSyncState;
  branch: string;
  localCommit: string; // short SHA
  remoteCommit: string; // short SHA
  behind: number; // commits behind upstream
  ahead: number; // commits ahead of upstream
  dirty: boolean; // uncommitted changes exist
  lastChecked: string; // ISO 8601
  error?: string; // if state === 'error'
  behindCommits?: CommitSummary[]; // recent upstream commits (max 10)
}

interface CommitSummary {
  sha: string; // short SHA
  message: string; // first line
  author: string;
  date: string; // ISO 8601
}

interface GitPullResult {
  success: boolean;
  previousCommit: string;
  newCommit: string;
  commitsPulled: number;
  error?: string;
  restartTriggered: boolean;
}
```

### 2.3 Git Operations Service

New file: `server/src/services/git-sync.service.ts`

All git operations are isolated here. Key design decisions:

**Repo path**: The monorepo root is `path.resolve(process.cwd(), '..')` (same pattern as `env.ts`). All git commands run with `cwd` set to the monorepo root.

**Execution**: Use `child_process.execFile` (not `exec`) for safety — no shell injection. Wrap in a helper:

```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

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

Setting `GIT_TERMINAL_PROMPT=0` prevents git from hanging if it wants credentials.

**Mutex/locking**: A promise-chain lock prevents concurrent git operations (same pattern as FliHub's `withRepoLock`):

```ts
let lockChain = Promise.resolve();

function withGitLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = lockChain.then(fn, fn); // run even if previous rejected
  lockChain = next.then(
    () => {},
    () => {}
  ); // swallow for chain
  return next;
}
```

Every exported function (`checkStatus`, `pullUpstream`) wraps its work in `withGitLock`.

**Status check sequence** (runs on each poll):

1. `git fetch --quiet` (15s timeout) — update remote refs
2. `git rev-parse --abbrev-ref HEAD` — current branch
3. `git rev-parse --short HEAD` — local commit
4. `git rev-parse --short @{upstream}` — remote commit
5. `git rev-list --left-right --count HEAD...@{upstream}` — ahead/behind counts
6. `git status --porcelain` — dirty check (any output = dirty)
7. If behind > 0: `git log --oneline --format="%h|%s|%an|%aI" HEAD..@{upstream} -10` — commit summaries

Derive state from these values:

```ts
if (error)                    → 'error'
if (dirty)                    → 'dirty'
if (behind > 0 && ahead > 0) → 'diverged'
if (behind > 0)               → 'behind'
if (ahead > 0)                → 'ahead'
else                          → 'clean'
```

**Pull operation**:

1. Check state — refuse if dirty (return error: "uncommitted changes, stash or commit first")
2. Record `HEAD` before pull
3. `git pull --rebase` (120s timeout)
4. Record `HEAD` after pull
5. Count pulled commits
6. Trigger server restart (see section 5)
7. Return `GitPullResult`

If pull fails (conflict), run `git rebase --abort` and return an error message.

### 2.4 Route Implementation

```ts
// GET /status
router.get('/status', async (_req, res) => {
  try {
    const status = await checkStatus();
    return apiSuccess(res, status);
  } catch (err) {
    logger.error({ err }, 'git-sync status check failed');
    return apiFailure(res, 'Git sync status check failed', 500);
  }
});

// POST /pull
router.post('/pull', async (_req, res) => {
  try {
    const result = await pullUpstream();
    if (!result.success) {
      return apiSuccess(res, result); // 200 but success: false — client shows error
    }
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'git-sync pull failed');
    return apiFailure(res, 'Git pull failed', 500);
  }
});
```

---

## 3. Client Design

### 3.1 React Query Polling Hook

New file: `client/src/hooks/useGitSync.ts`

Uses plain `fetch` + `useState` + `useEffect` with a 2-minute polling interval (no React Query dependency currently in the project — avoid adding one just for this):

```ts
const POLL_INTERVAL = 120_000; // 2 minutes

export function useGitSync() {
  const [status, setStatus] = useState<GitSyncStatus | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<GitPullResult | null>(null);

  // Poll every 2 minutes
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await fetch('/api/git-sync/status');
      const json = await res.json();
      if (mounted && json.status === 'ok') setStatus(json.data);
    };
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const pull = async () => {
    setPulling(true);
    setPullResult(null);
    const res = await fetch('/api/git-sync/pull', { method: 'POST' });
    const json = await res.json();
    setPulling(false);
    setPullResult(json.data);
    // Re-check status after pull
    const statusRes = await fetch('/api/git-sync/status');
    const statusJson = await statusRes.json();
    if (statusJson.status === 'ok') setStatus(statusJson.data);
    return json.data;
  };

  return { status, pulling, pullResult, pull, clearPullResult: () => setPullResult(null) };
}
```

### 3.2 Header Indicator Component

New file: `client/src/components/GitSyncPill.tsx`

A colour-coded pill that sits in the Header's right-side area (next to the version badge). Design follows FliHub's pattern:

| State    | Pill colour             | Label        | Behaviour        |
| -------- | ----------------------- | ------------ | ---------------- |
| clean    | Green bg, dark text     | "Synced"     | Static           |
| behind   | Orange bg, white text   | "N behind"   | Flashing/pulsing |
| dirty    | Red bg, white text      | "Dirty"      | Static           |
| ahead    | Blue bg, white text     | "N ahead"    | Static           |
| diverged | Purple bg, white text   | "Diverged"   | Static           |
| error    | Grey bg, muted text     | "Sync error" | Static           |
| pulling  | Amber bg, spinning icon | "Pulling..." | Animated         |

The pill is clickable:

- **behind/diverged**: opens pull confirmation modal
- **clean/ahead/dirty/error**: opens a tooltip/popover with details (branch, commit, last checked)

Flashing animation for "behind" state — uses a CSS `@keyframes` pulse on the pill background:

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

### 3.3 Pull Confirmation Modal

New file: `client/src/components/GitSyncModal.tsx`

A simple modal shown when the user clicks the "behind" pill:

- Header: "Pull N commits?"
- Body: list of commit summaries (SHA, message, author, relative time) — max 10
- Footer: "Pull Now" button (primary/amber) + "Cancel" button
- During pull: button shows spinner + "Pulling..."
- On success: shows "Pulled N commits. Server restarting..." then auto-closes after 3s
- On failure: shows error message in red, "Close" button

### 3.4 Header Integration

Modify `client/src/components/Header.tsx` to include the GitSyncPill:

```tsx
// Current right-side area:
<div className="flex items-center gap-3 ml-auto text-muted-foreground text-sm">
  <GitSyncPill /> {/* NEW */}
  <span className="text-xs">v0.1.0</span>
</div>
```

---

## 4. File Inventory

### New Files

| File                                           | Description                                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `server/src/services/git-sync.service.ts`      | Git operations: `checkStatus()`, `pullUpstream()`, `withGitLock()` mutex, `git()` helper        |
| `server/src/routes/git-sync.ts`                | Express router: `GET /status`, `POST /pull`                                                     |
| `server/src/routes/git-sync.test.ts`           | Route tests with mocked service                                                                 |
| `server/src/services/git-sync.service.test.ts` | Unit tests for state derivation logic (mock `execFile`)                                         |
| `client/src/hooks/useGitSync.ts`               | Polling hook: status, pull trigger, state management                                            |
| `client/src/components/GitSyncPill.tsx`        | Header pill component: colour-coded state indicator                                             |
| `client/src/components/GitSyncModal.tsx`       | Pull confirmation modal with commit list                                                        |
| `shared/src/git-sync.ts`                       | Shared TypeScript interfaces: `GitSyncState`, `GitSyncStatus`, `GitPullResult`, `CommitSummary` |

### Modified Files

| File                               | Change                                                |
| ---------------------------------- | ----------------------------------------------------- |
| `server/src/index.ts`              | Import and mount `git-sync` router at `/api/git-sync` |
| `client/src/components/Header.tsx` | Import and render `<GitSyncPill />`                   |
| `client/src/styles/index.css`      | Add `sync-pulse` keyframe animation                   |
| `shared/src/index.ts`              | Re-export from `git-sync.ts`                          |

### Not Modified

The existing `server/src/routes/sync.ts` and `server/src/services/sync.service.ts` are for **data sync** (JSONL backfill + classification). They are unrelated to git sync and should not be touched.

---

## 5. Safety Considerations

### 5.1 Pull Failure Recovery

If `git pull --rebase` fails (conflict or network error):

1. Run `git rebase --abort` to restore the working tree to pre-pull state
2. Return `{ success: false, error: "Pull failed: <message>. Rebase aborted." }`
3. The client shows the error and the pill stays "behind"
4. David resolves manually via CLI

### 5.2 Dirty Working Tree Protection

The pull endpoint **refuses to pull if the tree is dirty** (uncommitted changes). This prevents accidental data loss. The response clearly says: "Uncommitted changes detected. Commit or stash before pulling."

This is intentionally strict. AngelEye's `data/` directory is git-ignored, so runtime data files will not make the tree dirty. Only actual code changes will.

### 5.3 Server Restart After Pull

After a successful pull, the server code has changed but the running processes are stale. The pull handler needs to trigger a restart.

**Strategy: Signal Overmind via process restart**

After `git pull --rebase` succeeds:

1. Return the `GitPullResult` to the client (with `restartTriggered: true`)
2. Schedule a delayed self-restart: `setTimeout(() => process.exit(0), 2000)`
3. Overmind detects the process exit and restarts both `client` and `server` (default behaviour)
4. The 2-second delay ensures the HTTP response is sent before exit

The client, after receiving `restartTriggered: true`, shows "Server restarting..." and begins polling `/health` every 2 seconds until the server comes back, then refreshes the page.

**Alternative (if Overmind is not running)**: Check `process.env.OVERMIND_SOCKET` — if unset, skip the self-restart and just warn the user: "Pull complete. Restart the server manually to load changes."

### 5.4 Timeout Protection

| Operation                | Timeout | Rationale                                    |
| ------------------------ | ------- | -------------------------------------------- |
| `git fetch`              | 15s     | Network-bound; slow remote = skip this cycle |
| `git pull --rebase`      | 120s    | Large merges can take time                   |
| `git status --porcelain` | 5s      | Local only; should be instant                |
| `git log`                | 5s      | Local only                                   |
| `git rev-parse`          | 5s      | Local only                                   |
| `git rebase --abort`     | 10s     | Recovery; must complete                      |

### 5.5 Rate Limiting

The git-sync routes go through the existing `/api` rate limiter. The 2-minute poll interval from the client is well within limits. No additional rate limiting needed, but the server-side lock ensures git operations never run concurrently even if multiple clients poll simultaneously.

### 5.6 Credential Safety

`GIT_TERMINAL_PROMPT=0` prevents git from prompting for credentials. If the remote requires auth (e.g., SSH key not loaded), the fetch will fail gracefully and status will report `error` state. This is the correct behaviour — David's machines should already have SSH keys configured.

---

## 6. Implementation Order

Recommended build sequence:

1. **Shared types** — `shared/src/git-sync.ts` with all interfaces
2. **Git service** — `server/src/services/git-sync.service.ts` with `checkStatus()` and `pullUpstream()`
3. **Git service tests** — mock `execFile`, test state derivation for all 6 states
4. **Route** — `server/src/routes/git-sync.ts` with GET/POST handlers
5. **Route tests** — mock service, test HTTP layer
6. **Mount route** — add to `server/src/index.ts`
7. **Client hook** — `client/src/hooks/useGitSync.ts`
8. **Pill component** — `client/src/components/GitSyncPill.tsx`
9. **Modal component** — `client/src/components/GitSyncModal.tsx`
10. **Header integration** — modify `Header.tsx`
11. **CSS animation** — add pulse keyframe to `index.css`

---

## 7. Future AppyStack Recipe Notes

Several parts of this design are generic enough to become an AppyStack recipe:

### Recipe candidate: `git-sync`

**What to extract:**

- `git-sync.service.ts` — generic. Only `REPO_ROOT` derivation is project-specific (and already uses the standard AppyStack convention of `process.cwd()/../`)
- `git-sync.ts` route — generic. No AngelEye-specific logic.
- Shared types — fully generic.
- `useGitSync.ts` hook — generic polling pattern.
- `GitSyncPill.tsx` — generic, but colours/styling would need to adapt to the consuming project's design system. The recipe should emit CSS variables, not hard-coded colours.
- `GitSyncModal.tsx` — generic modal pattern.

**What stays AngelEye-specific:**

- The restart strategy (Overmind + `process.exit`) — other AppyStack apps might use `concurrently` or PM2. The recipe should provide a `onPullSuccess` hook/callback.
- The pill placement in Header — layout varies per app.
- The 2-minute interval — should be configurable via `.env` (`GIT_SYNC_POLL_MS`).

**Recipe structure:**

```
recipe: git-sync
├── shared/src/git-sync.ts          (types)
├── server/src/services/git-sync.service.ts
├── server/src/routes/git-sync.ts
├── client/src/hooks/useGitSync.ts
├── client/src/components/GitSyncPill.tsx
├── client/src/components/GitSyncModal.tsx
└── patches/
    ├── server-index.ts.patch       (mount route)
    ├── client-header.tsx.patch     (add pill — user adjusts placement)
    └── client-styles.css.patch     (pulse animation)
```

**Configuration the recipe should accept:**

- `pollIntervalMs` — default 120000
- `pullTimeout` — default 120000
- `fetchTimeout` — default 15000
- `restartStrategy` — `'overmind' | 'process-exit' | 'none'`
- `enablePush` — false by default (add push route + UI when true)

**Recipe skill trigger phrase:** "add git sync to this project" or "add auto-update feature"

---

## 8. Naming Rationale

The new routes and files use `git-sync` (not just `sync`) to avoid collision with the existing `sync.ts` route and `sync.service.ts`, which handle AngelEye's internal data synchronisation (JSONL backfill + session classification). The two sync concepts are completely independent:

| Concept   | Routes          | Purpose                                           |
| --------- | --------------- | ------------------------------------------------- |
| Data sync | `/api/sync`     | Import + classify Claude Code session transcripts |
| Git sync  | `/api/git-sync` | Detect + pull code updates from remote            |
