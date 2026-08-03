---
type: analysis
title: 'Findings W12-08'
description: 'Wave 12 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave W12-08

**Agent**: W12-08
**Date**: 2026-03-23
**Sessions analysed**: 9
**Machine**: m4-mini (all)
**Scale distribution**: 9 light (100%)

## BUILD Accuracy

**Registry BUILD count**: 7/9 (78%)
**Confirmed BUILD**: 0/9 (0%)
**BUILD accuracy**: 0%

All 7 BUILD-classified sessions were reclassified:

- ffb96500 -> KNOWLEDGE (brain update from web research)
- 3a6ca444 -> PLANNING (backlog handover/reconciliation)
- 8a4a0414 -> SYSOPS (remote machine SSH config)
- b33c20a2 -> RESEARCH (test coverage audit)
- 137c3dcf -> OPERATIONS (multi-repo git sync)
- 3de75898 -> RESEARCH (temp file content evaluation)
- 99b470e2 -> KNOWLEDGE (transcript ingestion into brain)

The 2 ORIENTATION sessions were both confirmed correct (84c73602, 5f754451).

**Conclusion**: 0% BUILD accuracy on light sessions is fully consistent with the established pattern (micro 0-5%, light 10-15%).

## Friction Predicates (P13-P16)

| Predicate                   | Firings | Sessions                                     |
| --------------------------- | ------- | -------------------------------------------- |
| P13 (misunderstood_request) | 4       | 8a4a0414, b33c20a2, 3de75898, 84c73602       |
| P14 (wrong_approach)        | 1       | 8a4a0414                                     |
| P15 (buggy_output)          | 1       | 137c3dcf (false git status in prior session) |
| P16 (excessive_changes)     | 0       | --                                           |

**P13 is dominant at 44% (4/9)**. Three variants observed:

1. **Scope mismatch** (b33c20a2): Claude researched the wrong area of the app
2. **Location-vs-content confusion** (3de75898): Claude evaluated file in context of its directory rather than its content
3. **Layer depth mismatch** (84c73602): Claude explored surface layer (.claude commands) without recognizing deeper structure (POEM core)
4. **Machine identity confusion** (8a4a0414): Claude treated remote machine name as local filesystem

## Key Observations

### 1. Cross-session correction pattern (3 sessions)

Three sessions explicitly reference and correct prior session failures:

- ffb96500: Corrects prior session's wrong assumption about context continuity
- 137c3dcf: Catches prior session's false git status report
- 8a4a0414: References recurring cross-session failure to remember SSH details

This is a distinct session chain type: **corrective_followup**. The user returns specifically to fix what Claude got wrong before.

### 2. CWD incidental rate: 33% (3/9)

Three sessions had incidental CWD:

- 8a4a0414: CWD=prompt.supportsignal but work was SSH to M4 Pro
- 137c3dcf: CWD=brains but work was git ops across 13+ repos
- 3de75898: CWD=brains but file being evaluated is in prompt.supportsignal

Consistent with established pattern that CWD is unreliable at light scale.

### 3. Transcript ingestion as knowledge pattern (99b470e2)

30KB transcript pasted from an external conversation (likely a different AI platform). Topics: Claude Code, Agent SDK, SSH, tmux, A2A communication, NATS, Postgres, Tailscale mesh networking. Claude successfully identified the content, ran Agent subagents for analysis, and updated brain files.

This is a distinct workflow: **external conversation -> paste into Claude Code -> brain file update**. The file size (35KB JSONL) is disproportionately large relative to event count (16) because of the massive paste.

### 4. Voice artifacts observed

- "Woi" = "WUI" (b33c20a2)
- "tempoareily" = "temporarily" (3de75898)
- "M4A" = "M4 Pro" (8a4a0414)
- "focu" pattern continues (speech-to-text truncation)

### 5. PII detected

- 5f754451: Full company details (ABN 3688351251, ACN 688 351 251, director name Rony Kirollos, email, address) exposed in subagent summary
- 8a4a0414: Machine hostnames, usernames mentioned
- 99b470e2: No direct PII but transcript content references personal infrastructure details

### 6. Task-notification as user_prompt (137c3dcf)

Confirms wave 7 observation: `<task-notification>` XML callbacks from background Bash tasks are counted as user_prompt events. This session has 5 user_prompt_count but one is a task-notification. Real human prompts: 4.

### 7. Handover preparation as session type (3a6ca444)

User explicitly discusses context being at 50%, whether to start a new campaign in a new window, and whether "everything is well documented and ready to go." This is conscious session lifecycle management — the user is treating Claude Code sessions as finite resources and planning the handover.

## Subtypes Proposed

| Subtype                            | Session  | Evidence                                     |
| ---------------------------------- | -------- | -------------------------------------------- |
| knowledge.brain_update             | ffb96500 | Web research + brain Write/Edit              |
| planning.backlog_handover          | 3a6ca444 | Backlog reconciliation + handover prep       |
| sysops.remote_machine_config       | 8a4a0414 | SSH config + hostname discovery              |
| research.test_coverage_audit       | b33c20a2 | Task subagent audit + plan mode              |
| operations.repo_sync               | 137c3dcf | Git fetch/pull across 13 repos               |
| orientation.artifact_retrieval     | 5f754451 | ABN/address lookup from brain docs           |
| research.artifact_evaluation       | 3de75898 | Read temp file and evaluate content          |
| knowledge.transcript_ingestion     | 99b470e2 | 30KB external transcript -> brain update     |
| orientation.implementation_scoping | 84c73602 | Read/Glob to understand implementation scope |

## Summary Statistics

- Sessions analysed: 9
- Registry type distribution: BUILD (7), ORIENTATION (2)
- Reclassified type distribution: KNOWLEDGE (2), RESEARCH (2), ORIENTATION (2), SYSOPS (1), OPERATIONS (1), PLANNING (1)
- Frustration sessions: 4/9 (44%)
- P13 (misunderstood_request): 4/9 (44%)
- Cross-session references: 4/9 (44%)
- CWD incidental: 3/9 (33%)
- PII detected: 2/9 (22%)
- New subtypes proposed: 9
