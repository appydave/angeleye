---
type: analysis
title: 'Findings W9-07'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 9, Batch W9-07

**Analysed**: 2026-03-23
**Sessions**: 9 (1 moderate, 2 light, 6 micro)
**Projects**: signal-studio, app.supportsignal, flihub, angeleye, appystack (x2), brains (x2), prompt.supportsignal

---

## Session Summaries

### a8e8a27e — signal-studio / moderate

**Type**: REVIEW (reclassified from BUILD)
**Subtype**: review.design_verification

This is a multi-phase session spanning 3 days with only 26 active minutes. Opens with a large 5.8KB session handover paste about AWB WUI visual design work. Phase 1: Claude reads memory files, checks git status, screenshots Playwright to verify design changes — all verification, no new code. Phase 2: Two "Say 'Yay'" smoke-test prompts (day 2 gap). Phase 3: User asks "Is there anything outstanding with this conversation?" — Claude checks git, confirms all 4 zone treatment changes were committed in a prior session. Final prompt asks about WUI design patterns for AppyStack recipe — Claude reads memory files, confirms no recipe exists, offers to create one.

**Key observations**:

- CWD=signal-studio but actual work targets prompt.supportsignal files. Unreliable project attribution.
- Session handover paste is the richest data — captures design decisions, palette, negative knowledge from a prior session.
- 7 Edits logged in shape but no write/edit paths captured — may be from transcript source lines not capturing paths.
- "Say 'Yay'" prompts are a session-alive ping pattern — user checking if session is still responsive after long idle.
- Playwright used for screenshot verification (2 screenshots, 2 clicks, 1 navigate) — ui_audit semantic role.

### 1f23c692 — app.supportsignal / light

**Type**: RESEARCH (reclassified from BUILD)
**Subtype**: research.design_extraction

Playwright-heavy session (27/38 tool calls = 71% are Playwright). User asks Claude to scan the live app.supportsignal.com.au URL via headed Playwright, document design aesthetics, identify reusable UI components. Claude navigates through every page, takes screenshots, produces a massive 411-line design extraction report written to supportsignal-v2-planning/docs/design/01-v1-ui-design-extraction.md.

**Key observations**:

- CWD=app.supportsignal but the deliverable is written to supportsignal-v2-planning — a different repo. Project attribution unreliable.
- This is NOT BUILD — no feature code written. It is research/analysis that produces a planning document.
- Playwright semantic role: design_extraction — a new variant. Not testing, not auditing, not external research. Systematically crawling own product to extract reusable patterns.
- Voice dictation clear: "I just want you to connect to the existing Chrome", "the woo design patterns" (likely "WUI design patterns").
- Part of a planned 3-report series (user says "you're the first report"). Session chain: initiator.

### d9348668 — flihub / light

**Type**: DEBUG (reclassified from BUILD)
**Subtype**: debug.dependency_resolution

Session opens with a paste of FliHub developer tools UI showing "Failed to start Whisper" error. Second prompt is a massive cross-paste from a brains session about Whisper/mlx-whisper installation via Ansible. User wants to understand why Whisper failed and get it working. Claude investigates (4 Grep, 4 ToolSearch searching for skills), finds the Whisper binary missing, then makes 3 Edits to fix the transcription configuration to use mlx_whisper. Final prompt: "commit and push" with 5 Bash calls.

**Key observations**:

- Massive cross-session context paste (prompt 2 is ~4KB of another session's output). Classic cross-paste injection pattern — the brains session output informs this flihub debugging session.
- 4 ToolSearch calls + 4 Grep calls before first Edit = search_without_read pattern detected.
- CWD=flihub and edits target flihub — project attribution reliable.
- "Wispr" = Whisper (voice artifact). "builk" in project path = "bulk" (voice artifact in the project name itself).
- Session spans 155 min but only 17 active — 95 min idle gap between debug and commit.

### e154b011 — angeleye / light

**Type**: SETUP (reclassified from BUILD)
**Subtype**: setup.project_scaffold

Ultra-short session (8 min, 2 prompts, 23 events). First prompt is the AppyStack create-project shorthand: "angeleye @appystack Multi-agent observability and telemetry. 5050/51". Second prompt is "yes" (confirming scaffold). Then 17 Bash calls + 1 Edit + 2 Read + 1 Glob — the AppyStack template being instantiated. This is the birth session of the AngelEye project itself.

**Key observations**:

- Registry BUILD is wrong — this is project scaffolding, not feature construction.
- The `@appystack` pattern in the first prompt is a create-appystack invocation signal. "5050/51" = port numbers.
- 17 Bash calls in 8 minutes = automated scaffold execution (npm init, git init, file creation).
- Historically significant — this is session zero for AngelEye.

### d2750b5f — appystack / light

**Type**: RESEARCH (reclassified from BUILD)
**Subtype**: research.workflow_understanding

User asks about the docs/review folder in appystack — "How much of it is review, how much of it is Ralph Wiggum, and how much of it is historical?" Session is entirely Q&A: user asks questions about Ralphy loop documentation, asks about handover format, asks to compare with brain docs. 6 Read + 4 Bash + 1 Task. Zero Edit/Write. Pure read-only exploration of existing documentation.

**Key observations**:

- Voice artifacts: "Ralph Wiggum" = Ralphy (consistent with known "Raffi"/"Ralph William" artifacts). "absolute pop step I think Matt plays" = "absolute paths" (severe voice garbling).
- CWD=appystack and reads target appystack + brains/anthropic-claude/ralph-wiggum — CWD reliable for primary project.
- Educational intent: "If I was trying to educate people on the Ralph Wiggum loop" — user is understanding documentation for content creation, not building.

### 3c42e049 — appystack / micro

**Type**: ORIENTATION (reclassified from BUILD)
**Subtype**: orientation.artifact_retrieval

4 events, 5 minutes. User asks for grouped listing of jump locations (Read locations.json). Second prompt asks about "JapThumbRack" folder — triggers an Agent call to investigate. CWD=appystack but the questions are about the broader ecosystem, not appystack itself.

**Key observations**:

- CWD incidental — questions about jump locations and JapThumbRack are not appystack work.
- "JapThumbRack" is likely a voice artifact for a folder name.
- Agent call for a simple folder investigation suggests the model chose delegation over direct Bash exploration.

### 2102ddd1 — brains / micro

**Type**: META (reclassified from BUILD)
**Subtype**: meta.session_introspection

2 events, 0 active minutes. First event is a Read (tool_use before any user_prompt — possibly CLAUDE.md auto-read). Single user prompt after 100-minute gap: "In a short sentence, what is this conversation about?" User is asking Claude to self-describe the session. No meaningful work performed.

**Key observations**:

- 100-minute gap between the Read and the user_prompt — session was idle.
- The Read before user_prompt is likely automatic CLAUDE.md loading, not user-initiated.
- This is a session-alive check / introspection pattern — user returned to an old session and asked what it was about before deciding whether to continue.
- CWD=brains, no file operations — incidental.

### 943cab68 — prompt.supportsignal / micro

**Type**: META (reclassified from BUILD)
**Subtype**: meta.smoke_test

2 events, 0 minutes. "What is 2+2?" with a StructuredOutput tool response. Classic smoke test — user verifying Claude Code is functional. No meaningful work.

**Key observations**:

- StructuredOutput tool is unusual — this may be a session where structured output mode was being tested.
- Junk-adjacent but technically reveals that smoke tests happen on this project terminal.
- CWD=prompt.supportsignal is incidental — the test has nothing to do with the project.

### bf6e01af — brains / micro

**Type**: RESEARCH (reclassified from BUILD)
**Subtype**: research.personal_advisory

1 event (user_prompt only), 0 tool calls, 0 minutes. User pastes a formatted monitor options report (PHP pricing for Samsung/LG/Xiaomi/Lenovo monitors) and asks "Tell me about each of these monitors. What do you think I should get my staff members?"

**Key observations**:

- Zero tool calls = never BUILD. Pure conversational advisory.
- CWD=brains is incidental — this is personal hardware purchasing advice.
- Context paste opener with structured data (markdown table of monitors with PHP/USD/AUD pricing).
- Philippines purchasing context (PHP currency, staff members) — PII-adjacent (location, business operations).
- Session appears truncated — only 1 event suggests Claude's response may not have been captured, or user abandoned before response completed.

---

## Cross-Session Patterns

### BUILD misclassification: 0/9 correct (0%)

Every session in this batch was registry-classified as BUILD. Zero were actually BUILD. This is consistent with the wave 6-8 pattern where micro/light sessions are almost never BUILD.

### Project attribution unreliable in 6/9 sessions

- a8e8a27e: CWD=signal-studio, work on prompt.supportsignal
- 1f23c692: CWD=app.supportsignal, deliverable in supportsignal-v2-planning
- 3c42e049: CWD=appystack, questions about ecosystem-wide locations
- 2102ddd1: CWD=brains, no real work
- 943cab68: CWD=prompt.supportsignal, smoke test
- bf6e01af: CWD=brains, personal hardware shopping

### New subtype candidates

- `review.design_verification` — verifying prior session's design changes landed correctly
- `research.design_extraction` — Playwright-driven systematic UI audit producing design docs
- `debug.dependency_resolution` — fixing missing dependency/binary installation
- `setup.project_scaffold` — AppyStack create-project execution
- `meta.session_introspection` — user asking Claude what this conversation was about

### Playwright semantic role #6: design_extraction

1f23c692 uses Playwright to systematically crawl own production app and extract reusable design patterns into a report. Distinct from ui_audit (checking if changes look right), external_research (browsing third-party sites), and web_scraping_for_knowledge (producing brain artifacts). This is design intelligence gathering for a rebuild/v2.

### "Say 'Yay'" as session-alive ping

a8e8a27e shows two consecutive "Say 'Yay'" prompts across a day gap. This is a new micro-pattern: user pinging an old session to check if it still works before deciding to continue or close it.

### Voice artifacts catalog additions

- "woo design patterns" = "WUI design patterns"
- "absolute pop step I think Matt plays" = "absolute paths"
- "Ralph Wiggum" = Ralphy (confirmed across multiple sessions)
- "JapThumbRack" = unknown folder name (possibly voice-garbled)
- "Wispr" = Whisper
- "builk" = "bulk" (embedded in project name)

### Cross-session paste as context injection

d9348668 has a 4KB paste of another session's Whisper/Ansible investigation output. This is the cross-paste pattern seen in earlier waves — user brings knowledge from one session into another as input context.

---

## Statistics

| Metric                   | Value                  |
| ------------------------ | ---------------------- |
| Sessions analysed        | 9                      |
| BUILD registry correct   | 0/9 (0%)               |
| New subtypes             | 5                      |
| Junk/near-junk           | 2 (943cab68, bf6e01af) |
| Multi-phase              | 1 (a8e8a27e)           |
| Frustration signals      | 0                      |
| Playwright sessions      | 2                      |
| Cross-session references | 2                      |
| Voice artifacts found    | 6                      |
