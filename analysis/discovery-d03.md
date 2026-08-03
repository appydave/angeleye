---
type: analysis
title: 'Discovery D03'
description: 'D03: 9 sessions analysed; proposes session_initiation_source, autonomy_ratio, work_mode, and cross_project_reach for AngelEye schema.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch D03

## Sessions Examined

| #   | Session ID | Machine | CWD Project               | Active Min | Events | Key Signal                                                  |
| --- | ---------- | ------- | ------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| 1   | 3f66732c   | m4-pro  | beauty-and-joy            | 680        | 952    | Agent-initiated (Paperclip JJ), 8 compactions               |
| 2   | 4e8c5897   | m4-mini | brains                    | 363        | 366    | Skill-initiated (/refresh-bmad-brain), cross-project writes |
| 3   | 6ba65a37   | m4-mini | supportsignal             | 80         | 274    | Skill-initiated (/bmad-help), 3-project read sweep          |
| 4   | 699cab47   | m4-mini | digital-stage-summit-2026 | 53         | 228    | /ralphy, 8 general-purpose subagents, relay dir             |
| 5   | f88bdf54   | m4-pro  | beauty-and-joy            | 224        | 169    | Handover-driven, Playwright (16 calls), multi-day           |
| 6   | 33ae070f   | m4-pro  | beauty-and-joy            | 104        | 133    | Voice dictation, WebSearch (17), CronCreate+Delete          |
| 7   | fdb89194   | m4-pro  | flihub                    | 171        | 114    | Handover paste, TaskCreate/TaskUpdate, /ralphy              |
| 8   | 1432e6e9   | m4-mini | brains                    | 131        | 94     | Machine-boundary confusion                                  |
| 9   | 6a2cef50   | m4-mini | brains                    | 52         | 58     | Voice dictation, pure exploration (no edits)                |

---

## Candidate New Predicates

### P-NEW-01: `has_handover_paste`

**Description**: The first user prompt contains structured instructions left by a previous session, typically listing numbered tasks, commit hashes, and explicit "next session" directives. This is a deliberate inter-session continuity mechanism where the user (or a prior Claude session) writes a handover document and the user pastes it to bootstrap the next session.

**Detection**: First prompt contains patterns like "Next session", numbered task lists, commit hash references (7+ hex chars), and/or references to specific file paths to update. Length > 200 chars with imperative verbs ("Update", "Write", "Run", "Commit").

**Examples**:

- **fdb89194**: First prompt starts with "Code is clean -- commit 7a8b9e7, build clean, 390 tests passing. Next session -- do these first: 1. Update docs/planning/AGENTS.md..."
- **f88bdf54**: First prompt says "Read .../session-handover-2026-03-19.md to get full context on Joy Juice. Then ask me what Joy has said since yesterday before doing anything."

**Why it matters**: Distinct from `has_cross_session_refs` (which is about referencing other sessions) and from `is_compaction_resume` (which is about context window management). This is an explicit workflow pattern for session continuity.

### P-NEW-02: `has_web_research`

**Description**: Session includes significant use of WebSearch/WebFetch tools, indicating the user is doing market research, competitor analysis, or information gathering rather than pure code construction.

**Detection**: `WebSearch` count >= 5 OR `WebFetch` count >= 3.

**Examples**:

- **33ae070f**: 17 WebSearch calls while working on Joy Juice menu -- likely researching juice bar pricing, competitors, or ingredient sourcing.

**Why it matters**: Research sessions have fundamentally different value characteristics than construction sessions. They produce knowledge artifacts rather than code changes. The current schema has no way to distinguish "Claude as search engine" from "Claude as builder".

### P-NEW-03: `has_task_management`

**Description**: Session uses TaskCreate/TaskUpdate tools, indicating structured work decomposition within the session itself. This is Claude Code's built-in task tracking, distinct from backlog management in markdown files.

**Detection**: `TaskCreate` count >= 1 OR `TaskUpdate` count >= 1.

**Examples**:

- **fdb89194**: 4 TaskCreate + 8 TaskUpdate calls in a flihub session that was executing a handover plan. The task tools were used to track progress through the numbered items.

**Why it matters**: Task tool usage signals a more structured, autonomous execution style. Sessions with task management likely have higher completion rates and more predictable outcomes.

### P-NEW-04: `has_playwright_browsing`

**Description**: Session includes Playwright browser automation calls (navigate, screenshot, click, etc.), indicating visual verification, UI testing, or web scraping workflows.

**Detection**: Any tool name matching `mcp__playwright__*` with count >= 2.

**Examples**:

- **f88bdf54**: 8 `browser_navigate` + 8 `browser_take_screenshot` calls. This is a beauty-and-joy session where Claude was likely reviewing Joy Juice web presence or verifying visual output.

**Why it matters**: Playwright sessions are a distinct interaction mode -- Claude is operating as a visual agent, not just a text-based coder. These sessions may have different quality signals (screenshot verification vs test suite passing). Currently has_playwright_calls exists as P-listed but this batch shows it co-occurs with specific patterns worth tracking.

### P-NEW-05: `has_machine_boundary_confusion`

**Description**: The user explicitly expresses confusion about what machine they're on, what files are accessible, or whether they need to switch to a different machine/session to continue work.

**Detection**: First prompt or early prompts contain phrases like "from this point of view", "do we need to continue this conversation over in cowork", "not on his machine", "can you truly read".

**Examples**:

- **1432e6e9**: "I'm a little confused, as you say. Read the current files to understand the state. We're not on his machine at the moment. How much can you truly read from this point of view, or do we need to continue this conversation over in cowork?"

**Why it matters**: This is a multi-machine workflow friction signal. It reveals moments where the distributed nature of David's setup (m4-mini, m4-pro, possibly more) creates cognitive overhead. Distinct from `is_cwd_incidental` (wrong directory) -- this is about wrong machine entirely.

### P-NEW-06: `has_cron_lifecycle`

**Description**: Session creates and then deletes cron jobs within the same session, indicating ephemeral scheduled tasks used for short-lived monitoring or polling.

**Detection**: `CronCreate` >= 1 AND `CronDelete` >= 1 in the same session.

**Examples**:

- **33ae070f**: 1 CronCreate + 1 CronDelete. Created a temporary cron job (likely to monitor something for the Joy Juice menu work), then cleaned it up.

**Why it matters**: Shows a "use and dispose" pattern for scheduled tasks. Distinct from sessions that create crons and leave them running. The lifecycle pattern suggests the user is using crons as temporary automation, not persistent infrastructure.

---

## Candidate New Observations

### O-NEW-01: `cross_project_reach`

**Description**: Record which projects outside the CWD the session reads from or writes to. This is richer than a boolean -- it captures the direction and breadth of cross-project work.

**Shape**:

```json
{
  "cwd_project": "supportsignal",
  "read_from": ["poem-os", "legacy.supportsignal", "brains/bmad-method"],
  "write_to": ["supportsignal", "claude-memory"],
  "reach_count": 3,
  "direction": "inbound" // "inbound" = reading from elsewhere, "outbound" = writing elsewhere, "bidirectional"
}
```

**Examples**:

- **4e8c5897** (cwd: brains): Reads from brains/bmad-method, upstream/BMAD-METHOD, supportsignal-v2-planning, supportsignal app. Writes to brains/memory, supportsignal planning docs, claude memory. Direction: bidirectional, reach_count: 4+.
- **6ba65a37** (cwd: supportsignal): Reads from poem-os, legacy.supportsignal, supportsignal app. Writes to supportsignal artifacts + claude memory. Direction: inbound (heavy reading), reach_count: 3.

**Why it matters**: Understanding cross-project reach reveals knowledge synthesis sessions (pulling from many sources) vs focused construction sessions (staying in one project). The existing schema only has `project_attribution` (single project) and `cwd_mismatch` (wrong directory), neither of which captures this breadth.

### O-NEW-02: `autonomy_ratio`

**Description**: The ratio of tool calls to user prompts, indicating how much Claude is doing autonomously between user interventions.

**Shape**:

```json
{
  "tool_to_prompt_ratio": 16.6,
  "autonomy_level": "high" // low: <3, medium: 3-8, high: >8
}
```

**Examples**:

- **3f66732c**: 898 tools / 54 prompts = 16.6 ratio (HIGH). Agent-initiated Paperclip session running with minimal human intervention.
- **6a2cef50**: 44 tools / 14 prompts = 3.1 ratio (MEDIUM). Conversational exploration session.
- **1432e6e9**: 65 tools / 29 prompts = 2.2 ratio (LOW). Confused/exploratory session with lots of back-and-forth.

**Why it matters**: Autonomy ratio is a proxy for session efficiency and trust level. High-autonomy sessions (like agent-initiated ones) suggest Claude is operating independently. Low-autonomy sessions suggest more conversational or uncertain interactions. This could predict session satisfaction.

### O-NEW-03: `subagent_profile`

**Description**: Characterize the subagent usage pattern -- types deployed, concurrency, and whether they're exploratory or execution-oriented.

**Shape**:

```json
{
  "agent_types": { "Explore": 5, "abridge": 2, "general-purpose": 0 },
  "max_concurrent": 2,
  "pattern": "parallel_explore" // "parallel_explore", "sequential_execute", "mixed", "none"
}
```

**Examples**:

- **4e8c5897**: 5 Explore subagents, all running solo. Pattern: sequential_explore.
- **6ba65a37**: 5 Explore + 2 abridge, some concurrent (a85f66e5 and a93d7c7f overlap, a96d3bad and a0989d3b overlap). Pattern: parallel_explore with abridge.
- **699cab47**: 8 general-purpose subagents, several concurrent pairs. Pattern: parallel_execute (this is the /ralphy pattern -- dispatching work units in parallel).

**Why it matters**: Subagent patterns reveal different orchestration strategies. The current schema just detects subagent presence but doesn't characterize the pattern. Knowing whether subagents are exploratory (gathering info) vs execution-oriented (doing work) matters for understanding session outcomes.

---

## Candidate New Classifiers

### C-NEW-01: `session_initiation_source`

**Description**: How the session was started -- by user typing, by skill invocation, by agent dispatch, or by handover paste.

**Values**: `user_typed`, `skill_invoked`, `agent_dispatched`, `handover_paste`, `voice_dictated`

**Detection**:

- `skill_invoked`: First prompt starts with `/` (e.g., `/refresh-bmad-brain`, `/bmad-help`, `/ralphy`)
- `agent_dispatched`: First prompt contains agent UUID pattern and "Continue your ... work"
- `handover_paste`: First prompt contains structured multi-step instructions with commit refs
- `voice_dictated`: First prompt has speech patterns (run-on sentences, hedging like "I believe", "at the moment", conversational fillers)
- `user_typed`: default

**Examples**:

- **3f66732c**: `agent_dispatched` -- "You are agent 27231022-d305-4069... Continue your Paperclip work."
- **4e8c5897**: `skill_invoked` -- "/refresh-bmad-brain"
- **6ba65a37**: `skill_invoked` -- "/bmad-help"
- **699cab47**: `skill_invoked` -- "/ralphy"
- **f88bdf54**: `handover_paste` -- "Read .../session-handover-2026-03-19.md..."
- **fdb89194**: `handover_paste` -- "Code is clean -- commit 7a8b9e7..."
- **33ae070f**: `voice_dictated` -- "We're getting ready to work on Joy Juice, or the Joy of Juice..."
- **6a2cef50**: `voice_dictated` -- "Before we do any research, I believe we did some skills recently..."
- **1432e6e9**: `user_typed` -- "I'm a little confused, as you say."

**Why it matters**: This is the most important missing classifier. The initiation source predicts session structure, autonomy level, and likely outcomes. Skill-invoked sessions tend to be focused. Agent-dispatched sessions are autonomous. Handover sessions have explicit task lists. Voice-dictated sessions are exploratory and conversational. The current `opening_style` classifier captures format but not intent/source.

### C-NEW-02: `work_mode`

**Description**: What kind of cognitive work is happening in the session.

**Values**: `building` (writing/editing code), `researching` (reading, searching, web browsing), `planning` (writing docs, backlogs, implementation plans), `maintaining` (updating docs, reconciling state), `exploring` (reading to understand, no clear output goal)

**Detection**: Based on tool profile ratios:

- `building`: Edit+Write > 30% of tools
- `researching`: WebSearch+WebFetch > 10% of tools OR Read+Grep+Glob > 60% with few writes
- `planning`: Write count > Edit count AND written files are .md
- `maintaining`: Edit-heavy on docs (.md files), backlog updates
- `exploring`: Read+Glob dominant, minimal writes/edits

**Examples**:

- **699cab47**: `planning` -- Writing implementation plans, agents docs, assessment docs for wave3
- **6a2cef50**: `exploring` -- Read 17 + Glob 11, Write 4, zero Edit. Pure information gathering.
- **33ae070f**: `researching` -- 17 WebSearch calls mixed with file edits
- **3f66732c**: `building` -- 141 Edit + 30 Write out of 898 tool calls

---

## Surprising Patterns

### 1. Voice dictation sessions have a distinctive fingerprint

Sessions 33ae070f and 6a2cef50 both show clear voice-to-text artifacts: conversational hedging ("I believe", "at the moment"), run-on sentences, and questions phrased as thoughts rather than commands. These sessions also tend to be more exploratory with lower autonomy ratios. The current `has_voice_dictation_artifacts` predicate exists (P12) but may not be detecting all cases -- the signal in the first prompt text is often sufficient.

### 2. Agent-dispatched sessions are dramatically different in shape

Session 3f66732c (Paperclip agent JJ) has 952 events with 898 tool uses but only 54 user prompts -- a 16.6:1 autonomy ratio. It required 8 compactions. This is an entirely different beast from human-driven sessions. The agent-dispatched pattern creates sessions that look like batch jobs, not conversations. The `is_machine_initiated` predicate (P11) may partially capture this, but the agent dispatch pattern (UUID in first prompt, "Continue your X work") is a more specific and reliable signal.

### 3. Multi-day sessions with heavy idle gaps are a distinct usage pattern

Sessions 4e8c5897 (5842 min total, 363 active), 6ba65a37 (1685 min, 80 active), and f88bdf54 (3379 min, 224 active) all span multiple days with massive idle gaps. These aren't abandoned sessions -- the user comes back repeatedly. This "persistent workspace" pattern (keep a session alive across days, returning to it when relevant) is different from "fire and forget" single-use sessions. The idle_gap_details already capture the raw data, but there's no classifier for this usage pattern.

### 4. The relay directory is a cross-machine sync mechanism

Session 699cab47 reads from `/Users/davidcruwys/relay/david-jan/manifest.json` and `manifest.md`. This "relay" directory appears to be a file-based communication channel between machines or between David and another person (Jan?). This is a cross-machine coordination artifact that the current schema doesn't capture. It may warrant tracking as a detection (`has_relay_access`) since it reveals inter-machine or inter-person file exchange.

### 5. Skill-initiated sessions cluster around knowledge management

Three of the skill-initiated sessions (/refresh-bmad-brain, /bmad-help, /ralphy) are all about managing knowledge frameworks or orchestrating work, not direct coding. Skills appear to serve as "workflow launchers" that establish a session's purpose before any human interaction happens. The skill name itself is a strong predictor of session type.

### 6. CronCreate+CronDelete in same session = ephemeral automation

Session 33ae070f creates and deletes a cron in the same session. This is likely a "set a timer to check something, then clean up" pattern. It's a form of in-session task scheduling that's distinct from persistent cron jobs. The current `cron_polling` detection counts creates/deletes separately but doesn't flag the lifecycle pattern.
