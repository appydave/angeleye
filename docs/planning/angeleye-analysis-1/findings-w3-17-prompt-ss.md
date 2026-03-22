# Findings: W3-17 — prompt-ss (72977bff)

## Classification

- **Registry**: BUILD / mixed (219KB)
- **Analysed type**: build.debug_loop
- **Confidence**: high
- **Reasoning**: This is a prolonged debugging and iterative-fixing session on the POEM Executor — a Node.js CLI that compiles YAML workflow definitions and runs them via the Agent SDK. The session spans ~7 hours of clock time (07:18 to 14:09 UTC) across 56 user prompts, 204 tool calls, and 3 context compactions. The work is code-first throughout: David pastes CLI error output, Claude reads source files, edits them, and David re-runs the command. There is no orientation, no research phase, and no separate planning artifact produced. The dominant interaction pattern is the tight `observe error → read source → edit → re-run → observe new error` loop. Late in the session the conversation broadens into architectural discussion (data output shapes, JSON schema enforcement, auto-inject vs manual schema instructions), but even these discussions immediately result in code edits (Edit × 56 total). This is BUILD, specifically the debug_loop subtype — not KNOWLEDGE or RESEARCH.

## Session Shape

- Events: 260 (204 tool_use, 56 user_prompt)
- Tools used: Read (81), Edit (56), Bash (32), Glob (13), Grep (11), Write (3), Task (4), TaskOutput (3), TaskStop (1)
- Duration: ~7h clock time (07:18 to 14:09 UTC), broken into 4 sub-sessions by 3 context compactions. Large gap between 08:18 and 10:32 (2h 14m).
- User prompts: 53 real prompts + 3 compaction summaries
- Opening style: handover context paste — David opens by dropping the prior session's handover summary (from the `/handover-pattern` skill), then immediately pastes CLI error output
- Context compactions: 3 (at 07:53, 10:50, 13:21)
- Closing ceremony: open-ended — session ends with David questioning whether a `runCompiled` vs `run` distinction was actually completed

### Prompt Timeline

| #   | Time  | Prompt                                                                                                   | Gap        |
| --- | ----- | -------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | 07:18 | Prior session handover summary paste (agent-sdk reliability improvements)                                | —          |
| 2   | 07:18 | "wht is going on here:" + `error_max_turns` CLI output for incident 105                                  | <1 min     |
| 3   | 07:20 | "Um, why would you not go and look at the data before making that assumption?"                           | 2 min      |
| 4   | 07:23 | Provides mock-data path, asks about changes to the compiler + logging                                    | 3 min      |
| 5   | 07:26 | Run number not incrementing bug — "I had the old log open and it just started refreshing on me"          | 3 min      |
| 6   | 07:29 | "Why doesn't the data have any answers? Our gate should have seen that"                                  | 3 min      |
| 7   | 07:32 | "It's not done with the run command; it's done with the execute command."                                | 3 min      |
| 8   | 07:34 | "Oscar gave me that command earlier. Why did Oscar do that"                                              | 3 min      |
| 9   | 07:35 | `--debug` unknown option error on `compile-run`                                                          | 1 min      |
| 10  | 07:37 | "new problem?" — JSON not valid warning on `compile-run`                                                 | 2 min      |
| 11  | 07:37 | "remember if it is config, then the issue is in yaml not code"                                           | <1 min     |
| 12  | 07:38 | Still not fixed — JSON not valid persists                                                                | 1 min      |
| 13  | 07:38 | "continue"                                                                                               | <1 min     |
| 14  | 07:48 | "Look at the problem we just had above. You should have found this."                                     | 10 min     |
| 15  | 07:51 | "I want you to fix your own capabilities. Why fix something that'll only be broken again?"               | 3 min      |
| 16  | 07:53 | [COMPACTION 1]                                                                                           | 2 min      |
| 17  | 07:56 | "yes, fix the workflow YAML now"                                                                         | 3 min      |
| 18  | 08:12 | "Use a background agent to bundle up the workflow — all data files, source code, JSON docs concatenated" | 16 min     |
| 19  | 08:18 | "What is this taking so long?" — task agent concern                                                      | 6 min      |
| 20  | 10:32 | "I asked you to fix something about three or four times, but it never seems to work"                     | 2h 14m gap |
| 21  | 10:41 | "Are the tests in such a format that I could run a command and watch them update?"                       | 9 min      |
| 22  | 10:42 | "Why do I have two compiled JS files, one called tmp and one not?"                                       | 1 min      |
| 23  | 10:43 | Points to `.new-incident.tmp-compiled.js` — "Then why do I see…"                                         | 1 min      |
| 24  | 10:44 | "So should I delete the other compiled prompt for now?"                                                  | 1 min      |
| 25  | 10:45 | Pastes fresh `compile-run` CLI output                                                                    | 1 min      |
| 26  | 10:50 | [COMPACTION 2]                                                                                           | 5 min      |
| 27  | 10:56 | "We got a double nesting issue" — output shape problem                                                   | 6 min      |
| 28  | 11:09 | "Are we trying to push our YAML configuration system beyond what it's capable of?"                       | 13 min     |
| 29  | 11:09 | "How do you map the idea that this is a simple workflow but also has to be a compiled application?"      | <1 min     |
| 30  | 11:16 | "We're still trying to define where to put data" — data shape discussion                                 | 7 min      |
| 31  | 11:20 | "I have absolutely no control of shape" — key/array nesting confusion in output                          | 4 min      |
| 32  | 11:24 | "Update the usage document, then the YAML, then probably tests"                                          | 4 min      |
| 33  | 12:54 | "How do I execute?"                                                                                      | 90 min gap |
| 34  | 12:57 | "can you give me a command for 105"                                                                      | 3 min      |
| 35  | 12:58 | "I never asked you to run the command, I said give me the command."                                      | 1 min      |
| 36  | 13:01 | "what is this?" — points to `bundle-compiled-work` file                                                  | 3 min      |
| 37  | 13:04 | "Why don't we have any data for the analysis rows?"                                                      | 3 min      |
| 38  | 13:20 | "When you look at the data, do you think predicate=false is true in all cases?"                          | 16 min     |
| 39  | 13:21 | [COMPACTION 3]                                                                                           | 1 min      |
| 40  | 13:28 | "these are examples of previous shapes" — provides reference output paths                                | 7 min      |
| 41  | 13:29 | Points to `ex20260217-002--105-mp--complete.json` as reference                                           | 1 min      |
| 42  | 13:30 | "If you modified the YAML document, would you be able to get similar shapes?"                            | 1 min      |
| 43  | 13:31 | "We are not meant to be merging data or doing anything computationally intensive"                        | 1 min      |
| 44  | 13:36 | "do the analysis row — why is interview difficult?"                                                      | 5 min      |
| 45  | 13:37 | "nested would be good"                                                                                   | 1 min      |
| 46  | 13:40 | "If you do hard-coded logic for this workflow, how is it meant to work with any other workflow?"         | 3 min      |
| 47  | 13:41 | "lets test it out"                                                                                       | 1 min      |
| 48  | 13:48 | Fresh `compile-run` output — `extractJson` failure (LLM returned prose not JSON)                         | 7 min      |
| 49  | 13:51 | "Do we not have guards around bad data like JSON parsing?"                                               | 3 min      |
| 50  | 13:53 | "What does the word 'prose' mean?" + asks about structured output / JSON schema features                 | 2 min      |
| 51  | 13:57 | Raises concurrency concern: file name conflicts if two runs happen simultaneously                        | 4 min      |
| 52  | 13:59 | "What happens if the prompt itself dictates the output format?"                                          | 2 min      |
| 53  | 14:02 | "Is it something you auto-inject, or is it something we manually put on every prompt?"                   | 3 min      |
| 54  | 14:03 | "ok do it"                                                                                               | 1 min      |
| 55  | 14:05 | "What happened to the json_schema debug file? Have we removed that?"                                     | 2 min      |
| 56  | 14:08 | "There's a difference between runCompiled and run. I don't think we did a fully compiled system."        | 3 min      |

## Observations

1. **Continuation of prior session via handover pattern**: Prompt 1 is the output of the `/handover-pattern` skill — a structured multi-section summary of the prior session's changes (agent-sdk.js fix, retry delay, warn events, debug file naming, Oscar docs). This was produced at the end of the previous session and dropped in at the start of this one. The handover includes a "most important next action" — running incident 105 from a standalone terminal. Prompt 2 is immediately that run, with its error output.

2. **error_max_turns as the starting bug**: The session opens on `error_max_turns` from the `generate-during-questions` substep. The prior session had fixed `error_during_execution`; now a new error surfaces. Claude initially made a code change without looking at the data first — David called this out explicitly: "Um, why would you not go and look at the data before making that assumption?" This is a recurring QA pattern in David's sessions: he catches Claude skipping the data-before-assumption step.

3. **Run number regression introduced by Claude**: Prompt 5 reveals that Claude had broken the run number incrementing logic in a prior change. David noticed because the old log file started refreshing — the new run was overwriting the same `ex20260219-001` prefix. This is a classic regression: Claude fixed the debug file naming (per the handover) but disrupted the run counter logic.

4. **Command confusion: `run` vs `compile-run` vs `execute`**: The session reveals that the POEM executor has multiple CLI commands (`run`, `compile-run`, `compile`, `execute`) that David and Claude are not always aligned on. Prompt 7 ("It's not done with the run command; it's done with the execute command") and prompt 22 ("Why do I have two compiled JS files?") show persistent confusion about which command produces which artifact. Oscar (the agent) had given David the wrong command in a prior session — David asks "Why did Oscar do that?" at prompt 8.

5. **Background Task agent used for bundling**: At prompt 18, David asks for a background agent to concatenate all data files, source code, and JSON docs. Claude used `Task` (4 calls), `TaskOutput` (3 calls), and `TaskStop` (1 call) — this is the only use of background agents in the session. David became impatient at prompt 19 ("What is this taking so long?") — the bundling task apparently ran longer than expected.

6. **2h14m gap and "fix something three or four times" frustration**: Prompt 20 (10:32) resumes after a long break. David explicitly expresses frustration that a fix he'd requested repeatedly had never worked. This suggests either Claude was not writing to the right code path, was not persisting changes across context resets, or the edit was correct but the wrong compiled file was being run (a recurring source of confusion in this session).

7. **Double nesting and output shape architecture discussion**: From prompts 27-32, the session transitions from bug-fixing to an architectural discussion. The output shape from the YAML-compiled workflow has inconsistent nesting — `beforeEventQuestions: [{key, array}]` vs expected flat structures. David and Claude debate whether the YAML configuration system is being pushed beyond its design intent and whether a compiled workflow can support arbitrary output shapes without hard-coding per-workflow logic (prompt 46: "If you do hard-coded logic for this workflow, how is it meant to work with any other workflow?").

8. **LLM prose-instead-of-JSON failure at prompt 48**: Running `compile-run` at 13:48 exposes a new failure: `claude-haiku-4-5` returns prose ("I've generated a complete set of realistic and detailed mock answers…") rather than JSON. The `extractJson` function fails and falls back to `claude-sonnet-4-6`. This is the structured output problem — the prompt is requesting JSON but not using the model's JSON mode or schema-enforced output. The tail of the session (prompts 49-55) is spent investigating and beginning to implement JSON schema auto-injection.

9. **Task used for structured output research**: At prompt 50, David asks about "the system that Claude in particular had for returning the correct JSON structures based off schemas" — the `Task` tool is invoked (line 245) presumably to look up or summarise structured output API patterns. This is the only quasi-research move in the session; all other tool use is edit/read/grep.

10. **Session ends open**: The last prompt (56) is David observing that `runCompiled` and `run` are different and he doesn't think the fully compiled system was actually implemented. The session ends without a commit, without a handover, and without a session name. It trails off — likely David ran out of time or energy after 7 hours.

11. **3 context compactions**: The session hit the context limit at 07:53, 10:50, and 13:21. This is consistent with W2-17 (also 3 compactions). Suggests a pattern: complex multi-hour build sessions routinely exhaust context 3 times regardless of session type.

12. **Working directory shift**: The `cwd` starts at the project root (`/prompt.supportsignal.com.au`) and shifts to `/tools/poem-executor` around line 230 onward. Claude changed into the poem-executor subdirectory at some point during the test/implementation work. This is a minor but notable signal — it means the latter half of the session was scoped tightly to the executor tool rather than the broader project.

## Patterns Found

- **Handover-as-session-bootstrap**: The `/handover-pattern` skill produces structured summaries that David drops into the next session. The handover becomes the effective CLAUDE.md for the new session — it sets the context, surfaces the "most important next action," and documents known issues. This is a deliberate, repeated pattern across the prompt.supportsignal project sessions.
- **Error paste as prompt style**: David's primary prompt mechanism in debug sessions is pasting terminal CLI output directly, with a short header ("wht is going on here:", "not fixed?", "new problem?"). This voice-like, abbreviated framing is characteristic of his debugging mode.
- **Assumption-before-data anti-pattern caught**: Claude made a code edit without first reading the relevant data file. David called it out. This appears in multiple sessions — David consistently expects Claude to look before acting.
- **YAML-compiled system architectural tension**: The POEM Executor compiles YAML workflows to JS. As the workflows grow in complexity (gated steps, parallel substeps, mock data generation), the YAML DSL is being stretched. The output shape discussion (prompts 27-46) is early evidence of this tension — users want flexible output schemas, but the compiler needs to know the shape to wire outputs correctly.
- **Frustration escalation at repeat requests**: Prompt 20 is a direct frustration signal ("I asked you to fix something about three or four times, but it never seems to work"). This is a QA/reliability signal worth tracking — when Claude makes the same fix multiple times without it sticking, it usually indicates either the wrong file is being edited or the compiled artifact is cached.

## New Types or Subtypes Proposed

- **build.debug_loop**: A build session dominated by a tight `CLI error → read source → edit → re-run` cycle. Distinguished from `build.feature` by the absence of new capability being added — the work is making existing capabilities actually work. Distinguished from `build.iterative_design` by the absence of visual/UI feedback and Playwright. Signal fingerprint: high Read + high Edit + Bash used primarily for re-running CLI commands + user prompts are mostly terminal output pastes + no planning artifact produced. This session and W1-04 are likely the archetype pair.

## Subtype Candidates Confirmed

- **build.debug_loop** (proposed above): The 204 tool calls are dominated by Read (81) + Edit (56) + Bash (32), with Bash used almost exclusively to re-run the `compile-run` CLI and check results. The 56 user prompts are largely CLI output pastes. No planning, no design, no research phase. Confidence: high.

## Type Correction

- **Registry said**: BUILD / mixed
- **Actual**: build.debug_loop
- **Why**: BUILD is correct. "mixed" as a tool_pattern descriptor is accurate but not diagnostic — Read + Edit + Bash in roughly equal measures does look "mixed." The session's character is defined by the debug loop, not by any single tool dominating. The `mixed` label is accurate at the tool level but misses the session-level pattern. The subtype `debug_loop` better captures what was actually happening: a sustained debugging effort across multiple errors on the POEM Executor CLI system.

## Interest Level

medium-high — The session is technically representative of a common pattern (debug_loop) and documents the POEM Executor system at an early, fragile stage. The architectural tension around YAML-compiled workflow output shapes is substantive and likely recurs in later sessions. The handover bootstrap pattern is well-documented here. Three context compactions in a debug session (vs a design session like W2-17) is a signal that complex debug work exhausts context as fast as feature work. The "assumption-before-data" catch and the "same fix multiple times" frustration are quality signals worth tracking in the broader AngelEye pattern library. Does not rise to "high" because the code being debugged (POEM Executor) is a support tool, not a core product, and the session ends without resolution.
