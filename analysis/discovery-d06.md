---
type: analysis
title: 'Discovery D06'
description: 'D06: 9 sessions; proposes zombie session detection, automated UAT runner, feature archaeology predicates and delegation_style classifier.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch D06

## Sessions Examined

| #   | Session ID | CWD                         | Prompts | Tools | Duration (min) | Active (min) | Key Signal                                                    |
| --- | ---------- | --------------------------- | ------- | ----- | -------------- | ------------ | ------------------------------------------------------------- |
| 1   | `d7ca10ed` | flivideo/flideck            | 43      | 481   | 2802           | 277          | Multi-day migration campaign, Ralphy Mode 2, 4 compactions    |
| 2   | `ee880a6a` | supportsignal/signal-studio | 8       | 337   | 101            | 64           | Automated UAT runner, 127 Playwright clicks, cron lifecycle   |
| 3   | `65f77723` | supportsignal/signal-studio | 29      | 232   | 1204           | 257          | UAT feedback triage, voice-dictated, high search_without_read |
| 4   | `a080427c` | apps/thumbrack              | 12      | 185   | 7295           | 106          | Feature archaeology, cross-project reads, 5-day zombie        |
| 5   | `d129cfba` | supportsignal/prompt.ss     | 21      | 136   | 156            | 124          | Systemic diagnosis of multi-agent workflow, Task tool usage   |
| 6   | `1258366a` | brains                      | 28      | 102   | 8362           | 94           | Research/exploration, week-long zombie, 7 idle gaps           |
| 7   | `460a1312` | supportsignal/prompt.ss     | 10      | 92    | 2718           | 44           | Voice-dictated data routing design, heavy Task tools          |
| 8   | `bbc86dc1` | apps/angeleye               | 11      | 52    | 782            | 28           | Skill restructuring, voice test opener, session handover      |
| 9   | `91d6c2cd` | supportsignal/signal-studio | 10      | 42    | 58             | 58           | Utility request ("open in VS Code"), AskUserQuestion          |

---

## Candidate New Predicates

### P-NEW-01: `is_automated_test_execution`

**What it captures**: Sessions where Claude is driving a browser through a scripted test suite (UAT workflows), as opposed to building features or exploring code.

**Evidence**: Session `ee880a6a` has 8 user prompts but 337 tool uses (42:1 ratio), with 127 `browser_click`, 28 `browser_fill_form`, 20 `browser_snapshot`. The opening prompt describes running W01-W08 workflows sequentially. This is fundamentally different from `has_playwright_calls` (which just flags browser usage) -- this is _autonomous test execution_ where Claude acts as a QA automation runner.

**Detection heuristic**: `user_prompt_count < 15` AND `playwright_click > 50` AND first prompt contains "run"/"execute"/"UAT"/"workflow".

### P-NEW-02: `has_feature_archaeology`

**What it captures**: Sessions where the user is trying to recover or rediscover a previously-built feature they've lost track of.

**Evidence**: Session `a080427c` opens with "Did we recently try to add a feature around separating images into groups, like having a boundary between images? I can't see how it works, and I thought we'd done it." The session then uses `git log --oneline -20` and `git show` to find the feature. This is a distinct interaction pattern: the user knows something was built but can't find it, and uses Claude as institutional memory.

**Detection heuristic**: First prompt contains phrases like "did we", "I thought we'd done", "can't see how it works", "where is the", "wasn't there a" + `git log`/`git show` in bash commands.

### P-NEW-03: `is_zombie_session`

**What it captures**: Sessions kept alive far beyond their useful life -- duration vastly exceeds active time, with huge idle gaps suggesting the terminal was left open but the work was long finished.

**Evidence**: Session `1258366a` has 8362 min duration but only 94 active min (1.1% utilization), with 7 idle gaps including one of 5598 min (3.9 days). Session `a080427c` has 7295 min duration, 106 active min (1.5%), with a 6207-min gap (4.3 days). These are sessions that should have been closed days earlier. The current `idle_gaps_over_1h` count captures the symptom but not the diagnosis.

**Detection heuristic**: `active_minutes / duration_minutes < 0.05` AND `max(idle_gap) > 1440` (24 hours).

### P-NEW-04: `has_voice_test_artifact`

**What it captures**: Sessions where the first prompt is a voice dictation test/calibration rather than an actual task.

**Evidence**: Session `bbc86dc1` opens with "check this ? Say the quick brown fox jumped over the lazy... The quick brown fox jumped over the lazy dog!" -- this is clearly a microphone/dictation test, not a real prompt. This is distinct from `has_voice_dictation_artifacts` (P12), which captures transcription errors mid-session. This captures the pattern of _starting_ a session with a voice test before pivoting to real work.

**Detection heuristic**: First prompt matches patterns like "check this", "say the", "test test", "can you hear me" + prompt length < 200 chars + no tool-relevant keywords.

### P-NEW-05: `has_task_orchestration`

**What it captures**: Sessions where Claude uses TaskCreate/TaskUpdate/TaskOutput tools to manage parallel or sequential work items within a single session.

**Evidence**: Session `460a1312` uses TaskCreate (6) and TaskUpdate (12) -- creating work items and tracking their progress. Session `d129cfba` uses Task (7) and TaskOutput (2). This represents a distinct _self-management_ pattern where Claude decomposes work into tracked subtasks rather than just executing sequentially.

**Detection heuristic**: `TaskCreate >= 3` OR (`TaskUpdate >= 5` AND `TaskCreate >= 1`).

---

## Candidate New Observations

### O-NEW-01: `autonomy_ratio`

**What it captures**: The ratio of tool uses to user prompts, indicating how much autonomous work Claude does per human interaction.

**Evidence**:

- `ee880a6a`: 337 tools / 8 prompts = **42.1** (highly autonomous UAT runner)
- `d7ca10ed`: 481 tools / 43 prompts = **11.2** (collaborative but still autonomous)
- `91d6c2cd`: 42 tools / 10 prompts = **4.2** (conversational, low autonomy)

This single number captures something none of the existing classifiers express: _how much Claude was trusted to run unattended_. High ratios correlate with structured tasks (UAT, migrations); low ratios correlate with exploratory/conversational sessions.

**Shape**: `{ ratio: number, bucket: "conversational" | "collaborative" | "autonomous" | "fully_delegated" }`

### O-NEW-02: `cross_project_reads`

**What it captures**: When a session reads files from outside its cwd project, revealing cross-project dependencies and knowledge transfer.

**Evidence**: Session `a080427c` (cwd: `apps/thumbrack`) reads from `brains/brand-dave/presentation-templates/solo/` and `apps/appystack/`. This reveals that ThumbRack's styling depends on the shared brand palette and AppyStack recipe system. None of the existing classifiers capture these cross-project dependency links.

**Shape**: `{ external_reads: [{ path: string, inferred_project: string }], count: number }`

### O-NEW-03: `session_utilization`

**What it captures**: How efficiently session time was used, combining active time, idle gaps, and zombie detection into a single structured observation.

**Evidence**:

- `91d6c2cd`: 58/58 min = **100%** utilization (clean single-sitting session)
- `d129cfba`: 124/156 min = **79%** (good utilization, minor pauses)
- `1258366a`: 94/8362 min = **1.1%** (extreme zombie)
- `a080427c`: 106/7295 min = **1.5%** (extreme zombie)

**Shape**: `{ utilization_pct: number, max_gap_minutes: number, gap_count: number, is_zombie: boolean }`

### O-NEW-04: `prompt_intent_arc`

**What it captures**: How the purpose of the session evolves across its prompts -- does it stay focused or drift?

**Evidence**: Session `1258366a` starts with Ecamm Live research, spans a week with 7 idle gaps and 28 prompts. The question is whether all 28 prompts are about Ecamm or whether the session was reused for unrelated tasks. Session `a080427c` starts with feature archaeology but ends with brand palette integration -- a clear drift from "find the old feature" to "now fix its styling." The current `is_multi_phase` predicate captures phase boundaries but not the _nature_ of the drift.

**Shape**: `{ primary_intent: string, drifts: [{ prompt_index: number, new_intent: string }], coherence: "focused" | "drifting" | "repurposed" }`

---

## Candidate New Classifiers

### C-NEW-01: `interaction_density`

**What it captures**: The temporal pattern of human-Claude interaction.

**Values**:

- `burst` - All prompts clustered in a short active window (e.g., `91d6c2cd`: 10 prompts in 58 min)
- `periodic` - Prompts spread across multiple work sittings with idle gaps (e.g., `a080427c`: 12 prompts across 5 days)
- `sustained` - Continuous interaction over an extended single sitting (e.g., `d129cfba`: 21 prompts in 156 min)
- `front_loaded` - Most prompts early, then Claude runs autonomously (e.g., `ee880a6a`: detailed brief, then 8 prompts while Claude runs 337 tool ops)

### C-NEW-02: `delegation_style`

**What it captures**: How the user hands off work to Claude -- the granularity of instructions.

**Values**:

- `full_brief` - Detailed structured prompt with resources, steps, and constraints (`ee880a6a`: 1946-char opening with workflow runner guide, run log references, specific W01-W08 sequence)
- `open_question` - Conversational, exploratory opener that requires Claude to scope the work (`a080427c`: "Did we recently try to add a feature...")
- `directive` - Short imperative commands (`d7ca10ed`: "Read X and Y, then run Ralphy Mode 2 to plan")
- `systemic_diagnosis` - User describes a problem pattern and asks for root cause analysis (`d129cfba`: "come up with a plan of action around how you think we are screwing up with Oscar, Penny and Alex")

### C-NEW-03: `tool_ecosystem`

**What it captures**: Which _ecosystem_ of tools the session primarily operates in, beyond individual tool names.

**Values**:

- `browser_automation` - Playwright-dominated (`ee880a6a`, `65f77723`)
- `code_construction` - Edit/Write/Bash-dominated (`d7ca10ed`, `bbc86dc1`)
- `research_exploration` - Read/Grep/Glob/Bash-dominated (`1258366a`, `460a1312`)
- `task_management` - TaskCreate/TaskUpdate/Agent-dominated (`460a1312`, `d129cfba`)
- `mixed` - No single ecosystem dominates

This is more informative than `tool_profile` (C05), which just lists individual tool counts. The ecosystem classification captures the _mode of work_.

---

## Surprising Patterns

### 1. The UAT-as-a-Service Pattern

Session `ee880a6a` represents Claude being used as a fully autonomous QA test runner -- 8 prompts dispatching 337 tool operations including 127 browser clicks. The session even creates and deletes a cron job (likely for polling/waiting). This is not "coding with AI assistance" -- this is "delegating an entire QA workflow to an AI agent." The current schema treats Playwright usage as a binary predicate (`has_playwright_calls`), missing the massive qualitative difference between a session that takes 3 screenshots and one that executes 127 click operations autonomously.

### 2. Extreme Zombie Sessions Are Common

Two of the 9 sessions (`1258366a`, `a080427c`) have utilization below 2%, with idle gaps exceeding 4 days. These aren't "long sessions" -- they're sessions that were never properly closed. This pattern matters for AngelEye because zombie sessions distort duration-based metrics and hide the actual work pattern. A session with 94 active minutes should not be recorded as an 8362-minute session.

### 3. Voice-First Sessions Have Distinct Shapes

Sessions `65f77723`, `460a1312`, and `bbc86dc1` all show voice dictation patterns (conversational/rambling openers, self-corrections). These sessions tend to have higher prompt counts relative to tool counts (the user is _talking through_ the problem rather than issuing commands). `bbc86dc1` even starts with a literal voice test. Voice-first sessions may benefit from a separate opener classification beyond just `has_voice_dictation_artifacts`.

### 4. Task Tool Usage Correlates with Systemic Problem-Solving

Sessions `460a1312` (18 Task tool uses) and `d129cfba` (9 Task tool uses) are both sessions where the user is diagnosing systemic issues rather than building features. The Task tools are used to decompose the problem space, not to track implementation steps. This suggests a pattern: Task tool usage + diagnostic/analytical prompts = "systemic debugging" session type, which is distinct from both feature construction and bug fixing.

### 5. Cross-Project Reads Reveal Hidden Dependencies

Session `a080427c` (ThumbRack) reads brand palette files from `brains/brand-dave/` and recipe files from `apps/appystack/`. These cross-project reads are invisible in the current schema -- the session is attributed to ThumbRack based on cwd, but its _knowledge dependencies_ span three projects. Tracking these would let AngelEye build a dependency graph showing which projects share knowledge.

### 6. AskUserQuestion Is Exceptionally Rare

Out of 9 sessions and ~1,649 total tool uses, `AskUserQuestion` appears exactly once (`91d6c2cd`). Claude almost never asks the user for clarification -- it just proceeds. This is worth tracking as a signal: sessions where Claude _does_ ask may indicate higher uncertainty or ambiguity in the task.
