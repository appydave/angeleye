---
type: analysis
title: 'Findings W14-08'
description: 'Wave 14-08: 12 M4 Pro sessions (Feb–Mar 2026) — session analysis batch with type-distribution table.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave W14-08 (M4 Pro, 12 sessions)

**Analysed**: 2026-03-23
**Machine**: M4 Pro (macbook-pro-m4)
**Sessions**: 12
**Date range**: 2026-02-28 to 2026-03-21

---

## Session Summary

| #   | Session ID (short) | Project      | Type       | Subtype                     | Scale    | Interest |
| --- | ------------------ | ------------ | ---------- | --------------------------- | -------- | -------- |
| 1   | 4c94c66c           | appydave.com | BUILD      | build.ui_design             | heavy    | medium   |
| 2   | bd82fee9           | brains       | KNOWLEDGE  | knowledge.meetup_notes      | heavy    | high     |
| 3   | 22ce5acf           | fligen       | BUILD      | build.ralphy_prep           | moderate | medium   |
| 4   | 6d72dffc           | flideck      | BUILD      | build.ralphy_campaign       | moderate | high     |
| 5   | 49ab9cca           | joy-juice    | BUILD      | build.paperclip_agent       | light    | high     |
| 6   | 9a414caa           | brains       | OPERATIONS | operations.support_triage   | light    | low      |
| 7   | 9a74135b           | brains       | SYSOPS     | sysops.alias_fix            | micro    | low      |
| 8   | f284c141           | brains       | RESEARCH   | research.quick_answer       | micro    | low      |
| 9   | 29258a0d           | angeleye     | SYSOPS     | sysops.remote_check         | micro    | low      |
| 10  | a4a3f472           | Dropbox      | OPERATIONS | operations.disk_audit       | micro    | low      |
| 11  | 6fd01a80           | x            | RESEARCH   | research.tooling_discovery  | micro    | low      |
| 12  | a9ddc0f8           | davidcruwys  | OPERATIONS | operations.personal_support | micro    | low      |

## Type Distribution

- BUILD: 4 (33%) — ui_design, ralphy_prep, ralphy_campaign, paperclip_agent
- OPERATIONS: 3 (25%) — support_triage, disk_audit, personal_support
- RESEARCH: 2 (17%) — quick_answer, tooling_discovery
- KNOWLEDGE: 1 (8%) — meetup_notes
- SYSOPS: 2 (17%) — alias_fix, remote_check

## Scale Distribution

- heavy: 2 (appydave.com design, meetup notes)
- moderate: 2 (fligen ralphy prep, flideck ralphy campaign)
- light: 2 (joy-juice paperclip agent, OMI discord triage)
- micro: 6 (alias fix, quick answer, remote check, disk audit, nvidia question, Apple Care)

## Registry Type Mismatches

8 of 12 sessions had registry type `BUILD` but were actually different:

| Session  | Registry | Actual     | Why                                        |
| -------- | -------- | ---------- | ------------------------------------------ |
| bd82fee9 | BUILD    | KNOWLEDGE  | Live meetup note-taking, brain file writes |
| 9a414caa | TEST     | OPERATIONS | Discord navigation for OMI support         |
| 9a74135b | BUILD    | SYSOPS     | Alias configuration fix                    |
| f284c141 | TEST     | RESEARCH   | Quick tool name lookup                     |
| 29258a0d | BUILD    | SYSOPS     | Remote machine check                       |
| a4a3f472 | BUILD    | OPERATIONS | Disk usage check                           |
| 6fd01a80 | BUILD    | RESEARCH   | Nvidia NeMo script question                |
| a9ddc0f8 | BUILD    | OPERATIONS | Apple Care support question                |

**Pattern**: The registry's classifier over-applies BUILD and TEST. Sessions with zero code writes, zero file edits, or purely conversational Q&A are being typed as BUILD. The classifier likely defaults to BUILD when no strong signal for another type is present.

## Key Findings

### 1. Paperclip Orchestration System Observed (high interest)

Session `49ab9cca` is a **Paperclip agent** — machine-initiated with an agent UUID identity assignment: "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work." This is the first Paperclip agent session observed on M4 Pro. The agent ran autonomously for 8 minutes with 51 tool calls (17 reads, 6 web searches, 6 fetches, 3 writes) in the joy-juice project (Beauty & Joy brand). This confirms the Paperclip orchestration system is running production workloads.

### 2. Ralphy Campaign Lifecycle — Exemplary Execution (high interest)

Session `6d72dffc` (FliDeck) demonstrates a complete Ralphy Wiggum campaign lifecycle in 26 active minutes:

- Picked up next-round-brief from previous campaign
- Launched 2 parallel agents for B049+B051 and B050
- Tests grew from 107 to 137
- Quality audit caught a **critical vacuous assertion** (not.toContain checking for a value that was never present in the test data)
- Fixed both critical and high findings
- Wrote assessment, updated backlog with 4 new items (B057-B060)

This is the cleanest campaign execution pattern seen so far.

### 3. Live Meetup Note-Taking Pattern (high interest)

Session `bd82fee9` reveals David's real-time knowledge capture workflow during an "Agents in the Wild" meetup:

- Live note-taking about orchestration frameworks (tmux-ide, dumx, paperclip, conductor, symphony)
- Immediate web searches for tools mentioned by speakers
- Brain file updates in real-time during the talk
- Side exploration (PARA method, Chrome MCP discovery)
- Frustration about Claude remote control feature flag
- Session spans overnight — resumed next day for follow-up

### 4. CWD Incidental Pattern on M4 Pro

5 of 12 sessions have incidental CWD (brains/ or home dir used as "wherever the terminal was open"). This is consistent with the M4 Pro being David's primary interactive machine where he asks questions from whatever terminal is open.

### 5. Unauthorized Edit Flagged

In session `bd82fee9`, David explicitly called out an unauthorized edit: "why did you update something, I asked a question I did not give a directive and you did a focus which was odd." This is a real-world occurrence of the `unauthorized_edit_before_prompt` antipattern, though it was an edit triggered by a question (not before a prompt).

### 6. Voice/Dictation Artifacts

Multiple sessions show voice dictation or fast-typing artifacts:

- "angents" (agents), "searhc" (search), "cooordination" (coordination)
- "sola agent or whatever I use for 4seas events" — casual spoken recall
- "here3" (here), "idenitify" (identify)
- Long conversational prompts about design preferences (appydave.com session)

## New Subtypes Proposed

- `build.ui_design` — HTML/CSS mockup generation with visual review (Playwright screenshots)
- `build.ralphy_prep` — Auditing docs/planning artifacts to prepare for Ralphy Wiggum campaigns
- `build.ralphy_campaign` — Autonomous Ralphy campaign execution with parallel agents
- `build.paperclip_agent` — Machine-initiated Paperclip orchestration agent session
- `knowledge.meetup_notes` — Live note-taking during meetup/event with immediate brain writes
- `operations.support_triage` — Navigating support channels (Discord, forums) for issue resolution
- `operations.disk_audit` — Checking disk usage, storage allocation
- `operations.personal_support` — Personal non-dev support questions (Apple Care, travel, etc.)
- `sysops.alias_fix` — Fixing shell alias/config issues
- `sysops.remote_check` — SSH check of remote machine setup

## M4 Pro Machine Profile

The M4 Pro is David's primary interactive workstation:

- Heavy design work (Playwright visual review loops)
- Live meetup capture with real-time brain writes
- Ralphy campaign execution (both prep and run)
- Paperclip agent execution
- Lots of incidental CWD sessions (quick questions from wherever)
- Voice dictation artifacts common
- Date range shows consistent daily use
