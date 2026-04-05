# AGENTS.md — AngelEye Workflow Polish

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal (wave 2)**: Fix data bugs (Last Updated timestamps, Claude response text), compress detail header, polish chat panel to match mockup, clean up list view.

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
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- Registry + workspaces + workflows live at `~/.claude/angeleye/`
- No `console.log` in server files — use `logger` from `server/src/config/logger.js`
- No React Query in the project — use plain `fetch` + `useState` + `useEffect`
- **Views live in `client/src/views/`** not `client/src/pages/`
- **Components live in `client/src/components/`**
- **All hooks before any early return** — React invariant, enforced by `.claude/rules/react-hooks.md`
- **Test baseline**: 48 test files, 651 tests (585 server + 66 client), all passing. Do not break existing tests.
- **Default export convention**: All components and views use `export default function`. Do not use named exports.

---

## Existing Functions to Reuse (DO NOT reimplement)

### workflow-router.service.ts

```typescript
import { seedWorkflowsFromRegistry } from './workflow-router.service.js';
// + internal functions: parseAction, buildStationMap, lookupStation
```

### sessions.service.ts

```typescript
import { getSessionEvents } from './sessions.service.js';
// Returns: AngelEyeEvent[] — all events for a session from JSONL
```

### registry.service.ts

```typescript
import { readRegistry } from './registry.service.js';
// Returns: Record<string, RegistryEntry>
```

### session-helpers.ts (client)

```typescript
import { timeAgo } from '../utils/session-helpers.js';
// Converts ISO timestamp to relative time string
```

---

## Shared Types (key fields for this campaign)

```typescript
export interface AngelEyeEvent {
  id: string;
  session_id: string;
  ts: string; // ISO timestamp — use this, NOT "timestamp"
  source: AngelEyeSource;
  event: AngelEyeEventType; // 'user_prompt', 'tool_use', 'stop', 'session_start', etc.
  prompt?: string; // Only for user_prompt events
  tool?: string; // For tool_use events
  tool_summary?: Record<string, unknown>;
  reason?: string; // For stop/stop_failure events
  last_message?: string; // ⭐ CLAUDE'S RESPONSE TEXT — present on 'stop' and 'subagent_stop' events
  agent_type?: string;
  payload?: Record<string, unknown>;
  error?: string;
}
```

**Critical**: `last_message` on `stop` events contains Claude's full assistant response. This is already captured by the hooks pipeline. WU03 must render these as Claude chat bubbles.

---

## Chat Panel Design Reference

The canonical mockup is at `.mochaccino/designs/chat-panel/index.html`. READ THIS FILE for CSS patterns.

### Layout Structure (from mockup)

The chat panel is a **constrained center column** — not full-width. Future side panels will go left and right.

- Chat panel: `max-width: 800px`, centered, `min-width: 480px`
- Chat header: `padding: 12px 20px`, background `#f5f1eb`, border-bottom
- Chat messages: `padding: 20px`, `gap: 16px` between rows, `overflow-y: auto`
- Chat footer: border-top, background `#f5f1eb`, two rows (notes + metadata)

### Chat Bubble Styling (from mockup)

**Message rows**: `display: flex`, `gap: 10px`, `max-width: 92%`

- User: `align-self: flex-end`, `flex-direction: row-reverse` (avatar on right)
- Claude: `align-self: flex-start` (avatar on left)

**Avatars**: `28x28px`, `border-radius: 50%`, `font-size: 11px`, `font-weight: 700`

- User: background `#c8841a`, color `#fff`, label "You"
- Claude: background `#2a2018`, color `#d4c9b8`, label "C"

**Bubbles**: `padding: 10px 14px`, `font-size: 13px`, `line-height: 1.5`, `box-shadow: 0 1px 3px rgba(42,32,24,0.06)`

- User: background `#f5f1eb`, `border: 1px solid #d4cdc4`, `border-left: 3px solid #c8841a`, `border-radius: 10px 10px 4px 10px`
- Claude: background `#e8e0d4`, `border: 1px solid #d4cdc4`, `border-radius: 10px 10px 10px 4px`
- Inline `code`: background `#ddd6cc`, `padding: 1px 5px`, `border-radius: 3px`, `font-size: 12px`, monospace

**Message meta** (above bubble): sender name `font-size: 11px`, color `#2a2018`; time `font-size: 10px`, color `#b0a494`

### Tool Call Rendering (from mockup)

- Placed below Claude bubble, indented `padding-left: 38px` (past avatar)
- **Collapsed** (default): inline-flex, background `#e8e0d4`, border `1px solid #d4cdc4`, `border-radius: 4px`, `padding: 4px 10px`, `font-size: 11px`, color `#7a6e5e`
- Format: `▸ N tool calls — ToolName(count), ToolName(count)`
- **Expanded**: background `#f5f1eb`, `border: 1px solid #d4cdc4`, `border-radius: 4px`, `font-size: 11px`, `margin-top: 6px`. Each entry: tool name monospace bold + path muted monospace
- Toggle via click on summary row

### Chat Header (from mockup)

- Session name: **Bebas Neue**, `font-size: 22px`, color `#c8841a`, `letter-spacing: 0.06em`
- Project name: `font-size: 12px`, color `#7a6e5e`
- Type badge: `font-size: 10px`, `font-weight: 700`, uppercase, `padding: 2px 8px`, `border-radius: 3px`
  - BUILD: `background: #2980b920`, `color: #2471a3`
  - KNOWLEDGE: `background: #8e44ad20`, `color: #7d3c98`
  - ORIENT: `background: #c8841a20`, `color: #b07518`
- UUID: monospace, `font-size: 10px`, color `#b0a494` (truncated to 8 chars)
- Close button: `28x28px`, `border-radius: 4px`, `×` character

### Chat Footer (from mockup)

- **Note row**: `padding: 10px 20px`, italic placeholder "Add a note...", Save button (background `#c8841a`, color `#fff`, `border-radius: 4px`, `padding: 4px 12px`)
- **Metadata row**: `padding: 8px 20px`, `font-size: 11px`, color `#7a6e5e`. Format: "Started Xm ago • N tool calls • TYPE • N prompts". Separator: `•` in `#d4cdc4`

### Linen Palette (project-wide)

```
--bg-page: #e8e0d4
--bg-surface: #ede7dc
--bg-card: #f5f1eb
--accent-amber: #c8841a (primary)
--fg: #2a2018
--muted: #7a6e5e
--light-muted: #b0a494
--border: #d4cdc4
```

---

## WU01 — Router Fixes

### Files:

- `server/src/config/overlays/bmad-v6.json` — remove "CU" from `/bmad-sat` actions
- `server/src/services/workflow-router.service.ts` — WN gatekeeper handling + lookupStation fallback
- `server/src/services/workflow-router.service.test.ts` — tests for new behavior

### Changes:

1. **Overlay fix**: In `bmad-v6.json`, change `/bmad-sat` actions from `["CS", "RA", "CU"]` to `["CS", "RA"]`. CU routes exclusively via `/bmad-lib` (advisor/Lisa).

2. **WN gatekeeper**: In the routing loop where `!parsed.storyId` causes unroutable, change WN specifically to be logged as a gatekeeper session instead of unroutable:

   ```typescript
   if (!parsed.storyId) {
     if (parsed.actionCode === 'WN') {
       // WN is a gatekeeper query — it discovers the next story ID.
       // Cannot associate with a specific workflow yet. Log separately.
       result.sessions_unroutable++;
       result.unroutable_reasons.push({
         session_id: entry.session_id,
         reason: `gatekeeper session (WN) — pending workflow association`,
       });
     } else {
       result.sessions_unroutable++;
       result.unroutable_reasons.push({
         session_id: entry.session_id,
         reason: `no story id (actionCode: ${parsed.actionCode})`,
       });
     }
     continue;
   }
   ```

3. **Action-code fallback in lookupStation**: When role-based lookup fails, try action-code-only as a fallback. This handles edge cases where a session launches from the wrong trigger command:
   ```typescript
   function lookupStation(
     stationMap: Map<string, StationConfig>,
     role: string,
     actionCode: string
   ): StationConfig | undefined {
     // Primary: role:actionCode
     const primary = stationMap.get(`${role}:${actionCode}`);
     if (primary) return primary;
     // Fallback: role-less catch (shipper pattern)
     const roleFallback = stationMap.get(`${role}:`);
     if (roleFallback) return roleFallback;
     // Last resort: scan for actionCode match ignoring role
     for (const [key, config] of stationMap) {
       if (key.endsWith(`:${actionCode}`)) return config;
     }
     return undefined;
   }
   ```

### Tests to add:

1. CU session with `role=tester` now routes to CU station (position 7) via action-code fallback
2. WN session without story ID logged as gatekeeper, not generic unroutable
3. Overlay config test: verify `/bmad-sat` no longer includes CU

---

## WU02 — Chat Panel Header + Footer

### File: `client/src/components/SessionEventsPanel.tsx` (modify existing)

Add `ChatHeader` and `ChatFooter` sub-components inside the existing file.

**ChatHeader props** — derive from the registry entry for the session:

- Session name (from registry `name` field, or fallback to session type)
- Project name (from registry `project` field)
- Session type (from registry `session_type` field) — render as badge
- Session ID (truncated to 8 chars)

**To get registry data**: The panel already receives `sessionId`. Add an optional `registryEntry` prop passed down from `WorkflowDetailView`, OR fetch `/api/sessions/${sessionId}` if a single-session endpoint exists. Check what endpoints exist first.

Actually, the simplest approach: add a new prop `metadata` to `SessionEventsPanel`:

```typescript
interface SessionMetadata {
  name?: string | null;
  project?: string | null;
  sessionType?: string | null;
  startedAt?: string | null;
}
```

The parent (`WorkflowDetailView`) can derive this from the registry data it already has access to via `useWorkflows`, or pass it through.

**ChatFooter**: Note input (placeholder only for now — save functionality is future) + metadata summary computed from events array (count tool_use events, count user_prompt events, compute duration from first to last event timestamp).

### CSS: Follow the mockup values exactly (see Chat Header and Chat Footer sections above).

---

## WU03 — Chat Bubble Redesign

### File: `client/src/components/SessionEventsPanel.tsx` (modify existing)

**Replace the current `EventRow` component** with a conversation-oriented renderer.

### Conversation model:

Events arrive as a flat array. Group them into **turns**:

1. A `user_prompt` event starts a new user turn
2. All `tool_use` events between a `user_prompt` and the next `stop` belong to the Claude response
3. A `stop` event ends a Claude turn — its `last_message` is Claude's response text

### Rendering:

**User turn**: Right-aligned bubble with amber left-border accent, "You" avatar (28px amber circle), relative timestamp above.

**Claude turn**: Left-aligned bubble with "C" avatar (28px dark circle). The `last_message` text from the `stop` event is the bubble content. Below the bubble, show a collapsible tool call summary.

**Tool call group** (below Claude bubble):

- Default: collapsed summary — "▸ N tool calls — Read(3), Edit(2), Bash(1)"
- Click to expand: list of individual tools with paths
- Group by counting consecutive `tool_use` events
- Use `useState` per group for expand/collapse

**Session dividers**: `session_start` and `session_end` render as subtle centered divider lines (keep existing pattern).

**Skip rendering**: `pre_tool_use`, `progress`, `instructions_loaded`, `cwd_changed` — these are noise events, skip entirely.

**Timestamps**: Use `timeAgo()` from `session-helpers.ts` for relative times (e.g. "8m ago").

### Key CSS (from mockup):

- Message row: `display: flex`, `gap: 10px`, `max-width: 92%`
- User row: `align-self: flex-end`, `flex-direction: row-reverse`
- Claude row: `align-self: flex-start`
- Bubble padding: `10px 14px`, font-size `13px`, line-height `1.5`
- User bubble: bg `#f5f1eb`, border `1px solid #d4cdc4`, left `3px solid #c8841a`, radius `10px 10px 4px 10px`
- Claude bubble: bg `#e8e0d4`, border `1px solid #d4cdc4`, radius `10px 10px 10px 4px`

---

## WU04 — Chat Panel Layout Constraint

### File: `client/src/views/WorkflowDetailView.tsx` (modify existing)

**Change**: Wrap the `SessionEventsPanel` area in a constrained center column.

The pipeline stays full-width. Below it, the session panel is centered:

```tsx
{/* Pipeline — full width */}
<div className="shrink-0" style={{ minHeight: 200 }}>
  <WorkflowPipeline ... />
</div>

{/* Chat panel — constrained center column */}
<div className="flex-1 flex justify-center overflow-hidden min-h-0">
  <div className="flex flex-col w-full min-h-0" style={{ maxWidth: 800, minWidth: 480 }}>
    <SessionEventsPanel ... />
  </div>
</div>
```

This creates a center column that future side panels can flank. The `justify-center` + `maxWidth` ensures it doesn't stretch full-width. The `min-width: 480` prevents it from getting too narrow.

**Multi-session tabs**: Keep them inside the constrained area (they're part of `SessionEventsPanel`).

---

## WU05 — Re-seed + Verify

### File: `server/src/services/workflow-router.service.test.ts` (add tests)

1. **Test the overlay change**: Read `bmad-v6.json`, assert `/bmad-sat` actions are `["CS", "RA"]` (no "CU").

2. **Test CU routing via fallback**: Create a registry entry with `trigger_command: 'bmad-sat'`, `workflow_role: 'tester'`, `workflow_action: 'CU 2.6'`. After seed, verify the CU station (position 7) has the session.

3. **Test WN gatekeeper logging**: Create a registry entry with `workflow_action: 'WN'` (no story ID). Verify it's logged as gatekeeper, not generic unroutable.

4. **Manual verification step**: After tests pass, run the actual seed to verify Story 2.6 picks up the CU session. Log before/after station counts.

---

## Anti-Patterns to Avoid

- **Do not use `console.log`** — use `logger`
- **Do not import with `.ts` extension** — ESM requires `.js`
- **Do not use `apiError`** — use `apiFailure(res, msg, code)`
- **Do not use `res.json()` directly** — use `apiSuccess()` / `apiFailure()`
- **Do not use named exports for components** — use `export default function`
- **Do not copy-paste Observer's buildFocusRows** — the chat panel has its own grouping model
- **Do not add URL routing** — detail view uses React state toggle
- **Do not render `pre_tool_use` or `progress` events** — they're noise in conversation view
- **Do not use React Query** — plain fetch + useState + useEffect

---

## Success Criteria

Before marking your work unit done, verify ALL of the following:

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm test` passes (all 632+ tests)
- [ ] `npm run lint` passes
- [ ] No new TypeScript `any` types introduced
- [ ] All imports use `.js` extension
- [ ] All hooks called before any early return
- [ ] Default export used for any new/modified components
- [ ] For server changes: tests added covering the new behavior

---

## Learnings (from prior campaigns)

- `StationInstance` uses `.find(s => s.position === x)` for lookup — never use array index as position
- Workflow closure requires substantial coverage (>=50% stations populated) or final station having sessions
- `useState` initial value only applies on first mount — use `useEffect` to reset when props change
- Deep clone station objects before mutation: `{ ...station, session_ids: [...station.session_ids] }`
- The `last_message` field on `stop` events contains Claude's full response — no separate assistant event type exists
- WN is a query/gatekeeper session — the story ID is discovered during the session, not at invocation
