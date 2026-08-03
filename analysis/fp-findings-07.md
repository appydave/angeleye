---
type: analysis
title: 'Forward Prop Findings 07'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, final-pass, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 07

**Sessions processed:** 103
**Date:** 2026-03-23

## Dimension Summaries

### P23 — Paperclip Agent

- **0 sessions** flagged as Paperclip/JJ-initiated
- No machine-initiated + agent-signature combinations found in this batch

### P24 — PII Content

- **0 sessions** flagged for PII
- No emails, phone numbers, IP addresses, or PII keywords detected in first prompts or notes

### P25 — Closing Ceremony

- **8 sessions** (7.8%) had a proper closing ceremony
- Breakdown of closing styles found: abrupt_abandon (46), commit_and_push (3), memory_write (2), unresolved_cleanup (2), bookend_close (1), context_capture (1), commit_then_gap (1)
- The overwhelming majority (46/56 sessions with closing data) ended with abrupt abandonment

### C12 — Prompt Verbosity

| Level   | Count | Pct   |
| ------- | ----- | ----- |
| terse   | 50    | 48.5% |
| normal  | 39    | 37.9% |
| verbose | 14    | 13.6% |
| paste   | 0     | 0%    |

Nearly half of all sessions started with terse prompts (<50 chars), suggesting quick commands, skill invocations, or short questions.

### C13 — Session Lifecycle

| State     | Count | Pct   |
| --------- | ----- | ----- |
| complete  | 44    | 42.7% |
| ghost     | 43    | 41.7% |
| abandoned | 10    | 9.7%  |
| stub      | 6     | 5.8%  |

High ghost rate (41.7%) — these are sessions with 2 or fewer events, likely accidental opens or immediate exits. Combined with abandoned (9.7%), roughly half of sessions in this batch did not reach a productive conclusion.

### O08 — Tool Diversity Index

| Level   | Count | Pct   |
| ------- | ----- | ----- |
| unknown | 44    | 42.7% |
| medium  | 30    | 29.1% |
| low     | 18    | 17.5% |
| high    | 11    | 10.7% |

The 44 unknowns align with ghost sessions that had no tool usage recorded. Among productive sessions, medium diversity (3-5 tools) is most common.

## Key Observations

1. **Ghost-heavy batch**: 41.7% ghosts suggests many sessions in this slice were opened and immediately closed or had near-zero interaction.
2. **Abrupt abandonment dominates closing style**: 82% of sessions with closing data ended abruptly — only 8 had deliberate closings (commits, memory writes, bookends).
3. **No PII or autonomous agents**: Clean batch with no privacy concerns or Paperclip agent activity.
4. **Terse prompts correlate with ghosts**: The high terse count (48.5%) combined with high ghost count suggests many sessions were quick lookups or accidental opens.
