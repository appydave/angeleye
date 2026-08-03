---
type: analysis
title: 'Findings W13-03'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-03

**Wave**: W13-03 (final wave)
**Agent**: W13-03
**Machine**: m4-mini
**Sessions analysed**: 15
**Date**: 2026-03-23

## Batch Summary

| Metric                       | Value                      |
| ---------------------------- | -------------------------- |
| Sessions                     | 15                         |
| All micro scale              | 15/15 (100%)               |
| BUILD registry correct       | 0/13 BUILD-classified (0%) |
| ORIENTATION registry correct | 1/1 (100%)                 |
| KNOWLEDGE registry correct   | 0/1 (0%)                   |
| CWD incidental               | 12/15 (80%)                |

## Reclassifications

| Session  | Registry    | Reclassified | Subtype                                  |
| -------- | ----------- | ------------ | ---------------------------------------- |
| 5ba97324 | BUILD       | KNOWLEDGE    | knowledge.brain_update                   |
| c9a2b938 | BUILD       | OPERATIONS   | operations.commit_and_push               |
| f13f37d7 | BUILD       | RESEARCH     | research.personal_advisory               |
| f32c2e8e | KNOWLEDGE   | ORIENTATION  | orientation.artifact_retrieval           |
| c3e2d2ab | BUILD       | ORIENTATION  | orientation.agent_discovery              |
| 39f1499d | BUILD       | SYSOPS       | sysops.port_kill_and_restart             |
| 0b1581a3 | BUILD       | RESEARCH     | research.quick_answer                    |
| 28d72fc9 | BUILD       | RESEARCH     | research.quick_answer                    |
| 51929fd8 | BUILD       | RESEARCH     | research.quick_answer                    |
| bd175156 | BUILD       | RESEARCH     | research.personal_advisory               |
| 46bc7a34 | BUILD       | OPERATIONS   | operations.poem_execution                |
| 6d0c282d | BUILD       | DEBUG        | debug.payload_error                      |
| c8419c47 | ORIENTATION | ORIENTATION  | orientation.artifact_retrieval (correct) |
| f6bcb2f9 | BUILD       | ORIENTATION  | orientation.agent_discovery              |
| db654757 | BUILD       | ORIENTATION  | orientation.artifact_retrieval           |

**BUILD accuracy: 0% (0/13)**. Every BUILD-classified session in this batch was wrong. Consistent with established pattern: micro sessions are never BUILD.

## Key Findings

### 1. Numbered Question Series (sessions 0b1581a3, 51929fd8, 28d72fc9)

Three sessions share a pattern: numbered questions ("1. Do we have Dynamous community transcripts?", "3. How did we download those Zoom recording transcripts last time?", "4. What's in the upstream community folder?"). All from brains/ CWD within 15 minutes of each other (2026-03-08 14:53-15:08). User is running through a checklist of questions, one per new session. This is a "rapid-fire Q&A" workflow — separate sessions for each question rather than a multi-turn conversation.

This pattern means session chains are not always continuation/verification. Sometimes they are parallel independent questions from a shared mental checklist.

### 2. Duplicate Agent Discovery Queries (sessions c3e2d2ab, f6bcb2f9)

Two sessions with identical prompt "who are my agents" from the same CWD (prompt.supportsignal), 3 days apart (Feb 20 vs Feb 23). User has a recurring need to discover available agents but has no persistent reference. This is a skill/tool gap — a `/agents` command or persistent agent inventory would eliminate these sessions.

### 3. Google Results Paste as Context (session bd175156)

User pasted a full Google search results page (complete with links, "People also ask" sections, and location data) into the session, followed by a full website landing page. Claude acts as a product evaluation advisor. This creates a PII risk — the Google results page revealed the user's location (Suthep, Mueang Chiang Mai District, Thailand).

### 4. POEM Executor Confirmation (session 46bc7a34)

Another `*execute 105` session confirming the POEM executor pattern. 4 Bash calls before the user prompt are CLAUDE.md auto-load activity. The actual user intent is a single command. This further validates the classifier rule: `*run/*execute NNN` as first prompt = `operations.poem_execution`.

### 5. Port-Kill Recurring Pattern (session 39f1499d)

EADDRINUSE on port 5040 for prompt.supportsignal WUI. Claude's fix: `lsof -ti:5040,5041 | xargs kill -9`. This is the same port-kill pattern noted in wave 6 as an automation candidate. Still happening manually via Claude session.

### 6. task-notification Inflating Prompt Counts (session 39f1499d)

The second "user_prompt" in session 39f1499d is a `<task-notification>` XML callback from a background task killed after 12h idle. This is machine-generated, not human intent. Confirms wave 7 learning: task-notification prompts inflate user_prompt counts.

### 7. Cross-Session Workflow Recall (session 51929fd8)

"How did we download those Zoom recording transcripts last time?" — user trying to repeat a prior workflow but can't find the method. search_without_read=3 (Grep found nothing). This is a knowledge persistence gap: successful workflows should be auto-captured for retrieval.

## Predicate Summary

| Predicate                   | True | False | Null |
| --------------------------- | ---- | ----- | ---- |
| P01 is_feature_construction | 0    | 15    | 0    |
| P02 has_frustration_signals | 0    | 15    | 0    |
| P03 is_multi_phase          | 2    | 13    | 0    |
| P04 has_brain_file_writes   | 1    | 14    | 0    |
| P05 has_playwright_calls    | 0    | 15    | 0    |
| P06 has_cross_session_refs  | 2    | 13    | 0    |
| P07 has_skill_gap_signal    | 0    | 15    | 0    |
| P08 has_unauthorized_edits  | 0    | 15    | 0    |
| P09 is_compaction_resume    | 0    | 15    | 0    |
| P10 is_cwd_incidental       | 12   | 3     | 0    |
| P13 misunderstood_request   | 0    | 15    | 0    |
| P14 wrong_approach          | 0    | 15    | 0    |
| P15 buggy_output            | 0    | 15    | 0    |
| P16 excessive_changes       | 0    | 15    | 0    |

P13-P16 all zero — micro sessions have no friction. Too small for misunderstandings to develop.

## Session Type Distribution

| Type        | Count |
| ----------- | ----- |
| ORIENTATION | 5     |
| RESEARCH    | 5     |
| OPERATIONS  | 2     |
| KNOWLEDGE   | 1     |
| SYSOPS      | 1     |
| DEBUG       | 1     |

## Voice Artifacts Observed

- "ai-gentive" = AIgentive (session 5ba97324)
- "I want you to:" prefix = voice dictation stutter/correction (session c8419c47)
- "forrets" = Forrest (visible in Google results paste, session bd175156)

## PII Incidents

- Session bd175156: Google results page reveals user location (Suthep, Mueang Chiang Mai District, Chiang Mai, Thailand)
- PII rate: 1/15 (6.7%) — consistent with wave 12 average
