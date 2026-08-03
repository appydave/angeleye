---
type: analysis
title: 'Backprop Findings 09'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Findings — Batch 09

**Date**: 2026-03-23
**Sessions processed**: 102
**Machines**: 89 m4-mini, 13 m4-pro
**Output**: `bp-batch-09.jsonl` (102 entries)

---

## Predicate Summary

| Predicate                        | True | False | Null | Rate                        |
| -------------------------------- | ---- | ----- | ---- | --------------------------- |
| P17_has_handover_context         | 4    | 98    | 0    | 3.9%                        |
| P18_has_cross_project_reads      | 9    | 92    | 1    | 8.8%                        |
| P19_has_web_research             | 10   | 92    | 0    | 9.8%                        |
| P20_has_parallel_subagent_bursts | 3    | 3     | 96   | 50% of those with subagents |
| P21_has_task_orchestration       | 21   | 81    | 0    | 20.6%                       |
| P22_has_git_outcome              | 13   | 89    | 0    | 12.7%                       |

### Notes

- **P17 (handover)**: Only 4 sessions open with explicit handover paste. Low frequency but high signal — these are always heavy, multi-phase sessions (signal-studio UAT, appystack, angeleye, appydave-plugins).
- **P18 (cross-project reads)**: 9 sessions read files outside their CWD project. Mostly `brains/` sessions reaching into project dirs, or plugin sessions reading app code. Limited by sparse `file_paths.read` data — actual rate likely higher.
- **P19 (web research)**: 10 sessions use Brave/WebSearch/WebFetch. Concentrated in `brains/` project (7/10) — research is brain work, not build work.
- **P20 (parallel subagents)**: Only 6 sessions had subagents at all; 3 of those had parallel bursts. When subagents appear, they tend to be parallel (Explore-type scouts).
- **P21 (task orchestration)**: 21 sessions (20.6%) use TaskCreate/TaskUpdate. Higher than expected — David uses structured task tracking in ~1/5 sessions.
- **P22 (git outcome)**: 13 sessions produce git commits/pushes. Surprisingly low — most sessions end without explicit git outcomes visible in shape data.

---

## Classifier Distributions

### C08 — Delegation Style

| Value          | Count | %     |
| -------------- | ----- | ----- |
| directive      | 42    | 41.2% |
| orchestrated   | 26    | 25.5% |
| conversational | 26    | 25.5% |
| autonomous     | 8     | 7.8%  |

**Interpretation**: The dominant mode is **directive** — David gives a clear instruction and Claude executes. The high `orchestrated` count (25.5%) reflects frequent Task tool usage. Pure autonomous sessions (1-prompt, high tool count) are rare (7.8%).

### C09 — Session Continuity

| Value          | Count | %     |
| -------------- | ----- | ----- |
| fresh          | 80    | 78.4% |
| compaction     | 14    | 13.7% |
| handover_paste | 4     | 3.9%  |
| skill_launcher | 2     | 2.0%  |
| recall         | 2     | 2.0%  |

**Interpretation**: Overwhelmingly fresh starts. The 14 compaction sessions are the marathons (signal-studio UAT, multi-day brains work). Skill launchers are underdetected — `/bmad-dev`, `/radar`, `/focus` show as skill-invoked in C11 but not always caught here due to empty `skill_invocations` arrays.

### C10 — Output Type

| Value               | Count | %     |
| ------------------- | ----- | ----- |
| knowledge_synthesis | 36    | 35.3% |
| conversation_only   | 27    | 26.5% |
| mixed               | 24    | 23.5% |
| new_artifacts       | 8     | 7.8%  |
| code_changes        | 7     | 6.9%  |

**Interpretation**: More than a third of sessions produce **knowledge**, not code. The 27 conversation-only sessions include zero-tool micro-sessions, aborted sessions, and pure planning conversations. The distinction between `code_changes` and `new_artifacts` is useful — scaffolding sessions (Write-heavy) differ from iteration sessions (Edit-heavy).

### C11 — Initiation Source

| Value          | Count | %     |
| -------------- | ----- | ----- |
| user_typed     | 80    | 78.4% |
| skill_invoked  | 9     | 8.8%  |
| voice_dictated | 9     | 8.8%  |
| handover_paste | 4     | 3.9%  |

**Interpretation**: Voice-dictated sessions are reliably detected from notes containing "voice", "OMI", "Wiggum" keywords. The 9 skill-invoked sessions all start with `/` prefix. No `agent_dispatched` sessions detected in C11 — the 2 JJ/Paperclip agent sessions start with `-\n` prefix which routes to `skill_invoked`.

---

## Observations

### O06 — Autonomy Profile

Representative examples:

- **Fire-and-forget**: `e2b982ca` (joy-juice) — 1 prompt, 65 tools. Agent dispatched, runs to completion.
- **High autonomy**: `798c3fc6` (signal-studio) — 31 tools/prompt. Heavy UAT with 4 compactions.
- **Guided**: `830bd3ac` (brain-dynamous) — 1.6 tools/prompt. Lots of discussion, little execution.
- **Zero-prompt**: `b62152af`, `6650f194`, `c9244768` — abandoned or programmatic sessions with 0 user prompts.

### O07 — Machine Character

- **M4 Mini** (89 sessions, 87%): The workhorse. All project types, all scales.
- **M4 Pro** (13 sessions, 13%): Skewed toward `brains/` research (4), build sessions requiring heavier compute (flideck, fligen, repo-audit), and agent-dispatched work (joy-juice, beauty-and-joy). The Pro is not used for lightweight tasks.

---

## Subtype Fills

6 sessions had missing subtypes filled by inference:

- Sessions with `subtype_source: bp09_inferred` in the JSONL

---

## New Candidate Predicates/Classifiers/Observations

### Candidate Predicate: P23_has_cron_monitoring

3 sessions use CronCreate/CronList/CronDelete (session 0 has all three). This is a distinct operational pattern — using cron loops for monitoring during UAT or deployment. Currently rare but architecturally significant.

### Candidate Predicate: P24_is_agent_dispatched

2 sessions (`e2b982ca`, `b9860add`) are explicitly agent-dispatched with the "You are agent ... Continue your Paperclip work" pattern. These have a unique autonomy profile (fire-and-forget, single prompt, high tool count) that differs from human-initiated sessions.

### Candidate Predicate: P25_has_pii_content

At least 2 sessions contain PII (passport numbers, DOB) per notes. Important for data governance — these sessions need special handling in any export/sharing pipeline.

### Candidate Classifier: C12_voice_fidelity

Voice-dictated sessions show a spectrum of transcription quality. Some have "voice artifact" notes (e.g., "Ralph Wiggum"="Ralphy", "Raft Loo"=Ralphy). A classifier tracking voice fidelity (clean/artifact_noted/heavily_garbled) would help filter voice-originated sessions.

### Candidate Observation: O08_project_gravity

`brains/` dominates with ~35 sessions — it acts as a gravitational center. Sessions in `brains/` are more likely to have web research (P19), voice dictation (C11), and knowledge synthesis (C10) than any other project. This project-level clustering is a strong signal for session pre-classification.

### Candidate Observation: O09_session_lifespan_pattern

Sessions cluster into three lifespan bands:

1. **Micro** (0-5 min active): 40+ sessions — quick lookups, aborted starts, single-shot commands
2. **Standard** (5-30 min active): ~40 sessions — typical feature work or knowledge capture
3. **Marathon** (30+ min active): ~15 sessions — multi-phase builds with compactions, UAT campaigns

---

## Key Findings

1. **Knowledge work dominates**: 35% of sessions produce knowledge synthesis, not code. The BUILD registry type is over-applied to `brains/` sessions that are actually knowledge curation.

2. **Voice is a significant input channel**: 9 sessions (8.8%) are voice-dictated, all on m4-mini. Voice sessions correlate with brain work and morning triage patterns.

3. **Task orchestration is common**: 20.6% of sessions use Task tools, suggesting David frequently structures work into tracked subtasks within sessions.

4. **Subagents are rare but parallel**: Only 6 sessions use subagents, but half of those run them in parallel. The dominant subagent type is "Explore" — used as parallel scouts, not sequential workers.

5. **Agent-dispatched sessions are a distinct species**: The 2 JJ/Paperclip sessions have a unique fingerprint (single prompt, high tool count, `-\n` prefix, agent identity in prompt). These need their own initiation_source value rather than being lumped with skill_invoked.

6. **Git outcomes are underdetected**: Only 12.7% show git activity, but many BUILD sessions likely commit — the signal is just not captured in shape_data (bash_commands_sample is often empty). Enriching bash command extraction would improve P22 accuracy.
