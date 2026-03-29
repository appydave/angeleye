# Assessment: Phase 2c — Deterministic Classifier Extensions

**Campaign**: angeleye-phase2c-classifier
**Backlog**: B060, B061, B062
**Date**: 2026-03-29
**Results**: 4 complete, 0 failed + 4 delivery review patches applied

## Results Summary

| WU   | Backlog | Description                                                        | Outcome             |
| ---- | ------- | ------------------------------------------------------------------ | ------------------- |
| WU01 | B060    | Types + 4 classifiers (delegation, initiation, continuity, output) | Complete — 35 tests |
| WU02 | B060    | 4 classifiers (opening, closing, autonomy, liveness)               | Complete — 30 tests |
| WU03 | B061    | Top-20 subtype rules + wiring                                      | Complete — 25 tests |
| WU04 | B062    | Re-enrich button in Settings                                       | Complete — 6 tests  |

**Post-build**: Delivery review (5/6 dimensions, AA skipped) found 4 patches applied in-session.

## Delivery Review Summary

**Verdict**: CONDITIONAL PASS -> patched to PASS

| Dimension         | Verdict | Key Finding                                              |
| ----------------- | ------- | -------------------------------------------------------- |
| BH (Blind Hunter) | CP      | `new_artifacts` unreachable, directive too broad         |
| EC (Edge Case)    | CP      | Regex word boundaries (highest impact), empty file guard |
| AR (Architecture) | CP      | classifier.service.ts at 1099 lines, plan split          |
| CQ (Code Quality) | CP      | Math.min spread, duplicate event filtering               |
| UT (Unit Tests)   | CP      | Test helper duplication, missing edge case tests         |

**Patches applied**:

1. Added `\b` word boundaries to all 8 subtype regexes (+ `s?` for plurals)
2. Replaced `Math.min(...spread)` with `.reduce()` in detectSessionLiveness
3. Added `if (!r.ok) throw` in runEnrich HTTP check
4. Added `if (!file) continue` guard in detectOutputType

## What Worked Well

- **Wave parallelism at 2 agents/wave**: Zero merge conflicts across both waves. File ownership rules in IMPLEMENTATION_PLAN.md worked perfectly.
- **WU01 absorbed WU02's wiring**: WU01 proactively wired all 8 detectors into classifySession(), even though the plan had WU02's 4 as standalone-only. This eliminated WU03's secondary task and let it focus solely on subtype detection.
- **Re-enrich reused existing infrastructure**: No new server endpoint needed — just `?force=true` on sync. Clean.
- **Delivery review caught real issues**: Regex word boundaries would have caused measurable misclassification on production data. Math.min spread was a latent crash on marathon sessions.
- **Existing classifier patterns made implementation fast**: The detect\* function pattern is well-established — all 9 new functions followed it cleanly.

## What Didn't Work

- **WU01 and WU02 had merge friction**: Both agents touched classifier.service.ts simultaneously. WU01 finished first and committed. WU02 had to resolve conflicts (duplicate declarations, import style mismatches). The agents handled it, but it added time.
- **Test helper duplication across 3 files**: Each test file created its own makeEvent/makeToolEvent/makePromptEvent. Should have been extracted to a shared helper. This is now 3x maintenance burden.
- **Test file overlap**: classifier-phase2c.test.ts and classifier-phase2c-b.test.ts both test the same 4 functions (opening, closing, autonomy, liveness). The -b file is a strict superset. The overlap inflates test count without adding coverage.
- **`new_artifacts` output type is dead code**: The detection logic makes it unreachable. Needs design rethink — should "Write-only, no Edit" be the criterion?
- **`directive` delegation style fires too broadly**: Any prompt <50 chars without ? becomes directive. Needs positive verb matching.
- **Dropped `update` from release_exploration regex**: The delivery review flagged it as too broad ("update the docs" -> release_exploration). Removed during patch, but this means prompts like "check the latest update" won't match. Acceptable trade-off.

## Key Learnings -- Application

- **Word boundaries on all keyword regexes**: Always use `\b` when matching English words in prompts. The substring match problem is pervasive — "ci" inside "special", "fix" inside "prefix", "test" inside "latest".
- **`s?` suffix on bounded patterns**: English plurals are common in prompts. `\b(?:test|spec)\b` misses "tests". Use `\b(?:test|spec)s?\b`.
- **Math.min/max spread is unsafe on dynamic arrays**: Use `.reduce()` instead. This applies anywhere events are mapped to values.
- **Empty tool_summary fields need guards**: Hook data can be incomplete. Always check for empty strings before classifying file paths.
- **Re-enrich is just force=true**: No new infrastructure needed. The sync pipeline already supported full reclassification.

## Key Learnings -- Ralph Loop

- **WU01 proactively absorbing WU04 wiring was net positive**: Even though it deviated from the plan, it reduced inter-wave dependencies. Consider giving the "types + wiring" WU explicit license to wire everything.
- **3 test files for 1 implementation file is too many**: Should have been 2 at most — one for B060 detectors, one for B061 subtypes. The split between phase2c and phase2c-b was an artifact of parallel agents, not a design choice.
- **Delivery review at campaign end is high-value**: 4 real patches from 5 dimensions. The regex word boundary finding alone justified the cost. Make this mandatory, not optional.
- **AGENTS.md regex examples should include word boundaries**: Future AGENTS.md should show `\b` in all regex reference patterns to prevent agents from writing unbounded patterns.

## Promote to Main KDD?

1. **Word boundaries on prompt keyword regexes** — HIGH, applies to all future classifier work
2. **Math.min/max spread unsafe on dynamic arrays** — HIGH, applies to any event processing
3. **Empty tool_summary.file guard** — MEDIUM, applies to all file-path-based classification
4. **Re-enrich = sync with force=true** — MEDIUM, architectural decision worth preserving

## Suggestions for Next Campaign

- **Extract test helpers** to shared `classifier.test-helpers.ts` — dedup 3 files
- **Merge or dedup** classifier-phase2c.test.ts and classifier-phase2c-b.test.ts
- **Plan classifier.service.ts split** before adding more detectors (1099 lines, natural seams identified by AR)
- **Redesign `new_artifacts`** output type — current logic is dead code
- **Refine `directive` delegation style** — add positive imperative verb matching
- **Consider passing pre-computed predicates** to Phase 2c detectors (like subtype already does) to eliminate redundant re-computation
- **Add `resume/resuming` to CONTINUATION_PATTERN** in detectOpeningStyle (EC finding)
