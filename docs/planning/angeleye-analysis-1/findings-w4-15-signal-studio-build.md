# Findings: W4-15 — signal-studio (da13f544)

## Classification

- **Registry**: BUILD / bash-heavy (148KB)
- **Analysed type**: debug.e2e_campaign
- **Confidence**: high
- **Reasoning**: The registry calls this BUILD and the bash-heavy label is confirmed (Bash: 182 out of 334 tool_use events). However, BUILD is a misleading classification here. There is no feature construction, no new API routes, no schema changes, and no product capability being added. The entire session is an extended, painful debugging campaign to get Playwright E2E tests running reliably in the signal-studio codebase. The work involved: understanding test architecture (UAT vs E2E distinction), fixing flaky tests, adding per-test file logging, addressing polling timing issues, managing data state between runs, and attempting to run E2E in background tasks via CronCreate/Agent dispatch. The correct subtype is `debug.e2e_campaign` — a bash-heavy debugging marathon spanning 14 hours (02:18 to 16:06 UTC), hitting 3 context window limits (3 continuation handovers), and generating significant friction and user frustration. BUILD is challenged; the primary activity is test infrastructure debugging, not construction.

## Session Shape

- **File size**: 148,975 bytes
- **Events**: 379 total (334 tool_use, 45 user_prompt)
- **Tools used**: Bash (182), Read (45), Edit (34), Agent (24), ToolSearch (12), Grep (12), CronCreate (7), CronDelete (7), Skill (5), Write (5), TaskStop (1)
- **Duration**: ~13h 48m (2026-03-12 02:18:46 to 16:06:27 UTC)
- **User prompts**: 45
- **Context window continuations (handovers)**: 3
- **CronCreate/Delete cycles**: 7 creates, 7 deletes (full cycling — all polling loops were started and stopped)
- **Agent spawns**: 24
- **Skill invocations**: 5

### Prompt Timeline (selected key moments)

| #   | Time (UTC)  | Prompt                                                                                                                                                                                                                                                                       | Gap     |
| --- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | 02:18:46    | "What is your understanding of the difference between UAT and E2E in relation to this application?"                                                                                                                                                                          | —       |
| 2   | 02:34:24    | "When you look at the UAT tests, how many entities are covered..."                                                                                                                                                                                                           | ~15m    |
| 3   | 02:40:32    | "Which would be better? ...UAT list be entity-centric, workflow-centric, or something else..."                                                                                                                                                                               | ~6m     |
| 4   | 02:45:06    | "Okay, let's implement all your recommendations."                                                                                                                                                                                                                            | ~4m     |
| 5   | 02:49:28    | "Angela UAT...she's giving feedback. It's a different thing to UAT testing."                                                                                                                                                                                                 | ~4m     |
| 6   | 03:46:38    | "Yes, are we going to write, build, and execute all in one hit? If we did, I'd suggest we set up a work tree for Ralph Wiggum."                                                                                                                                              | ~57m    |
| 7–8 | 03:54–03:56 | `2` then `build` (menu-style responses to Claude's options prompt)                                                                                                                                                                                                           | —       |
| 9   | 05:00:31    | "is this window doing e2e, code changes or UAT testing"                                                                                                                                                                                                                      | ~64m    |
| 10  | 05:14:14    | "does our playwright give us a progress document, do you know how far we are along"                                                                                                                                                                                          | ~14m    |
| 11  | 05:16:07    | "we are 40 to 60 minutes in, we can't do this like this in the future, we need per E2E logging to a file that I can investigate"                                                                                                                                             | ~2m     |
| 12  | 05:19:53    | "can you kill, fix, pre-test (5 e2e's) and then do a full run again, we need to also log into each e2e output, diagnostics that we can watch"                                                                                                                                | ~4m     |
| 17  | ~07:00      | [Context window continuation #1]                                                                                                                                                                                                                                             | —       |
| 19  | 07:56:32    | "This is shit. What's going on? Why is everything taking so long? I thought this user handler site ID. You told me about this hours ago."                                                                                                                                    | —       |
| 20  | 08:10:07    | "Not only do I not have any faith in you, I've also got a boulder full of data, I'm not sure what is code and what is just us fucking around"                                                                                                                                | ~13m    |
| 21  | 08:12:07    | "Okay, let's do all of that: the restore and the merge. Then give me some idea of what we're going to do next...If it keeps locking up or having problems, we've got to firstly catch those problems a lot quicker...You have to have a human in the loop intervene with me" | ~2m     |
| 22  | 08:16:12    | "Do we want to hand this conversation over to the next agent?"                                                                                                                                                                                                               | ~4m     |
| 27  | ~09:30      | [Context window continuation #2]                                                                                                                                                                                                                                             | —       |
| 32  | ~09:45      | "So have you kicked it off, and can we /loop Check the audit log every minute."                                                                                                                                                                                              | —       |
| 40  | 10:04:38    | "I want a test.skip with a reason, and I want a commit and push, and I need a clean data directory."                                                                                                                                                                         | —       |
| 41  | 14:02:25    | "And I get you to commit the code and clean up the data file."                                                                                                                                                                                                               | ~4h gap |
| 42  | 15:02:02    | "No, it isn't clean. No, it isn't fucking set up. I asked this three times."                                                                                                                                                                                                 | ~60m    |
| 43  | 15:03:49    | [Context window continuation #3]                                                                                                                                                                                                                                             | —       |
| 44  | 15:19:19    | "Do untracked files. I hate it when you leave untracked files. You're the one that put them there."                                                                                                                                                                          | ~15m    |
| 45  | 16:06:21    | "Yeah, but why are they in my computer? Why are they not either deleted or in git?"                                                                                                                                                                                          | ~47m    |

## Observations

1. **BUILD classification is wrong — this is E2E debugging**: The session's first prompt is a conceptual question about the difference between UAT and E2E testing. No new product features are built. The entire body of work is test infrastructure: flaky test identification, polling strategy refinement, per-test log file output, data cleanup, and background execution attempts. `debug.e2e_campaign` is the correct subtype.

2. **Bash (182 calls) confirms bash-heavy but understates the execution pattern**: The 182 Bash calls are predominantly test runner invocations (`playwright test`), git operations (`git status`, `git restore`, `git push`), process management, and log file tailing. This is execution-loop bash, not build bash.

3. **CronCreate/CronDelete cycling (7 pairs) reveals a polling architecture**: Every CronCreate was paired with a CronDelete within the same session. The pattern is: start a background Cron poll to check E2E run status, wait, then delete when done or when the approach changed. This is how the session implemented background monitoring — not a persistent scheduled task. All 7 pairs were within-session only.

4. **24 Agent spawns indicate heavy subagent delegation**: The Agent tool was called 24 times across the session. Combined with 5 Skill calls, Claude repeatedly delegated execution (E2E run, git ops, data restore) to subagents rather than running inline Bash. This is consistent with attempting background E2E execution.

5. **3 context window continuations across 14 hours**: The session hit the context limit 3 times (user prompts 17, 27, 43 contain the handover summary boilerplate). This is a high-friction long session — the model repeatedly lost context state and had to be re-briefed. The continuation at 15:03:49 occurs when David is already frustrated about unresolved cleanup issues.

6. **Severe user frustration signals throughout**: Several prompts contain explicit frustration markers:
   - Prompt 11: "we can't do this like this in the future"
   - Prompt 19: "This is shit. What's going on? Why is everything taking so long?"
   - Prompt 20: "Not only do I not have any faith in you, I've also got a boulder full of data"
   - Prompt 21: "You have to have a human in the loop intervene with me"
   - Prompt 30: "Well, I asked you to run both of them, you fuck. Like, you're the one that could have known that."
   - Prompt 42: "No, it isn't clean. No, it isn't fucking set up. I asked this three times."
     These are not one-off complaints — they are distributed across hours and indicate a pattern of unmet expectations around reliability and state hygiene.

7. **Data state bleed as a recurring problem**: Prompt 20 shows a full `git status` output pasted inline revealing 48 deleted seed data files and 55+ newly created ones — tests were regenerating data with new IDs on each run, polluting the working tree. The agent failed to restore the seeded data state between runs. This was the proximate cause of David's "boulder full of data, not sure what is code" frustration.

8. **Conceptual confusion about UAT vs E2E clarified early but persisted operationally**: Prompts 3–5 establish that Angela's feedback is not UAT testing. David also corrects the term "Angela UAT" to "Angela feedback" at prompt 5. However, prompt 9 (2 hours later) still asks "is this window doing e2e, code changes or UAT testing?" — suggesting the distinction was established conceptually but the operational reality was unclear because the same window was being used for multiple purposes.

9. **"Ralph Wiggum" as a worktree E2E runner pattern**: At prompt 6, David raises the idea of setting up a worktree for a "Ralph Wiggum" loop to run E2E tests. This references a known Claude Code skill pattern. The session does proceed to attempt background execution via Agent and CronCreate, but the worktree isolation approach is not consistently applied.

10. **4-hour gap between prompts 41 and 42**: Prompt 41 at 14:02:25 requests a commit and data cleanup. Prompt 42 at 15:02:02 (~60 minutes later) reveals the cleanup was not done correctly. The gap suggests Claude may have run background tasks that completed without adequate verification, or the session was left idle. The ~4 hour gap between prompt 40 (10:04) and 41 (14:02) is even larger — suggesting David stepped away after the test.skip commit and returned to find work still incomplete.

11. **Test.skip as resolution mechanism**: Rather than fixing flaky tests fully, prompt 40 requests `test.skip` with a reason — a pragmatic "park it and move on" signal. This marks the session moving from active debugging to damage control.

12. **Untracked files as a repeating session-end complaint**: Prompts 44 and 45 at the very end of the session are about untracked data files still in the working directory. This is a data hygiene problem that the agent created (by running tests that generate JSON records) and failed to resolve cleanly. The final prompt (45) at 16:06 is the last event — the session likely ended here without full resolution.

## Tool Pattern Assessment

The `bash-heavy` registry label is accurate in count (182 Bash calls). The pattern breakdown:

- **Execution Bash** (~60%): playwright test runner, background process management, npm run
- **Git Bash** (~20%): git status, git restore, git push, git add
- **Inspection Bash** (~15%): log tailing, process listing, file checking
- **Setup Bash** (~5%): worktree setup, server management

The Agent (24) and CronCreate (7) tool patterns are equally diagnostic — they show this session was attempting asynchronous E2E orchestration, not just running Bash inline.

## Reclassification Verdict

**Challenge BUILD**: The primary session activity is E2E test debugging and infrastructure stabilization, not feature construction. No new server routes, client components, or data models were added. The work output was: understanding test coverage gaps, adding per-test log output, fixing polling/timing issues, skipping confirmed-flaky tests, and attempting (with mixed success) data state hygiene.

**Proposed type**: `debug.e2e_campaign`

**Confidence**: high — 45 prompts over 14 hours, 3 context continuations, 182 Bash calls, no evidence of feature code being written.
