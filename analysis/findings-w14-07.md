---
type: analysis
title: 'Findings W14-07'
description: 'Wave 14-07: 12 M4 Pro sessions — appydave-tools and beauty-and-joy BUILD marathons, brains research, two Paperclip agent sessions.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14-07

**Wave**: W14-07
**Agent**: W14-07
**Machine**: m4-pro
**Sessions analysed**: 12
**Date**: 2026-03-23

## Batch Summary

This batch covers 12 sessions from the M4 Pro machine spanning 2026-02-28 to 2026-03-21. The batch has a strong **appydave-tools + brains + beauty-and-joy** concentration with two notable BUILD marathons and several knowledge/research sessions. Two Paperclip agent sessions appear — a new automated agent pattern on the M4 Pro.

| Session ID (short) | Project        | Type        | Scale    | Events | Active Min | Date   |
| ------------------ | -------------- | ----------- | -------- | ------ | ---------- | ------ |
| 7c057849           | appydave-tools | BUILD       | heavy    | 185    | 203        | Mar 19 |
| 33ae070f           | beauty-and-joy | MIXED       | heavy    | 133    | 104        | Mar 13 |
| 1069ccfa           | brains         | KNOWLEDGE   | moderate | 96     | 64         | Mar 20 |
| f81a13e8           | appydave-tools | BUILD       | moderate | 76     | 67         | Mar 19 |
| 750b65f9           | brains         | SYSOPS      | light    | 57     | 26         | Mar 18 |
| 832fc6c9           | joy-juice      | OPERATIONS  | light    | 43     | 4          | Mar 21 |
| 96efd99c           | brains         | RESEARCH    | light    | 25     | 31         | Mar 19 |
| d4af1182           | brains         | BUILD       | light    | 21     | 2          | Mar 20 |
| 1102015f           | home           | ORIENTATION | micro    | 11     | 24         | Feb 28 |
| 3ff73857           | flihub         | ORIENTATION | micro    | 7      | 5          | Mar 02 |
| f52cbaa0           | joy-juice      | OPERATIONS  | micro    | 4      | 4          | Mar 21 |
| adfc1ade           | brains         | ORIENTATION | micro    | 2      | 1          | Mar 21 |

## Session Details

### 1. 7c057849 — appydave-tools BUILD marathon (heavy)

**Type**: BUILD — build.feature_wave
**Scale**: heavy (185 events, 20 prompts, 203 active minutes, 5 idle gaps > 1h)
**Duration**: 762 minutes wall clock (12.7 hours) across multiple work windows

David selected "Extend — plan the next wave using inherited AGENTS.md knowledge" and then drove a multi-phase build campaign on appydave-tools. The session hit context compaction and resumed. Prompts are almost entirely directional ("go", "yes", "go for it", "option b") indicating Claude was driving the implementation plan.

**Key signals**:

- 57 Edit, 26 Write, 22 Agent calls — heavy construction with subagent delegation
- 10 Skill invocations (likely ralphy/coding skills)
- Asked "are you running inside of ralphy loops or regular multi agent plans?" — awareness of execution modes
- "we are at 69% should we push forward" — tracking context usage mid-session
- Context compaction detected — session survived and continued
- CWD reliable (appydave-tools throughout)

**Classification justification**: Massive edit/write volume with Agent delegation across a full-day session. This is feature construction at scale. Not PLANNING — actual code was being written and edited.

### 2. 33ae070f — beauty-and-joy Joy Juice menu + research (heavy)

**Type**: MIXED — mixed.research_and_build
**Scale**: heavy (133 events, 24 prompts, 104 active minutes)

David worked on the Joy Juice business venture — building a menu, researching Thai vs foreigner ingredients, running background agents for competitor research (Chiang Mai juice shops), building an HTML shop layout, creating factsheets, and processing OMI voice transcripts from a conversation with Gerard and Joy.

**Key signals**:

- 17 WebSearch — extensive research phase on ingredient sourcing and competitors
- 20 Edit, 6 Write — HTML layout and JSON menu construction
- CronCreate + CronDelete — ran and stopped a background polling loop
- "run shoplayout html in chrome" — visual UI prototyping
- "where would you want me to put raw convo from omi" — OMI transcript ingestion
- Compaction detected — long session that hit context limits
- Bilingual content (English + Thai)

**Classification justification**: Cannot be pure BUILD (too much web research) or pure RESEARCH (actual HTML/JSON artifacts built). The session oscillates between ingredient research, menu JSON construction, HTML prototyping, and OMI transcript processing. MIXED is correct.

### 3. 1069ccfa — brains meetup knowledge capture (moderate)

**Type**: KNOWLEDGE — knowledge.meetup_capture
**Scale**: moderate (96 events, 17 prompts, 64 active minutes, 2 idle gaps)

David captured knowledge from the "Agents in the Wild" Friday meetup (March 20). Session started with "what are the meetup groups I goto each week" then moved into real-time note-taking: Telegram bot release, Open Viking (context database by ByteDance/VolcEngine), Manus agent. David asked Claude to download OpenViking upstream for evaluation and to persist findings to brain files.

**Key signals**:

- 8 brave_web_search — researching tools mentioned at meetup (OpenViking, ByteDance, competitors)
- 26 Bash — downloading repos, checking git status, connecting remotes
- "Are there things I learned that should go, should be saved away?" — explicit knowledge persistence request
- "Can you connect them please? Everything." — git push/pull operations
- "Can you have a look at my locations file? We're looking at remote repos" — cross-project git sync
- Final prompt: "What was this conversation about? Can we be closed now?" — closing ceremony

**Classification justification**: Session is primarily about capturing external knowledge from a meetup into brain files, with web research to fill gaps. The Bash calls are for git operations and repo downloads, not code construction. KNOWLEDGE, not BUILD.

### 4. f81a13e8 — appydave-tools Ralphy preparation (moderate)

**Type**: BUILD — build.infrastructure
**Scale**: moderate (76 events, 6 prompts, 67 active minutes, 0 idle gaps)

David prepared the appydave-tools project for future Ralphy Wiggum loops by auditing AGENTS.md, populating learnings from completed campaign assessments, updating mock patterns, and fixing BACKLOG.md. Then asked for a baseline commit and to load coding skills (code quality, unit testing, architecture).

**Key signals**:

- form_filling detected (3,780-char first prompt, 80% short follow-up ratio)
- 12 Edit, 4 Write — doc and config updates
- 3 Skill invocations — loading coding quality skills
- 3 Agent calls — subagent delegation for assessment work
- 7 search_without_read detections — scanning project structure

**Classification justification**: Despite being doc-heavy, this is infrastructure BUILD — updating AGENTS.md, BACKLOG.md, and skill configuration are foundational changes that enable future build sessions. The commit request confirms intent to persist changes.

### 5. 750b65f9 — brains git sync and angeleye setup (light)

**Type**: SYSOPS — sysops.git_sync
**Scale**: light (57 events, 10 prompts, 26 active minutes)

David looked for an updated locations.json file, pulled brains repo, searched for the file in various locations, connected to M4 Mini via SSH/Tailscale, pulled angeleye and thumbrack repos, and tried to start angeleye.

**Key signals**:

- 29 Bash, 5 TaskOutput — git pull/push, SSH, process management
- "can we look at what needs to be synched (ie git pulled)" — multi-repo sync
- "can you use ssh to look at the m4-mini?" — cross-machine operations
- "can you start angeleye please" — service startup
- workspace_id present — launched from a workspace context

**Classification justification**: Pure systems operations — git syncing, repo discovery, cross-machine SSH, service startup. Zero code construction. SYSOPS, not BUILD.

### 6. 832fc6c9 — joy-juice Paperclip agent (light)

**Type**: OPERATIONS — operations.paperclip_agent
**Scale**: light (43 events, 1 prompt, 4 active minutes)

Automated Paperclip agent session. Prompt: "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work." 38 Bash calls in 4 minutes with CronCreate — this is a scheduled/automated agent running maintenance tasks on the joy-juice project.

**Key signals**:

- Single automated prompt (agent ID + directive)
- 38 Bash, 0 Read/Edit/Write — pure operational scripting
- CronCreate detected — set up a scheduled task
- 2 Skill invocations

**Classification justification**: Automated agent, not human-driven. OPERATIONS with paperclip_agent subtype. Not BUILD — no feature construction, just operational scripts.

### 7. 96efd99c — brains Blotato research (light)

**Type**: RESEARCH — research.tool_evaluation
**Scale**: light (25 events, 4 prompts, 31 active minutes)

David saw a YouTube thumbnail about "Claude + Blotato = content machine with 9 social channels" and asked what Blotato is. Session involved 8 web searches researching the tool, then writing findings to brain files.

**Key signals**:

- 8 brave_web_search — core research activity
- 3 Write, 3 Edit — persisting findings
- 1 Agent call
- Registry correctly typed as RESEARCH

**Classification justification**: Pure tool evaluation research triggered by content discovery. Web-search-heavy with brain file writes. RESEARCH is correct.

### 8. d4af1182 — brains continued brain editing (light)

**Type**: BUILD — build.brain_maintenance
**Scale**: light (21 events, 1 prompt, 2 active minutes)

Single-prompt continuation session ("continue") that read 9 files and made 6 edits. Likely a compaction resume from a previous session that was editing brain files. TaskList tool used — suggests this was working from a checklist.

**Key signals**:

- "continue" as sole prompt — resumption pattern
- 9 Read, 6 Edit — editing existing brain content
- TaskList tool — working through a structured plan
- 2 active minutes — quick continuation burst

**Classification justification**: Editing brain files per a task list. Light BUILD for brain maintenance. The edits are constructive (not just reading), but the session is too small and focused to be anything higher.

### 9. 1102015f — home web search testing (micro)

**Type**: ORIENTATION — orientation.tool_testing
**Scale**: micro (11 events, 4 prompts, 24 active minutes)

David tested whether Claude Code could do web searches. First prompt: "How is this working? Can you do an actual search online? This is fucked." CWD is home directory — not project-specific.

**Key signals**:

- 4 Bash, 2 brave_web_search, 1 Skill
- Frustration signal in prompt
- CWD = home directory — tool capability testing, not project work
- Feb 28 — earliest session in batch

**Classification justification**: Testing web search capability. Not BUILD (zero code, zero project). ORIENTATION / tool testing.

### 10. 3ff73857 — flihub POEM WUI question (micro)

**Type**: ORIENTATION — orientation.question
**Scale**: micro (7 events, 3 prompts, 5 active minutes)

David asked about the brand config in POEM WUI (brand config "not loaded" message). Read 2 files, 1 Agent call, 1 Write. Very short Q&A about how brand config works in FliHub.

**Key signals**:

- 2 Read, 1 Write, 1 Agent — minimal
- Question-driven: "How do we load it? Where does it belong?"
- Registry says BUILD but this is a quick question session

**Classification justification**: 7 events, question-driven, 5 minutes. This is ORIENTATION / cold_start question, not BUILD. The registry BUILD classification is wrong.

### 11. f52cbaa0 — joy-juice Paperclip agent (micro)

**Type**: OPERATIONS — operations.paperclip_agent
**Scale**: micro (4 events, 1 prompt, 4 active minutes)

Same Paperclip agent pattern as 832fc6c9 but earlier (March 21 06:30 vs 15:41). Only 2 Bash calls and 1 Skill invocation. Minimal automated check-in.

**Key signals**:

- Same agent ID (27231022-d305-4069-a16a-472c98259e33)
- Same "Continue your Paperclip work" prompt
- Paired with 832fc6c9 — two runs of the same automated agent on the same day

**Classification justification**: Automated agent. OPERATIONS / paperclip_agent. Not BUILD.

### 12. adfc1ade — brains info dump (micro)

**Type**: ORIENTATION — orientation.info_dump
**Scale**: micro (2 events, 2 prompts, 1 active minutes)

David pasted a massive info dump (43,389 chars) asking "what brain would you relate it to?" — includes Chrome version info, DevTools output, and content from another session. Zero tools used. Session ended immediately after.

**Key signals**:

- 0 tool calls — purely conversational
- 43KB prompt — massive paste
- Zero tools = never BUILD (rule enforced)
- 1 minute duration

**Classification justification**: Zero tools, huge info paste, immediate end. ORIENTATION / info dump. Not BUILD despite registry classification.

## Cross-Batch Observations

### 1. Paperclip Agent Pattern (new for M4 Pro)

Two sessions (832fc6c9, f52cbaa0) show the same automated "Paperclip" agent running on the joy-juice project. Same agent ID, same prompt template, both on March 21 at different times (06:30 and 15:41). This is a scheduled agent pattern — likely a cron/loop running periodic maintenance on the Joy Juice project. Worth tracking as a new OPERATIONS subtype.

### 2. AppyDave-Tools Ralphy Campaign

Sessions f81a13e8 and 7c057849 form a chain: f81a13e8 (01:20-02:28) prepared the Ralphy infrastructure, then 7c057849 (02:28-15:11) ran the actual build campaign. The second session picked up exactly where the first left off (within seconds). This is a deliberate session-chain pattern — preparation session followed by execution session.

### 3. Registry Misclassifications

The registry classified all 12 sessions as BUILD (or RESEARCH for 96efd99c). Several are clearly wrong:

- **750b65f9**: BUILD -> SYSOPS (git sync operations)
- **1102015f**: BUILD -> ORIENTATION (tool testing)
- **3ff73857**: BUILD -> ORIENTATION (quick question)
- **adfc1ade**: BUILD -> ORIENTATION (zero tools, info dump)
- **832fc6c9**: BUILD -> OPERATIONS (automated agent)
- **f52cbaa0**: BUILD -> OPERATIONS (automated agent)

This confirms the heuristic-based registry classifier over-applies BUILD on the M4 Pro machine.

### 4. Beauty & Joy / Joy Juice Cluster

Three sessions touch the Joy Juice business: 33ae070f (menu research + build), f52cbaa0 (Paperclip agent), 832fc6c9 (Paperclip agent). The main session (33ae070f) is a rich MIXED session covering ingredient research, competitor analysis, HTML prototyping, JSON menu building, and OMI transcript processing — a real business planning + execution hybrid.

### 5. Brains Project Diversity

Four sessions in brains (1069ccfa, 96efd99c, d4af1182, adfc1ade) span KNOWLEDGE, RESEARCH, BUILD, and ORIENTATION — confirming that CWD=brains is the most unreliable project signal. The brains directory hosts knowledge capture, tool research, brain editing, and info dumps. Each needs individual classification.
