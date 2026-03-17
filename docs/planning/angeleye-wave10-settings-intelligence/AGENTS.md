# AGENTS.md — AngelEye Wave 10: Settings Intelligence

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Wave goal**: Unified Sync operation replacing separate backfill+classify buttons, delta tracking (last-sync.json + status line), classification breakdown panel in Settings, and session-type legend in Observer.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT `apiError`
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in `beforeEach`, `rm(testDir)` in `afterEach`
- All service files live in `server/src/services/`
- All imports use `.js` extension (ESM — do not use `.ts`)
- **Baseline**: 170 server tests passing, 44 client tests passing (6 pre-existing failures in `env.test.ts` — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry at `~/.claude/angeleye/registry.json`; session events at `~/.claude/angeleye/sessions/session-<id>.jsonl`
- Claude Code session files at `~/.claude/projects/<encoded-path>/<session_id>.jsonl`
- Write queue for registry is in `registry.service.ts`
- `getDataDir()` is exported from `registry.service.ts` — use it to build paths inside `~/.claude/angeleye/`
- No `console.log` in server files — use `logger.info` / `logger.warn` / `logger.error`

---

## Service File Structure

```
server/src/services/
  registry.service.ts    — _setDataDir, getDataDir, path helpers, writeQueue, readRegistry, updateRegistry, initAngelEyeDirs
  sessions.service.ts    — writeEvent, getSessionEvents, archiveSession, writeSessionName
  workspace.service.ts   — readWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace
  backfill.service.ts    — backfillTranscripts, BackfillResult
  classifier.service.ts  — classifySession, detectIsJunk, detectToolPattern, detectSessionType, findFirstEditedDir, findFirstRealPrompt, ClassificationResult
  sync.service.ts        — NEW (WC01+WC02): runSync, SyncResult; readLastSync, writeLastSync, LastSyncRecord
```

```
server/src/routes/
  backfill.ts            — POST /api/backfill (unchanged), POST /api/classify (unchanged, mounted via /api prefix)
  sync.ts                — NEW (WC01+WC02): POST /api/sync, GET /api/sync/status
  stats.ts               — NEW (WC03): GET /api/stats
```

---

## WC01 — Sync Endpoint (B032)

### Dependency

None. Implement first — WC02 adds delta tracking on top of this endpoint.

### What to build

**1. `server/src/services/sync.service.ts`** — new file

```typescript
import { backfillTranscripts } from './backfill.service.js';
import { readRegistry, updateRegistry } from './registry.service.js';
import { getSessionEvents } from './sessions.service.js';
import { classifySession } from './classifier.service.js';
import { logger } from '../config/logger.js';

export interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
}

export async function runSync(): Promise<SyncResult> {
  // Step 1: backfill — imports sessions not yet in registry
  const backfillResult = await backfillTranscripts();

  // Step 2: classify only sessions that have no session_type yet
  let classified = 0;
  let alreadyUpToDate = 0;
  let errors = 0;

  const registry = await readRegistry();

  for (const [sessionId, entry] of Object.entries(registry)) {
    try {
      if (entry.session_type) {
        alreadyUpToDate++;
        continue;
      }

      const events = await getSessionEvents(sessionId);
      const classificationResult = classifySession(events, sessionId, entry.project_dir ?? '');
      await updateRegistry(sessionId, { ...classificationResult });
      classified++;
    } catch (err) {
      logger.error({ err, sessionId }, 'sync: failed to classify session');
      errors++;
    }
  }

  return {
    imported: backfillResult.imported,
    classified,
    alreadyUpToDate,
    errors: backfillResult.errors + errors,
  };
}
```

**2. `server/src/routes/sync.ts`** — new file

```typescript
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { runSync } from '../services/sync.service.js';
import { logger } from '../config/logger.js';

const router = Router();

router.post('/', async (_req, res) => {
  try {
    const result = await runSync();
    logger.info(result, 'Sync complete');
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'Sync failed');
    return apiFailure(res, 'Sync failed', 500);
  }
});

export default router;
```

**3. Mount in `server/src/index.ts`**

Add import and mount — do not remove existing backfill mounts:

```typescript
import syncRouter from './routes/sync.js';
// ...
app.use('/api/sync', syncRouter);
```

**4. Update `client/src/views/SettingsView.tsx`**

Replace the two separate buttons and their state with a unified Sync button:

State to add:

```typescript
const [syncing, setSyncing] = useState(false);
const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
const [syncError, setSyncError] = useState<string | null>(null);
```

Where `SyncResult` matches the server shape:

```typescript
interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
}
```

Remove: `running`, `result`, `error`, `classifying`, `classifyResult`, `classifyError` state and their handlers.

Replace the two buttons with:

```tsx
<button
  onClick={runSync}
  disabled={syncing}
  className="px-4 py-1.5 text-sm font-medium border border-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
>
  {syncing ? 'Syncing…' : 'Sync Sessions'}
</button>
```

Result message:

```tsx
{
  syncResult && (
    <div className="mt-4 text-sm space-y-1">
      <p className="text-primary font-medium">Sync complete</p>
      {syncResult.imported > 0 && (
        <p className="text-primary">
          {syncResult.imported} new session{syncResult.imported !== 1 ? 's' : ''} imported
        </p>
      )}
      {syncResult.classified > 0 && (
        <p className="text-primary">
          {syncResult.classified} session{syncResult.classified !== 1 ? 's' : ''} classified
        </p>
      )}
      <p className="text-muted-foreground">{syncResult.alreadyUpToDate} already up to date</p>
      {syncResult.errors > 0 && <p className="text-destructive">Errors: {syncResult.errors}</p>}
    </div>
  );
}
```

Keep the card description updated: "Scan and classify all Claude Code sessions in one pass. Safe to run multiple times."

### Tests — `server/src/test/sync.test.ts`

- POST /api/sync returns `{ imported, classified, alreadyUpToDate, errors }` shape
- Sessions already classified are counted in `alreadyUpToDate`, not re-classified
- Newly imported sessions (no `session_type`) are classified and counted in `classified`
- Errors in individual session classification increment `errors` but do not abort the run
- At minimum 4 tests

### Done when

- `POST /api/sync` endpoint exists and returns `SyncResult`
- Settings page has a single "Sync Sessions" button; old two-button layout removed
- Result message shows imported + classified + alreadyUpToDate
- Old `/api/backfill` and `/api/classify` endpoints still work (for backward compat + startup backfill in `index.ts`)
- 4+ new server tests pass
- `npm run typecheck` clean, `npm run lint` clean, baselines maintained

---

## WC02 — Delta Tracking (B033)

### Dependency

**Requires WC01** — the `runSync` function and `/api/sync` endpoint must exist first. The Settings page changes in this unit extend the Settings page from WC01 (single Sync button already in place).

### What to build

**1. Extend `server/src/services/sync.service.ts`** — add last-sync persistence

Add these exports to the file created in WC01:

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getDataDir } from './registry.service.js';

export interface LastSyncRecord {
  timestamp: string; // ISO 8601
  imported: number;
  classified: number;
}

function lastSyncPath(): string {
  return join(getDataDir(), 'last-sync.json');
}

export async function readLastSync(): Promise<LastSyncRecord | null> {
  try {
    const raw = await readFile(lastSyncPath(), 'utf-8');
    return JSON.parse(raw) as LastSyncRecord;
  } catch {
    return null; // file doesn't exist yet — first run
  }
}

export async function writeLastSync(record: LastSyncRecord): Promise<void> {
  await writeFile(lastSyncPath(), JSON.stringify(record, null, 2), 'utf-8');
}
```

Update `runSync()` to call `writeLastSync` after a successful run:

```typescript
export async function runSync(): Promise<SyncResult> {
  // ... existing logic ...

  const result: SyncResult = { imported, classified, alreadyUpToDate, errors };

  // Persist delta record (non-fatal if it fails)
  await writeLastSync({
    timestamp: new Date().toISOString(),
    imported: result.imported,
    classified: result.classified,
  }).catch((err) => logger.warn({ err }, 'Failed to write last-sync.json'));

  return result;
}
```

**2. Extend `server/src/routes/sync.ts`** — add status endpoint

```typescript
import { runSync, readLastSync } from '../services/sync.service.js';

router.get('/status', async (_req, res) => {
  try {
    const lastSync = await readLastSync();
    return apiSuccess(res, { lastSync }); // null if never run
  } catch (err) {
    logger.error({ err }, 'Failed to read sync status');
    return apiFailure(res, 'Failed to read sync status', 500);
  }
});
```

**3. Update `client/src/views/SettingsView.tsx`** — add status line

Add a `LastSyncStatus` interface matching the server shape:

```typescript
interface LastSyncRecord {
  timestamp: string;
  imported: number;
  classified: number;
}
```

Add state:

```typescript
const [lastSync, setLastSync] = useState<LastSyncRecord | null | undefined>(undefined);
// undefined = loading, null = never run, LastSyncRecord = has data
```

Fetch on mount:

```typescript
useEffect(() => {
  fetch('/api/sync/status')
    .then((r) => r.json())
    .then((d) => setLastSync((d.data?.lastSync as LastSyncRecord | null) ?? null))
    .catch(() => setLastSync(null));
}, []);
```

After a successful sync, update `lastSync`:

```typescript
// inside runSync() .then() handler, after setSyncResult(result):
setLastSync({
  timestamp: new Date().toISOString(),
  imported: result.imported,
  classified: result.classified,
});
```

Relative time helper — add to `SettingsView.tsx` (or a shared util if appropriate):

```typescript
function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
```

Status line — render above the Sync button:

```tsx
<div className="text-xs text-muted-foreground mb-3">
  {lastSync === undefined && <span>Loading…</span>}
  {lastSync === null && <span>Never synced</span>}
  {lastSync && (
    <span>
      Last sync: {relativeTime(lastSync.timestamp)}
      {lastSync.imported > 0 &&
        ` — ${lastSync.imported} new session${lastSync.imported !== 1 ? 's' : ''}`}
    </span>
  )}
</div>
```

### Tests

Add to `server/src/test/sync.test.ts`:

- `readLastSync` returns `null` if `last-sync.json` does not exist
- `writeLastSync` creates the file with correct fields
- `readLastSync` returns the written record after `writeLastSync`
- `GET /api/sync/status` returns `{ lastSync: null }` if file absent
- `GET /api/sync/status` returns `{ lastSync: { timestamp, imported, classified } }` if file present
- `POST /api/sync` creates/updates `last-sync.json`
- At minimum 6 tests

### Done when

- `last-sync.json` is written after each sync run
- `GET /api/sync/status` returns last-sync data (or `{ lastSync: null }` if never run)
- Settings page shows "Last sync: X minutes ago — N new sessions" status line
- Status line loads on mount, updates after successful sync
- 6+ new server tests pass
- `npm run typecheck` clean, baselines maintained

---

## WC03 — Classification Breakdown (B034)

### Dependency

None. Independent of WC01/WC02 — reads the existing registry. Can be implemented in parallel.

### What to build

**1. `server/src/routes/stats.ts`** — new file

```typescript
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readRegistry } from '../services/registry.service.js';
import type { SessionType } from '@appystack/shared';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const registry = await readRegistry();
    const byType: Record<SessionType | 'unclassified', number> = {
      BUILD: 0,
      TEST: 0,
      RESEARCH: 0,
      KNOWLEDGE: 0,
      OPS: 0,
      ORIENTATION: 0,
      unclassified: 0,
    };
    let total = 0;

    for (const entry of Object.values(registry)) {
      total++;
      if (entry.session_type) {
        byType[entry.session_type] = (byType[entry.session_type] ?? 0) + 1;
      } else {
        byType['unclassified']++;
      }
    }

    return apiSuccess(res, { byType, total });
  } catch (err) {
    logger.error({ err }, 'Stats failed');
    return apiFailure(res, 'Stats failed', 500);
  }
});

export default router;
```

**2. Mount in `server/src/index.ts`**

```typescript
import statsRouter from './routes/stats.js';
// ...
app.use('/api/stats', statsRouter);
```

**3. Update `client/src/views/SettingsView.tsx`** — classification breakdown panel

Add types:

```typescript
type SessionType = 'BUILD' | 'TEST' | 'RESEARCH' | 'KNOWLEDGE' | 'OPS' | 'ORIENTATION';

interface StatsResult {
  byType: Record<SessionType | 'unclassified', number>;
  total: number;
}
```

Add state:

```typescript
const [stats, setStats] = useState<StatsResult | null>(null);
```

Fetch on mount:

```typescript
useEffect(() => {
  fetch('/api/stats')
    .then((r) => r.json())
    .then((d) => setStats(d.data as StatsResult))
    .catch(() => {
      /* non-fatal */
    });
}, []);
```

After a successful sync, re-fetch stats:

```typescript
// inside the .then() handler after setSyncResult():
void fetch('/api/stats')
  .then((r) => r.json())
  .then((d) => setStats(d.data as StatsResult))
  .catch(() => {
    /* non-fatal */
  });
```

Breakdown panel — add below the sync result, in the same card or a separate card:

```tsx
{
  stats && (
    <div className="mt-4">
      <p className="text-xs font-bebas tracking-wider text-muted-foreground mb-2">
        Session Types — {stats.total} total
      </p>
      <div className="flex flex-wrap gap-2">
        {(['BUILD', 'RESEARCH', 'KNOWLEDGE', 'TEST', 'OPS', 'ORIENTATION'] as const).map((type) => (
          <span key={type} className="text-xs font-mono">
            <span className="text-foreground">{type}</span>
            <span className="text-muted-foreground ml-1">{stats.byType[type] ?? 0}</span>
          </span>
        ))}
        {(stats.byType['unclassified'] ?? 0) > 0 && (
          <span className="text-xs font-mono">
            <span className="text-muted-foreground/60">unclassified</span>
            <span className="text-muted-foreground ml-1">{stats.byType['unclassified']}</span>
          </span>
        )}
      </div>
    </div>
  );
}
```

### Tests — `server/src/test/stats.test.ts`

- `GET /api/stats` returns `{ byType, total }` shape
- Sessions with `session_type` counted in their bucket
- Sessions without `session_type` counted in `unclassified`
- Empty registry returns all zeros
- All 6 `SessionType` keys always present in `byType` (even if zero)
- At minimum 5 tests

### Done when

- `GET /api/stats` endpoint exists and returns correct counts
- Settings page shows breakdown panel on load (populated from `/api/stats`)
- Breakdown refreshes after a sync run
- 5+ new server tests pass
- `npm run typecheck` clean, baselines maintained

---

## WC04 — Session Type Legend in Observer (B035)

### Dependency

None. Pure frontend change to `ObserverView.tsx`. Independent of all other units.

### What to build

Update `client/src/views/ObserverView.tsx`.

**1. Hover tooltips on session type badges**

The badge is currently rendered as:

```tsx
{
  sessionType && (
    <span
      className={`text-[10px] font-bebas tracking-wider px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`}
    >
      {sessionType}
    </span>
  );
}
```

Add a `title` attribute with a one-line description:

```typescript
const SESSION_TYPE_DESCRIPTIONS: Record<string, string> = {
  BUILD: 'Writing or editing product code — Edit, Write, Bash dominant',
  TEST: 'Running tests or Playwright — UAT and test campaigns',
  RESEARCH: 'Web search and external investigation — reading, not writing',
  KNOWLEDGE: 'Brain or docs updates — read-heavy in a brain/ directory',
  OPS: 'Infrastructure and CI/CD — Bash-heavy in ops/ansible directories',
  ORIENTATION: 'Cold start or reorientation — mostly reading, no writes yet',
};
```

Apply as `title` on the badge span:

```tsx
<span
  className={`text-[10px] font-bebas tracking-wider px-1.5 py-0.5 rounded shrink-0 cursor-default ${badgeClass}`}
  title={SESSION_TYPE_DESCRIPTIONS[sessionType] ?? sessionType}
>
  {sessionType}
</span>
```

**2. ⓘ icon in Observer column header + inline legend panel**

Add `showLegend` state:

```typescript
const [showLegend, setShowLegend] = useState(false);
```

In the Column Header Row (the dark `bg-foreground` bar), add a ⓘ button after the existing column labels:

```tsx
<button
  onClick={() => setShowLegend((v) => !v)}
  className="text-[10px] text-[#d4c9b8]/60 hover:text-[#d4c9b8] font-bebas tracking-wider shrink-0 bg-transparent border-none p-0 cursor-pointer"
  title="Show session type legend"
  aria-label="Toggle session type legend"
>
  ⓘ
</button>
```

Place this ⓘ button after the `show junk / hide junk` toggle (or before it — your call, but after the PULSE column label and before the junk toggle is cleanest).

**3. Legend panel** — renders between the column header and the session list (inside the flex column, before the `flex-1 overflow-y-auto` session list div):

The full legend panel definition — put it outside the component as a constant:

```typescript
const SESSION_TYPE_LEGEND: Array<{
  type: SessionType;
  color: string; // tailwind text colour class for the badge preview
  rules: string;
}> = [
  {
    type: 'BUILD',
    color: 'text-primary',
    rules: 'Edit/Write/Bash >40% of tool calls, or Task/Agent heavy. Default for mixed sessions.',
  },
  {
    type: 'TEST',
    color: 'text-sky-300',
    rules: 'Playwright tool calls >40% of tool calls.',
  },
  {
    type: 'RESEARCH',
    color: 'text-purple-300',
    rules: 'WebFetch or brave-search >30% of tool calls.',
  },
  {
    type: 'KNOWLEDGE',
    color: 'text-green-400',
    rules: 'Read-heavy (Glob/Read/Grep >60%, minimal writes) AND project_dir contains "brain".',
  },
  {
    type: 'OPS',
    color: 'text-orange-300',
    rules: 'Bash-heavy AND project_dir contains "agent-os", "ansible", "ci", or "ops".',
  },
  {
    type: 'ORIENTATION',
    color: 'text-[#d4c9b8]',
    rules: 'Read-heavy (Glob/Read/Grep >60%, minimal writes) in a non-brain directory.',
  },
];
```

Conditional render between the column header and the session list:

```tsx
{
  showLegend && (
    <div className="shrink-0 bg-card border-b border-border px-4 py-3 flex flex-col gap-2">
      <p className="font-bebas tracking-wider text-xs text-muted-foreground">
        Session Type Classification Rules
      </p>
      {SESSION_TYPE_LEGEND.map(({ type, color, rules }) => (
        <div key={type} className="flex items-start gap-2 text-xs">
          <span
            className={`font-bebas tracking-wider px-1.5 py-0.5 rounded shrink-0 bg-foreground/85 ${color}`}
          >
            {type}
          </span>
          <span className="text-muted-foreground leading-relaxed">{rules}</span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground/50 mt-1">
        Junk sessions (agent-*, empty, tmp-only) are classified separately and hidden by default.
      </p>
    </div>
  );
}
```

### Done when

- Each session type badge has a `title` tooltip with a one-line description
- ⓘ button appears in the Observer column header
- Clicking ⓘ toggles the legend panel open/closed
- Legend panel lists all 6 types with their trigger rules
- `npm run typecheck` clean, 44 client tests still passing (no new client tests required — legend is static UI)

---

## WC05 — Backfill Extracts `/rename` Names (B036)

### What to build

Update `server/src/services/backfill.service.ts`.

Add a private helper:

```typescript
function extractCustomTitle(lines: string[]): string | null {
  let lastTitle: string | null = null;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'custom-title' && typeof entry.customTitle === 'string') {
        lastTitle = entry.customTitle;
      }
    } catch {
      // skip malformed lines
    }
  }
  return lastTitle; // last wins — same as Claude Code behaviour
}
```

**For new sessions** (being imported for the first time): after building the registry entry, call `extractCustomTitle(lines)` and set `name` if found.

**For existing sessions** already in the registry with `name: null`: after the normal skip, run `extractCustomTitle(lines)` and call `updateRegistry(sessionId, { name: customTitle })` if a title is found. This means running Sync retroactively populates names for all previously imported sessions that were renamed via `/rename`.

**Do NOT overwrite** an existing non-null name. Only populate when `registryEntry.name` is null/undefined.

### Tests (add to backfill.service.test.ts)

- JSONL with one `custom-title` entry → `registry[id].name` populated
- JSONL with two `custom-title` entries → last one wins
- JSONL with no `custom-title` → name stays null
- Session already in registry with `name: null` → name populated on re-backfill
- Session already in registry with `name: 'existing'` → name NOT overwritten (5 tests minimum)

### Done when

- `extractCustomTitle` helper exists in `backfill.service.ts`
- New and existing sessions get name populated from `custom-title` entries
- Existing non-null names are never overwritten
- 5+ tests pass
- `npm run typecheck` clean, no test regressions

---

## Quality Gates (all units)

1. `npm run typecheck` clean after every unit
2. `npm run lint` clean after every unit
3. `npm test` — server baseline 177 passing (ignore 6 pre-existing `env.test.ts` failures), client 44 passing
4. WC02: `writeLastSync` failure must never abort a sync run — always `.catch()`
5. WC03: stats fetch failure on client must be silent (`catch(() => {})`) — breakdown is informational, not blocking
6. WC04: `showLegend` toggle must not re-fetch or re-render the session list — no side effects
7. WC05: never overwrite an existing non-null name
8. No `console.log` in server files (use `logger.info` / `logger.warn`)
9. All server imports use `.js` extension (ESM)
10. Old endpoints `POST /api/backfill` and `POST /api/classify` must still pass their existing tests

---

## Learnings from Wave 9

- `_setDataDir` resets writeQueue — critical for test isolation
- Atomic writes: `write to .tmp then rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- Path helpers exported from `registry.service.ts` — import from there
- Sequential units forced when they share the same source file (e.g. `ObserverView.tsx` — write all changes in one unit, not across multiple)
- `_doUpdateRegistry` is private — not exported
- JSONL write-back: entries with no `parentUuid` are tree-detached metadata — safe to append without affecting conversation history
- `claude --resume "name"` unreliable — copy-resume uses UUID only
- WC01 and WC02 share `sync.service.ts` — implement WC01 first, then WC02 extends the same file
- WC04 is pure frontend — implement it last or in parallel, it has no server dependency
