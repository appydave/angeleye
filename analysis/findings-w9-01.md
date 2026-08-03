---
type: analysis
title: 'Findings W9-01'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 9, Batch W9-01

**Sessions analysed**: 7
**Scale breakdown**: 1 moderate, 2 light, 4 micro
**Date**: 2026-03-23
**Analyst**: Claude Opus 4.6 (analysis agent)

---

## Session Summaries

### 63ea6186 — signal-studio / moderate / BUILD (confirmed)

Full Ralphy wave23 campaign: 8 bug fixes (B139-B147), 3 waves of parallel agents, worktree management, commit/merge/push, E2E gate (185 pass, 0 fail). Post-compaction, user returns after 86-min gap and encounters stale /loop output. Explicit frustration ("what the fuck's going on", "pissing me off") — this is the **third time** user has tried to teach Claude that /loop output must show change detection, not static snapshots.

### c12fa493 — appystack / light / PLANNING (reclassified from BUILD)

Interactive planning session using PlanMode. User asks Claude to create a plan, Claude enters PlanMode, elicits requirements via AskUserQuestion, writes plan documents. User frustrated that Claude saved plan to wrong location (root instead of configured path). Ends with 4 TaskCreate calls. No code written — pure planning.

### d1fed7ab — app.supportsignal / light / KNOWLEDGE (reclassified from BUILD)

User pastes 3.8KB output from 6 research agents (7 database migration documents: Convex vs Supabase analysis). Applies domain knowledge to refine table scope (23 tables down to essential subset, noting which will be deprecated/rebuilt). Commits and pushes. Classic advisory refinement — no code, only planning doc edits.

### fa148947 — appystack / micro / ORIENTATION (reclassified from BUILD)

Single-prompt artifact retrieval: user asks for styling guidelines file, Claude finds `appydave-palette.md` via Glob, opens in Finder. Clean 4-minute interaction.

### 39bd6350 — brains / micro / SYSOPS (reclassified from BUILD)

User asks where to put NPM_TOKEN secret, pastes npm token creation page content. Zero tool calls. **PII WARNING**: Prompt contains actual NPM token (`[REDACTED]`). CWD incidental.

### 6634407e — brains / micro / META (reclassified from BUILD) — JUNK

2 events total: one Bash call, then "or command". Accidental or fragmentary session. No meaningful work.

### d5844007 — prompt.supportsignal / micro / ORIENTATION (reclassified from BUILD) — JUNK

Single event: "How do I run the Azure Workflow Builder?" No response captured. CWD incidental (prompt.supportsignal).

---

## Registry Accuracy

- **BUILD accuracy this batch: 1/7 (14%)**. Only 63ea6186 (signal-studio campaign) is genuinely BUILD.
- Consistent with wave 6-8 pattern: micro/light sessions are almost never BUILD.
- All 4 micro sessions were wrong: 2 junk, 1 ORIENTATION, 1 SYSOPS.

## Key Observations

### 1. /loop observability anti-pattern (3rd recurrence)

Session 63ea6186 documents the **third time** the user has tried to teach Claude about /loop stale output. The loop reads IMPLEMENTATION_PLAN.md which showed 8/8 complete (static) — after the build is done, every loop iteration shows identical content. User's specific request: loops must detect "no change since last check" and explicitly say so. This is now a confirmed recurring friction point that needs a durable fix (likely in Ralphy skill or agent memory).

### 2. PII in session data (second confirmed instance)

Session 39bd6350 contains a real NPM token in the prompt text. This is the second confirmed PII instance after wave 6's finding. AngelEye's PII detection capability remains a priority.

### 3. PlanMode workflow pattern

Session c12fa493 uses Claude Code's PlanMode (EnterPlanMode/ExitPlanMode) with AskUserQuestion for interactive elicitation. This is a distinct workflow pattern: enter plan mode, delegate to Task agents, ask user questions, write documents, exit plan mode. The ExitPlanMode appears 4 times, suggesting Claude re-enters/exits plan mode across the session — possibly a structural quirk of the PlanMode system.

### 4. prompt.supportsignal CWD unreliability confirmed again

Session d5844007 asks about Azure Workflow Builder from a prompt.supportsignal CWD. Adds to the wave 5 finding that prompt.supportsignal CWD is universally unreliable for project attribution.

### 5. Advisory refinement of multi-agent output

Session d1fed7ab shows a clean advisory pattern: prior session ran 6 research agents producing 7 documents, user reviews output in new session and applies domain knowledge to refine scope. This "agent-output-review" pattern is a specialization of knowledge.advisory — the user is not doing the research, but curating and narrowing what agents produced.

## Predicate Results (P13-P16)

| Session  |    P13 misunderstood    | P14 wrong_approach | P15 buggy_output | P16 excessive |
| -------- | :---------------------: | :----------------: | :--------------: | :-----------: |
| 63ea6186 |            -            |         -          |        -         |       -       |
| c12fa493 | Y (wrong save location) |         -          |        -         |       -       |
| d1fed7ab |            -            |         -          |        -         |       -       |
| fa148947 |            -            |         -          |        -         |       -       |
| 39bd6350 |            -            |         -          |        -         |       -       |
| 6634407e |            -            |         -          |        -         |       -       |
| d5844007 |            -            |         -          |        -         |       -       |

P13 hit rate: 1/7 (14%). Lower than wave 8 average (10%), likely due to 4 micro sessions with minimal interaction.

## New Subtypes Proposed

| Subtype                     | Session  | Evidence                                    |
| --------------------------- | -------- | ------------------------------------------- |
| planning.interactive_design | c12fa493 | PlanMode + AskUserQuestion elicitation loop |
| sysops.secret_management    | 39bd6350 | NPM token storage question                  |

## Running Totals

- **~212+ subtypes across 15+ parent types from 354 sessions**
- Discovery rate: 0.29/session (declining — expected for a light/micro-heavy wave)
- BUILD accuracy: ~22% overall (consistent with waves 6-8)
