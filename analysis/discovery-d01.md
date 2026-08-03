---
type: analysis
title: 'Discovery D01'
description: 'Discovery series output from March-April 2026 analysis campaign'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Agent D-01 Findings

## Sessions Examined

- **e868366b**: Marathon analysis campaign session (361min, 108 prompts, 77 subagents). Invoked `/ralphy` skill, then ran a massive parallel-agent campaign analyzing session JSONL files across 8+ waves. Heavy use of TaskCreate/TaskUpdate for orchestration. Wrote 158 files (findings + index JSONs).
- **da13f544**: Long-lived SupportSignal session (827min, 45 prompts). Started with a conceptual question about UAT vs E2E. Used CronCreate/CronDelete (7 each) and 5 Skill invocations. 3 compaction resumes. Zero file_paths captured despite 182 Bash calls.
- **26d4475f**: FliHub feature build (45min, 8 prompts, 10 subagents). Invoked `/ralphy`, ran npm builds, git stash/diff. High autonomy (35 tools per prompt). Compact and focused.
- **3701e9b8**: BMAD oversight session for SupportSignal (251min, 43 prompts). Invoked `/bmad-oversight` skill. Read domain model, PRD, UX specs. Explored incident analysis workflow across multiple SupportSignal repos. Low mutation ratio (0.13) -- mostly reading.
- **79cfee06**: AngelEye feature build (953min wall, 60min active, 10 prompts). Invoked `/ralphy`, ran typecheck/lint/test cycles. Single Playwright call. 2 idle gaps over 1 hour.
- **042f3f13**: SupportSignal planning session (1400min wall, 94min active). Heavy Playwright usage (14 MCP tool calls). Pasted directory structure into the prompt. 1 compaction resume. Used `Task` tool (8 calls).
- **802ae066**: Rapid debugging session (6min, 3 prompts). Diagnosed why "Jan is not known" in a conversation. Read across 4 different projects (brains/agentic-os, agent-os/ansible, brains/machine-control, flivideo/flihub). Extremely read-heavy (66 Read, 1 Edit).
- **612e20d9**: Documentation recall session (52min, 11 prompts). Asked "Did we create some documentation recently about...". Task-heavy (6 TaskCreate, 12 TaskUpdate). Zero Bash calls. Zero file_paths in shape data.
- **02437ab7**: Hardware exploration session (93min, 13 prompts). Asked about accessing external hard drive (T7). Bash-dominant (90% of tool calls). Only 4 distinct tool types. CWD was bare home directory.

---

## Candidate New Predicates

### P-NEW-01: `has_parallel_subagent_bursts`

**Description**: Session dispatches multiple subagents simultaneously in burst patterns (3+ agents started within 60 seconds of each other).
**Detection**: Parse subagent start timestamps. Group into bursts where inter-start gap < 60s. Flag if any burst contains 3+ agents.
**Why it matters**: Distinguishes between sequential delegation (agent handles one task at a time) and parallel fan-out patterns (agent splits work across many workers). This is a fundamentally different execution strategy.
**Sessions**: e868366b (12 bursts, up to 9 agents in parallel), 26d4475f (4-agent burst detected).

### P-NEW-02: `has_orchestration_tools`

**Description**: Session uses TaskCreate/TaskUpdate/TaskOutput or CronCreate/CronDelete for workflow management.
**Detection**: Check for presence of TaskCreate, TaskUpdate, TaskOutput, CronCreate, CronDelete, TaskStop in tool counts.
**Why it matters**: Indicates the session is managing work items programmatically rather than just executing linearly. Separates "do the work" sessions from "coordinate the work" sessions.
**Sessions**: e868366b (12 TaskCreate, 24 TaskUpdate), da13f544 (7 CronCreate, 7 CronDelete, 1 TaskStop), 612e20d9 (6 TaskCreate, 12 TaskUpdate), 042f3f13 (8 Task calls).

### P-NEW-03: `has_git_workflow`

**Description**: Session includes git operations (commit, diff, stash, push, status).
**Detection**: Scan bash_commands_sample for `git ` substring. Subcategorize: read-only (diff, status, log) vs mutating (commit, push, stash, reset).
**Why it matters**: Tracks whether sessions produce version-controlled outcomes. A session that commits is fundamentally different from one that just edits files. Also detects git-stash-build-pop patterns (workaround for lint/test).
**Sessions**: 26d4475f (git diff, git stash+build pattern), 79cfee06 (git diff, git stash for test isolation).

### P-NEW-04: `has_quality_gate_cycle`

**Description**: Session runs lint, typecheck, or test commands as validation steps.
**Detection**: Scan bash commands for `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, or equivalent patterns.
**Why it matters**: Indicates the session follows a build-verify loop rather than just write-and-hope. Quality gate sessions have different failure/recovery patterns.
**Sessions**: 79cfee06 (typecheck, lint, test across client workspace), 26d4475f (npm run build).

### P-NEW-05: `is_recall_question`

**Description**: Session opens with the human asking the agent to recall or locate previously created content.
**Detection**: First prompt contains patterns like "did we create", "where is the", "do you remember", "what was that file", "we made something about".
**Why it matters**: These sessions are knowledge retrieval, not construction. They indicate gaps in the user's own indexing/memory and suggest the human treats the agent as a search engine for past work.
**Sessions**: 612e20d9 ("Did we create some documentation recently about analysing a row...").

### P-NEW-06: `is_hardware_or_system_exploration`

**Description**: Session involves exploring the physical machine, file system structure, peripherals, or system configuration rather than a specific project.
**Detection**: CWD is home directory (no project context). First prompt references hardware (drives, monitors, peripherals) or system capabilities. Bash commands are exploratory (ls, df, diskutil, find at root paths).
**Why it matters**: These sessions don't map to any project. They represent the human testing agent capabilities or solving infrastructure problems.
**Sessions**: 02437ab7 (external T7 hard drive exploration).

### P-NEW-07: `has_context_injection`

**Description**: Human pastes structured content (directory trees, code blocks, URLs, file listings) into the prompt rather than having the agent discover it.
**Detection**: First prompt length > 200 chars AND contains indented/structured text (lines starting with spaces/pipes/dashes in tree format, or multi-line code blocks).
**Why it matters**: Changes the information flow dynamic. The human is pre-loading the agent with context rather than asking it to explore. Indicates the human has a clear mental model and is directing precisely.
**Sessions**: 042f3f13 (pasted full directory tree of supportsignal-v2-planning).

### P-NEW-08: `has_mcp_browser_automation`

**Description**: Session uses MCP Playwright tools for browser interaction (navigate, screenshot, evaluate, click).
**Detection**: Any tool name starting with `mcp__playwright__`.
**Why it matters**: Browser automation sessions have unique characteristics -- they interact with running applications, take screenshots for visual verification, and often involve form-filling or UI testing workflows. These are fundamentally different from file-editing sessions.
**Sessions**: 042f3f13 (14 Playwright calls: navigate + screenshot + evaluate), 79cfee06 (1 browser_navigate call).

### P-NEW-09: `has_empty_file_paths`

**Description**: Session has tool activity (Read, Write, Edit, Bash calls) but the shape extractor captured zero file paths.
**Detection**: `file_paths.read == [] AND file_paths.write == [] AND file_paths.edit == [] AND total_tool_count > 0`.
**Why it matters**: Indicates a data collection gap in the shape extractor. These sessions may have had their file interactions happen through Bash commands (e.g., `cat`, `echo >>`), through MCP tools, or through compacted history that lost the details. This is a data quality signal, not a session characteristic.
**Sessions**: da13f544 (182 Bash, 0 file_paths), 042f3f13 (61 Bash, 0 file_paths), 612e20d9 (0 Bash but 33 Edit calls, 0 file_paths), 02437ab7 (43 Bash, 0 file_paths).

---

## Candidate New Observations

### O-NEW-01: `autonomy_ratio`

**What it captures**: Tools per user prompt -- how much work the agent does per human interaction.
**Why it matters**: Ranges from 3.3 (3701e9b8, human-directed reading session) to 36.0 (802ae066, agent autonomously explored 4 projects with just 3 prompts). This single number separates "conversation" sessions from "delegation" sessions. High autonomy + high subagent count = campaign/orchestration. High autonomy + zero subagents = deep autonomous exploration.
**Examples**: e868366b=14.3 (campaign), 26d4475f=35.0 (autonomous build), 802ae066=36.0 (autonomous debug), 3701e9b8=3.3 (collaborative exploration).

### O-NEW-02: `mutation_ratio`

**What it captures**: (Write + Edit) / Read -- how much the session modifies vs consumes.
**Why it matters**: Cleanly separates research/audit sessions (ratio < 0.2) from construction sessions (ratio > 0.8) from balanced sessions. 3701e9b8 had ratio 0.13 (pure research). 612e20d9 had 1.17 (mostly writing). 042f3f13 had 1.07 (planning output). 802ae066 had 0.02 (pure diagnostic reading).
**Examples**: See ratios above. Thresholds: <0.2 = research, 0.2-0.8 = balanced, >0.8 = construction/output.

### O-NEW-03: `active_to_wall_ratio`

**What it captures**: active_minutes / duration_minutes -- what fraction of the session's wall-clock time was actually productive.
**Why it matters**: Reveals "session parking" where a session stays open but unused. 79cfee06 was 60/953 (6% active). 042f3f13 was 94/1400 (7% active). da13f544 was 385/827 (47%). Some sessions are left open across meals, sleep, or context switches. This is invisible to event-count-based metrics.
**Examples**: 79cfee06 (6%), 042f3f13 (7%), da13f544 (47%), 26d4475f (100%), 802ae066 (100%).

### O-NEW-04: `subagent_parallelism_profile`

**What it captures**: The pattern of subagent dispatch -- sequential, burst-parallel, or fan-out. Records burst count, max burst size, and whether bursts are uniform or growing.
**Why it matters**: e868366b shows an escalating pattern: bursts of 4, then 5, then 7, then 9 agents. This indicates iterative scaling of a campaign. Contrast with 26d4475f which has smaller, steady bursts. The parallelism profile tells us about the orchestration strategy.

### O-NEW-05: `tool_diversity_index`

**What it captures**: Number of distinct tool types used and their distribution (Shannon entropy or similar).
**Why it matters**: 02437ab7 used only 4 tool types (Bash-dominated at 90%). 042f3f13 used 9 types including MCP tools. e868366b used 10 types with heavy Agent delegation. Low diversity + Bash dominance = shell exploration. High diversity = multi-modal work. This correlates with but is distinct from session_type.

### O-NEW-06: `knowledge_flow_direction`

**What it captures**: Whether information primarily flows human-to-agent (context injection, teaching), agent-to-human (answers, diagnostics), or agent-to-files (construction, writing).
**Why it matters**: 042f3f13 has strong human-to-agent flow (pasted directory tree, gave planning context). 802ae066 has agent-to-human flow (diagnosed a bug, read 66 files, explained). e868366b has agent-to-files flow (wrote 158 output files). This dimension cross-cuts session_type.
**Detection heuristic**: High prompt length + low writes = human-to-agent. Low prompts + high reads + low writes = agent-to-human. Low prompts + high writes = agent-to-files.

---

## Candidate New Classifiers

### C-NEW-01: `delegation_style`

**Values**: `direct` (human tells agent exactly what to do), `orchestrated` (agent manages subagents/tasks), `autonomous` (agent explores independently), `conversational` (back-and-forth dialogue).
**Detection**: Combine autonomy_ratio, subagent count, and TaskCreate presence. orchestrated = subagents > 5 OR TaskCreate > 0. autonomous = autonomy_ratio > 20 AND subagents < 5. conversational = autonomy_ratio < 5. direct = everything else.
**Sessions**: e868366b=orchestrated, da13f544=orchestrated, 26d4475f=autonomous, 3701e9b8=conversational, 802ae066=autonomous, 612e20d9=orchestrated, 02437ab7=conversational.

### C-NEW-02: `session_liveness`

**Values**: `focused` (active/wall > 80%), `intermittent` (20-80%), `parked` (< 20%).
**Detection**: active_minutes / duration_minutes ratio with thresholds.
**Why it matters**: "Parked" sessions span days but contain an hour of real work. They inflate duration-based metrics and distort session_scale. This is orthogonal to session_scale (which measures event count, not time).
**Sessions**: 26d4475f=focused (100%), 802ae066=focused (100%), e868366b=focused (81%), 3701e9b8=focused (82%), 79cfee06=parked (6%), 042f3f13=parked (7%).

### C-NEW-03: `skill_invocation_pattern`

**Values**: `skill_launcher` (session starts with a skill invocation like /ralphy), `skill_user` (skills invoked mid-session), `skill_free` (no skills used).
**Detection**: Check if first_real_prompt matches a known skill pattern (starts with `/`). Check skill_invocations for mid-session usage.
**Why it matters**: Skill-launched sessions have fundamentally different structure -- the skill provides the system prompt, the implementation plan, and often the orchestration pattern. The human's role shifts from "director" to "supervisor".
**Sessions**: e868366b=skill_launcher (/ralphy), 26d4475f=skill_launcher (/ralphy), 79cfee06=skill_launcher (/ralphy), 3701e9b8=skill_launcher (/bmad-oversight), da13f544=skill_user (5 mid-session).

---

## Surprising Patterns

### 1. Four sessions have completely empty file_paths despite significant tool activity

Sessions da13f544, 042f3f13, 612e20d9, and 02437ab7 all show zero file paths in the shape data despite having 34 Edit calls (612e20d9), 182 Bash calls (da13f544), or 14 Write calls (042f3f13). This suggests either (a) compaction resumes strip file path data, (b) the shape extractor misses paths inside Bash commands, or (c) some tool invocations via MCP or Tasks don't get their paths extracted. Three of these four had compaction_resume detected. This is a systematic data quality issue worth investigating.

### 2. CronCreate/CronDelete as a workflow primitive

Session da13f544 used CronCreate 7 times and CronDelete 7 times -- creating and tearing down scheduled tasks within a single session. This is a polling/monitoring pattern where the agent sets up recurring checks (likely for CI, deployment, or test results) and then cleans them up. No other sessions in the batch use Cron tools. This is a rare but distinctive tool signature that the current schema doesn't distinguish from general Bash automation.

### 3. The "git stash, build, stash pop" workaround

Both 26d4475f and 79cfee06 use `git stash && npm run build; git stash pop` -- stashing uncommitted changes to run a clean build/lint, then restoring. This is a learned workaround pattern where the agent avoids committing but needs to validate. It reveals a tension between "don't commit without permission" and "need clean state to test". This pattern could be a signal for sessions where the agent is navigating permission boundaries.

### 4. Extreme session parking (1400 minutes, 94 active)

Session 042f3f13 spans 23+ hours of wall time with only 94 minutes of actual work. Session 79cfee06 spans 16 hours with 60 minutes of work. These sessions were likely left open overnight or across work sessions. The current `duration_minutes` field is misleading for these -- it suggests marathon sessions when they're actually scattered micro-sessions within a persistent connection.

### 5. Cross-project diagnostic reads

Session 802ae066 touched 4 entirely different project directories in 6 minutes with only 3 prompts. The agent autonomously searched across brains/agentic-os, agent-os/ansible, brains/machine-control, and flivideo/flihub to diagnose a single issue. The current schema tracks `project_attribution` as a single value, but this session genuinely belongs to multiple projects simultaneously. This suggests a need for a `projects_touched` list classifier rather than a single attribution.

### 6. Session 612e20d9 uses TaskCreate/TaskUpdate with zero Bash calls

This is the only session with heavy Task tool usage but zero Bash commands. Combined with the recall-style opening prompt ("Did we create some documentation..."), this suggests the agent was using Tasks to track its own search/discovery process -- a meta-cognitive pattern where the agent manages its own work items rather than executing external commands.

### 7. The `/ralphy` sessions share a distinctive structural fingerprint

Sessions e868366b, 26d4475f, and 79cfee06 all start with `/ralphy` and share: (a) high autonomy ratios (14-35), (b) subagent usage, (c) presence of implementation plans (has_impl_plan=true). The current `ralphy_mode` detection returns false for all of them because it requires `has_ralphy_skill=true`, which none have. The detection appears broken or miscalibrated -- these are clearly ralphy-driven sessions based on their first prompt and structural characteristics.
