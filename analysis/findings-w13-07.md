---
type: analysis
title: 'Findings W13-07'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-07

**Wave**: W13-07 (final wave)
**Machine**: m4-mini
**Sessions analysed**: 15
**Date**: 2026-03-23

## Batch Summary

| Category           | Count | Details                                                         |
| ------------------ | ----: | --------------------------------------------------------------- |
| Ghost sessions     |     7 | Empty session_start + session_end, zero interaction             |
| Micro with prompts |     7 | 2 events each, zero tool calls (except 1 with StructuredOutput) |
| Empty (stop only)  |     1 | stop + session_end, no user prompt                              |

**BUILD accuracy**: 0/6 (0%). All 6 sessions classified BUILD by registry were reclassified. Consistent with wave 12's 2.5% for light/micro batches.

## Reclassifications

| Session ID | Registry | Reclassified | Subtype                | Reasoning                                     |
| ---------- | -------- | ------------ | ---------------------- | --------------------------------------------- |
| 685c5e36   | BUILD    | KNOWLEDGE    | cross_session_paste    | Ecamm plist handover paste, zero tool calls   |
| 801755d6   | BUILD    | RESEARCH     | quick_answer           | "Where is project FliDeck?" — single question |
| ba196fa1   | BUILD    | RESEARCH     | quick_answer           | iTerm tab bar how-to question                 |
| db87f2ac   | BUILD    | RESEARCH     | personal_advisory      | Monitor shopping report paste for review      |
| e19c5d71   | BUILD    | RESEARCH     | conceptual_exploration | OMI morning workflow brainstorming            |
| b73d5eab   | BUILD    | META         | smoke_test             | "What is 2+2?"                                |
| efc98af2   | BUILD    | RESEARCH     | quick_answer           | Apple Store vs iCloud account question        |

## Key Observations

### 1. March 17 ghost session batch (7 sessions)

Seven sessions from March 17, 2026, all from brains/ CWD, all with exactly 2 events (session_start + session_end), zero prompts, zero tool calls. Timestamps cluster tightly: 6 started between 11:56-11:58 UTC, 1 at 09:45 UTC. Durations range from 2h17m to 14h48m (time until session_end was recorded).

This looks like a batch of Claude Code instances opened simultaneously (possibly via automation or multiple terminal tabs) that were never used. The tight clustering of start times (3 sessions within 3 seconds: 11:56:41, 11:57:18, 11:57:22, 11:57:24, 11:57:26, 11:58:34) strongly suggests automated spawning — 6 sessions in under 2 minutes from the same CWD.

**Hypothesis**: These may be subagent sessions that were spawned but never received work, or background agents that failed to start. The registry correctly marked them as junk.

### 2. brains/ CWD as universal home terminal (confirmed again)

5 of 7 non-ghost sessions with prompts used brains/ as CWD. Topics covered: Ecamm Live plist editing, FliDeck project location, iTerm configuration, monitor shopping (PHP currency), OMI workflow concepts. None related to brain content. The remaining 2 used prompt.supportsignal CWD for a smoke test and an Apple Store account question.

**CWD incidental rate**: 100% (15/15). Every session in this batch had incidental CWD.

### 3. prompt.supportsignal as second home terminal

Two sessions from prompt.supportsignal.com.au CWD: one was a "2+2" smoke test, the other an Apple Store account question. Neither relates to SupportSignal. This confirms the wave 5 finding that prompt.supportsignal CWD is universally unreliable for project attribution.

### 4. Cross-session paste pattern

Session 685c5e36 contains a structured handover paste from a prior Ecamm reverse-engineering session. The paste includes Working On/Brief/Context sections — output from the /handover-pattern skill. Session db87f2ac contains a structured monitor comparison report likely produced by a prior session. Both demonstrate the cross-session continuation pattern where users paste prior output into a new terminal, but in these cases the new session never progressed beyond the paste.

### 5. Voice dictation artifacts

- "hanover" = "handover" (685c5e36)
- "Omi, or that" = "OMI or that" (e19c5d71)
- Conversational phrasing in Apple Store question (efc98af2)

### 6. Disposition breakdown

| Disposition |                                 Count |
| ----------- | ------------------------------------: |
| junk        | 9 (7 ghosts + 1 empty + 1 smoke test) |
| active      |                  6 (all low interest) |

## Friction Predicates (P13-P16)

No friction predicates fired. All sessions are micro-scale with zero or near-zero tool calls — insufficient interaction to generate friction.

## New Subtypes

| Subtype                         | Count | Evidence                                                       |
| ------------------------------- | ----: | -------------------------------------------------------------- |
| meta.ghost_session              |     7 | Empty sessions with only start/end events, zero interaction    |
| research.quick_answer           |     3 | Single-question lookups (FliDeck location, iTerm, Apple Store) |
| knowledge.cross_session_paste   |     1 | Handover paste from prior session                              |
| research.personal_advisory      |     1 | Monitor shopping report review                                 |
| research.conceptual_exploration |     1 | OMI workflow brainstorming                                     |
| meta.smoke_test                 |     1 | "2+2" test question                                            |
| meta.empty_session              |     1 | Stop + session_end, no prompt                                  |
