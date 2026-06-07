# HANDBACK — live hook + per-session liveness (2026-06-07)

**For:** the Dark Factory (Marshall) side. Built in AngelEye via Ralphy.
**Status:** Deliverables 1–3 done and verified on Roamy (`localhost:5051`). Details + open items below.
**Grounding:** every hooks claim below is checked against the canonical spec `~/dev/ad/brains/anthropic-claude/claude-code/hooks/` (30 events, v2.1.167). ⚠️ = could not fully confirm.

---

## 1. Liveness API contract (what the reaper calls)

**Primary — single session (cheap, recommended for stall polling):**

```
GET http://localhost:5051/api/sessions/:id/liveness
```

Response `200`:

```json
{
  "status": "ok",
  "data": {
    "session_id": "<id>",
    "last_active": "2026-06-07T05:09:03.622Z", // ISO 8601, UTC. Bumped on EVERY hook event.
    "status": "active", // "active" | "ended"
    "server_now": "2026-06-07T05:09:03.768Z" // ISO 8601, UTC — server clock at response time
  },
  "timestamp": "..."
}
```

- **Stall formula:** `elapsed = Date.parse(server_now) − Date.parse(last_active)`; stalled if `elapsed > stall_timeout`.
  Use `server_now` (NOT the reaper's local clock) so cross-machine clock skew can't produce false stalls.
- **404** `{ "status":"error", ... }` if the session id is unknown.

**Bulk — all sessions (for sweeps):**

```
GET http://localhost:5051/api/sessions            → data.sessions[] each incl. last_active, status, source, project
GET http://localhost:5051/api/sessions?limit=N&after=<id>   → paginated
```

Sorted by `last_active` desc. `source` is `"hook"` (live) vs `"transcript"` (backfill) — useful to tell a live session from a reconstructed one.

⚠️ **Liveness caveat the reaper MUST know:** a session whose `SessionEnd` never fires stays `status:"active"` forever. So **`last_active` is the stall signal, not `status`.** Do not treat `status:"active"` as "alive" — that's precisely the stuck case the reaper exists to catch. Key on `server_now − last_active`.

⚠️ **Keying:** `session_id` from hook input is the registry key and is stable across a session's events. Subagent/teammate legs get their own `session_id` (AngelEye tags them `session_kind: subagent|subprocess`) — if the reaper should ignore sub-legs, filter `session_kind === 'main'`.

---

## 2. Live hook — installed + verified (YES)

- **Installed:** `~/.claude/settings.json` now has a `hooks` block, **28 events**, each a command hook:
  `curl -s -X POST -H 'Content-Type: application/json' -d @- http://localhost:5051/hooks/<Event> || true`
  (`|| true` = a down/slow server never blocks Claude Code.) Backup: `~/.claude/settings.json.bak-20260607-angeleye`.
- **Verified live (not just backfill):** after install, this very Claude Code session appears in `/api/sessions` as `source=hook`, `status=active`, with `last_active` advancing in real time — vs all other recent sessions which are `source=transcript`. Synthetic `SessionStart`/`UserPromptSubmit` POSTs were also confirmed end-to-end through the liveness endpoint.
- **How to re-confirm anytime:**
  ```
  curl -s http://localhost:5051/api/sessions?limit=5 | jq '.data.sessions[] | {id:.session_id, last_active, source, status}'
  # a row with source=="hook" and a fresh last_active == live hooks are landing
  ```
- **Port:** `:5051` (confirmed via `.env PORT=5051`). The "5501" in AngelEye's older docs was a typo — fixed this round.
- **Scope:** this is a GLOBAL change — the hooks fire for _every_ Claude Code session on Roamy, loading at session start (existing sessions pick them up on hot-reload). M4 was intentionally NOT touched this round (see §4).

### ⚠️ Two events are deliberately NOT wired (28, not 30)

| Event            | Why excluded                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorktreeCreate` | **HARD exclude — never wire.** It _replaces_ git's worktree workflow; a passthrough `curl` hook makes Claude Code read the curl response body as the worktree path → `ENOENT`, breaking background-isolated worktree creation. No observer-only mode exists. (Confirmed bug, M4 2026-05-19.) `WorktreeRemove` IS safe (observer-only) and is wired. |
| `MessageDisplay` | Opt-in only. Fires per message render (highest-frequency hook, display-only) and duplicates assistant text already captured at `Stop`. Excluded to avoid per-render curl overhead. Add deliberately (with sampling) only if render-level events are wanted as a feature.                                                                            |

The exclusions are now enforced at the **source of truth**: `GET /api/hooks/supported` returns `register` (the 28 safe events) + `excluded { reason, optional }`. The `angeleye-install` skill wires `register`, so a future re-install cannot re-introduce the WorktreeCreate bug.

---

## 3. Event coverage — corrected count

- **Canonical:** 30 events / 5 hook types (v2.1.167). AngelEye's old docs said "22/24/25" citing the **deprecated** `hooks-reference.md` — all corrected this round to 30, citations repointed to `…/claude-code/hooks/`.
- **AngelEye now ingests all 30** (server `EVENT_MAP` reconciled across all three internal lists). The 4 newly added: `Setup`, `UserPromptExpansion`, `PostToolBatch`, `MessageDisplay`.
- **Registered as live hooks: 28** (30 − `WorktreeCreate` − `MessageDisplay`, per §2).

---

## 4. Open items / decisions for the Factory

1. **M4 vs Roamy hook target (PARKED — David's call, pending).** This round wired Roamy → `localhost:5051` only. Open question: should Roamy's hooks (and/or the canonical corpus) point at the M4 Mini instance over Tailscale (`100.82.235.39:5051`)? Being resolved separately with David at campaign close. Until then, AngelEye liveness is only authoritative for sessions on whatever machine runs the server.
2. **Server must be running for liveness to answer.** `curl … || true` means a down server drops events silently (by design). If the reaper needs a hard "is AngelEye up?" check, hit `GET /api/health` first. ⚠️ No queue/replay — events fired while the server is down are lost (transcript backfill recovers _some_ but not liveness timing).
3. ⚠️ **`Setup` / `UserPromptExpansion` / `PostToolBatch` not yet observed firing** in practice (e.g. `Setup` only fires on `claude --init-only`). Handling is in place; field-shape confirmation pending real traffic.
4. **Reaper polling cost:** prefer the per-session `:id/liveness` endpoint over pulling `/api/sessions` each tick.
5. **Clock skew / future `last_active` (reaper MUST handle).** `last_active` is stamped by whichever machine posted the hook (multi-machine fleet). If that machine's clock leads the AngelEye host, `last_active > server_now` → `elapsed < 0`. The reaper must treat `elapsed < 0` as "fresh/just-active" (not stalled), or clamp to 0. Always compute elapsed against the returned `server_now`, never the reaper's local clock — the stall formula already assumes this, but the negative-elapsed case must be made explicit in the implementation.
6. **Malformed / missing `last_active` (reaper MUST handle).** A partially-written or hand-edited registry row could carry an empty or non-ISO `last_active`. `Date.parse()` → `NaN` → `elapsed` is `NaN` → every comparison is `false` → the session is never reaped (zombie). The reaper must treat a non-parseable `last_active` as stale/quarantine and flag it, not skip it silently.

---

## Quick reference (paste into the reaper)

```
GET  /api/sessions/:id/liveness  -> data.last_active (ISO8601) + data.server_now (ISO8601)
STALL: (server_now - last_active) > stall_timeout
ALIVE != status=="active"  (key on last_active, not status)
HEALTH: GET /api/health   |   BASE: http://localhost:5051
```
