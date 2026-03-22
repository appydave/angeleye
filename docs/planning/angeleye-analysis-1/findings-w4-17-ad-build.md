# Findings: W4-17 — ad (e73d7fc7)

## Classification

- **Registry**: BUILD / mixed (10KB)
- **Analysed type**: research.external_reference
- **Confidence**: high
- **Reasoning**: This is a 27-minute session (02:55–03:22 UTC on 2026-02-27) with cwd `/Users/davidcruwys/dev/ad` — the monorepo root, not any specific project. Two user prompts, zero tool calls, zero assistant responses captured. The session is effectively a paste-and-ask session: David pastes terminal history of failed git clone attempts (coleam00/dynamous-engine) plus a full README dump from the Cole Medin / Dynamous "Second Brain" system, asks why he can't access the repo, then follows up asking how to name a clone of a different repo (dynamous-community/workshops). No code was written, no files were read by Claude, no builds occurred. BUILD is incorrect — the session is research and external reference consumption, not construction.

## Session Shape

- Events: 2 total (2 user_prompt, 0 tool_use, 0 assistant_response captured)
- Tools used: none
- Duration: ~27 minutes (02:55:45 to 03:22:39 UTC)
- User prompts: 2
- Opening style: context dump — first prompt is pasted terminal history + full external README content
- Context compactions: 0
- Closing ceremony: none — session ends with a short naming question, no resolution captured

### Prompt Timeline

| #   | Time (UTC) | Prompt                                                                                                                             | Gap     |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | 02:55:45   | [Terminal history of failed git clone attempts + full dynamous-engine README dump + "Why can't I access it?"]                      | —       |
| 2   | 03:17:48   | `would htis makesense git clone git@github.com:dynamous-community/workshops.git cole-medin-workshops or dynabous-workshops or ???` | ~22 min |

## Observations

1. **Project is "ad" — the monorepo root, not a subproject**: The cwd for both prompts is `/Users/davidcruwys/dev/ad`. This is the top-level AppyDave monorepo root. Sessions here are typically cross-cutting: setup, scaffolding, research, or navigation between projects. They are rarely BUILD in the traditional sense. The registry classification of BUILD is not supported by the session content.

2. **Zero tool calls — no assistant work captured**: The JSONL contains only 2 `user_prompt` entries and nothing else. No `assistant_response`, no `tool_use`, no `tool_result`. This means either (a) Claude did respond but the response was not captured in the transcript (session ended before flush, or a streaming/dedup gap), or (b) the session was abandoned before Claude could respond. The 22-minute gap between prompts suggests Claude did respond to prompt 1, but those entries are absent from this file.

3. **Prompt 1 is a terminal-history + full README paste**: The first prompt contains David's shell history (failed attempts to clone `coleam00/dynamous-engine` via SSH then HTTPS, with auth failures) followed by the entire public README of the Dynamous Engine "Second Brain" system. The closing question is "Why can't I access it?" — he is asking Claude to diagnose the git auth failure and explain the access restriction on a repo he does not own.

4. **Dynamous Engine is Cole Medin's personal AI assistant system**: The README describes a Claude Code-based proactive assistant with heartbeats, Obsidian memory, Slack integration, Gmail/Calendar/Asana connectors, and an Agent SDK chat interface. David was researching this to understand its architecture — not to build an exact copy ("build something that's truly yours" is the explicit framing in the README). The brain directory referenced is `~/dev/ad/brain-medin` (which David had already cloned, deleted, and recloned from the terminal history).

5. **Auth failures were user error**: The terminal history shows David tried: (a) HTTPS with no credentials, (b) SSH with wrong format (`ssh://` instead of `git@`), (c) HTTPS with `1@AppyDave@1` as username, (d) HTTPS with `klueless-io` as username. The repository `coleam00/dynamous-engine` is a private or restricted repo (or requires SSH key). The correct approach would be SSH with `git@github.com:coleam00/dynamous-engine.git` and a registered key, or a personal access token for HTTPS. David's question "Why can't I access it?" is asking Claude to explain this.

6. **Prompt 2 is a naming question for a different repo**: After the ~22 minute gap (Claude's response + David reading), the follow-up asks about naming a local clone of `dynamous-community/workshops` — a different, community-facing repo (the workshops repo, not the private engine). David is asking whether to name the local directory `cole-medin-workshops` or `dynabous-workshops` (a typo for `dynamous-workshops`). This is a quick convention question, not a build task.

7. **Brain-medin directory in ad root**: The terminal history shows `brain-medin` being deleted and re-cloned at the monorepo root (`/Users/davidcruwys/dev/ad/`). This is consistent with how David stores external project references as brain directories. The session is the starting point for ingesting the Dynamous Engine as reference material into the brains system.

8. **No BUILD activity anywhere in session**: No files were created, no code written, no tests run, no CI triggered. The entire session is: "I'm trying to clone an external repo to study it, I'm failing at auth, and here's what I'm reading — help me understand it and name the local clone." This is research with an access/naming question, not a build session.

## Patterns Found

- **Terminal-history-as-context pattern**: David pastes his entire recent shell history as the first prompt to give Claude situational awareness. This is a recurring pattern in ad-root sessions — the terminal log is the "what just happened" context that Claude needs before it can help. AngelEye could detect this pattern by checking whether a user_prompt starts with shell prompt indicators (`➜`, `$`, `%`) and contains error output.
- **README dump as research intake**: Pasting a full external README into a prompt is a research intake action. The user is asking Claude to help interpret external architecture, not to build anything. The presence of a long external README with architecture tables is a strong signal that the session type is research, not BUILD.
- **ad-root sessions are cross-cutting**: Sessions with cwd=/Users/davidcruwys/dev/ad are almost always meta-level: navigation, research, tooling setup, monorepo-wide concerns. They are rarely project-specific BUILD sessions. The registry classifier should weight cwd=ad-root away from BUILD toward RESEARCH or ORIENTATION unless there is strong tool evidence of construction (Bash, Edit, Write).
- **22-minute gap between two prompts in a 10KB file**: A large time gap with only 2 captured events and 10KB of content means most of the file content is prompt text (the README paste), not tool exchange. The file size is not an indicator of work done — it is an indicator of paste size.

## New Types or Subtypes Proposed

- **research.external_intake**: A session that consists primarily of (a) pasting external content (README, docs, code) and (b) asking interpretive questions. No tool activity. The user is onboarding external reference material into their mental model, often as a precursor to brain/knowledge curation. This is distinct from `orientation` (which reads internal project files) and from `research.browsing` (which uses WebFetch/WebSearch). The diagnostic signal is: large paste in user_prompt, external URL referenced, no tool calls.

## Subtype Candidates Confirmed

- **research.external_intake**: David pastes a full external system README into Claude, asks why he can't access the source repo, and follows up with a naming convention question. No tool calls. The session is purely interpretive discussion of external material. Confidence: high.

## Type Correction

- **Registry said**: BUILD / mixed
- **Actual**: research.external_intake
- **Why**: BUILD implies construction — writing code, running builds, creating files. None of that occurred. The `mixed` tool_pattern is also wrong (there are zero tool calls). The classifier likely picked up on the long first prompt (shell history + README paste) and cwd=ad and inferred a dev context, but the actual content is entirely research and access troubleshooting. The correct type is research, subtype external_intake — a session where the primary activity is ingesting and discussing external reference material.

## Interest Level

medium — The session itself is a thin two-prompt exchange with no tool calls captured, so it offers little operational data for AngelEye's session classifier. However, it is interesting for two reasons: (1) it is a clear BUILD mis-classification that demonstrates a failure mode — long pastes with no tool calls triggering the wrong type — and (2) it reveals that David was actively researching the Cole Medin / Dynamous Engine architecture in late February 2026, likely as input into AngelEye's own ambient intelligence and heartbeat design. The content of the README paste (heartbeats, Obsidian memory, Slack integration, Agent SDK chat) closely mirrors AngelEye's own architectural goals, suggesting this session was part of the competitive/inspirational research phase that informed AngelEye's design.
