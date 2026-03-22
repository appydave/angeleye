# Findings — Wave 6 Heavy-1 (5 sessions, 229-247 events)

**Wave**: W6-heavy-1
**Date**: 2026-03-22
**Sessions analysed**: 5
**Scale**: All heavy (229-247 events)

---

## Session W6-H01 — FliHub Relay Refactor Campaign (cda1edc2)

**Project**: flihub | **CWD**: `/dev/ad/flivideo/flihub` | **Duration**: 31 min active | **Events**: 229

**Summary**: A /ralphy-initiated build campaign session. Opened with `/ralphy "Continue from the next-round brief — Extend mode, plan wave 2."` The session planned and executed a full 3-wave relay collaboration refactor: wave 1 (relay-foundation + relay-folder-browser), wave 2 (push-collect-full + promote-to-final), wave 3 (role-based-visibility + visual-indicators). 7 subagents dispatched — 1 Explore agent for codebase reconnaissance, 6 general-purpose agents for parallel work unit execution. All 840 tests passing at end. Session ends with user frustration about persistent "manage and export" UI noise.

**Observations**:

- Classic Ralphy campaign: IMPLEMENTATION_PLAN.md read, work units dispatched to parallel agents, plan updated on completion. Despite ralphy_mode detection being false in the shape (no explicit /ralphy skill invocation recorded by hook — the prompt contains `/ralphy` but skill_invocations is null), the behavioral pattern is textbook campaign.
- 7 prompts driving 202 tool calls = extreme automation ratio (28.9 tools/prompt). The human barely intervenes; agents do the work.
- Frustration at session end: "I don't know why I keep seeing [manage and export]... I don't know why I have to keep fighting you on this." Persistent UX debt causing repeated friction across sessions.
- Closing action: Write a `flihub-feedback.md` file to capture UI frustration, then dispatches code-quality-audit + test-quality-audit tasks. Clean closing ceremony despite frustration.

---

## Session W6-H02 — Signal Studio Multi-Wave Build (233c15fd)

**Project**: signal-studio | **CWD**: `/dev/clients/supportsignal/signal-studio` | **Duration**: 336 min (176 active, 159 min idle gap) | **Events**: 229

**Summary**: A compaction-resume BUILD session across signal-studio. Opens with what appears to be a continuation — the first recorded user_prompt is "2" (a menu selection) preceded by auto-loading Globs/Reads, suggesting the session starts after a compaction where context was re-established. The first real content prompt discusses data context architecture, company admin concepts, and UAT data management. Heavy Edit-dominant tool profile (94 Edits, 34 Reads, 20 Agents). 11 Playwright calls indicate visual QA was part of the workflow.

**Observations**:

- Multi-phase session: Phase 1 (08:23-09:01) — active building with Agent-dispatched edits. 159-minute idle gap. Phase 2 (11:41-13:59) — resumed with backlog cleanup, visual QA, UI feedback, and data environment discussion.
- Voice dictation pervasive: "roughy loop" = Ralphy loop, "Ever actually said SS Circle on the right" = natural speech transcription artifact.
- Frustration signal at prompt 224: "NO THIS DOES NOT WORK" (caps) regarding data environment switching — UAT vs Integration vs Production data confusion.
- Closing: "Can I go into a new conversation and just start a roughy loop, or do you need to persist anything first?" — clean handoff intent, session chains forward to a Ralphy build session.
- The file_paths read/write/edit arrays are empty in the shape data despite 94 Edits — this is a transcript-source session (no hook data for file paths). The shape detector may not extract paths from transcript-source events.

---

## Session W6-H03 — Ansible Remote Provisioning + Team Setup (120c7392)

**Project**: brains (CWD), actual work on agent-os/ansible + brains/team | **CWD**: `/dev/ad/brains` | **Duration**: 108 min active | **Events**: 238

**Summary**: Highly conversational operations session (64 user_prompts — the highest in this batch). Started with retrieving prior work on repo git status, then pivoted to Ansible provisioning of Mary's and Jan's remote Mac Minis via Tailscale. Real-time troubleshooting with live paste-back of terminal output. Created new `brains/team/` brain for team member data. Ends with web research (13 brave_web_search calls) investigating software tools and configurations.

**Observations**:

- Multi-phase session with 3 distinct phases:
  - Phase 1 (08:02-08:09): Orientation — retrieving prior git audit work, pivoting to Ansible focus
  - Phase 2 (08:10-08:55): Operations — live SSH troubleshooting, Ansible provisioning of Mary and Jan, team brain creation. David is relaying real-time terminal output and error messages. Classic "human-as-hands" pattern where Claude guides and David executes on remote machines.
  - Phase 3 (08:55-09:51): Research/configuration — Editing inventory files, investigating Homebrew packages via brave_web_search, updating ansible configurations
- CWD is incidental: brains/ is the terminal home, but all meaningful edits target agent-os/ansible/ and brains/team/. Project attribution via CWD would be wrong.
- Voice dictation artifacts: "Tau Scale" = Tailscale, "Ignore the typo from my voice dictation" — explicit awareness of dictation errors.
- Frustration: "No, you've totally misunderstood me" and "Okay, you lie" — real-time debugging frustration when Claude misinterprets the user's report (file not found on Mary's machine interpreted as SSH failure).
- Team PII handling: Full names, birthdays, email addresses, Tailscale IPs shared in plain text prompts. The brains/team/ brain was created as private, but the session JSONL contains all this sensitive data. Privacy concern for AngelEye.

---

## Session W6-H04 — SupportSignal BMAD Architecture (Winston) (3701e9b8)

**Project**: app.supportsignal.com.au | **CWD**: `/dev/clients/supportsignal/app.supportsignal.com.au` | **Duration**: 251 min (205 active) | **Events**: 239

**Summary**: A BMAD oversight session. Opened with `/bmad-oversight` skill invocation. The entire session is David running Winston (the BMAD architect persona) in a separate Claude window and pasting Winston's output into this oversight session for review and correction. This is a pure advisory session — Claude acts as a QA/oversight layer reviewing another agent's architecture decisions for SupportSignal v2. Covers the full 8-step architecture workflow: context analysis, starter template evaluation (Next.js vs Vite decision), core architectural decisions, project structure, validation.

**Observations**:

- Advisory role confirmed: 43 user_prompts, 142 tool calls, but the primary interaction pattern is paste-back review. Most user_prompts are large pastes of Winston's output, and Claude's responses are correction-and-paste-back instructions.
- Read-heavy tool profile (67 Reads) despite being advisory — Claude reads source documents to verify Winston's claims (PRD, UX spec, engineering principles, POEM workflow files, domain model).
- Search-without-read detected (7 instances) — exploring prompt.supportsignal.com.au structure to verify POEM integration claims.
- Key correction patterns: Claude catches mobile-browser NFR sneaking in (out of scope), Next.js assumption before decision, missing schema files for v1 entities. This is the oversight pattern working as designed.
- CWD is partially reliable: app.supportsignal.com.au is the project, but file touches span 4 repos (app, supportsignal-v2-planning, prompt.supportsignal.com.au, and memory files). The project_inference reports `/Users/davidcruwys` which is wrong — actual project is supportsignal ecosystem.
- Memory write closing: Edits MEMORY.md + creates bmad-planning-state.md. Explicit ceremony to persist Winston session state for the next BMAD phase (Bob — Epic creation).

---

## Session W6-H05 — AngelEye Session Intelligence Research (ae9b4bb4)

**Project**: angeleye | **CWD**: `/dev/ad/apps/angeleye` | **Duration**: 132 min (95 active) | **Events**: 247

**Summary**: A meta-recursive RESEARCH session. AngelEye CWD, with the primary work being deep analysis of 5 other sessions to extract conversation patterns for future visualization. Launched 8 parallel background agents to analyze sessions. Pivoted from session analysis to investigating the POEM slide pipeline (how prior presentations were built), then to understanding the data pipeline for turning conversation patterns into infographics. Created documentation in SupportSignal's wall-of-text/ folder and updated AngelEye memory files.

**Observations**:

- Multi-phase (3 phases):
  - Phase 1 (12:25-12:47): Agent dispatch — 5 background agents analysing sessions, 2 more agents synthesizing results and writing BMAD brain docs.
  - Phase 2 (12:47-13:45): Pipeline investigation — exploring POEM slides, FliDeck presentations, Solo Deck style system, gather vs brain-bridge skills. Significant confusion and correction cycles.
  - Phase 3 (14:25-14:38): Closing ceremony — pipeline understanding documented, memory files updated, knowledge persistence verified.
- Frustration escalation: "I'm telling you really fucking clearly" — Claude repeatedly misunderstood the wall-of-text-to-infographic pipeline. The user had to explain 3 times that the pipeline is raw text → pattern filter → semantic JSON → images. Claude kept hallucinating Claude.ai/Sonnet involvement.
- Cross-project file touches: Edits hit angeleye/ (BACKLOG.md, ObserverView.tsx, memory), brains/bmad-method/ (INDEX.md, session-observations.md), and supportsignal/ (wall-of-text files). CWD is angeleye but work products land in 3 repos.
- Meta-recursive: This is an AngelEye session about analysing sessions — the exact pattern AngelEye is designed to understand. The 8 conversation patterns discovered (User Accept, User Answer, User Correct, User Orient, User Invoke, AI Question, AI Structured Output, AI Proactive Offer) are directly relevant to AngelEye's own classification framework.
- 8 subagents (all general-purpose) — the most in this batch. Heavy delegation pattern: human sets direction, agents execute research in parallel, human reviews and corrects synthesis.
- Closing ceremony: Explicit "will I have lost any knowledge" prompt triggers memory file creation (project_angeleye.md, project_supportsignal_visualization.md) and MEMORY.md update. Thorough persistence ritual.

---

## Cross-Session Observations

### 1. Frustration is universal in heavy sessions

All 5 sessions contain frustration signals. The triggers vary: persistent UX debt (H01), data environment confusion (H02), Claude misinterpreting user reports (H03), nothing to correct but monitoring (H04 — lowest frustration), and repeated misunderstanding of a conceptual pipeline (H05). Heavy sessions generate frustration through accumulation — by the time 200+ events have passed, patience is thinner.

### 2. Advisory pattern (H04) is a distinct session type

The BMAD oversight session is unlike any of the other 4. The user is not building, researching, or operating — they are reviewing another AI agent's output and providing corrections. The tool profile (Read-heavy, few Edits) and prompt pattern (large paste-ins followed by structured correction instructions) are distinctive. This is `knowledge.advisory` confirmed at heavy scale.

### 3. CWD unreliability scales with session complexity

H03 (brains → agent-os), H04 (app.supportsignal → 4 repos), H05 (angeleye → 3 repos) all show CWD mismatch. In heavy sessions, work naturally spans multiple repositories. The heavier the session, the less reliable CWD becomes for project attribution.

### 4. Voice dictation errors cause real misinterpretation

H03: "Tau Scale" → Tailscale caused no confusion because context was clear. But "Okay, you lie" was a voice artifact for expressing surprise — Claude interpreted it literally and over-corrected. Voice dictation artifacts in heavy sessions compound because the human is speaking faster (tired, impatient) and Claude has more opportunities to misinterpret.

### 5. Subagent heavy sessions have distinct orchestration patterns

H01 (7 agents, Ralphy campaign), H05 (8 agents, research dispatch): Both use the pattern of "dispatch agents, wait for results, synthesize." H04 uses 5 Explore agents for background reads. The orchestration overhead (Agent tool calls, task notifications) dominates the event count but carries very little analytical signal — the real content is in the user prompts and the agent result summaries.

### 6. PII in session JSONL

H03 contains full names, birthdays, email addresses, and Tailscale IP addresses in plain text. AngelEye sessions containing PII need detection and masking in any analysis pipeline. This is a privacy concern for any future session sharing or indexing feature.
