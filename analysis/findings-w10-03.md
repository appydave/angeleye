---
type: analysis
title: 'Findings W10-03'
description: 'W10-03: 9 sessions, 43% BUILD accuracy; proposes 5 subtypes including deep_then_build, brain_audit_and_design, content_capture.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 10 Agent W10-03

**Wave**: 10 (forward)
**Agent**: W10-03
**Sessions analysed**: 9
**Date**: 2026-03-23

## Summary Statistics

| Metric                     | Value                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| Sessions analysed          | 9                                                                            |
| BUILD registry accuracy    | 3/7 (43%) — higher than wave average, consistent with moderate/heavy pattern |
| RESEARCH registry accuracy | 1/1 (100%)                                                                   |
| New subtypes proposed      | 5                                                                            |
| Friction predicates fired  | P13: 1, P14: 1, P02: 1                                                       |
| Multi-phase sessions       | 9/9 (100%)                                                                   |
| CWD incidental             | 2/9 (22%)                                                                    |
| Sessions with brain writes | 4/9 (44%)                                                                    |

## BUILD Accuracy Assessment

Registry classified 7 sessions as BUILD, 2 as other (N/A for angeleye, RESEARCH for one brains session).

**Correct BUILD**: 3/7 (43%)

- 18665260 (angeleye) — genuine build campaign, 15 subagents, product code written
- a88bb8a6 (prompt.supportsignal) — UI build with visual QA via Playwright
- a6fee7b2 (prompt.supportsignal) — build campaign with mid-session pivot

**Incorrect BUILD**: 4/7 (57%)

- d5e19d58 — RESEARCH (deep research producing skills as deliverables, not product code)
- 3d481502 — SYSOPS (dev environment setup: pnpm, Tailscale, Stream Deck)
- f8a2bdb2 — KNOWLEDGE (brain audit and semantic tagging design)
- febf22a3 — KNOWLEDGE (Ecamm Live content capture, iTerm config, JSONL transcript recovery)

**Pattern**: The 43% accuracy for this batch is higher than the wave 6-9 average (~11-25%) because this batch is all moderate/heavy sessions. Confirms the established scaling pattern: accuracy improves with session complexity.

## Per-Session Observations

### S1: 18665260 — AngelEye build campaign (heavy, BUILD)

**Key observation**: Exemplary campaign execution with 3 distinct phases and 15 subagents. Opens with structured handover table, fires work units via subagents, then spawns 4 background agents for code quality, test audit, design inspiration, and roadmap.

**Cross-project reads**: The design inspiration phase reads 4 SupportSignal mock landing pages (v4-cockpit, v6-synthesis, v7-noir, v16-console) from a completely different project for UI inspiration. This is a **design extraction** pattern — using Playwright-less Read to study other project designs.

**Session chain**: Clear chain member — receives SESSION_HANDOVER.md, produces handover + wave 5/6 AGENTS.md files.

### S2: 192c4cbc — AngelEye cross-worktree campaign (moderate, BUILD)

**Key observation**: P13 (misunderstood_request) fires — Claude jumps ahead and fixes bugs immediately instead of discussing them first as user expected. User says: "I'm a little confused. I didn't think you were going to fix it straight away."

**Cross-worktree pattern**: Work spans angeleye (main), angeleye-wave2, and angeleye-wave3 worktrees. The project_inference correctly identifies this as cross-project by returning `/dev/ad/apps` as inferred project.

**Handover chain**: Receives handover, produces handover with exact session 4 start prompt. Structured SESSION_HANDOVER.md is the cross-session continuity mechanism.

### S3: d5e19d58 — QA skills deep research (moderate, RESEARCH)

**Key observation**: BUILD is wrong — this is RESEARCH that produces tangible skill artifacts. The session opens with a deep research question, runs parallel web searches and local exploration, then builds 3 complete skills (code-quality-audit, test-quality-audit, architectural-review) and creates a new brain (dev-practices).

**New subtype proposed**: `research.deep_then_build` — sessions where research dominates the activity but the deliverable is a built artifact (skill, brain, etc.), not a report or conversation.

**Skill gap detection**: The session explicitly starts by asking "What skills do we currently have for QA?" — discovering a gap and then filling it. Textbook skill_gap_signal.

### S4: 3d481502 — Dev environment setup (moderate, SYSOPS)

**Key observation**: BUILD is wrong — this is a 5-topic SYSOPS session covering JS package managers, pnpm install, Stream Deck exploration, Tailscale VPN setup, and AI conventions check. The CWD=brains is incidental (home terminal).

**Voice artifacts**: "bunn" = bun, "RAAF Wigam" = Ralph Wiggum. The user's voice dictation consistently produces creative misspellings.

**Transcript source**: Uses `source: "transcript"` (not `hook`), indicating this was backfilled from raw JSONL rather than captured via hooks.

### S5: a88bb8a6 — WUI theming with Playwright QA (moderate, BUILD)

**Key observation**: BUILD is correct. Notable for crash recovery opener — user pastes 29KB of prior session output to recover context. Then builds theme/styling abstraction with Playwright visual QA.

**Playwright semantic role**: ui_audit — clicks through mock landing pages, takes screenshots for visual comparison. 15 Playwright calls (click/screenshot/navigate pattern).

**Voice artifact**: "cinnut in Push" = "commit and push". Novel voice artifact for the catalog.

### S6: a6fee7b2 — WUI build with architectural correction (moderate, BUILD)

**Key observation**: P14 (wrong_approach) fires — Claude modifies code directly in a meta-driven/configured system where data should drive behavior. User corrects: "Hold on, why are you changing code? This is a configured system." Claude was writing logic to solve a problem that should be solved by adjusting YAML/JSON configuration.

**Build-to-plan pivot**: User redirects to EnterPlanMode to design the missing schema inference feature for round 12 instead. Demonstrates how wrong_approach can productively redirect a session.

**Task tool usage**: Task(7) calls indicate orchestrated work units, consistent with the worktree-based Ralphy pattern even without explicit /ralphy invocation.

### S7: f8a2bdb2 — Brain audit and semantic design (moderate, KNOWLEDGE)

**Key observation**: BUILD is wrong — this is KNOWLEDGE. Session audits all 37 brains for frontmatter consistency, designs a hybrid tagging ontology (global core + per-brain extension), then executes via Task-based parallel workers.

**Task-heavy pattern**: Task(21) is the dominant tool — the brain audit is orchestrated via parallel Task workers, a pattern not common in other session types. This is the pre-Agent tool equivalent of the subagent pattern.

**Cross-session research paste**: User pastes a detailed summary of prior semantic knowledge research (Graph RAG, LazyGraphRAG, Cognee, GLiNER) for Claude to synthesize.

### S8: febf22a3 — Ecamm Live content capture (moderate, KNOWLEDGE)

**Key observation**: BUILD is wrong — this is KNOWLEDGE/content_capture. The session is AngelEye-relevant: user manually searches JSONL files for a prior session transcript (the exact use case AngelEye aims to solve). ToolSearch(3) early shows the user looking for tools to access prior session data and finding none.

**Multi-day session**: 23-hour idle gap between day 1 (content capture) and day 2 (commit check). 1538-minute duration but only 43 active minutes.

**CWD incidental**: brains is home terminal. Work spans iTerm config, JSONL transcript recovery, and content capture for Ecamm Live video/email.

### S9: 9d7c9ad6 — Agent auth landscape survey (moderate, RESEARCH)

**Key observation**: RESEARCH registry correct. Remarkably dense session — 4 parallel research agents produce a comprehensive 245-line landscape survey document in just 11 minutes of active time.

**User-initiated evaluation**: User pastes an entire website (Agent Auth Protocol) that someone shared in a community group, asks Claude to evaluate it, then requests systematic research comparing it to A2A, MCP OAuth, and per-agent identity approaches.

**File size inflation**: 110KB file for only 87 events because subagent output blobs (MCP OAuth research summary alone is ~3K words) are stored inline.

## New Subtype Proposals

| Subtype                            | Sessions | Description                                                                                  |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `research.deep_then_build`         | d5e19d58 | Research-dominant session where deliverable is a built artifact (skill, brain), not a report |
| `build.ui_with_visual_qa`          | a88bb8a6 | BUILD session using Playwright for visual QA of UI changes                                   |
| `build.campaign_with_pivot`        | a6fee7b2 | Campaign that pivots mid-session due to user correction                                      |
| `knowledge.brain_audit_and_design` | f8a2bdb2 | Systematic brain content auditing and metadata design                                        |
| `knowledge.content_capture`        | febf22a3 | Capturing content/learnings from prior work for video/email/documentation                    |

## Novel Patterns

### 1. Cross-project design reads

Session 18665260 reads SupportSignal mock landing pages for AngelEye UI design inspiration. No Playwright needed — just Read calls to HTML files in another project. This is a variant of the design_extraction pattern that doesn't require a browser.

### 2. Handover chain via SESSION_HANDOVER.md

Sessions 18665260 and 192c4cbc demonstrate a structured handover chain: each session reads SESSION_HANDOVER.md, works, then writes an updated handover with the exact start prompt for the next session. This is a formalized cross-session continuity mechanism that could be an AngelEye feature.

### 3. Manual JSONL transcript recovery (AngelEye use case)

Session febf22a3 shows the user manually searching JSONL files with Bash to recover a prior session's content. This is exactly what AngelEye's context publisher is designed to automate. The user even pastes the session ID and searches `~/.claude/projects/` — the workflow AngelEye replaces.

### 4. Task vs Agent tool evolution

Session f8a2bdb2 (Feb 28) uses Task(21) for parallel orchestration. Sessions from March 15+ use Agent for the same pattern. This is a tooling evolution: Task was the pre-Agent tool for parallel work dispatch.

### 5. 100% multi-phase rate at moderate+ scale

All 9 sessions in this batch are multi-phase. This confirms the wave 6 finding that moderate+ sessions are almost always multi-phase. Single-label classification loses information at this scale.

## Voice Artifacts (new additions)

| Artifact         | Intended          | Session  |
| ---------------- | ----------------- | -------- |
| "cinnut in Push" | "commit and push" | a88bb8a6 |
| "bunn"           | "bun"             | 3d481502 |
| "RAAF Wigam"     | "Ralph Wiggum"    | f8a2bdb2 |
| "MCP-O-OFF"      | "MCP OAuth"       | 9d7c9ad6 |

## Friction Predicates Summary

| Predicate                   | Count | Details                                                                                    |
| --------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| P13 (misunderstood_request) | 1     | 192c4cbc — Claude jumped ahead and fixed bugs before user expected                         |
| P14 (wrong_approach)        | 1     | a6fee7b2 — Claude modified code in a meta-driven system instead of adjusting configuration |
| P02 (frustration_signals)   | 1     | a6fee7b2 — overlaps with P14                                                               |

P13-P14 in this batch are distinct failure modes: P13 is a timing/sequencing error (doing the right thing too early), while P14 is an architectural misunderstanding (solving a problem with the wrong technique for the system's paradigm).
