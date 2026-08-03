---
type: analysis
title: 'Findings W5 Micro'
description: 'Wave 5 micro: taxonomy of 9 micro sessions (1–4 events each) — classifying very short Claude Code session patterns.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# W5-micro Findings: Micro Session Taxonomy

**Wave**: W5-micro
**Date**: 2026-03-22
**Sessions analysed**: 9 (all micro scale, 1-4 events each)

## Purpose

Classify 9 micro sessions to understand the taxonomy of very short Claude Code sessions. Are they all junk, or do some serve a real purpose?

## Summary

Of 9 micro sessions:

- **3 are junk** (test prompts, empty prompts, accidental opens)
- **3 are genuine orientation** (quick questions about project structure/tooling)
- **1 is a conceptual question** (worktree learning)
- **1 is a quick utility lookup** (timezone conversion)
- **1 is an automated heartbeat** (machine-initiated, not human)

Micro sessions are NOT uniformly junk. They split into three meaningful categories:

### Category 1: Genuine Quick Questions (4 sessions)

These are one-shot orientation or research queries where the user got their answer quickly:

- S1: "What projects do I have?" -- project inventory orientation
- S2: "Do we have Dynamous community transcripts?" -- asset location search
- S4: "Where is the folder for AI-gentive" -- file path lookup
- S7: "How do I run this bin server" -- startup command lookup

These are valuable signals: they reveal what the user is trying to find, which projects they are about to work on, and where knowledge gaps exist.

### Category 2: Non-Project Quick Lookups (2 sessions)

- S3: Value Canvas timezone conversion -- used Claude as a calculator, not a coding tool
- S6: Worktree conceptual question -- learning about Claude Code features, CWD is incidental

### Category 3: Junk / Test / Machine (3 sessions)

- S5: "What is 2+2?" -- smoke test of Claude Code itself
- S8: HEARTBEAT check -- automated/machine-initiated, not human workflow
- S9: Prompt "x" from /private/tmp -- accidental or test launch

## Per-Session Analysis

### S1: c6f3306c-4602-4f55-a726-2cb578d581ba

- **Prompt**: "What projects do I have?"
- **Events**: 1 (prompt only, no tool use in JSONL -- but registry shows last_active 25min later, so Claude likely responded outside the captured window)
- **Classification**: ORIENTATION / project_inventory_query
- **Opening**: keyword_orientation (short question)
- **Closing**: abrupt_abandon (single event captured)
- **Disposition**: active -- genuine orientation question
- **Interest**: low -- common exploratory query
- **Notes**: CWD is brains/, user asking about project inventory. Likely voice-dictated given informality.

### S2: 2cda33b1-2e35-46e5-91ac-180101ad0233

- **Prompt**: "Do we have Dynamous community transcripts?"
- **Events**: 3 (prompt + Glob + Bash)
- **Classification**: RESEARCH / asset_search
- **Opening**: conceptual_question
- **Closing**: abrupt_abandon (no explicit close)
- **Tool profile**: search_heavy (Glob + Bash to find files)
- **Disposition**: active -- genuine asset location query
- **Interest**: medium -- shows what content David is looking for
- **Notes**: search_without_read detected (found files but did not read them). Quick lookup completed.

### S3: 0adf7bf5-841f-485e-87b9-19cc4fbe39dd

- **Prompt**: "Value Canvas Session... what time is this in Bangkok"
- **Events**: 1 (prompt only)
- **Classification**: ORIENTATION / quick_utility
- **Opening**: context_loading_paste (pasted meeting details + question)
- **Closing**: abrupt_abandon
- **Disposition**: active -- legitimate utility use, but CWD is incidental
- **Interest**: low -- timezone math, not a coding task
- **Notes**: CWD is brains/ but the question has nothing to do with brains. Classic "use Claude as a calculator" pattern.

### S4: 71f1b899-a1db-4c58-abc3-2f5192bbbbd6

- **Prompt**: "Where is the folder for the AI-gentive"
- **Events**: 4 (prompt + Skill + Bash + Bash)
- **Classification**: ORIENTATION / project_path_lookup
- **Opening**: keyword_orientation (voice-dictated, note "AI-gentive" likely means "AIgentive")
- **Closing**: abrupt_abandon
- **Tool profile**: operational_scripting (Skill invocation + Bash to locate folder)
- **Disposition**: active -- genuine path lookup
- **Interest**: medium -- voice dictation artifact ("AI-gentive" for "AIgentive"), skill invocation present
- **Notes**: The misspelling suggests voice dictation. Skill was invoked (likely jump/location skill). This is a precursor to actually working in that project.

### S5: 827700ca-3734-481a-9c40-6a8327322518

- **Prompt**: "What is 2+2? Reply with just the number."
- **Events**: 1 (prompt only)
- **Classification**: META / smoke_test
- **Opening**: conceptual_question
- **Closing**: abrupt_abandon
- **Disposition**: junk -- connectivity/capability test
- **Interest**: low -- no useful signal
- **Notes**: Classic smoke test pattern. CWD is SupportSignal but question is unrelated.

### S6: 18f1a890-0453-4da6-b359-15cf90a19cbd

- **Prompt**: "When you're using a work tree Does that mean you can be coding multiple projects at the same time..."
- **Events**: 1 (prompt only)
- **Classification**: RESEARCH / conceptual_learning
- **Opening**: voice_dictation (sentence structure, capitalization pattern)
- **Closing**: abrupt_abandon
- **Disposition**: active -- genuine learning question about Claude Code features
- **Interest**: medium -- shows David learning worktree concepts
- **Notes**: CWD is SupportSignal but question is about Claude Code in general. Voice-dictated based on phrasing.

### S7: 4a151d10-a257-4cab-93d4-04f4af675a05

- **Prompt**: "how do i run this bin server or something"
- **Events**: 2 (prompt + Glob)
- **Classification**: ORIENTATION / startup_command_lookup
- **Opening**: keyword_orientation (informal, voice-dictated)
- **Closing**: abrupt_abandon
- **Tool profile**: search_heavy (Glob to find bin/server files)
- **Disposition**: active -- genuine "how do I start this" question
- **Interest**: low -- routine project onboarding
- **Notes**: CWD is ad-agent_architecture. search_without_read detected. Vague phrasing suggests David is unfamiliar with this project's structure.

### S8: 1d35b92b-149f-438f-964e-0dc5291ab32a

- **Prompt**: HEARTBEAT check (10,294 chars of automated prompt)
- **Events**: 4 (prompt + 3x Bash)
- **Classification**: META / automated_heartbeat
- **Opening**: bare_task_ref (machine-generated prompt)
- **Closing**: abrupt_abandon
- **Tool profile**: operational_scripting (Bash x3 for system checks)
- **Disposition**: active -- legitimate automated monitoring, not junk, but not human-initiated
- **Interest**: high -- shows the Dynamous heartbeat system in action; useful for understanding David's automated workflows
- **Notes**: CWD is brain-dynamous. The prompt contains full email/calendar/Asana/Slack context. This is Project Theodore / Dynamous automation. Registry misclassified as BUILD.

### S9: 7536c619-1622-43cd-88ba-06d39e16731a

- **Prompt**: "x"
- **Events**: 1 (single-char prompt, no tools)
- **Classification**: META / accidental_launch
- **Opening**: bare_task_ref
- **Closing**: abrupt_abandon
- **Disposition**: junk -- accidental or test launch from /tmp
- **Interest**: low -- no signal
- **Notes**: Registry already marked is_junk: true. CWD is /private/tmp.

## Taxonomy of Micro Sessions

| Pattern                    | Count | Disposition | Example                            |
| -------------------------- | ----- | ----------- | ---------------------------------- |
| Quick orientation question | 3     | active      | "What projects do I have?"         |
| Asset/file search          | 1     | active      | "Do we have Dynamous transcripts?" |
| Conceptual learning        | 1     | active      | worktree question                  |
| Quick utility (non-coding) | 1     | active      | timezone conversion                |
| Automated heartbeat        | 1     | active      | HEARTBEAT check                    |
| Smoke test                 | 1     | junk        | "What is 2+2?"                     |
| Accidental launch          | 1     | junk        | "x" from /tmp                      |

## Key Observations

1. **Micro sessions are NOT uniformly junk**. 6 of 9 serve a genuine purpose, even if brief.
2. **Voice dictation is common** in micro sessions (S1, S4, S6, S7 all show voice artifacts).
3. **CWD is frequently incidental** for micro sessions -- the user opens Claude wherever they happen to be and asks an unrelated question.
4. **Registry over-classifies as BUILD** -- all 9 sessions were tagged BUILD or had no session_type, but none are actually building anything.
5. **The HEARTBEAT session is taxonomically unique** -- it is machine-initiated, not human. This needs a separate subtype.
6. **"Precursor" sessions exist** -- S1, S4, S7 are likely followed by a real work session in the located project. Cross-session linking could reveal these chains.

## Proposed New Subtypes

- `smoke_test` (C02) -- "What is 2+2?" pattern, testing Claude itself
- `automated_heartbeat` (C02) -- machine-initiated monitoring check
- `accidental_launch` (C02) -- single-char or empty prompt from temp directory
- `quick_utility` (C02) -- using Claude for non-coding calculations/conversions
- `project_inventory_query` (C02) -- "what projects do I have" orientation
- `startup_command_lookup` (C02) -- "how do I run this" orientation
- `conceptual_learning` (C02) -- learning about tools/concepts, no project work
- `asset_search` (C02) -- quick search for specific files/content
