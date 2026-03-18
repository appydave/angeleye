# IMPLEMENTATION_PLAN.md — AngelEye Wave 9: Bookmarks + Naming + Resilience

**Goal**: Star/bookmark sessions, annotate them with notes, find named sessions, inline rename with JSONL write-back, hook resilience via curl wrappers, startup backfill for gap healing.
**Started**: 2026-03-16
**Target**: All 7 work units passing typecheck + lint + tests. No regressions from baseline (170 server / 44 client).

## Summary

- Total: 7 | Complete: 7 | In Progress: 0 | Pending: 0 | Failed: 0

## Complete

- [x] WB01 — Schema + PATCH extension: `note?: string | null` added to RegistryEntry, PATCH handler updated, 3 tests added. Server: 173 passing. Client: 44 passing. Typecheck clean.
- [x] WB02 — JSONL write-back: `writeSessionName()` in sessions.service.ts, PATCH calls it non-blocking on name update, 4 tests. Server: 177 passing. Typecheck clean.
- [x] WB03 — Observer star system: ★ toggle (optimistic), All|Starred filter, note field in focus panel, copy-resume ⎘ button. Server: 177. Client: 44. Typecheck clean.
- [x] WB04 — Named filter + inline rename: All|Starred|Named filter, click-to-edit label, commitRename via PATCH (triggers JSONL write-back). Server: 177. Client: 44. Typecheck clean.
- [x] WB05 — Hook resilience: 7 HTTP hooks in `~/.claude/settings.json` replaced with `curl -d @- || true` command hooks. Disler + screenshot hooks preserved. angeleye-install SKILL.md updated.
- [x] WB06 — Startup backfill: non-blocking `backfillTranscripts()` call added to `server/src/index.ts` after `initAngelEyeDirs()`. Logs only when imported > 0. No test regressions.: `note?: string | null` added to RegistryEntry, PATCH handler updated, 3 tests added. Server: 173 passing. Client: 44 passing. Typecheck clean.

## Pending

- [~] WB02 — JSONL write-back service: `writeSessionName(sessionId, name, projectDir)` in sessions.service.ts — finds session JSONL, appends `custom-title` + `agent-name` entries. Called from PATCH handler when `name` is updated.
- [~] WB05 — Hook resilience (B024): replace 7 HTTP hooks in `~/.claude/settings.json` with command hooks using `curl -s -X POST -H "Content-Type: application/json" -d @- <url> || true`. Update `/angeleye:install` skill to use command pattern.
- [~] WB06 — Startup backfill (B031): after `initAngelEyeDirs()` in server/src/index.ts, auto-call `backfillTranscripts()`. Log result: "Startup backfill: N new, M known".
- [ ] WB03 — Observer star system (B028): ★ toggle on session rows (adds/removes `starred` tag), `note` field in focus panel (click-to-edit), `All | Starred` filter toggle in header, copy-resume button per row
- [ ] WB04 — Observer naming system (B029): `All | Named` filter toggle, click session label → inline editable input → Enter → PATCH (triggers WB02 write-back)
- [ ] WB05 — Hook resilience (B024): replace 7 HTTP hooks in `~/.claude/settings.json` with command hooks using `curl -s -X POST -H "Content-Type: application/json" -d @- <url> || true`. Update `/angeleye:install` skill to use command pattern.
- [ ] WB06 — Startup backfill (B031): after `initAngelEyeDirs()` in server/src/index.ts, auto-call `backfillTranscripts()`. Log result: "Startup backfill: N new, M known".
- [ ] WB07 — Housekeeping: mark B030 done in BACKLOG.md, update B029 note (write-back now implemented), archive SESSION_HANDOVER.md, add B031 to BACKLOG.md as done.

## In Progress

## Complete

## Failed / Needs Retry

## Notes & Decisions

- WB01 must complete before WB02, WB03, WB04
- WB02 must complete before WB04
- WB03 and WB04 both touch ObserverView.tsx — run sequentially to avoid merge conflicts
- WB05 and WB06 are fully independent — can run any time
- WB07 is documentation-only — safe to run any time
- Wave order: WB01 → then WB02 + WB05 + WB06 in parallel → then WB03 → WB04 → WB07
- Pre-existing: 6 failing tests in env.test.ts — DO NOT FIX in this wave, baseline is 170 server passing
- B030 is resolved (investigated in session 2026-03-16 — custom-title/agent-name in JSONL confirmed)
- `claude --resume "name"` unreliable (no name field in sessions-index.json, 64KB scan limit) — copy-resume button uses UUID only
