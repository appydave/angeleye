# AGENTS.md — AngelEye Wave 8: Rule-Based Intelligence

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Add rule-based session classification. Every session gets `is_junk`, `session_type`, `tool_pattern`, `first_edited_dir`, `first_real_prompt`. No LLM required — pure rule-based logic from event data.

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
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in beforeEach, `rm(testDir)` in afterEach
- All service files live in `server/src/services/`
- All imports use `.js` extension (ESM — do not use `.ts`)
- 129 server tests / 44 client tests = 173 total currently passing
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry is at `~/.claude/angeleye/registry.json` (overridable via `_setDataDir` for tests)
- Write queue for registry is in `registry.service.ts` — classifier does NOT use it (read-only for classification)

---

## Service File Structure (post wave 7b)

```
server/src/services/
  registry.service.ts    — _setDataDir, path helpers, writeQueue, readRegistry, updateRegistry, initAngelEyeDirs
  sessions.service.ts    — writeEvent, getSessionEvents, archiveSession
  workspace.service.ts   — readWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace
  backfill.service.ts    — backfillTranscripts, BackfillResult
  classifier.service.ts  — NEW this wave
```

---

## New Types (add to shared/src/angeleye.ts)

```typescript
export type SessionType =
  | 'BUILD' // product code changes — Edit/Write/Bash dominant
  | 'TEST' // UAT, Playwright, test running
  | 'RESEARCH' // web search, reading, external investigation
  | 'KNOWLEDGE' // brain/docs updates — no product changes
  | 'OPS' // infrastructure, CI/CD, Bash-only campaigns
  | 'ORIENTATION'; // cold start, reorientation, lookup

export type ToolPattern =
  | 'playwright-heavy' // mcp__playwright__ > 40% of tool calls
  | 'bash-heavy' // Bash > 40% of tool calls
  | 'edit-heavy' // Edit+Write > 40% of tool calls
  | 'task-heavy' // Task+TaskCreate+TaskUpdate+TaskOutput > 40%
  | 'agent-heavy' // Agent > 20% of tool calls (lower threshold — Agents are high-value)
  | 'websearch-heavy' // WebFetch+mcp__brave-search > 30% of tool calls
  | 'read-heavy' // Glob+Read+Grep > 60% of tool calls, minimal writes
  | 'mixed'; // no single dominant pattern
```

Add to RegistryEntry:

```typescript
  // rule-based classification (no LLM, computed from events)
  is_junk?:           boolean;
  session_type?:      SessionType;
  tool_pattern?:      ToolPattern;
  first_edited_dir?:  string;       // first directory meaningfully touched
  first_real_prompt?: string;       // first non-junk prompt snippet, max 200 chars
```

---

## IN01 — Extend shared schema

### What to build

Edit `shared/src/angeleye.ts`:

1. Add `SessionType` type union (6 values)
2. Add `ToolPattern` type union (8 values)
3. Add 5 optional fields to `RegistryEntry` (all optional with `?`)

### Done when

- `shared/src/angeleye.ts` updated
- `npm run typecheck` passes clean (all workspaces)
- `npm test` passes (173 — no regressions, just adding optional fields)

---

## IN02 — classifier.service.ts

### What to build

Create `server/src/services/classifier.service.ts` with these exports:

```typescript
export interface ClassificationResult {
  is_junk: boolean;
  session_type?: SessionType;
  tool_pattern?: ToolPattern;
  first_edited_dir?: string;
  first_real_prompt?: string;
}

export function classifySession(
  events: AngelEyeEvent[],
  sessionId: string,
  projectDir: string
): ClassificationResult;
```

### is_junk rules (cascade — first match wins)

```
Rule 1: total_events === 1 AND prompt.length <= 2
Rule 2: total_events === 1 AND cwd includes '/tmp'
Rule 3: sessionId starts with 'agent-'
Rule 4: total_events === 1 AND prompt starts with 'Hello how can I'
Rule 5: total_events <= 3 AND no tool_use events AND prompt.length <= 5
PROTECT: if single event AND prompt word count >= 5 → NOT junk
```

If is_junk = true, return early — do not compute other fields.

### tool_pattern detection

Count tool calls by category across ALL tool_use events:

- playwright: count tools where `tool` starts with `mcp__playwright__`
- bash: count tools where `tool === 'Bash'`
- edit: count tools where `tool` is `Edit`, `Write`, or `MultiEdit`
- task: count tools where `tool` is `Task`, `TaskCreate`, `TaskUpdate`, or `TaskOutput`
- agent: count tools where `tool === 'Agent'`
- websearch: count tools where `tool` is `WebFetch` or starts with `mcp__brave-search`
- read: count tools where `tool` is `Glob`, `Read`, or `Grep`

Total = sum of all tool_use events.

Apply thresholds (check in this order):

1. playwright > 40% → `playwright-heavy`
2. bash > 40% → `bash-heavy`
3. task > 40% → `task-heavy`
4. agent > 20% → `agent-heavy`
5. websearch > 30% → `websearch-heavy`
6. edit > 40% → `edit-heavy`
7. read > 60% AND edit < 10% → `read-heavy`
8. else → `mixed`

If fewer than 3 tool_use events → return `mixed`.

### session_type detection

Use composite of `projectDir` basename + `tool_pattern`:

```
tool_pattern === 'playwright-heavy' → TEST
tool_pattern === 'bash-heavy' AND projectDir contains any of ['agent-os', 'ansible', 'ci', 'ops'] → OPS
tool_pattern === 'bash-heavy' → BUILD (bash-heavy without ops dir = active build)
tool_pattern === 'task-heavy' → BUILD (Ralphy campaign = building)
tool_pattern === 'agent-heavy' → BUILD
tool_pattern === 'edit-heavy' → BUILD
tool_pattern === 'websearch-heavy' → RESEARCH
tool_pattern === 'read-heavy' AND projectDir contains 'brain' → KNOWLEDGE
tool_pattern === 'read-heavy' → ORIENTATION
tool_pattern === 'mixed':
  - if prompt_count <= 2 AND total_tools <= 5 → ORIENTATION
  - if projectDir contains 'brain' → KNOWLEDGE
  - else → BUILD
```

### first_edited_dir detection

Walk tool_use events in order. Find the first event where:

- `tool` is `Edit`, `Write`, `Read`, or `Glob`
- `tool_summary` has a `file` key

Extract the directory: `path.dirname(tool_summary.file)`. Return the last meaningful segment (not `/`, not `src` alone if parent is more informative — return the deepest non-generic path that differs from the project root).

Return `undefined` if no file-touching tool found.

### first_real_prompt detection

Walk `user_prompt` events in order. Skip if:

- `prompt` is undefined or empty
- `prompt.length <= 2`
- `prompt.trim()` starts with `'This session is being continued'` (context handover injection)
- `prompt.trim()` starts with `'<task-notification'` (system injection)
- `prompt.trim()` starts with `'Session Context:'` (manual handover block)
- `prompt.length > 2000` (paste-as-prompt — too long to be a natural first prompt)

Return the first prompt that passes all checks, sliced to 200 chars.

Return `undefined` if no real prompt found.

### Tests required (write in classifier.service.test.ts)

Cover:

- Each junk rule individually (5 rules + the protect rule)
- tool_pattern: one test per pattern type
- session_type: at least 6 tests (one per type)
- first_edited_dir: finds file path, returns undefined when no files
- first_real_prompt: skips injections, skips pastes, returns first real one, skips single chars

Minimum 20 tests. Use `makeEvent()` helper pattern from existing test files.

### Done when

- `classifier.service.ts` exists with all exports
- `classifier.service.test.ts` exists with 20+ tests
- `npm run typecheck` clean
- `npm run lint` clean
- `npm test --workspace server` passes (129 + new tests)

---

## IN03 — Hook integration

### What to build

Update `server/src/routes/hooks.ts` to populate classifier fields on live sessions.

Two integration points:

**On `session_start`**: no events yet — nothing to classify. Skip.

**On `stop` or `session_end`**: session is complete. Run full classification.

1. Call `getSessionEvents(sessionId)` to get all events
2. Call `classifySession(events, sessionId, projectDir)`
3. Call `updateRegistry(sessionId, { ...result, status: 'ended' })`

**On `user_prompt` (first real prompt only)**: capture `first_real_prompt` early for live display.

- After writing the event, check if registry entry already has `first_real_prompt`
- If not: call `findFirstRealPrompt([event])` (just this one event)
- If result is not undefined: `updateRegistry(sessionId, { first_real_prompt: result })`

Export `findFirstRealPrompt` and `classifySession` individually from `classifier.service.ts` to support this.

### Done when

- hooks.ts imports from `classifier.service.js`
- stop/session_end triggers classification + registry update
- first user_prompt triggers first_real_prompt capture if not already set
- `npm run typecheck` clean, `npm test` passes (no regressions)

---

## IN04 — Classification backfill

### What to build

Add to `server/src/routes/backfill.ts`:

New endpoint: `POST /api/classify`

Handler:

1. Read full registry
2. For each session entry: read its events via `getSessionEvents(sessionId)`
3. Run `classifySession(events, sessionId, entry.project_dir ?? '')`
4. Call `updateRegistry(sessionId, { ...result })`
5. Return `{ classified: N, skipped: N, errors: N }`

Add a `force` query param: `POST /api/classify?force=true` re-classifies all sessions. Without force, skip sessions that already have `session_type` set.

Add "Classify Sessions" button to the Settings page (`client/src/views/SettingsView.tsx`) next to the existing "Run Backfill" button. Same pattern — calls the endpoint, shows result.

### Done when

- `POST /api/classify` endpoint exists and works
- Settings page has "Classify Sessions" button
- Running it on 663 sessions completes without errors
- `npm run typecheck` clean, `npm test` passes

---

## IN05 — Observer UI

### What to build

Update `client/src/views/ObserverView.tsx`:

**1. Session ID display**
In each session card, below the project name, show the session_id truncated to first 8 chars with a copy button:

```
angeleye                        2m ago    3s
a9f68828  [BUILD]
"first real prompt text here..."
```

Style: session_id in `font-mono text-xs text-muted-foreground`. Copy on click (navigator.clipboard).

**2. Session type badge**
Show `session_type` as a small badge next to (or below) the project name:

- BUILD → amber/linen bg
- TEST → blue tint
- RESEARCH → purple tint
- KNOWLEDGE → green tint
- OPS → orange tint
- ORIENTATION → muted/grey
- undefined → nothing shown

**3. First real prompt subtitle**
Below the session_id line, show `first_real_prompt` in italic muted text, truncated to fit one line. Only shown if value exists.

**4. Junk filter toggle**
In the Observer column header area, add a small toggle "Hide junk" (default: ON).
When ON: filter out sessions where `is_junk === true` from the displayed list.
When OFF: show all sessions (junk sessions shown with a strikethrough or dimmed style).

### Done when

- session_id visible + copyable on each card
- session_type badge shown where available
- first_real_prompt shown as subtitle where available
- Junk filter toggle works
- `npm run typecheck` clean, `npm test` passes (44 client tests — no regressions)

---

## Quality Gates (all units)

1. `npm run typecheck` clean after every unit
2. `npm run lint` clean after every unit
3. `npm test` passes — no regressions from baseline (173 total)
4. IN02 specifically: 20+ new tests in `classifier.service.test.ts`
5. No `console.log` in new files
6. All imports use `.js` extension (ESM)

---

## Learnings from Wave 7b

- `_setDataDir` resets writeQueue — critical for test isolation, do not break it
- Atomic writes: `write to .tmp then rename()` in registry + workspace writes
- `apiFailure(res, msg, code)` not `apiError`
- Path helpers exported from `registry.service.ts` — import from there
- Sequential is forced when units share the same source file; otherwise parallel is fine
- `_doUpdateRegistry` is private — not exported
