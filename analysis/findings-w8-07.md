---
type: analysis
title: 'Findings W8-07'
description: 'Wave 8 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch W8-07

**Batch**: W8-07 (8 sessions)
**Analysed**: 2026-03-23
**Projects**: signal-studio, deckhand, angeleye, klueless, prompt.supportsignal, v-appydave, appydave-plugins, v-aitldr

---

## Session Summaries

### 7b2157e9 — signal-studio / heavy

**Type**: TEST (test.uat_campaign_with_autofix)
**Registry**: BUILD (wrong)

David asks Claude to plan and run the full UAT suite (15 files) against signal-studio, auto-fixing problems and producing a recommendation doc for human issues. The session is dominated by Agent calls (30x) orchestrating parallel UAT runs, with Edit (81x) for auto-fixes. Three large idle gaps spanning overnight suggest David set it running and checked back periodically. The compaction resume (1x) shows the session survived context exhaustion mid-campaign. Final phase pivots to test coverage work after David asks "Did you just finish off a full coverage system?". This is a TEST session with automated fix capabilities — not BUILD, despite heavy Edit count. The auto-fix loop (UAT find issue -> Edit fix -> re-verify) is the defining pattern.

**Key observations**:

- Auto-fix UAT is a distinct pattern: Agent runs UAT, encounters failure, Edit fixes the issue, continues. This is test-driven development at the campaign scale.
- Short user prompts ("3", "2") are numbered option selections from Claude's menus, not bare task references.
- 30 Agent calls with 81 Edits suggests heavy subagent orchestration — each agent likely ran multiple UAT files.

### e3c9e049 — deckhand / heavy

**Type**: BUILD (build.iterative_design)
**Registry**: BUILD (correct)

Multi-phase session spanning deckhand (Stream Deck configuration app). Opens with VibeDeck research (understanding Ian's SDK approach), pivots to Ecamm Live API integration, includes Playwright UI review, hits a major misunderstanding (Claude filled grid buttons instead of creating sidebar panel), gets corrected and rebuilds. Two compaction resumes. Ends with commit + /ralphy invocation for next campaign. The 35 Playwright calls (navigate/screenshot/click/snapshot) are UI_REVIEW verification, not testing.

**Key observations**:

- P13 has_misunderstood_request confirmed: Claude created an ecamm profile filling all 32 XL buttons with Ecamm actions when user wanted a separate actions palette panel (like Elgato sidebar). User explicitly corrected this.
- P14 has_wrong_approach confirmed: Right goal (Ecamm Live integration) but wrong method (button grid fill vs sidebar panel). Significant rework required.
- Cross-window context sharing: user asks "Is this of use?" referencing Ecamm brain update from another Claude window — concurrent session pair signal.
- /ralphy invocation at close signals this session feeds into a build.campaign continuation.

### 201aec50 — angeleye / moderate

**Type**: PLANNING (planning.product_vision)
**Registry**: BUILD (wrong)

Session opens with an 86KB context paste (requirements, prior learnings). David asks Claude to summarize what they'd achieve. First phase is research — Playwright browses Dizzler and Claude Replay (competitor tools). Second phase is vision design — "think through what you think we're going to build" with 6 Agent calls generating design mockups/concepts. Third phase is knowledge capture — David asks about "Ambient Intelligence" terminology, requests brain file updates, and closes with a /capture-context handover preparation for a Ralphy loop.

**Key observations**:

- 86KB first prompt is the largest context-loading paste seen in this campaign. It's a detailed requirements doc + prior session output combined.
- Playwright used for external research (Dizzler, Claude Replay) — confirmed semantic role: external_research.
- "Ambient Intelligence" concept exploration shows David iterating on product vision terminology.
- Session ends with explicit handover preparation: "get ready to near completion and hand over... we're ready to go into a Ralph William loop" — voice artifact "Ralph William" = Ralphy.

### 0248f3ad — klueless / moderate

**Type**: RESEARCH (research.project_revival)
**Registry**: BUILD (wrong)

Two distinct phases separated by a 21-day gap (Jan 29 -> Feb 19). Phase 1 (Jan 29): David asks "How good is the index file?" — cold start orientation on a dormant project. Claude reads codebase extensively (11 Read, 13 Bash in rapid succession). Phase 2 (Feb 19): "I haven't looked at this project for months. What were we talking about?" — explicit revival after long dormancy. Claude runs Task (9x) for background research agents, writes research docs, updates CLAUDE.md. Session ends with git push of both klueless and klue-langcraft repos.

**Key observations**:

- 21-day idle gap is the largest seen in any session — effectively two separate mini-sessions in one.
- "Clueless" = "Klueless" voice artifact in first prompt.
- New subtype candidate: research.project_revival — dormant project being resurrected with comprehensive codebase re-exploration.
- "Run a background agent and just tell me if there's anything we need to fix with vulnerabilities" — security audit as a closing task.
- "pisses that shit off" re .gitignore — voice dictation captures colloquial speech faithfully.

### 0daf8585 — prompt.supportsignal / moderate

**Type**: BUILD (build.prompt_engineering)
**Registry**: BUILD (correct)

Structured prompt engineering session with Angela (client stakeholder) on the call. Works through 4 themed prompt improvements (restrictive practice detection, data boundary violations, question scope, proportionality/tone) across NDIS incident analysis HBS templates. Edits are targeted refinements to Handlebars prompt templates. Invokes Penny (POEM agent) for the restrictive practice work. Closes with commit + backlog update marking all 11 items done.

**Key observations**:

- Live client session: Angela Harvey is on the call, providing real-time feedback and clarifications.
- Structured backlog-driven work: 4 themes, 11 items, systematic progression.
- POEM agent invocation (Penny via Skill) for domain-specific prompt refinement.
- "We didn't really understand point number 5" — use of "we" indicates David + Angela together.
- Clean closing: commit, update backlog to mark done, second commit after gap — textbook completion ceremony.

### 5309922c — v-appydave / moderate

**Type**: BUILD (build.workflow_configuration)
**Registry**: BUILD (correct)

David configures POEM workflow YAML files for YouTube Launch Optimizer in v-appydave. Opens with a broad research question about POEM agents (Alex, Penny, Oscar) and prompt.supportsignal architecture. Phase 1: background agents (4 Task calls) research the codebase. Phase 2 (after 6h gap): detailed workflow configuration — which sections to keep/ignore/modify, reading original RBX files for reference. Phase 3: Claude writes 21 files in rapid succession (workflow YAML, JSON configs).

**Key observations**:

- CWD=v-appydave but work references prompt.supportsignal.com.au extensively — CWD is incidental for phase 1.
- "sawam" = "swarm" voice artifact; "cashould" = "you should"; "pome-core" = "poem-core"; "agetns" = "agents"; "youtubelanuch optimize3r" = "YouTube Launch Optimizer".
- 21 Write calls in 3 minutes (07:23 - 07:26) — Claude bulk-generating workflow config files.
- Detailed section-by-section configuration decisions pasted as structured tables.

### 78dd3b7f — appydave-plugins / light

**Type**: SETUP (setup.tool_installation)
**Registry**: BUILD (wrong)

Very short session (10 events, 10 minutes). David tries to install @vercel/agent-browser via npm, gets E404. Claude searches the web (2x WebSearch), fetches the correct package info (WebFetch), David tries again with correct name (agent-browser), Claude runs npm install + verify via Bash. Ends with "To skill installed, how do we know it's working?" — voice artifact "To skill" probably "Tool's".

**Key observations**:

- Zero file edits — pure tool installation, not BUILD.
- WebSearch + WebFetch pattern for npm package discovery is a new tool_profile variant: search_then_install.
- CWD=appydave-plugins is incidental — the npm install is global (-g flag).
- "To skill installed" = "Tool's installed" voice artifact.

### e7b6060d — v-aitldr / micro

**Type**: SYSOPS (sysops.git_conflict_resolution)
**Registry**: BUILD (wrong)

Minimal session (6 events, <1 min active). David pastes git push rejection output + divergent branch error. Claude runs Bash commands to resolve (likely git pull --rebase or merge). David confirms with "yes". Done.

**Key observations**:

- Terminal output paste as opener — not voice, just copy-paste of error output.
- 4 Bash calls for git conflict resolution — standard sysops.
- Zero file edits, zero reads — pure git operations.

---

## Cross-Batch Patterns

### P13 has_misunderstood_request (Wave 8 trial predicate)

- **e3c9e049**: Confirmed. Claude built ecamm button profile instead of actions sidebar panel. Major misunderstanding requiring full rollback.
- Others: No clear misunderstood requests detected.

### P14 has_wrong_approach (Wave 8 trial predicate)

- **e3c9e049**: Confirmed. Same incident — right goal (Ecamm integration), wrong method (grid fill vs panel).
- **201aec50**: Mild. Claude initially browsed Dizzler/Claude Replay which wasn't quite what David asked for (he wanted design mockups, not competitor browsing), but this was more of a reasonable interpretation than wrong approach.

### P15 has_buggy_output (Wave 8 trial predicate)

- No clear buggy output cycles detected in this batch.

### P16 has_excessive_changes (Wave 8 trial predicate)

- **e3c9e049**: Partially. The ecamm profile that filled all 32 buttons was excessive relative to what was asked.
- **5309922c**: 21 Write calls in 3 minutes is bulk generation, but it was explicitly requested.

### BUILD accuracy: 3/8 correct (37.5%)

- Correct: e3c9e049 (deckhand BUILD), 0daf8585 (prompt.supportsignal BUILD), 5309922c (v-appydave BUILD)
- Wrong: 7b2157e9 (TEST), 201aec50 (PLANNING), 0248f3ad (RESEARCH), 78dd3b7f (SETUP), e7b6060d (SYSOPS)

### Voice dictation density

Every human-initiated session shows voice artifacts. Notable new entries: "Ralph William" = Ralphy, "sawam" = swarm, "cashould" = "you should", "To skill" = "Tool's", "Clueless" = Klueless, "screensz" = screens.

### Project revival pattern

0248f3ad shows a session spanning 21 days — effectively dead for 3 weeks then revived. The explicit "What were we talking about?" prompt is a distinctive revival signal.

### Live stakeholder sessions

0daf8585 is a live session with Angela (client) on call. Detectable via "We" pronouns and real-time clarification questions.

---

## New Subtypes Proposed

1. **test.uat_campaign_with_autofix** — Automated UAT run with Claude auto-fixing issues (7b2157e9)
2. **planning.product_vision** — Product vision design with competitor research and concept exploration (201aec50)
3. **research.project_revival** — Dormant project resurrection with comprehensive re-exploration (0248f3ad)
4. **build.prompt_engineering** — Targeted refinement of AI prompt templates from stakeholder feedback (0daf8585)
5. **build.workflow_configuration** — POEM/YAML workflow config files generation (5309922c)
6. **setup.tool_installation** — npm/tool installation with web search verification (78dd3b7f)
7. **sysops.git_conflict_resolution** — Git divergent branch resolution (e7b6060d)
