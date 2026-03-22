# Findings — W6-marathon-1 (session 99574b7a)

**Session**: 99574b7a-1ff1-489c-a699-da08cb1df7d5
**Machine**: m4-mini
**Project**: angeleye
**Date**: 2026-03-15 13:47 — 2026-03-16 03:01 (793 min wall clock, 113 min active)
**Coverage**: Partial — first 30, last 26, 5 middle samples of ~30 lines each (536 total events)

---

## Session Summary

This is a meta-recursive marathon session: AngelEye building and analysing itself. The session spans two major implementation campaigns (wave 7b data split and wave 8 intelligence/classifier), a 100-session research study, Observer UI design iteration, and closes with commit-and-push. It is one of the most complex sessions in the dataset — 16 subagents spawned, 44 user prompts, 414 tool calls, and 3 idle gaps over 1 hour.

---

## Phase Breakdown (5 distinct phases)

### Phase 1: Orientation + Wave 7b Build (13:47 — 14:14, ~27 min)

- Opens with voice-dictated multi-topic orientation question about themes, AppyStack, intelligence system, and next ticket
- Quickly transitions to Ralphy-style campaign: wave 7b data split (B021)
- 4 subagents spawned sequentially (SP01-SP04) to extract services from angeleye-data.ts into registry.service.ts, sessions.service.ts, workspace.service.ts, backfill.service.ts
- Final subagent (SP04) completes with 173 tests passing, deletes angeleye-data.ts
- IMPLEMENTATION_PLAN.md and BACKLOG.md updated

### Phase 2: Research — 100-session analysis (14:10 — 15:04, ~54 min)

- User asks about ambient intelligence and what it would give them
- Pivots to deep session pattern research — 5 parallel subagents spawned to analyse 100 sessions in batches
- Each subagent runs python3 scripts to parse session JSONL files, extracting tool patterns, prompt analysis, session shapes
- Synthesis agent reads all 5 batch files and produces `100-session-analysis.md` + updates `PATTERNS.md`
- Key discovery: tool-only classification accuracy is bimodal (89-95% focused, 55-70% exploratory)
- Key discovery: 23% of prompts truncated at 500 chars due to `.slice(0, 500)` bug in backfill.service.ts

### Phase 3: Bug fix + re-backfill (within Phase 2 timeframe)

- User reacts to the 500-char truncation finding ("Oh shit. We have to fix that")
- Fix applied: removed `.slice(0, 500)` from backfill.service.ts
- Wiped 650 transcript sessions from registry + deleted JSONL files + re-ran backfill
- Verified: 120/463 sampled prompts now exceed 500 chars

### Phase 4: Wave 8 Build — classifier service + Observer UI (16:28 — 17:00, ~32 min)

- After 84-min idle gap, user returns asking about schema fields and TypeScript types
- Implementation of B012 (rule-based classification): classifier.service.ts with 47 unit tests
- 3 parallel subagents: IN02 (classifier service), IN03 (hook integration), IN04 (Observer UI + Settings)
- Observer UI extensively iterated: badge colors, card layout, session ID display, junk filter toggle
- User gives direct UX feedback via voice: badge unreadable, layout has "massive white hole", junk toggle logic reversed

### Phase 5: UI polish + close (00:29 — 03:01, after 448-min overnight gap + 146-min gap)

- User returns after overnight gap asking about junk records
- Short exchange about junk filter toggle label reversal
- Compaction summary generated (subagent a1e05de3a456235c4 produces comprehensive session summary)
- Final fix to toggle label logic
- "Can you commit and push and then exit the conversation?" — clean git commit + push + "Bye!"

---

## Classifiers

### C01 — session_type: MIXED (high confidence)

This session contains genuine BUILD (new services, classifier, UI), RESEARCH (100-session study), and DEBUG (500-char truncation fix). No single type captures it. The BUILD component dominates in tool usage, but the RESEARCH phase produced the most significant outcomes.

### C02 — session_subtype: build.campaign_with_research (high confidence)

A Ralphy-adjacent campaign (no explicit /ralphy invocation, but IMPLEMENTATION_PLAN.md + Agent/Task + sequential subagent orchestration matches the pattern). Unique in that research findings fed directly into the next build phase within the same session.

### C03 — opening_style: voice_dictation (high confidence)

"What did we do related to themes? And AppyStack and recipes And also, when it comes to the intelligence system, did we end up building that here in Angel Eye? Is it Chris?" — classic voice-dictated multi-topic orientation. "Is it Chris?" is a voice artifact (possibly "is it classified?" or similar).

### C04 — closing_style: commit_and_push (high confidence)

"Can you commit and push and then exit the conversation?" — explicit lifecycle command. Last event: "Pushed. Bye!" This matches the pattern identified in the 100-session research: David treating session lifecycle as an explicit command.

### C05 — tool_profile: agent_orchestration (high confidence)

16 subagents spawned, 25 TaskUpdate + 9 TaskCreate calls. While Bash (216) and Read (78) dominate in raw counts, much of that is subagent activity. The orchestration pattern — spawning parallel agents for research batches and sequential agents for build campaigns — is the defining characteristic.

### C06 — project_attribution: reliable (high confidence)

CWD = /Users/davidcruwys/dev/ad/apps/angeleye. All file touches are within the angeleye project. No cross-project work detected.

### C07 — session_scale: marathon (high confidence)

536 events, 1 context compaction, 793 min wall clock. Exceeds the 500+ event threshold. 3 idle gaps over 1 hour (84 min, 448 min, 146 min). This is a genuine marathon driven by continuous work interspersed with life gaps (overnight), not a runaway loop.

### C08 — session_chain_role: standalone (medium confidence)

No explicit references to other sessions pasted in. However, the opening orientation question ("what did we do related to themes?") implies prior session context. The session is self-contained in its deliverables — it both researches and builds within itself.

---

## Predicates

### P01 — is_feature_construction: true

"New services created (registry, sessions, workspace, backfill), classifier.service.ts with 47 tests, Observer UI redesigned with new card layout, Settings view gains Classify Sessions button."

### P02 — has_frustration_signals: true

"User expresses frustration about Observer UI design: 'Why didn't you use the space in the line more appropriately? You've got a massive white hole and three little words over on the left' and 'I was specifically looking at the badge she got there called build. You can't read it.' Also 'Oh shit' on discovering the 500-char truncation bug."

### P03 — is_multi_phase: true

"5 distinct phases spanning orientation, two build campaigns, research, and UI polish across 793 minutes with 3 idle gaps over 1 hour."

### P04 — has_brain_file_writes: false

"No brain files (~/dev/ad/brains/) created or edited. All writes target the angeleye app itself."

### P05 — has_playwright_calls: false

"Zero Playwright MCP tool calls in this session."

### P06 — has_cross_session_refs: false

"No explicit pasting of other sessions' output. Opening question implies prior context but does not paste it."

### P07 — has_skill_gap_signal: false

"Only 1 ToolSearch call. No pattern of failed skill lookups."

### P08 — has_unauthorized_edits: false

"No edits detected before user gave instruction. Subagent edits were all part of delegated tasks."

### P09 — is_compaction_resume: true

"1 context compaction detected (shape data). The subagent a1e05de3a456235c4 produced a comprehensive compaction summary near the end of the session."

### P10 — is_cwd_incidental: false

"CWD matches actual work. All 30 edit/write targets are within the angeleye project."

### P11 — is_machine_initiated: false

"Voice-dictated opening prompt with characteristic speech artifacts."

### P12 — has_voice_dictation_artifacts: true

"'Is it Chris?' (likely 'is it classified?'), voice-first conversational phrasing throughout."

---

## Observations

### O01 — frustration_analysis (gated by P02)

Frustration is mild and design-focused, not system-failure frustration. Two instances: (1) UI layout criticism — "massive white hole" with information crammed to the left — is a legitimate design feedback from a user looking at the live app. Claude responded by restructuring the card layout to a two-row design. (2) The "Oh shit" reaction to discovering the 500-char truncation bug is a data-integrity concern, not frustration with Claude. Both resolved within the session. No repeated unmet requests.

### O02 — phase_breakdown (gated by P03)

- **Phase 1 (Orientation + Wave 7b BUILD)**: 27 min, 4 sequential subagents, Edit/Bash heavy within agents, Build campaign completing B021 data split. Triggered by user orientation questions leading to "let's build."
- **Phase 2 (RESEARCH)**: 54 min, 5 parallel subagents running python3 analysis scripts on 100 sessions. Triggered by user asking about ambient intelligence. Most intellectually productive phase — produced 100-session-analysis.md.
- **Phase 3 (DEBUG/FIX)**: Embedded within Phase 2 timeline, triggered by research discovering the 500-char truncation bug. Quick surgical fix + re-backfill.
- **Phase 4 (Wave 8 BUILD + UI)**: 32 min after 84-min gap. 3 parallel subagents building classifier service + hook integration + Observer UI. Triggered by user returning with schema questions.
- **Phase 5 (UI POLISH + CLOSE)**: After overnight gap. Short exchanges about junk records and toggle UX. Commit and push. Triggered by user returning to review the deployed UI.

---

## Notable Observations

### Meta-recursive quality

This session is AngelEye building and analysing itself. The 100-session research phase (Phase 2) produced findings that directly informed the classifier service built in Phase 4. The session literally discovered the 500-char truncation bug in its own data pipeline, fixed it, and then built classification logic informed by the corrected data. This is the strongest meta-recursive example in the dataset.

### Ralphy-adjacent but not Ralphy

No `/ralphy` skill invocation detected, yet the session uses the Ralphy pattern: IMPLEMENTATION_PLAN.md + AGENTS.md + sequential/parallel subagent orchestration + TaskCreate/TaskUpdate. The user says "build" as a trigger word for entering build mode. This suggests the Ralphy pattern has been internalized by both user and Claude without needing the explicit skill.

### "Commit and push and then exit the conversation"

The session ends with an explicit lifecycle command. This matches the pattern identified earlier in the 100-session research: David uses "commit and push" as a deliberate session boundary marker. The research finding was generated within this same session, making it a self-validating observation.

### Subagent spawning patterns

Three distinct subagent patterns observed:

1. **Sequential build agents** (Phase 1): SP01-SP04, each completing before the next starts
2. **Parallel research agents** (Phase 2): 5 agents launched simultaneously, each analysing a batch of sessions
3. **Parallel build agents** (Phase 4): IN02, IN03, IN04 launched together for independent implementation units

### 37KB first prompt

The first_real_prompt has a full_length of 37,237 characters — this is a compaction summary from a prior conversation being injected as context, not a genuine first prompt. The actual first real user prompt is the voice-dictated orientation question embedded within it. This validates the P12 "first_real_prompt needs a discriminator" finding from the 100-session research.
