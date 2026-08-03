---
type: analysis
title: 'Findings W8-04'
description: 'Wave 8 batch 04 analysis of 9 sessions — 22% BUILD accuracy, Mochaccino design principle discovered, premature implementation anti-pattern, P13-P16 friction predicates.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch 04

**Analysed**: 2026-03-23
**Sessions**: 9 (1 heavy, 2 moderate, 3 light, 2 light, 1 micro)
**BUILD accuracy**: 2/9 (22%) — consistent with wave 6-7 trends

## Session Summary

| ID       | Project          | Registry | Reclassified | Scale    | Interest |
| -------- | ---------------- | -------- | ------------ | -------- | -------- |
| 557fd04a | flideck          | BUILD    | BUILD        | heavy    | medium   |
| 68c33d9f | angeleye         | BUILD    | MIXED        | moderate | high     |
| 03127725 | brains           | BUILD    | OPERATIONS   | moderate | medium   |
| 1b4cb19a | v-appydave       | BUILD    | BUILD        | moderate | medium   |
| 2238b9f1 | appystack        | BUILD    | MIXED        | moderate | medium   |
| 21d6ffaf | signal-studio    | BUILD    | PLANNING     | light    | high     |
| 13d25fdf | v-voz            | BUILD    | KNOWLEDGE    | light    | low      |
| 8447409a | appydave-plugins | BUILD    | KNOWLEDGE    | light    | medium   |
| 885eb51c | apps             | BUILD    | ORIENTATION  | micro    | low      |

## Friction Predicates (P13-P16) — Trial Results

First batch applying friction predicates. 4/9 sessions triggered at least one:

| Session  | P13 misunderstood | P14 wrong_approach | P15 buggy_output | P16 excessive |
| -------- | ----------------- | ------------------ | ---------------- | ------------- |
| 557fd04a | -                 | -                  | yes              | -             |
| 68c33d9f | yes               | yes                | yes              | -             |
| 03127725 | -                 | -                  | -                | -             |
| 1b4cb19a | yes               | -                  | -                | -             |
| 2238b9f1 | -                 | -                  | -                | -             |
| 21d6ffaf | yes               | yes                | -                | -             |
| 13d25fdf | -                 | -                  | -                | -             |
| 8447409a | -                 | -                  | -                | -             |
| 885eb51c | -                 | -                  | -                | -             |

**Observation**: P13 (misunderstood_request) and P14 (wrong_approach) often co-occur. When Claude misunderstands intent, it naturally picks the wrong approach. P15 (buggy_output) is independent — it occurs when intent was understood but execution was poor.

## Key Findings

### 1. Premature implementation anti-pattern (21d6ffaf)

User explicitly says "we're gathering information for a plan — the actual implementation is not for you to do" after Claude jumps to UI mockup generation during a requirements gathering session. This is a clear, quotable instance of the premature-implementation pattern: Claude interprets requirement discussion as implicit build instruction.

**Implication for AngelEye**: Detectable via P14 (wrong_approach) + user correction containing words like "plan", "gathering", "not for you to do". Could be a classifier input.

### 2. Mochaccino pattern discovery (68c33d9f)

The richest session in the batch. Through iterative UI frustration (each CSS round making things worse), user and Claude discover a meta-process: "Before we implement any UI decision with multiple viable options, present options first." This becomes the "Mochaccino" prototyping principle, which gets handed over to AppyStack as a template-level feature.

**Observation**: Anti-patterns (P14, P15) can be generative — the frustration produced a transferable design principle.

### 3. Cross-project handover quality (1b4cb19a)

User frustrated at Claude producing 4-sentence handover notes for a receiving project that has "no idea you exist." Root cause: Claude doesn't account for context asymmetry between sending and receiving agents. Handover notes need to be self-contained, not referential.

**New anti-pattern candidate**: "context-poor handover" — detectable when user asks Claude to expand/improve notes destined for another project or session.

### 4. Trust deficit after compaction (557fd04a)

User asks "If I asked another bot to verify, would they come up with a different answer?" after compaction-resumed session. Compaction breaks the ability to prove work was done correctly. This is a known pattern but now confirmed in a tooling replication context.

### 5. Cross-session learning injection (8447409a)

User pastes AppyStack session context into appydave-plugins session to feed Ralphy skill learnings. This is a distinct session_chain pattern: not continuation, not review, but knowledge_transfer — extracting learnings from one project's session to improve tooling in another.

**New session_chain_role candidate**: `knowledge_transfer` — session output from project A feeds into skill/config improvement in project B.

### 6. Voice artifact: "stask" = "stack" (885eb51c)

New voice dictation artifact for the catalog.

## New Subtypes Proposed

| Subtype                             | Session  | Confidence | Signal                                              |
| ----------------------------------- | -------- | ---------- | --------------------------------------------------- |
| build.tooling_replication           | 557fd04a | high       | Cross-repo config replication via Task subagents    |
| mixed.debug_then_ux_iteration       | 68c33d9f | high       | Debug → UX iteration → process reflection           |
| operations.repo_audit_and_migration | 03127725 | high       | Repo inventory + GitHub org + migration             |
| build.gap_analysis_and_remediation  | 1b4cb19a | high       | Cross-project comparison → systematic fixes         |
| mixed.planning_and_knowledge        | 2238b9f1 | medium     | Multi-topic: installer Q&A, recipe, handover design |
| planning.requirements_gathering     | 21d6ffaf | high       | Client feedback intake with explicit plan gating    |
| knowledge.documentation_creation    | 13d25fdf | high       | Loom transcript → beginner guide for client         |
| knowledge.skill_refinement          | 8447409a | high       | External session context → skill config updates     |
| orientation.quick_lookup            | 885eb51c | high       | Single Q&A, micro session                           |

## BUILD Misclassification Breakdown

7/9 sessions were registry-typed BUILD. After analysis:

- 2 confirmed BUILD (557fd04a, 1b4cb19a) — both had genuine Edit/Write on code/config
- 2 reclassified MIXED (68c33d9f, 2238b9f1) — had some build elements but primary activity was different
- 2 reclassified KNOWLEDGE (13d25fdf, 8447409a) — documentation and skill refinement
- 1 reclassified OPERATIONS (03127725) — repo audit and migration
- 1 reclassified PLANNING (21d6ffaf) — requirements gathering, explicitly not building
- 1 reclassified ORIENTATION (885eb51c) — single git branch query

**Pattern**: video-projects CWD (v-voz, v-appydave) gets BUILD-typed but often contains knowledge/documentation work. Plugin repos (appydave-plugins) similarly get BUILD but are knowledge.skill_refinement.

## Cumulative Stats

- Total sessions analysed: 277 (268 + 9)
- New subtypes this batch: 9
- Friction predicates triggered: P13 (3x), P14 (2x), P15 (2x), P16 (0x)
- P16 (excessive_changes) may need recalibration — zero triggers suggests threshold is too high or the pattern is rarer than expected
