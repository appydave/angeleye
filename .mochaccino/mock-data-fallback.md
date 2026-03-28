# Mock Data Fallback — How It Works

Mochaccino HTML mockups fetch data from `/api/mock-views/*` endpoints. These
endpoints serve **real data first**, falling back to **curated sample JSON** when
real data is thin or missing. This lets mockups work in two modes:

- **Live mode** — real AngelEye data reshaping (the normal case)
- **Sample mode** — hand-crafted scenarios for design exploration

## Architecture

```
HTML mockup (browser)
  │
  │  fetch(`${API}/api/mock-views/chain-sprint-board`)
  ▼
Express route (server/src/routes/mock-views.ts)
  │
  ├─ ?sample=true  ──────────────────────────┐
  │                                           │
  ├─ Try real data (mock-views.service.ts)    │
  │   └─ If data is "thin" (empty/null)  ─┐  │
  │                                        │  │
  │   └─ Return with source: "live"        │  │
  │                                        ▼  ▼
  │                            Load sample JSON from disk
  │                            (sample-data.service.ts)
  │                            └─ .mochaccino/samples/{viewName}.json
  │                            └─ Return with source: "sample"
  │
  └─ If neither works → 404 or serve empty live data
```

## Response Envelope

Every mock-views response includes a `source` field:

```json
{
  "status": "ok",
  "source": "live",
  "data": { ... },
  "timestamp": "2026-03-27T10:27:18.968Z"
}
```

- `"source": "live"` — data came from real AngelEye sessions
- `"source": "sample"` — data came from a `.mochaccino/samples/` JSON file

HTML mockups can use this to show a badge/indicator if needed.

## Sample Files

Location: `.mochaccino/samples/`

### Non-parameterized endpoints

One JSON file per view name:

```
.mochaccino/samples/
  chain-sprint-board.json      → /api/mock-views/chain-sprint-board
  chat-panel.json              → /api/mock-views/chat-panel
  observer.json                → /api/mock-views/observer         (not yet created)
  organiser.json               → /api/mock-views/organiser        (not yet created)
  named-rows.json              → /api/mock-views/named-rows       (not yet created)
  sync.json                    → /api/mock-views/sync             (not yet created)
  story-chains.json            → /api/mock-views/story-chains     (not yet created)
```

### Parameterized endpoints

Subdirectory with `_default.json` as catch-all:

```
.mochaccino/samples/
  chain-session-detail/
    _default.json              → /api/mock-views/chain-session-detail/:anyId
  chain-story-pipeline/
    _default.json              → /api/mock-views/chain-story-pipeline/:anyGroupId
```

Future: add `{specific-id}.json` files alongside `_default.json` to serve
different sample data for specific parameter values.

### JSON file format

Each file contains the exact `data` payload shape the service returns — the
same object that goes inside `{ status, source, data, timestamp }`.

Optional `_sampleMeta` key is stripped before serving (use it for documentation):

```json
{
  "_sampleMeta": {
    "description": "Amelia DS 2.4 — 8-step pipeline with 4/11 predicates",
    "createdFrom": "original hardcoded HTML mockup, 2026-03-27"
  },
  "session": { ... },
  "predicates": { ... }
}
```

## "Thin" Detection Per Endpoint

Each route defines what "thin" means for its data shape:

| Endpoint                 | Thin when               |
| ------------------------ | ----------------------- |
| observer                 | `totalCount === 0`      |
| organiser                | `totalCount === 0`      |
| named-rows               | `totalCount === 0`      |
| chat-panel               | `sessions.length === 0` |
| sync                     | `totalSessions === 0`   |
| chain-sprint-board       | `epics.length === 0`    |
| story-chains             | `totalStories === 0`    |
| chain-story-pipeline/:id | result is `null`        |
| chain-session-detail/:id | result is `null`        |

## Forcing Sample Data

Add `?sample=true` to any endpoint to bypass real data and serve the sample
directly:

```
/api/mock-views/chain-sprint-board?sample=true
```

This is useful for:

- Design exploration on a machine with no real data
- Testing how a mockup renders with a specific curated scenario
- Demos and screenshots

## Generic Catch-All Route

A catch-all at the bottom of mock-views.ts serves any view name that has a
sample file but no dedicated service function:

```
GET /api/mock-views/:viewName → loadSample(viewName) or 404
```

This means you can create a brand-new mockup design by:

1. Writing an HTML file in `.mochaccino/designs/my-new-view/index.html`
2. Dropping a JSON file at `.mochaccino/samples/my-new-view.json`
3. Having the HTML fetch from `/api/mock-views/my-new-view`

No server code changes needed.

## Cross-Machine Access

HTML mockups detect the API base URL dynamically:

```javascript
const API = window.location.port === '5051' ? '' : `http://${window.location.hostname}:5051`;
```

This means mockups work when accessed from any machine on the network
(e.g. `http://mac-mini-m4:5050/.mochaccino/designs/...`).

## Key Files

| File                                         | Role                               |
| -------------------------------------------- | ---------------------------------- |
| `server/src/routes/mock-views.ts`            | Route handlers with fallback logic |
| `server/src/services/mock-views.service.ts`  | Real data reshaping (777 lines)    |
| `server/src/services/sample-data.service.ts` | Sample JSON loader (~56 lines)     |
| `server/src/helpers/response.ts`             | `apiSuccessWithSource()` helper    |
| `.mochaccino/samples/`                       | Curated sample JSON files          |
