# IMPLEMENTATION_PLAN.md — Phase 2c: Deterministic Classifier Extensions

**Goal**: Add 8 new deterministic classifier fields, top-20 session subtype detection rules, and a re-enrich button in Settings.
**Backlog**: B060, B061, B062
**Started**: 2026-03-29
**Target**: All 1,039+ sessions gain 9 new classification fields; subtypes computed for ~60% of sessions; Settings has one-click full reclassification.

## Summary

- Total: 4 | Complete: 4 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] WU01 — **New types + classifiers A** (B060): 7 new types, 8 RegistryEntry fields, ClassificationResult updated, 4 detectors (delegation_style, initiation_source, session_continuity, output_type) implemented + wired. Also wired WU02's 4 detectors into classifySession(). 35 tests. Commit 5cbe796f.

- [x] WU02 — **Classifiers B** (B060): 4 standalone detector functions (opening_style, closing_style, autonomy_ratio, session_liveness). 30 tests. Merged with WU01 in commit 5cbe796f.

- [x] WU03 — **Subtype rules + wiring** (B061): detectSessionSubtype() with 19 rules across 6 parent types. Wired into classifySession(). 25 tests. Committed with WU04 in 190649bd.

- [x] WU04 — **Re-enrich UI** (B062): "Session Enrichment" card in SettingsView with Re-enrich All button (POST /api/sync?force=true). Both buttons cross-disable. 6 tests. Commit 190649bd.

## In Progress

## Complete

## Failed / Needs Retry

## Wave Plan

**Wave 1** (2 parallel agents — server only, no shared file conflicts):
| Agent | WU | Files touched |
|-------|-----|---------------|
| A | WU01 | `shared/src/angeleye.ts`, `shared/src/index.ts`, `classifier.service.ts`, `classifier.service.test.ts` |
| B | WU02 | `classifier.service.ts` (append functions only), new test file or append to existing |

**Conflict guard**: WU01 owns all changes to `shared/`, `ClassificationResult`, and `classifySession()`. WU02 only appends standalone `export function detect*()` functions below the existing code. No overlap.

**Wave 2** (2 parallel agents — server + client, no conflicts):
| Agent | WU | Files touched |
|-------|-----|---------------|
| C | WU03 | `classifier.service.ts` (wire + new function), `classifier.service.test.ts` |
| D | WU04 | `client/src/views/SettingsView.tsx`, `client/src/test/` |

## Notes & Decisions

- **Bucketed opening/closing styles** (~10-15 categories each, not 62/77 variants). Finer-grained observation belongs to the LLM predicate tier (Phase 4).
- **19 subtypes** (what's already defined in the type union). Add more later if needed.
- **Re-enrich = full reprocess**. No "last N" scope — when rules change, reclassify everything. `POST /api/sync?force=true` already exists and does this.
- **autonomy_ratio is a number** (0.0-1.0), not a category. All other new fields are string enums.
- **session_liveness** is bucketed: high/medium/low based on event density over session duration.
