# AngelEye — Sequenced Plan from 2026-05-13

A long-running task list. Work through phases in order. Within a phase, items can be parallelised. Each item has effort, dependency, and "Claude can do this autonomously" vs "needs your decision."

## Phase 1 — Ship what's already speced (≈ 1–2 hours, Claude autonomous)

These have requirement docs written and approved. Just need code + deploy + verify.

| #   | Task                                                  | Effort | Notes                                                                                                                                                                                                 |
| --- | ----------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Implement `2026-05-13-detect-als-delamain-workers.md` | 20 min | Add `ALS_DELAMAIN_WORKER_RE` to `session-class.service.ts`; canonicalise project to `als-delamain` in `hooks.ts`; update `angeleye-enrichment-loop` SKILL.md to filter eligibility by `session_class` |
| 1.2 | Deploy + run `POST /api/registry/backfill-class`      | 5 min  | Reclassifies 73 existing delamain sessions; standard push/pull/nodemon-restart loop                                                                                                                   |
| 1.3 | Sanity-check the stragglers                           | 10 min | The 24 stale-active sessions + the 2 `app.supportsignal` sessions (`21fa9582`, `5f592574`) — confirm they were delamain or surface a new pattern                                                      |
| 1.4 | Update handover doc: 5-archetype → 6-archetype map    | 5 min  | `docs/planning/handover-2026-05-07-corpus-cleared.md` was written before ALS delamain emerged — add the 6th row                                                                                       |

**Phase 1 done = the schema is internally consistent again.**

## Phase 2 — Schema audit follow-through (≈ 1 hour, needs your decisions)

**Wait for the schema audit agent to return** (running now, ~10 min ETA). The output lands at `docs/intelligence/schema-audit-2026-05-13.md`.

| #   | Task                                                        | Effort | Notes                             |
| --- | ----------------------------------------------------------- | ------ | --------------------------------- |
| 2.1 | Review HIGH-priority cuts in the audit                      | 15 min | David eyes only — don't blind-cut |
| 2.2 | Pick which fields to deprecate / consolidate / move-to-tags | 15 min | Decision per group                |
| 2.3 | Write requirement doc for the approved cuts                 | 20 min | `2026-05-13-schema-cleanup.md`    |
| 2.4 | (Defer to Phase 3) Implement                                | TBD    | Depends on scope                  |

## Phase 3 — Backup feature fix (≈ 1 hour, Claude autonomous + review)

The backup feature is silently failing — backup dir stops at 2026-05-11 20:18. Lost ~2 days of upstream JSONL coverage.

| #   | Task                                                          | Effort | Notes                                                                                                          |
| --- | ------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| 3.1 | Read `sessions.service.ts` → `backupUpstreamJSONL`            | 5 min  | Understand current implementation                                                                              |
| 3.2 | Add error logging (currently fire-and-forget swallows errors) | 10 min | Use `logger.warn` with err + sessionId; convert silent catch to logged catch                                   |
| 3.3 | Test on a fresh session                                       | 5 min  | Force a session_end, verify backup file appears                                                                |
| 3.4 | If still failing — investigate timing                         | 30 min | Possibly: race with Claude Code purge → move backup to earlier event (`stop`?) or add a periodic backup sweep  |
| 3.5 | Spec a one-shot backup-sweep script                           | 15 min | For any session with `enrichment_version >= 1` AND no backup file AND upstream still readable — back it up now |

## Phase 4 — First dreaming pass (≈ 30 min + your review)

The dreaming skill exists but has **never been run**. We now have enough fresh enriched data.

| #   | Task                                                          | Effort | Notes                                                      |
| --- | ------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| 4.1 | Invoke `/angeleye-dreaming 7` (or 30 for the longer window)   | 30 min | Skill at `.claude/skills/angeleye-dreaming/SKILL.md`       |
| 4.2 | Review output with you                                        | TBD    | Decide if useful — if yes, schedule as a routine (weekly?) |
| 4.3 | If schedulable, register it via `appydave:schedules-registry` | 10 min | Track in `~/.config/appydave/schedules.json`               |

## Phase 5 — Triage older requirement docs (≈ 1 hour, your decisions)

10+ open requirement docs from prior sessions, some superseded by `session_class`. Run through them and mark each: implement / supersede / defer / close.

| Doc                                                    | Likely status                                      |
| ------------------------------------------------------ | -------------------------------------------------- |
| `2026-05-06-classifier-bmad-orchestrator-trigger.md`   | Likely implement                                   |
| `2026-05-06-classifier-ruflo-orchestrator-taxonomy.md` | Already in classifier — verify, close              |
| `2026-05-06-classifier-skill-development-taxonomy.md`  | Verify, decide                                     |
| `2026-05-06-schema-has-thinking-blocks.md`             | Implement — useful predicate                       |
| `2026-05-06-ingestion-backup-upstream-jsonl.md`        | Superseded — feature exists but broken (Phase 3)   |
| `2026-05-06-apply-changes-to-registry.md`              | Verify, likely close                               |
| `2026-05-07-schema-has-playwright-e2e-predicate.md`    | Implement — small, useful                          |
| `2026-05-07-schema-has-scheduling-setup-predicate.md`  | Implement — small, useful                          |
| `2026-05-07-ui-marathon-session-handling.md`           | UI work; defer until session_class lands in client |
| `2026-05-07-ingestion-detect-paperclip-workspaces.md`  | Superseded by session_class machine_signal — close |

## Phase 6 — Decisions parked (need your input before any code)

These are open architectural questions. Don't touch the code until decided.

| #   | Decision                                                             | Why it's parked                                                                                                            |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Add first-class `harness` field?                                     | 6 archetypes now identified — case for it grows. Trade-off: another dimension vs leaving `session_class` to carry the load |
| 6.2 | Topology placement for workflow types                                | First-class field vs metadata?                                                                                             |
| 6.3 | BMAD phase primitive                                                 | New `WorkflowPhase` interface vs evolved `WorkflowType`?                                                                   |
| 6.4 | Ruflo worker representation                                          | One `StationInstance` with `subagent_count: N` vs N separate ones?                                                         |
| 6.5 | Pre-built Ruflo templates (`feature`/`security`/`refactor`/`bugfix`) | Each a `WorkflowType` registration vs only ad-hoc swarms?                                                                  |
| 6.6 | Extend the viz-hack model vs design a fresh analysis model           | The bigger choice that 6.2–6.5 sit underneath                                                                              |

## Phase 7 — Cosmetic / cleanup (whenever there's time)

| #   | Task                                                               | Effort |
| --- | ------------------------------------------------------------------ | ------ |
| 7.1 | Project-name backfill (d-`<hex>` → `als-delamain`)                 | 20 min |
| 7.2 | UPDATE memory entries that reference superseded designs            | 10 min |
| 7.3 | Run `appydave:doc-review` orchestrator over `docs/` once a quarter | 30 min |

## Persistent durability tasks (always-on background concerns)

These don't fit a phase — they're ongoing.

- **Enrichment cadence**: ~18 user-driven sessions/day produced. Run enrichment-loop weekly; corpus stays current.
- **Schema drift watching**: the `unknown-hooks.jsonl` file captures hook events AngelEye doesn't recognise yet. Check it monthly; new event types → schema observation → requirement doc.
- **Observations log review**: `docs/intelligence/observations.jsonl` accumulates; review entries with `category: retrieval_gap` and `category: schema_anomaly` monthly to spot recurring problems.

## How to use this as a long-running task

- Start a fresh Claude Code session on M4 Mini (so deploys are local).
- Hand it this doc and say "execute Phase 1, then surface decisions for Phase 2."
- Each phase has a natural stopping point — the session can hand back to you between phases for decisions.
- For autonomous mode: invoke `/loop` on this doc's path, with each tick fielding the next unfinished item.

## Quick status snapshot (as of 2026-05-13)

- ✓ session_class shipped + backfilled (2,693 sessions)
- ✓ API search + filters live
- ✓ angeleye-retrieve skill operational
- ✓ Default-dialog fix shipped (commit `1ede583`)
- ✓ ALS delamain requirement spec'd (commit `b23babf`)
- ⏳ Schema audit agent running (returns to `docs/intelligence/schema-audit-2026-05-13.md`)
- 🔴 Backup feature broken since 2026-05-11
- 📋 Dreaming never run
- 📋 24 stale-active sessions exist (still queryable via dialog fallback)
- 📋 6-archetype map (BMAD/Ruflo/Ralphy/Paperclip/AppyCtrl/ALS delamain)
