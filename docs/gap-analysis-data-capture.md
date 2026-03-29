# AngelEye — Data Capture & Visualisation Gap Analysis

**Created**: 2026-03-18
**Context**: Conversation with Martin surfaced the primary gap — user prompts are visible but Claude's response text is not. This document maps every gap between what Claude Code produces and what AngelEye currently captures and displays.

---

## The Primary Gap (Martin's Observation)

**"You can see what you said. Where is what Claude said back?"**

This is the most important thing missing. Here's the exact state:

### What exists in the data

The `Stop` and `SubagentStop` hooks include `last_assistant_message` — Claude's full response text for that turn. This has been available since **v2.1.47**.

The server (`hooks.ts`) **does capture it** — it arrives as `body.last_assistant_message` and is stored as `event.last_message` on the stop event. The data is there.

### What the UI does with it

Nothing. Zero. The `eventSummary()` function for `stop` events returns:

```ts
case 'stop':
  return `stop: ${event.reason ?? 'unknown'}`;
```

`last_message` is never read. Never displayed.

### What the focus panel looks like as a result

The focus panel groups all non-prompt events (tool calls + stop) into a collapsed row:

```
11:20:58  user_prompt   "Add auth middleware to the login route"   ↳ 5 tool calls · 1 stop
```

When you expand it, stop shows as `stop: end_turn`. Claude's actual response — the text explanation of what it did, any caveats, next steps — is invisible.

The conversation feels one-sided: you can see every question you ever asked, but the answers are gone.

---

## Gap 1 — Claude's Response Not Displayed (CRITICAL, data already captured)

**Severity**: High
**Effort**: Low — the data is already in `event.last_message`
**Type**: Display gap only — no hook changes needed

### What to build

In the focus panel, after the tool group for a turn, render Claude's response as a distinct block. Something like:

```
11:20:58  user_prompt   "Add auth middleware to the login route"
           ↳ 5 tool calls
         ▸ Claude:  "I've added the auth middleware to `server/middleware/auth.ts`
                    and wired it into the login route. The tests pass..."
■ Stop   11:21:20
```

The `stop` event already has the text. The UI just needs to show it.

**For subagent stops**, `subagent_stop` events also carry `last_message`. Show those too — that's the Mary/Bob handoff output.

### Implementation notes

- `event.last_message` is the field name in the `AngelEyeEvent` type
- The stop event is in `row.trailingGroup.events` — find the stop event, extract `last_message`
- Render truncated (3 lines?) with expand toggle, similar to how user prompts handle length
- Style differently from user prompts — maybe a softer background, different badge colour ("Claude" not "stop")
- The stop badge could become the expand trigger rather than a separate control

---

## Gap 2 — Stop Events Buried in Collapsed Groups (STRUCTURAL)

**Severity**: Medium
**Effort**: Medium
**Type**: UX/architecture gap

Currently the focus panel uses `buildFocusRows()` which groups everything after a prompt (tool calls + stop) into a single collapsed row. This means:

1. You have to click to expand to see anything happened
2. Stop events (which carry the response) are equal in visual weight to Read file calls
3. The conversation rhythm — prompt → work → response → prompt → work → response — is invisible

### What to build

Consider promoting `stop` events out of the collapsed group and rendering them at the prompt level. The natural reading would be:

```
[prompt row]   "Add auth middleware"
  [collapsed]   ↳ 5 tool calls  (Read × 3, Edit × 1, Bash × 1)
[response row]  Claude: "Done. Added auth.ts, wired to login route. Tests pass."
[prompt row]   "Now add rate limiting"
  [collapsed]   ↳ 3 tool calls
[response row]  Claude: "Added express-rate-limit. Default 100 req/15min..."
```

This requires a change to `buildFocusRows()` — extract stop events from the pending group and elevate them to top-level rows after the group.

---

## Gap 3 — `StopFailure` Hook Not Subscribed (NEW IN v2.1.78)

**Severity**: Medium
**Effort**: Low
**Type**: New hook event

Claude Code v2.1.78 added a `StopFailure` hook that fires when a turn ends due to an API error — rate limits, auth failures, network problems.

This is genuinely useful for a session observer:

- "Why did that session go quiet?" → rate limit hit at 11:43
- Cost spikes often correlate with repeated retries near rate limits
- Visible in the feed: `⚠ rate_limit at 11:43`

### What to add

**Server** (`hooks.ts`):

```ts
const EVENT_MAP: Record<string, AngelEyeEventType> = {
  // ... existing entries ...
  StopFailure: 'stop_failure', // NEW
};
```

**Payload** from the hook: `reason` (the error type), `session_id`, `cwd`

**UI**: Show as a warning-coloured row in the activity feed. Activity feed row summary: `⚠ API error: rate_limit`. Different visual treatment from normal stop — amber or red rather than neutral.

The shared `AngelEyeEventType` type needs `'stop_failure'` added.

---

## Gap 4 — Tool Result Not Meaningfully Shown

**Severity**: Low-Medium
**Effort**: Low
**Type**: Display gap

`PostToolUse` includes `tool_result` but it's inconsistently used. The server captures it as `event.result` for string values. The UI shows it in `eventSummary()` as part of the tool summary.

What's actually useful in the result:

- **Bash**: exit code + last N lines of output ("12 tests passed", "Error: ENOENT")
- **Write**: confirmation ("created 47 lines")
- **Edit**: diff summary ("4 lines changed")
- **Read**: not useful (file contents too long)

The `summariseTool()` function currently summarises the **input** (what was asked) but not the **result** (what happened). A Bash result of "12 passed, 0 failed" is more useful than "npm test -- auth.spec.ts".

### What to add

Extend the `summariseTool()` function (or add a parallel `summariseResult()`) that extracts meaningful signal from `tool_result` by tool type. Store it as `event.result_summary` alongside the existing `event.result`.

---

## Gap 5 — No Cost/Token Tracking

**Severity**: Low (known future feature)
**Effort**: Medium
**Type**: Missing data source

Hook events don't carry token count or cost data. This is a known limitation. The data exists in:

1. The JSONL session transcript (`~/.claude/projects/.../session-<id>.jsonl`) — `usage` blocks in assistant entries
2. The `stream-json` output format if Claude is run with `--output-format stream-json`

Not actionable tonight but worth noting: the JSONL transcript is the path to cost/token data without any new hooks. The backfill route (`/routes/backfill.ts`) is the right place to implement this.

---

## Gap 6 — Hooks Available But Not Subscribed (Future Additions)

Not needed tonight but worth having on record. From the 22 available Claude Code hooks, AngelEye subscribes to 7. These are the ones worth adding later:

| Hook                | When                                     | Why it would help                                        |
| ------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `Notification`      | Claude sends a notification to user      | Capture "Claude is asking about X" — intent signal       |
| `PermissionRequest` | Claude requests permission to run a tool | "Waiting for approval" visibility — explains silence     |
| `PreCompact`        | Before context compaction                | Flag "compacting now" in feed — explains pause           |
| `PostCompact`       | After context compaction                 | Resume signal — session now has fresh context            |
| `TeammateIdle`      | Agent teammate waiting for work          | Multi-agent orchestration visibility                     |
| `TaskCompleted`     | Background task finished                 | Task completion signal                                   |
| `PreToolUse`        | About to run a tool                      | Lower latency activity feed — shows intent before result |

`PermissionRequest` is particularly interesting: sessions that go quiet for 15+ seconds are often sitting on a permission dialog. If AngelEye received that hook, the silence detection feature (already in requirements) would know _why_ the session is quiet.

---

## Gap 7 — JSONL Transcript Not Being Read

**Severity**: Low (known gap — Source 2 in requirements)
**Effort**: High
**Type**: Missing data source

The native JSONL session transcript at `~/.claude/projects/<dir>/session-<id>.jsonl` contains:

- **Full assistant response text** for every turn (not just the last one)
- **Complete tool call + result pairs** with full content
- **Token usage** per turn (input + output + cache)
- **Cost** (derivable from tokens × model pricing)
- **Thinking blocks** (when extended thinking is active)

The `backfill` route is the right place for this — read the transcript after session end and enrich the hot file with anything the hooks didn't capture. This is how you'd get complete conversation history rather than just the most recent `last_assistant_message`.

This is the path to answering "show me everything Claude said in this session" rather than just the last response.

---

## Summary: What to Do Tonight

### Do now (low effort, high value)

| #   | What                                                                     | Where                                        | Effort |
| --- | ------------------------------------------------------------------------ | -------------------------------------------- | ------ |
| 1   | Show `event.last_message` in the focus panel after tool groups           | `ObserverView.tsx`                           | 1–2h   |
| 2   | Promote stop events out of collapsed groups, render as response rows     | `ObserverView.tsx` `buildFocusRows()`        | 1–2h   |
| 3   | Add `StopFailure` to `EVENT_MAP` + shared types + display as warning row | `hooks.ts`, shared types, `ObserverView.tsx` | 30m    |

### Do soon (medium effort, medium value)

| #   | What                                                       | Where                                            | Effort |
| --- | ---------------------------------------------------------- | ------------------------------------------------ | ------ |
| 4   | Enrich `tool_result` display for Bash/Write/Edit           | `hooks.ts` `summariseTool()`, `ObserverView.tsx` | 2h     |
| 5   | Add `PermissionRequest` hook for silence detection context | `hooks.ts`, shared types, UI                     | 1h     |

### Do later (high effort or low urgency)

| #   | What                                                                     | Where                       | Effort      |
| --- | ------------------------------------------------------------------------ | --------------------------- | ----------- |
| 6   | JSONL transcript backfill for full conversation history + cost           | `backfill.ts`               | High        |
| 7   | Token/cost tracking per session                                          | Requires JSONL + UI changes | High        |
| 8   | Remaining hook additions (TeammateIdle, TaskCompleted, PreCompact, etc.) | `hooks.ts`, shared types    | Medium each |

---

## The Core Insight

The session data model in the focus panel currently treats the conversation as a **stream of tool calls with occasional user prompts**. What it should be is **a dialogue with tool calls as intermediate steps**:

```
User:   "Add auth middleware"
Claude: [Read × 3, Edit × 1, Bash × 1]
        "Done. I added auth.ts with JWT validation and wired it to the login
         route. The middleware rejects requests missing a valid token with 401.
         Tests pass — 12/12."

User:   "Make the error messages more specific"
Claude: [Edit × 1]
        "Updated — the 401 now says 'Missing Authorization header' vs
         'Invalid token' vs 'Token expired' so clients can handle each case."
```

The data for this exists. It just needs to be surfaced.

---

**Author**: Claude Code session — gap analysis from codebase read + requirements review
**For**: AngelEye implementation session, 2026-03-18 evening
