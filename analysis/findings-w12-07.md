---
type: analysis
title: 'Findings W12-07'
description: 'Wave 12 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-07

**Wave**: 12, Agent 07
**Sessions analysed**: 9 (all brains/ CWD, all light scale, all registry BUILD)
**Date**: 2026-03-23

## BUILD Accuracy

**0/9 (0%)** — all 9 sessions reclassified. Consistent with wave 11 pattern: brains/ CWD + light scale = never BUILD.

Reclassified to:

- KNOWLEDGE: 3 (brain_update x2, cross_session_capture, brain_creation)
- OPERATIONS: 2 (config_management, skill_maintenance)
- RESEARCH: 1 (troubleshooting)
- SETUP: 1 (tool_installation)
- ORIENTATION: 1 (personal_advisory)

## Key Observations

### 1. Cross-session knowledge capture is a dominant brains/ workflow (3/9)

Three sessions (c4c30dc9, 56fd3f82, 5eb6cff1) follow the same pattern: paste output from another session into a brains/ session, then Claude integrates the knowledge into brain files. This is the "cross-session knowledge capture" workflow:

- c4c30dc9: Heartbeat/cron discussion pasted → brain files updated
- 56fd3f82: signal-studio EADDRINUSE session pasted → port conflict knowledge captured
- 5eb6cff1: 84KB AngelEye architecture session pasted → angeleye brain files updated

The paste sizes range from 4KB to 84KB. File size is driven by paste content, not session complexity. All three are light scale (17-18 events, 1-10 active minutes).

### 2. Personal advisory via brain files (a3d4ed83)

Session a3d4ed83 is a visa run checklist session where Claude reads DTV brain files and provides personal advisory. Notable for P15 (buggy output): Claude gave wrong TDAC timing advice that contradicted its own brain file. Self-corrected when user challenged. This is the "brain says X but Claude says Y" failure mode.

Also commits angeleye brain files from a prior session — multi-purpose closing ceremony.

PII present: visa details, booking ID (287212160), condo address, proof of funds discussion.

### 3. Brains/ as home terminal confirmed (5/9 CWD incidental)

5/9 sessions have incidental CWD despite all being in brains/:

- 2469e85c: SSH troubleshooting
- 41762dc8: Tool installation
- 9711e0d6: Jump alias config
- 576c9c23: Skill file maintenance
- a3d4ed83: Personal advisory (partial — reads brain files but purpose is advisory)

Only 4/9 actually do brain file work. This confirms the wave 9/11 finding that brains/ CWD at light scale is mostly incidental.

### 4. Voice artifacts catalog additions

| Artifact      | Intended         | Session  |
| ------------- | ---------------- | -------- |
| Illustrations | Instructions     | 2469e85c |
| browseer      | browser          | 41762dc8 |
| Jos           | (truncated word) | 9711e0d6 |
| TDAQ          | TDAC             | a3d4ed83 |

### 5. Autonomous execution pattern (2/9)

Two sessions show high autonomy ratios:

- 9711e0d6: 1 prompt → 17 tool calls (1:17) — jump alias setup
- ed7ad85a: Effectively 0 real prompts → 16 tool calls — brain file creation (no prompt captured, "x" is dismissal)

Both complete their entire task in a single autonomous burst.

### 6. Missing first prompt in transcript-source sessions (ed7ad85a)

Session ed7ad85a has `first_real_prompt: null` in the precomputed shape and starts with tool_use events — the user prompt was not captured during transcript ingestion. The session appears to be autonomous brain file creation (Read 5 → Write 10) triggered by a lost prompt. This is a data quality issue for transcript-source sessions.

### 7. Nested session error encountered (41762dc8)

User attempted `claude skill install vercel-labs/agent-browser` from within a Claude Code session, hitting the "nested sessions share runtime resources" error. The error message and workaround (`CLAUDECODE= claude skill install ...`) are visible in the pasted output. This is a known friction point for tool installation workflows.

### 8. Port-kill pattern recurrence (56fd3f82)

Session 56fd3f82 pastes a signal-studio EADDRINUSE error on port 6041 — confirming the "port-kill sessions are recurring micro pattern" finding from wave 6. The user opened a separate Claude session just to `lsof -ti :6041 | xargs kill -9`. This is an automation candidate.

## Friction Predicates Summary

| Predicate                   | Fired | Sessions                                           |
| --------------------------- | :---: | -------------------------------------------------- |
| P13 (misunderstood_request) |   1   | a3d4ed83 (wrong TDAC timing)                       |
| P14 (wrong_approach)        |   0   | —                                                  |
| P15 (buggy_output)          |   1   | a3d4ed83 (TDAC advice contradicted own brain file) |
| P16 (excessive_changes)     |   0   | —                                                  |

P13+P15 co-occurrence in a3d4ed83: Claude's own brain file had the correct information but Claude gave wrong advice. This is the "context poisoning" inverse — "context available but ignored" failure mode.

## Session Summary Table

| Session  | Events | Active | Registry | Reclassified | Subtype                         | Interest |
| -------- | :----: | :----: | -------- | ------------ | ------------------------------- | -------- |
| 2469e85c |   18   |  32m   | BUILD    | RESEARCH     | research.troubleshooting        | low      |
| 41762dc8 |   18   |  11m   | BUILD    | SETUP        | setup.tool_installation         | medium   |
| 9711e0d6 |   18   |   1m   | BUILD    | OPERATIONS   | operations.config_management    | low      |
| c4c30dc9 |   18   |  10m   | BUILD    | KNOWLEDGE    | knowledge.brain_update          | medium   |
| a3d4ed83 |   18   |  15m   | BUILD    | ORIENTATION  | orientation.personal_advisory   | high     |
| 56fd3f82 |   17   |   1m   | BUILD    | KNOWLEDGE    | knowledge.brain_update          | medium   |
| 576c9c23 |   17   |   2m   | BUILD    | OPERATIONS   | operations.skill_maintenance    | low      |
| 5eb6cff1 |   17   |   7m   | BUILD    | KNOWLEDGE    | knowledge.cross_session_capture | high     |
| ed7ad85a |   17   |   4m   | BUILD    | KNOWLEDGE    | knowledge.brain_creation        | medium   |
