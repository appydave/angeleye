# Findings — W6-light-2 (12 sessions, 26-56 events)

**Wave**: 6-light-2
**Batch**: Light-to-moderate sessions (26-56 events)
**Analysed**: 2026-03-22
**Sessions**: 12

---

## Session Summaries

### W6-L2-01: fe34a87a — TIL/Labs Knowledge System Design

- **CWD**: brains/
- **Events**: 26 | **Active**: 16 min | **Duration**: 130 min (68-min idle gap)
- **Registry type**: BUILD
- **Analysed type**: KNOWLEDGE (knowledge.methodology_design)
- **Opening**: voice_dictation — brainstorming a cross-cutting TIL (Today I Learned) log system for brains
- **What happened**: David proposes a dated+tagged index system for daily learning. They discuss naming (labs vs TIL), create the structure, write an initial TIL entry (Kintsugi research — pasted as full transcript from another session), then refine the TIL capture format for "set and forget" usage. Two commits.
- **Key observations**:
  - Cross-session paste: David pastes a complete Kintsugi research session transcript as TIL content. The paste is larger than the session's own work.
  - CWD is brains/ and brain files ARE written (Write x3, Edit x2) — genuine KNOWLEDGE session.
  - Voice dictation artifacts: "thinkl", "inculding", "cuutting", "srp"
  - Multi-phase: Phase 1 = design discussion (2 prompts), 68-min gap, Phase 2 = build TIL structure + capture first entry (8 prompts)

### W6-L2-02: 30ac4f13 — BMAD Oversight Command Review

- **CWD**: app.supportsignal.com.au
- **Events**: 27 | **Active**: 13 min | **Duration**: 64 min
- **Registry type**: BUILD
- **Analysed type**: REVIEW (review.skill_audit)
- **Opening**: skill_invocation — `/bmad-oversight`
- **What happened**: Session opens with /bmad-oversight to load context for Winston (architecture) review. David then asks whether the oversight command has enough reference material — specifically whether Signal Studio, prompt.supportsignal, and AWB are listed. Claude audits the command file, identifies 3 missing reference locations, and updates bmad-oversight.md with a new "Reference Locations" section.
- **Key observations**:
  - CWD is app.supportsignal but work is improving the bmad-oversight command — a meta-skill/command review, not feature construction.
  - Only 1 Edit (to the command file itself), Read-heavy (9 reads for context).
  - Advisory role: David even pastes Claude's prior output from another session to inform the edit.

### W6-L2-03: f5d141ee — Ansible/Display Config + Hardware Troubleshooting

- **CWD**: brains/
- **Events**: 28 | **Active**: 24 min | **Duration**: 24 min
- **Registry type**: BUILD
- **Analysed type**: SYSOPS (sysops.hardware_config)
- **Opening**: voice_dictation — asking about Ansible config drift on M4 Mini, display resolutions, Logitech software
- **What happened**: David explores display scaling on Samsung 4K via displayplacer, learns about HiDPI scaling vs native resolution. Then asks about Ansible updates for .zshenv template. Session pivots to Logitech mouse Easy Switch troubleshooting and then MacBook Pro display issues. Mix of sysops investigation and hardware Q&A.
- **Key observations**:
  - CWD is brains/ but zero brain files were created/edited — all Bash commands are system inspection (displayplacer, ls, ansible). One Write + one Edit for Ansible template file.
  - Bash-heavy (16 of 21 tool calls) — system inspection pattern.
  - Multi-phase: display config (5 prompts) then hardware troubleshooting (2 prompts).

### W6-L2-04: a2e0133d — Agentic-OS Brain Update (Cloud Storage + Messaging)

- **CWD**: brains/
- **Events**: 30 | **Active**: 23 min | **Duration**: 23 min
- **Registry type**: BUILD
- **Analysed type**: KNOWLEDGE (knowledge.brain_update)
- **Opening**: keyword_orientation — "agentic-os"
- **What happened**: David opens with bare keyword to land in agentic-os context. Then asks to fix a misplaced file and document cloud storage (AWS Glacier, Backblaze, etc.) into the brain. Pivots to evaluating messaging tools (Slack, Discord, Element/Matrix) for team communication. Creates ADR for Discord decision. Adds Discord to comparison table. Pasts a WhatsApp message from Martin Puskas about Element/Matrix/Synapse.
- **Key observations**:
  - CWD is brains/ and genuine brain writes occur (Write x2, Edit x6) — confirmed KNOWLEDGE.
  - Multi-topic: cloud archiving, then messaging platform evaluation — both written into agentic-os brain.
  - Voice dictation throughout. External input: Martin Puskas WhatsApp message pasted as decision input.

### W6-L2-05: 8a7c8853 — Autoresearch Clone + Skill-Forge Creation

- **CWD**: appydave-plugins
- **Events**: 32 | **Active**: 6 min | **Duration**: 2333 min (two ~19h gaps)
- **Registry type**: BUILD
- **Analysed type**: SKILL (skill.creation)
- **Opening**: voice_dictation — asks to clone Karpathy's autoresearch repo into upstream area
- **What happened**: Phase 1 (4 min): Clones autoresearch repo, registers in source-repos.md. Phase 2 (next day, 2 min): David asks to compare autoresearch with Ralphy and think about skill improvement. Claude produces detailed analysis of the evolutionary loop pattern. Phase 3 (same response): David says "build" and Claude creates skill-forge SKILL.md (265 lines), registers in plugin.json, validates, reloads, commits.
- **Key observations**:
  - Three distinct phases across 2 days, only 6 min active. Extreme idle-to-active ratio.
  - The bulk of the session's value is Claude's long analytical stop message comparing autoresearch/Ralphy/POEM.
  - CWD is appydave-plugins and the primary deliverable IS a new skill → SKILL type confirmed.
  - Brain file also edited (source-repos.md) but secondary to skill creation.

### W6-L2-06: a9f68828 — FliHub AWB Integration Exploration

- **CWD**: flivideo/flihub
- **Events**: 33 | **Active**: 24 min | **Duration**: 3666 min (three long gaps across 3 days)
- **Registry type**: BUILD
- **Analysed type**: PLANNING (planning.architecture_exploration)
- **Opening**: voice_dictation — asks about recent changes to AWB send/resume behavior
- **What happened**: David explores the new/resume AWB record behavior, notices UX bugs (tab opens on resume), asks Claude to fix the tab-open behavior. Then a long voice prompt describes the broader vision: Git-based collaboration between David and Jan via FliHub, S3 as staging, NanoBanana skill for image generation, and observability events. Session ends 2 days later with David asking to persist findings as actionable items and commit.
- **Key observations**:
  - Although CWD is flihub (product repo) and there are 3 Edits, the bulk of the session is architectural exploration and planning discussion, not feature construction. The edits are minor bug fixes.
  - The long voice prompt (prompt 4) is the most valuable content — detailed architecture vision.
  - 3-day span with only 24 min active. Classic "thinking across days" pattern.
  - Closing ceremony: explicit "persist and commit" instruction.

### W6-L2-07: 03736413 — SupportSignal Ralphy Continuation (Task-Driven)

- **CWD**: app.supportsignal.com.au
- **Events**: 35 | **Active**: 10 min | **Duration**: 10 min
- **Registry type**: BUILD
- **Analysed type**: BUILD (build.campaign_continuation)
- **Opening**: (no visible user prompt at start — starts with tool_use Read)
- **What happened**: Session appears to be a Ralphy task continuation — starts with Read, then Skill invocation, then Task creation, then a burst of Reads + Edits + Writes. The only user prompts are "go" and "next" (confirming autonomous work). 4 unauthorized edits detected before first user prompt.
- **Key observations**:
  - This is a compaction resume or agent continuation — no opening user prompt visible, work starts immediately with reads.
  - 14 Read + 4 Edit + 2 Write on app code = genuine BUILD in product repo.
  - Unauthorized edit detection (4 count) is real — edits happened before any user prompt.
  - User prompts "go" and "next" are Ralphy-style micro-confirmations.

### W6-L2-08: 5b6065f9 — Signal Studio MVP Design Capture via Playwright

- **CWD**: app.supportsignal.com.au
- **Events**: 38 | **Active**: 10 min | **Duration**: 352 min (5h idle gap)
- **Registry type**: BUILD
- **Analysed type**: RESEARCH (research.design_capture)
- **Opening**: voice_dictation — asks to use Playwright MCP to scan localhost:6040 and analyze design aesthetics
- **What happened**: David asks Claude to connect to existing Chrome via Playwright, scan the SupportSignal MVP running locally. Claude navigates through the entire app (14 browser_click events), produces a comprehensive design aesthetics assessment and sitemap. Then David provides context about a prior report and asks for Report 2. Claude reads the prior report and writes a 537-line design capture document.
- **Key observations**:
  - Playwright-heavy (16/29 tool calls are Playwright) but NOT testing — this is design research/capture.
  - CWD is app.supportsignal but the actual Write goes to supportsignal-v2-planning/docs/design/ — the planning repo.
  - Frustration signal: "I thought I told you to resolve this properly" (re: Playwright Chrome connection issues).
  - Write deliverable: 02-signal-studio-mvp-design-capture.md (537 lines).

### W6-L2-09: 6305b5a1 — FliHub Ralphy Campaign (Autonomous Build)

- **CWD**: flivideo/flihub
- **Events**: 41 | **Active**: 20 min | **Duration**: 51 min
- **Registry type**: BUILD
- **Analysed type**: BUILD (build.campaign)
- **Opening**: (no user prompt — starts with Read tool_use directly)
- **What happened**: Autonomous Ralphy campaign execution. Starts with reads and globs, creates 3 Tasks, performs writes, then a series of 10 Edits. Only 1 user prompt: "commit this" at the end. 10 unauthorized edits detected before user prompt.
- **Key observations**:
  - Classic Ralphy autonomous build: Read→TaskCreate→Write→Edit→commit. User only confirms at end.
  - 10 Edit + 2 Write in product repo = genuine BUILD.
  - TaskCreate (3) + TaskUpdate (6) = agent orchestration with task tracking.
  - Unauthorized edit count (10) is the highest in this batch — entire session runs before user speaks.

### W6-L2-10: efb535fb — OMI Morning Triage + Brain Capture

- **CWD**: brains/
- **Events**: 46 | **Active**: 51 min | **Duration**: 51 min
- **Registry type**: BUILD
- **Analysed type**: OPERATIONS (operations.morning_triage)
- **Opening**: (first event is ToolSearch — session starts with tool activity before user prompt)
- **What happened**: Session opens with ToolSearch for OMI tool, then David asks to check OMI conversations. Claude searches for OMI skill, invokes it, then does a burst of Bash commands to fetch/process OMI data. Writes 12+ files to brain (Write x13). Later David asks about videos mentioned in OMI conversation and about the application list.
- **Key observations**:
  - CWD is brains/ and massive Write activity (13 Writes) — but this is operational morning processing, not knowledge design.
  - ToolSearch x5 early = searching for OMI tool and related skills. Not quite a skill gap (tools found eventually).
  - This is the morning triage pattern: process OMI transcripts, extract actionable items, write to brain files.
  - Voice dictation: "loom" likely meant as tool name or reference.

### W6-L2-11: 91d6c2cd — Signal Studio Skill Creation (AngeSync)

- **CWD**: signal-studio
- **Events**: 52 | **Active**: 58 min | **Duration**: 58 min
- **Registry type**: BUILD
- **Analysed type**: SKILL (skill.creation)
- **Opening**: voice_dictation — "Can you open up a file in VS Code, please?"
- **What happened**: David asks about available skills/agents in the project. Then launches into designing a new skill for Angela's feedback management — evaluating changes, decision logging, gap analysis, version tracking. Names discussed (Angry Ange, Angry Birds → AngeSync). Uses skill-creator skill to build it. Claude creates SKILL.md + supporting files. Then frustration when the skill doesn't appear in a new Claude session — deployment/registration issue. Finally commits.
- **Key observations**:
  - Frustration signals: "So I opened up a new Claude and I started typing /Angela, and there's nothing there. What have you done? This is stupid." and "I am just gobsmacked that after a month or two of using skills..."
  - Skill deployment failure is a recurring pain point — created correctly but not available in new sessions.
  - Rich voice dictation with personality: "A.G. has been flirting with the idea that Dave's a dickhead" etc.
  - Multi-phase: design discussion (prompts 1-5) → build (prompts 6-8) → debug deployment (prompts 9-10).

### W6-L2-12: 6feb59a6 — POEM Executor Build (D011 Structured Output Refactor)

- **CWD**: prompt.supportsignal.com.au
- **Events**: 56 | **Active**: 8 min | **Duration**: 56 min
- **Registry type**: BUILD
- **Analysed type**: BUILD (build.handover_execution)
- **Opening**: paste_handover — 2684-char developer handover from "Alex (Workflow Architect)"
- **What happened**: Session receives a detailed handover document specifying compiler changes for dot-notation conditions, runner changes for provider response parsing, and 16 red tests to write. Claude reads existing code, creates a Task for tracking, then executes: 16 Edits + 7 Writes across compiler, runner, and test files. User only says "commit" at end.
- **Key observations**:
  - Classic agent-driven BUILD from structured handover. Only 2 user prompts: the handover paste and "commit".
  - CWD is prompt.supportsignal which is "universally unreliable" per wave 5 learnings, but in this case the actual work IS in the poem-executor subdirectory — CWD is reliable this time.
  - Edit-heavy (16 Edits) = genuine code construction.
  - The handover format is a well-structured developer briefing with scope, deliverables, tests, and definition of done.

---

## Pattern Observations

### Registry Accuracy

- **BUILD correct**: 3/12 (W6-L2-07, W6-L2-09, W6-L2-12) = 25%
- **BUILD misclassified**: 9/12 = 75% (consistent with prior waves)
- Reclassified to: KNOWLEDGE (2), SKILL (2), SYSOPS (1), REVIEW (1), PLANNING (1), RESEARCH (1), OPERATIONS (1)

### Unauthorized Edit Pattern

- Two sessions (W6-L2-07 and W6-L2-09) have high unauthorized edit counts (4 and 10 respectively). Both are Ralphy continuations where the agent resumes autonomous work. These are not true "unauthorized" edits in the user-intent sense — the user previously authorized the campaign. The detection is technically correct but semantically misleading for campaign sessions.

### Multi-Day Sessions with Minimal Active Time

- W6-L2-05 (2333 min / 6 min active) and W6-L2-06 (3666 min / 24 min active) span multiple days with tiny active windows. These represent "thinking sessions" where David returns to a conversation days later with new direction.

### Skill Creation is a Distinct Activity

- Two sessions (W6-L2-05 and W6-L2-11) are pure skill creation. The pattern is: research/design discussion → name the skill → build SKILL.md → validate/deploy → commit. The frustration in W6-L2-11 about skill deployment suggests this is still a rough workflow.

### Playwright for Design Research (not Testing)

- W6-L2-08 uses Playwright extensively but for design capture, not testing. This confirms the wave 4 finding that Playwright semantics depend on context.

### Paste-Handover as BUILD Trigger

- W6-L2-12 shows a clean pattern: structured developer handover paste → autonomous execution → commit. The paste format ("What you need to build", "Tests to write", "Definition of done") is a well-evolved handoff protocol.
