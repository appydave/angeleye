# AngelEye — UI Concepts Plan

**Created**: 2026-03-18
**Context**: Follow-on from gap analysis (`gap-analysis-data-capture.md`). Two concepts to design and build — one that fixes the immediate display gaps, one that opens up all the raw hook data for evaluation.

---

## Concept 1 — Dialogue View (Better Information Display)

### The problem it solves

The observer currently reads like a log of tool calls with occasional user prompts. It is not a conversation. Claude's responses are invisible. Martin's observation was exactly right: you can see what you said but not what Claude said back.

Three specific gaps from the gap analysis feed into this concept:

**Gap 1** — Claude's response text (`event.last_message` from the Stop hook) is captured but never displayed. Every completed turn already has the text available — it just needs to be shown.

**Gap 2** — Stop events are buried inside collapsed tool groups. The conversation rhythm (prompt → work → response) is invisible because stop and tool calls are treated as equal-weight items in the same collapsed row.

**Gap 3** — `StopFailure` (new in v2.1.78) is not subscribed. API errors — rate limits, auth failures — currently cause silent gaps in the feed with no explanation.

### What this view would look like

The focus panel becomes a dialogue, not a log. Each exchange has a clear three-part shape:

```
[USER PROMPT]   "Add auth middleware to the login route"

  [TOOL GROUP]  ↳ 5 tool calls  (Read × 3, Edit × 1, Bash × 1)
                  [collapsed by default, expandable]

[CLAUDE REPLY]  "I've added the auth middleware to server/middleware/auth.ts
                 and wired it into the login route. The middleware rejects
                 requests missing a valid token with 401. Tests pass — 12/12."

[USER PROMPT]   "Make the error messages more specific"
  ...
```

Stop events are promoted out of the collapsed group and rendered as first-class response rows at the same visual level as user prompts. The tool group becomes the supporting detail, not the main story.

Error turns get a distinct warning treatment:

```
[USER PROMPT]   "Run the full test suite"
  [TOOL GROUP]  ↳ 1 tool call
[API ERROR]  ⚠ rate_limit at 14:37 — turn ended before response
```

### Key design decisions

- **Claude response badge**: Different from the stop badge. Something like "Claude" or "Response" in a softer colour (not the amber/red of errors, not the neutral grey of stops).
- **Truncation**: 3-4 lines with an expand toggle, same as how user prompts handle long text today.
- **Subagent responses**: `SubagentStop` also carries `last_message`. These should render too — that's the Mary/Bob handoff output. Could use a slightly different badge to signal "subagent" vs main session.
- **StopFailure row**: Amber/warning colour. Shows the error type (`rate_limit`, `auth_failure`). Explains silence.
- **Empty response guard**: Some stops have no `last_message` (e.g. session end without a final turn). Gracefully omit the response row rather than showing empty.

### What changes

| File                         | Change                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `ObserverView.tsx`           | `eventSummary()` for stop — read and truncate `event.last_message`           |
| `ObserverView.tsx`           | `buildFocusRows()` — extract stop events, elevate to top-level response rows |
| `ObserverView.tsx`           | Add response row component with expand toggle                                |
| `ObserverView.tsx`           | Add StopFailure row component (warning style)                                |
| `server/src/routes/hooks.ts` | Add `StopFailure: 'stop_failure'` to `EVENT_MAP`                             |
| Shared types                 | Add `'stop_failure'` to `AngelEyeEventType`                                  |

### Effort estimate

- Gap 1 (show `last_message`): ~1h
- Gap 2 (promote stop events, restructure focus rows): ~2h
- Gap 3 (StopFailure hook + display): ~30m

Total: ~3.5h for a complete dialogue view.

---

## Concept 2 — Signal Lab (Hook Explorer)

### The problem it solves

We are currently subscribed to 7 of the 22 available Claude Code hooks. The other 15 are firing in every session and we are seeing nothing. Some of them are clearly useful (PermissionRequest, PreCompact, Notification). Others are unknown quantities — we don't know what their payloads look like in practice, or whether they fire often enough to be worth subscribing to.

Before wiring up new hooks, we need a way to see them. A development/evaluation UI that catches everything, shows raw payloads, and helps answer: "is this field useful? should we capture it?"

This is not a user-facing production view. It is a diagnostic tool for evaluating what to bring into the system.

### What this view would show

**Hook coverage dashboard**: A table of all 22 hooks showing for each one:

- Is it subscribed? (yes / no)
- How many times has it fired this session? (live counter)
- When did it last fire?
- Is the data being captured, or silently dropped?

| Hook              | Subscribed | Fires | Last seen | Status         |
| ----------------- | ---------- | ----- | --------- | -------------- |
| PreToolUse        | no         | 0     | never     | not subscribed |
| PostToolUse       | yes        | 47    | 14:31:02  | capturing      |
| Stop              | yes        | 3     | 14:31:20  | capturing      |
| StopFailure       | no         | 0     | never     | not subscribed |
| PermissionRequest | no         | 0     | never     | not subscribed |
| PreCompact        | no         | 0     | never     | not subscribed |
| ...               |            |       |           |                |

**Live event stream**: A raw feed of every hook event that arrives, unsummarised. Shows:

- Hook name
- Timestamp
- Full payload (expandable JSON)
- Which fields are present (presence/absence map)

Useful for catching "I didn't know this field existed" moments.

**Payload inspector**: Click any event in the stream to see the full JSON payload with field annotations — which fields AngelEye currently captures, which it drops, which are new/unknown.

**Field frequency analysis**: Over a session, which fields appear? How often? For a `PostToolUse` event: `tool_name` appears 100% of the time, `tool_result` appears 87% of the time, `working_directory` appears 100%. Helps prioritise what to store.

### Hooks worth subscribing to (from gap analysis)

These are the highest-value additions identified from the 22 available hooks:

| Hook                | Why it's useful                                                  |
| ------------------- | ---------------------------------------------------------------- |
| `PermissionRequest` | Explains session silence — Claude is waiting for approval        |
| `PreCompact`        | "Compacting now" signal — explains pause in activity             |
| `PostCompact`       | Resume signal — session has fresh context                        |
| `Notification`      | Intent signal — what Claude is asking about                      |
| `PreToolUse`        | Lower-latency activity feed — shows intent before result arrives |
| `TaskCompleted`     | Background task completion signal                                |
| `TeammateIdle`      | Multi-agent orchestration visibility                             |
| `StopFailure`       | API error visibility (already in Concept 1)                      |

The Signal Lab is the right place to evaluate each of these before committing to subscriptions and data storage.

### Navigation

This is a separate view from the Observer, not a panel within it. Could be accessed via a "Signal Lab" tab or a dev-mode toggle. Not relevant to casual session watching — only relevant when evaluating the data model.

### What changes

| File                                 | Change                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/routes/hooks.ts`         | Add a parallel "catch-all" endpoint for the Signal Lab that receives all 22 hooks without normalising them — stores raw payloads separately |
| `client/src/views/SignalLabView.tsx` | New view: hook coverage table, live raw event stream, payload inspector                                                                     |
| `client/src/App.tsx`                 | Add Signal Lab route/tab                                                                                                                    |
| `hooks.ts` (Claude Code config)      | Add all 22 hook subscriptions pointing to a `/events/raw` endpoint alongside the existing `/events` endpoint                                |

**Alternative approach** (lower complexity): Instead of a parallel raw endpoint, add a `raw_payload` field to every stored event and surface it in a "developer panel" expandable within the existing observer. Less surgical but simpler.

### Effort estimate

- Hook coverage dashboard: ~2h
- Live raw event stream: ~1.5h
- Payload inspector: ~1h
- Claude Code config: ~30m

Total: ~5h for a complete Signal Lab. The "developer panel" alternative is ~2h.

---

## Relationship Between the Two Concepts

Concept 1 (Dialogue View) is a **production improvement** — it fixes the most important gap in the current observer and makes it genuinely useful for watching sessions.

Concept 2 (Signal Lab) is a **development tool** — it helps us evaluate what data is available before we decide what to add to the production observer. Running it for a few sessions would tell us whether PermissionRequest fires often enough to be worth subscribing to, what fields are in PreCompact payloads, etc.

The natural sequence: build Concept 1 tonight (it's lower effort and higher immediate value), then use Concept 2 to inform the next round of hook additions.

---

## Reference

- **Gap analysis**: `docs/gap-analysis-data-capture.md` — full breakdown of all 7 gaps
- **Hook reference**: `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md` — all 22 hooks with versions and payloads
- **Key files to change**: `client/src/views/ObserverView.tsx`, `server/src/routes/hooks.ts`, shared types

---

**Author**: Planning document — AngelEye UI concepts, 2026-03-18
