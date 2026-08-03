---
type: analysis
title: 'Findings W13-06'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-06

**Wave**: W13-06 (Final wave)
**Machine**: m4-mini
**Agent**: W13-06
**Sessions analysed**: 15
**Date**: 2026-03-23

## Summary Statistics

- **BUILD accuracy**: 0/15 (0%) — all 15 reclassified
- **Session scale**: 100% micro (all 15 sessions have exactly 3 events)
- **CWD breakdown**: 12 brains/, 3 prompt.supportsignal.com.au
- **CWD incidental rate**: 8/15 (53%)
- **Tool usage**: 6 sessions with zero tool calls, 9 with 1-2 tools
- **Voice dictation artifacts**: 5 sessions with clear STT markers

## Reclassification Breakdown

| Original | Reclassified To | Count |
| -------- | --------------- | ----- |
| BUILD    | RESEARCH        | 6     |
| BUILD    | KNOWLEDGE       | 3     |
| BUILD    | ORIENTATION     | 2     |
| BUILD    | META            | 1     |
| BUILD    | PLANNING        | 1     |
| BUILD    | SETUP           | 1     |
| BUILD    | SYSOPS          | 1     |

## Key Observations

### 1. Ecamm camera troubleshooting pair (51572c0a + f3eb1614)

Two separate micro sessions about the same issue (Ecamm Live virtual camera not appearing) but in different apps — Loom (51572c0a) and Zoom (f3eb1614). Same user, same brains/ CWD, ~5 hours apart (March 9). The Zoom session includes explicit frustration ("I'm getting really irritated"). This is a **recurring frustration session pair** — the Loom session didn't resolve the issue, so user returned with the Zoom variant.

### 2. Cross-platform knowledge bridge (c050ece0)

Most interesting session in the batch. User pastes a 9.1KB meta-prompt (likely from ChatGPT or another AI) with XML-tagged `<before>` and `<meta>` sections. Asks Claude to improve it using its knowledge of the user's brain system. Third prompt provides a detailed brain category table with 8 categories and ~30 brains. This is the **second confirmed cross-platform paste** pattern (first was wave 12's ChatGPT bridge). Context: video content preparation — user explicitly mentions "demonstrating it in a video."

### 3. Cross-session paste as opener (70839e20)

8.5KB paste of a prior session's full output (Ralph Wiggum slide creation for AppyStack presentation assets). User asks for a "simple fact sheet." The paste includes Write operations, file contents, and detailed slide descriptions. Voice artifact in the JSONL: "Raft Loop" = "Ralph Loop."

### 4. Skill installation micro-session (ccc516fb)

Two-prompt approach to skill installation: first prompt is bare "skill" (possibly testing if a /skill command exists), second is the full CLI command "claude skill install vercel-labs/agent-browser." This is a distinct **setup.skill_installation** subtype — using Claude as a CLI proxy.

### 5. Garbled voice = junk (e61f2f74)

First prompt is garbled profanity ("Fuckin' news, Mac Jones content cunt"), second is off-topic ("I don't use mac os contacts"), third is "x" (exit attempt). This is speech-to-text garbling, not intentional input. The profanity is STT artifact, not frustration. Classified meta.accidental/junk.

### 6. Advisory for colleague (59187b8e)

User asks which brains Angela (SupportSignal NDIS) would find useful. PII exposure: person name + employer + platform (Windows). Three conversational prompts, zero tools. This is **knowledge.advisory** — using Claude as a consultant about the brain system's applicability.

### 7. Worktree cleanup (c635ecd1)

Pre-worktree hygiene check: "Do we have anything we need to clean up in work trees?" Voice duplication artifact: "They They all have been closed off." Single Bash call to check. Classified sysops.worktree_cleanup.

## Friction Predicates (P13-P16)

- **P13 (misunderstood_request)**: 0/15 — micro sessions too short for misunderstandings
- **P14 (wrong_approach)**: 0/15 — too short
- **P15 (buggy_output)**: 0/15 — too short
- **P16 (excessive_changes)**: 0/15 — too short

All friction predicates are null/not-applicable at micro scale. Confirms wave 11 finding that micro sessions need different quality gates.

## Voice Artifacts Catalog

| Artifact                             | Intended                             | Session  |
| ------------------------------------ | ------------------------------------ | -------- |
| wWhy                                 | Why                                  | 51572c0a |
| They They                            | They                                 | c635ecd1 |
| Raft Loop                            | Ralph Loop                           | 70839e20 |
| Fuckin' news, Mac Jones content cunt | (garbled — intended meaning unclear) | e61f2f74 |

## Patterns Confirmed

1. **brains/ CWD + micro scale = never BUILD**: 12/12 brains sessions reclassified. 0% BUILD accuracy.
2. **prompt.supportsignal CWD is unreliable**: 3/3 prompt.supportsignal sessions reclassified (RESEARCH, SYSOPS, META).
3. **Zero tool calls = never BUILD**: 6 sessions with zero tools, all reclassified (ORIENTATION, KNOWLEDGE, RESEARCH, META).
4. **Micro sessions are taxonomically diverse**: 7 different parent types across 15 micro sessions.
5. **Cross-platform paste is a recurring pattern**: Second confirmed instance of ChatGPT-to-Claude knowledge bridge.

## Subtypes Proposed

| Subtype                          | Session                                | Confidence        |
| -------------------------------- | -------------------------------------- | ----------------- |
| research.quick_answer            | 51572c0a, f3eb1614, 67214bf9, fb21d52e | Confirmed (N=10+) |
| knowledge.advisory               | 59187b8e                               | Confirmed (N=3+)  |
| knowledge.methodology_design     | c050ece0                               | Confirmed (N=2+)  |
| knowledge.cross_paste_extraction | 70839e20                               | New (N=1)         |
| research.data_audit              | 960d0e52                               | New (N=1)         |
| setup.skill_installation         | ccc516fb                               | New (N=1)         |
| sysops.worktree_cleanup          | c635ecd1                               | New (N=1)         |
| orientation.memory_probe         | 3d89ae80                               | Confirmed (N=2+)  |
| orientation.artifact_retrieval   | 31d61d6c                               | Confirmed (N=6+)  |
| planning.feature_ideation        | 5a21fa39                               | New (N=1)         |
| meta.accidental                  | e61f2f74                               | Confirmed (N=3+)  |

## PII Incidents

1. **59187b8e**: Person name (Angela) + employer (SupportSignal) + platform (Windows)
2. **960d0e52**: Incident data discussion may reference real NDIS participant data
