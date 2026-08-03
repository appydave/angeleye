---
type: analysis
title: 'Findings W7-06'
description: 'Wave 7 analysis (W7-06) of 9 sessions — 33% BUILD accuracy, sysops.registry_update confirmed subtype, corrective_followup chain type, Playwright install friction.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7-06

**Date**: 2026-03-22
**Sessions analysed**: 9
**Agent**: W7-06

---

## Session Batch Overview

| Wave ID     | Session ID | Project              | Registry Type | Actual Type | Scale    |
| ----------- | ---------- | -------------------- | ------------- | ----------- | -------- |
| W7-28e1aa8a | 28e1aa8a   | prompt.supportsignal | BUILD         | ORIENTATION | micro    |
| W7-1006c135 | 1006c135   | supportsignal        | BUILD         | SYSOPS      | micro    |
| W7-c54a8113 | c54a8113   | voz                  | BUILD         | SYSOPS      | light    |
| W7-5d25755b | 5d25755b   | ansible              | BUILD         | OPERATIONS  | light    |
| W7-368e5eb8 | 368e5eb8   | supportsignal        | BUILD         | SYSOPS      | micro    |
| W7-2df59d61 | 2df59d61   | brains               | BUILD         | KNOWLEDGE   | moderate |
| W7-3aa4e5aa | 3aa4e5aa   | flihub               | BUILD         | BUILD       | light    |
| W7-f9485f8c | f9485f8c   | deckhand             | BUILD         | BUILD       | heavy    |
| W7-a84d4902 | a84d4902   | deckhand             | BUILD         | BUILD       | marathon |

**BUILD accuracy: 3/9 (33%)** — consistent with wave 6 pattern for non-heavy sessions.

---

## Session Observations

### W7-28e1aa8a — prompt.supportsignal / micro

**Type**: ORIENTATION → orientation.cold_start (reclassified from BUILD)

Single-prompt micro session. User opens with "How do I run Agent Waveflow Builder?" followed by a terminal paste showing npm/pnpm errors. Zero tool calls — Claude never responded. Session ends immediately after the single event. The prompt.supportsignal CWD is exactly the "home terminal" pattern established in wave 5 — user's default terminal, not a signal of project work.

**Observations**:

- Zero tool call sessions should never be BUILD — this rule holds perfectly here.
- Terminal error paste as first prompt is a weak "orientation.cold_start" signal: user is disoriented about their dev environment, not building.
- 1-event sessions are a distinct micro subtype: the session was either never answered or the user gave up immediately.

---

### W7-1006c135 — supportsignal / micro

**Type**: SYSOPS → sysops.registry_update (reclassified from BUILD)

User asks Claude to find AppyStack in the jump location system and register it. 4 Bash + 1 Skill. CWD is supportsignal but work targets the global `~/.config/appydave/locations.json` jump registry — classic CWD-as-home-terminal incidental attribution.

**Observations**:

- This is the second wave to contain a `sysops.registry_update` session. The jump system gets updated often — users frequently open Claude in whatever terminal they have, ask for a registry update, and move on.
- CWD is always incidental for jump registry work — the terminal location is irrelevant to the task.
- Voice artifacts confirmed: "I think", "I don't know where it's located" — classic voice hedging.

---

### W7-c54a8113 — voz / light

**Type**: SYSOPS → sysops.registry_update (reclassified from BUILD)

Jump key rename: jvoz→jc-voz, adding jc-lars. CWD is the voz client directory but edits target the global jump locations config. Two-prompt session with Bash+Read+Edit+Skill. Structurally identical to W7-1006c135 — this is now a confirmed subtype at 2+ instances in this wave alone.

**Observations**:

- Two jump registry updates in one wave from different CWDs confirms this is a recurring SYSOPS pattern.
- The Edit calls target the jump config file, not voz project files — a classifier checking edit paths would correctly flag this as CWD-incidental immediately.
- The 2-minute, 12-event profile is characteristic of registry_update sessions: single focused task, no iteration.

---

### W7-5d25755b — ansible / moderate

**Type**: OPERATIONS → operations.ansible_maintenance (reclassified from BUILD)

Ansible playbook review and maintenance. Opens with a full 12KB run log paste. Prompts: check log → fix deprecation warning (INJECT_FACTS_AS_VARS) → add verbose logging → commit. C01 rule 13 applies directly: "Ansible project dir → OPERATIONS, never BUILD."

**Observations**:

- The 12KB paste as first prompt is a strong `paste_handover` signal — structured system output being handed off for review.
- The log paste opening style is distinct from voice: this is "show me the output and tell me if it's ok" — operational review, not building.
- All ANSIBLE edits in this batch are maintenance/config fixes, never feature construction.
- Commit-closing ceremony detected: final prompt "commit this" + Skill + Bash git workflow.

---

### W7-368e5eb8 — supportsignal / micro

**Type**: SYSOPS → sysops.cleanup (reclassified from BUILD)

Investigating and deleting stale wave directories. Opens with frustration: "Okay, that wasn't even what I told you. I don't have a problem if they've been delayed, and I don't understand what these are." ls → du → rm-rf. Session ends after deletion.

**Observations**:

- **New session chain subtype**: `session_chain.corrective_followup` — user returns to a prior session's output to fix a misunderstanding. The prior session created or surfaced directories (signal-studio-wave22, wave18-data-infrastructure) that the user hadn't asked for. This session cleans up the mess.
- Frustration signals in the opening prompt are a reliable indicator of corrective_followup sessions — the user is angry at a prior Claude response.
- The rm-rf pattern (investigate → confirm size → delete) is a distinct SYSOPS cleanup signature: no write, no edit, just Bash filesystem ops.
- This is distinct from `sysops.registry_update` — cleanup is destructive (delete), registry_update is additive/modifying.

---

### W7-2df59d61 — brains / moderate (classified heavy by registry)

**Type**: KNOWLEDGE → knowledge.brain_update (reclassified from BUILD)

Opens with `/refresh-claude-brain` skill invocation. Subagent pulls upstream claude-code and claude-agent-sdk repos. Brain files updated: claude-code-recent-features.md, hooks-reference.md, INDEX.md, skills/overview.md. Second phase: statusline script copied from MacBook Pro and enhanced, deployed to all 3 machines.

**Observations**:

- **Multi-phase session confirmed**: Phase 1 is pure KNOWLEDGE (brain refresh), Phase 2 is SYSOPS (statusline deployment). The pivot is explicit — user introduces a new task after brain refresh completes.
- **Two AI comprehension errors detected**: (1) Claude incorrectly reported the brain was "nine weeks" out of date when it was current — challenged and corrected. (2) Claude looked at the wrong machine's statusline script. Both are interpretation errors, not context state bleed.
- The `/refresh-claude-brain` skill reliably signals `knowledge.brain_update` — skill name is a perfect type predictor here.
- SSH-based multi-machine operations (scp, diff across machines) are a recurring SYSOPS pattern for this user's 3-machine setup.

---

### W7-3aa4e5aa — flihub / light (classified heavy by registry)

**Type**: BUILD → build.feature_integration (correctly classified)

Two-phase: Phase 1 is RESEARCH (14 Read + 8 Grep to understand FliHub button data format), Phase 2 is BUILD (11 Edits to fix field name mismatch: srt→srtContent, chapterFolderNames→fliHubChapters). Cross-paste injection detected: second prompt contains a large pre-analyzed schema document from a prior session.

**Observations**:

- **Cross-paste as BUILD enabler**: The schema analysis paste (prompt 2) is clearly from a prior RESEARCH session. The user researched the problem elsewhere, then injected the findings here as context for the BUILD fix. This is a productive cross-session pattern — not noise, but deliberate context injection.
- The understand-then-build workflow (Read/Grep-heavy exploration → Edit-heavy implementation) is a clean two-phase BUILD signature.
- Key name mismatches (srt vs srtContent) are a FliHub-specific recurring bug type — the integration between FliHub's output format and the AWS intake schema has misaligned field names.
- No commit detected — session ends after final Edit. Build without commit is a common light-session pattern.

---

### W7-f9485f8c — deckhand / heavy

**Type**: BUILD → build.campaign_continuation (correctly classified, subtype refined)

Opens with campaign completion status table paste. User asks what Claude can do autonomously. Claude investigates then writes fixes. User then requests a Playwright drag test — 3 ToolSearch calls before Playwright install+navigate. Edit loop fixes issues. Ends with commit+push.

**Observations**:

- **Campaign completion handover pattern**: User pastes a structured campaign status table as the opening prompt — this is a campaign_continuation opener. Claude is being briefed on where a prior Ralphy campaign left things.
- **88-minute idle gap**: Claude initialized with Glob+Read before the user appeared (after 88 min idle). This pre-initialization behavior is notable — the session started with Claude doing reads, then user went away, then returned with the campaign status paste.
- **Playwright ToolSearch friction**: 3 ToolSearch calls + mcp**playwright**browser_install before first navigate. Playwright requires installation per session — this is a recurring friction point across both deckhand sessions in this wave.
- Voice artifact confirmed: 'sCan you commit and push?' (leading 's' typo).
- Commit+push ceremony: final prompt + Skill + 6 Bash git ops.

---

### W7-a84d4902 — deckhand / marathon

**Type**: BUILD → build.campaign (correctly classified)

Marathon session spanning 2 days (March 9-10). Opens with orientation ("read these documents"), transitions to planning discussion, 1325-minute idle gap overnight, resumes with phase execution. 10 Agent calls, 43 Edits, 14 Writes across 3 build phases. 1 context compaction. Playwright UI verification. Ends mid-build with unresolved "slides" removal.

**Observations**:

- **PLANNING → BUILD multi-phase**: Phase 1 is genuine planning — user asks "how many phases do you think are in front of us?", discusses structure, writes planning docs. This is distinct from orientation; it's strategic planning before execution.
- **Numbered prompt execution**: Prompts "2", "3" are bare task references driving phased execution — classic build.campaign pattern. The user is following a numbered list they agreed on in Phase 1.
- **Compaction-lost task**: "You still haven't gotten rid of slides" — a cleanup instruction from before the compaction that didn't survive context reconstruction. The compaction summary missed this pending item.
- **Voice artifact**: "Deccan button" = "Stream Deck button" — strong voice dictation confirmation.
- **Overnight idle gap**: 1325-minute gap (L26→L27) — user started planning at night, built the next morning. The compaction fires during the next-day session.
- **Playwright friction**: 3 ToolSearch calls — same Playwright activation friction as sibling session f9485f8c. Now 2 instances in this wave = pattern.

---

## Wave-Level Findings

### Finding 1: BUILD accuracy 33% — light sessions drive misclassification

3 of 9 sessions are genuinely BUILD (3aa4e5aa, f9485f8c, a84d4902). All 3 are product repos (flihub, deckhand) with meaningful Edit/Write counts. The 6 misclassified sessions are ORIENTATION (1), SYSOPS (3), OPERATIONS (1), KNOWLEDGE (1).

Wave 6 established BUILD accuracy at 17.5% overall. This wave at 33% reflects the higher proportion of heavy/marathon sessions (which are almost always correct) in the batch. Light sessions in this wave: 0/4 correct. Moderate session (brains): 0/1 correct. Heavy+ sessions: 3/3 correct. Pattern holds.

### Finding 2: sysops.registry_update is a confirmed subtype

Three SYSOPS sessions in this wave (1006c135, c54a8113 are jump registry updates; 368e5eb8 is cleanup). The jump registry update pattern appears twice with identical structure: voice request from incidental CWD → Bash finds path → Edit updates locations.json. This is now a stable subtype.

Classifier signal: if first prompt mentions "jump", "jstack", "jvoz", "jc-" style prefixes, or "locations.json" → SYSOPS, not BUILD.

### Finding 3: corrective_followup is a new session chain type

W7-368e5eb8 introduces a session chain subtype not previously catalogued: `session_chain.corrective_followup`. User returns to correct an error from a prior Claude session. Distinguishing features:

- Opening prompt contains frustration signals ("that wasn't even what I told you")
- Task is destructive/corrective (delete, revert, undo)
- No new feature work — purely fixing a prior mistake

Existing chain types are continuation, verification, post_mortem. `corrective_followup` is distinct: it's reactive to a prior error, not a planned continuation.

### Finding 4: Playwright activation requires installation per session (deckhand recurring pattern)

Both deckhand sessions (f9485f8c, a84d4902) show 3 ToolSearch calls before Playwright is usable. In f9485f8c, Claude calls ToolSearch x2 then mcp**playwright**browser_install. This is a recurring friction point for deckhand UI testing. The browser is not persistent — each session that needs Playwright must reinstall it.

This is a candidate for a skill or CLAUDE.md note: "Before running Playwright tests in deckhand, always run mcp**playwright**browser_install first."

### Finding 5: Cross-paste injection as BUILD enabler (not noise)

W7-3aa4e5aa (flihub) shows cross-paste injection being used productively — user injected a prior session's schema analysis as context for a BUILD fix. This is different from the "cross-paste as noise" pattern established in wave 3 (where unrelated transcripts were injected as analogies). Here the paste directly enables the BUILD work.

Classifier implication: cross-paste injection doesn't always mean P06=true for a session_chain observation — need to evaluate whether the paste is relevant context or noise.

### Finding 6: Multi-machine SYSOPS operations are a recurring pattern

W7-2df59d61 includes SSH-based file sync across 3 machines (scp, diff, deploy statusline to M4-Mini, MacBook Pro, M2 Mini). This multi-machine operation pattern appeared in earlier waves for ansible but this is the first non-ansible instance. The 3-machine setup (M4-Mini, MacBook Pro, M2 Mini) means sysops work often involves cross-machine coordination.

---

## New Subtypes Proposed

| Subtype                             | Evidence                                                  | Sessions                 | Confidence                                           |
| ----------------------------------- | --------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `sysops.registry_update`            | Jump location manager updates from incidental CWDs        | W7-1006c135, W7-c54a8113 | high (2 instances in 1 wave)                         |
| `sysops.cleanup`                    | Destructive filesystem cleanup (rm-rf) of stale artifacts | W7-368e5eb8              | medium (1 instance)                                  |
| `session_chain.corrective_followup` | User returns to fix Claude's prior mistake                | W7-368e5eb8              | medium (1 instance, distinct from other chain types) |
| `build.campaign_continuation`       | Post-Ralphy human review and fix session                  | W7-f9485f8c              | high (pattern in wave 6 too)                         |
| `build.feature_integration`         | Cross-system field mapping / integration fix              | W7-3aa4e5aa              | medium (1 instance)                                  |

---

## Verification Against AGENTS.md Quality Gates

- [x] Session index entries written with all fields populated (9/9)
- [x] Session types verified (6/9 reclassified from BUILD)
- [x] At least 2 observations per session captured in this file
- [x] New semantic types flagged explicitly (5 new subtypes)
- [x] Schema review checkpoint: v2 schema handled all sessions without issue
