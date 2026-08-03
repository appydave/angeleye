---
type: analysis
title: 'Findings W13-01'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 13-01

**Agent**: W13-01 | **Machine**: m4-mini | **Date**: 2026-03-23
**Sessions analysed**: 15 | **Scale**: 2 micro, 13 light
**Registry BUILD accuracy**: 0/10 (0%) — all 10 BUILD-classified sessions were wrong

## Summary

All 15 sessions are light or micro scale (10-14 events each). 10 were registry-classified BUILD, 1 KNOWLEDGE, 1 was unclassified/junk (appydave-plugins), 3 were unclassified/junk. Reclassification breakdown:

| Reclassified Type | Count | Sessions                                         |
| ----------------- | :---: | ------------------------------------------------ |
| RESEARCH          |   5   | fc0ceca1, 5a107ae5, d06d6b2e, 1ebe977c, d78d93af |
| KNOWLEDGE         |   2   | 425f12e3, 2bf774b0                               |
| PLANNING          |   2   | 24f5b175, 7e1a0189                               |
| ORIENTATION       |   2   | c074ec68, f0e46e28                               |
| OPERATIONS        |   1   | b08754c2                                         |
| SKILL             |   1   | e9c7e45c                                         |
| META              |   1   | f1aee1fc                                         |

BUILD accuracy 0% confirms the wave 12 finding: BUILD classifier is useless at light/micro scale.

## Key Observations

### 1. brains/ CWD is universally incidental at light scale

9 of 15 sessions had CWD = brains/. Of these:

- 6 were CWD-incidental (work targeted other projects or was unrelated)
- 3 were CWD-reliable (actual brain file work: 425f12e3 knowledge update, 38ae9203 transcript ingestion, b08754c2 git commit)

Rule confirmed: brains/ CWD + light scale = never BUILD. CWD reliability depends on whether brain file writes occur.

### 2. Voice artifacts in this batch

| Artifact                  | Intended                     | Session  |
| ------------------------- | ---------------------------- | -------- |
| "a cam live"              | Ecamm Live                   | 5a107ae5 |
| "A year's remote control" | "What is remote control?"    | 1ebe977c |
| "pro-sport"               | "pro support"                | 1ebe977c |
| "Lizada"                  | Lazada                       | d06d6b2e |
| "SoloDeck"                | solo-deck (or FliDeck skill) | 24f5b175 |
| "Dirt"                    | disk                         | d78d93af |

Session 1ebe977c has the most severe garbling — "A year's remote control" is nearly unrecognizable.

### 3. Cross-session paste as evidence (e9c7e45c)

The Ralphy skill fix session (e9c7e45c) demonstrates a specific cross-session pattern: user pastes 19.6K chars of error output from a prior session as evidence to justify a skill change. This is not continuation or handover — it is "bug report via session paste". The fix added a human review gate (principle #12) to prevent Ralphy from autonomously removing worktrees.

This is the third confirmed instance of a "corrective followup" session chain (first noted in wave 7).

### 4. Transcript ingestion as knowledge workflow (38ae9203)

Session 38ae9203 has a 99.6K char paste (Cole Medin "Second Brain" workshop transcript) — the largest prompt in this batch. File size is 103K despite only 11 events. This confirms the wave 1b finding that file size is noise — event count and active minutes are the reliable complexity signals.

Also notable: 2 unauthorized edits detected before the transcript paste. CLAUDE.md auto-load may have triggered edits to brain files before the user spoke.

### 5. Strategic planning session with P13 (7e1a0189)

Session 7e1a0189 is the richest in this batch despite being light-scale (13 events). The 5.6K char opening is a stream-of-consciousness about AppyStack upgrade strategy, Mochaccino skill design, and UX workflow philosophy. User explicitly says "You're not meant to take action."

P13 fired: Claude asked shallow questions instead of researching first. User corrected: "every question you've asked me required you to actually do deep research before coming back." This is the "depth mismatch" P13 variant identified in wave 10.

Multi-phase with 2 idle gaps (4h and 1.5h), spanning 390 min wall clock but only 30 min active.

### 6. Registry junk classification needs review

3 sessions marked junk in registry (e9c7e45c, f1aee1fc, d78d93af):

- e9c7e45c: Genuine SKILL.bug_fix — Ralphy worktree fix. Should NOT be junk.
- f1aee1fc: Confirmed junk — AngelEye hook smoke test.
- d78d93af: Genuine micro RESEARCH session (Claude Code skills/plugins Q&A). Should NOT be junk.

Registry junk classification is too aggressive at micro/light scale — 2/3 junk-marked sessions in this batch were genuine.

## Predicates Summary

| Predicate                         | True | False | Notable                                                    |
| --------------------------------- | :--: | :---: | ---------------------------------------------------------- |
| P01 is_feature_construction       |  0   |  15   | Zero features built — confirms not BUILD                   |
| P02 has_frustration_signals       |  4   |  11   | 5a107ae5, 7e1a0189, 1ebe977c, e9c7e45c                     |
| P03 is_multi_phase                |  1   |  14   | Only 7e1a0189 (strategic planning with idle gaps)          |
| P04 has_brain_file_writes         |  2   |  13   | 425f12e3, 38ae9203                                         |
| P06 has_cross_session_refs        |  2   |  13   | e9c7e45c (error paste), f0e46e28 ("last time")             |
| P07 has_skill_gap_signal          |  1   |  14   | 24f5b175 (3 ToolSearch for FliDeck skills)                 |
| P08 has_unauthorized_edits        |  1   |  14   | 38ae9203 (pre-prompt edits)                                |
| P10 is_cwd_incidental             |  7   |   8   | 47% CWD-incidental rate                                    |
| P12 has_voice_dictation_artifacts |  8   |   7   | 53% voice artifact rate                                    |
| P13 has_misunderstood_request     |  1   |  14   | 7e1a0189 (depth mismatch)                                  |
| P14 has_wrong_approach            |  0   |  15   |                                                            |
| P15 has_buggy_output              |  0   |  15   |                                                            |
| P16 has_excessive_changes         |  0   |  15   | Consistent with wave 11: P16 only fires at moderate+ scale |

## New Subtypes Proposed

| Subtype                             | Session  | Evidence                                            |
| ----------------------------------- | -------- | --------------------------------------------------- |
| research.framework_survey           | fc0ceca1 | Web search for AI prompt frameworks                 |
| planning.handover_preparation       | 24f5b175 | Producing handover document for another project     |
| research.troubleshooting            | 5a107ae5 | Desktop app behavior troubleshooting                |
| planning.strategic_design           | 7e1a0189 | Multi-project strategic planning with UX philosophy |
| research.hardware_purchase          | d06d6b2e | Personal hardware research and purchase planning    |
| research.feature_exploration        | 1ebe977c | Exploring Claude Code remote control feature        |
| knowledge.transcript_ingestion      | 38ae9203 | Workshop transcript paste → brain file creation     |
| knowledge.documentation_improvement | 2bf774b0 | Improving usage instructions for POEM workflows     |
| skill.bug_fix                       | e9c7e45c | Fixing Ralphy skill worktree removal behavior       |
| operations.git_commit               | b08754c2 | Git housekeeping — commit all unstaged files        |
| research.quick_answer               | d78d93af | Quick Q&A about Claude Code internals               |
