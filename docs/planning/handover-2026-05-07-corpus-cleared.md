# Handover — Enrichment Corpus Cleared

**Date:** 2026-05-07
**Author of session:** Claude Opus 4.7 in collaboration with David Cruwys
**Repo state:** all changes committed and pushed to main on both Roamy and M4 Mini

This doc captures durable knowledge from a long arc of work that ran from the enrichment-loop smoke test through to clearing the entire historic enrichment queue and identifying the next architectural moves.

---

## What's done

### Code shipped (committed + deployed to M4 Mini)

| Change                                                                          | Files                                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Hardening patches DVR-002 to DVR-009 + dedup + apply-changes-to-registry        | `server/src/services/enrichment.service.ts`, `server/src/routes/sessions.ts`, tests |
| `GET /api/sessions/:id/raw` with 3-tier source (upstream → backup → archive)    | `server/src/services/sessions.service.ts`, `routes/sessions.ts`                     |
| `meta.silent_session` taxonomy + auto-junk filter at `session_end`              | `server/src/routes/hooks.ts`, taxonomy reference                                    |
| `POST /api/registry/backfill-silent` endpoint                                   | `routes/sessions.ts`                                                                |
| Upstream JSONL backup at `session_end` to `~/.claude/angeleye/raw-transcripts/` | `services/sessions.service.ts`, `services/registry.service.ts`                      |
| Schema observation logging for unknown JSONL entry types                        | `services/sessions.service.ts`                                                      |
| Unknown hook event logging to `unknown-hooks.jsonl`                             | `routes/hooks.ts`                                                                   |
| Rate limit bumped 100 → 5000 per 15min                                          | `middleware/rateLimiter.ts`                                                         |

### Documentation written

| Doc                                              | Purpose                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `docs/planning/angeleye-self-learning-system.md` | 4-layer architecture (routine → dreaming → routing → feedback) |
| `docs/intelligence/observations.jsonl`           | Running intelligence log — ~30 entries                         |
| `docs/intelligence/ruflo-investigation.md`       | Living evidence ledger for Ruflo mechanism question            |
| `docs/intelligence/escapes-ledger.md`            | Canonical escape evidence — 4 categories live (E1, E2, E3, E6) |

### Requirement docs written (open or resolved)

| Status       | Doc                                                          |
| ------------ | ------------------------------------------------------------ |
| **Resolved** | `2026-05-06-meta-silent-session-taxonomy-and-junk-filter.md` |
| Open         | `2026-05-06-classifier-bmad-orchestrator-trigger.md`         |
| Open         | `2026-05-06-classifier-ruflo-orchestrator-taxonomy.md`       |
| Open         | `2026-05-06-classifier-skill-development-taxonomy.md`        |
| Open         | `2026-05-06-schema-has-thinking-blocks.md`                   |
| Open         | `2026-05-06-ingestion-backup-upstream-jsonl.md`              |
| Open         | `2026-05-06-apply-changes-to-registry.md`                    |
| Open         | `2026-05-07-schema-has-playwright-e2e-predicate.md`          |
| Open         | `2026-05-07-schema-has-scheduling-setup-predicate.md`        |
| Open         | `2026-05-07-ui-marathon-session-handling.md`                 |
| Open         | `2026-05-07-ingestion-detect-paperclip-workspaces.md`        |

### New skills built

| Skill                              | Path                                       | Status                                    |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------- |
| `appydave:schedules-registry`      | `appydave-plugins/.../schedules-registry/` | committed, registry seeded with 3 entries |
| `appydave:skills-registry`         | `appydave-plugins/.../skills-registry/`    | committed, **194 skills imported**        |
| `angeleye-dreaming`                | `.claude/skills/angeleye-dreaming/`        | committed, **not yet run**                |
| Updated `angeleye-enrichment-loop` | escape detection added to Step 5c          | committed                                 |

### Final corpus state

| Bucket                                | Count     |
| ------------------------------------- | --------- |
| Total sessions                        | 2,438     |
| Junk (T3 silent probes auto-filtered) | 1,050     |
| Subagent + subprocess legs            | ~237      |
| **Main + enriched at v1**             | **1,150** |
| **Main + still eligible**             | **0**     |

The historic queue is cleared. New sessions ingested from this point forward will accumulate naturally.

---

## What's open and what to do next

### The big architectural realisation — corrected 2026-05-07 by deeper research

**Earlier framing was wrong.** I previously characterised the workflow infrastructure (`WorkflowType`, `StationConfig`, `WorkflowInstance`, `StationInstance`, `AffinityGroup`, `DomainOverlay`) as "a designed factory model that the classifier just isn't using yet." David's correction: it was always a UI visualisation hack — a way to render something workflow-shaped in `WorkflowsView`. Not a designed analysis model. Not load-bearing. Treat it as a sketch, not a foundation.

**Terminology error:** the type is `DomainOverlay`, not `WorkflowDomain`. Grep confirmed (`shared/src/angeleye.ts:324`).

**Actual state:** the classifier already names `build.bmad_orchestrator`, `build.bmad_agent`, `build.ruflo_orchestrator`, `build.ralphy_campaign` in `subtype_heuristic` (`classifier.service.ts:1123-1147`). Recognition is solved. What's _not_ designed is how those signals should map to a representation that supports analysis (lifecycle clustering, per-workflow rubrics, time-aware metrics).

**Two research docs written 2026-05-07:**

- `docs/intelligence/workflow-infrastructure-research.md` — full inventory: 2,349 LOC across 14 files, single-button trigger via `WorkflowsView.tsx:73`, persistence files (`workflows.json`, `affinity-groups.json`) never written to disk. The whole layer is gated behind two manual HTTP endpoints. Multiple type variants (`epic_sprint`, `project_phase`, `BacktrackRecord`, `CeremonyLevel`, `SkipRule`, `StationState='skipped'/'backtracked'`) are declared but never produced anywhere.
- `docs/intelligence/ruflo-topology-research.md` — claude-flow / Ruflo architecture (renamed upstream, v3.6.27). Four canonical topologies (hierarchical/mesh/ring/star) plus adaptive. The "JSON team config" lives ephemerally as live tool-call arguments (`mcp__ruv-swarm__swarm_init({...}) + Task({...}) × N`), not as a persisted file. Detection is fully deterministic at sync time — no LLM needed for structural classification.

**The open architectural question:** design a clean representation for BMAD lifecycles AND Ruflo swarm runs from scratch (or extend the viz-hack model deliberately). Four shape decisions queued — none answered yet:

1. Topology — first-class `WorkflowType` field vs `metadata`
2. BMAD phase primitive — new `WorkflowPhase` interface above `StationConfig` vs evolved `WorkflowType` (the model has no "phase" concept today, only `StationConfig.position: number`)
3. Ruflo workers — one `StationInstance` with `subagent_count: N` vs N separate `StationInstance`s
4. Pre-built Ruflo templates (`feature`, `security`, `refactor`, `bugfix`) — each a `WorkflowType` registration vs only ad-hoc swarms

These are downstream of the bigger choice: **extend the existing sketch deliberately, or design a fresh model and let the viz hack continue running in its own corner.**

### Three requirement docs to write (David approved direction, didn't approve writing yet)

1. **Schema**: add `'bmad_phase'` (or generic `'workflow_phase'`) to `session_kind`, plus `parent_orchestrator_session_id`
2. **Correlator**: wire up `correlator.service.ts` to populate AffinityGroups from BMAD trigger_command patterns
3. **API time-spans**: `duration_seconds` field, `?since=&until=` filters, day-aggregate rollups, inside-session timing summaries

### Three open requirement docs need follow-through

- `2026-05-07-schema-has-playwright-e2e-predicate.md`
- `2026-05-07-schema-has-scheduling-setup-predicate.md`
- `2026-05-07-ui-marathon-session-handling.md`
- `2026-05-07-ingestion-detect-paperclip-workspaces.md` (high priority — 8 escapes confirmed)

### The dreaming pass should run for the first time soon

Skill exists at `.claude/skills/angeleye-dreaming/`. **Don't run today** — needs ~7 days of fresh enrichment activity to reflect on. First useful run is around 2026-05-14. Invoke as `/angeleye-dreaming 7`. Review output before automating as a routine.

---

## Important corrections David made about my analysis

**1. The 50:7 BMAD agent-to-orchestrator ratio is normal, not a sign of failure.**

Each BMAD story lifecycle has ~9 phases (Swagger, Controlling, Bob×2, Mary, Nate, Taylor×2, Lisa, Shipping). Swagger launches each phase in a _separate tmux session_, which AngelEye captures as `session_kind: 'main'`. So 7 orchestrators × ~8 phases each ≈ 56 expected agent sessions. The data matches David's actual usage (3-4 BMAD workflows/day × 9 phases = 27-36 agent sessions/day). My "filling gaps" framing was wrong.

**2. BMAD phase sessions deserve their own `session_kind`.**

They're not user-initiated main work — they're stations in a factory workflow. Calling them `main` conflates them with regular dev sessions. New value needed.

**3. "Two modes" cross-batch analysis was actually "two project types."**

When I said you alternate between "execution sprint" and "reflection + tooling" modes, that was confusing project shape with behavioral mode. SupportSignal sessions look like execution. Brains/AngelEye sessions look like reflection. You aren't switching modes within a day — you're working on different projects with different shapes.

**4. Real analysis needs time, project-normalisation, and lifecycle-awareness.**

I've been doing tag-counting and calling it analysis. None of my analyses used time spans (which are partly available — `started_at`, `last_active`, event-level `ts`). Per-workflow normalisation requires the AffinityGroup linking. Lifecycle clustering requires BMAD phase grouping.

---

## Memory entries currently saved

Located at `~/.claude/projects/-Users-davidcruwys-dev-ad-apps-angeleye/memory/`:

- `feedback_enrichment_notes_style.md` — write notes in plain English
- `feedback_four_pillars.md` — canonical, provenance, synthesis, citation vocabulary
- `feedback_high_interest_projects.md` — Ruflo + AWB get extra attention; Ruflo investigation is in `docs/intelligence/ruflo-investigation.md`
- `project_self_learning_system.md` — 4-layer architecture; canonical doc is `docs/planning/angeleye-self-learning-system.md`

Memory index at `MEMORY.md` lists all four.

---

## Watch-list for future work

### Ruflo will create new patterns

When real Ruflo Swarm execution starts (claude-flow CLI calls in Bash, not just install/maintenance), the data signature will be different from BMAD. Predict a new `WorkflowType` registration and a new AffinityGroup type like `swarm_run`. The ruflo-investigation doc will accumulate evidence as sessions appear.

### Per-workflow rules/metrics/rubrics/patterns

Different workflow types need different evaluation criteria:

- BMAD success rubric is different from a Ralphy campaign success rubric is different from a `/focus` research session
- The factory model can hold these as `WorkflowType` config — but no rubrics are defined yet

### Provenance discipline for generated artifacts

Following the four-pillars feedback: any LLM-generated report (like the skills-registry quality scan) needs to separate deterministic computation from interpretation, with citations. The current `quality-scan-2026-05-07.md` violates this — counts came from skills.json (deterministic) but kind/family/duplicate inferences were vibe-judgments. Future reports should split layers explicitly.

---

## Next session pick-up

A future session continuing this work should:

1. Read this handover doc first
2. Read `MEMORY.md` for vocabulary + active feedback
3. Decide between:
   - Writing the 3 architectural requirement docs (BMAD phase kind, correlator wiring, time-span API)
   - Implementing the resolved-but-open requirement docs (Paperclip filter, predicates, UI marathon handling)
   - Running the first dreaming pass (only after ~7 days of fresh data)
   - Starting Ruflo investigation expansion as new sessions appear

**The corpus is clean. The infrastructure is there. The next move is wiring the classifier to use the workflow factory model that already exists.**
