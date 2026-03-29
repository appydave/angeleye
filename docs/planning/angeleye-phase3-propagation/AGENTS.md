# AGENTS.md — AngelEye Phase 3: Field Propagation + Dashboard Promotion

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Propagate Phase 2c classifier fields across all views (Inspector, Settings fixes), promote campaign dashboard + infographic from mockups to real React views in the main nav (B065-B074).

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
- **Test baseline**: 430+ server tests (7 pre-existing failures in env.test.ts + backfill — ignore), 48+ client tests (2 pre-existing failures in App.test.tsx + main.test.tsx — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Views live in `client/src/views/`** not `client/src/pages/`
- **timeAgo utility exists** at `client/src/utils/session-helpers.ts`
- **Nav config** lives in `client/src/config/nav.ts`
- **View routing** lives in `client/src/components/ContentPanel.tsx` (viewMap record)
- **Scroll pattern**: All views use `h-full min-h-0 overflow-y-auto` on the outermost scrollable container

---

## Directory Structure (this campaign)

```
# Server — patches
server/src/routes/stats.ts                    ← WU01: DRY fix (use countByType import)
server/src/routes/inspector.ts                ← WU01+WU06: DRY fix + add fields to summary
server/src/test/                              ← WU02: new tests for countByFields + stats fields

# Client — patches
client/src/views/SettingsView.tsx             ← WU03: fix totalDelta, WU04: import SessionType from shared
client/src/views/SettingsView.test.tsx        ← WU05: accordion + field data tests

# Client — Inspector extension
client/src/hooks/useInspectorData.ts          ← WU06: consume new fields from summary API
client/src/components/inspector/DataTab.tsx   ← WU07: Phase 2c field distribution tables

# Client — new views
client/src/views/CampaignDashboardView.tsx    ← WU08: NEW — Chart.js dashboard
client/src/views/CampaignInfographicView.tsx  ← WU09: NEW — table/bar infographic

# Client — nav wiring
client/src/config/nav.ts                      ← WU10: add Dashboard + Infographic nav items
client/src/components/ContentPanel.tsx         ← WU10: import + register new views
```

---

## Existing Functions to Reuse (DO NOT reimplement)

### `countByType(registry)` — sync.service.ts:61-81

```typescript
import { countByType } from '../services/sync.service.js';
// Returns: { counts: TypeCounts, total: number }
// TypeCounts = Record<SessionType | 'unclassified', number>
```

### `countByFields(registry)` — sync.service.ts:95-108

```typescript
import { countByFields } from '../services/sync.service.js';
// Returns: Record<string, FieldCounts>
// FieldCounts = Record<string, number>
// Keys: session_subtype, delegation_style, initiation_source, session_continuity,
//        opening_style, closing_style, session_liveness, output_type
```

### `readRegistry()` — registry.service.ts

```typescript
import { readRegistry } from '../services/registry.service.js';
// Returns: Registry (Record<string, RegistryEntry>)
```

---

## Shared Types Available (import from `@appystack/shared`)

Phase 2c types already exported:

```typescript
import type {
  SessionType, // 'BUILD' | 'TEST' | 'RESEARCH' | 'KNOWLEDGE' | 'OPS' | 'ORIENTATION'
  DelegationStyle, // 'conversational' | 'directive' | 'orchestrated' | 'autonomous'
  InitiationSource, // 'user_typed' | 'voice_dictated' | 'handover_paste' | 'skill_invoked' | 'agent_dispatched'
  SessionContinuity, // 'fresh' | 'handover_paste' | 'compaction' | 'skill_launcher' | 'recall'
  OpeningStyle, // 11 variants
  ClosingStyle, // 9 variants
  OutputType, // 'conversation_only' | 'code_changes' | 'knowledge_synthesis' | 'mixed' | 'new_artifacts'
  SessionLiveness, // 'high' | 'medium' | 'low'
  SessionSubtype, // 19 variants
  RegistryEntry,
} from '@appystack/shared';
```

---

## WU01 — stats.ts + inspector.ts DRY fix

**stats.ts** (lines 13-31): Replace the inline `byType` counting loop with:

```typescript
import { countByType, countByFields } from '../services/sync.service.js';
// ...
const { counts: byType, total } = countByType(registry);
const fields = countByFields(registry);
return apiSuccess(res, { byType, total, fields });
```

**inspector.ts** (lines 41-48): Replace the inline `byType` + `byProject` loops. Use `countByType(registry)` for types. Keep the `byProject` loop (no shared function exists for it).

---

## WU02 — Server Tests

Create `server/src/test/count-fields.test.ts` (or similar):

1. Test `countByFields()` with empty registry → returns all fields with empty objects
2. Test `countByFields()` with mixed entries → correct counts per field
3. Test `countByFields()` with missing field values → counted as 'unknown'

For stats route: use supertest pattern from existing route tests. Verify `/api/stats` response includes `fields` key.

---

## WU03 — Fix totalDelta() Math

Current code in SettingsView.tsx (around line 120):

```typescript
function totalDelta(before: Record<string, number>, after: Record<string, number>): number {
  let changed = 0;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    changed += Math.abs((after[key] ?? 0) - (before[key] ?? 0));
  }
  return Math.round(changed / 2);
}
```

Replace with sum-of-positive-deltas:

```typescript
function totalDelta(before: Record<string, number>, after: Record<string, number>): number {
  let gains = 0;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const diff = (after[key] ?? 0) - (before[key] ?? 0);
    if (diff > 0) gains += diff;
  }
  return gains;
}
```

This correctly handles both reclassifications (movement between categories) and net-new sessions.

---

## WU04 — Import SessionType from Shared

Remove the locally declared `type SessionType = ...` at the top of SettingsView.tsx.
Import from shared: `import type { SessionType } from '@appystack/shared';`

Make `TYPE_ORDER` and `TYPE_COLORS` type-safe:

```typescript
const TYPE_ORDER: readonly SessionType[] = ['BUILD', 'ORIENTATION', 'KNOWLEDGE', 'RESEARCH', 'OPS', 'TEST'] as const;
const TYPE_COLORS: Record<SessionType, string> = { ... };
```

Also remove any other locally duplicated types that exist in shared (`TypeCounts`, etc.) — import them instead if available, or keep local interfaces for response shapes not in shared.

---

## WU05 — Accordion + Field Data Tests

Add to `SettingsView.test.tsx`:

1. Test accordion expand: click "Subtypes" header → expect field labels to appear
2. Test field stats rendering: verify `mockStatsResult.fields.delegation_style` data renders when section is expanded
3. Test delta rendering after sync: verify field delta badges show correct values
4. Use existing `mockStatsResult` and `mockSyncResult` fixtures (they already include `fields`)

---

## WU06+WU07 — Inspector Phase 2c Extension

**Server** (`inspector.ts`): Add `countByFields(registry)` to the summary response:

```typescript
import { countByType, countByFields } from '../services/sync.service.js';
// ...
const { counts: byType, total } = countByType(registry); // replaces inline loop
const fields = countByFields(registry);
apiSuccess(res, {
  sessions: { total, byType, byProject, fields },
  workflows: { total: workflows.length, byStatus },
});
```

**Hook** (`useInspectorData.ts`): Update `InspectorSummary` type to include `fields`:

```typescript
interface InspectorSummary {
  sessions: {
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    fields: Record<string, Record<string, number>>;
  };
  // ...
}
```

**UI** (`DataTab.tsx`): Add a new `FieldDistributions` collapsible section under Sessions Summary. For each of the 8 Phase 2c fields, render a `CountTable` showing value → count → percentage. Use the existing `CollapsibleSection` and `CountTable` components — they already do exactly what's needed.

---

## WU08 — CampaignDashboardView (Chart.js)

Create `client/src/views/CampaignDashboardView.tsx`.

**Dependencies**: Install `chart.js` and `react-chartjs-2`:

```bash
npm install chart.js react-chartjs-2 --workspace client
```

**Data sources** — fetch all 3 in parallel on mount:

- `GET /api/stats` → `{ total, byType, fields }`
- `GET /api/sessions?limit=2000` → session array for client-side aggregation
- `GET /api/mock-views/campaign-infographic` → mock data for sections without live APIs

**Sections** (13 cards, matching mockup layout):

1. Campaign Overview — stat boxes (total sessions from live, rest from mock)
2. Session Type Distribution — Doughnut chart (live `byType`)
3. Session Scale — horizontal bar (aggregate `session_scale` from sessions)
4. Delegation Style — Doughnut (live from `stats.fields.delegation_style`)
5. Initiation Source — horizontal bar (live from `stats.fields.initiation_source`)
6. Session Continuity — vertical bar (live from `stats.fields.session_continuity`)
7. Output Type — Doughnut (live from `stats.fields.output_type`)
8. Autonomy Ratio — vertical bar (mock `derivedMetrics.autonomyRatio`)
9. Session Liveness — vertical bar (live from `stats.fields.session_liveness`)
10. Top 15 Projects — horizontal bar (aggregate `project` from sessions)
11. Key Predicates — grouped bar (aggregate boolean predicates from sessions)
12. BUILD Accuracy — line chart (mock `buildAccuracy`)
13. Machine Comparison — grouped bar (mock `machines`)

**Live/Mock badge**: Each card shows a small badge — "LIVE", "PARTIAL", or "MOCK" — indicating data source.

**Linen palette**: Use Tailwind classes (`bg-surface`, `bg-card`, `border-border`, `text-heading`, `text-body`).

**Key improvement over mockup**: Cards 4-7 (delegation, initiation, continuity, output) now use LIVE data from `/api/stats` fields — they were MOCK-only in the HTML mockup.

---

## WU09 — CampaignInfographicView (tables + CSS bars)

Create `client/src/views/CampaignInfographicView.tsx`.

**No Chart.js** — this view uses HTML tables and CSS progress bars (matching the infographic mockup style).

**Data sources**: Same 3 endpoints as WU08.

**Sections** (13 sections, matching mockup):

1. Campaign at a Glance — hero stat grid
2. Schema v3 — monospace block (mock)
3. Session Types — table with live vs mock delta columns
4. Session Subtypes — scrollable table (mock `subtypes`)
5. Projects — table with live vs mock delta columns
6. Tools Observed — progress bars from live `tool_pattern` + mock tool table
7. Classifiers — horizontal bar groups (LIVE from `stats.fields` where available, mock for opening/closing/toolProfile)
8. Predicates — table with live boolean aggregation + mock columns
9. BUILD Accuracy — table + rules box (mock)
10. Machine Comparison — side-by-side cards (mock)
11. Derived Metrics — progress bars (mock autonomy/liveness OR live from stats.fields)
12. Skills Invoked — chips from live `trigger_command` + mock skills
13. Gap Analysis — coverage table (computed from live vs mock availability)

**Same Live/Mock badge pattern as dashboard.**

---

## WU10 — Nav + ContentPanel Wiring

**nav.ts**: Add two new items to the Main group:

```typescript
{
  label: 'Main',
  items: [
    { key: 'observer', label: 'Observer', tier: 'primary' },
    { key: 'organiser', label: 'Organiser', tier: 'primary' },
    { key: 'workflows', label: 'Workflows', tier: 'primary' },
    { key: 'dashboard', label: 'Dashboard', tier: 'primary' },
    { key: 'infographic', label: 'Infographic', tier: 'primary' },
  ],
},
```

**ContentPanel.tsx**: Import and register both views:

```typescript
import CampaignDashboardView from '../views/CampaignDashboardView.js';
import CampaignInfographicView from '../views/CampaignInfographicView.js';

const viewMap: Record<string, React.ComponentType> = {
  // ...existing
  dashboard: CampaignDashboardView,
  infographic: CampaignInfographicView,
};
```

---

## Linen Palette (use these CSS variables)

```
--bg-page: #e8e0d4
--bg-surface: #ede7dc
--bg-card: #f5f1eb
--accent-amber: #c8841a
```

Use Tailwind classes: `bg-surface`, `bg-card`, `border-border`, `text-heading`, `text-body`.

---

## Anti-Patterns to Avoid

- **Do not use `console.log`** — use `logger`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()`
- **Do not add React Query** — project doesn't use it
- **Do not place hooks after early returns** — all hooks before any conditional return
- **Do not put views in `client/src/pages/`** — use `client/src/views/`
- **Do not forget to export new types from `shared/src/index.ts`**
- **Do not reimplement countByType or countByFields** — import from `sync.service.js`
- **Do not hardcode SessionType in client code** — import from `@appystack/shared`
- **Do not forget the scroll pattern** — outer container needs `h-full min-h-0 overflow-y-auto`
- **Do not create standalone HTML mockups** — all views are React components in `client/src/views/`

---

## Success Criteria (all work units)

1. `npm run typecheck` clean
2. `npm test` — server tests all passing (pre-existing failures unchanged), client tests all passing
3. `npm run lint` clean
4. New views render and display live data from APIs
5. Dashboard + Infographic appear in main nav sidebar
6. Phase 2c fields visible in Inspector DataTab
7. SettingsView totalDelta math correct for all sync scenarios
8. SessionType imported from shared, not hardcoded
9. Accordion tests pass with interaction + field data assertions

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
- **Only 1 of 4 agents auto-committed in Phase 2b** — agents MUST commit after completing their work unit
- **import.meta.dirname** works in ESM for resolving paths relative to the source file (not process.cwd())
- **Delivery review caught real duplication early** — worth running at campaign completion
- **Wave parallelism works well at 2-3 agents/wave** — no conflicts when file ownership is clearly documented
- **stats.ts duplicated countByType logic** — 4/5 delivery review dimensions flagged this; always use shared functions
- **Hardcoded types in client drift silently** — import from shared package, derive constants from the type
- **Scroll pattern is mandatory** — every view needs `h-full min-h-0 overflow-y-auto` on the outer container
- **MockupsView.tsx is the ONLY mockup index** — never create standalone index.html files for mockup registration
