---
type: analysis
title: 'Findings W10-02'
description: 'W10-02: 9 sessions, 44% BUILD accuracy; proposes 9 subtypes including machine_sync, morning_triage, labs_scaffold, reverse_engineering.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 10-02

**Agent**: W10-02
**Sessions analysed**: 9 (1 heavy, 8 moderate)
**Date**: 2026-03-23

## BUILD Accuracy Assessment

**BUILD accuracy: 3/9 (33%)**

Registry classified all 9 as BUILD. After analysis:

- **Correct BUILD**: 3 (da040e73 multi_project_feature, 77148c1f debug_fix, 5942ce2f labs_scaffold)
- **Misclassified**: 6
  - 580c428a: SYSOPS (machine sync)
  - f7951cc3: RESEARCH (tool evaluation)
  - 8eb0eb2c: KNOWLEDGE (brain update)
  - 5ea99ae9: ORIENTATION (morning triage)
  - c4961eaa: RESEARCH (reverse engineering)
  - b82395cd: BUILD correct (bug_fix_lint) — kept as BUILD

Actual: 4/9 BUILD (44%), which is above the moderate session average (30-40%) but consistent with wave 10 expectations for moderate+ sessions.

## Per-Session Observations

### 1. da040e73 — BUILD (multi_project_feature) [HEAVY]

- **Multi-day session** (Mar 12-15) with 4 idle gaps >1h, spanning 4470 total minutes
- **Cross-agent handover**: User pastes "Alex's" analysis from another session/agent as input for x-ui-widget implementation
- **Port registry audit**: Late-phase systematic audit of all SupportSignal application ports, updating apps.json
- **Voice artifacts**: "PocWoi" (POEM WUI), "Angela" (AngelEye)
- **BUILD correct**: Genuine feature construction — schema enhancement, code edits, commit

### 2. 580c428a — SYSOPS (machine_sync) [MODERATE]

- **5 distinct phases** in 134 minutes — extremely dense session
- **SSH-based gap analysis** between M4 Mini and returned MacBook Pro
- **Playwright for sysops**: Used to check Tailscale web console — Playwright semantic role: external_system_check (new role?)
- **Locations.json schema redesign**: Prompted deep Agent research into all 93+ locations
- **Voice artifacts**: "PMPN"=pnpm, "angel hands"=AngelEye, "remove M4"=remote M4
- **Meeting prep pattern**: User uses session to prepare content for evening meeting

### 3. f7951cc3 — RESEARCH (tool_evaluation) [MODERATE]

- **Multi-tool evaluation**: Krisp AI, Ecamm Live HTTP API, Restream, StreamYard, OMI
- **Playwright for external research**: Navigates product pages, takes screenshots of Krisp SDK and OMI.me
- **Brain file creation**: Creates new Krisp AI brain folder, updates Ecamm/OMI brain content
- **Delegation burst closing**: User delegates 4+ parallel research tasks at end
- **Voice confusion**: "upstream" vs "Restream" — user confuses product names, eventually clarifies
- **"branch"="brain"**: Voice artifact "I don't know if we have a branch around Krisp AI" — means brain

### 4. 77148c1f — BUILD (debug_fix) [MODERATE]

- **71KB context paste opener**: Largest form-filling detected in this wave
- **Structured test workflow**: Fix code -> run 5 different incident test cases -> verify all results
- **Task parallelism**: Uses TaskCreate/TaskUpdate/Task (20 calls total) for parallel test execution
- **BUILD correct**: Genuine predicate analysis fix in poem-executor with structured verification

### 5. b82395cd — BUILD (bug_fix_lint) [MODERATE]

- **56KB context paste**: Carries over production deployment context from prior session
- **Explicit frustration carryover**: "watching it for about an hour" (stuck bun test in prior session)
- **Handover closing pattern**: "frame it for another convo to take over" — explicit session chain intent
- **BUILD correct**: Code edits to fix linting issues from production push

### 6. 8eb0eb2c — KNOWLEDGE (brain_update) [MODERATE]

- **Creator brain mapping**: Meta-question about which brains relate to YouTube/monetization
- **Gling AI deep research**: 5+ Brave web searches, brain files created
- **7 ToolSearch calls**: Higher than usual — searching for commit skill, web tools
- **Voice artifact**: "eit" = truncated voice command (probably interrupted)
- **BUILD misclassified**: Zero app code. All 15 Writes + 13 Edits target brain files

### 7. 5942ce2f — BUILD (labs_scaffold) [MODERATE]

- **"Labs" concept born here**: User invents the labs concept in this session — learning experiments in dedicated folders
- **Jump System for Lars**: Creates repository with README, scripts, aliases generator, pushed to GitHub
- **Agent-friendly documentation principles**: Lars's bug report (Bash 3.2 pitfalls, SSH clone failures) drives documentation improvements
- **Voice artifacts**: "Bill"=well, "love"=Lars, "Lisa"=LISA, "ZS HRC"=.zshrc
- **BUILD correct**: Genuine repo scaffolding with deliverable pushed to GitHub
- **CWD incidental**: CWD=brains but all Writes go to ~/dev/ad/labs/jump-system

### 8. 5ea99ae9 — ORIENTATION (morning_triage) [MODERATE]

- **Two-day session**: 990 total minutes but only 38 active minutes across 3 bursts
- **/radar skill opener**: "Hey Radar, what have we got on our agenda?"
- **OMI transcript ingestion**: Processes /tmp/omi-transcripts file, routes to brain
- **Multi-project routing**: Tasks routed to OMI, DeckHand, AppyStack, SupportSignal, beauty-and-joy, agentic-os
- **Agentic OS architecture discussion**: Horizontal (computer-to-computer) vs vertical (ingestion-to-storage) stacks
- **"brains as routing hub"**: CWD=brains serves as the dispatch point for cross-project task routing
- **P13 fired**: Claude mis-scheduled Cole Medin work for today instead of tomorrow

### 9. c4961eaa — RESEARCH (reverse_engineering) [MODERATE]

- **Extremely dense**: 87 events in 8 minutes — highest event density in this wave
- **Dual subagent parallel exploration**: "Explore" agent examines ~/.claude filesystem, "general-purpose" agent searches web docs
- **AngelEye-critical**: Discovers custom-title entry type in JSONL, sessions-index.json structure, /rename mechanism
- **/focus skill opener**: "/focus claude code" — skill-driven orientation
- **Cross-session chain**: Continues B030 investigation from prior AngelEye session
- **BUILD misclassified**: Pure reverse-engineering research with brain file updates

## New Subtype Proposals

| Subtype                      | Session  | Confidence | Description                                         |
| ---------------------------- | -------- | ---------- | --------------------------------------------------- |
| build.multi_project_feature  | da040e73 | medium     | Feature work spanning multiple repositories         |
| sysops.machine_sync          | 580c428a | high       | SSH-based gap analysis and sync between machines    |
| research.tool_evaluation     | f7951cc3 | high       | Systematic evaluation of external products/tools    |
| build.debug_fix              | 77148c1f | medium     | Bug fix with structured test verification           |
| build.bug_fix_lint           | b82395cd | medium     | Lint/quality fix from production deployment         |
| knowledge.brain_update       | 8eb0eb2c | medium     | Creating/updating brain knowledge files             |
| build.labs_scaffold          | 5942ce2f | high       | Creating new lab/experiment repository from scratch |
| orientation.morning_triage   | 5ea99ae9 | high       | Morning agenda review with task routing             |
| research.reverse_engineering | c4961eaa | high       | Investigating tool internals/undocumented behavior  |

## Novel Patterns

### 1. Cross-Agent Handover via Paste

Session da040e73 shows user pasting "Alex's" analysis (from another Claude session/agent) directly into current session as implementation input. This is a structured inter-agent communication pattern — not just context loading, but delegated analysis being consumed.

### 2. Brains-as-Routing-Hub

Session 5ea99ae9 clearly demonstrates the "brains as routing hub" pattern: CWD=brains is used as a dispatch terminal for routing tasks across 6+ projects. The /radar skill facilitates this. Not a CWD mismatch — it's intentional architecture.

### 3. Labs Concept Genesis

Session 5942ce2f captures the birth of the "labs" concept — learning experiments in dedicated folders with agent-friendly documentation. The Lars bug report integration is particularly interesting: real-world installation failure data directly informs documentation principles.

### 4. Dual-Subagent Parallel Research

Session c4961eaa deploys two subagents simultaneously — one exploring the filesystem, one searching the web — to converge on the answer to a single question (where does /rename store names?). This is a novel search pattern for Claude Code sessions.

### 5. Frustration Carryover

Session b82395cd opens with frustration from a prior session ("watching it for about an hour"). The frustration isn't generated in this session but colors the opening context. P02 should capture this as "carried frustration" vs "generated frustration."

## Friction Predicates (P13-P16)

| Predicate                   | Fired | Session(s)                             |
| --------------------------- | ----- | -------------------------------------- |
| P13 (misunderstood_request) | 1     | 5ea99ae9 (Cole Medin scheduling error) |
| P14 (wrong_approach)        | 0     | —                                      |
| P15 (buggy_output)          | 0     | —                                      |
| P16 (excessive_changes)     | 0     | —                                      |

Low friction in this wave — only 1 P13 instance. These are experienced sessions with clear user direction (voice + paste patterns well established).

## Voice Dictation Artifacts (new catalog entries)

| Artifact           | Meaning                | Session            |
| ------------------ | ---------------------- | ------------------ |
| PocWoi             | POEM WUI               | da040e73           |
| Angela             | AngelEye               | da040e73           |
| PMPN               | pnpm                   | 580c428a           |
| angel hands        | AngelEye               | 580c428a           |
| remove M4          | remote M4              | 580c428a           |
| branch (for Krisp) | brain                  | f7951cc3           |
| Bill               | well                   | 5942ce2f           |
| love               | Lars                   | 5942ce2f           |
| Lisa               | LISA (brain librarian) | 5942ce2f, 5ea99ae9 |
| ZS HRC             | .zshrc                 | 5942ce2f           |
| Cold Med           | Cole Medin             | 5ea99ae9           |
| eit                | Edit (truncated)       | 8eb0eb2c           |

## Playwright Semantic Roles Observed

- **external_research**: f7951cc3 — navigating Krisp SDK, OMI.me product pages
- **external_system_check**: 580c428a — checking Tailscale web console for machine connectivity (possibly new role distinct from external_research — purpose is operational verification, not knowledge gathering)

## Statistics

- **Sessions**: 9 (1 heavy, 8 moderate)
- **BUILD accuracy**: 4/9 (44%) — higher than wave 9 (11%) due to all-moderate+ sessions
- **Multi-phase sessions**: 8/9 (89%) — only c4961eaa was single-phase
- **Voice dictation**: 8/9 (89%) — only c4961eaa was typed
- **CWD incidental**: 4/9 (44%) — brains CWD is incidental for sysops/orientation/scaffold sessions
- **Context paste openers**: 2/9 (22%) — 77148c1f (71KB), b82395cd (56KB)
- **New subtypes proposed**: 9
- **Friction predicates fired**: 1 (P13 only)
