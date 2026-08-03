---
type: analysis
title: 'Findings W12-03'
description: 'Wave 12 Batch 03: 9 light sessions, 0% BUILD accuracy; severe auto-load (11 pre-prompt edits), proxy interaction + skill as type signal.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-03

**Wave**: 12, Agent 03
**Sessions analysed**: 9
**Date**: 2026-03-23
**Machine**: m4-mini

## Batch Profile

All 9 sessions are light scale (27-29 events each). 7/9 have CWD `brains/`. 1 is from `prompt.supportsignal.com.au`. All are classified BUILD in the registry.

**BUILD accuracy**: 0/9 (0%). Every session was reclassified. This is consistent with the established pattern: micro/light sessions from brains CWD are almost never BUILD.

## Reclassification Summary

| Session  | Registry | Reclassified | Subtype                     |
| -------- | -------- | ------------ | --------------------------- |
| 4a9592bd | BUILD    | ORIENTATION  | morning_triage              |
| 1700f3ec | BUILD    | RESEARCH     | quick_answer_multi_topic    |
| 40800809 | BUILD    | KNOWLEDGE    | personal_advisory           |
| 58cabc6b | BUILD    | KNOWLEDGE    | brain_update                |
| f0b56d1d | BUILD    | RESEARCH     | workflow_design             |
| f9c47d5e | BUILD    | KNOWLEDGE    | brain_update                |
| 46f37ad0 | BUILD    | SYSOPS       | developer_support           |
| 2a247732 | BUILD    | KNOWLEDGE    | brain_refresh_and_synthesis |
| 74d062d8 | BUILD    | KNOWLEDGE    | brain_creation              |

**Type distribution**: KNOWLEDGE 5/9, RESEARCH 2/9, ORIENTATION 1/9, SYSOPS 1/9.

## Key Observations

### 1. CLAUDE.md Auto-Load Anti-Pattern (f9c47d5e)

Session f9c47d5e is the most severe unauthorized edit case seen in this batch: 11 Edit calls, 9 Read calls, 4 Bash calls, 1 Grep, and 1 Write — all before the user's first prompt. The user only contributed 2 prompts in the entire 28-event session. The CLAUDE.md auto-load triggered Claude to proactively update bmad-method brain files without being asked. User's dismissive closing ("if there's anything that you can add in to help me get moving, then fine; otherwise, let's close") suggests the auto-edits were unwelcome. P08 (unauthorized_edits) and P16 (excessive_changes) co-fire.

### 2. Brains as Home Terminal (1700f3ec)

Session 1700f3ec is a pure home-terminal pattern: 12 prompts across 5 unrelated topics (timezone conversion, macOS desktops, Chrome split view, HammerMoon project, DTV dates). CWD is brains but no single topic relates to brain content management. This validates the established rule: brains CWD + light scale + multiple unrelated topics = CWD incidental.

### 3. PII Density in Personal Advisory Sessions

Two sessions contain significant PII:

- **40800809**: Full border run booking with email (david@ideasmen.com.au), phone numbers (Thai and Australian), nationality, booking ID, visa type, pickup details, service provider contact info. Names reversed in booking system (first=Cruwys, last=David).
- **4a9592bd**: OMI transcript references Phil's health conditions (fractured arm, osteoporosis, scoliosis), David's black eye, border run booking details.

PII scrubbing would need to handle pasted third-party content (booking confirmations) not just voice dictation artifacts.

### 4. Proxy Interaction Pattern (46f37ad0)

Session 46f37ad0 shows David troubleshooting on behalf of Angela — getting her Claude Code auth token working on Windows/WSL. This is the "proxy interaction" pattern: David is not the end user of the changes, he's mediating. Includes extensive paste of terminal output showing EADDRINUSE errors and npm failures. The session type is SYSOPS (developer_support), not BUILD, even though it's in a product repo.

### 5. High Autonomy Ratios in Brain Work

Three sessions show notable autonomy ratios:

- **58cabc6b**: 3 prompts, 25 tool calls (1:8.3) — brain restructuring
- **74d062d8**: 4 prompts, 23 tool calls (1:5.8) — brain creation
- **f9c47d5e**: 2 prompts, 26 tool calls (1:13) — brain update (inflated by unauthorized edits)

Brain work naturally has high autonomy because the user gives a direction and Claude executes across multiple files.

### 6. Write-Then-Open Pattern (2a247732)

Session 2a247732 demonstrates the write-then-open delivery pattern: Claude writes `bmad-agents-presentation.html` (572 lines) then immediately opens it in the browser via `Bash: open`. This is a brain content delivery mechanism, not code execution.

### 7. Skill Invocation as Session Type Signal

Two sessions open with skill invocations that predict type:

- `/radar` (4a9592bd) → ORIENTATION.morning_triage
- `/focus bmad-method-v6` + `/refresh-bmad-brain` (2a247732) → KNOWLEDGE.brain_refresh_and_synthesis

This confirms the wave 1 finding: specific skills predict session type better than generic "has skills" signal.

## Voice Dictation Artifacts

| Artifact                                       | Intended                   | Session  |
| ---------------------------------------------- | -------------------------- | -------- |
| "Hammer Moon"                                  | HammerMoon                 | 1700f3ec |
| "Tahoe"                                        | macOS Tahoe                | 1700f3ec |
| "I've firstly just worked with the SSH Claude" | grammatical voice artifact | f0b56d1d |

## New Subtypes Proposed

| Subtype                               | Count | Signal                                               |
| ------------------------------------- | ----- | ---------------------------------------------------- |
| orientation.morning_triage            | 1     | /radar + OMI fetch + todo reads                      |
| research.quick_answer_multi_topic     | 1     | 4+ unrelated topics, home terminal CWD               |
| knowledge.personal_advisory           | 1     | Booking paste + travel research + brain updates      |
| knowledge.brain_update                | 2     | Edit-heavy on existing brain files                   |
| research.workflow_design              | 1     | Exploring new workflow approaches, TIL write         |
| sysops.developer_support              | 1     | Troubleshooting for another person (proxy)           |
| knowledge.brain_refresh_and_synthesis | 1     | Upstream repo sync + HTML synthesis + SOURCES update |
| knowledge.brain_creation              | 1     | New brain folder created with multiple files         |

## Friction Predicates (P13-P16)

| Predicate                   | Firings | Notes                           |
| --------------------------- | ------- | ------------------------------- |
| P13 (misunderstood_request) | 0       | No misunderstandings            |
| P14 (wrong_approach)        | 0       | No wrong approaches             |
| P15 (buggy_output)          | 0       | No code output to be buggy      |
| P16 (excessive_changes)     | 1       | f9c47d5e: 11 unauthorized edits |

P15 zero is expected — no sessions produced code. P16 fired once, co-occurring with P08 (unauthorized_edits).
