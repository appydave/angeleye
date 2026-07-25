# Hook Transport — HTTP vs Curl

> ## ⚠️ CORRECTION (2026-07-25) — the 2026-05-13 diagnosis below was WRONG
>
> This doc previously concluded **"HTTP transport REJECTED"** on the theory that `SessionStart`
> "fires extremely early… possibly before the HTTP-hook transport is fully initialised."
>
> **That is not what happened. `SessionStart` does not accept `http` hooks at all — by design.**
> From the official Claude Code hooks docs, verified 2026-07-25:
>
> > "SessionStart runs on every session, so keep these hooks fast. Only `type: "command"` and
> > `type: "mcp_tool"` hooks are supported."
>
> An `http` hook on `SessionStart` is an **invalid configuration that is silently ignored** — which
> is exactly the observed result: zero `POST /hooks/SessionStart` requests, deterministic across
> 3-of-3 probes, every other event delivering `200 OK`. Not a timing race, not a bug, and **never
> going to be "fixed" in a future release.**
>
> AngelEye's own planning docs already recorded the rule —
> `docs/planning/angeleye-live-hook-liveness/AGENTS.md` §"Command/mcp_tool-only events" — it was
> just never connected to this decision.
>
> **What this changes:** HTTP transport is **not blocked**. A _hybrid_ was available the whole
> time and still is. See §"The hybrid that was always available" below. The empirical test data in
> this doc remains valid and is worth keeping; only the causal explanation was wrong.

---

**Status:** **Curl-only transport, pending the hybrid migration.** The blanket "HTTP rejected"
verdict is superseded by the correction above.

**Decision:** The `angeleye-install` skill writes curl-based command hooks (`type: "command"`) into `~/.claude/settings.json`. Each AngelEye hook is a `curl -s -X POST … http://localhost:5051/hooks/<EventName> || true` invocation. HTTP-typed hooks (`type: "http"`) are documented and supported by Claude Code v2.1.63+ — but **not for every event**, which is what the 2026-05-13 test actually discovered.

---

## What was tried

On 2026-05-13, M4 Mini's `~/.claude/settings.json` was migrated from curl to HTTP transport for all 24 AngelEye hooks (29 as of 2026-07-25; 31 canonical events, 2 deliberately excluded — see §"Events we deliberately don't register"). AppyCtrl T3 capability probes fire every ~5 minutes on M4, giving a fast and deterministic test signal.

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

~~Probable cause (not confirmed): SessionStart fires extremely early in Claude Code's session lifecycle — possibly before the HTTP-hook transport is fully initialised.~~

**✅ CONFIRMED CAUSE (2026-07-25): `SessionStart` only supports `command` and `mcp_tool` hook
types.** An `http` hook registered on `SessionStart` is invalid and silently dropped. Source:
[code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) — _"SessionStart runs on
every session, so keep these hooks fast. Only `type: "command"` and `type: "mcp_tool"` hooks are
supported."_ Mirrored in the brain's event×type validity matrix at
`~/dev/ad/brains/anthropic-claude/claude-code/hooks/configuration-reference.md` §2.

The determinism of the failure (3-of-3, zero requests, no errors, all other events fine) is the
signature of a config-validation drop, not a race. The original timing hypothesis predicted
_intermittent_ loss; we observed _total_ loss. That mismatch should have been the tell.

**Impact if we had shipped HTTP:**

- AppyCtrl probes: cosmetic loss — `session_end` carries enough metadata to classify them.
- **Real human sessions: severe loss.** SessionStart is where AngelEye captures the first cwd, the project canonicalisation, `session_kind` defaults, and the seed for `first_real_prompt`. Losing it would degrade the classifier and corrupt downstream session-class derivation.

For these reasons, M4 was rolled back to curl transport at 18:48 (Bangkok) and Roamy was never migrated.

---

## Why HTTP transport remains attractive

| Property                  | Curl-only (current)                                                        | Hybrid: http + curl for the 4 command-only events (available now)                                                                               |
| ------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Process model             | Fork curl subprocess per hook, per session                                 | Native HTTP from Claude Code's own runtime                                                                                                      |
| Per-session overhead      | 29 subprocess spawns (one per registered event; 31 canonical − 2 excluded) | 4 subprocesses (the command-only events); the other ~25 are direct HTTP                                                                         |
| Failure surfacing         | `\|\| true` suffix swallows all errors silently                            | Claude Code surfaces transport errors back to the user                                                                                          |
| Timeout behaviour         | No native timeout — curl hangs the calling chain if server hangs           | Native `timeout: 30` per hook in config                                                                                                         |
| Payload contract          | Same — POST JSON to URL, response shape unchanged                          | Same — POST JSON to URL, response shape unchanged                                                                                               |
| **Lifecycle reliability** | **All events deliver** (verified across 1378+ M4 sessions to date)         | **All events deliver on the hybrid.** SessionStart must stay `command` — it rejects `http` by design (not a bug; see the correction at the top) |
| Config form               | `{"type":"command","command":"curl … localhost:5051/hooks/X \|\| true"}`   | `{"type":"http","url":"http://localhost:5051/hooks/X","timeout":30}`                                                                            |
| Detection by skill        | Substring `localhost:5051` appears inside `command` field                  | Substring `localhost:5051` appears inside `url` field                                                                                           |

The transport-overhead argument hasn't gone away — 29 subprocess spawns per session is real cost, and the hybrid removes ~25 of them. There is no upstream fix to wait for.

---

## The hybrid that was always available

Because the restriction is **per-event**, not global, the correct configuration is a hybrid:

| Events                                  | Transport                            | Why                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`                          | **`command` (curl)** — mandatory     | Docs explicitly permit only `command` / `mcp_tool`                                                                                                                                                 |
| `Setup`, `SubagentStart`, `TaskCreated` | **`command` (curl)** — precautionary | The brain's matrix lists these as `command`/`mcp_tool`-only too, but the docs page **only** states the restriction for `SessionStart`. ⚠️ Unverified. Keep them on curl until individually tested. |
| The remaining ~25 registered events     | **`http`**                           | No documented restriction                                                                                                                                                                          |

**What the hybrid buys**: ~25 of 29 subprocess spawns per session eliminated, native per-hook
`timeout`, and transport errors surfaced by Claude Code instead of swallowed by `|| true`.

**What it costs**: two transport shapes to maintain, and the install skill's AngelEye-detection
must match on **both** `command` and `url` fields (it already does — see the `is_angel` check in
the migration script below).

**Before migrating**, note the v2.1.207 constraint: `${user_config.*}` interpolation is **rejected
in shell-form hook commands**. It does not affect the current hardcoded-port curl hooks, but it
does constrain any future move to a configurable port — `http` hooks (`url` + `headers` +
`allowedEnvVars`) are the cleaner path there, which is a second argument for the hybrid.

**Status**: not yet migrated. Do it on **M4 first** — the AppyCtrl pulse gives a ~5-minute
verification signal, and Roamy is the primary work machine.

---

## When to revisit

⚠️ The triggers below were written under the wrong diagnosis — they wait for a fix to a bug that
does not exist. **Superseded by §"The hybrid that was always available".** Kept for history.

Re-test HTTP transport when ONE of the following changes:

1. **Anthropic ships a Claude Code release** with notes mentioning hook lifecycle / HTTP transport reliability / SessionStart timing. Check the brain reference at `~/dev/ad/brains/anthropic-claude/claude-code/hooks/configuration-reference.md` for updates.
2. **The brain reference itself updates** with explicit guidance about HTTP hook lifecycle behaviour. The current doc (`hooks/configuration-reference.md`) may not yet address lifecycle ordering — check `hooks/events-reference.md` as well.
3. **Curl transport becomes operationally painful** — e.g., disk I/O storms from subprocess spawns, observable user-facing latency, or AngelEye sessions that need sub-millisecond hook delivery.

### How to re-test (procedure)

1. Read this doc top to bottom first — the bug shape is specific and may have evolved.
2. On M4 Mini (NOT Roamy — M4 has the AppyCtrl pulse and isn't your primary work machine), back up `~/.claude/settings.json` to `~/.claude/settings.json.bak-<date>-pre-http`.
3. Run the migration script preserved in §"Migration script — preserved for re-test" below. It now applies the **hybrid**: `http` for everything except the four command-only events.
4. Wait 3 AppyCtrl probe cycles (~15 minutes) and compare archive entries to the table above. If file size is back to 2351 B and `session_start` events are present, the bug is fixed.
5. If still broken, restore from backup immediately. Update this doc with the new test results.

### Migration script — hybrid (updated 2026-07-25)

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
    # 29 events: 31 canonical (v2.1.219) minus WorktreeCreate and MessageDisplay (excluded — see §"Events we deliberately don't register")
    # Canonical full list: ~/dev/ad/brains/anthropic-claude/claude-code/hooks/events-reference.md
    EVENTS = ["SessionStart","UserPromptSubmit","UserPromptExpansion","PostToolUse","PostToolBatch","Stop","SessionEnd","SubagentStart","SubagentStop","PostToolUseFailure","StopFailure","WorktreeRemove","CwdChanged","DirectoryAdded","PreToolUse","InstructionsLoaded","PreCompact","PostCompact","PermissionRequest","PermissionDenied","Notification","TeammateIdle","TaskCompleted","TaskCreated","ConfigChange","Elicitation","ElicitationResult","FileChanged","Setup"]

# ⚠️ These events REJECT http hooks — they must stay command/curl or they are silently dropped.
# SessionStart is documented; the other three are precautionary (brain matrix says command/mcp_tool
# -only, docs do not confirm). See §"The hybrid that was always available".
COMMAND_ONLY = {"SessionStart", "Setup", "SubagentStart", "TaskCreated"}

CURL = "curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/{ev} || true"

hooks = d.setdefault("hooks", {})
for ev in EVENTS:
    entries = hooks.get(ev, [])
    new_entries = []
    for entry in entries:
        hook_list = entry.get("hooks", [])
        is_angel = any("localhost:5051" in (h.get("command","") + h.get("url","")) for h in hook_list)
        if not is_angel:
            new_entries.append(entry)
    if ev in COMMAND_ONLY:
        handler = {"type": "command", "command": CURL.format(ev=ev)}
    else:
        handler = {"type": "http", "url": f"http://localhost:5051/hooks/{ev}", "timeout": 30}
    new_entries.append({"matcher": "", "hooks": [handler]})
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
