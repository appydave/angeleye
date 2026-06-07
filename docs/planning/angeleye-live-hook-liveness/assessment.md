# Assessment — angeleye-live-hook-liveness

**Campaign**: angeleye-live-hook-liveness · **Profile**: Development · **Branch**: main (no worktree)
**Started**: 2026-06-07 · **Closed**: 2026-06-08
**Origin**: `docs/requirements/live-hook-and-liveness-2026-06-07.md` (Dark Factory / Marshall)
**Outcome**: ✅ Complete — 5 planned WUs + WU5 (emergent) + delivery-review patch pass. All green.

## Goal

Refresh AngelEye hook coverage to the canonical 30 events, wire the live command-hook to the real port (5051), expose per-session liveness for an external reaper, and hand a contract back to the factory.

## Results

| WU  | Outcome                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WU0 | Event lists reconciled to 30 across all three internal lists (EVENT_MAP, AngelEyeEventType, ANGELEYE_EVENTS). Fixed pre-existing drift (constants.ts lagged by 2).                                                                         |
| WU1 | Docs corrected "22/24/25"→30; deprecated `hooks-reference.md` citations repointed to canonical `…/claude-code/hooks/` across 6 docs.                                                                                                       |
| WU2 | `GET /api/sessions/:id/liveness` → `{session_id, last_active, status, server_now}`, 404 on unknown id.                                                                                                                                     |
| WU3 | 28 live command hooks written to `~/.claude/settings.json` (WorktreeCreate + MessageDisplay excluded). `/api/hooks/supported` now returns `register[]` + `excluded{}` — exclusions enforced at the source of truth. Install skill updated. |
| WU4 | Verified live (organic: this session ingested as `source=hook`, not transcript backfill). HANDBACK written.                                                                                                                                |
| WU5 | Exclusion rationale made discoverable: hook-transport.md refreshed + "don't register" section; known-issues.md row; origin write-up brought from M4 into repo; CLAUDE.md pointer.                                                          |

**Handback**: `docs/requirements/live-hook-and-liveness-2026-06-07.HANDBACK.md`

## Quality

- Delivery review: all 6 dimensions, verdict CONDITIONAL PASS → all must-fix patches applied → effectively PASS.
- Tests: 722 (baseline) → **737 server** (+15 across WU2/WU3/patches), client 66. 0 lint errors (1 pre-existing warning). No new typecheck errors (3 pre-existing classifier.service.ts errors predate campaign, out of scope).

## What worked

- **Inheriting the wave11 AGENTS.md** surfaced the three-list sync gotcha immediately — the constants.ts drift would otherwise have been missed.
- **Reading the M4 untracked doc before WU3** prevented re-introducing the WorktreeCreate ENOENT bug. This was the single highest-value moment of the campaign — and it came from the user's "is Roamy in sync with M4?" instinct, run as a background agent.
- **Showing the settings.json diff before applying** (global file) kept the most dangerous change human-gated.
- **Enforcing exclusions at `/api/hooks/supported`** (not just in the skill) makes the safety durable across re-installs.

## What didn't work / friction

- **WU1's "proof grep" was too narrow** — it matched `2[245] event` but missed "22 hooks" and the bare `5501` port string, so the delivery review (AA) had to catch them. Lesson: grep for the _concept_ (port numbers, all count phrasings), not one regex.
- **Test-count verification via `npm test --workspace server` / `npx vitest --root`** produced a phantom "1 failed" (cwd-sensitive config loader). Burned ~1 cycle. Captured in `learnings/cwd-sensitive-tests.md`.
- Documentation discoverability (WU5) was a _gap in the original plan_ — the rationale lived in code + handback but not in AngelEye's own doc trail. Surfaced by a user question, not the plan.

## Deferred / open (not blocking)

- ⚠️ `{"continue":true}` possibly injected as context on SessionStart/UserPromptSubmit (BH-002) — **pre-existing + uncertain**; worth a dedicated verification (could be a real context-pollution issue or a non-issue if Claude Code treats valid-JSON stdout as parsed output, not plain context).
- `optional:boolean` → `exclusion_type` enum; delete dead `ANGELEYE_EVENTS` constant (3-list→2-list); MessageDisplay nested-truncation (moot while unregistered).
- **M4 hook-target**: recommend per-machine localhost capture + periodic archive sync to M4 (NOT repointing hooks over Tailscale — liveness must not depend on the travel network). Parked for David.

## Efficiency Report

- Average model match: good — Sonnet for mechanical/code WUs, Opus for the two adversarial review lenses (BH/EC) where blind-spot value is highest.
- AGENTS.md: ~190 lines (inherited from wave11, trimmed). Under the 250 ceiling.
- Prompt clarity: 0 clarification loops; subagents ran clean on first dispatch.
- Biggest efficiency gain: inheriting AGENTS.md (three-list gotcha pre-known).
- Biggest efficiency loss: cwd-sensitive test phantom failure + WU1's narrow grep needing AA rework.
- Change before next campaign: bake "grep for the concept, verify whole-suite via `npm test`" into the doc-reconcile pattern.

## Two-type learnings

- **Application**: three event lists must stay in sync (now partially guarded by tests); WorktreeCreate is a hard hook exclusion; cwd-sensitive workflow-type test.
- **Loop meta**: a user's "are we in sync with the other machine?" instinct, run as a cheap background agent, caught the campaign's biggest latent bug — cross-machine state checks belong in the pre-flight for any multi-machine project.
