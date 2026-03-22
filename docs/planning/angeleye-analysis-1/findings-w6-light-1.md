# Findings — W6-light-1 (12 light sessions, 12-24 events)

Wave 6, batch light-1. Analysed 2026-03-22.

---

## Session Summary

| #   | Session ID | Project              | Events | Type        | Subtype                                | Notable                                                                           |
| --- | ---------- | -------------------- | ------ | ----------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | f9c4d2e6   | prompt.supportsignal | 12     | OPERATIONS  | operations.dev_workflow_simplification | Test runner simplification + commit; 150-min idle gap from AskUserQuestion        |
| 2   | d0799256   | app.supportsignal    | 13     | ORIENTATION | orientation.artifact_retrieval         | Voice: "I don't know how to start it up again"; all search tools, zero edits      |
| 3   | e5198554   | appydave-plugins     | 13     | SKILL       | skill.creation                         | NotebookLM skill creation; massive pasted transcript from prior session           |
| 4   | ce19a727   | flihub               | 14     | PLANNING    | planning.product_requirements          | All 8 tool calls are Task; voice-driven UX discussion about Gling/S3/folder flow  |
| 5   | 1422b159   | appydave-plugins     | 15     | DEBUG       | debug.skill_troubleshooting            | "What's happened to Lisa?"; 11 Bash diagnostic calls, single prompt               |
| 6   | 44d74deb   | prompt.supportsignal | 19     | RESEARCH    | research.technology_evaluation         | Compiler/workflow research, n8n integration evaluation, 3 background agents       |
| 7   | 87ea6053   | signal-studio        | 20     | TEST        | test.uat_setup_attempt                 | Frustration: "That's not what I wanted you to do"; Playwright UAT attempt         |
| 8   | 4278b993   | brains               | 20     | KNOWLEDGE   | knowledge.brain_update                 | 6 Edit on brain files (Loom + Vercel agent-browser); pasted prior session context |
| 9   | 04fd1cd3   | app.supportsignal    | 21     | PLANNING    | planning.epic_creation                 | Epic 11 PRD created from pasted Epic 12 assessment; cleanup + commit + push       |
| 10  | 1727cafa   | appydave-plugins     | 21     | SKILL       | skill.iteration                        | Ralph Wiggum/Ralphy skill edits; 12 Edit + commit + push                          |
| 11  | b5368be3   | prompt.supportsignal | 21     | KNOWLEDGE   | knowledge.documentation_curation       | Evaluating docs portability; applying "mixed" badges to 6 files                   |
| 12  | b06245d7   | signal-studio        | 24     | SKILL       | skill.creation                         | Mochaccino mockup skill defined via long voice prompt; 4 ToolSearch + 4 Write     |

---

## Classification Distribution

| Type        | Count | Sessions                     |
| ----------- | ----- | ---------------------------- |
| SKILL       | 3     | e5198554, 1727cafa, b06245d7 |
| PLANNING    | 2     | ce19a727, 04fd1cd3           |
| KNOWLEDGE   | 2     | 4278b993, b5368be3           |
| OPERATIONS  | 1     | f9c4d2e6                     |
| ORIENTATION | 1     | d0799256                     |
| DEBUG       | 1     | 1422b159                     |
| RESEARCH    | 1     | 44d74deb                     |
| TEST        | 1     | 87ea6053                     |

**Zero BUILD sessions** in this batch, despite likely registry classification of BUILD for most. Reinforces the wave 1-5 finding that BUILD is massively over-classified.

---

## Detailed Analysis

### W6-L01: f9c4d2e6 — OPERATIONS / dev_workflow_simplification

**Shape**: 12 events, 3 prompts, 1 active min (151 min wall clock with 150-min gap).

**Opening**: "how do I run tests" — bare question, voice-dictated.

**Flow**: Bash x2 (explore test setup) -> user asks to simplify -> AskUserQuestion (left hanging 2.5h) -> Write + Bash (create simplified script) -> "commit this" -> Skill (commit) + Bash x2.

**Key observations**:

- AskUserQuestion created a 150-minute idle gap -- user walked away, came back, and the answer was applied automatically
- CWD is prompt.supportsignal but actual work is dev workflow tooling, not feature construction
- Classic OPERATIONS pattern: identify friction, simplify, commit

**Closing**: commit_and_push

---

### W6-L02: d0799256 — ORIENTATION / artifact_retrieval

**Shape**: 13 events, 1 prompt, 1 active min.

**Opening**: Voice dictation — "Recently, one week ago, I did a whole lot of information, probably in planning for the new supportsignal application..."

**Flow**: Single prompt -> Skill + Glob + Bash x8 + Read. All search/discovery tools. Zero Write/Edit.

**Key observations**:

- Pure artifact retrieval: user lost track of prior work and needs to find it
- CWD is app.supportsignal but user is asking about planning artifacts (Mermaid diagrams, architecture screenshots)
- Very short session — found the answer in 1 minute of tool work
- "I don't know how to start it up again" is a classic cold-start signal

**Closing**: abrupt_abandon (no follow-up after the answer)

---

### W6-L03: e5198554 — SKILL / skill.creation

**Shape**: 13 events, 3 prompts, 12 active min.

**Opening**: "I would like to create a skill... the notebook LM skill that prepares data for notebook LM"

**Flow**: Prompt 1 provides instructions. Prompt 2 is a massive paste of a prior session's full transcript (the session where NotebookLM prep went wrong). Agent reads existing files, writes a new skill file, edits existing skill files.

**Key observations**:

- appydave-plugins CWD is correct -- this is genuinely skill creation work
- Cross-session reference: entire prior session transcript pasted as context (cross-paste injection pattern, but intentional here)
- Voice dictation artifacts: repeated phrase "you're looking at is the notebook LM skill that prepares data for" appears twice (voice duplication)
- 3rd prompt asks to update skill based on additional pasted conversation info

**Closing**: abrupt_abandon (no commit)

---

### W6-L04: ce19a727 — PLANNING / product_requirements

**Shape**: 14 events, 6 prompts, 40 active min (1413 min wall clock, 2 idle gaps of 89 and 1233 min).

**Opening**: Voice — "Going to be throwing stuff at you. If you think it relates to anything..."

**Flow**: All 8 tool calls are Task (subagent delegation). User asks a series of questions about FliHub UX: copy buttons for Gling, edit first/second/final workflow confusion, S3 bucket navigation, folder management. Session spans two days with a 20-hour gap.

**Key observations**:

- Zero Read/Edit/Write/Bash — purely conversational + Task delegation. The agent is being used as a thinking partner
- Voice-driven product requirements gathering
- "GLING" = voice artifact for Gling (video editing tool)
- Multi-day session with clear phases: initial questions (day 1), deeper UX exploration (day 2)
- Final prompt "Write up a ticket" confirms this is requirements/planning, not building
- Task-only tool profile is distinctive — suggests an agent_orchestration or conversational profile

**Closing**: abrupt_abandon after asking "how did I get the files over to Jan?"

---

### W6-L05: 1422b159 — DEBUG / skill_troubleshooting

**Shape**: 15 events, 1 prompt, 1 active min.

**Opening**: "What's happened to Lisa? I've gone into both POEM and support signal app, and I tried to run Lisa, and she's not available."

**Flow**: Single prompt triggers 11 Bash + 3 Read diagnostic calls. Agent searches for the missing "Lisa" skill across multiple directories.

**Key observations**:

- Single prompt, all automated investigation — agent does the debugging
- appydave-plugins CWD is correct (skill investigation)
- "Lisa" is a skill/persona that should be available but isn't — a broken tool discovery
- Bash-heavy diagnostic pattern is classic debug_loop/troubleshooting
- No resolution visible (session ends without Edit/Write)

**Closing**: abrupt_abandon (no resolution communicated back)

---

### W6-L06: 44d74deb — RESEARCH / technology_evaluation

**Shape**: 19 events, 3 prompts, 15 active min (58 min wall clock).

**Opening**: "what have learnt about building the compiler and running based on the workflow system?"

**Flow**: Phase 1 (prompt 1): Read x4 — loading existing knowledge about the POEM compiler. Phase 2 (prompt 2): "how would we implement this as an n8n generator" — Read x5 including brain files. Phase 3 (prompt 3): "write up each idea into one document" — Task x3 + TaskOutput x3 + Write x1.

**Key observations**:

- CWD is prompt.supportsignal but actual work spans POEM compiler knowledge and n8n brain
- Three distinct phases: context loading, exploration, synthesis via background agents
- Explicitly requests brain file reads: "@/Users/davidcruwys/dev/ad/brains/n8n"
- Task orchestration for parallel research writeup — 3 background agents produce content
- CWD unreliable for project attribution (this is cross-project research)

**Closing**: abrupt_abandon after write completes

---

### W6-L07: 87ea6053 — TEST / test.uat_setup_attempt

**Shape**: 20 events, 6 prompts, 8 active min.

**Opening**: "What does it take to run the e2e test?"

**Flow**: Starts exploring e2e test infrastructure, then pivots to Playwright UAT. Frustration: "But hang on. NPS Playwright Test does an E2E. That's not what I wanted you to do." and "We have a user acceptance test plan. Why can't you read that?" Eventually tries to run full UAT with Playwright.

**Key observations**:

- Frustration signals present: two correction prompts ("not what I wanted", "why can't you read that")
- Playwright calls (3): navigate, click, snapshot — beginning of a UAT run
- Agent delegated via Agent tool call before Playwright starts
- Session cuts off early — only 20 events, likely abandoned when Playwright attempt stalled
- Voice artifacts: "UA2s" = UATs
- ToolSearch for Playwright tools before starting

**Closing**: abrupt_abandon (Playwright snapshot is last event)

---

### W6-L08: 4278b993 — KNOWLEDGE / brain_update

**Shape**: 20 events, 1 prompt, 2 active min.

**Opening**: Long voice prompt about Loom, Vercel agent-browser, agentic OS, and Ansible brain updates.

**Flow**: Single massive prompt (6738 chars) that includes a pasted prior session transcript. Agent reads 7 brain files, runs 6 Bash commands (searching), then makes 6 Edit calls to brain files.

**Key observations**:

- CWD is brains — and brain file edits confirm this is genuine KNOWLEDGE work
- Cross-session reference: contains pasted transcript from an appydave-plugins session about installing agent-browser
- Voice artifact: "HNTKOS" = likely voice mangling of "agentic OS"
- Single-prompt, fully autonomous brain update — user provided all context upfront
- 6 Edit calls in 2 minutes = efficient batch update

**Closing**: abrupt_abandon (edits complete, no commit)

---

### W6-L09: 04fd1cd3 — PLANNING / epic_creation

**Shape**: 21 events, 3 prompts, 11 active min (109 min wall clock, 97-min idle gap).

**Opening**: Paste handover — massive 21,838-char paste of Epic 12 assessment from a prior session.

**Flow**: Phase 1 (prompt 1 + 97-min gap): Prior session output pasted as briefing, idle for 97 minutes. Phase 2 (prompt 2): "do the cleanup, items 1-3" — Glob x3 + Read x2 + Bash x2 + Edit x7 (archive stories, update status docs, create Epic 11 PRD). Phase 3 (prompt 3): "yes, commit it" — Bash x4 (git add, commit, push).

**Key observations**:

- Cross-session reference: entire Epic 12 assessment pasted from prior session as handover
- CWD is app.supportsignal but the work is PRD/epic management (planning documentation)
- Edit-heavy cleanup: archiving old story files, updating index files
- Clean closing ceremony: explicit commit + push
- The 97-min gap suggests user left to review the pasted content before returning with instructions

**Closing**: commit_and_push

---

### W6-L10: 1727cafa — SKILL / skill.iteration

**Shape**: 21 events, 2 prompts, 4 active min.

**Opening**: Voice — "Can you just slide into memory the Ralph Wiggum skill we're gonna work on?"

**Flow**: Read x2 (load existing skill files) -> Edit x1 -> second prompt: "make the changes, yes, and then commit and push" -> Read x3 + Edit x11 + Bash x2 (commit + push).

**Key observations**:

- appydave-plugins CWD is correct — skill iteration
- "Ralph Wiggum" = Ralphy, the loop/campaign management skill
- Edit-heavy (12 total) but all targeting skill SKILL.md files, not product code
- Very efficient: 4 minutes, 2 prompts, clean commit+push
- "slide into memory" = voice-natural way of saying "load the context for this skill"

**Closing**: commit_and_push (explicit push at end)

---

### W6-L11: b5368be3 — KNOWLEDGE / documentation_curation

**Shape**: 21 events, 5 prompts, 15 active min (49 min wall clock).

**Opening**: Paste — file tree of docs/architecture/ and docs/learnings/ with the question "do these files read like generalized patterns... or specific to support signal workflows?"

**Flow**: Prompt 1: classification question -> Bash + Task. Prompt 2: "Yeah, that's the goal, I want to use this in other systems". Prompt 3: "what is your pro/con of each". Prompt 4: "go ahead and apply the badge to all 6 mixed files" -> Read x7 + Edit x7. Prompt 5: "fix POEM incident analysis prompts in the overview" -> Read + Edit.

**Key observations**:

- CWD is prompt.supportsignal but the activity is documentation curation for cross-project portability
- User is actively curating docs for reuse in other systems — this is knowledge management
- "Badge" pattern: adding metadata markers to docs indicating they contain mixed generic/specific content
- 5 prompts show progressive refinement: classify -> confirm -> evaluate options -> apply -> fix wording
- The Task call is for background analysis of all files

**Closing**: abrupt_abandon after final edit

---

### W6-L12: b06245d7 — SKILL / skill.creation

**Shape**: 24 events, 3 prompts, 8 active min.

**Opening**: "@.mocks Is a new folder What do you think I want to do here?"

**Flow**: Prompt 1: naming discussion. Prompt 2: naming refinement. Prompt 3: massive voice-dictated specification for "Mochaccino" mockup skill — design philosophy, folder structure, data sources, invocation patterns, dependency on Front End Designer skill. Agent then creates skill files: ToolSearch x4 (looking for FED skill) + Skill x1 + Write x4 + Read x3 + Bash x9.

**Key observations**:

- CWD is signal-studio but the work is skill creation (SKILL.md files + .claude folder)
- 4 ToolSearch calls early = checking for Front End Designer skill (not a gap signal — it's a dependency check)
- Voice-driven design specification: "Mochaccino" is a mockup/prototype creation skill for signal-studio
- "Angelo" = Angeleye? or another persona name. Used as the intended user of the skill
- Write x4 = creating multiple skill files (SKILL.md + configuration)
- Bash calls for directory creation and verification

**Closing**: abrupt_abandon after final bash

---

## Cross-Batch Patterns

### 1. CWD Unreliability Continues

- prompt.supportsignal CWD: 4 sessions, none are genuine prompt.supportsignal feature work (operations, research, knowledge curation, test setup)
- signal-studio CWD: 2 sessions, one is TEST attempt, one is skill creation — neither is signal-studio BUILD
- Only brains (1) and appydave-plugins (3) have reliable CWD attribution

### 2. Voice Artifacts in This Batch

- "GLING" = Gling (ce19a727)
- "HNTKOS" = agentic OS (4278b993)
- "UA2s" = UATs (87ea6053)
- Voice duplication in e5198554 (repeated phrase)

### 3. Cross-Session References Are Common (5/12)

- e5198554: Full prior session transcript pasted for skill creation context
- 4278b993: Prior session transcript about agent-browser installation
- 04fd1cd3: Epic 12 assessment pasted as handover (21KB)
- b5368be3: File tree from prior exploration
- 87ea6053: References to prior UAT test plans

### 4. Closing Style Distribution

- abrupt_abandon: 8/12 (67%) — dominant in light sessions
- commit_and_push: 3/12 (25%) — when work produces committed artifacts
- commit_then_gap: 1/12 (8%) — f9c4d2e6 with the AskUserQuestion gap

### 5. SKILL Type Confirmed as Distinct (3/12)

Three clear SKILL sessions: two creations (NotebookLM, Mochaccino) and one iteration (Ralphy). All in appydave-plugins or .claude directories. Tool profiles differ from BUILD: Write targets SKILL.md, not product code.

### 6. Task-Only Sessions

ce19a727 is the first pure Task-delegation session in the analysis: all 8 tool calls are Task. This suggests a "thinking partner" mode where the user asks questions and the agent delegates research to subagents. The tool_profile should be agent_orchestration.

### 7. New Subtypes Proposed

- `operations.dev_workflow_simplification` — simplifying dev tooling (test runners, scripts)
- `planning.product_requirements` — voice-driven UX requirements gathering
- `debug.skill_troubleshooting` — investigating missing/broken skills
- `research.technology_evaluation` — evaluating technology options (n8n, compilers)
- `test.uat_setup_attempt` — trying to set up UAT infrastructure
- `knowledge.documentation_curation` — curating docs for cross-project portability
- `skill.iteration` — editing existing skills (distinct from skill.creation)
