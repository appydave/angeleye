# AGENTS.md — angeleye-analysis-1

## Project Overview

**What**: Systematic analysis of Claude Code session data to expand the AngelEye conversation analysis framework.
**Campaign type**: Analysis — not a code build. Agents read session JSONL, classify, extract patterns, and write curated knowledge.
**Stack**: Python3 for data extraction, Markdown for knowledge output. No app code changes.

## Data Locations

### Session JSONL (read-only source of truth)

**M4 Mini (local)**:

- Active sessions: `~/.claude/angeleye/sessions/session-{id}.jsonl`
- Archived sessions: `~/.claude/angeleye/archive/session-{id}.jsonl`
- Registry: `~/.claude/angeleye/registry.json` (dict keyed by session_id)

**M4 Pro (remote)**:

- Same paths, accessed via: `ssh macbook-pro-m4 "cat ~/.claude/angeleye/sessions/session-{id}.jsonl"`
- SSH alias `macbook-pro-m4` → Tailscale IP `100.89.32.35` (from `~/.ssh/config`)
- Both `campaign-status.py` and `compute-session-shape.py` support `--machine m4-pro` flag

### JSONL Event Format

Each line is a JSON object:

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "ts": "ISO8601",
  "source": "hook",
  "event": "user_prompt|tool_use|stop|session_start|session_end|subagent_start|subagent_stop",
  "prompt": "...",
  "tool": "Edit|Bash|Read|Write|...",
  "tool_summary": {},
  "result": "...",
  "reason": "...",
  "last_message": "...",
  "agent_type": "..."
}
```

### Registry Entry Fields

```json
{
  "session_id": "uuid",
  "status": "active|ended",
  "project": "name",
  "project_dir": "/path",
  "session_type": "BUILD|TEST|RESEARCH|KNOWLEDGE|OPERATIONS|ORIENTATION",
  "tool_pattern": "bash-heavy|read-heavy|edit-heavy|mixed|...",
  "first_real_prompt": "first 200 chars",
  "name": "user-assigned|null",
  "tags": [],
  "is_junk": false,
  "started_at": "ISO",
  "last_active": "ISO"
}
```

## Output Locations

### Knowledge output (curated findings)

Write to: `~/dev/ad/brains/angeleye/analysis/`

Files to create/update per wave:

- `session-index.jsonl` — one line per processed session (append-only)
- `findings-wave-N.md` — observations from each wave (raw, not yet curated)
- Topic files as patterns emerge (e.g., `prompt-patterns.md`, `anti-patterns.md`, `session-type-examples.md`)

### Campaign state

Update: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/IMPLEMENTATION_PLAN.md`

## Multi-Pass Analysis Philosophy

This is not a single-pass classification exercise. Sessions accumulate analytical depth over time through multiple passes, each applying a different lens. A session classified as BUILD on pass 1 might reveal a prompt anti-pattern on pass 3 that changes how we think about the entire BUILD category.

### How passes work

- **Forward passes**: Analyse new, unprocessed sessions
- **Backward passes**: Re-analyse previously processed sessions through a newly discovered lens
- Each pass adds a layer of understanding — sessions that seemed uninteresting under one lens might light up under another discovered three waves later
- The Ralphy loop accommodates both: "next batch of unprocessed" AND "re-pass all through the new concept we just found"

### Lenses (will grow over time)

Initial lenses for pass 1:

- `overview` — basic classification, session shape, quick observations
- `prompt-patterns` — how users open sessions, voice vs typed, handovers
- `anti-patterns` — where time is wasted, corrections, drift
- `skill-usage` — which skills, how effectively, gaps

New lenses will emerge from the data. When a new lens is identified, consider whether existing sessions should be re-passed through it.

## Session Index Schema

### Versioned schema with migration

The index schema will evolve as we learn what data matters. The approach:

1. **Version the schema** — each schema has a version number (v1, v2, ...)
2. **When a change is needed**: design the new schema based on what was actually needed, not imagined
3. **Write a migration script** (`~/dev/ad/brains/angeleye/analysis/migrations/migrate-v{N}-to-v{N+1}.py`) that transforms all existing entries
4. **Run migration once**, move forward on new schema. No maintaining two versions.
5. Migration scripts are kept as history of how understanding evolved

### v1 Schema (retired — migrated to v2)

v1 was a flat structure with free-text `notes`. Migrated after wave 4 (68 entries). Backup at `session-index-v1.jsonl.bak`. Migration script: `migrations/migrate-v1-to-v2.py`.

### v2 Schema (current — since wave 4 completion)

Each line in `session-index.jsonl`. Splits data into raw measurements (shape, tools) and structured interpretations (classifiers, predicates, observations).

**Design principle**: Store raw counts and measurements. Derive labels via well-defined classifier and predicate prompts documented in `learnings/analysis-lenses.md`. Don't store labels that can be computed from raw data — except when the interpretation requires analyst judgment.

```json
{
  "schema_version": 2,
  "session_id": "full-uuid",
  "machine": "m4-mini|m4-pro",
  "project": "project-name",
  "project_dir": "/path",

  "shape": {
    "file_size_bytes": 148975,
    "event_count": 379,
    "user_prompt_count": 45,
    "tool_use_count": 334,
    "duration_minutes": 828,
    "active_minutes": 120,
    "context_compactions": 3
  },

  "tools": {
    "Bash": 182,
    "Read": 45,
    "Edit": 34,
    "Agent": 24
  },

  "classifiers": {
    "session_type": {
      "value": "DEBUG",
      "subtype": "e2e_campaign",
      "confidence": "high",
      "reasoning": "..."
    },
    "opening_style": { "value": "conceptual_question", "confidence": "high", "reasoning": "..." },
    "closing_style": { "value": "unresolved", "confidence": "medium", "reasoning": "..." },
    "tool_profile": { "value": "debug_loop", "confidence": "high", "reasoning": "..." },
    "project_attribution": {
      "value": "reliable|unreliable|incidental",
      "confidence": "...",
      "reasoning": "..."
    },
    "session_scale": {
      "value": "micro|light|moderate|heavy|marathon",
      "confidence": "high",
      "reasoning": "..."
    }
  },

  "predicates": {
    "is_feature_construction": {
      "result": false,
      "justification": "No new routes or components created"
    },
    "has_frustration_signals": { "result": true, "justification": "6 explicit frustration events" },
    "is_multi_phase": { "result": false, "justification": "Single continuous debugging activity" },
    "has_brain_file_writes": null,
    "has_playwright_calls": { "result": false, "justification": "Zero Playwright events" },
    "has_cross_session_refs": null,
    "has_skill_gap_signal": null,
    "has_unauthorized_edits": null,
    "is_compaction_resume": { "result": true, "justification": "3 compactions detected" },
    "is_cwd_incidental": null
  },

  "observations": {
    "frustration_analysis": "prose or null (gated by has_frustration_signals)",
    "phase_breakdown": "prose or null (gated by is_multi_phase)",
    "session_chain": "prose or null (gated by has_cross_session_refs)",
    "cwd_mismatch": "prose or null (gated by is_cwd_incidental)",
    "skill_gap": "prose or null (gated by has_skill_gap_signal)"
  },

  "analysis": {
    "wave": "W4-15",
    "findings_file": "findings-w4-15-signal-studio-build.md",
    "analysed_at": "ISO8601"
  },

  "registry_type": "BUILD",
  "proposed_subtypes": ["debug.e2e_campaign"],
  "skills_invoked": ["/ralphy", "/loop"],
  "disposition": "active|junk|revisit",
  "interest_level": "high|medium|low",
  "notes": "short summary — structured data goes in classifiers/predicates, not here"
}
```

**v2 field notes**:

- `shape` — raw measurements from the session JSONL. Agents must populate all fields they can extract.
- `tools` — raw tool call counts. Agents must count every tool type. These are the basis for derived classifiers like `tool_profile`.
- `classifiers` — structured interpretations from defined prompts. See `learnings/analysis-lenses.md` for the prompt catalog (7 classifiers: C01-C07).
- `predicates` — binary yes/no gates with justification. See `learnings/analysis-lenses.md` (10 predicates: P01-P10). Set to `null` if not assessable from available data.
- `observations` — prose analysis gated by predicates. Only populate when the gating predicate is `true`. See `learnings/analysis-lenses.md` (5 observations: O01-O05).
- `analysis` — traceability back to the wave and findings file that produced this entry.
- `registry_type` — what AngelEye auto-classified (preserved for comparison).
- `notes` — short summary only. Structured interpretations belong in classifiers/predicates/observations, not in free text.

### Migration process

When upgrading schema:

1. Discuss new shape with human — agree on fields before writing anything
2. Create `~/dev/ad/brains/angeleye/analysis/migrations/` folder
3. Write `migrate-v{old}-to-v{new}.py` — reads old JSONL, writes new JSONL
4. Run migration: `python3 migrate-v1-to-v2.py`
5. Verify output, replace old file, continue
6. Update this AGENTS.md with new schema documentation

## Analysis Process Per Session

### Step 1 — Quick scan (30 seconds)

Read the registry entry. Note: project, session_type, tool_pattern, first_real_prompt, file size.
Decide: skip (junk), process (worth analysing), or flag (unusual, needs human review).

### Step 2 — Read JSONL

Use the `Read` tool with `offset` and `limit` parameters to read in segments. Never attempt to read an entire large file at once. Never use the abridge/summarisation skill — always read the actual data.

| File size | Strategy                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| < 50KB    | Read the whole file                                                                                                           |
| 50–200KB  | First 200 lines, last 100 lines, sample 50 lines from middle                                                                  |
| 200KB–1MB | First 150 lines, last 80 lines, 2-3 middle samples of 50 lines each                                                           |
| > 1MB     | First 150 lines, last 80 lines, 5 middle samples of 30 lines each (evenly spaced). Note in findings that coverage is partial. |

Skip `progress` events when reading — they are the most numerous type (~75% in hook-heavy sessions) and carry no analytical value. Focus on `user_prompt`, `tool_use`, `stop`, `session_start`, `session_end`, `subagent_start`, `subagent_stop` events.

### Step 3 — Classify

Using the conversation analysis framework as reference (NOT as rigid structure):

- Verify or correct the session_type
- Assign subtype if possible
- Note conversation role (primary/advisory) if detectable
- Identify content types in key exchanges
- Flag any new types/subtypes not in the existing taxonomy

### Step 4 — Extract patterns

For each session, capture:

- Prompt patterns (how did the user open? voice? paste? handover?)
- Anti-patterns (corrections, drift, repeated instructions)
- Phase boundaries (where did the session naturally break?)
- Cross-session references (does this session reference another?)
- Skill invocations and effectiveness
- Anything surprising or novel

### Step 5 — Run analysis lenses

For each session, evaluate the classifiers and predicates defined in `learnings/analysis-lenses.md`:

- Run all 7 classifiers (C01-C07) and record structured outputs
- Run all 10 predicates (P01-P10) and record `{result, justification}`
- For any predicate that returns `true`, run the gated observation (O01-O05)

### Step 6 — Update index and notes

- Append v2 entry to `session-index.jsonl` with all shape, tools, classifiers, predicates, and observations populated
- Add observations to `findings-wave-N.md`
- If a pattern appears 3+ times across the wave, start a dedicated topic file

## Reference Material

### Existing framework (seed, not constraint)

- `~/dev/ad/brains/angeleye/conversation-analysis-framework.md` — 6 session types, 21 subtypes, 10 content types, composite classifier rules
- `~/dev/ad/brains/angeleye/analysis-methodology.md` — two-pass process, concept coverage, gaps
- `~/dev/ad/brains/angeleye/data-concepts.md` — session, workspace, thread definitions
- `~/dev/ad/brains/angeleye/ambient-intelligence.md` — pattern mining, ambient signals

### Previous empirical work

- `~/dev/ad/apps/angeleye/docs/intelligence/research/100-session-analysis.md` — the 100-session study that produced the current taxonomy

## Quality Gates

Before marking a work unit complete:

- [ ] Session index entry written with all fields populated
- [ ] Session type verified (not just accepted from registry)
- [ ] At least 2 observations captured per session (findings file)
- [ ] Any new semantic types flagged explicitly
- [ ] Schema review checkpoint noted if this is entry 5-6

## Anti-Patterns to Avoid

- **Don't force-fit**: If a session doesn't match existing types, say so. New types are the goal.
- **Don't skip junk reflexively**: A session marked junk might reveal why sessions become junk — that's a pattern too.
- **Don't over-read large files**: Use the chunked approach (first 100, last 50, sample middle). Context window is finite.
- **Don't write to the existing conversation-analysis-framework.md**: Write to the analysis/ folder. Curation into framework docs happens later, with human review.
- **Don't assume BUILD is correct**: 85% of sessions are classified BUILD — investigate whether the classifier is too broad.
- **Don't treat the schema as fixed**: If you're fighting the schema to express what you found, that's the signal to propose an upgrade — not to force data into the wrong shape.
- **Don't change the schema silently**: Always flag to human, design together, write migration script, run once.

## Wave Types

Not all waves are the same. The coordinator should identify which type each wave is:

- **Forward wave**: Processing new, unprocessed sessions. The normal mode.
- **Backward wave**: Re-processing previously analysed sessions through a new lens discovered in a prior wave. Triggered when a new concept/type/pattern is significant enough to warrant checking older sessions.
- **Calibration wave**: Small batch (5-8) to test a new approach, schema change, or lens before scaling up.
- **Schema upgrade wave**: No session processing — just migration. Design new schema, write migration script, run it, verify, continue.

## Learnings

(Updated by coordinator as waves complete)

### Wave 1a (2026-03-22)

- **BUILD is massively over-classified**: 3/4 sessions reclassified. Root causes: Bash read/write blindness, project_dir ignored, Edit count without intent context.
- **Standardise session_type_analysed format**: Use lowercase dot notation (`orientation.cold_start`, not `ORIENTATION / cold_start`). Use underscores not hyphens.
- **New subtypes proposed** (tentative, need more examples): `orientation.bookend`, `orientation.artifact_retrieval`, `orientation.morning_triage`, `test.uat_debug_hybrid`.
- **Voice transcription is pervasive**: All 8 sessions showed voice-transcribed prompts. Assume voice-first for this user.
- **Closing ceremonies**: Three variants observed — memory write, context capture, abrupt abandonment. Capture which type if present.

### Wave 1b (2026-03-22)

- **BUILD misclassification rate: 86%** (6/7 BUILD sessions were wrong across wave 1). Only signal-studio migration was genuinely BUILD.
- **Advisory role validated**: W1-03 is a clear advisory session — user pastes other sessions' output for review. The Conversation Role angle from the framework is real and detectable.
- **New subtypes**: `knowledge.methodology_design`, `knowledge.advisory`, `build.migration`, `research.workflow_design`.
- **Skill invocations as type signals**: `/bmad-oversight` → advisory, `/ralphy` → BUILD, `/focus`+`/radar` → morning triage, `/capture-context` → closing ceremony.
- **File size is noise**: 504KB session had only 269 events. Size driven by subagent MCP report blobs, not session complexity.
- **Session pivot pattern**: W1-04 started ORIENTATION then pivoted to RESEARCH after 93-min gap. Conscious, intentional pivot.

### Wave 2 (2026-03-22)

- **BUILD misclassification is project-type dependent**: Product repos (flihub, angeleye, flideck) → BUILD usually correct (88%). Brains repos → always wrong (0%). Skill-invocation sessions → mostly wrong (20%). A project_dir guard would fix ~60% of errors.
- **Ralphy mode detection works**: `/ralphy` + Agent/Task calls + IMPLEMENTATION_PLAN.md access = `build.campaign`. 6 confirmed instances. Ralphy has 3 modes — only Build is BUILD.
- **Brain subfolder matters**: Detect which brain (bmad-method, cole-medin, agentic-os, ansible), not just "brains". project_dir=brains alone is unreliable (W2-09 false positive).
- **Specific skill name > generic skill signal**: `/bmad-create-prd` → KNOWLEDGE, `/rename-images` → OPERATIONS, `/flivideo:dev` → BUILD. The specific skill predicts type better than "skill in first 5 events".
- **New parent type proposed: PLANNING**: W2-19 is a pure planning repo session that doesn't fit existing types. Decision writeback to planning documents is the primary deliverable.
- **21 subtype candidates accumulated**: Strongest: `build.campaign` (6), `orientation.cold_start` (2), `build.migration` (2), `knowledge.advisory` (2), `knowledge.brain_update` (2). See `learnings/subtype-candidates.md`.
- **Playwright visual QA is a recurring pattern**: W2-17, W2-18, W2-20 all use edit→serve→screenshot→verify loops. Playwright doesn't always mean TEST — it's also a BUILD verification tool.
- **/loop runaway is a failure mode**: W2-16 ran `/loop` for 10h producing 6MB of junk. Detect via: >90% stop events with identical prompt patterns.
- **Context exhaustion is common in long sessions**: W2-07 (9x), W2-20 (4x), W2-17 (3x). Sessions survive via structured compaction summaries. Context exhaustion count correlates with session complexity.

### Wave 3 (2026-03-22)

- **TEST subtypes have real variety**: 3 distinct UAT subtypes found (uat_with_inline_debug, uat_playwright_sequential, uat_narrative). All share Playwright-heavy patterns but differ in workflow structure and human involvement.
- **RESEARCH is 100% correct at parent level**: All 3 RESEARCH sessions confirmed. Three distinct subtypes: operational, knowledge_capture, dev_env_troubleshooting.
- **CWD is unreliable for project attribution (confirmed 4x)**: File-touch paths are the reliable signal, not CWD. W3-05, W3-07, W3-16 all show false project attribution from CWD alone.
- **5 new parent types proposed**: SKILL (W3-04, W3-10, W3-11), SETUP (W3-15), META (W3-16), REVIEW (W3-20), PLANNING (W2-19).
- **Compaction flush sessions need early detection**: Detect "Pre-compaction memory flush" in first user_prompt and short-circuit to meta.compaction_flush.
- **Cross-paste injection is a classifier risk**: Pasted transcripts (100KB+) from unrelated sessions pollute keyword-based classification. Rely on tool file paths, not prompt text.
- **Discovery rate NOT declining**: Wave 3 produced 16 new subtypes from 20 sessions (0.8/session).

### Wave 4 (2026-03-22)

- **ORIENTATION dominated by artifact_retrieval (5/8)**: Short read-only sessions retrieving prior context. cold_start (1), bookend (1), requirements (1) are rarer.
- **KNOWLEDGE subtypes are highly diverse**: 5 sessions yielded 5 different subtypes. Two were false positives (brand copywriting, personal shopping advisory).
- **signal-studio BUILD: 1/3 correct, 1/3 wrong, 1/3 mixed**: Feature code written is the discriminator. Zero new routes/components = not BUILD.
- **Home-dir and monorepo-root sessions are never BUILD**: project_dir=/Users/<user> or monorepo root should default SYSOPS/RESEARCH.
- **Zero tool calls = not BUILD**: W4-17 had zero tool calls. Any session with no tool calls should never classify BUILD.
- **Playwright semantics depend on context**: In brains session = external research. High volume (>20%) in product session = UI_REVIEW. In TEST session = UAT.
- **Write+Bash(open) = delivery pattern**: In brains sessions, Write followed by Bash `open` is file delivery to Finder, not code execution.
- **Empty brain search = knowledge gap, not KNOWLEDGE**: Sessions that search brain and find nothing are discovering gaps, not consuming knowledge.
- **ToolSearch clusters early = skill-gap signal**: 3+ ToolSearch calls before first real work = user expected a skill that doesn't exist.
- **Multi-phase sessions need multi-label classification**: W4-16 had 3 distinct phases (BUILD → UI_REVIEW → DESIGN_EXPLORATION). Single labels lose information.
- **52 subtypes accumulated across 12+ parent types from 68 sessions**: See `learnings/subtype-candidates.md`.

### Wave 5 (2026-03-22)

- **Micro sessions split 3 ways**: 6/9 genuine (orientation/research/utility), 2/9 junk (smoke test, accidental), 1/9 machine-initiated (heartbeat). Not uniformly disposable.
- **POEM executor (`*run`/`*execute`) = OPERATIONS, not BUILD**: Automated workflow execution where human observes. Design→test→retest→postmortem chains detectable across session chains.
- **prompt.supportsignal CWD is universally unreliable**: All 8 sessions showed work spanning 4+ repos. CWD is a "home terminal", not project attribution.
- **BRAND type confirmed**: brand.design_exploration (Mochaccino prototyping) and brand.brand_knowledge_capture (Joy Juice brand assets). Neither fits existing types.
- **Oddball CWD rules established**: home_dir→SYSOPS/OPERATIONS, monorepo_root→ORIENTATION/RESEARCH, dev_parent→SYSOPS/OPERATIONS, tmp→junk, worktrees→CWD always incidental. See `learnings/wave-5-learnings.md` for full rules table.
- **"unknown" project labels are bad CWD mappings**: Registry failed to extract project from valid CWD paths. Fix the registry, not the classifier.
- **Machine-initiated sessions need separate handling**: HEARTBEAT (10K char prompt from Dynamous) should be meta.automated_heartbeat, excluded from human session stats.
- **Voice dictation artifacts as classifier signals**: "AI-gentive"=AIgentive, "director"="directory", "mimi"="mini", "focu"="/focus". Pervasive across ALL session types.
- **Pre-computed shapes dramatically improved agent quality**: No more manual counting inconsistencies. compute-session-shape.py is now standard.
- **Classifier key format must be explicit**: Agents used two different key formats (C01_session_type vs session_type). AGENTS.md schema example must show exact key names.
- **~80 subtypes accumulated across 15 parent types from 108 sessions**: Discovery rate 0.5/session in wave 5 (down from 0.8 in wave 3 but still productive).

### Wave 6 (2026-03-22)

- **BUILD accuracy 17.5% (14/80)**: Scales with session complexity — micro 0%, light 12%, moderate 45%, heavy 70%. Micro/light sessions are almost never BUILD.
- **app.supportsignal is NOT a universal BUILD signal**: Only ~40% are genuine BUILD. Others are PLANNING, KNOWLEDGE, REVIEW. Classifier needs planning-vs-building discriminator for product repos.
- **Multi-phase sessions dominate at moderate+ scale**: 75%+ of moderate sessions have clear phase transitions. Heavy sessions are 100% substantive (zero junk).
- **Concurrent session pair discovered**: Two sessions overlapping with cross-window feedback sharing. First confirmed pair — implications for session chain analysis.
- **PII detected in JSONL**: Full names, birthdays, emails, IPs in session data. AngelEye needs PII detection.
- **Port-kill sessions are recurring micro pattern**: EADDRINUSE on signal-studio ports — automation candidate.
- **9 parallel agents, zero conflicts**: Append-only index, size-based batching gave even workloads, all agents finished within 5-minute window.
- **Discovery rate declining**: 0.44 subtypes/session (down from 0.5). ~115 subtypes across 15 parent types from 188 sessions. Next waves should focus on consolidation.

### Wave 7 (2026-03-22)

- **BUILD accuracy ~22% (18/80)**: Consistent with wave 6. Pattern confirmed: accuracy scales with session complexity (micro 0%, heavy/marathon 50-70%).
- **Broader project diversity was productive**: 30+ projects (up from ~8) exposed ~40 new subtypes (0.50/session — rebounded from 0.44). New projects = new patterns.
- **`/tmp` CWD is always incidental**: New rule — `/private/tmp/*` staging directories never indicate real project attribution.
- **task-notification prompts inflate user_prompt counts**: `<task-notification>` XML callbacks from subagents are counted as user_prompt events. compute-session-shape.py should filter these.
- **"Raffi" = "Ralphy" voice artifact**: New voice dictation entry for the catalog.
- **Context handover paste as opener**: 5K-9K `/capture-context` output pasted as first prompt = BUILD/PLANNING continuation signal.
- **Worktree abandonment pattern**: build.campaign with significant investment (11+ subagents) discarded after idle gap. New failure mode.
- **Playwright has 3 confirmed semantic roles**: ui_audit, external_research, documentation_verification.
- **Second concurrent session pair**: angeleye + wave10 touching same file simultaneously → git confusion.
- **OMI transcript ingestion workflow**: Raw OMI device transcript → background Agent → structured docs. New automation pipeline.
- **Corrective followup session chain**: User returns to fix Claude's prior mistake. Frustration + destructive cleanup = new session_chain type.
- **Micro bucket exhausted**: All 5 remaining micro sessions consumed. Wave 8 will have 0 micro sessions.
- **~155 subtypes across 15+ parent types from 268 sessions**.

### Wave 8 (2026-03-23)

- **BUILD accuracy ~25% (20/79)**: Consistent with waves 6-7. Accuracy scales with session complexity.
- **Friction predicates P13-P16 validated**: P15 (buggy_output) most common (9/79), P13 (misunderstood_request) 8/79, P14 (wrong_approach) 7/79, P16 (excessive_changes) 2/79. All four add signal beyond binary P02. Promote to permanent predicate set.
- **P13-P14 co-occurrence in handover sessions**: Literal instructions followed but broader context missed — distinct failure mode from buggy code.
- **"Context poisoning" anti-pattern**: Stale/aspirational docs mislead Claude into building to docs rather than code. Named by user.
- **Plan-paste-then-execute workflow**: 5K-86KB context pastes as session openers. Deviation from explicit plan causes severe frustration.
- **Bidirectional confusion pattern**: Both user and Claude co-create a misunderstanding. Harder to detect than unilateral P13.
- **Playwright semantic role #5**: web_scraping_for_knowledge (produces durable brain artifacts, distinct from external_research).
- **4+ concurrent session pairs confirmed**: Automation candidate for AngelEye conflict detection.
- **Record extremes**: 21-day idle gap (longest), 86KB context paste (largest), live stakeholder session.
- **New voice artifacts**: "Ralph William"=Ralphy, "stask"=stack, plus 5 more.
- **Discovery rate 0.70/session**: ~55 new subtypes from 79 sessions. Not declining at 347 sessions deep.
- **~210+ subtypes across 15+ parent types from 347 sessions**.

### Wave 9 (2026-03-23)

- **BUILD accuracy ~11% (9/79)**: Significantly lower than waves 6-8 (~20-25%). This wave is 49% micro, 44% light — micro sessions are almost never BUILD. Pattern now clear: micro 0-5%, light 10-15%, moderate 30-40%, heavy 50%+, marathon 60-70%.
- **Micro sessions have distinct taxonomies**: orientation/artifact_retrieval (most common), meta/smoke_test, meta/accidental, research/quick_answer, sysops/secret_management, orientation/memory_probe.
- **"Home terminal" CWD patterns**: brains/ used as home terminal for quick Q&A unrelated to brain content (N=10+). CWD incidental rate ~60% across micro/light sessions.
- **Playwright semantic role #6**: design_extraction — systematic crawl of own production app for reusable UI patterns. Now 6 confirmed roles.
- **Product-owner workflow detected**: Backlog management, developer handovers, agent report review — zero code edits but classified BUILD. Should be PLANNING or REVIEW.
- **Claude as in-meeting assistant**: Voice-querying Claude during live calls for quick lookups. 1-2 prompt sessions.
- **"Vent sessions" confirmed**: Voice dictation lowers barrier to accidental emotional sessions. Zero tool calls, should be META/junk.
- **AngelEye birth session found**: Session e154b011 is the @appystack scaffold that created this project.
- **Cross-session commit pattern confirmed**: Paste prior session's change summary → verify → commit = OPERATIONS, not BUILD. 3+ instances across waves 8-9.
- **CLAUDE.md auto-load anti-pattern**: CLAUDE.md context triggers 12+ searches for wrong sprint/epic before user speaks. Token waste.
- **Micro sessions need different quality gates**: "All assessable predicates evaluated" rather than "N observations produced."
- **Discovery rate 0.51/session**: ~40 new subtypes. Declining from 0.70 (wave 8) but still productive.
- **9 parallel agents, zero conflicts**: 426 entries, 0 duplicates. Still bulletproof.
- **~250+ subtypes across 18+ parent types from 426 sessions**.

### Wave 10 (2026-03-23)

- **BUILD accuracy ~43% aggregate**: Sharp increase from waves 8-9 (11-25%) — this batch was 95% moderate + 5% heavy. Per-agent range 12.5%-86%. Accuracy-by-scale curve now well-established.
- **P13 (misunderstood_request) dominant at moderate scale**: Fired in ~30% of sessions. Common variant: "depth mismatch" — Claude goes shallower than intended. P13+P14 co-occurrence = highest frustration.
- **100% multi-phase rate**: Every moderate/heavy session had clear phase transitions. Single-phase is a micro/light phenomenon.
- **"Naming-constrains-cognition" anti-pattern**: Claude named a file "two-approaches.md" then couldn't see a third approach. Filename as cognitive anchor — novel failure mode.
- **Proxy interaction pattern**: Claude mediating in live meeting between user and remote operator. Explanatory output caused friction; paste-ready commands needed.
- **brains/ CWD reliability flips at moderate scale**: Micro = incidental (home terminal), moderate+ = primary (actual brain work).
- **Playwright semantic role #7 proposed**: feature_discovery_audit — UI observation during product owner feature gathering.
- **AngelEye naming genesis found**: Session b95a97be traces NanoBanano → AngelicEye → AngelEye.
- **Cross-session handover failure anti-pattern**: Claude omits documentation for new concepts in handovers.
- **Extreme autonomy ratio**: 2 prompts → 81 tool calls (1:40) via /bmad-dev skill. Highest observed.
- **Brain management subtype family**: brain_maintenance, brain_architecture, brain_creation, brain_audit_and_design form a coherent cluster.
- **campaign-status.py worked first time**: Automated batch selection replaced ad-hoc ID files. No manual curation needed.
- **Discovery rate 0.75/session**: ~60 new subtypes. Rebounded from 0.51 (wave 9) — moderate sessions are richer. Not taxonomy saturation.
- **PII incidents**: Passport/DOB via voice dictation, credential exposure in infra sessions. PII detection still needed.
- **20+ new voice artifacts**: "Verso"=Vercel, "Bart"=Claude, "angel hands"=AngelEye, "Cold Med"=Cole Medin, and more.
- **~310+ subtypes across 20+ parent types from 506 sessions**.

### Wave 11 (2026-03-23)

- **BUILD accuracy ~12% (8-10/81)**: Sharp drop from wave 10's 43% — this batch was entirely light/micro/trivial. Accuracy-by-scale curve now conclusive across 11 waves.
- **Three classifier rules ready to ship**: (1) `*run NNN` as first prompt = `operations.poem_execution` (7/9 agents confirm), (2) brains/ CWD + light scale = never BUILD, (3) prompt:tool ratio >0.5:1 = not BUILD.
- **POEM executor is dominant operations pattern**: `*run NNN` + Task/TaskOutput parallel workers. Autonomy ratios up to 1:64. Zero Edit calls. Confirmed by 7/9 agents.
- **Playwright semantic roles now 8-9**: New `product_onboarding` (user learns third-party product, zero test assertions) and `visual_comparison` (screenshot comparison between systems).
- **CLAUDE.md auto-load anti-pattern worsening**: 13 unauthorized pre-prompt tool calls in W11-07 (worst ever). 38 tool calls including 11 Edits before user speaks in W11-01. Needs dedicated hook or mitigation.
- **P13+P14 co-occurrence is dominant friction pattern**: ~14 P13 and ~12 P14 firings. Always co-occur. P16 (excessive_changes) had zero firings — may only apply at moderate+ scale.
- **"Context poisoning" named by user**: Stale/aspirational memory misleads Claude. Distinct from P13.
- **Provenance chain genesis**: Session ce158a14 — user articulates canonical truth vs derived document distinction. Origin of provenance methodology.
- **New parent type: DEBUG.process_correction**: Debugging Claude's process, not code. NotebookLM skill not loading caused convention violations.
- **Form-filling copilot pattern**: Claude reads form screenshots field-by-field in real time. Self-correcting brain (discovered own brain had wrong info, searched web, corrected).
- **Race condition in parallel agents**: 2 agents edited same file simultaneously; agent introduced `\!` syntax bug in 3 places.
- **PII correlates with brain path**: `davidcruwys/` or `dtv/` brain paths should trigger PII scrub flag. 4 incidents across 81 sessions (4.9%).
- **52-hour idle gaps are valid continuations**: Multi-phase detection should not split on idle duration alone.
- **Discovery rate 0.80/session**: ~55 new subtypes. Rebounded again — light sessions still productive.
- **80-90 new voice artifacts**: Highest single-wave count. Catalog becoming large enough for automated correction detection.
- **~360+ subtypes across 22+ parent types from 586 sessions**.

### Wave 12 (2026-03-23)

- **BUILD accuracy 2.5% (2/80)**: Lowest ever. 7 of 9 agents at 0%. This batch was 100% light scale, mostly brains/ CWD. BUILD classifier is useless at this scale.
- **Voice dictation causes P13**: "codecs" for "codex" and "E-cam" for "Ecamm" directly caused misunderstandings. Pronunciation-aware entity dictionary would reduce P13.
- **CLAUDE.md auto-load at extreme severity**: 32:1 tool-to-prompt ratio in W12-01 (32 unauthorized tool calls before single "commit this" prompt). P16 fires exclusively from this cause.
- **"Context available but ignored" failure mode**: Claude gave wrong TDAC advice despite correct answer in own brain file. Distinct from P13.
- **ChatGPT-to-Claude knowledge bridge**: Novel cross-platform capture pattern — user pasted ChatGPT transcript into Claude for brain storage.
- **Skill self-documentation gap**: User asked loaded Ralphy what it can do, Claude searched filesystem instead of using skill's self-knowledge.
- **Playwright role: media_access**: Loom video navigation for documentation. Now 9-10 confirmed roles.
- **PII rate highest ever**: 15% of sessions (12/80). 3 live API keys in one session. Medical PII, business ABN/ACN.
- **Cross-session correction pattern**: 3 sessions returning to fix prior session failures — error-correction, not continuation.
- **Discovery rate 0.63/session**: ~50 new subtypes. Declining as expected for lighter sessions.
- **~400+ subtypes across 22+ parent types from 666 sessions**.

### Wave 13 (2026-03-23) — FINAL WAVE

- **BUILD accuracy 0% across 133 sessions**: Not a single correct BUILD at micro/trivial scale. Definitive: micro 0%, light 0-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%.
- **KNOWLEDGE accuracy ~33% at micro scale**: Registry defaults brains/ CWD to KNOWLEDGE, but most micro sessions are RESEARCH or ORIENTATION. True KNOWLEDGE requires brain file writes.
- **Ghost session clusters**: 7 sessions with exactly 2 events (start+end), zero prompts, spawned within 3 seconds. New subtype: `meta.ghost_session`.
- **Agent warmup probes**: Simultaneous warmup-and-die subagent sessions. New subtype: `meta.agent_warmup`.
- **Coordinator-spawned checklist spray**: User dispatches numbered questions to N micro sessions from a single mental list. Detectable via timestamp clustering + numbered prefix.
- **CWD incidental 40-100% at micro scale**: brains/ is a "home terminal". CWD only reliable when prompt topic matches CWD content.
- **Phantom duration**: `duration_minutes` misleading for idle sessions (413 min wall clock, 0 active). Use `active_minutes` as true signal.
- **task-notification inflation confirmed**: Machine-generated XML callbacks inflate `user_prompt` counts. Not human intent.
- **Junk rate 28%**: 37/133 sessions were non-human (ghost, accidental, warmup). Filter before aggregates.
- **Cross-platform bridge confirmed (second instance)**: 9.1KB ChatGPT-to-Claude paste.
- **Discovery rate 0.32/session**: Lowest ever — trivial tail as expected. Taxonomy approaching saturation.
- **800/800 M4 Mini sessions processed. 0 duplicates across 13 waves.**
- **~440+ subtypes across 22+ parent types from 800 sessions**.

### M4 Pro Phase (Wave 14+)

**Machine**: M4 Pro, accessed via `ssh macbook-pro-m4` (Tailscale).
**Session files**: `ssh macbook-pro-m4 "cat ~/.claude/angeleye/sessions/session-{id}.jsonl"`
**Registry**: `ssh macbook-pro-m4 "cat ~/.claude/angeleye/registry.json"`

**Key difference from M4 Mini**: M4 Pro has projects not seen on M4 Mini — joy-juice (15), appydave.com (9), beauty-and-joy (6), flideck (6), davidcruwys (6). These may produce new subtypes and patterns.

**Agents must**: use pre-computed shapes from `scripts/precomputed/w14-NN.json` (already contains full session shape data fetched via SSH). Agents do NOT need SSH access — all data is in the shape files. For sessions needing deeper analysis, the shape file includes `first_real_prompt`, `bash_commands_sample`, `file_paths`, and `detections`.

**Important**: set `"machine": "m4-pro"` in all session-index.jsonl entries for M4 Pro sessions.

### Wave 14 (2026-03-23) — M4 Pro complete

- **Registry BUILD accuracy 17-33% on M4 Pro**: Root cause — registry defaults to BUILD for everything. Classifier lacks discrimination for SYSOPS, RESEARCH, MIXED, ORIENTATION, META, BRAND, DEBUG. Zero writes/edits/tools = never BUILD.
- **M4 Pro machine character**: Evening mega-sprints, multi-topic marathons, voice dictation 7-9/12 sessions. Hub for 5-machine fleet. More personal integration (Joy Juice business, Thai visa, meetups).
- **Paperclip/JJ Agent is production autonomous**: UUID `27231022-d305-4069-a16a-472c98259e33`. Prompt fingerprint: "You are agent 27231022... Continue your Paperclip work." 4 subtypes: marathon (952 events), work bursts, hourly polling (21 identical prompts), micro pings. Correct classification: `operations.paperclip_agent` for automated, `build.autonomous_agent_work` only when writes occur.
- **CWD=brains/ most unreliable signal in entire dataset**: Majority of brains/ CWD sessions doing something else entirely (Ansible, SSH, alias gen, support tickets). Treat as nearly meaningless for project attribution.
- **New projects discovered**: joy-juice (15, Thai juice bar), appydave.com (9, website prototyping), beauty-and-joy (6, Joy's brand), voice-agent (Rust, fn key processor), flideck (6, Ralphy campaign + Playwright QA).
- **Command center pattern**: Single session dispatching 9 parallel background agents (93fe2159). 95K char first prompt (compaction resume). Orchestration-at-scale, not BUILD.
- **"Agents in the Wild" meetup**: Recurring Friday event. `knowledge.meetup_capture` subtype (N=2).
- **Unauthorized edit anti-pattern confirmed**: "why did you update something, I asked a question" — real-world P16 occurrence.
- **Skill gap discovery**: Adapt, Animate, Polish skill names don't exist. Only `frontend-design` and `impeccable` valid. Need skill inventory mechanism.
- **~60+ new subtypes proposed**: operations.paperclip_agent, operations.scheduled_agent, operations.agent_ping, build.autonomous_agent_work, build.ralphy_campaign, build.prototype, knowledge.meetup_capture, sysops.remote_provisioning, sysops.fleet_management, research.tool_evaluation, brand.design_review, and more.
- **Voice dictation artifacts (~20 new)**: "nvideo nemoclaw"=NVIDIA NemoClaw, "papwerclip"=Paperclip, "AngelLie"=AngelEye, "Tailwindow"=Tailwind, "angents"=agents, "fetsch"/"fetsh"=fetch.
- **Discovery rate 0.55/session**: Rebounded from 0.32 (wave 13). New machine = new projects = new patterns. Confirms taxonomy saturation was scale effect, not true exhaustion.
- **910/910 sessions processed across 14 waves. 0 duplicates. ~500+ subtypes across 24+ parent types.**
