# BOLT — Session Subtype Enrichment Plan

**Goal**: Get `session_subtype` from 574/2533 (23%) to near-complete coverage.  
**Secondary goal**: Backfill Phase 2c fields for the 455 pre-classifier sessions.

---

## Current State (as of 2026-05-03)

| Metric                                          | Value                                   |
| ----------------------------------------------- | --------------------------------------- |
| Total sessions                                  | 2533                                    |
| `session_subtype` set                           | 574 (23%)                               |
| `session_subtype` missing                       | 1959 (77%)                              |
| Phase 2c fields missing (old sessions)          | 455 sessions lack _all_ Phase 2c fields |
| Phase 2c fields present but subtype missing     | 1504 sessions                           |
| LLM-classified in bp-batch files (not imported) | 326 sessions                            |

### Why the 574 are skewed

The deterministic classifier is working but narrow — 75% of its output is ORIENTATION subtypes:

```
296  codebase_exploration   ← ORIENTATION catch-all (too broad)
114  file_retrieval         ← ORIENTATION
 39  playwright_e2e         ← TEST
 31  test_writing           ← BUILD
 21  refactoring            ← BUILD
  9  feature_implementation ← BUILD (only 9 despite 1344 BUILD sessions!)
```

BUILD classification is almost completely broken. Only 9 sessions tagged as `feature_implementation` despite 1344 BUILD sessions in the registry.

---

## Critical Blocker: Taxonomy Mismatch

The **current `SessionSubtype` enum** uses flat underscore notation:
`feature_implementation`, `bug_fix_round`, `codebase_exploration`

The **March campaign LLM output** uses hierarchical dot notation:
`build.feature`, `build.campaign`, `meta.accidental`, `research.exploration`

These are different taxonomies. The LLM taxonomy is richer. **Phase 1 must resolve this before any other phase can proceed.**

March campaign top values (326 sessions, 5 of 9 batches):

```
 16  meta.accidental
  9  research.exploration
  8  build.campaign
  8  build.feature
  8  operations.maintenance
  8  orientation.artifact_retrieval
  8  research.quick_answer
  8  knowledge.general
  7  knowledge.research
  6  operations.system_task
  6  planning.general
  5  orientation.codebase_exploration
  5  meta.ghost_session
  5  build.iterative_design
  4  knowledge.brain_creation
  ...
```

---

## Phase Hierarchy (low-hanging fruit first)

### Phase 1 — Taxonomy Alignment ⚡ (prerequisite, ~1 session)

**Do this first. Everything else depends on it.**

Two options:

- **Option A (extend)**: Keep existing flat enum, add all LLM-produced values as additional entries. Existing data stays valid. Simpler migration.
- **Option B (replace)**: Switch to hierarchical dot notation taxonomy. Richer, but breaks 574 existing values — needs a migration mapping.

Recommendation: **Option A**. Extend the enum. The flat values are still valid subtypes — they just need company. Add all ~30 LLM-produced dot-notation values to `SessionSubtype`.

Work:

1. Add LLM taxonomy values to `shared/src/angeleye.ts` `SessionSubtype` union
2. No data migration needed — existing 574 values stay as-is
3. Update UI labels/display if needed

---

### Phase 2 — Import 326 bp-batch Classifications (zero new inference, ~1 session)

**326 sessions already have LLM classifications sitting in brains/angeleye/analysis/. Just import them.**

The bp-batch JSONL files also contain:

- `classifiers.opening_style` — present in batches 01, 02, 04, 07, 09
- `classifiers.closing_style`
- `classifiers.C08_delegation_style`
- `classifiers.C09_session_continuity`
- `classifiers.C10_output_type`
- `classifiers.C11_initiation_source`

Work:

1. Write `scripts/import-bp-batch.ts` that reads all 9 bp-batch JSONL files
2. For each session_id in bp-batch, find matching registry entry
3. Write `session_subtype` from `classifiers.session_subtype.value` (only if field is currently missing)
4. Write other Phase 2c fields from their respective classifier keys (only if missing)
5. Note: batches 03, 05, 06, 08 have a different schema (`backward_pass` only) — skip or handle separately

**Expected gain**: 574 → ~900 sessions with subtype classified.

Also note: the bp-batch `opening_style` values may overlap with the 224 "unknown" values in the registry — could clear some of those too.

---

### Phase 3 — Widen Deterministic Rules (no LLM, ~1 session)

**The 1504 sessions that have Phase 2c fields but no subtype all went through the classifier — the classifier just returned `undefined` for them. Better rules = free classifications.**

High-impact rules to add (inferred from March campaign taxonomy):

| Pattern                                                  | Proposed subtype                                | Signal                     |
| -------------------------------------------------------- | ----------------------------------------------- | -------------------------- |
| First prompt starts with `/` (skill invocation)          | `build.campaign` or `operations.poem_execution` | first_real_prompt regex    |
| Has task_orchestration + parallel subagents + edit-heavy | `build.orchestrated_campaign`                   | existing predicates        |
| session_type=BUILD + session_scale=micro                 | `build.iterative_design` or `meta.accidental`   | scale + type combo         |
| session_type=KNOWLEDGE + has_brain_file_writes           | `knowledge.brain_update`                        | existing predicate         |
| session_type=KNOWLEDGE + !has_brain_file_writes          | `knowledge.general` or `knowledge.research`     | default                    |
| session_type=OPS + bash-heavy                            | `operations.system_task`                        | type + tool pattern        |
| session_type=RESEARCH + websearch-heavy                  | `research.exploration`                          | type + tool pattern        |
| session_type=PLANNING                                    | `planning.general`                              | default                    |
| session_type=BUILD + edit-heavy + no git outcome         | `build.iterative_design`                        | type + pattern + predicate |
| closing_style=abrupt_abandon                             | `meta.accidental` (if scale=micro)              | Phase 2c field             |

Work:

1. Extend `detectSessionSubtype` in `classifier.service.ts` for missing session types (KNOWLEDGE, OPS, RESEARCH, PLANNING)
2. Add better BUILD defaults (currently only `feature_implementation` fires, which needs git outcome)
3. Force sync after changes

**Expected gain**: Potentially 500-800 more sessions classified from the 1504 pool.

---

### Phase 4 — Backfill 455 Pre-Classifier Sessions (~1 session)

455 sessions are old enough that they never received Phase 2c classification at all. They're missing `delegation_style`, `closing_style`, etc. — not just subtype.

Investigation first:

- When were these sessions created? Are they pre-Phase 2c?
- Are their session JSONL files still available in `~/.claude/angeleye/sessions/` or archive?
- If events are available, the deterministic classifier can run on them normally

Work:

1. Identify the 455 session IDs
2. Check event file availability
3. If events available: run the full classifier pipeline on them (same as normal classification, just targeted)
4. If events not available: mark as `meta.ghost_session` or similar

---

### Phase 5 — LLM Enrichment for Remaining Sessions (multiple sessions)

After Phases 1-4, estimate ~800-1200 sessions will still be unclassified (genuinely ambiguous or insufficient heuristics).

These require reading actual session content semantically — this is the real Tier 3 work.

**Design: project-local Claude Code skill**

The skill lives in the AngelEye project (not global `~/.claude/skills/`). It:

1. Reads batches of 50-100 session IDs with missing subtypes
2. For each session, reads the JSONL event file (first_real_prompt, tool summary, scale, existing classifiers)
3. Uses the bp-batch taxonomy and findings as the classification framework
4. Outputs structured JSON with session_id → subtype + confidence + reasoning
5. Writes back to registry

Reference material for the skill:

- `brains/angeleye/analysis/bp-findings-01.md` through `bp-findings-09.md` — the LLM's own documented patterns
- The 326 bp-batch examples as few-shot examples
- `shared/src/angeleye.ts` SessionSubtype enum (after Phase 1 extends it)

**Approach options:**

- **A (in-session)**: Run the skill inside a Claude Code session. Claude reads batches, you review, approve, write back. Good for first run / calibration.
- **B (autonomous)**: After calibration, run unattended on larger batches. Less review overhead.

Start with A to calibrate, then switch to B.

---

## Execution Order

```
Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
  ~1hr        ~2hr        ~2hr        ~1hr        ongoing
(taxonomy) (import)   (rules)    (old sess)  (LLM batches)
```

Each phase is a standalone session. Phases 1-4 require no LLM inference — they're code + data work.

---

## Files Involved

| Phase | Files                                                                  |
| ----- | ---------------------------------------------------------------------- |
| 1     | `shared/src/angeleye.ts`, maybe `client/src/` display labels           |
| 2     | `scripts/import-bp-batch.ts` (new), `~/.claude/angeleye/registry.json` |
| 3     | `server/src/services/classifier.service.ts`                            |
| 4     | Same as Phase 3, plus targeted registry update                         |
| 5     | New skill file in project, `~/.claude/angeleye/registry.json`          |

---

## Success Criteria

| Phase         | Target                         |
| ------------- | ------------------------------ |
| After Phase 2 | ~900 subtypes classified (35%) |
| After Phase 3 | ~1400-1700 classified (55-67%) |
| After Phase 4 | +455 more if events available  |
| After Phase 5 | >90% coverage target           |
