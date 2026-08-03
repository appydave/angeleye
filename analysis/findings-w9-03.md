---
type: analysis
title: 'Findings W9-03'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 9 Batch 03

**Wave**: W9-03 (forward)
**Sessions analysed**: 9
**Date**: 2026-03-23
**Analyst**: Claude Opus 4.6 (agent)

---

## Batch Summary

| Session  | Project              | Scale    | Registry Type | Analysed Type                                | Correct? |
| -------- | -------------------- | -------- | ------------- | -------------------------------------------- | -------- |
| 7e7da3b8 | signal-studio        | moderate | BUILD         | BUILD (build.campaign)                       | Yes      |
| c121ef35 | appydave-plugins     | light    | BUILD         | SKILL (skill.creation_and_fix)               | No       |
| 2738f3e0 | appystack            | light    | BUILD         | PLANNING (planning.handover_creation)        | No       |
| 71d5df75 | app.supportsignal    | light    | BUILD         | BUILD (build.feature_port)                   | Yes      |
| 123b11a5 | angeleye             | micro    | BUILD         | OPERATIONS (operations.file_triage)          | No       |
| 4344a6bd | brains               | micro    | BUILD         | ORIENTATION (orientation.artifact_retrieval) | No       |
| 2cba7b11 | prompt.supportsignal | micro    | BUILD         | ORIENTATION (orientation.abandoned)          | No       |
| 9287d18d | brains               | micro    | BUILD         | SYSOPS (sysops.desktop_troubleshooting)      | No       |
| d81b6338 | prompt.supportsignal | micro    | BUILD         | META (meta.smoke_test)                       | No       |

**BUILD accuracy**: 2/9 (22%) — consistent with wave 6-8 trends (~17-25%).

---

## Session Analyses

### 7e7da3b8 — signal-studio / BUILD.campaign (moderate)

**What happened**: Full Ralphy-mode build campaign spanning an entire day with two large idle gaps. Four distinct phases:

1. **Gap analysis** (00:02-00:23): Evaluated Angela's 24 pending feedback items, created decision log (D001-D013) and AS-001 requirements document with 10 work units
2. **Ralphy build** (05:20-05:42): Mode 3 coordinator loop with 7 Agent calls executing wave 8 work units — participant profile revisions, moments redesign, shift profiles
3. **UAT attempt** (23:05-23:14): Commit, port conflict (EADDRINUSE x3), Playwright-based UI audit of participant profile
4. **Design fixes** (23:43-23:57): Post-compaction continuation fixing raw Tailwind red classes violating brand CSS variable system

**Notable patterns**:

- **EADDRINUSE recurrence**: Port 6041 conflict hit 3 times. User tried killing wrong ports initially (3001, 5173-5175 instead of 6040-6041). This is a documented recurring pattern for signal-studio.
- **Subagent design-system violations**: Wave agents used raw Tailwind `red-*` classes and hardcoded `#dc2626` instead of CSS vars. User noticed "this looks ugly." Design-system awareness is missing from subagent context.
- **Voice artifacts**: "rough Wiggum loop" = Ralphy loop, "Ralfi" = Ralphy, "ang skill" = Angela skill, "content" = context (in "we're out of content").
- **Compaction summary quality**: Line 98 contains an extremely detailed compaction summary (~86KB equivalent) with exact file paths, code snippets, and pending tasks. One of the best compaction summaries observed — Claude was able to resume and execute fixes directly.

**Interest**: High — exemplary full-lifecycle build.campaign.

---

### c121ef35 — appydave-plugins / SKILL.creation_and_fix (light)

**What happened**: Two-phase skill session separated by a 2-hour gap:

1. **Phase 1** (06:48-06:58): User asks if a download-move skill exists, invokes `/skill-creator`, new skill scaffolded with Write(2), committed
2. **Phase 2** (08:56-08:58): User pastes structured output from a prior session showing the skill was used but the confirmation step was bypassed, asks Claude to fix the underlying issue. Edit(2) applied.

**Notable patterns**:

- **Cross-session feedback loop**: User pastes a formatted 5-step workflow with checkmarks from a prior session to diagnose the skill's failure mode. This is a post_mortem session chain — reviewing prior usage to fix a bug.
- **Skill-creator invocation**: `/skill-creator` used properly — Read existing skills, scaffold structure, create files. Confirms skill.creation subtype.
- **Incomplete sentence voice artifact**: "That the skill is running from" — sentence trails off, typical of speech-to-text.

**Interest**: Medium — good example of skill lifecycle (create, use, find bug, fix).

---

### 2738f3e0 — appystack / PLANNING.handover_creation (light)

**What happened**: User creates formal handover documents for two future work streams — Mochaccino skill genericization and AppyStack upgrade tool. Extensive context pasted from a prior session containing Claude's design responses.

**Notable patterns**:

- **Handover document pattern**: Structured briefs with sections for Brief, Resources, What To Do, Out of Scope, Questions for the Developer. Two handover docs written as Write(2).
- **Massive context paste**: User pastes 5+ prior-session Claude responses covering design decisions for Mochaccino (discovery mindset ordering, data-shape-first default, gap analysis). This is the largest cross-session paste observed outside of compaction summaries — but it's deliberate context transfer, not injection.
- **Voice artifact**: "Mockachino" = Mochaccino, "Leo" = unclear (possibly "let go" or "let's" via speech-to-text).
- **Skill invocations**: `/handover-pattern` loaded as a skill — confirms this is a deliberate handover creation process with tooling.

**New subtype**: `planning.handover_creation` — formal structured handover doc production for future sessions. Distinct from planning.requirements (which produces specs) and planning.backlog (which produces task lists).

**Interest**: Medium — validates PLANNING as a parent type with growing subtype diversity.

---

### 71d5df75 — app.supportsignal / BUILD.feature_port (light)

**What happened**: User discovers that a prior session failed to properly port the /triage command from POEM to SupportSignal. Pastes POEM's triage structure as briefing, expresses frustration, Claude creates the missing slash command.

**Notable patterns**:

- **Corrective followup chain**: Prior session was supposed to port triage but left the slash command entry point missing. User discovered the gap when trying to use it. Explicit frustration: "you didn't fucking move it over."
- **Feature porting**: Distinct from build.migration (which moves data/schema) — this ports a capability/workflow between systems.
- **Fast resolution**: Despite frustration, resolved in 7 minutes — read POEM's approach, create equivalent, commit.

**New subtype**: `build.feature_port` — porting an existing capability from one system to another. Different from migration (structural) — this is functional replication.

**Interest**: Medium — corrective followup pattern with frustration, validates cross-session chain detection.

---

### 123b11a5 — angeleye / OPERATIONS.file_triage (micro)

**What happened**: User notices stray files (meeting agenda, conversation requirements doc) in the angeleye folder, asks Claude to inspect and potentially delete them. Reads the files, user says "delete it," then asks an unrelated AppyStack question.

**Notable patterns**:

- **File triage micro-pattern**: Quick housekeeping — inspect unknown files, decide disposition, delete.
- **Session pivot (abandoned)**: Final prompt pivots to "what skill would kick off a new application using the Revit or the API stack?" — but session ends without response. Classic micro-session pattern: housekeeping task done, unrelated question tossed in, session abandoned.
- **Voice artifact**: "Revit" = RVETS (voice artifact for the stack name).

**Interest**: Low — routine housekeeping.

---

### 4344a6bd — brains / ORIENTATION.artifact_retrieval (micro)

**What happened**: Single prompt asking Claude to read a large SupportSignal workflow data file and assess whether brains need anything from it. Single Read call.

**Notable patterns**:

- **CWD incidental (confirmed)**: CWD is brains/ but the file read targets prompt.supportsignal workflow data. Classic brains-terminal-used-as-general-purpose-assistant pattern.
- **Information assessment pattern**: "Just tell me whether the brains needed anything from this information" — not reading to build, reading to evaluate relevance.

**Interest**: Low — confirms brains/ CWD incidental rule.

---

### 2cba7b11 — prompt.supportsignal / ORIENTATION.abandoned (micro)

**What happened**: Single prompt ("what do I need to know from last 4 releases"), zero tool calls, zero response recorded. Session died immediately.

**Notable patterns**:

- **Abandoned session**: User likely opened Claude, typed/spoke a question, then closed before response. Or Claude crashed/disconnected.
- **prompt.supportsignal CWD incidental (confirmed)**: Wave 5 established this CWD is universally unreliable.

**Disposition**: Junk — no analytical value beyond confirming abandoned session pattern.

---

### 9287d18d — brains / SYSOPS.desktop_troubleshooting (micro)

**What happened**: User asks about re-docking a detached iTerm tab into a window — pure desktop environment troubleshooting.

**Notable patterns**:

- **Claude as general assistant**: Development tool (Claude Code) used for desktop UI question. No code, no tools, no project relationship.
- **CWD incidental**: brains/ terminal, iTerm question — confirms brains/ CWD rule.
- **"On my old computer" reference**: Mentions behavior change between machines — M4 migration context.

**Interest**: Low — validates SYSOPS.desktop_troubleshooting subtype.

---

### d81b6338 — prompt.supportsignal / META.smoke_test (micro)

**What happened**: "What is 2+2? Just the number." — classic Claude Code connectivity check.

**Disposition**: Junk — zero analytical value.

---

## Cross-Session Observations

### BUILD accuracy continues at ~22%

Only 2/9 sessions (7e7da3b8, 71d5df75) are genuine BUILD. Pattern holds: micro sessions are never BUILD, light sessions rarely BUILD, moderate sessions sometimes BUILD. This batch: micro 0/5, light 1/3, moderate 1/1.

### Micro session classification breakdown

5 micro sessions in this batch:

- 2 junk (abandoned, smoke test) — disposition: junk
- 2 genuine micro (file triage, artifact retrieval) — disposition: active
- 1 desktop troubleshooting (SYSOPS) — disposition: active

Consistent with wave 5 finding: micro sessions split roughly 3 ways (genuine/junk/machine-initiated).

### Cross-session references in 3/9 sessions

- c121ef35: Pasted prior session workflow output for bug diagnosis (post_mortem)
- 2738f3e0: Pasted prior session Claude responses for handover context (continuation)
- 71d5df75: References failed prior port (corrective_followup)

Cross-session references are more common than initially expected (~33% in this batch). They carry important session-chain-role signal.

### Voice artifacts catalog additions

- "rough Wiggum loop" = Ralphy loop (new)
- "Ralfi" = Ralphy (previously documented as "Raffi")
- "Mockachino" = Mochaccino (new)
- "Revit" = RVETS (new)
- "content" = context (new — "we're out of content" = "we're out of context")
- "Leo" = unclear (possible "let go" or "let's") (new)

### New subtypes proposed

- `planning.handover_creation` — structured handover doc production for future sessions (1 instance)
- `build.feature_port` — porting existing capability between systems (1 instance)
- `operations.file_triage` — quick file inspection/deletion housekeeping (1 instance)
- `skill.creation_and_fix` — create skill then fix it based on usage feedback (1 instance)
- `sysops.desktop_troubleshooting` — desktop environment questions unrelated to development (1 instance)
- `orientation.abandoned` — session died before any work (1 instance)

---

## Wave 9 Batch 03 Statistics

- Sessions processed: 9
- BUILD misclassifications: 7/9 (78%)
- New subtypes proposed: 6
- Disposition: 7 active, 2 junk
- Interest levels: 1 high, 3 medium, 5 low
- Cross-session references detected: 3/9
- Frustration signals detected: 2/9
- Voice artifacts detected: 6/9
- CWD incidental: 4/9
