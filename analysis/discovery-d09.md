---
type: analysis
title: 'Discovery D09'
description: 'D09: 8 sessions; proposes handover_chain, deep_research, meta-session reads predicates and opening_intent, output_type classifiers.'
tags: [analysis-campaign, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Discovery Batch D09

## Sessions Examined

| #   | Session ID | CWD / Project        | Duration | Active | Prompts | Tools | Key Signal                                                                    |
| --- | ---------- | -------------------- | -------- | ------ | ------- | ----- | ----------------------------------------------------------------------------- |
| 1   | f9a685e2   | signal-studio        | 1170m    | 212m   | 34      | 395   | Heavy Playwright (100+ calls), handover-driven, 3 compactions                 |
| 2   | 59aedbad   | prompt.supportsignal | 699m     | 132m   | 20      | 299   | Inquiry-opening ("What are the recent changes..."), Playwright-heavy          |
| 3   | ae9b4bb4   | angeleye             | 132m     | 95m    | 22      | 189   | 8 subagents dispatched, reads other session JSONL files, cross-project writes |
| 4   | 7e050438   | flideck (m4-pro)     | 644m     | 262m   | 22      | 185   | Handover-received opening, ralphy-style, TaskOutput used                      |
| 5   | d5e19d58   | appydave-plugins     | 498m     | 41m    | 11      | 109   | Deep research: WebFetch+BraveSearch, 7 subagents, skill authoring             |
| 6   | bd82fee9   | brains (m4-pro)      | 1522m    | 206m   | 46      | 77    | 46 prompts but only 77 tools = highly conversational, BraveSearch-heavy       |
| 7   | 1dda164f   | supportsignal app    | 1209m    | 128m   | 26      | 72    | Write-heavy (22 Write vs 9 Edit), status-inquiry opening                      |
| 8   | 8b8e5899   | supportsignal app    | 158m     | 103m   | 18      | 49    | Read-dominant (29/49 tools), Task tool used, meta-process inquiry             |

---

## Candidate New Predicates

### P-NEW-01: `has_handover_chain` (cross-session task relay)

Sessions f9a685e2 and 7e050438 both show explicit handover patterns. f9a685e2's opening prompt is a pasted handover message from a prior session ("Done. Saved at signal-studio/docs/planning/awb-integration-requirements.md... Handover message for the Signal Studio developer..."). 7e050438 opens with "not sure, this is all I got told by previous convo?" followed by a pasted handover block listing completed work and next steps. This is distinct from `has_cross_session_refs` (P06) which tracks references. This is a structured relay: one session produces a handover artifact, the next session consumes it as its opening prompt. The schema doesn't capture whether a session is the _producer_ or _consumer_ of a handover, or whether the handover was successful (did the receiving session actually complete the requested work?).

### P-NEW-02: `is_deep_research`

Session d5e19d58 is explicitly framed as deep research: "Think of it as deep research where, at the end of it, you've got..." It uses WebFetch (18), BraveSearch (7), reads from POEM OS, BMAD, and plugins, then synthesizes into new skill files. Session bd82fee9 similarly uses BraveSearch (16) and WebFetch (3) with a conversational inquiry style. These sessions have a distinctive tool signature: high WebFetch + BraveSearch, high Read, many subagents for parallel exploration, and a synthesis output (new files written). No existing predicate captures this "gather from external + internal sources, then synthesize" pattern.

### P-NEW-03: `is_conversational_dominant`

Session bd82fee9 has 46 prompts but only 77 tool calls (ratio 1.67 tools/prompt). Most sessions in this batch are 10-18x tools/prompt. This session is fundamentally a conversation with occasional tool use, not a tool-driven workflow. The user is asking questions, getting answers, steering direction -- more like a consulting session than a coding session. Session 8b8e5899 is similar: 18 prompts, 49 tools (2.7 ratio), with Read-dominant tool use suggesting the agent is looking things up to answer questions rather than building anything. Current schema has no way to distinguish "David is having a conversation where Claude occasionally looks things up" from "David gave instructions and Claude is executing."

### P-NEW-04: `has_write_heavy_output`

Session 1dda164f has 22 Write calls vs 9 Edit calls. Most sessions show the inverse (Edit >> Write). High Write count suggests the session is creating new artifacts (documents, plans, specs) rather than modifying existing code. Combined with the status-inquiry opening prompt ("How clean is our application..."), this looks like an assessment-then-document pattern. The Write-to-Edit ratio is a signal the schema doesn't capture.

### P-NEW-05: `has_meta_session_reads`

Session ae9b4bb4 reads other session JSONL files as its primary activity (session-4693345b, session-60bc9223, session-4e8c5897, session-d154c0ef). This is AngelEye-style introspection: a session that analyzes other sessions. This is a specific form of cross-session reference where the _data format being consumed_ is Claude Code's own JSONL, not just referencing prior work conceptually.

---

## Candidate New Observations

### O-NEW-01: `tool_ratio_profile`

Capture the tools-per-prompt ratio as a numeric observation. This batch shows a clear spectrum:

- bd82fee9: 1.67 (conversational)
- 8b8e5899: 2.72 (inquiry/lookup)
- d5e19d58: 9.9 (research with bursts)
- ae9b4bb4: 8.6 (orchestration)
- 7e050438: 8.4 (implementation)
- f9a685e2: 11.6 (heavy implementation)
- 59aedbad: 14.95 (deep implementation)

This single number captures session character more efficiently than tool_profile (C05) alone.

### O-NEW-02: `external_knowledge_sources`

For research sessions, record what external sources were consulted. d5e19d58 used BraveSearch (7 queries) and WebFetch (18 fetches) alongside reading POEM OS docs, BMAD method docs, and existing skill files. bd82fee9 used BraveSearch (16) for meetup research. The sources consulted tell us about knowledge flow direction -- is David pulling knowledge in from the web, from brains, from other projects, or from Claude Code's own artifacts?

### O-NEW-03: `idle_pattern`

Several sessions show distinctive idle patterns that suggest different work styles:

- f9a685e2: 3 gaps (378m, 79m, 499m) -- "work morning, break, work afternoon, break, work evening"
- 1dda164f: 5 gaps including a 743m overnight gap -- "all-day session kept open across sleep"
- bd82fee9: 2 gaps (861m overnight, 455m) -- "multi-day session spanning 2 calendar days"
- ae9b4bb4: 0 gaps -- "single focused sprint"

The idle gap pattern reveals whether the session is a focused sprint, a workday companion, or a persistent multi-day thread. Current schema records `idle_gaps_over_1h` count but not the pattern shape.

### O-NEW-04: `subagent_dispatch_pattern`

Two sessions use subagents very differently:

- ae9b4bb4: 8 subagents in 3 waves (5 parallel at 12:26, 2 parallel at 12:43-12:45, 1 solo at 12:54). The first wave was fan-out research on 5 different sessions. This is "orchestrator" pattern.
- d5e19d58: 7 subagents in 2 waves (3 parallel exploration at 06:19, 4 parallel general-purpose at 06:55-06:57). Two were "Explore" type. This is "research fan-out" pattern.

The subagent dispatch shape (wave count, parallelism, agent types, timing) tells us about the orchestration strategy being used.

---

## Candidate New Classifiers

### C-NEW-01: `opening_intent` (distinct from `opening_style`)

Current `opening_style` captures the form (question, command, paste, etc.). `opening_intent` captures what the user wants to happen:

- **status_inquiry**: "How clean is our application..." (1dda164f), "What are the recent changes..." (59aedbad), "Which agent would you use..." (8b8e5899)
- **handover_consumption**: Pasting a handover block and continuing (f9a685e2, 7e050438)
- **research_commission**: "I want you to do some deep research..." (ae9b4bb4), "What skills do we currently have... do a web search..." (d5e19d58)
- **information_lookup**: "what meetups do I have for agents in the wild?" (bd82fee9)

These intents cut across opening styles and predict the session's trajectory better.

### C-NEW-02: `output_type`

What does the session produce?

- **code_changes**: Modified source files (f9a685e2, 59aedbad)
- **new_artifacts**: New skill files, documents, plans (d5e19d58 created 3 new skills, 1dda164f created many Write files)
- **knowledge_synthesis**: Brain files, observations, analysis docs (ae9b4bb4 wrote to brains/bmad-method and memory files)
- **conversation_only**: No significant file output, just answers (bd82fee9, 8b8e5899 -- mostly reads)

### C-NEW-03: `autonomy_level`

How much did Claude operate independently vs being steered prompt-by-prompt?

- **high_autonomy**: ae9b4bb4 dispatched 8 subagents and orchestrated research with minimal prompting (22 prompts for a complex multi-session analysis)
- **guided**: f9a685e2 had 34 prompts across 395 tool calls -- regular steering
- **conversational**: bd82fee9 had 46 prompts for 77 tool calls -- David is actively driving every step
- **delegated**: d5e19d58 had only 11 prompts for 109 tools -- David gave a big opening prompt and largely let it run

---

## Surprising Patterns

### 1. Handover as a Protocol, Not Just a Reference

Sessions f9a685e2 and 7e050438 show that David has developed a structured handover protocol: one session writes a handover document, the user manually pastes it into the next session as the opening prompt. This is a human-mediated session chain -- not automated cross-session memory, but a deliberate copy-paste relay. The handover in 7e050438 even includes a numbered checklist ("1. Run quality audits... 2. Write assessment... 3. Update BACKLOG..."). This protocol deserves its own detection: look for opening prompts that contain numbered task lists with explicit "handover" or "previous session" language.

### 2. The "Consulting Session" Anti-Pattern

Session bd82fee9 is strikingly different from all others: 46 prompts, 77 tools, no Bash calls at all, 16 BraveSearch queries. The tool profile is Read(23) + Edit(18) + BraveSearch(16) + Glob(8) + Write(5) + WebFetch(3). This is David using Claude as a research consultant -- asking questions about meetups, looking up information, reading and editing brain files. The session spans 1522 minutes (25 hours) with only 206 active minutes, suggesting it was kept open as an ongoing reference/conversation partner across two calendar days. This "always-on consultant" usage pattern doesn't fit neatly into any current session_type.

### 3. Session That Reads Other Sessions

Session ae9b4bb4 is meta-observational: it reads 4 other session JSONL files, reads BMAD and brand-dave brain files, and writes synthesis docs to both brains and memory files. This is effectively a human-directed session analysis -- the predecessor to AngelEye's automated analysis. The file_paths show it reading across angeleye sessions, brains/bmad-method, brains/brand-dave, and flivideo/flideck. This cross-ecosystem reading pattern (touching 5+ distinct project trees in one session) is not captured by any current dimension.

### 4. Machine Provenance as a Signal

Sessions 7e050438 and bd82fee9 are both from "m4-pro" machine. The m4-pro sessions in this batch have no bash_commands_sample (likely a collection limitation for remote sessions), but they do have distinctive patterns: bd82fee9's zero-Bash profile is unusual and may reflect a different machine's tool availability or David's different work style on that machine. Tracking machine-specific behavioral differences could reveal workflow preferences tied to physical location.

### 5. The Write-vs-Edit Ratio Inversion

Session 1dda164f has a Write:Edit ratio of 22:9 (2.4:1). Most coding sessions show the inverse. This inverted ratio, combined with a status-inquiry opening, suggests a session where David asked "where are we?" and Claude responded by creating status documents, plans, or reports. The creation-vs-modification ratio is a cheap-to-compute signal that distinguishes documentation/planning sessions from implementation sessions.
