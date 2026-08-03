---
type: analysis
title: 'Findings W14-03'
description: 'Wave 14-03: 12 M4 Pro sessions — appydave-tools/flihub work, Paperclip scheduled agents in joy-juice, micro/orientation sessions.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings -- W14-03

**Wave**: W14-03 (M4 Pro machine)
**Sessions analysed**: 12
**Date range**: 2026-02-28 to 2026-03-22
**Analyst**: W14-03

## Summary

12 sessions from the M4 Pro spanning nearly a month of activity. The batch splits into three categories: (1) three substantial working sessions driving real product work (appydave-tools, flihub, brains/appydave.com research), (2) three Paperclip scheduled agent sessions in joy-juice, and (3) six micro/orientation sessions for quick lookups and housekeeping.

## Classification Breakdown

| Type        | Count | Sessions                                                                                  |
| ----------- | ----- | ----------------------------------------------------------------------------------------- |
| BUILD       | 3     | 3027730a (appydave-tools), e2b982ca (joy-juice/Paperclip), e86d47af (joy-juice/Paperclip) |
| MIXED       | 2     | 93fe2159 (brains/appydave.com research+planning), fdb89194 (flihub planning+build)        |
| OPERATIONS  | 2     | 85e61d58 (Paperclip polling), 00dba57b (git batch)                                        |
| ORIENTATION | 3     | be3e5efa (appydave.com status), 41a88821 (filesystem search), 7034a75b (photo search)     |
| KNOWLEDGE   | 1     | 0bdca14c (To Do brain creation)                                                           |
| SYSOPS      | 1     | dfce261f (M4 migration check)                                                             |

## Registry Type Mismatches

All 12 sessions were typed BUILD in the registry. Only 3 are actually BUILD. The remaining 9 are misclassified:

- 2 MIXED (research+planning sessions with some writes but not feature construction)
- 2 OPERATIONS (scheduled polling, git batch)
- 3 ORIENTATION (status checks, file searches)
- 1 KNOWLEDGE (brain creation)
- 1 SYSOPS (migration check)

This is a 75% mismatch rate, confirming the registry's default BUILD classification is unreliable.

## Notable Sessions

### 3027730a -- appydave-tools marathon (BUILD, heavy)

282 events, 145 active minutes, 3 context compactions. Started via Ralphy-like skill menu (prompts are "4", "3", "y"). Investigated KFIX, then batched multiple feature implementations. 92 Bash + 63 Edit + 19 Write + 15 Agent subagent calls. David explicitly asked to batch work and eventually hit context limits across 3 compaction/resumes. This is the heaviest session in the batch.

### 93fe2159 -- brains/appydave.com research+planning (MIXED, heavy)

151 events, 148 active minutes, 45 user prompts. Extremely interactive session combining: (1) OMI transcript fetch and processing with timezone display format decisions, (2) Playwright-based competitive website research across Fireship, Josh Combe, Syntax FM, and Simon Wilson, (3) appydave.com technology gap analysis, and (4) dead code cleanup. 9 background Agent calls dispatching parallel research. Heavy voice dictation artifacts throughout ("fetsch", "priortityt", "technologty", "Tailwindow"). This session demonstrates David's pattern of using a single session as a command center to dispatch multiple parallel research tracks.

### fdb89194 -- flihub relay architecture planning (MIXED, heavy)

114 events, 171 active minutes, 24 prompts. Starts with a structured handover from previous session (commit 7a8b9e7, 390 tests passing). Three phases: doc cleanup + commit, Ralphy feature recommendation, then deep architectural planning for the flihub relay/sync system. David voice-dictates extensive domain knowledge about the David-Jan collaboration workflow, syncthing limitations, S3 sync patterns, shadow videos, rsync dry-runs, and multi-user video production pipelines. The most domain-knowledge-dense session in the batch.

### Paperclip Agent Cluster (3 sessions)

Three sessions in joy-juice are part of the Paperclip scheduled agent system:

- **85e61d58**: Polling session -- 21 identical hourly prompts ("Continue your Paperclip work"), 20 idle gaps of exactly 60 minutes, only 6 active minutes across 21+ hours. OPERATIONS.
- **e2b982ca**: Work burst -- single prompt triggers 65 tool calls in 13 minutes with actual construction (6 Edit + 3 Write). BUILD.
- **e86d47af**: Short burst -- single prompt triggers 28 tool calls in 7 minutes with 1 Write. BUILD.

This is the first M4 Pro evidence of the Paperclip autonomous agent system. The polling session (85e61d58) is a long-running process manager that triggers work bursts (e2b982ca, e86d47af) at intervals.

## Patterns Observed

1. **Voice dictation prevalence**: 7 of 12 sessions show voice dictation artifacts. The M4 Pro sessions confirm David heavily uses voice input for both operational commands and extensive domain knowledge dumps.

2. **Command center pattern**: Session 93fe2159 (45 prompts, 9 Agent dispatches) shows David using a single Claude session as a command center to dispatch parallel background research via subagents -- a distinct M4 Pro usage pattern.

3. **Cross-session handover**: Session fdb89194 opens with a structured handover pasted from a previous session, including commit hash, test counts, and numbered next-steps. This is a deliberate workflow pattern for maintaining continuity.

4. **Scheduled agents on M4 Pro**: The Paperclip system (3 sessions) is the first documented M4 Pro scheduled agent. It uses hourly polling with bash-heavy monitoring and dispatches work bursts for actual construction.

5. **Incidental CWD**: 3 of 12 sessions have incidental CWD (terminal happened to be open somewhere unrelated to the actual work).

## Scale Distribution

| Scale    | Count |
| -------- | ----- |
| heavy    | 3     |
| moderate | 1     |
| light    | 2     |
| micro    | 6     |

Half the sessions are micro (under 15 events or under 5 active minutes). The three heavy sessions account for the vast majority of actual work.

## Proposed New Subtypes

- `operations.scheduled_agent` -- machine-initiated hourly polling with automated work dispatch
- `build.autonomous_agent_work` -- machine-initiated single-prompt work burst from scheduled agent
- `operations.git_batch` -- batch commit/push across multiple repos
- `sysops.migration_check` -- verifying file/folder migration between machines
- `mixed.research_and_planning` -- combining OMI processing, Playwright research, and planning
- `orientation.project_status_check` -- quick "when was this last updated?" queries
- `orientation.filesystem_search` -- searching for folders/files across filesystem
