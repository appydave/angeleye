# Findings: W1-03 — app.supportsignal oversight (a4fd902a)

## Classification

- **Registry**: ORIENTATION / read-heavy
- **Analysed type**: knowledge.advisory
- **Confidence**: high
- **Reasoning**: This is an ongoing advisory session where Claude acts as a BMAD oversight advisor. The user resumes the session across multiple days (Mar 20-22) to get guidance on navigating BMAD agent workflows. The 5 Edits are all to planning docs and MEMORY.md — no application code was written. The session is dominated by reading planning artifacts (111 Reads) and advising the user on which BMAD agents to invoke next. It is not ORIENTATION (which implies a cold start/exploration); it is a long-lived knowledge advisory session.

## Session Shape

- **Events**: 269
- **Tools used**: Read (111), Bash (38), brave_web_search (14), Glob (7), Agent (6), Edit (5), Grep (1), ToolSearch (1)
- **Duration**: ~47 hours wall-clock (2026-03-20T06:59 to 2026-03-22T05:56), but with long gaps — active time estimated at 3-4 hours across 3 sittings
- **Opening style**: Skill invocation (`/bmad-oversight`), typed follow-up prompts with heavy voice transcription artifacts
- **User prompts**: 36
- **Subagents spawned**: 7 (6 explore agents for parallel doc reading, 1 research agent for MCP investigation)

## Session Timeline

### Sitting 1 — Mar 20, 07:00 (15 min)

- `/bmad-oversight` skill invoked — loads all SupportSignal planning docs (PRD, UX, architecture, build phases, engineering principles)
- Claude loads context, reports locked decisions it will watch for
- User asks to generalise the BMAD oversight prompt pattern into reusable components
- Claude reads the command file and role doc, produces a 7-component breakdown of the oversight pattern

### Sitting 2 — Mar 22, 02:25-03:21 (~1 hour)

- User resumes with "What is this conversation about?" (context recovery after 2-day gap)
- Asks whether the pre-build section is big enough for its own video or should combine with Epic 1
- Pastes in full terminal output from a Bob (Scrum Master) session — Claude reviews it as oversight advisor
- Claude spots that Bob skipped the Implementation Readiness Check gate, advises Option A (run it)
- User pushes back on "fresh window" advice — Claude concedes the point
- User pastes Winston readiness check results and sprint planning output
- Claude reviews sprint-status.yaml, confirms correctness, identifies what's left before building
- Session naming discussion — user picks from 4 suggestions

### Sitting 3 — Mar 22, 05:28-05:56 (~30 min)

- User asks Claude to do a deep knowledge check of all SupportSignal docs via background agents
- 6 background agents dispatched: BMAD skills audit, Signal Studio analysis, POEM workflows, planning docs, epic readiness, and MCP research
- Agents read extensively across 4+ repositories (signal-studio, prompt.supportsignal, supportsignal-v2-planning, app.supportsignal)
- MCP research agent uses 14 brave_web_search calls to produce comprehensive MCP recommendations for Epic 1
- Session ends with prioritised MCP setup recommendations (Supabase MCP, shadcn MCP as must-haves)

## Observations

1. **Multi-day advisory session**: This is a persistent advisor that the user returns to across days. Not a one-shot task. The "What is this conversation about?" prompt on day 2 is a context recovery pattern.
2. **Voice transcription pervasive**: Multiple prompts show voice artifacts ("Is where we're at in the system", "And that you're also grounded in the BMAD over site command", "to get it going in the correct direction"). The user is talking to Claude while working in other terminal windows.
3. **Terminal paste-in pattern**: The user pastes full terminal output from other Claude sessions into this advisory session for review. This is a deliberate dual-window workflow (one session does work, this session reviews).
4. **Subagent-heavy**: 7 subagents spawned, including 6 parallel explore agents and 1 research agent. The user explicitly asked "Don't use abridgments. Just use a bunch of background agents" — showing awareness of agent dispatch strategies.
5. **BMAD agent orchestration**: The session demonstrates sophisticated multi-agent workflow management — Winston for readiness, Bob for sprint planning, this session as oversight, and awareness of Amelia (developer) as next.
6. **File size explained**: The 504KB size comes from the massive subagent_stop events at lines 267-268, which contain the full MCP research report inline (the subagent output is embedded in the event). A single subagent_stop event is ~95KB.
7. **Edits are lightweight**: 5 Edits — 3 to bmad-oversight-role.md (updating the correction history table) and 2 to MEMORY.md. These are advisory artifacts, not code.
8. **Closing ceremony**: Memory write (MEMORY.md edit) — the session captures context for future resumption. The final stop message is a clean summary with actionable next steps.

## Patterns Found

- **Advisory session pattern**: A long-lived session that serves as a "second pair of eyes" for multi-agent workflows. Not building, not researching in isolation — reviewing the output of other sessions.
- **Paste-in review loop**: User works in Window A (with BMAD agent), pastes output into Window B (this advisory session), gets corrections, pastes corrections back into Window A.
- **Context recovery prompt**: "What is this conversation about?" after a multi-day gap — a reliable signal of session resumption.
- **Voice-driven advisory**: The user talks through decisions aloud, using voice transcription. This makes prompts longer and less structured than typed prompts, but the intent is clear.
- **Background agent fan-out**: User explicitly requests parallel agent dispatch for comprehensive knowledge grounding — a power-user pattern for loading context efficiently.
- **Subagent output inflation**: Subagent results embedded in stop events cause massive line sizes. This is the primary driver of the 504KB file size, not a large number of events (only 269 lines).

## New Types or Subtypes Proposed

- **knowledge.advisory**: A session where Claude acts as a persistent advisor/reviewer for work happening in other sessions. Characterised by: read-heavy, paste-in review, correction drafting, multi-day resumption, no application code produced. Distinct from ORIENTATION (which is about understanding a new codebase) and RESEARCH (which is about discovering facts). This is about applying known decisions to review ongoing work.

## Interest Level

**high** — This session demonstrates a sophisticated multi-agent oversight workflow that is central to the BMAD methodology. The paste-in review pattern, voice-driven advisory style, and multi-day resumption pattern are all significant for understanding how power users orchestrate Claude Code sessions. The subagent output inflation finding is also important for AngelEye's storage and parsing design.
