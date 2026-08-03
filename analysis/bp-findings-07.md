---
type: analysis
title: 'Backprop Findings 07'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Batch 07 — Findings

**Batch**: `bp-batch-07.json`
**Sessions analysed**: 102
**Date**: 2026-03-23

## Predicate Distribution (New P17-P22)

| Predicate                        | True | Rate |
| -------------------------------- | ---- | ---- |
| P17_has_handover_context         | 14   | 13%  |
| P18_has_cross_project_reads      | 7    | 6%   |
| P19_has_web_research             | 5    | 4%   |
| P20_has_parallel_subagent_bursts | 6    | 5%   |
| P21_has_task_orchestration       | 14   | 13%  |
| P22_has_git_outcome              | 20   | 19%  |

## Classifier Distribution (New C08-C11)

### C08 Delegation Style

| Value          | Count |
| -------------- | ----- |
| conversational | 59    |
| directive      | 36    |
| autonomous     | 7     |

### C09 Session Continuity

| Value          | Count |
| -------------- | ----- |
| fresh          | 68    |
| skill_launcher | 12    |
| handover_paste | 8     |
| recall         | 8     |
| compaction     | 6     |

### C10 Output Type

| Value               | Count |
| ------------------- | ----- |
| conversation_only   | 40    |
| new_artifacts       | 37    |
| knowledge_synthesis | 20    |
| mixed               | 5     |

### C11 Initiation Source

| Value            | Count |
| ---------------- | ----- |
| voice_dictated   | 53    |
| user_typed       | 31    |
| skill_invoked    | 11    |
| handover_paste   | 6     |
| agent_dispatched | 1     |

## Subtype Gap Fill

Filled missing subtypes for sessions that had `session_type` but no `session_subtype`. These are medium-confidence fills derived from shape signals (tool profiles, predicates, opening style).

## New Candidate Predicates/Classifiers/Observations

### P_candidate: has_skill_chain

**Definition**: Session invokes 2+ distinct skills in sequence.
**Prevalence**: 6/102 sessions (5%)
**Value**: Distinguishes multi-skill orchestration sessions from single-skill launches. Could reveal skill composition patterns.

### P_candidate: has_worktree_usage

**Definition**: Session uses `git worktree` commands.
**Prevalence**: 1/102 sessions (0%)
**Value**: Worktree sessions indicate parallel development branches, often with Ralphy campaigns. Low prevalence but high signal.

### P_candidate: is_single_turn_autonomous

**Definition**: Session has exactly 1 user prompt but 10+ tool calls.
**Prevalence**: 6/102 sessions (5%)
**Value**: Captures fire-and-forget sessions (Ralphy, agent-dispatched, single-directive builds). These are a distinct interaction pattern.

### C_candidate: prompt_paste_density

**Definition**: Sessions where first prompt exceeds 5,000 characters.
**Prevalence**: 8/102 sessions (7%)
**Value**: High-paste sessions indicate context loading (handovers, transcripts, requirements). Correlates with handover_paste continuity but also captures raw data ingestion.

### O_candidate: zombie_gap_ratio

**Definition**: Sessions where duration > 100m but active < 10m.
**Prevalence**: 6/102 sessions (5%)
**Value**: Identifies "parked" sessions that were opened, briefly used, then left open for hours. Common with overnight sessions and cross-machine context.

## Key Observations

### O06 Autonomy Profile Summary

The batch shows a bimodal distribution: most sessions are conversational (David driving) or delegated (David directing, Claude executing). True autonomous sessions cluster around Ralphy/skill-invoked launches and agent-dispatched work.

### O07 Machine Character

- **M4 Mini** dominates (90/102 sessions) — the primary workhorse across all project types.
- **M4 Pro** handles 12/102 sessions — tends toward heavier work (Playwright, operations, brains knowledge work).
- M4 Pro sessions show higher Playwright usage and more cross-project operations patterns.

### Cross-Cutting Patterns

1. **Handover continuity is more common than expected** (14/102). Many sessions begin with pasted context from prior sessions, indicating David uses copy-paste as a primary cross-session state transfer mechanism.

2. **Git outcomes correlate with session scale** — almost all moderate+ sessions that aren't ORIENTATION/META result in commits. Micro sessions rarely produce git outcomes.

3. **Task orchestration clusters in BUILD sessions** — TaskCreate/TaskUpdate usage is concentrated in campaign-style builds, rarely appearing in RESEARCH or ORIENTATION.

4. **Web research is rare** (5/102) — David's workflow is predominantly codebase-internal. When web research appears, it's typically for tool/feature discovery or upstream repo checks.

5. **Parallel subagent bursts are the signature of orchestrated campaigns** — they only appear in sessions with 200+ events and Ralphy/campaign patterns.
