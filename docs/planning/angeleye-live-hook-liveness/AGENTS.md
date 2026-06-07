# AGENTS.md — AngelEye Live Hook + Liveness

You are a background agent implementing ONE work unit for AngelEye. Read this fully before writing code. You receive this file + your work-unit prompt only.

---

## Project Overview

- **App**: AngelEye — session intelligence layer for Claude Code.
- **Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript. npm workspaces: `client/`, `server/`, `shared/`.
- **Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL code work here.
- **Campaign goal**: hook coverage → canonical 30 events; install + verify live hook on `localhost:5051`; per-session liveness query for an external reaper; handback contract.

## Authoritative hooks spec (READ — do not use AngelEye's own hook docs)

`~/dev/ad/brains/anthropic-claude/claude-code/hooks/` — **30 events, 5 types, v2.1.167**.

- `events-reference.md` — per-event signature. `configuration-reference.md` — types/wiring/matchers.
- **IGNORE `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md`** — DEPRECATED, known-wrong ("22/25/27"). Any AngelEye doc citing it is stale.
- Ground every hooks claim in this spec. Tag ⚠️ anything you cannot confirm.

## Build & Run Commands

```bash
npm run typecheck                  # from repo root
npm test                           # server + client
npm run lint
npm run build --workspace shared   # REQUIRED after changing shared types
```

**Do NOT start dev servers** (no `npm run dev`/nodemon/tsx) — it pollutes the Overmind/tmux PORT env. To check liveness use `lsof -i :5051 | grep LISTEN` or read logs.

## Key Facts (do not re-derive)

- Ports: Client **5050**, Server **5051**. `.env` → `PORT=5051`. The "5501" in old docs is a TYPO.
- Response helpers: `apiSuccess(res, data)` / `apiFailure(res, msg, code)` — NOT `apiError`. Shape: `{ status:'ok', data:{...} }`.
- All server imports use `.js` extension (ESM). No `console.log` — use `logger.{info,warn,error}`.
- Test isolation: `_setDataDir(tmpDir)` in `beforeEach`, `rm(testDir)` in `afterEach` (resets the registry write queue).
- Registry: `~/.claude/angeleye/registry.json`; events: `~/.claude/angeleye/sessions/session-<id>.jsonl`.
- Path helpers (`getDataDir`, etc.) exported from `registry.service.ts`.

## Event lists live in THREE places — keep in sync (this is the #1 gotcha)

1. `server/src/routes/hooks.ts` → `EVENT_MAP` (PascalCase → slug) + payload extraction.
2. `shared/src/angeleye.ts` → `AngelEyeEventType` union (slugs).
3. `shared/src/constants.ts` → `ANGELEYE_EVENTS` (CONST → slug).
   Current state at campaign start: hooks.ts & angeleye.ts = 26; constants.ts = 24 (lagging — missing `task_created`, `permission_denied`). Target: **all three = 30**.
   The 4 new events + slugs: `Setup`→`setup`, `UserPromptExpansion`→`user_prompt_expansion`, `PostToolBatch`→`post_tool_batch`, `MessageDisplay`→`message_display`.

- `/api/hooks/supported` auto-derives its count from `EVENT_MAP` → reports 30 automatically once updated.
- In hooks.ts, `ORIGINAL_EVENTS` (7 tight-extraction events) vs raw-payload bucket; `STRIP_FROM_PAYLOAD` filters common fields. New events fall into the raw-payload bucket unless given tight extraction.

## Live-hook wiring (canonical pattern)

Per-event command hook in `~/.claude/settings.json`:

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

**Safety (CRITICAL — settings.json is global, shared by ALL Claude Code sessions):**

1. Back up settings.json before writing.
2. Identify AngelEye entries ONLY by `localhost:5051` in the command. Preserve every non-AngelEye hook.
3. Additive within each event's array — append, don't replace.
4. Idempotent — running twice is a no-op for already-present hooks.

- Command/mcp_tool-only events (`Setup`,`SessionStart`,`SubagentStart`,`TaskCreated`) reject `http` hooks — but we use **command** hooks, so all 30 are reachable.
- The install skill `~/.claude/skills/angeleye-install/SKILL.md` is the canonical installer (currently lists 24 — update to 30).

## Liveness facts (Deliverable 3)

- `GET /api/sessions` already returns full `RegistryEntry[]` incl. **`last_active` (ISO 8601)**, sorted desc. `last_active` is bumped on EVERY event (hooks.ts).
- Gap = cheap per-session lookup. Add `GET /api/sessions/:id/liveness` → `{ session_id, last_active, status }`.
- ⚠️ Liveness caveat for handback: sessions whose `session_end` never fires stay `status:'active'` forever → `last_active` is the reliable stall signal, NOT `status`. That's precisely what the reaper exists to catch.

## Constraints (verify before marking done)

- All three event lists = 30, identical slug set. `npm run build --workspace shared` after shared changes.
- No non-AngelEye hook in settings.json modified/removed.
- No dev server started from a tool call.

## Success Criteria

- [ ] `npm run typecheck` clean · `npm run lint` clean · `npm test` not regressed from baseline.
- [ ] New functionality has ≥1 test (WU2 liveness endpoint).
- [ ] All Constraints satisfied.

## Baseline Metrics (record before Wave A; re-verify each wave)

| Metric       | Baseline                                                                                                           | After A  | After B       | After C |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------- |
| Server tests | 722 pass                                                                                                           | 722 pass | 725 pass (+3) |         |
| Client tests | 66 pass                                                                                                            | 66 pass  | 66 pass       |         |
| typecheck    | ⚠️ 3 pre-existing errors in classifier.service.ts (771/772/1194) — NOT from this campaign; gate on "no NEW errors" | no new   | no new        |         |
| lint         | clean (1 pre-existing warning WorkflowDetailView.tsx)                                                              | no new   | no new        |         |

> Verify whole-suite counts with `npm test` (root), NOT `npx vitest --root server` — see learnings/cwd-sensitive-tests.md.

## Anti-Patterns to Avoid

1. Updating one event list and not the other two (the #1 historical bug here).
2. Citing `hooks-reference.md` — it's deprecated; cite `…/claude-code/hooks/`.
3. Replacing the settings.json hook array instead of appending (clobbers other tools).
4. Starting a dev server to "verify" — read `lsof`/logs instead.
5. Assuming a doc's "5501" is correct — it's 5051 everywhere real.

## Quality Gates (non-negotiable)

typecheck + lint + tests clean; shared rebuilt; settings.json non-AngelEye hooks intact; every hooks claim grounded in canonical spec.

## Learnings (coordinator updates as waves complete)

- (none yet)
