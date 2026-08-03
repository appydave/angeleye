---
type: analysis
title: 'Backprop Findings 05'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass Findings — Batch 05

**Batch**: `bp-batch-05.json`
**Sessions analysed**: 103
**Output**: `bp-batch-05.jsonl`
**Date**: 2026-03-23

---

## Predicate Distributions

| Predicate                        | True | False | Null | Notes                                                                     |
| -------------------------------- | ---- | ----- | ---- | ------------------------------------------------------------------------- |
| P17_has_handover_context         | 11   | 92    | 0    | ~11% of sessions carry handover context                                   |
| P18_has_cross_project_reads      | 8    | 95    | 0    | Cross-project reads cluster in brain-refresh and angeleye sessions        |
| P19_has_web_research             | 7    | 96    | 0    | Web research is rare (~7%), concentrated in brains/ knowledge work        |
| P20_has_parallel_subagent_bursts | 3    | 100   | 0    | True bursts (3+ agents within 5min) are rare                              |
| P21_has_task_orchestration       | 26   | 77    | 0    | 25% use Task/Cron tools — higher than expected, many are system-initiated |
| P22_has_git_outcome              | 10   | 69    | 24   | 24 sessions have null (heavy edits suggest possible git, unconfirmed)     |

## Classifier Distributions

### C08: Delegation Style

| Value          | Count | %   |
| -------------- | ----- | --- |
| conversational | 50    | 49% |
| directive      | 39    | 38% |
| orchestrated   | 11    | 11% |
| autonomous     | 3     | 3%  |

### C09: Session Continuity

| Value          | Count | %   |
| -------------- | ----- | --- |
| fresh          | 76    | 74% |
| handover_paste | 11    | 11% |
| compaction     | 9     | 9%  |
| skill_launcher | 7     | 7%  |

### C10: Output Type

| Value               | Count | %   |
| ------------------- | ----- | --- |
| conversation_only   | 48    | 47% |
| code_changes        | 22    | 21% |
| knowledge_synthesis | 17    | 17% |
| new_artifacts       | 13    | 13% |
| mixed               | 3     | 3%  |

### C11: Initiation Source

| Value            | Count | %   |
| ---------------- | ----- | --- |
| user_typed       | 49    | 48% |
| voice_dictated   | 33    | 32% |
| handover_paste   | 11    | 11% |
| skill_invoked    | 7     | 7%  |
| agent_dispatched | 3     | 3%  |

---

## Key Findings

### 1. Voice dictation is a major input channel (32%)

One-third of sessions show voice-dictated opening prompts (natural language phrasing, conversational tone, sentence fragments). This is a significant signal for AngelEye UX — ambient capture workflows must handle speech-to-text artifacts gracefully.

### 2. Handover is a distinct workflow pattern (11%)

Eleven sessions carry pasted handover context from prior sessions. These tend to be longer prompts (>2000 chars) with structured formatting (headings, bullet points, "What Was Done" sections). This confirms the handover_paste continuity type as a real pattern worth tracking.

### 3. Subagent bursts are rare but impactful

Only 3 sessions show true parallel subagent bursts (3+ agents within 5 minutes), all in orchestrated sessions: BMAD brain refresh (12 agents), AngelEye planning (9 agents), and BMAD-dev skill invocation (6 agents). These represent David's heaviest orchestration moments.

### 4. Task orchestration is surprisingly common (25%)

26 sessions use Task/Cron tools. Many are system-generated (TaskOutput, TaskUpdate) rather than user-initiated. This suggests Claude Code's background task system is heavily used, even in sessions that appear conversational.

### 5. Cross-project reads reveal knowledge graph connections

8 sessions read files outside their CWD. Key patterns:

- **BMAD brain refresh** reads upstream BMAD-METHOD repo
- **AngelEye sessions** read `.claude/` memory files and skill definitions
- **Brains sessions** read from agent-os, appydave-plugins, and Downloads
- **DSS session** reads from appydave-plugins skills

### 6. Web research correlates with knowledge work

All 7 web research sessions are in `brains/` or `prompt.supportsignal` projects — never in pure build sessions. Web research is a knowledge-acquisition behaviour, not a build behaviour.

### 7. Nearly half of sessions produce no file changes

48 sessions (47%) are conversation_only output. These are Q&A, planning discussions, troubleshooting conversations, or micro-interactions that never reach the file system.

---

## Notable Sessions

| Session ID | Project            | Flags             | Description                                              |
| ---------- | ------------------ | ----------------- | -------------------------------------------------------- |
| 3f66732c   | beauty-and-joy     | AUTO              | Marathon Paperclip agent (JJ), 952 events, 8 compactions |
| cf5bb749   | joy-juice          | AUTO              | JJ agent continuation, same agent ID as above            |
| 832fc6c9   | joy-juice          | AUTO              | Another JJ agent continuation                            |
| 3fa5e03b   | brains/bmad-method | BURST+ORCH        | 12 subagents for BMAD brain refresh, burst pattern       |
| 6ee31b28   | angeleye           | BURST+ORCH        | 9 subagents for AngelEye planning                        |
| 0661821b   | brains             | HANDOVER+WEB+ORCH | DSS manifest session — most flags of any session         |
| b56e1aef   | brains             | HANDOVER+ORCH     | DSS architectural Q&A with subagent orchestration        |

---

## New Candidate Predicates/Classifiers/Observations

### Candidate Predicate: P23_has_screenshot_paste

Several sessions show opening prompts with pasted UI content (developer tools output, application state). Detecting screenshot/clipboard paste patterns could distinguish debugging-from-screenshot sessions.

**Signal**: `first_real_prompt` contains Unicode box-drawing characters, menu items, or structured UI text that clearly came from a screen capture or clipboard paste.

### Candidate Predicate: P24_is_paperclip_agent

The Paperclip/JJ agent pattern is distinctive: identical continuation prompts, agent UUID in prompt, no human interaction. Currently tagged via subtype but could be a standalone predicate for faster filtering.

**Signal**: `first_real_prompt.text` matches pattern `"You are agent <uuid> (<name>). Continue your Paperclip work."`

### Candidate Classifier: C12_prompt_verbosity

Opening prompt length varies enormously (0 chars to 4787 chars). Bucketing into terse (<50), normal (50-500), verbose (500-2000), and paste (>2000) would correlate with initiation source and session complexity.

### Candidate Observation: O08_project_hop_within_session

Some sessions read files across multiple projects (cross-project reads). An observation tracking which projects were touched and whether the session "hopped" between projects would help identify sessions that blur project boundaries.

### Candidate Classifier: C13_frustration_intensity

Currently P02 is binary (has_frustration_signals). A graded scale (none/mild/strong) would be more useful. "Bullshit" and "fuck" are strong; "No, you got it wrong" is mild. The existing data supports this gradient.

---

## Machine Character Summary

| Machine | Sessions | Dominant Patterns                                                          |
| ------- | -------- | -------------------------------------------------------------------------- |
| M4 Pro  | 8        | Heavy builds (Paperclip agent, FliDeck, Playwright UAT), agent dispatching |
| M4 Mini | 95       | Everything else — knowledge work, brains, quick ops, voice interactions    |

The M4 Mini handles 92% of sessions in this batch. The M4 Pro is reserved for computationally heavy or long-running autonomous agent work.

---

## Subtype Gap-Fill Summary

Proposed subtypes were filled for sessions missing them. Key fills:

- Several `BUILD` sessions without subtypes received `build.general`, `build.feature_construction`, or `build.infrastructure`
- `KNOWLEDGE` sessions received `knowledge.exploration` or `knowledge.brain_refresh`
- `MICRO` sessions received `micro.question`, `micro.quick_fix`, or `micro.git_housekeeping`
- `DEBUG` sessions received `debug.troubleshooting`
