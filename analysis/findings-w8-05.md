---
type: analysis
title: 'Findings W8-05'
description: 'Wave 8 batch 05 analysis of 9 sessions — 33% BUILD accuracy, plan-paste-execute workflow, worktree-without-permission friction, EADDRINUSE automation candidate.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch W8-05

**Batch**: W8-05 (9 sessions)
**Analysed**: 2026-03-23
**Sessions**: c9d68534 (prompt.supportsignal/heavy), 26e20d70 (angeleye/moderate), 95f33c73 (supportsignal/moderate), 0057da96 (prompt.supportsignal/moderate), 1793e80e (flihub/moderate), 027ffbfe (prompt.supportsignal/light), 0b728ed0 (brains/light), 41346d6a (signal-studio/light), 0f7ea98d (fligen/micro)

---

## BUILD Accuracy

**Registry classified all 9 as BUILD. Actual classification:**

| Session  | Registry | Analysed                           | Correct? |
| -------- | -------- | ---------------------------------- | -------- |
| c9d68534 | BUILD    | BUILD (plan_execution)             | Yes      |
| 26e20d70 | BUILD    | MIXED (planning_then_build)        | Partial  |
| 95f33c73 | BUILD    | BUILD (scaffold_and_configure)     | Yes      |
| 0057da96 | BUILD    | BUILD (plan_execution)             | Yes      |
| 1793e80e | BUILD    | MIXED (bugfix_then_research)       | Partial  |
| 027ffbfe | BUILD    | RESEARCH (architecture_comparison) | No       |
| 0b728ed0 | BUILD    | KNOWLEDGE (post_mortem)            | No       |
| 41346d6a | BUILD    | RESEARCH (tool_reference)          | No       |
| 0f7ea98d | BUILD    | SYSOPS (build_fix)                 | No       |

**BUILD accuracy: 3/9 fully correct (33%), 2/9 partial (MIXED with BUILD component), 4/9 wrong (44%).**

Consistent with wave 6-7 patterns: micro/light sessions are almost never BUILD, moderate sessions are ~50% correct, heavy sessions are usually correct.

---

## Friction Predicates (P13-P16) — Trial Results

| Predicate                     | Triggered | Sessions                                                                                                             |
| ----------------------------- | :-------: | -------------------------------------------------------------------------------------------------------------------- |
| P13 has_misunderstood_request |    1/9    | c9d68534 (Claude deviated from explicit plan)                                                                        |
| P14 has_wrong_approach        |    2/9    | c9d68534 (hard-coded instead of generic), 0057da96 (created worktree unprompted)                                     |
| P15 has_buggy_output          |    3/9    | c9d68534 (port conflicts, deviations), 95f33c73 (data loading regression), 0057da96 (port conflict, worktree issues) |
| P16 has_excessive_changes     |    0/9    | None                                                                                                                 |

**P15 (buggy output) is the most common friction signal.** Port conflicts (EADDRINUSE) appear in 2/3 buggy sessions — a recurring operational failure mode. P14 (wrong approach) captured two distinct anti-patterns: hard-coding domain logic instead of generic system, and creating worktrees without being asked.

---

## Key Observations

### 1. Plan-Paste-Then-Execute is a Distinct Workflow Pattern

Sessions c9d68534 and 0057da96 both open with a multi-thousand-character implementation plan pasted from a prior planning session, plus a transcript reference. This is a deliberate two-session chain: design in session A, paste plan into session B for execution.

**Failure mode**: When Claude deviates from the pasted plan, frustration is severe because the user invested significant effort in plan design. Claude treats the plan as advisory when the user expects mechanical execution.

**Subtype proposed**: `build.plan_execution` — characterized by paste_handover opener, TaskCreate orchestration, cross-session transcript reference.

### 2. Worktree Creation Without Permission is a Recurring Friction Source

Session 0057da96: "I never asked you to do a work show. I just want the fucking thing to run." User says this is a "constant fucking issue" — suggesting it has happened in prior sessions too. Claude assumes worktree usage based on context cues, but this creates cascading operational issues (wrong code paths, port conflicts).

### 3. Post-Mortem Knowledge Capture is a Distinct Session Type

Session 0b728ed0 is a clear example: user pastes a 36K-char prior conversation about recurring skill frustrations and asks "what learnings can we have?" Claude analyses and writes findings to brain files. This is not BUILD (registry classification) — it is KNOWLEDGE with a post_mortem subtype. The `context_loading_paste` opener (36K chars) is a strong signal.

### 4. CWD Incidental Rate Remains High

4/9 sessions (44%) had incidental CWD:

- 027ffbfe: CWD=prompt.supportsignal but researching 3 different projects
- 0b728ed0: CWD=brains but doing knowledge post-mortem (arguably correct)
- 41346d6a: CWD=signal-studio but asking about Claude Code shortcuts
- 0f7ea98d: CWD=fligen but fixing flideck shared package

### 5. Voice Dictation Artifacts Continue to be Pervasive

- "Jason" for "JSON" (26e20d70)
- "MPM" for "npm", "mpxdgit" for "npx", "all intensive purposes" for "intents and purposes", "climb there" for "clone" (95f33c73)
- Voice prompts dominate across all session types and scales

### 6. EADDRINUSE is an Automation Candidate

Port conflicts appear in 2/9 sessions (c9d68534 and 0057da96) — both on port 3001. This is a known recurring pattern from prior waves. Combined with the micro port-kill sessions identified in wave 6, this is a strong automation candidate.

### 7. Agent Orchestration for Cross-Project Research

Session 027ffbfe demonstrates a pattern where Claude deploys 11 Agent subagents to explore 3 separate codebases in parallel for architecture comparison. Only 3 user prompts drive the entire session. This is highly efficient research but is misclassified as BUILD.

---

## New Subtypes Proposed

| Subtype                          | Count | Evidence                                                             |
| -------------------------------- | :---: | -------------------------------------------------------------------- |
| build.plan_execution             |   2   | c9d68534, 0057da96 — plan pasted as opener, TaskCreate orchestration |
| build.scaffold_and_configure     |   1   | 95f33c73 — new project from template, GitHub repo setup              |
| mixed.planning_then_build        |   1   | 26e20d70 — backlog discussion then /ralphy build                     |
| mixed.bugfix_then_research       |   1   | 1793e80e — quick fix then AWS/integration research                   |
| research.architecture_comparison |   1   | 027ffbfe — cross-project theme comparison                            |
| research.tool_reference          |   1   | 41346d6a — Claude Code keyboard shortcut lookup                      |
| knowledge.post_mortem            |   1   | 0b728ed0 — pasted conversation for learning extraction               |
| sysops.build_fix                 |   1   | 0f7ea98d — terminal error paste, npm build fix                       |

---

## Frustration Analysis Summary

3/9 sessions (33%) had frustration signals. All frustration was in BUILD/plan-execution sessions where Claude deviated from instructions:

1. **c9d68534** (severe): "Why did you deviate? You fucking asshole." Root cause: Claude made judgment calls instead of following the explicit implementation plan.
2. **95f33c73** (moderate): "Why do you keep fucking up?" Root cause: data loading regression after code changes.
3. **0057da96** (moderate): "It's just this constant fucking issue we keep having where you don't consider the fact that we're in work trees." Root cause: Claude created worktree without permission.

**Pattern**: Frustration correlates with plan-driven sessions where user expects mechanical execution but Claude exercises judgment. The gap between "follow the plan" and "make reasonable decisions" is where most friction occurs.

---

## Session Chain Detection

2/9 sessions are explicit continuations of prior planning sessions:

- c9d68534 continues from 3a66b975 (plan design)
- 0057da96 continues from a6fee7b2 (plan design)

1/9 is a post-mortem of a prior session:

- 0b728ed0 analyses a prior skill-debugging conversation

This batch has a higher chain rate (33%) than average, driven by the plan-paste workflow pattern.
