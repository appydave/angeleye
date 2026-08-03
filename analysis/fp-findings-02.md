---
type: analysis
title: 'Forward Prop Findings 02'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, forward-prop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 02

**Sessions processed**: 103
**Date**: 2026-03-23

## Dimension Summary

### P23 — Paperclip/JJ Agent

- **0 sessions flagged**. All sessions in this batch are human-initiated. No autonomous agent patterns detected.

### P24 — PII Content

- **4 sessions flagged**:
  - `120c7392` (session 8): Live Ansible provisioning with names, birthdays, emails, IP addresses embedded in prompts.
  - `328f8ad5` (session 85): Camtasia software license keys pasted directly into prompt. Single-event micro session.
  - `5e587cc8` (session 89): Family member names (Mary, Jan) in a personal hardware research query.
  - `a1ebdd28` (session 97): Client onboarding with Lars Filtenborg email content pasted as input.
- PII types vary: infrastructure credentials (IPs), software keys, personal names, client email content. The email-paste-to-doc workflow (session 97) is particularly notable as a repeatable pattern.

### P25 — Closing Ceremony

- **28 sessions (27.2%)** had deliberate closing patterns.
- Breakdown: commit_and_push (15), memory_write (4), bookend_close (3), context_capture (2), handover (2), clean_close (1), unresolved_cleanup (1).
- **75 sessions (72.8%)** ended without ceremony — predominantly abrupt_abandon or ghost sessions.

### C12 — Prompt Verbosity

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| terse (<50 chars)  | 14    | 13.6% |
| normal (50-500)    | 14    | 13.6% |
| verbose (500-2000) | 3     | 2.9%  |
| paste (>2000)      | 11    | 10.7% |
| unknown            | 61    | 59.2% |

**Data quality note**: 85 of 103 sessions had empty shape data (no JSONL available), limiting prompt analysis. Of those, 24 could be inferred from notes. The 61 "unknown" sessions are genuinely unrecoverable without the original JSONL files. Among sessions with data, paste-length openings (11) outnumber verbose ones (3), confirming a heavy handover/context-loading pattern.

### C13 — Session Lifecycle

| Category  | Count | %     |
| --------- | ----- | ----- |
| complete  | 28    | 27.2% |
| abandoned | 24    | 23.3% |
| ghost     | 41    | 39.8% |
| stub      | 10    | 9.7%  |

The high ghost rate (39.8%) reflects the 41 sessions with no disposition, no tools, and minimal/no notes — likely unprocessed or truly empty sessions. The 28 complete sessions align exactly with the 28 closing ceremonies. No interrupted sessions detected (no compaction_flush closings).

### O08 — Tool Diversity Index

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| low (0-2 tools)    | 56    | 54.4% |
| medium (3-5 tools) | 18    | 17.5% |
| high (6+ tools)    | 29    | 28.2% |

The majority low-tool count reflects the large ghost/stub population. Among active sessions (those with notes), tool diversity is much higher — 29 sessions use 6+ distinct tools, often including Playwright, Agent subagents, and MCP tools.

## Key Observations

1. **Bimodal batch**: This batch splits sharply between rich, deeply-analysed sessions (those with notes from prior waves) and ghost/unprocessed sessions (empty shape, no notes). The 41 ghost sessions drag all distributions toward the low/unknown end.

2. **Commit-and-push dominance**: Among closing ceremonies, commit_and_push is the most common pattern (15/28 = 54%), suggesting most "complete" sessions end with code committed. Memory_write is a distant second, typically in planning/advisory sessions.

3. **PII diversity**: The 4 PII sessions span different PII types — infrastructure IPs, software keys, family names, client email content. This suggests PII risk is not confined to one workflow but appears across operations, personal queries, and client onboarding.

4. **No Paperclip/JJ agents**: Zero autonomous agent sessions in this batch. This is consistent with batch 02 likely predating or being separate from the agent automation experiments.

5. **Paste-driven workflows**: Among sessions with prompt data, 11 of 42 (26%) open with paste-length content (>2000 chars). These correlate with handover patterns, campaign context loading, and cross-session context imports.

## Candidate New Dimensions

- **D_cross_session_continuity**: Several sessions (e.g., 92/93 compaction flush pair, 80/81 overlapping BUILD/UAT sessions, 102 concurrent session pair) show explicit cross-session relationships. A dimension tracking whether a session is part of a chain (standalone / continuation / parent / flush) would capture this.

- **D_cwd_reliability**: Many notes flag "CWD incidental" — the working directory doesn't reflect the actual project. A boolean `cwd_is_reliable` dimension would help filter sessions where project attribution from CWD is trustworthy vs. misleading.

- **D_frustration_present**: Sessions 83 (3 frustration events with Chrome), 95 (expletive about Mac OS), and 102 (git state opacity frustration) show user frustration. Currently scattered in notes but could be a first-class boolean dimension.
