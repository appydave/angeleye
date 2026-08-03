---
type: analysis
title: 'Findings W12-05'
description: 'Wave 12 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-05

**Wave**: 12 | **Agent**: W12-05 | **Date**: 2026-03-23
**Sessions analysed**: 9 | **Scale distribution**: 9 light (100%)
**BUILD accuracy**: 1/9 (11%) — only ef6529fa was genuinely BUILD

## Summary

All 9 sessions are light-scale (20-24 events). 8 of 9 have brains/ as CWD. The single correctly-classified BUILD session (ef6529fa) is the only one with a product repo CWD (prompt.supportsignal.com.au). This batch strongly confirms the wave 6-11 pattern: light + brains/ CWD = almost never BUILD.

## Session-by-Session

### 1. ad22e674 — DeckHand Knowledge Capture

- **Registry**: BUILD | **Actual**: KNOWLEDGE (knowledge.brain_update)
- Opens with 5.5KB context handover paste from prior DeckHand/infrastructure session
- 4 Write calls creating brain docs for DeckHand project vision
- Two phases separated by 100-min gap: context absorption, then documentation
- Voice artifacts: "Decane" = DeckHand, "A-Jazz" = Ajazz

### 2. 33a95b6c — Lars Todo Task Management

- **Registry**: BUILD | **Actual**: OPERATIONS (operations.task_management)
- 2-minute session: voice-dictated todo + cross-reference to Lars client folder
- Edits brains/todo/inbox.md and clients/lars/docs/communication/email-drafts/todo-topics.md
- Efficient Claude performance: discovers client folder structure, cross-references correctly
- Voice artifact: "paperclip AI Being" — capitalisation from dictation

### 3. f3395cf9 — App Naming Convention Research

- **Registry**: BUILD | **Actual**: RESEARCH (research.naming_convention)
- User asks about AppyStack naming rules — Claude does systematic Glob search (9 calls)
- Reads READMEs from DeckHand, AppyStack, ThumbRack to derive naming patterns
- 2 Edit calls to codify findings in brain
- Voice artifact: "Can you have?" — false start from voice

### 4. e26387f7 — Krisp AI Audio Troubleshooting

- **Registry**: BUILD | **Actual**: RESEARCH (research.troubleshooting)
- **Highest interest session in this batch**
- User reports audio clipping across Ecamm Live and Wispr Flow
- Claude diagnoses Krisp AI VAD as culprit, confirms via web search and Playwright
- Two phases separated by 5.5h gap: diagnosis, then hands-on fix attempt
- Fix (Voice Isolation Off) didn't work — escalated to support request
- User frustration: "I just hate this user interface. And I can never find anything."
- Playwright role: external_research (browsing Krisp help pages)

### 5. 2f22e5b7 — Application Inventory Creation

- **Registry**: BUILD | **Actual**: KNOWLEDGE (knowledge.inventory_creation)
- User requests catalog of all applications with ports, locations, freshness scores
- Uses Agent subagents (2) + Bash (7) for filesystem scanning
- Produces structured JSON document in brain files
- Voice artifacts: "GPT context scabber" = scraper, "she is for me" = there is for me, "Vibe deck" = VibeDeck

### 6. 44d4d314 — Stream Deck/DeckHand Documentation Exploration

- **Registry**: BUILD | **Actual**: RESEARCH (research.product_exploration)
- Multi-topic exploration: DeckHand docs, Ecamm Live Actions, button image packs
- 3 phases over 20 min active (210 min total with 3h gap)
- Ends with user typing "exit'" and "x" — attempting to quit session
- 1 Write + 1 Edit to brain/stream-deck documentation

### 7. ef6529fa — Oscar Preflight Workflow Implementation

- **Registry**: BUILD | **Actual**: BUILD (build.workflow_implementation)
- **Only correctly classified BUILD in this batch**
- Single typed prompt implementing Oscar's preflight phase from a proposal doc
- Creates preflight-workflow.yaml, updates agent definitions
- Uses TaskCreate/TaskUpdate for parallel implementation workers
- 4 minutes, 1 prompt, 20 tool calls — high autonomy ratio (1:20)
- Not voice-dictated — precise typed instruction

### 8. 101bf7ba — Ecosystem Orientation via /who-am-i

- **Registry**: BUILD | **Actual**: ORIENTATION (orientation.ecosystem_overview)
- Opens with /who-am-i skill invocation
- Three quick phases: ecosystem overview, brain inventory (56 brains), disk space check
- SSHs to MacBook Pro to verify 1TB drive after user correction
- Zero Write/Edit — pure read-only orientation
- Voice artifact: "disposed" = disk space

### 9. 587c3f05 — Claude Code Remote Control Research

- **Registry**: BUILD | **Actual**: RESEARCH (research.dev_env_troubleshooting)
- User researches why Claude Code remote control feature isn't available
- Discovers it's a server-side feature flag (tengu_ccr_bridge) gradual rollout
- 3 web searches, 10 Bash calls (version checks), /release-notes skill
- Formats findings for pasting as GitHub comment
- User frustration with Anthropic's feature rollout

## Cross-Session Patterns

### BUILD misclassification continues at expected rate

- 1/9 (11%) — consistent with wave 9's 11% for light-scale sessions
- The single correct BUILD has: product repo CWD, typed (not voice) prompt, Write calls to product code, TaskCreate/TaskUpdate parallel workers
- All 8 misclassified sessions have: brains/ CWD, voice-dictated prompts, zero or incidental code writes

### brains/ CWD as home terminal (7/8 brains sessions)

- 7 of 8 brains/ CWD sessions show incidental project attribution
- Only f3395cf9 (naming convention research) has reliable attribution — the research genuinely targets brain content
- brains/ continues to function as the default terminal location for quick voice queries

### Voice dictation is pervasive (8/9)

- Only ef6529fa (typed POEM implementation) lacks voice artifacts
- Notable artifacts in this batch: "Decane"=DeckHand, "scabber"=scraper, "disposed"=disk space, "she is for me"="there is for me"

### Session chains visible

- ad22e674 (knowledge capture) + 44d4d314 (documentation exploration) + 2f22e5b7 (inventory creation) form a DeckHand/infrastructure chain across Mar 1-4
- Not explicitly cross-referenced, but thematically continuous

### Frustration signals (2/9)

- e26387f7: Krisp UI frustration ("I just hate this user interface")
- 587c3f05: Claude Code feature rollout frustration ("it doesn't feel like a rollout issue; it feels like something corrupted")
- Both directed at third-party products, not at Claude itself

### New subtype: operations.task_management

- 33a95b6c is a clean example: voice-dictated todo addition with cross-referencing to client folder
- Distinct from operations.poem_execution (automated workflow) and operations.port_kill (system maintenance)
- Quick, directive, minimal interaction pattern

### New subtype: research.naming_convention

- f3395cf9: systematic search for naming patterns, then codification
- Distinct from research.quick_answer (too structured) and research.knowledge_capture (produces a convention, not knowledge)

### New subtype: knowledge.inventory_creation

- 2f22e5b7: catalog production using Agent subagents + filesystem scanning
- Distinct from knowledge.brain_update (updating existing knowledge) — this creates new structured data documents

### New subtype: orientation.ecosystem_overview

- 101bf7ba: /who-am-i skill + brain inventory + hardware interrogation
- Broader than orientation.artifact_retrieval (which targets specific prior context)
- The /who-am-i skill makes this a standardised orientation entry point
