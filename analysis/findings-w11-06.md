---
type: analysis
title: 'Findings W11-06'
description: 'Wave 11 Batch 06: 9 sessions, 0% BUILD accuracy; form-filling copilot, brain fission pattern, self-correcting brain via web search.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W11-06

**Wave**: 11, Batch 06
**Sessions analysed**: 9 (2 moderate, 7 light)
**Date**: 2026-03-23
**Agent**: analysis-agent W11-06 (Opus 4.6)

---

## Session Summaries

### 689892a5 — brains/dtv (moderate)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (brain_update_with_live_task)

DTV brain session spanning 70 min (26 prompts). Opens with `/focus dtv`, then user asks about TDAC (Thailand Digital Arrival Card) timing. Claude searches online via Brave and discovers its own brain had the timing wrong (said post-arrival, actually pre-arrival). Corrects brain docs. Then pivots to live form-filling assistance — user shares screenshots of the TDAC form, Claude reads them and advises on each field. Claude flip-flops on departure date field 3 times before settling on the correct approach per the visa agent's guide. Session updates 7 brain files across dtv/ and davidcruwys/.

**Key observations**:

- Novel pattern: Claude as real-time form-filling copilot, reading screenshots and advising field-by-field
- Self-correction via web search: Claude discovered and fixed its own brain's factual error
- P14 (wrong_approach): flip-flopped on departure date 3x, purpose of travel correction
- PII exposed: full name, DOB, passport number, phone numbers, residential address
- Voice artifacts: natural conversational flow throughout

### f4b02724 — brains/anthropic-claude/ralph-wiggum (moderate)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (brain_architecture)

Ralph Wiggum brain reorganisation across 21h wall time (57 min active). Opens with 5.7KB /capture-context paste from prior session. User gives 7 tasks: review 3 agent approaches, identify mismatched docs, build pros/cons, develop Ralphy direction, build documentation, create skill, test. Claude creates 7 TaskCreate operations, then autonomously writes 7 brain docs and edits 7 existing files during a 6.5h gap. After a 13h gap, user returns to commit and asks a conceptual question about Ralphy's design.

**Key observations**:

- Context handover paste as opener — 5.7KB /capture-context output
- Duplicate prompt: user sent the same task list twice (lines 6-7)
- 3 phases separated by large idle gaps (6.5h, 13h)
- Voice artifact: "Ralphi" = Ralphy, "speicifcally" = specifically

### ddd63cda — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: OPERATIONS (poem_execution)

Pure POEM workflow execution. Single prompt `*run 107` triggers 64 tool calls over 14 minutes. Read-heavy (26 reads) to load workflow definitions, then 16 Task + 14 TaskOutput calls for parallel execution. Only 1 Write for output. Zero human intervention after the initial command.

**Key observations**:

- Extreme autonomy: 1 prompt → 64 tool calls (1:64 ratio)
- POEM executor pattern confirmed — `*run` + numeric ID
- No conversational content to analyse — pure automation

### ed94c847 — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: TEST (test_implementation)

Plan-paste-then-execute session for unit test coverage on poc/wui. User pastes 5.5KB test plan specifying 150-180 tests across 7 files. Claude creates 6 test files, runs tests, user critiques AI test quality ("AI has a habit of just writing all sorts of shit and spaghetti"), specifically calls out tautological tests. Claude fixes. After 21h idle gap, user returns asking "what was this convo about" and "what does tautological mean".

**Key observations**:

- Explicit meta-frustration about AI test quality — not specific to this instance but about AI-generated tests in general
- "Tautological tests" — tests that prove nothing (self-referential assertions)
- Cross-session chain: plan references prior session transcript b33c20a2
- Form-filling pattern detected: 5.5KB plan paste + short follow-up prompts
- Day-2 return for session recall + vocabulary question

### 4f494a9c — brains (light)

**Registry type**: BUILD | **Actual type**: SYSOPS (software_installation)

MLX Whisper installation via Ansible gone wrong. User asks if Whisper is registered in Ansible/Agentic OS. Claude searches, finds it, runs `ansible-playbook site.yml --tags languages` which runs the entire languages role (Ruby, Node, Python) instead of targeted `pip install mlx-whisper`. User waits 30 minutes, diagnoses the error themselves, posts detailed breakdown of what went wrong.

**Key observations**:

- P14 (wrong_approach) confirmed: `--tags languages` instead of `pip install` caused 30-min waste
- P02 (frustration) confirmed: "I've been waiting half an hour. This should have taken 10 seconds"
- User diagnosed error, not Claude — pasted 500+ char error analysis
- 3 ToolSearch calls at start — looking for remote/Ansible tools that don't exist
- Voice artifacts: "air spool playback" = Ansible playbook, "oil change" = unclear, "M4 Min" = M4 Mini

### cb90d421 — brains (light)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (brain_creation)

Creates new `stream-decks` brain by extracting content from agentic-os and ecam brains. User wants to separate stream deck info into its own brain, mentions both Elgato Stream Deck and Ajazz Akp03 macro pad. Background Task agents research SDKs/APIs. Final phase: documentation cleanup, health check across 3 brains, commit.

**Key observations**:

- Brain fission pattern: one brain splits into two (agentic-os → agentic-os + stream-decks)
- Programmatic hardware control interest: user wants to update stream deck configs from Claude Code
- Voice artifacts: "stream dek" = stream deck, "HNDECOS" = unclear acronym, "seperate" = separate

### 5ab3c274 — brains (light)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (brain_setup_and_inbox_processing)

Todo brain setup and inbox processing. User pulls latest, reviews todo brain, adds to INDEX.md. Background Agent reviews other brains for patterns. User then dumps inbox files (r1-r6.txt) for triage — Claude reads each, does Q&A, processes into structured todo list. User reflects that todo brain is "action-oriented system, not a standardised brain".

**Key observations**:

- Inbox processing workflow: raw text files → Q&A triage → structured todo items
- User's meta-observation about brain types: action-oriented vs standardised
- 5-phase session despite being "light" (45 events)

### b3fcbf07 — brains (light)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (transcript_processing)

73KB OMI meetup transcript pasted for TIL (Today I Learned) processing. Claude processes transcript into brain file, commits, pushes. Then pivots to Obsidian .gitignore management where frustration occurs — Claude leaves untracked .obsidian folder despite being told to fix it. User exits with abrupt "x".

**Key observations**:

- File size inflation: 87KB file but only 40 events (73KB is the transcript paste)
- OMI device transcript ingestion confirmed
- P13 (misunderstood_request): Claude didn't follow through on .obsidian cleanup
- Abrupt "x" exit — frustration-driven
- Voice artifact: "Did a system yesterday" = "did a session yesterday"

### 83734245 — brains (light)

**Registry type**: BUILD | **Actual type**: SYSOPS (remote_machine_ops)

Quick 12-min session: find M4 Pro SSH details, connect remotely, check ~/images directory, rsync files between machines. Claude confused about which machine it's running on — user has to prove they're on the MacBook Pro by pasting hostname output. Session ends with unrelated VS Code question (topic drift).

**Key observations**:

- Machine identity confusion: Claude doesn't know which Mac it's on
- P13 confirmed: "How do I prove to you that I'm on the Mapbook Pro?"
- Topic drift closing: VS Code window-close question is completely unrelated
- Voice artifacts: "Mapbook Pro" = MacBook Pro, "agentico-esque being Ansible" = agentic-os brain / Ansible

---

## Cross-Session Patterns

### BUILD accuracy: 0/9 (0%)

All 9 sessions were classified BUILD by the registry. Zero are actually BUILD. Breakdown:

- KNOWLEDGE: 5 (brain_update_with_live_task, brain_architecture, brain_creation, brain_setup_and_inbox_processing, transcript_processing)
- SYSOPS: 2 (software_installation, remote_machine_ops)
- OPERATIONS: 1 (poem_execution)
- TEST: 1 (test_implementation)

This batch is 78% brains CWD — brains sessions are never BUILD. The two prompt.supportsignal sessions are also not BUILD (one is OPERATIONS, one is TEST).

### CWD incidental rate: 5/9 (56%)

Five sessions have CWD=brains/ where the actual work is in a specific subfolder or unrelated system operations. Consistent with wave 9-10 findings that brains/ is used as a "home terminal".

### Voice dictation pervasive: 8/9 (89%)

All sessions except ddd63cda (which has only a typed `*run 107` command) show voice dictation artifacts. New artifacts this wave:

- "air spool playback" = Ansible playbook
- "oil change" = unclear
- "Mapbook Pro" = MacBook Pro
- "agentico-esque being" = agentic-os brain
- "Did a system" = did a session
- "HNDECOS" = unclear acronym
- "stream dek" = stream deck

### PII exposure: 1 session (689892a5)

Full PII in dtv session: name, DOB, passport number, phone numbers (AU + TH), residential address. Consistent with wave 8-10 PII findings.

### Friction predicates

| Predicate                   | Count | Sessions                                                  |
| --------------------------- | ----- | --------------------------------------------------------- |
| P14 (wrong_approach)        | 2     | 689892a5 (TDAC flip-flop), 4f494a9c (Ansible wrong tag)   |
| P15 (buggy_output)          | 1     | ed94c847 (tautological tests)                             |
| P13 (misunderstood_request) | 2     | b3fcbf07 (.obsidian cleanup), 83734245 (machine identity) |
| P02 (frustration)           | 4     | ed94c847, 4f494a9c, b3fcbf07, 83734245                    |

### Novel patterns

1. **Form-filling copilot**: 689892a5 shows Claude reading form screenshots and advising field-by-field in real time. Not BUILD, not RESEARCH — a live assistance pattern.

2. **Self-correcting brain via web search**: Claude discovered its own brain had wrong TDAC timing and corrected it after Brave search.

3. **Brain fission**: cb90d421 splits one brain into two — extracting stream-deck content from agentic-os into a new brain. Opposite of brain creation from scratch.

4. **Inbox processing workflow**: 5ab3c274 shows a structured inbox → triage → todo pattern. Raw files dumped, Claude reads each, Q&A, then structured output.

5. **User-as-debugger of Claude's mistakes**: In 4f494a9c, user diagnosed Claude's Ansible error and pasted a detailed breakdown. Claude failed to self-correct; user did the analysis work.
