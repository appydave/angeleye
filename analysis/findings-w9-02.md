---
type: analysis
title: 'Findings W9-02'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 9, Batch W9-02

**Date**: 2026-03-23
**Sessions analysed**: 9
**Scale distribution**: 1 moderate, 2 light, 6 micro
**Projects**: signal-studio (1), flihub (1), appystack (2), app.supportsignal (1), prompt.supportsignal (2), brains (2)

---

## Session Summaries

### b0b9ca8d — signal-studio / moderate / BUILD

Genuine greenfield BUILD session. User installs AppyStack template on signal-studio, asks about recipes, builds nav-shell with 6 domain entities (companies, sites, users, employees, participants, moments-that-matter), then extends to file-CRUD. Two clear phases: (1) nav-shell + brand research via Playwright on supportsignal.com.au, (2) CRUD entity pages with Agent-based background build. User leaves office for 10 minutes while Claude builds autonomously. Handover ceremony at close via /capture-context skill. 20 Write + 7 Edit = genuine feature construction. Registry BUILD correct.

**New subtype**: `build.greenfield_app` — first-time application scaffolding from a template/recipe.

**Notable**: Playwright dual-purpose in single session — brand research (visiting supportsignal.com.au for colours/style) and visual QA (verifying built UI). User explicitly says "you can just start creating... I'm about to walk out of the office for ten minutes" — autonomous build delegation pattern.

---

### 60bc9223 — flihub / light / PLANNING

Product-owner backlog management session. User operates as PO: adds FR-145 to backlog, invokes /flivideo:po skill to load context, generates developer handovers for FR-145/FR-139/FR-144, receives developer completion report (cross-session paste), audits FR-144 implementation status, generates UX improvements batch handover. All edits target docs/ (backlog.md, changelog.md, PRDs). Zero src/ changes. Registry BUILD wrong.

**New subtype**: `planning.backlog_management` — product-owner managing backlog, generating handovers, receiving developer reports.

**Notable**: Cross-session workflow visible — user pastes a formatted completion report from a parallel developer session (FR-145+FR-139 status table). This session acts as coordinator between PO and developer roles. The detailed FR-144 handover includes full API spec, endpoint signatures, config changes, client components — comprehensive enough to be a PRD.

---

### eb6cbbe3 — appystack / light / ORIENTATION

AppyStack cold start exploration across two phases separated by a 26-hour gap. Phase 1 (20 seconds): "how do I install this application in to a new folder?" — Claude reads project files. Phase 2 (5 minutes): "how do I set this up to use npm?" — step-by-step guided walkthrough, attempted browser launch fails. Session abandoned after browser doesn't appear. Registry BUILD wrong — only 1 Write call, primarily reading.

**Skill gap**: Claude invoked `agent-browser` skill which doesn't exist, producing "Unknown skill: agent-browser" error. This is a gap in the AppyStack tooling.

**Voice artifact**: "browlser" = "browser".

---

### c10ebc70 — app.supportsignal / light / ORIENTATION

Failed orientation session. Claude auto-loaded CLAUDE.md on session start and immediately ran 12 search tool calls (Grep 5x, Glob 4x, Read 3x) looking for epic/task structure — all targeting the wrong epic. User's single prompt corrects: "Uh, none of these are correct. We are on epic eleven." Two more search calls follow, then session abandoned. Registry BUILD wrong — zero edits.

**Anti-pattern**: CLAUDE.md auto-load triggering incorrect context assumptions. Claude's pre-prompt search found the wrong epic, wasting 12 tool calls. The `search_without_read` detection (4 instances) confirms this pattern.

---

### 63fa0330 — appystack / micro / ORIENTATION

User exploring Claude Code `/plan` mode. Three prompts: (1) comparing two plan files, (2) long paste of plan mode UI asking how to enter and select a plan, (3) "What am I doing wrong? How do I see the plan?" + pasted terminal output. Claude reads files but session ends without resolution.

**New subtype**: `orientation.feature_exploration` — user learning a Claude Code feature, not building anything. Distinct from `orientation.cold_start` (project exploration) — this is tool-feature exploration.

**Notable**: All three prompts are pasted terminal output, not voice. Unusual for this user.

---

### 3016dfad — prompt.supportsignal / micro / ORIENTATION

Two-event session. User asks: "have we done a ralph loop in this system, is it in a ux folder" — checking if Ralphy loop output exists. Second prompt is "eit" (likely typo/exit attempt). Zero tool calls. Registry BUILD wrong.

**Voice artifact**: "ralph" = "Ralphy".

---

### 2efc01af — brains / micro / META (junk)

Single event: user_prompt "x". Accidental session start. Zero tool calls. Registry BUILD wrong.

---

### 8e9252e0 — prompt.supportsignal / micro / META (junk)

Single event: "What is 2+2? Reply with just the number." Classic smoke test to verify Claude Code is working. Zero tool calls. Registry BUILD wrong.

---

### fb5dada6 — brains / micro / RESEARCH

Single event: voice-dictated conceptual question about JavaScript boilerplate patterns and npm/GitHub discoverability. Prompt appears truncated: "or NPN, I" (NPN = npm). CWD=brains is incidental. Zero tool calls. Registry BUILD wrong. Likely precursor to the AppyStack template work seen in other sessions.

**Voice artifact**: "NPN" = "npm".

---

## Wave-Level Observations

### 1. BUILD misclassification continues at 89% (8/9)

Only b0b9ca8d is genuine BUILD. All others are misclassified. The pattern holds: micro sessions are never BUILD (0%), light sessions rarely BUILD. The single genuine BUILD session is moderate-scale with 20 Write + 7 Edit targeting product code.

### 2. Micro session taxonomy is stable

Of 6 micro sessions: 2 junk (accidental start, smoke test), 3 orientation (artifact retrieval, feature exploration), 1 research (conceptual question). This matches wave 5 findings: micro sessions split into genuine/junk/machine-initiated. No new micro patterns discovered.

### 3. Product-owner workflow pattern

Session 60bc9223 shows a clear PO workflow: backlog management, handover generation, developer report intake, implementation auditing. This is distinct from PLANNING (designing what to build) — it's coordination work. The cross-session paste of developer reports confirms the PO role operating across parallel sessions.

### 4. Skill gap detection working

Session eb6cbbe3 surfaced "Unknown skill: agent-browser" — a genuine skill gap. The compute-session-shape.py doesn't currently detect failed skill invocations, but the P07 predicate catches it via manual analysis.

### 5. CLAUDE.md auto-load anti-pattern

Session c10ebc70 shows Claude running 12 search calls before the user speaks, all targeting wrong artifacts. This is a systemic issue: Claude reads CLAUDE.md, infers the "current work" incorrectly, and burns tool calls on wrong searches. Detection signal: high tool_use_count before first user_prompt event.

### 6. New subtypes proposed

- `build.greenfield_app` — scaffolding a new app from a template/recipe
- `planning.backlog_management` — PO backlog coordination and handover generation
- `orientation.feature_exploration` — learning a tool feature (not project orientation)

### 7. Voice artifacts catalog additions

- "browlser" = "browser"
- "NPN" = "npm"
- "ralph" = "Ralphy" (previously cataloged but confirmed again)

### 8. AppyStack sessions cluster together

Three of 9 sessions (eb6cbbe3, 63fa0330, fb5dada6) relate to AppyStack exploration — cold start, plan mode, boilerplate concepts. These likely form a temporal cluster of the user learning AppyStack. All are from Feb 2026, predating the signal-studio BUILD session (Mar 2026) which uses AppyStack.

---

## Statistics

| Metric                    | Value                                           |
| ------------------------- | ----------------------------------------------- |
| Sessions analysed         | 9                                               |
| Registry BUILD accuracy   | 11% (1/9)                                       |
| New subtypes proposed     | 3                                               |
| Junk sessions             | 2                                               |
| P13 misunderstood_request | 1 (c10ebc70: wrong epic search)                 |
| P15 buggy_output          | 1 (eb6cbbe3: agent-browser skill doesn't exist) |
| P07 skill_gap             | 1 (eb6cbbe3: agent-browser)                     |
| Cross-session refs        | 1 (60bc9223: developer report paste)            |
| Playwright sessions       | 1 (b0b9ca8d: brand research + visual QA)        |
| Voice artifacts found     | 3 new entries                                   |
