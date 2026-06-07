# IMPLEMENTATION_PLAN.md — AngelEye Live Hook + Liveness

**Goal**: Refresh hook coverage to the canonical 30 events, install + verify the live command-hook on Roamy (`localhost:5051`), expose per-session liveness for the Dark Factory reaper, and hand a contract back.
**Origin**: `docs/requirements/live-hook-and-liveness-2026-06-07.md` (Dark Factory / Marshall)
**Started**: 2026-06-07
**Profile**: Development · **Branch**: main (no worktree — primary change is `~/.claude/settings.json`, outside the repo)
**Canonical spec**: `~/dev/ad/brains/anthropic-claude/claude-code/hooks/` (30 events, 5 types, v2.1.167). The deprecated `hooks-reference.md` is IGNORED.

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0 — CAMPAIGN COMPLETE (pending close-out)

## Notes — Wave A close

- M4 sync check (2026-06-07): Roamy AHEAD of M4 by 1 commit (`935bc2e`), matches origin/main. M4 has untracked `docs/planning/worktree-hook-passthrough-fix.md` (hook-related — READ before WU3) + project-level `.claude/settings.json`. Safe to proceed on Roamy.
- WU0 delivery review: skipped (coordinator recommendation — mechanical 3-list reconcile, diff-reviewed). Full review reserved for WU2/WU3.

## Wave A — Prerequisite (sequence first)

- [x] WU0 — Reconcile event lists to canonical 30. ✅ All three lists (EVENT_MAP, AngelEyeEventType, ANGELEYE_EVENTS) now at 30, identical slug set. constants.ts caught up (+6: task_created, permission_denied + 4 new). MessageDisplay ingested + commented high-volume. Count comments fixed 24→30. Shared rebuilt; server 722 / client 66 pass; no NEW typecheck/lint errors. Reviewed (spec+quality) via diff inspection — clean.

## Wave B — Main (parallel after A)

- [x] WU1 — Doc reconciliation. ✅ Fixed stale counts → 30 + repointed all `hooks-reference.md` citations → canonical `hooks/` across 6 docs (requirements, data-schema, ui-concepts-plan, README + also intelligence/paperclip-synthesis, architecture/hook-transport). Proof grep empty. Reviewed.
- [x] WU2 — Liveness query. ✅ `GET /api/sessions/:id/liveness` → `{ session_id, last_active, status, server_now }` (server_now added as clock-skew aid for reaper). 404 on unknown id via apiFailure. 3 tests added. Full suite green (server 725, client 66). No new typecheck/lint. Reviewed (route diff + helper usage + 404 path).

## Wave C — Wiring + verify + handback (coordinator-driven, NOT fanned out — global + sensitive)

- [x] WU3 — ✅ Wrote `~/.claude/settings.json` hooks block (28 events; WorktreeCreate excluded [HARD — M4 bug], MessageDisplay excluded [David's call — opt-in]). Backup at `~/.claude/settings.json.bak-20260607-angeleye`; 9 existing keys verified intact. Enhanced `/api/hooks/supported` → returns `register` (28) + `excluded{reason,optional}` so the install skill can't re-add WorktreeCreate (+2 tests, 727 total). Updated `angeleye-install` SKILL.md (wires `register`; fallback list → 30 known/28 reg; exclusions documented). No new typecheck/lint.
- [x] WU4 — ✅ Verified live + wrote handback. Server up on :5051. `/api/hooks/supported` → register=28. Synthetic SessionStart+UserPromptSubmit → liveness endpoint returns advancing last_active + server_now. ORGANIC proof: this session (`7dd531cc…`) appears as `source=hook` active post-install (vs `source=transcript` backfill on all others) = live events land, not just backfill. Handback written to `docs/requirements/live-hook-and-liveness-2026-06-07.HANDBACK.md`.

- [x] WU5 — ✅ Docs discoverability (from David's Q + delivery review). Refreshed `docs/architecture/hook-transport.md` (stale 26-list → 28/30 + "Events we deliberately don't register" section); added `worktree-create-hook-unsafe` row to `known-issues.md`; brought the origin write-up `worktree-hook-passthrough-fix.md` from M4 into `docs/architecture/` (committed, no longer stranded); CLAUDE.md pointer added.

## Patches Applied — After Delivery Review (CONDITIONAL PASS → resolved)

Delivery review ran all 6 dimensions (verdict CONDITIONAL PASS, no rejects). Core thesis confirmed (BH-001): no registered event misreads `{"continue":true}` as a control signal — only WorktreeCreate consumes raw stdout, and it's excluded.

| Finding                                                                            | Source                      | Action                                                                                 | Status    |
| ---------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- | --------- |
| Liveness route missing SAFE_SESSION_ID guard → `__proto__` returns 200             | EC-004/CQ-001/AR-003/UT-009 | Added guard (regex tightened to reject `__`-prefixed); +400 test                       | [x]       |
| Stale `requirements.md:208` port 5501; `ui-concepts-plan.md:146` "22 hooks"        | AA-001/002                  | Fixed both → 5051 / 30                                                                 | [x]       |
| `hooks.test.ts` "all 24" label + 24-entry loop                                     | AA-001                      | Relabelled → 30; extended array +6                                                     | [x]       |
| No test guards exclusion drift (WorktreeCreate could slip back)                    | EC-005/UT-001/002/003       | Added 3 drift-guard tests (set-arithmetic, excluded⊆events, standalone WorktreeCreate) | [x]       |
| `transport_url_template` hardcoded :5051                                           | CQ-002                      | Build from `env.PORT`                                                                  | [x]       |
| Weak `status` value assertion                                                      | UT-006                      | Exact-value assertion                                                                  | [x]       |
| Reaper edge cases: clock skew (`elapsed<0`) + malformed `last_active` (NaN zombie) | EC-001/002/BH-005           | Documented in HANDBACK open items                                                      | [>] doc   |
| `status` field can mislead reaper                                                  | BH-003/EC-003               | Already covered by HANDBACK "key on last_active" caveat                                | [>] defer |
| MessageDisplay nested-content truncation                                           | EC-006                      | Moot (not registered); noted                                                           | [>] defer |
| `{"continue":true}` injected as context (SessionStart/UserPromptSubmit)            | BH-002                      | ⚠️ pre-existing + uncertain — flagged for follow-up investigation, not patched         | [>] defer |
| `optional:bool`→enum; dead `ANGELEYE_EVENTS` / 3-list smell                        | CQ-003/AR-007               | Modeling improvements                                                                  | [>] defer |

Post-patch: server 737, client 66, 0 lint errors, no new typecheck. Baseline not degraded.

## In Progress

(none — campaign complete)

## Complete

(coordinator moves items here with [x], adds outcome notes)

## Failed / Needs Retry

(coordinator moves items here with [!])

## Notes & Decisions

- **DECISION (2026-06-07)**: Roamy hooks POST to `localhost:5051` (local AngelEye), per David. Matches requirement doc + audit-script convention.
- **⚠️ PARKED — surface at campaign close (mandatory close-out gate)**: Whether to point Roamy's hooks at the M4 Mini instance over Tailscale (`100.82.235.39:5051`) instead of / in addition to localhost. David asked for a clear recommendation **after** all work on this machine is done — NOT before. Do not action; bring clarity at close.
- **Pre-existing drift found**: `ANGELEYE_EVENTS` lagged the other two lists by 2 events. WU0 fixes.
- **⚠️ Verification dependency**: live-event verification (WU4) needs the AngelEye server running on Roamy. Coordinator will NOT start dev servers from Bash (project rule) — David starts it.
- **MessageDisplay** is per-message-render (high volume). WU0 decides ingest vs skip/sample; flagged in handback.
