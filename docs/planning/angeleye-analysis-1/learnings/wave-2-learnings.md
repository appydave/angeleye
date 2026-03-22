# Wave 2 Learnings

**Wave**: 2 (20 sessions across 4 sub-waves: 2a Ralphy, 2b Brains, 2c Skills, 2d Unseen projects)
**Date**: 2026-03-22

## Application Learnings

### BUILD over-classification: nuanced, not universal

Wave 1 found 86% of BUILD classifications wrong. Wave 2 adds nuance: **it depends on the project type**.

| Project type                                         | Sessions | BUILD correct?                                                |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------- |
| Product repos (flihub, angeleye, flideck, prompt.ss) | 8        | 7/8 correct (88%) — BUILD is actually right for product repos |
| Brains repos                                         | 5        | 0/5 correct (0%) — always wrong for knowledge work            |
| Skill-invocation sessions                            | 5        | 1/5 correct (20%) — skills mislead the classifier             |
| Planning repos                                       | 1        | 0/1 correct — planning work misread as BUILD                  |
| Junk                                                 | 1        | N/A — correctly flagged is_junk                               |

**Key insight**: The classifier isn't universally broken — it's wrong for non-product-code projects. A project_dir guard (is this a product codebase or a knowledge/planning repo?) would fix ~60% of misclassifications.

### Ralphy mode detection works

All 5 Group A Ralphy sessions (W2-01 through W2-05) were correctly identified as `build.campaign`. Ralphy Mode 3 (Build) has a distinctive fingerprint:

- `/ralphy` skill invocation in first 5 events
- Multiple Agent/Task tool calls for parallel work
- IMPLEMENTATION_PLAN.md read/write pattern
- Worktree usage (`.worktrees/` in CWD)
- Quality audit offer at end

W2-20 (flideck) is the strongest Ralphy Mode 3 example: 47 hours, 4 context compactions, 519 slides migrated.

Ralphy has 3 modes — Plan/Extend (RESEARCH/ORIENTATION), Build (BUILD), Requirements (ORIENTATION). Only Build mode is BUILD.

### Brain subfolder detection confirmed

All 5 brains sessions (W2-06 through W2-10) correctly identified which brain:

- W2-06: bmad-method
- W2-07: cole-medin
- W2-08: agentic-os
- W2-09: false positive — not actually a brains session (renaming files in Downloads)
- W2-10: multi-brain (port registry across several brains)

**project_dir=brains is too broad**. The brain subfolder is the real signal. W2-09 proves project_dir alone is unreliable — the session ran from brains/ but touched zero brain files.

### Skill name strongly predicts session type

Cross-referencing with skill-usage-audit.json confirmed:

- `/ralphy` → BUILD (always)
- `/bmad-create-prd`, `/bmad-create-epics`, `/bmad-create-story` → KNOWLEDGE (skill authoring, pattern design, requirements)
- `/focus` + `/radar` → ORIENTATION (morning triage)
- `/flivideo:dev` → BUILD (product development)
- `/rename-images` → OPERATIONS (utility, not BUILD)
- `/bmad-architect` → could be BUILD or KNOWLEDGE depending on whether code follows

The specific skill matters more than the generic "skill invoked in first 5 events" signal.

### New parent type proposed: PLANNING

W2-19 (supportsignal-v2-planning) doesn't fit any existing parent type cleanly. It's a pure planning repo with:

- No product code
- Strategic decisions about architecture and build order
- Cross-referencing BMAD outputs against planning docs
- Explicit decision writeback to planning documents

PLANNING as a 7th parent type (alongside BUILD, TEST, RESEARCH, KNOWLEDGE, OPERATIONS, ORIENTATION) would capture sessions where the primary activity is architectural decision-making and planning document maintenance.

### 21 subtype candidates accumulated

From 28 sessions across waves 1-2, 21 distinct subtypes emerged. The strongest signals (appearing 2+ times):

- `build.campaign` (6 sessions) — Ralphy Mode 3 autonomous campaigns
- `orientation.cold_start` (2) — first-time project exploration
- `build.migration` (2) — structured migration campaigns with verification
- `knowledge.advisory` (2) — persistent advisor reviewing other sessions' work
- `knowledge.brain_update` (2) — updating brain files with new information

### Voice transcription is universal

All 28 sessions show voice-transcribed prompts. This is not a subset — it's how David works. Voice artifacts include:

- Typos from speech-to-text ("somthing", "Mocaccino", "A10" for N8N)
- Conversational phrasing with asides and corrections
- Repeated prompts from voice input duplication (W2-20: same question 3x)
- "Damn speech recognition" frustration (W2-17)

**Implication for the classifier**: Voice input means first_real_prompt will always contain transcription artifacts. Pattern matching on prompt text needs fuzzy matching, not exact.

### Patterns confirmed across multiple sessions

| Pattern                         | Sessions                   | Description                                                  |
| ------------------------------- | -------------------------- | ------------------------------------------------------------ |
| Build-then-heal                 | W2-11, W2-17               | Feature work → project hygiene (test audit, Ralphy campaign) |
| Dual-session verification       | W2-19                      | One Claude session QA-checks another's output                |
| Playwright visual QA            | W2-17, W2-18, W2-20        | Edit → serve → screenshot → verify loop                      |
| Voice frustration correction    | W2-20, W2-13               | User expresses frustration → Claude course-corrects          |
| Session-as-bookmark             | W2-12                      | Session reused days later for unrelated task                 |
| Human relay                     | W2-14                      | User mediates between Claude and another person              |
| Context exhaustion continuation | W2-07, W2-17, W2-18, W2-20 | 3-9 context compactions in one session                       |

### /loop runaway is a real failure mode

W2-16 (deckhand) shows what happens when `/loop` runs unsupervised: 10 hours of ASCII art comedy, 6MB of data, zero productive output. The registry correctly flagged `is_junk: true`. This is a classifier edge case worth hardcoding: if session is >90% stop events with identical prompt patterns, flag as loop_runaway.

## Loop Meta-Learnings

### 20-session wave with 4 sub-waves worked well

Breaking wave 2 into groups of 5 (Ralphy, Brains, Skills, Unseen) with targeted focus areas per group produced richer findings than a random sample would have. The grouping forced the agents to compare sessions of the same type, which surfaced patterns that would be invisible in a mixed batch.

### Agent output quality was high

All 20 agents produced structured findings with classification, session shape, observations, patterns, and new type proposals. The AGENTS.md instructions (especially the chunked reading strategy and "challenge BUILD" directive) were consistently followed.

### Large files handled successfully

W2-16 (6MB) and W2-20 (190KB but very dense) were both handled via chunked reads without issues. The tiered reading strategy (first 150, middle samples, last 80) worked for all file sizes. No agent hit context limits from reading session data.

### Skill inventory background task was valuable

Building the skill inventory (65 skills) and usage audit (101 skills, 15 used, 86 never used) before wave 2c gave agents concrete cross-reference data. The skill-usage-audit.json enabled agents to verify skill names and session associations rather than guessing.

### Subtype candidate tracking table is useful

The subtype-candidates.md table with session sources and counts proved its value — it shows which subtypes have enough evidence to formalise and which are still one-off observations.
