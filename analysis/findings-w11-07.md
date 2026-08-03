---
type: analysis
title: 'Findings W11-07'
description: 'Wave 11 Batch 07: 9 sessions, 0% BUILD accuracy; provenance chain genesis, Mochaccino gap analysis, POEM 1:58 autonomy record.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings -- Wave 11, Batch W11-07

**Analysed**: 2026-03-23
**Sessions**: 9 (7 brains, 1 prompt.supportsignal, 1 brains/angeleye-related)
**Scale**: 2 moderate, 7 light

---

## Session Summaries

### 8b021832 -- brains / light

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_update

Skill-driven BMAD v6 brain refresh. User asks how to update the brain, invokes `refresh-brain-bmad` skill, then directs "yes, update the brain docs". 38 Edit calls update brain markdown files across 16 minutes. Ends with "commit this".

**Key observations**:

- Textbook brain_update workflow: orient -> skill-invoke -> bulk edit -> commit.
- 38 Edits in a light session is high tool density -- skill delegation drives the volume.
- BUILD misclassification: zero feature code, pure brain content updates.

### 5ba8b355 -- brains / light

**Type**: OPERATIONS (reclassified from BUILD)
**Subtype**: operations.brain_health_check

Brain librarian health check continuation. Opens with 5KB context handover paste from prior session listing 10 completed brains with commit hashes. This session continues the systematic 13-step health check process. 34 Bash + 20 Read diagnostic pattern. 11 Edits for fixes.

**Key observations**:

- Context handover paste as session opener -- confirmed pattern for operations continuations.
- 5-minute burst session -- the shortest non-micro session in this batch. Efficient continuation.
- Interrupted without commit -- session appears to end abruptly, possibly mid-brain.
- BUILD misclassification: maintenance operations, not feature construction.

### aedc4c79 -- brains / moderate

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_audit_and_design

Rich multi-phase session. Starts with background subagent delivering brain update results (workspace-example-supportsignal-ux.md creation). User then requests `/focus` orientation across 3 targets (anthropic-claude brain, angeleye brain, angeleye app). Discovers stale hook counts (17/18 vs actual 22) and corrects them. Then requests mochaccino mockup gap analysis -- identifies 5 missing UI concepts for conversation reader view. Ends with deferral to next session.

**Key observations**:

- **Stale data correction**: Hook counts were wrong across multiple documents (17, 18, 23 -- actual is 22). Session corrects them.
- **Mochaccino gap analysis**: All 5 existing mockup designs are session-list views. None show conversation content inside a session. Claude identifies 5 gaps (conversation view, subagent panel, compaction marker, session detail header, workspace view).
- Voice artifacts: "mockachine" = Mochaccino, "22 books" = 22 hooks.
- Cross-machine reference: "on another computer, I did massive changes to Claude Anthropic hooks".
- Unauthorized edits detected (2) -- subagent edits before user prompt.

### 59e26047 -- prompt.supportsignal / light

**Type**: OPERATIONS (reclassified from BUILD)
**Subtype**: operations.poem_execution

Single-prompt POEM executor session. User types `*run 105` and Claude runs an entire workflow autonomously. 15 Task delegations + 16 TaskOutput reads + 1 Write delivery artifact. 12 minutes total, zero additional human input.

**Key observations**:

- **Extreme autonomy ratio**: 1 prompt -> 58 tool calls (1:58). Higher than the 1:40 record noted in wave 10.
- `*run` command pattern confirmed as OPERATIONS, not BUILD. User observes while Claude orchestrates.
- CWD=prompt.supportsignal is reliable -- workflow runs within this project.
- BUILD misclassification: automated workflow execution with zero human intervention.

### a7b6b827 -- brains / light

**Type**: RESEARCH (reclassified from BUILD)
**Subtype**: research.tool_exploration

Multi-topic exploration session. User asks about Wistia video transcript download, pastes Dent course content (Value Canvas), then pivots to creating a wistia-transcript skill. 42 Bash calls (86%) for API exploration.

**Key observations**:

- **CWD incidental**: CWD=brains but work spans Wistia API, Dent content, and skill creation. Home terminal usage.
- **Content paste injection**: User pastes ~1.5KB of Dent course material mid-session. This is not copied from another session -- it is external content being fed to Claude.
- **Cross-session reference**: "me using an orchestrator Claude to control another Claude through SSH yesterday".
- 53-minute idle gap between research and skill creation phases.
- Voice artifacts: "intersted" = interested, "real;ly" = really.

### 41b69014 -- brains / light

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_update

User asks about `claude remote-control` and `claude agents` CLI features, relating them to prior SSH orchestration experience. Resolves into brain documentation updates across anthropic-claude and agentic-os brains. 18 Edit + 18 Bash.

**Key observations**:

- **13 unauthorized pre-prompt edits detected**: CLAUDE.md auto-load triggered brain reads and edits before the user's first prompt. This is the CLAUDE.md auto-load anti-pattern identified in wave 9.
- User's first real prompt is at event 33 (of 49) -- the first 32 events are all Claude acting autonomously on CLAUDE.md instructions.
- Voice-dictated prompts with natural conversational flow.

### 98c9150d -- brains / light

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_creation

Vercel brain creation from design handover. Opens with 4.3KB context paste describing agreed brain structure (primary brain + ai-sdk and agent-browser sub-brains). Claude scaffolds with 12 Write + 8 Edit. User intervenes about collections/index.yaml migration concern -- wants collections to stay in brand-dave, with Vercel brain as content source. Also clones 2 repos.

**Key observations**:

- **Context handover from design session**: Design phase was complete in prior session. This session is pure execution.
- **User catch**: User notices collections/index.yaml shouldn't be migrated to Vercel brain because FliDeck uses it. Good human oversight.
- AskUserQuestion used (2x) -- Claude appropriately asks clarification before proceeding.

### 3df09cf3 -- brains / light

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.brain_creation

Graph RAG / semantic ontology brain creation from concept. User provides a terse statement ("CONTEXT GRAPHS, Graph RAG, Knowledge RAG, Semantic ontology, taxonomy, intent, patterns, content curation") and asks Claude to "unpack this into something that can be researched". Claude asks clarifying question, then delegates 5 parallel Agent tasks for research, creates 11 brain files.

**Key observations**:

- **Concept-to-brain workflow**: Terse concept statement -> AskUserQuestion -> Agent delegation -> brain scaffold. A repeatable pattern.
- 5 parallel Agent calls -- highest research delegation count in this batch.
- "structure first" -- user's clarifying response directs the approach.

### ce158a14 -- brains / moderate

**Type**: KNOWLEDGE (reclassified from BUILD)
**Subtype**: knowledge.methodology_design

The richest session in this batch. Starts with "What do you know about AppyDave?" -- an identity orientation question. User discovers the `brand-dave:who-am-i` skill should exist, asks Claude to create it. Then a 226-minute idle gap (lunch). Returns and explores provenance chains -- realizing operations.md is derived from canonical sources, not canonical itself. Asks Claude to deep-research provenance tracking via Agent delegation. Ends with commit.

**Key observations**:

- **Provenance chain methodology**: User invents the concept of pairing a provenance document with operations.md to track how derived knowledge was sourced. This is the conceptual origin of the provenance pattern now used across brains.
- **Canonical vs derived distinction**: User articulates: "The canonical truth is not operations. Operations is a reflection of something else." This is a key insight about knowledge management.
- 226-minute idle gap ("I'm going out to lunch") -- user leaves Claude with Agent research delegation.
- **Voice artifacts**: "colloid MDs" = CLAUDE.mds, "Providence" = provenance.
- 12 prompts but only 24 tool calls (2:1 ratio) -- highly conversational, more thinking than doing.
- my-plugin-reload output pasted as evidence -- user showing Claude a terminal output.

---

## Cross-Session Patterns

### BUILD accuracy: 0/9 (0%)

Every session in this batch was misclassified as BUILD. All 9 were reclassified: 5 KNOWLEDGE, 2 OPERATIONS, 1 RESEARCH, 1 (KNOWLEDGE moderate). This is the worst BUILD accuracy of any wave. The batch is 78% light sessions with CWD=brains -- the exact profile where BUILD is never correct.

### brains CWD at light scale = never BUILD

7 of 9 sessions had CWD=brains and light scale. All 7 were non-BUILD. This confirms the wave 10 finding that brains CWD reliability flips with scale: micro/light = always incidental or non-BUILD, moderate+ = sometimes genuine brain work.

### Brain creation as a recurring workflow

3 sessions (98c9150d, 3df09cf3, ce158a14) involve brain creation or methodology design. Two patterns:

1. **Design-then-execute** (98c9150d): Prior session designs, this session scaffolds.
2. **Concept-to-brain** (3df09cf3): Terse concept -> clarification -> research delegation -> brain files.

### Context handover paste dominance

3 of 9 sessions open with context handover pastes (5ba8b355, 98c9150d, aedc4c79 via task-notification). These are continuation sessions where the first prompt reconstructs prior context. This is the dominant opening style for light operations/knowledge sessions.

### CLAUDE.md auto-load anti-pattern confirmed

Session 41b69014 has 13 unauthorized tool uses before the first human prompt. CLAUDE.md auto-load instructions triggered brain reads and edits autonomously. This was flagged in wave 9 -- now confirmed with the highest pre-prompt edit count seen (13).

### POEM executor autonomy record

Session 59e26047 achieves 1:58 human-to-tool ratio (1 prompt, 58 tools). This exceeds the previous record of 1:40 from wave 10.

---

## New Subtype Candidates

| Subtype                            | Session            | Description                                       |
| ---------------------------------- | ------------------ | ------------------------------------------------- |
| `knowledge.brain_update`           | 8b021832, 41b69014 | Updating existing brain docs with new information |
| `operations.brain_health_check`    | 5ba8b355           | Systematic brain librarian 13-step health check   |
| `knowledge.brain_audit_and_design` | aedc4c79           | Cross-brain audit + UI concept gap analysis       |
| `operations.poem_execution`        | 59e26047           | Single-prompt POEM workflow execution             |
| `research.tool_exploration`        | a7b6b827           | API exploration leading to skill creation         |
| `knowledge.brain_creation`         | 98c9150d, 3df09cf3 | Creating new brain from design or concept         |
| `knowledge.methodology_design`     | ce158a14           | Designing provenance chain methodology            |

---

## Friction Predicates

| Predicate                   | Fired | Session | Detail |
| --------------------------- | ----- | ------- | ------ |
| P13 (misunderstood_request) | No    | --      | --     |
| P14 (wrong_approach)        | No    | --      | --     |
| P15 (buggy_output)          | No    | --      | --     |
| P16 (excessive_changes)     | No    | --      | --     |

Zero friction in this batch. All sessions executed smoothly. This correlates with the batch being entirely light/moderate knowledge and operations sessions -- friction is more common in BUILD sessions.

---

## Voice Artifacts Catalog Additions

| Artifact      | Intended   | Session  | Context                    |
| ------------- | ---------- | -------- | -------------------------- |
| "mockachine"  | Mochaccino | aedc4c79 | UI mockup tool             |
| "22 books"    | 22 hooks   | aedc4c79 | Hook event count           |
| "colloid MDs" | CLAUDE.mds | ce158a14 | Configuration files        |
| "Providence"  | provenance | ce158a14 | Knowledge tracking concept |
| "intersted"   | interested | a7b6b827 | Typo from voice            |
| "real;ly"     | really     | a7b6b827 | Typo from voice            |

---

## Notable Patterns

### Provenance chain genesis (ce158a14)

This session is the conceptual origin of the provenance tracking pattern. User articulates that operations.md is derived, not canonical, and proposes pairing it with a provenance document. This methodology was later adopted across the brains system. High historical value.

### Mochaccino gap analysis (aedc4c79)

The gap analysis identifies that all 5 existing mochaccino mockups are session-list views -- none show the conversation inside a session. This directly informs the v6-reader mockup concept and is the origin of the conversation reader design work.

---

## Statistics

| Metric                        | Value                                  |
| ----------------------------- | -------------------------------------- |
| Sessions analysed             | 9                                      |
| Scale distribution            | 7 light, 2 moderate                    |
| BUILD registry correct        | 0/9 (0%)                               |
| New subtypes                  | 7                                      |
| Junk/near-junk                | 0                                      |
| Multi-phase                   | 3 (aedc4c79, a7b6b827, ce158a14)       |
| Compaction resumes            | 0                                      |
| Frustration signals           | 0                                      |
| Playwright sessions           | 0                                      |
| Subagent sessions             | 2 (aedc4c79, ce158a14)                 |
| Cross-session references      | 4                                      |
| Voice artifacts found         | 6                                      |
| PII detected                  | 0                                      |
| Plan-paste sessions           | 0                                      |
| Context handover pastes       | 3                                      |
| Friction predicates fired     | 0                                      |
| Unauthorized pre-prompt edits | 2 sessions (41b69014: 13, aedc4c79: 2) |
