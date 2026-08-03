---
type: analysis
title: 'Findings W7-02'
description: 'Wave 7 analysis (W7-02) of 9 sessions — 89% BUILD misclassification, OMI transcript ingestion workflow, primary goal drift pattern, 7 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# findings-w7-02.md — Wave 7, Agent W7-02

**Sessions analysed**: 9
**Wave date**: 2026-03-22
**Session IDs**: b198584c, aca9259c, fb3b3aa3, 752b7415, b0215876, bda59a13, 9e87b170, b2dbcddd, 779fef13
**Registry BUILD accuracy**: 1/9 correct (11%) — b0215876 thumbrack scaffolding

---

## Session-by-Session Findings

---

### W7-b198584c — brain-dynamous — META / micro

**Registry said**: BUILD
**Actual**: META (meta.compaction_flush)
**Confidence**: high

**What happened**: Pre-compaction memory flush injection. The entire 8790-char prompt is a structured system-generated request to summarise conversation context before the session hit auto-compaction. Single Task tool call (likely a subagent dispatched to process the flush). The prior session context covers AWS Glacier research, Cole Medin brain-dynamous YouTube sharing permissions, and branding file cleanup.

**Observations**:

1. Detection pattern confirmed: prompt text begins exactly "Pre-compaction memory flush. The session is near auto-compaction." — this is the canonical detection string.
2. CWD=brain-dynamous is technically correct but irrelevant — the session is machine-generated infrastructure, not human-directed project work.
3. Should be excluded from all human session statistics and workflow analysis.

**New patterns**: None. Reinforces the `meta.compaction_flush` subtype detection rule from wave 3.

---

### W7-aca9259c — ad — SYSOPS / micro

**Registry said**: BUILD
**Actual**: SYSOPS (sysops.remote_query)
**Confidence**: high

**What happened**: Single voice query — "Can you go and have a look at the M4 Pro? For the images directory, tell me how big it is as well and how many files." Claude read a config file and ran two Bash SSH commands to check the remote images directory. No writes, no product work.

**Observations**:

1. CWD=/dev/ad (monorepo root) is the incidental CWD; actual work is on the M4 Pro remote machine.
2. Monorepo root CWD + remote SSH query = SYSOPS, not BUILD. Rule confirmed.
3. The voice phrasing "Can you go and have a look at" is characteristic of casual operational queries.

**New patterns**: `sysops.remote_query` — direct SSH-based system information queries. Not scripting (no Write), not BUILD — pure informational retrieval from remote machine.

---

### W7-fb3b3aa3 — signal-studio — REVIEW / light

**Registry said**: BUILD
**Actual**: REVIEW (review.post_session_audit)
**Confidence**: high

**What happened**: User pastes a massive 19952-char prior session output into signal-studio context and asks "Was anything overwritten other than SkillMD that matters? With SkillMD, what did we change?" — this is a post-session audit of what appystack-upgrade did. 7 Bash calls are git diff/log inspection on signal-studio to see what changed after the upgrade ran.

**Observations**:

1. CWD=signal-studio is incidental — the code under review was in appystack repo. Signal-studio was the upgrade consumer, not the code location.
2. The prior-session frustration context is embedded in the pasted prompt: "I have no idea what you did" — user had 25 silent file overwrites.
3. This session produced no code changes; it was pure forensic investigation.
4. Large context-loading paste as first prompt is a strong REVIEW signal when the paste contains prior tool outputs.

**New patterns**: `review.post_session_audit` — user pastes prior session output to inspect/audit what happened. Distinguishable from `knowledge.advisory` by: the content is tool outputs/diffs, not conceptual discussion; and the intent is forensic ("what changed?") not evaluative ("is this good?").

---

### W7-752b7415 — deckhand — ORIENTATION / light

**Registry said**: ORIENTATION
**Actual**: ORIENTATION (orientation.artifact_retrieval)
**Confidence**: high

**What happened**: User asks about a skill built in a prior session ("We recently did image renaming in the downloads directory. We built a skill for it. What's it called? How do I use it?"). Claude reads 7 files to locate it. User provides more context (from two presentations, should do sequential numbers). Session ends with "Sure, rename him, please" — renaming the skill via Bash.

**Observations**:

1. Registry ORIENTATION is correct here — one of the few cases where the auto-classifier got it right.
2. Read-heavy (7/11 tool calls) with no Edit/Write is a reliable artifact_retrieval signal.
3. The rename at the end is a minor mutation but doesn't change the session type — orientation sessions can include minor corrections.
4. Cross-session refs (P06=true): user references prior session work implicitly in "we recently did".

**New patterns**: None. Strong `orientation.artifact_retrieval` confirmation.

---

### W7-b0215876 — thumbrack — BUILD / light

**Registry said**: BUILD
**Actual**: BUILD (build.scaffolding)
**Confidence**: high

**What happened**: User pastes prior session output recommending git init be added to create-appystack scaffolding, then asks Claude to do the scaffold completion steps. Claude runs git init, creates package.json with @appydave scope, npm publishes, and pushes. Mid-session frustration when published to klueless-io instead of @appydave — quickly corrected with republish.

**Observations**:

1. Registry BUILD is correct. One of only 2/9 correct classifications in this wave.
2. Brief frustration event: "Why did you put it under klueless-io? Didn't I tell you to put it on that @appydave" — scope instruction was in the pasted prior session output that Claude misread.
3. This is a context-loss-from-paste failure: the @appydave scope was buried in 1774 chars of pasted context and was lost.
4. Bash-heavy (16/21 = 76%) with Write (1) for package.json — operational_scripting profile for BUILD.

**New patterns**: `build.scaffolding` — completing app setup infrastructure (git init, npm publish, scope correction). Distinct from `build.campaign` (ralphy + agent orchestration) and `build.migration` (structured migration with verification).

---

### W7-bda59a13 — v-voz — SKILL / moderate

**Registry said**: BUILD
**Actual**: SKILL (skill.creation)
**Confidence**: high

**What happened**: 3-phase session. Phase 1: review Jan's audit of Byron brand strategist agent and confirm duplication issue is resolved. Phase 2: VOZ knowledge capture problem discussion — user describes how VOZ gets confused when Claude offers critiques vs captures. Phase 3: Kate KDD skill designed and created (SKILL.md + session-template.md + handover doc), committed and pushed.

**Observations**:

1. Registry BUILD wrong; this is SKILL. The primary deliverable is a new skill file, not product code.
2. Multi-phase with clear transition: P1 (artifact review) → P2 (problem design) → P3 (skill construction).
3. The Kate KDD persona is interesting: designed explicitly as "a reporter, not an analyst" — captures VOZ's experience without evaluation. This is a novel skill constraint pattern.
4. Synthesis tool profile: Read-heavy → Write (3) + Bash (git) — classic synthesis of existing context into new artifact.
5. `skill.creation` subtype confirmed with strong evidence.

**New patterns**: Kate KDD design principle — "reporter, not analyst" guardrail on a skill. The `*open` command for capturing confusion without resolving it is a novel UX pattern for knowledge-capture skills.

---

### W7-9e87b170 — lars — KNOWLEDGE / heavy

**Registry said**: BUILD
**Actual**: KNOWLEDGE (knowledge.client_onboarding)
**Confidence**: high

**What happened**: Re-activating the Lars client relationship. Phase 1 (quick): reading the lars brain to assess age and relevance. 333-min gap. Phase 2 (substantive): large voice prompt with OMI device context, planning Lars's onboarding to Claude Code + Ansible + OMI; background Agent dispatched to process raw OMI transcript (raw1.txt); Write creates north star docs and setup guides; Edit refines; email drafted, archived, committed.

**Observations**:

1. Registry BUILD wrong; this is KNOWLEDGE. All deliverables are documentation and planning files, not product code.
2. **New pattern detected**: OMI transcript ingestion — user has an in-person conversation recorded on OMI wearable device, then brings the raw transcript into a Claude Code session for processing via background Agent. This is the first confirmed OMI-to-knowledge-base ingestion workflow.
3. Voice phrasing is notably more rambling than usual: "I'm just blabbing some stuff here that you'll hear when you get the OMI" — suggests voice input while wearing OMI device simultaneously.
4. The "ingestion" folder naming ("Let's call it ingestion for now") is a knowledge architecture decision worth tracking.
5. 333-minute gap reflects a real meeting with Lars happening between the brain assessment and the action phase.

**New subtypes proposed**:

- `knowledge.client_onboarding` — re-activating a dormant client, creating setup guides, north star docs
- `knowledge.omi_transcript_ingestion` — processing raw OMI transcripts via background Agent into client knowledge base

---

### W7-b2dbcddd — supportsignal-v2-planning — PLANNING / heavy

**Registry said**: BUILD
**Actual**: PLANNING (planning.architecture_review)
**Confidence**: high

**What happened**: SupportSignal v2 architecture planning across two days (1656-min gap). Day 1: Claude reads Signal Studio, AWB, prompt.supportsignal repos; 2 background Agents dispatched; user discusses Signal Studio as "direct data reflection engine" for app.supportsignal; epic ordering discussion. Day 2: transfer schema, renderer cleanup, removing deprecated screens.json HTML renderer.

**Observations**:

1. Registry BUILD wrong; this is PLANNING. No new product features created; planning deliverables are the primary output.
2. CWD=supportsignal-v2-planning is a dedicated planning repo — this is a strong PLANNING signal (CWD is a planning directory, not a product repo).
3. Bash-heavy (29/42 = 69%) here is **discovery bash**, not build bash — git log, grep, find to understand codebase state. The distinction between discovery-bash and build-bash matters.
4. 4 Agent dispatches for "deep background research" on Signal Studio, AWB, and renderer state — agent orchestration for reconnaissance, not construction.
5. Frustration-adjacent: user catches Claude calling AWB "HPS" when the correct abbreviation is "HBS" — voice dictation cross-contamination.
6. 1656-minute gap (overnight+) is the longest single gap seen in wave 7.

**New patterns**: `planning.architecture_review` — multi-day planning sessions with background research agents; CWD=planning-repo is a reliable PLANNING signal.

---

### W7-779fef13 — prompt.supportsignal.com.au — MIXED / marathon

**Registry said**: BUILD
**Actual**: MIXED (mixed.research_to_build)
**Confidence**: high

**What happened**: Full-day marathon session. Phase 1: brainstorm only ("no files, just brainstorm") on building HTML front end for YAML/HBS/JSON schema system; Task dispatched to check aigentive-tools archive. Phase 2: AG-UI vs AI SDK 6 architectural synthesis; data jurisdiction issue raised. Phase 3 (after gap): user rereads session, explicitly resets to primary goal, requests poc/wui worktree. Phase 4: EnterWorktree, 2x /ralphy invocations, Edit/Task build campaign for POC.

**Observations**:

1. Registry BUILD partially correct (phase 4 is BUILD) but misses the 3-phase research/design journey that preceded it.
2. **Primary goal drift frustration**: "the problem with our convo is that we got away from the original problem/goal" at 7:29 — after 45+ minutes of architectural discussion, user had to explicitly restate the simple primary goal. Classic scope-creep-in-conversation pattern.
3. CWD=prompt.supportsignal.com.au confirmed as permanent home-terminal CWD (wave 5 finding). All actual work spans: aigentive-tools archive, poc/wui worktree, background Tasks.
4. User declined brain saves explicitly: "lets not do any for now" — deliberate choice to keep research as session context only.
5. Search_without_read detection (8 counts) — 8 Glob calls with no corresponding reads, suggesting background Task results were sufficient without opening files.
6. Session ends unresolved ("We are still not fully working") — second frustration event; POC is mid-build at session end.
7. Task (17) + Skill (2) + EnterWorktree (1) = the most tool-diverse session in this wave.
8. voice dictation quality notably degraded in later prompts: "accheive", "requrried", "disquiquish", "theree".

**New patterns**:

- `mixed.research_to_build` — explicit session-type transition from brainstorm to build. The user literally said "no files, just brainstorm" at opening and later explicitly pivoted to build.
- **Primary goal drift** is a recurring architecture discussion failure mode: conversations spiral into implementation trade-offs when the user wanted a quick POC decision. Detectable via: user explicitly resets goal mid-session.

---

## Cross-Session Patterns (W7-02)

### BUILD misclassification: 8/9 wrong (89%)

This wave has the highest BUILD misclassification rate seen. Only thumbrack scaffolding was correct. The scale distribution helps explain this:

| Scale    | Sessions | BUILD correct |
| -------- | -------- | ------------- |
| micro    | 2        | 0/2 (0%)      |
| light    | 4        | 1/4 (25%)     |
| moderate | 1        | 0/1 (0%)      |
| heavy    | 2        | 0/2 (0%)      |
| marathon | 1        | 0/1 (0%)      |

Wave 6 finding confirmed: light sessions are rarely BUILD.

### New subtype candidates from W7-02

| Subtype                              | Evidence | Count |
| ------------------------------------ | -------- | ----- |
| `sysops.remote_query`                | aca9259c | 1     |
| `review.post_session_audit`          | fb3b3aa3 | 1     |
| `build.scaffolding`                  | b0215876 | 1     |
| `knowledge.client_onboarding`        | 9e87b170 | 1     |
| `knowledge.omi_transcript_ingestion` | 9e87b170 | 1     |
| `planning.architecture_review`       | b2dbcddd | 1     |
| `mixed.research_to_build`            | 779fef13 | 1     |

All are 1-count this wave; need cross-wave confirmation.

### OMI transcript ingestion — new workflow pattern

Session 9e87b170 (lars) introduces a new workflow not previously observed: user has in-person conversation captured on OMI wearable device → brings raw OMI transcript into Claude Code → background Agent processes it → structured knowledge docs written to client repo. The "ingestion" folder naming is an emerging knowledge architecture convention.

### Primary goal drift — frustration pattern

Session 779fef13 shows the primary goal drift failure mode in detail: user starts with a clear, simple goal ("build HTML front end"), the conversation drifts into architectural trade-offs (AG-UI, AI SDK 6, Supabase, Vercel, n8n), and the user eventually has to explicitly restate the primary goal and create a new thread (worktree). Detectable signal: user explicitly says "we got away from the original problem/goal" mid-session.

### Voice dictation quality as session length signal

Session 779fef13 shows progressive voice quality degradation across the day: early prompts are relatively clean, later prompts show significant artifact density ("accheive", "requrried", "disquiquish"). This may correlate with user fatigue in long sessions — potential quality signal for very late-session prompts.

### Context-loading paste as review/continuation signal

Three sessions (fb3b3aa3, b0215876, 779fef13) use large prior-session pastes as opening context. This is now a strongly confirmed pattern:

- fb3b3aa3: 19952-char paste → REVIEW
- b0215876: 1774-char paste → BUILD continuation
- 779fef13: 97-char opening then extensive background pastes → MIXED

The distinction between REVIEW and BUILD continuation via paste: if the pasted content's question is "what did you do?", it's REVIEW. If "now do the next thing", it's continuation BUILD/PLANNING.
