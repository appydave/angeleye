# Findings — Wave 6 Moderate-2 (8 sessions, 95-117 events)

**Batch**: w6-moderate-2
**Analysed**: 2026-03-22
**Sessions**: 8 moderate-scale sessions (95-117 events each)

---

## Session W6-69424780 — Signal Studio Code Quality Audit

**Session ID**: `69424780-cac4-4277-91f7-8c5470fc17d7`
**CWD**: signal-studio
**Duration**: 110min (14 active), 1h idle gap
**Events**: 95 (3 user_prompt, 92 tool_use)
**Tools**: Edit:34, Read:26, TaskUpdate:9, TaskCreate:5, Write:5, Bash:5, Agent:3, Glob:3, Grep:2

**Classification**: REVIEW (not BUILD). User asks Claude to do "background research from multiple angles on the full application" looking for code patterns, missing tests, styling inconsistencies, anti-patterns. This is a code quality audit with remediation. The session uses Agent subagents to parallelise the scan, then fixes issues and writes docs (anti-patterns, good patterns, learnings). The final prompt "Is everything documented? Can we close this conversation down?" confirms review-and-document intent.

**Observations**:

- Opening is voice-dictated conceptual question asking for a code audit
- Multi-pass instruction: "make sure you have a file listing... fix all the problems... identify learnings... update all our unit tests"
- Pasted context from a previous session (Wave 5G failure details: localStorage keys, rate limiter, outside-click handler, E2E URLs)
- Closing is a clean bookend: "Is everything documented?"
- Heavy Edit count (34) is from fixing identified issues, not new feature construction
- Agent subagents used for parallel code scanning — efficient pattern

---

## Session W6-e560d248 — Ralphy Loop Debugging / Requirement Gathering

**Session ID**: `e560d248-8091-46b6-9046-a1c79a70315b`
**CWD**: prompt.supportsignal.com.au
**Duration**: 108min (52 active)
**Events**: 96 (6 user_prompt, 90 tool_use)
**Tools**: Bash:26, Read:25, Edit:16, Glob:7, Write:5, Grep:5, Task:3, Skill:2, TaskOutput:1

**Classification**: MIXED (BUILD + META). Session starts with compacted context (first 13 events are tool_use before first user_prompt — continuation). Initial work is building/editing in the prompt.supportsignal repo using worktrees. But by prompt 5, user expresses frustration: "You've constantly not done what I've wanted. We really should have been gathering your requirements for the next loop..." Session pivots to META — diagnosing why the Ralphy loop skill isn't working as expected. Final prompt asks about the RALPHY Loop documentation structure.

**Observations**:

- CWD is prompt.supportsignal — matches prior wave finding that this CWD is universally unreliable for project attribution
- Frustration signal in prompt 5: "What am I doing wrong, and what is wrong within the skill for Ralphie?"
- Voice dictation artifacts: "mope down" (map out), "RAAF Loop" (Ralphy Loop), "blog" (bug)
- Worktree usage detected (Bash CWD shifts to `.claude/worktrees/ralphy-wui-round4`)
- Multi-phase: BUILD (prompts 1-4) then META/diagnostic (prompts 5-6)
- Skill invocations (2) present but skills not working as user expected

---

## Session W6-03c0efb5 — Multi-Repo Git Housekeeping

**Session ID**: `03c0efb5-7875-40a6-9836-31ea33192809`
**CWD**: brains
**Duration**: 22min (22 active)
**Events**: 97 (12 user_prompt, 71 tool_use, 12 stop)
**Tools**: Bash:63, Read:4, Edit:3, Write:1

**Classification**: OPERATIONS (specifically operations.git_housekeeping). CWD is brains but actual work spans the entire dev monorepo. User asks to validate locations.json, check git remotes, find what needs committing/pushing. Session then executes: gitignore fixes across 4 repos, commits and pushes 17+ repos, deletes stale branches (FliHub claudear branches, k_builder develop), resolves rebase conflicts. The user corrects naming conventions ("Why do you name it that way for Agent OS Ansible when it's actually named this?").

**Observations**:

- CWD is incidental — brains is just where the terminal was. Work touches 20+ repos across entire filesystem
- Bash-dominant (63/71 tool calls) — classic operational scripting profile
- Hook-sourced events (source: "hook") — this is a hook-instrumented session, not transcript-sourced
- User gives real-time quality feedback: repo naming conventions, detection script accuracy concerns
- File touches are across kgems, ad, clients, video-projects — truly cross-project operations
- Edit/Write of .gitignore files in k_dsl, k_config, thumbrack, appydave-plugins — infrastructure maintenance
- Stale branch cleanup: 9-week-old FliHub claudear branches, 3.5-year-old k_builder develop

---

## Session W6-27e99b38 — FliHub Dev Environment Setup + DAM CLI Fix

**Session ID**: `27e99b38-753f-4679-9e67-5833a85ab712`
**CWD**: flivideo/flihub
**Duration**: 1604min (27 active), 2 idle gaps (20h overnight, 5.5h)
**Events**: 99 (12 user_prompt, 87 tool_use)
**Tools**: Bash:64, Read:11, Edit:9, Grep:2, Skill:1

**Classification**: SETUP (not BUILD). Session opens with terminal output paste showing pnpm install then "vite: command not found" / "nodemon: command not found" errors. User asks "Did I install this correctly or not?" The session then: fixes package manager (pnpm->npm), extracts video transcripts from FliHub data, diagnoses DAM CLI not working on M4 Mini, creates wrapper script for clipboard gem, updates Ansible docs for team machines (Mary, Jan). Multi-day session with 3 distinct phases across 2 days.

**Observations**:

- Opening is terminal output paste (form_field_paste style) — user dumps error output for diagnosis
- Voice dictation: "cellite, till" (CLI tool), "clueless I OK builder" (Klueless IO k_builder)
- Multi-phase: Phase 1 (fix dev env), Phase 2 (extract transcripts), Phase 3 (DAM CLI + Ansible)
- Cross-project: touches flihub, brains/ansible, appydave-tools
- Bash-dominant (64/87) — setup/troubleshooting profile
- Skill invocation present but secondary to manual troubleshooting
- 20h overnight gap between phases — day-boundary session

---

## Session W6-64410d3b — Workflow Output YAML Feature Build

**Session ID**: `64410d3b-b25a-4b0e-8018-cd50ac77222e`
**CWD**: prompt.supportsignal.com.au
**Duration**: 773min (13 active), 3 idle gaps (1.5h, 10h overnight, 1.25h)
**Events**: 100 (4 user_prompt, 96 tool_use)
**Tools**: Bash:28, Read:24, Edit:15, TaskUpdate:10, TaskCreate:5, Glob:5, Write:5, Grep:1, EnterPlanMode:1, Agent:1, ExitPlanMode:1

**Classification**: BUILD (build.plan_execution). User pastes a complete implementation plan (7500 chars) for "Workflow Outputs — First-Class YAML Capability" with file change list, implementation details, YAML schema, test plan. Claude executes the plan directly — creating output-resolver.js, modifying ir-compiler.js, save.js, WizardShell.jsx, running tests. Later prompts explore architectural questions ("Why do you need the IR cache?") and rename IR to "flow graph". Session ends with EnterPlanMode for next phase.

**Observations**:

- Opening is paste_handover of a complete plan — this is the BUILD variant where human pre-plans and Claude executes
- CWD is prompt.supportsignal but work is genuinely within that repo (poc/wui/server)
- Plan mode (EnterPlanMode/ExitPlanMode) used for follow-up architectural changes
- Multi-phase across 3 idle gaps: Phase 1 (execute plan), Phase 2 (UAT question), Phase 3 (rename + plan mode)
- Task orchestration (5 TaskCreate, 10 TaskUpdate) — structured execution tracking
- This is a rare confirmed BUILD for prompt.supportsignal — the key discriminator is the implementation plan paste

---

## Session W6-08152bc4 — BMAD Oversight / Epic Story Review

**Session ID**: `08152bc4-48eb-4395-b42b-518db6f20297`
**CWD**: app.supportsignal.com.au
**Duration**: 2573min (58 active), 1 idle gap (42h!)
**Events**: 106 (20 user_prompt, 58 tool_use, 20 stop, 2 subagent_start, 3 subagent_stop)
**Tools**: Read:32, Bash:16, Glob:5, Edit:2, Agent:2, Grep:1

**Classification**: REVIEW (review.planning_oversight). Opens with `/bmad-oversight` skill. Claude loads planning artifacts (PRD, UX spec, architecture, epics, domain model) then serves as an oversight reviewer while the user manages a BMAD epic creation workflow in another session. User pastes proposed epic breakdowns, Claude reviews for correctness ("5 issues to fix before proceeding"). Heavy conversational exchange (20 prompts, 20 stops). Frustration emerges when user doesn't understand BMAD persona transitions ("That's gonna fuck up my video").

**Observations**:

- Skill invocation opening: /bmad-oversight — clear REVIEW/advisory intent
- Read-dominant (32/58 tool_use) — loading planning artifacts, not writing code
- Only 2 Edits — minor corrections to planning docs, not feature construction
- Cross-session paste pattern: user pastes output from a parallel BMAD session for review
- Frustration signal: confusion about Bob vs John persona transitions in BMAD workflow
- Agent subagents used for background research into BMAD v6 documentation
- 42h idle gap — session spans 3 calendar days
- High stop count (20) matches user_prompt count — true conversational back-and-forth
- Voice dictation: clear throughout ("I don't mean a pace back" = "I don't mean a step back")

---

## Session W6-de52510d — Brain Librarian Health Check

**Session ID**: `de52510d-64e0-40d9-9357-3d2eb087d394`
**CWD**: brains
**Duration**: 802min (15 active), 3 idle gaps (7h, 2.5h, 3.7h)
**Events**: 106 (6 user_prompt, 100 tool_use)
**Tools**: Bash:47, Edit:25, Read:20, ToolSearch:4, Skill:2, Write:2

**Classification**: KNOWLEDGE (knowledge.brain_maintenance). Opens with paste from a prior session recommending a brain-librarian health check. Invokes /brain-librarian skill via ToolSearch+Skill. Then heavy Bash scanning of brain directories, followed by 25 Edits updating brain INDEX.md frontmatter (file_count, last_major_update, etc.) and 2 Writes for new files. Final prompt: "commit and push" — user had to remind Claude twice.

**Observations**:

- Opening is paste_handover from another session's recommendation
- CWD brains is reliable here — actual work is editing brain files
- ToolSearch cluster early (4 calls) — searching for brain-librarian skill
- Skill invocations (2) — /brain-librarian skill loaded and used
- Heavy Edit (25) is all brain INDEX.md frontmatter updates — not feature construction
- Multi-day span (802min) but only 15min active — classic "terminal left open" pattern
- User frustration: "You didn't push. You didn't do a commit. I need a commit and push." — Claude forgot to complete the requested action

---

## Session W6-698ddfb2 — Signal Studio Dark Mode UI Review + Team Support

**Session ID**: `698ddfb2-3e45-4e5a-98dc-6685b1d42bb3`
**CWD**: signal-studio
**Duration**: 831min (56 active), 2 idle gaps (10h overnight, 3h)
**Events**: 117 (10 user_prompt, 107 tool_use)
**Tools**: Edit:30, Bash:22, Read:19, Playwright-screenshot:7, Glob:7, TaskUpdate:6, Playwright-click:5, TaskCreate:3, Skill:2, Playwright-navigate:2, Write:2, Grep:1, Playwright-wait:1

**Classification**: MIXED (BUILD + REVIEW + OPERATIONS). Phase 1: Commit+push then Playwright dark mode UI review using /frontend-design skill. Phase 2 (next day): Team support — Angela can't reach the app, port conflicts, package-lock.json questions, tsconfig.tsbuildinfo gitignore. Phase 3: Compaction resume, then more UI fixes (Edit-heavy) and git commit.

**Observations**:

- Opening is multi-intent: "commit and push" then "use Playwright MCP" then "/frontend-design" — 3 distinct actions in one prompt
- Playwright calls (15 total, 12.8% of tool_use) — UI audit pattern
- Compaction resume detected (1) — session survived context exhaustion
- Edit-heavy (30) split between UI fixes (Phase 1/3) and gitignore (Phase 2)
- Cross-day team support: answering questions about Angela's WSL/Windows setup
- Voice dictation: "she" (Angela), git user config instructions generated for team member
- Multi-phase session clearly: UI_REVIEW → OPERATIONS (team support) → BUILD (UI fixes)

---

## Cross-Session Observations

### 1. prompt.supportsignal CWD reliability — updated assessment

Two sessions in this batch (W6-e560d248, W6-64410d3b) have CWD=prompt.supportsignal. The first confirms prior finding (unreliable — worktree usage, meta diagnostic). The second is a genuine BUILD within that repo. The discriminator for prompt.supportsignal is the paste_handover of an implementation plan — when present, CWD is reliable.

### 2. Frustration patterns

3/8 sessions have frustration signals:

- W6-e560d248: skill not working as expected (Ralphy Loop)
- W6-08152bc4: confusion about BMAD persona transitions
- W6-de52510d: Claude forgot to commit/push when asked

### 3. Multi-phase sessions dominate at moderate scale

6/8 sessions show distinct phases. Moderate sessions (95-117 events) are not single-purpose — they typically span 2-3 activities across idle gaps.

### 4. signal-studio BUILD accuracy

2 signal-studio sessions in this batch: W6-69424780 is REVIEW (not BUILD), W6-698ddfb2 is MIXED. Confirms prior finding that signal-studio BUILD classification needs verification against actual file touches.

### 5. Voice dictation artifacts

Confirmed in 7/8 sessions. Notable new artifacts: "mope down" = map out, "cellite, till" = CLI tool, "RAAF Loop" = Ralphy Loop, "blog" = bug, "clueless I OK builder" = Klueless IO k_builder, "pace back" = step back.
