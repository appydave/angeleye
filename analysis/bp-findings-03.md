---
type: analysis
title: 'Backprop Findings 03'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Batch 03 — Findings

**Date**: 2026-03-23
**Sessions analysed**: 103
**Machine split**: M4 Mini 94, M4 Pro 9
**Source**: `bp-batch-03.json` (precomputed shape_data)
**Output**: `bp-batch-03.jsonl`

---

## Predicate Summary

| Predicate                        | True | False | Null | Notes                                                      |
| -------------------------------- | ---- | ----- | ---- | ---------------------------------------------------------- |
| P17_has_handover_context         | 38   | 65    | 0    | 37% of sessions start with pasted context/plans            |
| P18_has_cross_project_reads      | 5    | 5     | 93   | High null rate — file_paths not captured for most sessions |
| P19_has_web_research             | 8    | 95    | 0    | WebFetch + Brave search in 8% of sessions                  |
| P20_has_parallel_subagent_bursts | 3    | 2     | 98   | Only 5 sessions had subagents; 3 of those ran parallel     |
| P21_has_task_orchestration       | 10   | 93    | 0    | TaskCreate/Update used in 10% of sessions                  |
| P22_has_git_outcome              | 6    | 92    | 5    | Git commands or commit-related prompts in 6%               |

### P18 caveat

93 sessions have null for P18 because file_paths were not captured in shape_data (the extraction only captured paths for sessions with explicit file path tracking). The 5 true cases are reliable cross-project reads (e.g., SupportSignal app reading BMAD brain files, appydave-plugins reading upstream repos).

### P20 caveat

98 sessions have null because they had no subagents at all. Of the 5 sessions with subagents, 3 ran them in parallel (sessions 3, 5, 10) — all were substantial BUILD or RESEARCH sessions.

---

## Classifier Distributions

### C08: Delegation Style

| Value          | Count | %   |
| -------------- | ----- | --- |
| conversational | 65    | 63% |
| directive      | 24    | 23% |
| autonomous     | 11    | 11% |
| orchestrated   | 3     | 3%  |

David's dominant pattern is conversational — back-and-forth with Claude. Directive sessions (24) typically involve plan pastes or explicit instructions. Autonomous sessions (11) include POEM \*run commands and high-tool-count bursts. Only 3 sessions hit orchestrated (Ralphy/subagent-heavy).

### C09: Session Continuity

| Value          | Count | %   |
| -------------- | ----- | --- |
| fresh          | 51    | 50% |
| handover_paste | 34    | 33% |
| compaction     | 8     | 8%  |
| skill_launcher | 8     | 8%  |
| recall         | 2     | 2%  |

Half the sessions are fresh starts. A third begin with pasted context from prior sessions or plan documents. Compaction and skill_launcher tie at 8 each. Recall (referencing prior sessions by memory) is rare at 2%.

### C10: Output Type

| Value               | Count | %   |
| ------------------- | ----- | --- |
| conversation_only   | 35    | 34% |
| mixed               | 28    | 27% |
| code_changes        | 20    | 19% |
| new_artifacts       | 19    | 18% |
| knowledge_synthesis | 1     | 1%  |

A third of sessions produce no files (conversation_only) — these are orientation, research Q&A, and abandoned stubs. 27% produce mixed output (code + docs). Code-only and doc-only are roughly equal. Note: output_type for 58 sessions was inferred from tool counts (Write/Edit) rather than file paths, so confidence is lower for those.

### C11: Initiation Source

| Value            | Count | %   |
| ---------------- | ----- | --- |
| user_typed       | 54    | 52% |
| handover_paste   | 37    | 36% |
| skill_invoked    | 8     | 8%  |
| agent_dispatched | 2     | 2%  |
| voice_dictated   | 2     | 2%  |

Most sessions are typed directly. Handover paste is the second-most common initiation — David frequently copies context between sessions. Skill invocation (POEM \*run, /bmad-sm, /ralphy, /focus) accounts for 8%. Voice dictation detection is conservative (only flagged with clear typo markers like "pusehd", "analyssi").

---

## Observations

### O06: Autonomy Profile Distribution

- **Stub** (event_count <= 2): ~15 sessions — abandoned or smoke tests
- **Interactive** (ratio <= 1.5): majority of active sessions
- **Moderate autonomy** (ratio 1.5-3): sessions with multi-step tool chains
- **High autonomy** (ratio 3+): POEM execution sessions, Ralphy campaigns
- **Runaway** (ratio 10+): 1 session (the /loop ASCII art session #0)
- **Autonomous burst**: a few sessions with 20+ tools from 1-3 prompts

### O07: Machine Character

The batch is heavily M4 Mini (91%). The 9 M4 Pro sessions include the final batch-03 session (#102, brains/ops.machine_provision) and appear to be from a later campaign wave when the M4 Pro was brought online.

---

## Subtype Fills

19 sessions had empty subtypes that were filled:

- BUILD with no subtype -> build.implementation (most common fill)
- ORIENTATION with no subtype -> orientation.status_check or orientation.exploration
- META with event_count <= 2 -> meta.abandoned
- RESEARCH with web tools -> research.web_research
- SYSOPS with no subtype -> sysops.configuration
- MIXED -> mixed.multi_concern
- PLANNING -> planning.backlog

---

## Candidate Discoveries

### P_candidate_search_without_read (12 sessions)

Agent searched for files (Glob/Grep) but never read the results. This is a known anti-pattern where the agent explores broadly but fails to follow up. Could indicate either efficient scanning or wasted tool calls. Worth tracking as a quality signal.

### P_candidate_form_filling (8 sessions)

Sessions exhibiting form-filling patterns — structured data entry into templates or configuration files. These correlate with KNOWLEDGE brain sessions and OPERATIONS config management.

### P_candidate_poem_execution (5 sessions)

Sessions initiated via POEM `*run`/`*execute` commands. These are a distinct initiation pattern — autonomous prompt execution from the SupportSignal POEM system. Recommend promoting to a proper predicate (P23_is_poem_execution) or folding into C11_initiation_source.

### P_candidate_heavy_compaction (3 sessions)

Sessions with 2+ context compactions, indicating extended autonomous runs that exceeded context limits. These are signal-studio (3 compactions), prompt.supportsignal (3), and prompt.supportsignal.com.au (2). All were marathon BUILD sessions.

### P_candidate_multi_skill_session (3 sessions)

Sessions invoking 3+ different skills. These tend to be complex sessions spanning multiple concerns.

### P_candidate_has_cron_activity (2 sessions)

Sessions managing cron jobs (creates/deletes). One is the /loop runaway (#0), the other likely a legitimate polling setup.

### C_candidate_read_heavy_audit (2 sessions)

Sessions with 10+ file reads but <= 2 writes. Pure audit/review mode — reading extensively without modifying. Could be a distinct output_type value ("audit").

---

## Key Insights

1. **Handover paste is the primary continuity mechanism** (33% of sessions). David rarely uses recall ("we did X yesterday") — instead he copies explicit context. This is deliberate and effective but creates long first prompts.

2. **File path capture gap**: 58 of 103 sessions had Write/Edit tool calls but no file_paths recorded in shape_data. The backward pass inferred output_type from tool counts + session_type, but this reduces confidence. Future shape extraction should capture file paths from tool arguments.

3. **Subagent usage is rare but parallel when it happens**: Only 5 sessions used subagents, but 3 of those ran them in parallel. This suggests David (or his agents) go for parallelism when they use subagents at all.

4. **POEM execution is an underrecognized pattern**: 5 sessions are driven by `*run`/`*execute` commands — these are autonomous prompt executions that deserve their own classifier value or predicate.

5. **Machine skew**: 91% M4 Mini means this batch mostly represents the earlier campaign period before M4 Pro was integrated. The M4 Pro sessions show a different character (more ops-focused).

---

## Recommendations for Next Backward Pass

- **Promote P_candidate_poem_execution** to P23 or add "poem_execution" as a C11 value
- **Promote P_candidate_search_without_read** to P23 as a quality anti-pattern signal
- **Improve file path extraction** in shape_data to reduce P18 null rate
- **Consider C_candidate_read_heavy_audit** as a new C10 value ("audit")
- **Track compaction count** as a numeric field rather than boolean — sessions with 3 compactions behave very differently from those with 1
