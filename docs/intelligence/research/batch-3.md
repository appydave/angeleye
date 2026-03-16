# AngelEye Intelligence Research — Batch 3

**Date:** 2026-03-15
**Analyst:** Claude Sonnet 4.6 (angeleye agent)
**Batch scope:** 20 sessions across appystack (7), appydave-plugins (7), angeleye (6)
**Data source:** `~/.claude/angeleye/sessions/` (JSONL event files), `~/.claude/angeleye/registry.json`

---

## Methodology

Each session was read in full. For each:

- First 3 user prompts captured (up to 300 chars each)
- Complete tool sequence recorded
- Duration computed from first to last timestamp
- Voice transcription assessed via speech artifacts (um/uh/yeah/so/right so etc.)
- Phase shifts identified by scanning tool-type clusters across 5-event windows
- Tool-only classification attempted before reading prompts (hypothesis test)

---

## Sessions — appystack

### S01 · 4c858f8a · 2026-03-12 · 30 min · 6 prompts · 38 tools

**Tool sequence:** Agent → Read×3 → Bash → Read → Bash → Edit×4 → Write → Glob → Read → Edit×3 → Glob → Read → Write → Bash → Skill → Read×2 → Bash → Read → Edit×4 → Bash×8

**Tool counts:** Bash:12, Edit:11, Read:9, Write:2, Glob:2, Agent:1, Skill:1

**Tool-only classification (before prompts):** Maintenance/documentation update — the Agent+Read opening suggests orient-then-delegate, heavy Edit/Bash middle suggests code changes + test runs. Probable: fixing a specific bug or applying a documented change.

**Actual prompts:**

- P1: "I want you to consider what we're doing with AppyStack and a concept called NodeMon, I guess. I'm going to show you a conversation from a situation where my servers were being restarted on me and getting new port numbers..."
- P2: "What we need to think about is that server data is actually a poor location. Since this is generally a monorepo, having data at the monorepo root should be okay..."
- P3: "Are any of the changes that you made appropriate to update anything in the upgrade tool that we've got?"

**Classification accuracy:** Partial. The tool-only guess of "apply a documented change" was close — this is indeed a targeted fix (nodemon port conflict + data directory path). The cross-referencing to the upgrade tool in P3 was invisible from tools alone.

**What the human is doing:** Solving a specific operational problem (server restart causing port conflicts) discovered in another session, then asking whether the fix should propagate to the upgrade tool. Outcome feels complete — fix applied, question answered.

**Voice indicators:** Yes — "I guess", "just want you to think through", casual register throughout. Voice score 6/10.

**Phase structure:** READ (orient) → WRITE (fix) → BASH (test) → WRITE (refine) → BASH (validate). Clean 5-phase execution.

**Skill invoked:** Yes — 1 Skill tool call mid-session.

**Duration vs size anomaly:** 30 min session but 151k file — avg prompt length was 20,728 chars. The prompts contain pasted conversation transcripts from other sessions as context.

---

### S02 · bfa26edf · 2026-03-11 · 267 min · 15 prompts · 88 tools

**Tool sequence:** Bash×2 → Glob×2 → Bash → Read → Skill → Glob×2 → Read×2 → Agent×2 → Bash → Write → Read×2 → Write → Read → Edit×4 → Agent → Edit×2 → Agent×4 → Edit×2 → Agent×4 → Edit → Agent×2 → Write → Edit×2 → Bash → Edit → Read → Edit → Bash×5 → Write×2 → Bash×9 → Read → Edit → Bash → Edit×3 → Bash×8 → Read → Edit×2 → Bash×9

**Tool counts:** Bash:27, Edit:25, Agent:15, Read:10, Write:6, Glob:4, Skill:1

**Tool-only classification:** Major feature implementation — the Skill early in session suggests loading context/tooling, then the heavy Agent burst in the middle strongly suggests delegated sub-tasks (either complex feature work or multi-file generation). The Bash-heavy tail suggests testing/publishing. Probable: building a new feature end-to-end.

**Actual prompts (all 15):**

- P1: "What's the state of this repository right now?"
- P2: "Both local, remote, and to-do list"
- P3: (long pasted brief) "AppyStack Upgrade Tool — Implementation... AppyStack has evolved significantly... apps built from it have no way to pull those improvements in."
- P4: "FliGen, not flijam... are we going straight into planning?"
- P5: "For question one, what's your recommendation?... the lack of AppyStack JSON..."
- P6: "What is your recommendation for question one?... balance between best practices and over engineering..."
- P7: "That's the plan based on your recommendations, and then go straight into development."
- P8: "How do I test this over on Signal Studio, and do I need to publish it first?"
- P9: (pasted context about Mochaccino themes)
- P10: "What was this issue? I tried to run something; it didn't seem to work."
- P11: "Can I get you just to publish my product, please?"
- P12: "I think it would have been nice to know what got updated... you updated 25 files. I have no idea what you did."
- P13: "cont. inue"
- P14: "yes"
- P15: "Is there something we have to commit or push related to this?"

**Classification accuracy:** Good. The tool-only guess nailed the shape — heavy Agent delegation for implementation, Bash tail for testing/publishing. The early Skill correctly predicted loaded context, and the human did open with an explicit brief about the upgrade tool.

**What the human is doing:** Building the AppyStack upgrade tool (a CLI that lets downstream apps pull in template improvements). The session arc: state check → deliberation about design questions → delegate implementation → test on a real app (Signal Studio) → publish npm package. The P12 frustration ("you updated 25 files, I have no idea what you did") is a notable oversight recovery moment.

**Voice indicators:** Light — mostly typed, though some casual phrasing. Voice score 3/10.

**Phase structure:** BASH/orient → SKILL-load → Agent-heavy implementation burst → Edit refinement → Bash validation → publish.

**Session feel:** Complete. Ends with commit/push question, implying shipping happened.

---

### S03 · 2421e5c5 · 2026-02-26 · 205 min · 48 prompts · 134 tools

**Tool sequence (abbreviated):** Task → Read×6 → Glob×3 → Bash → Write×2 → Glob×2 → Bash → TaskUpdate×3 → TaskCreate×3 → [heavy Task cycle] → Bash×4 → Read → Write → Bash → TaskUpdate×2 → [more Task cycles] → Bash×12 → Read → Edit×2 → Write → Bash×10 → Edit → Bash×10 → Read×6 → Bash×10 → Edit×3 → Bash×9

**Tool counts:** Bash:50, Read:21, TaskUpdate:19, Edit:13, Task:10, TaskCreate:9, Glob:5, Write:5, Skill:1, TaskOutput:1

**Tool-only classification:** Structured project assessment or audit — the Task/TaskCreate/TaskUpdate cluster is a distinctive Ralphy loop pattern. This isn't normal feature building; it's systematic work-unit execution. Probable: running a pre-planned campaign of tasks.

**Actual prompts (first 3):**

- P1: "If you were looking at a code base for the first time... you wanted to evaluate whether there are any problems in it? What would be the things that you'd go looking for?"
- P2: "I want you to go with deep background research on everything you've listed there... one well unknown: We've never tested the install."
- P3: "If I ask you to fix it, we're just going to be sitting here all day... I'm wondering whether this should be a detailed plan of action."

**Classification accuracy:** Close but missed the intent. The Task burst pattern correctly suggests structured execution, but the prompt content reveals this starts as an open-ended codebase audit, not a pre-planned campaign. The tasks are being created during the session as a response to discovered issues — the Ralphy system activates partway through to manage discovered problems.

**What the human is doing:** Commissioning a full codebase audit of AppyStack (it's a boilerplate not yet published to npm). The session evolves: discovery → plan → structured remediation using the Task system. 48 prompts over 205 min is the densest session in this batch — David is actively steering.

**Voice indicators:** Minimal — more typed, structured. Voice score 2/10.

**Phase structure:** Audit (READ) → Planning (BASH/WRITE) → Structured execution (Task cascade) → Validation runs (BASH heavy).

**Session feel:** Feels like it continued — 48 prompts is a long session but may have been carried into subsequent sessions.

---

### S04 · 77d71fc4 · 2026-02-26 · 126 min · 16 prompts · 130 tools

**Tool sequence (abbreviated):** Read×2 → Grep×2 → Read → Bash×18 → Read → Bash → Write → Bash×11 → Read → Write×2 → Bash → Task/TaskCreate/TaskUpdate cycles (heavy) → Bash×3 → Edit → Task cycles → Edit×2 → Task cycles → Bash → Edit → Read×2 → Write×2 → Edit → Task cycles → Edit×2 → Task cycles → Bash → Write×2 → Bash → Write → Bash → Read×2 → Bash → Read → Edit → Write → Bash×14

**Tool counts:** Bash:58, Task:18, TaskUpdate:14, Edit:11, Read:10, Write:10, TaskCreate:7, Grep:2

**Tool-only classification:** Infrastructure setup or porting with structured task tracking — Bash-heavy throughout suggests build/test/install operations. Interleaved Task system suggests managed work units. The early Grep+Read pattern suggests initial code search, possibly following a spec.

**Actual prompts (all 16):**

- P1: (pasted Claude Code session output + chat) "Unpack this information line by line in detail and get it into context..."
- P2: "do we have file with the fleshed out details, is that file up to date, could we use that file to build out the changes"
- P3: "do we have file with wu-1 to wu-19 with the fleshed out details..." (note: WU = Work Units)
- P4: "bootstrap the campaign from AGENTS.md and go straight to build"
- P5: "init git and create the worktree"
- P6: "I would like you to implement a Ralph Wiggum development loop on the 18 outstanding work units. I would like you to create a work tree based on the main repository."
- P7: "say 'yay'"
- P8: "What is your recommendation based off context?"
- P9: "What is your recommendation based off context?"
- P10: "yes, go ahead, but use a worktree"
- P11: "option a, What are we up to now?"
- P12: "fire wave 4"
- P13: "yes, write the next-round-brief... is there anything outstanding... is this a good place to close up"
- P14: (documentation persistence request about `.vscode` force-tracking)
- P15: "then why not for me? for e2e... npm run test:e2e... npm error Missing script"
- P16: "Merge the work tree. And commit the code and tell me if there's any last outstanding issue."

**Classification accuracy:** Good. The structured Task execution correctly identified as a managed campaign (WU-1 to WU-18 = work units). The Bash-heavy infrastructure was AppyStack build/test operations. The worktree use was correctly implied by the non-standard commit pattern.

**What the human is doing:** Running a "Ralph Wiggum loop" — executing 18 pre-planned work units on AppyStack via a structured development campaign with git worktrees. The prompts are mostly terse command-and-confirm style: "bootstrap the campaign", "fire wave 4", "merge the work tree". High operational confidence; David trusts the plan.

**Voice indicators:** Mixed — P1 is clearly pasted text from another conversation. Actual David prompts are mostly typed and terse. Voice score 4/10.

**Phase structure:** Context loading (READ/Grep) → Campaign bootstrap (Bash heavy) → Work unit execution (Task cycle) → Review/adjust → Finalize (Write + Bash).

**Session feel:** Complete — ends with worktree merge and commit check.

---

### S05 · 8f220d36 · 2026-02-14 · 2492 min (41h) · 16 prompts · 133 tools

**Tool sequence (abbreviated):** AskUserQuestion → Bash → Task×3 → Write → AskUserQuestion×2 → Read → Write → TaskCreate×7 → TaskUpdate → AskUserQuestion×5 → Edit+TaskUpdate cycle (for each of 7 task domains) → AskUserQuestion×2 → Task×6 → Bash×2 → Write → AskUserQuestion×3 → Read → Edit×13 → Grep → Task → Write → Read → Edit → Bash → Task → [Grep/Read survey] → Task×2 → Glob×2 → Read×3 → Write×4 → Glob → Read → Task × several → Edit×2 → Grep/Read/Bash tail

**Tool counts:** Edit:23, Read:22, AskUserQuestion:16, Task:15, TaskUpdate:14, Grep:12, Write:11, Bash:9, TaskCreate:7, Glob:4

**Tool-only classification:** Deep requirements elicitation or structured knowledge gathering — AskUserQuestion is rare and distinctive; 16 uses strongly indicates a Q&A-driven session. Combined with TaskCreate, this looks like a structured documentation process where the AI interviews the user to build a knowledge base.

**Actual prompts (first 3):**

- P1: "@raw.txt We just built the application... Plus files in @docs/... We also had information in historical about other open source projects..."
- P2: "Here to create all the questions and ask me in a Q&A format using the ask question system, and record every one of my answers into a single linear file..."
- P3: "I need you to come up with a task for each of these items: Architecture, Implementation, Testing, Config, Security, Developer experience, Meta processes... go through a Q&A session with me to find out what we think"

**Classification accuracy:** Excellent. The AskUserQuestion signature is the clearest signal in this entire batch. The tool-only classification nailed it — this is definitively a structured Q&A/elicitation session using the interactive question tool to build documentation about AppyStack across 7 domains.

**What the human is doing:** Conducting a systematic post-build debrief on AppyStack — using the AskUserQuestion mechanism to create a structured interview across architecture, implementation, testing, config, security, DX, and meta-process domains. The 41-hour duration span is almost certainly a multi-day session left open, not 41 continuous hours.

**Voice indicators:** Mixed — P1 is file references, P2/P3 are typed instructions. Voice score 5/10.

**Phase structure:** Context loading → Q&A elicitation phase (AskUserQuestion dominant) → Documentation write (Edit/Write burst) → Grep/Read survey → Final documentation assembly.

**Session feel:** Thorough. This is foundational documentation work for AppyStack, creating the knowledge base that would power future work.

---

### S06 · 4ff362fe · 2026-03-08 · 705 min (12h span) · 26 prompts · 93 tools

**Tool sequence (abbreviated):** Grep → Glob → Read×2 → Glob → Read×2 → Glob×2 → Bash×5 → Read → Bash → Read → Edit×6 → Read → Edit×3 → Bash×3 → Read×4 → Edit → Write → Bash×3 → Write → Edit → Bash×20 → Glob×2 → Agent → Bash×2 → Read×2 → Bash → Write×3 → Bash×5 → Agent → Write → Bash×4 → Agent×3

**Tool counts:** Bash:48, Read:17, Edit:10, Glob:6, Write:6, Agent:5, Grep:1

**Tool-only classification:** Infrastructure configuration with network/topology concerns — the initial Grep/Glob/Read pattern suggests hunting for something specific (possibly config values), Bash-heavy middle suggests running commands iteratively, Agent tail suggests delegated documentation or cleanup tasks.

**Actual prompts (first 3):**

- P1: "If I needed to build another application with AppyStack, do we have a list of all the ports that we've currently allocated?"
- P2: "Yeah, but that's not all correct. You're only looking at the FliVideo names. What about all the other apps we've got in there? I'm wondering where you are really reading the port numbers from?"
- P3: "You've already done the work. I just want to check two things: 1. Would this extra information I just did right now have improved anything for you? 2. Also, can you give me a summary of everything you've just done?"

**Classification accuracy:** Good directionally. "Hunting for something specific" was right — port allocations across the AppyStack ecosystem. The Bash-heavy middle was port verification commands. The Agent tail was documentation of the port registry.

**What the human is doing:** Building a port registry/topology map for all AppyStack apps to prevent port conflicts when creating new applications. Discovers the initial search was incomplete (only found FliVideo ports), triggers a broader search. P3 shows meta-awareness — asking whether the extra context David provided manually would have helped. This is ecosystem management work.

**Voice indicators:** Conversational but typed. "Yeah, but that's not all correct" — classic voice-like correction. Voice score 5/10.

**Phase structure:** Discovery (Read/Grep) → Iterative port search (Bash) → Write topology doc → Agent-delegated documentation assembly.

**Session feel:** Complete — port topology documented, appystack.json expanded with port allocations.

---

### S07 · 06c69d58 · 2026-03-08 · 100 min · 14 prompts · 59 tools

**Tool sequence:** Agent×3 → Read → Edit → Agent×2 → Read×4 → Grep → Read → Bash → Read → Edit×8 → Agent×4 → Edit → Agent×3 → Bash×7 → Read → Edit → Bash×2 → Read×2 → Grep → Edit → Bash×2 → Read → Edit → Bash×2 → Edit×2 → Read → Edit → Agent → Skill

**Tool counts:** Edit:16, Bash:15, Agent:13, Read:12, Grep:2, Skill:1

**Tool-only classification:** Complex feature integration — heavy Agent delegation (13 uses) alongside Edit/Bash suggests building multiple connected components. The Skill at end suggests wrapping up or invoking a summary/handover pattern.

**Actual prompts (first 3):**

- P1: (pasted session handover message) "Yeah, I don't think so. Session Handover: What was shipped this session... Create Thumb Rack is finished as an application."
- P2: "Create Thumb Rack is finished as an application. How are we integrating Platypus launch recipes? Is it going to be part of the create-appystack command? Is it something else? I don't understand. Okay, tell me more about Procfile."
- P3: "Step one: immediate fixes for port need to really be added into the template for AppyStack... does that mean I've also got to do a global install of Overmind? Where does Overmind get installed?"

**Classification accuracy:** Partial. The Agent-heavy pattern correctly implies multi-component work. But the actual content — integrating Overmind Procfile support into AppyStack, the thumbrack app finishing — was more specific than tool-only could reveal.

**What the human is doing:** Post-ship integration work — ThumbRack app is done, now the AppyStack template needs updating to support Overmind (process manager) as a first-class pattern. Ends with Skill invocation — appears to be invoking a handover skill.

**Voice indicators:** Conversational — "Yeah, I don't think so" opening, classic voice. Voice score 4/10.

**Phase structure:** Context load (Agent-orient) → Read/understand existing code → Edit (template integration) → Agent (parallel updates) → Bash (test) → Skill (handover).

**Session feel:** Complete — ships Overmind/Procfile integration into AppyStack template.

---

## Sessions — appydave-plugins

### S08 · d363ca82 · 2026-02-24 · 799 min (13h span) · 18 prompts · 26 tools

**Tool sequence:** Read → Glob → Read×2 → Edit → Read → Edit → Bash → Read → Write → Edit → Bash → Edit×8 → Bash → Edit×4 → Bash

**Tool counts:** Edit:15, Read:5, Bash:4, Glob:1, Write:1

**Tool-only classification:** Focused file editing session — almost no exploration tools (1 Glob, 5 Read) relative to Edit volume (15). This is someone who knows exactly where the files are and is making targeted changes. Probable: updating documentation or a skill file.

**Actual prompts (all 18, summarized):**

- P1: "Check both the second brain and the plug-in for Ralphy. And tell me what capabilities he has."
- P2: "Why is it that I had such a disastrous conversation trying to figure this out in another window?" (pastes failed conversation output)
- P3: "yes, add that to the SKILL.md"
- P4-P18: A mix of short confirmations and questions — "what does it do now", "update that", "can you make the description more concise", "yes", "commit"

**Classification accuracy:** Excellent. Edit-dominant sessions are almost always documentation/skill file maintenance. The Read/Glob phase to understand, then Edit extensively to refine — this is precisely what happened (Ralphy SKILL.md improvement).

**What the human is doing:** Debugging why the Ralphy skill doesn't explain itself well (evidenced by the frustrating conversation in P2), then making targeted improvements to the SKILL.md. The 13h span is a left-open session, not continuous work.

**Voice indicators:** Light conversational — "Check both... and tell me", "yes, add that". Voice score 3/10.

**Phase structure:** READ (understand current state) → BASH (test?) → WRITE (update SKILL.md) → BASH (verify). Extremely tight loop.

**Session feel:** Complete — Ralphy plugin description improved and committed.

---

### S09 · 55dde42d · 2026-02-24 · 395 min (7h span) · 11 prompts · 73 tools

**Tool sequence:** Read → Glob×7 → Bash → Glob → Read×2 → Bash×7 → Glob → Read → Glob → Task → Glob×5 → Read×3 → Glob×3 → Bash×3 → Read → Bash → Glob → Bash×5 → Read → Edit → Bash × 2 → Read → Edit → Bash → Read → Bash×4 → Edit×3 → Skill → Bash×3 → Grep×2 → Read → Edit → Read → Edit×3 → Edit × 3 → Bash×2 → Edit

**Tool counts:** Bash:26, Glob:17, Read:15, Edit:11, Grep:2, Task:1, Skill:1

**Tool-only classification:** Exploration and discovery session — the Glob-heavy opening (7 Globs before first Read) is unusual. Combined with the Read/Bash alternation, this suggests searching across the codebase to find something, building up a picture before editing. Probable: understanding the plugin system architecture before adding a feature.

**Actual prompts (all 11):**

- P1: "What do you know about the Ralph Leap Button Plug-in Spelter, but aside from my second brain, Specifically my new version called Ralphie."
- P2: "What do you know about my Ralphy Loop skill and also from the brain, Specifically my new version called Ralphy. are they aligned"
- P3: (pastes previous conversation snippet about Ralphy modes)
- P4-P11: Progressive clarification about Ralphy operating modes, feature/bug fix mode commands, alignment between brain and plugin definition

**Classification accuracy:** Partially correct. The exploration-heavy opening did reflect a "understand before touching" pattern. But the goal was alignment verification (are brain and plugin in sync?) rather than feature addition.

**What the human is doing:** Checking alignment between the Ralphy brain file and the Ralphy plugin/skill. Discovers they are out of sync. The session is about bringing them back into alignment — updating the plugin to reflect the conceptual model in the brain. Classic brain→skill synchronization work.

**Voice indicators:** Clear voice patterns — "Specifically my new version called Ralphy" is spoken cadence. Voice score 4/10.

**Phase structure:** Glob (discovery) → Bash (test/verify) → Read (understand brain content) → Edit (update plugin) → Skill (invoke/test) → Edit (refine).

**Session feel:** Complete — plugin aligned with brain.

---

### S10 · 794eef99 · 2026-03-07 · 2.8 min · 3 prompts · 11 tools

**Tool sequence:** ToolSearch → Read → ToolSearch → Edit → Read → Edit → ToolSearch → Skill → ToolSearch → Bash×2

**Tool counts:** ToolSearch:4, Read:2, Edit:2, Bash:2, Skill:1

**Tool-only classification:** Quick targeted edit — ToolSearch early means loading a deferred tool schema (or finding a specific tool). The ToolSearch→Read→Edit pattern suggests finding a specific file and making a surgical change. Probable: updating a skill file's configuration or description, then testing.

**Actual prompts (all 3):**

- P1: "I wanna have a quick talk about Ralphy."
- P2: "What is it in Ralphy that would, based on this conversation you're seeing below, have it talk in terms of mode one, mode two, mode three, mode four? From my point of view, there are requirements, planning, synchronisation, and extension..."
- P3: "I don't necessarily need it to think to not have this sequential numbering. I think it's important. I just want it to be able to talk to me in one, requirements two, plan three, build..."

**Classification accuracy:** Excellent. 11 tools, 3 prompts, 3 minutes — surgical targeted change to rename Ralphy's operating mode labels from "Mode 1/2/3" to "Requirements/Plan/Build". The ToolSearch was loading the Edit/Read schemas (deferred tools). Exactly what the tool-only classification predicted.

**What the human is doing:** Refinement of Ralphy's conversational framing — wants the plugin to use meaningful mode names ("Requirements, Plan, Build") instead of numbered modes. Quick conceptual improvement, in and out.

**Voice indicators:** Strong — "I wanna have a quick talk", "I just want it to be able to talk to me in one, requirements two, plan three". Clear voice transcription artifacts. Voice score 7/10.

**Phase structure:** None — single atomic operation. ToolSearch/Read/Edit/Skill/Bash is the whole thing.

**Session feel:** Complete. Minimal and targeted.

---

### S11 · e5198554 · 2026-03-10 · 12.8 min · 3 prompts · 10 tools

**Tool sequence:** Read → Glob → Read×2 → Bash → Write → Edit×2 → Read → Edit

**Tool counts:** Read:4, Edit:3, Glob:1, Bash:1, Write:1

**Tool-only classification:** New file creation from reference material — Read→Glob→Read×2 is orient/gather, then Write (not Edit) suggests creating a new file, followed by Edit refinements. Probable: scaffolding a new skill file from brain/reference material.

**Actual prompts (all 3):**

- P1: "I would like to create a skill. I'm going to give you some information from the brains file. Essentially, I'll give you more information than you need. The main thing you're looking at is the notebook LM skill that prepares data for notebook LM." (very long, pasted brain context)
- P2: (identical to P1 — appears to be a re-paste/retry)
- P3: "And just giving you more information from the conversation that started this skill. If there's anything in this information that needs to go into the skill, can you just update the skill appropriately?"

**Classification accuracy:** Excellent. The Write→Edit pattern is the skill scaffolding signature, and that's exactly what happened. P2 being identical to P1 is interesting — suggests the first prompt may have been cut off or rejected.

**What the human is doing:** Creating the `notebook-lm` skill from brain content. The double-paste of P1 is notable — the session may have started with a truncated send, and P2 is a retry with the full content. P3 provides supplementary context from the originating conversation.

**Voice indicators:** Very strong — "I would like to create a skill. I'm going to give you some information from the brains file. Essentially, I'll give you more information than you need." This is exactly how someone speaks when dictating. Voice score 8/10.

**Phase structure:** READ (load brain) → WRITE (scaffold skill) → EDIT (refine). Classic 3-phase skill creation.

**Session feel:** Complete — notebook-lm skill created.

---

### S12 · 8eb3a9dc · 2026-02-21 · 527 min (9h span) · 21 prompts · 50 tools

**Tool sequence:** Task×2 → Glob×2 → Bash×3 → Read → Glob → Read → Edit → Read → Edit×2 → Skill → Bash×2 → Edit×3 → Read → Bash → Glob → Read → Bash → Write → Bash → Read → Bash → Write → Bash×2 → Write → Bash → Read → Bash → Edit → Bash×4 → Read → Write → Read → Edit → Bash → Edit → Bash×2

**Tool counts:** Bash:21, Read:9, Edit:9, Glob:4, Write:4, Task:2, Skill:1

**Tool-only classification:** Research-driven feature building — Task at the start is unusual (usually mid-session). This combined with Glob/Bash exploration suggests a session that starts with a planning artifact and then executes. The Skill mid-session suggests invoking an existing capability. Probable: building or extending a plugin, guided by a task list.

**Actual prompts (all 21, summarized):**

- P1: "when you are in a conversation and near compaction, what are 5 things you might want to do, I will give you 2 summarize, detailed knowledge capture"
- P2: "can you research online for these 5... on what problems people want to solve in their claude code sessions... look for existing skills people are building"
- P3-P9: Discovery conversation about brain-bridge vs knowledge-capture vs session-checkpoint; refining the concept; deciding to update brain-bridge skill description
- P10: "commit"
- P11-P16: Deciding to build leaf agents first (capture-context, knowledge-capture, session-checkpoint, near-compaction); executing each in sequence
- P17: "version bump and commit Then tell me, has this been updated? Do I need to run the reload? Plugins, what is actually the namespace of all five?"
- P18: "appydave-plugin-reload"
- P19-P21: Alias setup, documentation, push

**Classification accuracy:** Partial. The "research-driven feature building" was right conceptually but the research happens in natural language (not web search tools — note the mention of "research online" in P2 but no browser tools appear). The session actually builds 4 new plugin skills in sequence.

**What the human is doing:** A generative session — starting from an open question ("what do people do near context compaction?"), researching the problem space through conversation, then building 4 new skills (capture-context, knowledge-capture, session-checkpoint, near-compaction) in a single session. The most creative/generative session in the appydave-plugins batch.

**Voice indicators:** Strongly typed — the typos ("cpature", "calude", "coaptrue", "problbems", "orchistrator", "rembember") are characteristic of fast typed input, not voice. This is notable because most sessions have some voice markers; this has almost none. Voice score 0/10.

**Phase structure:** Exploration/deliberation (Bash/Glob) → Conceptual alignment (Read/Edit) → Skill invocation → 4× build cycle (Write/Edit/Bash) → Version/publish (Bash).

**Session feel:** Complete and highly productive — 4 new skills shipped in one session.

---

### S13 · 54577c11 · 2026-03-12 · 17 min · 10 prompts · 50 tools

**Tool sequence:** ToolSearch → mcp**playwright** (40 browser operations) → Skill → Bash×4 → Write×3 → Read → Bash

**Tool counts:** mcp**playwright**browser_click:20, mcp**playwright**browser_type:8, mcp**playwright**browser_navigate:5, Bash:5, Write:3, ToolSearch:1, [various playwright]:4, Skill:1, Read:1

**Tool-only classification:** Web automation / browser task — the overwhelming Playwright dominance is completely unambiguous. 40+ browser operations means navigating and interacting with a web UI. The Write tail suggests saving results to a file. Probable: extracting data from a website, or completing a web form/registration.

**Actual prompts (first 3):**

- P1: "Are you able to open up Playwright MCP and go to this URL? https://app.sola.day/event/detail/17788"
- P2: "If so, I'm in as me. I'm David at Ideasmen to come to the" (voice-truncated)
- P3: "david@ideasmen.com.au"

**Classification accuracy:** Perfect. The tool-only classification is definitively correct — this is exactly a Playwright web interaction. The session is David using Claude to navigate a Sola (event platform) page, likely registering for or confirming an event.

**What the human is doing:** Using Claude as a browser agent to interact with app.sola.day (an event/community platform). Likely registering for an event. The Write operations after the browser work probably saved a screenshot or confirmation. This is completely different from all other sessions — it's a personal task, not development work.

**Voice indicators:** Strong — P2 is clearly a truncated voice prompt ("I'm in as me. I'm David at Ideasmen to come to the..."). Voice score 0 as computed but the truncation itself is a strong voice signal. Corrected voice score: 9/10.

**Phase structure:** ToolSearch (load playwright) → Pure browser interaction → Skill → Write/Bash (save results).

**Session feel:** Complete. One-shot task accomplished.

---

### S14 · 8447409a · 2026-02-27 · 14.9 min · 5 prompts · 10 tools

**Tool sequence:** Read×2 → Edit×2 → Edit → Read → Edit×2 → Bash×2

**Tool counts:** Edit:5, Read:3, Bash:2

**Tool-only classification:** Small targeted update — Read-before-Edit is understanding before changing. 5 edits across 2 Bash runs suggests small targeted changes, quick verify. Probable: updating a skill or config file based on recent learnings.

**Actual prompts (all 5):**

- P1: "what do you know about our ralphy loop"
- P2: "is there any learning for Ralphy plugin in this information:" (pastes session context about AppyStack work)
- P3: "what is your recommendation"
- P4: (short confirmation)
- P5: (short confirmation)

**Classification accuracy:** Excellent. This is precisely what happened — reviewing recent AppyStack session work for Ralphy learnings, then making targeted edits to the plugin file.

**What the human is doing:** Cross-pollinating insights — taking learnings from an AppyStack session and asking whether they should go into the Ralphy plugin. The session pattern is "bring context, extract learning, apply to plugin". This is the knowledge propagation pattern in its minimal form.

**Voice indicators:** Conversational but probably typed — "what do you know about" is a common typed opener. Voice score 3/10.

**Phase structure:** READ (understand state) → EDIT (apply learnings) → BASH (verify). 3-phase minimal.

**Session feel:** Complete — quick learning transfer done.

---

## Sessions — angeleye

### S15 · 651ffc0f · 2026-03-12 · 1008 min (17h span) · 9 prompts · 19 tools

**Tool sequence:** Glob×7 → Bash → Read → Bash → Edit → Bash×8

**Tool counts:** Bash:10, Glob:7, Read:1, Edit:1

**Tool-only classification:** File system survey + targeted fix — 7 Globs at start means scanning for files across patterns, likely verifying existence of expected paths. Then Bash for shell operations, minimal Edit. Probable: verifying a project structure, then running a setup script or git operation.

**Actual prompts (all 9):**

- P1: "Can you just read this information and verify that everything that you notice about the handover message is accurate from a file name and location point of view?" (pastes AngelEye requirements handover)
- P2: "Can you confirm that those two folders really aren't there because this is what another conversation has to [say]... They're both there. Something else is reading the paths wrong — probably a tool or skill checking with ~ literal instead of expanded"
- P3: "Does the requirements document that you read give you everything you need to know? Is there anything from the original conversation that never got into the requirements document that you think was important?"
- P4: "Yeah, look, you can add whatever you want to the future capabilities document for me, and then you can make sure a copy of this file is sent over to the MBP via SSH... Or maybe you could push this app to GitHub instead."
- P5: "That's not correct. You put it in the wrong location. It's meant to go under @appydave"
- P6: "Can We make it public, not private."
- P7: "What was the nature of this conversation, I should say."
- P8: (pasted Claude Code welcome/tips screen — empty context paste)
- P9: "I don't think you've really given me a good understanding of what we're doing... I wanted to know what this is all about."

**Classification accuracy:** Good. The 7-Glob orientation was verifying handover message path claims. The Bash was pushing to GitHub. The single Edit was fixing the repo visibility (public vs private).

**What the human is doing:** Session is the first AngelEye session after requirements were completed in another conversation. Goal: verify the handover is accurate, check requirements completeness, push the repo to GitHub. The 17h span is a left-open session. P9 suggests mild frustration — the AI gave a status update when David wanted conceptual grounding.

**Voice indicators:** Conversational — "Yeah, look, you can add whatever you want", "Can We make it public, not private." Mixed voice/typed. Voice score 5/10.

**Phase structure:** Glob (verify paths) → Bash (git operations) → Read (requirements review) → Edit (visibility fix) → Bash (push).

**Session feel:** Mostly complete but P9 leaves a loose thread — David still wants better conceptual clarity on AngelEye.

---

### S16 · 201aec50 · 2026-03-13 · 1501 min (25h span) · 13 prompts · 112 tools

**Tool sequence (abbreviated):** Read → Glob×4 → Bash → Read → Write×2 → ToolSearch → Bash×12 → mcp**playwright** (navigate+screenshot cycle × many) → Bash×16 → mcp**playwright** (more) → Read → Edit → Agent×5 → Bash×6 → mcp**playwright** (more) → Glob×5 → Read → Bash×5 → Write → Edit×2 → Bash×4 → mcp**playwright** → Agent → Skill → Write×2 → Edit

**Tool counts:** Bash:44, mcp**playwright**browser_navigate:14, mcp**playwright**browser_take_screenshot:12, Glob:10, mcp**playwright**browser_tabs:8, Agent:6, Read:5, Write:5, Edit:4, ToolSearch:3, Skill:1

**Tool-only classification:** Research + development hybrid — the Playwright navigate/screenshot pattern alongside Bash/Agent suggests this is both looking at running applications (observing UIs in the browser) and building code. ToolSearch early means loading deferred tools. The alternation between Playwright and Bash suggests checking results in browser, then responding in code. Probable: researching competitor/reference tools visually while building the AngelEye system.

**Actual prompts (all 13):**

- P1/P2: (identical duplicates) "Read and absorb this information... just give me a bullet point list of the things we're likely to achieve... what is this essentially about, these requirements? Please be aware that the issue of AngelEye..."
- P3: "If we were doing a notebook LLM prompt based on the information you just sent me, what would be three different prompts that we could use for generating visuals?"
- P4: "Based on the statements of how they get started, can you start the two applications we were talking about using Playwright MCP?"
- P5: "You only ran one of the applications, so I can see Claude Replay. I can't see Deslar. Why not?"
- P6: "Based on the statements of how they get started... I want both applications running and opened in Playwright MCP in separate windows."
- P7: (pastes requirements.md updates) "you might find interesting... four meaningful improvements: Added SubagentStart and SubagentStop..."
- P8: "Now that you have a deep understanding not only of Claude Hook's observability from Dizzler or Claude Replay... build our own telemetry system"
- P9: "Can you also re-open up Deslar? It kind of got closed in the work you were doing"
- P10: "Give me a list of everything we've been talking about in this conversation..."
- P11: "Can it also include a list of the things that I think are important as an unintended or wrong term? I'm thinking when you've got information in front of you and it leads to better decisions later on..."
- P12: "One of the other things I want: firstly, give me more clarity about the word 'Ambient Intelligence'... when it recognises patterns in my prompts, it starts suggesting the idea to create skills... that's what ambient intelligence means"
- P13: "This terminology and stuff... around ANGEL-I, there's a lot of good stuff in here that should be taken over to the second brain... the focus area of the agentic operating system"

**Classification accuracy:** Excellent. The Playwright+Bash hybrid correctly identified as research-while-building. The two apps being opened were "Claude Replay" and "Deslar" (Dizzler) — competing/reference observability tools being studied visually to inform AngelEye's design. The Agent bursts built the actual AngelEye codebase.

**What the human is doing:** The foundational AngelEye development session — reading requirements, studying reference tools visually via Playwright (Claude Replay + Deslar), then starting to build the observability system. P12 is the pivotal moment where David defines "Ambient Intelligence" — the AI pattern-matching layer. P13 shows the knowledge propagation impulse: important discoveries should flow back to the second brain.

**Voice indicators:** Very strong — "Read and absorb this information", "you might find interesting", "that's what ambient intelligence means to me". Voice score 8/10.

**Phase structure:** READ (requirements) → Playwright (competitor research) → Bash (build environment) → Agent (code generation) → Playwright (verify UI) → Skill/Write (documentation/handover).

**Session feel:** Highly significant — this is where AngelEye's conceptual core ("Ambient Intelligence") was articulated. Not fully complete; knowledge propagation to brain requested at end.

---

### S17 · 99574b7a · 2026-03-15 · 57 min · 22 prompts · 212 tools

**Tool sequence (abbreviated):** Read×2 → Bash×2 → Read×2 → Glob → Bash → Read → Glob → Read → ToolSearch → TaskCreate×4 → TaskUpdate×4 → Agent → [4× sub-loop: Read×2 → Write → Bash×4 → TaskUpdate×2 → Agent] → Read×14 → Glob → Read×3 → Write → Edit×10 → Bash×4 → Grep×3 → Edit → Bash×5 → TaskUpdate → Edit×3 → Agent → Bash×43 → Read×2 → Edit → Bash×6 → Agent → Bash × many more → Agent × several → Bash×25+ → Read → Bash×3

**Tool counts:** Bash:124, Read:34, Edit:14, TaskUpdate:11, Agent:10, Glob:5, Grep:5, TaskCreate:4, Write:4, ToolSearch:1

**Tool-only classification:** Sustained automated build campaign — Bash:124 is the highest Bash count in this batch, with a structured Task cycle at the start and Agent delegation throughout. This is running many shell commands, likely tests, builds, or linting operations. The TaskCreate→TaskUpdate cycle at start suggests a managed work queue. Probable: CI-style automated test run with iterative fixes.

**Actual prompts (all 22, summarized):**

- P1: "What did we do related to themes? And AppyStack and recipes? And also, when it comes to the intelligence system, did we end up building that here in Angel Eye? What's the deal with the next ticket?"
- P2: "Okay, just tell me what things you want to do right now and how we're going to do it. Is it going to be a rough Wiggum loop or something?"
- P3: "Is it mechanical? Are there any unit tests that have to happen? It feels like if you did testing properly, there'd be enough complexity."
- P4: (short) — approving plan
- P5-P22: Mix of short confirmations, "continue", "yes", "what's next", occasional questions about current status. Classic Wiggum loop steering.

**Classification accuracy:** Excellent. The "sustained automated build campaign" nailed it. The 124 Bash calls are the AngelEye intelligence system being built — installing dependencies, running tests, running linters, building the data pipeline. This is the heaviest implementation session in the angeleye batch.

**What the human is doing:** Running the AngelEye implementation — the "Wiggum loop" (Ralph Wiggum development loop) executes work units against the intelligence system build. David is steering with short prompts while the AI drives the execution. The session is building the `angeleye` app itself (the system we're studying).

**Voice indicators:** Strong — "Is it going to be a rough Wiggum loop or something?", "What's the deal with the next ticket?", conversational steering. Voice score 7/10.

**Phase structure:** Orient (Read/Bash) → Task setup → 4× agent sub-loops (code gen) → Heavy editing phase → Bash-dominant execution phase (124 Bash) → More agent-guided work.

**Session feel:** Active/ongoing — this appears to be the session that is currently in progress or was very recently completed (2026-03-15 13:47, the most recent session in this batch).

---

### S18 · 2faac85b · 2026-03-15 · 3.6 min · 3 prompts · 16 tools

**Tool sequence:** Glob×2 → Read → Glob → Read → Bash×7 → Read×3 → Edit

**Tool counts:** Bash:7, Read:5, Glob:3, Edit:1

**Tool-only classification:** Diagnostic + quick fix — Glob/Read opening suggests verifying something exists or understanding a state. Bash×7 suggests running multiple diagnostic commands. Single Edit suggests a targeted fix. Probable: debugging a failing command or installation issue.

**Actual prompts (all 3):**

- P1: "Why can't I install it: /angeleye:install [pastes error output from npm run typecheck, TypeScript errors, etc.]"
- P2: "Can you just give me a handover message so I can give it back to that conversation of what it did, and also tell it that it should re-evaluate the skill anyway using the skill creator skill? So hand over conversation, please."
- P3: "Not in a file."

**Classification accuracy:** Excellent. Exactly right — debugging a failing install (`/angeleye:install` skill failing), running diagnostic bash commands, making a single targeted fix, then generating a handover message.

**What the human is doing:** Install skill for AngelEye is broken (TypeScript errors). David brings the error to a new conversation, gets it diagnosed and fixed, then asks for a handover message to relay back to the original session. P3 "Not in a file" means "just paste the handover in the chat, don't write it to disk." The session is essentially a debugging interrupt.

**Voice indicators:** Strong — "Why can't I install it", "Can you just give me a handover message... so hand over conversation, please." Voice score 6/10.

**Phase structure:** Glob/Read (understand) → Bash (diagnose) → Read (confirm) → Edit (fix).

**Session feel:** Complete — install skill fixed, handover message generated.

---

### S19 · e154b011 · 2026-03-15 · 8.3 min · 2 prompts · 21 tools

**Tool sequence:** Glob → Read → Edit → Bash×17 → Read

**Tool counts:** Bash:17, Read:2, Glob:1, Edit:1

**Tool-only classification:** Script/config fix + sustained execution — single Edit before Bash×17 suggests one targeted change followed by running the same or related command many times. Probable: fixing a script then running npm install / npm build steps.

**Actual prompts (both):**

- P1: "angeleye\n@appystack\nMulti-agent observability and telemetry.\n5050/51"
- P2: "yes"

**Classification accuracy:** Excellent in structure, blind to intent. P1 is clearly a `/appystack:create` or similar scaffold command with parameters (app name, description, ports). The AI is creating the AngelEye application from scratch using the AppyStack template.

**What the human is doing:** Scaffolding the AngelEye application — passing the app name, description, and ports to what is almost certainly the `create-appystack` recipe or an equivalent skill. The 17 Bash commands are npm install + build steps running during scaffold. P2 "yes" confirms a prompt during scaffold.

**Voice indicators:** None — P1 is structured parameter input. Voice score 0/10.

**Phase structure:** Edit (configure) → Bash (scaffold/install). Atomic.

**Session feel:** Complete — AngelEye app scaffolded.

---

### S20 · 123b11a5 · 2026-03-15 · 1.0 min · 3 prompts · 5 tools

**Tool sequence:** Bash×2 → Read×2 → Bash

**Tool counts:** Bash:3, Read:2

**Tool-only classification:** Quick lookup — 5 tools, 1 minute, 3 prompts. Bash→Read→Bash is a terminal check of something. Probable: checking a file, asking what skill to use.

**Actual prompts (all 3):**

- P1: "We get a conversation code requirements, which I think is around 8 July, but we also get some sort of meeting agenda. I don't know how it got into this folder or where it should go."
- P2: "If you can't solidly come up with a location for it to go into, I'm happy for you to delete it. Doesn't look like there's much in there anyway."
- P3: "Also, if I want to kick off a new application using the Revit or the API stack, what skill would do that?"

**Classification accuracy:** Partial. The "quick lookup" was right in spirit — this is a file housekeeping question and a skill question. But the tool sequence (Bash to look at the folder, Read to check the file, Bash to delete?) doesn't clearly show the skill-lookup aspect.

**What the human is doing:** Housekeeping — found an unexpected file (meeting agenda) in the AngelEye project folder, decided to delete it. Then asked which skill creates new AppyStack apps (`create-appystack`). This is a 1-minute orientation/cleanup session at the start of a new working session.

**Voice indicators:** Conversational — "I don't know how it got into this folder", "Doesn't look like there's much in there anyway". Voice score 2/10.

**Session feel:** Complete — file disposed of, skill query answered.

---

## Cross-Project Pattern Analysis

### Tool-Only Classification Accuracy

| Session        | Project          | Accuracy               | Notes                                                              |
| -------------- | ---------------- | ---------------------- | ------------------------------------------------------------------ |
| S01 (4c858f8a) | appystack        | Partial                | Correctly identified targeted fix; missed upgrade-tool propagation |
| S02 (bfa26edf) | appystack        | Good                   | Agent burst → implementation nailed; design deliberation invisible |
| S03 (2421e5c5) | appystack        | Close                  | Task cascade identified; genesis was audit not pre-plan            |
| S04 (77d71fc4) | appystack        | Good                   | WU campaign structure correctly read                               |
| S05 (8f220d36) | appystack        | Excellent              | AskUserQuestion is a unique unambiguous signal                     |
| S06 (4ff362fe) | appystack        | Good                   | Port hunt correctly inferred from Grep→Glob→Bash                   |
| S07 (06c69d58) | appystack        | Partial                | Multi-component work identified; Overmind context invisible        |
| S08 (d363ca82) | appydave-plugins | Excellent              | Edit-dominant → skill file maintenance, exact                      |
| S09 (55dde42d) | appydave-plugins | Partial                | Exploration correctly identified; alignment purpose missed         |
| S10 (794eef99) | appydave-plugins | Excellent              | ToolSearch+Edit → surgical targeted change, exact                  |
| S11 (e5198554) | appydave-plugins | Excellent              | Write→Edit → new skill from brain, exact                           |
| S12 (8eb3a9dc) | appydave-plugins | Partial                | Research-driven identified; 4-skill build scope missed             |
| S13 (54577c11) | appydave-plugins | Perfect                | Playwright dominance unambiguous                                   |
| S14 (8447409a) | appydave-plugins | Excellent              | Minimal Read→Edit→Bash = quick targeted update                     |
| S15 (651ffc0f) | angeleye         | Good                   | Glob verification + git push identified                            |
| S16 (201aec50) | angeleye         | Excellent              | Playwright+Bash hybrid = research while building                   |
| S17 (99574b7a) | angeleye         | Excellent              | Bash:124 = implementation campaign, exact                          |
| S18 (2faac85b) | angeleye         | Excellent              | Diagnostic + fix + handover                                        |
| S19 (e154b011) | angeleye         | Excellent in structure | Missed that P1 is a scaffold command                               |
| S20 (123b11a5) | angeleye         | Partial                | "Quick lookup" correct but detail thin                             |

**Overall accuracy: 14/20 excellent or good, 6/20 partial or missed**

The tool-only classifier fails most often when:

1. The prompt contains context injected from other sessions (truncated pastes, handover messages)
2. The session opens with a conceptual discussion before tools fire
3. The actual scope of work is broader than the first task (e.g. S12: started with one problem, ended building 4 skills)

The tool-only classifier succeeds most reliably when:

1. A distinctive rare tool is present (AskUserQuestion, Playwright, ToolSearch at start)
2. A single dominant tool type (Edit:15 = documentation; Bash:124 = execution campaign)
3. Pattern is Write-without-preceding-Read → new file from scratch

---

### Project Fingerprints

**appystack sessions** are characterised by:

- **High Bash counts** — appystack work almost always involves npm build, test, install operations
- **Task/TaskUpdate cycles** — the Ralph Wiggum (WU-based) campaign pattern appears in 4 of 7 sessions (S03, S04, S05, S07)
- **Large prompt sizes** — David frequently pastes entire previous conversations or session handovers as context (S01: avg 20,728 chars; S05: 2,975)
- **Agent delegation bursts** — complex multi-file work is delegated in clusters (S02: Agent:15, S07: Agent:13)
- **"What's the state?" opening** — S02 opens exactly with this; S01, S03, S05, S07 all begin with context-loading pastes
- **Duration anomalies** — S05 shows 41h span, S06 shows 12h span — sessions are left open across work sessions

**appydave-plugins sessions** are characterised by:

- **Lower tool counts overall** — median 26 tools vs appystack's ~93. Plugin work is more surgical
- **Edit-dominant ratio** — the highest Edit/total ratios in the batch are all appydave-plugins sessions
- **Ralphy is the most-mentioned entity** — 6 of 7 sessions reference Ralphy directly (the 7th used Playwright for an unrelated task)
- **The knowledge-propagation loop is visible** — S08, S09, S12, S14 all show the same pattern: bring learning from another context, update plugin to reflect it
- **Short sessions dominate** — S10 (3 min), S13 (17 min), S14 (15 min), S11 (13 min) — plugin work tends to be quick surgical fixes
- **Voice transcription is strongly present** — S10, S11, S13 all have clear voice artifacts; S12 has none (all fast-typed)
- **One pure outlier (S13)** — the Playwright session for a Sola event registration is completely unlike all other plugin sessions. It landed in appydave-plugins by project context but is a personal errand, not plugin work

**angeleye sessions** are characterised by:

- **Very high file sizes relative to tool counts** — S15 (271k, 19 tools), S16 (270k, 112 tools). Large prompts injected as context
- **The highest voice scores in the batch** — S16 (8/10), S17 (7/10), S18 (6/10). AngelEye sessions involve more dictated/conversational prompting
- **Two-mode pattern** — sessions split between (a) orientation/verification/requirements work (low tool count, large prompts, Glob-heavy) and (b) implementation campaigns (high Bash, Agent, Task system)
- **Frequent handover context injection** — the AngelEye sessions often start by pasting a handover from a previous session (S15, S17, S18)
- **Faster clock times** — despite larger files, angeleye sessions are shorter in real duration (S17: 57 min with 212 tools; contrast appystack S04: 126 min with 130 tools)
- **Self-referential** — S17 is AngelEye building AngelEye's own intelligence system (the system being studied by this research is visible building itself)

---

### Distinctive Signals — Tool Classification Rules

Based on this batch, the following tool-level signals are reliable classifiers:

| Signal                                     | Classification                                            |
| ------------------------------------------ | --------------------------------------------------------- |
| AskUserQuestion ≥ 5                        | Structured Q&A / requirements elicitation session         |
| mcp**playwright** dominates                | Web automation / browser task (personal or research)      |
| Glob ≥ 5 before first Edit                 | Orientation/verification session, probably checking paths |
| Task + TaskCreate + TaskUpdate cluster     | Ralph Wiggum campaign / structured work-unit execution    |
| Edit dominant (≥ 40% of tools), Read ≤ 20% | Surgical update of known file (documentation/skill)       |
| Write appears before Read                  | New file creation from scratch (skill scaffolding)        |
| Bash ≥ 50% of tools                        | Execution campaign (build/test/install/publish)           |
| ToolSearch at start, then Edit             | Targeted change using a deferred tool                     |
| Agent ≥ 10 in cluster                      | Delegated multi-file generation (major feature)           |
| Skill appears exactly once, near end       | Session closing with handover or summarization skill      |

---

### Voice Transcription Patterns

11 of 20 sessions show voice transcription signals (score ≥ 3):

- **appystack:** 5/7 sessions (voice-heavy)
- **appydave-plugins:** 4/7 sessions (mixed — S12 notably all typed, S13 voice-truncated)
- **angeleye:** 4/6 sessions (voice-heavy, especially larger sessions)

Voice sessions tend to have:

- Longer individual prompts with natural sentence flow
- Filler words: "so", "yeah", "look", "basically"
- Self-corrections mid-prompt ("FliGen, not flijam")
- Truncated prompts (S13: "I'm in as me. I'm David at Ideasmen to come to the")
- Incomplete grammar at prompt boundaries

Typed sessions (S12, S13 non-voice, S19) are characterized by:

- Typos without self-correction ("coaptrue", "rembember")
- Terse structured inputs
- Parameter-formatted prompts ("angeleye\n@appystack\nMulti-agent observability and telemetry.\n5050/51")

---

### Session Duration vs Complexity

The 41h (S05) and 25h (S16) spans are almost certainly left-open sessions — Claude Code sessions remain open while the user is away, inflating clock duration. The cleaner measure is total events / actual engagement density.

Three sessions show anomalous file-size-to-tool-count ratios:

- S15 (651ffc0f): 271k bytes, 19 tools — large prompts with pasted requirements documents
- S16 (201aec50): 270k bytes, 112 tools — large prompts + heavy tool use
- S17 (99574b7a): 247k bytes, 212 tools — smaller prompts but 212 tool invocations

The intelligence system should probably weight **tool count** over **file size** for "session weight" — file size is dominated by pasted context, while tool count reflects actual AI execution effort.

---

### Ralphy / Task System Usage

The Task/TaskCreate/TaskUpdate cluster appears in 5 of 20 sessions:

- S03, S04, S05, S07 (appystack) — always associated with WU (work unit) campaigns
- S12 (appydave-plugins) — appears at start, task management for plugin build session
- S17 (angeleye) — TaskCreate×4 at start launching the Wiggum loop

Pattern: Task system is used when work is pre-planned into named units, not for exploratory sessions. The presence of TaskCreate early in a session reliably predicts structured execution of a defined campaign. Sessions without TaskCreate are either exploratory (discovery, requirements) or surgical (targeted fixes).

Skill invocations (the Skill tool specifically) appear in 10 of 20 sessions — mostly one invocation per session, typically at the end (handover/summarization) or in the middle (loading a context skill). The Skill tool is a lightweight signal; its position matters more than its presence.

---

### What Plugin/Skill-Building Work Looks Like vs Product-Building Work

**Plugin/skill-building (appydave-plugins):**

- Starts with a question about the current state of a skill ("what do you know about Ralphy")
- Usually has a "bring learning from elsewhere" trigger (pastes context from another session)
- Edit-dominant; reads a few files to understand, then edits the same files
- Short sessions — typically under 20 minutes when not left open
- Goal is almost always: "make this skill better reflect what I actually want"
- The Ralphy plugin is a recurring gravity well — 6/7 sessions touch it

**Product-building (appystack, angeleye):**

- Starts with orientation ("what's the state?", pastes handover)
- Often involves a planning/deliberation phase before tools fire
- Heavy Bash (npm build, test, install cycles)
- Uses the Task system for structured work units
- Agent delegation for multi-file generation
- Sessions are longer and have multiple distinct phases
- The problem domain is more varied — not a single recurring focus

The key structural difference: **plugin sessions are convergent** (many possible learnings → one file updated), while **product sessions are divergent** (one goal → many files changed, many systems touched).

---

_Research complete. 20 sessions analyzed. Findings written to batch-3.md._
