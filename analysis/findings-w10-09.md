---
type: analysis
title: 'Findings W10-09'
description: 'Wave 10 Batch 09: 8 moderate sessions, 12.5% BUILD accuracy (lowest any wave); /loop prompt inflation + AskUserQuestion classifier patterns.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W10-09

**Wave**: 10, Batch 09
**Sessions**: 8 (all moderate)
**Analysed**: 2026-03-23
**BUILD accuracy**: 1/8 (12.5%) — lowest of any wave, driven by all-moderate batch

---

## Session Summaries

### e9fb0466 — prompt.supportsignal / moderate

**Registry**: BUILD | **Actual**: BUILD (confirmed)
**Subtype**: build.worktree_campaign

Worktree-based build campaign spanning rounds 14-16 of WUI development. User opens by asking about cross-agent delegation ("If I needed to do something in FliHub, what sort of message would you send?"), then pivots into actual build work. Heavy tool usage: 66 Bash, 29 Read, 23 Edit, 12 Agent calls. The 12 Agent dispatches indicate subagent delegation for parallel worktree work. CWD is prompt.supportsignal but actual work targets SupportSignal WUI via worktree pattern. Compaction detected (1 resume), confirming a long-running session. Duration: 135 min, 80 active.

**Key observations**:

- First prompt is about cross-agent workflow delegation — meta-question before build work begins
- 12 Agent calls = worktree campaign pattern with parallel subagent dispatches
- CWD (prompt.supportsignal) is misleading — actual work targets SupportSignal WUI via `.claude/worktrees/wui-round{N}` pattern
- Compaction resume detected — session exceeded initial context window
- Voice artifacts: conversational tone throughout, directive prompts after initial exploration

### 8f220d36 — appystack / moderate

**Registry**: BUILD | **Actual**: REVIEW (reclassified)
**Subtype**: review.consultant_qa

User explicitly frames the session as a consultant validation exercise: "I want you to come up with a list of questions. Let's say you were brought in as a consultant to validate what our software architect and our software developer have done." The 16 AskUserQuestion calls are the defining signal — Claude interviews the user systematically about AppyStack boilerplate decisions. Two compaction resumes and two idle gaps (21h and 18h) show this session spanned 3 calendar days. After the Q&A phase, Claude makes 23 Edit calls to update documentation based on answers. The edits are documentation corrections from the review, not feature construction.

**Key observations**:

- **AskUserQuestion as dominant tool profile** — 16 calls is unprecedented in the corpus. This is a structured interview, not a build session
- Compaction-induced P13+P14 co-occurrence: after one of the compaction resumes, Claude misunderstood the tab system architecture and proposed a wrong approach. The user corrected this. Compaction context loss is the likely cause
- 2107-char first prompt with @-file references — user pastes architectural context to frame the review
- 3-day session span (2492 min duration, 118 active) — longest calendar span in this batch
- Voice artifacts: "I want you to come up with a list of questions" = consultant framing

### 73dad405 — brains / moderate

**Registry**: BUILD | **Actual**: RESEARCH (reclassified)
**Subtype**: research.technical_exploration

User opens with "focus on claude-code and agent-sdk" — a terse directive to research Anthropic's Claude Code and Agent SDK capabilities. 47 Bash calls (heaviest in batch) and 32 Edit calls suggest Claude was exploring SDK source code, running commands, and writing notes into brain files. The brains/ CWD is primary — this is genuine brain knowledge capture from technical research, not incidental. Duration: 139 min, all active (no idle gaps). One Skill invocation suggests a brain-bridge or knowledge-capture skill was used to structure the output.

**Key observations**:

- brains/ CWD is primary, not incidental — file_paths would target brain knowledge files
- 47 Bash calls = heavy command-line exploration (likely npm/pip installs, SDK examples, git clones)
- 32 Edit calls = writing research findings into brain files
- Terse 35-char first prompt ("focus on claude-code and agent-sdk") — David assumes the session has prior context or the skill provides it
- Zero idle gaps — sustained 139-min deep research session

### 4ff362fe — appystack / moderate

**Registry**: BUILD | **Actual**: MIXED (reclassified)
**Subtype**: mixed.review_research_build

Three-phase session starting with a question ("If I needed to build another application with AppyStack, do we have a list of all the ports that we've currently allocated?"), moving through research/review of existing AppyStack infrastructure, then into actual build work. 48 Bash, 17 Read, 10 Edit, 6 Write, 5 Agent calls. Two idle gaps (165 min and 384 min) split the session across morning, afternoon, and evening work blocks. The search_without_read detection (4 hits) suggests Claude was searching broadly without following up on all results.

**Key observations**:

- Opening question is infrastructure review, not a build directive — "do we have a list of all the ports?"
- 5 Agent dispatches suggest subagent delegation for parallel research tasks
- Two large idle gaps (2.75h and 6.4h) create 3 distinct work phases
- 26 user prompts (highest in batch) — high-interaction, directive session
- search_without_read (4 hits) — Claude searched but didn't follow up, suggesting exploratory breadth over depth

### c9349da5 — brains / moderate

**Registry**: BUILD | **Actual**: MIXED (reclassified)
**Subtype**: mixed.orientation_mochaccino_loop

Shortest session in the batch (23 min, all active). Opens with `/who-am-i` skill invocation, then pivots to Mochaccino UI mockup exploration, then sets up a /loop heartbeat via CronCreate. The 25 user_prompt_count is inflated — approximately 15 of 25 prompts are automated /loop heartbeat pings ("say hello and give me a tiny summary"). Three subagents dispatched: 2 general-purpose and 1 Explore type. The cron_polling detection confirms /loop was active. File reads target operations.md, ansible INDEX.md, agentic-os INDEX.md, and Mochaccino skill files.

**Key observations**:

- **/loop prompt inflation**: 15 of 25 user prompts are automated heartbeat pings. This inflates user_prompt_count and makes the session appear more interactive than it actually is. AngelEye needs a /loop prompt filter
- `/who-am-i` as opener — identity/orientation skill invocation
- CronCreate (1) confirms /loop setup — cron_polling detection triggered
- 3 subagents in a 23-min session = high parallelism density
- brains/ CWD is primary — reads target brain files (operations, ansible, agentic-os)
- Bash commands include application enumeration (`ls /Applications/*.app`) and OMI API key checks — suggests environment discovery

### 4f7716c8 — brains / moderate

**Registry**: BUILD | **Actual**: KNOWLEDGE (reclassified)
**Subtype**: knowledge.omi_ingestion_and_research

User asks Claude to find and download an OMI conversation ("You're using the OMI device. We've just done a conversation this morning"). Session has two phases: (1) OMI transcript fetch and ingestion into brain structure, (2) background research via 6 Agent dispatches. 23 Read, 21 Edit, 8 Write calls show substantial brain file creation/modification. Three Skill invocations (likely omi-fetch, brain-bridge). The 234-min idle gap splits the session into a pre-dawn OMI ingestion phase and an early-morning research phase. Compaction resume detected.

**Key observations**:

- 6 Agent dispatches = 5 background research subagents plus 1 other — highest agent count in batch
- OMI ingestion pipeline: OMI API fetch -> transcript parse -> brain file routing (todo/backlog/inbox/TIL)
- brains/ CWD is primary — OMI transcripts are ingested into the brain knowledge structure
- 3 Skill invocations suggest structured workflow (omi-fetch -> brain-bridge -> knowledge-capture)
- Voice-dictated opener: "You're using the OMI device" — David speaks to Claude as if briefing a colleague
- 234-min idle gap = pre-dawn session, then morning continuation

### 134e47bc — app.supportsignal / moderate

**Registry**: BUILD | **Actual**: PLANNING (reclassified)
**Subtype**: planning.architecture_course_correction

Opens with `/bmad-architect` skill invocation. Session is a BMAD architecture course-correction for SupportSignal v2. 33 Read calls (heaviest Read ratio in batch) show extensive review of existing planning artifacts: PRD, epics, architecture, UX design spec, implementation readiness report. 18 Edit calls target planning artifacts, not application code. Writes include a sprint change proposal and a memory file (feedback_no_abridge_planning.md — user told Claude not to abridge planning content). One "abridge" subagent dispatched. One Playwright browser_navigate call suggests checking the live app.

**Key observations**:

- `/bmad-architect` opener confirms skill_invocation opening style for BMAD planning sessions
- All 18 edits target `_bmad-output/planning-artifacts/` — zero application code touched
- feedback_no_abridge_planning.md = user corrected Claude's behavior and it was stored as memory
- Sprint change proposal written — this is planning output, not build output
- "abridge" subagent type is novel — purpose is to summarize/condense planning artifacts
- CWD (app.supportsignal) is reliable — file paths confirm SupportSignal planning work

### 26171bb1 — brains / moderate

**Registry**: BUILD | **Actual**: OPERATIONS (reclassified)
**Subtype**: operations.infrastructure_security

Opens with `/focus ansible` — a skill or directive to focus on Ansible infrastructure. Session spans 3 calendar days (2506 min duration, 96 active). 34 Bash calls are infrastructure commands: ls/cat/diff/grep on ansible inventory files, SSH config inspection, git status checks. File reads target ansible brain docs, agentic-os communication architecture, and ansible inventory host_vars. Edits target ansible inventory templates, README, and communication architecture docs. The Bash commands reveal PII: real hostnames (mac-mini-jan), Tailscale IPs (100.109.65.\*), SSH aliases, and team member names.

**Key observations**:

- **PII in JSONL data**: Real names, IPs, SSH aliases, and host identifiers visible in bash_commands_sample. AngelEye PII detection should flag sessions with infrastructure commands
- `/focus ansible` opener — directive focus command, not a skill invocation
- Public/private sibling repo pattern: `inventory/` (sanitized, committed) vs `inventory-private/` (real data, gitignored). Session reviews and updates both
- `git filter-repo` usage detected in bash history — PII scrubbing from public repo history
- brains/ CWD is primary — edits target brain and agent-os files
- Memory file written: team-people.md — records team member details for future sessions
- 2281-min idle gap (38 hours) between day 1 and day 3 — session left open across a weekend

---

## Cross-Session Patterns

### BUILD accuracy: 1/8 (12.5%)

Lowest accuracy of any wave. All 8 sessions are moderate complexity, and only 1 (e9fb0466) is confirmed BUILD. This challenges the earlier hypothesis that BUILD accuracy scales with session complexity — moderate sessions are not significantly more likely to be BUILD than light/micro ones. The registry's default BUILD classification is unreliable across all complexity bands.

### /loop prompt inflation (new pattern)

Session c9349da5 demonstrates that /loop heartbeat pings inflate user_prompt_count. Of 25 prompts, approximately 15 are automated "say hello and give me a tiny summary" pings. This creates a false signal of high interactivity. AngelEye should:

1. Detect /loop heartbeat prompts by their repetitive pattern
2. Report both raw and filtered prompt counts
3. Flag sessions where >50% of prompts are automated

### AskUserQuestion as tool profile signal (new pattern)

Session 8f220d36 has 16 AskUserQuestion calls — a structured interview pattern not seen before. When AskUserQuestion is the dominant non-Read tool, the session is almost certainly REVIEW (consultant Q&A), not BUILD. This is a strong classification signal.

### Compaction-induced friction (P13+P14 co-occurrence)

Session 8f220d36 shows P13 (misunderstood_request) and P14 (wrong_approach) after a compaction resume. Claude lost context about the tab system architecture during compaction and proposed an incorrect approach. This confirms compaction as a friction source — not just a session management event.

### PII in session data

Session 26171bb1 contains real hostnames, Tailscale IPs, SSH aliases, and team member names in bash command samples. Infrastructure sessions are high-risk for PII leakage into JSONL files. AngelEye should flag sessions with infrastructure-related bash patterns (ssh, ansible, inventory, host_vars) for PII review.

### brains/ CWD reliability

Of 4 brains/ CWD sessions in this batch, all 4 are primary (not incidental). This contrasts with wave 9 where brains/ CWD was consistently incidental for micro sessions. The difference: moderate sessions in brains/ tend to involve actual brain file work (research, knowledge capture, operations), while micro sessions from brains/ are ad-hoc questions. CWD reliability correlates with session scale for brains/ specifically.

### Voice artifacts catalog additions

- "the OMI device" — natural speech reference to wearable hardware
- "/focus ansible" — voice-spoken directive, not a registered skill name
- "@raw.txt" — voice user referencing file attachment syntax
- "Hang on" / "go" — approval/correction micro-prompts (wave 9 pattern continues)

### New subtype proposals (8)

1. **build.worktree_campaign** — Multi-round worktree-based build with subagent dispatches
2. **review.consultant_qa** — Structured consultant interview using AskUserQuestion
3. **research.technical_exploration** — Deep SDK/API research with brain file capture
4. **mixed.review_research_build** — Multi-phase session spanning review, research, and build
5. **mixed.orientation_mochaccino_loop** — Orientation + UI mockup + /loop setup
6. **knowledge.omi_ingestion_and_research** — OMI transcript fetch + brain routing + research agents
7. **planning.architecture_course_correction** — BMAD architect workflow for course-correcting planning artifacts
8. **operations.infrastructure_security** — Ansible infrastructure review with PII scrubbing

### Session duration extremes

This batch shows extreme duration variance: c9349da5 is 23 minutes (all active), while 26171bb1 spans 2506 minutes (41.8 hours) with only 96 minutes active. The 8f220d36 session spans 2492 minutes across 3 calendar days. Long-duration sessions with large idle gaps are effectively multi-day sessions reused by resuming — they should be treated as multiple logical sessions for analysis purposes.
