---
type: analysis
title: 'Findings W12-01'
description: 'Wave 12 Batch 01: 9 light sessions, 14% BUILD accuracy; CLAUDE.md auto-load extreme (32 pre-prompt tools) + cross-project handover pattern.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W12-01

**Wave**: 12, Agent 01
**Sessions analysed**: 9
**Date**: 2026-03-23

## Summary

| Session ID | Registry Type | Analysed Type | Scale | Interest |
| ---------- | ------------- | ------------- | ----- | -------- |
| 54342a2e   | RESEARCH      | PLANNING      | light | medium   |
| 7c8c0d3d   | BUILD         | OPERATIONS    | light | medium   |
| 9bd87bb5   | ?             | KNOWLEDGE     | light | medium   |
| d45e4b58   | BUILD         | META          | light | low      |
| de3c8a74   | BUILD         | OPERATIONS    | light | low      |
| 3d8f7e59   | BUILD         | META          | light | high     |
| c613ccca   | BUILD         | BUILD         | light | high     |
| c7b6f60f   | BUILD         | PLANNING      | light | high     |
| 5c9b6248   | BUILD         | SYSOPS        | light | medium   |

**BUILD accuracy**: 1/7 BUILD-classified sessions were genuinely BUILD (14%). Consistent with waves 6-11 for light-scale sessions.

## Key Observations

### 1. CLAUDE.md auto-load anti-pattern — extreme case (3d8f7e59)

Session 3d8f7e59 is the most extreme auto-load anti-pattern in this batch: 32 tool calls (9 Edit, 14 Bash, 9 Read) before the single user prompt "commit this". The session's entire purpose was one commit, but CLAUDE.md auto-load generated 32 unauthorized actions first. The tool-to-prompt ratio of 32:1 from auto-load alone is noteworthy.

A second instance in d45e4b58 had 4 unauthorized pre-prompt tool calls — less extreme but same pattern.

### 2. Cross-project handover pattern (c613ccca)

Session c613ccca demonstrates a well-structured cross-project handover pattern. The user crafted a 2.2KB handover prompt from FliHub to AWB with:

- Explicit context (what FliHub does, what .awb.json contains)
- Specific technical questions (3 numbered items)
- Clear deliverable format (recommend A, B, or C with enough detail to implement)

This is the user deliberately designing prompts for cross-session effectiveness. New subtype: `build.cross_project_handover`.

### 3. POEM executor pattern confirmed (7c8c0d3d)

Another `*run NNN` POEM executor session. Task/TaskOutput dominant (11 of 30 tool calls). Confirms the established pattern: `*run` + Task/TaskOutput = `operations.poem_execution`, not BUILD.

### 4. Design exploration sessions are conversation-heavy (c7b6f60f)

Session c7b6f60f has 11 user prompts and only 22 tool calls (0.5:1 ratio) across 228 minutes. The prompts are dense conceptual discussions about display manifests, composability, layout engines, and API documentation. This is the type of session where prompt:tool ratio is a strong BUILD-negative signal. The session explicitly prepares a plan for a Ralphy build loop — making it an initiator.

### 5. Client management is a distinct knowledge subtype (9bd87bb5)

Lars client session shows a pattern: cold status retrieval (read 7 docs), then return after idle gap with verbal update from a separate in-person meeting. Claude updates engagement log, onboarding plan, and MEMORY.md. New subtype: `knowledge.client_status_review`.

### 6. Voice dictation artifacts catalog additions

| Artifact       | Intended              | Session            |
| -------------- | --------------------- | ------------------ |
| setp           | step                  | 54342a2e, 7c8c0d3d |
| angentic-os    | agentic-os            | de3c8a74           |
| Ralphie        | Ralphy                | c7b6f60f           |
| doucmenation   | documentation         | c7b6f60f           |
| sylstes        | systems               | c7b6f60f           |
| hpttp          | http                  | c7b6f60f           |
| Jen            | Jan                   | 5c9b6248           |
| Hello Text GNT | hello.txt and jan.txt | 5c9b6248           |
| s.st folder    | .stfolder             | 5c9b6248           |
| sync thing     | Syncthing             | 5c9b6248           |

### 7. PII detected

- **9bd87bb5**: Client name "Lars", email "lars@filt.dk", client business details
- **5c9b6248**: Collaborator name "Jan", Syncthing Device ID "6YJA4TQ", machine names "mini-jan", "MacBook-Pro.local"

### 8. CWD incidental rate for brains/

4 of 4 brains/ CWD sessions were incidental (100% in this batch). Consistent with established rule: brains/ at light scale = home terminal, never BUILD.

## New Subtypes Proposed

| Subtype                                         | Evidence                                                       | Sessions |
| ----------------------------------------------- | -------------------------------------------------------------- | -------- |
| planning.story_validation_and_course_correction | BMAD workflow: validate story, find gap, run course correction | 54342a2e |
| planning.design_exploration                     | Deep conceptual design discussion, initiator for build loop    | c7b6f60f |
| operations.poem_execution                       | \*run NNN + Task/TaskOutput (confirmed pattern)                | 7c8c0d3d |
| operations.infrastructure_update                | Targeted config update across infra docs                       | de3c8a74 |
| knowledge.client_status_review                  | Client status retrieval + update cycle                         | 9bd87bb5 |
| meta.claude_md_maintenance                      | CLAUDE.md hints review and memory cleanup                      | d45e4b58 |
| meta.claude_md_auto_load                        | Session dominated by unauthorized pre-prompt auto-load         | 3d8f7e59 |
| build.cross_project_handover                    | Structured handover from another project's session             | c613ccca |
| sysops.tool_setup                               | New tool installation, configuration, documentation            | 5c9b6248 |

## Friction Predicates Summary

| Predicate                     | Fired | Sessions                                                                |
| ----------------------------- | :---: | ----------------------------------------------------------------------- |
| P13 has_misunderstood_request |   2   | 7c8c0d3d (stale workflow understanding), c7b6f60f (scoped to NDIS only) |
| P14 has_wrong_approach        |   0   | —                                                                       |
| P15 has_buggy_output          |   1   | 7c8c0d3d (mock answer generation failure)                               |
| P16 has_excessive_changes     |   1   | 3d8f7e59 (9 unauthorized Edits from auto-load)                          |

## Cross-Session Patterns

- **c613ccca** is a continuation from a FliHub session (structured handover paste)
- **c7b6f60f** is an initiator for a Ralphy build loop (plan doc written)
- **c7b6f60f** also receives a cross-paste from a concurrent AWB session (ir-compiler bug analysis)
- **7c8c0d3d** receives a cross-paste from a prior session (new-incident workflow discrepancy analysis)

Three of 9 sessions have cross-session references — user actively chains sessions.
