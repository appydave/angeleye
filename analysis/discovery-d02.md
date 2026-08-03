---
type: analysis
title: 'Discovery D02'
description: 'Discovery series output from March-April 2026 analysis campaign'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Agent D-02 Findings

## Sessions Examined

- `7bef7cb3`: Deckhand project, 695 user prompts but only 4 tool uses — anomalous "chatty" session with ASCII art request, 10h duration, mostly conversation
- `3fa5e03b`: BMAD v6 brain update — upstream repo sync, diffing versions, heavy subagent use (12 agents), multi-day resume
- `f1ee6fea`: AppyDave.com website — Digital Stage Summit landing page build with Playwright browser testing, cross-project file reads (AppyStack recipes)
- `120c7392`: Agent-OS ansible inventory + team brain files — web search for Tailscale/tooling, infrastructure config work
- `b95a97be`: Claude Code hooks research — compaction detected, Brave search + Playwright combo, early AngelEye exploration
- `b56e1aef`: Digital Stage Summit presentation prep — structured handover prompt, NotebookLM prompts, image file management
- `521221f0`: System settings troubleshooting + brain writes — macOS configuration, completely non-code session
- `1069ccfa`: M4 Pro machine — meetup/community brain maintenance, web search heavy, personal knowledge management
- `e3f78527`: SupportSignal v2 planning — massive 8,910-char context injection, multi-day with 4 idle gaps, Task tool usage

## Candidate New Predicates

### P-NEW-01: `has_context_injection`

**Description**: User pastes a large structured context block (handover doc, planning state, session summary) as the first or early prompt to bootstrap the session. Distinct from normal prompts — these are pre-written documents pasted in.
**Detection method**: `first_real_prompt.full_length > 500` AND prompt contains structured markers (headings, bullet lists, "Session Context:", "Handover", "Current State", "What Was Done").
**Example sessions**: `b56e1aef` (2,451 chars, structured handover doc), `e3f78527` (8,910 chars, full planning context). Both are clearly pre-composed documents, not conversational prompts.
**Why it matters**: This is a deliberate workflow pattern — the user is manually doing what a session chain or STEERING.md should automate. High-value signal for "sessions that need continuity tooling."

### P-NEW-02: `has_web_research`

**Description**: Session uses web search (Brave) and/or browser automation (Playwright) to gather information from external sources, as opposed to purely local file/code work.
**Detection method**: `tools` contains any `mcp__brave-search__*` or `mcp__playwright__*` keys.
**Example sessions**: `f1ee6fea` (19 browser_navigate + 8 clicks + web search), `120c7392` (13 brave searches), `b95a97be` (8 brave + 5 playwright), `1069ccfa` (8 brave searches).
**Why it matters**: Web research sessions have fundamentally different intent — they're knowledge acquisition, not code production. The current schema has no way to distinguish "build something" from "learn something from the internet."

### P-NEW-03: `is_conversational_session`

**Description**: Session is primarily conversation with minimal tool use — user is talking TO Claude, not directing Claude to DO things.
**Detection method**: `tool_use_count / user_prompt_count < 0.1` OR (`user_prompt_count > 50` AND `tool_use_count < 10`).
**Example sessions**: `7bef7cb3` (695 prompts, 4 tool uses — ratio 0.006). This is an extreme outlier — nearly pure conversation with almost no file/tool interaction.
**Why it matters**: These sessions are invisible to current analysis. No files touched, no tools used, but potentially long and important conversations. The current schema would classify them as "tiny" by tool count, missing their actual substance.

### P-NEW-04: `has_cross_project_reads`

**Description**: Session reads files from multiple distinct project trees, not just the cwd project.
**Detection method**: Count distinct project roots in `file_paths.read`. If > 1 root AND at least one root differs from cwd, flag it.
**Example sessions**: `f1ee6fea` (cwd=brains, reads from appydave.com AND appystack AND brains), `120c7392` (cwd=brains, reads from agent-os AND brains AND .claude/projects), `b56e1aef` (cwd=brains, reads from summits AND appydave-plugins AND Downloads).
**Why it matters**: Cross-project reads reveal sessions that are integrating knowledge across the ecosystem. These are architecturally interesting — they show how projects depend on each other.

### P-NEW-05: `has_image_file_interaction`

**Description**: Session reads, moves, or renames image files (PNG, JPG, etc.).
**Detection method**: Any file in read/write/edit paths or bash commands matching `*.png`, `*.jpg`, `*.jpeg`, `*.svg`; or bash commands containing `mv` with image extensions.
**Example sessions**: `b56e1aef` (reads 5 unnamed PNGs from Downloads, renames them with semantic names, moves to presentation-assets directory).
**Why it matters**: Image handling sessions are a distinct workflow — often presentation prep, brand asset management, or screenshot-based debugging. None of the current predicates capture non-code file manipulation.

### P-NEW-06: `is_multi_day_session`

**Description**: Session spans more than 24 hours wall-clock time (not active time).
**Detection method**: `duration_minutes > 1440`.
**Example sessions**: `e3f78527` (1,878 min / 31h, 4 idle gaps), `3fa5e03b` (1,562 min / 26h, 2 idle gaps).
**Why it matters**: Multi-day sessions indicate the user is treating a single session as a persistent workspace rather than opening new ones. This is a workflow pattern worth tracking — it may correlate with sessions that need `/rename` or would benefit from session chains.

## Candidate New Observations

### O-NEW-01: `autonomy_ratio`

**What it captures**: The ratio of tool_use_count to user_prompt_count — how much work Claude does per human prompt.
**Why it matters**: Low ratio (< 1.0) = conversational/guidance sessions. High ratio (> 5.0) = highly autonomous work. Mid-range (2-4) = collaborative building. This single number captures session dynamics better than raw counts.
**Examples**:

- `7bef7cb3`: 4/695 = 0.006 (pure conversation)
- `3fa5e03b`: 292/25 = 11.7 (highly autonomous — skill + subagents doing most work)
- `f1ee6fea`: 209/31 = 6.7 (autonomous building)
- `e3f78527`: 46/15 = 3.1 (collaborative)

### O-NEW-02: `knowledge_transfer_direction`

**What it captures**: Whether the session is primarily human-to-AI (teaching/context injection), AI-to-human (research/explanation), or bidirectional (collaborative building).
**Why it matters**: Understanding WHO is teaching WHOM reveals session purpose. Context injection sessions (human->AI) need different tooling than research sessions (AI->human).
**Detection heuristic**:

- Human->AI: Large first prompt (>500 chars), high edit/write counts to brain files
- AI->Human: High brave_web_search count, low file writes, many short user prompts (questions)
- Bidirectional: Balanced tool use, interleaved read/write patterns
  **Examples**:
- `b56e1aef`: Human->AI (2,451-char handover doc, then directs work)
- `1069ccfa`: AI->Human (user asks questions, AI searches web and explains)
- `3fa5e03b`: Bidirectional (user directs focus, AI researches and writes)

### O-NEW-03: `file_operation_profile`

**What it captures**: The ratio of creates (Write) vs modifications (Edit) vs reads (Read), giving a fingerprint of whether the session is exploratory, constructive, or maintenance.
**Why it matters**: A session with 90% reads is exploration/learning. One with high Write count is greenfield creation. One with high Edit count is maintenance/refinement. Current schema captures tool counts but not this derived insight.
**Examples**:

- `521221f0`: Write-heavy (19 writes, 20 edits, 28 reads) — brain file creation
- `b56e1aef`: Read-heavy (45 reads, 3 writes, 2 edits) — research/review
- `120c7392`: Balanced (28 reads, 7 writes, 17 edits) — infrastructure config

### O-NEW-04: `idle_pattern`

**What it captures**: Structured description of how idle gaps are distributed — "overnight break", "lunch break", "scattered micro-breaks", "single long abandonment".
**Why it matters**: Idle patterns reveal work habits and session continuity intent. A session with one overnight gap is "picked up next morning." A session with 4 gaps spanning 31 hours is being used as a persistent workspace across days.
**Examples**:

- `e3f78527`: 4 gaps (210m, 513m, 144m, 903m) = "persistent workspace" pattern
- `3fa5e03b`: 2 gaps (1167m, 333m) = "overnight + morning break" pattern
- `b56e1aef`: 1 gap (794m) = "overnight resumption"

## Candidate New Classifiers

### C-NEW-01: `session_purpose`

**Dimension**: What is the session fundamentally trying to accomplish?
**Values**: `code_construction`, `knowledge_management`, `web_research`, `presentation_prep`, `infrastructure_config`, `system_admin`, `planning`, `conversation_only`, `hybrid`
**Why distinct from session_type**: session_type captures structure (single-task, multi-phase). session_purpose captures intent. A "multi-phase" session could be for code_construction OR knowledge_management — those require different analysis.
**Examples**:

- `f1ee6fea`: `code_construction` (building web pages)
- `b56e1aef`: `presentation_prep` (summit slides/data)
- `521221f0`: `system_admin` (macOS settings)
- `e3f78527`: `planning` (SupportSignal v2 architecture)
- `7bef7cb3`: `conversation_only` (ASCII art chat)

### C-NEW-02: `subagent_intensity`

**Dimension**: How much of the session's work is delegated to subagents?
**Values**: `none` (0 subagents), `light` (1-3), `moderate` (4-8), `heavy` (9+)
**Why it matters**: Subagent-heavy sessions indicate the user (or a skill) is using Claude's parallelism capabilities. These sessions have different cost profiles, different failure modes (orphaned agents), and different quality characteristics.
**Examples**:

- `3fa5e03b`: `heavy` (12 subagents — mix of abridge, Explore, general-purpose)
- `f1ee6fea`: `light` (4 subagents)
- `7bef7cb3`, `521221f0`, `1069ccfa`: `none`

### C-NEW-03: `prompt_style`

**Dimension**: How does the user communicate with Claude in this session?
**Values**: `terse_commands` (short directives), `structured_handover` (pre-composed docs), `natural_questions` (conversational), `skill_driven` (slash commands), `mixed`
**Detection**: Analyze first_real_prompt structure + prompt length distribution.
**Examples**:

- `3fa5e03b`: `skill_driven` ("/focus bmad-v6")
- `b56e1aef`: `structured_handover` (2,451-char doc)
- `1069ccfa`: `natural_questions` ("what are the meetup groups I goto each week")
- `7bef7cb3`: `natural_questions` ("say somthing funny about AppyDave")

## Surprising Patterns

### 1. The "Ghost Session" Pattern (`7bef7cb3`)

695 user prompts but only 4 tool uses (CronDelete x2, ToolSearch, CronList). 685 stop events. This session has an enormous event count (1,394) but almost no tangible output. It ran for 10 hours continuously with zero idle gaps. The stop_ratio is 0.49 — nearly half of all events are stop events. This looks like it might be a hook-triggered or automated session that's generating massive traffic with minimal substance. The current schema would completely miss this anomaly.

### 2. The "Wrong CWD, Right Project" Pattern is Pervasive

Sessions `3fa5e03b`, `f1ee6fea`, `120c7392`, `b56e1aef`, `521221f0`, `1069ccfa` all have `cwd=/Users/davidcruwys/dev/ad/brains` but work on completely different projects (BMAD, appydave.com, agent-os, summits, system settings, meetups). The `brains` directory is essentially a "default launch point" — David starts Claude there and then navigates to whatever he needs. The current `is_cwd_incidental` predicate partially captures this, but there should be a classifier for "launch-point sessions" vs "project-rooted sessions."

### 3. Structured Handover Prompts as a Workflow Pattern

Two sessions (`b56e1aef`, `e3f78527`) begin with massive pre-composed context documents. These are NOT voice dictation artifacts — they're carefully structured with headings, bullet points, and explicit state descriptions. This is the user manually serializing session state into a prompt because the tooling doesn't do it automatically. This is exactly the problem session chains and STEERING.md are meant to solve.

### 4. The "Task" Tool Appears (`e3f78527`)

This session uses the `Task` tool (3 times) — a tool not seen in most sessions. This is a Claude Code built-in for tracking work items within a session. Its appearance correlates with the planning-heavy nature of this session. Worth tracking which sessions use Task vs which don't — it may indicate sessions where the user expects multi-step work that needs coordination.

### 5. Subagent Type Distribution Reveals Session Character

`3fa5e03b` uses a mix of `abridge` (3), `Explore` (4), and `general-purpose` (5) subagents. The abridge agents cluster at session start (compacting/summarizing), Explore agents appear during research phases, and general-purpose agents handle the actual work. The sequence of subagent types could serve as a fingerprint for session phases — abridge = context loading, Explore = discovery, general-purpose = execution.

### 6. Downloads Folder as a Data Staging Area

Session `b56e1aef` reads 5 PNG files from `~/Downloads/` with generic names (`unnamed.png`, `unnamed (1).png`...) then renames them with semantic names and moves them to a project folder. This "Downloads as inbox" pattern likely appears in many sessions but is invisible to current analysis. Files in Downloads are transient — they represent external inputs (screenshots, exported slides, downloaded assets) entering the Claude workflow.
