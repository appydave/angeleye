---
type: analysis
title: 'Findings W5 C03 AngelEye Marathon'
description: 'W5-C03 AngelEye marathon: 5h33m Ralphy-driven session analysis with 71 subagents, 1678 events, 1339 tool calls.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# W5-C03 Findings: AngelEye Marathon — Ralphy Campaign for Session Analysis

**Wave**: W5-C03
**Session ID**: `e868366b-bb95-48db-aece-bede7eb1c2d5`
**Date**: 2026-03-22
**Duration**: 332 minutes (5h 33m), 263 active minutes
**Events**: 1678 (1819 raw lines in JSONL)
**Tool calls**: 1339 (Bash 588, Read 354, Write 153, Agent 71, Glob 60, Edit 46, Grep 29, TaskUpdate 22, TaskCreate 11, ToolSearch 5)
**User prompts**: 99 (28 genuine, 71 task-notifications from subagents)
**Subagents spawned**: 71
**Compactions**: 3 (at ~13:01, ~14:18, ~15:38)
**Coverage**: Partial — first 150 lines, last 80 lines, all user prompts, all stop messages sampled. Progress events skipped.

## Summary

This is a meta-recursive marathon: AngelEye (the observability tool for Claude Code sessions) using Claude Code to analyse its own recorded sessions. David invoked `/ralphy` (a campaign orchestration skill) to systematically classify ~77 sessions across 5 waves of analysis, producing findings files, index entries, learnings documents, and a schema migration script.

The session is the **angeleye-analysis-1** campaign — the first large-scale systematic classification of David's Claude Code usage history. It produced 68 findings files, 68 index entries, 5 wave learnings documents, a skill inventory, a subtype candidate list, and a v1-to-v2 schema migration script.

## Phase Structure (5 distinct phases)

### Phase 1: Campaign Bootstrap (10:05–10:25, ~20 min)

- `/ralphy` invoked, Claude reads IMPLEMENTATION_PLAN.md, BACKLOG.md, STEERING.md, AGENTS.md
- David selects option "3" (the analysis campaign)
- Claude identifies 8 target sessions, checks registry, reads conversation-analysis-framework.md
- David says "go" — Wave 1a launches (4 parallel subagents for smaller sessions)

### Phase 2: Waves 1–2 with Interactive Refinement (10:25–13:01, ~155 min)

- Waves 1a (4 sessions) and 1b (4 sessions) complete with parallel Agent tool calls
- David asks clarifying questions: "What is a bookend pattern?", "What does cold start versus morning triage mean?"
- Key discovery: David pushes back on classification semantics — "What does registry mean?" — leading to a terminology explainer written to auto-memory
- David requests skill inventory scan before Wave 2 starts
- Wave 2 launches (20 sessions, 5 batches of 4–5 parallel agents)
- Learnings captured: wave-1a, wave-1b, wave-2
- **69-minute idle gap** between 10:50 and 12:00 (David away)
- First compaction at 13:01 after all 28 sessions (W1+W2) complete

### Phase 3: Waves 3–4 Autonomous Push (13:11–14:26, ~75 min)

- David: "Do we go on to the next wave?" then "lets do an extend"
- Wave 3 (20 sessions) runs with 9 batches of parallel agents
- David: "I want to extend to wave four. We're sitting at 67."
- Wave 4 (20 sessions) runs with 10+ batches of parallel agents
- Second compaction at 14:18
- Output: 40 more findings + indices, wave-3 and wave-4 learnings

### Phase 4: Schema Evolution Crisis (14:26–15:05, ~40 min)

- David asks about increasing throughput and discovering more patterns
- Claude reveals the schema has evolved since Wave 1 but wasn't backfilled
- **Frustration event**: David: "Why didn't you tell me this each time? Fucking hell! We were meant to be updating schemas as we go"
- Discussion of what was lost vs. recoverable
- David validates the current v2 schema, asks about session-level data
- Discussion of tool_profile labels ("bash heavy") — David questions whether labels should be stored vs. inferred
- David sends Claude to inspect prompts.supportsignal.com.au YAML workflow for predicate/classifier prompt patterns
- Decision: write a migration script (migrate-v1-to-v2.py), update AGENTS.md

### Phase 5: v2 Schema Design + Wave 5 Setup (15:05–15:45, ~40 min)

- Claude writes migration script and schema v2 definition
- Introduction of 7 classifiers (C01–C07), 10 predicates (P01–P10), gated observations
- David provides feedback on classifier design, asks about additional prompt types
- Wave 5 micro-session batch runs (9 micro sessions classified)
- Third compaction at 15:38
- Session ends mid-analysis (still processing W5 sessions)

## Key Observations

### Meta-Recursive Nature

This session is AngelEye's bootstrap moment — the observability system classifying the very sessions that informed its design. The tool profiles, subtypes, and predicates being defined here came from patterns discovered in the sessions being analysed. Each wave refined the schema, which was then applied to subsequent waves.

### Campaign Orchestration Pattern (Ralphy)

The `/ralphy` skill drove structured execution: read plan, select task, launch parallel agents, collect results, write learnings, repeat. This is a "build.campaign" pattern — not building code, but systematically producing knowledge artefacts through repeated agent delegation.

### Massive Subagent Fan-Out

71 subagents spawned across 14+ batches. Each batch ran 4–10 parallel agents, each analysing one session. The orchestrator (main session) managed task lifecycle via TaskCreate/TaskUpdate (11 creates, 22 updates). Agents were all "general-purpose" type except 2 "Explore" agents near the end.

### Schema Evolution Under Pressure

The session exposed a process failure: the analysis schema evolved from v1 (simple type/subtype) to v2 (7 classifiers + 10 predicates + gated observations) during the campaign, but early waves were not backfilled. David's frustration ("Fucking hell!") was the catalyst for formalising the migration script and making schema versioning explicit.

### Voice-Dictated Interactive Refinement

Many of David's prompts show voice-dictation artefacts (informal phrasing, run-on sentences, capitalisation quirks). This is a collaborative refinement pattern — David steers direction verbally while Claude executes the technical work.

### Write Volume

153 Write calls produced 68 findings+index pairs, 5 learnings files, 1 skill inventory, 1 subtype candidates list, 1 migration script, 1 compute-session-shape script, and 1 auto-memory file. This is the highest write-volume session pattern: systematic knowledge production.

## Classifiers

| Classifier              | Value              | Justification                                                                             |
| ----------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| C01 session_type        | BUILD              | Systematic production of analysis artefacts via campaign orchestration                    |
| C02 session_subtype     | build.campaign     | Multi-wave structured campaign with Ralphy orchestration, not ad-hoc building             |
| C03 opening_style       | skill_invocation   | Opens with `/ralphy` — a campaign skill                                                   |
| C04 closing_style       | mid_task_abandon   | Session ends while W5 analysis agents still running (last events are subagent tool calls) |
| C05 tool_profile        | agent_orchestrator | 71 Agent calls dominate the session shape; Bash/Read/Write are mostly inside subagents    |
| C06 project_attribution | reliable           | CWD is angeleye, all writes target angeleye analysis artefacts                            |
| C07 session_scale       | marathon           | 332 minutes, 1678 events, 99 user prompts, 3 compactions                                  |

## Predicates

| Predicate                   | Result | Justification                                                                                       |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| P01 is_feature_construction | false  | Producing analysis artefacts, not building application features                                     |
| P02 has_frustration_signals | true   | "Why didn't you tell me this each time? Fucking hell!" at 14:47 — schema evolution not communicated |
| P03 is_multi_phase          | true   | 5 distinct phases: bootstrap, W1–2 interactive, W3–4 autonomous, schema crisis, v2 design           |
| P04 has_brain_file_writes   | true   | Writes to brains/angeleye/analysis/ (migration script, findings-w5-micro.md)                        |
| P05 has_playwright_calls    | false  | No browser automation                                                                               |
| P06 has_cross_session_refs  | true   | Reads 6+ other session JSONL files as analysis targets (30391e74, 11553588, 78f31f8c, etc.)         |
| P07 has_skill_gap_signal    | true   | David needed terminology explained: registry types, bookend pattern, cold start, subtypes           |
| P08 has_unauthorized_edits  | false  | shape.json detection says false; all edits were to IMPLEMENTATION_PLAN.md and AGENTS.md (expected)  |
| P09 is_compaction_resume    | true   | 3 compactions detected (session_start events at L749, L1532, L1675)                                 |
| P10 is_cwd_incidental       | false  | CWD angeleye matches the project being worked on                                                    |

## Gated Observations

### O02_frustration (gated on P02)

- **Trigger**: Schema evolved from v1 to v2 during campaign without backfilling or notifying David
- **Quote**: "Why didn't you tell me this each time? Fucking hell! We were meant to be updating schemas as we go"
- **Resolution**: Migration script written, schema v2 formalised, AGENTS.md updated

### O06_cross_session (gated on P06)

- **Sessions referenced**: 30391e74, 11553588, 78f31f8c, 59a8f9ac, 6ba65a37, a4fd902a, plus ~70 more via subagents
- **Pattern**: Systematic cross-session analysis — this session reads other sessions as data, not as conversation context

### O07_skill_gap (gated on P07)

- **Gaps**: AngelEye classification terminology (registry types, session subtypes, bookend patterns, cold start vs morning triage)
- **Resolution**: Claude explained terms inline; David wrote feedback_explain_terminology.md to auto-memory

### O09_compaction (gated on P09)

- **Count**: 3 compactions
- **Timing**: After W2 complete (~13:01), after W4 complete (~14:18), during W5 (~15:38)
- **Impact**: Context window pressure from 71 subagent results accumulating. No visible degradation in output quality post-compaction.

## Proposed Subtypes

- `build.campaign` — multi-wave systematic production orchestrated by Ralphy
- `build.schema_evolution` — schema design iteration under pressure (v1 to v2 migration)
- `meta.self_analysis` — observability tool analysing its own sessions

## Notable Patterns

### Agent Fan-Out Cadence

Subagents launched in time-clustered batches of 4–10, with ~5-minute gaps between batches. Each agent ran 2–4 minutes. The orchestrator waited for all task-notifications before proceeding.

### Learnings Capture Rhythm

After each wave completed, a wave-N-learnings.md was written summarising patterns discovered. This progressive knowledge capture is itself a pattern worth encoding.

### Schema as Living Document

The session demonstrates that analysis schemas must version explicitly. The v1-to-v2 transition happened organically during waves 1–4, only becoming explicit when David noticed inconsistency. The migration script (migrate-v1-to-v2.py) was born from this session.
