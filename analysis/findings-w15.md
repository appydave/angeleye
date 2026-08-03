---
type: analysis
title: 'Findings W15'
description: 'Wave 15: 14 m4-mini sessions (924 total running) — BUILD includes story 1.2 implementation and story 1.3 DB schema.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Wave 15 Findings

**Date**: 2026-03-23
**Machine**: m4-mini
**Sessions analysed**: 14
**Running total**: 924 sessions

## Classification Summary

| Type              | Count | Sessions                                                                                                               |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| BUILD             | 2     | fb3670cb (story 1.2 implementation), 719bbffe (story 1.3 DB schema)                                                    |
| PLANNING          | 4     | e2624d94 (story 1.3 creation), 4c3f5765 (story 1.2 creation), ba19dbe2 (story 1.2 review), 98492233 (story 1.3 review) |
| PLANNING (FliHub) | 1     | 0e9b4604 (ralphy planning for sync-hub)                                                                                |
| REVIEW            | 1     | 1e07466a (BMAD delivery review of story 1.2)                                                                           |
| ORIENTATION       | 2     | 7112ad0c (sprint status check), 98f34f57 (quick question about visual testing)                                         |
| KNOWLEDGE         | 1     | 2454cbe5 (audio brain lookup)                                                                                          |
| META              | 3     | f19c27ca (aborted), f8b16045 (aborted), 84ce8ab9 (ghost)                                                               |

## Reclassification Rate

10 of 14 sessions were reclassified (71%). The registry over-classified several planning/review sessions as BUILD, and under-classified the FliHub ralphy planning session as ORIENTATION.

**Registry vs Analysed**:

- 6 registry BUILD -> 2 actual BUILD, 2 PLANNING, 1 META, 1 (remained BUILD but different subtype not needed)
- 5 registry ORIENTATION -> 1 actual ORIENTATION, 1 REVIEW, 1 PLANNING, 2 META
- 1 registry KNOWLEDGE -> 1 actual KNOWLEDGE (correct)
- 1 registry UNKNOWN -> 1 actual META ghost (correct pattern)

## Key Patterns

### BMAD Methodology Sprint in Action

This wave captures a complete BMAD sprint cycle for SupportSignal:

1. **Status check** (7112ad0c) - course-correct skill
2. **Story creation** (4c3f5765, ba19dbe2) - SM creates/reviews story 1.2
3. **Build** (fb3670cb) - dev implements story 1.2
4. **Delivery review** (1e07466a) - DR reviews the build output
5. **Story creation** (e2624d94, 98492233) - SM creates/reviews story 1.3
6. **Build** (719bbffe) - dev implements story 1.3

This is the first wave showing the full BMAD lifecycle: plan -> build -> review -> next story.

### Session Startup Churn

3 sessions (f8b16045, 84ce8ab9, f19c27ca) were abandoned/ghost sessions around 08:45-08:48, suggesting David was starting and restarting Claude Code to get the right session going. All three happened within 3 minutes.

### FliHub Planning via Ralphy

0e9b4604 used `/ralphy` but only for planning (wrote IMPLEMENTATION_PLAN.md and AGENTS.md). No Agent/Task calls, no source code. This is planning.ralphy_planning, not build.

### Registry Accuracy Issues

The registry marked 6 sessions as BUILD but only 2 actually wrote source code. The BMAD SM (story manager) sessions create \_bmad-output artifacts, not code -- these are PLANNING, not BUILD. This distinction is important for campaign metrics.
