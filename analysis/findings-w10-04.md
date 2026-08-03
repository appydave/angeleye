---
type: analysis
title: 'Findings W10-04'
description: 'W10-04: 9 sessions, 86% BUILD accuracy; proposes 6 subtypes including worktree_merge_fix, workflow_validation, and project_scaffolding.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W10-04

**Wave**: 10, Batch 04
**Sessions analysed**: 9 (1 heavy, 8 moderate)
**Date**: 2026-03-23
**Agent**: analysis-agent W10-04 (Opus 4.6)

---

## Session Summaries

### 6ee31b28 — angeleye (heavy)

**Registry type**: (none) | **Actual type**: BUILD (planning_then_build)

Multi-phase angeleye development session spanning 204 min (56 active). Phase 1 (~45 min): User asks "what's left to build AngelEye to finished?" listing 4 waves. Invokes /ralphy, selects option 4, then requests background agent research on data architecture rationale. Claude creates IMPLEMENTATION_PLAN.md and AGENTS.md for wave 7a (linen theme) and 7b (data split). Parallel subagent burst (5 general-purpose agents running simultaneously) implements UI changes: Header, Sidebar, SidebarGroup, ObserverView, OrganiserView, NavContext. Phase 2 (after 94-min idle gap): User returns asking about B012 (ambient intelligence) and data schemas. Another background agent researches. Final subagent writes PATTERNS.md and edits appystack template files.

Genuine BUILD: 45 Edit + 8 Write across angeleye components and planning docs. 9 subagents. Also touches appystack template (recipe SKILL.md, nav-shell.md) — cross-project spillover.

**Key observations**:

- Voice dictation: "pannal" = panel, "slide up pannal" = slide-up panel, "when versus idle column" = duration vs idle column
- User's opening question is a strategic prioritisation request — not a typical "build this" instruction
- Ralphy invoked for planning but session pivots to direct BUILD after planning docs created
- 5 parallel subagents is a heavy parallelisation pattern — all finish within ~2 min window
- Cross-project edit: appystack template files edited during angeleye session (recipe recipe-reference update)
- P15 potential: User says "I hate icons" and requests navigation changes — minor frustration with Claude's UI choices

### 7e7a8e58 — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (campaign_continuation)

Ralphy-driven BUILD session for prompt.supportsignal wui-round20 (162 min, 122 active). User asks about backlog reconciliation ("eight rounds behind"), then invokes "raffi mode" (voice artifact for Ralphy). Kicks off Playwright MCP for CR-11 verification. Discusses wave sizing, parallel vs sequential. After compaction resume at event 75, continues with styling discussion ("developer UX experience"), commit/push, then tackles loose ends including "eight rounds behind Project Heal Concept". Edit-heavy (55 edits).

CWD is prompt.supportsignal which is known unreliable for project attribution — but this session genuinely works on the prompt.supportsignal app (WUI round 20). BUILD is correct.

**Key observations**:

- Voice artifacts: "raffi mode" = Ralphy mode, "Project Heal Concept" = unclear (possibly a project name)
- Compaction resume detected — session ran out of context mid-build
- User references Playwright MCP for visual verification during build
- 6 search_without_read instances — Claude searching without following up on reads
- User frustrated about "eight rounds behind" on backlog reconciliation — organisational debt awareness

### cee4b2b0 — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (debug_then_build)

Debug-focused BUILD session for prompt.supportsignal (95 min, 51 active). Opens with "yes-debug" then "agent-sdk" — appears to be continuing from a prior context. User works through Agent SDK integration issues: error "Agent SDK returned empty result (result was null/undefined)", log capture questions, compiled workflow pattern discussion. 3 Skill invocations. 74 Bash calls (heavy debugging). Two commit points. Session ends with handover generation for next conversation.

**Key observations**:

- Opening "yes-debug" suggests continuation from a prompt or skill that offered debug options
- Bash-heavy (74 calls) indicates iterative debugging — running, testing, checking logs
- User asks about compiled workflows vs imperative patterns — design discussion embedded in debug session
- Voice artifact: "coutner" = counter (typo/voice), "somethng" = something
- Session closes with explicit handover request ("give me a hand over conversation for the next bot")

### c160da46 — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (worktree_merge_and_fix)

Worktree merge session for prompt.supportsignal (94 min, 64 active). User explains they are finishing a worktree and need to: merge back to main, document for Angela (stakeholder), handle Angela's feedback mechanism. Covers documentation creation, worktree removal (`git worktree remove`), post-merge bug fixing (API errors, missing questions in UI). Compaction resume at event ~107. After resume, Claude investigates post-merge issues and proposes preventive measures.

**Key observations**:

- Voice artifacts: "Maine" = main (git branch), "work trade" = worktree
- Stakeholder name: Angela — live user who will run the app
- Post-worktree-merge bugs: API route errors, missing question generation — classic integration issues
- 2 Skill invocations
- User asks "How does she run this app?" — UX accessibility concern for non-technical stakeholder
- P13 potential: Claude may not fully understand worktree merge implications ("didn't happen when we were on the work tree")

### 6f12067a — appystack (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (template_improvement)

AppyStack template improvement session (319 min wall, 78 active, 2 idle gaps of 174 and 67 min). Opens with "Do you understand the tech stack?" then pivots to discussing SAAS vs local app differences with ChatGPT context. User asks for multi-angle gap analysis (unit tests, docs, code) via background agents (20 Task calls). Discusses MSW (Mock Service Worker) pattern, security gaps, and organises remaining work into waves 3-4. Final phase: implementation of recommendations.

**Key observations**:

- Task tool used extensively (20 calls) — older subagent mechanism rather than Agent tool
- Voice artifacts: "MOTS service worker" = Mock Service Worker (MSW)
- Cross-platform context: user mentions ChatGPT conversation about SAAS patterns
- 1 Skill invocation
- Two large idle gaps suggest session spans a full work day with breaks
- User asks about context budget at end: "I've only got 5% context, what are you going to do about that?"

### bfa26edf — appystack (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (upgrade_tool_development)

AppyStack upgrade tool development session (266 min wall, 68 active, 2 idle gaps). Opens with "What's the state of this repository?" followed by repo/remote/todo check. User pastes a structured implementation brief for appystack-upgrade tool. Discusses target apps (FliGen, SupportSignal, ThumbRack, DeckHand). 15 Agent calls for parallel investigation. After implementation, tests on Signal Studio, troubleshoots npm publish, and runs upgrade on target app.

**Key observations**:

- Voice artifacts: "flijam" = FliGen
- Context paste: structured implementation brief (~500 chars visible) as session opener prompt 3
- User frustrated about transparency: "you only asked me if I wanted to update the SKILL, but you updated 25 files. I have no idea what you did" — P16 excessive_changes
- P13: "cont. inue" suggests voice recognition splitting a word
- Cross-project testing: runs `npx appystack-upgrade@latest` on signal-studio to verify
- Agent tool (15 calls) used for parallel investigation — modern subagent pattern

### de0f46f6 — prompt.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (workflow_validation)

POEM (Prompt Orchestration & Engineering Method) workflow validation session (1097 min wall, only 25 active, 1071-min overnight idle gap). Opens with "1" then "yes" — accepting a prior prompt/option. User asks Claude to compare Oscar's commands and workflows against generated data for quality validation. Heavy Task/TaskOutput usage (28 Task, 20 TaskOutput) — parallel workflow execution pattern. Compaction resume detected. After overnight gap, user returns: "Can you fix issues 1 and 2 and rerun".

**Key observations**:

- Task/TaskOutput pattern dominant (48 of 93 tool calls) — POEM executor workflow
- 1071-min idle gap = overnight break, session resumed next morning
- First prompt "1" and "yes" suggest selection from a menu/skill
- Read-heavy (38 reads) — validating generated data against source workflows
- 2 Write calls — minimal output, mostly reading and task execution
- This matches the POEM executor pattern: automated workflow execution where human observes

### b4041152 — brains (moderate)

**Registry type**: BUILD | **Actual type**: KNOWLEDGE (methodology_documentation)

Ralph Wiggum (Ralphy) methodology documentation session in brains repo (1348 min wall, 70 active, with 1169-min overnight gap). User wants to document three Ralphy approaches: Ralph loop, original approach, and Task Agent version. Highly frustrated — 4 explicit profanity uses about confusion over approach numbering. 53 Edit calls on brain files. Session includes cross-session coordination: user crafts handover messages for "the other conversation". Final prompt next day: "so what is this convo about" — memory loss after overnight gap.

**Key observations**:

- Strong frustration: "I'm still fucking committed and confused", "Where are the fucking three of them?", "It's the fact that you keep putting a fucking number in the file name that keeps constraining the way you think"
- P13 confirmed: Claude kept numbering approaches (2 approaches) when user insisted on 3, and the numbering in filenames constrained Claude's thinking
- Cross-session coordination: user pastes handover instructions to relay to another conversation
- Voice artifacts: "Ralph Wiggum" = Ralphy, "absolute halves" = absolute paths
- Edit-heavy (53 edits) but zero Write — editing existing brain docs, not creating new features
- CWD=brains is reliable here — genuinely documenting methodology in brain files
- Overnight gap + "so what is this convo about" = session memory loss pattern

### cc357cb4 — app.supportsignal.com.au (moderate)

**Registry type**: BUILD | **Actual type**: BUILD (project_scaffolding)

Rapid project scaffolding session for SupportSignal main app (9 min, 9 active — most compact moderate session). Opens with `/bmad-dev` skill invocation, then "DS" (likely a story/task selection). Claude scaffolds from template: creates Next.js app via `bunx create-next-app -e with-supabase`, syncs into project dir, installs TailwindCSS v4, configures PostCSS, sets up Drizzle ORM, creates Vitest config, CI workflow, Vercel config, middleware. 13 Write + 12 Edit + 28 Bash in 9 minutes — extremely dense output.

**Key observations**:

- /bmad-dev skill drives the entire session — skill-as-conductor pattern
- "DS" = likely story selection shorthand (Developer Story?)
- Scaffolding from `/tmp/supportsignal-scaffold` directory — template-based bootstrapping
- 21 file writes/edits in 9 minutes — very high throughput
- CWD reliable — all file paths target app.supportsignal.com.au
- Only 2 user prompts for 81 tool uses — human-to-tool ratio of 1:40, extremely autonomous
- BUILD is correct — genuine project scaffolding

---

## BUILD Accuracy Assessment

| Session  | Registry Type | Actual Type | Correct?         |
| -------- | ------------- | ----------- | ---------------- |
| 6ee31b28 | (none)        | BUILD       | N/A              |
| 7e7a8e58 | BUILD         | BUILD       | Yes              |
| cee4b2b0 | BUILD         | BUILD       | Yes              |
| c160da46 | BUILD         | BUILD       | Yes              |
| 6f12067a | BUILD         | BUILD       | Yes              |
| bfa26edf | BUILD         | BUILD       | Yes              |
| de0f46f6 | BUILD         | BUILD       | Yes (borderline) |
| b4041152 | BUILD         | KNOWLEDGE   | No               |
| cc357cb4 | BUILD         | BUILD       | Yes              |

**BUILD accuracy: 6/7 (86%)** — significantly higher than wave average (~22%). This batch is dominated by moderate+ sessions where BUILD accuracy is known to be 30-50%. This batch happened to draw genuinely substantive BUILD sessions. One clear misclassification: b4041152 (brains/methodology documentation) is KNOWLEDGE, not BUILD.

de0f46f6 is borderline — it's POEM executor workflow validation, which could be classified as TEST or OPERATIONS depending on lens. Counted as BUILD because it does fix and rerun workflows.

---

## New Subtype Proposals

1. **build.planning_then_build**: Session opens with strategic prioritisation, creates planning docs, then pivots to implementation (6ee31b28)
2. **build.worktree_merge_and_fix**: Worktree merge-back with post-merge debugging (c160da46)
3. **build.upgrade_tool_development**: Building tooling to upgrade other projects (bfa26edf)
4. **build.workflow_validation**: POEM executor pattern — validate generated workflows against source data (de0f46f6)
5. **build.project_scaffolding**: Rapid skill-driven bootstrapping of new project (cc357cb4)
6. **knowledge.methodology_documentation**: Documenting internal methodology approaches (b4041152)

---

## Pattern Observations

### Cross-session coordination pattern

Session b4041152 shows explicit cross-session message crafting: user writes handover instructions for "the other conversation" to relay to a parallel session. This is a human-mediated multi-session orchestration pattern.

### Overnight session resume with memory loss

Two sessions (de0f46f6, b4041152) span overnight with 1000+ min idle gaps. Both show the user returning confused about session state. b4041152 explicitly: "so what is this convo about".

### Extreme autonomy ratio

Session cc357cb4 has a 1:40 human-to-tool ratio (2 prompts, 81 tool calls). The /bmad-dev skill drives almost entirely autonomous scaffolding. This is the highest autonomy ratio observed in waves 1-10.

### Frustration concentrated in knowledge sessions

b4041152 has 4 explicit profanity instances — all about Claude's inability to track that there are three (not two) Ralphy approaches. The frustration is specifically about Claude's mental model being constrained by its own prior file naming choices.

### Voice dictation artifacts (new entries)

- "pannal" = panel
- "Maine" = main (git branch)
- "work trade" = worktree
- "MOTS service worker" = Mock Service Worker
- "flijam" = FliGen
- "absolute halves" = absolute paths
- "raffi" = Ralphy (confirmed again)
- "cont. inue" = continue (split by voice recognition)

---

## Friction Predicate Summary (P13-P16)

| Session  | P13 (misunderstood)     | P14 (wrong approach)       | P15 (buggy output)    | P16 (excessive changes)                     |
| -------- | ----------------------- | -------------------------- | --------------------- | ------------------------------------------- |
| 6ee31b28 | No                      | No                         | Yes (minor - icons)   | No                                          |
| 7e7a8e58 | No                      | No                         | No                    | No                                          |
| cee4b2b0 | No                      | No                         | Yes (Agent SDK null)  | No                                          |
| c160da46 | Yes (worktree merge)    | No                         | Yes (post-merge bugs) | No                                          |
| 6f12067a | No                      | No                         | No                    | No                                          |
| bfa26edf | No                      | No                         | No                    | Yes (25 files updated without transparency) |
| de0f46f6 | No                      | No                         | Yes (issues 1 and 2)  | No                                          |
| b4041152 | Yes (3 vs 2 approaches) | Yes (numbering constraint) | No                    | No                                          |
| cc357cb4 | No                      | No                         | No                    | No                                          |
