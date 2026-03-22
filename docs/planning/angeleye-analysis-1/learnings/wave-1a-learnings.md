# Wave 1a Learnings

**Wave**: 1a (calibration — 4 smaller sessions)
**Date**: 2026-03-22

## Application Learnings

### BUILD is massively over-classified

3 of 4 sessions classified as BUILD were reclassified: 2 → ORIENTATION, 1 → TEST. The 85% BUILD figure in the registry is confirmed as over-classification, not a real distribution.

**Root causes identified**:

1. **Bash read/write blindness**: The classifier treats all Bash calls as write-intent. Session 11553588 had 9 Bash calls — all `find`, `ls`, `open` (read-only). The rule `Bash >= 50% AND no Playwright → INFRASTRUCTURE_WORK` doesn't distinguish intent.
2. **project_dir ignored for brains/**: Session 78f31f8c in brains/ was classified BUILD. The composite classifier rule `Bash dominant AND project_dir contains brains → KNOWLEDGE_WORK` exists but isn't being applied — or the session wasn't Bash-dominant enough to trigger it.
3. **Edit count without context**: Session a080427c had 33 Edits (triggers BUILD heuristic) but all were reactive bug fixes during UAT, not planned construction. Edits interleaved with 58 Playwright calls = TEST, not BUILD.

**Proposed classifier fixes**:

- Split Bash into read-only (`find`, `ls`, `cat`, `head`, `open`, `wc`) vs write-capable (`npm`, `git commit`, `mkdir`, `echo >`, `sed`)
- Require `project_dir NOT brains` for BUILD classification
- When `Playwright > 30 AND Edit > 15`, classify as TEST.uat_debug_hybrid, not BUILD

### New subtypes proposed (need more examples before committing)

- `orientation.bookend` — sessions that bracket real-world events (prep before, capture after)
- `orientation.artifact_retrieval` — single-turn sessions locating prior session output
- `orientation.morning_triage` — multi-project planning with /focus + /radar + OMI ingestion
- `test.uat_debug_hybrid` — interleaved UAT testing and reactive code fixing

### Voice transcription is pervasive

All 4 sessions showed evidence of voice-transcribed prompts. Error patterns: proper nouns garbled, sentence boundaries missing, filler words present. The 60-65% estimate from the 100-session study seems conservative for this user.

### Closing ceremonies exist in distinct forms

- **Memory write ceremony**: "Is there anything we need to keep?" → structured memory files (thumbrack)
- **Context capture ceremony**: Write to MEMORY.md with meeting outcomes (lars)
- **Abrupt abandonment**: Session ends mid-conversation, no ceremony (brains)

## Loop Meta-Learnings

### Wave sizing

4 agents on small sessions (8-110KB) completed in ~2.5 minutes. Good calibration — can go to 4-5 agents for the larger sessions in wave 1b.

### Agent output quality

All 4 agents followed the analysis framework well. Each challenged the BUILD classification independently and found genuine reclassifications. The prompt design (asking "is BUILD overassigned?") was effective at preventing rubber-stamping.

### Index file separation pattern works

Having each agent write to its own `index-w1-XX.json` file avoids write conflicts. Coordinator consolidation into `session-index.jsonl` is trivial. Keep this pattern.

### Schema v1 is holding

After 4 entries, the v1 schema is adequate. The `session_type_analysed` field could benefit from being structured (`type.subtype` format) rather than free text — some agents wrote "ORIENTATION / cold_start" and others wrote "orientation.cold_start". Standardise on lowercase dot notation for wave 1b.
