# AngelEye Intelligence Research — Batch 1: Brains Project Sessions

**Date written:** 2026-03-15
**Analyst:** Claude Sonnet 4.6 (via AngelEye agent)
**Sessions analysed:** 19
**Source project:** `brains` (project_dir: `/Users/davidcruwys/dev/ad/brains`)
**Registry total for project:** 239 qualifying sessions (>=500 bytes)
**Selection strategy:** Stratified by size — 3 largest, then stepped samples down to ~3.8KB

---

## Session-by-Session Analysis

---

### S01 — `2ed25517` | 2026-03-08 | 305 KB | 36 prompts | 686 tools | 509 min

**Tool-only hypothesis (before reading prompts):** Heavy Playwright automation (146 navigate, 163 evaluate, 51 click) + Brave web search + heavy Bash + Agent subagent launcher + some file writing. Hypothesis: scraping or automating a web platform, possibly downloading content.

**Actual goal:** Deep research into "second brains" and Cole Medin's Dynamous AI community. David wanted to understand the relationship between his own brain system and Cole Medin's, find the original git repo, then used Playwright to log into a private community platform (community.dynamous.ai) and extract/download VTT transcripts from live stream recordings.

**Tool-only guess: CORRECT.** The dominant Playwright cluster unmistakably points to web automation with login-wall navigation. The Agent tool at the very start indicates a broad research subagent was launched before the manual scraping work began.

**First 3 prompts:**

1. "Do deep research into two different concepts: 1. Second brains as they relate to what I've been working on recently... cole medan. 2. ...where is the original git repo that the dynamus cole medan system was used in?"
2. "Yeah, please check it out. It seems like it's not available anymore, and I'm not sure why."
3. "If I give you access to circle, with a login, can you identify core areas of his repository and his community that I need to be aware of, without writing anything?"

**Key observations:**

- Opens with an Agent subagent for broad research, then shifts to manual Playwright-based community exploration
- Contains multiple context handover injections ("This session is being continued...") — at least 8 of the 36 prompts are handover summaries, not real user inputs. This is a session that ran out of context 5+ times and was resumed
- Strong voice artifacts: "dynamus cole medan" (mishearing of "Cole Medin"), "If I give you access to If I give you access to cirle" (restart mid-sentence)
- Session spanned ~8.5 hours but with a 2-hour gap mid-session (06:55 to 09:08), suggesting resumed after a break
- Late session adds meta-testing: David pasted outputs from other Claude windows to compare whether the brain was discoverable. This is a knowledge-audit loop
- Emotional register: curious, exploratory, then methodical. One moment of surprise: "Shane, you're meant to read this and see whether it gave the right answer" — David briefly spoke to someone else present
- Ends with "continue" suggesting he closed it before completing
- **Subtype: RESEARCH EXPEDITION + CONTENT INGESTION** — discovers a source, logs in, scrapes, indexes

**Phase map:**

- Phase 1 (tools 1–20): Agent subagent research + web search → understand the landscape
- Phase 2 (tools 21–200): Playwright community login + VTT transcript downloads
- Phase 3 (tools 200–400): Transcript extraction, naming, indexing
- Phase 4 (tools 400–686): Brain discoverability audit — testing whether info is findable in a clean Claude instance

---

### S02 — `84e401ee` | 2026-02-22 | 211 KB | 46 prompts | 89 tools | 116 min

**Tool-only hypothesis:** Heavy Edit (38) + Bash (26) + Read (24), no web, no agent. Hypothesis: editing config/code files with repeated test runs. Likely DevOps or infrastructure config work.

**Actual goal:** Live Ansible provisioning of a new Mac Mini M4. David was running `ansible-playbook site.yml` repeatedly, pasting raw terminal output into the chat, and asking Claude to diagnose why certain casks (Alfred, Docker, Tailscale, Elgato Stream Deck) were hanging or failing.

**Tool-only guess: CORRECT.** The tight Bash+Read+Edit loop with no web search is the signature of iterative config debugging against a live system. No agent = human is the test runner.

**First 3 prompts:**

1. `"read: and wait\n\none. One line in site.yml now sets /opt/homebrew/bin..."` — This is a pasted Claude response from a previous turn, confirming a resumed/continued session
2. `"where are we at?"` — Session orientation after context reset
3. `"I have 330 mpbs"` — Reporting his bandwidth mid-install

**Key observations:**

- 46 prompts but many are raw terminal paste-ins (Ansible output, SSH results) — these are status-checks not instructions
- Strong frustration register: "this is so tiring", "this headless bullshit sucks", "surely ansible is better than this"
- Prompts are generally short (avg not calculated but clearly under 100 chars for status prompts). The long prompts are raw terminal output, not composed text
- Voice artifacts present: "I have 330 mpbs", "mpbs" not "Mbps", "what makes you thikn this is big"
- The session has a clear resolution pattern: failing tools get moved to "manual install" list. David is doing real-time triage
- No subagents — this is a pure human-drives-debugging session
- No web search — all knowledge is in the files + Claude's Ansible knowledge
- Ends mid-process (last prompt is a failing tag command), likely abandoned when he ran out of time/patience
- **Subtype: LIVE INFRASTRUCTURE DEBUGGING** — paste-and-diagnose loop against a real running system

**Phase map:**

- Phase 1 (tools 1–20): Read existing config + diagnose state
- Phase 2 (tools 21–60): Edit playbooks, run test commands, interpret output
- Phase 3 (tools 61–89): Move problematic casks to manual, update docs, re-run

---

### S03 — `59c2d164` | 2026-03-01 | 176 KB | 34 prompts | 97 tools | 354 min

**Tool-only hypothesis:** Bash (44) + Read (30) + Edit (18) + Write (3) + Skill (2). No web, no agent. Hypothesis: file reorganisation or codebase audit with heavy exploration and structural edits.

**Actual goal:** Continuation of agentic-OS architecture documentation. David was pushing completed JSON architecture files, reviewing documentation quality, exploring whether the Kyberbot GitHub repo had been incorporated, then pivoting to discussing NotebookLM presentation creation and slide deck prompts for an "agentic OS" talk.

**Tool-only guess: PARTIALLY CORRECT.** The Bash+Read+Edit pattern correctly predicts config/doc work, but misses the conversational meta-layer — long stretches of this session are discussion about what to build next, not building.

**First 3 prompts:**

1. Pasted Claude output from previous session (a Bash verification) — classic context pickup
2. `"push it"` — terse approval
3. "Did we have https://github.com/KybernesisAI/kyberbot locally in our repos folder... And did you use your deep understanding from that project to make any decisions?"

**Key observations:**

- Contains 4+ context handover injections — this is a very long session with multiple context runouts
- "push it" appears 4 times across the session — David's terse approval-then-commit pattern
- Mid-session the topic drifts substantially: from Ansible/architecture → staging JSON for NotebookLM → slide deck prompt design → machine-readable JSON formats
- The Skill(2) calls are significant — David invoked skills mid-session, possibly brain-bridge or similar
- Strong voice artifacts throughout: "I feel like when you got me all the documents... you missed a whole section" (correction), "stack" as a one-word response
- Emotional register: patient, reflective, occasional frustration ("by the way, that Nick Stone main got into the presentation didn't really make much sense")
- Last prompt: asks to create a temp folder with JSON docs and open in Finder — classic "I want to take this offline" ending
- **Subtype: DOCUMENTATION + ARCHITECTURE AUDIT with topic drift**

---

### S04 — `4e3b83f7` | 2026-02-18 | 109 KB | 23 prompts | 107 tools | 777 min

**Tool-only hypothesis:** Edit (39) + Read (29) + Bash (20) + Task system (TaskCreate:4, TaskUpdate:6, Task:2) + Write (6) + Skill (1). The Task tools are distinctive — hypothesis: structured project with todo tracking, editing existing brain files systematically.

**Actual goal:** Iterative brain file quality improvement — specifically the agentic-OS brain's index structure and JSON. David was reviewing JSON structure, removing "stubs" that he felt added noise rather than value, recounting files, and then asking Claude to write the process as a "brain librarian checklist file."

**Tool-only guess: CORRECT.** The Task-based workflow with Read+Edit+Bash is exactly what structured brain maintenance looks like. The absence of web tools confirms this is internal knowledge work.

**First 3 prompts:**

1. "Is the file of the content that I've just given you still relevant? Do you know where the files are?" — orientation prompt after context reload
2. "is this JSON prominent in the index struction fure agentyic-os brain?" — voice-transcribed: "structure" → "struction fure", "agentic" → "agentyic"
3. "yes, fix both"

**Key observations:**

- The shortest average prompt in the set: prompts 3–20 are almost all 1–4 words ("yes", "yes, fix it", "keep going", "commit this"). This is a flow-state session — David is rubber-stamping Claude's proposals
- Strong voice transcription errors: "struction fure" (structure), "agentyic-os" (agentic-os)
- TaskCreate/TaskUpdate pattern suggests Claude was creating visible tasks as it went — likely using a task management skill
- 777 min duration (13 hours!) with only 23 prompts = extremely spaced out; likely left overnight or across a full work day
- Session ends with David asking to formalise the process: "write that process as a brain librarian checklist file" — meta-documentation of what just happened
- No web, no agent — entirely introspective system work
- **Subtype: BRAIN MAINTENANCE / LIBRARIAN FLOW** — the archetypal brain-gardening session

---

### S05 — `5f57d757` | 2026-02-20 | 94 KB | 13 prompts | 28 tools | 207 min

**Tool-only hypothesis:** Write (8) + Bash (5) + Edit (5) + Read (4) + WebFetch (3) + Grep (3). The WebFetch without web search suggests fetching specific known URLs. Hypothesis: setting up a new brain subdirectory, possibly importing external content.

**Actual goal:** Creating a new "AI meetups/workshops" brain for two recurring events — AI Engineers Meetup (Saturday) and Agents in the Wild (Friday). David added stubs for both, then fetched Nick Stone's lab page (0xnfrith.com/lab) content, created a session notes file for the first Agents in the Wild meetup, and finally ingested an OMI voice transcript of the session.

**Tool-only guess: CORRECT.** The Write+WebFetch combo is indeed brain setup + external content ingestion.

**First 3 prompts:**

1. "can we setup a new brain specifically for ai related workshops or meetups that I go to, so on a saturday I go the AI engineers meetup group but on a friday I go to agents in the wild and I need a simple stub for both"
2. "Need to add oxnfrith.com/lab to the agents in the wild"
3. "sorry, https://0xnfrith.com/lab" — URL correction

**Key observations:**

- Short, directive prompts — David knows exactly what he wants
- Prompt 3 is a URL correction: typed wrong URL first, then corrected. Common pattern for voice-typed or fast-typed sessions
- Prompt 11 is a large OMI transcript paste — this is the "ingest after the event" workflow
- The session has a very clear structure: create structure → add reference → capture today's notes → ingest transcript
- Last prompt: " Cole Medin" — just a name, likely a search or association query. Abrupt ending
- No task system, no agents — simple, focused, 13-prompt, one-topic session
- Voice artifact: "oxnfrith.com" before correcting to "0xnfrith.com"
- **Subtype: NEW BRAIN SETUP + EVENT INGESTION** — post-meetup brain scaffolding

---

### S06 — `8e8dac5b` | 2026-03-04 | 74 KB | 14 prompts | 200 tools | 257 min

**Tool-only hypothesis:** Bash (73) + pw.run_code (37) + Edit (29) + Agent (26) + pw.navigate (17). Heavy Playwright with `run_code` is distinctive — this is programmatic web scraping with JavaScript execution, not interactive browsing. Hypothesis: scraping a training/course platform, possibly downloading transcripts.

**Actual goal:** Accessing and downloading transcripts from Ecamm Live training videos on takeonetech.io. David logged Claude into the site, identified video URLs, then had Claude systematically navigate and extract transcript text from 176 course replay files, organising them into the tubescripts directory.

**Tool-only guess: CORRECT.** The pw.run_code tool specifically is used for DOM scraping — this is clearly programmatic content extraction, not user interaction.

**First 3 prompts:**

1. "Can I get you to log into this website? We're going to look into Ecamm Live training material. https://www.takeonetech.io/library"
2. "Can you just identify the URLs that would take you to anything related to Ecamm Live training?"
3. "You probably want to go into the library and learnings."

**Key observations:**

- Agent (26) is very high — Claude was dispatching sub-agents to process individual pages/transcripts in parallel
- Context handover injections appear (prompts 9 and 13) — session ran out and was resumed
- "I don't know that there's anything wrong with reading the replays. I think he does things differently each time. I think we should just move through all of it" — David explicitly authorising a bulk download
- Last prompt: "Yeah, we'll just keep going. Don't stop at all." — permission to continue autonomously
- The 200 tools in 14 prompts = extremely tool-dense. Claude was operating near-autonomously
- Edit (29) appears because transcripts were being formatted/cleaned after download
- Voice artifacts: "Also known as my learning My library, I should say" — restart mid-sentence
- Emotional register: businesslike, patient, mostly one-direction (David gives permission, Claude executes)
- **Subtype: BULK CONTENT HARVESTING** — automated download of training material from a gated platform

---

### S07 — `2efc01af` | 2026-03-13 | 70 KB | 19 prompts | 157 tools | 1421 min

**Tool-only hypothesis:** Bash (50) + Read (38) + Edit (32) + Write (23) + Agent (7) + Glob (5) + Skill (2). High Write count suggests creating many new files. Agents (7) suggest parallel research. Hypothesis: major cross-project documentation or knowledge synthesis.

**Actual goal:** Auditing all applications in the system and updating cross-project documentation — specifically around AppyStack capabilities, Overmind configuration, application start scripts, and the Mochaccino mockup convention. David also did Ansible auditing (adding JQ and Overmind to baseline configs) and committed multiple branches.

**Tool-only guess: CORRECT but incomplete.** The tools describe cross-project work correctly. What they miss is the conversational frustration — David was correcting Claude's misunderstandings about where things should live.

**First 3 prompts:**

1. "Now I get you to bring into memory the different applications we've got. The ones I'm really interested in are stuff in the apps folder and the FliVideo thing. I'm also interested in AppyStack's ability..."
2. "Do you have the information from the BTW by the way that we just did?"
3. "That's not what I asked for. Did you have the information from that you've just written here in your context? /btwI just need you to background check..."

**Key observations:**

- 1421 minutes (23.7 hours) — almost certainly spread across multiple days with the session left open
- Prompt 3 shows David correcting Claude's answer and referencing a `/btw` background context note he'd just added
- The Agent cluster at the start (4 agents fired before any reading) = Claude launched multiple parallel sub-agents immediately
- Agents dropped after prompt 5 — Claude switched to direct execution mode
- Contains evidence of the Mochaccino convention being discussed: "Can you go look in AppyStack? I think we might have updated some concepts around Mocaccino and where mocks are meant to go"
- Strong voice: "contninue" (typo/voice error), "I'm also interested in AppyStack's ability. It's new, so not all the apps have it, but it's a new ability or requirement, or something that"
- Emotional register: slightly frustrated early (prompt 3 is a correction), then workmanlike
- **Subtype: SYSTEM AUDIT + CROSS-PROJECT MAINTENANCE** — the "admin day" session type

---

### S08 — `e19c5d71` | 2026-03-11 | 64 KB | 2 prompts | 0 tools | 2 min

**Tool-only hypothesis:** No tools at all. Hypothesis: pure conversational exchange, possibly an orientation or "what should I do?" question.

**Actual goal:** David asked what Claude would do with OMI morning briefing data, then decided he was too tired to act on it. He pasted content from two other conversations for opinion and signed off.

**Tool-only guess: CORRECT** (by default — no tools means no action was taken).

**First 2 prompts:**

1. "If we were just ingesting information in the morning, Omi, or that, what would you do with it? What's your normal plan of dealing?"
2. "I'll do it tomorrow. I'm a bit tired. What do you think of this information I'm sending?"

**Key observations:**

- Despite being 64KB on disk, all that content is Claude's responses, not events — the session file is large because Claude wrote long answers
- This is a "check in but don't commit" session — David was exploring what OMI morning workflow would look like but didn't follow through
- No tools, no writes, no edits — pure thinking session
- The 64KB file size vs 0 tools reveals something important: **file size is NOT correlated with tool usage in this dataset** — large Claude responses inflate file size independently of work done
- Voice artifacts present: "Omi, or that" (hedge word), "tired" ending
- Emotional register: tired, exploratory
- **Subtype: IDEATION / PLANNING — NO EXECUTION** — the "thinking out loud" session that goes nowhere

---

### S09 — `9d63797d` | 2026-03-08 | 58 KB | 18 prompts | 70 tools | 730 min

**Tool-only hypothesis:** Bash (32) + Read (11) + Edit (11) + Agent (9) + Write (4) + Skill (1) + Glob (2). Agent (9) is notable. Hypothesis: multi-project exploration with sub-agents gathering information, followed by documentation writing.

**Actual goal:** Mapping all active applications in the system, creating an `create-appystack` skill, clarifying the distinction between the AppyStack template's internal skills vs the user-facing create skill, then testing whether the brain was discoverable by running the same questions in fresh Claude windows and pasting the results back.

**Tool-only guess: CORRECT.** The Agents represent parallel sub-tasks (research + skill creation). The Edit/Write cluster is skill file authoring.

**First 3 prompts:**

1. "I believe we've been making a little bit of progress on understanding where all of our different applications are in the system."
2. "While you're looking at it, do we also have either a skill or any mechanism in place for working with the new AppyStack..."
3. "The fact that we've got unclear purpose and need to look is just ridiculous, because, like I said, you should know this."

**Key observations:**

- Prompt 3 registers mild frustration: David is annoyed that Claude doesn't know where things are. This is a recurring theme across brains sessions — the gap between David's expectation of a "living brain" and the reality of a fresh context
- This is the same day as S01 (2026-03-08) — two sessions on the same day, likely opened separately
- The session contains David's "knowledge audit" meta-pattern again: he pasted outputs from other Claude windows at prompts 15, 16, 17 to test discoverability
- Strong voice: "I'm a little confused on how we're going to do an AppyStack skill from this point of view" — thinking out loud while speaking
- **Subtype: KNOWLEDGE AUDIT + SKILL AUTHORING** — testing the brain's surface area

---

### S10 — `580c428a` | 2026-03-12 | 53 KB | 44 prompts | 127 tools | 135 min

**Tool-only hypothesis:** Bash (113!) + Glob (2) + Grep (2) + Read (2) + Agent (2) + Playwright (3). Overwhelming Bash dominance. Hypothesis: live system work — SSH, file system commands, possibly syncing between machines.

**Actual goal:** Gap analysis between MacBook Pro (with destroyed screen) and Mac Mini M4 after getting the MBP back from repair. David was SSHing into the MBP, comparing location.json files between machines, identifying which folders needed to be synced over, and then using rsync to transfer selected directories.

**Tool-only guess: CORRECT.** 113 Bash calls = live terminal work, SSHing to another machine, running rsync.

**First 3 prompts:**

1. "Do we have an understanding of how we moved files from my MacBook Pro over to my Mac Mini M4?... How would we do a gap analysis?"
2. "Have we got an ability to SSH into that computer then?"
3. "Hang on, what's the name of the MacBook Pro computer?"

**Key observations:**

- 44 prompts in 135 min = rapid back-and-forth, highly conversational
- Strong voice throughout: "Now, what do you think I have left over to deal with on the MBP? Like, what do I need to check?" — stream of consciousness
- Mid-session Playwright appears briefly (prompts ~10) to open Tailscale and check connected devices
- The session ends discussing Tailscale personal plan limits, AppyStack's create command, location.json URI design — drifts significantly from the original sync task
- Agent (2) used for background checks (Tailscale plan verification)
- Emotional register: businesslike but somewhat scattered — David is context-switching rapidly
- Late session references AngelEye: "We just added a new file called in Angel Eye. Can you see it and is it updated on both machines?" — this session is contemporaneous with AngelEye's creation
- **Subtype: CROSS-MACHINE SYNC / SYSTEM ADMINISTRATION**

---

### S11 — `77764bc1` | 2026-02-20 | 46 KB | 20 prompts | 80 tools | 152 min

**Tool-only hypothesis:** Bash (52) + TaskUpdate (10) + Read (7) + TaskCreate (5) + Write (4) + Skill (1) + Edit (1). Heavy Task system + Bash. Hypothesis: systematic directory/file audit with task tracking — possibly brain inventory or reorganisation.

**Actual goal:** Auditing the full brains directory structure, then pivoting to building out the Dent brain (a branding/business framework). David had downloaded Dent PDFs, needed them filed under the Dent brain with an archive subfolder, and was concerned about not confusing Dent content with Brand Dave content.

**Tool-only guess: MOSTLY CORRECT.** The Task system + Bash is correct for systematic audit work. The topic (Dent brain setup) is knowable only from prompts.

**First 3 prompts:**

1. "How many brains do we have? And are they all fairly flat?"
2. "Are you happy with the stretcher? I don't mind that there's 24 brains... Could you give me a tree of just folders, two to three levels deep?"
3. "Situation I have today is that I'm going to work in DENT..."

**Key observations:**

- Prompt 2: "happy with the stretcher" — likely voice transcription error for "structure" or "strategy"
- This session contains a context handover at prompt 18 — one context runout and resume
- "Catalogue has instructions inside of itself on how to update itself in the future" — interesting self-documenting brain pattern
- Last prompt: "just make somewhere that this folder needs to be reviewd by DAVID" — capital DAVID suggests an emphasis, possibly dictated
- Task tools used as a progress tracker rather than a real task manager
- Strong Bash (52) suggests lots of `ls`, `tree`, `cp`, `mv` operations
- **Subtype: BRAIN INVENTORY + NEW BRAIN SETUP (Dent)**

---

### S12 — `dc408618` | 2026-03-03 | 42 KB | 5 prompts | 20 tools | 1462 min

**Tool-only hypothesis:** Edit (12) + Read (6) + Skill (1) + Write (1). Pure knowledge editing. No Bash, no web, no agents. Hypothesis: writing and refining documents — likely patterns, templates, or conceptual notes.

**Actual goal:** Designing and documenting agentic prompt patterns — specifically "Team Up" and "Agent Handshake" patterns. David described patterns verbally, Claude formalised them as markdown documents in the brains/prompt-patterns area.

**Tool-only guess: CORRECT.** Edit+Read+Skill+Write without Bash = pure knowledge authoring. No side effects, no system changes.

**First 3 prompts:**

1. "We've just been doing work this week on prompt patterns. It's probably in a new branch. Can you bring it up? /focus Prompt patterns..."
2. "Perfect, now I've got a pattern that I'm working with this morning... it's me getting two team members to tell the orchestrator..."
3. "What about Agent Handshake pattern? It can be bi-directional..."

**Key observations:**

- 1462 minutes (24+ hours) for only 5 prompts = left open overnight, almost certainly
- The Skill call at the start is `/focus` — a skill invocation to load context about the prompt patterns work
- Extremely low tool count (20) for a session this old suggests it was a lightweight, focused session
- Prompt 4: "In a short sentence, what is this conversation about?" — David testing if Claude can summarise
- Prompt 5: "Can you just look at all the decisions, topics, anything that we were talking about in this conversation? Just list them all out for me so I can review them before closing down this conversation." — explicit session-close review ritual
- The closing review prompt appears in multiple brains sessions — a recognisable signature behaviour
- Voice artifacts: "Sorry, there's a little bit of de-duplication with what the team members did because I forgot to give the questioner..."
- **Subtype: KNOWLEDGE AUTHORING — PATTERN DESIGN** — pure conceptual work, no system ops

---

### S13 — `d3a8db00` | 2026-03-03 | 29 KB | 8 prompts | 101 tools | 278 min

**Tool-only hypothesis:** Bash (32) + Read (26) + Edit (21) + TaskUpdate (13) + TaskCreate (5) + Write (4). Very heavy Task system (18 task events). Hypothesis: structured implementation work with task tracking — likely infrastructure config (Ansible) given Bash dominance.

**Actual goal:** Adding a sixth computer (Lars, a client) to the agentic OS. Creating an Ansible playbook for Lars's machine, abstracting out opinionated config choices, and adding documentation to the GitHub repo README.

**Tool-only guess: CORRECT.** Bash+Read+Edit+Tasks is the Ansible work pattern precisely.

**First 3 prompts:**

1. "We have five computers listed. We're going to record a sixth computer... It's for Lars, a client..."
2. "I got to move a couple of things out of workstation and every machine. They're more David-specific..."
3. "Look, that flag that you've just told me about, the GitHub username in the email, is actually something that needs to be abstracted out somehow."

**Key observations:**

- Only 8 prompts but 101 tools — very high tool density. Claude was executing autonomously between prompts
- TaskCreate/TaskUpdate pattern suggests Claude was managing its own work queue
- The session has explicit session-close ceremony at prompts 7–8: "Have we done everything we wanted to do in this conversation? Can I close it off now?" followed by "Yes, do that please, and then let me know if we can close down the conversation. If you need to do any commits and pushes, you should do that as well."
- This "explicit close ceremony" appears in multiple sessions — David is deliberate about clean session endings
- The commit+push at end is standard practice across brains sessions
- **Subtype: INFRASTRUCTURE CONFIG — NEW MACHINE REGISTRATION**

---

### S14 — `8ee65d81` | 2026-02-23 | 22 KB | 5 prompts | 59 tools | 251 min

**Tool-only hypothesis:** Edit (23) + Read (8) + TaskCreate (6) + Task (6) + TaskUpdate (6) + Write (6). Nearly equal mix of Task management and file editing. Hypothesis: structured knowledge capture with task decomposition — likely creating a new brain area with multiple documents.

**Actual goal:** Capturing a brain dump about homelab/self-hosted infrastructure concepts (Open WebUI+Ollama, Coolify, Graffiti memory system, Jellyfish vector storage, Tailscale, Cloudflare). The same content was pasted 3 times consecutively as the first 3 prompts (repeated paste — likely clipboard/paste issue), then David asked for it to be structured and written to the agentic-os brain.

**Tool-only guess: CORRECT.** The Task+Edit+Write combo is classic structured knowledge ingestion.

**First 3 prompts (all identical):**

1. "Open WebUI + Ollama (similar to chat GPT but for Ollama Models - Local Chat UI)..."
2. (Same content)
3. (Same content)

**Key observations:**

- The triple-paste of identical content is distinctive — likely David pasted the same notes 3 times by accident (or the input system re-sent)
- Prompt 4: "update agentic-os with the high priority items" — terse, direct
- Prompt 5: "update the INDEX.md with the new files and action items" — maintenance operation
- No Bash, no web — entirely write-oriented
- Not voice-transcribed based on the structured formatting of the pasted content
- The subject matter (homelab infrastructure notes) suggests this was captured from an external source (notes app, video notes, meeting notes)
- 251 min for 5 prompts — long gaps between each
- **Subtype: BRAIN DUMP INGESTION** — structured notes converted to brain files

---

### S15 — `4f494a9c` | 2026-03-05 | 15 KB | 9 prompts | 47 tools | 54 min

**Tool-only hypothesis:** Bash (18) + Read (8) + Grep (7) + TaskOutput (4) + ToolSearch (3) + Glob (2) + Edit (2) + TaskGet (2) + TaskList (1). Grep-heavy search + TaskOutput watching = someone monitoring an ongoing task's output. Hypothesis: installed something via Ansible/Bash, now monitoring its progress.

**Actual goal:** Checking whether Whisper AI (mlx-whisper) was registered in Ansible, finding it was missing, adding it, then running the Ansible playbook against the M4 Mini and watching it install. The session ends with David waiting for an unexpectedly long installation.

**Tool-only guess: CORRECT.** TaskOutput (4) calls specifically indicate polling a background task's output stream — Claude was watching a running process.

**First 3 prompts:**

1. "Do we have WHISPER_AI installation registered in Ansible or the Agentic OS?"
2. "Now I am talking about Wispr purely from just turning videos and images into videos and audios into transcripts on my computer. Just a command line version of it."
3. "From a playbook point of view, why did it not get run using Ansible?"

**Key observations:**

- The TaskOutput cluster (4 calls) is a clear signal that Claude was monitoring a running background process
- Voice artifacts: "wispr" for "whisper" — consistent with how David pronounces it
- Emotional register shifts: patient inquiry (prompts 1–5) → frustration (prompt 8: "I've been waiting half an hour. This should have taken, seriously, something like 10 seconds") → anxious (prompt 9: "Are we still in that really expensive installation process?")
- The session likely ended because the installation hung or David gave up waiting
- Grep (7) = searching Ansible files for the relevant configuration
- **Subtype: ANSIBLE TOOL INSTALLATION** — find, add, run, wait

---

### S16 — `339a580a` | 2026-02-15 | 12 KB | 3 prompts | 39 tools | 12 min

**Tool-only hypothesis:** Read (15) + Task (5) + Bash (5) + pw.navigate (4) + Glob (3) + pw.take_screenshot (3) + TaskUpdate (2) + Write (1) + TaskCreate (1). Playwright screenshots + Task management + Read. Hypothesis: visual audit of something — possibly screenshots of a web page or generated slides.

**Actual goal:** Comparing slide deck styling between AppyStack and BMAD POEM slides, identifying the styling gap, then reading raw input files to understand slide content, and finally building the slide decks.

**Tool-only guess: MOSTLY CORRECT.** The Playwright screenshots are indeed visual auditing of slide output. The Task system tracks the build pipeline.

**First 3 prompts:**

1. "We just recently did slides based on AppyStack... you'll notice that we don't have as good a quality styling in AppyStack as we do in BMADPOEM - We don't need to fix it, but I need you to identify, in a background agent, why and where we differ..."
2. "@/Users/davidcruwys/dev/ad/apps/appystack/raw2.txt — I need you to do a deep look into this file."
3. "Okay, let's build the slide decks."

**Key observations:**

- Prompt 2 uses the `@` file reference syntax — David is passing a file by reference rather than pasting content
- This is a very fast session (12 min, 3 prompts) — David had a clear plan from the start
- The pw.navigate+pw.take_screenshot combo is visual verification of output
- The Task(5) calls appear to be managing a multi-step slide generation pipeline
- **Subtype: CONTENT PRODUCTION — SLIDE DECK GENERATION**

---

### S17 — `c4c30dc9` | 2026-02-28 | 9 KB | 2 prompts | 16 tools | 10 min

**Tool-only hypothesis:** Read (6) + Glob (5) + Edit (4) + Write (1). Short session, no Bash, no web. Hypothesis: small documentation update or structural note filing.

**Actual goal:** Clarifying where "heartbeat.md" conceptual content should live in the brain, then updating the relevant brain files to incorporate it.

**Tool-only guess: CORRECT.** Read+Glob+Edit is a simple "find the right file, understand context, make the edit" pattern.

**First 2 prompts:**

1. "where would this info go? what is a heartbeat.md and how does it relate to cron jobs both technically but also other ways..."
2. "make all changes you think important"

**Key observations:**

- Prompt 1 contains a pasted Claude response from a previous session ("⏺ They're related but different things...") — David is carrying context forward
- Prompt 2 is "make all changes you think important" — maximum autonomy delegation, David trusting Claude's judgement entirely
- 16 tools in 10 min = fast, focused execution
- **Subtype: QUICK BRAIN UPDATE / MICRO-SESSION**

---

### S18 — `41762dc8` | 2026-02-20 | 6 KB | 6 prompts | 12 tools | 11 min

**Tool-only hypothesis:** Bash (7) + Read (2) + Glob (2) + Skill (1). Small session, Skill invocation early. Hypothesis: setting up a new skill or tool, running install commands.

**Actual goal:** Installing the Vercel (Playwright) browser skill. David asked how to install it, Claude looked up the skill, tried to run it, then David was asking about why the other conversation window didn't know about it.

**Tool-only guess: CORRECT.** Skill(1)+Bash(7) is precisely the "invoke skill, run install commands" pattern.

**First 3 prompts:**

1. "Here. how do we install the vercel agent browseer" (voice: "browseer" for "browser")
2. "can you get it working for me please?"
3. "why does my other convo, not know about it?"

**Key observations:**

- "vercel agent browseer" — classic voice transcription: "browser" → "browseer", "Playwright" → "vercel" (contextual association error)
- Prompt 3 is a genuine conceptual question about Claude Code's session isolation
- "doesn't work?" + pasted terminal output in prompt 5 — debugging pattern
- "how come it is taking so long?" — final prompt suggests it hung
- Not voice-transcribed overall despite errors — these look like fast-typed typos
- **Subtype: TOOL INSTALLATION / TROUBLESHOOTING**

---

### S19 — `afc2e110` | 2026-03-01 | 4 KB | 3 prompts | 12 tools | 2 min

**Tool-only hypothesis:** Grep (6) + Bash (3) + Agent (2) + Glob (1). Grep-heavy + Agent. Hypothesis: searching for information about a specific feature, possibly documentation lookup.

**Actual goal:** David was confused about Claude Code's "remote control" and "remote env" features. He'd seen them mentioned, tried `/remote-control`, got an error, and pasted the error output.

**Tool-only guess: PARTIALLY CORRECT.** Grep is indeed documentation search. The Agent (2) calls suggest Claude tried to look up the feature across multiple knowledge sources.

**First 3 prompts:**

1. "what does remote contorl and remote env do and how do I use them"
2. "why does everyone in chiang mai seem to havet his but when I do /remote-control there is nothing"
3. Pasted terminal error: "Error: Remote Control is not yet enabled for your account."

**Key observations:**

- "remote contorl" — fast-typed or voice typo
- "why does everyone in chiang mai seem to have this" — David attended an AI event in Chiang Mai where someone demoed this feature
- The answer is in the pasted error: the feature wasn't enabled on his account yet
- 2-minute session, session effectively over once the error was identified
- **Subtype: FEATURE DISCOVERY / DEAD-END** — quick lookup, unanswerable with current account state

---

## Patterns Section

### 1. Voice Transcription Is Near-Universal

16 of 19 sessions (84%) show voice transcription artifacts. The 3 without clear artifacts (8ee65d81, 41762dc8, afc2e110) are notable exceptions — they use structured pasted content or fast-typed short messages.

**Recognisable voice artifact signatures:**

- Repeated-start restarts: "If I give you access to If I give you access to"
- Phonetic spelling: "struction fure" (structure), "agentyic-os" (agentic-os), "broweer" (browser), "wispr" (whisper), "contorl" (control)
- Filler words in prompts: "yeah", "okay so", "I mean", "I think"
- Incomplete sentences: prompts that end mid-thought
- Self-corrections: "oxnfrith.com — sorry, https://0xnfrith.com"
- Hedge phrases: "something like that", "or that", "I don't know"

**Implication for AngelEye:** Voice-transcribed prompts carry higher intent signal but lower precision. They should be parsed with tolerance for OCR-like errors, and the first recognised concept (even if misspelled) is usually the key topic.

---

### 2. File Size Does NOT Predict Tool Activity

Session e19c5d71 is 64 KB with 0 tools. Session 4e3b83f7 is 109 KB with 107 tools. File size reflects Claude's response verbosity as much as work done. The more useful predictors of real work are: tool count, Edit count, Write count, and the presence of Bash.

**Better activity signal:** `tool_count > 20 AND (edit_count + write_count) > 3`

---

### 3. Session Duration Is Unreliable as an Activity Measure

Sessions of 700-1400 minutes (dc408618, 2efc01af, 4e3b83f7, 9d63797d) are not 12-hour working sessions. They are sessions left open while David did other things, worked on other projects, or slept. True work duration is better estimated by:

- Timestamp clustering (gaps > 30 min likely indicate breaks)
- Prompt count / tool count ratio
- Absolute tool count and edit/write operations

---

### 4. Context Handover Injections Are Common and Identifiable

7 of 19 sessions contain at least one "This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion..." injection. These are NOT user prompts — they are Claude Code's automatic handover mechanism.

**Identification pattern:** Prompt text starts with "This session is being continued" and is 200+ characters (the injected summary). These should be excluded from prompt-count calculations and intent analysis.

**Affected sessions:** 2ed25517 (8 injections), 59c2d164 (2), 8e8dac5b (2), 2efc01af (1), 9d63797d (1), 77764bc1 (1)

---

### 5. Closing Ceremony Pattern

At least 4 sessions end with explicit session-closing prompts:

- "Can you just look at all the decisions, topics, anything that we were talking about in this conversation? Just list them all out for me so I can review them before closing down this conversation." (dc408618)
- "Have we done everything we wanted to do in this conversation? Can I close it off now?" (d3a8db00)
- "Can I close it off now?" / "Yes, do that please... If you need to do any commits and pushes, you should do that as well." (d3a8db00)
- "Was there anything else outstanding in this conversation?" (59c2d164)

This is a **recognisable end-of-session ritual** that occurs in focused implementation sessions. It signals the session is complete. Sessions that end with "continue" or mid-task prompts are likely abandoned rather than finished.

---

### 6. The Knowledge Audit Loop Pattern

At least 3 sessions (2ed25517, 9d63797d, 84e401ee implicitly) contain what we can call the **knowledge audit loop**: David opens a fresh Claude window, asks a question, pastes the response back into the working session, then evaluates whether the brain gave the right answer.

This is David testing the "surface area" of his knowledge system — checking if what he built is discoverable. This is a sophisticated meta-behaviour unique to the brains project. No other project type in this dataset shows it.

**Signature:** Prompts containing "I'm going to give you a conversation from another window" or "The responses from each clean Claude instance" followed by pasted CLI banners and Claude responses.

---

### 7. Six Distinct Session Subtypes in the Brains Project

Based on the 19 sessions analysed:

| Subtype                                      | Count | Signature Tools                                 | Example Session                        |
| -------------------------------------------- | ----- | ----------------------------------------------- | -------------------------------------- |
| **Research Expedition + Content Ingestion**  | 2     | Agent, Playwright, brave.web_search, Write      | 2ed25517, 8e8dac5b                     |
| **Live Infrastructure Debugging**            | 3     | Bash (50+), Edit, Read — no web                 | 84e401ee, 4f494a9c, d3a8db00           |
| **Brain Maintenance / Librarian Flow**       | 3     | Edit, Read, Bash, TaskUpdate — no web, no agent | 4e3b83f7, 77764bc1, c4c30dc9           |
| **System Audit + Cross-Project Maintenance** | 3     | Agent, Bash, Read, Write, Glob                  | 2efc01af, 9d63797d, 580c428a           |
| **Knowledge Authoring / Pattern Design**     | 2     | Edit, Read, Skill, Write — minimal Bash         | dc408618, 8ee65d81                     |
| **Quick Lookup / Dead-End / Micro-Session**  | 4     | Grep, Bash, Skill — small tool counts           | afc2e110, 41762dc8, e19c5d71, c4c30dc9 |
| **New Brain Setup / Event Ingestion**        | 1     | Write, WebFetch, Bash — no agents               | 5f57d757                               |
| **Content Production**                       | 1     | Playwright screenshots, Task, Read              | 339a580a                               |

---

### 8. Tool-Only Classification: Accuracy Assessment

Across 19 sessions, tool-only classification was:

- **Fully correct:** 13 sessions
- **Mostly correct:** 3 sessions (correct category, missed nuance)
- **Partially correct:** 2 sessions (one dimension wrong)
- **Not applicable (no tools):** 1 session

**Overall: ~80% accurate for primary classification from tools alone.** The main failure mode is missing the conversational meta-layer — tool sequences cannot reveal when David is doing orientation/context-setting vs actual execution, or when he's frustrated vs approving.

**Most reliable tool-only signals:**

- Playwright (pw.\*) → web automation, scraping, or visual audit
- pw.run_code + Agent → bulk automated content extraction
- Bash (50+) + no web → live system/Ansible work
- Edit + Read + Task system + no Bash → structured knowledge authoring
- Grep-heavy + small session → lookup/discovery
- 0 tools → pure ideation, no execution

---

### 9. The "Yes" Approval Pattern

Session 4e3b83f7 has 8 consecutive single-word "yes" prompts. This extreme approval-loop behaviour appears when:

1. David is in flow state and trusts Claude's direction
2. Claude is presenting proposed changes one at a time
3. David is dictating and wants minimal friction

The "yes" chain is NOT disengagement — it's high-trust execution. It typically appears mid-session after an orientation phase, and the prompts surrounding the "yes" cluster are always substantive.

**Implication:** When prompt_length is consistently < 5 chars for 5+ prompts, the session is in execution mode, not ideation mode.

---

### 10. The Commit-Push Ritual

"push it", "commit this", "commit and push" appear in at least 6 of 19 sessions. This is the standard session checkpoint — David uses it to mark a stable state before a topic shift, before leaving, or at the end of a session. Sessions without it are either:

- Knowledge-only (no git-tracked changes)
- Abandoned before completion
- Read-only/exploratory

**"push it" as a phase boundary marker:** It almost always appears at the end of a discrete unit of work, not mid-flow. Identifying commit events in the tool sequence (Bash commands containing `git push`) would be a reliable session phase boundary signal.

---

### 11. The Brains Project vs Other Projects

Based on these 19 sessions, the brains project has a distinctive character:

- **Higher voice transcription rate** than expected for technical work — David thinks out loud, speaks naturally, trusts the transcription
- **Lower task completion rate** — sessions are frequently abandoned, context runs out, topics drift
- **More meta-behaviour** — the knowledge audit loop, closing ceremonies, and context-orientation prompts are unique to this project
- **Longer average session duration** — the brains project is where David parks long-running ambient work sessions, not the sharp focused sprints that characterise app development
- **More context handovers** — brains work is the most context-heavy, since it depends on knowing the whole system

The brains project is David's "thinking environment" — the place where he processes, organises, and externalises his knowledge system. Sessions here are more exploratory, more conversational, and more likely to drift than sessions in app-specific projects.

---

_End of Batch 1 analysis. Total sessions analysed: 19. Coverage: ~8% of qualifying brains sessions._
