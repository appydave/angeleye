# AGENTS.md — AngelEye Phase 2c: Deterministic Classifier Extensions

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Add 8 new deterministic classifier fields, top-20 session subtype detection rules, and a re-enrich button in Settings (B060-B062).

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
- **Test baseline**: 430+ server tests (7 pre-existing failures in env.test.ts + backfill — ignore), 42+ client tests (2 pre-existing failures — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Views live in `client/src/views/`** not `client/src/pages/`
- **timeAgo utility exists** at `client/src/utils/session-helpers.ts`

---

## Directory Structure (this campaign)

```
shared/src/angeleye.ts          ← ADD new type literals + RegistryEntry fields
shared/src/index.ts             ← EXPORT new types if adding new named types
server/src/services/classifier.service.ts   ← ADD detect* functions + wire into classifySession()
server/src/test/classifier.service.test.ts  ← ADD tests for new detectors
client/src/views/SettingsView.tsx            ← ADD re-enrich button (WU04 only)
```

---

## The Classifier Pattern — MUST follow exactly

Every classifier field follows this pattern. Study the existing code in `classifier.service.ts`:

### 1. Standalone detector function (exported)

```typescript
// ── C08: delegation_style ──────────────────────────────────────────────────

export function detectDelegationStyle(events: AngelEyeEvent[]): DelegationStyle {
  // ... detection logic using events array
  return 'conversational'; // default fallback
}
```

Rules:

- Function name: `detect{FieldName}` in PascalCase
- Takes `events: AngelEyeEvent[]` (and optionally `projectDir: string` or other classifier results)
- Returns the field's type literal (not `string`)
- Has a sensible default/fallback return
- Section header comment matches the pattern: `// ── C08: field_name ───...`

### 2. Add to ClassificationResult interface

```typescript
export interface ClassificationResult {
  // ... existing fields
  delegation_style?: DelegationStyle; // ← add here
}
```

### 3. Wire into classifySession()

```typescript
const delegation_style = detectDelegationStyle(events);
// ...
return {
  // ... existing fields
  delegation_style,
};
```

### 4. Test pattern — one describe block per detector

```typescript
describe('detectDelegationStyle', () => {
  it('returns orchestrated when task orchestration tools dominate', () => {
    const events = makeEvents([
      { event: 'tool_use', tool: 'TaskCreate' },
      { event: 'tool_use', tool: 'TaskCreate' },
      { event: 'tool_use', tool: 'TaskOutput' },
    ]);
    expect(detectDelegationStyle(events)).toBe('orchestrated');
  });

  it('returns conversational as default', () => {
    const events = makeEvents([{ event: 'user_prompt', prompt: 'hello' }]);
    expect(detectDelegationStyle(events)).toBe('conversational');
  });
});
```

Use the existing `makeEvents` helper if one exists, otherwise create events inline:

```typescript
const events: AngelEyeEvent[] = [
  {
    id: '1',
    session_id: 's1',
    ts: '2026-01-01T00:00:00Z',
    source: 'transcript',
    event: 'user_prompt',
    prompt: 'hello',
  },
  {
    id: '2',
    session_id: 's1',
    ts: '2026-01-01T00:01:00Z',
    source: 'transcript',
    event: 'tool_use',
    tool: 'Bash',
  },
];
```

---

## New Type Definitions (WU01 adds ALL of these to shared/src/angeleye.ts)

````typescript
// ── Phase 2c classifier types (B060) ───────────────────────────────────────

export type DelegationStyle = 'conversational' | 'directive' | 'orchestrated' | 'autonomous';

export type InitiationSource =
  | 'user_typed'
  | 'voice_dictated'
  | 'handover_paste'
  | 'skill_invoked'
  | 'agent_dispatched';

export type SessionContinuity =
  | 'fresh'
  | 'handover_paste'
  | 'compaction'
  | 'skill_launcher'
  | 'recall';

export type OpeningStyle =
  | 'typed_question' // short typed prompt, conversational
  | 'typed_instruction' // typed directive ("fix this", "add that")
  | 'voice_dictation' // long run-on, STT artifacts
  | 'skill_invocation' // starts with /command
  | 'paste_handover' // large paste (>2000 chars) or handover markers
  | 'code_paste' // medium paste with code markers (```, indentation)
  | 'continuation' // "continuing from...", cross-session refs
  | 'greeting' // "hello", "hi", "hey"
  | 'context_dump' // large structured context (JSON, markdown)
  | 'agent_initiated' // machine-initiated (no user prompt first)
  | 'unknown'; // fallback

export type ClosingStyle =
  | 'commit_push' // git commit + push in tail
  | 'commit_only' // git commit without push
  | 'summary_close' // assistant says "all done", "shipped", etc.
  | 'abrupt_abandon' // no closing ceremony, just stops
  | 'task_handoff' // mentions next session, saves context
  | 'question_answer' // ends on a Q&A exchange, no artifacts
  | 'error_bail' // last events are failures/errors
  | 'natural_completion' // work completed, no explicit ceremony
  | 'unknown'; // fallback

export type OutputType =
  | 'conversation_only'
  | 'code_changes'
  | 'knowledge_synthesis'
  | 'mixed'
  | 'new_artifacts';

export type SessionLiveness = 'high' | 'medium' | 'low';
````

Add these fields to `RegistryEntry`:

```typescript
// Phase 2c classifiers (B060)
delegation_style?: DelegationStyle;
initiation_source?: InitiationSource;
session_continuity?: SessionContinuity;
opening_style?: OpeningStyle;
closing_style?: ClosingStyle;
autonomy_ratio?: number;          // 0.0-1.0
session_liveness?: SessionLiveness;
output_type?: OutputType;
```

Add matching fields to `ClassificationResult` in `classifier.service.ts`.

---

## Detection Logic Reference (what each detector should look for)

### delegation_style

- **orchestrated**: has_task_orchestration OR has_parallel_subagent_bursts OR agent-heavy tool pattern
- **autonomous**: is_machine_initiated AND session_scale >= moderate
- **directive**: first prompt is short imperative (<50 chars, no question mark)
- **conversational**: default fallback

### initiation_source

- **agent_dispatched**: is_machine_initiated (no user_prompt as first event)
- **skill_invoked**: trigger_command is non-null
- **voice_dictated**: has_voice_dictation_artifacts
- **handover_paste**: has_handover_context
- **user_typed**: default fallback

### session_continuity

- **compaction**: is_compaction_resume
- **handover_paste**: has_handover_context
- **skill_launcher**: trigger_command is non-null AND first prompt is the skill invocation only
- **recall**: has_cross_session_refs
- **fresh**: default fallback

### opening_style (bucketed from 62 observed variants)

- **agent_initiated**: is_machine_initiated
- **skill_invocation**: first prompt starts with /
- **paste_handover**: first prompt >2000 chars OR has handover markers
- **voice_dictation**: has_voice_dictation_artifacts AND first prompt >100 chars
- **code_paste**: first prompt contains ``` or 4+ space-indented lines, 200-2000 chars
- **context_dump**: first prompt >500 chars with structured markers (JSON, markdown headers)
- **greeting**: first prompt matches /^(hello|hi|hey|good morning)/i AND <20 chars
- **continuation**: first prompt references prior session (UUID, "last time", "continuing")
- **typed_instruction**: first prompt is imperative, <200 chars, no question mark
- **typed_question**: first prompt ends with ? or is short conversational
- **unknown**: fallback

### closing_style (bucketed from 77 observed variants)

- **commit_push**: last 10 events contain git commit AND git push (Bash tool)
- **commit_only**: last 10 events contain git commit but NOT push
- **error_bail**: last 3 events contain tool_failure or stop_failure
- **summary_close**: last stop event's last_message contains closing language
- **task_handoff**: last events mention "next session", "pick up later", save context
- **question_answer**: last events are user_prompt + stop with no tool_use between
- **natural_completion**: has_closing_ceremony but not commit/push
- **abrupt_abandon**: no closing ceremony, no summary, just stops
- **unknown**: fallback

### autonomy_ratio (number 0.0-1.0)

- Count tool_use events vs user_prompt events
- Formula: `tool_events / (tool_events + prompt_events)`
- Sessions with 0 prompts after the first → ratio near 1.0 (highly autonomous)
- Lots of back-and-forth → ratio near 0.5

### session_liveness

- Calculate: total events / session duration in minutes
- **high**: > 5 events/minute
- **medium**: 1-5 events/minute
- **low**: < 1 event/minute
- If session duration is 0 or < 1 minute, use event count: >10 = high, 3-10 = medium, <3 = low

### output_type

- **code_changes**: has Edit/Write/MultiEdit tool_use events targeting source files (not .md, not brains/)
- **knowledge_synthesis**: has Edit/Write targeting .md files OR brains/ paths
- **new_artifacts**: has Write tool_use (new files created) but no Edit (no modifications)
- **conversation_only**: no Edit/Write/MultiEdit tool_use events at all
- **mixed**: has both code_changes AND knowledge indicators

---

## Session Subtype Detection (WU03 — top-20 rules)

`detectSessionSubtype()` takes `events`, `sessionType`, `toolPattern`, and other classifier results. Returns `SessionSubtype | undefined`.

Rules are ordered by parent type. Each rule checks signals and returns the subtype:

### BUILD subtypes

- **feature_implementation**: session_type=BUILD + edit-heavy + session_scale >= moderate + has_git_outcome
- **bug_fix_round**: session_type=BUILD + first_real_prompt contains /fix|bug|broken|error/i
- **refactoring**: session_type=BUILD + edit-heavy + first_real_prompt contains /refactor|rename|extract|clean/i
- **test_writing**: session_type=BUILD + first_real_prompt contains /test|spec|coverage/i OR edit targets are `*.test.ts`
- **ci_pipeline**: session_type=BUILD + bash-heavy + first_real_prompt contains /ci|pipeline|deploy|release/i

### ORIENTATION subtypes

- **codebase_exploration**: session_type=ORIENTATION + read-heavy
- **file_retrieval**: session_type=ORIENTATION + micro/light scale + first tool is Read/Glob
- **artifact_lookup**: session_type=ORIENTATION + first_real_prompt contains /find|where|locate|show me/i

### KNOWLEDGE subtypes

- **brain_maintenance**: session_type=KNOWLEDGE + has_brain_file_writes
- **brain_capture**: session_type=KNOWLEDGE + has_brain_file_writes + first_real_prompt contains /capture|save|store|remember/i
- **advisory_refinement**: session_type=KNOWLEDGE + edit-heavy targeting .md files (not brains/)

### RESEARCH subtypes

- **technology_survey**: session_type=RESEARCH + websearch-heavy
- **hardware_setup_troubleshooting**: session_type=RESEARCH + first_real_prompt contains /setup|install|config|hardware/i
- **release_exploration**: session_type=RESEARCH + first_real_prompt contains /release|version|changelog|update/i

### OPS subtypes

- **poem_execution**: session_type=OPS + first_real_prompt matches /^\*?run\s+\d+/i
- **directory_cleanup**: session_type=OPS + bash-heavy + first_real_prompt contains /clean|delete|remove|organize/i
- **paperclip_agent**: session_type=OPS + detectIsPaperclipAgent returns true

### TEST subtypes

- **playwright_e2e**: session_type=TEST + playwright-heavy
- **test_debugging**: session_type=TEST + first_real_prompt contains /debug|fail|broken|fix/i

Return `undefined` if no rule matches — not every session needs a subtype.

---

## Route Pattern — MUST follow Style A

Use the same pattern as existing routes:

```typescript
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';

const router = Router();

router.get('/api/example', async (_req, res, next) => {
  try {
    apiSuccess(res, {
      /* data */
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

Mount in `server/src/index.ts` as: `app.use(router);` — no path prefix.

---

## Test Pattern — Classifier tests

Follow the existing test patterns in `server/src/test/classifier.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { detectDelegationStyle } from '../services/classifier.service.js';

function makeEvent(overrides: Partial<AngelEyeEvent>): AngelEyeEvent {
  return {
    id: 'test-1',
    session_id: 'test-session',
    ts: '2026-01-01T00:00:00Z',
    source: 'transcript',
    event: 'user_prompt',
    ...overrides,
  };
}

describe('detectDelegationStyle', () => {
  it('returns orchestrated when task tools dominate', () => {
    const events = [
      makeEvent({ event: 'user_prompt', prompt: 'build it' }),
      makeEvent({ id: '2', event: 'tool_use', tool: 'TaskCreate' }),
      makeEvent({ id: '3', event: 'tool_use', tool: 'TaskCreate' }),
      makeEvent({ id: '4', event: 'tool_use', tool: 'TaskOutput' }),
    ];
    expect(detectDelegationStyle(events)).toBe('orchestrated');
  });
});
```

**Important**: Check if `server/src/test/classifier.service.test.ts` already exists and append to it. If it's too large, create a new test file like `classifier-phase2c.test.ts`.

---

## Client Hook Pattern

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useExample() {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/example');
      if (!res.ok) {
        setError('Server error');
        return;
      }
      const json = await res.json();
      if (json.status === 'ok') setData(json.data);
      else setError('Unexpected response');
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
- **Do not modify `classifySession()` or `ClassificationResult` if your WU says not to** — respect the conflict guard
- **Do not return `string` from detectors** — return the proper type literal (e.g., `DelegationStyle`, not `string`)
- **Do not over-engineer detection rules** — these are deterministic heuristics, not ML. A simple check that's right 80% of the time beats a complex one that's right 85%.

---

## Success Criteria (all work units)

1. `npm run typecheck` clean
2. `npm test` — server tests all passing (pre-existing failures unchanged), client tests all passing
3. `npm run lint` clean
4. New detector functions are exported and tested (minimum 2 tests per detector: positive case + default/fallback)
5. New types exported from `shared/src/index.ts`
6. `classifySession()` returns all new fields
7. Re-enrich button visible in Settings, triggers full reclassification, shows results

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
- **Wave parallelism works well at 2 agents/wave** — no conflicts when file ownership is clearly documented in IMPLEMENTATION_PLAN.md
