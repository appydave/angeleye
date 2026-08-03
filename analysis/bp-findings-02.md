---
type: analysis
title: 'Backprop Findings 02'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Findings — Batch 02

**Sessions processed**: 103
**Processed at**: 2026-03-23 13:19 UTC

## Predicate Distributions

**P17_has_handover_context**: true=21, false=81, null=1
**P18_has_cross_project_reads**: true=9, false=29, null=65
**P19_has_web_research**: true=14, false=88, null=1
**P20_has_parallel_subagent_bursts**: true=4, false=98, null=1
**P21_has_task_orchestration**: true=10, false=92, null=1
**P22_has_git_outcome**: true=1, false=101, null=1

## Classifier Distributions

### C08_delegation_style

- directive: 66 (64%)
- conversational: 24 (23%)
- orchestrated: 6 (6%)
- autonomous: 6 (6%)
- ?: 1 (1%)

### C09_session_continuity

- fresh: 64 (62%)
- handover_paste: 19 (18%)
- compaction: 8 (8%)
- skill_launcher: 6 (6%)
- recall: 5 (5%)
- ?: 1 (1%)

### C10_output_type

- conversation_only: 40 (39%)
- code_changes: 24 (23%)
- knowledge_synthesis: 22 (21%)
- mixed: 13 (13%)
- new_artifacts: 3 (3%)
- ?: 1 (1%)

### C11_initiation_source

- user_typed: 69 (67%)
- handover_paste: 20 (19%)
- skill_invoked: 7 (7%)
- voice_dictated: 6 (6%)
- ?: 1 (1%)

## Discovered Patterns

- **form_filling**: 5 sessions (5%)
- **memory_write**: 3 sessions (3%)
- **test_execution**: 3 sessions (3%)
- **package_manager_ops**: 2 sessions (2%)
- **steering_interaction**: 1 sessions (1%)
- **github_cli**: 1 sessions (1%)

## Machine Breakdown

- m4-mini: 90 sessions
- m4-pro: 13 sessions

## Autonomy Profile Samples

- `e868366b-bb9` (angeleye): orchestrator pattern — 77 subagents, 108 human turns
- `f9a685e2-510` (signal-studio): moderate autonomy — human guides, agent executes (12:1)
- `232bb5f3-552` (brains): moderate autonomy — human guides, agent executes (6:1)
- `c9d68534-330` (prompt.supportsignal.com.au): moderate autonomy — human guides, agent executes (9:1)
- `65f77723-c8a` (signal-studio): orchestrator pattern — 16 subagents, 29 human turns
- `120c7392-b06` (agent-os): conversational — tight human-agent loop (64 turns, 106 tools)
- `a080427c-2a2` (thumbrack): high autonomy — 15:1 tool/prompt ratio over 7295min
- `11553e41-d6b` (app.supportsignal): high autonomy — 15:1 tool/prompt ratio over 1209min
- `e9fb0466-cfb` (prompt.supportsignal.com.au): orchestrator pattern — 12 subagents, 20 human turns
- `26e20d70-611` (angeleye): moderate autonomy — human guides, agent executes (6:1)

## Handover Context Sessions (P17=true)

- `f9a685e2-510` (signal-studio): structured prompt 1269 chars
- `c9d68534-330` (prompt.supportsignal.com.au): first prompt 10833 chars
- `84e401ee-273` (agent-os): first prompt 7423 chars
- `59a8f9ac-660` (brains): first prompt 24167 chars
- `a16112ed-ee3` (flideck): first prompt 3781 chars
- `2a76f890-b35` (agent-os): first prompt 4177 chars
- `47015dde-cb2` (flihub): first prompt 4661 chars
- `33f0048e-db2` (brains): first prompt 37093 chars
- `6d72dffc-e99` (flideck): first prompt 18364 chars
- `e34013a3-adf` (v-appydave): first prompt 6413 chars
- `aedc4c79-2e8` (brains): first prompt 2039 chars
- `5e18711f-14c` (prompt.supportsignal.com.au): first prompt 7306 chars
- `670e11c5-0f8` (migration): first prompt 32730 chars
- `8efb371e-90e` (brains): first prompt 23992 chars
- `6c42dbf4-76d` (supportsignal-v2-planning): first prompt 9291 chars
- `7e10b733-68c` (brains): first prompt 2904 chars
- `ecaced22-76f` (prompt.supportsignal): first prompt 16487 chars
- `29258a0d-200` (angeleye): first prompt 4408 chars
- `e9761f48-249` (brains): first prompt 27663 chars
- `e73d7fc7-bd7` (ad): first prompt 9575 chars
- `8fe1e952-c8c` (brain-dynamous): first prompt 15515 chars

## Orchestrated Sessions (C08=orchestrated)

- `e868366b-bb9` (angeleye): agent+task orchestration
- `232bb5f3-552` (brains): agent+task orchestration
- `65f77723-c8a` (signal-studio): 16 agent dispatches
- `e9fb0466-cfb` (prompt.supportsignal.com.au): 12 agent dispatches
- `a16112ed-ee3` (flideck): 11 agent dispatches
- `460a1312-037` (prompt.supportsignal.com.au): agent+task orchestration

## New Predicate/Classifier Candidates

Based on discovered patterns across this batch:

- **P_has_form_filling**: 5 sessions (5%) — structured form completion detected, suggests template-driven work
- **P_has_memory_write**: 3 sessions (3%) — auto-memory writes indicate learning/feedback loops
- **P_has_test_execution**: 3 sessions (3%) — test command execution, relevant for quality-aware sessions
- **P_has_package_ops**: 2 sessions — npm/bun operations, marker for setup/dependency phases
- **C_handover_size**: quantify handover paste size (small <2K, medium 2-10K, large 10K+) — 21 sessions have handover context, sizes vary from 1.2K to 37K chars

## Key Insights

1. **Handover-paste is a major initiation pattern** (19-21% depending on measure). These sessions tend to be directive/orchestrated and produce more output.
2. **P18 (cross-project reads) has 63% null** due to file_paths not being captured in shape extraction. Future batches should extract paths from tool invocation args.
3. **P22 (git outcome) is almost always false** (1/103) — likely because bash_commands_sample only captures 10 commands. Git commits may happen outside the sample window.
4. **Web research (P19) at 14%** is higher than expected — indicates a meaningful research-oriented usage pattern.
5. **Orchestrated sessions** cluster around angeleye (campaign), signal-studio, flideck, and prompt.supportsignal — projects with established agent workflows.
6. **voice_dictated (C11) at 6%** is low-confidence and based on heuristics — needs validation against known voice-input sessions.
7. **P18 null rate** highlights a data quality gap: 65 sessions have Read tool usage but no file paths captured in shape_data.
