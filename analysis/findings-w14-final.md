---
type: analysis
title: 'Findings W14 Final'
description: 'W14 final: single 15-min SupportSignal RESEARCH session — BMAD Relay design review, workflow position check, new-agent addition.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14 Final Session

**Session**: `00befc58-6638-49f6-9a3e-b41938b0e775`
**Project**: SupportSignal (`app.supportsignal.com.au`)
**Date**: 2026-03-23 07:15–07:30 (15 minutes)
**Classification**: RESEARCH / research.tooling_discovery

## Summary

Short exploratory session with three phases: (1) David reviewed the BMAD Relay design document and got a visual ASCII map of how the relay orchestrator works, (2) invoked `/bmad-help` to check current workflow position (Phase 4 — Implementation, Story 1.1 ready), and (3) asked how to add a new agent to BMAD.

## Friction Event

Claude initially gave an incorrect answer — said agents are "just markdown files" and there is no dedicated command. David corrected with frustration ("Bullshit. I think you just don't know it by the name it is. Isn't it the BMAD Module Builder, BMB?"). A subagent then searched extensively across brains and the upstream BMAD-METHOD repo, eventually finding BMB documentation. BMB is a separate BMAD module with 3 builder agents (Bond/Agent Builder, Wendy/Workflow Builder, Morgan/Module Builder) installable via `npx bmad-method install`.

## Key Observations

- **Registry type mismatch**: Registry tagged this as BUILD but it is pure RESEARCH — zero files written.
- **Voice dictation style**: Prompt 4 has conversational phrasing typical of voice input.
- **Subagent usage**: The Explore subagent fired 28 tool calls searching for BMB across the filesystem — heavy search for a simple lookup, indicating the knowledge was not readily accessible in Claude's loaded context.
- **Skill gap signal**: BMB knowledge exists in brain files (`brains/bmad-method/v6/`) but was not part of Claude's working knowledge for this session. This is a candidate for CLAUDE.md or memory capture in the SupportSignal project.

## Predicates

| Predicate                 | Value | Note                                             |
| ------------------------- | ----- | ------------------------------------------------ |
| P01 has_build_activity    | false | Zero writes                                      |
| P02 has_friction          | true  | "Bullshit" frustration at wrong answer           |
| P03 has_voice_dictation   | true  | Conversational prompt style                      |
| P07 has_subagents         | true  | Explore subagent for BMB search                  |
| P13 misunderstood_request | false | Claude understood — just lacked knowledge        |
| P14 wrong_approach        | true  | Initial answer was incorrect (no command exists) |
