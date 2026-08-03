---
type: analysis
title: 'Discovery D05'
description: 'D05: 9 sessions; proposes context recovery, docs-only, ecosystem inventory predicates and context_injection_method observation.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch D05

## Sessions Examined

| #   | Session ID | CWD                  | Machine | Prompts | Tools | Active Min | Key Signal                                                    |
| --- | ---------- | -------------------- | ------- | ------- | ----- | ---------- | ------------------------------------------------------------- |
| 1   | 99574b7a   | angeleye             | m4-mini | 44      | 414   | 113        | Heavy subagent use (16 agents), multi-phase feature build     |
| 2   | 9fe2fca6   | signal-studio        | m4-mini | 32      | 317   | 150        | Continuation session with pasted context, recipe skill        |
| 3   | 24d71c92   | signal-studio        | m4-mini | 20      | 243   | 272        | UAT plan generation (docs-only), heavy Agent+TaskOutput       |
| 4   | df963b70   | brains               | m4-pro  | 40      | 183   | 163        | Research/exploration ("nvideo nemoclaw"), 4 skill invocations |
| 5   | 93b1c355   | brains               | m4-pro  | 27      | 132   | 160        | Tooling frustration (VSCode agent build), troubleshooting     |
| 6   | 4e3b83f7   | brains               | m4-mini | 23      | 107   | 139        | Lost-context session, huge pasted prompt (72K chars)          |
| 7   | 67dfdd2e   | brains               | m4-mini | 8       | 97    | 20         | Port conflict debugging, cross-project (thumbrack)            |
| 8   | 9d63797d   | brains               | m4-mini | 18      | 70    | 68         | Inventory/discovery of agentic apps across ecosystem          |
| 9   | 78a153a0   | prompt.supportsignal | m4-mini | 14      | 39    | 92         | Cross-project file reference, assessment/rating task          |

---

## Candidate New Predicates

### P-NEW-01: `has_context_recovery_attempt`

**What it captures**: User opens a session (often resumed or compacted) and has lost track of what was happening. They ask "what did we do?", "I don't remember what this conversation was about", or paste previous session output to re-establish context.

**Evidence**:

- **4e3b83f7**: First prompt is literally "I don't remember what this conversation was about" plus a 72K-char paste of prior session output. The `short_prompt_ratio: 0.95` means almost every subsequent prompt is a short directive — the user spent their budget on context injection, then steered.
- **99574b7a**: Opens with "What did we do related to themes? And AppyStack and recipes..." — a multi-topic recall request before doing any new work.

**Why existing schema misses it**: `is_compaction_resume` captures the mechanical fact of compaction but not the behavioral signal of the user needing to re-orient. Some context recovery happens without compaction (e.g., pasting old output).

### P-NEW-02: `has_cross_project_file_reference`

**What it captures**: User references or asks Claude to read a file that lives in a completely different project tree from the CWD.

**Evidence**:

- **78a153a0**: CWD is `prompt.supportsignal.com.au` but the first prompt points to `/Users/davidcruwys/dev/video-projects/v-appydave/.poem-core/docs/architecture/open-questions-for-poem-os.md` — a POEM OS file being evaluated from a SupportSignal context.
- **67dfdd2e**: CWD is `brains` but the error output references `thumbrack` (a different app). The session is debugging port conflicts that span multiple AppyStack projects.

**Why it matters**: This is different from `is_cwd_incidental`. The CWD may be correct for the user's "home base," but the work reaches into other projects. It signals cross-project awareness needs.

### P-NEW-03: `is_docs_only_session`

**What it captures**: Session produces documentation artifacts (plans, UAT specs, analysis docs) without modifying any application code.

**Evidence**:

- **24d71c92**: User explicitly says "We're not writing code, by the way. We're not writing A2E. We're just writing a detailed UAT plan." The tool profile is dominated by Write (42) and Agent (35) + TaskOutput (25), indicating orchestrated document generation. Zero code files modified.

**Why it matters**: Current `session_type` captures "feature_build" vs "bug_fix" etc., but there's no clean way to mark sessions that are purely documentation/planning work. These sessions have very different quality criteria — you can't evaluate them on test pass rates.

### P-NEW-04: `has_ecosystem_inventory_work`

**What it captures**: Session involves auditing, cataloguing, or mapping the user's project/app ecosystem rather than working on any single project.

**Evidence**:

- **9d63797d**: "I believe we've been making a little bit of progress on understanding where all of our different applications are..." — the entire session is about discovering and cataloguing agentic apps across FliVideo, Appaday, AppyDave, and repo lists.

**Why it matters**: This is a meta-activity — working ON the system rather than IN any project. Current `project_attribution` can't cleanly handle this because the work spans all projects.

### P-NEW-05: `has_tooling_frustration`

**What it captures**: User is frustrated with their development tooling (IDE, build system, package manager) rather than with Claude or the code itself.

**Evidence**:

- **93b1c355**: "i've asked the question before on how to turn of the dam build with agent in vscode, it is not a siple plugin, did we document the pain" — frustration with VSCode's agent/build behavior, explicitly noting it's a recurring problem.
- **67dfdd2e**: Port conflict debugging caused by pnpm/npm workspace conflicts across multiple AppyStack projects.

**Why existing schema misses it**: `has_frustration_signals` captures frustration broadly, but doesn't distinguish between frustration-with-Claude vs frustration-with-external-tooling. The latter is actually a knowledge management opportunity (document the fix in a brain).

---

## Candidate New Observations

### O-NEW-01: `context_injection_method`

**What to record**: How the user re-establishes context at session start.

- `paste_prior_output` — large text dump of previous session (4e3b83f7: 72K chars)
- `recall_questions` — asks Claude what happened before (99574b7a: "What did we do related to...")
- `status_summary` — pastes a structured summary of prior work (9fe2fca6: structured "What Changed" list)
- `none` — starts fresh

**Why**: The method reveals workflow maturity. Pasting raw output is primitive; structured summaries are sophisticated. This could inform AngelEye's own session continuity features.

### O-NEW-02: `subagent_parallelism_pattern`

**What to record**: Whether subagents run sequentially or in parallel bursts, and the burst size.

**Evidence**:

- **99574b7a**: Has 16 subagents total. Between 14:43:31 and 14:43:57, five agents were launched within 26 seconds — a parallel fan-out burst. Earlier agents ran sequentially (one at a time). This session shows BOTH patterns.

**Fields**: `max_concurrent_agents`, `parallel_bursts` (count of times 2+ agents overlap), `sequential_runs` (count of single-agent phases).

**Why**: Parallel agent fan-out is a qualitatively different work pattern from sequential delegation. It signals structured decomposition (like Ralphy mode) even when Ralphy isn't formally detected.

### O-NEW-03: `recurring_problem_signal`

**What to record**: Whether the user indicates they've encountered this problem before.

**Evidence**:

- **93b1c355**: "i've asked the question before" and "did we document the pain" — explicitly marks this as a repeat issue.
- **67dfdd2e**: Port conflicts are described as "an ongoing problem. This is just the current one."

**Fields**: `is_recurring: boolean`, `prior_reference_text: string` (the user's own words about having seen this before).

**Why**: Recurring problems that aren't resolved across sessions represent knowledge gaps — exactly the kind of thing a brain file should capture. AngelEye could flag these as "brain candidates."

---

## Candidate New Classifiers

### C-NEW-01: `work_mode`

**Values**: `building`, `investigating`, `documenting`, `inventorying`, `troubleshooting`, `assessing`

This is orthogonal to `session_type`. A "feature_build" session_type could have work_mode=`building` or `documenting` (if writing the spec). An "exploration" session could be `investigating` or `inventorying`.

**Evidence mapping**:

- `building`: 99574b7a (code + tests + services), 9fe2fca6 (CRUD + navigation)
- `documenting`: 24d71c92 (UAT plan only)
- `investigating`: df963b70 (researching nvideo nemoclaw)
- `troubleshooting`: 93b1c355 (VSCode agent build), 67dfdd2e (port conflicts)
- `inventorying`: 9d63797d (cataloguing agentic apps)
- `assessing`: 78a153a0 (rating/evaluating a document)

### C-NEW-02: `context_continuity`

**Values**: `fresh_start`, `compacted_resume`, `pasted_context`, `recall_prompt`, `structured_handoff`

How the session connects to prior work. Different from `session_chain_role` which is about explicit chains — this is about the user's own context management behavior.

**Evidence**:

- `pasted_context`: 4e3b83f7 (72K char paste), 9fe2fca6 (structured summary paste)
- `recall_prompt`: 99574b7a ("What did we do related to...")
- `compacted_resume`: 24d71c92 (3 compaction events)
- `fresh_start`: 67dfdd2e, 78a153a0

---

## Surprising Patterns

### 1. The "Brains as CWD" pattern is a distinct session archetype

Four of nine sessions (df963b70, 93b1c355, 4e3b83f7, 9d63797d) use `/dev/ad/brains` as CWD. These sessions are qualitatively different from project sessions — they're about knowledge management, ecosystem awareness, and tooling research. The `brains` CWD is not incidental; it's a deliberate choice to work in the knowledge layer rather than any specific project. Current schema has no way to flag this as a distinct operating context.

### 2. Massive prompt size variance correlates with session strategy

- 4e3b83f7: 72,279 chars first prompt, short_prompt_ratio 0.95 — "context dump then steer" pattern
- 99574b7a: 37,237 chars first prompt — also a context dump (includes terminal banners)
- 93b1c355: 135 chars first prompt — conversational, iterative
- df963b70: 45 chars — terse question

The bimodal distribution (huge context dumps vs. terse openers) maps to two distinct user strategies: "load Claude with everything, then direct" vs. "explore interactively." This is not captured by `opening_style` which focuses on the type of opening (question, directive, paste) but not the strategic intent.

### 3. Voice dictation artifacts appear in unexpected places

- 93b1c355: "turn of the dam" (turn off the damn), "siple" (simple) — typos consistent with voice dictation
- df963b70: "nvideo nemoclaw" — almost certainly voice-dictated "NVIDIA NeMo Claw" or similar
- 99574b7a: "Is it Chris?" — likely voice artifact for "classifier" or similar technical term

The existing `has_voice_dictation_artifacts` predicate should be catching these, but it's worth noting that voice dictation creates a specific failure mode: the AI must decode intent from phonetic approximations. This could warrant a sub-observation recording the specific misheard terms.

### 4. TaskCreate/TaskUpdate without TaskList suggests "fire and forget" orchestration

Sessions 99574b7a and 9fe2fca6 both have TaskCreate + TaskUpdate but zero or minimal TaskList calls. The agents create tasks and update them but rarely check the overall task state. This suggests the task system is being used as a one-way log rather than a coordination mechanism — a pattern worth tracking as it may indicate the agent is not actually coordinating work across subagents.

### 5. Active-to-duration ratio reveals "parking" behavior

Most sessions in this batch have extreme active-to-duration ratios:

- 67dfdd2e: 20 active minutes out of 627 total (3.2%) — two huge idle gaps
- 9d63797d: 68 out of 729 (9.3%)
- 4e3b83f7: 139 out of 777 (17.9%)

This suggests David frequently "parks" sessions — does a burst of work, leaves for hours (often overnight based on gap timestamps showing 10pm-6am patterns), then returns. The session isn't abandoned; it's paused. This is different from a session that naturally ends. A `parking_count` (number of idle gaps > 1h) and `overnight_span: boolean` could capture this.
