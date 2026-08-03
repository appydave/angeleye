---
type: analysis
title: 'Findings W8-08'
description: 'Wave 8 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch 08

**Batch**: W8-08
**Sessions analysed**: 9
**Date**: 2026-03-23
**Session IDs**: 3fa5e03b, 61cb8a2b, 1258366a, 47015dde, 06c69d58, 19e974c6, 47852ec4, 2faac85b, 4666a543

---

## BUILD Classification Accuracy

**Registry classified all 9 as BUILD. Actual breakdown:**

| Actual Type | Count | Sessions                                                             |
| ----------- | :---: | -------------------------------------------------------------------- |
| BUILD       |   2   | 61cb8a2b (flihub tooling setup), 47015dde (flihub iterative feature) |
| KNOWLEDGE   |   1   | 3fa5e03b (brain refresh)                                             |
| RESEARCH    |   1   | 1258366a (Ecamm API exploration)                                     |
| PLANNING    |   1   | 06c69d58 (appystack architecture decisions)                          |
| DEBUG       |   2   | 19e974c6 (skill failure), 2faac85b (skill failure)                   |
| ORIENTATION |   2   | 47852ec4 (epic retrieval), 4666a543 (quick question)                 |

**BUILD accuracy: 2/9 (22%)** — consistent with wave 7 overall rate (~22%).

---

## Key Observations

### 1. debug.skill_failure is a confirmed subtype (2 instances)

Sessions 19e974c6 and 2faac85b both follow the same pattern:

- User runs a skill in another session (/create-appystack, /angeleye:install)
- Skill fails
- User opens a new session, pastes the failing output (7-32KB), asks for diagnosis
- This is a **cross-session debugging relay** pattern

This is distinct from debug.e2e_campaign or debug.runtime — the user is specifically debugging a Claude Code skill's behavior, not product code.

### 2. Cross-session paste is the dominant opening style (5/9 sessions)

Five sessions open with pasted context from prior sessions:

- 61cb8a2b: Background agent completion notification
- 47015dde: DAM S3 integration workflow status
- 06c69d58: Session handover table
- 19e974c6: Failing skill conversation (7KB)
- 2faac85b: Failing skill conversation (32KB)

This reinforces that paste_handover is one of the most common opening styles, especially for continuation and debugging sessions.

### 3. knowledge.brain_refresh subtype (3fa5e03b)

Dense 23-minute session with 10 subagents (abridge + Explore + general-purpose) performing automated brain file updates. Pattern:

1. /focus skill to set brain context
2. /refresh-bmad-brain skill to trigger upstream git diff
3. Subagents dispatched to read upstream, compare, and update brain files
4. 65 Edits to brain markdown files in under 25 minutes

This is a skill-driven automated maintenance workflow — distinct from knowledge.brain_update (manual editing) or knowledge.advisory (reviewing others' output).

### 4. Multi-day session with 7 idle gaps (1258366a)

Session spans 6 calendar days (Mar 4-10) with 7 idle gaps >1h (largest: 5598 min / 93 hours). Only 94 min active across 28 prompts. This is a "living terminal" pattern — user returns to the same session across multiple days for related Ecamm Live API exploration work. Two compaction resumes kept context alive.

### 5. P13 (has_misunderstood_request) triggered once

Session 3fa5e03b: Claude conflated BMAD advisor role with relay design context that had been pasted as background. User corrected: "No, you got it wrong if you think it's relay design." Root cause: background context pollution — Claude treated informational context as actionable scope.

### 6. P15 (has_buggy_output) triggered once

Session 19e974c6: Claude investigated failing create-appystack skill, applied fixes, user retried `npx create-appystack@latest` and it still failed. User's response: "Now, what the fuck's going on?" — the fix did not resolve the underlying issue.

### 7. orientation.epic_retrieval subtype (47852ec4)

SupportSignal session using Task/TaskOutput agent orchestration (11/19 tool calls) to parallelize epic/story state lookups. Ends with explicit context capture for next session. Demonstrates that Task-heavy sessions in product repos are not necessarily BUILD — they can be pure orientation with agent delegation.

### 8. Collaborator code review within BUILD session (47015dde)

P6: "Can you have a look at the last commit that just came down?" — user asks Claude to review Jan's (collaborator) Windows-side commit within an active BUILD session. This is an embedded REVIEW phase within BUILD, not a standalone REVIEW session.

---

## Friction Predicates Summary (P13-P16)

| Predicate                     | Triggered | Session  | Detail                                    |
| ----------------------------- | :-------: | -------- | ----------------------------------------- |
| P13 has_misunderstood_request |     1     | 3fa5e03b | Confused advisor scope with relay design  |
| P14 has_wrong_approach        |     0     | —        | —                                         |
| P15 has_buggy_output          |     1     | 19e974c6 | Fix attempt did not resolve skill failure |
| P16 has_excessive_changes     |     0     | —        | —                                         |

Low friction rate for this batch (2/9 sessions, 2/36 predicates).

---

## New Subtypes Proposed

| Subtype                        | Evidence                                                 | Session            |
| ------------------------------ | -------------------------------------------------------- | ------------------ |
| knowledge.brain_refresh        | Skill-driven automated brain update with subagents       | 3fa5e03b           |
| build.tooling_setup            | Lint/type/CI/doc infrastructure in product repo          | 61cb8a2b           |
| research.api_exploration       | Hands-on API endpoint testing and capability discovery   | 1258366a           |
| build.iterative_feature        | Voice-driven incremental UI feature additions            | 47015dde           |
| planning.architecture_decision | Strategic template evolution decisions + implementation  | 06c69d58           |
| debug.skill_failure            | Cross-session debugging of failed Claude Code skill (2x) | 19e974c6, 2faac85b |
| orientation.epic_retrieval     | Agent-orchestrated project state lookup                  | 47852ec4           |
| orientation.quick_question     | Single-prompt product knowledge question                 | 4666a543           |

**8 subtypes from 9 sessions (0.89/session)** — high discovery rate, driven by project diversity in this batch.

---

## Session Scale Distribution

| Scale    | Count | Sessions                               |
| -------- | :---: | -------------------------------------- |
| micro    |   1   | 4666a543                               |
| light    |   3   | 19e974c6, 47852ec4, 2faac85b           |
| moderate |   4   | 61cb8a2b, 1258366a, 47015dde, 06c69d58 |
| heavy    |   1   | 3fa5e03b                               |

---

## Patterns Worth Tracking

1. **Cross-session debugging relay**: User pastes failing session output into fresh session for diagnosis. Two confirmed instances. Could be automated — AngelEye could detect "paste of Claude Code output" and flag as debug relay.

2. **Skill-driven brain maintenance**: /focus + /refresh-brain skills automate what was previously manual knowledge.brain_update. Subagent count (10) makes this look like BUILD but it's KNOWLEDGE.

3. **Living terminal pattern**: 1258366a spans 6 days with 7 idle gaps. Session serves as persistent workspace for ongoing research topic. Compaction resumes are the mechanism that enables this.

4. **Agent orchestration in ORIENTATION**: 47852ec4 uses Task/TaskOutput as 58% of tool calls for parallel state lookup. Agent-heavy does not equal BUILD.
