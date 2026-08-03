---
type: analysis
title: 'Findings W7-09'
description: 'Wave 7 analysis (W7-09) of 8 sessions — 12.5% BUILD accuracy, relay collaboration pattern, delegation authority grant, 9 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7-09

**Agent**: W7-09
**Sessions analysed**: 8
**Date**: 2026-03-22
**Wave type**: Forward wave (new sessions)

---

## Sessions Summary

| Wave ID     | Session ID | Project              | Scale    | Type (Registry) | Type (Analysed)                       | Correct? |
| ----------- | ---------- | -------------------- | -------- | --------------- | ------------------------------------- | -------- |
| W7-328f8ad5 | 328f8ad5   | brains               | micro    | RESEARCH        | SYSOPS.license_lookup                 | No       |
| W7-a785d086 | a785d086   | lars                 | micro    | BUILD           | OPERATIONS.content_entry              | No       |
| W7-5e587cc8 | 5e587cc8   | prompt.supportsignal | micro    | BUILD           | RESEARCH.brain_search                 | No       |
| W7-55a6468b | 55a6468b   | appystack            | light    | BUILD           | PLANNING.feature_requirements_to_plan | No       |
| W7-9ef7a313 | 9ef7a313   | angeleye             | moderate | BUILD           | PLANNING.feature_plan_then_build      | Partial  |
| W7-65dec077 | 65dec077   | appydave-plugins     | moderate | BUILD           | REVIEW.repo_audit_then_cleanup        | No       |
| W7-31f38fde | 31f38fde   | app.supportsignal    | light    | BUILD           | SETUP.dev_env_bun_convex              | No       |
| W7-4bb89879 | 4bb89879   | signal-studio        | heavy    | BUILD           | KNOWLEDGE.collaborative_data_design   | No       |

**BUILD accuracy this wave: 1/8 (12.5%)** — only W7-9ef7a313 partially correct (it did contain build work, but is primarily PLANNING).

---

## Per-Session Observations

### W7-328f8ad5 — brains / Camtasia license keys

**Type**: SYSOPS.license_lookup (not RESEARCH)
**Scale**: micro (1 event, 0 tools, single prompt)

- PII alert: Camtasia 2021/2022/2023 software keys are embedded verbatim in the prompt
- Classic incidental CWD: brains/ but content is a personal software license question
- Zero tool calls — purely conversational. Not RESEARCH (no investigation), not BUILD (no code)
- Pattern: Software license key lookup is a recurring SYSOPS micro-category. Establish `sysops.license_lookup` subtype.
- The user pasted directly from the TechSmith website — a `context_loading_paste` opening style

### W7-a785d086 — lars / Loom video entry

**Type**: OPERATIONS.content_entry (not BUILD)
**Scale**: micro (6 events, 5 tools)

- User asks to "add this loom" — adding a video record to the lars client repo
- 2 ToolSearch calls at start = skill gap signal: agent searched for a Loom/content-entry skill, found nothing, then Read+Edit manually
- Candidate skill: `loom-entry` or `content-entry` for managing Loom video records in client repos
- First prompt has voice register: "I've got to send it out later today. There'll be others coming." — typical voice dictation cadence
- Registry BUILD is wrong. No code written, no feature built.

### W7-5e587cc8 — prompt.supportsignal / brain search

**Type**: RESEARCH.brain_search (not BUILD)
**Scale**: micro (4 events, 2 Agent tools)

- Both prompts are personal knowledge retrieval: "what brain has mary and jans new computer" and monitor purchase question
- CWD is prompt.supportsignal.com.au — classic incidental. This is the third confirmation this wave of that CWD being used as a "home terminal" for personal tasks
- Voice artifacts: "infienty" = "Infinity" (Samsung S7 Infinity monitor); no caps/punctuation throughout
- PII: Family member names (Mary, Jan)
- Pattern confirmed: `research.personal_knowledge_retrieval` via Agent calls for brain file lookup. Both prompts dispatch immediately to Agent — no ToolSearch gap.

### W7-55a6468b — appystack / planning

**Type**: PLANNING.feature_requirements_to_plan (not BUILD)
**Scale**: light (18 events, 8 min)

- Classic 3-phase session: commit ceremony → UX requirements discussion → formal plan mode
- Voice artifact: "Why is it feeling harder to sit up than I would have thought?" — "sit up" = "set up"
- EnterPlanMode + Agent + Write(IMPLEMENTATION_PLAN) + ExitPlanMode = planning artifact delivered, not product code
- User's ideal UX stated in voice: "I actually love npx create-appystack" — goal statement
- Skill invocation at opening: `commit` skill triggered with single-word "commit" prompt

### W7-9ef7a313 — angeleye / planning+build

**Type**: PLANNING.feature_plan_then_build (partially correct BUILD)
**Scale**: moderate (49 events, 44 active min, 974 total with 930-min overnight gap)

**Concurrent session pair (second confirmed instance this campaign):**

- Prompt 3: "Got another conversation working on wave 10" — explicit concurrent session reference
- Both sessions modified ObserverView.tsx; combined state left git opaque
- Frustration: "I don't understand why I'm seeing all this. I don't know what should be removed, pushed, cleaned up. It's not a good look." — confusion about multi-session git state

**Interesting patterns:**

- /ralphy opening → status check → B022 design → overnight gap → approval → write plan → subagent build → git confusion
- Subagent (`general-purpose` type) executed B022 cleanly: 4 ObserverView edits, quality gates passed
- "Wave 10 is complete" read from IMPLEMENTATION_PLAN.md across sessions — cross-session state coordination via shared file artifact (not via conversation)
- **New subtype candidate**: `planning.feature_plan_then_build` — session that crosses from PLANNING into a build execution within the same conversation

### W7-65dec077 — appydave-plugins / repo audit and cleanup

**Type**: REVIEW.repo_audit_then_cleanup (not BUILD)
**Scale**: moderate (49 events, 14 active min)

**Notable patterns:**

- `Explore` subagent type observed (distinct from `general-purpose`) — dispatched for the inventory pass
- Delegation pattern: "I'll just leave you to work on all the low-hanging fruit that you can do that doesn't need too much input from me" — user grants autonomous cleanup authority. First clear observation of explicit delegation scope grant.
- Session produced actionable deliverables: PLUGIN-ISSUES.md (new inbound queue system), orphan file removal, misplaced handover doc relocation, ralphy SKILL.md principle additions
- Cross-repo maintenance pattern: ralphy SKILL.md updated with 2 new principles from I006 post-mortem (quality gate must be mandatory, read actual files before designing data shapes)
- Plugin versioning as session outcome: appydave plugin bumped to v1.15.0, ralphy to v1.9.1

**New subtype candidate**: `review.repo_audit_then_cleanup` — honest assessment followed by autonomous cleanup of structural issues

### W7-31f38fde — app.supportsignal / dev environment setup

**Type**: SETUP.dev_env_bun_convex (not BUILD)
**Scale**: light (36 events, 15 min)

- "on this computer" in prompt 2 signals new machine context
- Bash-heavy (72%) for test runner invocations — looks like BUILD but is dev env setup
- Clear 4-phase: capability question → smoke tests → bun install + PATH → test validation
- Edit targets .zshrc (system config), not product code
- Session ends mid-validation (abrupt abandon after "can I see the convex test results")
- Convex testing setup is a recurring dev env pattern for supportsignal sessions

### W7-4bb89879 — signal-studio / collaborative data design

**Type**: KNOWLEDGE.collaborative_data_design (not BUILD)
**Scale**: heavy (119 events, 81 active min, 202 total)

**Novel pattern: relay collaboration**

- Angela is an external collaborator with her own Claude Code session
- David acts as relay: "write a prompt for Angela, she's going to paste it into her Claude Code"
- Session includes producing a structured prompt for Angela to execute in her session — cross-user session coordination
- Data merge conflicts arise from two humans (David + Angela) both having Claude sessions working on the same repo

**Interesting moments:**

- Prompt 25 has profanity: "I don't know what the fuck canonical actually means" — frustration with technical terminology that Claude imported without checking the user's vocabulary
- Michael Chen was accidentally deleted by data merge — "we shouldn't have killed him" — data integrity issue surfacing
- Session ends at 3% context: "we're running rough in a different window since we only got 3% context" — near-compaction scenario with no actual compaction event recorded

**New subtype candidates**:

- `knowledge.collaborative_data_design` — multi-party data schema and seed data strategy session
- `knowledge.relay_prompt_writing` — producing a prompt for a human collaborator to paste into their own Claude session

---

## Wave-Level Observations

### BUILD accuracy: 12.5% (1/8)

Consistent with wave 6 findings. Micro and light sessions are never BUILD this wave: 0/4 correct. The one partial BUILD hit (W7-9ef7a313) is a PLANNING session that happened to include a build phase.

### Incidental CWD confirmed 3x this wave

- 328f8ad5: brains/ → personal Camtasia key lookup
- 5e587cc8: prompt.supportsignal/ → personal hardware research
- 55a6468b: appystack/ → PLANNING not BUILD (CWD nominally correct but type wrong)

prompt.supportsignal.com.au confirmed as a "home terminal" CWD (wave 5 finding) — this wave adds two more personal-task sessions run from that directory.

### Voice dictation artifacts: 7/8 sessions

All sessions except 328f8ad5 (which was a website paste) show voice register. Confirms the wave 1 finding universally.

### Concurrent session pair (second confirmed instance)

W7-9ef7a313 is the second concurrent session pair observed (after wave 6). Both pairs share a common source file (ObserverView.tsx here), creating git state opacity. Pattern: when two sessions both touch the same file and neither commits before the other, the closer session is confused by the accumulated state.

### New subtype candidates from this wave

1. `sysops.license_lookup` — personal software key retrieval (1 example)
2. `operations.content_entry` — adding content records to repos (1 example)
3. `research.personal_knowledge_retrieval` — brain search for personal/family matters (1 example)
4. `planning.feature_requirements_to_plan` — UX requirements → formal plan artifact (1 example)
5. `planning.feature_plan_then_build` — planning session that crosses into build within same conversation (1 example)
6. `review.repo_audit_then_cleanup` — honest structural assessment + autonomous cleanup (1 example)
7. `setup.dev_env_bun_convex` — new machine dev environment setup (1 example)
8. `knowledge.collaborative_data_design` — multi-party data design with external collaborator (1 example)
9. `knowledge.relay_prompt_writing` — writing prompts for human collaborators' Claude sessions (1 example)

### PII detections: 3 sessions

- W7-328f8ad5: Camtasia software license keys (3 keys)
- W7-5e587cc8: Family member names (Mary, Jan) in hardware research
- W7-4bb89879: Multiple person names (Angela, Jane Loader, Billy Brown, Marcus/Michael Chen)

### Delegation authority grant pattern

W7-65dec077 shows explicit delegation: "I'll just leave you to work on all the low-hanging fruit that you can do that doesn't need too much input from me." This phrasing grants Claude autonomous cleanup authority without per-action approval. First clear instance — may be worth tracking as a classifier for REVIEW sessions.

### 3% context warning without compaction

W7-4bb89879 ends with the user noting "we're running rough in a different window since we only got 3% context" — explicit near-compaction warning communicated via prompt text. No compaction event recorded (session ended first). This is a different mode from the compaction_resume pattern — the session terminated before compaction triggered.

---

## Quality Gate Checklist

- [x] Session index entries written for all 8 sessions
- [x] Session types verified (not accepted from registry)
- [x] At least 2 observations per session
- [x] New semantic types flagged (9 new subtype candidates)
- [x] PII flagged in 3 sessions
- [x] JSON validity confirmed (all 257 lines valid)
