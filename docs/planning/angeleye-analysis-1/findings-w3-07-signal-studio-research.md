# Findings: W3-07 — signal-studio / dev-env troubleshooting (3a24ba02)

## Classification

- **Registry**: RESEARCH / websearch-heavy
- **Analysed type**: research.dev_env_troubleshooting
- **Confidence**: high
- **Reclassification**: partial — type is correct (RESEARCH), but the subtype is wrong
- **Reasoning**: The registry classified this as RESEARCH/websearch-heavy and the tool pattern is correct — brave_web_search dominates (12 of 17 tool_use events, 70.6%). However, this is not project research into signal-studio. The session is entirely about resolving personal dev environment friction: (1) removing GitHub Copilot from VS Code, (2) finding the correct VS Code setting to disable it when it isn't visible in Extensions, (3) getting Ecamm Live's virtual camera to appear in Microsoft Teams. No signal-studio code was read, no architecture was explored, no product decisions were made. The `cwd` being `signal-studio` appears to be an open terminal artefact — David was simply working in that directory when these questions arose. The correct subtype is `research.dev_env_troubleshooting`, not general research or product research.

## Session Shape

- **Events**: 27 total (23 tool_use, 4 user_prompt, 0 progress skipped)
- **Total tool invocations**: 23
- **Web search tools**: mcp**brave-search**brave_web_search x12 (52.2% of all events)
- **Web fetch tools**: WebFetch x3 (13.0%)
- **Other tools**: ToolSearch x4, Bash x2
- **Duration**: ~59 minutes wall clock (2026-03-06T23:16 to 2026-03-07T00:15), with two gaps (~13 min from 23:20 to 23:33, ~2 min from 23:36 to 00:15)
- **Real user prompts**: 4
- **Context continuations**: 0
- **Opening style**: voice-transcribed — "I don't know if we documented it because it was a pain in the ass"
- **cwd**: `/Users/davidcruwys/dev/clients/supportsignal/signal-studio` throughout — no cwd shift

### Tools Breakdown

| Tool                                | Count | %     |
| ----------------------------------- | ----- | ----- |
| mcp**brave-search**brave_web_search | 12    | 52.2% |
| ToolSearch                          | 4     | 17.4% |
| WebFetch                            | 3     | 13.0% |
| Bash                                | 2     | 8.7%  |

### Skills

- None invoked via `/skill` mechanism.

### Phase Structure

The session has three distinct phases corresponding to three troubleshooting questions:

1. **GitHub Copilot removal — first attempt (23:16–23:20)**: David asks how to get rid of GitHub Copilot (voice-transcribed, initially confused with "ChatGPT" and "OpenAI"). Also asks about removing "mini viewer." Agent runs ToolSearch twice and Bash twice — likely checking local config files or settings. No web search yet.

2. **GitHub Copilot removal — forced web search (23:19–23:33)**: David is frustrated that the first answer was wrong ("I don't think you've given me the right thing for this damn GitHub Copilot"). He explicitly demands internet search because Copilot "is an absolute prick of a system to disable." Agent complies: brave_web_search x5, WebFetch x3, brave_web_search x2 more. The frustration and explicit override to search the web is a strong signal.

3. **Ecamm Live virtual camera in Teams (23:33–23:36+)**: David pivots to a second unrelated question — Ecamm Live's virtual camera isn't showing in Teams settings. Agent fires brave_web_search x5 in rapid succession (23:33:01–23:33:17, only 16 seconds apart). David follows up at 23:35:53 with frustrated pushback: "There is no start. You're saying the same as me, right? You don't say a start. What are you fucking on about?" Agent searches again: brave_web_search x2, WebFetch x1.

## Observations

1. **cwd is misleading**: The session is logged under `signal-studio` but zero signal-studio code was touched. No Read, Edit, Write, or Glob tools were called. The project context is an artefact of the open terminal. AngelEye's project attribution based on `cwd` alone will misclassify sessions like this as project-work when they are personal tooling sessions.

2. **Voice transcription artifacts**: "Not OpenAI, ChatGPT. Yeah, OpenAI." — David correcting himself mid-sentence. "It's not them. It's Copilot." The opening prompt is clearly voice with self-corrections baked in. This is a strong voice-transcription signal.

3. **Explicit frustration prompts as classifier signals**: Two of the four user prompts contain explicit frustration: "an absolute prick of a system to disable. They want you to use their shit" and "What are you fucking on about?" These are strong signals that the agent's answers were not landing and that web search was being demanded as a corrective action. The session has a frustration arc.

4. **Rapid burst web search pattern**: Phase 3 shows 5 brave_web_search calls within 16 seconds (23:33:01–23:33:17). This burst pattern — many searches in very short succession — likely reflects the MCP tool executing multiple parallel queries for a single user question. It is distinct from the sequential search pattern in Phase 2 where searches were spaced by fetch calls.

5. **No project artefacts produced**: The session produced zero file writes, zero edits, zero commits. It is entirely consultative. For AngelEye, this means the session has no downstream audit trail linking it to any code change in signal-studio. If a classifier tried to attribute signal-studio churn to this session, it would find nothing.

6. **Small session, low event count**: 27 events across ~59 minutes with a last_active of 00:15 (nearly an hour after the last recorded event at 23:36). The gap suggests the session may have been left idle after the Ecamm question — David possibly solved the issue offline or stopped using Claude for it.

7. **Multi-topic dev environment session**: Both Copilot and Ecamm/Teams are personal developer environment concerns, not project concerns. These topics are completely unrelated to each other and to signal-studio. The session is a general help desk interaction that happened to occur in the signal-studio terminal.

## Patterns Found

- **Ambient terminal as false project signal**: David opened Claude in a signal-studio terminal directory but asked questions entirely unrelated to that project. The `cwd` is not a reliable project indicator when questions are personal dev environment troubleshooting. AngelEye needs a discriminator: if no project files are touched AND web search dominates AND questions are about external tools (VS Code, Teams, Ecamm), classify as `research.dev_env_troubleshooting` regardless of `cwd`.
- **Frustration-driven search escalation**: The pattern where David explicitly says "you need to search because [X] doesn't work the obvious way" appears in phase 2. This is a failure-recovery prompt — the first answer was wrong, and David is directing the agent to use a better strategy. AngelEye could detect this pattern (explicit search demand after a prior answer) as a signal of agent answer failure.
- **Rapid burst search**: Five brave_web_search calls in 16 seconds is a distinct tool pattern that differs from interleaved search+fetch. It may indicate the MCP tool is fanning out parallel searches rather than sequential investigation. This pattern appears again in this session after the frustration prompt.
- **No-artefact consultative session**: A session where zero files are created, edited, or committed and the entire value is verbal answers. These sessions are structurally distinct from BUILD or even most RESEARCH sessions. They could be tagged as `consultative` to separate them from sessions that produce lasting change.

## New Types or Subtypes Proposed

- **research.dev_env_troubleshooting (new candidate)**: Sessions where the primary activity is asking how to configure or fix developer tooling (VS Code extensions, virtual cameras, IDE settings, OS settings) rather than researching a project domain. Distinguishing signals: (a) no project files touched, (b) web search dominates, (c) questions reference external tools by name (Copilot, Teams, Ecamm, VS Code), (d) zero artefacts produced. Distinct from `research.how_it_works` (which is about understanding a technology) because the goal is resolution of a personal friction point, not knowledge building.
- **research.consultative (new candidate)**: A cross-cutting tag for any research session that produces zero file artefacts. Not a full subtype replacement — `research.dev_env_troubleshooting` is still the primary type here — but a useful secondary tag for sessions where Claude is used as a help desk rather than a research tool.

## Subtype Candidates Confirmed

- **research.websearch_dominant**: Confirmed as a reliable signal. 12 brave_web_search calls in a 27-event session (52.2%) with no code-reading tools is a clear websearch-dominant fingerprint. However, this session shows that websearch-dominant alone does not imply project research — the topic must be evaluated to determine the correct subtype.

## Interest Level

medium — This session is a clean example of a dev environment troubleshooting session misattributed to a project via `cwd`. It is short and structurally simple, making it a good classifier test case. The primary value for AngelEye is (1) demonstrating cwd-as-false-project-signal, (2) illustrating the frustration escalation pattern as an agent-failure signal, and (3) providing a candidate case for the `research.dev_env_troubleshooting` subtype. The session itself contains no signal-studio insight.
