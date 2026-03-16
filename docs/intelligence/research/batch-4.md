# Batch 4 — Session Pattern Research

**Focus:** Minor/less common projects — flihub, v-appydave, deckhand, poem-os, klueless, voz, brain-dynamous, lars, thumbrack, flivoice, agent-os, kgems

**Date analysed:** 2026-03-15
**Sessions:** 20 (medium-sized JSONL, 5KB–30KB)
**Session date range:** 2026-01-29 to 2026-03-12

---

## Session Index

| #   | Session ID | Project        | Date       | Duration | Prompts | Tools | Events |
| --- | ---------- | -------------- | ---------- | -------- | ------- | ----- | ------ |
| 01  | e726cab1   | poem-os        | 2026-02-17 | 17m      | 6       | 16    | 22     |
| 02  | 7115c088   | voz            | 2026-02-18 | 1.6h     | 2       | 18    | 20     |
| 03  | 2e0518ac   | flihub         | 2026-03-09 | 3.3h     | 1       | 19    | 20     |
| 04  | ce19a727   | flihub         | 2026-02-15 | 23.6h    | 6       | 8     | 14     |
| 05  | dc3ef96a   | v-appydave     | 2026-02-23 | 1.1d     | 6       | 17    | 23     |
| 06  | c67c4aac   | v-appydave     | 2026-02-24 | 19.6h    | 2       | 29    | 31     |
| 07  | 144ccb81   | kgems          | 2026-02-24 | 8m       | 3       | 23    | 26     |
| 08  | 2ae4ea98   | brain-dynamous | 2026-02-28 | 51m      | 9       | 7     | 16     |
| 09  | b0215876   | thumbrack      | 2026-03-08 | 4m       | 4       | 21    | 25     |
| 10  | 86ad9f30   | deckhand       | 2026-03-11 | 12m      | 1       | 55    | 56     |
| 11  | fd6cb997   | voz            | 2026-03-03 | 8m       | 2       | 24    | 26     |
| 12  | 0bd1e0d7   | flivoice       | 2026-02-18 | 3m       | 2       | 7     | 9      |
| 13  | 5d25755b   | agent-os       | 2026-02-22 | 14m      | 6       | 11    | 17     |
| 14  | a1ebdd28   | lars           | 2026-03-05 | 14.0h    | 4       | 37    | 41     |
| 15  | 0248f3ad   | klueless       | 2026-01-29 | 21.5d    | 17      | 87    | 104    |
| 16  | 6305b5a1   | flihub         | 2026-02-19 | 51m      | 1       | 40    | 41     |
| 17  | 3aa4e5aa   | flihub         | 2026-03-12 | 32m      | 5       | 35    | 40     |
| 18  | dd804b93   | voz            | 2026-02-16 | 34m      | 6       | 33    | 39     |
| 19  | eea00425   | v-appydave     | 2026-02-16 | 35m      | 8       | 38    | 46     |
| 20  | 1af0ff41   | deckhand       | 2026-03-11 | 3.1h     | 7       | 114   | 121    |

---

## Per-Session Analysis

---

### Session 01 — poem-os: Architectural Design Discussion

**ID:** e726cab1 | **Project:** poem-os | **Date:** 2026-02-17 | **Duration:** 17m | **Prompts:** 6 (avg 116c)

**First 3 prompts:**

- P1: `"We have a triage and a quick fix system. Whenever we're using them, do we ever consider the need for Lisa the librarian, either for revealing patterns of learning or persisting patterns of learning? If not, why not, and where? If the why is that it's legit, that's fine, but I want to understand why we're not doing it."` [320c]
- P2: `"Okay, maybe I said it all wrong. My point is that if triage generally leads to something getting fixed, it could be a quick fix. Well, there's other stuff that gets fixed now. Anytime you fix something, you want to at least be reading the KDD to make sure you're fixing it with the right patterns, don't you?"` [309c]
- P3: `"yes, show me where to inject it"` [31c]

**Tool sequence:** Task → Grep, Grep, Grep → Read, Read → Edit, Edit, Edit, Edit, Edit, Edit → Bash, Bash, Bash, Bash

**Voice-transcribed:** Borderline. Phrases like "Okay, maybe I said it all wrong" and informal structure suggest voice, but overall composition is careful and conceptual. Likely typed.

**Session feel:** Complete. Ends with `commit this` and `push it`.

**What human was doing:** Designing the poem-os knowledge system. Questioning whether the "Lisa the librarian" pattern (knowledge pattern detection/persistence) is being invoked during triage/quick-fix workflows. After discussion, decided to inject it. Classic architecture review → specific injection decision → implement → commit.

**Phase shift:** Conceptual debate (P1-P2) → surgical implementation (P3-P4: "yes, show me", "yes, make those edits") → housekeeping (commit/push).

**Tool-only classification guess:** Read/Grep heavy + Edit burst + Bash cleanup → "feature implementation in existing system." Actual: architectural design discussion that leads to implementation. **Partially right** — tools suggested implementation but missed the design discussion phase.

**Unusual:** `Task` as first tool (the agent delegates immediately, suggesting a complex multi-file investigation). In a 17-minute session, the Task call signals an agentic sub-process before the user has said much.

---

### Session 02 — voz: Git Tutorial Documentation

**ID:** 7115c088 | **Project:** voz (client — Vasilios/Jan) | **Date:** 2026-02-18 | **Duration:** 1.6h | **Prompts:** 2 (avg 584c)

**First 3 prompts:**

- P1: `"https://www.loom.com/share/a0095dc3815c48ae9210fce6bcd715e4\n\nUnderstanding Git Workflow: A Beginner's Guide..."` [1158c] — a full Loom transcript paste
- P2: `"sent email"` [10c]

**Tool sequence:** Read×6 → Edit → Write → Read×2 → Edit×3 → Bash×5

**Voice-transcribed:** P1 is a Loom video transcript (likely auto-generated captions with emoji). P2 is pure status update.

**Session feel:** Complete. "sent email" is the terminal confirmation event.

**What human was doing:** Processing a Loom recording of a Git tutorial made for clients Vos and Jan. The full transcript was pasted into Claude, which then read existing communication templates, created new documentation from the transcript content, and the session closed with David confirming he sent the email. Classic "process this Loom and generate client artifact" pattern.

**Phase shift:** Single mega-prompt (transcript dump + task) → Claude does all the work → David confirms with two-word status update.

**Tool-only classification guess:** Multi-Read then Edit/Write then Bash → "updating existing documentation from research." Actual: Loom transcript processing into client deliverable. **Partially right** — tools captured the shape but not the trigger (Loom transcript → client communication).

**Unusual:** The 1.6h clock duration for a 2-prompt session. Most of that time was likely David recording/editing/sending the Loom, then Claude processing it. Claude's wall-clock time was maybe 5 minutes of actual work.

**Emotional register:** Functional. No emotion in P1 (it's a transcript). P2 "sent email" is casual confirmation, slightly satisfied.

---

### Session 03 — flihub: Transcript Architecture Correction

**ID:** 2e0518ac | **Project:** flihub | **Date:** 2026-03-09 | **Duration:** 3.3h | **Prompts:** 1 (avg 1178c)

**First 3 prompts:**

- P1: `"Just a question about the change you just made for me of combining all the transcript files together. I just realised that if we had a proper transcript file somewhere, we shouldn't have done this. I'm just going to give you an example..."` [1178c]

**Tool sequence:** Grep×3 → Read×4 → Edit×11 → Read (19 tools, all in one prompt response)

**Voice-transcribed:** No. Carefully composed, contains structured data (file listings with sizes).

**Session feel:** Appears complete — the single prompt triggered a full autonomous implementation. But without a confirming "done" from the user, there's no explicit closure.

**What human was doing:** Catching a premature architectural decision (transcript files were combined when they should have stayed separate). David wrote a detailed corrective specification with examples, and Claude executed a full file restructuring. All 19 tool uses came from a single prompt.

**Phase shift:** None — single prompt, single long execution chain.

**Tool-only classification guess:** Grep-first (investigation) → Read cluster → heavy Edit burst → Read → "code refactoring based on discovery." Actual: architectural correction after user spotted an error. **Right in shape, wrong in cause.** Tool sequence alone can't reveal "user spotted a mistake in prior session's work."

**Unusual:** Single prompt, 3.3h session clock. The clock suggests David walked away after sending the prompt. This is the "fire and forget" pattern — he knew it would take a while, left, came back.

---

### Session 04 — flihub: Long-Gap Knowledge Accumulation

**ID:** ce19a727 | **Project:** flihub | **Date:** 2026-02-15 | **Duration:** 23.6h | **Prompts:** 6 (avg 525c)

**First 3 prompts:**

- P1: `"Going to be throwing stuff at you. If you think it relates to anything that we've already got, then update them. Otherwise, you can put in new, Now it's just a simple question. Do we have a copy button somewhere to get the words that go into GLING..."` [304c]
- P2: `"What's the difference between edit first, edit second, edit final and what I actually share with Jan in the S3 bucket?"` [119c]
- P3: `"I don't understand the point at a second. What was the scenario where I really needed help?"` [92c]

**Tool sequence:** Task×8 (all tools are Task calls)

**Voice-transcribed:** Yes. "Going to be throwing stuff at you" — no subject. Informal, stream-of-consciousness. P4 and P5 are very detailed with structured requirements (UI buttons, folder behaviours).

**Session feel:** Incomplete/exploratory. No commit at end. The 23.6h clock indicates this session was opened in the morning and revisited across a full day.

**What human was doing:** A "brain dump" session about flihub's workflow — the S3 staging pipeline, Gling integration, how files move between edit stages. Every prompt goes to Task (background agents), suggesting Claude is delegating investigations across multiple files. David is clarifying his own mental model of the system by asking questions out loud, then progressively tightening the requirements.

**Phase shift:** Clarification questions (P1-P3) → detailed UI specification (P4-P5) → meta-reflection ("how did we actually use the DAM?") (P6). The session starts fuzzy and ends with domain-level retrospective.

**Tool-only classification guess:** All-Task sequence → "high-level planning, complex multi-file investigation, or skills invocation." Actual: knowledge accumulation + UI specification via voice-style prompts. **Partially right** — Task-heavy sessions do indicate broad investigation, but "all Task" with varied prompts is unusual.

**Unusual:** Eight consecutive Task calls, zero non-Task tools. This means every response from Claude spawned a sub-agent. The session is unusually "fat" at the agent-invocation level — it's a multi-agent session masquerading as a single session.

---

### Session 05 — v-appydave: Git Hygiene + Vulnerability Cleanup

**ID:** dc3ef96a | **Project:** v-appydave (video project repo) | **Date:** 2026-02-23 | **Duration:** 1.1 days | **Prompts:** 6 (avg 246c)

**First 3 prompts:**

- P1: [747c] — raw `git status` output pasted directly (no explanation, just the diff)
- P2: `"yes, delete them both, And then what I want you to do is Commit and push the rest of the files in this directory."` [114c]
- P3: `"Yeah, you're right. There are MP4 files. The stuff in Shadow recordings is okay. What about the other MP4 files? Are they getting ignored currently? I'm talking about edit first and S3 staging prep."` [198c]

**Tool sequence:** Bash → Read → Bash → Skill → Bash×13

**Voice-transcribed:** Yes. P2: "And then what I want you to do" (conjunction start). P3: colloquial, verbal confirmation style. P4 refers to .gitignore with "chance" likely meaning "change" (voice error).

**Session feel:** Partially complete — ends at "delete the package-lock.json from the archived b54 project" with no confirming commit.

**What human was doing:** Git cleanup of v-appydave video project repo. Started by pasting git status output (prompt-as-terminal-paste pattern). Worked through: delete Obsidian config files, commit/push, navigate MP4 gitignore rules, check GitHub vulnerabilities, final cleanup of archived project.

**Phase shift:** Triage (what's dirty?) → delete/commit decisions → MP4/gitignore policy discussion → security (vulnerabilities) → final cleanup.

**Tool-only classification guess:** Bash-dominant with a Skill call → "scripting or ops task, possibly using a skill for context." Actual: git hygiene session with repo policy decisions. **Right.** Bash-dominant correctly predicted ops/scripting context.

**Unusual:** Skill called mid-session (position 4 of 17). Suggests David invoked a skill to surface project-specific rules mid-stream, rather than at session start. The `Skill` tool appearing late signals reactive context retrieval.

---

### Session 06 — v-appydave: YAML Schema Review

**ID:** c67c4aac | **Project:** v-appydave | **Date:** 2026-02-24 | **Duration:** 19.6h | **Prompts:** 2 (avg 160c)

**First 3 prompts:**

- P1: `"Can you have a look at the YAML prompts and schema files related to YouTube Launch Optimizer, plus, can you tell me: should any of the fields have been hinted to be text areas rather than text boxes?"` [200c]
- P2: `"What is the nature of this conversation? I think we have a skill that has helped me to tell you what's going on here."` [119c]

**Tool sequence:** Glob → Task → Read×27 → Skill

**Voice-transcribed:** No. Carefully phrased.

**Session feel:** Incomplete. P2 is David asking Claude to identify the conversation's context — suggesting he returned after a gap and needed re-orientation.

**What human was doing:** Reviewing YAML schema files for the YouTube Launch Optimizer tool. 27 consecutive Read calls (after a Task) means Claude systematically read every schema/prompt file in the project. The session ends with David asking what skill applies — suggesting he wanted Claude to load the right context to continue.

**Phase shift:** Task (exploration) → massive Read cluster → Skill load. This is orientation → investigation → re-orientation at session end.

**Tool-only classification guess:** Glob → Task → Read×27 → Skill → "deep codebase exploration, pulling in domain context at end." Actual: YAML schema review with session re-orientation at end. **Right.** The Read-27 burst is a signature of systematic file inventory, and the trailing Skill is context loading.

**Unusual:** 27 consecutive Read calls is the longest unbroken Read sequence seen in this batch. Also: P2 asking "what is the nature of this conversation?" is a session-identity query — David treating Claude as a session diary.

---

### Session 07 — kgems: npm Package Account Recovery

**ID:** 144ccb81 | **Project:** kgems (Ruby gem monorepo) | **Date:** 2026-02-24 | **Duration:** 8m | **Prompts:** 3 (avg 247c)

**First 3 prompts:**

- P1: `"Can you have a look through the stuff we've been doing with semantic versioning? I don't know whether I did a gem. You'll find it in my gems. I think I did an npm package. But I don't know what it was called. I don't know what email address I used. And I don't know what username I have. I suspect that the email address is david@ideasmen.com.au. I suspect that the username is klueless-io..."` [437c]
- P2: `"You say that the username is klueless-js. And that's what I'd use if I was signing humour."` [90c]
- P3: `"Okay, so I was just able to get a sign in to Klueless-io. I'm still trying to get a sign in to Klueless-js. Yes. I don't understand whether the Klueless JS is linked to my email account david@ideasmen.com.au or not."` [214c]

**Tool sequence:** Bash×10 → Read → Bash → Read → Bash → Read → Bash×4 → Read → Bash×3

**Voice-transcribed:** Yes. Heavy "I don't know" repetition, stream-of-consciousness uncertainty, verbal confirmation style in P2 and P3.

**Session feel:** Incomplete. The session is mid-investigation — David is actively trying credentials in the browser and reporting back.

**What human was doing:** Account recovery for an npm package published under an old/forgotten account. Claude is searching the kgems monorepo with Bash to find semantic versioning history. David is simultaneously trying credentials in the browser while Claude investigates the code. Interleaved: Claude-investigation and David-browser-action.

**Phase shift:** Discovery (what did I publish?) → identification (username) → verification (David tries login, reports back).

**Tool-only classification guess:** Bash-dominant with scattered Read → "running tests or build scripts, checking results." Actual: forensic account recovery — searching commit history and package configs for account info. **Wrong.** Bash-heavy in a gem monorepo reads like CI/testing; the actual purpose (account forensics) was not guessable from tools alone.

**Unusual:** The session captures a real-time human-Claude feedback loop where David is simultaneously acting in the browser and reporting results back. The prompts document live actions ("I was just able to get a sign in"). This is Claude as real-time assistant during an external task, not just a development partner.

---

### Session 08 — brain-dynamous: AWS Storage Research

**ID:** 2ae4ea98 | **Project:** brain-dynamous (knowledge brain) | **Date:** 2026-02-28 | **Duration:** 51m | **Prompts:** 9 (avg 328c)

**First 3 prompts:**

- P1: `"jb"` [2c] — likely a voice command artifact or misfire
- P2: `"I want you to look at Amazon Web Services. You know what S3 is. What's the system they have in place for longer term back ups that are cheaper but slower to resolve, and what are the competing products to it from other..."` [219c]
- P3: `"Can you make sure that the Glacier option. We have a little bit of information about the others, just in case there are use cases in which they're better used, put into the agentic operating system..."` [326c]

**Tool sequence:** Glob×2 → Write → Read → Edit → Bash → Grep

**Voice-transcribed:** Yes. "You know what S3 is" (verbal assumption). "Can you make sure that the Glacier option" (fragment, dropped words). "pisses that shit off" in P13 of another session — this user speaks casually to Claude.

**Session feel:** Incomplete by clock. The questions after P3 include David sharing an email from another "2nd brain" creator, then asking to integrate that knowledge. Session ends with "What is the Dynamous Branding Example?" — a new curiosity question, not a closing action.

**What human was doing:** Research and documentation task: investigating AWS Glacier vs. competitors for video archive backup, writing findings into the agentic OS brain. Then pivoting to process an incoming external message from another 2nd-brain practitioner (Cole). Final question is a tangent — curiosity, not task.

**Phase shift:** Research question → specific document update → delete/correct a file → broader orientation ("keep yourself up to date") → external message processing → random curiosity question.

**Tool-only classification guess:** Glob → Write → Read → Edit → Bash → Grep → "initialising or scaffolding, then searching for patterns." Actual: knowledge research and brain file updating. **Wrong.** Low tool count (7) with Write-first after Glob suggests document creation, which is directionally correct, but the purpose (AWS research) was invisible.

**Unusual:** P1 is `"jb"` — two characters. Almost certainly a voice command misfire or accidental send. This is the shortest prompt observed in the batch. Also unusual: this session is in `brain-dynamous`, a personal knowledge brain directory, not a code project. The work pattern here is closer to note-taking than engineering.

---

### Session 09 — thumbrack: CLI Tool Git Setup Fix

**ID:** b0215876 | **Project:** thumbrack (AppyStack app) | **Date:** 2026-03-08 | **Duration:** 4m | **Prompts:** 4 (avg 523c)

**First 3 prompts:**

- P1: [1774c] — a large paste that includes Claude's previous response plus "I've just manually created a Git for you, but I think we need to run through this and maybe even push it up to..." This is a cross-session paste — David is carrying forward context from a prior conversation.
- P2: `"They're the main things that make sense, of course. No, it should be using @node_modules/@appydave/ Thumbrack is fine. Do the things that you meant to do. The recommendations."` [179c]
- P3: `"Expecting to see it on my repository. I can't see it yet."` [57c]

**Tool sequence:** Read → Bash×5 → Read → Bash → Glob → Bash → Read → Write → Bash×11

**Voice-transcribed:** No. Typed, but P2 has dropped words suggesting mild voice influence.

**Session feel:** Incomplete. P4 raises a question about org placement ("Why did you put it under klueless-io?") — a correction, not a closure.

**What human was doing:** Fixing the AppyStack CLI scaffolding: the `create-appystack` CLI was not adding `git init` to scaffolded projects. David manually created git, then asked Claude to implement git init + initial commit in the CLI. Then hit a GitHub push issue (wrong org). 4 minutes of wall-clock time, 21 tool uses — high tool density.

**Phase shift:** Context paste (what happened before) → fix implementation → verify in GitHub → correction.

**Tool-only classification guess:** Read → Bash-heavy → Write → Bash → "setup/configuration task, possibly initialisation." Actual: CLI scaffolding bug fix + GitHub push. **Right.** Bash-heavy with a Write is consistent with implementation + verification.

**Unusual:** P1 is a cross-session context paste — David pasted Claude's previous response into a new session. This is a manual session-continuity hack, revealing the absence of automatic session resumption. The paste contains both David's words and Claude's response interleaved.

---

### Session 10 — deckhand: Playwright-Driven UI Styling

**ID:** 86ad9f30 | **Project:** deckhand (presentation app) | **Date:** 2026-03-11 | **Duration:** 12m | **Prompts:** 1 (avg 958c)

**First 3 prompts:**

- P1: `"Can you use the Playwright MCP to open up the application? It's already running at this location. http://localhost:5030/ Have a look at the screen. You might also want to check whether we've already done some information recently... but we're just checking for usability, style, and design."` [958c]

**Tool sequence:** Read → Bash → ToolSearch → navigate → screenshot → Read×6 → Edit×14 → navigate → screenshot → Edit → navigate → screenshot → Edit×5 → navigate → screenshot → Edit×2 → navigate → screenshot → Edit×4 → navigate → screenshot → Edit×5 → navigate → screenshot → Bash

**Voice-transcribed:** No. Single careful prompt with structured intent.

**Session feel:** Complete — the Bash at the end is a likely build/test step. The iterate-edit-screenshot cycle terminates cleanly.

**What human was doing:** Visual UI iteration using Playwright as eyes. Single prompt triggers a full autonomous UI styling loop: Claude opens the app, screenshots it, makes CSS edits, re-navigates, screenshots again, edits again — 7 screenshot checkpoints total across a 55-tool session. No further prompts needed; David watched Claude work.

**Phase shift:** None — one prompt, one extended autonomous loop.

**Tool-only classification guess:** navigate → screenshot → Read×6 → Edit loop → Playwright loop → "visual UI development with browser testing." **Exactly right.** This is the most predictable session from tools alone.

**Unusual:** 55 tools from 1 prompt. The highest tool-to-prompt ratio in the batch. The navigate/screenshot/edit cycle (repeated 7 times) is a completely autonomous visual feedback loop. Also: `ToolSearch` appearing early (position 3) means Claude had to discover the Playwright tools at runtime, not knowing them upfront.

---

### Session 11 — voz: Client System Adaptation for New Client

**ID:** fd6cb997 | **Project:** voz (client) | **Date:** 2026-03-03 | **Duration:** 8m | **Prompts:** 2 (avg 592c)

**First 3 prompts:**

- P1: `"Do you understand, from a ClaudeMD point of view and potentially a skills point of view, though I don't know if we did that, the communication folder that I have with vOz? How I have it as a template, how I can create emails, how I can deal with looms. Do you have a clear understanding of all the files involved, and you're doing it from the point of view of what would happen if we had to adapt it..."` [470c]
- P2: `"Let's not go with such a greeting sign off as we do with vOz, so let's just keep it a little bit more professional... The package, by the way, for Lars is $5,000 US dollars. I don't want to see any emails going out about invoices for Lars unless I say so..."` [715c]

**Tool sequence:** Read → Glob → Read×5 → Bash → Read×2 → TaskCreate → TaskUpdate → Write×9 → Read → Edit → TaskUpdate

**Voice-transcribed:** Yes. P1 "I don't know if we did that" and "though I don't know" — verbal hedging. P2 has financial details and brand instructions mixed in verbally.

**Session feel:** Incomplete. No commit. TaskCreate/TaskUpdate pattern suggests task tracking was set up but no final delivery closure.

**What human was doing:** Adapting the vOz client communication system (email templates, Loom handling, CLAUDE.md conventions) to a new client, Lars. 8 minutes, 24 tools. David described the vOz system then gave Lars-specific customisations: professional tone, $5K package, no invoice emails. Claude created 9 written files in one go (Write×9).

**Phase shift:** Context verification ("do you understand how vOz works?") → adaptation brief → mass file generation.

**Tool-only classification guess:** Read/Glob (exploration) → Bash → Write×9 → Edit → TaskUpdate → "documentation/content generation based on reading existing templates." **Right.** The Write-9 burst from 2 prompts correctly suggests template-based content generation.

**Unusual:** Write×9 in a row is the largest Write burst in this batch. Also: TaskCreate/TaskUpdate in what looks like a content generation session — task management tooling appearing in a communication workflow session, not a coding session.

---

### Session 12 — flivoice: Session Transcript Filing + New Requirements Doc

**ID:** 0bd1e0d7 | **Project:** flivoice | **Date:** 2026-02-18 | **Duration:** 3m | **Prompts:** 2 (avg 6308c)

**First 3 prompts:**

- P1: [12575c] — An enormous paste: the complete output of a prior Claude Code session, including the ASCII banner, every tool call result, Claude's responses. Framed with: `"did the following get documented and filed away correctly?"`
- P2: `"yes, write the new requirements document"` [40c]

**Tool sequence:** Bash×2 → Read×4 → Write

**Voice-transcribed:** P1 is a terminal paste, not voice. P2 is typed confirmation.

**Session feel:** Complete. Single execution decision, confirmed, document written.

**What human was doing:** Cross-session audit. David pasted the entire prior session transcript and asked Claude to verify documentation was done correctly — a meta-session that reviews a previous session's output. After verification, requested a new requirements document based on that session's content. 3 minutes, 7 tools, 12.6KB of input in one prompt.

**Phase shift:** Verification request → confirmation → write.

**Tool-only classification guess:** Bash → Read cluster → Write → "checking state then writing a document." **Right in form, but the cause is invisible.** Can't tell from tools that the purpose was session-audit (reviewing prior session's work).

**Unusual:** P1 at 12,575 characters is the second-largest single prompt in this batch (after agent-os at 12,924c). The human is using Claude as a filing clerk, pasting an entire terminal session and asking "did you save everything?" This is a trust-verification pattern — not trusting that prior-session documentation was complete.

---

### Session 13 — agent-os: Ansible Playbook Debugging

**ID:** 5d25755b | **Project:** agent-os/ansible | **Date:** 2026-02-22 | **Duration:** 14m | **Prompts:** 6 (avg 2233c)

**First 3 prompts:**

- P1: [12924c] — Full Ansible playbook run output pasted: `"does the m2 log look ok"` followed by the complete `ansible-m2-check` terminal output (PLAY, TASK, ok/changed/skipped lines etc.)
- P2: `"can you deal with this in ansible playbook? [deprecation warning text]"` [263c]
- P3: `"why are 26\n\nResult: ok=21, changed=0, unreachable=0, failed=0, skipped=26"` [74c]

**Tool sequence:** Read → Edit×2 → Bash → Read → Edit×2 → Skill → Bash×3

**Voice-transcribed:** P2 has "ansibple" — a typo suggesting either voice ("ansible" misrecognised) or rushed typing. P3 is incomplete sentence (dropped subject). P4 "why do a new alias, just have it by default" and P5 "can we run it with verbose" are voice-style.

**Session feel:** Complete. Ends with `commit this`.

**What human was doing:** Reviewing an Ansible playbook run on mac-mini-m2. Pattern: paste huge log, ask "is this okay?" → Claude identifies issues → David pastes specific warnings/results → iterative fix. The Skill call mid-session loads ansible-specific context. Ends with committing the fixed playbook.

**Phase shift:** Log review (is it ok?) → specific deprecation fix → understand skip count → verbose logging → alias simplification → commit.

**Tool-only classification guess:** Read → Edit → Bash → Skill → Bash → "incremental code fix with context loading." **Right.** Ansible config editing + Bash testing is correctly predicted.

**Unusual:** P1 at 12,924 characters — full Ansible log paste. This is the largest single prompt in the batch. The human treats Claude as a log analyser, piping raw infrastructure output for interpretation. This is a DevOps/SRE usage pattern not seen in the coding sessions.

---

### Session 14 — lars: Client Email Management

**ID:** a1ebdd28 | **Project:** lars (client) | **Date:** 2026-03-05 | **Duration:** 14h | **Prompts:** 4 (avg 720c)

**First 3 prompts:**

- P1: [2527c] — Raw email thread paste. Starts: `"I'm in Bangkok. This is information about LAS. I don't know what CET stands for."` Followed by pasted Lars email thread (Danish content, scheduling discussion, GitHub credentials).
- P2: `"Boom! There were two of them. I gave you two."` [46c] — David pasted two emails but the system only processed one; he's correcting Claude.
- P3: `"The email. Delivered the email. Can you move the email that we've set up to the history or archive, whatever we call it, and we can do whatever we do with pending looms? Any Claude Code instructions or any lessons learnt? Make sure that they're in place as well."` [263c]

**Tool sequence:** ToolSearch → Glob×2 → Read×4 → Glob×4 → Read×4 → Glob×2 → Read×4 → ToolSearch → Edit → Write×2 → Edit → Read×2 → Glob → Read → Edit×2 → Write → Edit×2 → Write → Edit → ToolSearch → Bash → Write → Bash×3

**Voice-transcribed:** P1 "I don't know what CET stands for" — pure spoken-aloud uncertainty. P2 "Boom! There were two of them" — excited exclamation. P3 mixed written/verbal. Confirmed voice for P1-P2.

**Session feel:** Complete. P4: `"Commit, push, and then exit the conversation"` — explicit session closure with git action.

**What human was doing:** Email CRM session for Lars (Danish client). David pasted a scheduling email thread, Claude extracted scheduling preferences, David confirmed there were two emails, Claude archived and filed them, maintained lessons-learned documentation, committed. The `ToolSearch` calls (×3) suggest Claude was searching for tools to handle email/calendar tasks it didn't have native support for.

**Phase shift:** Email processing → draft response → verify/correct → archive → commit → explicit exit.

**Tool-only classification guess:** ToolSearch → Glob/Read research cluster → Edit/Write generation → Bash finalization → "setting up tooling, then creating structured documents, then deploying." **Partially right.** ToolSearch at start does suggest capability discovery. The heavy Glob/Read cluster was codebase-exploration-style file orientation. Write bursts match document generation.

**Unusual:** `"Commit, push, and then exit the conversation"` — the only session in the batch with an explicit exit command. David is treating this as a session lifecycle command, not just a git command. Also: ToolSearch×3 in a non-coding session — Claude looking for tools (Loom? email?) that it can't find, in a client communication workflow.

---

### Session 15 — klueless: Multi-Week Project Reorientation + GitHub Setup

**ID:** 0248f3ad | **Project:** klueless | **Date:** 2026-01-29 | **Duration:** 21.5 days | **Prompts:** 17 (avg 207c)

**First 3 prompts:**

- P1: `"How good is the index file of this application of ClaudeMD file? Clueless is well documented and is it all about coding or is it all about documentation? Documentation is more important to me but knowing where the code is is important. I don't know whether there is documentation for clueless like details..."` [340c]
- P2: `"Okay, please do the recommendations. And after you do that, I want you to come up with a research task. We're looking for projects that already do something similar..."` [351c]
- P3: `"I haven't looked at this project for months. What were we talking about?"` [72c]

**Tool sequence:** Glob×3 → Bash×5 → Read → Bash → Read → Bash → Read → Read×4 → Bash×8 → Read → Bash×8 → Write → AskUserQuestion → Task×4 → Write×3 → Task → Write×3 → Task → Bash×2 → Read → Write×2 → Bash → Edit→ Edit → Task → Write → Skill → Bash×22 → Write → Bash→ Edit →Edit → Task → Write → Bash×9 → Task → Bash

**Voice-transcribed:** Yes. Strong voice indicators throughout: "I don't know whether," "I haven't looked at this project for months," "go ahead," "make sure that" patterns.

**Session feel:** Complete. Ends with GitHub push command.

**What human was doing:** Returning to an abandoned project (hadn't looked in months). P3: "I haven't looked at this project for months. What were we talking about?" — classic reorientation prompt. Session progresses through: assessment → documentation fixes → research task (find similar projects) → Toon/Klue DSL comparison → establish GitHub repos → push.

**Phase shift:** Project assessment → documentation fixes → external research → DSL architecture decision → GitHub setup → gitignore cleanup → push. Major trajectory: "catch me up" → "get this published."

**Tool-only classification guess:** Glob → Bash-heavy → Read/Write/Task mix → AskUserQuestion → Bash sprint → Write cluster → Skill → Bash marathon → "large investigation + scaffolding + deployment." **Right.** The longest and most complex session — the tool sequence accurately reflects a multi-phase session with research, implementation, and publication.

**Unusual:** `AskUserQuestion` — the only use of this tool in the entire batch. Claude asked David a clarifying question mid-session rather than making an assumption. Also: 21.5-day duration clock. This is impossible as a real continuous session — the timestamps span weeks, meaning this JSONL was somehow produced across multiple calendar sessions. This is an artifact of how the session IDs were assigned: the same session ID persisted across many return visits. Also: 17 prompts and 87 tool uses — the largest session by both metrics in the batch.

---

### Session 16 — flihub: "commit this" — Autonomous Commit

**ID:** 6305b5a1 | **Project:** flihub | **Date:** 2026-02-19 | **Duration:** 51m | **Prompts:** 1 (avg 11c)

**First 3 prompts:**

- P1: `"commit this"` [11c]

**Tool sequence:** Read×3 → Glob×2 → Read×3 → Glob → Read → TaskCreate×3 → TaskUpdate → Write → TaskUpdate×2 → Write → TaskUpdate×2 → Edit×7 → Bash×2 → TaskUpdate → Edit → Grep×2 → Read → Edit → Grep → Read → Edit → Bash×2

**Voice-transcribed:** No (2 words).

**Session feel:** Complete (ends with Bash — likely git push).

**What human was doing:** Issued a 2-word instruction. Claude autonomously determined what needed to be committed: read the project, globbed for relevant files, created task tracking items, made edits, ran tests/builds, and committed. The 40 tool uses and 51-minute clock reveal how much work "commit this" actually means when the agent is trusted to do it fully.

**Phase shift:** None visible from prompts — it's all implicit in the tool sequence.

**Tool-only classification guess:** Read → Glob → TaskCreate/Update → Write → Edit → Bash → "autonomous task with project exploration, task tracking, implementation, and verification." **Exactly right.** This is the clearest case where the tool sequence tells the complete story.

**Unusual:** The extreme prompt-to-tool ratio: 1 prompt, 40 tools. TaskCreate×3 + TaskUpdate×5 within a commit session means Claude created its own work tickets for tracking what it was doing before doing it. Claude is self-managing its own work queue in response to a 2-word instruction.

---

### Session 17 — flihub: API Data Schema Integration

**ID:** 3aa4e5aa | **Project:** flihub | **Date:** 2026-03-12 | **Duration:** 32m | **Prompts:** 5 (avg 971c)

**First 3 prompts:**

- P1: `"What do you know about the button that's available on FliHub to get the recordings and the chapter information? What's the format of the data that it grabs?"` [156c]
- P2: [4175c] — A massive paste of JSON schema data: the `gather-chapter-inputs` schema definition with field names and formats. `"So when we're sending data to agent workflow builder, these are the two fields we got. I'm going to give you the name and the format. Have we got the ability to make this data available when we send information?"`
- P3: `"Okay, let's populate it. Tell me what field you're actually going to put it into, by the way."` [93c]

**Tool sequence:** Skill → Grep×2 → Read×4 → Grep×2 → Grep → Read×2 → Grep×2 → Glob → Read → Grep → Read×2 → Edit×16

**Voice-transcribed:** Borderline. P3 "Okay, let's populate it" sounds spoken; P4 "yes" is too short to tell.

**Session feel:** Incomplete. Ends in the middle of an Edit streak with a bug report in P5 (SRT key name mismatch).

**What human was doing:** Integration work — wiring flihub's chapter data export to the agent-workflow-builder's input schema. Session starts with knowledge check (what does this button do?), then David pastes the schema definition from agent-workflow-builder. Claude searches existing code to find where to inject it, then implements with 16 consecutive Edits.

**Phase shift:** Knowledge verification → schema specification paste → implementation → bug discovery.

**Tool-only classification guess:** Skill → Grep cluster → Read → more Grep → Edit burst → "context loading, then code search, then targeted implementation." **Exactly right.**

**Unusual:** P2 at 4,175 characters is pure JSON schema content — the largest non-log-paste prompt in the batch. David is using Claude as a schema interpreter, pasting structured data and asking "can we support this?" Also: 16 consecutive Edits at session end is a very high sustained Edit density — suggests Claude was making numerous small related changes across many files simultaneously.

---

### Session 18 — voz: Weekly Planning Session

**ID:** dd804b93 | **Project:** voz (client) | **Date:** 2026-02-16 | **Duration:** 34m | **Prompts:** 6 (avg 154c)

**First 3 prompts:**

- P1: `"what were we planning to work on with voz"` [41c]
- P2: `"jan and voz were going to make another agent for story telling"` [62c]
- P3: `"The plan in the next session is to create a new agent, and we'll probably go closer to the storytelling agent. What was week 2? Just tell me again what week 1, 2, and 3 is for vOz."` [180c]

**Tool sequence:** Bash → Glob → Read×2 → Grep×2 → Read → Grep×4 → Task → Read×2 → Grep → Read×2 → Edit×6 → Write → Read×4 → Edit×5 → Write → Bash

**Voice-transcribed:** Yes. P1-P2 are short, lowercase, casual — likely voice dictated. P4 is a longer formal planning statement with embedded data.

**Session feel:** Complete. P6 `"sent email"` is a status confirmation.

**What human was doing:** Weekly plan review and update for vOz client project. Started by asking what was planned (memory prompt), added a new deliverable (storytelling agent / Art Director), updated the week plan documentation, sent an email. Classic: "where were we?" → update plan → execute one action → confirm.

**Phase shift:** Memory retrieval (P1) → knowledge addition (P2) → plan structure clarification (P3) → plan update (P4-P5) → email confirmation (P6).

**Tool-only classification guess:** Bash → Glob/Read research → Task → Read → Edit/Write → Bash → "exploration then document update then scripted action." **Right.** This pattern correctly predicts a planning-update session.

**Unusual:** P1 `"what were we planning to work on with voz"` — no capital, no punctuation. Pure voice command. In the context of a client project, this signals David opening Claude at the start of a client work block and asking it to surface the plan. Claude as project memory.

---

### Session 19 — v-appydave: Repository Cleanup (Large Files)

**ID:** eea00425 | **Project:** v-appydave | **Date:** 2026-02-16 | **Duration:** 35m | **Prompts:** 8 (avg 96c)

**First 3 prompts:**

- P1: `"Why is it taking so long to push the API, Dave? Why have we got video files, I'm assuming, in our repository?"` [110c]
- P2: `"Hold on. What do our actual rules say about Big files. Like we have special rules. Some video files are allowed. It's just not the big stuff like we're allowed files in the Shadow folders, I believe. Can we run some background agents and have a look at any documentation we can find? Any rules, any policies..."` [381c]
- P3: `"let's do option 1 for now, just remove those big files"` [54c]

**Tool sequence:** Bash×4 → Grep → Bash → Task×2 → Bash×22 → Write → Bash×7 → Read×2 → Edit → Bash×2

**Voice-transcribed:** Borderline. P1 "Why is it taking so long... Dave?" — addressing the tool by name ("Dave") is a spoken-aloud habit. P3-P8 are terse action confirmations.

**Session feel:** Complete. Ends with commit/push confirmations.

**What human was doing:** Debugging a slow git push caused by large MP4 files in the repo. Discovered video files violating gitignore policy, ran background agents (Task×2) to check rules, then methodically: identify large files → remove them → update gitignore → handle x-prefixed directories → commit → push.

**Phase shift:** Problem discovery (why is it slow?) → policy check (what are our rules?) → decision (option 1: remove) → execution (Bash sprint) → gitignore update → commit/push.

**Tool-only classification guess:** Bash sprint → Task → Bash sprint → Write → Bash → "investigation then scripted remediation." **Right.** Task appearing mid-Bash sprint (background agents during live work) is accurately predictable from the tool sequence.

**Unusual:** David calls the AI "Dave" in P1 — casual personification. The Task×2 mid-session is the "background agent while still working" pattern — David didn't want to wait for the policy research, so he spawned agents and continued the main thread.

---

### Session 20 — deckhand: UI Feature Sprint (Auto-save, Drag-delete)

**ID:** 1af0ff41 | **Project:** deckhand | **Date:** 2026-03-11 | **Duration:** 3.1h | **Prompts:** 7 (avg 154c)

**First 3 prompts:**

- P1: `"Do you want a plan around these pending items?"` [46c]
- P2: `"3"` [1c] — selecting option 3 from a list Claude presented
- P3: `"Can you run the application? In using Playwright MCP, just take me to a screen where there's something interesting for me. Also tell me a couple of things to go looking for."` [173c]

**Tool sequence:** Read → Glob → Read×2 → Edit×2 → Agent×5 → Edit×6 → Agent → Edit×6 → Agent → Edit×8 → Bash×4 → ToolSearch → navigate → ToolSearch → wait → click → screenshot → Read×3 → Edit×8 → Read×4 → Edit×8 → navigate → click → screenshot → Read×2 → Edit×14 → Read → Edit×2 → Bash → Edit×2 → Bash×2 → navigate → Edit×4 → Read → Edit → Read → Edit → Bash×2 → navigate → screenshot

**Voice-transcribed:** No. Deliberate, sparse prompts.

**Session feel:** Incomplete. Ends mid-session on a screenshot — likely David was looking at the result and stopped.

**What human was doing:** Feature development sprint on deckhand (presentation/slide deck app). P1 asks for a plan, P2 picks option 3 (a specific feature set), then Claude uses Playwright to show what the app looks like, then implements: auto-save, drag-to-delete (red cross on drag-off-slide), live label editing. Agent×5 at the start (parallel sub-agents) followed by Playwright visual loop.

**Phase shift:** Planning (P1-P2) → visual inspection via Playwright (P3) → feature requirements (P4-P6) → implementation (Agent batch + Edit sprint) → Playwright verification.

**Tool-only classification guess:** Read/Glob orient → Edit + Agent batch → Bash → navigate/screenshot → Edit sprint → navigate/screenshot loop → "multi-agent feature implementation with visual verification." **Exactly right.**

**Unusual:** Agent×5 near the session start — five parallel sub-agents deployed simultaneously before any Playwright interaction. This is a "fan out then fan in" pattern: David picks an option, Claude fans out to implement multiple aspects in parallel, then verifies visually. The 1c prompt ("3") triggering 114 subsequent tool calls is extreme compression of human intent.

---

## Cross-Session Patterns

### Pattern 1: The "Paste Dump" Prompt Type

Six of 20 sessions open with a large paste (>1000c), not a question:

- **Session 02 (voz):** Full Loom transcript with instructions embedded
- **Session 03 (flihub):** Structured data (S3 file listing) inside a correction
- **Session 05 (v-appydave):** Raw `git status` output — no explanation needed
- **Session 12 (flivoice):** Entire previous Claude Code session terminal output
- **Session 13 (agent-os):** Full Ansible playbook run log
- **Session 14 (lars):** Raw email thread (Danish and English mixed)
- **Session 17 (flihub):** JSON schema definition (4175c of structured data)

In every case, the paste _is_ the task specification. David is not describing what the data means — he's handing it over and expecting Claude to interpret context from it. This is a high-trust pattern: "here is the raw thing, you know what to do with it."

### Pattern 2: Duration vs. Actual Work — The Gap is Real

Six sessions show wall-clock duration wildly disproportionate to prompt count:

- **Session 04 (flihub-2):** 23.6h / 6 prompts — sessions left open all day
- **Session 06 (v-appydave-2):** 19.6h / 2 prompts — open overnight
- **Session 05 (v-appydave):** 1.1 days / 6 prompts — open across a day
- **Session 14 (lars):** 14h / 4 prompts — returned hours later
- **Session 15 (klueless):** 21.5 days — artifact of persistent session ID

Duration is a poor proxy for work intensity. The minor projects especially show this: David opens Claude, asks questions, leaves, returns, leaves, returns. Session clock time is calendar time, not work time.

### Pattern 3: Voice-Transcription is a Minor Project Hallmark

Voice transcription was detected (strongly or moderately) in 10 of 20 sessions:

- 07 kgems, 08 brain-dynamous, 11 voz-2, 13 agent-os, 15 klueless, 18 voz-3 (strong)
- 04 flihub-2, 05 v-appydave, 12 flivoice, 17 flihub-4 (moderate)

Voice usage correlates with: **project exploration/reorientation** (returning to abandoned or peripheral projects), **client communication** (emails, looms), and **infrastructure tasks** (ansible logs). Notably, the deckhand UI sessions (10, 20) — the heaviest coding sessions — show **no** voice usage. David types when he knows exactly what he wants to build; he speaks when he's figuring it out.

### Pattern 4: The Tool-Only Classification Test

**Testing hypothesis: can tool sequence alone predict session purpose?**

| Session                  | Tool-only prediction                | Actual                                            | Match?  |
| ------------------------ | ----------------------------------- | ------------------------------------------------- | ------- |
| poem-os                  | Implementation task                 | Architectural discussion → implementation         | Partial |
| voz (loom)               | Documentation update                | Loom transcript → client artifact                 | Partial |
| flihub (transcript arch) | Refactoring                         | Architectural correction after user-spotted error | Partial |
| v-appydave (git)         | Ops/scripting                       | Git hygiene + policy decisions                    | Right   |
| deckhand (playwright)    | Visual UI development               | Playwright-driven UI styling                      | Exact   |
| kgems                    | CI/testing                          | Account forensics                                 | Wrong   |
| brain-dynamous           | Scaffolding                         | Knowledge research + brain update                 | Wrong   |
| "commit this"            | Autonomous commit                   | Autonomous commit                                 | Exact   |
| flihub-4 (schema)        | Context load → search → implement   | Integration wiring                                | Right   |
| deckhand-2 (agent)       | Multi-agent feature + visual verify | Feature sprint + Playwright                       | Exact   |

**Verdict:** Tool sequence predicts correctly in ~50-60% of cases. It is most accurate for:

- Playwright-driven sessions (visual verification loop is distinctive)
- Bash-dominant sessions (ops/scripting correctly inferred)
- Edit-burst sessions with preceding research (refactoring/implementation)
- "commit this" style sessions (autonomous execution)

It fails most for:

- Knowledge/brain sessions (looks like scaffolding)
- Account/credential forensics (looks like testing)
- Loom processing (looks like documentation update — partially right but misses the trigger)
- Architecture discussions that lead to implementation (misses the discussion phase entirely)

The Playwright tool signature is **uniquely reliable** — `navigate → screenshot → Edit × n` repeated is unambiguous visual UI iteration regardless of prompt content.

### Pattern 5: What Minor Projects Reveal vs. Major Projects

**Minor projects are characterised by:**

1. **Reorientation prompts.** "I haven't looked at this project for months. What were we talking about?" (klueless), "what were we planning to work on with voz" (voz-3). Major projects (supportsignal, appystack, angeleye) rarely need this — they have continuous daily context. Minor projects have cold-start sessions.

2. **Account/credential recovery sessions.** kgems session: David doesn't know his npm username, email, or account. This never appears in major projects. Minor/peripheral projects accumulate forgotten credentials.

3. **Cross-session context paste.** flivoice session: pasting entire prior session terminal output as P1. thumbrack: pasting Claude's own prior response. These are manual session-continuity hacks — more common in minor projects where there's no persistent session context maintained.

4. **Business/client CRM work alongside code.** lars and voz sessions: email processing, scheduling, template generation. This CRM pattern doesn't appear in technical project sessions. Minor projects include "client relationship maintenance" as a session type — not just code.

5. **The "Dave" address.** David called Claude "Dave" in v-appydave session 19. This casual personification appeared only once but is distinctive. It suggests a higher level of ambient, conversational interaction in peripheral project contexts vs. the focused, professional tone of major project sessions.

6. **Single-prompt sessions with enormous tool counts.** "commit this" (1 prompt, 40 tools). Playwright deckhand (1 prompt, 55 tools). These single-trigger autonomous sessions appear more in minor projects — David trusts Claude to handle the full scope. In major projects (where correctness stakes are higher), he tends to stay more in the loop with more prompts.

### Pattern 6: The Session Closure Vocabulary

The words David uses to end sessions are informative:

| Closure phrase                                                      | Meaning                                    |
| ------------------------------------------------------------------- | ------------------------------------------ |
| `"commit this"`                                                     | Git commit signal — session complete       |
| `"push it"`                                                         | Secondary git signal, often follows commit |
| `"sent email"`                                                      | Client communication complete              |
| `"Commit, push, and then exit the conversation"`                    | Explicit multi-step session close (lars)   |
| `"yes, commit it"` → `"push it"` → `"yes, strip them out and push"` | Iterative confirmation chain               |

Sessions without these phrases tend to be incomplete: they end in a question, a bug report, or a "what if" tangent.

### Pattern 7: Tool Tools — ToolSearch and AskUserQuestion

Two meta-tools appeared in this batch:

- **ToolSearch** (×6 total across sessions): Used when Claude needs to discover what MCP tools are available. Appears in deckhand sessions (finding Playwright) and lars (looking for email/calendar tools). Signals: Claude is operating at the boundary of its known tool set.

- **AskUserQuestion** (×1, klueless session 15): Claude asked for clarification mid-session rather than assuming. Rare — only one instance in 20 sessions, 87+ tool calls. David generally prompts in a way that doesn't require clarification, or Claude makes assumptions and runs.

### Pattern 8: The "Cite Then Specify" Prompt Pattern

Several sessions show a two-step prompt pattern:

1. Ask what exists / what Claude knows
2. Provide the new spec or data

Examples:

- **flihub-4 (17):** "What do you know about the button..." → [paste JSON schema] "Have we got the ability..."
- **voz-2 (11):** "Do you understand how vOz communication works?" → [detailed Lars spec]
- **brain-dynamous (08):** "What is S3?" → "put Glacier into the agentic OS"
- **voz-3 (18):** "What were we planning to work on?" → "Jan and voz were going to make another agent"

David verifies Claude's existing knowledge before giving new instructions. This is a trust calibration pattern: confirm the foundation before building on it.

---

## Final Synthesis

**The minor projects in this batch reveal a qualitatively different relationship with Claude than the major projects.** In major projects (supportsignal, appystack), sessions are focused, continuous, and task-bounded. In minor/peripheral projects:

- Sessions open with uncertainty about what was previously done
- Voice dictation is more prevalent (thinking out loud, not specifying)
- Business workflows (client emails, scheduling) interleave with technical work
- Large pastes (logs, transcripts, emails, schemas) are the primary input format
- Sessions span longer calendar time with lower prompt density

The **paste-as-prompt** pattern is the most distinctive finding: in 7 of 20 sessions, the primary input was raw data (git output, Ansible logs, Loom transcripts, email threads, JSON schemas) — not a question or instruction. This shifts Claude's role from "assistant receiving instructions" to "interpreter receiving data."

The **voice-transcription correlation** with project maturity is actionable for AngelEye: sessions with voice-dictated prompts tend to be exploration/reorientation sessions, not implementation sessions. Detecting voice artifacts in prompts could be a signal for "user is figuring out what they want" vs. "user knows exactly what they want."

The **tool-only classification hypothesis** holds at ~55% accuracy. It works best for ops-pattern sessions (Bash-heavy), visual iteration sessions (Playwright loop), and autonomous commit sessions. It fails for knowledge/research sessions (Write-from-Glob looks like scaffolding) and credential/account forensics (Bash-heavy looks like testing). Adding project directory as a feature dramatically improves classification — `brain-dynamous` + Glob + Write = knowledge session, not scaffolding.
