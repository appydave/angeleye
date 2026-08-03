---
type: analysis
title: 'Findings W10-08'
description: 'Wave 10 Batch 08: 9 moderate sessions, 33% BUILD accuracy; novel Amplification Ladder + Analysis Row Framework patterns.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 10, Agent W10-08

**Date**: 2026-03-23
**Sessions analysed**: 9 (all moderate complexity)
**BUILD accuracy**: 3/9 correct (33%) — higher than wave 9 (11%) as expected for moderate sessions

---

## Summary Statistics

| Metric                     | Value     |
| -------------------------- | --------- |
| Sessions                   | 9         |
| Reclassified               | 6/9 (67%) |
| BUILD correct              | 3/9 (33%) |
| Frustration detected (P02) | 5/9       |
| Multi-phase (P03)          | 9/9       |
| Compaction resume (P09)    | 4/9       |
| CWD incidental (P10)       | 1/9       |
| P13 misunderstood request  | 5/9       |
| P14 wrong approach         | 2/9       |
| P15 buggy output           | 2/9       |
| P16 excessive changes      | 0/9       |

---

## Per-Session Analysis

### S1: ea0cafc6 — WUI YouTube Launch Optimizer (BUILD confirmed)

**Type**: BUILD / build.feature_development
**Registry**: BUILD -- **Correct**
**Active**: 92 min, 182 events, 2 compactions

Exemplary multi-phase BUILD session. Five distinct phases: (1) Playwright UAT executing TC-01 through TC-11, (2) Inline bug fixes discovered during UAT (isPanelVisible audience default, intake bumpRevision), (3) Copy-to-clipboard feature construction, (4) Output persistence architecture design via voice Q&A, (5) Plan creation before context exhaustion.

Key observations:

- **Plan-paste-then-execute workflow**: 6380-char structured handover as opener. This is the user's most effective session pattern.
- **Playwright as BUILD verification**: 35 Playwright calls used for UAT, not standalone testing. Edit-then-verify-visually loop.
- **Self-discovered bugs during UAT**: TC-02 failure led to isPanelVisible fix, FliHub banner led to bumpRevision fix. The UAT process is the quality gate.
- **Context exhaustion managed well**: User anticipates context limit, requests plan creation, session auto-compacts with a detailed summary.

### S2: d129cfba — Oscar Agent Methodology Design (BUILD -> KNOWLEDGE)

**Type**: KNOWLEDGE / knowledge.methodology_design
**Registry**: BUILD -- **Incorrect**
**Active**: 124 min, 157 events, 1 compaction

Misclassified as BUILD. No application code written. Session diagnoses systemic problems with Oscar agent (data contract violations, gate logic not enforced, silent workarounds), designs a pre-flight validation system, creates workflow validate command, and writes a proposal document. All 53 Edit calls are to agent prompt files and proposal documents.

Key observations:

- **Named agent ecosystem**: Oscar, Penny, Alex — three named agents with distinct roles referenced throughout.
- **Cross-paste from concurrent session**: User pastes /tmp/oscar-recurring-issues.md analysis from another session window.
- **P13 fires**: Claude responds ambiguously after user pastes recurring issues — user says "give me clarity".
- **BMAD/POEM pattern research**: Background agents read BMAD framework to inform validation design.

### S3: b56e1aef — Digital Stage Summit Presentation Build (BUILD -> KNOWLEDGE)

**Type**: KNOWLEDGE / knowledge.presentation_build
**Registry**: BUILD -- **Incorrect**
**Active**: 95 min, 134 events, 4 subagents

Rich Q&A-driven knowledge session for Digital Stage Summit 2026 talk. No application code. Built agentic-os.json data file and NotebookLM prompts for presentation slides.

Key observations:

- **Amplification Ladder framework**: Novel conceptual artifact emerged — 4-level hierarchy: (1) doing the task, (2) using AI for the task, (3) delegating to agents, (4) + observability + self-improvement = "powerhouse". This framework has value beyond this session.
- **P13 fires**: Claude gave 3 slide titles when user wanted 7 titles matching 7 prompts. User corrected: "I've got no idea how to correlate them".
- **Frustration at detail level**: "Fucking Kyberbot at port 3456 on Mini-M2 is just a fucking stupid thing to be even thinking about" — user wants conceptual framing, not implementation details.
- **Voice dictation artifacts**: "Samantha and MJ" names, "Paperclip" (PaperCut?), N8N speech artifacts.
- **Multi-session chain**: Part of multi-session presentation build — Body 1 and Body 3 done in prior sessions.

### S4: 39d9224e — AppyStack Deep Review (BUILD -> REVIEW)

**Type**: REVIEW / review.deep_codebase_review
**Registry**: BUILD -- **Incorrect**
**Active**: 60 min, 119 events, 1 compaction

User explicitly asks for "deep review of AppyStack". 20 Task calls for parallel background agent reviews. Some corrections applied from review findings, but this is review-driven, not feature-driven.

Key observations:

- **Voice dictation artifact**: "Agnle" = "Angle" — user corrects in next prompt.
- **Wave status confusion**: User thinks Wave 4 is done, Claude discovers it needs checking. Status markers updated.
- **Task parallelism**: 20 Task calls — 4 separate background review agents. Effective use of parallel execution for review scope.
- **Clean close**: Commit, push — well-structured session end.

### S5: 4479d525 — POEM Workflow Executor CLI (BUILD confirmed)

**Type**: BUILD / build.tool_construction
**Registry**: BUILD -- **Correct**
**Active**: 41 min, 106 events

Genuine BUILD — constructing POEM Workflow Executor CLI tool from implementation plan. Write(40) dominance creating new source files from scratch.

Key observations:

- **Plan-paste-then-execute**: 4736-char paste with implementation plan location and file table.
- **Form-filling detection**: short_prompt_ratio 0.71 — user mostly giving terse "continue" directives while Claude builds.
- **P15 fires (trust concern)**: User asks "does this tool actually work, I never gave you openrouter API and you never asked for max account auth, so how can I trust this?" — Valid concern about building infrastructure without verifying integration.
- **TaskCreate/TaskUpdate pattern**: 6 TaskCreate + 11 TaskUpdate for orchestrated parallel construction. Sophisticated background work management.

### S6: ea6a9a87 — AppyStack Boilerplate Template (BUILD confirmed)

**Type**: BUILD / build.scaffold
**Registry**: BUILD -- **Correct**
**Active**: 46 min, 100 events

Clean plan-driven scaffolding of AppyStack boilerplate template across 6 explicit phases. Write(41)+Bash(37) is the classic scaffolding pattern.

Key observations:

- **Phase shepherd pattern**: User says "continue with Phase N" between each phase — minimal direction, maximum delegation.
- **Playwright visual verification**: Navigate, screenshot, close at end — lightweight visual QA.
- **1411-min idle gap**: Session spans 25 hours but only 46 active minutes. Natural break after construction.
- **This is the AppyStack "birth" session**: Template that later gets used via create-appystack.

### S7: 7d20393a — AngelEye Session 4 Campaign (BUILD confirmed)

**Type**: BUILD / build.campaign_handover
**Registry**: BUILD -- **Correct**
**Active**: 35 min, 96 events, 1 subagent

Part of AngelEye wave development campaign (session 4). Subagent builds OrganiserView.tsx, main session handles worktree merge, visual QA, and next-wave planning.

Key observations:

- **Frustration at headless Playwright**: "Why can't I see it? If I can't see it, then you've screwed up. This is crap if you're running at headless." — Claude defaulted to headless mode, user wanted visible browser.
- **P13+P14 co-occurrence**: Claude answered with a plan when user wanted observations. Had to repeat the question. Then Playwright ran headless when user needed headed. Both are misunderstanding + wrong approach.
- **ToolSearch(3) for skill gap**: Searching for Playwright browser tools before use — uncertain about MCP availability. Required browser_install.
- **Worktree workflow**: Build in angeleye-wave3 worktree, close worktree, merge back, verify on main.
- **Session chain planning**: Wrote AGENTS.md and SESSION_HANDOVER.md for next wave. Well-structured campaign cadence.

### S8: 9d63797d — System Inventory & CLAUDE.md Maintenance (BUILD -> KNOWLEDGE)

**Type**: KNOWLEDGE / knowledge.system_inventory
**Registry**: BUILD -- **Incorrect**
**Active**: 68 min, 88 events, 1 compaction

Misclassified as BUILD. User wants to understand where all applications are. Session creates dev inventory, updates CLAUDE.md references, researches skill creation. No application code.

Key observations:

- **Very high frustration**: "this is probably the 10th time I've done this shit with you", "you present information in too much detail for me", "we constantly fuck up with [skills]".
- **P13+P14 strong co-occurrence**: Claude stored info in memory file when user explicitly wanted CLAUDE.md. User corrects: "I don't like it in memory. I like it either as a reference in Claude MD."
- **CWD incidental**: brains/ CWD but work spans appydave-plugins, appystack, and brains — home terminal pattern.
- **Repeated question across sessions**: User has asked about application inventory ~10 times. The knowledge isn't persisting correctly between sessions.
- **Proposed subtype**: operations.claude_md_maintenance — maintaining Claude's own context files is a distinct activity.

### S9: eb5b1d43 — Penny Prompt Engineering for Moment Analysis (BUILD confirmed)

**Type**: BUILD / build.prompt_engineering
**Registry**: BUILD -- **Correct**
**Active**: 79 min, 84 events

Named agent session (Penny) writing 12 prompt+schema pairs for moment-analysis workflow. Write(25) creating .hbs templates and .json schemas.

Key observations:

- **Analysis Row framework**: 5 composition patterns (P+C+O, P+O, C+O, O-only, C-only) explicitly defined. This is a durable methodology artifact.
- **Cross-agent review paste**: Alex's review of Penny's work pasted from concurrent session. Multi-agent collaboration pattern.
- **Port conflict recurring**: Port 5173 EADDRINUSE — same micro pattern seen in prior waves.
- **Domain boundary insight**: User corrects Claude on field naming: "Tying a field in a database of one system to a field in a template system in another would not be a normal smart move." Important domain modeling principle.

---

## BUILD Accuracy Assessment

| Session  | Registry | Actual    | Correct? |
| -------- | -------- | --------- | -------- |
| ea0cafc6 | BUILD    | BUILD     | Yes      |
| d129cfba | BUILD    | KNOWLEDGE | No       |
| b56e1aef | BUILD    | KNOWLEDGE | No       |
| 39d9224e | BUILD    | REVIEW    | No       |
| 4479d525 | BUILD    | BUILD     | Yes      |
| ea6a9a87 | BUILD    | BUILD     | Yes      |
| 7d20393a | BUILD    | BUILD     | Yes      |
| 9d63797d | BUILD    | KNOWLEDGE | No       |
| eb5b1d43 | BUILD    | BUILD     | Yes      |

**BUILD accuracy: 5/9 (56%)** for genuine BUILD sessions confirmed. Of the 9 sessions classified BUILD by registry, 5 are correct (56%). This is higher than the wave 9 micro/light average (11%) but aligns with the moderate session pattern from wave 6 (45%).

The discriminator is clear: **sessions with Edit/Write to application source code are BUILD; sessions with Edit/Write only to docs/prompts/brain files are not BUILD.** Agent prompt engineering (eb5b1d43) is a borderline case — classified BUILD because the prompts are executable artifacts in a pipeline, not documentation.

---

## Friction Predicates Summary (P13-P16)

| Predicate                 | Fired | Sessions                                         |
| ------------------------- | ----- | ------------------------------------------------ |
| P13 misunderstood_request | 5/9   | d129cfba, b56e1aef, 7d20393a, 9d63797d, eb5b1d43 |
| P14 wrong_approach        | 2/9   | 7d20393a, 9d63797d                               |
| P15 buggy_output          | 2/9   | ea0cafc6, 4479d525                               |
| P16 excessive_changes     | 0/9   | none                                             |

**P13 is the dominant friction predicate at moderate scale** (56% of sessions). Common pattern: Claude provides a response that technically addresses the words but misses the user's actual intent or scope. User has to re-explain.

**P13+P14 co-occurrence** in 7d20393a and 9d63797d: when Claude both misunderstands what the user wants AND takes the wrong approach to address it, frustration escalates significantly. These are the most frustrated sessions in this batch.

---

## New Subtype Proposals

| Subtype                          | Session  | Rationale                                                            |
| -------------------------------- | -------- | -------------------------------------------------------------------- |
| knowledge.presentation_build     | b56e1aef | Q&A-driven data construction for a talk — not docs, not code         |
| knowledge.system_inventory       | 9d63797d | Discovering and cataloging what exists across the ecosystem          |
| build.prompt_engineering         | eb5b1d43 | Creating executable prompt+schema pairs for a pipeline               |
| build.tool_construction          | 4479d525 | Building a new CLI tool from plan                                    |
| build.scaffold                   | ea6a9a87 | Template/boilerplate scaffolding from plan                           |
| build.campaign_handover          | 7d20393a | Wave-based campaign session with subagent build + next-wave planning |
| build.uat_with_inline_fixes      | ea0cafc6 | UAT via Playwright that discovers and fixes bugs inline              |
| review.deep_codebase_review      | 39d9224e | User-requested comprehensive code review with parallel agents        |
| operations.claude_md_maintenance | 9d63797d | Maintaining Claude's own context/configuration files                 |

---

## Novel Patterns

### 1. Analysis Row Framework (5 Compositions)

Session eb5b1d43 explicitly defines 5 composition patterns for analysis rows: P+C+O, P+O, C+O, O-only, C-only. This is a methodology artifact that AngelEye itself now uses (predicates + classifiers + observations). Worth noting as a self-referential pattern — the system being analysed produced the framework being used to analyse it.

### 2. Amplification Ladder (4 Levels)

Session b56e1aef produced a 4-level hierarchy: (1) doing the task = wasting time, (2) AI does the task = amplified but still wasting time, (3) agent delegates to agents = good amplification, (4) + observability + self-improvement = powerhouse. This is a durable conceptual framework.

### 3. Named Agent Addressing Pattern

Sessions d129cfba and eb5b1d43 address Claude by a named agent persona ("Hey Penny"). This is not just cosmetic — the agent name loads a specific persona prompt via skill invocation. Multi-agent collaboration is visible in cross-session paste patterns (Alex reviews Penny's work).

### 4. Repeated Question Anti-Pattern

Session 9d63797d reveals the user has asked about application inventory ~10 times across sessions. The knowledge persists in CLAUDE.md but Claude doesn't use it effectively at session start. This is a systemic failure in knowledge retrieval, not a single-session issue.

### 5. All 9 Sessions Are Multi-Phase

Every moderate session in this batch has 3+ phases. This confirms the wave 6 finding that multi-phase sessions dominate at moderate+ scale (100% in this batch).

---

## Voice Dictation Artifacts Catalog Additions

- "Agnle" = "Angle" (39d9224e)
- "Wiggum" = likely "Ralphy" reference (7d20393a — "rough Wiggum loops")
- "headles" = "headless" (7d20393a)
