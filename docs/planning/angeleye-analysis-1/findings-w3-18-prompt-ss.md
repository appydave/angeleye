# Findings: W3-18 — prompt.supportsignal (65e82b48)

## Classification

- **Registry**: BUILD / edit-heavy (224KB)
- **Analysed type**: build.dsl_refinement
- **Confidence**: high
- **Reasoning**: This is a sustained build session focused on refining and debugging the POEM OS execution engine (`poem-executor`) for the SupportSignal prompt engineering system. David works across 16 real user prompts spanning 73 minutes, with 208 tool calls (Edit: 71, Bash: 64, Read: 56, Write: 13, Task: 3, Glob: 1). The session begins with a question about `.formatted` files in the HBS prompt folder, quickly pivots to exploring the DSL vocabulary (observation, predicate, category), fixes output schema issues (nested objects vs flat strings), debugs a compilation error, addresses mock data contamination, and ends with a major DSL redesign discussion and integration test scaffolding. The session includes one context compaction (line 165) and three Task (subagent) calls. This is definitively BUILD — heavy Edit + Bash with tight read-edit-test loops, not orientation or research.

## Session Shape

- **Events**: 224 (208 tool_use, 16 user_prompt)
- **Tools used**: Edit (71), Bash (64), Read (56), Write (13), Task (3), Glob (1)
- **Duration**: ~73 minutes active (05:53 – 07:07 UTC, 2026-02-20)
- **User prompts**: 15 real prompts + 1 compaction summary injection
- **Opening style**: Exploratory question about `.formatted` files — voice-transcribed, conversational
- **Context compaction**: 1 (at line 165, 06:25 UTC) — session hit context limit once
- **Closing ceremony**: No explicit close — session ends mid-work (tool_use: Bash at 07:07)
- **CWD transitions**: Root (`prompt.supportsignal.com.au`) → `tools/poem-executor` (from line 9 onwards)

### Prompt Timeline

| #   | Time (UTC) | Prompt                                                                                                                                                                                                                                                                                                         | Gap |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | 05:53      | "why do we have .formatted files in the prompts folder for hbs? what are they"                                                                                                                                                                                                                                 | —   |
| 2   | 05:55      | "yes" (confirms a cleanup/deletion action)                                                                                                                                                                                                                                                                     | 1m  |
| 3   | 05:55      | Pastes Claude Code ASCII art + `/poem:agents:alex` session context — sharing POEM executor state                                                                                                                                                                                                               | 0m  |
| 4   | 05:58      | "the outputs are still not simple strings, we need to change [nested JSON output example]"                                                                                                                                                                                                                     | 3m  |
| 5   | 06:06      | "when you stop using care notes, they're not important because they're not real They're all mock data. How do I stop this from coming through each time?"                                                                                                                                                      | 8m  |
| 6   | 06:09      | "Did you update the unit tests?"                                                                                                                                                                                                                                                                               | 3m  |
| 7   | 06:15      | "Look, predicates are a real pattern; I guess observations are a real pattern... How did they look in the yaml? Can you show me how the yaml looks for the observation predicate and the predicate chain, where a predicate thing calls an observation?"                                                       | 6m  |
| 8   | 06:17      | "bug [pastes compile error from poem-executor CLI run]"                                                                                                                                                                                                                                                        | 2m  |
| 9   | 06:25      | [COMPACTION — prior session context summary injected]                                                                                                                                                                                                                                                          | 8m  |
| 10  | 06:26      | "I had an issue with the domain specific language. before you compacted (DSL names such as observation, predicate & category) I need us to take all that issue that we've got there around the domain-specific language... We've got either a predicate on its own..."                                         | 0m  |
| 11  | 06:26      | [Duplicate send of prompt 10 — same text, 20s later]                                                                                                                                                                                                                                                           | 0m  |
| 12  | 06:42      | "I am happy for you to go with the plan that you've got. I am curious whether the DSL language that we've been using is useful for bigger sample flows, almost like an integration test..."                                                                                                                    | 16m |
| 13  | 06:49      | "Does Claude now have a LSP"                                                                                                                                                                                                                                                                                   | 7m  |
| 14  | 06:54      | "If that's the case, why is it too risky to rename the files that you said? Especially if you have to qualify whether this is true, we already have solid unit testing in place."                                                                                                                              | 5m  |
| 15  | 06:57      | "We have domain-specific names in bigger integration tests."                                                                                                                                                                                                                                                   | 3m  |
| 16  | 07:01      | "It affects them both, but problem one is the interest. We also need the ability to keep it up to date, so I will continually be changing the new incident YAML. I consider it a reference. And you can use it, and you should be able to auto magically just copy a version of it and then figure out any..." | 4m  |

## Observations

1. **`.formatted` files as ephemeral build artifacts**: The session opens with David discovering `.formatted` files alongside `.hbs` templates. These appear to be intermediate rendering outputs from the Handlebars prompt compilation pipeline — not source files. David confirmed they should be deleted (prompt 2: "yes"), suggesting they had been accidentally committed or left by a prior run. This is a housekeeping discovery that triggered the session.

2. **POEM OS / Alex agent context shared mid-session**: Prompt 3 pastes the Claude Code ASCII banner and an `/poem:agents:alex` agent session output — David is showing Claude what Alex (the Workflow Architect persona within POEM OS) reported about the state of workflows. This is an unusual pattern: David using Claude Code to debug the output of a Claude Code agent invoked within the same project. The two Claude sessions are running in parallel or sequentially, and David is hand-carrying context between them.

3. **Output schema mismatch — nested objects vs flat strings**: Prompt 4 reveals the key technical issue: the poem-executor was producing nested JSON objects for fields like `warning_signs`, `immediate_response` etc., when the schema expected flat strings. David pastes actual output from a real NDIS incident workflow (case `105-real-mp-001`). The 71 Edit calls are largely dedicated to fixing prompt templates and executor schema handling to flatten nested outputs.

4. **Mock data contamination — care notes leaking through**: Prompt 5 identifies a secondary issue: mock care note data was being included in outputs even when the workflow shouldn't be using care notes. David's phrase "they're not real" and "stop this from coming through each time" suggests the mock data fixture had care_notes populated, and the prompt template was unconditionally including them. This is a data fixture hygiene problem surfaced through real workflow runs.

5. **Unit test coverage question**: Prompt 6 ("Did you update the unit tests?") is a brief accountability check after fixes. The subsequent tool calls (Read → Edit → Bash) suggest Claude did update tests. This is David maintaining test discipline mid-build rather than leaving it as a tail task.

6. **DSL vocabulary exploration — predicate/observation/category**: Prompt 7 shows David stepping back from bug-fixing to ask a conceptual question about how the YAML DSL represents the different classification concepts (predicate, observation, category). He wants to see the YAML structure for chains where a predicate calls an observation. This is a design review moment within the build session — checking that the DSL is coherent before continuing to build it.

7. **Compile error reported verbatim**: Prompt 8 pastes a raw terminal error from running the poem-executor CLI. The error is from a `compile-run` command against the `new-incident.yaml` workflow with a real incident JSON (`105-real-mp-001.json`). This is a direct feedback loop from manual testing — David runs the CLI, gets an error, pastes it. The subsequent Read → Edit → Bash loop fixes the compile error.

8. **Context compaction mid-session**: At line 165 (06:25 UTC), a compaction summary is injected. The summary covers the earlier portion of the conversation. Immediately after, David sends the same complex DSL redesign prompt twice within 20 seconds (prompts 10 and 11 are identical), suggesting he submitted before the compaction was fully processed, then resent. This duplicate-send pattern after compaction was also seen in W2-17.

9. **Three Task (subagent) calls**: Task calls appear at lines 170 (06:27), 173 (06:44), and 176 (06:49). These are in the second half of the session, during the DSL redesign and integration test planning phase. The subagents likely handle parallel reads or structured analysis of the DSL/YAML files.

10. **LSP tangent — Claude Code capabilities question**: Prompt 13 ("Does Claude now have a LSP") is an abrupt off-topic question about whether Claude Code has Language Server Protocol support. This is the kind of question David asks when he's thinking about whether a risky refactor (file renaming) is safe to do. The next prompt (14) confirms this: "why is it too risky to rename the files that you said? Especially if you have to qualify whether this is true, we already have solid unit testing in place." David is probing whether Claude's file rename confidence claims are justified.

11. **Integration test as reference workflow**: Prompt 16 articulates a key architectural intention — the `new-incident.yaml` workflow should be a living reference, not a one-off test. David wants a mechanism to auto-copy it into integration tests and detect drift when the reference changes. This points toward a test infrastructure feature for the poem-executor: integration test seeding from a canonical reference YAML.

12. **No session naming**: Registry shows `name: null`. Despite a 73-minute build session with a compaction event, David never used `/rename`. The session ends without a closing ceremony — the last event is a Bash tool call at 07:07.

13. **Edit-to-Bash ratio**: 71 Edits vs 64 Bash calls is an unusually balanced ratio. Many sessions are Edit-dominated or Bash-dominated. Here, every edit cluster is followed by a Bash run (CLI test, unit test, or compilation check), indicating a tight edit-test cycle that's more structured than typical exploratory builds.

## Patterns Found

- **Dual Claude session cross-talk**: David is running POEM OS's Alex agent in one Claude Code session and debugging the results in another. He hand-carries the Alex output (pasted as prompt 3). This cross-session collaboration-via-paste is a workflow inefficiency — a session-linking mechanism or shared output staging area would help.
- **Real incident data driving DSL design**: The mock data used in testing is drawn from actual NDIS incident reports (the care_notes contamination, the nested warning_signs content). This makes the test fixtures sensitive — prompt 5 identifies that mock data is "not real" but the content pasted in prompt 4 is substantive NDIS casework language. The boundary between test data and production data needs care in this domain.
- **Compile error → paste → fix loop**: Prompt 8 is a raw terminal error paste, which is David's standard debug pattern (also seen in other supportsignal sessions). No reproduction steps, no context — just the error. Claude reads the relevant files and fixes it.
- **DSL vocabulary instability**: The session repeatedly circles around what `observation`, `predicate`, and `category` mean in the POEM OS YAML DSL. The renaming risk discussion (prompts 13-15) and the compaction-triggered DSL redesign prompt (10-11) show that this vocabulary hasn't settled. The DSL is still being defined as it's being used, which creates rename friction.
- **Duplicate send after compaction**: Same as W2-17 — David resent a prompt immediately after compaction injection. This is a UX issue with Claude Code's compaction flow: the state transition is not clearly communicated, leading to duplicate submissions.

## New Types or Subtypes Proposed

- **build.dsl_refinement**: A build session where the primary activity is iterating on a domain-specific language (DSL) — its vocabulary, schema, and execution semantics — rather than building product features. Tool profile: Edit-heavy + Bash-heavy (compile/test loop) with conceptual vocabulary questions interspersed. Distinguished from `build.feature` by the DSL-centricity (all edits serve to refine the DSL, not product features) and from `build.bugfix` by the presence of design questions alongside bug fixes. The POEM OS `poem-executor` is the context here; the DSL concepts (predicate, observation, category, workflow YAML) are the domain under construction.

## Subtype Candidates Confirmed

- **build.dsl_refinement** (proposed above): Signal fingerprint is Edit-heavy + Bash-heavy with tight compile/test loops, conceptual DSL vocabulary questions, schema mismatch fixing, and a backdrop of evolving terminology. Confidence: high. This session is a clear archetype.

## Type Correction

- **Registry said**: BUILD / edit-heavy
- **Actual**: build.dsl_refinement
- **Why**: BUILD is correct — this session writes and edits production code (prompt templates, executor logic, YAML DSL files, unit tests). `edit-heavy` as tool_pattern is also accurate (71 Edits, the most of any tool). The registry classification is structurally right but undersells the session's character. The distinctive feature is not just that edits dominate, but that the edits serve a DSL vocabulary refinement agenda — fixing schema mismatches, cleaning up DSL naming, building integration test scaffolding. This is different from feature work or bug fixing; it's language design under construction.

## Interest Level

medium-high — This session is interesting for three reasons: (1) the dual Claude session cross-talk pattern (POEM OS Alex agent output pasted into a separate debug session) is a workflow insight relevant to how David uses POEM OS in practice; (2) the DSL vocabulary instability (predicate/observation/category still unsettled) is a leading indicator of future rename/refactor sessions; (3) the integration test as reference workflow intention (prompt 16) articulates a real architectural need that hasn't been implemented yet. The domain content (NDIS incident analysis) is sensitive but the technical patterns are broadly applicable to prompt engineering systems.
