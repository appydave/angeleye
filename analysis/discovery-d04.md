---
type: analysis
title: 'Discovery D04'
description: 'D04: 9 sessions; proposes cross-repo edit detection, design exploration, infrastructure audit pattern, and activity_density observation.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch 04 — New Pattern Findings

**Date**: 2026-03-23
**Sessions examined**: 8

| ID (short) | cwd domain           | prompts | tools | duration_min | active_min | key signal                                         |
| ---------- | -------------------- | ------- | ----- | ------------ | ---------- | -------------------------------------------------- |
| 2ed25517   | brains               | 36      | 686   | 508          | 167        | Playwright-heavy research, 9 compactions           |
| 33bbe033   | angeleye             | 25      | 275   | 487          | 48         | 17 subagents, UI design generation                 |
| 76e2b0c7   | prompt.supportsignal | 35      | 231   | 1678         | 280        | AWB field testing across 2 days                    |
| bb44829b   | signal-studio        | 18      | 175   | 2782         | 68         | Cross-repo edits (signal-studio + wave25 worktree) |
| 983d70b0   | brains               | 38      | 129   | 705          | 135        | Ansible/agent-os knowledge work                    |
| b34be0e9   | agent-os/ansible     | 36      | 95    | 936          | 119        | Ansible infrastructure audit                       |
| d3a8db00   | brains               | 8       | 101   | 278          | 39         | Client template creation (Task API)                |
| 45d583fe   | brains (m4-pro)      | 12      | 79    | 204          | 59         | Ansible dry-run + tool version check               |
| c3bae9c6   | deckhand             | 7       | 48    | 14           | 14         | Terminal paste debugging, form_filling             |

---

## Candidate New Predicates

### P-NEW-01: `has_cross_repo_edits`

**What it captures**: Session edits files in a project directory different from cwd.
**Evidence**: `bb44829b` has cwd `/Users/davidcruwys/dev/clients/supportsignal/signal-studio` but edits files extensively in `signal-studio-wave25/` (a separate worktree/checkout). File paths show reads and edits across both repos. This is different from `is_cwd_incidental` — the cwd IS the primary project, but work spans into a sibling repo.
**Why current schema misses it**: `cwd_mismatch` only checks if cwd matches the actual project. It does not detect when a session is intentionally operating across two related repos.

### P-NEW-02: `has_terminal_paste_input`

**What it captures**: User pastes terminal output (error logs, build output, command results) directly into their prompt as context.
**Evidence**: `c3bae9c6` — first prompt is 4,393 characters, mostly pasted terminal output (npm warnings, build errors, port conflicts). The prompt starts "kill deck so we can run it" followed by a wall of pasted console output. The `form_filling` detector fired here, but the underlying pattern is distinct: the user is providing diagnostic context by pasting, not filling in fields.
**Why current schema misses it**: `form_filling` measures prompt length ratios but cannot distinguish "paste terminal output as context" from "short lazy confirmations." The diagnostic paste is actually a high-context, high-quality prompt — the opposite of what form_filling implies.

### P-NEW-03: `has_design_exploration`

**What it captures**: Session generates multiple visual design variants (HTML mockups, CSS themes) for user comparison.
**Evidence**: `33bbe033` wrote 10+ HTML design mockups (`v1-paper/observer.html`, `v2-linen/observer.html`, `v3-continuity/`, `v4-cockpit-light/`, `v5-brief/`) plus an index.html for comparison. Then took screenshots via Playwright for review. This is neither "feature construction" (P01) nor a standard build — it is a design exploration phase.
**Why current schema misses it**: `is_feature_construction` captures code building. Design exploration is a distinct creative workflow where output is visual variants, not functional code.

### P-NEW-04: `is_infrastructure_audit`

**What it captures**: Session investigates system state (installed tools, versions, configs) without building new features.
**Evidence**: `b34be0e9` — "How many computers have I got set up with Ansible, and which is the most full-featured?" `45d583fe` — "Are you able to run the Ansible playbook from the point of view of only dry-running... Also, why am I on such an old version of Claude Code?" Both sessions are primarily read-heavy (Read > Write ratio), asking the AI to audit and report on infrastructure state.
**Why current schema misses it**: Closest existing concept is `session_type: orientation`, but these go deeper — they are systematic audits, not quick check-ins.

### P-NEW-05: `has_multi_day_span`

**What it captures**: Session clock time spans more than 24 hours (resume across days).
**Evidence**: `bb44829b` spans 2782 minutes (46 hours) from 2026-03-16 to 2026-03-18. `76e2b0c7` spans 1678 minutes (28 hours) from 2026-03-09 to 2026-03-10. These are sessions resumed across multiple days, with massive idle gaps (one gap in bb44829b is 2,390 minutes / 40 hours).
**Why current schema misses it**: `idle_gaps_over_1h` counts gaps but does not capture the fundamental shape: this is a session kept alive across days, which is a different usage pattern from a long single-day session.

---

## Candidate New Observations

### O-NEW-01: `activity_density`

**What it captures**: Ratio of active_minutes to duration_minutes, indicating how "bursty" a session is.
**Evidence**: Huge variation in this batch:

- `c3bae9c6`: 14/14 = 1.0 (continuous, focused burst)
- `33bbe033`: 48/487 = 0.10 (extremely sparse — work in tiny bursts)
- `bb44829b`: 68/2782 = 0.024 (near-zero — multi-day with barely any active time)
- `2ed25517`: 167/508 = 0.33 (moderate density)

This is a continuous metric that reveals session usage patterns: continuous focus vs. intermittent check-ins vs. long-lived parking.

### O-NEW-02: `tool_automation_ratio`

**What it captures**: Ratio of tool_use_count to user_prompt_count — how much autonomous work the AI does per human interaction.
**Evidence**:

- `2ed25517`: 686/36 = 19.1 tools per prompt (high autonomy — Playwright automation)
- `d3a8db00`: 101/8 = 12.6 (high autonomy — Task API driven)
- `c3bae9c6`: 48/7 = 6.9 (moderate)
- `b34be0e9`: 95/36 = 2.6 (low — conversational, high user steering)

This distinguishes "AI does heavy lifting" from "human steers every step" sessions. The current schema has no autonomy metric.

### O-NEW-03: `subagent_parallelism_profile`

**What it captures**: How subagents are dispatched — burst (many overlapping) vs sequential.
**Evidence**: `33bbe033` launched 17 subagents. Examining timestamps, 6 were launched within 3 minutes (06:39-06:42) as a parallel burst, then another burst of 5 at 06:52-06:54, then another burst of 5 at 08:59-09:01. This is a "wave dispatch" pattern — bursts of parallel subagents with pauses between waves. Compare to `bb44829b` which launched 7 subagents mostly sequentially.
**Shape**: `{ wave_count: N, max_concurrent: N, avg_wave_size: N }`

---

## Candidate New Classifiers

### C-NEW-01: `primary_interaction_mode`

**Values**: `conversational`, `directive`, `paste_debug`, `autonomous`, `design_review`
**What it captures**: How the human interacts with the AI in this session.
**Evidence**:

- `b34be0e9` / `983d70b0`: `conversational` — 36-38 prompts, asking exploratory questions, high back-and-forth
- `d3a8db00`: `directive` — 8 prompts, long first prompt with clear instructions, AI executes
- `c3bae9c6`: `paste_debug` — terminal output pasted, AI diagnoses and fixes
- `33bbe033`: `design_review` — AI generates designs, user reviews screenshots
- `2ed25517`: `autonomous` — AI navigates web pages autonomously for research

### C-NEW-02: `knowledge_direction`

**Values**: `extraction` (human asks AI to find/synthesize knowledge), `injection` (human provides knowledge for AI to organize/file), `bidirectional`
**What it captures**: Which direction domain knowledge flows.
**Evidence**:

- `b34be0e9`: `extraction` — "How many computers have I got?" — human asks, AI discovers
- `d3a8db00`: `injection` — long prompt describing a client setup for AI to record in Ansible/brain files
- `983d70b0`: `bidirectional` — human asks about Python packaging, AI finds current state, human redirects based on what they know

### C-NEW-03: `session_parking_style`

**Values**: `continuous` (no gaps >1h), `day_session` (gaps during day, no overnight), `overnight` (spans overnight), `multi_day` (spans 2+ calendar days), `abandoned` (last gap is the longest, no clean close)
**What it captures**: How the session was "parked" between active periods.
**Evidence**:

- `c3bae9c6`: `continuous` — 14 min, no gaps
- `2ed25517`: `day_session` — 2 gaps mid-day, all within one date
- `76e2b0c7`: `overnight` — 2 days, gaps include overnight
- `bb44829b`: `multi_day` — 46h span, 40h gap in middle (entire weekend)

---

## Surprising Patterns

### 1. Playwright as Research Tool, Not Testing Tool

`2ed25517` used Playwright 410 times — the dominant tool — but NOT for testing. The prompt is about researching "second brains" and tracing the Dynamus/Cole Medan system history. Playwright was used for web browsing/research (browser_navigate: 146, browser_evaluate: 163). The session also had 5 `brave_web_search` calls. This is "AI browses the web for you" — a fundamentally different Playwright usage pattern from the testing/UAT use in other sessions.

### 2. Sessions that Cross the Worktree Boundary

`bb44829b` has cwd in `signal-studio` but edits files in `signal-studio-wave25`. This suggests worktree-based development where the user is in one checkout but needs to reference/update a sibling worktree. The current project_inference inferred `/Users/davidcruwys` as the project (the lowest common ancestor), which is useless. This is a specific cross-worktree pattern that deserves its own detection.

### 3. Task API Usage Correlates with Client Work Templates

`d3a8db00` and `983d70b0` both use TaskCreate/TaskUpdate. Both are in `brains/` doing infrastructure/template work for the agent-os. The Task API seems to be used when Claude is doing structured multi-step work that the user wants to track — correlates with longer, more autonomous execution. Could be a signal for `has_structured_execution_plan`.

### 4. The "Handover Prompt" Anti-Pattern

`33bbe033` opens with a 535-character prompt that is NOT a request — it is a status report of what was committed in a previous session ("Done. Clean close. What's committed and pushed..."). The user is injecting context from a previous session's conclusion. This is a manual session-chain signal that the existing `has_cross_session_refs` predicate might not catch if it only looks for explicit references to session IDs.

### 5. Active Minutes vs Duration Tells a Story

The ratio varies from 1.0 (c3bae9c6, 14/14) to 0.024 (bb44829b, 68/2782). This single number encodes whether a session is a focused sprint, a casual check-in, or a "parked and returned" marathon. No existing classifier captures this continuous dimension.
