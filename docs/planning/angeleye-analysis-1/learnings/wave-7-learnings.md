# Wave 7 Learnings

**Date**: 2026-03-22
**Sessions analysed**: 80 (bringing total to 268/789 = 34.0%)
**Agents**: 9 parallel (W7-01 through W7-09)
**Duration**: ~10 minutes to complete all 9 agents

## Application Learnings

### BUILD misclassification continues at similar rates

- **Wave 7 BUILD accuracy: ~22% (18/80)**. Consistent with wave 6 (17.5%).
- Micro sessions: 0% accuracy (0/5)
- Light sessions: ~15% accuracy
- Moderate sessions: ~30% accuracy
- Heavy/marathon sessions: ~50-70% accuracy
- Pattern confirmed: BUILD accuracy scales with session complexity

### 30+ new subtype candidates discovered (~40 across 80 sessions, ~0.50/session)

Discovery rate slightly UP from wave 6 (0.44). The broader project diversity (30+ projects vs ~8 in wave 6) exposed new patterns:

Key new subtypes:

- `research.concept_unpacking` — decomposing a dense concept cluster into research scope
- `orientation.insight_review` — reviewing Claude Code Insights analytics report
- `orientation.abandoned_start` — incomplete prompt, 0 tools, immediate termination
- `operations.client_onboarding` — new client email-paste-to-doc workflow
- `knowledge.brain_synthesis` — multi-source brain synthesis with JSON + NotebookLM staging
- `knowledge.content_analysis` — video transcript theme extraction for content planning
- `knowledge.template_adaptation` — cross-client template creation
- `knowledge.collaborative_data_design` — relay collaboration with external collaborator
- `knowledge.omi_transcript_ingestion` — OMI wearable transcript → background Agent → docs
- `build.feature_sprint` — multiple features sequentially, no Ralphy orchestration
- `build.scaffolding` — completing scaffold infrastructure (git init, npm publish)
- `build.campaign_abandoned` — build.campaign that ends in worktree reversal/discard
- `build.prompt_schema_refinement` — AI prompt template and schema editing as BUILD
- `sysops.registry_update` — jump system registration (2 instances)
- `sysops.disk_cleanup` — disk analysis + node_modules deletion
- `sysops.license_lookup` — software key retrieval
- `sysops.remote_query` — SSH query to check remote machine state
- `review.post_session_audit` — paste prior session output to forensically inspect changes
- `review.repo_audit_then_cleanup` — Explore subagent inventory + autonomous cleanup
- `planning.architecture_review` — multi-day planning with background research agents
- `planning.feature_requirements_to_plan` — commit → UX discussion → PlanMode
- `debug.quick_verification` — quick check on a specific issue
- `skill.refinement` — targeted skill edit from observed UX friction

### /tmp CWD is always incidental

New rule: `/private/tmp/*` or `/tmp/*` staging directories are always incidental — project label derived from tmp directory name is meaningless.

### task-notification prompts inflate user_prompt counts

9 of 15 "user prompts" in one session were `<task-notification>` XML callbacks from subagents, not human input. compute-session-shape.py should detect and exclude these.

### "Raffi" = "Ralphy" voice artifact

New voice dictation artifact for the catalog. AngelEye's ralphy_mode detection should add "raffi" as a trigger word.

### Context handover paste as session opener

3+ sessions opened with 5K-9K char `/capture-context` output from a prior session. This is a reliable BUILD/PLANNING continuation signal and a new opening_style variant.

### Worktree abandonment pattern

Build.campaign that invests significant work (11 subagents, 15+ edits) then gets discarded after an idle gap. The idle gap as a decision-point for abandonment is a new pattern.

### Playwright has 3 semantic roles confirmed

1. `ui_audit` — testing/reviewing UI in product repos
2. `external_research` — personal browsing/research in brains sessions
3. `documentation_verification` — checking that deployed docs (GitHub README) render correctly

### Second concurrent session pair confirmed

Angeleye + wave10 both touched ObserverView.tsx simultaneously → git confusion. Third confirmed concurrent pair across the dataset.

### OMI transcript ingestion is a new workflow

User brings raw OMI device transcript into Claude Code, dispatches background Agent to process it, writes structured docs to client repo. A new automation-assisted knowledge pipeline.

### PII continues to appear

Software license keys, family member names, collaborator names, email addresses found across 4+ sessions.

### Corrective followup as session chain type

User returns to fix Claude's prior mistake — frustration in opening prompt + destructive cleanup = corrective response. New session_chain variant.

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (again)

Append-only index continues to work flawlessly. 268 entries, 0 duplicates, 0 bad lines.

### Broader project diversity was productive

30+ projects (up from ~8 in wave 6) exposed subtypes that would never appear in the high-frequency projects. brain-dynamous, deckhand, thumbrack, kgems, ansible, voz, template, competent-golick all contributed novel patterns.

### Discovery rate rebounded

0.50 subtypes/session (up from 0.44 in wave 6). The diversity hypothesis was correct — new projects = new patterns. Next wave should continue broad sampling.

### Agent duration spread

All agents completed within a ~3-minute window (7-10 minutes). W7-04 was slowest at ~10 minutes (marathon v-appydave session). Event load balancing worked well.

### Micro bucket exhausted

All 5 remaining micro sessions consumed. Wave 8 will have 0 micro sessions unless new ones are ingested.
