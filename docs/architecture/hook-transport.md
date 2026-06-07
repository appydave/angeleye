# Hook Transport — HTTP vs Curl

**Status:** **HTTP transport REJECTED after live test on 2026-05-13.** AngelEye uses curl-based command hooks. This doc captures what was tried, what broke, and how to revisit safely later.

**Decision:** The `angeleye-install` skill writes curl-based command hooks (`type: "command"`) into `~/.claude/settings.json`. Each AngelEye hook is a `curl -s -X POST … http://localhost:5051/hooks/<EventName> || true` invocation. HTTP-typed hooks (`type: "http"`) are documented and supported by Claude Code v2.1.63+, but dropped a critical event in our live test — see "What broke" below.

---

## What was tried

On 2026-05-13, M4 Mini's `~/.claude/settings.json` was migrated from curl to HTTP transport for all 24 AngelEye hooks (28 as of 2026-06-07; 30 canonical events, 2 deliberately excluded — see §"Events we deliberately don't register"). AppyCtrl T3 capability probes fire every ~5 minutes on M4, giving a fast and deterministic test signal.

| Probe time (Bangkok)  | Transport | Archive size | InstructionsLoaded | SessionStart   | SessionEnd |
| --------------------- | --------- | ------------ | ------------------ | -------------- | ---------- |
| 18:29                 | curl      | 2351 B       | ✅ 5×              | ✅             | ✅         |
| **18:34**             | **HTTP**  | **2133 B**   | ✅ 5×              | ❌ **dropped** | ✅         |
| **18:39**             | **HTTP**  | **2133 B**   | ✅ 5×              | ❌ **dropped** | ✅         |
| **18:44**             | **HTTP**  | **2133 B**   | ✅ 5×              | ❌ **dropped** | ✅         |
| 18:49 (post-rollback) | curl      | 2351 B       | ✅ 5×              | ✅             | ✅         |

Server-side request logs confirmed **zero** `POST /hooks/SessionStart` requests arrived during HTTP-transport probes — the requests weren't sent (or failed at transport before reaching the server; no errors logged either way). All other subscribed events arrived with `200 OK`.

## What broke

**Claude Code's HTTP-typed hooks do not deliver `SessionStart` events** — at least for AppyCtrl probe-style invocations on Claude Code v2.1.89 (the version active on M4 at test time). The pattern was deterministic across three back-to-back probes.

Probable cause (not confirmed):

SessionStart fires extremely early in Claude Code's session lifecycle — possibly before the HTTP-hook transport is fully initialised. Command-typed hooks shell out to a subprocess (curl), which has its own setup latency that may inadvertently mask the issue. The brain reference (`~/dev/ad/brains/anthropic-claude/claude-code/hooks/configuration-reference.md` §"HTTP Hooks") states payload equivalence between curl and HTTP hooks, but does NOT claim lifecycle equivalence.

**Impact if we had shipped HTTP:**

- AppyCtrl probes: cosmetic loss — `session_end` carries enough metadata to classify them.
- **Real human sessions: severe loss.** SessionStart is where AngelEye captures the first cwd, the project canonicalisation, `session_kind` defaults, and the seed for `first_real_prompt`. Losing it would degrade the classifier and corrupt downstream session-class derivation.

For these reasons, M4 was rolled back to curl transport at 18:48 (Bangkok) and Roamy was never migrated.

---

## Why HTTP transport remains attractive

| Property                  | Curl transport (current)                                                   | HTTP transport (potential, currently blocked)                          |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Process model             | Fork curl subprocess per hook, per session                                 | Native HTTP from Claude Code's own runtime                             |
| Per-session overhead      | 28 subprocess spawns (one per registered event; 30 canonical − 2 excluded) | 0 subprocesses; direct HTTP from one process                           |
| Failure surfacing         | `\|\| true` suffix swallows all errors silently                            | Claude Code surfaces transport errors back to the user                 |
| Timeout behaviour         | No native timeout — curl hangs the calling chain if server hangs           | Native `timeout: 30` per hook in config                                |
| Payload contract          | Same — POST JSON to URL, response shape unchanged                          | Same — POST JSON to URL, response shape unchanged                      |
| **Lifecycle reliability** | **All events deliver** (verified across 1378+ M4 sessions to date)         | **SessionStart drops in v2.1.89** (verified 3-of-3 in 2026-05-13 test) |
| Config form               | `{"type":"command","command":"curl … localhost:5051/hooks/X \|\| true"}`   | `{"type":"http","url":"http://localhost:5051/hooks/X","timeout":30}`   |
| Detection by skill        | Substring `localhost:5051` appears inside `command` field                  | Substring `localhost:5051` appears inside `url` field                  |

The transport-overhead argument hasn't gone away — 28 subprocess spawns per session is real cost. If a future Claude Code version fixes the SessionStart-drop issue, revisiting this is worthwhile.

---

## When to revisit

Re-test HTTP transport when ONE of the following changes:

1. **Anthropic ships a Claude Code release** with notes mentioning hook lifecycle / HTTP transport reliability / SessionStart timing. Check the brain reference at `~/dev/ad/brains/anthropic-claude/claude-code/hooks/configuration-reference.md` for updates.
2. **The brain reference itself updates** with explicit guidance about HTTP hook lifecycle behaviour. The current doc (`hooks/configuration-reference.md`) may not yet address lifecycle ordering — check `hooks/events-reference.md` as well.
3. **Curl transport becomes operationally painful** — e.g., disk I/O storms from subprocess spawns, observable user-facing latency, or AngelEye sessions that need sub-millisecond hook delivery.

### How to re-test (procedure)

1. Read this doc top to bottom first — the bug shape is specific and may have evolved.
2. On M4 Mini (NOT Roamy — M4 has the AppyCtrl pulse and isn't your primary work machine), back up `~/.claude/settings.json` to `~/.claude/settings.json.bak-<date>-pre-http`.
3. Run the migration script preserved in §"Migration script — preserved for re-test" below to switch all AngelEye hooks from `type: "command"` (curl) to `type: "http"`.
4. Wait 3 AppyCtrl probe cycles (~15 minutes) and compare archive entries to the table above. If file size is back to 2351 B and `session_start` events are present, the bug is fixed.
5. If still broken, restore from backup immediately. Update this doc with the new test results.

### Migration script — preserved for re-test

```python
import json
from pathlib import Path

SETTINGS = Path.home() / ".claude" / "settings.json"
d = json.loads(SETTINGS.read_text())

# Discover events from running AngelEye server, fall back to embedded list
import urllib.request
try:
    with urllib.request.urlopen("http://localhost:5051/api/hooks/supported", timeout=2) as r:
        EVENTS = json.load(r)["events"]
except Exception:
    # 28 events: 30 canonical (v2.1.167) minus WorktreeCreate and MessageDisplay (excluded — see §"Events we deliberately don't register")
    # Canonical full list: ~/dev/ad/brains/anthropic-claude/claude-code/hooks/events-reference.md
    EVENTS = ["SessionStart","UserPromptSubmit","UserPromptExpansion","PostToolUse","PostToolBatch","Stop","SessionEnd","SubagentStart","SubagentStop","PostToolUseFailure","StopFailure","WorktreeRemove","CwdChanged","PreToolUse","InstructionsLoaded","PreCompact","PostCompact","PermissionRequest","PermissionDenied","Notification","TeammateIdle","TaskCompleted","TaskCreated","ConfigChange","Elicitation","ElicitationResult","FileChanged","Setup"]

hooks = d.setdefault("hooks", {})
for ev in EVENTS:
    entries = hooks.get(ev, [])
    new_entries = []
    for entry in entries:
        hook_list = entry.get("hooks", [])
        is_angel = any("localhost:5051" in (h.get("command","") + h.get("url","")) for h in hook_list)
        if not is_angel:
            new_entries.append(entry)
    new_entries.append({
        "matcher": "",
        "hooks": [{"type": "http", "url": f"http://localhost:5051/hooks/{ev}", "timeout": 30}]
    })
    hooks[ev] = new_entries

SETTINGS.write_text(json.dumps(d, indent=2) + "\n")
print("Migration done. Restart Claude Code or wait for the next session.")
```

---

## Current rollback procedure (if HTTP gets re-tried and breaks)

If you re-run the migration script above and need to roll back fast:

```bash
# Restore from your pre-test backup
cp ~/.claude/settings.json.bak-<date>-pre-http ~/.claude/settings.json
```

That's the only step needed — Claude Code reads settings on session start, so the next AppyCtrl probe (or your next Claude Code restart) picks up curl transport again.

If the backup is missing or corrupt, the canonical curl entry shape is:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "command",
      "command": "curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/<EventName> || true"
    }
  ]
}
```

Use the discovery endpoint to learn which events to subscribe to:

```bash
curl -s http://localhost:5051/api/hooks/supported | jq -r '.events[]'
```

…and write one entry like the above for each event into `~/.claude/settings.json` under `hooks.<EventName>`.

---

## Events we deliberately don't register (and why)

AngelEye handles **30 hook events** (canonical spec v2.1.167 — see `~/dev/ad/brains/anthropic-claude/claude-code/hooks/events-reference.md` for the full list with payloads). Of those, **28 are wired as live command hooks** in `~/.claude/settings.json`. Two are deliberately excluded:

| Event            | Status                        | Reason                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorktreeCreate` | **HARD EXCLUDE — never wire** | Replaces git's worktree creation entirely (no observer-only mode). A passthrough `curl \|\| true` hook causes Claude Code to read the curl response body as the worktree path → `ENOENT`, breaking background-isolated sessions. Confirmed production bug on M4 Mini (2026-05-19). See `docs/architecture/worktree-hook-passthrough-fix.md` for full root-cause write-up. |
| `MessageDisplay` | Opt-in only                   | Fires on every message render — highest-frequency hook, display-only. Duplicates assistant text already captured at `Stop`. Excluded to avoid per-render subprocess overhead. Add deliberately (with sampling) only if render-level events are a wanted feature.                                                                                                          |

`WorktreeRemove` IS wired (observer-only, safe — failures are logged but no path/decision output is required).

The exclusions are enforced at the **source of truth**: `GET /api/hooks/supported` returns a `register` list (the 28 safe events) plus an `excluded` list with reasons. The `angeleye-install` skill wires only the `register` list, so a future re-install cannot silently re-introduce the WorktreeCreate bug.

---

## Why we keep curl's `|| true` silent-failure pattern

It's a tradeoff, and the tradeoff still works in curl's favour:

- **Pro** of silent failure: when AngelEye is genuinely down (server crashed, machine offline), every Claude Code prompt would otherwise surface a connection error to the user. With `|| true`, the user keeps working uninterrupted.
- **Con** of silent failure: when AngelEye is silently misbehaving (server up but a specific endpoint broken), the user has no in-Claude-Code signal — they discover it later from corpus gaps.

The con is real (it's how we discovered the AppyCtrl backup bug earlier in this session), but the pro outweighs it: AngelEye must not interrupt the user's coding flow on its own outages. Discovery of silent failures is what the `/diagnostics` view and `_unknownHooksPath` log are for.

---

## Mixed-transport state

The skill's safety scan identifies AngelEye entries by `localhost:5051` appearing in either `command` (curl) or `url` (http). This means: even though HTTP is currently rejected, running the skill on a machine that somehow still has HTTP-shaped entries (from an aborted migration) is safe — they'll be replaced with curl-shaped entries cleanly.

If a future re-test re-introduces HTTP and you have machines that disagree on transport, that's also fine — AngelEye's server endpoint is unchanged. Transport is purely a client-side concern.
