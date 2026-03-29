# IMPLEMENTATION_PLAN.md — Phase 2c: Deterministic Classifier Extensions

**Goal**: Add 8 new deterministic classifier fields, top-20 session subtype detection rules, and a re-enrich button in Settings.
**Backlog**: B060, B061, B062
**Started**: 2026-03-29
**Target**: All 1,039+ sessions gain 9 new classification fields; subtypes computed for ~60% of sessions; Settings has one-click full reclassification.

## Summary

- Total: 4 | Complete: 0 | In Progress: 0 | Pending: 4 | Failed: 0

## Pending

## In Progress

- [~] WU01 — **New types + classifiers A** (B060): Add 8 new type literals + RegistryEntry fields to `shared/src/angeleye.ts`. Implement 4 detector functions in `classifier.service.ts`: `detectDelegationStyle`, `detectInitiationSource`, `detectSessionContinuity`, `detectOutputType`. Add all 8 new fields to `ClassificationResult`. Wire these 4 into `classifySession()`. Tests for all 4 detectors.

- [~] WU02 — **Classifiers B** (B060): Implement 4 standalone detector functions in `classifier.service.ts`: `detectOpeningStyle`, `detectClosingStyle`, `detectAutonomyRatio`, `detectSessionLiveness`. DO NOT modify `classifySession()` or `ClassificationResult` — WU01 owns those. Tests for all 4 detectors.

- [ ] WU03 — **Subtype rules + wiring** (B061 + B060): Implement `detectSessionSubtype()` with top-20 rules. Wire WU02's 4 detectors into `classifySession()` (they were left unwired in Wave 1). Wire subtype into `classifySession()`. Tests for subtype detection.

- [ ] WU04 — **Re-enrich UI** (B062): Add "Re-enrich All" button to `SettingsView.tsx` that calls `POST /api/sync?force=true`. Show syncing state + results using existing `DiffTable`. Tests.

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
