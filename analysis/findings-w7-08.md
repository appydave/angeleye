---
type: analysis
title: 'Findings W7-08'
description: 'Wave 7 analysis (W7-08) of 9 sessions — 44% BUILD accuracy, plan-paste-then-execute workflow, context handover opener dominant, retrospective_summary closing style.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# findings-w7-08.md

Wave 7 agent W7-08 — 9 sessions analysed (mix of light/moderate/heavy/marathon).
Date: 2026-03-22

---

## Session Summaries

### W7-1e0c8237 — apps / light (micro)

**Session**: 1e0c8237-adc1-419f-bfa4-e88143a8b2a9
**Registry type**: BUILD (wrong)
**Actual type**: ORIENTATION (micro)

**Observations**:

1. Single-prompt session asking "How do you do a tree command and just get the level one folders?" — zero tool calls, zero response captured. Likely the user asked in passing and got an answer without the response being logged, or Claude answered conversationally.
2. Registry BUILD classification is maximally wrong — there is no possible way this is BUILD (no tools, no file work, no project). CWD=apps (parent directory) is incidental. This is the simplest kind of micro session: a quick syntax question.

**Classification**: `orientation.cold_start` (or possibly just uncategorised micro Q&A)

---

### W7-4b624fee — competent-golick / light (micro)

**Session**: 4b624fee-aa1a-4269-acf9-9b259b40a389
**Registry type**: BUILD (wrong)
**Actual type**: DEBUG (quick verification)

**Observations**:

1. Worktree-based session — CWD is inside a git worktree for `appydave-app-a-day/008-ai-programatic-art`. User says "can you run this app here" — launch verification, not feature building.
2. Playwright `browser_navigate` as a launch check: when an app fails to open on the expected side, Playwright is used to navigate to it directly. This is different from the Playwright patterns in TEST or UI_REVIEW sessions — it's a simple "did the port open?" check.
3. New subtype candidate: `debug.quick_verification` — 2-prompt micro sessions in worktrees checking whether the app launched correctly.

**Classification**: `debug.quick_verification`

---

### W7-030059a0 — brains / moderate (light)

**Session**: 030059a0-cf01-4f33-b596-76a0f6eca4ed
**Registry type**: BUILD (wrong)
**Actual type**: RESEARCH (feature_discovery)

**Observations**:

1. Triggered by a tweet: "boris herny tweet, in the next verion of claude code there are two skills /simplify and /batch" — voice-transcribed with misspelled name (likely Thorsten Ball, Boris Cherny, or similar). The user hears about an upcoming feature announcement and immediately fires a research session.
2. Tool distribution: 7 WebSearch + 3 WebFetch = 10 external lookups (62.5% of tools), then Glob/Grep/Read to check if existing brain files cover these features. Zero writes — pure discovery, no documentation.
3. CWD=brains is incidental — terminal happened to be there. No brain files were modified. Registry BUILD is wrong by every possible signal.
4. New subtype candidate: `research.feature_discovery` — sessions triggered by a specific announced feature (tweet, changelog, blog post) to verify and understand it before using it.

**Classification**: `research.feature_discovery`

---

### W7-2ae4ea98 — brain-dynamous / moderate

**Session**: 2ae4ea98-cf1f-4bd3-a5c2-7d319596539f
**Registry type**: BUILD (wrong)
**Actual type**: KNOWLEDGE (brain_update + social_research)

**Observations**:

1. Two-phase session with an organic pivot: Phase 1 is AWS cold storage research (S3 Glacier alternatives) documented into brain-dynamous. Phase 2 is a pivot to YouTube content collaboration — user pastes a Loom transcript from a video call to Cole Medin asking about sharing his second brain, then pastes Cole's response giving permission.
2. The Loom transcript paste is a notable pattern: voice-transcribed video content injected into a session for Claude to process and advise on. This is cross-media ingestion (video → transcript → session context).
3. The session ends with a question about "Dynamous Branding Example" — revealing brand sensitivity around using Dynamous content. This is a knowledge.social_research pattern where the primary output is understanding collaboration constraints.
4. Registry BUILD is wrong — brain file write + knowledge research, not product construction.

**Classification**: `knowledge.brain_update` (Phase 1) + `knowledge.social_research` (Phase 2)

---

### W7-6c42dbf4 — supportsignal-v2-planning / moderate

**Session**: 6c42dbf4-76d2-494e-831f-5c709e36dbd1
**Registry type**: BUILD (wrong)
**Actual type**: PLANNING (handover_and_commit)

**Observations**:

1. Opens with a 9,291-char context handover — the full output of `/capture-context` from a prior session that built the SupportSignal v2 planning documentation pipeline. Classic continuation pattern.
2. Three distinct phases: (1) git commit and push completed work, (2) Angela (team member) onboarding for Windows WSL setup, (3) architectural planning for handing documentation to an AI system.
3. Heavy voice artifact cluster: "Angela" = "GitHub" (pushed to "Angela" instead of "origin"), "bund serve TS" = "bun serve.ts", "ENOT" = "ENOENT". These caused real execution errors — the WSL-compatibility fix was needed because voice-dictated "spawn open HTTP error minus 2 ENOT" described the actual ENOENT error correctly despite the dictation mangling.
4. The final prompt "what was this convo about, give me multiple points" is a new closing style — a retrospective summary request 4+ hours after the last active work. User came back to the idle session to understand what happened in it.
5. New closing style candidate: `retrospective_summary` — user returns to an idle session to ask what it did.

**Classification**: `planning.handover_and_commit`

---

### W7-f12c0a0b — prompt.supportsignal.com.au / heavy (moderate)

**Session**: f12c0a0b-8839-4b22-906a-ca457266cd67
**Registry type**: BUILD (correct)
**Actual type**: BUILD (worktree_sprint)

**Observations**:

1. One of the few sessions where registry BUILD is correct. Full worktree lifecycle: Skill invoked → EnterWorktree → build landing redesign → Playwright visual verification → merge → delete worktree.
2. Playwright used as visual verification (navigate + screenshot) after building new landing page files — this is the `ui_audit` pattern within a BUILD session, not a standalone TEST/UI_REVIEW session.
3. Session ends unresolved — "How do we resolve this?" after git branch delete issue. The worktree was not cleanly torn down, suggesting the branch deletion pattern is a recurring pain point.
4. New subtype candidate: `build.worktree_sprint` — complete self-contained worktree build cycle (enter, build, verify, merge, delete) in a single session.

**Classification**: `build.worktree_sprint`

---

### W7-4905b3ee — appystack / heavy

**Session**: 4905b3ee-ad2f-406d-a6b7-7db02f6bd22f
**Registry type**: BUILD (correct)
**Actual type**: BUILD (documentation_sprint)

**Observations**:

1. Genuine BUILD but unusual in that the deliverables are documentation files (recipe .md files), not application code. The 6,123-char opening prompt is a context handover listing exactly 3 items to complete from a prior session — this is a deliberate task handover, not a compaction resume.
2. 493-minute idle gap between Phase 1 (recipe creation) and Phase 3 (git cleanup). The session was left open overnight. Active work was only ~12 minutes. Duration metrics are misleading for this session.
3. Voice artifact: "Is the other word done?" = "Is the other work done?" — a subtle artifact in a key decision-checkpoint prompt that could cause a classifier to misread intent.
4. New subtype candidate: `build.documentation_sprint` — BUILD sessions where the deliverables are documentation files (recipes, patterns docs, strategy docs) rather than application code.

**Classification**: `build.documentation_sprint`

---

### W7-19643e68 — appystack / marathon

**Session**: 19643e68-fab8-4912-86a1-9e7aa0088260
**Registry type**: BUILD (correct)
**Actual type**: BUILD (campaign)

**Observations**:

1. The most interesting session in this batch. The opening prompt is a complete implementation plan for the `create-appystack` npm package — step-by-step with verification commands, referencing a prior plan mode session by file path. TaskCreate/TaskUpdate tools track progress.
2. Frustration peak at npm OTP authentication. Prompt 46: explicit profanity about needing to use npm web UI for OTP every time. Root cause is machine migration — the prior M4 Pro had npm token configured, the new M4 Mini did not. Frustration resolved by running `npm set` with a token.
3. Human-in-the-loop checkpoint works correctly: user approves "yes, go ahead and publish" at the planned pause point. Then another pause for OTP: user manually pastes `npm publish --access public --otp 882125` as a prompt. Publishing npm packages requires a specific interactive pattern that voice-dictated sessions handle awkwardly.
4. Agent calls at end for final template sync — suggesting Agent is used for delegatable subtasks within BUILD campaigns.
5. New subtype candidate: `build.npm_publish` — sessions where npm publish is a key deliverable and the publish flow introduces authentication friction.

**Classification**: `build.campaign`

---

### W7-db533df6 — thumbrack / marathon

**Session**: db533df6-bbc4-4ecc-b3ad-0025fff20d69
**Registry type**: BUILD (correct)
**Actual type**: BUILD (campaign)

**Observations**:

1. Most complex session in the batch. User opens with a dense voice prompt covering 5+ distinct topics: drag+focus interaction, drag handle UX, configuration objects, divider/group concepts, code quality. This is a classic "voice brain dump" opening style.
2. Explicit triage before building: user categorises work into 3 tracks (test coverage, code quality, new capability) and asks for confirmation before any code is written. This deliberate triage-to-plan behaviour is a new pattern worth tracking.
3. Voice artifact: "Raffi" = "Ralphy" — user says "I'm considering using Raffi to go and create three implementation plans." The /ralphy skill is the actual intent. This is a significant voice artifact for AngelEye — if "Raffi" appears in session prompts, it should map to ralphy_mode detection.
4. Parallel agent architecture confirmed: 13 Agent calls + worktrees agent-a3af5e3f and agent-a42930b7 working simultaneously. This is Ralphy-mode campaign structure without explicit `/ralphy` invocation — the user described the workflow manually.
5. Frustration at Overmind multi-app env var issue — "that's a clusterfuck" — is a different frustration type than the npm OTP frustration in W7-19643e68. This is architectural frustration (complex system not behaving predictably) vs tooling friction (auth token setup).
6. "plus concrens" as a standalone prompt is a voice cut-off artifact — the user started a new prompt before finishing the thought in the prior one.

**Classification**: `build.campaign`

---

## Wave-Level Patterns

### 1. BUILD accuracy in this batch: 4/9 correct (44%)

- Correct BUILD: f12c0a0b (worktree sprint), 4905b3ee (doc sprint), 19643e68 (campaign), db533df6 (campaign)
- Wrong BUILD: 1e0c8237 (ORIENTATION), 4b624fee (DEBUG), 030059a0 (RESEARCH), 2ae4ea98 (KNOWLEDGE), 6c42dbf4 (PLANNING)

### 2. Voice artifact: "Raffi" = "Ralphy"

New voice artifact identified. "Raffi" appears where user means `/ralphy` skill. AngelEye should add "raffi" → ralphy_mode detection signal. This is important because /ralphy invocations in this dataset are detected by skill name matching — a voice-garbled name would miss the detection.

### 3. Context handover paste is the dominant session opener for continuation sessions

Three of the 9 sessions (6c42dbf4, 4905b3ee, 19643e68) opened with a large context paste (6K-9K chars) from a prior session's `/capture-context` output. This is becoming a standard workflow pattern: session ends → capture-context → paste into next session. AngelEye should detect this as a classifier signal.

### 4. Triage-to-plan before building

W7-db533df6 shows an explicit triage step: user categorises work into tracks, asks for confirmation, then authorises building. This is distinct from "just start building" sessions. Could be a subtype: `build.planned_campaign` vs `build.reactive`.

### 5. Duration metrics misleading for sessions with large idle gaps

W7-4905b3ee (493-min idle) and W7-6c42dbf4 (394-min wall with 2 gaps) have duration_minutes that dramatically overstate session complexity. active_minutes is the reliable metric. Shape.idle_gaps_over_1h should be used to flag when duration is unreliable.

### 6. Closing style: retrospective_summary

W7-6c42dbf4 ends with "what was this convo about" 4+ hours after the last active work. This is a new closing style where the user returns to an idle session for a summary. Different from `memory_write` (intentional close ceremony) — this is an afterthought recap.

## New Subtype Candidates (this wave)

| Subtype                        | Evidence    | Count |
| ------------------------------ | ----------- | ----- |
| `debug.quick_verification`     | W7-4b624fee | 1     |
| `research.feature_discovery`   | W7-030059a0 | 1     |
| `knowledge.social_research`    | W7-2ae4ea98 | 1     |
| `planning.handover_and_commit` | W7-6c42dbf4 | 1     |
| `build.worktree_sprint`        | W7-f12c0a0b | 1     |
| `build.documentation_sprint`   | W7-4905b3ee | 1     |
| `build.npm_publish`            | W7-19643e68 | 1     |

**New closing style candidate**: `retrospective_summary` (W7-6c42dbf4)

**New voice artifact**: "Raffi" → ralphy_mode (W7-db533df6)

**New detection candidate**: Large context paste as session opener (detect `capture-context` output pattern, length > 5000 chars)
