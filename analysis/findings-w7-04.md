---
type: analysis
title: 'Findings W7-04'
description: 'Wave 7 analysis (W7-04) of 9 sessions — worktree abandonment failure mode, commit-bookend micro pattern, brain-to-skill pipeline confirmed, 7 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7, Agent W7-04

**Sessions analysed**: 9
**Date**: 2026-03-22
**Agent**: W7-04
**Scale distribution**: 3 micro, 2 light, 2 moderate, 1 heavy, 1 marathon

---

## Session-by-Session Observations

---

### W7-acd93d50 — brains / micro

**Registry**: BUILD (wrong)
**Reclassified**: ORIENTATION / orientation.knowledge_query
**Scale**: micro (1 event, 0 tools)

**Observations**:

1. **Absolute minimum session** — 1 user_prompt event, zero tool calls, session ends without response. The question ("Do we have Dynamous community transcripts?") was never answered. This is the smallest possible session type: a single question fired and abandoned.

2. **New subtype: orientation.knowledge_query** — distinct from artifact_retrieval (which retrieves something) and cold_start (which explores a project). This is a pure availability check: "does this resource exist?" The session neither retrieves nor explores — it asks and stops.

3. **CWD=brains/ + zero tools = always incidental** — this session confirms the rule: if CWD is brains/ and there are zero tool calls, the attribution is incidental. The terminal was just sitting there.

4. **Registry BUILD misclassification** — brains/ CWD + zero tools should be an instant disqualification for BUILD. This is as clear a false positive as possible.

---

### W7-69486e50 — deckhand / micro

**Registry**: BUILD (wrong)
**Reclassified**: OPERATIONS / operations.port_check
**Scale**: micro (5 events, 1 Bash call)

**Observations**:

1. **Port-check micro pattern confirmed** — matches the EADDRINUSE pattern first noted in Wave 6 for signal-studio. This one is for deckhand ports 5030/5031. The pattern is: user has dev server trouble → single lsof Bash call to check ports → result reported. Likely a recurring automation candidate.

2. **Distinctive opening style** — user pasted the entire terminal session including the `claude --dangerously-skip-permissions` launch sequence as context. This "terminal-as-context paste" is a specific variant of context_loading_paste: the user is showing Claude the exact state of their terminal, not just a code snippet or spec.

3. **Session ends unresolved** — Claude's lsof returns nothing on ports 5030/5031 (nothing listening), then asks "Can you clarify what this refers to?" — user never responds. Unresolved closure on a 5-event micro session.

4. **BUILD misclassification** — deckhand CWD + 1 Bash call for port check = never BUILD. The Bash call is diagnostic, not construction.

---

### W7-3e2ce636 — v-appydave / micro

**Registry**: BUILD (wrong)
**Reclassified**: OPERATIONS / operations.git_commit_push
**Scale**: micro (11 events, 0 active minutes)

**Observations**:

1. **Commit-as-session pattern** — "Can you do a commit and push?" is a standalone session. This suggests David opens a new Claude session specifically to commit rather than doing it in the terminal himself. The ToolSearch+Skill discovery pattern confirms the commit skill is being actively found and used.

2. **ToolSearch before Skill** — two ToolSearch calls precede the single Skill call. This is normal skill discovery behaviour: Claude searches for the commit skill before invoking it. Not a gap signal since the skill was found successfully.

3. **Bookend continuation** — commit-only sessions are bookends to prior work sessions. The v-appydave project here is where FliHub workflow files live. This commit likely closes off work done in another session (possibly the marathon session W7-5648cb84 from the same project).

4. **bare_task_ref opening is common for micro ops sessions** — "Can you do a commit and push?" is 7 words. Short imperative commands with no context are characteristic of operational micro sessions.

---

### W7-f1183f53 — appydave-plugins / light

**Registry**: BUILD (wrong)
**Reclassified**: SKILL / skill.creation
**Scale**: light (16 events, 6 active minutes)

**Observations**:

1. **Brain-to-skill knowledge pipeline in action** — user explicitly pastes Ansible brain content ("Here's what the Ansible brain covers...") as context before requesting skill creation. This is the canonical knowledge pipeline: brain file → pasted context → skill creation. The first real-world example of this flow seen across the wave set.

2. **Skill creation session characteristics** — Write 1 (new SKILL.md) + Edit 3 (refining it) + Skill 2 (invoking skill-creator skill) + Bash 3 (validation/install). All file touches target skill files in appydave-plugins, not product code.

3. **Two-prompt structure** — prompt 1 is the full skill brief with Ansible context paste; prompt 2 is just "commit & push". This 2-prompt structure (create + commit) is a minimal but complete skill creation pattern.

4. **Voice dictation confirmed** — "I'm going to need a new skill inside one of my plug-ins to tell me the best one to do it" shows rambling voice style with hedged phrasing.

5. **SKILL type vs BUILD** — this is another confirmation that `appydave-plugins` + edit-to-SKILL.md = SKILL type, not BUILD. The rule from Wave 3 holds: "All edits target SKILL.md or skill files → SKILL, not BUILD."

---

### W7-2e0518ac — flihub / moderate

**Registry**: BUILD (partially correct, nuanced)
**Reclassified**: BUILD / build.iterative_refactor (maintained)
**Scale**: light by events (20 events, 1 active minute) despite "moderate" label in task description

**Observations**:

1. **Pre-prompt edits are the key anomaly** — all 19 tool calls precede the single user_prompt. This is a session where Claude was executing work from prior-session context, then the user returned 196 minutes later with a conceptual question about whether that work was correct. The detection flag `unauthorized_edit_before_prompt: true, count: 11` is accurate.

2. **196-minute idle gap then retrospective question** — the user left while Claude was working, came back much later, and asked "did we blow out of the water our old transcript system when we made the changes?" This is a retrospective review pattern: reviewing work that was done autonomously during an idle period.

3. **Implicit context continuation** — Claude was executing edits from carried-over session context without an explicit instruction in THIS session. This is a context-state bleed: Claude continues work from a prior session's instructions without a new explicit prompt.

4. **SRT transcript design question** — the question is about the wisdom of combining transcript files vs using a standalone SRT file. This is a design-review question on work Claude already did. The session is neither purely BUILD nor purely REVIEW — it sits at the boundary.

---

### W7-abf3549a — template / moderate

**Registry**: BUILD (wrong)
**Reclassified**: OPERATIONS / operations.repo_setup_with_readme
**Scale**: moderate (48 events, 18 active minutes)

**Observations**:

1. **Two-phase repo setup** — Phase 1: git init repair + GitHub repo creation via `gh` CLI (Bash-heavy). Phase 2: README authoring with ASCII art branding from POEM project example. Neither phase builds product features.

2. **Playwright for GitHub visual verification** — not in a product repo, not testing code — Playwright here is used to navigate to GitHub.com, screenshot the POEM project README, and verify the AppyStack README looks correct after push. This extends the "Playwright for visual verification" pattern to documentation/infrastructure contexts.

3. **Cross-project design reference (not session chain)** — user explicitly references https://github.com/poem-os/poem as visual inspiration for ASCII art style. This is design cross-reference, not session chaining. A new relationship type: `design_inspiration_reference` — using one of David's own projects as a visual template for another.

4. **Voice dictation with problem framing** — "I had a bit of a problem. I didn't create a repository for the AppyStack." — clear voice-dictated opening describing a setup failure.

5. **Bash dominance (65%)** — all the git/gh operations make this operational_scripting profile despite the README writing and Playwright calls.

---

### W7-3335c76f — appystack / heavy

**Registry**: BUILD (wrong)
**Reclassified**: KNOWLEDGE / knowledge.recipe_design
**Scale**: moderate (40 events, 33 active minutes)

**Observations**:

1. **Design conversation as session type** — 10 prompts, 33 minutes, all about naming and structuring the AppyStack recipe skill. No product code written. The Agent call reads signal-studio for domain context. Writes and Edits touch recipe JSON and MEMORY.md — documentation artifacts.

2. **Iterative voice-driven naming** — 4 consecutive prompts about domain naming: propose generalization → reject specific name → ask for 3-4 alternatives → select "care-provider-operations". This is David's verbal design process: he doesn't know the answer, he thinks out loud via voice until one option resonates.

3. **Memory write closing ceremony** — "update memory with what we learned about the recipe skill" followed by "push it" is the canonical memory-write close. This session closes cleanly with explicit knowledge capture.

4. **Cross-session paste as design input** — user pastes a prior signal-studio conversation snippet (the "Is this really just a copy of AppyStack?" exchange) as grounding context for the recipe discussion. Using prior session output to inform current design.

5. **New subtype: knowledge.recipe_design** — design discussions about skill/recipe structure with naming iterations and domain modelling. Distinct from knowledge.advisory (reviewing someone else's work) and knowledge.methodology_design (process design).

---

### W7-3bfcf4c7 — signal-studio / heavy

**Registry**: BUILD (correct type, notable subtype)
**Reclassified**: BUILD / build.campaign (with worktree abandonment)
**Scale**: heavy (63 events, 93 active minutes)

**Observations**:

1. **Worktree abandonment — new failure mode** — session opens with formal spec paste, plans v1 scope, creates a worktree (EnterWorktree), runs 11 Task subagents building UI Builder features, then ends with the user requesting to undo the worktree and discard all changes. Significant investment (11 subagents, 15 Edits, 4 Writes) → full abandonment. This is a new failure mode not previously catalogued.

2. **"Read and say yay" as context-check opener** — the opening prompt "read and say 'yay'" followed immediately by a large spec paste is a distinctive pattern: the user is asking Claude to confirm it received the spec before proceeding. This is a handover acknowledgement ritual — a way of verifying context absorption.

3. **EnterWorktree as build isolation signal** — EnterWorktree call is a reliable signal for a planned build campaign: the user consciously isolated work into a worktree before beginning, expecting significant changes. The abandon at the end makes this a cancelled campaign.

4. **Task (11x) orchestration** — 11 Task calls for parallel subagent execution is the highest seen in this wave. The subagent count correlates with campaign ambition.

5. **Post-gap abandonment** — a 158-minute idle gap precedes the abandonment prompts. The user returned after stepping away, reviewed what was built, decided it wasn't right, and discarded it. New pattern: the idle gap as a decision point for abandonment.

6. **New subtype candidate: build.campaign_abandoned** — distinct from build.campaign (which completes) by the worktree reversal at end. The abandonment is significant enough to warrant its own subtype.

---

### W7-5648cb84 — v-appydave / marathon

**Registry**: BUILD (correct, new subtype)
**Reclassified**: BUILD / build.prompt_schema_refinement
**Scale**: marathon (90 events, 2118 minutes, 2 major idle gaps)

**Observations**:

1. **Prompt engineering as BUILD** — 29 Edits + 28 Reads on AI workflow schema files (HBS templates, JSON schemas for prompts). Refining prompt engineering infrastructure (transcript accuracy checker) is BUILD activity — it creates new capabilities in the video workflow system. New subtype: build.prompt_schema_refinement.

2. **Named AI personas ("Penny" and "Alex")** — user asks to "get Penny and Alex loaded into memory right now" — these are named AI agent personas within the v-appydave workflow. When Claude misunderstands and writes a memory file, the user corrects it clearly. This reveals the workflow system has named persona agents embedded in it.

3. **Voice mid-sentence cut-off** — "no, don't remove the original transcript; that was a mistake on my" — transcript cut off mid-sentence. This is the clearest voice artifact seen in this wave: the voice recording ended before the sentence finished, and it was transcribed as-is. Shows how voice dictation can produce incomplete thoughts in prompts.

4. **Large accuracy report paste as format reference** — user pastes a ~400-line accuracy report (from prior workflow run) mid-session to demonstrate desired output format. This is a cross-session output injection used as a format example rather than as task context.

5. **Multi-day session (2118 min, 2 gaps)** — two major idle gaps (763 min overnight + 1189 min next-day) make this a multi-day session despite no compaction. The user works in bursts across 3 calendar days.

6. **CWD=v-appydave is incidental** — actual work targets FliHub workflow infrastructure files. The v-appydave video projects directory is a home terminal for video workflow development, not the project being modified.

7. **Agent (5x) for parallel discrepancy analysis** — "step through every workflow step... check for discrepancies" triggers 5 parallel Agent calls. Multi-agent parallel analysis as a pattern for systematic auditing tasks.

---

## Cross-Wave Findings

### Finding 1: BUILD misclassification rate — 6/9 wrong (67%)

Sessions W7-acd93d50, W7-69486e50, W7-3e2ce636, W7-f1183f53, W7-abf3549a, W7-3335c76f are all registry BUILD but are not BUILD. Only W7-3bfcf4c7, W7-5648cb84, and partially W7-2e0518ac are genuine BUILD sessions. Consistent with Wave 6's 82.5% misclassification rate.

### Finding 2: New subtypes proposed this wave

| Subtype                             | Source Session | Confidence              |
| ----------------------------------- | -------------- | ----------------------- |
| `orientation.knowledge_query`       | W7-acd93d50    | medium                  |
| `operations.port_check`             | W7-69486e50    | high (second instance)  |
| `operations.git_commit_push`        | W7-3e2ce636    | high                    |
| `operations.repo_setup_with_readme` | W7-abf3549a    | medium                  |
| `knowledge.recipe_design`           | W7-3335c76f    | medium                  |
| `build.prompt_schema_refinement`    | W7-5648cb84    | high                    |
| `build.campaign_abandoned`          | W7-3bfcf4c7    | medium (first instance) |

### Finding 3: Voice dictation artifacts in 5/9 sessions

Voice dictation confirmed in W7-f1183f53, W7-abf3549a, W7-3335c76f, W7-5648cb84, and W7-2e0518ac. W7-5648cb84 contains the clearest artifact yet: a sentence cut off mid-word by voice recorder ending. Pattern is pervasive across all session scales.

### Finding 4: Commit-bookend sessions are a recurring micro type

W7-3e2ce636 is the third commit-bookend session seen. The pattern: prior work done in another session → new session opened purely to commit. Claude is used as the git commit executor, not just the code author. May indicate David prefers letting Claude handle the git mechanics.

### Finding 5: Worktree abandonment is a new failure mode

W7-3bfcf4c7 shows a complete build.campaign cycle that ends in worktree reversal. The investment (11 subagents, 15 edits) followed by full abandon suggests: the approach built in the worktree diverged from what David envisioned, but this only became clear after the work was done and he reviewed it after a 2.5-hour gap. Gap-as-decision-point is the trigger.

### Finding 6: Playwright used for GitHub README verification

W7-abf3549a uses Playwright to take screenshots of GitHub pages (not product app pages) for README visual verification. Extends the Playwright-for-visual-QA pattern beyond product UIs into documentation contexts. A third semantic role for Playwright: `documentation_verification` alongside `ui_audit` and `external_research`.

### Finding 7: Brain-to-skill pipeline directly observed

W7-f1183f53 is the first session where the exact brain→skill knowledge pipeline is visible in the JSONL: user reads Ansible brain content, pastes it as context, requests skill creation. Confirms the intended knowledge flow actually works in practice.

---

## Registry vs Analysis Comparison

| Session  | Registry | Analysis        | Correct? |
| -------- | -------- | --------------- | -------- |
| acd93d50 | BUILD    | ORIENTATION     | Wrong    |
| 69486e50 | BUILD    | OPERATIONS      | Wrong    |
| 3e2ce636 | BUILD    | OPERATIONS      | Wrong    |
| f1183f53 | BUILD    | SKILL           | Wrong    |
| 2e0518ac | BUILD    | BUILD (partial) | Partial  |
| abf3549a | BUILD    | OPERATIONS      | Wrong    |
| 3335c76f | BUILD    | KNOWLEDGE       | Wrong    |
| 3bfcf4c7 | BUILD    | BUILD           | Correct  |
| 5648cb84 | BUILD    | BUILD           | Correct  |

BUILD accuracy this wave: **3/9 = 33%** (2 correct, 1 partial). Consistent with Wave 6 findings that heavy sessions are most accurately classified BUILD.
