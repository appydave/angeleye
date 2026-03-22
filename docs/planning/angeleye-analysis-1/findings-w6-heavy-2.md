# Findings: W6-heavy-2 — Heavy Non-Marathon Sessions (5 sessions, 261-318 events)

Batch of the 5 heaviest non-marathon sessions. Rich multi-phase content across signal-studio (2), prompt.supportsignal (1), brains/appydave.com (1), and flihub (1).

---

## S1: 65f77723 — signal-studio UAT Feedback + Bug Fixing

### Classification

- **Registry**: BUILD (assumed from CWD signal-studio)
- **Analysed type**: build.uat_driven_iteration
- **Confidence**: high
- **Reasoning**: This is a genuine multi-phase BUILD session in signal-studio. David collects UAT feedback from Angela, writes a David feedback document, and then implements fixes across multiple entities (companies, sites, users). 60 Edit calls + 12 Write calls on product code, plus 46 Playwright clicks and 11 form fills for in-session UAT verification. The session is driven by real user feedback that triggers feature improvements and bug fixes — not pure testing, not pure planning.

### Session Shape

- Events: 261 (29 user_prompt, 232 tool_use)
- Duration: 1204 min wall clock, 257 min active
- Idle gaps: 2 (155 min lunch break, 714 min overnight)
- Context compactions: 2
- Closing: commit request ("I want to commit data. And it should all go in one commit.")

### Prompt Timeline Highlights

| #     | Time (UTC)     | Summary                                                                                                                        |
| ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1     | 06:34          | Voice: "bunch of UAT feedback for Angela... how many were there?"                                                              |
| 2     | 06:42          | Creates David feedback document alongside Angela's                                                                             |
| 3-7   | 06:47-07:12    | Series of feedback items: admin role separation, ABN button UX, company status dropdown, site challenges, user status defaults |
| 8     | 07:31          | "do a git pull" — pulls Angela's changes                                                                                       |
| 9-10  | 07:51-07:55    | Reviews Angela's changes, asks for recommendation on Profile save                                                              |
| 12    | 08:06          | "push forward with the next wave" — enters build mode                                                                          |
| 14    | 09:20          | Reviews test results: "36 done, 33 pending"                                                                                    |
| 19    | 10:01          | **Compaction 1**                                                                                                               |
| 22-24 | 13:12-13:19    | Post-gap: role permission clarifications, runs Playwright tests                                                                |
| 25    | 13:51          | **Compaction 2**                                                                                                               |
| 28    | 14:43          | "Have we got loose ends? Do we have files to commit?"                                                                          |
| 29    | next day 02:37 | Final: "commit data, all in one commit"                                                                                        |

### Observations

1. **UAT-driven iteration is a distinct BUILD subtype**: This session has a clear pattern — gather feedback, implement, verify with Playwright, gather more feedback. It differs from build.campaign (Ralphy-driven) and build.migration (structured migration). The driver is live user feedback from Angela, not an implementation plan.

2. **Multi-phase with natural breaks**: Phase 1 (06:34-08:06) = feedback collection and documentation. Phase 2 (08:06-10:36) = implementation wave with Playwright verification. Phase 3 (13:12-14:43) = role permission refinements and testing. Each break is a natural pause, not a pivot in intent.

3. **Playwright usage is verification, not UAT**: 46 clicks + 11 form fills + 4 snapshots, but within a BUILD session — Claude is verifying its own edits, not running a UAT plan. This confirms the wave 2 learning: Playwright in product repo during BUILD = verification tool.

4. **Voice dictation throughout**: "Asked myself", "I need you to do a git pull", "run a heel" (=heal). Pervasive voice artifacts confirm voice-first mode.

5. **Angela-David feedback loop**: David acts as intermediary between Angela (end user) and Claude (builder). This session captures a real client feedback workflow: Angela provides feedback docs, David digests them, David dictates requirements to Claude, Claude implements and verifies.

---

## S2: 24d71c92 — signal-studio UAT Plan + Execution

### Classification

- **Registry**: BUILD (assumed from CWD signal-studio)
- **Analysed type**: test.uat_plan_and_execution
- **Confidence**: high
- **Reasoning**: Session starts explicitly with "come up with a really detailed user acceptance test plan. We're not writing code." Opens as TEST/PLANNING, then transitions into actual UAT execution with Ralphy. 42 Write calls are UAT plan documents, not feature code. 59 Edit calls are plan refinements and bug fixes found during UAT. 35 Agent + 25 TaskOutput calls show heavy subagent delegation for test execution. The primary deliverable is a UAT plan plus UAT findings, not new features.

### Session Shape

- Events: 263 (20 user_prompt, 243 tool_use)
- Duration: 961 min wall clock, 272 min active
- Idle gaps: 3 (400 min overnight, 183 min early morning, 72 min)
- Context compactions: 3
- Closing: cross-session handover — David shares feedback from another window

### Prompt Timeline Highlights

| #     | Time (UTC)     | Summary                                                                   |
| ----- | -------------- | ------------------------------------------------------------------------- |
| 1     | 15:47          | "detailed user acceptance test plan... We're not writing code"            |
| 2     | 15:58          | Frustration: "Did you create a complex, detailed, and thorough UAT plan?" |
| 3-4   | 16:00          | "/ral" then "/ralphy" — invokes Ralphy for UAT execution                  |
| 5     | 16:04          | "Skip the heal... build up the plan"                                      |
| 7     | next day 00:25 | After 400min gap: "Ready to kick off on autopilot?"                       |
| 9     | 01:15          | "I haven't been paying attention... how are we going?"                    |
| 10-11 | 01:20, 01:55   | **Compactions 1 and 2**                                                   |
| 12    | 05:13          | After 183min gap: "loose ends? work tree? committed?"                     |
| 14    | 06:27          | "Work on critical bugs first"                                             |
| 16    | 06:47          | **Compaction 3**                                                          |
| 17    | 07:10          | "where we're at on this build" + EADDRINUSE port error                    |
| 18    | 07:42          | References own session ID — inspecting conversation state                 |
| 20    | 07:49          | Cross-session handover: "feedback from the other window"                  |

### Observations

1. **TEST, not BUILD**: Despite 59 Edit calls and CWD in signal-studio, the session's primary intent and deliverable is a UAT plan. The edits are test document refinements and bug fixes found during UAT, not new feature code. Registry BUILD is wrong.

2. **Ralphy mode for non-BUILD work**: /ralphy invoked at prompt 3 for UAT execution. This confirms Ralphy isn't exclusively a BUILD pattern — it's an automation/delegation pattern. The mode chosen was "3" (likely autopilot/execution mode).

3. **Three compactions in one session**: Heavy context usage from UAT plan generation + execution + bug fix documentation. Each compaction causes disorientation — David asks "how are we going?" and "where we're at" after resumptions.

4. **Cross-session reference at close**: Final prompt shares "feedback from the other window" — this is session S1 (65f77723), which was running concurrently. The two sessions overlap on March 9 from 06:27 to 07:49.

5. **Frustration signal at prompt 2**: David explicitly asks "Did you create... because that is what I actually asked for." Claude likely generated something other than a human-followable UAT plan on first attempt.

6. **EADDRINUSE error**: At prompt 17, David reports "address in use errors." This is a known AppyStack pattern — the dev server wasn't properly stopped between sessions.

---

## S3: 76e2b0c7 — prompt.supportsignal AWB Field Testing

### Classification

- **Registry**: BUILD (assumed from CWD)
- **Analysed type**: test.field_testing
- **Confidence**: high
- **Reasoning**: The opening prompt is a detailed brief for "AWB Field Testing — YouTube Launch Optimizer: Capture Change Requests." The purpose is to run a workflow through AWB, observe what works and what doesn't, and capture change requests. This is field testing and requirements capture, not feature construction. 94 Bash calls are workflow execution and server management, 61 Edit calls are requirement documents and change request capture, not product feature code. CWD is prompt.supportsignal but actual work spans AWB (Agent Workflow Builder).

### Session Shape

- Events: 266 (35 user_prompt, 231 tool_use)
- Duration: 1678 min wall clock, 280 min active
- Idle gaps: 4 (172 min, 124 min, 484 min overnight, 584 min overnight)
- Context compactions: 2
- Closing: Bash commands (likely commit/push)

### Prompt Timeline Highlights

| #     | Time (UTC)     | Summary                                                                             |
| ----- | -------------- | ----------------------------------------------------------------------------------- |
| 1     | 08:49          | Long brief: "AWB Field Testing — YouTube Launch Optimizer: Capture Change Requests" |
| 2     | 08:51          | **Correction**: "Stop. I didn't really need you to run through it that way."        |
| 3     | 08:53          | "I will continuously be switching between user and engineer mode"                   |
| 4-5   | 09:23-09:31    | Display manifest, brand settings, labelling feedback                                |
| 6     | 09:33          | "Is this a Ralph Wiggum loop? Are we ready to move on to Ralph?"                    |
| 10    | 09:46          | "trap unit nine and build"                                                          |
| 13    | 10:30          | **Compaction 1**                                                                    |
| 18-20 | 14:13-14:47    | CR20 discussion, defer CR21, think differently about API                            |
| 21    | 14:57          | **Compaction 2**                                                                    |
| 22-26 | 17:01-17:12    | Prompt template discussions, tool settings, search SDK docs                         |
| 27    | next day 01:17 | "Were these the changes we needed to persist the transcript field?"                 |
| 28-29 | 01:28-01:47    | Shares parallel coding work that might have caused conflicts                        |
| 32    | 12:40          | "Is it a mess? Do we need to commit and push?"                                      |
| 35    | 12:44          | Final: copy button feature request for prompt templates                             |

### Observations

1. **CWD unreliable — confirmed again**: CWD is prompt.supportsignal but the actual work is AWB (Agent Workflow Builder) field testing with YouTube Launch Optimizer workflow. File touches span AWB's poc/wui/ directory. This is the 5th+ confirmed case of prompt.supportsignal CWD being a "home terminal."

2. **Field testing is a distinct TEST subtype**: Not UAT (no pre-written test plan), not E2E (no automated test runner). David runs the AWB workflow manually, observes failures, and captures change requests (CRs). The output is a requirements document, not test results.

3. **User/engineer mode switching**: David explicitly declares he will switch between user (testing) and engineer (debugging) roles within the session. This dual-mode pattern is unique to field testing — the tester IS the developer.

4. **Change request numbering**: CRs are numbered (CR20, CR21, etc.) suggesting an ongoing CR log across sessions. David defers CR21 and asks for a conversation before proceeding — showing editorial control over what gets built.

5. **Parallel coding collision**: At prompt 28, David warns he "might have accidentally done some coding work in parallel that could have caused you some grief." This is a cross-session interference pattern — two sessions editing the same codebase simultaneously.

6. **Long-lived session across 4 days**: First event 2026-03-09 08:49, last event 2026-03-10 12:47. 1678 min wall clock with 4 idle gaps. The session survived overnight twice. Despite this, only 280 min active — highly intermittent.

---

## S4: f1ee6fea — brains CWD, appydave.com Website Build

### Classification

- **Registry**: BUILD (assumed from CWD brains)
- **Analysed type**: build.iterative_design
- **Confidence**: high
- **Reasoning**: CWD is brains/ but the actual work is on appydave.com — 28 Edit + 8 Write on Astro/React components (pages, components, styles). David iterates on the Digital Stage Summit landing page with QR codes, MailerLite signup form, Skool community CTA, and color palette improvements. 19 Playwright navigate calls for live preview. This is genuine feature construction — new pages, new components, design iteration with visual feedback. BUILD is correct, but CWD is incidental.

### Session Shape

- Events: 283 (31 user_prompt, 209 tool_use, 31 stop, 4 subagent_start, 5 subagent_stop)
- Duration: 125 min wall clock, 79 min active
- Idle gaps: 0
- Context compactions: 0
- Closing: "Can we deploy the website please?" followed by git add + push

### Prompt Timeline Highlights

| #   | Time (UTC) | Summary                                                                                    |
| --- | ---------- | ------------------------------------------------------------------------------------------ |
| 1   | 12:07      | "Do you know where my AppyDave site is?" — locating project                                |
| 2   | 12:11      | Changes to appydave.com dir, looks at QR codes                                             |
| 5   | 13:02      | Pastes terminal output of running local dev server                                         |
| 6   | 13:02      | "Can you open it using Playwright MCP and test it out?"                                    |
| 8   | 13:09      | Asks about manual deploy to Cloudflare                                                     |
| 10  | 13:10      | **Frustration**: "I don't want to quit my Chrome... Why are you forcing me to quit?"       |
| 14  | 13:20      | "Where did you get the QR codes from?" — verifying assets                                  |
| 15  | 13:24      | Design brief: two CTAs — Skool community + email signup                                    |
| 20  | 13:45      | "Isn't there a way to submit directly to MailerLite?"                                      |
| 21  | 13:46      | "Let's go with the embed script" — MailerLite integration                                  |
| 25  | 13:57      | **Frustration**: "Hold on, stop pushing. It doesn't even fucking work locally."            |
| 26  | 14:01      | "Using... the AppyStack brand recipe for AppyDave How would you improve the colour usage?" |
| 27  | 14:03      | "Still don't feel like you're using the recipe" — Claude ignoring brand guidelines         |
| 28  | 14:08      | "Change 'Book a call' to 'Join community'"                                                 |
| 31  | 14:10      | "Can we deploy the website please?"                                                        |

### Observations

1. **CWD brains/ is incidental**: All file edits target `/Users/davidcruwys/dev/ad/appydave.com/apps/web/`. The session was launched from brains/ terminal but immediately switched to appydave.com. This is a false project attribution from CWD — BUILD is correct, but the project is appydave.com, not brains.

2. **Two frustration events**: (a) Playwright MCP requiring Chrome quit — Claude suggested closing Chrome for Playwright, David objects. (b) MailerLite form not working locally — Claude pushed changes before verifying locally. Both are "Claude acting without verification" anti-patterns.

3. **Brand recipe compliance gap**: David explicitly asks Claude to use the AppyStack brand recipe for color improvements. Claude's first attempt ignores the recipe colors. David has to correct: "Still don't feel like you're using the recipe." This is a skill-gap-adjacent pattern — the recipe exists but Claude doesn't apply it effectively.

4. **Compact single-sitting session**: 125 min wall clock, 79 min active, zero idle gaps, zero compactions. This is the most focused session in the batch — a single continuous design iteration from project location to deployment.

5. **Full lifecycle in one session**: Locate project -> setup dev server -> Playwright preview -> design iteration -> MailerLite integration -> color refinement -> deploy. Rare to see a complete build-to-deploy cycle in one session without compactions.

6. **Subagent usage for exploration**: 4 subagents deployed — 2 for initial project exploration, 1 for dev setup, 1 for AppyStack recipe lookup. Short-lived (30-75 seconds each).

---

## S5: 26d4475f — flihub Ralphy Campaign (Manage Relay Refactor)

### Classification

- **Registry**: BUILD (assumed from CWD flihub)
- **Analysed type**: build.campaign
- **Confidence**: high
- **Reasoning**: Textbook Ralphy campaign. Opens with /ralphy, selects Extend mode, writes implementation plan, enters "build" mode. 10 subagents dispatched for parallel implementation. 63 Edit + 6 Write on product code (relay routes, shared types, config manager, components, tests). 85 Bash calls include test runs, build verification, git operations. The largest session in the batch (318 events) and the most efficiently structured — 8 user prompts driving 280 tool uses in 45 minutes.

### Session Shape

- Events: 318 (8 user_prompt, 280 tool_use, 8 stop, 10 subagent_start, 10 subagent_stop)
- Duration: 45 min wall clock, 45 min active
- Idle gaps: 0
- Context compactions: 0
- Closing: "Can you commit and push?" — clean commit_and_push

### Prompt Timeline Highlights

| #   | Time (UTC) | Summary                                                                                      |
| --- | ---------- | -------------------------------------------------------------------------------------------- |
| 1   | 15:00      | "/ralphy"                                                                                    |
| 2   | 15:01      | "Continue from the next-round brief — Extend mode, write the implementation plan for wave 1" |
| 3   | 15:05      | "build"                                                                                      |
| 4   | 15:24      | "yes" (approval to proceed)                                                                  |
| 5   | 15:33      | Side task: rsync operations on V-AppyDave folders                                            |
| 6   | 15:35      | Task notification (background agent complete)                                                |
| 7   | 15:39      | "MP3 files can be synced" — refining rsync exclusions                                        |
| 8   | 15:40      | "Can you commit and push?"                                                                   |

### Observations

1. **Peak Ralphy efficiency**: 8 prompts, 318 events, 45 minutes. Ratio of 35:1 tool_use:prompt. David gives minimal direction ("build", "yes") and Claude orchestrates 10 subagents for parallel implementation. This is the strongest example of build.campaign in the dataset.

2. **Manage Relay Refactor**: The actual work is refactoring FliHub's relay management — new routes, types, config, WatcherManager, UI components (ToolsSidebar, S3StagingTool, RelayTool, ManagePanel). Creates implementation plan, AGENTS.md, assessment, and learnings docs alongside code changes.

3. **10 subagents in 45 minutes**: Deployed in waves — 1 Explore agent for initial assessment, then 3 parallel general-purpose agents, then 2 more, then 1, then 2, then 1. This is the highest subagent density in the batch. Each runs 1-3 minutes.

4. **Mid-build side task**: At prompt 5, David asks about rsync operations on V-AppyDave — completely unrelated to the relay refactor. Claude handles both in parallel via a background task. This is a session_within_session pattern.

5. **Test-driven verification**: Multiple `npm test` calls and `npm run build -w server` for compilation verification. The `git stash && build && stash pop` pattern shows Claude working around uncommitted changes to verify compilation. Tests are used as gates, not as the primary deliverable.

6. **Clean lifecycle**: /ralphy -> plan -> build -> test -> commit -> push. No compactions, no idle gaps, no frustration. The most well-structured session in the batch.

---

## Cross-Session Patterns

### 1. UAT Feedback Loop (S1 + S2)

Sessions S1 and S2 overlap on March 9 (06:27-07:49). S2 generates the UAT plan, S1 collects Angela's feedback and implements fixes. At S2 prompt 20, David shares "feedback from the other window" — confirming concurrent cross-session work. These two sessions form a chain: S2 (plan) feeds S1 (execute based on feedback).

### 2. Compaction Correlates with Session Complexity, Not Duration

- S4 (125 min, 0 compactions) — focused single-topic
- S5 (45 min, 0 compactions) — efficient Ralphy campaign
- S1 (1204 min, 2 compactions) — multi-phase UAT iteration
- S2 (961 min, 3 compactions) — UAT plan + execution
- S3 (1678 min, 2 compactions) — intermittent field testing

The compaction count tracks with topic breadth and agent delegation volume, not wall-clock duration.

### 3. Ralphy Usage Spans Multiple Session Types

- S5: Ralphy for BUILD (build.campaign) — classic
- S2: Ralphy for TEST (UAT execution) — novel
- S3: Ralphy discussed for field testing follow-up — not yet invoked

Ralphy is a delegation pattern, not a session type indicator. The mode selection ("mode 3", "build") determines the session type.

### 4. CWD Reliability

- S1 (signal-studio): reliable — all work targets signal-studio
- S2 (signal-studio): reliable — UAT plan for signal-studio
- S3 (prompt.supportsignal): unreliable — actual work is AWB field testing
- S4 (brains): unreliable — actual work is appydave.com website
- S5 (flihub): reliable — all work targets flihub

3/5 reliable, 2/5 unreliable. Consistent with prior findings that prompt.supportsignal and brains are "home terminal" CWDs.

### 5. Heavy Sessions Are Genuine

All 5 sessions in this batch are substantive — zero junk. Heavy sessions (261-318 events) consistently contain real multi-phase work. This contrasts with micro/light sessions where 2/9 were junk (wave 5 finding).
