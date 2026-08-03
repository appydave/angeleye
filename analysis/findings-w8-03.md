---
type: analysis
title: 'Findings W8-03'
description: 'Wave 8 batch 03 analysis of 9 sessions — 33% BUILD accuracy, build.greenfield_app subtype, heavy-session frustration concentration, task vs agent delegation.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch W8-03

**Batch**: W8-03 (9 sessions)
**Analysed**: 2026-03-23
**Sessions**: 05ff3ec4 (heavy), 02a273f8 (moderate), 1af0ff41 (moderate), 1f948dc1 (moderate), 170f2ec1 (moderate), 0ae7df7c (light), 651ffc0f (light), 074e257f (light), 9c0419b7 (micro)

---

## Session Summaries

### 05ff3ec4 — digital-stage-summit-2026 (heavy, 314 events, 143 min active)

**Registry type**: BUILD → **Analysed**: BUILD (confirmed)
**Subtype**: build.greenfield_app

This is a genuine heavy BUILD session: user creates a brand new AppyStack app (digital-stage-summit-2026) for a live summit talk, then builds a Loom repository CRUD feature with UI. CWD is `/dev/ad/apps` (parent directory), but all 46 edit/write targets hit the newly created digital-stage-summit-2026 project. Session includes npx create-appystack scaffolding, port debugging, Playwright verification, and ends with /ralphy setup + memory file writes for future sessions.

**Observations**:

- Heavy frustration throughout (P06, P17-P19, P22-P23, P26-P29): repeated failures getting the context/transcript button to work correctly, port startup issues (EADDRINUSE), and data migration problems. User says "I've been trying to get you to do one thing, and you still haven't" (P23).
- Clear P15 buggy_output: Claude-generated server code failed on port binding (5060 vs 5171 mismatch). The env.ts config was wrong. Multiple restart cycles.
- P14 wrong_approach confirmed: Claude kept embedding transcripts in JSON documents when user wanted them separated into sidecar files. Took 6+ prompts to converge on the right architecture.
- Session ends with healing/documentation phase — user demands learnings be captured before closing. Memory files written to `.claude/projects/` for future sessions.
- Cross-project work: AppyStack backlog and troubleshooting docs also updated (bugs filed upstream).

### 02a273f8 — poem (moderate, 151 events, 64 min active)

**Registry type**: BUILD → **Analysed**: OPERATIONS
**Subtype**: operations.health_check

User opens with "general health check on the knowledge-driven development within this project" and explicitly says "don't execute them." Then proceeds to run health check tasks via TaskCreate/TaskUpdate (11 creates, 27 updates). The session is auditing poem-os project health, fixing discovered issues, and committing. No new features built — this is operational maintenance.

**Observations**:

- Task-based workflow: 11 TaskCreate + 27 TaskUpdate = heavy use of Claude's task management for structured sequential work. User delegates entirely ("I'm leaving everything to you").
- Multi-phase: Phase 1 (advisory — don't execute), Phase 2 (execute health checks), Phase 3 (fix discovered issues), Phase 4 (commit + push). Transitions are explicit user approvals.
- 5 idle gaps over 1h, spanning 2 days — user returns periodically to continue the health check workflow.

### 1af0ff41 — deckhand (moderate, 121 events, 33 min active)

**Registry type**: BUILD → **Analysed**: BUILD (confirmed)
**Subtype**: build.iterative_design

Genuine BUILD session on the Deckhand app. Opens with Claude reading context and user asking about pending items. User selects option "3", Claude immediately starts editing code. Then after a 154-min gap, user returns and asks Claude to run the app via Playwright MCP and give a tour. User then gives live voice-driven UX feedback: auto-save ("I don't want to have to press save"), drag-and-drop fix, delete gesture ("drag off the slide deck → red cross"), live label updates. Claude implements each request with Edit-heavy tool calls.

**Observations**:

- Classic iterative design pattern: Claude builds, user tests via Playwright, gives voice feedback, Claude implements. 67 Edit calls confirms heavy code modification.
- Voice dictation artifact: "Play Rod MCP" = "Playwright MCP" (P6).
- 10 Playwright calls (navigate, screenshot, click, wait_for) for visual verification — BUILD with UI_REVIEW sub-phase.
- 7 Agent calls for parallel code modification tasks.

### 1f948dc1 — appystack (moderate, 94 events, 79 min active)

**Registry type**: BUILD → **Analysed**: MIXED (BUILD + RESEARCH)
**Subtype**: mixed.build_and_research

Session opens with a paste of Wave 3 test results (context handover) and spans multiple distinct activities: reviewing wave results, writing docs (README), researching ShadCN/Radix integration, implementing OKLCH color system changes. User drives direction at each phase boundary.

**Observations**:

- Multi-phase session with at least 4 phases: (1) review wave 3 results, (2) doc writing (README), (3) ShadCN/Radix research + analysis, (4) OKLCH implementation. Ends with /commit and handover request.
- Task-based workflow: 22 Task + 3 Skill calls. Heavy delegation pattern.
- form_filling detection triggered (first prompt 4.5K chars, 77% short prompt ratio) — the long opener is actually a paste_handover, not form filling.
- Cross-session: opens by pasting Wave 3 output from a prior session.

### 170f2ec1 — signal-studio (moderate, 78 events, 60 min active)

**Registry type**: BUILD → **Analysed**: BUILD (confirmed)
**Subtype**: build.campaign_continuation

Session in signal-studio (SupportSignal product repo). Opens with frustration: "Why haven't you figured out where we're at?" — Claude hadn't auto-loaded context. User pastes /ralphy output from another session as handover briefing (wave20-uat-validation plan with 7 work units). Then user selects "option a + c" after an 8-hour gap, Claude executes with heavy Edit (27) + Bash (26) + Agent (8) pattern. Ends with user confused: "What do you want me to do about this?"

**Observations**:

- Continuation pattern: user pastes prior session's /ralphy output as context handover (P1). This is a build.campaign session picking up from a planning session.
- 2 large idle gaps (499 min, 125 min) — session spans across a day.
- 8 Agent calls suggest parallel work unit execution (consistent with ralphy campaign pattern).
- Opening frustration (P02 = true): user expected Claude to auto-orient, had to manually paste context.
- Closing confusion (P3): "What do you want me to do about this?" — unclear state at session end.

### 0ae7df7c — appystack (light, 29 events, 3 min active)

**Registry type**: BUILD → **Analysed**: OPERATIONS
**Subtype**: operations.codebase_cleanup

Short session: user asks if Claude understands the tech stack, then asks to find "redundant or out of date documents, code or other concepts." Claude runs 3 Task agents to audit, then user says "fix items 1 through 4" and "commit this." This is cleanup/maintenance, not feature construction.

**Observations**:

- Extremely efficient: 3 minutes active, 29 events, clear audit→fix→commit workflow.
- User suggests background agents for the audit — delegation pattern.
- Only 1 Edit call, 6 Read calls — mostly reading and fixing documentation/config, not writing features.

### 651ffc0f — angeleye (light, 28 events, 47 min active)

**Registry type**: BUILD → **Analysed**: ORIENTATION
**Subtype**: orientation.handover_verification

User pastes a handover message from another session and asks Claude to verify file paths and locations. Then pastes the original conversation transcript (very large — 271KB file from 28 lines) for completeness check. Asks Claude to push to GitHub. Session also includes path correction ("wrong location — meant to go under @appydave") and creating a public repo. Ends with user asking "what was the nature of this conversation" and later (16h gap) complaining Claude hasn't given good understanding of the project.

**Observations**:

- Cross-session reference (P06 = true): entire session is about verifying another session's output.
- CWD is angeleye but work includes GitHub repo creation, SSH file transfer, and requirements verification — mixed project scope.
- Very large prompts (271KB file driven by pasted conversation transcripts in P2 and P7). This is the cross-paste injection pattern.
- Frustration in final prompt (P8): "I don't think you've really given me a good understanding of what we're doing."
- Voice artifacts: "rconversation" = "conversation" (P6/P25).

### 074e257f — prompt.supportsignal (light, 17 events, 43 min active)

**Registry type**: BUILD → **Analysed**: KNOWLEDGE
**Subtype**: knowledge.feedback_consolidation

Opens with "caputre" (voice artifact for "/capture" or "capture"). User asks to consolidate feedback files and remove duplicates. Discusses missing input fields on new incident capture, YouTube launch optimizer text area issues. Then asks for hover-based modal tooltips for feedback items. Finally asks Claude to write the consolidated file. Session is organizing and consolidating existing feedback/knowledge, not building features.

**Observations**:

- Voice artifact: "caputre" = "capture", "feedabck" = "feedback" (P0, P1).
- Read-heavy (5 Read + 4 Glob + 1 Write) — reading feedback files, consolidating, writing one output.
- prompt.supportsignal CWD is confirmed unreliable again (wave 5 finding) — this is feedback consolidation work, not BUILD.
- P6 pastes test results table — cross-session reference from a test run.

### 9c0419b7 — ad (micro, 2 events, 1 min active)

**Registry type**: BUILD → **Analysed**: RESEARCH
**Subtype**: research.quick_question

Two prompts, zero tools. User asks "Do I subscribe to a fucking calendar with Google Calendar?" then pastes a webcal:// URL. Pure conversational question — no coding, no tools, nothing built. CWD is monorepo root (/dev/ad) which is always incidental for micro sessions.

**Observations**:

- Zero tool calls = never BUILD (confirmed rule).
- CWD /dev/ad is incidental (monorepo root — confirmed pattern from wave 4).
- Profanity in opener but not frustration with Claude — just casual speech style.
- Conversational tool_profile — pure chat exchange.

---

## Cross-Batch Patterns

### BUILD accuracy in this batch: 3/9 (33%)

Confirmed BUILD: 05ff3ec4, 1af0ff41, 170f2ec1. The rest were misclassified:

- 02a273f8: OPERATIONS (health check)
- 1f948dc1: MIXED (build + research)
- 0ae7df7c: OPERATIONS (cleanup)
- 651ffc0f: ORIENTATION (handover verification)
- 074e257f: KNOWLEDGE (feedback consolidation)
- 9c0419b7: RESEARCH (quick question)

### Frustration concentration in heavy sessions

05ff3ec4 (heavy) had the most severe frustration — 10+ prompts expressing frustration with Claude's repeated failures. This correlates with wave 6 finding: heavy sessions are substantive but also highest frustration density when things go wrong.

### P13-P16 Friction Predicates — First Observations

- **P13 has_misunderstood_request**: Detected in 05ff3ec4 (context button meaning), 651ffc0f (user wanted understanding not state dump).
- **P14 has_wrong_approach**: Detected in 05ff3ec4 (transcript-in-JSON vs sidecar files).
- **P15 has_buggy_output**: Detected in 05ff3ec4 (port binding failure, data migration bugs).
- **P16 has_excessive_changes**: Not clearly detected in this batch.

### Task-based workflow pattern

02a273f8 and 1f948dc1 both use TaskCreate/TaskUpdate heavily. This is a structured delegation pattern where user approves at phase boundaries. Distinct from Agent-based parallelism (170f2ec1, 1af0ff41) which is fire-and-forget.

### New subtypes proposed

- `build.greenfield_app` — Creating a brand new app from scratch (scaffolding + first feature). Distinct from build.campaign (ongoing) or build.migration.
- `operations.health_check` — Systematic audit of project health, fixing discovered issues.
- `operations.codebase_cleanup` — Short targeted cleanup of redundant/outdated code.
- `orientation.handover_verification` — Verifying another session's handover message for accuracy.
- `knowledge.feedback_consolidation` — Consolidating scattered feedback into unified documents.
- `mixed.build_and_research` — Multi-phase session with both BUILD and RESEARCH phases.
