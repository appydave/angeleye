---
type: analysis
title: 'Findings W14-09'
description: 'Wave 14-09: 12 M4 Pro sessions spanning ~1 month — batch splits into four clusters.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings: W14-09 (M4 Pro)

**Wave**: W14-09
**Machine**: m4-pro
**Sessions analysed**: 12
**Date range**: 2026-02-28 to 2026-03-21
**Analysed**: 2026-03-23

## Summary

12 sessions from the M4 Pro machine spanning nearly a month. The batch divides into four clusters:

1. **Joy Juice marathon** (f88bdf54) — a 3-day, 59-prompt session combining research, data modelling, and HTML prototyping for Joy's fruit juice shop
2. **FliDeck feature batch** (8cfe93cb) — dense 47-minute build session executing tasks 45-47
3. **Paperclip agent cluster** (62241047, 03794369, 41134e14, 37c90199) — 4 automated agent sessions for Joy Juice
4. **Infrastructure/micro sessions** (45d583fe, 040ccd41, 011e5205, 56dce8ac, 27aab661, fc3fd142) — provisioning, website scaffold, alias setup, SSH lookups

## Type Distribution

| Type        | Count | Sessions                                                               |
| ----------- | ----- | ---------------------------------------------------------------------- |
| BUILD       | 3     | 8cfe93cb (flideck), 040ccd41 (appydave.com), fc3fd142 (appydave-tools) |
| MIXED       | 1     | f88bdf54 (beauty-and-joy)                                              |
| OPERATIONS  | 4     | 62241047, 03794369, 41134e14, 37c90199 (all Paperclip agent JJ)        |
| SYSOPS      | 1     | 45d583fe (M4 Pro provisioning)                                         |
| ORIENTATION | 2     | 011e5205 (worktree question), 56dce8ac (SSH lookup)                    |
| SETUP       | 1     | 27aab661 (jump alias generation)                                       |

## Registry Misclassifications

All 12 sessions were classified as BUILD in the registry. 9 of 12 are misclassified:

- **f88bdf54**: Registry BUILD -> MIXED (research + data modelling + prototyping + visual QA across 3 days)
- **45d583fe**: Registry BUILD -> SYSOPS (Ansible provisioning, brew installs, SSH verification)
- **62241047, 03794369, 41134e14**: Registry BUILD -> OPERATIONS (autonomous Paperclip agent runs)
- **37c90199**: Registry BUILD -> OPERATIONS (agent liveness ping, zero tools)
- **011e5205**: Registry BUILD -> ORIENTATION (worktree investigation, zero writes)
- **56dce8ac**: Registry BUILD -> ORIENTATION (SSH lookup, 2 Bash commands)
- **27aab661**: Registry BUILD -> SETUP (jump alias generation)

**Pattern**: The M4 Pro registry appears to classify everything as BUILD regardless of actual activity. This is a systematic bias worth investigating.

## Session Details

### f88bdf54 — Joy Juice Marathon (MIXED, heavy)

**Project**: beauty-and-joy | **Duration**: 3 days (224 active min) | **Events**: 169

Marathon session for Joy's fruit juice shop in Thailand. Spans research (Thai fruit pricing, GrabFood commission at 30%), data modelling (ingredient costs JSON, recipe schema), HTML prototyping (bilingual menu cards, Mochaccino mockups x20), and Playwright visual QA (16 events).

Key moments:

- GrabFood pricing analysis ("how much do you charge to lose 30% and still make 60 baht")
- Bilingual form creation (Thai/English toggle)
- Frustration: server connection issues, navigation stuck on sub-pages, missing language toggle
- Skill gap discovery: David tested which design skills exist — Adapt/Animate/Polish are not real; only frontend-design and impeccable are valid
- "Mary, the Method Man" reference (BMAD persona)
- Session handover pattern: reads session-handover-2026-03-19.md from prior session
- Compacted once, then continued with summary resume

### 8cfe93cb — FliDeck Feature Batch (BUILD, heavy)

**Project**: flideck | **Duration**: 47 min | **Events**: 122

Most concentrated build session in the batch. Three numbered tasks (45, 46, 47) executed sequentially with 11 Agent subagent calls for parallel work. 112 tool uses in 47 minutes (2.4 tools/min). Clean flow — David's responses are terse confirmations ("yes", "y", "Go for it", "Looks good", "Okay, do the next round"). No frustration signals. Exemplary task-list-driven BUILD session.

### 45d583fe — M4 Pro Provisioning (SYSOPS, moderate)

**Project**: agent-os (CWD=brains, misleading) | **Duration**: 59 active min | **Events**: 91

Ansible-driven provisioning of the M4 Pro machine. 55 Bash commands for system discovery, brew installs, Postgres removal, Tailscale/SSH verification.

Key frustration: Claude initially worked on the wrong machine (M4 Mini instead of M4 Pro), triggering strong language ("We made sure that you fucking know where it is. Look for it yourself. Seriously."). Also couldn't find the Ansible directory despite brain docs. Later phase verified SSH connectivity to M4 Mini from M4 Pro.

CWD=brains is misleading — actual work is agent-os Ansible provisioning.

### fc3fd142 — AppyDave Tools Refactoring (BUILD, moderate)

**Project**: appydave-tools | **Duration**: 70 min | **Events**: 74

Disciplined plan-then-execute refactoring. David triggered a "background check" on a scope issue, then "write plan", then systematic execution via 5 Agent subagents producing 25 Edits. Numbered option selection pattern (David typed "4", "3" to choose options). Clean flow, no frustration.

### Paperclip Agent JJ Cluster (OPERATIONS x4)

**Sessions**: 62241047 (52 events), 03794369 (24), 41134e14 (20), 37c90199 (1)

Four automated sessions for the Paperclip agent named "JJ" working on Joy Juice. All open with the same prompt: "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work."

The largest (62241047) used TodoWrite x11 for task tracking. The smallest (37c90199) is a liveness ping ("Respond with hello.") with zero tools — classified as junk.

This is the first clear evidence of automated agent orchestration on M4 Pro. The Paperclip system dispatches named agents that pick up where they left off.

### 040ccd41 — AppyDave.com Website Scaffold (BUILD, light)

**Project**: appydave.com | **Duration**: 7 min | **Events**: 41

Quick website page generation — 8 Write calls creating pages from prior context. David reminded about worktree usage. Playwright used for preview (install + 2 navigations). "Mary, the Method Man" reference again.

### 011e5205 — FliHub Worktree Question (ORIENTATION, micro)

**Project**: flihub | **Duration**: 3 min | **Events**: 10

David asked "Why do we have work trees?" — pure investigation with 8 read-only Bash commands. Zero writes.

### 56dce8ac — SSH Lookup (ORIENTATION, micro)

**Project**: brains (CWD misleading) | **Duration**: <1 min | **Events**: 5

Single question: "how do we ssh into the m4-mini" — 2 Bash commands.

### 27aab661 — Jump Alias Generation (SETUP, micro)

**Project**: brains (CWD misleading) | **Duration**: <1 min | **Events**: 3

David tried `japp-angeleye` alias (not found), ran `jump generate aliases`, pasted 10K chars of terminal output.

## New Patterns Observed

### Paperclip Agent Orchestration

First sighting of automated multi-session agent dispatch on M4 Pro. The "Paperclip" system creates named agents (JJ) that resume work across sessions. This creates a classification challenge: these are OPERATIONS.agent_execution, not BUILD, despite the registry labelling them BUILD.

### M4 Pro Registry Bias

All 12 sessions classified as BUILD in the registry. Only 3 actually are BUILD. The M4 Pro registry classifier appears to default to BUILD, unlike the M4 Mini which shows more type diversity.

### CWD Unreliability at brains/

Three sessions had CWD=brains but were doing something else entirely (Ansible provisioning, SSH lookups, alias generation). The brains/ directory appears to be a common "launch point" on M4 Pro.

### Skill Gap Testing

In the Joy Juice session, David explicitly tested which design skills exist. Found that Adapt, Animate, and Polish are not real skills — only frontend-design and impeccable are valid. This suggests a need for a skill inventory discovery mechanism.

## Proposed New Subtypes

| Subtype                            | Evidence                                                          |
| ---------------------------------- | ----------------------------------------------------------------- |
| mixed.build_plus_research          | f88bdf54 — research + data modelling + prototyping in one session |
| build.feature_batch                | 8cfe93cb — numbered task list execution                           |
| build.refactor_with_plan           | fc3fd142 — scope check -> plan -> systematic execution            |
| build.website_scaffold             | 040ccd41 — quick page generation from context                     |
| sysops.machine_provisioning        | 45d583fe — Ansible-driven machine setup                           |
| operations.agent_execution         | 62241047, 03794369, 41134e14 — Paperclip autonomous runs          |
| operations.agent_ping              | 37c90199 — liveness check, zero tools                             |
| orientation.worktree_investigation | 011e5205 — git worktree question                                  |
| orientation.quick_lookup           | 56dce8ac — single SSH question                                    |
| setup.alias_generation             | 27aab661 — jump alias configuration                               |
