# Findings: W3-02 — signal-studio (ee880a6a)

## Classification

- **Registry**: TEST / playwright-heavy
- **Analysed type**: test.uat_playwright_sequential
- **Confidence**: high
- **Reasoning**: The registry label TEST/playwright-heavy is correct in broad type but the subtype is specific and important. This is not a scripted test suite or unit/integration testing — it is a structured manual UAT campaign driven by plain-English workflow narratives (W01–W08). Each narrative is executed by the agent using Playwright MCP against a live development environment, with results logged to RUN-LOG.md and bugs promoted to BACKLOG.md. The pattern is: read workflow file, reset+seed database, browser-drive the scenario, log findings, proceed. The session is a full end-to-end UAT run of 8 named workflow narratives, making `test.uat_playwright_sequential` the precise subtype.

---

## Session Shape

- **Events**: 345 total (337 tool_use, 8 user_prompt)
- **File size**: 123,095 bytes (120KB)
- **Duration**: ~1 hr 41 min (2026-03-13 01:42 to 03:23 UTC)
- **User prompts**: 8 (1 original directive, 3 context-window continuation injections, 2 mid-run questions, 1 observability feedback, 1 handover request)
- **Context window overflows**: 3 (continuations at 01:56, 02:16, 02:28)

### Tool Use Counts

| Tool                                     | Count | Role                                                       |
| ---------------------------------------- | ----- | ---------------------------------------------------------- |
| mcp**playwright**browser_click           | 127   | Core UAT execution — navigating UI                         |
| Bash                                     | 44    | Server reset+seed, git commits, curl API calls, loop setup |
| Edit                                     | 37    | RUN-LOG.md and BACKLOG.md logging throughout run           |
| Read                                     | 32    | Reading workflow files (W01–W08), RUN-LOG, BACKLOG         |
| mcp**playwright**browser_fill_form       | 28    | Form entry across all workflows                            |
| mcp**playwright**browser_snapshot        | 20    | State verification during workflows                        |
| ToolSearch                               | 11    | Finding MCP tool schemas and loop/cron tools               |
| mcp**playwright**browser_navigate        | 10    | Page navigation                                            |
| Glob                                     | 5     | Finding workflow files                                     |
| mcp**playwright**browser_evaluate        | 4     | JS evaluation in browser context                           |
| mcp**playwright**browser_take_screenshot | 3     | Capturing UI state evidence                                |
| mcp**playwright**browser_run_code        | 3     | File upload bypass (`setInputFiles`)                       |
| Skill                                    | 2     | Loop invocation + handover-pattern                         |
| mcp**playwright**browser_file_upload     | 2     | CSV import testing (W06)                                   |
| Write                                    | 2     | Writing CSV test fixture files                             |
| CronCreate                               | 1     | Setting up 3-minute loop monitor                           |
| CronList                                 | 1     | Listing active cron jobs                                   |
| CronDelete                               | 1     | Cleaning up loop job at run end                            |
| Agent                                    | 1     | Subagent for handover/summary generation                   |
| Grep                                     | 1     | Searching within codebase                                  |
| TaskList                                 | 1     | Checking active tasks                                      |

---

## Prompt Timeline

| #   | Time (UTC) | Prompt (summary)                                                                                                                                                   | Gap                         |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | 01:43      | Full UAT directive: run W01–W08, read README agent rules first, reset+seed between each, log to RUN-LOG.md, add bugs to BACKLOG.md, commit at end                  | --                          |
| 2   | 01:56      | Context continuation injection (overflow 1) — session resumes mid-W01/W02 region                                                                                   | 13 min                      |
| 3   | 02:00      | "Do you remember what the loop instructions" (checking on /loop status)                                                                                            | 4 min                       |
| 4   | 02:00      | "Yeah, I want you to restart it now, three minutes intervals" (directing loop restart)                                                                             | <1 min                      |
| 5   | 02:16      | Context continuation injection (overflow 2) — W05 Incident Pipeline running, W01–W04 done                                                                          | 16 min                      |
| 6   | 02:28      | Context continuation injection (overflow 3) — W07 RBAC running, W06 partial                                                                                        | 12 min                      |
| 7   | 03:14      | Observability feedback: "did we run the loop each time?... this was not a good experience... 9 backlog items... build a new Ralph Wiggum loop implementation plan" | 36 min gap (autonomous run) |
| 8   | 03:23      | "Can I get a handover conversation for another window?"                                                                                                            | 9 min                       |

---

## Tool Phases

**Phase 1: Setup and orientation (01:42–01:43, before first user_prompt)**

- Glob + Read + Bash to pre-check project state
- Agent read CLAUDE.md, workflow README, RUN-LOG before user prompt arrived

**Phase 2: W01–W04 execution (01:43–02:16)**

- Read workflow files sequentially
- Bash for server reset+seed before each workflow
- Edit to update RUN-LOG.md at start/end and on issue discovery
- Playwright click+fill_form+snapshot for browser-driven UAT
- 3 context overflows in this region; loop (CronCreate) set up mid-run at 02:00

**Phase 3: W05–W08 execution (02:16–02:38)**

- Continued sequential workflow execution
- mcp**playwright**browser_run_code used to bypass file upload restriction (W06 CSV import)
- Write to create CSV test fixtures (.playwright-mcp/valid-5-participants.csv, invalid-ndis.csv)
- CronList + CronDelete at 02:38 — loop cleaned up after run completion
- ~36-minute autonomous gap: agent ran W07 and W08 without user interaction

**Phase 4: Wrap-up and handover (03:14–03:23)**

- User returns, asks about loop observability
- Bash + Read + Edit to review RUN-LOG.md and BACKLOG.md
- Agent subagent spawned to produce handover summary
- Skill (handover-pattern) invoked as final action

---

## Workflow Coverage

Based on context continuation summaries:

| Workflow                   | Status           | Notes                                                                 |
| -------------------------- | ---------------- | --------------------------------------------------------------------- |
| W01 — Admin Setup          | ⚠️ partial       | Entity store sync + file persistence issues                           |
| W02 — Profile Tier Entry   | ⚠️ partial       | Tier 3 (Person-centred) has no Save buttons — data lost on navigation |
| W03 — Shift Routine        | ⚠️ partial       | Details not surfaced in sampled portions                              |
| W04 — Support Worker Shift | ✅ pass          | Clean pass                                                            |
| W05 — Incident Pipeline    | ⚠️ partial       | Severity field missing issue                                          |
| W06 — CSV Import           | ⚠️ partial       | No result screen after import; hex IDs shown as names (HIGH)          |
| W07 — RBAC Boundary        | 🔄 running at P6 | Likely completed during 36-min autonomous gap                         |
| W08 — (final)              | ⏳ pending at P6 | Likely completed during 36-min autonomous gap                         |

**Bug yield**: 9 backlog items found (user confirmed in P7)

---

## Notable Patterns

**1. Context window overflow as session pattern**
Three context overflows in ~55 minutes of active work. This is a high-density session — Playwright click events are token-heavy. The compact continuation summaries (P2, P5, P6) carry the workflow status faithfully enough that the run continued without manual re-briefing.

**2. Loop monitor setup was reactive, not proactive**
The /loop (CronCreate) was not set up in P1's initial directive. David had to prompt at P3/P4 to ask about and restart the loop at 3-minute intervals. This matches the observability gap David raised in P7 — the loop was running, but David didn't experience feedback from it across the context overflows. The loop's output was being consumed by the agent, not surfaced to David's window.

**3. Autonomous 36-minute execution gap**
Between CronDelete at 02:38 and David's P7 at 03:14, the session ran fully autonomously for 36 minutes. This is the longest autonomous stretch observed so far in this analysis campaign. The agent was executing W07/W08, logging, committing, and cleaning up the loop without user involvement.

**4. File upload workaround via browser_run_code**
W06 required CSV file upload. Playwright MCP restricts file chooser access to the project directory. Agent used `browser_run_code` with `setInputFiles` to bypass this restriction — a notable pattern for UAT sessions that include file-upload test coverage. CSV fixtures were written to `.playwright-mcp/` at the project root.

**5. Observability critique as session output**
P7 is the most analytically valuable prompt in the session. David's critique reveals a gap between loop existence and loop visibility — the loop was technically running but its output wasn't reaching him across context window boundaries. He frames this as a tooling gap requiring either a skill change (Ralph Wiggum / loop skill) or a project-level mechanism. The session ends with a plan to build a new loop implementation targeting the 9 found issues.

**6. Edit-heavy logging discipline**
37 Edit calls — more than any other non-Playwright tool. The agent maintained RUN-LOG.md faithfully throughout, updating at workflow start, on issue discovery, and at workflow close. This is the intended UAT pattern from the README agent rules.

---

## Classification Challenge

**Is this TEST?** Yes — this is unambiguously a testing session. The primary activity is validating an application against 8 pre-written UAT scenarios using browser automation.

**Is playwright-heavy accurate?** Partially. Playwright is the execution vehicle but it is subordinate to the UAT narrative loop. The pattern is driven by markdown workflow files, not by Playwright scripts. The agent reads a spec, then uses Playwright to execute it. A better tool-pattern label might be `uat-driven-playwright` or `narrative-playwright`.

**Subtype confidence**: `test.uat_playwright_sequential` is high-confidence. The distinguishing characteristics:

- Plain-English workflow narratives as test specs
- Sequential numbered run (W01–W08) with reset+seed between each
- Real-time logging to a run log file
- Bug items promoted to backlog
- No test assertions or harness — all verification is agent observation

---

## Interest Level: high

**Reasons**:

- Longest autonomous execution gap found in this campaign (36 min)
- Context overflow × 3 in a single session reveals token cost of Playwright MCP at scale
- File upload workaround pattern (browser_run_code + setInputFiles) is novel
- Loop observability failure is a design-level finding with product implications for AngelEye (loop events need to surface across context boundaries)
- Clean example of the `test.uat_playwright_sequential` archetype — useful as a reference session
- 9 backlog items in one session = high productivity UAT run
