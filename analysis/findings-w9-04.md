---
type: analysis
title: 'Findings W9-04'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W9-04

**Wave**: 9, Batch 04
**Sessions analysed**: 9 (1 moderate, 3 light, 2 micro-genuine, 3 micro-junk)
**Date**: 2026-03-23
**Agent**: analysis-agent (Opus 4.6)

---

## Session Summaries

### 81523aec — v-appydave (moderate)

**Registry type**: BUILD | **Actual type**: OPERATIONS (disk_cleanup)

Disk space reclamation session spanning ~9 hours (100 min active). User asks Claude to audit trash folders in video projects, delete them, find large files, prune Docker, check APFS snapshots, and investigate disk usage. Bash-heavy (68 calls), 1 Write (exclusion list file), zero Edit. Three distinct phases separated by multi-hour idle gaps: (1) video project trash cleanup + exclusion list, (2) Docker prune + disk audit, (3) APFS snapshot deletion + downloads review.

CWD is v-appydave (a video project folder) but the work spans the entire filesystem: video-projects/, Docker, APFS snapshots, ~/Downloads. CWD is incidental.

**Key observations**:

- Voice dictation throughout ("drawer.io" = Draw.io, "ITO" = ito)
- User explicitly reviews rm commands before approving — cautious deletion pattern
- Session ends mid-investigation (abrupt abandon after "let's look at downloads backup")

### dac8662a — angeleye (light)

**Registry type**: BUILD | **Actual type**: OPERATIONS (post_upgrade_review)

Post-upgrade verification session (19 min). User ran appystack-upgrade, asks Claude to review changes before committing. Claude spots a destructive regression (start.sh overwritten with template stub), user reverts it, Claude produces a handover for fixing the upgrade tool. Then commits remaining safe changes (.gitignore, appystack.json, new recipes). Clean session with good human-AI collaboration — Claude proactively caught the start.sh regression.

**Key observations**:

- Cross-session reference: user pastes output from the appystack upgrade session as context for prompt 3
- Subagent (Explore) used to investigate the appystack upgrade system — efficient delegation
- Session closes cleanly with commit + push + explicit "close it down"

### bdd8313a — app.supportsignal (light)

**Registry type**: BUILD | **Actual type**: SYSOPS (repo_management)

GitHub repo rename + recreation session (38 min). User wants to rename old app.supportsignal.com.au repo to legacy and create a new one. Claude plans the 4-step process, user does step 1 manually (rename), Claude executes remaining steps (update remote, git init, create new repo, initial commit, push). Ends with GitHub description update.

**Key observations**:

- Voice artifacts: "app.support.signal" (extra dots from dictation)
- CWD is reliable — all work targets this project
- No code written — purely repository infrastructure

### e17bce3d — appydave-plugins (light)

**Registry type**: BUILD | **Actual type**: OPERATIONS (cross_session_commit)

Short commit session (10 min). User pastes a detailed summary from another session that updated 4 files (SKILL.md, requirements.md, CLAUDE.md, MEMORY.md) — all port documentation fixes. Claude verifies the changes landed correctly, makes a minor edit, commits and pushes. Third prompt is "exigt" (voice artifact for "exit").

**Key observations**:

- Cross-session handover: user pastes full change summary from prior session as opener
- CWD is reliable — edits target appydave-plugins
- "exigt" = exit (voice dictation artifact, new entry)

### 96f1f5c7 — v-voz (light)

**Registry type**: BUILD | **Actual type**: OPERATIONS (commit_and_push)

Commit + push session (10 min). User asks for a git commit with an obvious label, then push. After push, user asks about large files and folder move impact. 3 prompts, 10 tool calls. Straightforward operations session.

**Key observations**:

- "community history" = "commit history" (voice dictation artifact, new entry)
- TaskOutput used — suggests background tasks were running from prior context
- No feature construction at all

### 73f4a83e — appystack (micro)

**Registry type**: BUILD | **Actual type**: REVIEW (quality_review)

Single-prompt micro session asking for quality review of a new recipe for the API generation system. Only 2 Read calls (reading the recipe files). Session appears truncated — only 3 events captured, but last_active in registry is 1h16m later, suggesting the conversation continued beyond hook capture.

**Key observations**:

- Zero Edit/Write — pure read-only review request
- "recipe" refers to AppyStack skill recipes, not food

### edba69e5 — appystack (micro)

**Registry type**: BUILD | **Actual type**: ORIENTATION (post_mortem_question)

Single-prompt micro session. User is confused about where a Ralphy loop worktree should have been created (appystack root vs appystack/template). Claude investigates with 2 Bash calls. "Ralph Wiggum loop" = Ralphy loop (voice dictation artifact, new entry).

**Key observations**:

- Post-mortem of a failed/misguided Ralphy campaign
- No file changes — purely informational
- Voice artifact: "Ralph Wiggum" = "Ralphy" (extends existing catalog: "Raffi" = "Ralphy" from wave 7)

### b00b08e1 — prompt.supportsignal (micro)

**Registry type**: BUILD | **Actual type**: junk (smoke_test)

Single event: "What is 2+2?" — classic smoke test to verify Claude Code is working. Zero tool calls. Disposition: junk.

### e564df88 — prompt.supportsignal (micro)

**Registry type**: BUILD | **Actual type**: junk (off_topic_question)

Single event: "On Android, how do I turn off notifications for TikTok?" — off-topic personal question with zero relation to the project. Zero tool calls. Disposition: junk. CWD is completely incidental.

---

## Cross-Session Observations

### BUILD misclassification continues at 100% for this batch

All 9 sessions were classified as BUILD by the registry. 0/9 are actually BUILD. Breakdown:

- 4 OPERATIONS (disk_cleanup, post_upgrade_review, cross_session_commit, commit_and_push)
- 1 SYSOPS (repo_management)
- 1 REVIEW (quality_review)
- 1 ORIENTATION (post_mortem_question)
- 2 junk (smoke_test, off_topic_question)

This reinforces waves 6-8: BUILD accuracy for micro/light sessions is near 0%.

### Video project CWD is always incidental for OPERATIONS sessions

Session 81523aec (v-appydave) is a filesystem-wide disk cleanup session that happens to start from a video project folder. CWD tells you nothing about the work — the user's terminal was just parked there.

### New voice dictation artifacts (4 new entries)

- "community history" = "commit history"
- "exigt" = "exit"
- "Ralph Wiggum" = "Ralphy" (confirms "Raffi" variant from wave 7)
- "drawer.io" = "Draw.io"

### Cross-session paste as handover remains common

2/9 sessions (dac8662a, e17bce3d) open with pasted output from another Claude session. In both cases, the paste provides the context Claude needs to verify and commit work done elsewhere. This is the "cross_session_commit" pattern — not a new session type but a reliable subtype of OPERATIONS.

### Micro sessions: 3/5 are junk in this batch

Micro bucket continues to split: genuinely useful micro sessions (review, orientation) vs pure junk (smoke tests, off-topic). 60% junk rate for micros in this batch, consistent with wave 5 findings.
