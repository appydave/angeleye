---
type: analysis
title: 'Backprop Findings 04'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Findings — Batch 04

**Date**: 2026-03-23
**Sessions processed**: 103
**Machine split**: m4-mini: 91, m4-pro: 12

## New Predicate Distribution

| Predicate                        | True | False | Rate |
| -------------------------------- | ---- | ----- | ---- |
| P17 has_handover_context         | 34   | 69    | 33%  |
| P18 has_cross_project_reads      | 7    | 96    | 7%   |
| P19 has_web_research             | 8    | 95    | 8%   |
| P20 has_parallel_subagent_bursts | 4    | 99    | 4%   |
| P21 has_task_orchestration       | 19   | 84    | 18%  |
| P22 has_git_outcome              | 7    | 96    | 7%   |

## New Classifier Distributions

### C08 Delegation Style

| Value          | Count | Rate |
| -------------- | ----- | ---- |
| directive      | 48    | 47%  |
| conversational | 36    | 35%  |
| autonomous     | 11    | 11%  |
| orchestrated   | 8     | 8%   |

### C09 Session Continuity

| Value          | Count | Rate |
| -------------- | ----- | ---- |
| fresh          | 58    | 56%  |
| handover_paste | 31    | 30%  |
| skill_launcher | 8     | 8%   |
| compaction     | 4     | 4%   |
| recall         | 2     | 2%   |

### C10 Output Type

| Value               | Count | Rate |
| ------------------- | ----- | ---- |
| code_changes        | 36    | 35%  |
| mixed               | 28    | 27%  |
| conversation_only   | 20    | 19%  |
| knowledge_synthesis | 16    | 16%  |
| new_artifacts       | 3     | 3%   |

### C11 Initiation Source

| Value            | Count | Rate |
| ---------------- | ----- | ---- |
| user_typed       | 53    | 51%  |
| voice_dictated   | 26    | 25%  |
| handover_paste   | 13    | 13%  |
| skill_invoked    | 10    | 10%  |
| agent_dispatched | 1     | 1%   |

## Observation Profiles

### O06 Autonomy Profile Distribution

| Bucket            | Count | Rate |
| ----------------- | ----- | ---- |
| guided            | 41    | 40%  |
| interactive       | 31    | 30%  |
| autonomous        | 15    | 15%  |
| passive           | 12    | 12%  |
| highly_autonomous | 4     | 4%   |

### O07 Machine Character

| Machine | Count | Rate |
| ------- | ----- | ---- |
| m4-mini | 91    | 88%  |
| m4-pro  | 12    | 12%  |

## Key Findings

### 1. Handover Context Is Common (34/103 sessions)

Sessions frequently start with substantial context — checkpoint pastes, prior conversation summaries, or large structured briefs. This indicates a strong handover-driven workflow where sessions rarely start from zero.

**Large prompt pastes (>1000 chars)**:

- `ac339def` (brains): 26,666 chars
- `0f7ea98d` (fligen): 23,693 chars
- `04fd1cd3` (app.supportsignal): 21,838 chars
- `3eedefa5` (flivideo): 20,768 chars
- `6d0c282d` (prompt.supportsignal.com.au): 15,441 chars
- `19e974c6` (appystack): 7,319 chars
- `12172e43` (brains): 6,255 chars
- `19643e68` (appystack): 5,476 chars
- `5ba8b355` (brains): 5,071 chars
- `c4c30dc9` (brains): 4,533 chars

### 2. Cross-Project Reads (7 sessions)

Sessions reading outside their project boundary reveal the interconnected nature of the workspace. Brain files, CLAUDE.md configs, and shared planning docs are commonly pulled in.

- `4e8c5897` (brains): 14 cross-reads — e.g. `MEMORY.md`
- `f1ee6fea` (appydave.com): 18 cross-reads — e.g. `index.astro`
- `dc3e550b` (app.supportsignal.com.au): 4 cross-reads — e.g. `engineering-principles.md`
- `410fcd3f` (flihub): 2 cross-reads — e.g. `SKILL.md`
- `689892a5` (dtv): 2 cross-reads — e.g. `MEMORY.md`
- `d1eca273` (brains): 1 cross-reads — e.g. `MEMORY.md`
- `137c3dcf` (brains): 1 cross-reads — e.g. `b01kc02g2.output`

### 3. Web Research Is Rare (8 sessions, 8/103)

Web research (Brave search, WebFetch) appears in only 8% of sessions. Most knowledge work pulls from local brains rather than external sources.

- `45d583fe` (agent-os): mcp**brave-search**brave_web_search
- `689892a5` (dtv): mcp**brave-search**brave_web_search
- `8b0fad92` (brains/n8n): WebSearch
- `96efd99c` (brains): mcp**brave-search**brave_web_search
- `da0932c0` (brains): mcp**brave-search**brave_web_search
- `22b1033f` (ad): WebSearch, WebFetch
- `1c8733c9` (signal-studio): mcp**brave-search**brave_web_search
- `68975bb0` (brains): mcp**brave-search**brave_web_search

### 4. Task Orchestration (19 sessions)

TaskCreate/TaskUpdate usage clusters in campaign-style sessions and health-check workflows. These sessions tend to be longer and more structured.

- `3eedefa5` (flivideo): {'TaskUpdate': 10, 'Task': 6, 'TaskCreate': 4, 'TaskList': 1}
- `8e8dac5b` (brains): {'TaskUpdate': 2, 'TaskCreate': 1}
- `7e356115` (fligen): {'TaskList': 1}
- `02a273f8` (poem): {'TaskUpdate': 27, 'TaskCreate': 11, 'Task': 3}
- `b97f2b6d` (prompt.supportsignal.com.au): {'Task': 19}
- `73dad405` (brains): {'Task': 6, 'TaskUpdate': 4, 'TaskCreate': 2, 'TaskList': 1}
- `fdb89194` (flihub): {'TaskUpdate': 8, 'TaskCreate': 4}
- `19643e68` (appystack): {'TaskUpdate': 8, 'TaskCreate': 4}

### 5. Subagent Patterns (4/103 with parallel bursts)

Parallel subagent bursts are concentrated in Ralphy/campaign sessions. Most sessions (>99) run without any subagents.

### 6. Git Outcomes Are Minority (7/103)

Only 7% of sessions produce git outcomes. This confirms that most sessions are exploratory, conversational, or knowledge-oriented rather than code-delivery focused.

### 7. Multi-Day Sessions (16 sessions)

Sessions with 2+ idle gaps over 1 hour span multiple work periods:

- `4e8c5897` (brains): 6 gaps, 5842min total duration
- `dc3e550b` (app.supportsignal.com.au): 6 gaps, 8622min total duration
- `3eedefa5` (flivideo): 5 gaps, 3595min total duration
- `02a273f8` (poem): 5 gaps, 1596min total duration
- `4c94c66c` (appydave.com): 4 gaps, 920min total duration
- `7a146e68` (flihub): 3 gaps, 1061min total duration
- `86a9a3bc` (prompt.supportsignal.com.au): 3 gaps, 753min total duration
- `8e8dac5b` (brains): 2 gaps, 256min total duration

## New Candidate Predicates/Classifiers Discovered

### P23_has_worktree_usage (candidate)

**1 sessions** use EnterWorktree or touch `.claude/worktrees/` paths. Worktree usage signals isolated experimentation — the user is exploring without contaminating the main branch.

Sessions: 7a146e68

### P24_has_memory_ceremony (candidate)

**3 sessions** write to MEMORY.md or `/memory/` directories. Memory writes at session close signal a closing ceremony — the user wants state to persist for next session.

Sessions: 4e8c5897, 689892a5, d1eca273

### P25_has_mochaccino_design (candidate)

**1 sessions** touch `.mochaccino/` design files. These are HTML mockup/prototype sessions — a design-before-build pattern.

Sessions: 7a146e68

### C12_prompt_modality (candidate)

Estimated **26 voice-dictated** sessions based on conversational opening patterns, first-person phrasing, and moderate prompt lengths without slash-command prefixes. Distinguishing voice from typed input helps understand session ergonomics.

### C13_session_span (candidate)

Sessions naturally cluster into:

- **Single-burst** (<30min active, 0 idle gaps): quick questions, one-shot tasks
- **Work-session** (30-120min active, 0-1 gaps): focused development blocks
- **Marathon** (>120min active or 2+ gaps): campaign sessions spanning hours or days

### O08_closing_ceremony (candidate observation)

Observable pattern: sessions ending with git commit, memory write, or next-round-brief write exhibit a "closing ceremony" that prepares state for the next session. Absence of closing ceremony correlates with abandoned/interrupted sessions.
