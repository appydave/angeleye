---
type: analysis
title: 'Findings W11-05'
description: 'Wave 11 Batch 05: 9 sessions, 11% BUILD accuracy; brains/ CWD dual semantics + prompt:tool ratio as BUILD-negative signal.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings W11-05

**Agent**: W11-05
**Sessions analysed**: 9 (2 moderate, 7 light)
**Date**: 2026-03-23
**BUILD accuracy**: 1/9 (11%) — only c1bb9b58 is genuine BUILD

## Session Summary

| Session ID (short) | Registry | Corrected  | Subtype                        | Scale    | Interest |
| ------------------ | -------- | ---------- | ------------------------------ | -------- | -------- |
| c1bb9b58           | BUILD    | BUILD      | bug_fix_round                  | moderate | medium   |
| f78f14d7           | BUILD    | KNOWLEDGE  | brain_maintenance              | moderate | medium   |
| 3651f99e           | BUILD    | OPERATIONS | poem_execution                 | moderate | medium   |
| de769e18           | BUILD    | RESEARCH   | hardware_setup_troubleshooting | moderate | high     |
| 15c34b92           | BUILD    | RESEARCH   | release_exploration            | light    | medium   |
| aebac8d2           | BUILD    | SETUP      | mcp_integration                | light    | high     |
| 551bdcf8           | BUILD    | RESEARCH   | technology_survey              | light    | medium   |
| 9ec9aa64           | BUILD    | OPERATIONS | directory_cleanup              | light    | low      |
| 5794a3f6           | BUILD    | PLANNING   | daily_planning                 | light    | medium   |

## Key Observations

### O1: BUILD misclassification rate 89% (8/9)

All 9 sessions were classified BUILD by the registry. Only 1 (c1bb9b58 — SupportSignal bug fix round) is genuine BUILD. The 8 misclassified sessions span 5 different parent types: KNOWLEDGE, OPERATIONS, RESEARCH, SETUP, PLANNING. This continues the pattern from waves 6-10 where brains/ CWD sessions are almost never BUILD.

### O2: brains/ CWD has dual semantics

Three sessions use brains/ as a "home terminal" for unrelated work:

- **de769e18**: Stream Deck pedal + Ecamm Live hardware setup (nothing to do with brains)
- **aebac8d2**: Brave Search MCP setup (system config, brain update is secondary)
- **5794a3f6**: Daily planning (brain files are just the storage location)

Four sessions use brains/ as the actual project:

- **f78f14d7**: Brain health checks (genuine brain maintenance)
- **15c34b92**: Release exploration written to brain
- **551bdcf8**: Technology research captured in brain files
- **9ec9aa64**: Brains root directory cleanup

The discriminator: when Bash commands operate on brain file content (ls, read, edit brain docs) = primary. When Bash commands operate on external systems (Stream Deck, MCP config, Ecamm files) = incidental.

### O3: Voice dictation pervasive across all session types

All 9 sessions show voice-dictated prompts. Notable artifacts:

- "anhtropic-claude" = anthropic-claude (f78f14d7)
- "ai-gentic" = aigentive (551bdcf8)
- "mod-y action" = multi-action (de769e18)
- "P and G" = PNG (9ec9aa64)
- "goosew" = goose (aebac8d2 — frustration artifact)
- "Hammer Moon" = HammerMoom (5794a3f6)
- "iCare not EyeCare" = user correcting voice transcription (5794a3f6)

### O4: PII exposure in session data

**aebac8d2**: User pastes Brave Search API key directly in prompt: "here is the brave key: [REDACTED]". This is the second PII category found (API keys, after passport/DOB in wave 10).

### O5: Cross-session paste pattern confirmed

**de769e18**: User pastes full terminal output from a separate flihub Claude session into the brains session to provide context about Ecamm Live folder configuration. The pasted block includes Claude's response, terminal prompt, and git status — a complete cross-session context injection.

### O6: P13+P14 co-occurrence in hardware troubleshooting

**de769e18**: Claude misunderstood "change Ecamm Live" as "change FliHub watch directory" (P13: misunderstood_request). This led to suggesting the wrong fix (P14: wrong_approach). User corrected directly: "No, no, you're missing the point. I need to change Ecamm live, not my application." This is the same P13+P14 co-occurrence pattern noted in wave 8 for handover sessions, but here it occurs in a conversational troubleshooting context.

### O7: POEM executor pattern (\*run N)

**3651f99e**: "*run 105" opener with Task/TaskOutput dominant tool profile (29/62 tool calls). This is the POEM executor workflow: user triggers automated workflow, observes output, returns next day to validate. Consistent with wave 5 finding that `*run`/`\*execute` = OPERATIONS not BUILD.

### O8: Highly conversational sessions have distinctive tool ratios

**de769e18**: 28 prompts vs 32 tool calls (ratio 0.87:1). Normal sessions are 1:6 to 1:20. Near-parity ratio signals "Claude as interactive advisor" rather than "Claude as code agent." This session is essentially a guided troubleshooting conversation with occasional tool use for file inspection.

## Friction Predicates Summary

| Predicate                   | Count | Sessions           |
| --------------------------- | ----- | ------------------ |
| P13 (misunderstood_request) | 2     | de769e18, aebac8d2 |
| P14 (wrong_approach)        | 1     | de769e18           |
| P15 (buggy_output)          | 1     | c1bb9b58           |
| P16 (excessive_changes)     | 0     | —                  |

## New Subtypes Proposed

1. **build.bug_fix_round** — Structured multi-round bug fix with round scaffolding
2. **knowledge.brain_maintenance** — Serial health check and fix cycle across multiple brains
3. **operations.poem_execution** — POEM workflow execution (\*run N)
4. **research.hardware_setup_troubleshooting** — Hardware/software integration troubleshooting
5. **research.release_exploration** — Exploring software releases for interesting features
6. **setup.mcp_integration** — Research, install, configure, test MCP server
7. **research.technology_survey** — Multi-topic web research with brain capture
8. **operations.directory_cleanup** — Directory audit, delete stale files, reorganize
9. **planning.daily_planning** — Morning to-do review, status updates, reprioritize

## Patterns Worth Tracking

- **Prompt:tool ratio as session type signal**: Conversational sessions (>0.5:1) are almost never BUILD. Could be an automated classifier guard.
- **Voice correction as context**: "iCare not EyeCare" — user correcting their own voice transcription in the next prompt. This is a meta-signal that the user is aware of transcription errors.
- **Frustration as mild annoyance**: "you goose" (aebac8d2) is distinctly Australian-English mild frustration. Different from the sustained frustration seen in wave 8 sessions.
