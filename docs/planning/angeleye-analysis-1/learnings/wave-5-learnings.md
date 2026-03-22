# Wave 5 Learnings

**Date**: 2026-03-22
**Sessions analysed**: 40 (108 total)
**Discovery rate**: ~0.5 new subtypes/session (20 new subtypes from 40 sessions)

## Application Learnings

### 1. Micro sessions are NOT uniformly junk

Of 9 micro sessions (1-4 events): 6 serve genuine purposes (orientation, research, utility), 2 are junk (smoke test, accidental launch), 1 is machine-initiated (heartbeat). Micro sessions reveal what users are about to work on and where knowledge gaps exist.

**New subtypes from micro**: smoke_test, automated_heartbeat, accidental_launch, quick_utility, project_inventory_query, startup_command_lookup, conceptual_learning, asset_search

### 2. POEM executor sessions (`*run`/`*execute`) are OPERATIONS, not BUILD

The `*run 106` and `*execute 105` patterns are POEM workflow executions — the user triggers an automated multi-step workflow that spawns subagent Tasks. The human mostly observes, intervening only when bugs appear. These are OPERATIONS.poem_execution, not BUILD.

**Session chain discovered**: B10 → B08 → B07 → B09 form a design → test → re-test → post-mortem cycle across 2 days.

### 3. prompt.supportsignal CWD is universally unreliable

All 8 substantive prompt.supportsignal sessions showed CWD as the "home terminal" but actual work spanning 4+ repos (AWB, POEM OS, v-appydave, signal-studio). Project attribution is always incidental or unreliable.

### 4. BRAND type confirmed with 2 subtypes

- `brand.design_exploration`: Mochaccino-driven rapid prototyping with parallel subagents (appydave.com)
- `brand.brand_knowledge_capture`: Brand asset creation for physical business — menus, pricing, branding schemas (beauty-and-joy)
  Neither fits BUILD, KNOWLEDGE, or RESEARCH. BRAND is the correct parent type.

### 5. Structural oddball classification rules

| CWD                                | Pattern                 | Type                     |
| ---------------------------------- | ----------------------- | ------------------------ |
| Home dir + external drive paths    | SYSOPS                  | drive_maintenance        |
| Home dir + ~/.claude/ edits        | OPERATIONS              | tool_configuration       |
| Monorepo root + WebSearch only     | RESEARCH                | hardware_research        |
| Monorepo root + dir exploration    | ORIENTATION             | project_inventory        |
| dev parent + git config            | SYSOPS                  | git_configuration        |
| dev parent + ssh/rsync             | OPERATIONS              | cross_machine_sync       |
| tmp + micro                        | META                    | accidental_launch (junk) |
| worktrees + file touches elsewhere | REVIEW (or actual type) | CWD is always incidental |

### 6. "unknown" project labels are usually wrong CWD mappings

D05 and D06 were labelled "unknown" but actually had valid CWD paths (angeleye). The registry's project-label inference failed, not the session classification.

### 7. Brains sessions split into distinct KNOWLEDGE subtypes

- brain_curation: Process doc writing (brain-librarian-checklist)
- architecture_planning: Voice-dictated vertical slice design (agentic-os)
- brain_synthesis: Web research → brain file authoring (kie-ai)
- til_entry: Quick today-I-learned note

### 8. Full lifecycle BUILD sessions exist

W5-C05 (ThumbRack) shows a complete lifecycle: business analysis → naming → AppyStack scaffold → Ralphy plan+build → Playwright UAT. This is `build.full_lifecycle_build` — a new subtype that captures the complete arc.

### 9. Voice dictation artifacts as classifier signals

"AI-gentive" = AIgentive, "director" = "directory", "mimi" = "mini", "focu" = "/focus". Voice dictation is pervasive across ALL session types, not just orientation. These artifacts are detectable patterns.

### 10. Machine-initiated sessions need separate handling

The HEARTBEAT session (1d35b92b) is machine-generated — the prompt is 10K chars of structured email/calendar/Asana/Slack data from Dynamous automation. These should be tagged `meta.automated_heartbeat` and excluded from human session statistics.

## Loop Meta-Learnings

### 1. Pre-computed shapes dramatically improved agent quality

Agents with shape data produced precise tool counts and timing — no more inconsistencies from manual counting. The compute-session-shape.py script should be standard for all future waves.

### 2. Parallel agent batching at scale works

6 agents processing 40 sessions in parallel completed in ~5 minutes. No file conflicts on session-index.jsonl (append-only). Findings files per batch (not per session) reduce file clutter.

### 3. Classifier key format inconsistency

Micro and marathon agents used `C01_session_type` prefix format while other agents used `session_type`. Needed post-hoc normalization. Future AGENTS.md should include an explicit key format example.

### 4. Coverage is the bottleneck, not depth

With 108 sessions classified, diminishing returns haven't hit yet — 20 new subtypes in 40 sessions (0.5/session). The next wave should continue expanding coverage to new projects and tool patterns.

## Subtype Additions (Wave 5)

New subtypes proposed:

- `meta.smoke_test` — "What is 2+2?" testing Claude itself
- `meta.automated_heartbeat` — machine-initiated monitoring
- `meta.accidental_launch` — single-char or empty prompt from temp
- `meta.self_referential` — AngelEye working on itself
- `orientation.quick_utility` — non-coding calculations
- `orientation.project_inventory_query` — "what projects do I have"
- `orientation.startup_command_lookup` — "how do I run this"
- `research.conceptual_learning` — learning about tools/concepts
- `research.asset_search` — quick file/content search
- `research.architecture_comparison` — comparing system architectures
- `research.hardware_research` — hardware release/purchase research
- `knowledge.architecture_planning` — voice-dictated system design
- `knowledge.til_entry` — quick today-I-learned note
- `knowledge.post_mortem_analysis` — analysing agent behavior across runs
- `operations.poem_execution` — `*run`/`*execute` POEM workflow
- `operations.tool_configuration` — Claude Code settings/permissions
- `operations.cross_machine_sync` — rsync/SSH between machines
- `operations.repo_setup` — creating new repos/directories
- `brand.design_exploration` — Mochaccino rapid prototyping
- `brand.brand_knowledge_capture` — brand asset creation
- `build.prompt_engineering` — prompt/classifier design work
- `build.full_lifecycle_build` — BA → scaffold → build → UAT complete arc
- `planning.brain_migration` — evaluating system alternatives
- `setup.settings_configuration` — Claude Code settings tweaks
- `debug.tool_install` — debugging tool installation
- `review.mock_data_review` — reviewing generated test data
- `sysops.drive_maintenance` — external drive cleanup
- `sysops.git_configuration` — global git config setup
