# IMPLEMENTATION_PLAN.md — AngelEye Doc Audit Fixes

**Goal**: Fix the 5 high-priority documentation audit findings from the 2026-03-29 coherence audit — factual errors and stale numbers that confuse every future session.
**Started**: 2026-03-29
**Target**: All 5 high-priority items resolved, no factual contradictions remain in core docs.
**Profile**: Content

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — Fix hook architecture conflict: Rewrote ingestion-architecture.md "Preferred Path" from HTTP Hooks → Command Hooks (curl). Updated heading, prose, callout, and flow diagram.
- [x] WU02 — Fix hook count mismatch: Updated 6 locations across 4 files from 21/22/24 → 25. Files: CLAUDE.md (line 20), ingestion-architecture.md (line 117), requirements.md (lines 47, 78, 398).
- [x] WU03 — Fix "Three Jobs" → "Four Jobs" header in requirements.md (line 20).
- [x] WU04 — Marked completed items in requirements.md: B038-B043 strikethrough with commit refs, B023+B037 strikethrough in Future Capabilities.
- [x] WU05 — Fix stale numbers in future-vision.md: 7→25 event types, 794→924+ sessions, 6→12+ types with 25 predicates and 7 observations, 268→924 sessions analysed.

## Failed / Needs Retry

## Notes & Decisions

- Canonical hook count: 25 (from hooks-reference.md line 49)
- Stale numbers are in angeleye-future-vision.md, not README.md (audit item 5 had wrong file)
- Brain files are outside the repo at ~/dev/ad/brains/angeleye/ — no worktree needed
- Wave 11 already completed full hook coverage — references to "Wave 11 will expand" are also stale
