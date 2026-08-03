---
type: analysis
title: 'Findings W7-05'
description: 'Wave 7 analysis (W7-05) of 9 sessions — 44% BUILD misclassification, /tmp CWD as incidental pattern, BMAD agent chain evidence, handover absolute-path anti-pattern.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Wave 7-05 Findings

**Agent**: W7-05
**Sessions analysed**: 9
**Date**: 2026-03-22
**Session range**: micro (2 events) → marathon (116 events, 1 compaction)

---

## Session Summaries

### W7-96e6b501 — brains / micro

**Registry**: BUILD → **RESEARCH/knowledge_lookup**

Single-prompt session in brains/ CWD. User asks: "5. Cole did a workshop on prompt injection — do we have that transcript?" One Bash call, 0 min active. Pure asset discovery lookup.

**Key observations**:

- Registry BUILD is completely wrong. Zero feature code signals.
- CWD brains/ is incidental as expected from prior wave rules.
- Numbered list format in prompt ("5. Cole did...") suggests this was one item in a voice-dictated checklist sweep.
- New pattern: **numbered list item as session opener** — user may have been working through a list of pending tasks in voice dictation, each becoming a mini-session.

---

### W7-ed6b5327 — angeleye / light

**Registry**: BUILD → **ORIENTATION/bookend**

Quick git status check session. Single prompt: "Is there anything to commit or push here?" Two Bash calls (git status, git diff). Stop response lists two pending commits (CLAUDE.md hook count fix, planning docs). Session open for 3663 min (2.5 days) with 0 active minutes.

**Key observations**:

- Classic bookend pattern confirmed: short, read-only, checking prior work state.
- 3663 min wall clock / 0 active is now a known pattern — session opened then left idle.
- Stop message gives useful commit candidates but user apparently decided not to commit in this session, illustrating the "check without acting" bookend variant.

---

### W7-6b8898c1 — flihub-transcripts / light

**Registry**: BUILD → **KNOWLEDGE/content_analysis**

CWD /private/tmp/flihub-transcripts — temporary staging directory for video transcripts. Voice prompt asking for categorical breakdown of 5 videos for a "week in review". 11 Bash + 1 Skill call.

**Key observations**:

- /tmp CWD is a new pattern: session in /private/tmp/ for temporary transcript analysis. The "project" label flihub-transcripts was derived from the tmp directory name — meaningless as project attribution.
- Voice artifacts: "POEM Woi" (POEM WUI), "Appy Stack" (AppyStack), "Ralphie" (Ralphy).
- This is knowledge extraction/synthesis, not BUILD. 11 Bash calls likely used to cat/read transcript files.
- **New subtype proposed**: `knowledge.content_analysis` — extracting themes from media transcripts for content planning. Distinct from `knowledge.brain_update` (editing brain files) and `knowledge.advisory` (reviewing other sessions).

---

### W7-6d25d5ae — app.supportsignal / moderate

**Registry**: ORIENTATION → **ORIENTATION/requirements** (correct)

/bmad-oversight skill invocation. Loads 5 planning docs from supportsignal-v2-planning. David corrects Claude twice about BMAD workflow order (Winston before Sally). Session ends with verbal resolution, no action.

**Key observations**:

- Registry ORIENTATION is correct — one of the more accurately classified sessions.
- /bmad-oversight as a skill invocation opening is a strong signal for ORIENTATION/requirements.
- CWD app.supportsignal but reads target supportsignal-v2-planning — confirmed incidental CWD.
- Claude's failure: loaded bmad-oversight docs but synthesized the workflow sequence incorrectly. The docs were there; the reasoning was wrong.
- Pattern: skill invocation sessions often reveal Claude's knowledge-application failures — it finds the skill, loads context, but misapplies it.

---

### W7-520b517b — signal-studio / moderate

**Registry**: BUILD → **SYSOPS/tool_configuration**

VSCode window.closeWhenEmpty configuration session. CWD signal-studio, but all work targets VSCode settings and M4 Pro SSH access. 2 frustration events.

**Key observations**:

- Strongest evidence for CWD as "home terminal" pattern — signal-studio CWD with zero signal-studio file touches.
- Frustration 1: Claude suggested Command-W as an alternative to the key David was accidentally pressing (Command-W). Circular advice.
- Frustration 2: David expects seamless SSH access to M4 Pro ("second brain") — Claude needed an Agent call to even attempt this. Expectation mismatch.
- Voice artifacts: "High application" = the app, "M4 probe" = M4 Pro.
- **New subtype confirmed**: `sysops.tool_configuration` — IDE and development tool configuration sessions. Distinct from `sysops.script_generate_run` (single Bash+Write) and `sysops.dotfiles_management` (this wave).

---

### W7-86ad9f30 — deckhand / moderate

**Registry**: BUILD → **BUILD/iterative_design** (correct)

Single-prompt session: opens Playwright to inspect deckhand UI at localhost:5030, then 31 Edit calls fixing button styling in a navigate-screenshot-edit-verify loop (5 cycles).

**Key observations**:

- BUILD classification correct. 31 Edit calls on product code is the discriminator.
- Classic iterative_design pattern: Playwright as build verification tool, not testing tool. 7 navigate + 7 screenshot paired with Edit bursts.
- Single prompt driving 55 tool calls — high tool:prompt ratio (55:1). Efficient session.
- ToolSearch at start (1 call) — likely seeking Playwright tools before using them. This is orientation behavior embedded within a BUILD session.
- No frustration, no complications. Textbook UI polish session.

---

### W7-95d99e79 — app.supportsignal / heavy

**Registry**: TEST → **RESEARCH/workflow_exploration**

Playwright-driven exploration of AWB incident intake workflow at localhost:5040. Session produces a design document (03-awb-incident-intake-workflow.md) in the planning repo. Part of a BMAD agent chain.

**Key observations**:

- Registry TEST is wrong — Playwright used for exploration/documentation, not testing. The Write output is a design doc, not test results.
- **BMAD agent chain confirmed**: Stop message references "the Sally session just wrapped — Step 14 complete." This session is positioned as David stepping in between two Sally sessions to manually explore and document workflow behavior.
- 4 ToolSearch calls — most in this batch. Consistent with prior wave finding: ToolSearch clusters indicate uncertainty about available tools.
- Handover to Sally pattern: session explicitly prepares files for Sally's next session. CWD incidental (app.supportsignal as home terminal).
- Minor frustration: "You never gave me absolute paths so she can't find the files" — Claude prepared handover with relative paths, breaking cross-session file references.
- **New subtype confirmed**: `research.workflow_exploration` — Playwright used to document/understand a live workflow, not test it. Distinct from `test.uat_playwright_sequential`.

---

### W7-4debdac5 — custom / heavy

**Registry**: BUILD → **SYSOPS/dotfiles_management**

ZSH alias indexing, ansible alias creation, GitHub repo setup, dotfiles management session. CWD ~/.oh-my-zsh/custom. 5 distinct phases, 19 prompts, 76 min active.

**Key observations**:

- CWD ~/.oh-my-zsh/custom is the most unusual CWD seen — the ZSH plugin custom directory. Work spans home dir, GitHub, ansible aliases, CLAUDE.md updates.
- 5 phases across 240 min wall clock: alias discovery → ansible aliases → CLAUDE.md headers → GitHub repo → dotfiles.
- Frustration: "Not your shit." — Claude staged its own configuration in a git commit instead of the user's dotfiles. Classic git scope error in dotfiles repos.
- Multi-machine architecture context: "when we get to the Mini M4 it is essentially the same as the MacBook Pro" — David has a MacBook Pro and M4 Mini with mirrored configs. Dotfiles sync is the underlying need.
- **New subtype confirmed**: `sysops.dotfiles_management` — ZSH, git config, shell alias management across machines. Distinct from `sysops.tool_configuration` (IDE settings) and `sysops.script_generate_run` (one-off scripts).

---

### W7-21e58810 — flihub / marathon

**Registry**: BUILD → **BUILD/feature_sprint** (correct)

Multi-feature sprint on flihub. Opens with bare task ref "do 144", implements 5 distinct features across 62 active minutes over 18.8h. 1 compaction, ends unresolved on brandConfig debug.

**Key observations**:

- BUILD classification correct. 48 Edit + 3 Write on flihub product code is decisive.
- **New subtype proposed**: `build.feature_sprint` — multiple distinct features implemented sequentially in one session, unlike `build.campaign` (Ralphy orchestration) or `build.iterative_design` (single feature with visual loop).
- "do 144" bare task ref is the most minimal opening in this batch. Assumes full context from prior session — strong compaction resume dependency.
- Cross-session handover injection: mid-session receives a POEM WUI handover paste ("FliHub Publish Handover — brandConfig for YouTube Launch Optimizer") — injects external context into an active BUILD session.
- Ends unresolved: "Still not working. I don't get it. How hard is it to load a fucking file in and put it against a key?" — brandConfig null after multiple fix attempts.
- **Session ends without commit** — notable for a BUILD session of this size.

---

## Wave-Level Observations

### BUILD misclassification rate: 44% (4/9 BUILD sessions were wrong)

Continuing the trend from prior waves (Wave 6: 82.5% wrong). This wave's rate appears lower because the batch was weighted toward smaller sessions. The four correct BUILD calls were all cases with Edit/Write evidence:

- W7-86ad9f30: 31 Edit ✓
- W7-21e58810: 48 Edit ✓

The four wrong BUILD calls:

- W7-96e6b501: brains CWD, Bash only → RESEARCH
- W7-6b8898c1: /tmp CWD, Bash only → KNOWLEDGE
- W7-520b517b: signal-studio CWD but IDE config work → SYSOPS
- W7-4debdac5: ~/.oh-my-zsh/custom CWD, shell infrastructure → SYSOPS

**Pattern**: CWD-based BUILD inference fails when CWD is a "home terminal" (signal-studio, oh-my-zsh/custom) or temporary directory (/tmp). The file-touch signal remains the only reliable BUILD discriminator.

---

### New/Confirmed Subtypes This Wave

| Subtype                         | Status          | Evidence                              | Session     |
| ------------------------------- | --------------- | ------------------------------------- | ----------- |
| `knowledge.content_analysis`    | New             | Video transcript theme extraction     | W7-6b8898c1 |
| `build.feature_sprint`          | New             | 5 features, single session, no Ralphy | W7-21e58810 |
| `sysops.tool_configuration`     | Confirmed       | VSCode keyboard shortcut fix          | W7-520b517b |
| `sysops.dotfiles_management`    | Confirmed       | ZSH/git/alias infrastructure          | W7-4debdac5 |
| `research.workflow_exploration` | Confirmed       | Playwright-documented workflow        | W7-95d99e79 |
| `orientation.bookend`           | Confirmed (3rd) | git status before commit              | W7-ed6b5327 |

---

### BMAD Agent Chain Evidence

W7-95d99e79 shows the first confirmed **intra-session BMAD agent chain**:

- Sally session completes Step 14 (UX spec)
- David uses this session to manually explore the AWB workflow via Playwright
- Session prepares handover for next Sally session
- Explicit reference in stop message: "the Sally session just wrapped"

This is a **human-in-the-loop bridging session** within a BMAD agent chain. David periodically takes manual control between agent sessions to do exploratory work that agents can't do autonomously (live UI exploration, judgment calls).

---

### /tmp CWD as New Incidental Pattern

W7-6b8898c1 introduces a new CWD category: `/private/tmp/` as a temporary staging directory for content analysis. This is distinct from:

- Home dir (always incidental)
- Monorepo root (usually incidental)
- Product repo (usually reliable)

Proposed addition to CWD rules: **/tmp/\* → always incidental, session is content analysis or ad-hoc task with no project affiliation.**

---

### Voice Dictation Artifacts (All 9 Sessions)

Continuing the wave 1 finding: voice dictation is pervasive. Notable artifacts this wave:

- "POEM Woi" → POEM WUI
- "Appy Stack" → AppyStack
- "Ralphie" → Ralphy (the skill)
- "High application" → the app / the whole application
- "M4 probe" → M4 Pro
- "contact 7 session" → context, session 7
- "knit" → init or lint

---

### Handover with Missing Absolute Paths (Anti-Pattern)

W7-95d99e79 and prior waves: Claude produces handover summaries without absolute file paths, making cross-session file references fail. This appears in multiple sessions now (3+). Should be codified as a known anti-pattern and potential product feature: **handover mode should always include absolute paths**.

---

## Classification Summary

| Wave ID     | Session            | Registry    | Classified  | Correct?     |
| ----------- | ------------------ | ----------- | ----------- | ------------ |
| W7-96e6b501 | brains             | BUILD       | RESEARCH    | RECLASSIFIED |
| W7-ed6b5327 | angeleye           | BUILD       | ORIENTATION | RECLASSIFIED |
| W7-6b8898c1 | flihub-transcripts | BUILD       | KNOWLEDGE   | RECLASSIFIED |
| W7-6d25d5ae | app.supportsignal  | ORIENTATION | ORIENTATION | MATCH        |
| W7-520b517b | signal-studio      | BUILD       | SYSOPS      | RECLASSIFIED |
| W7-86ad9f30 | deckhand           | BUILD       | BUILD       | MATCH        |
| W7-95d99e79 | app.supportsignal  | TEST        | RESEARCH    | RECLASSIFIED |
| W7-4debdac5 | custom             | BUILD       | SYSOPS      | RECLASSIFIED |
| W7-21e58810 | flihub             | BUILD       | BUILD       | MATCH        |

**Match rate**: 3/9 (33%)
**BUILD misclassification rate**: 4/7 BUILD sessions reclassified (57%)
