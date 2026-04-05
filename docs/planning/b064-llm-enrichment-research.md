# B064 — Tier 3 LLM Batch Enrichment (Research)

**Date**: 2026-03-30
**Status**: Research complete, implementation not started

## What Needs LLM Enrichment

Phase 2c deterministic classifier covers ~70% of enrichment. Remaining gaps that genuinely need semantic understanding:

- **9 predicates**: P01-P03 (feature construction, frustration signals, multi-phase), P07, P10, P13-P16
- **6 classifiers**: C04, C07-C08, C10, C12-C13 (long-tail subtypes, edge cases)
- **7 observations**: O02-O08 (frustration_analysis, phase_breakdown, session_chain, skill_gap, cwd_mismatch, autonomy_profile, machine_character) — all free-text narratives

**Token estimate**: ~1.1M tokens for all 924+ sessions

## Provider Comparison

| Provider             | Cost (924 sessions) | Quality | Best for              |
| -------------------- | ------------------- | ------- | --------------------- |
| **Gemini 2.5 Flash** | ~$0.08              | 80-85%  | **Primary processor** |
| OpenAI Batch API     | ~$8.25              | 90-95%  | Validation/fallback   |
| Claude Batch API     | ~$3.30              | 95%+    | Quality spot-check    |
| Local (Mistral 7B)   | $0                  | 65-70%  | Testing/privacy       |

## Recommended: Two-Tier Strategy

**Tier A — Gemini (primary)**:

- Process all sessions in batch
- ~$0.08 total, ~60 seconds
- Structured JSON output matching v3 schema
- 1M free tokens/month on free tier

**Tier B — Claude Batch (validation)**:

- Spot-check 50-100 sample sessions
- ~$0.17-0.34
- Identifies edge cases Gemini misses
- Quality assurance before committing to registry

**Total**: ~$0.25-0.50 for full pipeline with validation

## Key Architectural Decisions

1. **Provider abstraction** — Support Gemini/Claude/OpenAI interchangeably
2. **Provenance tagging** — Every enriched field gets `_enrichment_provider`, `_enrichment_timestamp`, `_enrichment_version`
3. **Staging pattern** — Write to temp file, validate, then commit to registry
4. **Idempotency** — Only enrich sessions missing Tier 3 data
5. **Incremental mode** — Both batch (all 924) and streaming (new sessions)
6. **Avoid vendor lock-in** — Don't use Claude for both development AND enrichment

## Existing Documentation

- `docs/planning/tier3-batch-enrichment-brief.md` — 22 Tier 3 items, cost estimates
- `docs/planning/data-landscape.md` — Three enrichment strategies
- `docs/planning/enrichment-pipeline/execution-paths.md` — Ralphy/Codex/SDK paths
- `docs/planning/enrichment-pipeline/predicate-tier-reference.md` — Full tier breakdown

## Implementation Phases

1. **Finish Tier 1+2 deterministic** — remaining predicates (~4-6 hours, $0)
2. **Batch heuristic scan** — regex/pattern matching without LLM (~8 hours, $0)
3. **Tier 3 LLM enrichment** — Gemini primary + Claude validation (~12-16 hours, ~$0.50)
