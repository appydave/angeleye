# Hook Transport — HTTP vs Curl

**Status:** HTTP transport adopted 2026-05-13 (Claude Code v2.1.63+ supports `type: "http"` hooks natively)

**Decision:** AngelEye's `angeleye-install` skill writes HTTP-typed hooks into `~/.claude/settings.json`. Claude Code POSTs event JSON directly to `http://localhost:5051/hooks/<EventName>` — no curl subprocess per hook trigger.

---

## Why HTTP transport

| Property             | Curl transport (legacy)                                                         | HTTP transport (current)                                             |
| -------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Process model        | Fork curl subprocess per hook, per session                                      | Native HTTP from Claude Code's own runtime                           |
| Per-session overhead | 24-26 subprocess spawns (one per subscribed event)                              | 0 subprocesses; direct HTTP from one process                         |
| Failure surfacing    | `\|\| true` suffix swallows all errors silently                                 | Claude Code surfaces transport errors back to the user               |
| Timeout behaviour    | No native timeout — curl hangs the calling chain if server hangs                | Native `timeout: 30` per hook in config                              |
| Payload contract     | Same — POST JSON to URL, response shape unchanged                               | Same — POST JSON to URL, response shape unchanged                    |
| Config form          | `{"type":"command","command":"curl … http://localhost:5051/hooks/X \|\| true"}` | `{"type":"http","url":"http://localhost:5051/hooks/X","timeout":30}` |
| Detection by skill   | Substring `localhost:5051` appears inside `command` field                       | Substring `localhost:5051` appears inside `url` field                |

**Net result:** HTTP transport removes 24-26 subprocess spawns per Claude Code session. The brain reference (`~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md` §"HTTP Hooks (v2.1.63)") confirms the payload and response contract are identical.

---

## Known risk vectors (why this document exists)

The transport change is small surface-area but carries unknowns we haven't seen in production yet:

| Risk                                          | Worst-case symptom                                                                                | How you'd notice                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Slow-response handling differs                | Claude Code blocks longer than expected on hook response, slowing every user turn                 | UI feels sluggish; `responseTime` log entries grow                                            |
| Non-200 surfacing differs                     | Curl swallowed errors with `\|\| true`; HTTP transport may surface 4xx/5xx as turn-level warnings | User sees red banner / error toast in Claude Code on every prompt if AngelEye is misbehaving  |
| Retry semantics differ                        | Curl had no retry; HTTP transport behaviour on transient failure is per-Anthropic-version         | Duplicate events in `~/.claude/angeleye/sessions/`                                            |
| Header / encoding differences                 | Claude Code may not send `Content-Type: application/json` the same way; server may misparse       | New "schema-auditor unknown shape" rows in `_unknownHooksPath`                                |
| Server unreachable on Roamy when sessions run | Curl `\|\| true` made this invisible; HTTP transport may surface "connection refused" per turn    | User sees connection errors on every prompt — same as Risk 2 but specifically when server off |

None of these have been observed yet. They're hypothetical based on the surface area of the change. **First-week monitoring** should look at `responseTime` on `/hooks/*` POSTs, `_unknownHooksPath` write count, and duplicate session-event audits.

---

## Rollback — switching back to curl transport

If any of the risks above materialise and HTTP transport needs to be reverted, the procedure is:

### Step 1 — Edit `~/.claude/settings.json` directly

For each AngelEye event entry, replace the HTTP shape:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "http",
      "url": "http://localhost:5051/hooks/<EventName>",
      "timeout": 30
    }
  ]
}
```

…with the legacy curl shape:

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

The `localhost:5051/hooks/<EventName>` URL identifies the entry — leave non-AngelEye hooks (anything not containing that substring) untouched.

### Step 2 — Update the skill to write curl by default

Edit `~/.claude/skills/angeleye-install/SKILL.md`:

- Change the "Entry shape" section back to the curl form
- Re-running the skill will then upgrade any HTTP entries back to curl (since the safety scan identifies entries by `localhost:5051` in either `command` or `url`)

### Step 3 — Restart Claude Code

Hook config is read at session start. Restart any active Claude Code sessions to pick up the change.

### Step 4 — Verify

Trigger a manual SessionEnd (close + open a session) and confirm AngelEye's archive directory at `~/.claude/angeleye/archive/` gets a new entry. If yes, transport is working.

---

## Mixed-transport state

The skill's safety scan tolerates mixed transport — it identifies AngelEye entries by `localhost:5051` appearing in either `command` (curl) or `url` (http) — so running the skill multiple times during a partial rollback is safe and idempotent.

If you find yourself in a state where some machines run HTTP transport and others run curl, that's fine: AngelEye's server endpoint is unchanged. The transport is purely a client-side concern.

---

## Why we didn't keep the curl `|| true` silent-failure pattern

Curl's `|| true` made AngelEye outages invisible — the user got no signal that their hooks were dropping. The HTTP transport's louder failure mode is a feature, not a bug: if AngelEye is broken, the user notices immediately rather than discovering weeks later that the archive is incomplete.

If the noise becomes intolerable in practice, the right fix is to **make AngelEye more reliable**, not to re-introduce silent failure. The rollback above exists for cases where HTTP transport itself misbehaves at the protocol level, not for muting AngelEye outage signals.
