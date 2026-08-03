---
type: analysis
title: 'Findings W11-03'
description: 'Wave 11 Batch 03: 9 sessions, 0% BUILD accuracy; POEM executor (*run) pattern + concurrent sessions + session tail reuse confirmed.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 11 Agent W11-03

**Wave**: 11 (forward)
**Agent**: W11-03
**Sessions analysed**: 9
**Date**: 2026-03-23

## Summary Statistics

| Metric                     | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Sessions analysed          | 9                                                                    |
| BUILD registry accuracy    | 0/9 (0%)                                                             |
| New subtypes proposed      | 6                                                                    |
| Friction predicates fired  | P15 (buggy_output): 1, P12 (voice_dictation): 5                      |
| Multi-phase sessions       | 6/9 (67%)                                                            |
| CWD incidental             | 5/9 (56%)                                                            |
| Sessions with brain writes | 3/9 (33%)                                                            |
| PII detected               | 1 session (ef02ac0f — passport, medical, partner name, travel dates) |

## BUILD Accuracy Assessment

Registry classified all 9 sessions as BUILD. **Zero were correct.**

| Session  | Reclassified to                     | Reasoning                                        |
| -------- | ----------------------------------- | ------------------------------------------------ |
| cd9616ed | KNOWLEDGE (presentation_qa)         | Architectural Q&A for talk, no product code      |
| ba8b5426 | KNOWLEDGE (documentation_synthesis) | Doc synthesis + plan-mode interview, no features |
| f9a5c85d | OPERATIONS (poem_execution)         | POEM \*run executor, automated workflow          |
| 5723519d | ORIENTATION (morning_triage)        | Multi-topic voice triage, CLAUDE.md updates      |
| ef02ac0f | RESEARCH (personal_planning)        | Travel planning with web research                |
| 5ce05994 | OPERATIONS (poem_execution)         | POEM \*run executor, automated workflow          |
| d1961749 | ORIENTATION (artifact_retrieval)    | Read-only exploration, zero writes               |
| 5f57d757 | KNOWLEDGE (brain_creation)          | New brain folders + live meetup capture          |
| bfaf7605 | OPERATIONS (streaming_control)      | OBS scene switching via Bash                     |

**Pattern**: 0% BUILD accuracy confirms waves 6-9 finding that light/moderate sessions from brains/ and prompt.supportsignal/ CWDs are almost never BUILD. This batch is 100% non-BUILD.

## Per-Session Observations

### S1: cd9616ed — Digital Stage Summit talk Q&A (moderate, KNOWLEDGE)

**Key observation**: Deep architectural Q&A producing conceptual models for a conference talk. Session produces a 6-level personal agent stack model (Brain -> Identity+Memory -> Harness -> Skills -> Scheduling -> Observability), a hub-and-spoke app topology (not pyramid), and a key insight: "the same Claude Code that's your personal executor becomes a node in the OS."

**Session chain**: Explicit chain member — references "Session 1" (agents and skills), produces handover for "Session 3" (Agentic Applications). Uses relay/david-jan/ as production chain endpoint.

**Voice artifacts**: "Jason" = JSON, "Fly deck" = FliDeck, "Hemamoon" = HammerMoon.

### S2: ba8b5426 — AppyStack documentation synthesis (moderate, KNOWLEDGE)

**Key observation**: Structured 3.7KB task specification as opening prompt — pre-written with headers, requirements, and success criteria. This is the most structured opener in this batch. Two distinct phases separated by 74-min idle gap: doc synthesis, then NPM publishing plan via AskTool interview.

**Cross-session paste pattern**: User copies Claude Code transcript from a separate brains/ session about JS boilerplate concepts and pastes it as context. This is the "cross-paste injection" pattern — content from another session used as context.

**Convention enforcement**: User corrects uppercase filenames (ARCHITECTURE.md -> architecture.md) to match kebab-case convention. Shows active style governance.

### S3: f9a5c85d — POEM workflow execution (moderate, OPERATIONS)

**Key observation**: POEM *run executor session. `*run 005`and`\*run 105` commands trigger automated Task/TaskOutput parallel workers. 3 prompts produce 63 tool calls. Final prompt reveals frustration with recurring POEM defect: workflow claims to generate 19 answers but doesn't persist them. User says "This destroys pretty much everything afterwards. But this is my biggest gripe. I've seen it before."

**Concurrent session**: Timestamps overlap with 5ce05994 (same 07:55-08:12 window, same CWD). These are concurrent POEM executions — third confirmed concurrent session pair.

### S4: 5723519d — Morning triage multi-topic dump (moderate, ORIENTATION)

**Key observation**: Massive voice dump covering 8+ topics in 5 prompts. The second prompt is 1500+ chars of stream-of-consciousness covering: service accounts, session rename, OMI processing, abridgment vs chunking, Claude release notes, Paperclip orchestrator, agentic apps. Claude handles this well, dispatching 2 background Agents.

**New voice artifacts**: "succession rename" = session rename, "bridging" = abridging, "books" = hooks.

**Skill token budget awareness**: User pastes /skills output (60 skills, ~5400 tokens) and asks Claude to note the overhead. This directly led to the CLAUDE.md "Skill Description Token Budget" section.

### S5: ef02ac0f — DTV border run planning (light, RESEARCH)

**Key observation**: Personal travel planning that showcases Claude as a practical life assistant. Background agent runs 17 Brave web searches + 4 WebFetch to research Thai border pass rules. Produces actionable packing lists and planning checklists. The 34-hour idle gap before a single "what does shard mean?" question is a pattern — resuming an old session for a quick unrelated question.

**PII density**: Passport details, CPAP medical condition, girlfriend's name (Joy), travel dates, booking IDs, TDAC reference numbers, credit card discussion. Highest PII density in this batch.

**New pattern — session tail reuse**: User resumes after 34-hour gap to ask an unrelated vocabulary question. Session serves as a convenient open terminal rather than starting a new session.

### S6: 5ce05994 — POEM workflow execution (light, OPERATIONS)

**Key observation**: Concurrent with S3 (f9a5c85d). Same time window, same CWD, related \*run commands. Uses TaskCreate/TaskUpdate (not just Task/TaskOutput), indicating workflow management rather than just execution. Less frustration than S3 — user's review prompt is analytical rather than frustrated.

### S7: d1961749 — Solo Deck / FliDeck exploration (light, ORIENTATION)

**Key observation**: Pure artifact retrieval. 1 question triggers 2 Explore subagents that read 17 files across presentation-templates/ and presentation-assets/. Zero writes. The 43KB file size is entirely the subagent's comprehensive report (the full Solo Deck component library documentation).

**Session naming curiosity**: User asks "Why does it go blue like this when you rename it?" — genuine curiosity about Claude Code UI behavior. This could inform AngelEye's understanding of /rename UX.

### S8: 5f57d757 — Live meetup brain creation (light, KNOWLEDGE)

**Key observation**: Real-time meetup note-taking session. Creates brain stubs, fetches external article, then captures massive live transcript from "Agents in the Wild Week 1." The transcript contains detailed notes from Nick and Ian's talks about agent-first paradigm, Samantha orchestrator, 9-component framework, autonomy knob, and agent-to-agent communication.

**File size anomaly**: 94KB for 41 events — the massive meetup transcript paste inflates file size dramatically. File size is noise, not complexity signal (confirmed from wave 1b).

**New subtype proposed**: `knowledge.live_capture` — real-time capture of content during a live event, distinct from brain_creation (which creates structure) or brain_update (which edits existing content).

### S9: bfaf7605 — OBS streaming control (light, OPERATIONS)

**Key observation**: 100% Bash (32/32 tool calls). User controls OBS scenes via CLI: list scenes, switch to "notebook slides", switch to default, query web scene dimensions/crop/layout. Zero reads, writes, or edits. CWD=brains is completely incidental — home terminal for streaming operations.

**New subtype proposed**: `operations.streaming_control` — OBS/streaming tool management via CLI. Distinct from other OPERATIONS subtypes (deployment, git, etc.).

## Cross-Cutting Observations

### BUILD classifier failure mode: non-product repos

All 9 sessions are from brains/ (6), prompt.supportsignal/ (2), or appystack/ (1) CWDs. None involve product code construction. The BUILD classifier appears to default to BUILD for any session with tool calls, regardless of whether those tools touch product code. A CWD guard (brains/ -> never BUILD, prompt.supportsignal/ -> rarely BUILD) would fix 8/9 of these misclassifications.

### POEM executor sessions are a distinct pattern

Sessions f9a5c85d and 5ce05994 are POEM *run executions with identical structure: short command -> Task/TaskOutput parallel workers -> single Write -> user review. These should be auto-classified as OPERATIONS.poem_execution based on the `*run` opener pattern.

### Concurrent session pair #3 confirmed

Sessions f9a5c85d and 5ce05994 overlap in the same 07:55-08:12 time window with the same CWD. This is the third confirmed concurrent session pair (after wave 6 and wave 7 discoveries). Both are POEM executions — user running multiple workflows simultaneously.

### Voice dictation dominance

5/9 sessions show voice dictation artifacts. Voice is the default input mode for this user, even for technical topics. New artifacts cataloged: "succession rename", "bridging" (abridging), "books" (hooks), "Jason" (JSON), "Fly deck" (FliDeck), "Hemamoon" (HammerMoon), "gather" (and), "oxnfrith" (0xnfrith), "NPN" (npm).

### Session tail reuse pattern

Session ef02ac0f shows a 34-hour idle gap followed by a single unrelated question ("what does shard mean?"). The user reopened an old session for a quick question rather than starting a new one. This inflates duration metrics and can mislead multi-phase detection.

### New subtypes proposed (6)

1. `knowledge.presentation_qa` — Architectural Q&A producing talk/presentation content
2. `knowledge.live_capture` — Real-time content capture during live events
3. `operations.poem_execution` — POEM \*run workflow execution
4. `operations.streaming_control` — OBS/streaming tool management
5. `research.personal_planning` — Personal life planning with web research
6. `knowledge.documentation_synthesis` — Synthesising multiple source docs into new docs
