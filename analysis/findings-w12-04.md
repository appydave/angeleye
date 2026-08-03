---
type: analysis
title: 'Findings W12-04'
description: 'Wave 12 Batch 04: 9 light sessions, 0% BUILD accuracy; crash recovery opener, cross-machine SSH ops + review-before-close patterns.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-04

**Wave**: 12, Agent 04
**Sessions analysed**: 9 (all light scale, 24-27 events each)
**Machine**: m4-mini
**Date**: 2026-03-23

## BUILD Accuracy

**0/9 (0%)** — all 9 sessions were classified BUILD in the registry, none are genuine BUILD. Consistent with waves 6-11: light/micro sessions from brains/ CWD are almost never BUILD.

| Session  | Registry | Actual      | Subtype                             |
| -------- | -------- | ----------- | ----------------------------------- |
| 8d26ad85 | BUILD    | KNOWLEDGE   | brain_capture                       |
| 7f194b95 | BUILD    | ORIENTATION | artifact_retrieval (crash_recovery) |
| 851f7ac8 | BUILD    | KNOWLEDGE   | config_update                       |
| bf9cc931 | BUILD    | RESEARCH    | cross_machine_investigation         |
| dc408618 | BUILD    | KNOWLEDGE   | methodology_design                  |
| 90e94cac | BUILD    | OPERATIONS  | config_registration                 |
| bf772c4d | BUILD    | OPERATIONS  | repo_alignment                      |
| 14011e56 | BUILD    | RESEARCH    | tooling_investigation               |
| 7cfbfc5c | BUILD    | SYSOPS      | git_conflict_resolution             |

## Key Observations

### 1. brains/ CWD is a home terminal (8/9 sessions)

8 of 9 sessions have CWD=brains. In 6 of those 8, the CWD is incidental — actual work targets other locations (locations.json, appydave.com repo, Ansible repo, multiple repos via SSH). brains/ is overwhelmingly used as the "launch terminal" for general-purpose Claude interactions.

### 2. Voice dictation pervasive with notable artifacts

- "digital state" = "digital stage" (bf9cc931)
- "codecs" = "codex" (14011e56 — caused P13 misunderstanding)
- "vent" = "event" (8d26ad85)
- "orchistrator" = "orchestrator" (8d26ad85)
- "becuase" = "because" (8d26ad85)
- "Thumbrack" = "ThumbRack" (851f7ac8)
- "cast" = "cask" (14011e56)

### 3. Paste-handover is a common opener (2/9)

Sessions 14011e56 and 7cfbfc5c both open by pasting output from prior sessions (a brew install response and a git pull error). This pattern is distinct from voice dictation and signals continuation of prior work.

### 4. Session continuation without /resume (2/9)

- bf772c4d opens with "sure" — confirming a prior session's suggestion. Has a subagent_stop event containing a full prior session summary (3000+ word analysis). This is a continuation that doesn't use /resume.
- 14011e56 pastes prior session output as context handover.

### 5. Multi-phase sessions with extreme idle gaps

- dc408618: 22-hour gap between phases (active 6 min across 1462 min span)
- 7f194b95: 649-min gap (active 9 min across 659 min span)
- 7cfbfc5c: 263-min gap (active 2 min across 266 min span)
- 8d26ad85: 147-min gap (active 8 min across 196 min span)

These sessions have extremely low active-to-total ratios. The user returns to the same session hours or days later for closing tasks (commit, review, close check).

### 6. High autonomy ratios in light sessions

- 90e94cac: 1 prompt, 20 tool calls (1:20) — single voice instruction to fix missing alias
- bf772c4d: 1 prompt ("sure"), 19 tool calls (1:19) — commit/push/align continuation
- These are efficient delegation patterns — user gives one instruction, Claude executes complex multi-step operations.

### 7. Cross-machine operations via SSH (2/9)

Sessions bf9cc931 and bf772c4d both use SSH to inspect/modify repos on other Macs. This is a recurring pattern for multi-machine repo alignment. The user manages 3+ Macs and uses Claude as a cross-machine operations assistant.

## Friction Events

### P13 (misunderstood_request): 2/9

- **bf9cc931**: Claude missed a specific path (~/dev/sites/appydave.com) mentioned in voice dictation. User corrected: "You didn't look at the site I told you to tell you about."
- **14011e56**: Claude heard "codec" instead of "codex" and searched for audio/video codecs. User corrected: "I never said codec. I was talking about OpenAI. codex."

Both caused by voice dictation parsing errors — the user said the right thing, but either Claude or the transcript introduced confusion.

### P02 (frustration): 1/9

Only bf9cc931 had detectable frustration (mild). The codec/codex error in 14011e56 prompted correction but no frustration language.

## New Subtypes Proposed

| Subtype                              | Session  | Evidence                                              |
| ------------------------------------ | -------- | ----------------------------------------------------- |
| knowledge.brain_capture              | 8d26ad85 | Dictating meetup notes directly into brain files      |
| orientation.crash_recovery           | 7f194b95 | Recovering context from crashed session               |
| knowledge.config_update              | 851f7ac8 | Updating port registry config docs                    |
| research.cross_machine_investigation | bf9cc931 | Investigating git repo state across machines via SSH  |
| operations.config_registration       | 90e94cac | Adding missing app to locations.json registry         |
| operations.repo_alignment            | bf772c4d | Cross-machine git commit/push/pull alignment          |
| research.tooling_investigation       | 14011e56 | Investigating CLI tool availability in Ansible config |
| sysops.git_conflict_resolution       | 7cfbfc5c | Resolving git merge conflict                          |

## Patterns Worth Tracking

1. **Crash recovery as opener**: Session 7f194b95 shows user asking "is the info in this crashed window in my brain?" — a distinct recovery workflow that differs from normal orientation.

2. **"sure" as continuation signal**: Session bf772c4d demonstrates a session that starts with a subagent_stop summary from a prior session, followed by "sure" as the only user prompt. The subagent summary acts as implicit context injection.

3. **Review-before-close pattern**: Sessions dc408618 and 7cfbfc5c both have users returning after long gaps specifically to review/confirm before closing. This is a distinct bookend variant focused on completeness checking.
