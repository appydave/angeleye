---
type: analysis
title: 'Backprop Findings 06'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Batch 06 — Findings

**Date**: 2026-03-23
**Sessions processed**: 103

## Distribution Summary

### C08 Delegation Style

| Style          | Count | %   |
| -------------- | ----- | --- |
| directive      | 52    | 50% |
| conversational | 23    | 22% |
| orchestrated   | 22    | 21% |
| autonomous     | 5     | 4%  |

### C09 Session Continuity

| Type           | Count | %   |
| -------------- | ----- | --- |
| fresh          | 65    | 63% |
| handover_paste | 16    | 15% |
| compaction     | 11    | 10% |
| skill_launcher | 8     | 7%  |
| recall         | 2     | 1%  |

### C10 Output Type

| Type                | Count | %   |
| ------------------- | ----- | --- |
| code_changes        | 48    | 46% |
| new_artifacts       | 22    | 21% |
| conversation_only   | 14    | 13% |
| mixed               | 11    | 10% |
| knowledge_synthesis | 7     | 6%  |

### C11 Initiation Source

| Source           | Count | %   |
| ---------------- | ----- | --- |
| user_typed       | 64    | 62% |
| voice_dictated   | 20    | 19% |
| handover_paste   | 8     | 7%  |
| skill_invoked    | 7     | 6%  |
| agent_dispatched | 3     | 2%  |

### O06 Autonomy Profile

| Profile               | Count | %   |
| --------------------- | ----- | --- |
| conversational_worker | 35    | 33% |
| interactive_builder   | 21    | 20% |
| guided_builder        | 16    | 15% |
| pure_conversational   | 12    | 11% |
| inactive              | 12    | 11% |
| autonomous_executor   | 6     | 5%  |

### O07 Machine Character

| Character            | Count | %   |
| -------------------- | ----- | --- |
| primary_interactive  | 88    | 85% |
| secondary_build      | 7     | 6%  |
| agent_host           | 6     | 5%  |
| autonomous_workhorse | 1     | 0%  |

## Predicate Prevalence

| Predicate                        | True | %   |
| -------------------------------- | ---- | --- |
| P17_has_handover_context         | 17   | 16% |
| P18_has_cross_project_reads      | 6    | 5%  |
| P19_has_web_research             | 8    | 7%  |
| P20_has_parallel_subagent_bursts | 3    | 2%  |
| P21_has_task_orchestration       | 8    | 7%  |
| P22_has_git_outcome              | 7    | 6%  |

## Key Discoveries

### NEW Candidate Predicates

**P23_has_voice_dictation** — Detectable from voice artifacts in prompts (misspellings, run-on sentences, phonetic substitutions like 'a cam live'=Ecamm, 'Jason'=JSON, 'Ralpy'=Ralphy). ~30% of sessions show voice signals. Important for understanding prompt quality and user context.

**P24_is_agent_dispatched** — Session was started by an external agent system, not by the user. Opening prompt contains agent ID and continuation instruction. 3 sessions in this batch (joy-juice Paperclip JJ agent). Distinct from user-initiated sessions in every measurable way.

**P25_has_cwd_mismatch** — CWD does not match the actual project being worked on. Already partially tracked by is_cwd_incidental but this is the file-path-evidence version. Cross-project reads (P18) are a strong signal.

### NEW Candidate Classifiers

**C12_prompt_modality** (typed/voice/paste/agent_injected) — Finer than C11. Voice-dictated sessions have systematically different prompt structures: longer, more conversational, contain phonetic errors. Paste sessions have structured markdown. Agent-injected sessions have machine-formatted prompts.

**C13_lifecycle_completeness** (complete/abandoned/interrupted/stub) — Tracks whether a session reached a natural conclusion. 'complete' has closing ceremony (commit/push/handover). 'abandoned' has frustration or unresolved issues. 'interrupted' has large idle gaps then pickup. 'stub' is <3 events.

### NEW Candidate Observations

**O08_session_chain_position** — Where this session sits in a multi-session chain. Values: standalone, chain_start, chain_middle, chain_end, chain_corrective. Visible from handover pastes, 'continue' prompts, cross-session references.

**O09_tool_diversity_index** — Shannon entropy of tool distribution. Low diversity = specialist session (all Bash, or all Read). High diversity = generalist session using many tool types. Correlates with session complexity.

## Cross-Cutting Patterns

### Handover Paste as Session Architecture

17 sessions (16%) open with structured handover context. This is not incidental — David has developed a deliberate session-chaining methodology. Handover sessions correlate with 'directive' delegation (Claude receives a plan and executes) versus 'conversational' for fresh sessions. The handover format is evolving toward a standard template: Session Context header, Working On section, file references.

### Machine Role Divergence

M4 Mini: 88 sessions — primary interactive terminal. M4 Pro: 14 sessions — used for heavier autonomous work, agent hosting, and secondary builds. The Pro handles background agents (Paperclip JJ) and web-research-heavy sessions. When David uses the Pro interactively, sessions tend to be more focused and shorter.

### Autonomy Spectrum

The autonomy_profile distribution reveals David's working style:

- **conversational_worker**: 35 sessions (33%)
- **interactive_builder**: 21 sessions (20%)
- **guided_builder**: 16 sessions (15%)
- **pure_conversational**: 12 sessions (11%)
- **inactive**: 12 sessions (11%)
- **autonomous_executor**: 6 sessions (5%)

The dominant pattern is interactive work with periodic autonomous bursts. Pure conversational sessions (zero or minimal tool use) are surprisingly common — these are thinking/planning sessions that use Claude as a sounding board.

### Web Research Sessions

8 sessions (7%) include web research (Brave search, WebFetch, WebSearch). These cluster around:

- Brain creation (researching new topics before capturing knowledge)
- Competitive analysis (OpenAI Symphony, Fireship, tech landscape)
- Troubleshooting (Ecamm, Copilot removal, Krisp AI)
- Personal advisory (Thailand property research)

### Task Orchestration vs Agent Delegation

Task tools (TaskCreate/Update/Output): 8 sessions. Parallel subagent bursts: 3 sessions. These represent two different delegation patterns:

- **Task orchestration**: Structured work breakdown, often with Ralphy/POEM methodology
- **Subagent bursts**: Fan-out research or parallel exploration (BMAD audit, brain creation)
  Both correlate with 'orchestrated' delegation style but serve different purposes.

### Git Outcome as Session Quality Signal

7 sessions (6%) end with a git commit or push. This is a strong signal of session completeness — sessions that produce committed code are almost always 'complete' lifecycle sessions. Sessions without git outcome fall into three camps: research/knowledge (no code to commit), abandoned (frustration or blocker), or micro/stub (too short to produce anything).
