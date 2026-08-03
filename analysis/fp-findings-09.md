---
type: analysis
title: 'Forward Prop Findings 09'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, final-pass, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 09

**Batch**: fp-batch-09 (100 sessions)
**Date**: 2026-03-23

## Summary Statistics

| Dimension             | Breakdown                                      |
| --------------------- | ---------------------------------------------- |
| P23 Paperclip agent   | 8 true, 92 false                               |
| P24 PII content       | 1 true, 99 false                               |
| P25 Closing ceremony  | 5 true, 95 false                               |
| C12 Prompt verbosity  | terse: 33, normal: 43, verbose: 7, paste: 17   |
| C13 Session lifecycle | complete: 80, abandoned: 1, ghost: 6, stub: 13 |
| O08 Tool diversity    | low: 23, medium: 25, high: 42, unknown: 10     |

## Notable Findings

**Paperclip/JJ agent sessions (8)**: All 8 share the identical prompt pattern "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work." Three additional sessions reference Paperclip in notes or prompt context (meetup notes, research, setup) but were human-initiated, correctly excluded.

**PII detection (1)**: Session bb352091 contains a Thai phone number (090-9084217) and physical address in a prompt. Conservative detection caught it via the phone pattern.

**Closing ceremony rate is low (5%)**: Only 5 sessions had commit/push/handover/memory_write signals in their closing style, disposition, or notes. This is consistent with the campaign-wide observation that most sessions end without formal closure.

**Prompt verbosity skews terse/normal (76%)**: 33 terse + 43 normal = 76 sessions under 500 chars. The 17 paste sessions (>2000 chars) likely represent checkpoint resumes or context-heavy prompts. 33 terse sessions (many with empty/None first_real_prompt) correlate with sessions resumed via /rename or checkpoint.

**Tool diversity is high (42%)**: 42 sessions used 6+ distinct tools, reflecting the late-campaign period where complex multi-tool workflows (Playwright, Bash, Read, Edit, Write, Glob, etc.) were common. 10 unknown sessions had no tool data — likely ghost/stub sessions.

**Lifecycle distribution**: 80% complete is expected for this batch period (active development phase). The 6 ghost sessions had near-zero activity and very short prompts. 13 stubs had minimal tool use.
