# Handover — Structure Survey + Tag-Layer Architecture

**Date:** 2026-05-13
**Author of session:** Claude Opus 4.7 (1M context) in collaboration with David Cruwys
**Predecessor:** `docs/planning/handover-2026-05-07-corpus-cleared.md` (corpus enrichment cleared)
**Repo state:** all changes committed and pushed to main; M4 Mini and Roamy in sync; 9 commits today
**Working machine:** code authored on Roamy, deployed to M4 Mini via push + ssh pull (nodemon auto-restart)

This handover captures a session that ran from a corpus-update check ("did anything happen since 2026-05-07?") through to a comparative survey of structure-layer candidates. The conceptual layer shifted twice during the session; both shifts are captured below.

---

## What's done

### Code shipped (committed + deployed to M4 Mini)

| Commit    | Change                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `1ede583` | `session_class` defaults to `'dialog'` at `session_start` (fixes 24 stale-active undefined-class sessions)      |
| `07314f3` | ALS delamain detection (`ALS_DELAMAIN_WORKER_RE`) + project canonicalisation helper (`canonicalProjectFromCwd`) |
| `b23babf` | Requirement doc: detect ALS delamain workers as machine_signal                                                  |
| `2c0d8de` | Sequenced plan doc (`next-steps-2026-05-13.md`) — phases 1-7                                                    |
| `c79e2b1` | Handover-2026-05-07 updated with 6-archetype map (ALS delamain added)                                           |
| `86cfa84` | Requirement doc: unified tag architecture (multi-source provenance, layered config)                             |
| `fa8352f` | `backupUpstreamJSONL` error logging at all silent-failure paths                                                 |
| `1eb9068` | `POST /api/registry/backfill-project-canonical` endpoint                                                        |
| `3480f64` | Singleton investigation + dreaming-agent post-mortem                                                            |
| `e587f0d` | Structure-layer comparative survey (7 candidates → 3 families)                                                  |

### Corpus operations

- `POST /api/registry/backfill-class` re-run after delamain detection landed — 89 sessions reclassified
- `POST /api/registry/backfill-project-canonical` ran — 80 sessions renamed (paperclip: 9, als-delamain: 72, plus historic Paperclip UUIDs)

### Intelligence docs produced

| Doc                                                 | Source                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `docs/intelligence/schema-audit-2026-05-13.md`      | Background agent — 56-field audit, 6 HIGH cuts, 7 normalisation groups, 84% docstring/reality drift on `session_subtype` |
| `docs/intelligence/structure-survey-2026-05-13.md`  | Background agent — 7 candidates → 3 structural families                                                                  |
| `docs/intelligence/observations.jsonl` (+8 entries) | Singleton investigation, backup-bug confirmation, dreaming-agent partial output (6 obs before Anthropic 5xx crash)       |

### Background agents launched

| Agent                           | Status                                | Notable output                                                                                                              |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Schema audit                    | ✓ Succeeded                           | The audit doc above                                                                                                         |
| Enrichment loop (125 sessions)  | ✓ Succeeded                           | 73 ALS delamain workers identified — surfaced as new harness archetype                                                      |
| Dreaming pass (7-day window)    | ✗ Crashed at 8min (Anthropic API 5xx) | 6 observations preserved before crash — including the recurring `skill.creation → build.prompt_engineering` classifier miss |
| Structure survey (7 candidates) | ✓ Succeeded                           | The survey doc above                                                                                                        |

---

## 6-archetype harness map (canonical)

| #   | Archetype        | Harness technique                                                                       | Detection signal                                                         |
| --- | ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | BMAD             | N coordinated tmux processes (Mode 2) or one session with internal Agent calls (Mode 1) | `trigger_command =~ /(appydave:)?bmad-*/`                                |
| 2   | Ruflo            | 1 process + N `Task` subagents (claude-flow MCP)                                        | `Task({subagent_type})` + `mcp__ruv-swarm__swarm_init`                   |
| 3   | Ralphy           | Autonomous batch coordinator loop                                                       | `trigger_command =~ /(appydave:)?ralphy/`                                |
| 4   | Paperclip        | Multi-workspace hosting                                                                 | cwd `~/.paperclip/instances/*/workspaces/*`                              |
| 5   | AppyCtrl         | Scheduled T3 capability probes                                                          | zero `user_prompt` events; ~657/week cadence                             |
| 6   | **ALS delamain** | **Worktree-isolated worker swarm**                                                      | **cwd `~/.worktrees/delamain/*/`; canonicalised project `als-delamain`** |

---

## Conceptual shifts surfaced this session

### Shift 1 — Tags vs Structures

I conflated two layers. David corrected:

- **Tags identify.** Sparse, multi-source, "this session has X." A boolean fact pointing somewhere.
- **Structures model.** Rich, with internal anatomy. "This is what X actually looks like."

You can't fold BMAD into a tag — you can only fold "this session is part of a BMAD lifecycle" into one. The tag points at the structure; the structure isn't reducible to tags.

This means the architecture has THREE layers, not two:

| Layer          | What it does                                   | Examples                                                   |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **Sessions**   | The basic unit                                 | `RegistryEntry`                                            |
| **Tags**       | Sparse "what did we notice"                    | `harness:bmad`, `qa.uat`, `git_outcome`, `agent_genesis`   |
| **Structures** | Rich "what does this thing actually look like" | `BMADLifecycle`, `RalphyCampaign`, `PlaywrightInteraction` |

The unified-tag-architecture requirement doc (`docs/requirements/2026-05-13-unified-tag-architecture.md`) covers the TAG layer. The structure layer is a separate, larger architectural project — yet-to-be-spec'd.

### Shift 2 — Structures are sibling, not child

A second correction: structures aren't necessarily children of one session. A BMAD lifecycle can span many sessions. The right framing is:

- **Sessions reference structures** via tags
- **Structures aggregate sessions** via session_id lists
- Some structures are cross-session, some are within-session

The structure survey (`docs/intelligence/structure-survey-2026-05-13.md`) reduces 7 candidates to 3 structural families:

| Family                                              | Shape                                                                         | Members                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **A — Cross-session phased lifecycle**              | Phases/stations across separate sessions linked by an aggregation key         | BMAD Mode 2, multi-session Ralphy, nested UAT                                          |
| **B — Within-session orchestrated workflow**        | One session hosting an internal multi-agent or multi-tool process             | BMAD Mode 1, typical Ralphy, Ruflo swarms, screenshot tours, Playwright investigations |
| **C — Persistent/cyclic external-driven aggregate** | Outer host runs over time, sharing aggregation key but not one conceptual run | Paperclip workspaces, ALS delamain batches                                             |

**BMAD straddles A and B** — same conceptual workflow in two physical forms. Designing BMAD first forces the family split to be real from day one.

**AppyCtrl probably doesn't need a structure at all** — tag layer plus dreaming queries suffice. Negative result.

### Shift 3 — Predicate-based tagging is a real pattern to formalise

The 14 `has_*` boolean columns + `session_tags` + `tags: string[]` are three implementations of one concept ("facts about a session"). The unified-tag-architecture spec consolidates them. Key concepts captured in that doc:

- One `SessionTag` struct, typed `TagName` enum, multi-source provenance (`heuristic | llm | manual | dreaming | derived`)
- Stored vs derived vs cached as three valid modes — same/same-but-different API surface (`?source=derived` parameter switches mode)
- Three-layer config (global + machine eager-loaded; project lazy-and-stateless to prevent memory accumulation)
- Future: config provenance ledger (append-only, dedup'd by content hash) so deleted-config rules can still be resolved via `config_ref` on stored tags

---

## Open decisions blocking forward progress

### A. Structure-layer decisions (from `structure-survey-2026-05-13.md`)

| #   | Decision                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | One shared base type + 3 family variants, OR 7 separate types? (Data supports the former)                                              |
| 2   | BMAD: one structure with `execution_mode: 1\|2`, OR two structures of same `kind: bmad_lifecycle`?                                     |
| 3   | AppyCtrl: structure (Family C) or pure tag-layer query? (Recommendation: tag-only)                                                     |
| 4   | Playwright: 4 structures or 1 with `form` discriminator? Hinges on whether UAT-inside-BMAD is its own structure or a sub-phase of BMAD |
| 5   | Paperclip granularity: workspace, company, or heartbeat-run? Three natural granularities, only one can be primary                      |
| 6   | Relationship to dormant `WorkflowType`/`AffinityGroup` model — replace, coexist, or absorb?                                            |

### B. Schema audit cuts (from `schema-audit-2026-05-13.md`)

- 6 HIGH-priority cuts identified (incl. 7 `has_*` predicates at <2% true; `pii_flags`; `is_machine_initiated`; legacy SessionSubtype variants; `tags: string[]`)
- 7 MEDIUM normalisation groups (predicate map; style subobject; overlay subobject; subtype subobject; trigger subobject; opening_style/initiation_source dedupe; drop empty enum variants)
- Documentation drift on `session_subtype` derivation rule (84% of populated entries diverge from the documented behaviour — `hooks.ts:266` force-override outside the documented path)

### C. Older requirement docs (Phase 5 of plan)

10+ open requirement docs from prior sessions need triage. Some superseded by `session_class`:

- `2026-05-07-ingestion-detect-paperclip-workspaces.md` — superseded by session_class `machine_signal`
- `2026-05-06-ingestion-backup-upstream-jsonl.md` — feature exists but broken; superseded by Phase 3 fixes
- The rest need implement/defer/close decisions

---

## Live bugs / anomalies surfaced

| Issue                                                                                   | Status                                                                                                                                                                       | Where to look                                                       |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `backupUpstreamJSONL` silent failures since ~2026-05-11 20:18                           | Error logging shipped (commit `fa8352f`) — waiting for new session_end events to confirm which case fires (race vs path encoding)                                            | Server logs after sessions fire                                     |
| `session_start` event missing on some sessions                                          | Surfaced by singleton `8db8910e-778f-478c-a8b2-f65e37945079` — only 12 tool_use events, no session_start, cwd changed mid-session. Possibly a systemic gap, possibly one-off | Sample sessions; query for sessions where events lack session_start |
| `cwd_changed` events not being captured                                                 | Same singleton — cwd transitioned but no cwd_changed event fired despite being in EVENT_MAP at `hooks.ts:33`                                                                 | Investigate hook delivery for cwd_changed                           |
| `skill.creation` heuristic recurrent miss → should be `build.prompt_engineering`        | Surfaced by dreaming pass (multiple sessions affected) — classifier improvement candidate                                                                                    | `classifier.service.ts` — review skill.creation logic               |
| Marathon-scale formula miscount on `config_change`-only sessions                        | Surfaced by dreaming — scale flag fires on 10-event sessions with no real work                                                                                               | `classifier.service.ts` — scale derivation                          |
| video-projects session with blank classifier metadata (silent pattern but no junk-flag) | Surfaced by dreaming — filter ran partially or not at all                                                                                                                    | Single session (`96f38321`); investigate                            |

---

## Final corpus state

| Bucket                          | Count                                                            |
| ------------------------------- | ---------------------------------------------------------------- |
| Total sessions                  | 4,395                                                            |
| `session_class: dialog`         | 957                                                              |
| `session_class: agent_run`      | 499                                                              |
| `session_class: machine_signal` | ~2,457 (1,678 appyctrl + 72 als-delamain + 9 paperclip + others) |
| `session_class: subagent_leg`   | 482                                                              |
| `session_class: undefined`      | 0 (cleaned up by default-dialog fix + backfill)                  |
| Distinct projects               | 87 (down from a sprawl of UUIDs/hex IDs)                         |
| Sessions added since 2026-05-07 | 1,957 in 6 days                                                  |

---

## Memory entries currently saved

Located at `~/.claude/projects/-Users-davidcruwys-dev-ad-apps-angeleye/memory/`:

- `feedback_enrichment_notes_style.md` — plain English notes
- `feedback_four_pillars.md` — canonical / provenance / synthesis / citation vocabulary
- `feedback_high_interest_projects.md` — Ruflo + AWB get extra attention
- `feedback_deployment_discipline.md` — push, pull, restart before any live-endpoint test
- `project_self_learning_system.md` — 4-layer architecture pointer
- `project_workflow_infrastructure_unused.md` — Workflow viz hack is NOT an analysis foundation

No new memory entries added this session. The conceptual shifts (tags vs structures, 3-family taxonomy) are captured in this handover and the corresponding doc artifacts rather than memory — they're project-specific, not behavioural rules.

---

## Next session pick-up

A future session continuing this work should:

1. **Read this handover first**, then `structure-survey-2026-05-13.md` and `schema-audit-2026-05-13.md`
2. **Read `MEMORY.md`** for vocabulary + active feedback
3. **Pick one direction**:
   - **Decision-driven**: answer one or more of the 6 structure-layer questions; queue the implementation as a requirement doc
   - **Cleanup-driven**: triage the 10+ older requirement docs (implement / supersede / defer / close per doc)
   - **Bug-driven**: investigate one of the live bugs (recommended: skill.creation classifier miss — dreaming surfaced it as recurring, small fix, real classifier improvement)
   - **Verification-driven**: check the M4 Mini server logs for new `backupUpstreamJSONL` log entries — that diagnoses the race-vs-encoding question and unblocks the backup root-cause fix

### Recommended sequence if running autonomously

If a future session is told "work the plan" without further direction:

1. Read live server logs for `backupUpstreamJSONL` outcomes (should be 24+ hours of new sessions by then)
2. Diagnose backup feature → either fix the encoding OR move trigger to `stop` event OR spec the one-shot sweep
3. Run another enrichment pass if backlog has accumulated (should be ~120 new user-driven sessions/week)
4. Run dreaming with `window=3` (smaller window than the 7-day run that crashed) — should complete cleanly and confirm whether the skill.creation miss has more recurring patterns
5. Fix the skill.creation heuristic miss (small classifier change)
6. Surface structure-layer decisions for David's attention (don't auto-decide)

### Recommended sequence if David is driving

1. Sit with `structure-survey-2026-05-13.md` for 15 minutes — answer decisions 1-3 (base type, BMAD form, AppyCtrl)
2. Decide on the schema audit cuts (the 6 HIGH-priority cuts are straightforward; the 7 normalisation groups need more thought)
3. Then either implement the tag-layer requirement or spec the structure-layer base type

---

## Notes for the next agent

- **Backup feature**: the logging fix shipped but verification is pending real sessions firing. Read logs with `journalctl` or wherever pino logs land on M4 Mini.
- **Background agents**: the dreaming agent's crash was an Anthropic 5xx, not our code. Long agents should checkpoint progress to disk frequently (the dreaming agent did this — 6 obs were preserved despite the crash). Future agent prompts should explicitly tell them to write progressively rather than batch.
- **Three intelligence artifacts feed every next decision**: schema audit (field-level), structure survey (architectural shape), observations.jsonl (running pattern log). They're complementary, not redundant.
- **Tag spec vs structure spec are deliberately separate concerns**: the tag layer ships independently of structures. The structures reference tags by name; tags reference structures via id (proposed but not yet specced).
- **6 harness archetypes confirmed**: BMAD, Ruflo, Ralphy, Paperclip, AppyCtrl, ALS delamain. Watch for a 7th when Kyberbot / Kyberdesktop start appearing in the corpus (currently invisible — AngelEye hooks likely not installed on Roamy where they run).
