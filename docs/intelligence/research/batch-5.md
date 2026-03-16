# Batch 5 — Marathon Sessions & Junk Stubs

**Research date:** 2026-03-15
**Analyst:** AngelEye intelligence agent
**Data source:** `~/.claude/angeleye/sessions/` (JSONL event files) + `~/.claude/angeleye/registry.json`

**Purpose:** Deep pattern research on marathon sessions (Group A: 15 largest files) and stub/junk sessions (Group B: 5 smallest files). Test hypothesis that marathon sessions contain distinct conceptual phases. Derive reliable junk-exclusion signals.

---

## Group B — Tiny Sessions (Junk/Stub Analysis)

### B1 — session-test-debug-001.jsonl (206 bytes)

**Single prompt:** "Hello how can I help you today"
**Events:** 1 (user_prompt only)
**CWD:** /tmp/test
**Registry:** No normal registry entry (partial entry with no project/status fields)
**Source:** hook (not transcript)
**Classification:** Test/debug seed data — synthetic, injected by the AngelEye development team to validate hook plumbing. The reversed greeting ("Hello how can I help you today" is what Claude says, not the user) and the `/tmp/test` cwd are dead giveaways.
**Discard?** Yes — definitively. This is fixture data.

---

### B2 — session-7536c619-1622-43cd-88ba-06d39e16731a.jsonl (208 bytes)

**Single prompt:** "x"
**Events:** 1
**CWD:** /private/tmp
**Registry status:** ended
**Project:** tmp
**last_active delta:** ~1 second after started_at
**Classification:** Accidental keystroke. User typed "x" in a fresh Claude session started in /tmp, probably a terminal accident. No follow-up, instant close.
**Discard?** Yes — single-character prompt + /tmp cwd + 1-second session = definitive discard.

---

### B3 — session-agent-a3f450c.jsonl (218 bytes)

**Single prompt:** "Warmup"
**Events:** 1
**CWD:** /Users/davidcruwys/dev/ad/brain-dynamous
**Timestamp:** 2026-02-28T02:24:20.639Z
**Classification:** Agent warmup stub. Session ID uses `agent-` prefix rather than UUID format, placing it outside normal Claude Code sessions. The cwd is a brain directory. The "Warmup" prompt is a known pattern for initialising background agents before a real task. No tool use, no response captured.
**Discard?** Yes — warmup-only agent sessions contain no useful signal. They are scaffolding for a parent session tracked elsewhere.

---

### B4 — session-agent-af5e8ab.jsonl (218 bytes)

**Single prompt:** "Warmup"
**Events:** 1
**CWD:** /Users/davidcruwys/dev/ad/brain-dynamous
**Timestamp:** 2026-02-28T02:24:20.646Z
**Classification:** Identical to B3. Created within milliseconds of B3 (6ms gap), same cwd, same prompt. This is a parallel agent warmup pair. The session IDs use short hex suffixes rather than UUIDs — clearly system-generated agent IDs.
**Discard?** Yes — same as B3. Parallel agent pair, no signal.

---

### B5 — session-3347d7b5-da27-4687-8328-2088f59b9221.jsonl (228 bytes)

**Single prompt:** "x"
**Events:** 1
**CWD:** /Users/davidcruwys/dev/ad/brains
**Timestamp:** 2026-02-21T00:34:36.059Z
**Classification:** Accidental keystroke in a legitimate working directory (the brains repo). Despite the real CWD, a single "x" prompt with no further events indicates the user opened a terminal, typed "x" (perhaps testing keybinding or accidentally triggering Claude), and closed it. No tool use.
**Discard?** Yes — same as B2 but in a real directory. The prompt content ("x") overrides the CWD signal.

---

### Group B Patterns Summary

| Signal                                              | Reliability                                 |
| --------------------------------------------------- | ------------------------------------------- |
| Total events == 1                                   | Near-certain discard                        |
| Single-character prompt ("x", "q", etc.)            | Definitive discard                          |
| CWD == /tmp or /private/tmp                         | Strong discard signal                       |
| Session ID uses `agent-` prefix                     | Discard if single event (warmup stub)       |
| Prompt is reversed (model-speak, not user-speak)    | Synthetic test data                         |
| Registry last_active within 5 seconds of started_at | Strong discard signal                       |
| File size < 300 bytes                               | Candidate for review, not automatic discard |

**Reliable auto-discard rule:** If `total_events == 1` AND (`prompt.length <= 2` OR `cwd in ["/tmp", "/private/tmp"]` OR `session_id starts with "agent-"`), classify as discard. Apply human review to any 1-event session with a real prompt (B5-like "What projects do I have?" cases at 251 bytes are borderline — technically keep as signal).

**Edge case — session-c6f3306c (251 bytes):** Single prompt "What projects do I have?" in /brains — this is NOT junk. It's a legitimate one-shot question that got no follow-up. The threshold must account for prompt semantic weight, not just event count.

---

## Group A — Marathon Sessions (15 Largest Files)

---

### A1 — session-2ed25517 (305 KB, 722 events, 36 prompts, 8.5 hours)

**File:** session-2ed25517-9969-4471-b996-05c7223959bf.jsonl
**Timespan:** 2026-03-08T06:44 → 15:13
**CWD:** /Users/davidcruwys/dev/ad/brains
**Tool distribution:** Bash 174, browser_evaluate 163, browser_navigate 146, browser_click 51, browser_type 45, browser_snapshot 40, ToolSearch 23, Read 6, Edit 5, Write 5, WebFetch 1, Agent 1
**Stop event:** None captured

**First 3 prompts:**

1. `[06:44]` "Do deep research into two different concepts: 1. Second brains as they relate to what I've been working on recently... 2. Where is the original git repo that the dynamus cole medan system was used in?"
2. `[06:54]` "Yeah, please check it out. It seems like it's not available anymore, and I'm not sure why."
3. `[09:07]` "If I give you access to cirle, with a login, can you identify core areas of his repository and his community?"

**Last 2 prompts:**

1. `[15:12]` "Can you commit and push please?"
2. `[15:12]` "continue"

**Context handover injections:** 10 (positions 16, 18–26, 32) — all are "This session is being continued from a previous conversation" compaction summaries. The injections begin at prompt 16 (~13:03) and are dense through prompts 18–26, meaning the context window was compacted 10 times during a single session. Each compaction preserved the same core task: downloading Dynamous community event transcripts.

**Phase analysis — this is the clearest multi-phase session in the dataset:**

- **Phase 1 (06:44–09:17):** Research. Brain ecosystem investigation, finding the Cole Medin dynamous-engine repo, determining if it's still available. Primarily Bash + ToolSearch.
- **Phase 2 (09:07–09:17):** Community access. User provides login credentials for community.dynamous.ai. Claude begins Playwright-based browser navigation.
- **Phase 3 (09:17–~13:00):** Data extraction. Playwright-heavy: navigating Circle community pages, downloading VTT transcript files. 146 browser_navigate calls, 163 browser_evaluate calls — this is sustained automated scraping.
- **Phase 4 (~13:00–14:46):** Context crisis. 10 successive handover injections as context keeps filling from transcript-heavy content. The user is mostly passive ("Yeah.", "continue") — the agent is driving.
- **Phase 5 (14:46–15:13):** Synthesis and documentation. The user asks about documentation, a second brain librarian question, then requests commit/push.

**Frustration/abandonment signals:** None explicit. Session ends with a clean commit request and a trailing "continue" — likely the compaction state interrupted mid-response.

**What the human was trying to accomplish:** Build a local archive of Cole Medin's Dynamous community event transcripts. This was a multi-hour automated scraping task dressed up as a research session. The real work was in Phase 3 (the agent driving the browser in a loop).

**Hypothesis test:** This session should absolutely have been 5 separate sessions. The phase boundaries are clean: research, access setup, scraping, synthesis, documentation. The context compaction at prompt 16 is where the second "session" begins conceptually. Each compaction after that is a failed attempt to keep one logical operation running — the system was fighting its own context limits.

---

### A2 — session-651ffc0f (271 KB, 28 events, 9 prompts, 16.8 hours)

**File:** session-651ffc0f-ca7c-4898-8cdb-af7b4bbb9d13.jsonl
**Timespan:** 2026-03-12T08:49 → 2026-03-13T01:38
**CWD:** /Users/davidcruwys/dev/ad/apps/angeleye
**Tool distribution:** Bash 10, Glob 7, Read 1, Edit 1
**Stop event:** None

**Note on file size vs event count:** 271 KB for only 28 events is anomalous. This indicates the events themselves contain very large payloads — likely the handover messages and pasted conversation transcripts that are embedded in the prompts.

**First 3 prompts:**

1. `[08:49]` "Can you just read this information and verify that everything that you notice about the handover message is accurate from a file name and location point of view?" — followed by a large pasted handover block about AngelEye requirements.
2. `[08:52]` "Can you confirm that those two folders really aren't there..."
3. `[08:53]` "Does the requirements document that you read give you everything you need to know? Is there anything from the original conversation..."

**Last 2 prompts:**

1. `[Mar 13, 01:34]` — A paste of the Claude Code welcome banner (accidental paste of terminal output)
2. `[Mar 13, 01:38]` "I don't think you've really given me a good understanding of what we're doing. You've given me a current state, which is partly wrong too... I wanted to know what this is all about. The nature of the conversation."

**Context handover injections:** 4 (positions 1, 2, 3, 8) — the session opens with 3 consecutive handover-style prompts. The user is doing context bootstrapping from the start.

**Phase analysis:**

- **Phase 1 (08:49–08:55):** Verification of a handover document for AngelEye requirements — verifying file paths and accuracy.
- **Gap (8:55 → 01:34 next day):** ~16.5 hour gap. No events. The session went dormant — this is two separate working days sharing one session ID.
- **Phase 2 (01:34–01:38):** User resumes with an accidental paste of terminal output, then expresses frustration that the session context doesn't reflect what they were trying to understand.

**Frustration signals:** The final prompt is a clean frustration marker — "I don't think you've really given me a good understanding of what we're doing." This session ended on a note of dissatisfaction. The context had gone stale over the 16-hour gap.

**What the human was trying to accomplish:** Validate the AngelEye requirements document and understand the project context from a fresh session. The resumption the next morning was a failed attempt — the session had lost coherence.

**Hypothesis test:** The 16-hour gap is a natural split point. These should be classified as two sessions: a brief morning verification task and a disconnected next-day resumption.

---

### A3 — session-201aec50 (270 KB, 125 events, 13 prompts, 25 hours)

**File:** session-201aec50-56a8-449c-b619-8f8dafe71fe2.jsonl
**Timespan:** 2026-03-13T01:40 → 2026-03-14T02:41
**CWD:** /Users/davidcruwys/dev/ad/apps/angeleye
**Tool distribution:** Bash 44, Glob 10, Read 5, Write 5, Edit 4, ToolSearch 3, Agent 6, Skill 1, mcp_playwright_navigate 14, mcp_playwright_screenshot 12, mcp_playwright_tabs 8
**Stop event:** None

**First 3 prompts:**

1. `[01:40]` "Read and absorb this information... give me a bullet point list of the things that we're likely to achieve if we were to implement this. What is this essentially about, these requirements?" — AngelEye requirements ingestion
2. `[01:41]` Exact duplicate of prompt 1 (double-send)
3. `[01:47]` "If we were doing a notebook LLM prompt based on the information you just sent me, what would be three different prompts that we could use for generating visuals?"

**Last 2 prompts:**

1. `[Mar 14, 02:36]` "One of the other things I want: firstly, give me more clarity about the word 'Ambient Intelligence'. That sounds interesting. One of the things I want is that when it recognises patterns in my prompts, it starts suggesting the idea to create skills..."
2. `[Mar 14, 02:39]` "This terminology and stuff that we're doing around ANGEL-I, there's a lot of good stuff in here that should be taken over to the second brain... Then what I want is a full get ready to near completion and hand over."

**Context handover injections:** 2 (positions 1, 2) — both are the same large requirements paste. The duplicate at position 2 was a user re-send.

**Phase analysis:**

- **Phase 1 (01:40–~04:00):** Requirements comprehension and creative exploration. User is absorbing the AngelEye spec, asking for summaries, notebook prompts, visual ideas.
- **Gap (~04:00 → ~afternoon):** A substantial gap — session dormant during the day.
- **Phase 2 (~afternoon):** Practical implementation. Playwright screenshots, writing, editing — actual AngelEye app work.
- **Phase 3 (Mar 14, 02:36–02:41):** Synthesis and handover. Discussion of "Ambient Intelligence" concept, request to write findings to second brain, then explicit handover request.

**What the human was trying to accomplish:** Bootstrap understanding of AngelEye requirements, do some early exploration, then (much later) implement parts of it and finally codify the conceptual insights into the brain system before closing the session.

**Hypothesis test:** 3 clear phases. The split at the end of Phase 1 (after requirements comprehension) and before Phase 3 (handover) are the natural boundaries.

---

### A4 — session-59aedbad (262 KB, 319 events, 20 prompts, 11.7 hours)

**File:** session-59aedbad-6082-4b56-bd79-fe7e795e1074.jsonl
**Timespan:** 2026-03-11T11:39 → 23:19
**CWD:** /supportsignal/prompt.supportsignal.com.au → poc/wui → poc/wui/client
**Tool distribution:** Bash 105, Read 62, Edit 49, Grep 26, Agent 7, Playwright click 18, Playwright screenshot 10, ToolSearch 5, Skill 3, Playwright navigate 4, Playwright snapshot 5, Write 2, Glob 2
**Stop event:** None

**First 3 prompts:**

1. `[11:39]` "What are the recent changes we've done to allow the resumption of Awa workflows?"
2. `[11:57]` "I like option A."
3. `[12:10]` "The design guidelines that you've given me up above, the design feedback, this all looks good. Can you action on it please?"

**Last 2 prompts:**

1. `[14:46]` Context handover injection — "This session is being continued from a previous conversation that ran out of context. Summary: Complete DataPanel redesign..."
2. `[23:18]` "can we commit & push"

**Context handover injections:** 3 (positions 8, 16, 19) — positioned roughly every 3 hours, indicating heavy context consumption from reading large codebases.

**Phase analysis:**

- **Phase 1 (11:39–12:10):** Investigation. Understanding recent AWB workflow resumption changes.
- **Phase 2 (12:10–14:46):** Design implementation. Acting on design feedback for AWB/WUI theme. Edit-heavy with Playwright screenshots to verify visual results.
- **Phase 3 (14:46–~19:00):** DataPanel redesign. Handover injection resets context. Continued Bash+Edit work on component redesign.
- **Phase 4 (~19:00–23:18):** Late-night wrap-up and commit.

**CWD traversal:** The session moves from the monorepo root down into poc/wui and then poc/wui/client — following the code it's working on. Cross-CWD movement within a single project is normal and does not indicate domain switching.

**What the human was trying to accomplish:** Extend and redesign the WUI DataPanel component across an 11-hour day that included multiple context resets.

---

### A5 — session-99574b7a (238 KB, 266 events, 22 prompts, 1.0 hour)

**File:** session-99574b7a-1ff1-489c-a699-da08cb1df7d5.jsonl
**Timespan:** 2026-03-15T13:47 → 14:44
**CWD:** /Users/davidcruwys/dev/ad/apps/angeleye
**Tool distribution:** Bash 120, Read 33, Edit 14, TaskUpdate 11, Agent 10, Glob 5, Grep 5, Write 4, TaskCreate 4, ToolSearch 1
**Stop event:** YES — 21 stop events captured. Multiple responses per session.
**Subagent events:** 16 (10 starts, 6 stops captured)

**First 3 prompts:**

1. `[13:47]` "What did we do related to themes? And AppyStack and recipes And also, when it comes to the intelligence system, did we end up building that here in Angel Eye? Is it Chris? What's the deal with the next ticket, B-17 or something? Maybe B12."
2. `[13:49]` "Okay, just tell me what things you want to do right now and how we're going to do it. Is it going to be a rough Wiggum loop or something?"
3. `[13:51]` "Is it mechanical? Are there any unit tests that have to happen? It feels like if you did testing properly, there'd be enough complexity."

**Last 2 prompts:**

1. `[14:41]` "Okay, how are we gonna do this over a hundred? You've already learned a lot about the patterns. Do we just do it over five right now? Just to no, I don't think that's right. Let's do a hundred and really give me a deep understanding. Are you gonna run many, many background tasks? What are you gonna do? And where are you going to write all this information to?"
2. `[14:43]` "yes"

**Last stop event message:** "All 5 running in parallel: Batch 1 — 20 `brains` sessions..."

**Context handover injections:** 2 (positions 11, 16) — these are task notification messages embedded as prompts, not true handover injections. This is the cleanest session in the dataset.

**Notable:** This session is the only one with captured stop events. The stop event after the final "yes" shows 5 parallel background agents launched. The session ends mid-execution — the agents are running, the user has approved, and the hook fired but the agents' completions may not have been captured before the process died.

**What the human was trying to accomplish:** Scope and execute AngelEye B021 (data service refactor) plus investigate whether to run deep pattern analysis on 100 sessions. The session ends with an active parallel batch of 5 agents being launched — which is where Batch 5 (this research) begins.

**Phase analysis:** No clear phases — this is a tight 1-hour session with a single focus arc: plan then launch. Not a marathon session by duration, but a marathon by tool density (266 events in 57 minutes = 4.7 events/minute).

---

### A6 — session-72977bff (224 KB, 260 events, 56 prompts, 6.8 hours)

**File:** session-72977bff-6f26-4b39-8b17-6a25d49b56ed.jsonl
**Timespan:** 2026-02-19T07:18 → 14:09
**CWD:** /supportsignal/prompt.supportsignal.com.au → /tools/poem-executor
**Tool distribution:** Read 81, Edit 56, Glob 13, Bash 32, Grep 11, Task 4, TaskOutput 3, Write 3, TaskStop 1
**Stop event:** None

**First 3 prompts:**

1. `[07:18]` Terminal paste — error message from `node tools/poem-executor/src/cli.js run` — session opens mid-debug.
2. `[07:18]` "wht is going on here:" — pasting a full terminal debug output.
3. `[07:20]` "Um, why would you not go and look at the data before making that assumption? Like, I don't mind your assessment and your change, but you could have actually looked at the data."

**Last 2 prompts:**

1. `[14:05]` "We're logging out information in the debug system. Firstly, what happened to that because I didn't see a json_schema file..."
2. `[14:08]` "There's a difference between runCompiled and run. I don't think we did a fully compiled system."

**Context handover injections:** 6 (positions 1, 16, 26, 27, 38, 39) — high injection density for a 6.8-hour session. Context is being consumed quickly by heavy file reads.

**Frustration signals:** 4 explicit — including the "why would you not go and look at the data" prompt at 07:20 (within 2 minutes of session start). The session opens in frustration from a prior session.

**Notable:** 56 prompts in 6.8 hours = 1 prompt every 7.3 minutes. This is the highest prompt frequency in the dataset, reflecting a dense debugging cycle.

**Phase analysis:**

- **Phase 1 (07:18–10:00):** Debug mode. Error investigation, provider router fixes, isRetryable logic.
- **Phase 2 (~10:00–12:00):** JSON schema work. The user asks about schema logging, Claude is reading/editing heavily.
- **Phase 3 (12:00–14:09):** Compilation vs runner distinction. Late session becomes architectural discussion about whether the tool is a compiler or a runner.

**What the human was trying to accomplish:** Debug and stabilise the POEM workflow executor, specifically getting the Agent SDK error messages clean and the JSON schema handling correct.

---

### A7 — session-65e82b48 (224 KB, 224 events, 16 prompts, 1.2 hours)

**File:** session-65e82b48-d7a3-4a2a-b7c5-2c837ca76975.jsonl
**Timespan:** 2026-02-20T05:53 → 07:06
**CWD:** /supportsignal/prompt.supportsignal.com.au → /tools/poem-executor
**Tool distribution:** Edit 71, Bash 64, Read 56, Write 13, Task 3
**Stop event:** None

**First 3 prompts:**

1. `[05:53]` "why do we have .formatted files in the prompts folder for hbs? what are they"
2. `[05:55]` "yes"
3. `[05:55]` Pasted prior session handover showing `/poem:agents:alex` invocation — context from a previous session.

**Context handover injections:** 3 (positions 3, 4, 9) — position 3 is a pasted prior session transcript, positions 4 and 9 are compaction injections.

**File size vs events note:** 224 KB for 224 events is unusual for an Edit-heavy session — the Write events likely wrote large files.

**Phase analysis:**

- **Phase 1 (05:53–06:15):** Investigation of .formatted files and prompt template structure.
- **Phase 2 (06:15–06:57):** Integration test work. Moving from file investigation to testing concerns.
- **Phase 3 (06:57–07:06):** Architectural discussion about keeping tests up to date with YAML changes.

**What the human was trying to accomplish:** Clean up the POEM executor's prompt template handling and establish test patterns for workflow YAML integration.

---

### A8 — session-84e401ee (211 KB, 135 events, 46 prompts, 1.9 hours)

**File:** session-84e401ee-2730-4711-ac6e-97bd42c9674d.jsonl
**Timespan:** 2026-02-22T16:09 → 18:04
**CWD:** /Users/davidcruwys/dev/ad/brains
**Tool distribution:** Edit 38, Bash 26, Read 24, Write 1
**Stop event:** None

**First 3 prompts:**

1. `[16:09]` Large paste — prior session output showing Ansible playbook instructions. Session opens by ingesting prior context.
2. `[16:09]` "where are we at?" — 18 seconds later.
3. `[16:10]` "I have 330 mpbs" — confirming internet speed.

**Last 2 prompts:**

1. `[18:03]` "keep going, this folder: /Users/davidcruwys/.oh-my-zsh/custom"
2. `[18:04]` "what is this? ➜ ansible git:(main) ✗ ansible-m4 --tags languages" — pasting terminal output mid-task.

**Context handover injections:** 1 (position 1) — single paste of prior session output.

**Notable:** 46 prompts in 1.9 hours = 1 prompt every 2.5 minutes. Second-highest prompt frequency. The session is extremely chat-dense — the human is treating this as an interactive terminal session, pasting output constantly and asking what's happening.

**Frustration signals:** 3 — "i'm going to run another provision, tell me what you think it is stopping at now" suggests repeated failed Ansible runs. The user is in a frustration loop.

**Phase analysis:**

- **Phase 1 (16:09–17:30):** Ansible provisioning — context handover, status check, running provisions.
- **Phase 2 (17:30–18:04):** Dotfile/configuration work. The session shifts from Ansible playbook execution to reading .oh-my-zsh custom configs. "keep going, this folder" indicates the scope expanded during execution.

**What the human was trying to accomplish:** Provision a macOS machine via Ansible (likely an agent-os setup), debugging a provisioning loop that was hanging. The session ends mid-task.

---

### A9 — session-d7ca10ed (196 KB, 524 events, 43 prompts, 46.7 hours)

**File:** session-d7ca10ed-7e18-49ba-b977-10f5c27594f1.jsonl
**Timespan:** 2026-03-06T15:46 → 2026-03-08T14:29
**CWD:** /flivideo/flideck → /flideck/.worktrees/harness-migration → /flideck/playwright
**Tool distribution:** Bash 265, Edit 102, Read 47, Write 13, Agent 17, ToolSearch 14, Skill 5, Playwright navigate 7, Playwright screenshot 6, Glob 4, TaskList 1
**Stop event:** None

**This is the longest session by calendar time — spanning nearly 2 full days.**

**First 3 prompts:**

1. `[Mar 6, 15:46]` "FliDeck harness migration. Read docs/planning/flideck-harness-migration/... then run Ralphy Mode 2 to plan the implementation campaign."
2. `[15:53]` "mode 3"
3. `[15:57]` "yes"

**Last 2 prompts:**

1. `[Mar 8, 14:22]` "Is everything checked in and committed at the moment? Is there anything that you learned that we should document or change or modify, or we finish?"
2. `[Mar 8, 14:27]` "Execute on all of that."

**Context handover injections:** 4 (positions 19, 20, 27, 35) — all standard compaction injections, clustered around position 19–20 (late March 7) and 35 (March 8 morning).

**Phase analysis — this is a 3-day work arc:**

- **Phase 1 (Mar 6, 15:46–02:14):** Planning and Ralphy execution. Modes 2 and 3 of the Ralphy planning skill, setting up the harness migration campaign.
- **Gap (02:14 → Mar 7 05:18):** ~3 hour dormancy. Probably sleep.
- **Phase 2 (Mar 7, 05:18–09:33):** Implementation. Bash-heavy wave of harness migration work. 265 total Bash calls across the session — the bulk cluster here.
- **Gap (09:33 → Mar 7 23:23):** ~14 hour gap. Multiple sessions of "just so I can tell people in a video how long is this going to take?" at 23:23 — user is resuming after a full day away.
- **Phase 3 (Mar 7, 23:23 → Mar 8, 02:00):** Progress review. Playwright screenshots for slide-by-slide diff inspection. Checking completion status.
- **Gap (02:00 → Mar 8 06:50):** Sleep gap.
- **Phase 4 (Mar 8, 06:50 → 14:29):** Cleanup and B021 work. Context reset at 06:50 (position 27). Working through B021, documenting, committing.

**What the human was trying to accomplish:** Migrate the FliDeck slide harness to a new web-component approach. This was a planned multi-wave campaign executed over 3 days in a single session.

**Hypothesis test:** This session contains 4 natural split points: planning, implementation, review, and cleanup. The 14-hour gap at position 12 (the "just to tell people in a video" repeated prompts) is the clearest sign the user disconnected and returned with a fresh mental frame.

---

### A10 — session-9fe2fca6 (184 KB, 349 events, 32 prompts, 6.1 hours)

**File:** session-9fe2fca6-4ced-42ca-bdfa-c2678d4a0aa9.jsonl
**Timespan:** 2026-03-02T06:23 → 12:32
**CWD:** /Users/davidcruwys/dev/clients/supportsignal/signal-studio
**Tool distribution:** Edit 106, Read 67, TaskUpdate 25, Bash 59, Write 28, TaskCreate 14, Glob 7, Agent 6, Skill 2, TaskOutput 1, TaskList 1, Grep 1
**Stop event:** None

**First 3 prompts:**

1. `[06:23]` Large handover paste — "Signal Studio: Nav-Shell + File-CRUD Persistence Layer" — full summary of prior session's work.
2. `[06:54]` "I'm going to ask questions and I'm going to make observations of this application. First question: in the server source, we've got a data folder with file store ID gen and watcher js..."
3. `[07:27]` "I notice when you go into edit mode on companies, you see a list of companies below the edit box, but that doesn't make any sense..."

**Last 2 prompts:**

1. `[12:30]` "That wasn't really the technique I was looking for. I want to be able to just press a button... Is that actually a difficult thing to do?"
2. `[12:32]` "No, not for now. Can you just commit please?"

**Context handover injections:** 3 (positions 4, 7, 8) — clustered mid-session.

**Phase analysis:**

- **Phase 1 (06:23–07:27):** Exploration and Q&A. User reviews recent changes, asks architectural questions, observes bugs.
- **Phase 2 (07:27–10:00):** Feature additions. Related-entity views, edit mode improvements, timestamps.
- **Phase 3 (10:00–12:32):** UI interaction patterns. Discussion of seed data, fill-from-button feature, clean commit.

**What the human was trying to accomplish:** Review and extend the Signal Studio CRUD layer built in a prior session, fixing UX issues observed during manual testing.

---

### A11 — session-798c3fc6 (177 KB, 474 events, 15 prompts, 20 hours)

**File:** session-798c3fc6-67d8-44fc-ae42-4ee70eeeef1e.jsonl
**Timespan:** 2026-03-13T04:49 → 2026-03-14T00:50
**CWD:** /signal-studio → /signal-studio/server → /signal-studio/client
**Tool distribution:** Playwright click 161, Bash 79, Edit 65, ToolSearch 18, Playwright navigate 17, Read 39, Playwright snapshot 15, Playwright screenshot 7, Playwright fill_form 22, Playwright select_option 8, Playwright type 10, Playwright file_upload 7, Write 2, Skill 2, Agent 1, CronCreate 1, CronList 1, CronDelete 1
**Stop event:** None

**This is the most extreme prompt-to-tool ratio in the dataset: 15 prompts → 474 tool calls = 31.6 calls per prompt.**

**First 3 prompts:**

1. `[04:49]` Handover message — "Signal Studio, 2026-03-13. Wave 23 complete: 8/8 bugs fixed, E2E 185/200 passed..."
2. `[04:52]` "Execute on 1 and 2 with the UAT decision. Do you like to run that within a RAF Wiggum loop or do you just like to run it as is? Keep in mind that when you're running a UAT, I always want a loop running every two to three minutes with observability..."
3. `[04:57]` "2" — choosing an option.

**Last 2 prompts:**

1. `[Mar 14, 00:43]` "Okay, let's run based on your plan there."
2. `[Mar 14, 00:50]` "Do you think we can commit and push and clean up any work trees or loose ends in our system? Can you just give me a report of how much we got done today in this conversation?"

**Context handover injections:** 5 (positions 1, 7, 8, 9, 12) — four of the five are the characteristic "This session is being continued from a previous conversation" compaction injections.

**Phase analysis:**

- **Phase 1 (04:49–07:26):** UAT execution setup. Handover, choosing UAT approach, beginning Playwright-driven E2E testing.
- **Gap (07:26 → 14:49):** ~7 hour gap. User away for the day.
- **Phase 2 (14:49–16:29):** Change impact assessment. The user has made changes elsewhere; asking the agent to verify UAT is still valid.
- **Phase 3 (16:29–17:29):** More UAT runs with Playwright. Dense click/fill/snapshot calls — the agent is driving the browser through workflow scenarios.
- **Gap (17:29 → 00:42 next day):** ~7 hour gap. Evening and sleep.
- **Phase 4 (00:42–00:50):** Wrap-up. Rerun UAT after bug fixes, then commit and report.

**What the human was trying to accomplish:** Execute Wave 24 UAT for Signal Studio — a full Playwright-driven workflow test suite across 8 workflows (W01–W08). The 161 browser_click calls and 22 fill_form calls represent the agent executing each workflow step programmatically.

**Hypothesis test:** Strong 4-phase structure. The 7-hour gaps are unmistakable session breaks. This should have been 3–4 sessions.

---

### A12 — session-59c2d164 (176 KB, 131 events, 34 prompts, 5.9 hours)

**File:** session-59c2d164-15c6-4fc5-813e-d807001bd174.jsonl
**Timespan:** 2026-03-01T06:12 → 12:06
**CWD:** /Users/davidcruwys/dev/ad/brains
**Tool distribution:** Bash 44, Read 30, Edit 18, Write 3, Skill 2
**Stop event:** None

**First 3 prompts:**

1. `[06:13]` Paste of prior output — Ansible/JSON validation result showing valid system.json.
2. `[06:42]` "push it"
3. `[06:43]` "Did we have https://github.com/KybernesisAI/kyberbot Locally in our repos folder under the upstream location... And did it affect the gap analysis?"

**Last 2 prompts:**

1. `[12:05]` "stack"
2. `[12:06]` "Can you just create a temp folder with a little bit of a description? No, just put the JSON documents into it and open it up in Finder, and then just give me a little bit of a prompt... for my mate about what his thoughts are in converting these into infographics."

**Context handover injections:** 1 (position 26) — late in session.

**Phase analysis:**

- **Phase 1 (06:12–07:00):** Wrap-up and push from prior session. Committing agentic-os architecture work.
- **Phase 2 (07:00–10:00):** Architecture documentation. Reading, editing architecture files in the brains repo. Kyberbot integration check.
- **Phase 3 (10:00–12:06):** JSON documentation and infographic prep. Stack queries, creating temp folder for sharing with a collaborator.

**What the human was trying to accomplish:** Complete and document the agentic OS architecture in the brains repo, then prepare materials for a collaborator (asking for "his thoughts on converting these into infographics" — suggesting an external stakeholder review).

---

### A13 — session-3eedefa5 (174 KB, 259 events, 33 prompts, 59.9 hours)

**File:** session-3eedefa5-bf46-41b5-9d04-efecbabfbeba.jsonl
**Timespan:** 2026-02-11T11:37 → 2026-02-13T23:33
**CWD:** /flivideo → /flivideo/flihub → /flivideo/storyline-app → /flivideo/flideck → /flivideo/fligen → /flivideo/fligen/client → /flivideo/fligen/server → /flivideo/fligen/server/server
**Tool distribution:** Bash 121, Read 31, Edit 30, Write 19, Task 6, TaskUpdate 10, TaskCreate 4, TaskOutput 2, TaskList 1, Grep 1, Skill 1
**Stop event:** None

**This session spans 2.5 days and crosses 8 different CWDs — the widest project-scope session in the dataset.**

**First 3 prompts:**

1. `[Feb 11, 11:37]` "what was athis about?" — pasting the Claude Code welcome screen with recent activity snippets. Session opens disoriented — user doesn't know what the prior session was.
2. `[Feb 12, 07:08]` "Are you saying all you did was update the dependencies, the package dependencies in each of those folders for me? Which means I'm assuming none of them have been committed or pushed?"
3. `[Feb 12, 07:09]` "I've tested one of the projects. I'm going to assume they all work. I'd like you just to look at each of them, do the appropriate Git add, the Git commit, and the Git push."

**Last 2 prompts:**

1. `[Feb 13, 23:30]` "You put a hell of a lot of files into that folder for me. Were the ones that were actually related to all the text that changed? ... I was expecting about four files."
2. `[Feb 13, 23:33]` "Okay, I want you to remove the stuff that doesn't matter. Leaving the essential files. Then what I want you to do is give me a prompt, a meta prompt... That will give me a quick start when I go over to Claude Code in the other folder."

**Context handover injections:** 2 (positions 5, 15) — relatively low for a 2.5-day session, suggesting the user was clearing and restarting frequently.

**Frustration signals:** Multiple — "When I show your work to other agents, you are starting to look a bit stupid" (Feb 13 01:25), "You didn't listen to me. You changed it to A.D. and AppyDave. Everything was meant to be just Appy" (Feb 13 22:20).

**Phase analysis — this is the most structurally complex session:**

- **Phase 1 (Feb 11, 11:37–11:38):** Orientation. Single prompt asking "what was this about?" Session then goes completely dormant.
- **Gap (~20 hours):** Massive dormancy. User returns Feb 12 at 07:08.
- **Phase 2 (Feb 12, 07:08–16:32):** Dependency updates and commits across FliVideo sub-projects (FliHub, Storyline, FliDeck, FliGen).
- **Gap (~9 hours):** Dormancy.
- **Phase 3 (Feb 13, 01:23–09:33):** FliGen quality tooling. Testing, debugging, background agent briefs.
- **Gap (~12 hours):** Long midday gap.
- **Phase 4 (Feb 13, 21:58–23:33):** AppyStack naming and project creation. The session pivots entirely — from FliGen debugging to creating a new boilerplate project called AppyStack. This is a domain change within the same session.

**What the human was trying to accomplish:** Initially: routine dependency updates across FliVideo. Eventually: conceived and started the AppyStack project as a reusable boilerplate. The pivot in Phase 4 represents a new conceptual project being born within this session.

**Hypothesis test:** The pivot at Feb 13 21:58 is the clearest phase split in the entire dataset. "What are we trying to solve with this conversation?" at 21:58 is the user themselves recognising they've lost the thread. The new AppyStack naming discussion is a completely fresh conceptual unit that happened to be appended to this session.

---

### A14 — session-c9d68534 (167 KB, 308 events, 30 prompts, 19.2 hours)

**File:** session-c9d68534-3304-4f4c-af64-ed9cf364af7a.jsonl
**Timespan:** 2026-02-18T05:41 → 2026-02-19T00:55
**CWD:** /supportsignal/prompt.supportsignal.com.au → /tools/poem-executor
**Tool distribution:** Bash 93, Read 82, Edit 47, Write 22, TaskCreate 6, Task 7, TaskUpdate 8, Glob 7, Grep 6
**Stop event:** None

**This session contains the most explicit frustration language in the dataset.**

**First 3 prompts:**

1. `[05:41]` "Implement the following plan: POEM Workflow Executor — Implementation Plan" — detailed spec paste.
2. `[05:48]` "contineu" (sic) — typo, autocorrected intent.
3. `[06:17]` "Why did you deviate? You fucking asshole. Why do you fucking stop? Go down paths that I don't tell you to go down, and how do we get this back on track?"

**Last 2 prompts:**

1. `[Feb 19, 00:46]` "can you list the 124 test describe labels and the 13 files"
2. `[Feb 19, 00:55]` "can you write all that information into a file somewhere, it is an index of sorts related to the tests..."

**Context handover injections:** 3 (positions 10, 22, 27)

**Frustration signals:** 6 explicit — the strongest in the dataset:

- "Why did you deviate? You fucking asshole." (06:17)
- "I gave you a fucking plan of action, and yet again you didn't do what was asked." (08:13)
- "What's the f\*cking point of writing a plan? You don't follow them anyway." (08:15)
- "Are we keeping an audit log of the fuck-ups and the things we're not doing right?" (08:50)

**Phase analysis:**

- **Phase 1 (05:41–06:19):** Plan implementation — initial attempt. Agent deviates almost immediately, triggering first frustration burst.
- **Phase 2 (06:19–08:00):** Recovery and re-specification. User redirects, agent works on provider router.
- **Phase 3 (08:00–09:55):** Architectural clarity work. Compiler vs runner distinction, requirements rewriting. Multiple frustration peaks as the agent repeatedly fails to follow the plan.
- **Phase 4 (09:55–00:55 next day):** Implementation resumes. Actual runner code written, 124 tests created. Session ends calmly with a documentation request — a complete emotional arc from rage to productive closure.

**What the human was trying to accomplish:** Build the POEM workflow runner (a mechanical YAML executor). The session is a full emotional and technical arc — from angry plan enforcement through to calm documentation.

**Hypothesis test:** The phase at 08:13–08:50 is the "crisis and reset" phase that exists in many marathon sessions. The session could be split into: initial attempt, crisis/respec, implementation, documentation.

---

### A15 — session-f9a685e2 (161 KB, 429 events, 34 prompts, 19.5 hours)

**File:** session-f9a685e2-5105-4a5a-883a-25661196d055.jsonl
**Timespan:** 2026-03-13T06:52 → 2026-03-14T02:22
**CWD:** /Users/davidcruwys/dev/clients/supportsignal/signal-studio
**Tool distribution:** Bash 80, Edit 66, Grep 47, Read 61, Playwright navigate 31, Playwright screenshot 42, Playwright click 26, Write 16, Skill 5, ToolSearch 6, Agent 5, Glob 8, Playwright snapshot 1, Playwright resize 1
**Stop event:** None

**First 3 prompts:**

1. `[06:52]` Handover message — "Task: AWB Integration — Moments + Incidents" — session opens with a task handoff.
2. `[06:52]` "Is this requirement all fairly simple? Is it something we can just do right now?"
3. `[07:00]` "We should only have one environment variable but I think it would be smarter to rename it to a AWB URL. And yes you can start building."

**Last 2 prompts:**

1. `[Mar 14, 02:09]` "Unknown skill: near-compassion" — a skill invocation that failed (user tried `/near-compassion`, Claude couldn't resolve it).
2. `[Mar 14, 02:22]` "Should I do a compact, or should I just do a clear and copy in your handover message?"

**Context handover injections:** 5 (positions 1, 17, 25, 31, 34)

**Notable final prompt:** "Should I do a compact, or should I just do a clear and copy in your handover message?" — the user is explicitly deciding how to end and continue the session. This is a clean intentional close.

**Phase analysis:**

- **Phase 1 (06:52–10:00):** AWB integration implementation. Building the POST endpoint and "Analyse in AWB" button for Signal Studio.
- **Gap (~10:00 → afternoon):** Dormancy.
- **Phase 2 (afternoon–~20:00):** Visual testing. 42 Playwright screenshot calls, 26 click calls — screenshot-driven visual verification of the integration.
- **Phase 3 (~20:00–02:22):** Bug fixes and wrap-up. Port conflict fix, then explicit closure discussion.

**What the human was trying to accomplish:** Build the AWB (Agent Workflow Builder) integration into Signal Studio, connecting Moments and Incidents to AWB for AI narrative analysis.

---

## Patterns Section

### What Makes a Marathon Session?

Based on analysis of all 15 large sessions, marathon sessions emerge from one of four causes:

**1. Task duration (genuine long work):** A single coherent task that naturally takes many hours — e.g., A9 (FliDeck harness migration), A14 (POEM runner implementation). These sessions have consistent CWDs, clear tool trajectories, and smooth (if dense) prompt flows.

**2. Domain drift:** A session that starts with one task and accumulates a second, unrelated task due to user-initiated pivots. A13 is the clearest example — the session pivots from FliGen dependency updates to creating AppyStack, a completely new product. The pivot is signalled by "What are we trying to solve with this conversation?" — the user's own recognition of drift.

**3. Sleep/wake continuity:** The user doesn't close Claude between working sessions. A2 (16.8h), A9 (46.7h), A13 (59.9h) are all sessions that span multiple sleeping periods. The session ID is preserved but the human context is not. These sessions contain multiple 6–14 hour gaps with zero events.

**4. Context compaction sprawl:** A session that consumes its context window, gets compacted, resumes, consumes again — cycling through multiple compactions without the user starting fresh. A1 is the most extreme example: 10 handover injections in a single session. The system was fighting to keep a single logical task running across what should have been 5 separate sessions.

### Phase Detection Signals

The following signals reliably indicate a conceptual phase boundary:

| Signal                                      | Strength | Notes                                                                                                      |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Time gap > 3 hours between events           | Strong   | Usually = sleep or major context switch                                                                    |
| Time gap > 1 hour                           | Moderate | Could be deep work, not necessarily a phase boundary                                                       |
| Context handover injection                  | Strong   | Claude Code compacted = context window was full = natural restart point                                    |
| Duplicate prompt (same text sent twice)     | Moderate | User lost orientation, likely re-sent from prior context                                                   |
| "What are we trying to solve?" type prompt  | Strong   | User themselves recognising domain drift                                                                   |
| CWD change to unrelated project             | Moderate | Cross-project movement within FliVideo is weak signal; moving between /brains and /signal-studio is strong |
| Frustration prompt followed by calm re-spec | Strong   | Marks the "crisis → reset" phase boundary                                                                  |
| "commit and push please"                    | Moderate | Often marks end of a logical phase, not necessarily end of session                                         |

### Junk-Exclusion Signals — Final Rules

For automated classification, apply these in order:

**Rule 1 — Definitive discard (any one sufficient):**

- Total events == 1 AND prompt length <= 2 characters
- CWD == /tmp OR /private/tmp (with <= 3 events)
- Session ID uses `agent-` prefix AND events == 1 (warmup stub)
- Prompt is syntactically a model greeting, not a user request

**Rule 2 — High-confidence discard (any one sufficient):**

- Total events == 1 AND prompt is a slash command fragment without context
- Registry `last_active - started_at` < 10 seconds AND events == 1
- Registry `project == "tmp"`

**Rule 3 — Review (do not auto-discard):**

- Total events == 1 BUT prompt has >= 5 words (may be a meaningful one-shot)
- File size > 200 bytes with only 1 event (large prompt embedded = valuable signal)

**The "Warmup" pattern:** Agent IDs (`agent-a3f450c`, `agent-af5e8ab`) with a "Warmup" prompt are a distinct category — subagent scaffolding. They are not junk in the traditional sense (they represent a real pattern of parallel agent launches) but contain no intelligence-useful content. Classify separately as `agent_warmup` rather than `junk`.

**The "x" prompt pattern:** Single-character "x" prompts in real project directories (like /brains) are accidental keystrokes. Even in a real directory, this is not a real session start. The prompt content overrides the CWD signal.

**The "Warmup" duplicate timestamp pattern:** B3 and B4 were launched within 6 milliseconds of each other from the same CWD with the same prompt. Pairs of agent warmup sessions launched within < 100ms of each other should be grouped and classified together.

### Anomalies and Open Questions

**Anomaly — file size vs event count:** A2 (651ffc0f) has 271 KB for 28 events. A5 (99574b7a) has 238 KB for 266 events. The former has ~9.7 KB per event; the latter ~0.9 KB per event. The large-event files likely contain embedded handover/transcript pastes of thousands of characters. Event count alone does not predict file size or session value.

**Anomaly — stop events only in A5:** Of 15 sessions, only A5 contains stop events. All other sessions lack stop events. This is likely an artifact of the hook registration timing — the stop hook was only active for newer sessions. This means `last_message` analysis is only possible for sessions after a certain date.

**Open question — multi-day sessions:** Are A2 (16.8h), A9 (46.7h), and A13 (59.9h) genuinely single sessions from Claude's perspective, or did the user restart Claude multiple times and re-attach to the same session? The handover injections suggest the latter — the user was explicitly copying context between Claude instances, not resuming the same process.

**Open question — subagent_stop without subagent_start:** A5 shows 10 subagent_start and 6 subagent_stop events. This asymmetry suggests agents were still running when the session hook fired. The intelligence system should not treat a subagent_start without a corresponding subagent_stop as abandoned — it may simply mean the task was still in flight.

---

_End of Batch 5 research._
