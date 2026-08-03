---
type: analysis
title: 'Findings W12-09'
description: 'Wave 12 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-09

**Wave**: 12, Agent 09
**Sessions analysed**: 8
**Date**: 2026-03-23
**Batch profile**: All light-scale sessions (14-15 events, 1-28 min active). 7/8 from brains/ CWD, 1 from prompt.supportsignal.

## BUILD Accuracy

**0/8 confirmed BUILD** (0%). All 8 were registry-classified as BUILD. Reclassified:

- 3x KNOWLEDGE (brain_update, brain_creation, cross_platform_capture)
- 1x RESEARCH (feature_exploration)
- 1x SYSOPS (file_organization)
- 1x OPERATIONS (poem_execution)
- 1x DEBUG (hardware_troubleshooting)

Consistent with wave 9-11 pattern: light-scale brains/ sessions are almost never BUILD.

## Key Observations

### 1. ChatGPT-to-Claude Knowledge Bridge (114c6d78)

User pasted a massive ChatGPT conversation (several thousand words about install vs clone vs degit patterns) into Claude for brain storage. This is a novel cross-platform pattern — using ChatGPT for exploration and Claude for knowledge capture. The paste was the second prompt and dwarfs all other content in the session.

### 2. P13+P14 Co-occurrence in Hardware Troubleshooting (da0932c0)

Claude misidentified a Stream Deck hotkey issue as Ecamm-related, likely because /focus ecamm context from a prior session polluted the context. User explicitly corrects: "it's not E-cam... Ctrl Shift Command 4 is taking a clipboard shot on the Mac. That's all it is." This is a context-poisoning variant — not stale docs, but stale session context influencing classification.

### 3. Agent Orchestration for Knowledge Work (c7e8d6c5)

User discovered OpenClaw brain was missing, dispatched 5 parallel Agent calls for research, then returned after a 291-minute gap to "build the brain" and commit. Good example of agent_orchestration tool_profile applied to KNOWLEDGE rather than BUILD. The Agent tool is not a BUILD signal when used for research tasks.

### 4. POEM Executor Pattern Confirmed (398e91fa)

"Execute command for 105" + "commit" — classic operations.poem_execution. 2 prompts, 13 tool calls (11 Bash + 2 Skill). Consistent with wave 11 learnings about `*run NNN` patterns.

### 5. "Close Down This Conversation" Triggers ToolSearch (ed421e41)

When user said "close down this conversation," Claude searched ToolSearch for a close/exit tool. This is a minor anti-pattern — Claude doesn't know how to end a session programmatically and tries to find a tool for it.

### 6. Loom Video Access via Playwright (7e10b733)

Playwright used to navigate to and interact with a Loom video URL. This is a distinct Playwright semantic role: **media_access** — accessing video content for documentation purposes, not UI testing or web research.

## Voice Dictation Artifacts

- "APpyStack" — capitalization artifact (114c6d78)
- "contorl" = control, "havet his" = "have this" (afc2e110)
- "And you give me a Okay" — speech disfluency (93fdc8eb)
- "E-cam" misheard as Ecamm reference (da0932c0)

## PII Observations

- Bangkok location explicitly stated (93fdc8eb): "I'm sitting in Bangkok"
- Chiang Mai location mentioned (afc2e110): "everyone in chiang mai"
- Video editor name "Jun" mentioned in pasted transcript (7e10b733)

## CWD Reliability

- 5/8 sessions had CWD=brains flagged as incidental (home terminal usage)
- 1/8 reliable brains CWD (actual brain work: 93fdc8eb)
- 1/8 reliable brains CWD with multi-phase gap (c7e8d6c5)
- 1/8 prompt.supportsignal CWD (universally unreliable per wave 5)

## Proposed New Subtypes

| Subtype                          | Session  | Signal                                          |
| -------------------------------- | -------- | ----------------------------------------------- |
| knowledge.cross_platform_capture | 114c6d78 | ChatGPT transcript pasted for brain storage     |
| research.feature_exploration     | afc2e110 | Exploring Claude Code features (remote-control) |
| sysops.file_organization         | ed421e41 | Organizing scripts into folders                 |
| debug.hardware_troubleshooting   | da0932c0 | Stream Deck hotkey issue                        |

## Session Summary Table

| Session ID | Registry | Analysed Type | Scale | Active Min | Interest |
| ---------- | -------- | ------------- | ----- | ---------- | -------- |
| 114c6d78   | BUILD    | KNOWLEDGE     | light | 14         | medium   |
| 7e10b733   | BUILD    | KNOWLEDGE     | light | 28         | medium   |
| 93fdc8eb   | BUILD    | KNOWLEDGE     | light | 4          | low      |
| afc2e110   | BUILD    | RESEARCH      | light | 1          | low      |
| ed421e41   | BUILD    | SYSOPS        | light | 1          | low      |
| 398e91fa   | BUILD    | OPERATIONS    | light | 10         | low      |
| c7e8d6c5   | BUILD    | KNOWLEDGE     | light | 24         | medium   |
| da0932c0   | BUILD    | DEBUG         | light | 20         | high     |
