---
type: analysis
title: 'Findings W5 Prompt SS'
description: 'Wave 5 analysis of 8 prompt.supportsignal sessions — POEM executor patterns (*run/*execute), incidental CWD, design-test-re-test-postmortem execution chain.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings: W5 prompt.supportsignal Sessions (8 substantive)

**Batch**: W5-B01, W5-B04, W5-B05, W5-B06, W5-B07, W5-B08, W5-B09, W5-B10
**Project**: prompt.supportsignal.com.au
**Analysed**: 2026-03-22
**Date range**: 2026-02-17 to 2026-03-13 (25 days)

---

## Cross-cutting findings

### The `*execute` / `*run` pattern

These are **POEM executor commands** — shorthand for running numbered POEM workflows (e.g., workflow 105 = "new incident analysis with mock provider", workflow 106 = "new incident workflow with real NDIS data"). The asterisk prefix is a convention that invokes the POEM executor skill inside Claude Code. When David types `*run 106`, Claude reads the workflow YAML, resolves the steps, and orchestrates Oscar (the POEM workflow agent) through preflight, build, and execution phases.

- `*execute 105` (W5-B04): runs workflow 105 with the mock provider — a test harness
- `*run 106` (W5-B07, W5-B08): runs workflow 106 with real data — production incident analysis

The tool patterns confirm this: both B07 and B08 show the characteristic Read-heavy + Task/TaskOutput burst pattern of a multi-step POEM workflow execution where Claude reads YAML/schemas/prompts, then spawns subagent Tasks for each step, collecting results via TaskOutput.

### CWD reliability: universally incidental

All 8 sessions have `cwd = /Users/davidcruwys/dev/clients/supportsignal/prompt.supportsignal.com.au`, but the actual work spans multiple projects:

- **Agent Workflow Builder (AWB)** — W5-B01, W5-B05
- **POEM OS central** (`~/dev/ad/poem-os/`) — W5-B06
- **v-appydave** (video projects) — W5-B06
- **SupportSignal prompt engineering** — W5-B04, W5-B07, W5-B08, W5-B09, W5-B10
- **signal-studio** (Angela's project) — W5-B01

The prompt.supportsignal CWD is David's "home terminal" for POEM/SupportSignal work. Files are touched across 4+ repos. Project attribution is **unreliable** for most sessions — the CWD is a convenient launch point, not a statement about what project is being modified.

### Session chain: Feb 17 cluster

B10 → B08 → B07 → B09 form a tight chain on Feb 17-18:

1. **B10** (02:32): David designs severity classifier, updates Q&A prompts with severity integration
2. **B08** (05:02): First `*run 106` — tests the updated prompts via Oscar, discovers severity not being passed to Q&A prompts, no mock answers generated
3. **B07** (08:49): Second `*run 106` — re-run after fixes, David asks Oscar to self-audit ("compare against the workflow Alex gave you")
4. **B09** (04:05 next day): Post-mortem analysis of Oscar's behavioral issues across rounds 105-107, produces structured findings document

This is a **design → test → re-test → post-mortem** cycle.

---

## Per-session findings

### W5-B10: Severity classifier design + Q&A integration

**Session ID**: 439bd71d-69dc-4342-981b-98a41db8486f
**Date**: 2026-02-17 02:32–04:36 (123 min wall, 29 min active)
**Events**: 59 | **User prompts**: 12 | **Tools**: Edit 23, Read 16, Task 4, Glob 3, Write 1

David orients Claude on existing documentation: analysis-row-pattern, severity classifier, Q&A generation rules. The session is heavily edit-focused — 23 Edit calls updating prompt files and schemas to integrate a 4-tier severity object into the Q&A system. Key decisions:

- Deduplication prompt marked inactive; schema updated to reflect this
- Severity integration uses natural language in prompts (not Handlebars conditionals) — David accepts Claude's recommendation
- All Q&A prompts updated to reference severity fields
- Analysis-row pattern (predicate + classification + observation) checked for severity compatibility
- Voice dictation throughout ("hunky-dory", "over-optimising")

**Classification**: BUILD / build.prompt_engineering
**Opening**: voice_dictation (orientation question about existing docs)
**Closing**: commit_then_gap (cosmetic edits, then 25min gap to B08)
**Tool profile**: build_focused (Edit-dominant, systematic prompt file updates)
**Scale**: moderate (59 events, 12 prompts, 29 active min)
**Interest**: high — shows the full prompt engineering workflow for NDIS severity

### W5-B08: POEM executor run — first `*run 106`

**Session ID**: 92ea2610-744f-4ee8-9a35-904f3ccf87be
**Date**: 2026-02-17 05:02–06:33 (85 min wall, 17 min active)
**Events**: 69 | **User prompts**: 4 | **Tools**: Read 30, Task 16, TaskOutput 12, Glob 5, Bash 1, Write 1

Triggered by `*run 106`. Claude reads workflow YAML, schemas, and prompts (30 Reads), then spawns Oscar subagent tasks (16 Task + 12 TaskOutput). Only 4 user prompts — David is mostly observing the automated run. After execution, David identifies two bugs:

1. Security classification not being passed through to Q&A prompts despite being in the schema
2. No mock answers generated — the Q&A step produced questions but skipped answer generation

68-minute idle gap between prompt 3 and prompt 4 — David left, came back, and pointed out the severity pass-through failure. Session ends with David's frustration that the big bug (no answers) was missed.

**Classification**: OPERATIONS / operations.poem_execution
**Opening**: bare_task_ref (`*run 106`)
**Closing**: unresolved_cleanup (bugs identified but not fixed this session)
**Tool profile**: agent_orchestration (Read → Task → TaskOutput pipeline)
**Scale**: moderate (69 events but only 17 active min)
**Frustration**: yes — "you still missed the big one"
**Interest**: high — shows POEM executor in action and failure mode

### W5-B07: POEM executor re-run — second `*run 106`

**Session ID**: 37256037-fdb0-4769-85d4-3d19463c5fbd
**Date**: 2026-02-17 08:49–09:10 (20 min wall, 20 min active)
**Events**: 66 | **User prompts**: 3 | **Tools**: Read 26, Task 15, TaskOutput 12, Bash 7, Glob 2, Write 1

Second `*run 106` execution — same workflow, presumably after fixes from B08's identified issues. Same Read-heavy + Task/TaskOutput pattern. 3 user prompts, 20 minutes — fast automated run. After execution, David asks Claude to self-audit: "compare it against the workflow that Alex gave you" and "double-check that the data matches the way you were meant to do it." This is a **verification run** with explicit quality-gate request.

**Classification**: OPERATIONS / operations.poem_execution
**Opening**: bare_task_ref (`*run 106`)
**Closing**: bookend_close (self-audit request, structured review)
**Tool profile**: agent_orchestration
**Scale**: light (20 min, 3 prompts, fast execution)
**Interest**: medium — confirms the executor pattern, less novel than B08

### W5-B09: Oscar post-mortem analysis

**Session ID**: c313d9f7-86e0-42f8-b9ad-6fb338a52b83
**Date**: 2026-02-18 04:05–04:12 (7 min)
**Events**: 21 | **User prompts**: 1 | **Tools**: Read 7, Task 5, TaskOutput 4, Grep 2, Write 1, Edit 1

Single-prompt session. David pastes a large handover with conversation transcripts (a21-a23.txt, 345KB) and JSON outputs from executions 105-107. The prompt asks Claude to do iterative analysis of Oscar's behavioral issues across test rounds. Claude reads prior analysis docs, spawns analysis tasks, searches for patterns, and produces a structured findings document.

This is a **knowledge synthesis** session — taking raw execution data and producing documented findings about Oscar's failure modes.

**Classification**: KNOWLEDGE / knowledge.post_mortem_synthesis
**Opening**: context_loading_paste (large file list + analysis prompt)
**Closing**: memory_write (findings document written)
**Tool profile**: synthesis (Read + Task + Write pattern)
**Scale**: micro (21 events, 7 min, 1 prompt)
**Interest**: high — demonstrates the analysis-after-execution pattern; proposed new subtype

### W5-B04: POEM executor — `*execute 105`

**Session ID**: 116f3f7c-b523-4694-bddb-0c88269f46fd
**Date**: 2026-02-19 04:31–05:41 (67 min)
**Events**: 83 | **User prompts**: 11 | **Tools**: Bash 30, Read 22, Edit 11, Write 5, Grep 3, Task 1

Starts with `*execute 105` (mock provider workflow). After execution, the session pivots to a deep technical discussion about POEM executor performance: TypeScript compilation overhead, subprocess spin-up costs, debug mode configuration. David asks about AgentSDK integration — could the POEM executor run as an endpoint in poem-app instead of spawning subprocesses? References prior AgentSDK work in fli-gen and appydave-app-a-day/007-bmad-claude-sdk. Session produces documentation updates about performance characteristics and multi-turn session behavior.

Two distinct phases:

1. **Execution phase** (04:31-05:04): Run workflow 105, observe results
2. **Architecture discussion** (05:04-05:39): Performance analysis, AgentSDK integration, documentation

**Classification**: MIXED (OPERATIONS + RESEARCH) / operations.poem_execution + research.architecture
**Opening**: bare_task_ref (`*execute 105`)
**Closing**: commit_then_gap (documentation edits committed)
**Tool profile**: operational_scripting (Bash-heavy with Read/Edit for docs)
**Scale**: moderate (83 events, 67 min, 11 prompts)
**Multi-phase**: yes — execution then architecture exploration
**Interest**: high — shows execution-to-research pivot; performance analysis is valuable domain knowledge

### W5-B06: POEM OS architecture cleanup

**Session ID**: 78a153a0-9b30-46b7-b569-6b513a50c86f
**Date**: 2026-02-19 11:18–12:52 (92 min)
**Events**: 53 | **User prompts**: 14 | **Tools**: Bash 17, Read 7, Edit 6, Task 3, Glob 3, Write 3

David opens by pasting a path to `open-questions-for-poem-os.md` and asking for an assessment. The session becomes an architecture cleanup across three projects:

1. **POEM OS central** — canonical task definitions (preflight, validate)
2. **v-appydave** — field project `.poem-core/tasks/` alignment
3. **prompt.supportsignal** — field project alignment

Key architectural decisions:

- `.poem-core/` in field projects should only have `tasks/` (not workflows)
- Orchestration workflows live in `poem/workflows/`
- "Penny" (an agent) created tasks that got duplicated across 3 projects — needs deduplication
- Preflight and validate tasks assessed for cross-workflow generalizability

Session ends with commits and pushes to all three repos. CWD is prompt.supportsignal but 2/3 of the work targets other projects.

**Classification**: OPERATIONS / operations.architecture_cleanup
**Opening**: context_loading_paste (file path paste + assessment request)
**Closing**: commit_and_push (all three repos committed and pushed)
**Tool profile**: operational_scripting (Bash for cross-repo git, Edit/Write for cleanup)
**Scale**: moderate (53 events, 92 min, 14 prompts)
**CWD incidental**: strongly yes — 2 of 3 target repos are elsewhere
**Interest**: high — cross-project architecture alignment is a rich AngelEye signal

### W5-B05: WUI multi-workflow + Ralphy campaign

**Session ID**: 32fbfde9-3303-4dca-a22c-92888c1a4139
**Date**: 2026-02-23 09:40–16:19 (398 min wall, 100 min active)
**Events**: 84 | **User prompts**: 19 | **Tools**: Bash 31, Task 12, Edit 10, Read 6, Write 5, Skill 1

Longest session. Three phases separated by multi-hour idle gaps:

**Phase 1** (09:40-10:26, 46 min): Architecture deep-dive on WUI (Web UI) proof of concept. David asks about YAML/data/prompt/schema separation. Background tasks produce documentation. Discussion of WUI vs TUI executor unification. YouTube Launch Optimizer integration planning.

**Phase 2** (13:57-14:32, 35 min): Return after 3.5h gap. Skill invocation. Angela's feedback items (F001, F002). Ralphy wave 1 execution with Edit/Task burst (build.campaign pattern). Smoke test.

**Phase 3** (16:04-16:19, 15 min): Git merge. Handover message for Ralphy. David notices the handover didn't include enough context for a new Ralphy session. Discussion about whether the Ralphy skill should understand round transitions. Ralphy skill file updated.

**Classification**: BUILD / build.campaign (Ralphy wave execution is the structural backbone)
**Opening**: conceptual_question (WUI architecture inquiry)
**Closing**: bookend_close (Ralphy skill update + meta-reflection)
**Tool profile**: build_focused (Edit + Task + Bash for wave execution)
**Scale**: heavy (398 min wall, 100 active, 19 prompts, 84 events)
**Multi-phase**: yes — 3 phases with 3.5h and 1.5h gaps
**Compaction**: yes — 1 compaction detected
**Skill invoked**: Ralphy (inferred from campaign execution pattern)
**Interest**: very high — Ralphy campaign execution + skill improvement feedback loop

### W5-B01: AWB changes review + Angela meeting prep

**Session ID**: b3ae2275-3ed1-42df-ba95-47a18731bdae
**Date**: 2026-03-13 04:34–07:03 (148 min wall, 76 min active)
**Events**: 74 | **User prompts**: 17 | **Tools**: Bash 21, Read 21, Agent 7, Glob 3, Write 3, Edit 2

David opens by asking if AWB (Agent Workflow Builder) round-22 changes are committed. Then pivots to meeting prep — Angela is on a call and David has 10 minutes. He kicks off background Agent tasks to check Angela's 8 feedback items (F004-F018), update Angela's guide, and create an agent quick reference.

Mid-session: live meeting with Angela. David relays Angela's screen ("Here's the path she thinks in") showing signal-studio file locations. Discussion about Moments That Matter YAML design. Context compaction occurs. After compaction, David asks Claude to review Penny's (another agent) work against the Moments That Matter model.

**Classification**: MIXED (BUILD + OPERATIONS) / build.documentation + operations.meeting_support
**Opening**: voice_dictation (catch-up question about yesterday's changes)
**Closing**: abrupt_abandon (reviewing Penny's work, no closing ceremony)
**Tool profile**: build_focused (Agent tasks + Read/Bash for investigation)
**Scale**: moderate (74 events, 76 active min, 17 prompts)
**Multi-phase**: yes — pre-meeting prep, live meeting, post-meeting review
**Compaction**: yes — 1 compaction
**Cross-session refs**: yes — references "yesterday's" AWB work, Angela's feedback items
**Interest**: high — real-time meeting support is a distinctive usage pattern

---

## Proposed new subtypes

| Subtype                           | Source session(s) | Description                                                                |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| `operations.poem_execution`       | B04, B07, B08     | POEM executor run via `*run`/`*execute` — automated workflow orchestration |
| `knowledge.post_mortem_synthesis` | B09               | Analysis of prior execution results to produce structured findings         |
| `operations.meeting_support`      | B01               | Real-time Claude use during a live meeting with a colleague                |
| `operations.architecture_cleanup` | B06               | Cross-project structural alignment and deduplication                       |
| `build.prompt_engineering`        | B10               | Designing and updating prompt files, schemas, severity classifiers         |

## Key patterns observed

1. **Execution → Analysis cycle**: B10 designs prompts → B08 tests them → B07 re-tests → B09 post-mortems. This 4-session chain is the most complete design-test-analyze loop seen so far.

2. **CWD as home terminal**: prompt.supportsignal is David's general-purpose POEM workspace. File touches reach AWB, POEM OS, v-appydave, and signal-studio. For AngelEye classification, project_attribution should be "unreliable" for all 8.

3. **`*run`/`*execute` as session openers**: These produce a distinctive shape — very few user prompts (3-4), high Task/TaskOutput count, Read-dominant. The user is essentially pressing "go" and watching automation run. Classification should be OPERATIONS, not BUILD (registry has them all as BUILD).

4. **Agent/Task as parallel workers**: B01 uses Agent (7 calls) for background investigation. B07/B08 use Task/TaskOutput (15-16/12) for POEM step execution. B05 uses Task (12) for both documentation and Ralphy waves. The tool semantics differ: Agent = "go research this", Task/TaskOutput = "execute this step and return results."

5. **Voice dictation signals**: B01, B10 show clear voice transcription artifacts ("hunky-dory", "we got duplicates of pennies", "Does it just re-create it"). These sessions tend to have more user prompts and shorter, more conversational turns.
