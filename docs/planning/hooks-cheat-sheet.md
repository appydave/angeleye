# Claude Code Hooks Cheat Sheet — AngelEye Reference

**Source docs**: `brains/anthropic-claude/claude-code/hooks-reference.md`, `observability.md`, `background-agents.md`
**AngelEye hook handler**: `server/src/routes/hooks.ts`
**Total hook events**: 25
**Hook default timeout**: 10 minutes (v2.1.2+)
**Last updated**: 2026-03-29

---

## All 25 Hook Events

| Hook Name              | When It Fires                                                 | Key Input Payload Fields                                            | AngelEye Status | Practical Use Cases for AngelEye                                                                                                                                               | Latency Note            |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **PreToolUse**         | Before any tool runs (blocking)                               | `tool_name`, `tool_input`, `tool_use_id`                            | Wired (Wave 11) | Block destructive Bash in sensitive stations; inject station context into model before tool runs; detect `/bmad-*` skill invocations early via Bash input                      | Real-time, blocks tool  |
| **PostToolUse**        | After tool completes successfully                             | `tool_name`, `tool_input`, `tool_result`, `tool_use_id`             | Wired (Wave 1)  | Primary activity feed; track file writes per station; detect test runs; update `last_active` in registry; classify what kind of work happened                                  | Real-time               |
| **PostToolUseFailure** | After a tool call fails                                       | `tool_name`, error details                                          | Wired (Wave 11) | Surface tool errors in the AngelEye UI; detect persistent failures as station health signals                                                                                   | Real-time               |
| **UserPromptSubmit**   | User submits a prompt (before processing)                     | `user_prompt`                                                       | Wired (Wave 1)  | Earliest detection of `/bmad-*` commands for station routing; capture `first_real_prompt`; detect multi-command patterns (e.g. `/bmad-sm /bmad-po`)                            | Real-time, pre-LLM      |
| **Stop**               | Main agent finishes a response turn                           | `reason`, `transcript_path`, `last_assistant_message` (v2.1.47)     | Wired (Wave 1)  | Primary trigger for `classifySession()`; update registry classification after each turn; detect task completion signals; check `last_assistant_message` for completion phrases | Per-turn boundary       |
| **SubagentStop**       | Subagent (foreground) finishes                                | `reason`, `transcript_path`, `last_assistant_message`, `agent_type` | Wired (Wave 1)  | Track Nate's 6 review sub-agents completing; update StationInstance sub-agent counts; store sub-agent outcomes in station timeline                                             | Per sub-agent turn      |
| **SessionStart**       | Session opens                                                 | `session_id`, `cwd`, `project_dir`                                  | Wired (Wave 1)  | Create registry entry; initialize hot store file; detect project from `cwd`; start station association timer                                                                   | Session boundary        |
| **SessionEnd**         | Session closes cleanly                                        | `session_id`, `transcript_path`, final state                        | Wired (Wave 1)  | Archive session; final `classifySession()`; rotate to archive; trigger Supabase cold-path batch; mark StationInstance as `completed`                                           | Session boundary        |
| **PreCompact**         | Context compaction about to start                             | signals memory pressure                                             | Wired (Wave 11) | Log compaction pressure events; could be a signal that a long-running station is near context limit — flag in UI                                                               | Rare, real-time         |
| **PostCompact**        | Context compaction finished (v2.1.76)                         | post-compaction state                                               | Wired (Wave 11) | Log compaction completion; reset context pressure flag in station health                                                                                                       | Rare, real-time         |
| **Notification**       | User is notified of something                                 | notification content                                                | Wired (Wave 11) | Log notification events for audit trail; surface in AngelEye activity stream                                                                                                   | Real-time               |
| **SubagentStart**      | Foreground subagent spawns (v2.0.43)                          | `agent_type` (if `--agent` specified)                               | Wired (Wave 1)  | Track sub-agent spawn time; begin timing sub-agent duration; associate with current station; visualize which sub-agents are active inside a station                            | Real-time               |
| **PermissionRequest**  | Tool requests permission from user (v2.0.45)                  | `tool_name`, permission context                                     | Wired (Wave 11) | Record that a human was pulled in for a decision; flag in station timeline as "blocked on human"; potential signal that station hit an unexpected boundary                     | Real-time, blocking     |
| **TeammateIdle**       | Agent teammate finishes and waits for work (v2.1.33)          | teammate coordination state                                         | Wired (Wave 11) | Signal that a station's agent has gone idle — use to trigger next station in workflow; detect when Relay or Sentinel agents are waiting for work                               | Real-time               |
| **TaskCompleted**      | Task completes in multi-agent workflow (v2.1.33)              | task details, outcome                                               | Wired (Wave 11) | Primary station-transition signal in multi-agent BMAD workflows; fire station state machine from `in_progress` to `complete`; trigger next station activation                  | Real-time               |
| **ConfigChange**       | Configuration files change during session (v2.1.49)           | changed config context                                              | Wired (Wave 11) | Detect mid-session CLAUDE.md edits; security audit log; low-value for normal AngelEye use                                                                                      | Rare, real-time         |
| **WorktreeCreate**     | Agent worktree isolation creates a worktree (v2.1.50)         | isolation context                                                   | Wired (Wave 11) | Track which sessions are running in worktrees vs main branch; associate worktree sessions with PR/epic context                                                                 | Real-time               |
| **WorktreeRemove**     | Agent worktree isolation removes a worktree (v2.1.50)         | cleanup context                                                     | Wired (Wave 11) | Signal that an isolated workflow completed; potential station closure trigger                                                                                                  | Real-time               |
| **InstructionsLoaded** | CLAUDE.md or `.claude/rules/*.md` loads (v2.1.69)             | which files loaded                                                  | Wired (Wave 11) | Detect which skill/agent loaded — if `bmad-sm.md` loaded, can pre-classify session as SM station before first prompt                                                           | Session start, one-shot |
| **Elicitation**        | MCP server requests structured input mid-task (v2.1.76)       | form data, MCP server context                                       | Wired (Wave 11) | Low-value for AngelEye unless using MCP tools extensively; log for audit                                                                                                       | Rare, real-time         |
| **ElicitationResult**  | After elicitation response sent back (v2.1.76)                | what was sent to MCP server                                         | Wired (Wave 11) | Audit trail only; no routing value                                                                                                                                             | Retrospective           |
| **StopFailure**        | Turn ends due to API error (rate limit, auth, etc.) (v2.1.78) | error type, rate limit info                                         | Wired (Wave 11) | Surface in station health as `error` state; alert that session/station may be stalled; distinguish from clean Stop                                                             | Real-time               |
| **CwdChanged**         | Working directory changes during session (v2.1.83)            | new cwd path                                                        | Wired (Wave 11) | Update `project_dir` in registry if agent moves between projects; re-evaluate project classification                                                                           | Real-time               |
| **FileChanged**        | Files change during session (v2.1.83)                         | file paths, change type                                             | Wired (Wave 11) | Detect spec/story file edits as station activity evidence; track which files touched per station                                                                               | Real-time               |
| **TaskCreated**        | Task created via `TaskCreate` (v2.1.84)                       | task details                                                        | NOT wired       | Track task creation in multi-agent workflows; could pre-populate StationInstance before TaskCompleted fires                                                                    | Real-time               |

---

## AngelEye Wiring Summary

| Status                    | Count | Events                                                                                                                                                                                                                                                        |
| ------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wired (Wave 1 original)   | 7     | SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd, SubagentStart, SubagentStop                                                                                                                                                                    |
| Wired (Wave 11 additions) | 17    | PostToolUseFailure, StopFailure, WorktreeCreate, WorktreeRemove, CwdChanged, PreToolUse, InstructionsLoaded, PreCompact, PostCompact, PermissionRequest, Notification, TeammateIdle, TaskCompleted, ConfigChange, Elicitation, ElicitationResult, FileChanged |
| NOT wired                 | 1     | TaskCreated                                                                                                                                                                                                                                                   |

---

## Key Patterns for Workflow Routing

### Which Hooks Fire DURING a Conversation Turn vs at Session Boundaries

**Within a single conversation turn** (between one user message and the model's response):

- `UserPromptSubmit` — fires first, before the LLM sees the prompt
- `PreToolUse` — fires before each tool call within the turn
- `PostToolUse` — fires after each tool call within the turn
- `PostToolUseFailure` — fires if a tool call errors
- `PermissionRequest` — fires if a tool needs human permission mid-turn
- `Notification` — fires if Claude sends a user notification mid-turn
- `SubagentStart` / `SubagentStop` — fire if the Agent tool is called within the turn
- `TeammateIdle` — fires when a subagent finishes and returns control

**At turn boundaries** (after model responds, before next prompt):

- `Stop` — fires after each complete model response turn; this is the primary session classification trigger in AngelEye

**At session boundaries** (not tied to individual turns):

- `SessionStart` — fires once when the session opens
- `SessionEnd` — fires once when the session closes cleanly
- `InstructionsLoaded` — fires once at session open as CLAUDE.md files load
- `PreCompact` / `PostCompact` — fire when context compaction occurs (can happen mid-session)

**Outside normal turn flow** (background/async agents, v2.0.60+):

- `TaskCreated` — fires when `TaskCreate` tool is called in a multi-agent workflow
- `TaskCompleted` — fires when a background or teammate task finishes
- `WorktreeCreate` / `WorktreeRemove` — fire during worktree lifecycle operations
- `CwdChanged` / `FileChanged` — fire reactively from filesystem/shell state changes

---

### The Stop Hook's Relationship to Classification

`Stop` fires after every assistant response turn — not just at session end. This is the heartbeat for AngelEye session classification.

**Current flow in `hooks.ts`**:

1. `Stop` fires
2. `getSessionEvents(sessionId)` loads all events for the session from the hot store
3. `classifySession(allEvents, sessionId, cwd)` runs heuristics over the full event log
4. Result written back to `updateRegistry(sessionId, { ...classification })`

**Why this is the right trigger** (not `SessionEnd`):

- `SessionEnd` only fires on clean close — crashes, Ctrl+C, and `claude --continue` may not trigger it
- `Stop` fires after every turn, so the registry stays fresh even in long-running sessions
- The `last_assistant_message` field (v2.1.47) lets classifiers inspect the model's final words without parsing the JSONL transcript

**For workflow routing**: After `Stop`, the classifier has enough signal to determine if this session maps to a BMAD station (SM, PO, Nate, etc.) and can update `StationInstance.state` accordingly.

---

### UserPromptSubmit as Early Detection Signal for /bmad-\* Commands

`UserPromptSubmit` fires before the LLM processes the prompt. This is the only hook that provides the raw user text pre-LLM.

**Detection opportunities**:

1. **Single command**: `/bmad-sm` → immediately classify session as SM station, create `StationInstance` before any tools run

2. **Multi-command pattern**: `/bmad-sm /bmad-po` → flag as ambiguous routing case; display disambiguation UI in AngelEye

3. **Contextual commands**: `/bmad-story-1` or `/bmad-epic-3` → extract story/epic numbers for registry tagging

4. **Non-BMAD prompt**: Freeform text → mark `first_real_prompt` if not yet captured (current behavior in `hooks.ts` lines 214-223)

**Implementation note**: `hooks.ts` already extracts `user_prompt` and writes `first_real_prompt` to registry. Workflow routing logic should be added in the same `user_prompt` branch — check for `/bmad-` prefix and call `createOrAssociateStation()`.

---

### SubagentStart / SubagentStop Mapping to Station Sub-Agent Tracking

Within a BMAD station, sub-agents run as foreground subagents via the `Agent` tool. Nate's station, for example, spawns 6 review sub-agents.

**SubagentStart** provides:

- `agent_type` — populated only if `--agent <name>` was specified; blank for anonymous subagents
- `agent_id` — unique identifier for this subagent instance (v2.1.69)
- `session_id` — parent session; subagent writes its own JSONL file with `isSidechain: true`

**SubagentStop** provides:

- Same fields as SubagentStart plus:
- `reason` — why the sub-agent stopped
- `last_assistant_message` — sub-agent's final output (v2.1.47)
- `transcript_path` — path to the subagent's JSONL file

**AngelEye workflow routing pattern**:

- On `SubagentStart`: Increment `StationInstance.active_subagents` counter; add entry to station timeline
- On `SubagentStop`: Decrement counter; record outcome; if `active_subagents === 0 && expected_subagents === N`, fire station completion check
- Match sub-agents to station via `session_id` (parent) → `StationInstance.session_id`

---

### TaskCompleted / TaskCreated for Multi-Agent Workflow Coordination

These hooks are purpose-built for multi-agent swarm/team workflows where Claude coordinates multiple agents via the task system.

**TaskCreated** (v2.1.84 — NOT yet wired in AngelEye):

- Fires when `TaskCreate` is called
- Provides task metadata before any work starts
- **AngelEye opportunity**: Pre-populate `StationInstance` with task intent; show "queued" state in pipeline view before the station session opens

**TaskCompleted** (v2.1.33 — wired Wave 11):

- Fires when a background or teammate task finishes
- Provides task outcome
- **AngelEye opportunity**: Primary station-transition trigger in automated BMAD workflows where stations are fully agent-driven; fire `StationInstance.state = 'complete'` and activate next station config

**Relationship to TeammateIdle**:

- `TeammateIdle` fires when an agent finishes and waits — this is the "I'm done, what's next?" signal
- `TaskCompleted` fires when the task object itself closes — this is the "the work is confirmed done" signal
- For station routing: use `TaskCompleted` as the authoritative transition trigger; use `TeammateIdle` as an early warning to pre-load next station config

---

### Hooks That Are Low-Value / Useless for AngelEye

| Hook                                | Why Low-Value                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **ConfigChange**                    | Only fires if CLAUDE.md/settings change during a session; rare in normal workflow use; security audit use only    |
| **Elicitation / ElicitationResult** | Only relevant if AngelEye uses MCP tools that request structured input; current AngelEye uses HTTP hooks, not MCP |
| **PreCompact**                      | Fires before compaction — no actionable data; `PostCompact` is slightly more useful but still mostly noise        |
| **WorktreeCreate / WorktreeRemove** | Useful only if AngelEye explicitly tracks worktree-isolated sessions; no current workflow feature depends on this |
| **Notification**                    | Fires for user notifications but provides no workflow-routing signal; useful for audit log only                   |
| **CwdChanged**                      | Only fires if the agent changes its working directory mid-session; rare in single-project BMAD workflows          |

---

## Quick-Reference: For X Use Case, Tap Y Hook

| Use Case                                                      | Hook(s) to Tap                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Detect session opening and register in registry               | `SessionStart`                                                                  |
| Classify session into BMAD station early                      | `UserPromptSubmit` (command detection) + `InstructionsLoaded` (skill detection) |
| Update session classification after each turn                 | `Stop`                                                                          |
| Track which tools ran in a station                            | `PostToolUse`                                                                   |
| Detect a tool failure in a station                            | `PostToolUseFailure`                                                            |
| Know when a sub-agent starts/finishes within a station        | `SubagentStart`, `SubagentStop`                                                 |
| Trigger station-to-station transitions in automated workflows | `TaskCompleted`                                                                 |
| Detect that an agent is idle and ready for next task          | `TeammateIdle`                                                                  |
| Detect API errors that stalled a station                      | `StopFailure`                                                                   |
| Catch `/bmad-*` command before LLM processes it               | `UserPromptSubmit`                                                              |
| Know when session ends cleanly                                | `SessionEnd`                                                                    |
| Track files written during a station                          | `PostToolUse` (filter `tool_name === "Write"`) + `FileChanged`                  |
| Auto-approve read-only tool permissions                       | `PermissionRequest`                                                             |
| Block dangerous tools in sensitive stations                   | `PreToolUse` (return `deny`)                                                    |
| Pre-populate station before session opens                     | `TaskCreated` (not yet wired)                                                   |
| Detect context pressure in long-running station               | `PreCompact`                                                                    |

---

## Hook Input/Output Reference

### Common Input Fields (all hooks)

```json
{
  "session_id": "string",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/current/working/dir",
  "hook_event_name": "Stop",
  "agent_id": "string (v2.1.69)",
  "agent_type": "string (v2.1.69)"
}
```

### Standard Output (AngelEye always returns)

```json
{ "continue": true }
```

### PreToolUse Extended Output (for blocking/modification)

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "allow|deny|ask",
    "updatedInput": { "field": "modified_value" },
    "additionalContext": "Extra context injected into model"
  }
}
```

### Stop/SubagentStop Additional Input (v2.1.47)

```json
{
  "reason": "stop_sequence",
  "last_assistant_message": "Final response text..."
}
```

### Exit Codes for Command Hooks

- `0` — success, tool proceeds
- `2` — blocking error, halts execution, stderr fed to Claude
- Other — non-blocking error, continues

---

## Hook Transport Options

| Type               | Config                                           | Best For                                   |
| ------------------ | ------------------------------------------------ | ------------------------------------------ |
| **command**        | `"type": "command", "command": "bash script.sh"` | Deterministic checks, file system ops      |
| **prompt**         | `"type": "prompt", "prompt": "Validate..."`      | LLM-driven decisions, context-aware logic  |
| **http** (v2.1.63) | `"type": "http", "url": "https://..."`           | AngelEye server (`POST /api/hooks/:event`) |
| **agent**          | `"type": "agent", "agent": "name"`               | Complex multi-step validation              |

AngelEye uses HTTP hooks — the Claude Code client POSTs to `http://localhost:5501/api/hooks/:event`.

---

## Environment Variables Available in Hook Scripts

| Variable              | Use                                                 |
| --------------------- | --------------------------------------------------- |
| `$CLAUDE_SESSION_ID`  | Session-scoped file naming                          |
| `$CLAUDE_PROJECT_DIR` | Project root path                                   |
| `$CLAUDE_PLUGIN_ROOT` | Plugin directory (portable paths)                   |
| `$CLAUDE_PLUGIN_DATA` | Persistent plugin state (survives updates, v2.1.78) |
| `$CLAUDE_ENV_FILE`    | Persist env vars (SessionStart only)                |
| `$CLAUDE_CODE_REMOTE` | Set if remote context                               |

---

## Critical Gotchas

1. **Hooks load at session start** — editing hook config requires restarting Claude Code. HTTP hooks pointing to AngelEye server are live (server changes take effect immediately), but the hook registration itself is cached.

2. **Stop hook infinite loop guard** — AngelEye `hooks.ts` checks `body.stop_hook_active === true` first and returns `{ continue: true }` immediately. Do not remove this guard.

3. **Parallel execution** — all matching hooks run in parallel. They cannot read each other's output. Design each hook to be independent.

4. **`progress` entries dominate JSONL** — when parsing session transcripts, skip `type === "progress"` entries. They are hook execution records (~75% of entries in hook-heavy sessions) and contain no conversation content.

5. **`SessionEnd` is unreliable** — crashes, Ctrl+C, and `claude --continue` may bypass it. Use `Stop` as the primary classification trigger, `SessionEnd` as confirmation only.

6. **`TaskCreated` is not yet wired in AngelEye** — this is the one gap in the 25-event coverage. Add it to `EVENT_MAP` in `hooks.ts` to complete full coverage.
