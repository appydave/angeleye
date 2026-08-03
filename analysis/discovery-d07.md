---
type: analysis
title: 'Discovery D07'
description: 'D07: 9 sessions; proposes handover context, infrastructure verification, knowledge exploration predicates and session_continuity_method classifier.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch D07

## Sessions Examined

| #   | Session ID | CWD                         | Prompts | Tools | Duration (min) | Active (min) | Date       |
| --- | ---------- | --------------------------- | ------- | ----- | -------------- | ------------ | ---------- |
| 1   | 798c3fc6   | supportsignal/signal-studio | 15      | 459   | 1200           | 81           | 2026-03-13 |
| 2   | 232bb5f3   | brains (m4-pro)             | 51      | 292   | 132            | 132          | 2026-03-14 |
| 3   | 3eedefa5   | flivideo                    | 33      | 226   | 3595           | 195          | 2026-02-11 |
| 4   | febc6280   | brains                      | 44      | 170   | 325            | 88           | 2026-02-21 |
| 5   | a4fd902a   | supportsignal/app           | 60      | 33    | 1311           | 223          | 2026-03-22 |
| 6   | 59a8f9ac   | brains                      | 9       | 101   | 430            | 57           | 2026-03-22 |
| 7   | f8a2bdb2   | brains                      | 11      | 88    | 263            | 96           | 2026-02-28 |
| 8   | b3ae2275   | supportsignal/prompt        | 17      | 57    | 148            | 76           | 2026-03-13 |
| 9   | 830bd3ac   | brain-dynamous              | 20      | 31    | 1334           | 74           | 2026-02-27 |

---

## Candidate New Predicates

### P-NEW-01: `has_handover_context` — Session Begins With Structured Handover

**Evidence**: Session 798c3fc6 opens with "This is a handover from another conversation" followed by a structured summary of what was done, what needs cleanup, and next steps (3,306 chars). This is qualitatively different from `has_cross_session_refs` — it's not a casual mention of prior work but a deliberate, formatted context injection designed to bootstrap the new session.

**Why current schema misses it**: `has_cross_session_refs` captures mentions; `opening_style` captures form but not semantic intent. A handover is a specific workflow pattern where the user manually bridges session boundaries. It signals that session chains exist but the tooling doesn't support them automatically, and the user is compensating.

**Detection signal**: First prompt contains phrases like "handover", "from another conversation", "what was just done", or structured sections with prior-session summaries.

---

### P-NEW-02: `has_infrastructure_verification` — Session Devoted to Checking Tools/MCPs Work

**Evidence**: Session a4fd902a opens with "How do we check that all the MCPs are actually working?" and proceeds to use Supabase MCP tools (`list_projects`, `search_docs`, `get_project_url`, `get_publishable_keys`) and ShadCN MCP tools. The session has 60 prompts but only 33 tool calls and 60 stop events — a highly conversational, verification-oriented session. It also sets GitHub secrets via `gh secret set`.

**Why current schema misses it**: `session_type` has no value for "infrastructure verification" or "environment setup". This is neither feature construction nor debugging — it's a meta-activity: verifying the development environment itself is functional.

**Detection signal**: MCP diagnostic tools in tool profile, `gh secret set` commands, opening prompts about "checking" or "verifying" tools, high stop_count relative to tool_use_count.

---

### P-NEW-03: `has_cross_project_audit` — Session Checks State Across Multiple Projects

**Evidence**: Session b3ae2275 (cwd: `prompt.supportsignal.com.au`) opens with "I did a lot of changes yesterday to AWB" and asks about changes to "the YouTube launch optimizer YAML, maybe the schema, definitely the code" — referencing Agent Workflow Builder while sitting in the SupportSignal prompt app. The session uses 7 Agent calls to explore across project boundaries.

**Why current schema misses it**: `project_attribution` captures where work happens, but not when a session deliberately audits the state of a _different_ project. This is a cross-project awareness pattern that the cwd alone can't capture.

---

### P-NEW-04: `has_todo_triage` — Session Opens With Task Prioritization

**Evidence**: Session 232bb5f3 opens with "What's tonight's to-do order? I suggest the OMI RAID, which should be number one, but tell me what we got." This is a planning/triage opening where the user wants the AI to help sequence work. It uses TaskCreate (8), TaskUpdate (15), TaskList (1) — heavy task management tooling. Also 3 Skill invocations and Playwright for browser-based research.

**Why current schema misses it**: `opening_style` captures the form but not the "task triage" intent. `session_type` doesn't have a "planning/triage" value that differs from general conversation. The Task tool usage pattern (many creates + updates) is a strong mechanical signal.

---

### P-NEW-05: `has_knowledge_exploration` — Session Is Primarily About Understanding Existing Knowledge

**Evidence**: Session f8a2bdb2 opens with "what are my brains" (18 chars — one of the shortest first prompts in the batch). It uses the Task tool heavily (21 calls) alongside Read (16) and Edit (18), suggesting it's cataloguing and organizing knowledge. Session 59a8f9ac similarly opens with a massive 24,167-char prompt that's about planning and understanding, launching 4 parallel Explore subagents to survey the landscape.

**Why current schema misses it**: Neither `is_feature_construction` nor the existing session_type values capture "knowledge inventory" or "understanding what I have" sessions. These are meta-cognitive — the user is trying to understand their own knowledge base.

---

## Candidate New Observations

### O-NEW-01: `autonomy_ratio` — Tool Calls Per User Prompt

A simple ratio that reveals how much the AI works independently between user interventions.

| Session  | Ratio (tools/prompts) | Character                                                                      |
| -------- | --------------------- | ------------------------------------------------------------------------------ |
| 798c3fc6 | 30.6                  | Extremely autonomous — AI doing Playwright E2E work with minimal guidance      |
| 232bb5f3 | 5.7                   | Moderate — collaborative with task management                                  |
| 3eedefa5 | 6.8                   | Moderate — multi-day work with some autonomy                                   |
| febc6280 | 3.9                   | Low — conversational troubleshooting                                           |
| a4fd902a | 0.55                  | Very low — user-driven verification, almost every prompt triggers minimal work |
| 59a8f9ac | 11.2                  | High — planning with subagent exploration                                      |
| f8a2bdb2 | 8.0                   | High — knowledge cataloguing                                                   |
| b3ae2275 | 3.4                   | Low-moderate — cross-project audit                                             |
| 830bd3ac | 1.55                  | Very low — setup/configuration, conversational                                 |

The extremes are telling: 798c3fc6 at 30.6x is essentially an autonomous agent running E2E tests; a4fd902a at 0.55x is the user driving every action. This ratio captures session character better than raw tool counts.

---

### O-NEW-02: `idle_gap_pattern` — What Idle Gaps Reveal About Session Usage Mode

Three distinct patterns emerge:

1. **Overnight gaps** (sessions 798c3fc6, 3eedefa5, 830bd3ac): Single massive gap of 400-1200+ minutes, clearly overnight. The session spans calendar days but active work is concentrated in short bursts around the gap edges. These are "leave it open overnight" sessions.

2. **Work-block gaps** (sessions febc6280, 59a8f9ac, f8a2bdb2): 1-2 gaps of 100-260 minutes. The user steps away for a meal or meeting, returns to continue. These are "single workday, interrupted" sessions.

3. **Marathon gaps** (session 3eedefa5): 5 idle gaps totaling 3,400 minutes across 3 calendar days. Active work totals only 195 minutes. This session was kept alive as a persistent context anchor across multiple work sessions — the user returned to it repeatedly rather than starting fresh.

Current schema captures `idle_gaps_over_1h` count but not the _pattern type_. The pattern type correlates with how the user thinks about session boundaries.

---

### O-NEW-03: `context_injection_weight` — How Much Context the User Front-Loads

First prompt lengths in this batch:

| Session  | First Prompt Length | Character                                                          |
| -------- | ------------------- | ------------------------------------------------------------------ |
| 59a8f9ac | 24,167 chars        | Massive context dump — full prior conversation pasted              |
| 3eedefa5 | 20,768 chars        | Huge — includes Claude Code welcome screen + prior session context |
| 798c3fc6 | 3,306 chars         | Structured handover document                                       |
| 830bd3ac | 1,320 chars         | Project structure scaffold                                         |
| febc6280 | 385 chars           | Moderate — problem description with error output                   |
| b3ae2275 | 302 chars           | Brief — describes yesterday's changes                              |
| 232bb5f3 | 106 chars           | Short — task triage question                                       |
| a4fd902a | 55 chars            | Minimal — simple question                                          |
| f8a2bdb2 | 18 chars            | Ultra-short — exploratory                                          |

Sessions 59a8f9ac and 3eedefa5 paste enormous context blobs (20K+ chars) as their first prompt. This is a _manual context transfer_ pattern — the user is compensating for lack of automatic session continuity. This is different from `is_compaction_resume` (which is automatic) and from `has_handover_context` (which is structured). These are raw paste-dumps.

---

## Candidate New Classifiers

### C-NEW-01: `session_continuity_method` — How the Session Connects to Prior Work

Values:

- `fresh_start` — no reference to prior work
- `manual_handover` — structured summary of prior session (798c3fc6)
- `context_paste` — raw dump of prior conversation/output (59a8f9ac, 3eedefa5)
- `compaction_resume` — automatic via Claude Code's compaction mechanism
- `cross_session_reference` — casual mention of prior work (b3ae2275)
- `task_continuation` — picks up from a task list or todo (232bb5f3)

This captures a dimension that `opening_style` doesn't: not _how_ the user opens, but _how they bridge the gap_ from prior work.

---

### C-NEW-02: `mcp_profile` — Which External Tool Ecosystems Are Used

Values based on MCP tool prefixes:

- `playwright_heavy` — Playwright dominates (798c3fc6: 248 Playwright calls)
- `playwright_light` — Some Playwright usage (232bb5f3: 41 calls)
- `supabase` — Supabase MCP tools present (a4fd902a)
- `shadcn` — ShadCN registry tools present (a4fd902a)
- `none` — No MCP tools used

This is finer-grained than `tool_profile` and captures which _external ecosystems_ the session integrates with. The Playwright sessions in particular have radically different character — they're E2E testing sessions where the AI drives a browser.

---

### C-NEW-03: `work_span_type` — How the Session Relates to Calendar Time

Values:

- `single_block` — no idle gaps over 1h, done in one sitting (b3ae2275, 232bb5f3)
- `interrupted_day` — 1-2 gaps within a single calendar day (febc6280, f8a2bdb2, 59a8f9ac)
- `overnight` — spans overnight with one major gap (798c3fc6, 830bd3ac)
- `multi_day_persistent` — spans 2+ calendar days with repeated returns (3eedefa5)

---

## Surprising Patterns

### 1. The "Conversational Infrastructure" Anti-Pattern (a4fd902a)

Session a4fd902a has 60 user prompts but only 33 tool calls — and 60 stop events. The stop_count equaling the prompt_count means the AI stopped after nearly every response, waiting for user direction. Combined with the MCP verification intent, this is essentially a "pair debugging the environment" session where most value comes from conversation, not tool execution. The autonomy ratio of 0.55 (less than one tool call per prompt on average) is the lowest in the batch and suggests a distinct session archetype: **guided verification**.

### 2. Cron Tool as Session Feature Flag (798c3fc6)

Session 798c3fc6 uses CronCreate(1) + CronDelete(1) — creating and then removing a scheduled check within the same session. This suggests the user set up a polling cron (probably for CI/build status), got the result, then cleaned up. The `cron_polling` detection captures this, but the deeper pattern is that cron usage is a proxy for "waiting for external process" — a workflow state that no current predicate captures.

### 3. Task Tool Usage as Session Intent Signal

Sessions that use TaskCreate/TaskUpdate heavily (232bb5f3: 23 task tool calls; 3eedefa5: 16 task calls; f8a2bdb2: 22 Task calls) have a fundamentally different character than sessions without. They're _managing work_, not just _doing work_. The Task tool count could be a lightweight classifier input — sessions with >5 task tool calls are almost always planning/triage sessions.

### 4. Four Parallel Subagents for Reconnaissance (59a8f9ac)

Session 59a8f9ac launches 4 Explore subagents in rapid succession (within 13 seconds of each other) at the very start of the session. All complete within ~90 seconds. This is a "scatter-gather" reconnaissance pattern — fan out to understand the landscape, collect results, then plan. No current predicate captures this parallel-exploration pattern, which is distinct from serial subagent usage.

### 5. The 20K+ Character First Prompt (59a8f9ac, 3eedefa5)

Two sessions start with enormous first prompts (20K+ chars). These are not voice dictation artifacts — they're deliberate context pastes. The user is manually solving the "session doesn't remember" problem by pasting prior conversation output. This is a key UX signal: the user wants persistent memory but doesn't have it, so they build it manually. The `form_filling` detection partially captures this via `first_prompt_length` and `short_prompt_ratio`, but treats it as a negative signal rather than a continuity strategy.

### 6. CWD-Project Mismatch With Infrastructure Intent (a4fd902a)

Session a4fd902a has cwd `supportsignal/app.supportsignal.com.au` but its first prompt is about verifying MCPs — a meta-task that isn't really "about" the SupportSignal app. The session then sets GitHub secrets via CLI. The `cwd_mismatch` detection exists, but this is subtler: the cwd is _technically correct_ (they're configuring that project's CI), but the session's _intent_ is infrastructure, not application development. Intent vs. location is a dimension the schema doesn't fully separate.
