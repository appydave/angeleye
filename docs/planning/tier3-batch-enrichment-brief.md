# Tier 3 Batch Enrichment Brief — Future Round (Phase 4)

**Created**: 2026-03-29
**Context**: Identified during Phase 2a planning. Maps to data-landscape.md Strategy C (LLM-Assisted Enrichment).
**Status**: Queued for Phase 4 — not in scope for Phase 2.

---

## Goal

Close the remaining ~30% of the gap between live registry data and analysis campaign richness using LLM batch processing.

## Background

The analysis campaign (angeleye-analysis-1) processed 924 sessions and produced rich classifications across 13 classifier dimensions, 22+ predicates, 478 subtypes, and 7 observation fields. The live system computes ~70% of this deterministically (Phases 2-3). The remaining ~30% genuinely requires semantic understanding.

## The 22 Tier 3 Items (require LLM)

### Predicates (P01-P16 subset)

- P01 `is_feature_construction` — Was code being built? (semantic, not just tool pattern)
- P02 `has_frustration_signals` — User frustration tone detection
- P03 `is_multi_phase` — Multiple distinct work phases in one session
- P04-P16 various quality/behavioral signals (mix of heuristic + LLM)

### Classifier Dimensions

- `opening_style` — 62 unique values, long tail needs LLM for edge cases
- `closing_style` — 77 unique values, same
- `tool_profile` — 60 unique values, most deterministic but edge cases need LLM
- `session_subtype` — 478 unique values, top 20 are rule-based (Phase 2c), long tail needs LLM

### Observations (free-text, fully LLM)

- `frustration_analysis` — Narrative description of frustration patterns
- `phase_breakdown` — Description of session phases and transitions
- `session_chain` — How this session relates to others
- `skill_gap` — What the user struggled with
- `cwd_mismatch` — Explanation of why CWD doesn't match real project
- `O06 autonomy_profile` — Narrative autonomy description
- `O07 machine_character` — Machine usage personality

## Execution Pattern

### Provider split (proven in OMI extraction work)

- **Gemini Flash** for batch classification — cheap, fast, good at structured output
  - Session type disambiguation for ambiguous cases
  - Subtype classification (long tail beyond top 20 rules)
  - Opening/closing style classification
  - Frustration signal detection
- **Codex** for discovery — good at finding patterns humans miss
  - Cross-session linkage patterns
  - New subtype discovery
  - Observation narrative generation

### Batch architecture

1. Read N sessions from registry.json where enrichment fields are missing
2. For each session: extract first/last 50 events from JSONL as context
3. Send batch to LLM with structured output schema
4. Write enriched fields back to registry.json with `_enrichment_source: "llm_batch"` provenance

### Cost estimate

- ~1K tokens input per session (50 events compressed)
- ~200 tokens output per session (structured classification)
- 924 sessions × 1.2K tokens = ~1.1M tokens total
- Gemini Flash pricing: ~$0.10 per 1M tokens = ~$0.11 for full corpus
- Negligible cost for massive enrichment

## Key Connections

- `docs/planning/data-landscape.md` Section 7, Strategy C — canonical description of this approach
- Phase 2a (current) proves the 70% deterministic claim by visualizing mock vs live
- Phase 2c adds ~8 deterministic classifier extensions (closing more of Strategy A)
- Phase 3 adds batch heuristic scan (Strategy B)
- **This brief = Strategy C** — the final tier

## Dependencies

- Phase 2a complete (gap visibility proven)
- Phase 2c complete (deterministic enrichment maximized — don't LLM what you can compute)
- Batch runner infrastructure (read sessions, call LLM, write back)
- Re-enrich button in Settings (Phase 2c, B062) — same UX pattern, just different backend

## Risks

- LLM classification consistency across sessions — mitigate with few-shot examples from analysis campaign
- Registry.json concurrent writes during batch — mitigate with existing enqueueWrite pattern
- Stale enrichment as new sessions arrive — mitigate with "enrich last N" incremental mode

---

**This brief will be auto-detected by Ralphy when Phase 4 planning begins.**
