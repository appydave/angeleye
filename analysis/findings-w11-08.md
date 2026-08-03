---
type: analysis
title: 'Findings W11-08'
description: 'Wave 11 Batch 08: 9 sessions, 11% BUILD accuracy; context poisoning named, process correction session type, livestream ingestion workflow.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 11-08

**Agent**: W11-08
**Sessions analysed**: 9
**Date**: 2026-03-23
**Session IDs**: d8a72400, b4a33efb, 8ee65d81, c05895fc, f3f48d9f, ae9475ba, d22cbb1c, c3b01cb4, 31ad7630

## Classification Summary

| Session  | CWD Project          | Registry Type | Reclassified To | Subtype                        | Scale    | Interest |
| -------- | -------------------- | ------------- | --------------- | ------------------------------ | -------- | -------- |
| d8a72400 | prompt.supportsignal | BUILD         | BUILD           | build.feature_iteration        | moderate | medium   |
| b4a33efb | brains               | BUILD         | SYSOPS          | sysops.remote_provisioning     | moderate | medium   |
| 8ee65d81 | brains               | BUILD         | KNOWLEDGE       | knowledge.brain_creation       | moderate | high     |
| c05895fc | prompt.supportsignal | BUILD         | DEBUG           | debug.config_debugging         | light    | high     |
| f3f48d9f | brains               | BUILD         | KNOWLEDGE       | knowledge.brain_maintenance    | light    | high     |
| ae9475ba | brains               | BUILD         | KNOWLEDGE       | knowledge.brain_creation       | light    | high     |
| d22cbb1c | prompt.supportsignal | BUILD         | KNOWLEDGE       | knowledge.orchestration_design | light    | high     |
| c3b01cb4 | brains               | BUILD         | DEBUG           | debug.process_correction       | light    | high     |
| 31ad7630 | prompt.supportsignal | BUILD         | REVIEW          | review.backlog_audit           | light    | medium   |

**BUILD accuracy: 1/9 (11%)** — only d8a72400 is genuinely BUILD. Consistent with wave 9's 11% at this scale mix (1 moderate, 8 light).

## Key Findings

### F1: "Context poisoning" anti-pattern named by user (f3f48d9f)

The user explicitly names the "context poisoning" anti-pattern in session f3f48d9f: "I don't know. I just feel if I save stuff into the memory without really thinking it through, we're just going to create context poisoning." This is a deliberate, named concept — stale or aspirational documentation misleading Claude into wrong behavior. First observed in wave 8, now confirmed as a term the user actively uses.

### F2: Process correction sessions are a distinct category (c3b01cb4)

Session c3b01cb4 is not debugging code — it is debugging Claude's process. The user opens with "You've done all of this contrary to the way I've asked you to do it in the past." This reveals a meta-failure: the NotebookLM skill was not loading, causing Claude to fall back to default behavior that violated established conventions. This is the "skill state reconstruction" problem documented in AngelEye's memory files. The session has unauthorized_edit_before_prompt=true, confirming Claude acted before the user spoke.

Proposed subtype: `debug.process_correction` — distinct from code debugging.

### F3: Livestream note ingestion is a workflow pattern (8ee65d81)

Session 8ee65d81 shows a specific workflow: user watches a livestream (Cole Medin), voice-dictates raw notes, pastes them into Claude (3 times, iteratively expanding), Claude dispatches 6 parallel research agents, then creates structured brain files. The raw notes are dense with voice artifacts ("Talescale", "Gocling", "speach", "claud"). This is a repeatable workflow pattern — live event -> raw notes -> parallel research -> brain creation.

Proposed subtype: `knowledge.livestream_ingestion`

### F4: Multi-agent orchestration is a session type (d22cbb1c)

Session d22cbb1c shows the user operating as an orchestrator across 3 concurrent Claude Code sessions (this one, FliHub, v-appydave). The user pastes handover briefs from the other two sessions and asks Claude to create orchestration documentation and a dedicated skill. This is not BUILD — no application code is written. It is knowledge/documentation work about multi-agent coordination.

Proposed subtype: `knowledge.orchestration_design`

### F5: 52-hour idle gaps are legitimate session continuations (d22cbb1c)

Session d22cbb1c has a 52-hour idle gap (3108 minutes) between the first phase (day 1, 03:43-03:48) and second phase (day 3, 07:37). The user returns and picks up exactly where they left off — asking about multi-agent setup. This is not a session that should be split. The context is preserved and meaningful across the gap.

### F6: CWD incidental rate remains high for prompt.supportsignal

3 of 4 prompt.supportsignal sessions show CWD as incidental or partially incidental:

- d22cbb1c: orchestration work spanning 3 repos
- d8a72400: legitimate (worktree confirms)
- c05895fc: legitimate (IR compiler work)
- 31ad7630: legitimate (backlog audit)

The incidental rate for prompt.supportsignal in this batch is lower (25%) than wave 5's observation ("universally unreliable"), but the orchestration session confirms it can still be misleading.

### F7: Voice artifacts catalog additions

New entries from this wave:

- "Ralphie Wooy" = Ralphy WUI (d8a72400)
- "Raffi" = Ralphy (31ad7630, already in catalog from wave 7)
- "whag" = what (b4a33efb)
- "tese" = these (b4a33efb)
- "actualy" = actually (b4a33efb)
- "perfext" = perfect (d8a72400)
- "Talescale" = Tailscale (8ee65d81)
- "Gocling" = Docling (8ee65d81)
- "speach" = speech (8ee65d81)
- "claud" = Claude (8ee65d81)
- "generaion" = generation (8ee65d81)
- "evalutate" = evaluate (8ee65d81)
- "potentical" = potential (8ee65d81)
- "persistant" = persistent (8ee65d81)
- "Phots" = Photos (8ee65d81)

Session 8ee65d81 alone contributes 9 new voice artifacts — the livestream note-taking context produces the highest density of voice errors seen in any single session.

### F8: Friction predicates P13-P16 distribution

| Predicate                   | Count | Sessions                     |
| --------------------------- | ----- | ---------------------------- |
| P13 (misunderstood_request) | 3     | c05895fc, f3f48d9f, c3b01cb4 |
| P14 (wrong_approach)        | 3     | b4a33efb, c05895fc, c3b01cb4 |
| P15 (buggy_output)          | 1     | c05895fc                     |
| P16 (excessive_changes)     | 0     | -                            |

P13+P14 co-occurrence in 2 sessions (c05895fc, c3b01cb4). In c05895fc: Claude lacked knowledge of WUI component AND hardcoded NDIS-specific conditions. In c3b01cb4: Claude didn't know NotebookLM conventions AND wrote to wrong location.

### F9: Subagent-inflated file sizes

Session ae9475ba has 68KB file size for only 49 events. The inflation comes from the subagent research output embedded in a task-notification user_prompt — a single event contains the full NemoClaw research report (~20KB). File size is unreliable as a session complexity metric when subagents produce large outputs.

## Subtype Proposals

| Subtype                        | Count | Sessions           | Confidence |
| ------------------------------ | ----- | ------------------ | ---------- |
| build.feature_iteration        | 1     | d8a72400           | high       |
| sysops.remote_provisioning     | 1     | b4a33efb           | high       |
| knowledge.brain_creation       | 2     | 8ee65d81, ae9475ba | high       |
| knowledge.livestream_ingestion | 1     | 8ee65d81           | medium     |
| knowledge.brain_maintenance    | 1     | f3f48d9f           | high       |
| knowledge.orchestration_design | 1     | d22cbb1c           | high       |
| debug.config_debugging         | 1     | c05895fc           | high       |
| debug.process_correction       | 1     | c3b01cb4           | high       |
| review.backlog_audit           | 1     | 31ad7630           | high       |

New subtypes proposed: `knowledge.livestream_ingestion`, `knowledge.orchestration_design`, `debug.process_correction`

## Statistics

- Sessions processed: 9
- BUILD reclassification rate: 89% (8/9)
- P13 (misunderstood): 3/9 (33%)
- P14 (wrong_approach): 3/9 (33%)
- P15 (buggy_output): 1/9 (11%)
- P16 (excessive_changes): 0/9 (0%)
- CWD incidental: 2/9 (22%)
- Cross-session references: 4/9 (44%)
- Voice dictation artifacts: 7/9 (78%)
- Brain file writes: 3/9 (33%)
- Multi-phase: 7/9 (78%)
- Frustration signals: 5/9 (56%)
- New voice artifacts: 15
- New subtypes proposed: 3
