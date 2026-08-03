---
type: analysis
title: 'Findings W13-02'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 13-02

**Wave**: W13-02 | **Machine**: m4-mini | **Date**: 2026-03-23
**Sessions analysed**: 15 | **Scale**: all micro (8-10 events)

## BUILD Accuracy

**BUILD accuracy: 0/12 (0%)**. Of 12 sessions registry-classified as BUILD, zero were correct. Two sessions were registry-classified as KNOWLEDGE (one correct, one wrong) and one as ORIENTATION (correct).

This is consistent with waves 9 and 12 — micro/light sessions from brains/ CWD are essentially never BUILD.

## Reclassification Summary

| Session  | Registry    | Reclassified | Subtype                         |
| -------- | ----------- | ------------ | ------------------------------- |
| 34d3e768 | BUILD       | SYSOPS       | sysops.remote_desktop_setup     |
| 532c0410 | BUILD       | RESEARCH     | research.quick_answer           |
| 708c452a | BUILD       | ORIENTATION  | orientation.artifact_retrieval  |
| 78344524 | BUILD       | KNOWLEDGE    | knowledge.brain_update          |
| 267a8725 | BUILD       | OPERATIONS   | operations.cross_session_commit |
| 9bb2eec8 | ORIENTATION | ORIENTATION  | orientation.artifact_retrieval  |
| 1e529a9a | BUILD       | RESEARCH     | research.omi_transcript_query   |
| 933fb9a9 | KNOWLEDGE   | RESEARCH     | research.quick_answer           |
| 27087f60 | BUILD       | KNOWLEDGE    | knowledge.content_generation    |
| 4fb12fb7 | BUILD       | RESEARCH     | research.quick_answer           |
| 2c59011a | BUILD       | OPERATIONS   | operations.worktree_cleanup     |
| 603f4daf | BUILD       | OPERATIONS   | operations.poem_execution       |
| 8ab976fa | BUILD       | ORIENTATION  | orientation.morning_triage      |
| 06c51966 | KNOWLEDGE   | RESEARCH     | research.quick_answer           |
| 18c0c0c8 | BUILD       | RESEARCH     | research.web_access             |

## Type Distribution

- RESEARCH: 6 (40%) — dominated by quick_answer subtype (4 instances)
- OPERATIONS: 3 (20%) — cross_session_commit, worktree_cleanup, poem_execution
- ORIENTATION: 3 (20%) — artifact_retrieval (2), morning_triage (1)
- KNOWLEDGE: 2 (13%) — brain_update, content_generation
- SYSOPS: 1 (7%) — remote_desktop_setup

## Key Observations

### 1. "Quick Answer" is the dominant micro session subtype

4 of 15 sessions (27%) classified as research.quick_answer — user asks a factual question, Claude looks it up in brain files, session ends. These are the micro-session equivalent of a Google search. Sessions: 532c0410 (M4 Pro SSH details), 933fb9a9 (M4 Mini hostname), 4fb12fb7 (Claude plan mode), 06c51966 (window tiling apps).

### 2. Machine connectivity is a recurring topic

3 sessions across this batch relate to SSH/remote access between M4 Mini and M4 Pro: 34d3e768 (screen sharing setup), 532c0410 (M4 Pro connection details), 933fb9a9 (M4 Mini hostname via Tailscale). This suggests a multi-machine setup that causes frequent friction — potential automation candidate.

### 3. CWD incidental rate: 60% (9/15)

9 of 15 sessions had incidental CWD. brains/ as CWD accounted for 11/15 sessions total. At micro scale, brains/ CWD is almost always a "home terminal" — the user happened to have a terminal open there.

### 4. Cross-session patterns

Two sessions show explicit cross-session patterns:

- **708c452a**: Pastes entire prior agent swarm output as verification (orientation.artifact_retrieval)
- **267a8725**: Pastes prior session's git diff then commits it (operations.cross_session_commit)

### 5. Voice artifacts catalog additions

New voice artifacts from this batch:

- "cluaed" = "Claude" (4fb12fb7)
- "Anthropik" = "Anthropic" (4fb12fb7)
- "open headed" = unclear, possibly "open it" (18c0c0c8)
- "neil" misheard as "nil" (34d3e768 — user self-corrects)
- "I a quick list" = "I want a quick list" (9bb2eec8)

### 6. Skill gap: Claude self-documentation

Session 4fb12fb7 shows a skill gap where Claude searched brain files instead of using its own Anthropic documentation skill to answer questions about Claude Code plan mode. User explicitly corrected: "use the one from Anthropik."

### 7. PII present

Session 1e529a9a (OMI transcript query) contains names (Jan, Phil), conversation summaries, and pricing information ($14.95/month) from OMI device transcripts.

### 8. POEM execution confirms operations pattern

Session 603f4daf ("Can you run an execution for 108?") is another POEM executor instance — user runs pre-built workflow by number. Confirms the pattern from wave 5: `*run NNN` / "run execution for NNN" = operations.poem_execution, not BUILD.

## Predicate Firing Summary

| Predicate                   | True | False | Null |
| --------------------------- | ---- | ----- | ---- |
| P01 is_feature_construction | 0    | 15    | 0    |
| P02 has_frustration_signals | 1    | 14    | 0    |
| P03 is_multi_phase          | 3    | 12    | 0    |
| P04 has_brain_file_writes   | 2    | 13    | 0    |
| P05 has_playwright_calls    | 0    | 15    | 0    |
| P06 has_cross_session_refs  | 2    | 13    | 0    |
| P07 has_skill_gap_signal    | 1    | 14    | 0    |
| P08 has_unauthorized_edits  | 0    | 15    | 0    |
| P09 is_compaction_resume    | 0    | 15    | 0    |
| P10 is_cwd_incidental       | 9    | 6     | 0    |

P10 (CWD incidental) is the dominant predicate at micro scale — fired in 60% of sessions. P01 (feature construction) was false for all 15, confirming that micro sessions never build features.

## No Friction Predicates Fired

P13-P16 did not fire in this batch. Micro sessions are too short for meaningful friction signals — the user either gets what they want quickly or abandons.
