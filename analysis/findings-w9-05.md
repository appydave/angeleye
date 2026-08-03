---
type: analysis
title: 'Findings W9-05'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 9 Batch 05 (W9-05)

**Date**: 2026-03-23
**Sessions analysed**: 9
**Scale distribution**: 1 moderate, 3 light, 5 micro
**Registry BUILD accuracy**: 1/9 (11%) — only 7c8f91e4 (signal-studio) was genuinely BUILD

---

## Session Summary

| Session ID | Project              | Scale    | Registry | Reclassified | Subtype                     |
| ---------- | -------------------- | -------- | -------- | ------------ | --------------------------- |
| 7c8f91e4   | signal-studio        | moderate | BUILD    | BUILD        | build.campaign              |
| dd804b93   | voz                  | light    | BUILD    | PLANNING     | planning.agent_design       |
| eddd4bbb   | app.supportsignal    | light    | BUILD    | OPERATIONS   | operations.doc_cleanup      |
| 8f7420da   | appydave-plugins     | light    | BUILD    | SKILL        | skill.creation              |
| 9debb0ee   | v-appydave           | light    | BUILD    | SYSOPS       | sysops.git_push             |
| bfd7fd99   | angeleye             | micro    | BUILD    | SETUP        | setup.install_attempt       |
| 3d6ee983   | prompt.supportsignal | micro    | BUILD    | ORIENTATION  | orientation.knowledge_check |
| 66b88531   | brains               | micro    | BUILD    | META         | meta.accidental_vent        |
| ae92065b   | brains               | micro    | BUILD    | RESEARCH     | research.quick_question     |

---

## Key Findings

### F1 — BUILD accuracy 11% (1/9) in this batch

Consistent with overall wave 6-8 trends (~17-25%). This batch is skewed toward light/micro sessions which are almost never BUILD. The sole correct BUILD (7c8f91e4) is a genuine Ralphy campaign with 13 subagents.

### F2 — E2E vs UAT naming confusion as a durable frustration source (7c8f91e4)

Signal-studio has two parallel testing concepts: E2E (automated Playwright specs) and UAT (human acceptance checklists). Claude repeatedly conflates them. The user's frustration in this session is severe ("complete clusterfuck", "I never ever once asked you to do E2E"). This is a naming ambiguity problem in the project's documentation — both concepts coexist and Claude defaults to E2E because automated tests are more tool-actionable.

**Implication for AngelEye**: This is a "context poisoning" variant (wave 8 finding) — project docs make both concepts equally visible, and Claude picks the wrong one because it aligns with tool usage patterns.

### F3 — Client project planning session for vOz (dd804b93)

First confirmed vOz session in the analysis campaign. Reveals a client workflow pattern: orient on prior plans -> discuss agent design options -> decide ("Art Director") -> update planning docs -> note to email client. CWD is reliable because vOz is a dedicated client directory. Registry BUILD wrong because zero code written.

**New subtype**: planning.agent_design — planning what kind of agent/system to build, not building it.

### F4 — "Claude as in-meeting assistant" usage pattern (ae92065b)

User voice-queries Claude during a live Microsoft Teams meeting about Krisp AI behavior. Single prompt, zero tool calls, immediate answer needed. This is a real-time advisory usage pattern that doesn't fit standard session types well — closest is RESEARCH but the time pressure and context (mid-meeting) are distinctive.

### F5 — Voice-into-terminal vent sessions (66b88531)

Single frustrated prompt about UI behavior, zero tool calls. User vented frustration about a macOS/app UI into a Claude terminal window. Not a work session — pure noise. But interesting as a pattern: voice dictation lowers the barrier to creating accidental sessions. This is the second confirmed "vent session" in the campaign.

### F6 — "POEM WUI" tag in micro orientation session (3d6ee983)

The prompt "What do you know about the application... POEM WUI" ends with what appears to be a workflow/reference tag ("POEM WUI"). This may be a shorthand the user uses to signal which workflow or documentation system they're referencing. Worth watching for in future sessions.

### F7 — Plugin reload UX feedback as session pivot (8f7420da)

Interesting two-phase micro-session: Phase 1 is skill creation from a structured handover doc, Phase 2 pivots to improving the plugin reload command's UX. The pivot was triggered by the user actually using the reload command and noticing bad UX. This is a "dogfooding discovery" pattern — using your own tools reveals improvement opportunities.

### F8 — CLAUDE.md cleanup as OPERATIONS, not BUILD (eddd4bbb)

Reorganising CLAUDE.md and pushing content to child index files is documentation maintenance (OPERATIONS), not feature construction (BUILD). The session has 5 Write calls but all target .md files. Zero code files touched. Clean commit-and-push closure pattern.

---

## Statistics

- **Registry BUILD overrides**: 8/9 (only 7c8f91e4 confirmed BUILD)
- **Junk sessions**: 1 (66b88531 — accidental vent)
- **CWD incidental**: 3 (66b88531, ae92065b, 3d6ee983)
- **Frustration detected**: 2 (7c8f91e4 severe, 66b88531 unrelated vent)
- **Voice dictation**: 7/9 sessions show voice artifacts
- **Cross-session refs**: 2 (7c8f91e4 paste handover, 8f7420da paste handover)
- **New subtypes**: 4 (planning.agent_design, operations.doc_cleanup, setup.install_attempt, research.quick_question)
- **Friction predicates**: P13 (misunderstood_request) 1/9, P14 (wrong_approach) 1/9, P15 (buggy_output) 0/9, P16 (excessive_changes) 0/9

---

## Subtype Candidates (new from this batch)

| Subtype                     | Count | Session(s) | Confidence |
| --------------------------- | :---: | ---------- | ---------- |
| planning.agent_design       |   1   | dd804b93   | medium     |
| operations.doc_cleanup      |   1   | eddd4bbb   | high       |
| setup.install_attempt       |   1   | bfd7fd99   | medium     |
| research.quick_question     |   1   | ae92065b   | medium     |
| orientation.knowledge_check |   1   | 3d6ee983   | medium     |
| meta.accidental_vent        |   1   | 66b88531   | high       |

---

## Running Totals (cumulative through W9-05)

- Sessions analysed: 356
- Subtypes accumulated: ~215+ across 15+ parent types
- Discovery rate: 0.44 new subtypes/session this batch (4 new from 9 sessions)
