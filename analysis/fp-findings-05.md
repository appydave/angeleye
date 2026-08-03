---
type: analysis
title: 'Forward Prop Findings 05'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, forward-prop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings - Batch 05

**Sessions processed**: 103
**Date**: 2026-03-23

## Dimension Summary

### P23 - Paperclip/JJ Agent

- **0 sessions** (0%) were Paperclip-initiated
- This batch is entirely human-driven interactive sessions.

### P24 - PII Content

- **0 sessions** (0%) flagged for PII
- No email addresses, phone numbers, API keys, or passwords detected in first prompts or notes.

### P25 - Closing Ceremony

- **21 sessions** (20%) had a closing ceremony
- Ceremony types observed: bookend_close, commit_and_push, test_verification, delegation_burst
- The remaining 80% either had abrupt abandons, no closing_style classified, or the classifier was not run (54 sessions lack classifiers entirely, likely from earlier analysis waves).

### C12 - Prompt Verbosity

| Level   | Count | Pct |
| ------- | ----- | --- |
| terse   | 38    | 37% |
| normal  | 37    | 36% |
| verbose | 14    | 14% |
| paste   | 14    | 14% |

- Heavy skew toward short prompts. The terse+normal combined (73%) reflects David's preference for quick commands, slash-skill invocations, and short questions.
- The 14 paste sessions likely involve compaction artifacts or large context dumps.

### C13 - Session Lifecycle

| State       | Count | Pct |
| ----------- | ----- | --- |
| complete    | 80    | 78% |
| ghost       | 17    | 17% |
| abandoned   | 4     | 4%  |
| interrupted | 1     | 1%  |
| stub        | 1     | 1%  |

- Strong completion rate. Most sessions achieve their goal.
- 17 ghosts are zero-tool sessions with no notes -- likely quick Q&A or accidental opens.
- 4 abandoned sessions include one blocked by missing epics prerequisite.

### O08 - Tool Diversity Index

| Level   | Count | Pct |
| ------- | ----- | --- |
| high    | 67    | 65% |
| unknown | 20    | 19% |
| medium  | 11    | 11% |
| low     | 5     | 5%  |

- Majority of sessions (65%) use 6+ distinct tools, indicating substantial coding/file-manipulation work.
- 20 "unknown" sessions had no tool data recorded (0 tools) -- these correlate with the ghost/stub lifecycle states and sessions from earlier analysis waves missing tool data.

## Notable Patterns

1. **No autonomous agents**: Batch 05 is 100% human-interactive. Paperclip/JJ agents are not present in this slice.
2. **High tool diversity dominates**: 65% of sessions use 6+ tools, suggesting this batch skews toward substantive development sessions rather than quick lookups.
3. **Classifier coverage gap**: ~52% of sessions (54/103) lack closing_style classifiers, likely because they were indexed in earlier waves before that classifier was added. This means the 20% closing ceremony rate is likely understated.
4. **Terse prompts + high tool use**: The combination of short prompts with high tool diversity suggests David frequently uses skill invocations and short directives that trigger extensive automated work.
