# Requirement — live hook refresh + per-session liveness API (2026-06-07)

**Origin:** the Dark Factory (Marshall) side. Build this here in AngelEye via Ralphy — it's an AngelEye-owned feature. Then hand a small contract back to the factory (see "Handback").

## Why (the factory's need)

The factory's reaper needs to detect a **stuck** agent session (one that hung and never reported). The battle-tested pattern (OpenAI Symphony §8.5 stall detection) is: `elapsed = now − last_event_timestamp`; if `elapsed > stall_timeout` → stalled. The liveness signal is the **agent event stream**, NOT the OS process tree (the process tree is useless here — Claude Code reparents sessions to its daemon). **AngelEye is the natural owner of that event stream** (it already ingests Claude Code hook events). So the factory needs AngelEye to (a) actually receive live events, and (b) answer "**when was session X last active?**" via a query.

## Authoritative source — READ THIS, not AngelEye's own hook docs

`~/dev/ad/brains/anthropic-claude/claude-code/hooks/` — the **canonical, vendored** Claude Code hooks spec (verified 2026-06-07, CHANGELOG through v2.1.167): `INDEX.md`, `events-reference.md`, `configuration-reference.md`, `hooks.schema.json`.

- **30 events, 5 hook types** (command/http/mcp_tool/prompt/agent).
- **IGNORE `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md`** — it is DEPRECATED and known-wrong. AngelEye's own docs currently cite it and say "22"/"25 events" — those are STALE.

## Deliverables

1. **Refresh hook coverage to the canonical 30 events.** Reconcile `server/src/routes/hooks.ts` + the docs (`docs/requirements.md`, `docs/data-schema.md`, `docs/ui-concepts-plan.md`, `docs/README.md`) against the canonical spec: correct the "22/25 events" claims to 30, re-point citations from the deprecated `hooks-reference.md` to `…/claude-code/hooks/`, and add handling for any of the 30 events not yet covered.
2. **Actually wire the live hook (not just transcript backfill).** Install/refresh the command-hook config in `~/.claude/settings.json` that POSTs each event to AngelEye's ingest route (`server/src/routes/hooks.ts`) on the **real server port :5051** — the docs' `:5501` is a typo/drift; fix it. Use `curl … || true` so a down server never blocks Claude Code. NOTE: this is a GLOBAL change (loads at session start, affects all Claude Code sessions); confirm against `configuration-reference.md`. Verify live events land (not just startup backfill).
3. **Expose per-session liveness as a query.** Provide a stable way for an EXTERNAL caller (the factory's reaper) to ask "last-active timestamp for session X" — e.g. ensure `GET /api/sessions` includes a `last_active` (or equivalent) per session, or add a dedicated endpoint. API now; an MCP wrapper can come later (constellation principle: every app = API + MCP).

## Exploration encouraged (build knowledge to hand back)

While you're in here, also: note any **gaps** in AngelEye's session-liveness capability (what it can/can't answer); sanity-check whether `session_id` from hook input lets you key liveness reliably; and capture whether roll-ups/summaries over the linear/temporal capture would help (separate future feature — just note it).

## Handback (what the factory needs back)

Write `docs/requirements/live-hook-and-liveness-2026-06-07.HANDBACK.md` containing, tersely:

- The **exact liveness API contract** the reaper should call: method + path + the field that holds last-active (and its format), e.g. `GET /api/sessions → sessions[].last_active (ISO 8601)`.
- Whether the live hook is installed + verified (yes/no + how to confirm).
- The corrected event count + which events AngelEye now handles.
- Anything still open / any decision the factory must make.

David carries that handback file back to the dark-factory conversation. **Ground every hooks claim in the canonical spec; tag ⚠️ anything you couldn't confirm.**
