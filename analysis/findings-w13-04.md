---
type: analysis
title: 'Findings W13-04'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-04

**Wave**: W13-04 (final wave)
**Agent**: W13-04
**Machine**: m4-mini
**Sessions analysed**: 15
**Date**: 2026-03-23

## Batch Profile

- **All 15 sessions**: micro scale (5-6 events each)
- **All 15 sessions**: CWD = `/Users/davidcruwys/dev/ad/brains`
- **Registry types**: BUILD (9), KNOWLEDGE (6)
- **BUILD accuracy**: 0/9 (0%) — all 9 BUILD classifications were wrong
- **KNOWLEDGE accuracy**: 2/6 (33%) — only 2 of 6 KNOWLEDGE classifications were correct

## Reclassification Summary

| Session  | Registry  | Reclassified | Subtype                 |
| -------- | --------- | ------------ | ----------------------- |
| 4b687f88 | KNOWLEDGE | ORIENTATION  | artifact_retrieval      |
| 8aab0116 | KNOWLEDGE | RESEARCH     | quick_answer            |
| 96c7dd57 | BUILD     | OPERATIONS   | git_commit              |
| c6d033a1 | BUILD     | ORIENTATION  | artifact_retrieval      |
| cf136be4 | BUILD     | SYSOPS       | remote_exploration      |
| dff3317d | BUILD     | ORIENTATION  | artifact_retrieval      |
| 68975bb0 | BUILD     | RESEARCH     | quick_answer            |
| 04170faf | BUILD     | ORIENTATION  | artifact_retrieval      |
| 1cc41d81 | KNOWLEDGE | RESEARCH     | dev_env_troubleshooting |
| 380994a2 | KNOWLEDGE | RESEARCH     | quick_answer            |
| 67a5a08a | BUILD     | OPERATIONS   | git_commit              |
| 7014f5d5 | BUILD     | ORIENTATION  | artifact_retrieval      |
| 8266082f | BUILD     | KNOWLEDGE    | methodology_design      |
| 9b4de140 | KNOWLEDGE | RESEARCH     | quick_answer            |
| a395f427 | BUILD     | RESEARCH     | tool_discovery          |

## Key Findings

### 1. BUILD accuracy at micro+brains = absolute zero

All 9 BUILD-classified sessions were wrong. This batch is 100% micro scale, 100% brains CWD. The combination is a perfect predictor of BUILD misclassification. No session had a single Edit or Write call. The rule "brains/ CWD + micro scale = never BUILD" is now confirmed across 50+ instances.

### 2. Numbered question batch pattern

Sessions 4b687f88, c6d033a1, dff3317d, and 04170faf share a distinctive pattern: prompts start with numbered items (e.g., "2. ...", "4. ...", "5. ..."). These are individual questions from a pre-prepared list that the user dispatched to separate Claude sessions, likely from a `/ralphy`-style coordinated batch. Sessions c6d033a1 and 04170faf ask the _same question_ ("What's in the upstream community folder?") — one with quotes, one without — suggesting the user ran the batch twice or the coordinator spawned duplicates.

This is a **coordinator-spawned exploration batch**: a parent session or manual list creates numbered questions, each dispatched to an independent session. AngelEye should detect this pattern via:

- Numbered prefix in first prompt
- All sessions share timestamp cluster (14:53-15:04 on 2026-03-08)
- All share CWD
- All are single-prompt micro sessions

### 3. KNOWLEDGE misclassification pattern

4/6 KNOWLEDGE sessions were wrong. The registry classifies brains/ CWD sessions as KNOWLEDGE by default, but most micro sessions from brains are actually RESEARCH (quick questions) or ORIENTATION (inventory lookups). True KNOWLEDGE requires brain file writes — only 8266082f (methodology_design) was genuinely knowledge work, and even that had zero writes.

### 4. "Home terminal" pattern dominant

6/15 sessions (40%) had incidental CWD — brains/ used as a convenient terminal for unrelated work:

- **8aab0116**: Ecamm audio troubleshooting
- **cf136be4**: Remote M2 machine exploration
- **68975bb0**: Google Antigravity IDE lookup
- **1cc41d81**: M2 remote control + screen layout
- **9b4de140**: Ecamm camera flip in Loom
- **a395f427**: Overmind + Google CLI research

All are hardware/tool questions that happen to launch from the brains terminal.

### 5. Git commit sessions are OPERATIONS, not BUILD

Two sessions (96c7dd57, 67a5a08a) are pure git commits via `/commit` skill. Both classified BUILD. A session with: single prompt containing "commit", Skill invocation, Bash-only tools, zero Edit/Write = `operations.git_commit`. This is a deterministic rule.

### 6. Voice artifacts

- **"Ralph Wiggums"** = Ralphy (380994a2) — the Simpsons character name leaks through voice transcription
- **"Overmine"** = Overmind (a395f427) — voice artifact in follow-up prompt

### 7. Self-resolution pattern

Session 9b4de140 shows user self-resolving before Claude finishes: "OK, I've found it. It's flip camera." Claude was still searching brain docs (Grep calls) when the user found the answer in the actual app. This is a micro session anti-pattern where the user's question is faster to answer by trying the software than by searching documentation.

## Predicate Summary

| Predicate                         | True | False |
| --------------------------------- | ---- | ----- |
| P01 is_feature_construction       | 0    | 15    |
| P02 has_frustration_signals       | 1    | 14    |
| P03 is_multi_phase                | 2    | 13    |
| P10 is_cwd_incidental             | 6    | 9     |
| P12 has_voice_dictation_artifacts | 2    | 13    |
| P13-P16 friction predicates       | 0    | 15    |

All other predicates (P04-P09, P11) returned false across all 15 sessions.

## Session Type Distribution

| Type                     | Count |
| ------------------------ | ----- |
| ORIENTATION              | 5     |
| RESEARCH                 | 5     |
| OPERATIONS               | 2     |
| KNOWLEDGE                | 1     |
| SYSOPS                   | 1     |
| RESEARCH (self-resolved) | 1     |

## Interest Levels

- **Medium**: 1cc41d81 (M2 setup with screen layout description), 8266082f (brain architecture design), a395f427 (multi-day tool discovery)
- **Low**: remaining 12 sessions
