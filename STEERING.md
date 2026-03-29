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

_Current direction, analysis, priorities. Updated by Claude at the start of each session after reading the David section._

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
