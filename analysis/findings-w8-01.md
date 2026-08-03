---
type: analysis
title: 'Findings W8-01'
description: 'Wave 8 batch 01 analysis of 9 sessions — 11% BUILD accuracy, Playwright documentation_verification role (4th semantic), cross-session knowledge transfer, 6 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W8-01

Wave 8, Batch 01 — 9 sessions analysed (2026-03-23).

## Batch Overview

| Session ID | Project           | Registry Type | Analysed Type | Scale    | Interest |
| ---------- | ----------------- | ------------- | ------------- | -------- | -------- |
| 79c7317b   | signal-studio     | BUILD         | BUILD         | heavy    | high     |
| 042f3f13   | app.supportsignal | BUILD         | PLANNING      | moderate | high     |
| 085f085c   | brains            | BUILD         | MIXED         | moderate | high     |
| cfc63f23   | appystack         | BUILD         | KNOWLEDGE     | moderate | high     |
| 895ef55e   | kgems             | BUILD         | RESEARCH      | moderate | medium   |
| 72b40144   | flihub            | BUILD         | KNOWLEDGE     | light    | medium   |
| 0c47ba35   | brains            | BUILD         | KNOWLEDGE     | light    | medium   |
| 379ecf4c   | ad                | BUILD         | OPERATIONS    | light    | low      |
| 0bd1e0d7   | flivoice          | BUILD         | REVIEW        | micro    | medium   |

**BUILD accuracy: 1/9 (11%)** — consistent with wave 6-7 patterns. Only 79c7317b is genuine BUILD.

---

## Session Observations

### 79c7317b — signal-studio (BUILD, heavy)

**Type**: BUILD confirmed. This is a genuine build.campaign session — Wave 18 data infrastructure campaign for Signal Studio. The session plans, discusses, and executes a Ralphy build campaign including new routes, components, and infrastructure fixes.

**Key observations**:

1. **Multi-phase session with compaction survival**: Two compaction resumes detected. The session spans planning (data contexts, schema, integrity checker discussion), building (Wave 18 via Ralphy), and infrastructure fixing (AppError.ts, dotenv, rateLimiter). Three distinct phases.
2. **Frustration signal at end**: User explicitly frustrated at line 317 — "What I want is a fucking answer to the question of why it took two hours" and "I don't have any faith that it's working." Root cause: Claude ran E2E tests autonomously for ~2 hours without progress updates. User also challenged why Playwright MCP wasn't used instead of headless Playwright tests.
3. **Background agent spawned for cross-project work**: An Agent call dispatched to write a Zod schema recipe in AppyStack — cross-project work within a signal-studio session.
4. **Unauthorized edit detected**: 1 edit before first prompt (auto-context loading from compaction resume).
5. **Voice dictation pervasive**: "We will count you" likely means "We'll count on you"; "development I" = "development mode"; "scerne" = "scene".

### 042f3f13 — app.supportsignal (PLANNING, moderate)

**Type**: PLANNING, not BUILD. No feature code is created. The entire session is about SupportSignal v2 planning — domain model review, mermaid diagram generation, JSON/YAML source-of-truth discussions, and documentation rendering workflows.

**Key observations**:

1. **CWD misleading**: CWD is app.supportsignal but actual work targets `supportsignal-v2-planning/` repo (a separate standalone planning repo). CWD is unreliable for this session.
2. **Mermaid rendering pain loop**: User repeatedly reports diagrams not rendering or being too small. "Hang on, you've done it, but you've gone back to that same horizontal problem, and I can't read it." — Claude fails to fix this across 3+ iterations (P15 buggy_output confirmed).
3. **Background Task orchestration**: 8 Task calls — the heaviest Task usage in this batch. User delegates broad architectural work to background agents: "go into background agents around each of the issues."
4. **Playwright used for documentation verification**: Not testing, not research — verifying that rendered HTML/mermaid output displays correctly. This is a 4th Playwright semantic role: documentation_verification.
5. **22-hour idle gap**: Only ~1.5h active across a 23h span. Day 1 was a brief handover paste; Day 2 was the real work.
6. **Compaction resume detected**: 1 compaction. Post-compaction, session picked up cleanly.

### 085f085c — brains (MIXED, moderate)

**Type**: MIXED — genuinely multi-phase with at least 3 distinct activity types. Phase 1: Ecamm Live API usage (OPERATIONS — controlling scene switches via HTTP API, debugging Bonjour discovery). Phase 2: Brain curation (KNOWLEDGE — writing ecamm-api-v4-reference.md, ecamm-appydave-show.md, ecamm-bitfocus-companion.md). Phase 3: CLAUDE.md and brain maintenance (META/KNOWLEDGE — rewriting ~/.claude/CLAUDE.md, refreshing anthropic-claude brain).

**Key observations**:

1. **Three distinct phases spanning different domains**: Ecamm automation → Ecamm brain curation → Claude Code meta-configuration. A single label loses significant information.
2. **Skill invocations**: 3 Skill calls (ecamm, brand-dave:refresh-claude-brain, plus one more). Skills are used for both operational control and knowledge curation.
3. **Bug fix inline**: Discovery bug in ecamm_api.py (subprocess.run → Popen fix) was identified and fixed mid-session. This is a DEBUG micro-phase embedded within OPERATIONS.
4. **Brave web search used**: 4 web searches — researching Ecamm Live port locking, Claude Code release notes, Bitfocus Companion architecture.
5. **User frustration about built-in commands**: "Relate stats is not a Richardson skill; it's built into Claude. Tells you what's going on in Claude. What the hell are you doing?" — Claude confused built-in commands (/stats, /release-notes) with skills. P14 wrong_approach confirmed.
6. **Compaction resume**: 1 compaction with extremely detailed summary.
7. **Session ends with "Are we finished with this conversation, and why do we have two bash shells going?"** — stale process cleanup concern.

### cfc63f23 — appystack (KNOWLEDGE, moderate)

**Type**: KNOWLEDGE (knowledge.recipe_design). No code is built for a product feature. The entire session is about understanding, auditing, and improving the AppyStack recipe system — specifically creating appydave-palette.md, wizard-shell.md reference files, and building a palette gallery.

**Key observations**:

1. **CWD reliable**: File paths confirm all work targets appystack template/docs.
2. **Cross-project research**: Session reads from signal-studio memory files, prompt.supportsignal WUI designs, and AngelEye .mochaccino designs to synthesize into AppyStack recipe references. This is knowledge transfer/curation, not BUILD.
3. **Long idle gap (12h)**: 53 active minutes across 13h span. First phase explored recipes and design history. Second phase (12h later) was a paste-handover with design knowledge from another session, then wizard-shell recipe was written.
4. **Paste-handover as second opener**: The second phase starts with a massive paste of design knowledge analysis — user copying findings from another conversation. Cross-session reference confirmed.
5. **Claude pushes back on approach**: "Honestly — not quite" when user asks if palette recipe alone would be enough. High-quality advisory interaction.
6. **File-touch confirms NOT BUILD**: All writes target recipe/reference markdown files and docs/, not product source code.

### 895ef55e — kgems (RESEARCH, moderate)

**Type**: RESEARCH (research.codebase_archaeology). User is trying to find and understand the Klueless klue-watcher tool across two repos (kgems and klueless). No feature construction — pure investigation.

**Key observations**:

1. **Task-based parallel search**: 2 Task calls for parallel search across kgems and klueless repos. Efficient research pattern.
2. **High Bash ratio**: 58/75 tool calls are Bash — typical of codebase exploration.
3. **User pastes terminal error output**: Prompt at line 75 is a full stack trace from running klue-langcraft watcher. User is debugging a CLI tool interactively.
4. **"Klue lane craft" voice artifact**: "Klue lane craft" = "klue-langcraft". New voice dictation catalog entry.
5. **No writes/edits at all**: Pure read-only research session. Zero feature construction.
6. **Only 6 user prompts**: Extremely low interaction density — user asks broad questions, Claude does extensive autonomous exploration.

### 72b40144 — flihub (KNOWLEDGE, light)

**Type**: KNOWLEDGE (knowledge.transcript_cleanup). Not BUILD. The session has only 2 prompts: first is context loading (7 unauthorized edits before first prompt — these are reads from the JSONL pre-computed), then user pastes a 20K-char video transcript with timestamps, asking why it has timestamps and reporting bugs. Claude edits the transcript file(s) to clean up. Second prompt asks for a "handover for the PO."

**Key observations**:

1. **Context-loading paste as opener**: 20K character paste containing a full YouTube video transcript with SRT-style timestamps. User wants it cleaned to raw text.
2. **7 unauthorized edits detected**: Pre-computed shape flags this, but these are likely auto-context edits from the start of session, not true unauthorized edits. The session starts with Read/Edit/Grep before any user prompt appears.
3. **"Vibrating applications" voice artifact**: "I've been vibrating applications" = "I've been vibe-coding applications". Excellent new voice dictation artifact.
4. **Short session, clear deliverable**: 11 minutes, 2 prompts, clean knowledge curation task.

### 0c47ba35 — brains (KNOWLEDGE, light)

**Type**: KNOWLEDGE (knowledge.brain_update). User asks about CLAUDE.md best practices, Claude searches brain, fetches web resources (5 WebFetch calls), creates a best-practices doc in the brain, audits existing CLAUDE.md files, makes edits, and commits.

**Key observations**:

1. **WebFetch-heavy**: 5 WebFetch calls — fetching Anthropic best practices article and related docs. Research-then-curate pattern.
2. **Clear knowledge creation workflow**: Search brain → find gap → fetch external → create doc → audit existing → improve → commit. Textbook knowledge.brain_update.
3. **Brain file writes confirmed**: Write(1) + Edit(4) to brain files. Has_brain_file_writes = true.
4. **Clean closing**: "commit this" — clean commit_and_push closing style.
5. **Voice dictation artifacts**: "ClaudeMD" = "CLAUDE.md". Minor.

### 379ecf4c — ad (OPERATIONS, light)

**Type**: OPERATIONS (operations.repo_scaffolding). User asks to create simple README files for agent-os and apps folders. Claude creates 2 Write files and asks questions. Then a 22-min idle gap followed by "Did we have a name for the stacks we were going to build?" and "x" (abrupt close).

**Key observations**:

1. **CWD is monorepo root**: `/dev/ad` — confirmed incidental. Work targets specific subdirectories.
2. **Minimal session**: 10 events, 4 prompts, 2 Writes, 4 Bash. One of the lightest non-micro sessions.
3. **"x" as session terminator**: User types "x" to close session. New closing style observed — deliberate abrupt close.
4. **Voice dictation**: "Project Theodore" / "movie Her" references — user explaining agent-os architecture conceptually.
5. **Not BUILD**: Writing README stubs is repo scaffolding/documentation, not feature construction.

### 0bd1e0d7 — flivoice (REVIEW, micro)

**Type**: REVIEW (review.post_mortem). The first prompt is a massive paste (12.5K chars) of a previous session's full terminal output — user asking "did the following get documented and filed away correctly?" The paste contains a prior session's post-mortem analysis and Claude's outputs. The second prompt asks to write a new requirements document based on the post-mortem learnings.

**Key observations**:

1. **Cross-session verification**: User pastes an entire prior session's output to verify it was captured correctly. This is a bookend verification + continuation hybrid.
2. **Paste-as-opener dominates**: 12.5K char first prompt is 99% paste from another session (including ASCII art terminal banners). The actual user question is a single sentence.
3. **Knowledge deliverable**: The Write(1) creates a new requirements document based on post-mortem learnings. This is synthesis from prior session output.
4. **2 minutes active**: Extremely short — user pastes, Claude reads existing docs, writes the requirements doc.

---

## Cross-Session Patterns

### BUILD Misclassification (continued)

- **1/9 sessions correctly classified as BUILD (11%)** — consistent with wave 6 (17.5%) and wave 7 (22%) averages.
- The single confirmed BUILD (79c7317b) is heavy-scale with Ralphy campaign, Agent calls, and substantial Edit/Write activity on product code.
- All other 8 sessions were misclassified. Root causes: brains CWD (085f085c, 0c47ba35), monorepo root CWD (379ecf4c), planning repo work (042f3f13), recipe knowledge curation (cfc63f23), read-only research (895ef55e), transcript cleanup (72b40144), cross-session review (0bd1e0d7).

### New Friction Predicates (P13-P16 Trial)

- **P13 has_misunderstood_request**: Not clearly observed in this batch.
- **P14 has_wrong_approach**: Confirmed in 085f085c (Claude confused built-in commands with skills).
- **P15 has_buggy_output**: Confirmed in 042f3f13 (mermaid diagrams repeatedly failing to render correctly across 3+ iterations).
- **P16 has_excessive_changes**: Not clearly observed. The batch doesn't have "revert" or "too much" signals.

### Voice Dictation Artifacts (new)

- "vibrating applications" = "vibe-coding applications" (72b40144)
- "Klue lane craft" = "klue-langcraft" (895ef55e)
- "Relate stats" = "/release /stats" (085f085c)
- "scerne" = "scene" (085f085c)
- "development I" = "development mode" (79c7317b)

### Playwright Semantic Role #4 Confirmed

- 042f3f13 uses Playwright for documentation_verification — checking that rendered HTML/mermaid output displays correctly. This joins: ui_audit, external_research, uat_testing as the 4th confirmed role.

### Cross-Session Knowledge Transfer Pattern

- cfc63f23 and 0bd1e0d7 both involve pasting content from other sessions as the foundation for the current session's work. This is a knowledge-transfer workflow that spans session boundaries — the session itself is a synthesis/curation step in a multi-session pipeline.

### New Subtypes Proposed

- `knowledge.recipe_design` (cfc63f23) — designing/writing recipe reference files, distinct from brain_update
- `research.codebase_archaeology` (895ef55e) — digging through old code to understand prior work
- `review.post_mortem` (0bd1e0d7) — reviewing and synthesizing from prior session failures
- `operations.repo_scaffolding` (379ecf4c) — creating basic repo structure files
- `planning.domain_modelling` (042f3f13) — domain model, schema, and documentation architecture
- `knowledge.transcript_cleanup` (72b40144) — cleaning/editing transcript content
