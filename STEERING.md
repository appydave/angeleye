# AngelEye — Steering Document

A shared communication channel between David (working in the app) and Claude (holding the knowledge and giving direction).

**Protocol**:

- David writes observations, blockers, and questions in the `David → Claude` section while working
- Claude reads this at the start of each session, processes it, writes direction back, and marks items resolved
- Stable direction gets absorbed into CLAUDE.md over time

---

## David → Claude

_Write observations, blockers, questions here while working in the app. Be direct — what you noticed, what's unclear, what's stuck._

<!-- Example format:
- [observation] The registry.json gets stale when sessions crash — SessionEnd never fires
- [question] Should workspace assignment live in registry.json or workspaces.json?
- [blocker] HTTP hook POST is failing — 404 on /events endpoint
-->

_(empty — add items as you work)_

### Workflow Feature — Requirements + Documentation Sprint (2026-03-29)

**Source material processed:**

- OMI transcript: "BMAD Story Workflow & Agent Visualization Design" (178 segments, 10 action items)
- OMI transcript: "Designing the Factory Workflow UI and Data Model for Agent Sessions" (130 segments, 3 action items)
- Compacted session: `angeleye-bmad-enrichment` (0943c994) — artifacts intact, conversation lost to compaction
- Existing brain docs (15 files), app docs (requirements, workflow orchestration, enrichment pipeline, chain mockups)

**What was produced this session:**

1. **New brain doc: `~/dev/ad/brains/angeleye/workflow-model.md`** — Factory workflow model covering:
   - Station-based production line metaphor
   - Workflow types (regular story, epic zero, epic retrospective)
   - Station concept (config + runtime instance)
   - Session-to-station association router (automatic + ambiguous + multi-command)
   - Regular story workflow reference (9 stations, WN through SHIP)
   - Out-of-workflow agents: **Sentinel** (personal assistant shadowing all stations), **Relay** (quality oversight between agents), **Documentation agent** (canonical doc maintenance)
   - Sub-agent visualization (Nate's 6 review sub-agents, generic pattern)
   - Naming extensibility beyond BMAD
   - Relationship to existing infrastructure (overlays, affinity groups, registry)

2. **New app doc: `docs/planning/workflow-feature-requirements.md`** — Feature specification covering:
   - R1: Workflow schema (TypeScript/Zod) — WorkflowType, WorkflowInstance, StationInstance, BacktrackRecord
   - R2: Session-to-station router (automatic, ambiguous, multi-command)
   - R3: Workflows view UI (list view, pipeline view, backtracking, out-of-workflow agents, sub-agents)
   - R4: Developer inspection screens (schema inspector, data inspector)
   - R5: Integration points (overlays, affinity groups, registry, socket, mock views)
   - R6: 4-phase implementation priority
   - Open questions (creation trigger, affinity migration, multi-workflow, close detection)

3. **New TypeScript types in `shared/src/angeleye.ts`**:
   - `WorkflowType`, `StationConfig`, `SkipRule` — configuration types
   - `WorkflowInstance`, `StationInstance`, `BacktrackRecord` — runtime types
   - `WorkflowStatus`, `StationState`, `CeremonyLevel` — enums
   - Clean compile confirmed

4. **Workflow type configs** in `server/src/config/workflows/`:
   - `bmad-regular-story.json` — full 9-station workflow
   - `bmad-epic-zero.json` — provisional, stations TBD pending analysis of stories 0.1/0.2

5. **Updated brain INDEX.md** — added workflow-model.md to quick-find table and file index
6. **Updated docs/README.md** — added workflow requirements link

**Key new concepts NOT in existing docs before this session:**

- Sentinel agent (cross-station observer/companion)
- Relay team (inter-agent quality oversight)
- Documentation agent (canonical doc maintenance)
- WN as gatekeeper station outside the factory
- Workflow types as typed configurations (not just affinity group discovery)
- Session-to-station router with human confirmation fallback
- Third-menu "Workflows" view replacing Sprint Board
- Sub-agent visualization pattern (generic, not just Nate)

**Documentation audit findings (3 background agents completed):**

Brain audit found **3 critical contradictions, 4 stale refs, 4 moderate gaps**:

- **Hook count mismatch**: CLAUDE.md says 22, ingestion-architecture says 24, hooks-reference.md says 25. Canonical = 25.
- **"ADVISORY" misclassified**: `conversation-analysis-framework.md` line 425 calls it a session type — it's a conversation role (Angle 2). Fix: "KNOWLEDGE x1 (Advisor — pivoted to advisory role)"
- **OPS vs OPERATIONS**: Code uses `OPS`, docs use `OPERATIONS`. Not documented as alias.
- **INDEX.md body date stale**: Says 2026-03-21, frontmatter says 2026-03-28. Body needs update.
- **AGENTS.md says v2 current**: v3 is canonical since campaign completion. Never updated.
- **claude-inspector not cloned**: INDEX.md references `~/dev/upstream/repos/claude-inspector/` — directory doesn't exist.
- **Registry counts**: 894 (enrichment-pipeline.md) vs 976 (affinity-groups.md) — snapshot vs live.
- **"Conversation" scope**: data-concepts says "Conversation = Session" but framework uses it at exchange-level too.
- **fundamentals.md missing 5th job**: INDEX says "four (potentially five)" but fundamentals only describes four.

App doc audit found **7 contradictions, 6 stale refs, 4 cross-ref gaps, 4 terminology issues**:

- **CRITICAL — Hook architecture conflict**: `requirements.md` says HTTP hooks rejected (B024). `ingestion-architecture.md` brain file says HTTP hooks preferred. Brain file is stale.
- **requirements.md internal**: Line 78 says "21 events", line 398 says "24 events" (should be 25).
- **"Three Jobs" header stale**: Should be "Four Jobs" — Ambient Intelligence is the 4th, already described in body.
- **Future Capabilities section**: Lists B023, B037, B038-B043 as future — all completed per BACKLOG.md.
- **README.md campaign section**: Says 268 sessions — should be 924. Says 8 classifiers — now 13+.
- **Enrichment pipeline absent from requirements.md**: 8 detailed spec files exist but requirements.md doesn't link or describe them.
- **Workflow orchestration absent from requirements.md and README**: 3 files with detailed BMAD handover, not discoverable from entry-point docs.
- **Terminology overload**: "chain" means 4 different things, "pipeline" means 3 different things, "step" vs "station" not distinguished.
- **P16 label collision**: `excessive_changes` (schema) vs "CLAUDE.md auto-load" (observations log) — same ID, different concepts.

**Terminology decision needed** (from transcripts + audit): The OMI transcripts use "station" consistently for workflow steps. Existing docs use "step." The new `workflow-model.md` and `workflow-feature-requirements.md` standardize on "station." This should propagate — "step" is too generic.

**What's next:**

1. Fix high-priority audit findings (hook count, architecture conflict, stale sections)
2. Build Phase 1 of the workflow feature (schema + static view)
3. Connect workflow type configs to the existing mock-views API for chain mockups
4. Design the Workflows view React component (evolving Sprint Board mockup)

**Action item — doc audit cleanup**: `docs/planning/doc-audit-2026-03-29.md` has 20 prioritized fixes (5 high, 8 medium, 7 lower) from a 3-agent coherence audit across brain + app docs. Good candidate for a lightweight session or a Ralphy Content profile campaign. The high-priority fixes (hook count mismatch, architecture conflict, stale README numbers) take ~30 min and prevent confusion in every future session that reads these files.

---

## Claude → David

### 🚨 Pause for handover (2026-05-04, late evening)

**Status**: enrichment loop paused mid-flight after discovering a registry write-race bug. **Fix is live** (POST /api/registry/llm-tags). Resume in a fresh session.

**Read first**: `docs/planning/handover-2026-05-04-enrichment-loop.md` — full action-oriented handover with verification steps, lessons captured, and exact next commands.

**TL;DR**:

1. Verify write-race fix with a one-row curl test (handover §Step 1)
2. Run `npm run audit:registry` to refresh diagnostics
3. Re-enter the loop: `/loop /enrich-subtypes 50 build.campaign`
4. Audit task #34 — clobbered tag count from batches 7–14 is unknown

**LLM-enriched count is overstated** — clobbering was happening silently. Real number is lower than 386. The audit will surface it.

---

_Current direction, analysis, priorities. Updated by Claude at the start of each session after reading the David section._

### 🚨 Pause Enrichment — Audit Findings (2026-05-04 evening, REVISED)

**Decision**: pause `/enrich-subtypes` campaign. Resume after the fixes below.

**Original hypothesis (FALSIFIED)**: I claimed AngelEye was ingesting `agent-*.jsonl` sidechain files as primary sessions. This was wrong. Audit results below.

**Verified findings (corpus audit, 2026-05-04)**:

| Finding                                                                                         | Number                  |
| ----------------------------------------------------------------------------------------------- | ----------------------- |
| Main JSONLs in `~/.claude/projects/`                                                            | 1,378                   |
| `agent-*.jsonl` sidechain files                                                                 | **0**                   |
| Entries with `isSidechain: true` (across 279,348 events)                                        | **0**                   |
| **Agent Teams subagent files** (detected via `<teammate-message teammate_id="...">` in opening) | **454** (33% of corpus) |
| Registry rows total                                                                             | 2,623                   |
| Registry rows matching a JSONL on disk                                                          | 1,068                   |
| **Phantom registry rows** (in registry, no JSONL on disk)                                       | **1,555**               |
| Orphan JSONLs (on disk, not in registry)                                                        | 310                     |
| AngelEye transformed event store (`~/.claude/angeleye/sessions/`)                               | 2,144                   |
| AngelEye archive                                                                                | 1,261                   |

**Real problems (in priority order)**:

1. **Subagent detection mechanism mismatch.** Subagents in this environment are NOT `agent-*.jsonl` and do NOT have `isSidechain: true`. They are normal `.jsonl` files in the same project root, identified by `<teammate-message teammate_id="team-lead">` XML wrapper in the first user message. **454 of 1,378 files (33%) are subagents**, not the ~47 I originally estimated. All 454 currently have `teammate_id="team-lead"`. Brain doc updated 2026-05-04 with both Mechanism A (claimed, not observed) and Mechanism B (verified). See `~/dev/ad/brains/anthropic-claude/claude-code/observability.md`.

2. **Phantom registry rows (1,555).** Sessions where the JSONL was deleted/moved but the registry row remained. Many show `project: undefined`, `event_count: undefined`. Some carry LLM tags from earlier enrichment batches (e.g., `bbc86dc1` we just tagged `build.visual_implementation` is a phantom — the JSONL is gone). The registry is partly stale.

3. **Orphan JSONLs (310).** Real sessions on disk that AngelEye never ingested.

4. **User-prompt parser failure on slash-command openings.** Sessions opening with `/bmad-help`, `/poem:agents:penny`, `/appydave:ralphy`, etc. produce `opening_style: agent_initiated` and zero `user_prompt` events — but they're real human-driven sessions with a slash-command first prompt. The parser is treating the slash command as a system event, not as a user input. This is a separate bug from #1 — affects sessions where the opener is a skill invocation by a human, not an Agent Teams spawn.

**Sources of subagent volume in the 454**:

- BMAD tmux campaigns (Amelia, Quinn, etc.)
- Agent Teams research preview (Opus 4.6) — automatic parallel teammate spawns
- Paperclip multi-agent runs
- Ruflo (added 2026-05-04 evening) — Mode B uses Agent Teams under the hood, will add more

**Revised remediation plan (5 steps)**:

1. **Diagnose user_prompt parser** — read `classifier.service.ts` and the JSONL→event transform pipeline. Find why slash-command openings produce zero user_prompts. Identify the fix without implementing yet.

2. **Add `session_kind: 'main' | 'subagent'` and `teammate_id` fields** to the registry schema (`shared/src/angeleye.ts`). Update ingestion to detect Mechanism B (teammate-message wrapper) at parse time.

3. **Reconcile registry vs filesystem**:
   - **Phantoms (1,555)**: archive these into a `registry.json.phantom-archive.<date>` snapshot, then drop from the live registry. Some carry LLM tags worth preserving for posterity, but they're not addressable session data anymore.
   - **Orphans (310)**: ingest through the normal pipeline.
   - **Backfill `session_kind`** retroactively across all remaining rows by re-scanning JSONLs.

4. **Re-evaluate batches 5–6 LLM tags**: identify which of the 47 newly-tagged `build.campaign` rows are actually subagents (Mechanism B detected) and adjust. Could become `subagent_of:build.campaign` or just inherit a future `meta.subagent_session` tag — pending taxonomy decision.

5. **Resume enrichment** against the cleaned dataset. Existing LLM tags from earlier batches (~322 rows that aren't in the 47-row subagent miscategorisation) stay as-is unless they're phantoms.

**Decision (David, 2026-05-04 evening)**: David said "we almost have to go back to the beginning" — confirmed direction is to fix and re-enrich rather than patch. Sunk cost is low (~2 days of tagging) and second pass will benefit from accumulated classifier observations.

**Cross-reference**: full diagnosis in `docs/architecture/classifier-observations.md` §3.1.

---

### Reconciliation Done — Registry Cleanup (2026-05-04, REVISED after over-prune)

**Critical correction**: my first cleanup pass over-pruned. I treated "no upstream JSONL at `~/.claude/projects/...`" as the phantom criterion. But AngelEye archives event streams to `~/.claude/angeleye/archive/` when SessionEnd fires. **761 of the 1,555 rows I called phantoms had archived event streams** — they were fully-captured sessions that just had their raw Claude Code JSONL pruned upstream. Restored them.

**Why upstream JSONLs disappear** (the question David asked): not from AngelEye. AngelEye's `archiveSession` only moves its own `session-*.jsonl` from `~/.claude/angeleye/sessions/` to `~/.claude/angeleye/archive/` — it never touches `~/.claude/projects/`. The likely upstream causes:

1. Claude Code auto-purges old session JSONLs by age/count (most likely — phantoms cluster in _active_ projects, suggesting "older sessions in this project aged out")
2. A user-run cleanup script — appyctrl had 121 phantoms; that's a pattern worth checking
3. `claude /clear` or similar built-in
4. Disk-level events (Time Machine, etc.) — less likely

**Implication for AngelEye design**: the archive at `~/.claude/angeleye/archive/` is the long-term source of truth. Anything that re-reads raw JSONLs (e.g., the LLM enrichment skill's Step 1 extraction script) needs to fall back to the archive when the upstream JSONL is gone. **This is a separate bug** — not addressed yet, will affect future enrichment passes.

**Final reconciliation state**:

| State               | Was   | After over-prune | Final     |
| ------------------- | ----- | ---------------- | --------- |
| Registry rows       | 2,623 | 1,068            | **1,829** |
| LLM-enriched        | 369   | 88               | **201**   |
| is_junk             | 444   | 11               | **88**    |
| build.feature queue | 266   | 262              | **262**   |

794 true phantoms (no upstream JSONL **and** no archive event stream — i.e., genuinely no data anywhere) remain dropped. Their tags are preserved in the snapshot for posterity.

**Other actions completed (data layer only)**:

1. Brain doc fixed — `~/dev/ad/brains/anthropic-claude/claude-code/observability.md` documents both Mechanism A (claimed, not observed) and Mechanism B (verified, 454/1378 = 33%).
2. angeleye CLAUDE.md fixed.
3. Audit snapshot — `~/.claude/angeleye/reconciliation-audit.2026-05-04T13-06-16-782Z.json` (preserves all 1,555 originally-flagged rows).
4. Registry backup — `~/.claude/angeleye/registry.json.bak-pre-phantom-drop-2026-05-04` (full pre-cleanup state, recoverable).

**Subagent count from raw JSONL audit**: 454 Mechanism B sessions in `~/.claude/projects/`, of which 274 have AngelEye event streams (live + archive). Need raw-JSONL scan + archive fallback when backfilling `session_kind` on the 1,829 live rows.

**Pending — code changes (stop point reached this session)**:

1. **Schema**: add `session_kind: 'main' | 'subagent'` and `teammate_id?: string` to `shared/src/angeleye.ts` `SessionRegistryRow` (or whatever the canonical type is).
2. **Ingest detection**: at SessionStart hook, peek at the raw JSONL's first ~20 lines for `<teammate-message teammate_id="...">`. If found, stamp `session_kind: 'subagent'` and `teammate_id`. Hook events alone are insufficient — only 19/274 teammate sessions have any teammate_idle/subagent_start hook signal.
3. **Backfill**: re-scan all 1,068 live JSONLs and stamp `session_kind` retroactively. Estimated 274+ subagent rows.
4. **Orphan ingest**: 310 JSONLs on disk with no registry row. Mostly `archon-workspaces/` (Archon worktree-style sessions). Decide whether to ingest, ignore, or filter.
5. **Re-evaluate batches 5–6 LLM tags**: identify which of the ~47 newly-tagged `build.campaign` rows are subagents (Mechanism B) and adjust. Likely defer until #1–3 are in place so we have the field to filter on.
6. **Resume enrichment** with `session_kind: 'main'` filter applied — `/enrich-subtypes` should not run against subagent rows.

**Decision deferred to next session**: should subagents be classified at all (with their own tags), or simply marked and skipped from enrichment until parent linkage exists? My take: skip from enrichment until parent linkage; classifying subagent legs without parent context produces the same "leg looks like a campaign" mistakes we just made.

---

### Enrichment Update — Batch 5 (Opus 4.7, 2026-05-04)

**Batch 5 written**: 28 changes, 2 keeps. Distribution: build.campaign×9, build.shipped×5, build.orchestrated_campaign×3, knowledge.brain_capture×3, build.bug_fix×2, build.prompt_engineering×2, build.visual_implementation×1, knowledge.brain_maintenance×1, knowledge.methodology_design×1, build.feature×1.

**Registry state after batch 5**: 319 LLM-enriched, 314 `build.feature` remaining.

**New design insights from batch 5 (David, 2026-05-04):**

4. **`brains/` is a 70-brain monorepo, not a single project.** Sessions tagged `project: brains` may actually be working in completely different sub-brains (anthropic-claude/, agent-workflow-builder/, brand-dave/, etc.). Examples this batch: #11 (97c1599c), #25 (a9670559), #26 (d856c614) — all `project: brains` but three different sub-brain domains. **Action**: consider adding a `subproject_path` field derived from edited file paths (e.g., `brains/anthropic-claude/claude-code/`). This pattern can also apply to general code monorepos when consumers want sub-folder tagging. Not a tag — a missing axis.

5. **Story 0 / Epic 0 pattern: explore → write-up → execute (cross-session).** Some projects (BMAD-style) have a known pattern where session N explores an idea + writes it up as a planning artifact, then session N+1 executes on it. Currently both phases get classified the same way (often `knowledge.methodology_design` or `build.feature`). **Action**: consider `build.story_authoring` for the write-up phase to distinguish from generic methodology design. Only applies to certain projects (those using Epic 0 / Story 0).

6. **Session seams — currently invisible.** No notion of `predecessor_session_id` / `successor_session_id` or seam patterns (research→dev, single-doc→multi-session, ralphy/wiggum loop continuation). We detect `opening_style: paste_handover` but don't link to the source session. We don't detect `closing_style: handover_artifact_written`. The 5-session `dev` campaign (#12-16) clearly belongs to a chain (same project, same Skill+SendMessage fingerprint, same time window) but is treated as 5 independent sessions. **Action backlog**: add session-pair detection — handover doc paths, time-windowed Skill fingerprints, project+context links. This unlocks "what was the research that fed this build session?" and "how did this 10-session run begin?".

**Enrichment skill heuristic candidate**: `project === 'dev' + agent_initiated + SendMessage ≥ 1 + zero user prompts → build.campaign (0.85)`. This batch had 5 instances of the identical fingerprint.

7. **Rabbit hole syndrome (David, 2026-05-04).** Daily pattern — David starts a session intending to solve problem X, but each new idea spawns a fresh session, then those sessions spawn further sessions. By end of day there's a hierarchy of explored concepts when the morning intent was a single problem. **Why this matters for AngelEye:**
   - Point-to-point session linkage (predecessor/successor) doesn't model this — it's a tree/forest, not a chain.
   - "Intent drift" is a real first-class concept: `original_intent` (morning) vs `actual_focus` (where the session went) vs `descendant_sessions` (what it spawned).
   - This is exactly the topology argument from #6 — seams are not linear, they branch. A session can have multiple parents (idea source + handover source) and multiple children (spawned explorations).
   - Boundaries are missing because David has no autopilot system to enforce them. AngelEye could surface this: "you started today on X, now 14 sessions in, working on Y — was this intentional?"
   - **Action backlog (post 2,000-session enrichment)**: model session-trees, not session-pairs. Detect intent drift between session opening and session closing. Visualize daily session-spawn trees. Flag rabbit-hole days vs focus days as a metric.

**Note on portability config extraction**: David confirmed — keep checking the `// DATA:` markers and the extraction registry as we go, but don't move config out of code yet. Wait until after the 2,000-session enrichment campaign, then revisit.

**Note on brains rinse-cycle**: 70 sub-brains will be a future batch — once all 2,000 sessions have a first pass of LLM enrichment, we'll loop back over `project: brains` sessions with sub-brain-aware classification.

---

### Enrichment Handover — Switch to Opus 4.7 (2026-05-04)

**Session context**: Sonnet 4.6 session hit ~70% context after 4 LLM enrichment batches. Switching to Opus 4.7 for remaining batches.

**What was done this session (enrichment track):**

1. `SessionTag.source` field added (`shared/src/angeleye.ts`) — provenance stamps prevent cleanup scripts from wiping real LLM work
2. `scripts/demote-stale-llm-tags.ts` rewritten — now safely targets `source === 'migrated'` only
3. `scripts/backfill-tag-source.ts` created + run — stamped 147 LLM, 2,442 migrated
4. `.claude/settings.json` — 10 permission allowlist entries (including `Bash(node -e " *)` fix)
5. `classifier.service.ts` — expanded `build.bug_fix` heuristic to catch diagnostic prompts ("why did X fail?", "figure out why", "keeps failing")
6. `enrich-subtypes/SKILL.md` — default batch 30→50; table format updated to Before→After columns
7. `docs/architecture/data-driven-extraction.md` — portability registry (10 extraction points, `// DATA:` markers in code)

**Registry state**: 299 LLM-enriched (13.8%), 340 `build.feature` remaining in queue

**Next action**: `/enrich-subtypes 50 build.feature` (batch default is now 50, not 30)

**Important — extraction command**: Do NOT append `| head -3000` to the Step 1 bash command. Large output is saved to a persisted file automatically. The head truncation caused batch 4 to only return 70 sessions instead of 100.

**Open design questions for future sessions**:

- Paperclip/BMAD multi-agent subagent sessions (project = UUID) — currently `build.campaign`, might need `build.subagent_session`
- David uses "build.campaign" to mean "a big coordinated agent run" — consider renaming to `build.coordinated_run`
- signal-studio sessions are all historical mock/POC (pre-SupportSignal) — note for classifier context

**Classifier design insights (from David, 2026-05-04) — important for future enrichment and heuristic work:**

1. **`first_real_prompt` is often noise.** Opening prompts are frequently context loads, handover receipts, housekeeping ("yes", "continue", "open a file in VS Code"). You need to read 3-5 prompts before you understand what the session is actually about. The classifier and the LLM enrichment skill both over-index on the first prompt.

2. **`paste_handover` + immediate execution = missing human-in-the-loop.** bb54ff44's issue wasn't wrong work — the agent received a handover doc and started executing without pausing for human guidance or asking what to do. This is a known flaw in the handover pattern. Sessions with `opening_style === 'paste_handover'` and large context fed in should be flagged as "context-load pending decision", not classified by what the agent did next.

3. **Implication for the enrich-subtypes skill:** When classifying, look at prompts 2-5 as much as prompt 1. If prompt 1 is a paste/handover/yes/continue, treat it as noise and weight the subsequent prompts more heavily.

### Phase 2b Complete — Inspector Screens + Project Registry (2026-03-29)

**Delivered** (B057-B059, campaign: `angeleye-workflow-phase2b`):

- **Project registry config loader** — `ProjectConfig` type in shared, cached JSON loader service, `/api/projects` + `/api/projects/:id` endpoints, 3 seed configs (angeleye, flivideo, supportsignal), 10 tests
- **Schema Inspector tab** — renders shared types as code block, workflow type configs as table, project configs as table. Shared `CollapsibleSection` component.
- **Data Inspector tab** — sessions summary (by type/project with counts + percentages), workflows table, affinity groups table with type badges. `useInspectorData` hook with parallel fetches.
- **Delivery review** ran post-completion. 3 of 4 patches applied (CollapsibleSection extraction, env-overridable SHARED_TYPES_PATH, description validation guard). 1 skipped as false positive.

**Also fixed this session:**

- 8 pre-existing test failures (env.ts dotenv override, correlator backtrack key, backfill mock)
- Restored workflow configs corrupted by a Phase 2b agent (epic-zero gutted, lightweight-story deleted)
- Then intentionally removed `bmad-lightweight-story.json` — two-tier model (Regular Story + Epic Zero) matches actual usage. Lightweight was never instantiated.

**Workflow type configs now**: Regular Story (full, 9 stations) + Epic Zero (minimal, 5 stations). Epic Retrospective remains named but undefined — not enough observation data.

**Current state**: 1,039 sessions in registry. 0 workflow instances (none created yet). 17 affinity groups (8 story units, 9 ad hoc clusters). All tests passing, typecheck clean, lint clean.

**What's next:**

1. **Phase 2c** (B060-B062) — deterministic classifier extensions (~8 new fields), top-20 subtype rules, re-enrich button. This is the highest-value pending work.
2. **B063** — add `project_dir` to WorkflowInstance (small, could bundle with 2c)

---

### Harness Integration for Workflow Automation (2026-03-29)

**What was done this session:**

- Processed handover from Ralphy multi-lens analysis session (`/tmp/handover-anthropic-harness-for-angeleye.md`)
- **Created conditional rule** (`.claude/rules/workflow-automation.md`) — loads harness reference links and design principles when editing workflow configs, planning docs, or shared types. Path-scoped so it doesn't bloat normal development sessions.
- **Created architecture doc** (`docs/planning/workflow-automation-harness.md`) — maps all 7 harness capabilities (H1-H7) to concrete AngelEye integration points with implementation phases:
  - H1: Hook-driven station transitions (TaskCompleted, FileChanged, TeammateIdle, CwdChanged, TaskCreated)
  - H2: Agent `initialPrompt` templates for self-starting stations
  - H3: Swarm teams for Sentinel/Relay/Documentation inter-agent coordination
  - H4: Persistent plugin state for campaign progress
  - H5: Background agents for parallel pipeline execution
  - H6: `--bare` flag for deterministic helper scripts
  - H7: Conditional rules (done — this session)
- **Updated docs/README.md** — added workflow automation harness doc to the index table

**Rolled back** (premature — Phase 4 concerns before Phase 1 exists):

- `StationAutomation`, `HarnessHook`, `OutOfWorkflowAgent` type extensions in `shared/src/angeleye.ts` — reverted to pre-session state. These belong in Phase 4 when the basic workflow infrastructure is running.

**Lesson**: The harness capabilities doc is valuable as a reference, but building automation types before the workflow feature has storage, routing, UI, or API endpoints is putting the cart before the horse. The Ralphy research loop identified capabilities; the build loop should follow the R6 phase order.

**What's next (proper sequence):**

1. **Fix high-priority audit findings** from the documentation sprint (hook count mismatch, architecture conflict, stale sections)
2. **Phase 1 build** — `workflows.json` storage, API endpoints (`GET/POST /api/workflows`), static Workflows list view
3. **Connect workflow configs to mock-views API** — render workflows in Mochaccino mockups
4. **Phase 2** — session-to-station router, socket events, live binding
5. **Phase 4** — _then_ add harness automation types (H1-H7) on top of working infrastructure

---

### Mochaccino API-Driven Mockups + Sample Data Fallback (2026-03-28)

**What was done this session:**

- **Converted all 9 HTML mockups from hardcoded data to API-driven** — each mockup now fetches from `/api/mock-views/*` endpoints instead of embedding data inline
- **Built sample data fallback layer** — when real data is thin or missing, curated JSON from `.mochaccino/samples/` is served automatically
- **New service**: `server/src/services/sample-data.service.ts` — `loadSample()` and `loadParamSample()` read JSON from disk
- **New helper**: `apiSuccessWithSource()` in `response.ts` — tags every response with `"source": "live"` or `"source": "sample"`
- **Rewrote mock-views routes** — all 10 endpoints have fallback logic + `?sample=true` override + generic catch-all for future sample-only views
- **Created 4 priority sample files**: `chain-session-detail/_default.json`, `chain-sprint-board.json`, `chain-story-pipeline/_default.json`, `chat-panel.json`
- **Fixed cross-machine access** — all HTML mockups use `window.location.hostname` instead of `localhost` for API base URL
- **Fixed visual parity issues** — action codes (WN/CS/DS/DR), column mapping (`advisor` → CURATE), event noise filtering (skip `pre_tool_use`, `progress`, etc.)
- **Documented the architecture** — `.mochaccino/mock-data-fallback.md` + updated Mochaccino skill with API-driven section

**Key pattern for future mockups (no server code needed):**

1. Write HTML in `.mochaccino/designs/{name}/index.html`
2. Drop JSON at `.mochaccino/samples/{name}.json`
3. HTML fetches from `/api/mock-views/{name}` — the generic catch-all serves it

**Not done (lower priority):**

- 5 remaining sample files (observer, organiser, named-rows, sync, story-chains) — real data exists for these
- Story 2.3 backtrack visualization (curved SVG arrow, conditional pass nodes)

---

### BMAD Enrichment — Full Pipeline Fix (2026-03-27)

**What was done this session:**

- **Fixed skill-expanded prompt extraction** — the backfill's `content.startsWith('<')` filter was discarding all skill-triggered prompts (Claude Code wraps `/bmad-sm wn` as `<command-name>bmad-sm</command-name><command-args>wn</command-args>`). Added `extractSkillPrompt()` to parse command + args from XML tags. This was the root cause — every BMAD session was being silently dropped.
- **Fixed sync to support force reclassification** (`POST /api/sync?force=true`) — previously skipped sessions that already had `session_type`
- **Fixed backfill orphan repair** — sessions in registry but missing event files now get re-extracted (286→64 orphaned)
- **Fixed correlator merge logic** — story_unit groups were being merged with ad_hoc temporal clusters via union-find bridge. Added type guard: only merge groups of the same type. Also excluded story-covered sessions from Signal 2 temporal clustering.
- **Added 3 legacy overlay mappings** — bmad-help, bmad-sprint-status, bmad-check-implementation-readiness

**Results:**

- **92 BMAD sessions enriched** (was 0 before this session)
  - Bob (planner): 32 | Nate (reviewer): 14 | Amelia (builder): 13
  - Observer: 8 | Lisa (advisor): 6 | Taylor (tester): 6 | Shipper: 4
  - Sally (UX): 2 | Winston (architect): 2 | Utility: 5
- **8 deterministic story groups**: Stories 0.1, 0.2, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4
- **8 workflow clusters**: oversight (7), bmad-sm batches (4 clusters), ux-designer (2), sprint-status (5), readiness-check (3)
- Story 2.2 confirmed as cleanest run (zero backtracks, 5 sessions)
- Stories 1.1-1.4 not grouped because those sessions didn't include story IDs in trigger_arguments (e.g. `/bmad-dev` without `DS 1.1`)

**Changes made:**

- `server/src/services/backfill.service.ts` — `extractSkillPrompt()` parses `<command-name>/<command-args>` from JSONL; orphan event repair; `repaired` counter
- `server/src/services/sync.service.ts` — `SyncOptions.force` parameter to reclassify all sessions
- `server/src/routes/sync.ts` — accepts `?force=true` query parameter
- `server/src/services/correlator.service.ts` — type-guarded merge (story_unit won't merge with ad_hoc); exclude story sessions from temporal clustering
- `server/src/config/overlays/bmad-v6.json` — added bmad-help, bmad-sprint-status, bmad-check-implementation-readiness

**What's next:**

1. **Stories 1.1-1.4 grouping** — those sessions used commands like `/bmad-dev` without story args. Options: (a) parse story ID from the session content/first prompt, (b) manually tag them, (c) add a heuristic that infers story from temporal position + agent sequence
2. **Ship/oversight story assignment** — `/bmad-ship` and `/bmad-oversight` don't carry story IDs. Could infer from temporal proximity to the preceding story chain
3. **Chain visualization data** — connect affinity groups to the mochaccino mockups (chain-sprint-board, chain-story-pipeline, chain-session-detail)

---

### BMAD BI Enrichment — Extension Plan + Implementation Sprint (2026-03-27)

**What was done this session:**

- Received handover from BMAD inventory session (3 workflow orchestration docs: bmad-session-inventory.md, bmad-session-boundaries.md, bmad-lifecycle-handover.md)
- Wrote formal Pipeline Extension Plan (docs/planning/enrichment-pipeline/pipeline-extension-plan.md) — 4 new capability layers:
  1. Extractors (E01-E04) — positional value extraction with opening/closing windows
  2. Domain Overlays (C14-C16) — generic workflow roles with pluggable domain-specific mappings (BMAD overlay example)
  3. Affinity Groups — cross-folder session correlation into business units (Story Units → Epic Sprints → Project Phases)
  4. Agent Genesis (P31-P35, C22) — infrastructure impact detection
- Ran doc coherence review (docs/planning/enrichment-pipeline/doc-coherence-review.md) — found 8 contradictions, 6 loose ends
- Ran gap analysis (docs/planning/enrichment-pipeline/gap-analysis.md) — ~10% of documented enrichment was implemented, core pipeline solid
- Fixed doc quick wins: P16 label, observation count (7 not 8), B038/B039/B040 moved to resolved
- Added pii_flags and session_scale to shared TypeScript types
- Implemented 11 new Tier 1 detections in classifier.service.ts:
  - P05 (playwright), P09 (compaction), P12 (machine-initiated), P19 (web research), P20 (parallel subagents), P21 (task orchestration), P22 (git outcome), P34 (skill created), P35 (skill modified)
  - E01 (trigger_command), E02 (trigger_arguments)
- Added positional windows documentation to PATTERNS.md

**Implementation totals now:** 17 implemented enrichment items (up from 6), out of 58 documented. All Tier 1 deterministic predicates are now covered.

**What's next (recommended priority):**

1. Tier 2 predicates (P04, P06, P08, P11, P17, P18, P25) — regex/heuristic, no LLM cost
2. Domain overlay infrastructure (JSON config loader + C14-C16 generic classifiers)
3. Affinity group correlator (start with deterministic links: shared story IDs, temporal proximity)
4. Tier 3 LLM infrastructure (API client, enrichment queue, batch processing)

**Helmet CSP fix** from prior session is still uncommitted in server/src/index.ts.

---

### Campaign Complete + v3 Schema Migrated (2026-03-24)

**angeleye-analysis-1 is done.** 924 sessions fully processed across M4 Mini (807) and M4 Pro (116). Three analysis passes complete: forward (waves 1-14), backward (P17-P22, C08-C11, O06-O07), final (P23-P25, C12-C13, O08).

**v3 schema migration complete.** All 924 entries unified into consistent structure — canonical P/C/O-prefixed keys, normalized predicate/classifier formats, `forward_pass` metadata (null for 418 backward-pass-born entries). Migration script at `brains/angeleye/analysis/migrations/migrate-v2-to-v3.py`.

**Doc updates complete:** PATTERNS.md (v3 schema + 924-session findings), requirements.md (operational status), README.md, campaign dashboard + infographic (Chart.js + data tables).

**Optional future work:**

- Promote confirmed subtypes (N >= 3) from 500+ candidates to canonical taxonomy (B043)
- Multi-machine registry sync (B044)

---

## Resolved

_Processed items moved here for reference. Date + brief resolution note._

<!-- Example:
- 2026-03-18 [blocker] HTTP hook 404 → resolved: server wasn't mounting /events route, fixed in server/src/index.ts
-->

- 2026-03-24 B038 — Scale-aware BUILD guard → implemented in commit 3f593607
- 2026-03-24 B039 — Iron-clad classifier rules → implemented in commit 3f593607
- 2026-03-24 B040 — PII detection → implemented in classifier.service.ts (detectPiiFlags with pattern matching)
