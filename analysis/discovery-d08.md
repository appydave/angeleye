---
type: analysis
title: 'Discovery D08'
description: 'D08: 8 sessions; proposes skill-driven workflow, single-artifact output predicates and orchestration_mode, input_style classifiers.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery — Batch D08

**Analysed**: 2026-03-23
**Sessions examined**: 7

| Session ID | CWD / Project               | Prompts | Tools | Active min | Notable                                                 |
| ---------- | --------------------------- | ------- | ----- | ---------- | ------------------------------------------------------- |
| d08d1b10   | flivideo/flihub             | 28      | 376   | 101        | Ralphy + test coverage campaign, 21 subagents           |
| 18665260   | apps/angeleye               | 23      | 245   | 46         | Multi-wave planning, cross-project reads                |
| 7b2157e9   | supportsignal/signal-studio | 16      | 239   | 312        | UAT sweep session, compaction resume                    |
| eca8f96f   | appydave-plugins (m4-pro)   | 39      | 170   | 196        | Playwright MCP debugging, 8 skill invocations           |
| 93fe2159   | brains (m4-pro)             | 45      | 106   | 148        | Playwright research, browser screenshots, 2 compactions |
| 656018b4   | supportsignal/app           | 22      | 76    | 105        | BMAD UX design skill, single-file output                |
| 78f31f8c   | brains                      | 12      | 68    | 27         | Todo/focus skill, cross-project scouting                |
| 06c69d58   | apps/appystack              | 14      | 59    | 99         | Session handover paste, continuation                    |

---

## Candidate New Predicates

### P-NEW-01: `has_skill_driven_workflow`

**Signal**: Session is orchestrated primarily through a skill invocation rather than free-form prompts. The skill drives the structure — the user follows a template/wizard.

**Evidence**:

- **656018b4**: Opens with `/bmad-ux-designer`, then follows a multi-step skill workflow (step-01 through step-13). The user's role is reduced to "next step" confirmations. 22 prompts but only 2 Bash calls — nearly all interaction is reading skill steps and writing to a single output file (`ux-design-specification.md`). The tool profile (Read:33, Edit:22, Glob:15, near-zero Bash) is the fingerprint of a skill-driven document generation session.
- **78f31f8c**: Opens with `/focus todo`, which loads brain files and structures the session around todo triage. The skill sets the agenda.
- **d08d1b10**: Opens with `/ralphy`, which loads an implementation plan and spawns subagents.

**Why existing schema misses it**: `skill_invocations` is captured as raw data but there is no predicate that says "this session's structure was determined by a skill rather than by the user." The distinction matters because skill-driven sessions have predictable phase structures, lower user autonomy, and different failure modes (skill bugs vs. user confusion).

**Proposed shape**: `{ detected: bool, skill_name: string | null, governance_ratio: float }` where `governance_ratio` is the fraction of prompts that are confirmations/next-step vs. substantive direction changes.

### P-NEW-02: `has_cross_project_reads`

**Signal**: Session reads files from projects outside its CWD, without editing them — scouting/reference behaviour.

**Evidence**:

- **18665260**: CWD is `apps/angeleye` but reads files from `clients/supportsignal/prompt.supportsignal.com.au/poc/wui/mock-landing-pages/` (4 HTML files: v7-noir, v4-cockpit, v16-console, v6-synthesis). These are design reference reads — the user was comparing landing page designs from another project to inform AngelEye UI decisions.
- **78f31f8c**: CWD is `brains` but reads `apps/angeleye/docs/planning/` (implementation plans, backlog) and `flivideo/flihub/` (README, CLAUDE.md, package.json). This is a scouting session — the user is surveying project status across the ecosystem.

**Why existing schema misses it**: `is_cwd_incidental` captures CWD mismatch but not the _pattern of deliberate cross-project reference_. The distinction: cwd_incidental means the session is working in the wrong place; cross_project_reads means the session is deliberately pulling context from elsewhere while working in the right place.

**Proposed shape**: `{ detected: bool, external_projects: string[], read_count: int, purpose: "reference" | "scouting" | "import" }`

### P-NEW-03: `has_single_artifact_output`

**Signal**: The entire session produces exactly one output file. All edits and writes converge on a single document.

**Evidence**:

- **656018b4**: 22 prompts, 76 tool uses, but only 1 unique file in both write and edit paths: `ux-design-specification.md`. The session reads 20+ files (skill steps, design docs, PRD) but funnels everything into one artifact. Uses `cat >>` via Bash to append large sections — an unusual pattern that bypasses the Edit tool for bulk content.
- Contrast with **d08d1b10** which writes 30+ files (tests, docs, source code).

**Why it matters**: Single-artifact sessions have a fundamentally different quality model. Success = one document is good. Failure = one document is bad. No partial credit. This affects how we should measure session outcomes.

**Proposed shape**: `{ detected: bool, artifact_path: string | null, input_file_count: int }`

### P-NEW-04: `has_bash_append_pattern`

**Signal**: Session uses `cat >>` or heredoc append via Bash instead of Edit/Write tools for content generation.

**Evidence**:

- **656018b4**: bash_commands_sample shows `cat >> "...ux-design-specification.md" << 'ENDOFSTEP12'` and `cat >> ... << 'ENDOFSTEP13'`. This is a workaround for large content blocks that exceed comfortable Edit tool sizing, or a skill pattern that generates content as shell heredocs.

**Why it matters**: This is an anti-pattern signal — it suggests the content is too large for normal tool flow, or the skill was designed around Bash rather than proper Write tools. It also means file change tracking via Edit/Write counts will undercount the actual output volume.

### P-NEW-05: `has_high_prompt_density`

**Signal**: Unusually high user_prompt_count relative to active_minutes — the user is issuing rapid-fire short prompts rather than letting the agent work autonomously.

**Evidence**:

- **93fe2159**: 45 prompts in 148 active minutes = 1 prompt every 3.3 minutes. This is a conversational/exploratory session where the user is steering tightly.
- **eca8f96f**: 39 prompts in 196 active minutes = 1 prompt every 5 minutes. Still high density.
- Contrast with **d08d1b10**: 28 prompts in 101 active minutes with 21 subagents — the agent runs autonomously for long stretches.

**Why it matters**: High prompt density correlates with exploratory/debugging sessions where the user doesn't trust the agent to run unsupervised, or where the task requires tight human-in-the-loop steering. Low prompt density with many subagents = delegated autonomous work.

**Proposed shape**: `{ detected: bool, prompts_per_active_minute: float }`
Threshold suggestion: > 0.2 prompts/min = high density.

---

## Candidate New Observations

### O-NEW-01: `mcp_tool_diversity`

**What to record**: Which MCP tools (non-standard tools beyond Read/Edit/Bash/Write/Glob/Grep/Agent) are used and in what combination.

**Evidence**:

- **eca8f96f**: Uses `mcp__brave-search__brave_web_search` (8 calls), `mcp__chrome-devtools__list_pages` (2), `mcp__chrome-devtools__take_screenshot` (1), `mcp__chrome-devtools__list_console_messages` (1). This is a research+debugging session using external MCP servers.
- **93fe2159**: Uses `mcp__playwright__browser_navigate` (13), `mcp__playwright__browser_take_screenshot` (9). This is a browser-driven research/inspection session.
- Most other sessions in this batch use zero MCP tools.

**Why it matters**: MCP tool usage is a strong signal for session type classification. Brave search = research. Playwright = UI inspection or testing. Chrome DevTools = debugging. The _combination_ tells us even more: brave_search + chrome_devtools = "debugging a deployed thing by searching for solutions."

**Proposed shape**: `{ mcp_tools_used: string[], mcp_call_count: int, mcp_categories: ["search" | "browser" | "devtools" | ...] }`

### O-NEW-02: `session_resumption_pattern`

**What to record**: How a session spans multiple work periods across idle gaps, and what happens at each resumption.

**Evidence**:

- **656018b4**: 5725-minute duration but only 105 active minutes. One massive idle gap of 5572 minutes (3.8 days!). The session was started on March 18 and resumed on March 22. This is not a "long session" — it is a session that was abandoned and accidentally resumed days later.
- **18665260**: 689-minute duration, 46 active minutes, 2 idle gaps (153 min and 488 min). Three distinct work periods across the day.
- **78f31f8c**: 600-minute duration, 27 active minutes, 3 idle gaps. Four brief touchpoints across 10 hours.

**Why it matters**: The existing `idle_gap_details` captures the raw data but we don't record the _pattern_. A session with 3+ gaps and <30 min active time per period is a "check-in" session. A session with one massive gap is likely an accidental resume. These have different implications for context quality.

**Proposed shape**: `{ work_periods: int, avg_period_minutes: float, max_gap_minutes: float, pattern: "single_block" | "multi_period" | "accidental_resume" | "check_in" }`

### O-NEW-03: `autonomy_ratio`

**What to record**: The ratio of agent-driven work (subagent execution, tool calls between prompts) vs. human-driven steering.

**Evidence**:

- **d08d1b10**: 21 subagents, 376 tool calls, 28 prompts. Agent autonomy is high — average of 13.4 tool calls per prompt. Many subagents run in parallel (7+ started within 1 minute at 14:47).
- **93fe2159**: 0 subagents, 106 tool calls, 45 prompts. Agent autonomy is low — average of 2.4 tool calls per prompt. The human is driving every step.
- **656018b4**: 0 subagents, 76 tool calls, 22 prompts. 3.5 tool calls per prompt — moderate but skill-governed.

**Proposed shape**: `{ tools_per_prompt: float, subagent_count: int, parallel_subagent_peaks: int, autonomy_level: "high" | "moderate" | "low" }`

---

## Candidate New Classifiers

### C-NEW-01: `orchestration_mode`

**What to classify**: How the session's work is organized and who/what drives the structure.

**Values**:

- **skill_driven**: A skill invocation structures the session (656018b4 — bmad-ux-designer, d08d1b10 — ralphy)
- **plan_driven**: An IMPLEMENTATION_PLAN.md or AGENTS.md drives the work (18665260 — wave planning)
- **conversational**: User steers interactively with frequent prompts (93fe2159, eca8f96f)
- **uat_sweep**: Systematic test execution across a suite (7b2157e9)
- **triage**: User reviews status and makes routing decisions (78f31f8c — todo focus, 06c69d58 — handover review)

**Why existing classifiers miss it**: `session_type` captures _what_ was done. `orchestration_mode` captures _how_ the work was governed. A BUILD session can be skill_driven, plan_driven, or conversational — the distinction affects quality, predictability, and failure modes.

### C-NEW-02: `input_style`

**What to classify**: How the user provides context and instructions to the session.

**Values**:

- **skill_invocation**: First prompt is a slash command (656018b4: `/bmad-ux-designer`, d08d1b10: `/ralphy`, 78f31f8c: `/focus todo`)
- **structured_paste**: First prompt is a large structured block (table, handover doc) pasted in (18665260: 1443-char wave plan table, 06c69d58: 5457-char session handover, 7b2157e9: 3922-char UAT suite table)
- **natural_question**: First prompt is a conversational question (eca8f96f: "When we run Playwright MSCP, we are often running into issues...")
- **terse_command**: First prompt is a short command (93fe2159: "git pull")

**Why it matters**: Input style correlates with session success patterns. Structured pastes with tables tend to produce well-scoped sessions. Terse commands often lead to exploratory meandering. Skill invocations produce predictable workflows.

---

## Surprising Patterns

### 1. The "3-day accidental resume" (656018b4)

This session has a 5572-minute (3.8 day) idle gap between its two work periods. The first period (March 18, 03:46-06:19) runs the BMAD UX designer skill through 12+ steps. The second period (March 22, 03:12) is a single brief interaction. The session was almost certainly left open in a terminal and accidentally resumed. The current schema has no way to flag this — `idle_gaps_over_1h` counts it but doesn't distinguish a 2-hour lunch break from a 4-day abandonment.

### 2. Parallel subagent burst patterns (d08d1b10)

Between 14:47:14 and 14:48:13, **eight** subagents were started within 59 seconds. This is a Ralphy campaign fan-out — the orchestrator dispatches test-writing agents in parallel. The subagent timing data reveals work parallelism that the flat tool counts completely hide. A session with 376 tool calls and 21 subagents is not "big" — it is "wide." This distinction (serial depth vs. parallel width) is not captured anywhere.

### 3. MCP tool usage as session type fingerprint (eca8f96f, 93fe2159)

Both M4 Pro sessions use MCP tools heavily, while no M4 Mini session in this batch does. This could be machine-specific (MCP servers configured differently per machine) or workflow-specific (the M4 Pro is used for browser-heavy research). Either way, MCP tool presence/absence is a strong classifier signal that we're currently ignoring in the tool_profile classifier.

### 4. The "scouting" session pattern (78f31f8c)

This session opens with `/focus todo`, reads todo brain files, then scouts across AngelEye and FliVideo projects (reading backlogs, implementation plans, READMEs). It writes only 2 files — one new brain file and one INDEX.md edit. The session's purpose is _surveying the state of the world_, not building anything. This is a distinct session type ("operations.scouting" or "triage.portfolio_review") that the current schema would struggle to classify. The tool profile (Read:34, Bash:22, zero Write) is the fingerprint.

### 5. Bash append as skill output mechanism (656018b4)

The BMAD UX designer skill uses `cat >> file << 'HEREDOC'` to append content sections. This means the Edit/Write tool counts (Edit:22, Write:1) vastly underrepresent the actual output volume. The session's true output is a massive UX design specification built incrementally via Bash heredocs. Any metrics based on Edit/Write counts will miss this.

### 6. Compaction as signal of session longevity strategy (7b2157e9, eca8f96f, 93fe2159)

Three of 7 sessions in this batch have compaction_resume detected. All three are long-running sessions (1065, 196, and 292 minutes). Compaction is not just a "context ran out" signal — it indicates the user's intent to keep pushing the session beyond its natural context window. Sessions that compact and continue have a different quality arc than sessions that stay within one context window.
