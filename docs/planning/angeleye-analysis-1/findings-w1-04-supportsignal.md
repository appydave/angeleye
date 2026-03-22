# Findings: W1-04 — app.supportsignal (6ba65a37)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: research.workflow-design
- **Confidence**: high
- **Reasoning**: Session opens with two brief BMAD skill invocations (bmad-help, bmad-sprint-planning) that produce one YAML file — that is the only "build" artifact. The remaining 2h+ is deep research into BMAD v4 vs v6 workflow orchestration, culminating in a design document ("bmad-relay-design.md") and memory capture. No code was written, no tests run, no deployments made. The session is fundamentally about researching prior workflow systems and designing a new pattern ("BMAD Relay").

## Session Shape

- **Events**: 224
- **Tools used**: Read 87, Bash 73 (72 read-only, 1 mkdir), Agent 6, Glob 4, Write 3, Edit 3, Grep 2
- **Subagents**: 6 launched (4 Explore, 2 abridge) — 141 of 178 tool calls were subagent work
- **Duration**: ~2h 27m (03:10 to 05:37 UTC)
- **Opening style**: skill invocation (`/bmad-help`) — typed, not voice
- **Closing ceremony**: memory write + design doc consolidation (structured handover)

## Session Phases

### Phase 1 — BMAD orientation (03:10–03:13, ~3 min)

Two skill invocations: `/bmad-help` then `/bmad-sprint-planning`. Reads planning artifacts (epics.md), creates `sprint-status.yaml`. Fast and mechanical — 21 events.

### Phase 2 — Gap (03:13–04:46, ~93 min)

User went away. No events for 93 minutes.

### Phase 3 — Workflow research conversation (04:46–05:37, ~51 min)

This is the real session. User returns with a voice-transcribed question about BMAD context window bootstrapping. Evolves into deep research comparing the user's AppyDave Workflow (BMAD v4, used in POEM-OS and legacy SupportSignal) against BMAD v6's skill-based approach. Six background agents scan both codebases. Produces a design concept called "BMAD Relay" — a baton-pass metaphor for cross-context-window workflow continuity.

## Observations

1. **Voice transcription artifacts present**: "I don't know that I'm near to be mad" (= "I'm using BMAD"), "Be Mad or I Don't Know About It" (= "BMAD, or I don't know about it"). Pervasive in prompts from 04:46 onward.

2. **Heavy subagent delegation**: 141/178 tool calls (79%) were subagent work. User dispatched background Explore agents to scan POEM-OS and legacy SupportSignal codebases while continuing the conversation. This is a sophisticated research pattern — the user treats subagents as research assistants.

3. **The "bash-heavy" classification is misleading**: 72 of 73 Bash calls were read-only (find, ls, cat, wc). The single write Bash was `mkdir`. The tool_pattern should be "read-heavy" or "research".

4. **Skill usage and effectiveness**: `/bmad-help` was effective as an orientation tool — produced a clear status summary in 30 seconds. `/bmad-sprint-planning` produced the sprint-status.yaml. Both worked as designed. The user's meta-question was about whether bmad-help should be needed at all — leading to the relay design.

5. **Cross-project research**: Session reached into 3 projects: current SupportSignal, POEM-OS (`~/dev/ad/poem-os/poem`), and legacy SupportSignal. The user explicitly asked Claude to compare workflow patterns across these codebases.

6. **Design artefact produced**: `bmad-relay-design.md` — a living design document capturing v4 learnings, v6 gap analysis, agent chain design, and the relay metaphor. This is a planning artifact, not code.

7. **Memory capture**: Session closed with a proper ceremony — memory file written (`project_bmad_relay.md`), MEMORY.md updated, design doc consolidated. The user explicitly asked for a "distilled fact sheet" and then asked Claude to merge it into the design doc.

8. **Session name suggested**: User asked for name suggestions; Claude proposed "bmad-relay-design", "relay-orchestrator-research", "bmad-relay-origin", "build-workflow-design-2026-03". The relay concept was the organising idea.

## Patterns Found

- **Skill-then-research**: Opens with skill invocations to orient, then pivots to open-ended research. The skills are a springboard, not the destination.
- **Gap-then-deep-work**: Long idle gap (93 min) followed by intense, focused research. The user likely did the sprint planning, reviewed the output, then came back with deeper questions.
- **Background-agent-as-librarian**: Dispatches multiple Explore agents to scan different codebases in parallel while continuing the conversation thread. This is a research amplification pattern.
- **Voice-driven prompting**: Extended voice transcription with natural speech patterns, questions, and stream-of-consciousness direction. Prompts are long, conversational, and contain embedded instructions.
- **Structured closing**: Explicit request for fact sheet, then consolidation into a single design document, then memory write. This is a deliberate knowledge capture ceremony.

## New Types or Subtypes Proposed

- **research.workflow-design**: Deep investigation into existing systems to design a new workflow/process. Distinct from `research.codebase` (exploring code for understanding) or `knowledge.capture` (just documenting what exists). This session actively synthesised findings into a new design.

## Interest Level

**high** — This session reveals a sophisticated multi-agent research workflow: skill-based orientation, background agent delegation for cross-codebase scanning, voice-driven conversation, and structured knowledge capture. The "BMAD Relay" concept itself is interesting as a cross-context-window continuity pattern. The session also demonstrates how BUILD classification breaks down — the only "built" thing was a YAML file in the first 3 minutes; the remaining 2+ hours were pure research and design.
