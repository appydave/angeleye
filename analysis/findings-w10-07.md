---
type: analysis
title: 'Findings W10-07'
description: 'W10-07: 9 sessions, 67% BUILD accuracy; proposes 9 subtypes spanning BUILD campaign variants, brain_creation, and presentation_preparation.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 10, Batch W10-07

**Analysed**: 2026-03-23
**Sessions**: 9 (all moderate)
**Projects**: prompt.supportsignal (x5), brains (x4 — two target summits/digital-stage-2026, one targets thailand-dtv brain, one targets agentic-os brain)

---

## Session Summaries

### 649c95af — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.campaign_continuation

Campaign continuation session. Opens with "continue this campaign" — a 2-word prompt that relies entirely on CLAUDE.md and session memory to reconstruct context. 70 active minutes, 5 prompts, 180 tool calls. Heavy Bash (102) + Read (29) + Edit (11) + Playwright (28 combined). Claude reads campaign state, builds features, then runs Playwright UAT against the live dev server (clicks, form fills, waits, snapshots). Ends with commit.

**Key observations**:

- "continue this campaign" is the shortest meaningful BUILD prompt seen — total context reconstruction from disk artifacts.
- Playwright semantic role: UAT (user acceptance testing) — not design verification or external research. Claude navigates the app, fills forms, clicks through workflows to verify the build.
- 102 Bash calls in 70 minutes = high automation density. Campaign sessions show this pattern consistently.
- CWD=prompt.supportsignal, work targets prompt.supportsignal — reliable attribution.
- Skill invocation detected (1) — likely campaign skill loading.

### c0ee8c35 — brains / moderate

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_creation

User asks to "create a new brain around managing my visa Requirements" for Thailand DTV visa. 25 prompts across 159 minutes (114 active). Voice-dictated throughout — the opening prompt contains passport details, DOB, visa dates, and travel requirements. Claude uses WebSearch (6) + WebFetch (1) + Playwright (24 combined) to research Thai immigration rules, 90-day reporting, re-entry permits. Produces brain files with visa timelines, reporting schedules, and exit/entry planning.

**Key observations**:

- **PII detected**: Passport number, date of birth, full legal name dictated via voice in prompt 1. These appear in the brain files written to disk.
- Voice dictation clear: long flowing sentences about visa requirements, dates, travel plans.
- 2 compaction resumes detected — session hit context limits twice, indicating heavy content generation.
- 22 Write + 32 Edit = 54 file mutations — substantial brain creation output.
- CWD=brains, deliverables in brains/thailand-dtv — reliable attribution.
- BUILD misclassification: this is pure knowledge capture with no feature code. Zero test files, zero component code.

### b97f2b6d — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.campaign_worktree

Opens with "Great, spin up a wet tray and let's start building." — "wet tray" is a voice artifact for "worktree". 10 prompts, 739 minutes duration but only 77 active (two large idle gaps: 96 min and 524 min — overnight). Uses Task delegation (19 Task calls) heavily. Claude creates a git worktree, builds features in isolation, then merges back.

**Key observations**:

- "wet tray" = worktree — consistent voice artifact, now seen in multiple waves.
- 19 Task calls = heavy delegation pattern. Claude orchestrating subagents for parallel work within the worktree.
- 524-minute overnight gap — user left the session running, returned next day. Session-alive pattern but no explicit "Is this finished?" check.
- CWD=prompt.supportsignal, work targets prompt.supportsignal — reliable attribution.
- Worktree workflow: create worktree -> build in isolation -> merge back. This is a mature developer pattern being directed via voice.

### a796e02a — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.review_then_fix

Opens with two file paths and "Are there any discrepancies between those two files?" — user pastes paths to .hbs and .json files in a POEM workflow. Claude reads both, finds discrepancies, then user directs fixes. 10 prompts, 45 minutes, fully active. Heavy Read (38) + Edit (33) — read-heavy ratio suggests careful analysis before editing. search_without_read detected (4 occurrences).

**Key observations**:

- Review-then-fix pattern: session starts as REVIEW (comparing files) but transitions to BUILD (fixing discrepancies). Classified as BUILD because the edits are the primary deliverable.
- 38 Read + 33 Edit = high read-to-edit ratio (1.15:1). User wants Claude to understand before changing.
- 4 search_without_read detections — Claude grepping without reading matched files. Minor antipattern.
- File paths pasted directly — user knows exact files, no exploration needed.
- CWD=prompt.supportsignal, targets prompt.supportsignal — reliable attribution.
- 6 Task delegations for parallel fix application.

### f95e4fb0 — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.compiler_development

Session resumes from compaction (1 detected). Opens with "how do we run a workflow" — an orientation question that leads into compiler development. 7 prompts, 35 minutes. Claude works on the `*execute` functionality of the POEM compiler — reading workflow definitions, editing compiler code, running test executions. Uses TaskCreate/TaskUpdate (6 combined) for progress tracking.

**Key observations**:

- **P15 (buggy_output) fired**: Compiler produced wrong model provider in output — Claude generated code that mapped to incorrect LLM provider. User caught it in testing.
- Compaction resume means prior context was substantial — this is a continuation of compiler work.
- 24 Edit + 10 Glob + 35 Read — heavy code navigation pattern. Compiler work requires understanding many interconnected files.
- "how do we run a workflow" — user asking an orientation question before building. The question itself is not the session's purpose; the compiler fixes that follow are.
- CWD=prompt.supportsignal, targets prompt.supportsignal — reliable attribution.

### 7370d999 — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.plan_execution

Classic plan-paste-then-execute pattern. First prompt is a 6.5KB plan titled "Rename IR -> Flow Graph + Remove ESM Cache Problem". User provides the full rename specification and cache fix instructions. Claude executes: renames files, updates route paths `/api/ir` -> `/api/flow-graph`, renames variables, fixes dynamic compilation. 11 prompts, 3129 minutes duration but only 36 active (one massive 3040-minute gap — 2+ days).

**Key observations**:

- Plan-paste-then-execute: the richest data is in the plan itself. 6.5KB of structured instructions with context, rationale, and step-by-step implementation spec.
- 3040-minute idle gap (50+ hours) — user returned 2 days later. Session-alive check: user's return prompt after the gap asks "Is this conversation finished?" Classic session-alive pattern.
- form_filling detected (short_prompt_ratio 0.7) — after the massive first prompt, subsequent prompts are short directives ("yes", "commit", etc.)
- 1 compaction resume — the plan was large enough to trigger compaction.
- Playwright used (2 navigate + 1 network_requests) — likely for verifying the renamed API routes work.
- Agent call (1) — subagent delegation for part of the rename.
- CWD=prompt.supportsignal, targets prompt.supportsignal — reliable attribution.

### 0661821b — brains / moderate

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.presentation_preparation

Session centered on Digital Stage 2026 summit presentation prep. Opens with a 3.6KB corrective paste — user explains that a prior session (DSS app) introduced factual errors ("Nick" in the brief — "I don't know who Nick is"). 22 prompts, 190 minutes (78 active), 111-minute idle gap. 6 subagent delegations for parallel research tasks. WebFetch (7) for fetching reference material. Edits target `brains/summits/digital-stage-2026/` — brief.md, agents-and-skills.json.

**Key observations**:

- **P13 (misunderstood_request) fired**: Prior session introduced "Nick" into brief.md. This session is the corrective followup — user explicitly says "I shouldn't have put him in brief.md without knowing."
- Corrective followup chain: this session exists because a prior session made a factual error. The opening prompt is error correction context.
- 6 subagents spawned — the most in this batch. Each runs for 20-150 seconds. Used for parallel research (fetching URLs, analyzing content).
- Bash commands reveal Claude searching for its own skill files — `find /opt/homebrew/lib/node_modules/@anthropic-ai/claude-code -name "SKILL.md"`. Self-introspection pattern.
- Voice artifacts: "lane chain" = LangChain, "lane graph" = LangGraph, "Alex" = Claude (user referring to the AI by a different name in dictation).
- CWD=brains, deliverables in brains/summits/digital-stage-2026 — reliable attribution.
- BUILD misclassification: no feature code. This is knowledge curation and presentation planning.

### d0af1944 — prompt.supportsignal / moderate

**Type**: BUILD (confirmed)
**Subtype**: build.campaign_kickoff

Plan-paste-then-execute at its most extreme. First prompt is 15.8KB — a complete campaign plan for "wui-display-manifest" refactoring. Describes the problem (hardcoded display concerns scattered across React components), the solution architecture, and step-by-step implementation. 6 prompts, 101 minutes (36 active), 65-minute idle gap. Heavy Task usage (7 Task + 7 TaskCreate + 12 TaskUpdate = 26 task-related calls) — Claude creates a task tree and works through it.

**Key observations**:

- 15.8KB first prompt — the largest plan paste in this batch and one of the largest seen across all waves. This is a full architectural specification.
- form_filling detected (short_prompt_ratio 0.8) — after the plan, user's role is pure oversight ("yes", "continue", "commit").
- 26 task-related calls (TaskCreate + TaskUpdate + Task) — the most structured task tracking in this batch. Claude creates subtasks, updates progress, delegates via Task.
- Campaign kickoff vs. continuation: this session starts a new campaign (vs. 649c95af which continues one). The plan paste is the distinguishing signal.
- CWD=prompt.supportsignal, targets prompt.supportsignal — reliable attribution.
- Skill invocation (1) detected — likely campaign skill.

### 31054316 — brains / moderate

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_planning

Opens with "focus on agentic-os" — a 3-word directive. 5 prompts, 171 minutes (33 active), 137-minute idle gap. Claude reads existing brain files, plans the agentic-os brain structure, creates/edits brain content files. 9 Edit + 8 Write + 12 Read = brain creation workflow. 2 Skill invocations — likely brain-related skills. AskUserQuestion (1) — Claude asks for clarification on brain scope.

**Key observations**:

- "focus on agentic-os" — another ultra-short directive that relies on CLAUDE.md context. User assumes Claude knows what agentic-os is and what needs to be done.
- 137-minute idle gap immediately after first tool use — user walked away after giving the directive, returned later.
- AskUserQuestion is rare — Claude asking the user for input rather than proceeding autonomously. Suggests the directive was ambiguous enough to need clarification.
- 5 TaskCreate + 10 TaskUpdate = structured planning output. Claude creates a task plan for the brain.
- CWD=brains, targets brains — reliable attribution.
- BUILD misclassification: no feature code. This is brain content planning and creation.

---

## Cross-Session Patterns

### BUILD accuracy: 6/9 correct (67%)

Significantly higher than waves 6-9 (~11-25% for mixed batches). This batch is all moderate sessions, confirming the pattern: **moderate sessions have higher BUILD accuracy than micro/light sessions**. The 3 misclassified sessions (c0ee8c35, 0661821b, 31054316) all had CWD=brains — a strong signal that CWD=brains correlates with non-BUILD work.

### CWD=brains as non-BUILD signal

All 3 misclassified sessions had CWD=brains. All 6 correctly-classified BUILD sessions had CWD=prompt.supportsignal. In this batch, CWD is a perfect predictor of session type: brains = KNOWLEDGE, prompt.supportsignal = BUILD. This won't generalize to all batches but is notable.

### Plan-paste-then-execute dominates moderate BUILD sessions

3 of the 6 BUILD sessions (7370d999, d0af1944, and partially a796e02a) opened with substantial plan pastes (6.5KB, 15.8KB, and file-path paste respectively). The form_filling detector fires on 2 of these. This is the mature workflow pattern: user prepares a plan externally, pastes it, then Claude executes with minimal intervention.

### Campaign workflow pattern

Two sessions form a campaign pair: d0af1944 (kickoff with 15.8KB plan) and 649c95af (continuation with "continue this campaign"). The kickoff has high Task density (26 task calls); the continuation has high Bash density (102 Bash calls). Different phases of the same workflow show different tool signatures.

### Corrective followup chain

0661821b is a corrective followup to a prior session that introduced errors. The 3.6KB opening paste is error correction context. This pattern — session N creates an error, session N+1 exists solely to fix it — was seen in earlier waves but is now confirmed as a recurring workflow pattern.

### Compaction as session intensity signal

3 sessions triggered compaction (c0ee8c35 x2, f95e4fb0 x1, 7370d999 x1). All 3 are content-heavy sessions (brain creation, compiler development, plan execution). Compaction count correlates with session complexity.

### Playwright usage by semantic role

- 649c95af: UAT (user acceptance testing) — clicking through built features to verify
- c0ee8c35: research (web browsing for visa information)
- 7370d999: API verification (checking renamed routes)
  Three different Playwright semantic roles in one batch.

---

## New Subtype Candidates

| Subtype                              | Session  | Description                                             |
| ------------------------------------ | -------- | ------------------------------------------------------- |
| `build.campaign_continuation`        | 649c95af | Resuming an existing campaign with "continue" directive |
| `build.campaign_worktree`            | b97f2b6d | Campaign work using git worktree for isolation          |
| `build.campaign_kickoff`             | d0af1944 | Starting a new campaign with a large plan paste         |
| `build.review_then_fix`              | a796e02a | Review phase transitions into fix phase                 |
| `build.compiler_development`         | f95e4fb0 | Working on the POEM compiler/executor                   |
| `build.plan_execution`               | 7370d999 | Executing a pre-written plan (rename + fix)             |
| `knowledge.brain_creation`           | c0ee8c35 | Creating a new brain with research                      |
| `knowledge.presentation_preparation` | 0661821b | Preparing summit/conference presentation content        |
| `knowledge.brain_planning`           | 31054316 | Planning brain structure and creating initial content   |

---

## Friction Predicates

| Predicate                   | Fired | Session  | Detail                                                              |
| --------------------------- | ----- | -------- | ------------------------------------------------------------------- |
| P13 (misunderstood_request) | Yes   | 0661821b | Prior session introduced "Nick" into brief.md — user had to correct |
| P14 (wrong_approach)        | No    | —        | —                                                                   |
| P15 (buggy_output)          | Yes   | f95e4fb0 | Compiler produced wrong model provider mapping                      |
| P16 (excessive_changes)     | No    | —        | —                                                                   |

---

## Voice Artifacts Catalog Additions

| Artifact     | Intended  | Session  | Context                                 |
| ------------ | --------- | -------- | --------------------------------------- |
| "wet tray"   | worktree  | b97f2b6d | "spin up a wet tray"                    |
| "lane chain" | LangChain | 0661821b | Discussing AI frameworks                |
| "lane graph" | LangGraph | 0661821b | Discussing AI frameworks                |
| "Alex"       | Claude    | 0661821b | Referring to the AI assistant           |
| "Pi-Ai"      | PyAI      | 0661821b | Python AI library reference             |
| "brians"     | brains    | 31054316 | Voice artifact for the brains directory |

---

## PII Detection

Session c0ee8c35 contains passport number, date of birth, and full legal name dictated via voice. These appear in the raw transcript and are written into brain files on disk. This is the same PII-via-voice-dictation pattern seen in earlier waves — the user dictates personal details without considering they're being recorded in session transcripts.

---

## Statistics

| Metric                    | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| Sessions analysed         | 9                                                     |
| Session complexity        | All moderate                                          |
| BUILD registry correct    | 6/9 (67%)                                             |
| New subtypes              | 9                                                     |
| Junk/near-junk            | 0                                                     |
| Multi-phase               | 3 (b97f2b6d, 7370d999, 0661821b — all with idle gaps) |
| Compaction resumes        | 4 (across 3 sessions)                                 |
| Frustration signals       | 0                                                     |
| Playwright sessions       | 3                                                     |
| Subagent sessions         | 1 (0661821b — 6 subagents)                            |
| Cross-session references  | 1 (0661821b corrective followup)                      |
| Voice artifacts found     | 6                                                     |
| PII detected              | 1 session (c0ee8c35)                                  |
| Plan-paste sessions       | 2 (7370d999, d0af1944)                                |
| Friction predicates fired | 2 (P13 x1, P15 x1)                                    |
