---
type: analysis
title: 'Forward Prop Findings 03'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, forward-prop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 03

**Sessions processed**: 103
**Date**: 2026-03-23

## Dimension Summary

### P23 — Paperclip/JJ Agent

- **1 session flagged** (b198584c): machine-initiated pre-compaction memory flush, not a true Paperclip/JJ agent but correctly detected via `is_machine_initiated`.
- 99% of sessions are human-initiated.

### P24 — PII Content

- **1 session flagged** (24adc102): contains SSH username (`davidcruwys@mac-mini-m2.local`) in the opening prompt. Low severity but conservatively flagged.

### P25 — Closing Ceremony

- **18 sessions (17.5%)** had deliberate closing patterns (commit, handover, memory_write, clean_close, etc.).
- **85 sessions (82.5%)** ended without ceremony — predominantly abrupt abandons or stubs.

### C12 — Prompt Verbosity

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| terse (<50 chars)  | 22    | 21.4% |
| normal (50-500)    | 44    | 42.7% |
| verbose (500-2000) | 17    | 16.5% |
| paste (>2000)      | 20    | 19.4% |

Roughly even split between short and long prompts. The 20 paste-length prompts suggest frequent context-loading / handover patterns.

### C13 — Session Lifecycle

| Category    | Count | %     |
| ----------- | ----- | ----- |
| complete    | 14    | 13.6% |
| abandoned   | 36    | 35.0% |
| ghost       | 15    | 14.6% |
| interrupted | 2     | 1.9%  |
| stub        | 36    | 35.0% |

Only 13.6% of sessions reach a clean completion. The combined abandoned+stub rate (70%) indicates most sessions are either dropped mid-work or too minimal to classify. Ghost sessions (15) had 2 or fewer events.

### O08 — Tool Diversity Index

| Category           | Count | %     |
| ------------------ | ----- | ----- |
| low (0-2 tools)    | 27    | 26.2% |
| medium (3-5 tools) | 29    | 28.2% |
| high (6+ tools)    | 47    | 45.6% |

Nearly half the sessions use 6+ distinct tools, indicating complex multi-tool workflows are common in this batch.

## Key Observations

1. **High abandonment rate**: 70% of sessions end without completion. This is consistent with exploratory/advisory session patterns where the user gets what they need partway through.
2. **Tool-heavy batch**: 45.6% high tool diversity suggests batch 03 skews toward implementation and investigation sessions rather than quick Q&A.
3. **Paste-driven openings**: 19.4% of sessions open with >2000 char prompts, indicating significant context-loading or handover patterns.
4. **Minimal PII/agent contamination**: Only 1 PII flag and 1 machine-initiated session in 103 — the dataset is clean.
