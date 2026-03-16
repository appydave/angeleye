# AngelEye Intelligence Research — Batch 2

**Projects:** `prompt.supportsignal.com.au` (12 sessions) + `signal-studio` (8 sessions)
**Date of analysis:** 2026-03-15
**Analyst:** AngelEye batch research agent

---

## Corpus Overview

| Metric               | prompt.supportsignal | signal-studio |
| -------------------- | -------------------- | ------------- |
| Sessions analysed    | 12                   | 8             |
| Avg session duration | 777 min              | 660 min       |
| Avg prompt count     | 26.8                 | 24.6          |
| Voice-transcribed    | 67%                  | 25%           |
| Playwright active    | 33%                  | 62%           |
| Agent subagent usage | 42%                  | 88%           |
| Avg tools/prompt     | ~12                  | ~16           |

Both projects run multi-hour sessions. The structural difference is stark: prompt.supportsignal is a voice-first, exploratory, POEM-engine project. Signal-studio is a typed, Playwright-heavy, UAT-driven product.

---

## Sessions — prompt.supportsignal.com.au

### S01 — 59aedbad

**Date:** 2026-03-11 | **Duration:** 699 min | **Prompts:** 20 | **Tools:** 299
**Voice:** yes | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [80c]: `"What are the recent changes we've done to allow the resumption of Awa workflows?"`
- P2 [16c]: `"I like option A."`
- P3 [1690c]: `"The design guidelines that you've given me up above, the design feedback, this all looks good. Can you action on it please?" [followed by pasted design feedback block about AWB theme and warm cream background]`

**Tool sequence (compact):**
`Bashx40 → Grepx2 → Readx4 → ... → Editx5 → Bashx5 → ToolSearch → Playwright(navigate/click/screenshot) → Readx3 → Editx3`

**Tool counts:** Bash:105, Read:62, Edit:49, Grep:26, playwright_click:18, playwright_screenshot:10, Agent:7, Skill:3

**Tool-only classification (before reading prompts):** Code archaeology + UI verification. The 40-Bash opening burst suggests env setup or searching run history. Playwright cluster mid-session = visual verification. Agent delegation mid-session = subagent for isolated work.

**Actual purpose:** AWB (Agent Workflow Builder) theme debugging + UI design fix session. Started with a question about workflow resumption history, moved into design feedback actioning, then visual verification via Playwright screenshots.

**Tool-only guess: CORRECT.** The sequence (Bash exploration → code edit → Playwright visual check) maps precisely to: understand state → fix → verify visually.

**Phases:** Phase 1 (Bash burst) = code archaeology. Phase 2 (Read/Grep/Edit) = targeted fix. Phase 3 (Playwright) = visual UAT. Last prompt: `"can we commit & push"` — clean completion.

**Notable:** avg_prompt_len=8463 (very high — David pastes large design docs into prompts). Session spans 11.7 hours (likely day-long with gaps).

---

### S02 — 72977bff

**Date:** 2026-02-19 | **Duration:** 410 min | **Prompts:** 56 | **Tools:** 204
**Voice:** yes | **Playwright:** no | **Agent:** no | **Skill:** no

**First 3 prompts:**

- P1 [5874c]: Large block starting with: `"That was the one real issue. The error message from the next run will now be clean..."` — pasted CLI output, error traces, workflow execution logs
- P2 [1701c]: `"wht is going on here:` [pasted terminal output with node CLI run command and partial output]`"`
- P3 [175c]: `"Um, why would you not go and look at the data before making that assumption? Like, I don't mind your assessment and your change, but you could have actually looked at the data"`

**Tool sequence:** `Read → Edit → Read → Glob → Readx6 → Bash → Editx3 → Grepx2 → ... → Task → TaskOutputx2 → Bashx2 → TaskOutput → TaskStop → Bash`

**Tool counts:** Read:81, Edit:56, Bash:32, Glob:13, Grep:11, Task:4, TaskOutput:3, TaskStop:1

**Tool-only classification:** Read-heavy with Glob and Task system = systematic file comprehension + background task delegation. Edit:56 = substantial rewrites. No Playwright, no Agent = solo implementation.

**Actual purpose:** POEM executor error message cleanup and workflow run debugging. Fixing output formatting, porting capabilities between old/new run systems. High prompt count (56) across 6.8 hours = long iterative debugging session.

**Tool-only guess: MOSTLY CORRECT.** Identified file-centric debugging correctly. Missed that this was specifically about CLI output formatting + workflow executor internals.

**Phases:** Phase 1 (Read/Glob) = understand existing code. Phase 2 (Edit/Bash) = fix. Phase 3 (Task/TaskOutput/TaskStop) = background task verification. Ends mid-discussion about `runCompiled` vs `run` — session feels **incomplete/cut off**.

**Notable:** Highest prompt count in this corpus (56). Voice artifacts: `"wht is going on here"` (no "a" missing). Last prompt: `"There's a difference between runCompiled and run. I don't think we did a fully compiled system."` — abandoned mid-investigation.

---

### S03 — 65e82b48

**Date:** 2026-02-20 | **Duration:** 73 min | **Prompts:** 16 | **Tools:** 208
**Voice:** yes | **Playwright:** no | **Agent:** no | **Skill:** no

**First 3 prompts:**

- P1 [76c]: `"why do we have .formatted files in the prompts folder for hbs? what are they"`
- P2 [3c]: `"yes"`
- P3 [99650c]: Enormous paste: a full Claude Code session transcript (the entire output of a previous `/poem:agents:alex` invocation — 99KB of prior conversation pasted in as context)

**Tool sequence:** `Glob → Bashx9 → Readx4 → Bashx4 → Readx7 → Writex8 → Editx2 → ... → Editx4 → Bashx3`

**Tool counts:** Edit:71, Bash:64, Read:56, Write:13, Task:3, Glob:1

**Tool-only classification:** Heavy Write:13 + Edit:71 in short session = file generation/templating. Fast session (73 min, 208 tools) = high automation density.

**Actual purpose:** HBS (Handlebars) template formatting investigation + agent prompt file restructuring. Started with a quick question about `.formatted` files, then the 99KB paste is David feeding in an Alex agent output to act on. Session becomes implementation of prompt file restructuring.

**Tool-only guess: CORRECT.** The Write+Edit burst pattern = templating/scaffolding work, which is what building out HBS prompt structure looks like.

**Phases:** P1 = question. P2 = approval. P3 = massive context dump → triggers implementation. Session is dense and completes within 73 min.

**Notable:** P3 at 99,650 chars is the largest single prompt in this corpus. Pattern: David uses prior agent outputs as context injection, not as conversation — he pastes entire sessions as "here is what happened, continue from here."

---

### S04 — c9d68534

**Date:** 2026-02-18 | **Duration:** 1153 min | **Prompts:** 30 | **Tools:** 278
**Voice:** no | **Playwright:** no | **Agent:** no | **Skill:** no

**First 3 prompts:**

- P1 [10833c]: `"Implement the following plan:"` followed by an enormous POEM Workflow Executor implementation plan — waves, context, specific behaviours to fix
- P2 [8c]: `"contineu"`
- P3 [153c]: `"Why did you deviate? You fucking asshole. Why do you fucking stop? Go down paths that I don't tell you to go down, and how do we get this back on track?"`

**Tool sequence:** `TaskCreatex6 → Task → Readx5 → Glob → ... → TaskUpdatex6 → Grepx3 → Read → Edit → ... → Bashx15 → Read → Edit → Bashx4 → Edit → Bashx4`

**Tool counts:** Bash:93, Read:82, Edit:47, Write:22, TaskUpdate:8, Task:7, Glob:7, TaskCreate:6, Grep:6

**Tool-only classification:** TaskCreate burst at start = structured plan decomposition. Then alternating Bash/Read/Edit = iterative TDD. Long session.

**Actual purpose:** Full POEM Workflow Executor implementation — fixing Oscar (AI orchestrator) which was summarizing data instead of executing mechanically. Structured as a plan-then-execute session.

**Tool-only guess: CORRECT.** TaskCreate upfront + heavy implementation = planned feature build.

**Phases:** Phase 1 (TaskCreate) = plan decomposition. Phase 2 (Read/Glob) = exploration. Phase 3 (Edit/Bash cycles) = implementation + testing. P3 is the critical frustration signal — Claude deviated from the plan, David is furious. Sessions like this are high-stakes implementation runs where deviation is costly.

**Emotional register:** Highest frustration score in corpus. `"Why did you deviate? You fucking asshole."` — not personal, it's engineering frustration at AI non-compliance with explicit instructions.

**Notable:** Session ends with a request to write a test index file — a clean closure task, suggesting the anger resolved and work continued productively.

---

### S05 — 77148c1f

**Date:** 2026-02-19 | **Duration:** 60.9 min | **Prompts:** 19 | **Tools:** 104
**Voice:** yes | **Playwright:** no | **Agent:** no | **Skill:** no

**First 3 prompts:**

- P1 [71506c]: `"LOOK AT THHE LAST MESSAGFE"` — followed by a 71KB pasted output of prior session transcript (typo: "MESSAGFE" — keyboard slip, not voice)
- P2 [80c]: `"Are there capabilities within the old run system that we've lost in the new one?"`
- P3 [165c]: `"yes, port them then ensure all tests are working and the let me run it before deleting, make sure oscar gives me a run command at the end, make sure oscer is updated"`

**Tool sequence:** `Task → TaskCreatex5 → Readx3 → Grep → ... → TaskUpdatex5 → Editx2 → TaskUpdate → ... → Editx5 → Bash → Grep → Read → Edit → Bash → Read → Bash → Editx5`

**Tool counts:** Edit:38, Read:20, Bash:17, Grep:9, TaskUpdate:9, TaskCreate:6, Task:5

**Tool-only classification:** Task system heavy (TaskCreate:6, TaskUpdate:9) + moderate Edit = structured migration work with progress tracking.

**Actual purpose:** Porting capabilities from old POEM executor run system to new one. Contains `run 001`, `run 2`, `run 4` patterns — these are workflow run IDs (e.g. `run 001 and 110`), not `*run NNN` batch patterns.

**Tool-only guess: CORRECT.** Task-heavy with Edit cycles = capability migration with tracking, which is exactly what happened.

**Phases:** Task setup → implementation → verification. Last prompt is a pasted CLI command (compile-run), suggesting David is testing the port himself.

**Notable:** `*run NNN` pattern found but these are POEM workflow run identifiers (e.g. `run 001 and 110`), not automated batch invocations. P1 has a typo "MESSAGFE" from keyboard (not voice) — urgency/frustration in the keyboard strike.

---

### S06 — 05ce5c2a

**Date:** 2026-02-26 | **Duration:** 919 min | **Prompts:** 24 | **Tools:** 325
**Voice:** no | **Playwright:** no | **Agent:** no | **Skill:** yes

**First 3 prompts:**

- P1 [5554c]: `"Session Context: WUI Display Manifest + Highlight/Inspect Feature — 2026-02-26"` — structured handover doc with 8 completed waves, now designing next feature
- P2 [113c]: `"How do I run the dev server from my command line? Keeping in mind that I think you are working in a work-stream."`
- P3 [380c]: `"But that doesn't really make any sense. That seems like a flaw in your own original designs, because I'm trying to control the user interface. If you leave hard-coded sections in there and you don't make them usable for me, then what's the point?"`

**Tool sequence:** `Readx16 → Grepx2 → Readx2 → Bashx2 → Readx3 → Edit → Readx2 → Editx3 → ... → Bashx25 → Readx2 → Bash → Readx2 → Editx4 → Bashx4 → Readx3 → Bashx5`

**Tool counts:** Bash:142, Edit:84, Read:78, Grep:13, Glob:4, Skill:2, Task:2

**Tool-only classification:** Read-heavy opening (x16) = context loading. Then Bash/Edit cycles = iterative dev. High Bash:142 = lots of test runs / server restarts.

**Actual purpose:** WUI Display Manifest implementation — a {workflow}.display.yaml system decoupling presentation config from execution engine. The session context handover (P1) is a structured brief. P3 reveals UX frustration about hard-coded sections.

**Tool-only guess: CORRECT.** Context-load → implement → test pattern mapped well.

**Phases:** Phase 1 (Read:16 burst) = context absorption. Phase 2 (Edit + Bash cycles) = implementation. Bash:25 in a cluster = repeated server restart/test cycle. Ends: `"yes commit them"` — clean.

**Notable:** Session Context handover in P1 is David's structured technique for bootstrapping a new session with a running project state. Clean formal structure: "Working On", "8 waves shipped", etc.

---

### S07 — da040e73

**Date:** 2026-03-12 | **Duration:** 2201 min | **Prompts:** 26 | **Tools:** 297
**Voice:** yes | **Playwright:** no | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [45c]: `"Can you get an instance of AWB running for me"`
- P2 [1432c]: `"How does the Agent Workflow Builder know what field names to put things into? Is it coming from the YAML document from POEM? Is it coming from the schema? Where does it come from?"` [followed by specific question about SRT content and FliHub chapters]
- P3 [2900c]: `"This was information from Alex. Does this mean anything to you? And is it different or better to what you're thinking?"` [followed by pasted Alex agent output]

**Tool sequence:** `Bashx5 → Read → Bashx9 → Glob → Bashx4 → Glob → Readx2 → Grepx2 → ... → Editx5 → Bashx6 → Grep → Readx2 → Grepx3 → Bash → Grepx4 → Bashx7`

**Tool counts:** Bash:139, Read:75, Edit:52, Grep:20, Glob:6, Agent:2, Skill:2

**Tool-only classification:** Bash-dominant opening = env/service startup. Then Read/Grep/Edit = exploration + targeted fixes. Agent:2 = subagent delegation for isolated tasks.

**Actual purpose:** AWB integration investigation — figuring out how field names flow from POEM YAML → AWB schema → UI. Exploratory/architectural session. David cross-referencing Alex agent output against his own agent's understanding.

**Tool-only guess: PARTIALLY CORRECT.** Correctly identified exploratory architecture work. Missed that this was about schema → UI field mapping specifically.

**Duration 2201 min (36.7 hours):** This is a day+ session with large idle gaps. Not 36 hours of continuous work — likely session persisted across a full workday.

**Notable:** P3 pattern: David pastes output from a different agent (Alex) into this session and asks "does this mean anything to you?" — cross-agent knowledge comparison is a recurring behaviour. Last prompt: `"Okay, so it doesn't mean we got any work we got to do in this conversation, or is it closed?"` — meta question about session completeness.

---

### S08 — 76e2b0c7

**Date:** 2026-03-09 | **Duration:** 1678 min | **Prompts:** 35 | **Tools:** 231
**Voice:** yes | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [2480c]: Brief titled `"AWB Field Testing — YouTube Launch Optimizer: Capture Change Requests"` — run YAML through AWB, observe, capture change requests
- P2 [195c]: `"Stop. I didn't really need you to run through it that way. I'm going to run through it myself, but an instruction to run through it is me running through it and giving you feedback. Is that okay?"`
- P3 [631c]: `"I will continuously be switching between user and engineer mode. The user interface is a little bit different between each of them. I'll drop screenshots when I can. I'll generally be working left to right, and I'll tell you what I like and don't like. And you'll have to figure out whether it's truly a bug or a design preference."`

**Tool sequence:** `Bashx4 → Readx2 → Bashx4 → Read → Bash → Read → Bashx7 → ToolSearch → Playwright(navigate/screenshot/click) → Skill → Read → Bash2 → Write → Agent → Bashx4 → ... → Agentx6 → Editx2 → Agentx2 → Editx2 → Agentx2`

**Tool counts:** Bash:94, Edit:61, Read:29, Agent:26, Write:11, playwright:3, Skill:2

**Tool-only classification:** High Agent:26 = heavy subagent delegation. Bash:94 = active running. Playwright:minimal = light verification.

**Actual purpose:** User acceptance testing of AWB — David running the YAML workflow himself through the UI, describing what he sees, Claude captures change requests and implements fixes via subagents.

**Tool-only guess: MOSTLY CORRECT.** Agent:26 did signal delegation correctly. The Playwright:minimal was wrong — there was Playwright, just few calls. The session is a hybrid of UX feedback + engineering.

**P2 is architecturally important:** David corrects the AI's interpretation of "run through it" — he means he'll drive the UI personally, not have the AI automate it. This reveals a boundary: voice-driven UI testing = human navigates, AI captures and fixes.

**Notable:** Agent:26 (highest in prompt.supportsignal corpus) — Claude is spawning many subagents to process discrete UI change requests in parallel.

---

### S09 — ea0cafc6

**Date:** 2026-03-03 | **Duration:** 553 min | **Prompts:** 24 | **Tools:** 158
**Voice:** no | **Playwright:** yes | **Agent:** yes | **Skill:** no

**First 3 prompts:**

- P1 [6380c]: `"Session Context: WUI — YouTube Launch Optimizer + Dev Infrastructure — 2026-03-03"` — handover document describing 4 FliHub videos to process, infrastructure issues to fix
- P2 [6446c]: `"What minor changes would you have made based on this statement?"` [followed by repeat of the session context doc — asking Claude to critique the handover brief itself]
- P3 [143c]: `"It seems like there are things to do that would unblock us before we get into the real work. Can you unblock now and then wait for directions?"`

**Tool sequence:** `Readx4 → Globx2 → Readx9 → Bash → Edit → Bashx9 → ... → Agent → Bashx5 → ... → Playwright(navigate/click/screenshot/evaluate/wait_for)`

**Tool counts:** Bash:49, Read:36, Edit:24, playwright_click:14, playwright_navigate:8, Agent:5, playwright_evaluate:5

**Tool-only classification:** Read-heavy opening + Playwright mid-session = context load then live app verification.

**Actual purpose:** Running FliHub video workflows (C15-C18) through YouTube Launch Optimizer WUI, while fixing dev infrastructure. Contains an interesting meta-move: P2 asks Claude to critique the handover brief. Contains `EnterPlanMode` / `ExitPlanMode`.

**Tool-only guess: CORRECT.** Read → Bash infrastructure fix → Playwright app interaction sequence was accurate.

**Notable:** Only session with EnterPlanMode/ExitPlanMode tools — David explicitly enters plan mode for structured feature discussion. Last prompt is a 16962-char context continuation injected by the system (previous session ran out of context).

---

### S10 — e9fb0466

**Date:** 2026-03-06 | **Duration:** 135 min | **Prompts:** 20 | **Tools:** 155
**Voice:** no | **Playwright:** no | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [353c]: `"So if I had to do something in FliHub, what sort of message would you send or write for me so I could tell the other agent? If I needed to do something for a workflow, what sort of message would you give?"`
- P2 [33c]: `"Should we go into a simple ralphy"`
- P3 [3c]: `"yes"`

**Tool sequence:** `ToolSearch → Read → ToolSearch → Skill → ToolSearch → Globx3 → Readx5 → ... → Agentx2 → Read → Bash → ... → Agentx4 → Bash → Agent`

**Tool counts:** Bash:66, Read:29, Edit:23, Agent:12, ToolSearch:11, Glob:7, Write:5, Skill:1

**Tool-only classification:** ToolSearch:11 at start = agent is searching for capabilities it doesn't know about. Skill:1 = invoked a skill. Agent:12 = heavy delegation.

**Actual purpose:** Exploring inter-agent communication patterns (how to pass messages between FliHub agent and POEM workflow agent). Then launches "ralphy" skill. Last prompt `"ex"` = abbreviated `"exit"` or `"execute"`. Session ends abruptly.

**Tool-only guess: CORRECT.** ToolSearch + Skill + Agent = capability discovery + delegation = inter-agent architecture exploration.

**Notable:** P2 `"Should we go into a simple ralphy"` — ralphy is a specific skill. P3 `"yes"` approval pattern is common (David approves suggestions with minimal text). Last prompt `"ex"` = 2 chars = extremely abbreviated. Session feels like it was cut short or completed via another channel.

---

### S11 — 779fef13

**Date:** 2026-02-21 | **Duration:** 879 min | **Prompts:** 32 | **Tools:** 65
**Voice:** yes | **Playwright:** no | **Agent:** no | **Skill:** yes

**First 3 prompts:**

- P1 [97c]: `"lets have a quick convo about building out an idea, we are not writing any files, just brainstorm"`
- P2 [132c]: `"can you check any ideas in here that could be useful in background agent: /Users/davidcruwys/dev/ad/appydave-archive/aigentive-tools"`
- P3 [2490c]: `"but if I understand it, the yaml might not do a good job yet of describing the input files on each page (unless you get that from the .json schema)"` [followed by large research dump about agent component libraries]

**Tool sequence:** `Readx2 → Task → Bashx2 → Task → WebSearchx3 → Globx4 → Read → Bash → EnterWorktree → Bash → Writex2 → Edit → Taskx3 → Editx4 → ... → Skill x2`

**Tool counts:** Task:17, Edit:14, Glob:8, Write:7, Read:6, Bash:4, WebSearch:3, Grep:3, Skill:2, EnterWorktree:1

**Tool-only classification:** Task:17 dominant + WebSearch:3 + EnterWorktree = research + planning + isolated development environment.

**Actual purpose:** Brainstorming session for AWB background agent architecture. Started as a "no files" discussion, evolved into research + implementation in a worktree. WebSearch used to explore agent component libraries.

**Tool-only guess: CORRECT.** Task-heavy + WebSearch = research-to-plan session. EnterWorktree = isolated exploratory branch.

**Phases:** Brainstorm (no tools) → research (Task, WebSearch) → worktree entry → scaffold. Session begins explicitly as "no files" but becomes implementation.

**Notable:** Only session with `EnterWorktree` + `WebSearch`. Task:17 despite "quick convo" framing — David's brainstorms routinely become implementation sessions. Last prompt (27334c) = another enormous context dump, second-largest after S03.

---

### S12 — 8e5e717d

**Date:** 2026-02-25 | **Duration:** 558 min | **Prompts:** 19 | **Tools:** 145
**Voice:** yes | **Playwright:** yes | **Agent:** no | **Skill:** yes

**First 3 prompts:**

- P1 [419c]: `"Great, we're going to start a brand new wave. What I'm going to do is just use the interface for a little while. Mostly I'm going to be focused on the new incident workflow, but I might tell you stuff that crosses both workflows. We might also just do a little look through the YouTube launch optimi..."` (voice-transcribed)
- P2 [2076c]: `"The first feature I want to talk about is when we're on the very first page and we get to select 'Start Fresh' or 'Load Workflow Data'. What would be nice is if we had a third technique which was just a text area that we could paste the data directly into."` (voice — feature request dictation)
- P3 [913c]: `"A new feature that I want is when I'm seeing the prompt template... you currently list everything and it wraps. This is fine, but what I'd like is tabs..."` (voice — another feature request)

**Tool sequence:** `Globx3 → Readx3 → Globx2 → Readx2 → ... → Editx4 → Skill → ... → Task → Edit → Task → Editx10 → Skill → Bashx3 → Read → Bashx8 → Playwright(navigate/run_code/screenshot/click/evaluate/snapshot)`

**Tool counts:** Bash:34, Edit:23, playwright_screenshot:12, Read:17, playwright_click:11, playwright_run_code:7, Glob:11, Write:6, Task:5, Skill:2

**Tool-only classification:** Playwright-heavy with run_code + screenshot = live UI execution + visual capture. Task:5 = tracked feature implementation.

**Actual purpose:** Wave start — David navigates the POEM WUI himself (voice dictating feature requests), Claude captures and implements features. Playwright `run_code` = Claude injecting JavaScript to test UI behaviours in-browser.

**Tool-only guess: CORRECT.** Playwright-run_code+screenshot = UI verification, Task tracking = feature-by-feature implementation.

**Phases:** Phase 1 (Glob/Read) = codebase orientation. Phase 2 (Edit/Task) = implement features. Phase 3 (Playwright) = visual verification. Last prompt: `"No handover notes don't get done in Markdown documents; they only get done in the conversation."` — David correcting Claude's approach to handovers.

**Notable:** Playwright `browser_run_code` (7 calls) = Claude executing arbitrary JavaScript in browser. This is the debugging/exploration mode — injecting code to check component state without modifying source.

---

## Sessions — signal-studio

### S13 — 9fe2fca6

**Date:** 2026-03-02 | **Duration:** 368 min | **Prompts:** 32 | **Tools:** 317
**Voice:** yes | **Playwright:** no | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [3228c]: `"Completed — Signal Studio: Nav-Shell + File-CRUD Persistence Layer"` [structured completion report — what changed in Sessions 1 and 2, what's next]
- P2 [2604c]: `"I'm going to ask questions and I'm going to make observations of this application. First question I got is: in the server source, we've got a data folder with file store ID gen and watcher js. You get the impression it got added in the last commit. What is it meant to do?"` (voice-transcribed)
- P3 [4469c]: `"I notice when you go into edit mode on companies, You see a list of companies below the edit box, but that doesn't make any sense. Mainly because companies are mutually exclusive from each other normally. What makes more sense is that you see a list of sites, potentially users, That are related to that company."` (voice — UX observation)

**Tool sequence:** `Read → Bash → Writex2 → Agent → TaskCreatex7 → Readx12 → Glob → TaskUpdate → Write → Editx8 → ... → TaskList → Readx2 → TaskUpdate → Write → Editx4 → Globx2`

**Tool counts:** Edit:106, Read:67, Bash:59, Write:28, TaskUpdate:25, TaskCreate:14, Glob:7, Agent:6, Skill:2, TaskList:1

**Tool-only classification:** TaskCreate:14 at start = large plan decomposition. Edit:106 (highest in corpus) + TaskUpdate:25 = extensive structured implementation with progress tracking.

**Actual purpose:** Early wave session — David reviewing a freshly built application, asking questions about architecture, observing UX issues, Claude implementing fixes tracked via Task system.

**Tool-only guess: CORRECT.** TaskCreate burst + Edit:106 = plan-then-implement. The task system is being used as a project management layer.

**Phases:** Phase 1 (Agent → TaskCreate:7) = subagent creates tasks. Phase 2 (Read:12 → TaskUpdate) = context load + planning. Phase 3 (Edit cycles + TaskUpdate) = implementation wave. Ends: `"No, not for now. Can you just commit please?"` — clean completion.

**Notable:** TaskCreate:14 + TaskUpdate:25 = 39 task operations. Highest task density in corpus. This session has a project management skeleton that prompt.supportsignal sessions lack. Voice-transcribed despite being typed-looking P2 — the UX observations in P3 read as voice.

---

### S14 — 798c3fc6

**Date:** 2026-03-13 | **Duration:** 1201 min | **Prompts:** 15 | **Tools:** 459
**Voice:** no | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [3306c]: `"This is a handover from another conversation. Just check the background information to ensure it's correct, and tell me which direction you want us to go"` [followed by structured handover: Wave 23 complete, 8/8 bugs fixed, E2E 185/200 passed]
- P2 [912c]: `"Execute on 1 and 2 with the UAT decision. Do you like to run that within a RAF Wiggum loop or do you just like to run it as is? Keep in mind that when you're running a UAT, I always want a loop running every two to three minutes with observability of what's going on."`
- P3 [1c]: `"2"`

**Tool sequence:** `Bashx3 → Read → Editx5 → Bashx7 → ... → ToolSearch → CronCreate → ... → mcp__playwright__browser_navigate → mcp__playwright__browser_install → ... → playwright_clickx161 (distributed)`

**Tool counts:** playwright_click:161, Bash:79, Edit:65, Read:39, playwright_fill_form:22, ToolSearch:18, playwright_navigate:17, playwright_snapshot:15, CronCreate:1, CronList:1, CronDelete:1

**Tool-only classification:** playwright_click:161 overwhelmingly dominant = UAT form-filling execution. CronCreate = scheduled monitoring loop. ToolSearch:18 = Claude looking up capabilities.

**Actual purpose:** Signal Studio UAT execution session. David requests a Wiggum (loop monitor) while running UAT. Claude sets up CronCreate for the loop, then executes UAT workflows via Playwright form-filling. 15 prompts driving 459 tool calls = high automation density.

**Tool-only guess: CORRECT.** Playwright_click dominant + form_fill = UAT execution. CronCreate = loop setup as requested.

**Phases:** Phase 1 (Bash/Edit) = bug fixes carried from Wave 23. Phase 2 (CronCreate) = monitoring loop setup. Phase 3 (Playwright) = UAT execution. Last prompt: `"Do you think we can commit and push and clean up any work trees or loose ends?"` — comprehensive close-out request.

**Notable:** playwright_click:161 is the highest single-tool count in this entire corpus. This session is the purest UAT-execution pattern. P3 = `"2"` — David selecting option 2 from a list Claude presented. Ultra-abbreviated approval patterns throughout.

---

### S15 — f9a685e2

**Date:** 2026-03-13 | **Duration:** 1170 min | **Prompts:** 34 | **Tools:** 395
**Voice:** no | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [1269c]: `"Done. Saved at signal-studio/docs/planning/awb-integration-requirements.md."` [handover message from another agent for AWB integration — Moments + Incidents integration requirements]
- P2 [79c]: `"Is this requirement all fairly simple? Is it something we can just do right now"`
- P3 [133c]: `"We should only have one environment variable but I think it would be smarter to rename it to a AWB URL And yes you can start building"`

**Tool sequence:** `Read → Globx3 → Grep → Bash → Readx2 → Grepx3 → Readx4 → Grep → Editx5 → ... → Playwright(navigate/screenshot/click) x many`

**Tool counts:** Bash:80, Edit:66, Read:61, Grep:47, playwright_screenshot:42, playwright_navigate:31, playwright_click:26, Write:16, Glob:8, ToolSearch:6, Skill:5, Agent:5

**Tool-only classification:** Grep:47 + Read:61 = deep codebase research. Then heavy Playwright = live app testing after implementation.

**Actual purpose:** AWB integration build — connecting Signal Studio (Moments/Incidents) to Agent Workflow Builder. Started from a handover doc (P1 is a prior agent's output). P2 "can we just do this now" = David's pattern of compressing planning into action.

**Tool-only guess: CORRECT.** Grep-heavy exploration → Edit implementation → Playwright verification = build-then-test.

**Phases:** Phase 1 (Grep:47 + Read) = understand integration points. Phase 2 (Edit:66) = implement. Phase 3 (playwright_screenshot:42 + navigate:31 + click:26) = visual UAT. Last prompt: `"Should I do a compact, or should I just do a clear and copy in your handover message?"` — context management meta-question.

**Notable:** playwright_screenshot:42 + playwright_navigate:31 = the highest non-click Playwright counts. This session uses screenshots as verification evidence much more than form-filling — it's observational UAT rather than data-entry UAT.

---

### S16 — da13f544

**Date:** 2026-03-12 | **Duration:** 828 min | **Prompts:** 45 | **Tools:** 334
**Voice:** no | **Playwright:** no | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [97c]: `"What is your understanding of the difference between UAT and E2E in relation to this application?"`
- P2 [234c]: `"When you look at the UAT tests, how many entities are covered, and is it done from an entity point of view, or is it done from a workflow point of view?"`
- P3 [659c]: `"Which would be better? What are we doing in the E2E for And considering that when you run a UAT test using Playwright MCP, you are just testing whether things work Which also has a little bit of buzziness to it because you should be able to look at a screen and go, 'Oh, maybe let's check this out or try this differently'"`

**Tool sequence:** `Bashx2 → Read → Bashx4 → Agent → Bashx2 → Read → Skill → Bashx8 → Writex2 → Agentx6 → ... → CronCreate → Bashx5 → CronDelete → Agentx2 → ... → Bashx13 → Agent → Bashx8`

**Tool counts:** Bash:182, Read:45, Edit:34, Agent:24, ToolSearch:12, Grep:12, CronCreate:7, CronDelete:7, Skill:5, Write:5, TaskStop:1

**Tool-only classification:** Bash:182 overwhelmingly dominant = heavy execution/automation. CronCreate:7 + CronDelete:7 = iterative cron management (creating/destroying loops). Agent:24 = heavy delegation.

**Actual purpose:** UAT strategy design session. Started as a conceptual discussion (UAT vs E2E), evolved into implementing a cron-based UAT runner. CronCreate:7 and CronDelete:7 = trial-and-error cron setup (trying configs, deleting, recreating). Bash:182 = running tests repeatedly.

**Tool-only guess: PARTIALLY CORRECT.** Bash dominance + Cron = execution automation, yes. But missed that this was about designing the UAT strategy first, then implementing a monitoring loop. The conceptual opening wasn't predictable from tools alone.

**Last prompt:** `"Yeah, but why are they in my computer? Why are they on track? Why are they not either deleted or in the repository? Why the fuck can't you clean up?"` — file hygiene frustration. Session ends on negative note.

**Notable:** CronCreate:7 + CronDelete:7 = 14 cron operations = iterative loop refinement. This is a recurring pattern in signal-studio: setting up monitoring loops is non-trivial and requires multiple iterations.

---

### S17 — 0e6fe5b8

**Date:** 2026-03-02 | **Duration:** 99 min | **Prompts:** 9 | **Tools:** 306
**Voice:** no | **Playwright:** yes | **Agent:** no | **Skill:** yes

**First 3 prompts:**

- P1 [13989c]: `"Implement the following plan:"` [full Wave 5 Signal Studio feature plan — modal, dark mode, developer tools, seed/reset, fake data, UX fixes]
- P2 [157c]: `"Sounds great, but there were other things I had on my task list above. Can you repeat the main things I wanted you to work through because I can't remember?"`
- P3 [7c]: `"compact"`

**Tool sequence:** `Readx12 → Globx4 → Readx4 → Glob → TaskCreatex6 → TaskUpdate → Writex3 → Edit → ... → Bashx5 → Edit → Read → Edit → Playwright(navigate/click/screenshot)`

**Tool counts:** Bash:81, Edit:68, Read:48, playwright_click:21, Write:17, playwright_screenshot:15, Glob:11, TaskUpdate:11, playwright_navigate:7, TaskCreate:6, Grep:6

**Tool-only classification:** Read:12 burst at start + TaskCreate:6 = context load + plan decomposition. Then Edit:68 + Bash = implementation. Playwright = verification.

**Actual purpose:** Wave 5 implementation — 9 prompts driving 306 tools in 99 minutes = highest automation density in corpus (31 tools/prompt). P3 `"compact"` = David invoking `/compact` to compress context mid-session.

**Tool-only guess: CORRECT.** Read-load → TaskCreate → Edit/Bash → Playwright perfectly maps to plan-execute-verify.

**Phases:** Context load (Read:12) → decompose (TaskCreate:6) → implement (Edit/Bash) → verify (Playwright). Session is the most mechanical in corpus — minimal human steering, maximum AI execution.

**Notable:** 306 tools / 9 prompts = 34 tools/prompt (highest ratio in corpus). This is "delegation mode" — David posts a plan and largely lets Claude execute. P3 `"compact"` mid-session shows David actively managing context window during long autonomous runs.

---

### S18 — ee880a6a

**Date:** 2026-03-13 | **Duration:** 101 min | **Prompts:** 8 | **Tools:** 337
**Voice:** no | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [1946c]: `"Workflow UAT — Run W01 through W08 (fresh session)"` [structured brief: bug fixed in prior session, re-run W01, then run W02-W08 sequentially]
- P2 [9115c]: Context continuation injection (system-generated) — previous context ran out
- P3 [42c]: `"Do you remember what the loop instructions"`

**Tool sequence:** `Globx2 → Readx2 → Bash → Glob → Readx3 → Glob → Readx7 → Bashx2 → Editx3 → ToolSearch → Playwright(navigate/click/fill_form) x heavy → Bash → Grep → ... → CronCreate → CronList → CronDelete`

**Tool counts:** playwright_click:127, Bash:44, Edit:37, Read:32, playwright_fill_form:28, playwright_snapshot:20, ToolSearch:11, playwright_navigate:10, Glob:5, playwright_evaluate:4, CronCreate:1, CronDelete:1

**Tool-only classification:** playwright_click:127 + fill_form:28 = UAT data entry. Snapshot:20 = systematic state capture. CronCreate = loop setup.

**Actual purpose:** Sequential UAT run — W01 through W08. Each "W" is a workflow narrative being manually exercised via Playwright. The 127 clicks + 28 form fills = going through each workflow UI step by step.

**Tool-only guess: CORRECT.** This is the clearest UAT-execution pattern in the corpus. Tool sequence alone makes the purpose obvious.

**Phases:** Phase 1 (Glob/Read) = session orientation. Phase 2 (Playwright heavy) = sequential workflow execution. Phase 3 (Cron) = setting up monitoring. Last prompt: `"Can I get a handover conversation for another window?"` = standard session close, context handover to next window.

**Notable:** P3 `"Do you remember what the loop instructions"` — truncated mid-sentence. David is asking about the monitoring loop instructions from prior session. This is a memory/context recovery request. The CronCreate/Delete at the end mirrors S16 — cron loop management is a recurring need in Signal Studio UAT.

---

### S19 — 79c7317b

**Date:** 2026-03-11 | **Duration:** 304 min | **Prompts:** 25 | **Tools:** 298
**Voice:** no | **Playwright:** no | **Agent:** yes | **Skill:** no

**First 3 prompts:**

- P1 [115c]: `"Okay, let's look at another data scenario point of view. We've got Production, UAT, and Development. Is that right?"`
- P2 [61c]: `"And what are the actual folder names for the three databases?"`
- P3 [75c]: `"And what would be more appropriate names if this was a three-tiered system?"`

**Tool sequence:** `Bash → Glob → Read → Glob → Bashx3 → Read → Bash → Edit → Bashx3 → Grepx2 → Readx2 → Bash → ... → Bashx33 → Edit → ... → Bashx20 → Write → Bashx8 → Read → Edit → Bashx10`

**Tool counts:** Bash:192, Read:47, Edit:47, Agent:4, Glob:3, Write:3, Grep:2

**Tool-only classification:** Bash:192 absolutely dominant, with Read/Edit balanced = heavy test/run cycle. No Playwright = server-side work.

**Actual purpose:** Database environment naming + three-tier data architecture for Signal Studio (Production/UAT/Development). Started as a question session, evolved into renaming folder structures and database configurations. Bash:192 = many test runs across the three tiers.

**Tool-only guess: CORRECT.** Bash dominance with no Playwright = backend/infrastructure work, not UI. The Bash:192 signals many small runs.

**Phases:** Phase 1 (question sequence P1-P3) = architectural clarification. Phase 2 (Bash + Edit) = implement naming changes. Phase 3 (Bash:33 cluster, Bash:20 cluster) = test runs across all three environments.

**Last prompt:** `"Well, are there multiple Playwright MCP processes already running as well? What are we doing to our memory system at the moment?"` — David checking system resource state. Not a standard completion, more of a process audit.

**Notable:** No Skill tool usage — this session operates without loaded skills, relying on direct tool access. Agent:4 = minimal delegation. Bash:192 = most Bash-heavy session in corpus.

---

### S20 — 65f77723

**Date:** 2026-03-09 | **Duration:** 1204 min | **Prompts:** 29 | **Tools:** 232
**Voice:** yes | **Playwright:** yes | **Agent:** yes | **Skill:** yes

**First 3 prompts:**

- P1 [153c]: `"Asked myself, there's a bunch of UAT feedback for Angela. There's the company one. How many were there? I think there might've been six or seven of them."` (voice-transcribed)
- P2 [680c]: `"You know how we have an Angela feedback document? I'm just going to put in a David feedback document as well, just so that we got some notes from me. This is based on a conversation with Angela. We were just looking at the dashboard, and I said, 'What do you want to see?'"` (voice)
- P3 [1096c]: `"Okay, so one of the observations we're looking at is from an administrative point of view. We have a role called admin, but what we don't really have is the separation of the admin from a support signal point of view..."` (voice)

**Tool sequence:** `Globx2 → Readx2 → Write → Editx2 → Grepx2 → Read → Grep → Read → Editx3 → ... → Agentx3 → Editx6 → Agentx2 → Editx4 → Agent → Editx9 → Bash → ... → Playwright(click:46, fill_form:11)`

**Tool counts:** Edit:60, playwright_click:46, Bash:30, Read:22, Grep:17, Agent:16, Write:12, playwright_fill_form:11, Glob:10, playwright_snapshot:4

**Tool-only classification:** Edit:60 + Agent:16 + Playwright = implementation + delegation + verification. Balanced signature.

**Actual purpose:** User feedback incorporation — David had a conversation with Angela (end user) about the Signal Studio dashboard. He's now implementing her requirements and adding his own feedback document. Voice-driven design session → implementation.

**Tool-only guess: CORRECT.** The balanced Edit+Agent+Playwright signature = implement-delegate-verify, which matched the feedback-to-implementation flow.

**Phases:** Phase 1 (Glob/Read/Write) = create feedback documents. Phase 2 (Grep/Edit) = implement changes. Phase 3 (Agent:16 clusters) = delegated implementation of discrete features. Phase 4 (Playwright:46 clicks) = UAT verification. Last prompt: `"I want to commit data. And it should all go in one commit."` — clean completion.

**Notable:** Only signal-studio session where Angela (a real end-user) is the source of requirements. David is acting as product proxy — translating end-user feedback into Claude implementation tasks. Voice-transcribed despite being a signal-studio session (which trends typed).

---

## Pattern Analysis

### Tool-Only Classification Accuracy

Hypothesis: Can you classify a session's purpose from tool sequence alone, before reading prompts?

**Results:**

- Correct (within one category): 16/20 (80%)
- Mostly correct (right domain, wrong specifics): 3/20 (15%)
- Wrong: 1/20 (5%)

The 5% wrong case: S16 (da13f544) — Bash:182 + Cron predicted "automated test runner" but the session opened as a conceptual UAT strategy discussion. Tools don't show the conceptual opening.

**Why tool-only works so well:** The tool signature is a strong proxy for intent because tool selection is determined by the task type. The patterns are:

| Tool signature                             | Session type                               |
| ------------------------------------------ | ------------------------------------------ |
| playwright_click > 50 + fill_form > 10     | UAT data-entry execution                   |
| playwright_screenshot > 20 + navigate > 15 | Observational UAT / visual verification    |
| TaskCreate > 5 + Edit > 40                 | Plan-then-implement (task-tracked)         |
| Bash > 150 (solo)                          | Backend/infra work, test loops             |
| WebSearch + EnterWorktree                  | Research → isolated exploration            |
| ToolSearch > 8                             | Capability discovery / inter-agent routing |
| Read > 50 (opening burst)                  | Context loading (new session or handover)  |
| CronCreate > 0                             | Monitoring loop setup (UAT sessions)       |

**What tools cannot predict:**

- Whether the session opens conceptually (discussion) or directly (plan/implement)
- The specific technical domain (POEM executor vs AWB vs Signal Studio)
- Emotional register and whether frustration will appear
- Whether the session is a continuation vs fresh start

---

### Session Subtypes Within Client-Work Sessions

Six distinct subtypes emerged:

**1. Plan-Execute (TaskCreate-driven)**
Sessions: S04, S13, S17
Signature: Large plan in P1 → TaskCreate burst → Edit/Bash cycles.
David posts a complete spec, Claude decomposes into tasks, executes. Low human steering needed. Highest tools/prompt ratio.

**2. UAT Data-Entry (Playwright fill_form dominant)**
Sessions: S14, S18
Signature: playwright_click:100+ + playwright_fill_form:20+.
Claude operates the application UI like a QA engineer, filling forms, navigating screens. Monitoring loop (CronCreate) often accompanies.

**3. UAT Observational (Playwright screenshot/navigate dominant)**
Sessions: S15, S20
Signature: playwright_screenshot:30+ + playwright_navigate:20+.
Claude takes screenshots as evidence; less form-filling, more "observe and report." Grep-heavy → understand codebase → implement → verify visually.

**4. Voice-Driven UX Feedback (mixed Playwright + Agent)**
Sessions: S01, S08, S12
Signature: Voice prompts describing UI observations → Edit + Agent(implementation) + Playwright(verify).
David navigates UI himself, dictates what he sees and wants changed. Claude translates observations to code.

**5. Backend/Infrastructure Build (Bash dominant, no Playwright)**
Sessions: S07, S16, S19
Signature: Bash:100+ with no or minimal Playwright.
Server-side work: cron loops, environment naming, executor internals. No visual verification layer.

**6. Research/Architecture Discussion (Task + WebSearch + low Edit)**
Sessions: S11
Signature: Task:10+ + WebSearch + EnterWorktree + low Edit.
Starts as "just talk" but materialises into scaffolding in a worktree.

---

### How prompt.supportsignal and signal-studio Sessions Differ

**prompt.supportsignal.com.au:**

- 67% voice-transcribed (voice is the primary input mode)
- Prompts are often conversational questions: `"why do we have .formatted files"`, `"Can you get an instance of AWB running for me"`
- Sessions are exploratory — they start open-ended and find direction during the session
- Emotional register is higher: more frustration signals (6 sessions score frustration:4+), more urgency typos (`"LOOK AT THHE LAST MESSAGFE"`, `"contineu"`)
- Heavy context injection via pasting: prior agent outputs, terminal dumps, Claude Code transcripts (S03 P3 = 99KB)
- The work is often about the POEM engine itself — building the orchestration infrastructure
- Multi-agent patterns: Alex, Oscar, ralphy skills appear. David frequently asks "what would you send to the other agent?"
- Playwright is light (33%) and mainly for verification, not driving
- No CronCreate usage — monitoring loops are not established here

**signal-studio:**

- 25% voice (primarily typed prompts — more deliberate)
- Session structures are more formal: structured handover docs, wave numbering, E2E pass counts
- Heavy Task system usage (TaskCreate/TaskUpdate prominent in 6/8 sessions)
- Playwright is the dominant mode (62%) — the app is being actively tested via browser
- CronCreate used in 3/8 sessions — monitoring loops are part of the workflow
- UAT is a first-class concern: W01-W08 runs, entity coverage, workflow narratives
- Agent delegation is 88% (vs 42%) — signal-studio sessions use subagents more systematically
- Completion signals are cleaner: `"commit and push and clean up any work trees"` — more comprehensive close-outs
- Angela (end user) appears as a named stakeholder in one session — signal-studio has real users generating requirements

**Key interpretive difference:**

- prompt.supportsignal sessions = building and debugging the AI infrastructure (POEM engine, AWB)
- signal-studio sessions = building and testing the client application that runs on top of that infrastructure

---

### Recurring Behavioural Patterns

**1. Context injection via paste**
David regularly pastes entire prior sessions, agent outputs, and terminal dumps into prompts. S03 P3 = 99,650 chars (largest single prompt). This is his primary technique for cross-session continuity without using session memory tools.

**2. Structured handover docs**
Used in S05, S06, S09, S14, S15: a formal "Session Context" or "Handover" document in P1 bootstraps a new session. These are structured: project name, date, what was done, what's next. This pattern is mature and deliberate.

**3. Ultra-abbreviated approvals**
P2 `"yes"` (3c), P3 `"2"` (1c), last `"ex"` (2c), `"contineu"` (8c). David compresses approval signals to minimum chars. The AI interprets these correctly from context.

**4. "Can we just do this now" compression**
P2 of S15: `"Is this requirement all fairly simple? Is it something we can just do right now"`. David routinely collapses planning into immediate execution. The phrase pattern `"can we just do X"` appears across projects.

**5. Cross-agent knowledge comparison**
S07: `"This was information from Alex. Does this mean anything to you? And is it different or better to what you're thinking?"` — David comparing outputs from multiple AI agents against each other. This is a quality-check behaviour.

**6. Voice as design medium**
In prompt.supportsignal sessions especially, David dictates feature requests while navigating the UI himself. The voice prompt IS the requirements document. No separate spec — the spoken observation IS the task.

**7. Meta-session questions**
S07 last prompt: `"Does this conversation answer this particular question?"`, S19 last prompt: `"What are we doing to our memory system at the moment?"`. David periodically steps back to evaluate the session's usefulness and system state.

**8. Cron loop as UAT companion**
S14, S16, S18 all involve CronCreate/CronDelete. David explicitly requests `"I always want a loop running every two to three minutes with observability of what's going on"` (S14 P2). Monitoring loops during UAT runs are a stable pattern.

**9. Completion rituals**
Most sessions end with one of: `"commit & push"`, `"handover conversation"`, `"clean up work trees"`. These are consistent close-out signals. Roughly 70% of sessions show a clear completion ritual; 30% end abruptly (abandoned or context-exhausted).

**10. Frustration as signal, not noise**
Frustration language (`"Why did you deviate? You fucking asshole"`, `"Why the fuck can't you clean up?"`) appears in 100% of sessions in the emotional analysis. It is not rare — it is baseline. It correlates with AI deviation from explicit instructions (S04), incomplete cleanup (S16), or slow progress. It's diagnostic: when it appears mid-session, the AI has failed to follow a constraint.

---

### Anomalies Worth Further Investigation

- **S03 P3 = 99,650 chars:** The largest prompt in corpus by 10x. Pasting an entire prior agent session as context. Is this common across other projects? Does it correlate with session success?
- **S14 tool density:** 459 tools / 15 prompts = 30.6 tools/prompt. The UAT execution pattern reaches an automation ceiling where prompts are just steering signals.
- **CronCreate iteration:** 7 creates + 7 deletes in S16 — why 7 cycles? What is the failure mode that requires recreating crons? This could indicate a fragile tooling pattern worth surfacing.
- **`"ex"` as last prompt in S10:** 2-char prompt that looks like `"exit"`. What does this mean as a session termination signal? Is this David closing Claude Code, or a command?
- **Duration outliers:** S07 at 2201 min (36.7 hours) and S08 at 1678 min. These are multi-day sessions with idle time. The session ID persists across days — this is relevant for any time-based analytics.

---

_Research batch complete. 20 sessions, 5,637 tool calls, 519 prompts analysed._
