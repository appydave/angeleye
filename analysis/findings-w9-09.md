---
type: analysis
title: 'Findings W9-09'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W9-09

**Wave**: 9, Batch 09
**Sessions**: 9 (2 moderate, 3 light, 4 micro)
**Analysed**: 2026-03-23
**BUILD accuracy**: 2/9 (22%) — consistent with wave 6-8 trends

---

## Session Summaries

### e34013a3 — v-appydave / moderate

**Registry**: BUILD | **Actual**: BUILD (confirmed)
**Subtype**: build.iterative_design

Continuation session from a prior YouTube Launch Optimizer cleanup. User pastes a 6K-char context handover from a previous session, then works through POEM workflow alignment (YAML, HBS prompts, JSON schemas) for the WUI. Two phases: (1) read-review-approve from handover context, then (2) fix prompt formatting issues across 19 prompt files. Session includes a 91-minute idle gap between phases. All Write calls target v-appydave POEM workflow files. TaskCreate/TaskUpdate calls suggest subagent delegation for the file rename/move operations.

**Key observations**:

- Context handover paste as opener is a clear continuation signal (paste_handover opening style)
- 13 Write calls in a burst (15:30-15:32) = batch file rewrite pattern
- Cross-project awareness: user references SupportSignal WUI docs as the standard the YouTube workflow must align with
- User explicitly says "don't act on it yet, just read" — a common voice-user pattern to prevent premature action

### ed786725 — app.supportsignal / moderate

**Registry**: BUILD | **Actual**: REVIEW (reclassified)
**Subtype**: review.qa_oversight

User opens by questioning whether Claude actually did the YAML QA ("Hang on, did you Do the YAML QA"). The session is a QA review of work done by other agents — user asks Claude to review and curate work on "Lisa" (a story), then commit and push. The 8 unauthorized edits before first user prompt (detected by compute-session-shape) are concerning — Claude started editing before the user gave explicit instructions. The Skill calls suggest BMAD workflow invocations. Ends with clean commit_and_push.

**Key observations**:

- **Unauthorized edits confirmed**: 8 Edit calls before first user_prompt. This is a clear P08 hit. Claude acted on restored session context without waiting for user direction
- User's first prompt is a correction/challenge ("Hang on, did you...") — frustration signal
- "go" repeated 3x as prompts — user is approving/unblocking work, not directing it
- Session is QA oversight of multi-agent work, not construction

### 0d6cbb83 — appydave-plugins / light

**Registry**: BUILD | **Actual**: SKILL (reclassified)
**Subtype**: skill.update

Clean, focused session: load Ralphy SKILL.md, understand 3 new audit skills (code-quality, test-quality, architectural-review), wire them into Ralphy's workflow, bump plugin version, commit and push. All edits target SKILL.md and plugin.json. User drives the direction, Claude executes. Ends with clean commit_and_push closing.

**Key observations**:

- All edits target skill files exclusively — clear SKILL classification signal
- "Can you just get Ralphy's plug-in loaded into your Context?" — explicit context-loading opener
- User corrects Claude about consultants vs internal skills: "I don't know that the consultants should be in the loop. They're all like external agents, like Codex" — Claude initially confused internal skills with external Codex routing
- Voice artifacts: "rallphY" = "Ralphy"

### 9e97e108 — app.supportsignal / light

**Registry**: BUILD | **Actual**: ORIENTATION (reclassified)
**Subtype**: orientation.requirements

User opens with `/bmad-help` skill, then `/bmad-sprint-planning` to check sprint status. No code written. Read-only exploration of BMAD workflow state. User asks conceptual question about BMAD v6 sharding vs v4, gets an explanation, identifies a gap in the workflow design (no post-creation size check), and asks for session naming suggestions. Pure information gathering and methodology review.

**Key observations**:

- Skill invocation as opener (`/bmad-help`) — confirms skill_invocation opening style
- Zero Edit/Write calls — cannot be BUILD
- User identifies a legitimate BMAD v6 design gap (no auto-shard triggers) — this is methodology critique, not construction
- Session name suggestions requested at end — shows the /rename habit

### bfaa39a7 — appydave-plugins / light

**Registry**: BUILD | **Actual**: MIXED (KNOWLEDGE + SKILL)
**Subtype**: mixed.research_then_update

Two-phase session: (1) Research phase — user asks about "the Gather command" and Claude searches the plugin repo; (2) Update phase — user pivots to asking about `/solodeck` styling for BMAD POEM, Claude dispatches a subagent to research, then edits skill files. The Agent call is for deep research into the BMAD POEM slide deck styling, not build work. Edits target skill files, making it partially SKILL, but the research component is significant.

**Key observations**:

- 10-minute gap between prompt 1 and first edit suggests idle thinking/reading time
- Agent subagent dispatched for deep research — "Go hard with this; research deeply"
- Voice artifacts: "the Appy Day of styling" (unclear transcription), "solodeck" = "/solodeck"
- Two distinct work types in a short session — light sessions can be multi-phase

### 9de68412 — appystack / micro

**Registry**: BUILD | **Actual**: ORIENTATION (reclassified)
**Subtype**: orientation.artifact_retrieval

User opens with "what were we doing here?" and pastes a massive restored session context (21K chars). This is a compaction resume / session restore where the user is trying to find the Ralph Wiggum loop work units and understand their provenance. All questions are about understanding existing artifacts — no construction. 67-minute idle gap between prompt 2 and prompt 3.

**Key observations**:

- 21K first prompt is mostly restored session output — the actual user question is "what were we doing here?" (7 words)
- All 3 user prompts are questions, not instructions: "what were we doing here?", "what are the work units based on?", "but where were the problems listed"
- Zero Edit/Write calls — pure read-only orientation
- Session context contains detailed Ralph Wiggum loop analysis from a prior session — this is cross-session artifact retrieval

### 6344adc1 — prompt.supportsignal / micro

**Registry**: BUILD | **Actual**: RESEARCH (reclassified)
**Subtype**: research.hardware_lookup

Single-prompt, single-tool session. User asks about M5 chip release date and Mac Mini availability. Claude does one brave_web_search. No code, no files, no project work. CWD (prompt.supportsignal) is completely incidental.

**Key observations**:

- CWD is incidental — hardware research has nothing to do with prompt.supportsignal
- Voice dictation opener: "I just do a bit of a web search"
- Confirms prompt.supportsignal CWD is universally unreliable (wave 5 learning)

### 75c10afe — brains / micro

**Registry**: BUILD | **Actual**: RESEARCH (reclassified)
**Subtype**: research.quick_answer

Single-prompt, zero-tool session. User asks "When I create a new tab in iTerm2 How do I get it to go to the same folder I'm currently in?" Pure Q&A, no tools used at all. CWD (brains) is incidental.

**Key observations**:

- Zero tool calls — never BUILD
- brains CWD is incidental — iTerm2 question has nothing to do with brains repo
- Conversational tool_profile confirmed

### ccd2223e — brains / micro

**Registry**: BUILD | **Actual**: RESEARCH (reclassified)
**Subtype**: research.quick_answer

Single-prompt, zero-tool session. User asks about MX Master mouse button triggering Apple Music. Pure Q&A about hardware/OS behavior. CWD (brains) is incidental.

**Key observations**:

- Zero tool calls — never BUILD
- brains CWD is incidental
- Pattern: brains directory is a common "home terminal" for ad-hoc questions

---

## Cross-Session Patterns

### BUILD accuracy: 2/9 (22%)

Consistent with wave 6-8 rates (17-25%). The two confirmed BUILDs are both moderate scale — micro/light sessions are 0/7 BUILD. This further validates the pattern: BUILD accuracy scales with session complexity.

### Unauthorized edits (P08) in session ed786725

The precomputed shape detected 8 unauthorized Edit calls before the first user prompt. This is the second confirmed P08 instance in the corpus (after W3-20). The pattern: Claude restores session context and interprets the restoration as an implicit instruction to continue editing.

### brains CWD as "home terminal"

Sessions 75c10afe and ccd2223e are both ad-hoc Q&A from brains/ — the user happened to have a terminal open there. Neither session has any relationship to brain files. This is now a consistent pattern: brains/ CWD should default to `incidental` project attribution unless brain file Read/Write is detected.

### voice artifacts catalog additions

- "rallphY" = Ralphy
- "the Appy Day of styling" = unclear (possibly "AppyDave styling")
- "preivvous confo" = "previous convo" (previous conversation)

### skill_invocation opening pattern

Session 9e97e108 opens with `/bmad-help` — confirming the skill_invocation opening style from previous waves. The skill invocation immediately provides project context and navigation.

### Context handover paste volumes

Session e34013a3 has a 6.4K-char context paste; session 9de68412 has a 21.7K-char paste (restored session output). The larger paste is not a real context handover — it is a session restore artifact that inflates the first_real_prompt length.
