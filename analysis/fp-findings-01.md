---
type: analysis
title: 'Forward Prop Findings 01'
description: 'Forward prop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, forward-prop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Final Pass Findings — Batch 01

**Batch**: fp-batch-01 (103 sessions)
**Processed**: 2026-03-23

## Distribution Summary

| Dimension                | Values                                                          |
| ------------------------ | --------------------------------------------------------------- |
| P23 paperclip_agent      | 0 true / 103 false — no autonomous agent sessions in this batch |
| P24 has_pii_content      | 3 true / 100 false — conservative flagging                      |
| P25 has_closing_ceremony | 8 true / 95 false — only ~8% close deliberately                 |
| C12 prompt_verbosity     | unknown: 61, normal: 32, terse: 10, verbose: 0, paste: 0        |
| C13 session_lifecycle    | ghost: 63, abandoned: 30, interrupted: 5, stub: 4, complete: 1  |
| O08 tool_diversity       | unknown: 63, high: 22, medium: 14, low: 4                       |

## Key Observations

### Ghost Dominance (61%)

63 of 103 sessions are ghosts — no shape data (event_count=0, no tools, no prompt). These are sessions that exist in the index but had no parseable JSONL content. This is consistent across the 61 sessions that also have unknown verbosity and unknown tool diversity. They likely represent sessions that were created but never used, or whose JSONL files were missing/empty at analysis time.

### Low Closing Ceremony Rate (8%)

Only 8 sessions had a deliberate closing pattern (bookend_close, commit_and_push, memory_write, context_capture, commit_then_gap). The other 95 sessions either had no closing data or ended abruptly. This suggests closing ceremonies are rare in David's workflow — most sessions just stop.

### No Paperclip/JJ Agents

Zero autonomous agent sessions detected in batch 01. This is expected — the Paperclip system may not have been active during the period these sessions were created, or those sessions landed in other batches.

### PII Flagged Sessions (3)

- **e73d7fc7** (project: ad) — contains pasted terminal output with login info
- **d5fa9524** (project: ansible) — contains SSH connection strings with hostnames (davidcruwys@mac-mini-m2.local)
- **1c87debe** (project: brains) — mentions "credit card" and "WISE account" in context of Philippines purchasing research

The PII here is mostly operational (SSH hostnames, account references) rather than raw credentials. Still worth flagging for any future data export/sharing.

### Abandoned Sessions (29%)

30 sessions had significant activity (event_count > 20 in many cases) but no closing ceremony and disposition of "active" or no disposition. These are work sessions that were simply left open without formal closure — the dominant pattern for non-ghost sessions.

### Interesting Patterns

1. **Compaction flush detected**: Session 8fe1e952 (brain-dynamous) — contains an explicit "Pre-compaction memory flush" prompt, a pattern where the user manually triggers context preservation before auto-compaction hits. This is a candidate for a new dimension (P_compaction_aware or similar).

2. **Efficient diverse tool usage**: Two sessions (9476dfb9, 38a1c160) used 6-7 different tools in under 30 events — high tool diversity with compact execution. This "efficient multi-tool" pattern may indicate skilled/experienced sessions versus exploratory ones.

## Candidate New Dimensions

- **P_compaction_aware**: Boolean — session contains evidence the user was aware of and responding to compaction pressure (manual memory flushes, explicit "save context" before compaction). Distinct from P25 closing ceremony which is about session end, not compaction management.
- **C_data_completeness**: String (full/partial/empty) — how much shape data was available for analysis. 61 of 103 sessions here were "empty" which limits all other dimension accuracy. Tracking this explicitly would help downstream consumers know which records to trust.
- **O_session_density**: Ratio of active_minutes to event_count — distinguishes rapid-fire automated sessions from slow interactive ones. Would complement O08 tool diversity.
