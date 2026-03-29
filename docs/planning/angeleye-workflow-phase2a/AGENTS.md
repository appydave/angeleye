# AGENTS.md — AngelEye Workflow Phase 2a

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Extract mock data from two static HTML dashboards into JSON, build hybrid views that overlay live registry data and visually delineate mock vs live.

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
- **Test baseline**: 426 server tests (7 pre-existing failures in env.test.ts + backfill — ignore), 42 client tests (2 pre-existing failures — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Station terminology**: always "station", never "step"
- **Views live in `client/src/views/`** not `client/src/pages/`
- **timeAgo utility exists** at `client/src/utils/session-helpers.ts`

---

## This Campaign's File Layout

### Source HTML (READ THESE — they contain all the data to extract)

- `docs/planning/angeleye-analysis-1/campaign-dashboard.html` — 596 lines, Chart.js, 13 charts with inline data
- `docs/planning/angeleye-analysis-1/campaign-infographic.html` — 890 lines, pure HTML/CSS, 12 data sections

### Output Locations

- `.mochaccino/samples/campaign-dashboard.json` — extracted dashboard data (WU01)
- `.mochaccino/samples/campaign-infographic.json` — extracted infographic data (WU02)
- `.mochaccino/designs/campaign-dashboard-hybrid/index.html` — hybrid dashboard (WU03)
- `.mochaccino/designs/campaign-infographic-hybrid/index.html` — hybrid infographic (WU04)

### How Mock-Views Serving Works (NO new server code needed)

The generic catch-all in `server/src/routes/mock-views.ts` serves any JSON from `.mochaccino/samples/`:

```
GET /api/mock-views/campaign-dashboard  →  .mochaccino/samples/campaign-dashboard.json
GET /api/mock-views/campaign-infographic  →  .mochaccino/samples/campaign-infographic.json
```

This is automatic. Do NOT create new route handlers for these.

---

## Live API Endpoints Available (for hybrid overlay)

### GET /api/stats

Returns session type counts from the live registry:

```json
{
  "status": "ok",
  "data": {
    "byType": {
      "BUILD": 77,
      "TEST": 8,
      "RESEARCH": 79,
      "KNOWLEDGE": 80,
      "OPS": 53,
      "ORIENTATION": 56,
      "unclassified": 418
    },
    "total": 924
  }
}
```

**Note**: Live uses `OPS`, analysis used `OPERATIONS`. Map `OPS` → `OPERATIONS` in the hybrid view.

### GET /api/sessions?limit=2000

Returns all RegistryEntry objects. Each entry has these classification fields you can aggregate client-side:

- `session_type` — BUILD | TEST | RESEARCH | KNOWLEDGE | OPS | ORIENTATION (or absent)
- `session_scale` — micro | light | moderate | heavy | marathon (or absent)
- `tool_pattern` — build_focused | bash_heavy | edit_heavy | read_heavy | mixed | ... (or absent)
- Tier 1 predicates: `has_playwright_calls`, `is_compaction_resume`, `is_machine_initiated`, `has_web_research`, `has_parallel_subagent_bursts`, `has_task_orchestration`, `has_git_outcome`
- Tier 2 predicates: `has_brain_file_writes`, `has_cross_session_refs`, `has_unauthorized_edits`, `has_voice_dictation_artifacts`, `has_handover_context`, `has_cross_project_reads`, `has_closing_ceremony`
- `trigger_command`, `trigger_arguments`
- `project`, `project_dir`

### What does NOT exist live (mock-only dimensions)

These fields were computed by the analysis campaign (LLM-assisted) and exist ONLY in the mock JSON:

- **C08 delegation_style** (conversational/directive/orchestrated/autonomous)
- **C09 session_continuity** (fresh/handover_paste/compaction/skill_launcher/recall)
- **C10 output_type** (conversation_only/code_changes/knowledge_synthesis/mixed/new_artifacts)
- **C11 initiation_source** (user_typed/voice_dictated/handover_paste/skill_invoked/agent_dispatched)
- **opening_style**, **closing_style**, **tool_profile** (62/77/60 unique values)
- **session_subtype** (478 unique values)
- **derived metrics**: autonomy_ratio, session_liveness (raw data exists but buckets not computed)
- **BUILD accuracy by scale** (requires cross-referencing type vs scale — could be computed but isn't)
- **skills invoked** (trigger_command exists but not aggregated)
- **Observations** (frustration_analysis, phase_breakdown, etc. — LLM-only)

---

## Hybrid View — Visual Delineation Rules

### For each data section/chart in the hybrid view:

1. **Attempt live data first**: fetch from `/api/stats` or aggregate from `/api/sessions`
2. **If live data exists**: render with solid styling + amber left-border + `LIVE` badge
3. **If live data partially exists**: render live values, fill gaps from mock, label each value source
4. **If no live equivalent**: render mock data with dashed grey border + 50% opacity + `MOCK` badge

### Summary bar (top of page):

Show: `"X of Y dimensions populated from live data (Z% coverage)"`

### Per-section indicators:

- Green dot = fully live
- Amber dot = partial (some values live, some mock)
- Red dot = entirely mock

### Cross-machine note:

The mock data represents the analysis campaign's findings across 924 sessions on 2 machines. Live data is from whatever is currently in the registry on this machine. Counts will differ — that's expected and part of what we're visualizing.

---

## Anti-Patterns to Avoid

- **Do not create new server routes** — mock-views catch-all serves the JSON automatically
- **Do not recreate shared types** — WorkflowType, WorkflowInstance, etc. already exist
- **Do not use `exec()`** — always `execFile()` for any shell commands
- **Do not add React Query** — project doesn't use it
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `console.log`** — use `logger`
- **Do not write to `server/src/` at runtime** — nodemon watches it
- **Do not call it "step"** — always "station"
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()` / `apiSuccessWithSource()`
- **Do not touch existing services** unless explicitly required
- **Do not invent data** — extract exactly what's in the HTML, nothing more
- **Do not add or change any existing view/route/component** — this campaign only creates standalone HTML mockups and JSON files

---

## JSON Extraction Guidelines (WU01, WU02)

### Read the source HTML carefully

The data is embedded differently in each file:

- **campaign-dashboard.html**: Data is in Chart.js `new Chart()` calls in `<script>`. Parse `labels: [...]` and `data: [...]` arrays.
- **campaign-infographic.html**: Data is in HTML elements (`.hero-stat .number`, `.list-item .name/.val`, `.data-table td`, `.progress-row`, `.classifier-bar-row`, `.skill-item`). Parse the text content and inline styles (e.g. `style="width:18.4%"`).

### JSON structure must be semantic

Use descriptive keys that match the domain, not the visualization:

```json
{
  "_meta": {
    "source": "campaign-dashboard.html",
    "extracted": "2026-03-29",
    "campaign": "angeleye-analysis-1",
    "totalSessions": 924
  },
  "sessionTypes": {
    "labels": ["BUILD", "KNOWLEDGE", ...],
    "values": [77, 80, ...]
  }
}
```

### Preserve ALL data — do not summarize or aggregate

If the HTML shows 45 tools, the JSON must have all 45. If it shows 40 subtypes, all 40 go in.

---

## Success Criteria (all work units)

1. `npm run typecheck` clean (no changes to server/client/shared code expected)
2. `npm test` — server 426+ passing, client 42+ passing (no changes expected)
3. `npm run lint` clean
4. JSON files are valid JSON and contain all data from source HTML
5. Hybrid HTML files load in a browser, fetch from API, and render with mock/live delineation
6. No new server code — mockup HTML files only + JSON data files
7. Each hybrid view shows a clear summary of live vs mock coverage

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
- `wantsSample(req)` checks `?sample=true` query param
- `loadSample(name)` reads from `.mochaccino/samples/{name}.json`
- **Hook error handling**: always check `!res.ok` before `.json()`, and add `else` branch when `json.status !== 'ok'`
- **enqueueWrite re-throw pattern**: `writeQueue = result.catch(() => {})` keeps queue alive, `return result` lets caller see the error
- **Workflow types already exported from shared**: no need to modify shared/
- **Views live in `client/src/views/`** not `client/src/pages/`
- **Mock-views catch-all**: generic route at bottom of mock-views.ts serves any `.mochaccino/samples/{name}.json` — no explicit route needed per view
- **HTML mockups use `window.location.hostname`** not `localhost` for API base URL — ensures cross-machine access
- **Linen palette**: `--bg-page: #e8e0d4`, `--bg-surface: #ede7dc`, `--bg-card: #f5f1eb`, `--accent-amber: #c8841a`
