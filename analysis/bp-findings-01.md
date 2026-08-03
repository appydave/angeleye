---
type: analysis
title: 'Backprop Findings 01'
description: 'Backward pass batch 01 — 103 sessions (m4-mini + m4-pro), predicates P17-P22, classifiers C08-C11, and candidate new schema items.'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Batch 01 Findings

Processed 103 sessions. Batch covers both m4-mini (90) and m4-pro (13) machines across 20+ projects.

## Predicate Distributions

| Predicate                    | True     | False     | Null     | Notes                                                                    |
| ---------------------------- | -------- | --------- | -------- | ------------------------------------------------------------------------ |
| P17 handover_context         | 22 (21%) | 81 (79%)  | 0        | Large structured pastes common in brains/knowledge sessions              |
| P18 cross_project_reads      | 7 (7%)   | 7 (7%)    | 89 (86%) | High null rate: file_paths extraction failed for most sessions           |
| P19 web_research             | 5 (5%)   | 98 (95%)  | 0        | Web research rare; mostly brave-search MCP                               |
| P20 parallel_subagent_bursts | 2 (2%)   | 101 (98%) | 0        | Only angeleye campaign sessions show burst patterns                      |
| P21 task_orchestration       | 28 (27%) | 75 (73%)  | 0        | Higher than expected; Task/TaskOutput used in many skill-driven sessions |
| P22 git_outcome              | 2 (2%)   | 101 (98%) | 0        | Very few sessions produce commits; bash sample may undercount            |

## Classifier Distributions

### C08 Delegation Style

| Value          | Count | %   |
| -------------- | ----- | --- |
| conversational | 81    | 79% |
| directive      | 14    | 14% |
| orchestrated   | 4     | 4%  |
| autonomous     | 4     | 4%  |

David's dominant pattern is conversational -- many short prompts steering the agent. Orchestrated mode only appears in campaign/ralphy sessions.

### C09 Session Continuity

| Value          | Count | %   |
| -------------- | ----- | --- |
| fresh          | 66    | 64% |
| handover_paste | 18    | 17% |
| compaction     | 13    | 13% |
| skill_launcher | 6     | 6%  |

Two-thirds of sessions start fresh. Handover paste is the second most common pattern, indicating David frequently starts sessions by pasting context from elsewhere.

### C10 Output Type

| Value               | Count | %   |
| ------------------- | ----- | --- |
| conversation_only   | 40    | 39% |
| code_changes        | 34    | 33% |
| knowledge_synthesis | 22    | 21% |
| mixed               | 5     | 5%  |
| new_artifacts       | 2     | 2%  |

Note: ~39% conversation_only includes orientation sessions and sessions where tool use was read-only. C10 confidence is "medium" for most entries because file_paths extraction was incomplete (empty arrays despite Write/Edit tool counts > 0).

### C11 Initiation Source

| Value            | Count | %   |
| ---------------- | ----- | --- |
| user_typed       | 76    | 74% |
| handover_paste   | 21    | 20% |
| skill_invoked    | 6     | 6%  |
| voice_dictated   | 0     | 0%  |
| agent_dispatched | 0     | 0%  |

No voice_dictated or agent_dispatched detected. Voice detection relies on the existing `has_voice_dictation_artifacts` predicate which was false/null for all sessions in this batch.

## Subtype Fill

- 44 sessions already had subtypes
- 57 subtypes inferred during backward pass
- 2 sessions remain without subtypes (no session_type assigned)

New subtypes introduced: `test.execution`, `operations.maintenance`, `sysops.infrastructure`, `brand.website`, `setup.configuration`, `review.code_review`, `planning.roadmap`, `meta.tooling`, `mixed.multi_activity`

## Observations

### O06 Autonomy Profile

The overwhelming pattern is collaborative/conversational. David actively steers almost all sessions. True autonomous runs are rare and typically involve skill-launched campaign work.

### O07 Machine Character

M4 Pro sessions (13 total) show a mix of daytime and evening use. No voice-initiated sessions detected in this batch. M4 Pro sessions span projects: brains, beauty-and-joy, joy-juice, appydave.com, dev.

## Data Quality Issues

1. **P18 null rate (86%)**: The precomputed `file_paths.read` arrays are empty for most sessions despite the sessions clearly using Read tools. This is likely a bug in the shape extraction -- it seems to only capture file paths for sessions that had subagents (session 0 has 106 subagents and populated file_paths; sessions 2-5 have 0 subagents and empty file_paths despite heavy Read/Write tool use).

2. **P22 undercount**: The `bash_commands_sample` is limited to 10 entries. Sessions with many bash commands may have git commit/push commands outside the sample window.

3. **C10 confidence**: Without file path data, C10 falls back to project-type heuristics (code project + writes = code_changes). This is reasonable but loses nuance about mixed code+docs sessions.

## Candidate New Predicates / Classifiers / Observations

### Candidate Predicates

- **P_has_playwright_browser** -- sessions using mcp\_\_playwright tools for browser automation (5 sessions in this batch used playwright tools; distinct from web research)
- **P_has_skill_tool** -- sessions where the Skill tool was called (not just skill_invocations in shape_data); indicates skills were loaded mid-session
- **P_has_form_filling** -- the detection exists in shape_data but isn't surfaced as a predicate; form-filling sessions have distinct interaction patterns
- **P_has_large_codebase_writes** -- sessions with Write count > 20 indicate substantial code generation vs incremental editing

### Candidate Classifiers

- **C_project_domain** -- group projects into domains: client_work (supportsignal), personal_brand (appydave, beauty-and-joy), tooling (angeleye, appystack), content (brains, v-appydave, v-voz), infrastructure (dtv, dev). Would enable domain-level analysis.
- **C_prompt_density** -- prompts per active minute; distinguishes rapid-fire interactive sessions from long autonomous runs

### Candidate Observations

- **O_tool_diversity** -- number of distinct tool types used; sessions with 10+ tool types indicate complex multi-capability work vs simple read-edit cycles
- **O_subagent_to_main_ratio** -- in orchestrated sessions, the ratio of subagent tool calls to main session tool calls reveals delegation depth

## Surprising Patterns

1. **Task orchestration is common (27%)** but parallel subagent bursts are rare (2%). David uses Task tools for tracking within single-agent sessions, not for multi-agent coordination.

2. **Handover paste (17-20%)** is a significant initiation pattern. David frequently starts sessions by pasting large blocks of context -- more than using skills or voice.

3. **Git outcomes are extremely rare (2%)** despite 33% of sessions producing code changes. This suggests David reviews and commits outside of Claude Code sessions, or uses a separate workflow for version control.

4. **No voice-dictated sessions** in this batch, despite the M4 Pro being the laptop (where OMI/voice would be expected). The voice detection predicate may need tuning, or this batch simply doesn't include voice-heavy sessions.
