---
type: analysis
title: 'Forward Prop Findings 06'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, final-pass, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 06

**Sessions processed:** 103
**Date:** 2026-03-23

## Dimension Summary

### P23 — Paperclip Agent

- **0 / 103** sessions flagged as Paperclip/JJ-initiated.
- No autonomous agent patterns detected in this batch.

### P24 — PII Content

- **3 / 103** sessions contain PII (email addresses).
- Sessions: `d1eca273` (david@ideasmen.com.au), `faf76383` (git@github.com), `1700f3ec` (david@ideasmen.com.au).
- All are David's own email in prompt context — low sensitivity but flagged for completeness.

### P25 — Closing Ceremony

- **25 / 103** (24%) sessions have a closing ceremony.
- Common closing styles: knowledge_capture, completion_check, deliverable, commit.
- 12 sessions classified as abandoned (no positive closing signal, low activity).

### C12 — Prompt Verbosity

| Category           | Count | %   |
| ------------------ | ----- | --- |
| terse (<50 chars)  | 24    | 23% |
| normal (50-500)    | 49    | 48% |
| verbose (500-2000) | 14    | 14% |
| paste (>2000)      | 16    | 16% |

- Nearly half of sessions open with normal-length prompts.
- 24 terse prompts suggest quick commands or follow-up sessions.
- 16 paste-length prompts indicate large context dumps or specification handoffs.

### C13 — Session Lifecycle

| Category    | Count | %   |
| ----------- | ----- | --- |
| complete    | 91    | 88% |
| abandoned   | 12    | 12% |
| ghost       | 0     | 0%  |
| interrupted | 0     | 0%  |
| stub        | 0     | 0%  |

- 88% of sessions reached completion — high productivity batch.
- 44 sessions had empty `entry.shape` metadata (from an earlier analysis wave) but were rescued via `shape.tools` fallback, all showing substantial tool usage.

### O08 — Tool Diversity Index

| Level              | Count | %   |
| ------------------ | ----- | --- |
| high (6+ tools)    | 53    | 51% |
| medium (3-5 tools) | 46    | 45% |
| low (0-2 tools)    | 4     | 4%  |

- Over half of sessions use 6+ distinct tool types — consistent with multi-step development workflows.
- Only 4 sessions limited to 1-2 tools.

## Data Quality Note

44 of 103 sessions (43%) had empty `entry.shape` objects (event_count=0, user_prompt_count=0), likely from a wave that did not populate shape metrics. These were resolved using `shape.tools` data which showed real activity. Without this fallback, they would have been misclassified as ghosts.
