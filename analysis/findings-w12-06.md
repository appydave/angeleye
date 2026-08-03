---
type: analysis
title: 'Findings W12-06'
description: 'Wave 12 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-06

**Wave**: 12, Agent 06
**Sessions analysed**: 9
**Scale distribution**: 9 light (100%)
**Date range**: 2026-02-22 to 2026-03-23

---

## BUILD Accuracy

**Registry BUILD count**: 5/9 (55%)
**Confirmed BUILD**: 0/9 (0%)
**BUILD accuracy**: 0%

All 5 BUILD-classified sessions were reclassified: 2 to KNOWLEDGE/OPERATIONS (brain work), 1 to OPERATIONS (config update), 1 to PLANNING (backlog triage), 1 to RESEARCH (data retrieval). Pattern is consistent with established finding that light/micro sessions are almost never BUILD.

## Session Type Distribution (after reclassification)

| Type        | Count | Sessions                                            |
| ----------- | :---: | --------------------------------------------------- |
| RESEARCH    |   2   | 6d7eb255 (quick_answer), 131d186c (data_retrieval)  |
| OPERATIONS  |   2   | a1f083ac (config_update), 32d200a1 (morning_triage) |
| KNOWLEDGE   |   1   | d3392871 (brain_update)                             |
| PLANNING    |   1   | 423e8bf2 (backlog_triage)                           |
| ORIENTATION |   1   | fe9cd78c (artifact_retrieval)                       |
| REVIEW      |   1   | 518bde06 (code_review)                              |
| MIXED       |   1   | fb9d73f9 (triage_then_retrieval)                    |

## Key Observations

### 1. brains/ CWD is incidental in 4/5 sessions

Five sessions had CWD=brains. In 4 of 5, the CWD was incidental:

- **6d7eb255**: Web research about agentic loops (not brain work)
- **a1f083ac**: Editing ~/.config/appydave/locations.json (jump aliases)
- **131d186c**: FliHub video data queries via Bash
- **fe9cd78c**: CWD=prompt.supportsignal but asking about Ralphy skill capabilities

Only **d3392871** (Hammerspoon brain update) and **32d200a1** (morning triage targeting brains/todo/) were CWD-reliable.

### 2. /radar as morning triage signal

Two sessions (32d200a1, fb9d73f9) open with `/radar`. Both are OPERATIONS.morning_triage — read todo files, present dashboard, accept voice disposition, update files. This is a confirmed classifier rule: `/radar` as first prompt = `operations.morning_triage`.

### 3. Skill self-documentation gap (fe9cd78c)

User loaded Ralphy skill and asked "what can he do?" Claude searched the filesystem instead of using the loaded skill's self-knowledge. User frustrated: "Still missing the point, I loaded Ralphy in. It's Ralphy here." This reveals a gap where skills need a `describe yourself` or `help` capability that surfaces modes/commands from the loaded skill context rather than filesystem search.

### 4. Factual accuracy pressure in social context (6d7eb255)

User researching agentic loop attribution to share with someone — "be 100% clear because I've got to tell someone and I can't look like a dick." Claude mixed up Clayton and Geoff. Social accountability creates higher-stakes accuracy requirements that Claude doesn't adapt to.

### 5. BMAD code review abandoned before execution (518bde06)

User launched /bmad-dev, then 5 hours later invoked /bmad-code-review for story 1.1. Claude gathered full context (57 files, ~2975 lines diff) and asked for approval. User never responded. The 5-hour gap suggests context switch — user may have forgotten about the session.

### 6. Voice dictation artifacts

- "file destruction" = "file distinction" (423e8bf2)
- "Deccan" = "DeckHand" (32d200a1)
- "Claude border" = "Laos border" (32d200a1)
- "t-dac" = "TDAC" (32d200a1)
- "thumb jump" / "thumbrack" = "ThumbRack" (a1f083ac)

### 7. PII detected

- **32d200a1**: Border run booking ID (287212160), phone numbers (0612986974, 0931318546), email (chiangmaiborderrun@gmail.com), personal travel plans with dates
- **fb9d73f9**: Names of friends/family (David Kaff, Joy, MJ/Jan, Mary)
- **6d7eb255**: No PII but social context reference

## Friction Predicates Summary

| Predicate                   | Fired | Sessions                     |
| --------------------------- | :---: | ---------------------------- |
| P13 (misunderstood_request) |   3   | 6d7eb255, a1f083ac, fe9cd78c |
| P14 (wrong_approach)        |   1   | fe9cd78c                     |
| P15 (buggy_output)          |   2   | 6d7eb255, 131d186c           |
| P16 (excessive_changes)     |   0   | —                            |

P13 most common — consistent with wave 11 findings. P14+P13 co-occurrence in fe9cd78c (skill self-documentation gap) is the most interesting friction pattern in this batch.

## Proposed New Subtypes

| Subtype                     | Session  | Signal                                     |
| --------------------------- | -------- | ------------------------------------------ |
| research.quick_answer       | 6d7eb255 | Short Q&A + web search, no file output     |
| research.data_retrieval     | 131d186c | CLI tool queries for structured data       |
| mixed.triage_then_retrieval | fb9d73f9 | /radar + OMI fetch in single 2-min session |
| planning.backlog_triage     | 423e8bf2 | Scope separation + handover note creation  |
| review.code_review          | 518bde06 | /bmad-code-review skill invocation         |

## Session Quality Notes

All 9 sessions are light scale. No marathon or heavy sessions. No context compactions. All are voice-dictated. Average active time: 6 minutes. Average event count: 19.2. This batch represents the "quick interaction" end of the session spectrum.
