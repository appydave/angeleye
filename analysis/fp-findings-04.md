---
type: analysis
title: 'Forward Prop Findings 04'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, forward-prop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings -- Batch 04

**Sessions analysed:** 103
**Date:** 2026-03-23

## Dimension Distributions

### P23 Paperclip Agent

- True: 44 (42.7%)
- False: 59 (57.3%)

High proportion of machine-initiated sessions in this batch, detected via `is_machine_initiated` predicate. No UUID-style agent prompts found; all 44 flagged via the predicate alone.

### P24 PII Content

- True: 0 (0%)

No sessions in this batch contained detectable PII patterns (emails, phone numbers, IP addresses, API keys, or passwords) in first_real_prompt or notes fields.

### P25 Closing Ceremony

- True: 4 (3.9%)
- False: 99 (96.1%)

Very low ceremony rate. All 103 sessions had empty `closing_style` in observations. The 4 positive detections came from notes containing ceremony-related keywords (committed, pushed, etc.). This batch appears to lack structured closing metadata.

### C12 Prompt Verbosity

| Category | Count | %    |
| -------- | ----- | ---- |
| terse    | 26    | 25.2 |
| normal   | 48    | 46.6 |
| verbose  | 29    | 28.2 |
| paste    | 0     | 0.0  |

Majority normal-length prompts. No paste-length prompts. The terse group (25%) likely includes quick follow-up or single-command sessions.

### C13 Session Lifecycle

| Category    | Count | %    |
| ----------- | ----- | ---- |
| complete    | 65    | 63.1 |
| interrupted | 21    | 20.4 |
| stub        | 8     | 7.8  |
| abandoned   | 7     | 6.8  |
| ghost       | 2     | 1.9  |

Most sessions (63%) ran to completion based on tool activity and disposition. The 7 abandoned sessions all had `junk` disposition. Ghost sessions had no tools, no file paths, and no bash commands.

### O08 Tool Diversity Index

| Category | Count | %    |
| -------- | ----- | ---- |
| high     | 33    | 32.0 |
| medium   | 34    | 33.0 |
| low      | 16    | 15.5 |
| unknown  | 20    | 19.4 |

Roughly even split between high and medium diversity. The 20 unknown sessions had no tool data at all, correlating with ghosts and stubs.

## Data Quality Notes

1. **human_turns is 0 for all 103 sessions** -- the precomputed shape data does not populate this field in batch 04. Lifecycle classification relied on tool counts and disposition instead.
2. **closing_style is empty for all sessions** -- ceremony detection fell back to keyword scanning in notes, yielding only 4 hits. This dimension is under-reported for this batch.
3. **No closing_style + no human_turns** means lifecycle and ceremony dimensions are approximations. Cross-validation with raw JSONL transcripts would improve accuracy.
