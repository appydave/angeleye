# Analysis Lenses — Session Classification Prompts

Catalog of classifiers, predicates, and observations discovered from 68 sessions across waves 1-4. These are the structured interpretation prompts that future analysis agents should run against every session.

**Pattern source**: SupportSignal new-incident workflow (`prompt.supportsignal.com.au/poem/workflows/new-incident/`). Predicates are cheap binary gates. Classifiers return a category from a defined enum. Observations are deeper prose analysis, gated by predicates to save cost.

**Model allocation**: Predicates and classifiers use `modelType: "quick"` (haiku). Observations use `modelType: "analysis"` (sonnet).

---

## Classifiers

Classifiers return a structured value from a defined enum, plus confidence and reasoning.

Output format:

```json
{
  "value": "category_from_enum",
  "confidence": "high | medium | low",
  "reasoning": "One sentence explaining the classification"
}
```

### C01 — session_type

**Question**: What is the primary type of work done in this session?

**Enum values**: BUILD, TEST, RESEARCH, KNOWLEDGE, OPERATIONS, ORIENTATION, SKILL, PLANNING, BRAND, DEBUG, SYSOPS, META, REVIEW, SETUP, MIXED

**Classification rules** (discovered from 68 sessions):

1. Product repo (signal-studio, flihub, angeleye, flideck, appystack) + Edit/Write heavy → BUILD
2. brains/ CWD + zero brain file writes → NOT KNOWLEDGE (check for BRAND, RESEARCH, personal_advisory)
3. brains/ CWD + brain file writes → KNOWLEDGE
4. Home directory (`/Users/<user>`) as project_dir → SYSOPS or AMBIENT, never BUILD
5. Monorepo root (`/dev/ad`) → unlikely BUILD unless Edit/Write evidence
6. Zero tool calls → never BUILD
7. `/ralphy` + Agent/Task calls + IMPLEMENTATION_PLAN.md → build.campaign
8. Playwright-heavy (>20% of tool calls) in product repo → TEST or UI_REVIEW depending on intent
9. Playwright in brains session → external_research (personal advisory)
10. `/loop` runaway (>90% stop events, identical prompts) → META/junk
11. Pre-compaction memory flush as first event → meta.compaction_flush
12. Single Write + Bash execution → SYSOPS (script-generate-and-run)
13. Ansible project dir → OPERATIONS, never BUILD
14. All edits target SKILL.md or skill files → SKILL, not BUILD

**Evidence**: 68 sessions. BUILD registry accuracy: 88% for product repos, 0% for brains, 0% for home-dir, 20% for skill-invocation sessions.

---

### C02 — session_subtype

**Question**: What specific subtype best describes this session?

**Enum values**: 52 candidates — see `subtype-candidates.md` for full list with counts.

**Top subtypes by evidence strength**:
| Subtype | Count | Key signal |
|---------|:-----:|-----------|
| build.campaign | 7 | /ralphy + Agent/Task + IMPLEMENTATION_PLAN.md |
| orientation.artifact_retrieval | 6 | Short, read-only, retrieving prior context |
| orientation.cold_start | 3 | First-time project exploration |
| orientation.bookend | 2 | 2-3 prompt cross-session verification |
| orientation.requirements | 2 | Gathering requirements, not building |
| build.migration | 2 | Structured migration with verification |
| build.iterative_design | 2 | Voice-driven UX feedback + design iteration |
| knowledge.advisory | 2 | User pastes other sessions' output for review |
| knowledge.brain_update | 2 | Editing existing brain files with new info |

---

### C03 — opening_style

**Question**: How does the user open this session?

**Enum values**:

- `voice_dictation` — Speech-to-text transcribed prompt, conversational phrasing
- `paste_handover` — Pasted output from another session or system as briefing
- `skill_invocation` — Session opens with a /skill command
- `keyword_orientation` — Single word or short phrase to set context (e.g., "agentic-os")
- `bare_task_ref` — Bare task number or reference (e.g., "11.0")
- `conceptual_question` — Asks a conceptual/clarifying question before work
- `context_loading_paste` — Large paste (transcript, README) as "absorb this" context
- `form_field_paste` — External form content pasted sequentially

**Evidence**: W4-01–W4-08 (ORIENTATION), W4-09 (form_field_paste), W4-17 (context_loading_paste), W1-02 (skill_invocation), wave 1 learnings (voice universal).

---

### C04 — closing_style

**Question**: How does the session end?

**Enum values**:

- `memory_write` — Explicit context/memory capture before ending
- `context_capture` — /capture-context or equivalent
- `commit_and_push` — Clean git commit as final action
- `abrupt_abandon` — Session stops mid-work, no ceremony
- `unresolved_cleanup` — Session ends with outstanding issues unaddressed
- `compaction_flush` — System-generated pre-compaction memory dump
- `bookend_close` — Short verification then done
- `commit_then_gap` — Commit, then long idle gap before session marked ended

**Evidence**: Wave 1 (three variants observed), W4-15 (unresolved_cleanup), W3-16 (compaction_flush), W4-12 (commit_then_gap with 13h gap).

---

### C05 — tool_profile

**Question**: What does the tool distribution suggest about the session's nature?

**Enum values**:

- `build_focused` — Edit > 30% of tool calls, Write present, code files targeted
- `debug_loop` — Bash > 50%, test runner invocations, git restore cycles
- `read_only` — Read/Glob/Grep dominant, zero Write/Edit
- `synthesis` — Read heavy + Write (1-5) + Bash(open), creating deliverables from existing content
- `ui_audit` — Playwright MCP > 20%, screenshot-navigate-click loops
- `operational_scripting` — Bash dominant + single Write (script generation), no Edit
- `conversational` — Zero or near-zero tool calls, pure chat exchange
- `search_heavy` — Grep/Glob/brave_web_search dominant, discovery/lookup
- `agent_orchestration` — Agent/Task/CronCreate dominant, delegating to subagents

**Derivation notes**: This classifier CAN be partially derived from the raw `tools` object, but the interpretation requires context. A session with Bash: 80 could be debug_loop OR operational_scripting — the distinction requires looking at what the Bash calls do (test runner vs script execution).

**Evidence**: W4-15 (debug_loop: 182 Bash), W4-14 (build_focused: 106 Edit), W4-11 (synthesis: 17 Read + 4 Write + 8 Bash-open), W4-17 (conversational: 0 tools), W4-18 (operational_scripting: 24 Bash + 1 Write).

---

### C06 — project_attribution

**Question**: Is the CWD a reliable indicator of what project this session works on?

**Enum values**:

- `reliable` — File touches match CWD project
- `unreliable` — File touches diverge from CWD (actual work is on a different project)
- `incidental` — CWD is just where the terminal happened to be (brains, home dir)

**Evidence**: 4+ confirmed false attributions from CWD (W3-05, W3-07, W3-16, W4-13). brains/ is frequently incidental. Home dir is always incidental.

---

### C07 — session_scale

**Question**: How complex is this session based on raw metrics?

**Enum values**:

- `micro` — < 10 events, < 5 min active (e.g., W4-19: 6 events, Loom lookup)
- `light` — 10-50 events, < 30 min active (e.g., W4-13: 21 events, monitor question)
- `moderate` — 50-200 events, < 2h active (e.g., W4-09: 48 events, speaker form)
- `heavy` — 200-500 events, 2-8h active (e.g., W4-14: 349 events, product dev)
- `marathon` — 500+ events OR 3+ context compactions (e.g., W2-07: 466+ events, 9 compactions)

**Derivation notes**: Fully derivable from `shape.event_count` and `shape.context_compactions`. Included as a classifier because the thresholds are judgment calls informed by 68 sessions, not mathematical formulas.

---

## Predicates

Predicates return a binary true/false plus a one-sentence justification. They are cheap to compute and gate more expensive observations.

Output format:

```json
{
  "result": true,
  "justification": "One sentence referencing specific evidence"
}
```

### P01 — is_feature_construction

**Question**: Does this session create new feature code — new routes, components, data models, or product capabilities?

**Why it matters**: Gates BUILD classification. The single most common misclassification is calling something BUILD when no features were built.

**Evidence**:

- W4-15: 182 Bash calls but zero new routes/components → false → reclassified from BUILD to DEBUG
- W4-17: Zero tool calls, pasted README → false → reclassified from BUILD to RESEARCH
- W4-18: 24 Bash + 1 Write (removal script) → false → reclassified from BUILD to SYSOPS
- W4-14: 106 Edit + 28 Write on product code → true → BUILD confirmed

---

### P02 — has_frustration_signals

**Question**: Does the user express explicit frustration, profanity, or repeated unmet requests in this session?

**Why it matters**: Gates frustration analysis observation. Frustration density correlates with long sessions, context compactions, and data state bleed.

**Evidence**:

- W4-15: 6 frustration events across 45 prompts ("This is shit", "I asked this three times")
- W3-19: Design constraints lost across compaction → explicit frustration
- W3-20: Unauthorized edit → "I just wanted you to read that stuff"
- W2-20: Same question 3x from voice duplication

---

### P03 — is_multi_phase

**Question**: Does this session contain two or more distinct phases where the type of work changes significantly?

**Why it matters**: Gates phase breakdown observation. Single-label classification loses information on multi-phase sessions.

**Evidence**:

- W4-16: 3 phases (BUILD → UI_REVIEW → DESIGN_EXPLORATION)
- W1-04: ORIENTATION → RESEARCH pivot after 93-min gap
- W4-18: SYSOPS (repo sync) → hardware Q&A after 12.6h gap
- W2-06: knowledge.brain_update → advisory pivot across 4-day session

---

### P04 — has_brain_file_writes

**Question**: Were any brain files (`~/dev/ad/brains/`) created or durably edited during this session?

**Why it matters**: Gates KNOWLEDGE classification for brains-directory sessions. Read-only brain access for background context is not knowledge work.

**Evidence**:

- W4-09: Read 12 brain files, edited 1 (identity preference only) → false for knowledge work
- W4-13: Read brain files, found nothing, pivoted to Playwright → false
- W4-10: Edited ansible brain to document drift → true
- W4-11: Wrote 4 new files (NotebookLM datasets) → true (synthesis)

---

### P05 — has_playwright_calls

**Question**: Does this session contain any Playwright MCP tool calls (navigate, screenshot, click, snapshot)?

**Why it matters**: Playwright semantics depend entirely on context. Gates sub-classification:

- In product repo → UI_REVIEW or TEST
- In brains session → external_research
- With workflow narratives → test.uat_narrative

**Evidence**:

- W4-16: 101 Playwright events (25.6%) → UI_REVIEW
- W4-13: 1 mcp**playwright**browser_navigate → external research (Lazada scam check)
- W3-01–03: Playwright-heavy → TEST (UAT subtypes)
- W3-04: Playwright → skill.creation (web scraping, not testing)

---

### P06 — has_cross_session_refs

**Question**: Does the user paste output, summaries, or context from another Claude session into this one?

**Why it matters**: Gates session chain observation. Cross-session references reveal how David chains work across conversations.

**Evidence**:

- W4-03: Prior session output pasted as briefing (bookend verification)
- W1-03: Pastes from other sessions for advisory review
- W3-08: 100KB deckhand transcript pasted as analogy (cross-paste injection)
- W3-18: POEM Alex agent output pasted into debug session

---

### P07 — has_skill_gap_signal

**Question**: Are there 3+ ToolSearch calls early in the session that fail to find the expected skill?

**Why it matters**: Gates skill gap observation. Indicates a recurring workflow that hasn't been codified into a skill yet — actionable product insight.

**Evidence**:

- W4-11: 3 ToolSearch for missing "Gather" skill, user confirms "I thought we had this"

---

### P08 — has_unauthorized_edits

**Question**: Did Claude make Edit calls before the user gave an explicit instruction to modify code?

**Why it matters**: Detectable anti-pattern. Claude misreads restored context as an implicit action queue.

**Evidence**:

- W3-20: 7 edits before being asked. David: "I just wanted you to read that stuff."

---

### P09 — is_compaction_resume

**Question**: Does this session contain a compaction summary injected as a user_prompt?

**Why it matters**: Compaction summaries are not real user intent — they are context reconstruction. Should be tagged separately from genuine prompts.

**Detection**: Prompt contains "This session is being continued from a previous conversation" prefix.

**Evidence**:

- W4-16: Line 316, ~700 lines of compaction summary
- W4-15: 3 context window continuations with handover summaries
- W2-07: 9 context compactions in one session

---

### P10 — is_cwd_incidental

**Question**: Is the session's working directory incidental — meaning the terminal happened to be there, but the actual work targets a different project or no project?

**Why it matters**: CWD-based project attribution is wrong in 5+ confirmed cases. When CWD is incidental, the classifier should not use project_dir for type inference.

**Detection**: Session runs from brains/, home dir, or monorepo root, but file touches (Edit/Write paths) target a different directory — or there are no file touches at all.

**Evidence**:

- W3-05: CWD=brains, actually Philippines hardware shopping
- W3-07: CWD=signal-studio, actually Copilot removal + Ecamm camera
- W4-13: CWD=brains, actually personal monitor purchase via Lazada
- W4-17: CWD=ad root, actually reading pasted README (no file touches)

---

## Observations

Observations produce prose analysis. They are gated by predicates — only run when the predicate returns true. Use `modelType: "analysis"` (sonnet).

Output format: prose string (2-4 sentences).

### O01 — frustration_analysis

**Gated by**: P02 (has_frustration_signals)

**Question**: What caused the user's frustration? Describe the root cause, how it manifested, and what the session could have done differently.

**Evidence pattern**: Frustration correlates with data state bleed (W4-15), lost design constraints across compaction (W3-19), unauthorized edits (W3-20), and repeated unmet cleanup requests (W4-15 prompts 42-45).

---

### O02 — phase_breakdown

**Gated by**: P03 (is_multi_phase)

**Question**: Describe each distinct phase of this session — its type, approximate duration, dominant tools, and what triggered the transition.

**Output structure** (within prose):

- Phase name and type
- Duration and tool profile
- Transition trigger (gap, explicit pivot, compaction resume)

---

### O03 — session_chain

**Gated by**: P06 (has_cross_session_refs)

**Question**: What other sessions does this one reference? Describe the relationship — is this a continuation, a review, a verification, or a context injection?

**Relationship types observed**:

- Continuation (picking up where another left off)
- Advisory review (reviewing another session's output)
- Bookend verification (short check that prior session's work landed)
- Cross-paste injection (unrelated content pasted as analogy — noise, not a real chain)

---

### O04 — cwd_mismatch

**Gated by**: P10 (is_cwd_incidental)

**Question**: What does CWD claim the project is, and what project does the session actually work on? How can the classifier detect this mismatch?

---

### O05 — skill_gap

**Gated by**: P07 (has_skill_gap_signal)

**Question**: What skill was the user expecting? What workflow did they work around instead? Is this a candidate for a new skill?

---

## How Lenses Connect to the Schema

The v2 session index schema stores the outputs of these lenses:

```json
{
  "classifiers": {
    "session_type": { "value": "...", "confidence": "...", "reasoning": "..." },
    "session_subtype": { "value": "...", "confidence": "...", "reasoning": "..." },
    "opening_style": { "value": "...", "confidence": "...", "reasoning": "..." },
    "closing_style": { "value": "...", "confidence": "...", "reasoning": "..." },
    "tool_profile": { "value": "...", "confidence": "...", "reasoning": "..." },
    "project_attribution": { "value": "...", "confidence": "...", "reasoning": "..." },
    "session_scale": { "value": "...", "confidence": "...", "reasoning": "..." }
  },

  "predicates": {
    "is_feature_construction": { "result": false, "justification": "..." },
    "has_frustration_signals": { "result": true, "justification": "..." },
    "is_multi_phase": { "result": false, "justification": "..." },
    "has_brain_file_writes": { "result": false, "justification": "..." },
    "has_playwright_calls": { "result": false, "justification": "..." },
    "has_cross_session_refs": { "result": false, "justification": "..." },
    "has_skill_gap_signal": { "result": false, "justification": "..." },
    "has_unauthorized_edits": { "result": false, "justification": "..." },
    "is_compaction_resume": { "result": false, "justification": "..." },
    "is_cwd_incidental": { "result": false, "justification": "..." }
  },

  "observations": {
    "frustration_analysis": "prose or null",
    "phase_breakdown": "prose or null",
    "session_chain": "prose or null",
    "cwd_mismatch": "prose or null",
    "skill_gap": "prose or null"
  }
}
```

### C08 — session_chain_role

**Question**: What role does this session play in a multi-session workflow?

**Enum values**:

- `standalone` — No detectable relationship to other sessions
- `initiator` — Starts a workflow that continues in later sessions (e.g., design work that feeds into a test run)
- `continuation` — Picks up work from a prior session (compaction resume, or explicit "continuing from...")
- `verification` — Short check that prior session's work landed correctly
- `post_mortem` — Analyses what happened in prior sessions (reviews output, diagnoses failures)

**Evidence**:

- W5-B10 → W5-B08 → W5-B07 → W5-B09: design (initiator) → test (continuation) → retest (continuation) → post-mortem
- W4-03: bookend verification of prior session output
- W1-03: advisory review of other sessions' output (post_mortem variant)
- W3-08: cross-paste from deckhand session (continuation with injected context)

**Why it matters**: Single-session classification misses the bigger picture. A 3-minute verification session looks trivial on its own but is critical as part of a 4-session design-test cycle. Session chains reveal how David actually structures work across conversations.

---

### P11 — is_machine_initiated

**Question**: Was this session started by automation (cron, heartbeat, scheduled task) rather than a human?

**Why it matters**: Machine-initiated sessions should be excluded from human workflow analysis. They have different shapes (structured prompts, no voice artifacts, predictable tool patterns) and serve different purposes (monitoring, polling, scheduled checks).

**Detection**: Check for:

- "HEARTBEAT check" or structured system prompt in first user_prompt
- CWD in brain-dynamous or similar automation directories
- Prompt length > 5000 chars with structured sections (Gmail, Calendar, Asana, Slack)
- No voice dictation artifacts in prompt text

**Evidence**:

- W5-C09 (1d35b92b): Dynamous HEARTBEAT — 10K char prompt with Gmail/Calendar/Asana/Slack context. Machine-generated, not human. Source system: Project Theodore / Dynamous personal AI OS, running from brain-dynamous directory.

**Source system for known machine-initiated sessions**: Dynamous (Project Theodore) — David's personal AI assistant OS that uses Claude Code as a scheduled executor. Brain location: `~/dev/ad/brain-dynamous/`. The heartbeat fires periodic checks that aggregate email, calendar, task manager, and chat data into a single structured prompt.

---

### P12 — has_voice_dictation_artifacts

**Question**: Does the first prompt contain misspellings consistent with speech-to-text transcription errors?

**Why it matters**: Not useful as a discriminator (almost all sessions are voice-dictated). Potentially useful as a **quality signal** — severe dictation errors may cause Claude to misinterpret intent ("director" interpreted literally instead of as "directory"). Could be implemented as a detector in `compute-session-shape.py` scanning for known voice artifact patterns.

**Known artifacts**: "AI-gentive" = AIgentive, "director" = "directory", "mimi" = "mini", "focu" = "/focus", "abilit" = "ability", "hardrive" = "hard drive", "coppied" = "copied"

**Status**: Deferred as a classifier. May be added to compute-session-shape.py as a detector in future.

---

## Lens Evolution

This catalog will grow as more sessions are analysed. When a new pattern appears 3+ times:

1. Define it as a new classifier, predicate, or observation
2. Add it to this document with evidence
3. Update the v2 schema to include the new field
4. Consider a backward wave to apply the new lens to previously analysed sessions

Current catalog: **8 classifiers, 12 predicates, 5 observations** from 108 sessions.

### Wave 5 additions

- C08 session_chain_role — multi-session workflow role detection
- P11 is_machine_initiated — automated vs human session start
- P12 has_voice_dictation_artifacts — speech-to-text quality signal (deferred as classifier)
