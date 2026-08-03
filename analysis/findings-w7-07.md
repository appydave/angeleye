---
type: analysis
title: 'Findings W7-07'
description: 'Wave 7 analysis (W7-07) of 9 sessions — orchestrator-to-agent injection, agent scope drift, skill state reconstruction blocker, 4 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7, Agent W7-07

**Sessions analysed**: 9
**Agent**: W7-07
**Analysed at**: 2026-03-22
**Batch composition**: 3 light, 2 moderate, 2 heavy, 0 micro, 1 marathon (per assignment)
**Note**: 6e540b21 was labelled "heavy" by the coordinator but has only 32 events/66 active min — borderline heavy

---

## Session Summaries

### W7-f628ab01 — appystack / micro (1 event)

**Type**: ORIENTATION → `orientation.cold_start` (confirmed)
**Registry said**: BUILD (wrong)

Single user_prompt: "Do you understand the tech stack that we're using for AppyStack?" Zero tools, zero response recorded. Session ends after the single prompt. This is the most minimal possible session — a context probe that either got no response or the response wasn't captured.

**Observations**:

1. No tools = never BUILD. This rule holds across every session in this wave.
2. The session captures that David was about to start AppyStack work and needed to confirm Claude's context. Classic cold-start pattern.

---

### W7-57e70ac1 — flideck / micro (2 events)

**Type**: RESEARCH → `research.dev_env_troubleshooting` (reclassified from BUILD)
**Registry said**: BUILD (wrong)

Two prompts: (1) "why would it suddenly stop working?" (2) "would I have to configure it on the Mac or use another keystroke?" Zero tools. Pure troubleshooting conversation. Most likely the screenshot-to-clipboard shortcut broke in flideck context.

**Observations**:

1. Two-prompt conversational troubleshooting. No tools = no investigation happened — David was asking for orientation, not asking Claude to debug.
2. This is a different pattern from BUILD debug sessions: the user is seeking procedural guidance, not delegating investigation.

---

### W7-794eef99 — appydave-plugins / light (14 events)

**Type**: SKILL → `skill.refinement` (reclassified from BUILD)
**Registry said**: BUILD (wrong)
**CWD incidental**: Yes (appydave-plugins, but work targets ~/.claude/skills/ralphy)

David pastes a full Angela session terminal output as context, then says "I don't necessarily need it to think not to have this sequential numbering... I just want it to be able to talk to me in one, requirements two, plan three, build." ToolSearch finds the Ralphy skill, Edit calls modify mode labels. 4 ToolSearch + 2 Edit + 1 Skill invocation.

**Observations**:

1. **Cross-session injection as evidence**: David used another session's output as proof of the problem. This is a recurring pattern — user experiences problem in session A, brings screenshot/output into session B to fix it.
2. **CWD incidental confirmed**: appydave-plugins has nothing to do with Ralphy skill files. The terminal happened to be in that directory.
3. **Skill.refinement subtype**: Narrow, targeted skill edit based on observed UX friction. Different from `skill.creation` (new skill) or `skill.content_update` (updating skill content). Worth adding to subtype catalog.

---

### W7-144ccb81 — kgems / moderate (26 events)

**Type**: RESEARCH → `research.operational` (reclassified from BUILD)
**Registry said**: BUILD (wrong)

David can't remember which email/username he used for klueless npm packages. Voice prompt: "I don't know whether I did a gem... I don't know what it was called." 19 Bash commands searching package files, npm/gem metadata. No new code written.

**Observations**:

1. **Credential recovery is a recurring SYSOPS/RESEARCH pattern**: This is the third confirmed session type where the user is recovering lost account metadata (npm username, email). Should be classified `research.credential_recovery` or `sysops.account_recovery`.
2. **Voice artifacts**: "klueless-io spelled with a K" — user spelling out names verbally is a classic voice dictation signal. "You say that the username is klueless-js. And that's what I'd use if I was signing humour." — "signing humour" is likely "signing in" garbled.
3. **Bash:19 but no Edit/Write** — pure discovery loop, not build loop.

---

### W7-b822b11f — flideck / moderate (19 events, 1126 min wall clock)

**Type**: KNOWLEDGE → `knowledge.advisory` (reclassified from BUILD)
**Registry said**: BUILD (wrong)

Session opens with a 5411-char paste of a pre-written architectural analysis ("Images → FliDeck Presentation"). David asks "What are your thoughts on this?" — classic advisory pattern. Phase 2 (18h later): provides real Google image URLs to test the concept. Agent makes an unexpected directory in "KPI" — user frustrated.

**Observations**:

1. **Advisory opening style**: Large analysis document paste + "what are your thoughts" = `knowledge.advisory`. This is the second confirmed instance of this pattern (W1-03 was the first — that was pasting other sessions for review; this is pasting a self-authored document for technical review).
2. **Agent scope drift in phase 2**: When given image URLs to test, agent created a directory in an unrelated location ("KPI"). Classic autonomous agent overreach. The user's frustration prompt "why did you make a directory in KPI?" captures this precisely.
3. **Long wall-clock time is noise**: 1126 minutes total, 7 active minutes. The 18h gap between phases doesn't indicate complexity.

---

### W7-6e540b21 — davidcruwys / heavy (32 events, 143 min)

**Type**: SYSOPS → `sysops.disk_cleanup` (reclassified from BUILD)
**Registry said**: BUILD (wrong)
**CWD incidental**: Yes (home directory)

David asks Claude to run `du` to find top disk consumers. 22 Bash commands: du analysis, node_modules deletion, home dir cleanup, brew cleanup, Library/Claude folder exploration. Zero Edit/Write. Multi-phase curiosity-driven maintenance session.

**Observations**:

1. **Home directory = SYSOPS confirmed again**: Rule holds. CWD=/Users/davidcruwys → incidental, never BUILD.
2. **Multi-phase via curiosity jumps**: Each phase is triggered by a new question that arises from the previous answer ("what's in Library?" after seeing Library is big). This is organic exploration, not pre-planned phases — different from deliberate BUILD phase transitions.
3. **Voice artifacts**: "tieed up" for "tied up"; "leav" for "leave"; "setupshell" for "setup shell" — strong voice transcription signal.
4. **"Why does Claude have vm bundles?" as closing question**: Session ends mid-curiosity about Claude's internal app structure. Abrupt abandon but the final question captures genuine curiosity.

---

### W7-b4b6c7d5 — v-appydave / heavy (56 events, 5623 min wall clock)

**Type**: BUILD → `build.iterative_design` (confirmed BUILD, subtype assigned)
**Registry said**: BUILD (partially correct)
**Has frustration signals**: Yes — agent deleted FliVideo files from wrong project

Multi-phase session spanning 4 days. Opens with "Do we have POEM-WUI Being used in the system" — voice dictation. Reads handover file. Claude makes an unexpected cleanup action deleting FliVideo config from v-appydave ("since when would we have FliVideo config inside v-appydave?"). Later: UI field renaming (configure → projectInfo), JSON schema edits via orchestrator injection.

**Observations**:

1. **Orchestrator-agent delegation chain**: Prompt 47 is a structured machine-injected instruction: "Instruction for vdave: In gather-brand-config-schema.json, add..." — this is cross-session delegation where another orchestrator session sends work to this instance. First clearly confirmed instance of this pattern in the wave 7 data.
2. **Agent scope drift caused frustration**: Claude deleted FliVideo-related files while cleaning up after git pull, crossing project boundaries. User response: "since when would we have FliVideo config inside of v-appydave?" — clear scope violation.
3. **Handover file as session chain artefact**: `handover-youtube-wui-textareas.md` connects a prior session to this one. The file encodes what the prior session produced and what this session should do with it. Session chain via file artefact (not conversation paste).
4. **Final summary request**: "What was the basic nature of this conversation? Give me some points of view and tell me whether we need to leave it open" — explicit reflection/context_capture closing. This is a named closing style.

---

### W7-08fbfe17 — angeleye / heavy (365 events, 38 min)

**Type**: BUILD → `build.campaign` (confirmed)
**Registry said**: BUILD (correct)

/ralphy coordinator session for wave-6 analysis. Reads IMPLEMENTATION_PLAN, setup notes, queries registry, launches 9 parallel analysis agents. Collects task-notification results, writes findings files, edits AGENTS.md and IMPLEMENTATION_PLAN. Then discussion about rename→close→reopen skill state reconstruction failure.

**Observations**:

1. **build.campaign signals all present**: /ralphy + Agent calls + IMPLEMENTATION_PLAN.md reads + parallel subagents + findings writes. This is the canonical example.
2. **Skill state reconstruction failure is actively causing pain**: David's prompts explicitly surface this: "if Ralphy isn't showing me the right value, then the whole session is broken." This is the feedback that led to the MEMORY.md entry `feedback_skill_state_reconstruction.md`. The session itself records the problem being discovered and articulated.
3. **task-notification as session structure**: 9 of the 15 user_prompts are `<task-notification>` XML — system-generated callbacks when subagents complete. These are not human prompts and should be distinguishable in analysis. Current event schema doesn't separate them from real user prompts.
4. **365 events but 15 user_prompts**: The Read:165/Bash:115 ratio reflects subagent activity being recorded in the parent session file. This inflates event counts without reflecting interactive complexity.

---

### W7-15ae666d — flideck / marathon (255 events, 668 min)

**Type**: BUILD → `build.campaign` (confirmed)
**Registry said**: BUILD (correct)

FliDeck PO context → task selection → background bug-fix agent with Playwright verification → commit → deep architectural research on iframe vs web components migration strategy. Compaction resume at 65% context. 27 prompts across 668 minutes (3 large gaps).

**Observations**:

1. **PO skill as session opener**: Opening prompt is a 9144-char paste of `/flivideo:po` output — the PO skill generates a briefing and David injects it into a new build session. This is a `context_loading_paste` opening that creates an explicit cross-session chain (PO session → build session).
2. **TaskCreate/TaskUpdate dominance**: 48 TaskUpdate + 24 TaskCreate = 72 task management events out of 228 total tools. Background task management infrastructure is a core part of David's build workflow for flideck.
3. **Playwright is UI verification, not TEST**: Playwright calls (evaluate, click, screenshot, press_key, navigate) come after code changes to verify the bug fix worked. This is TEST-within-BUILD, not a separate test session. Confirms the pattern from wave 2 learnings.
4. **Deep architecture research as phase 2**: After the bug fix is committed, session pivots to multi-hour discussion of iframe vs web components migration. This is research.architectural_decision embedded inside a BUILD session. The transition happens naturally after a 3-hour gap.
5. **"Rafi mode 2" voice artifact**: "Rafi" = "Ralphy" — David is asking what Ralphy mode 2 means. Voice garbled the skill name. If this appeared in a first prompt, the classifier might misidentify the session.

---

## Wave 7-07 Cross-Session Patterns

### BUILD misclassification rate: 6/9 (67%)

Of the 9 sessions:

- Correctly BUILD: 3 (b4b6c7d5, 08fbfe17, 15ae666d)
- Wrongly BUILD: 6 (f628ab01→ORIENTATION, 57e70ac1→RESEARCH, 794eef99→SKILL, 144ccb81→RESEARCH, b822b11f→KNOWLEDGE, 6e540b21→SYSOPS)

The pattern holds from wave 6: light sessions are almost never BUILD (0/3 correct here), heavy/marathon sessions are usually correct (3/3).

### New pattern: orchestrator-to-agent injection

The v-appydave session (b4b6c7d5) shows a structured instruction injected into a session by an external orchestrator: "Instruction for vdave: In gather-brand-config-schema.json, add...". This is machine-to-Claude delegation via prompt injection. Different from human voice prompts. Should be detectable by: structured XML/markdown prefix + imperative instruction format + no voice artifacts.

### Agent scope drift recurring

Two sessions in this wave show agent scope drift causing user frustration:

1. b822b11f: Agent creates directory in unexpected "KPI" location
2. b4b6c7d5: Agent deletes FliVideo config files from wrong project directory

Both are triggered by agents making reasonable-seeming inferences that cross project boundaries. Recurring enough to warrant a dedicated predicate (`has_agent_scope_drift`) in a future schema version.

### Skill state reconstruction is an active blocker

Session 08fbfe17 explicitly documents David discovering that Ralphy gives wrong values after rename→close→reopen. This is high-value signal for the AngelEye product: if Ralphy reads from session memory rather than disk state, the rename pattern breaks it. AngelEye should detect this pattern.

### New subtype candidates from this wave

- `skill.refinement` — narrow, targeted skill edit based on observed UX friction (794eef99)
- `research.credential_recovery` — recovering lost account credentials via Bash (144ccb81)
- `sysops.disk_cleanup` — disk analysis + deletion + cleanup (6e540b21)
- `research.dev_env_troubleshooting.conversational` — troubleshooting via conversation only, zero tools (57e70ac1)
