---
type: analysis
title: 'Forward Prop Findings 08'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, final-pass, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings - Batch 08

**Sessions processed:** 103

## P23 - Paperclip/JJ Agent Sessions

6 sessions (5.8%) flagged as Paperclip agent-initiated. These contain "You are agent" patterns with UUIDs in the first prompt, consistent with autonomous agent launches.

## P24 - PII Content

0 sessions flagged. No emails, phone numbers, IP addresses, or API key patterns detected in first prompts or notes across this batch.

## P25 - Closing Ceremony

13 sessions (12.6%) had a closing ceremony (commit, push, handover, memory_write, etc.). The majority (87.4%) ended without structured closure -- consistent with the high stub/abandoned rate.

## C12 - Prompt Verbosity

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| terse (<50 chars)  | 4     | 3.9%  |
| normal (50-500)    | 83    | 80.6% |
| verbose (500-2000) | 16    | 15.5% |
| paste (>2000)      | 0     | 0%    |

Overwhelmingly normal-length prompts. No paste-dumps in this batch, and very few terse/single-word inputs.

## C13 - Session Lifecycle

| Category    | Count | %     |
| ----------- | ----- | ----- |
| complete    | 49    | 47.6% |
| abandoned   | 31    | 30.1% |
| stub        | 17    | 16.5% |
| ghost       | 6     | 5.8%  |
| interrupted | 0     | 0%    |

Nearly half completed their goal. The 30% abandoned rate is notable. No compaction-interrupted sessions in this batch.

## O08 - Tool Diversity Index

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| low (0-2 tools)    | 60    | 58.3% |
| medium (3-5 tools) | 20    | 19.4% |
| high (6+ tools)    | 9     | 8.7%  |
| unknown (no data)  | 14    | 13.6% |

Most sessions used few tools. The 14 unknowns had no tool usage data in the shape, likely very short or conversation-only sessions.

## Key Observations

- This batch skews toward lightweight, tool-sparse sessions -- 58% low tool diversity, 80% normal verbosity prompts.
- The paperclip agent rate (5.8%) is modest; these are autonomous sessions that typically use more tools.
- Zero PII detected suggests the prompts in this batch are task-oriented without personal data leakage.
- The abandoned+stub+ghost total (52.4%) slightly exceeds completions (47.6%), indicating roughly half of sessions in this batch did not reach their goal.
