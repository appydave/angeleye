# Wave 11 — Full Hook Coverage

**Goal**: Subscribe to ALL 24 Claude Code hook events. AngelEye's purpose is complete telemetry and observability — there's no concept of "some data." Hooks are fire-and-forget; if AngelEye isn't subscribed, the event is permanently lost.

**Context**: As of 2026-03-25, Claude Code has 24 hook events. AngelEye subscribes to 7. The other 17 are silently dropped.

---

## Current State (7 subscribed)

| Hook               | Internal Type    | What AngelEye Does                                |
| ------------------ | ---------------- | ------------------------------------------------- |
| `SessionStart`     | `session_start`  | Register session in registry                      |
| `UserPromptSubmit` | `user_prompt`    | Capture intent, feed prompt miner                 |
| `PostToolUse`      | `tool_use`       | Core activity stream, tool summarisation          |
| `Stop`             | `stop`           | Chapter boundary, context publish, classification |
| `SessionEnd`       | `session_end`    | Rotate hot file, archive, batch insert            |
| `SubagentStart`    | `subagent_start` | BMAD agent handoff detection                      |
| `SubagentStop`     | `subagent_stop`  | Agent completion, context publishing              |

---

## Missing Events (17 to add)

### Priority 1 — Session health (you're blind without these)

| Hook                 | Internal Type     | Payload Fields                            | Why It Matters                                                |
| -------------------- | ----------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `PostToolUseFailure` | `tool_failure`    | tool_name, tool_input, tool_use_id, error | Tool errors invisible — stuck sessions look idle, not errored |
| `StopFailure`        | `stop_failure`    | error, status_code                        | Rate limits and API errors look like normal stops             |
| `WorktreeCreate`     | `worktree_create` | worktree_path, worktree_branch            | Worktree sessions completely invisible to AngelEye            |
| `WorktreeRemove`     | `worktree_remove` | worktree_path                             | Worktree cleanup not tracked                                  |
| `CwdChanged`         | `cwd_changed`     | old_cwd, new_cwd (inferred)               | Multi-project sessions show original cwd forever              |

### Priority 2 — Context intelligence (classification and analytics)

| Hook                 | Internal Type         | Payload Fields                         | Why It Matters                                                |
| -------------------- | --------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `PreToolUse`         | `pre_tool_use`        | tool_name, tool_input                  | See what was attempted (even if blocked/denied)               |
| `InstructionsLoaded` | `instructions_loaded` | files (list of loaded CLAUDE.md/rules) | Know which CLAUDE.md loaded — better session classification   |
| `PreCompact`         | `pre_compact`         | (session context info)                 | Context compaction boundary — session shape analysis          |
| `PostCompact`        | `post_compact`        | (compaction result)                    | Post-compaction state                                         |
| `PermissionRequest`  | `permission_request`  | tool_name, decision                    | Permission denials tracked — distinguish blocked from errored |
| `Notification`       | `notification`        | message, type                          | Audit trail of user-visible notifications                     |

### Priority 3 — Multi-agent and advanced

| Hook                | Internal Type        | Payload Fields         | Why It Matters                                                       |
| ------------------- | -------------------- | ---------------------- | -------------------------------------------------------------------- |
| `TeammateIdle`      | `teammate_idle`      | agent_id, reason       | Multi-agent coordination visibility                                  |
| `TaskCompleted`     | `task_completed`     | task_id, result        | Task-level analytics                                                 |
| `ConfigChange`      | `config_change`      | file_path, change_type | Settings mutations during session                                    |
| `Elicitation`       | `elicitation`        | server_name, fields    | MCP structured input requests                                        |
| `ElicitationResult` | `elicitation_result` | server_name, response  | MCP responses logged                                                 |
| `FileChanged`       | `file_changed`       | file_path (inferred)   | Reactive file change detection (low priority — overlaps PostToolUse) |

---

## What Needs to Change (4 files + settings)

### 1. Type definitions — `shared/src/angeleye.ts`

**Current** (lines 3-10): `AngelEyeEventType` is a closed union of 7 string literals.

**Change**: Add 17 new event types to the union.

**Current** (lines 12-28): `AngelEyeEvent` interface has fields specific to 7 events.

**Change**: Add a generic `payload?: Record<string, unknown>` field for event-specific data from new events. Keep the existing typed fields for the original 7 — they work fine. New events put their data in `payload`. This is the fastest path. A full discriminated union refactor can come later.

### 2. Event map — `server/src/routes/hooks.ts` (lines 10-18)

**Current**: `EVENT_MAP` has 7 entries. Unknown events are warned and silently dropped (lines 56-59).

**Change**: Add 17 new entries mapping Claude hook names to AngelEye internal types.

### 3. Payload extraction — `server/src/routes/hooks.ts` (lines 77-122)

**Current**: if/elseif blocks extract fields for 7 known events.

**Change**: For the 7 existing events, keep the current extraction logic. For the 17 new events, store the full hook payload in `event.payload` with minimal extraction. This captures the data now; smarter extraction can be added per-event as needed.

A simple fallback at the end of the if/elseif chain:

```typescript
} else {
  // New events — store raw payload for now
  event.payload = {
    ...body,
    // Strip large fields to avoid bloating JSONL
    tool_result: undefined,
    last_assistant_message: typeof body.last_assistant_message === 'string'
      ? body.last_assistant_message.slice(0, 500)
      : undefined,
  };
}
```

### 4. Settings — `~/.claude/settings.json`

**Current**: 7 hook subscriptions in the `hooks` object.

**Change**: Add 17 new hook subscriptions, all using the same curl pattern:

```json
"HookEventName": [
  {
    "matcher": "",
    "hooks": [
      {
        "type": "command",
        "command": "curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/HookEventName || true"
      }
    ]
  }
]
```

### 5. Install skill update

The `angeleye-install` skill that wires hooks into settings.json needs to inject all 24 hooks, not just 7.

---

## Design Principles

1. **Capture everything, summarise later** — Store the raw payload now. Smart extraction is a refinement, not a prerequisite.
2. **Never block Claude** — All hooks return `{ continue: true }`. The `|| true` on curl ensures AngelEye being down never stalls a session.
3. **Backward compatible** — The 7 existing events keep their current extraction logic and field mapping. New events use the `payload` field. No breaking changes to the UI or archive format.
4. **Same JSONL format** — New events write to the same session JSONL files. The UI can ignore events it doesn't render yet.

---

## Out of Scope (for this wave)

- UI rendering of new events (the observer panel doesn't need to show all 24 — just store them)
- Classification rule updates (can use new events later)
- Context publisher updates
- Discriminated union refactor of `AngelEyeEvent` (future cleanup)

---

## Verification

After implementation:

1. Start a Claude Code session — confirm all 24 events appear in `~/.claude/angeleye/sessions/session-*.jsonl`
2. Trigger a tool failure (e.g., read a nonexistent file) — confirm `PostToolUseFailure` captured
3. Run `/compact` — confirm `PreCompact` + `PostCompact` captured
4. Check AngelEye UI still works with the new event types in the JSONL stream

---

## Reference

- **Full hook event list**: `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md` (24 events, all schemas)
- **Current handler code**: `server/src/routes/hooks.ts`
- **Current type definitions**: `shared/src/angeleye.ts`
- **Hook payload schemas**: Claude Code doesn't publish formal schemas — the payload fields listed above are from CHANGELOG entries and observed behaviour. Store raw payloads to capture fields we haven't documented yet.
