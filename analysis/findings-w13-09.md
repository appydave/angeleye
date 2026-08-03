---
type: analysis
title: 'Findings W13-09'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-09

**Wave**: W13-09 (final wave)
**Machine**: m4-mini
**Sessions analysed**: 14
**Date**: 2026-03-23

## Batch Summary

All 14 sessions in this batch are **single-event junk sessions** — each contains exactly 1 event, 0 tool calls, and 0 active minutes. Every session was already marked `is_junk: true` in the registry with no `session_type` assigned.

### Classification Breakdown

| Type | Subtype           | Count | Description                                             |
| ---- | ----------------- | :---: | ------------------------------------------------------- |
| META | meta.accidental   |  12   | Session opened and immediately closed or abandoned      |
| META | meta.agent_warmup |   2   | Subagent "Warmup" prompt from brain-dynamous automation |

### Session Details

| #   | Session ID (prefix) | CWD               | Event Type  | Prompt   | Classification    |
| --- | ------------------- | ----------------- | ----------- | -------- | ----------------- |
| 1   | d41da402            | apps/angeleye     | session_end | (none)   | meta.accidental   |
| 2   | a39b3a90            | clients/lars      | session_end | (none)   | meta.accidental   |
| 3   | agent-a3f450c       | brain-dynamous    | user_prompt | "Warmup" | meta.agent_warmup |
| 4   | agent-af5e8ab       | brain-dynamous    | user_prompt | "Warmup" | meta.agent_warmup |
| 5   | 3347d7b5            | brains            | user_prompt | (null)   | meta.accidental   |
| 6   | 63754a2f            | brains            | user_prompt | (null)   | meta.accidental   |
| 7   | c0a0d558            | brains            | user_prompt | "skill"  | meta.accidental   |
| 8   | f45a8766            | brains            | user_prompt | "skill"  | meta.accidental   |
| 9   | 6778c189            | app.supportsignal | user_prompt | (null)   | meta.accidental   |
| 10  | 01021eae            | signal-studio     | user_prompt | "xit"    | meta.accidental   |
| 11  | 61e972df            | signal-studio     | user_prompt | (null)   | meta.accidental   |
| 12  | 6e0cb2e2            | apps/angeleye     | session_end | (none)   | meta.accidental   |
| 13  | 7138d6e4            | brains            | session_end | (none)   | meta.accidental   |
| 14  | 9217ee1d            | brains            | session_end | (none)   | meta.accidental   |

### Observations

1. **Accidental prompt patterns**: Three distinct accidental prompt types observed:
   - "skill" (2x) — user typed `skill` instead of `/skills` command. The missing slash indicates confusion between Claude Code slash commands and plain text input.
   - "xit" (1x) — truncated "exit". User tried to quit but typed before the prompt registered properly.
   - "Warmup" (2x) — subagent warmup probes from brain-dynamous automation, not human input.

2. **CWD distribution of junk sessions**: brains/ (6), apps/angeleye (2), signal-studio (2), brain-dynamous (2), app.supportsignal (1), clients/lars (1). Brains/ dominates junk sessions — consistent with its role as a "home terminal" where sessions are frequently opened and abandoned.

3. **Session_end-only sessions (4/14)**: Four sessions contain only a `session_end` event with no prior `user_prompt`. These represent sessions that were opened (triggering `session_start` hook) and closed before any prompt was entered. The `session_start` event may not have been captured by hooks, leaving only the `session_end`.

4. **Agent warmup pair**: agent-a3f450c and agent-af5e8ab fired at the exact same millisecond (2026-02-28T02:24:20.639Z and .646Z respectively), both from brain-dynamous with "Warmup" prompts. These are parallel subagent warmup probes — likely from Project Theodore / Dynamous startup sequence. Both died immediately with no tool calls, suggesting the warmup failed or was aborted.

5. **BUILD accuracy**: 0/14 (0%). None of these sessions were classified BUILD by the registry (all had null session_type), so there are no BUILD misclassifications to report. This is consistent with the trivial nature of the batch.

### Quality Notes

- All 14 sessions are trivially classifiable from precomputed shapes alone — no JSONL deep reading required beyond spot-checking 4 files to confirm event content.
- All predicates evaluated. P13-P16 (friction predicates) all false — no interaction occurred to generate friction.
- Interest level: low across all 14. No revisit candidates.
