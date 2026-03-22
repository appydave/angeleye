# Findings: W3-03 — signal-studio (1fe96bc7)

## Classification

- **Registry**: TEST / playwright-heavy
- **Analysed type**: test.uat-narrative
- **Confidence**: high
- **Reasoning**: The registry classification of TEST/playwright-heavy is correct in broad type. The subtype is more precise: this session executes AI-driven UAT via Playwright MCP against human-authored workflow narrative files (W01–W08 docs/uat/workflows/). This is not Playwright E2E spec execution (e2e/specs/) — those are automated tests. This is a human-readable narrative that Claude drives as a browser agent, simulating real user flows. The session also contains significant non-test work: a wave22 branch merge at the start, and process improvement work at the end. The dominant bulk (by tool count and wall-clock time) is the Playwright UAT execution, confirming TEST as the primary type.

## Session Shape

- Events: 92 (81 tool_use, 10 user_prompt, 1 session-end implied)
- Tools used: mcp**playwright**browser_click x18, Bash x17, Edit x10, Read x10, mcp**playwright**browser_fill_form x8, mcp**playwright**browser_snapshot x3, mcp**playwright**browser_navigate x1, Agent x3, ToolSearch x3, CronCreate x1, CronDelete x1, Write x1, Skill x2
- Total tool invocations: ~81
- Subagents: 3 Agent invocations (end of session, workflow improvement documentation)
- Duration: ~19 hours wall clock (2026-03-12 06:53 to 2026-03-13 01:31), with two large idle gaps (~9h and ~43m)
- User prompts: 10 (mix of voice-transcribed and typed)
- Context continuations: 0
- Opening style: compaction handover dump pasted as user prompt (near-compaction skill output from prior session)

### Skills

- **near-compaction** (prompt 1, opening): The first user prompt is a pasted output of the near-compaction skill from a prior session — a structured handover covering wave22 merge status, unstaged workflow UAT files, and key rules about three testing layers.
- **Skill** (line 31, 16:07): Invoked during UAT kickoff phase — likely to fetch browser tools or loop skill.
- **Skill** (line 91, 01:31): Final invocation at session close — likely handover/compaction for next session.

### Prompt Timeline

| #   | Time        | Prompt (summary)                                                                                                                                 | Gap      |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1   | 03-12 06:53 | Handover dump: wave22 merge status, workflow UAT files, 3-layer test model                                                                       | --       |
| 2   | 03-12 06:55 | "I don't know where we're at. What are you trying to do? What's going to be the outcome?"                                                        | 1.5 min  |
| 3   | 03-12 06:55 | "And what's next on the agenda?"                                                                                                                 | 7 sec    |
| 4   | 03-12 06:57 | "What happened to the user acceptance test running? We never did get it to run because we were running E2E at the same time."                    | 2 min    |
| 5   | 03-12 06:59 | "When we run them, are we going to use Playwright MCP? Are we going to write a log after each one?"                                              | 1.8 min  |
| 6   | 03-12 07:01 | "Yes, I want you to add that log... kick off this process... write a /loop command... running grid"                                              | 2 min    |
| 7   | 03-12 16:07 | "Okay, can you kick off this session? I'm gonna watch it for ten minutes."                                                                       | ~9 hours |
| 8   | 03-13 01:26 | "Help me understand the conversation... 20-odd pages all saying 'no change'... not in a form that's useful... I almost gotta start again"        | ~43 min  |
| 9   | 03-13 01:28 | "Okay, so I went to bed... This is why this has been a poor situation... what's the improved pattern going to be if I ask you to run W01 again?" | 2 min    |
| 10  | 03-13 01:30 | "I think we're going to do three things: document improved workflow concept, fix the bug, decide to rerun W01 in a new window."                  | 2 min    |

### CWD Distribution

- `/Users/davidcruwys/dev/clients/supportsignal/signal-studio`: all 92 events (100%)

## Observations

1. **Three-phase session**: The session has three distinct phases with different characters. Phase 1 (06:53–07:02): git merge/cleanup of wave22 branch + planning for UAT execution. Phase 2 (16:07–16:56): actual W01 UAT execution via Playwright MCP — Claude navigates the live app, logs in, clicks through features. Phase 3 (03-13 01:26–01:31): David reviews the output the next morning, expresses frustration, and the session pivots to workflow improvement.

2. **Session opens with a handover paste**: The first "user prompt" is not a user request — it is the pasted output of the near-compaction skill from a prior session. This is a pattern where David uses skill output as context injection for a new session. The handover text contains structured state (branch name, merge steps, unstaged files, three-layer test model rules).

3. **David disoriented at session start**: Prompt 2 ("I don't know where we're at") shows that even with the handover paste, David needed Claude to re-explain the plan before proceeding. This is a signal that the handover format, while complete, was not sufficiently actionable in isolation.

4. **CronCreate/CronDelete cycle — /loop set up then removed**: Claude created a cron job (line 33) to monitor the UAT log on a per-minute basis (the "running grid" David requested in prompt 6). It was deleted later (line 77) — likely because the UAT run completed or David abandoned monitoring. This is the only session in the analysis set that shows a full CronCreate+CronDelete lifecycle.

5. **Playwright MCP executes W01 narrative**: Lines 38–75 (from "kick off this session") show Claude using browser_navigate, browser_click, browser_fill_form, and browser_snapshot to walk through a workflow narrative file. This is AI-as-UAT-tester — Claude reads a human-authored narrative and executes it step by step in a live browser session. The density of click/fill/snapshot events (~30 in ~8 minutes) suggests a single workflow run.

6. **~43-minute gap between UAT execution and David's feedback**: After the UAT phase ends around 16:13, there is a 43-minute gap before David's frustration prompt at 01:26. But David says "I went to bed" — so the real gap was overnight (~9 hours from 16:13 to 01:26 the next day). The log was written during the UAT run but David only reviewed it the following morning.

7. **Log feedback failure — "20 pages all saying no change"**: David's prompt 8 is a clear failure analysis. The log wrote repetitive, undifferentiated entries for each step. David expected a human-readable summary: test name, time taken, pass/fail, issues found. Instead he got 20 structurally identical "no change" entries with no decision-useful signal. This is a pattern where the agent faithfully logged what it observed but did not synthesize it for human consumption.

8. **Voice-transcribed frustration, not anger**: Prompt 8 is lengthy and voice-transcribed ("I almost feel like I gotta start again"). The tone is frustration at the workflow design, not at Claude specifically. David frames it as a process problem: "this is going to be how it's going to be every time." This is constructive — he is designing an improved pattern rather than abandoning the approach.

9. **"Stop and wait" protocol articulated**: Prompt 9 describes the improved pattern David wants: if Claude encounters a decision point requiring human input during an unattended run, it should write up progress, explicitly say "we got this far, we're going to have to stop," and ensure the /loop also stops. This is a significant workflow design decision made explicit in this session.

10. **Three-action close**: Prompt 10 specifies three parallel tasks: (1) document the improved workflow concept, (2) fix the bug (probably the log formatting bug), (3) decide whether to rerun W01 in a new window. Lines 81–91 show Agent invocations and Edits executing these, ending with a Skill call (likely handover for the new window).

11. **Three testing layer confusion resolved**: The handover note carries a strict rule: `docs/uat/` = human checklists, `e2e/specs/` = Playwright automated tests, `docs/uat/workflows/` = AI narrative UAT. Three separate things. This rule was crystallised in the prior session and carried forward here. The session reinforces it by demonstrating what happens when E2E and workflow UAT are conflated (can't run simultaneously due to shared server/data).

12. **session_type misclassified at subtype level**: The registry says "TEST/playwright-heavy." The playwright-heavy tool_pattern is accurate (dominant tool is browser_click, plus fill_form, snapshot, navigate). But the subtype should be `test.uat-narrative` — this is AI-agent-driven execution of human-authored narrative UAT scripts, which is architecturally different from automated E2E spec execution. The distinction matters for pattern recognition: a `test.playwright-e2e` session runs vitest+playwright specs; a `test.uat-narrative` session uses Playwright MCP to simulate human walkthroughs of feature narratives.

## Patterns Found

- **handover_paste_as_context_injection**: David pastes prior session's near-compaction output as the first user prompt of a new session. This carries structured state (branch names, merge steps, key rules) into a fresh context. Limitation: even with a full handover, David needed Claude to re-explain before proceeding (prompt 2 disorientation).
- **cron_create_delete_lifecycle**: CronCreate used to set up per-minute UAT log monitoring; CronDelete used to clean up after the run. First observed example of the full create-then-delete cron lifecycle in a single session.
- **uat_narrative_playwright_execution**: Claude reads a human-authored workflow narrative file and uses Playwright MCP tools to execute it step by step in a live browser. ~30 browser interactions in ~8 minutes for a single workflow. Dense click/fill/snapshot pattern.
- **log_synthesis_failure**: Agent logs every step faithfully but fails to synthesise for human decision-making. Result: 20 identical "no change" entries instead of a summary grid. David's corrective: log should show test name, elapsed time, pass/fail status, issues — not raw observation per step.
- **overnight_feedback_gap**: Agent runs unattended, completes work, but David reviews the output hours later. The feedback loop is broken when the agent writes work-in-progress logs that assume immediate human review. "Stop and wait" protocol design emerges from this failure.
- **voice_frustration_process_redesign**: Voice-transcribed frustration prompt leads directly to a workflow redesign discussion. Pattern: disorientation at output → articulation of what was expected → three-part remediation plan (document, fix, retry). Not session abandonment — process iteration.

## New Types or Subtypes Proposed

- **test.uat-narrative**: Subtype for sessions where Claude executes human-authored workflow narrative files via Playwright MCP, simulating a human UAT tester. Distinguished from `test.playwright-e2e` (automated spec execution) by: (1) narratives are human-readable markdown, not code, (2) browser interaction is conversational/exploratory, (3) each step is interpreted rather than asserted, (4) output is an observation log rather than pass/fail results.

## Subtype Candidates Confirmed

- **test.uat-narrative**: Confirmed. Signal: Playwright MCP browser_navigate + browser_click + browser_fill_form + browser_snapshot cluster (~30 events) following a "kick off this session" trigger; explicit reference to W01 workflow narrative file; CronCreate for monitoring log; David's post-review revealing the log was step-by-step observations rather than spec assertions.

## Type Correction

- **Registry said**: TEST / playwright-heavy
- **Actual**: test.uat-narrative
- **Why**: playwright-heavy is accurate as a tool_pattern descriptor. The type correction is at the subtype level: the Playwright usage here is not E2E spec execution but AI-agent-driven narrative UAT. The session also contains significant non-test work (git merge, process documentation) but the dominant phase by tool density is the Playwright UAT execution. The near-compaction handover at the start and the workflow improvement at the end are secondary phases — this is still primarily a TEST session.

## Interest Level

medium-high — This session is notable for three reasons: (1) the first observed `test.uat-narrative` session, establishing a distinct Playwright usage subtype; (2) the CronCreate+CronDelete lifecycle for unattended monitoring — a rare pattern; (3) the log synthesis failure and overnight feedback gap producing a clear "stop and wait" protocol design, which is an important workflow pattern for any unattended AI agent run. The session itself is modest in scale (30KB, 92 events) but the failure mode it documents and the workflow redesign it triggers are high-signal for agent UX design.
