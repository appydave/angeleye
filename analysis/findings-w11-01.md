---
type: analysis
title: 'Findings W11-01'
description: 'Wave 11 Batch 01: 9 sessions, 11% BUILD accuracy; Playwright product_onboarding role (role #8) + multi-agent handover session pattern.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W11-01

**Wave**: 11, Agent 01
**Sessions analysed**: 9
**Date**: 2026-03-23
**Scale mix**: 4 moderate, 5 light (0 micro, 0 heavy)

## Summary Statistics

| Metric                   | Value      |
| ------------------------ | ---------- |
| Registry BUILD           | 8/9 (89%)  |
| Registry TEST            | 1/9 (11%)  |
| BUILD confirmed          | 1/9 (11%)  |
| Reclassified             | 8/9 (89%)  |
| CWD incidental           | 3/9 (33%)  |
| Voice dictation detected | 9/9 (100%) |
| Frustration signals      | 5/9 (56%)  |
| Multi-phase              | 7/9 (78%)  |
| Cross-session refs       | 4/9 (44%)  |

## Reclassification Results

| Session  | Registry | Reclassified | Subtype                                   |
| -------- | -------- | ------------ | ----------------------------------------- |
| bfe3e2e1 | BUILD    | BUILD        | multi_agent_handover_build                |
| ce3de2cd | TEST     | RESEARCH     | product_onboarding_via_playwright         |
| ab707b60 | BUILD    | PLANNING     | architecture_validation_and_documentation |
| b2c6988b | BUILD    | OPERATIONS   | worktree_merge_and_cleanup                |
| 8efb371e | BUILD    | KNOWLEDGE    | brain_update_from_transcript              |
| 9d0485d5 | BUILD    | DEBUG        | bug_fix_with_documentation                |
| a2dd3f2d | BUILD    | RESEARCH     | naming_and_architecture_exploration       |
| 377e6d56 | BUILD    | KNOWLEDGE    | brain_creation_and_discovery              |
| 248480a0 | BUILD    | RESEARCH     | competitive_landscape_analysis            |

**BUILD accuracy**: 1/8 BUILD classifications correct (12.5%). Consistent with wave 9-10 patterns at light/moderate scale.

## Key Findings

### F1: Playwright Semantic Role #8 — Product Onboarding

Session ce3de2cd uses Playwright not for testing but for interactive product exploration. The user asks Claude to sign into Restream, click through features, and document findings into brain files. This is a guided product onboarding workflow — distinct from all 7 previously catalogued Playwright roles:

1. ui_audit
2. external_research
3. documentation_verification
4. uat (various subtypes)
5. web_scraping_for_knowledge
6. design_extraction
7. feature_discovery_audit
8. **product_onboarding** (NEW)

The key differentiator: user is learning to use a third-party product with Claude navigating the UI for them. Registry classified it as TEST due to Playwright dominance, but zero test assertions or verification loops exist.

### F2: Multi-Agent Handover Session Pattern

Session bfe3e2e1 demonstrates a complex multi-agent handover workflow: the user receives handover briefs from other agent sessions (running in different CWDs), pastes them as context, then works with the receiving agent. At P9, the user generates a new handover brief for yet another conversation. This creates a directed graph of session handovers that's distinct from simple cross-session references.

The opening prompt is a structured 3.2KB handover brief with "About This Agent" metadata including model name, working directory, and role. This is a repeatable pattern that could be automatically detected.

### F3: Worktree Cleanup Neglect — Recurring Frustration

Session b2c6988b captures explicit frustration: "I hate that you keep leaving loose ends." The user has to explicitly remind Claude to clean up worktrees after merges and push. This suggests a systematic gap in Claude's worktree lifecycle management — merging but not cleaning up after itself. Candidate for automation or skill improvement.

### F4: Memory vs Documentation Distinction

Session 9d0485d5 surfaces a user-defined distinction between memory (short-term, session-scoped) and documentation (long-term, project-scoped). At P6: "Did you put learnings into memory, or did you put it into documentation? Learnings is a documentation issue. It's long-term; it's not short-term." This is a knowledge-persistence anti-pattern where Claude defaults to the wrong storage tier.

### F5: Lost Research Frustration Pattern

Session a2dd3f2d at P5: "It's not the first time I've done this, and the documentation's either mislaid or wasn't written. Either way, I'm not happy about that." This is a knowledge-persistence failure across session boundaries — research done in prior sessions is not findable later. Same root cause as F4 but at a higher level: the research itself was never durably captured.

### F6: Unauthorized Edits Before First Prompt

Session 8efb371e has 38 tool calls (including 11 Edit calls) before the first user prompt. This is the CLAUDE.md auto-load anti-pattern where the session initialization triggers extensive automated work before the user speaks. In this case, the pre-prompt edits appear to be CLAUDE.md-triggered brain updates — potentially useful but not user-requested.

### F7: Preemptive Approach Correction

Session bfe3e2e1 at P8: "I need you to step back from the problem. It feels like what you're going to do is take the current codebase and get this all to work by integrating it, probably a whole lot of conditional logics, very piecemeal approach." The user anticipates Claude's wrong approach _before it happens_ and redirects. This is more sophisticated than P14 (wrong_approach) — it's a preemptive P14 based on user's learned expectations of Claude's tendencies.

## Friction Predicate Summary (P13-P16)

| Predicate                   | Fired | Sessions |
| --------------------------- | ----- | -------- |
| P13 (misunderstood_request) | 1/9   | bfe3e2e1 |
| P14 (wrong_approach)        | 1/9   | bfe3e2e1 |
| P15 (buggy_output)          | 1/9   | 9d0485d5 |
| P16 (excessive_changes)     | 0/9   | —        |

Low friction rates overall. The bfe3e2e1 session carries both P13 and P14 (co-occurrence pattern confirmed from wave 8).

## Voice Dictation Artifacts

New entries for the catalog:

- "[57376uSaid" — garbled voice command prefix (8efb371e)
- "colemedin" → "Cole Medin" (377e6d56)
- "workshope" → "workshop" (377e6d56)
- "thjis" → "this" (ab707b60)
- "parralel" → "parallel" (ab707b60)
- "sequetial" → "sequential" (ab707b60)
- "contditional" → "conditional" (ab707b60)
- "shcema" → "schema" (ab707b60)
- "loutput" → "output" (ab707b60)
- "varialbes" → "variables" (ab707b60)
- "MoX" → likely "mock" (ab707b60)

Session ab707b60 has the highest voice artifact density in this wave — 7+ distinct artifacts in a single session.

## Proposed New Subtypes

| Subtype                                            | Session  | Confidence |
| -------------------------------------------------- | -------- | ---------- |
| build.multi_agent_handover_build                   | bfe3e2e1 | high       |
| research.product_onboarding_via_playwright         | ce3de2cd | high       |
| planning.architecture_validation_and_documentation | ab707b60 | high       |
| operations.worktree_merge_and_cleanup              | b2c6988b | high       |
| knowledge.brain_update_from_transcript             | 8efb371e | high       |
| debug.bug_fix_with_documentation                   | 9d0485d5 | high       |
| research.naming_and_architecture_exploration       | a2dd3f2d | high       |
| knowledge.brain_creation_and_discovery             | 377e6d56 | high       |
| research.competitive_landscape_analysis            | 248480a0 | high       |

9 subtypes from 9 sessions (1.0/session) — high discovery rate driven by diverse session types in this batch.

## Cross-Session Chains Detected

1. **bfe3e2e1**: Receives handover from claude-sonnet-4-6 in v-appydave → generates handover for outgoing session
2. **ab707b60**: References "another convo" that resolved schema issues (P16)
3. **b2c6988b**: Part of wui-round5 campaign chain — closing/merge session
4. **9d0485d5**: Corrective followup — prior session's fix didn't work
