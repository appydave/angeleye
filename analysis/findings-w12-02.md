---
type: analysis
title: 'Findings W12-02'
description: 'Wave 12 Batch 02: 9 light sessions, 0% BUILD accuracy; triple-store knowledge pattern + POEM *validate = OPERATIONS + recipe files not code.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-02

**Wave**: 12, Agent 02
**Sessions analysed**: 9
**Session scale**: All light (29-33 events)
**Date**: 2026-03-23

## BUILD Accuracy

**0/9 correct** (0%). All 9 sessions were classified BUILD by registry; none are genuine BUILD. This is consistent with waves 9-11 for light-scale sessions.

| Session  | Registry | Reclassified | Subtype                      |
| -------- | -------- | ------------ | ---------------------------- |
| 2ddad06e | BUILD    | KNOWLEDGE    | knowledge.advisory           |
| d1eca273 | BUILD    | KNOWLEDGE    | knowledge.brain_update       |
| faf76383 | BUILD    | KNOWLEDGE    | knowledge.brain_update       |
| 230d8859 | BUILD    | OPERATIONS   | operations.poem_execution    |
| e907c7f1 | BUILD    | KNOWLEDGE    | knowledge.methodology_design |
| 1a55ad83 | BUILD    | SYSOPS       | sysops.secret_management     |
| f45b1521 | BUILD    | SYSOPS       | sysops.tool_customization    |
| 5a85b671 | BUILD    | RESEARCH     | research.knowledge_capture   |
| 8b0fad92 | BUILD    | RESEARCH     | research.knowledge_capture   |

## Type Distribution

- KNOWLEDGE: 4 (44%)
- RESEARCH: 2 (22%)
- SYSOPS: 2 (22%)
- OPERATIONS: 1 (11%)

## Friction Predicates (P13-P16)

- P13 (misunderstood_request): 0/9
- P14 (wrong_approach): 1/9 — f45b1521 (shell script approach for Stream Deck)
- P15 (buggy_output): 1/9 — f45b1521 (screencapture returned error code 1)
- P16 (excessive_changes): 0/9

**P14+P15 co-occurrence**: f45b1521 — wrong approach (shell script wrapper) led directly to buggy output (screencapture error). Consistent with wave 8 pattern.

## Key Observations

### 1. Triple-store knowledge management pattern (d1eca273)

User explicitly teaches Claude the knowledge management system: TIL for the learning, todo/waiting for the action, memory for the pointer. This is a discovery-worthy pattern — Claude initially stored only in memory, user corrected to triple-store. Suggests a classifier or predicate for "knowledge management sophistication" — does the user guide Claude on _where_ to store knowledge?

### 2. Brain creation sessions are RESEARCH, not BUILD (5a85b671, 8b0fad92)

Two sessions create entirely new brains (prompt-patterns, n8n). Both involve web research, conceptual exploration, then Write-heavy brain file creation. Key discriminator: Write targets are `~/dev/ad/brains/` not product source code. These are research.knowledge_capture, not BUILD.

### 3. CWD incidental rate: 3/9 (33%)

Three sessions (1a55ad83, f45b1521, 230d8859 partially) had CWD completely unrelated to actual work:

- 1a55ad83: CWD=brains, work targets ~/.secrets and ~/.zshrc
- f45b1521: CWD=prompt.supportsignal, work targets ~/scripts/ (screen capture tools)
- d1eca273: CWD=brains is aligned but brains is "home terminal" for knowledge management

### 4. High autonomy ratios in light sessions

- 8b0fad92: 2 prompts → 27 tool calls (1:13.5) — n8n brain creation
- 230d8859: 4 prompts → 27 tool calls (1:6.75) — POEM validation
- Both are "user gives direction, Claude executes autonomously" patterns

### 5. POEM \*validate is OPERATIONS, not BUILD (230d8859)

`*validate` command triggers automated prompt file validation with targeted fixes. This is the POEM executor pattern confirmed in wave 11 — `*run`/`*validate`/`*execute` as first prompt = OPERATIONS.

### 6. Recipe files are not code (e907c7f1)

User explicitly corrects: "We're not actually writing code; it is just a recipe." Recipe files are prompt/documentation artifacts for AppyStack, not product code. Sessions editing recipes should be classified KNOWLEDGE or SKILL, not BUILD.

## PII Incidents

1. **1a55ad83**: Three actual API keys pasted in prompt text (APILAYER_KEY, NEWS_API_KEY, API_NINJA_KEY)
2. **d1eca273**: Email address david@ideasmen.com.au, Anthropic conversation ID
3. **2ddad06e**: Mentions Thailand costs and tech summit attendance (light personal info)

## Voice Dictation Artifacts

New artifacts from this batch:

- "secretes" = secrets
- "withink" = within
- "compuyter" = computer
- "doews" = does
- "itall reay" = "it all really"
- "strcutre" = structure

## Cross-Session References

4/9 sessions had cross-session references:

- d1eca273: Prior feature-flag diagnosis session
- faf76383: Prior dotfiles setup session
- e907c7f1: Prior recipe review session (output pasted as input)
- 1a55ad83: Prior secrets cleanup session

Pattern: Light sessions frequently reference prior work, either to continue it or integrate its output. This batch has a 44% cross-session rate, higher than typical.
