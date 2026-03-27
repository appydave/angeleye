# AngelEye Documentation Coherence Review

**Date**: 2026-03-27
**Scope**: All enrichment-pipeline, workflow-orchestration, intelligence, brain, and project-root documentation
**Purpose**: Identify contradictions, loose ends, structural issues, and naming inconsistencies across the documentation corpus

---

## 1. Document Inventory

### Project Root

| File          | Summary                                                                           |
| ------------- | --------------------------------------------------------------------------------- |
| `CLAUDE.md`   | AI agent context; references STEERING.md, brain, canonical Claude Code brain docs |
| `STEERING.md` | David/Claude async communication; campaign complete notes (2026-03-24)            |
| `README.md`   | Public-facing project description; stack, API, UI views, registry description     |

### Enrichment Pipeline (`docs/planning/enrichment-pipeline/`)

| File                          | Summary                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `data-architecture.md`        | Three data stores, file paths, data flow diagram, gap description                                             |
| `predicate-tier-reference.md` | All 25 predicates, 13 classifiers, 7 observations with detection tiers                                        |
| `execution-paths.md`          | Three enrichment engines (Ralphy, Codex, Claude SDK); phased implementation plan                              |
| `mochaccino-brief.md`         | Spec for 5 UI mockup views for predicate/enrichment surfaces                                                  |
| `pipeline-extension-plan.md`  | v4 extensions: Extractors (E01-E04), Domain Overlays (C14-C16), Affinity Groups, Agent Genesis (P31-P35, C22) |

### Intelligence (`docs/intelligence/`)

| File          | Summary                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATTERNS.md` | Living knowledge base: v3 schema, signal reliability, taxonomy, tool patterns, prompt patterns, junk rules, marathon handling, multi-machine analysis. Validated against 924 sessions |

### Workflow Orchestration (`docs/planning/workflow-orchestration/`)

| File                         | Summary                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `bmad-lifecycle-handover.md` | BMAD story lifecycle chain, routing decisions, backtrack patterns, context budgets, paste-back formats |
| `bmad-session-inventory.md`  | Full inventory of ~85 BMAD sessions across SupportSignal v2 Stories 1.1-2.4                            |
| `bmad-session-boundaries.md` | Per-session start/end/output detail, test counts, KDD tracking, commit trail, DR verdicts              |

### Brain (`~/dev/ad/brains/angeleye/`)

| File                                    | Summary                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `INDEX.md`                              | Navigation hub with Quick Find table, file inventory, domain boundaries                       |
| `angeleye-fundamentals.md`              | Four jobs, design principles, workspace model, stack                                          |
| `data-concepts.md`                      | Session, workspace, cross-session thread, conversation definitions                            |
| `ambient-intelligence.md`               | Layer 1 (prompt pattern) and Layer 2 (behavioural sequence) intelligence                      |
| `communication-patterns.md`             | STEERING.md protocol and pattern origins                                                      |
| `conversation-analysis-framework.md`    | Four-angle framework (Session Type, Conversation Role, Content Type, Visualisation Candidate) |
| `enrichment-pipeline.md`                | Brain-level summary of three detection tiers and execution paths                              |
| `orchestration-concepts.md`             | Fifth job concept (orchestrator), session chains, routing, verdict detection                  |
| `ingestion-architecture.md`             | (exists, not read in full) Hook pipeline, data layout                                         |
| `analysis-methodology.md`               | (exists, not read in full) Two-pass analytical process                                        |
| `provenance-and-relationships.md`       | (exists, not read in full) Brain relationships and domain boundaries                          |
| `future-features-inspector-research.md` | (exists, not read in full) 14 feature ideas                                                   |
| `workspace-example-supportsignal-ux.md` | (exists, not read in full) Real workspace example                                             |

---

## 2. Topology Map

### Reading Order (Recommended)

```
Entry points (pick one based on purpose):
  "What is AngelEye?"         → brain/angeleye-fundamentals.md → brain/data-concepts.md
  "How does the data flow?"   → enrichment-pipeline/data-architecture.md
  "What can we detect?"       → enrichment-pipeline/predicate-tier-reference.md
  "Full schema reference"     → docs/intelligence/PATTERNS.md

Deeper dives:
  data-architecture.md
    → predicate-tier-reference.md (what's deterministic vs LLM)
    → execution-paths.md (how to run enrichment)
    → pipeline-extension-plan.md (v4 additions)
    → mochaccino-brief.md (UI mockups)

  PATTERNS.md
    ← referenced by all enrichment-pipeline docs as schema source
    ← referenced by brain/enrichment-pipeline.md

  Workflow orchestration:
    bmad-lifecycle-handover.md (concepts + routing)
    → bmad-session-inventory.md (specific sessions)
    → bmad-session-boundaries.md (per-session detail)

  Brain layer:
    INDEX.md (hub)
    → enrichment-pipeline.md (summary pointing to app docs)
    → orchestration-concepts.md (summary pointing to app docs)
```

### Cross-Reference Map

```
CLAUDE.md ──references──→ STEERING.md
                      ──→ brain/INDEX.md
                      ──→ anthropic-claude brain docs

PATTERNS.md ←──schema source for──
    enrichment-pipeline/predicate-tier-reference.md
    enrichment-pipeline/data-architecture.md
    enrichment-pipeline/pipeline-extension-plan.md
    brain/enrichment-pipeline.md

brain/enrichment-pipeline.md ──points to──→ all enrichment-pipeline/ app docs
brain/orchestration-concepts.md ──points to──→ bmad-lifecycle-handover.md
brain/INDEX.md ──hub for──→ all brain files
```

---

## 3. Contradictions Found

### C1. Observation Count: "7 observations" vs "8 observations"

**Conflict**: The observation range is O02-O08 throughout, which is 7 observations. However:

- `mochaccino-brief.md` line 125 says: `"v3 — 25 predicates, 13 classifiers, 8 observations"`
- `data-architecture.md` line 56 says: `"8 observations (O02-O08)"`
- `pipeline-extension-plan.md` line 20 says: `"7 observations (O02-O08)"`
- `predicate-tier-reference.md` line 122 says: Observations total = **7**
- `PATTERNS.md` lists O02-O08 = 7 observations

**Verdict**: O02 through O08 is 7 items (there is no O01). `data-architecture.md` and `mochaccino-brief.md` say "8" which is wrong. Should be 7.

### C2. Session Type Count: "6 types" vs "12+ types"

**Conflict**: Multiple documents disagree on how many top-level session types exist.

- `README.md` line 30: "detecting BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, and ORIENTATION" (6 types)
- `README.md` line 45: "the 6 top-level types (BUILD, TEST, etc.) are just the surface"
- `data-architecture.md` line 37: "session_type (6 values)"
- `PATTERNS.md` line 260: "**12+ top-level types, 500+ subtypes.**"
- `PATTERNS.md` lists: BUILD, KNOWLEDGE, RESEARCH, ORIENTATION, OPERATIONS, META, SYSOPS, PLANNING, MIXED, SKILL, SETUP, unknown
- `conversation-analysis-framework.md` line 55: "6 top-level types, 21 subtypes, covering >95%"

**Verdict**: The classifier.service.ts implements 6 types. PATTERNS.md (the campaign findings) validated 12+ types. Several docs still reference the old 6-type count. The README and data-architecture docs have not been updated to reflect the expanded taxonomy.

### C3. Session Type Name: "OPS" vs "OPERATIONS"

**Conflict**: The 6-type classifier in the README and code uses "OPS":

- `README.md` line 30: "OPS"
- `README.md` line 147: "OPS"

But PATTERNS.md and campaign findings consistently use "OPERATIONS":

- `PATTERNS.md` line 268: "OPERATIONS"
- Campaign findings throughout use "OPERATIONS"

**Verdict**: The codebase uses "OPS" as the short form; the research/campaign uses "OPERATIONS" as the full form. These are the same concept but the naming is inconsistent. Should be unified.

### C4. Registry Session Count: "794" vs "894" vs "924"

**Conflict**: Different documents cite different session counts.

- `README.md` line 253: "The registry currently holds 794 sessions"
- `data-architecture.md` line 31: "Currently 894 entries"
- `STEERING.md` line 33: "924 sessions fully processed"
- `angeleye-future-vision.md` line 120: "794 sessions"

**Verdict**: 794 is the oldest count (from before wave 5+ backfills). 894 is the current registry count on M4 Mini. 924 is the session index count (includes M4 Pro sessions). README.md and angeleye-future-vision.md are stale. The data-architecture.md correctly explains the 894-vs-924 discrepancy. README.md needs updating.

### C5. Analysis Campaign Stats: "268 sessions" vs "924 sessions"

**Conflict**:

- `README.md` line 44: "268 sessions analysed across 30+ projects"
- `README.md` line 47: "155+ subtypes discovered"
- `STEERING.md` line 33: "924 sessions fully processed"
- `PATTERNS.md` throughout: "[VALIDATED-924]"

**Verdict**: README.md describes an intermediate campaign state (after ~wave 4). The campaign has since completed with 924 sessions, 500+ subtypes, 12+ types. README.md's "Analysis Campaign" section is significantly out of date.

### C6. Hook Event Count: "7" vs "24"

**Conflict**:

- `README.md` line 20: "7 hook event types"
- Wave 11 docs: expanded to 24 hooks
- Recent commit `62cdef97`: "feat: wave 11 hook coverage -- accept all 24 Claude Code events"

**Verdict**: Wave 11 has been committed. README.md still says 7 hooks. The hook table in README.md (lines 106-114) only lists 7 hooks. Needs update to reflect all 24.

### C7. Predicate P16 Meaning Inconsistency

In `PATTERNS.md` Section 9 (Observations Log, line 697), P16 is referenced as "CLAUDE.md auto-load anti-pattern" with the text: "P16 (CLAUDE.md auto-load) is an escalating pattern."

In `predicate-tier-reference.md` line 61, P16 is: "**excessive_changes** -- Claude modified more files/lines than the request warranted"

**Verdict**: PATTERNS.md reuses "P16" to refer to a completely different concept (CLAUDE.md auto-load inflation) vs the schema definition of P16 (excessive changes). This appears to be a labeling error in the PATTERNS.md observations log -- it is discussing the auto-load phenomenon but mislabeling it as P16. The actual P16 is about excessive code changes.

### C8. Conversation Analysis Framework: Stale Taxonomy

`conversation-analysis-framework.md` (brain file, last updated 2026-03-18) still says:

- Line 55: "6 top-level types, 21 subtypes, covering >95%"
- Lists only 6 types: BUILD, TEST, RESEARCH, KNOWLEDGE, OPERATIONS, ORIENTATION

`PATTERNS.md` (last updated 2026-03-23) says 12+ types, 500+ subtypes.

**Verdict**: The brain file's session taxonomy section is stale. It reflects the 100-session analysis, not the 924-session campaign.

---

## 4. Loose Ends

### L1. References to Missing/Unverified Documents

- `bmad-lifecycle-handover.md` line 6 references: `~/dev/ad/brains/angeleye/orchestration-concepts.md` -- this file exists (verified).
- `data-architecture.md` line 189 references: `~/dev/ad/brains/angeleye/analysis-methodology.md` -- this file exists (verified).
- `README.md` line 55 references: `docs/planning/insights-angeleye-comparison.md` -- **not verified to exist**. This may be a dangling reference.

### L2. "Not Yet Defined" Items in Conversation Analysis Framework

The `conversation-analysis-framework.md` contains multiple items explicitly marked as pending:

- "Detection Rules Pending" for Conversation Role (line 314)
- "Classification rules pending" for Content Type (line 316)
- "Selection logic pending" for Visualisation Candidate (line 317)
- "The JSON extraction format for Nano Banana is an open design task" (line 292)

These date from 2026-03-18 and may still be legitimately pending, but the doc has not been revisited since.

### L3. STEERING.md Backlog Items

STEERING.md lists high-priority backlog items:

- B038 (scale-aware BUILD guard) -- the recent commit `3f593607` says "feat: scale-aware BUILD guard + iron-clad classifier rules (B038, B039, B041)" -- this appears to be resolved but STEERING.md still lists it.
- B039 (iron-clad classifier rules) -- same commit, appears resolved.
- B040 (PII detection) -- `predicate-tier-reference.md` lists P24 as "already implemented" for regex-based PII detection. STEERING.md still lists this as pending.

**Verdict**: STEERING.md's backlog section appears stale by at least 2-3 days. B038 and B039 are committed. B040 may be partially resolved (regex-based PII is implemented, but PATTERNS.md line 774 says "No automated detection or redaction yet" -- this may refer to a deeper PII capability beyond the regex).

### L4. brain/INDEX.md "Last Updated" Stale

`INDEX.md` frontmatter says `last_major_update: 2026-03-27` but the body says `Last Updated: 2026-03-21`. The 2026-03-27 update added the enrichment-pipeline.md and orchestration-concepts.md entries to the file list but did not update the body timestamp.

### L5. pipeline-extension-plan.md Reserved ID Ranges

The plan reserves P26-P30 for BMAD-specific predicates and C17-C21 for BMAD-specific classifiers (line 609-611). These are referenced as "proposed in `bmad-session-inventory.md`" but that document does not define these IDs. The inventory describes session data but does not propose predicates. This forward-reference is dangling.

### L6. Story 2.4 Incomplete

`bmad-session-boundaries.md` shows Story 2.4 with "CU 2.4: Not yet run" and "Ship 2.4: Not yet run". The inventory doc says "CU 2.4 — **Not yet run**". This is presumably still in progress, but worth noting as an open item in the documentation.

---

## 5. Structural Issues

### S1. No Single Entry Point Document

There is no "start here" document that maps the full documentation landscape. The brain `INDEX.md` is the closest, but it only covers brain files. There is no equivalent for the app-side docs. Someone arriving at the enrichment-pipeline docs would not know that PATTERNS.md is the schema source of truth without reading the cross-references.

**Recommendation**: Either add a reading-order note to the enrichment-pipeline directory (a simple README.md) or extend the CLAUDE.md "docs" pointer to include the enrichment-pipeline and workflow-orchestration directories.

### S2. Scattered Taxonomy Definitions

The session type taxonomy is defined/referenced in at least 5 places:

1. `PATTERNS.md` (12+ types, 500+ subtypes) -- most current
2. `conversation-analysis-framework.md` (6 types, 21 subtypes) -- stale
3. `README.md` (6 types) -- stale
4. `data-architecture.md` (6 values) -- stale
5. `100-session-analysis.md` (6 types, 21 subtypes) -- historical

**Recommendation**: PATTERNS.md should be the single source of truth for the taxonomy. All other docs should reference it rather than defining their own copy.

### S3. Brain vs App Duplication Pattern Is Good

The brain files (`enrichment-pipeline.md`, `orchestration-concepts.md`) correctly act as concept summaries that point to detailed app docs. This is a good separation. The brain owns "what and why"; the app docs own "how and spec". No action needed here -- this is working well.

### S4. Wave Planning Docs Are Accumulating

There are 14+ wave planning directories under `docs/planning/`. These are historical implementation plans. They serve as an audit trail but make the planning directory noisy. Consider moving completed wave docs to an `archive/` subdirectory to keep the active planning directories (enrichment-pipeline, workflow-orchestration) visually distinct.

### S5. Workflow Orchestration Is Purely BMAD-Specific

The three docs in `workflow-orchestration/` are entirely about BMAD story lifecycle orchestration. The directory name suggests a more general capability. If orchestration is intended to be general (as `orchestration-concepts.md` suggests with its Kanban/CI/CD examples), the BMAD-specific docs should be in a subdirectory like `workflow-orchestration/bmad/`.

---

## 6. Naming/Convention Issues

### N1. Session Type Naming: "OPS" vs "OPERATIONS"

As noted in C3. The codebase uses "OPS", the research uses "OPERATIONS". The pipeline-extension-plan.md and enrichment docs do not reference either name directly (they focus on predicates/classifiers). But the README and brain docs use both forms.

**Recommendation**: Pick one. "OPERATIONS" is the expanded taxonomy name. "OPS" is the legacy short form in the classifier. Use "OPERATIONS" everywhere in docs; update the classifier output to match.

### N2. Predicate ID Gaps

Current schema: P01-P25, then the extension plan jumps to P31-P35 (reserving P26-P30 for BMAD-specific items that are not yet defined). The reservation is noted in pipeline-extension-plan.md but the BMAD predicates are not defined in any document.

**Recommendation**: Either define P26-P30 in the inventory doc or explicitly document the reservation in predicate-tier-reference.md so the gap is not surprising.

### N3. Classifier ID Gaps

Same issue: C01-C13 in v3, C14-C16 and C22 in the extension plan. C17-C21 reserved for BMAD. C22 jumps past the reservation. The gap should be documented in the tier reference.

### N4. "session_scale" vs "C02_session_scale"

Within the enrichment pipeline docs, classifiers are referred to with their C-prefix (C02). In the classifier.service.ts and README, the field is called `session_scale` without prefix. This is a natural code-vs-docs distinction but could confuse readers moving between them.

---

## 7. Completeness Gaps

### G1. No Master Reference Combining All IDs

There is no single document that lists every predicate, classifier, observation, AND extractor with their current implementation status. The closest is `predicate-tier-reference.md` (covers P01-P25, C01-C13, O02-O08) but it does not include the v4 extensions (E01-E04, C14-C16, C22, P31-P35). After the extension plan is implemented, there will be no single place to look up "what is C22?"

**Recommendation**: Either extend `predicate-tier-reference.md` to be the living master, or create an auto-generated reference from the schema definition.

### G2. No Data Model Documentation for the Registry Entry

The registry entry schema is documented in PATTERNS.md (lines 94-106) as a TypeScript interface, and in data-architecture.md as a list of fields. But neither includes the full current field set with types. For example, `session_subtype` appears in data-architecture.md's registry description but is not in PATTERNS.md's RegistryEntry interface.

**Recommendation**: PATTERNS.md's RegistryEntry interface should be updated to match the actual implementation. Or the canonical source should be the TypeScript types in `shared/src/types.ts`.

### G3. No End-to-End Pipeline Architecture Diagram

`data-architecture.md` has a data flow diagram. `execution-paths.md` describes three execution engines. But there is no single diagram showing the complete pipeline from "session arrives" through "Tier 1 classification" through "Tier 3 LLM enrichment" through "result written to registry/index". The pieces exist but are not connected into a single flow.

### G4. Missing: "What Does a Session Record Look Like?"

There is no example of a complete session-index.jsonl entry showing all 45+ fields populated with real data. The schema is defined in PATTERNS.md as a TypeScript interface, but a concrete JSON example would make the docs more accessible.

### G5. README.md "Analysis Campaign" Section Is Significantly Stale

The README's analysis campaign section (lines 42-55) describes an intermediate state:

- "268 sessions analysed" (now 924)
- "155+ subtypes discovered" (now 500+)
- "8 classifiers identified with 12 predicates" (now 13 classifiers, 25 predicates, 7 observations)
- "BUILD accuracy is ~20%" (now known to vary 0-70% by scale)
- References "6 types" (now 12+)
- Lists "7 hook event types" (now 24)

This is the most user-visible stale content.

### G6. Missing Brain File: `ingestion-architecture.md` Not Read

This file exists but was not read in this review. It is referenced by multiple docs as the canonical source for hook pipeline and data layout. Based on the wave 11 expansion from 7 to 24 hooks, this file may also need updating.

---

## 8. Recommendations (Prioritised)

### Quick Wins (under 10 minutes each)

1. **Fix observation count**: Change "8 observations" to "7 observations" in `data-architecture.md` (line 56) and `mochaccino-brief.md` (line 125). The range O02-O08 is 7 items.

2. **Fix PATTERNS.md P16 reference**: In Section 9 Observations Log (line 697), the reference to "P16 (CLAUDE.md auto-load)" should be clarified -- P16 in the schema is `excessive_changes`, not auto-load. Either add a note or assign a separate label to the auto-load phenomenon.

3. **Update STEERING.md backlog**: Mark B038 and B039 as resolved (committed `3f593607`). Clarify B040 status (regex PII detection is implemented as P24; deeper PII redaction may still be pending).

4. **Fix INDEX.md body timestamp**: Update "Last Updated: 2026-03-21" in the body to match the frontmatter's `last_major_update: 2026-03-27`.

### Medium Effort (30-60 minutes)

5. **Update README.md**: This is the highest-impact documentation fix. Update:
   - Hook count: 7 -> 24
   - Session types: list all 12+ (or say "12+ types" with link to PATTERNS.md)
   - Registry count: 794 -> 894 (or say "~900")
   - Analysis campaign section: 268 -> 924 sessions, 155 -> 500+ subtypes, 8 classifiers -> 25 predicates + 13 classifiers + 7 observations
   - "OPS" -> "OPERATIONS" (or document that OPS is the short form)
   - Add reference to enrichment pipeline docs

6. **Update conversation-analysis-framework.md taxonomy**: The "6 types, 21 subtypes" in Angle 1 should either be updated to 12+ types or explicitly marked as "(as of the 100-session analysis; see PATTERNS.md for the current 924-session validated taxonomy)".

7. **Document reserved predicate/classifier ID ranges**: Add a section to `predicate-tier-reference.md` noting P26-P30 and C17-C21 are reserved, and link to pipeline-extension-plan.md for context.

8. **Unify session type naming**: Decide on "OPS" vs "OPERATIONS" and update all docs to use the chosen form.

### Structural Changes (1-2 hours)

9. **Create a docs-level reading guide**: A simple `docs/planning/enrichment-pipeline/README.md` that explains the reading order: data-architecture -> predicate-tier-reference -> execution-paths -> pipeline-extension-plan -> mochaccino-brief. Could also be added to the CLAUDE.md enrichment section.

10. **Archive completed wave planning docs**: Move `docs/planning/angeleye-wave1/` through `angeleye-wave9-bookmarks/` into a `docs/planning/archive/` directory. Keep only active planning in the main `docs/planning/` directory.

11. **Add a concrete JSON example**: Add a complete session-index.jsonl entry (real or realistic) to either PATTERNS.md or data-architecture.md showing all v3 fields populated.

12. **Verify `docs/planning/insights-angeleye-comparison.md` exists**: If this file does not exist, remove or update the reference in README.md line 55.

### Future Consideration

13. **Auto-generated predicate reference**: As the schema grows to v4 (58 items), consider generating the master reference from the TypeScript schema definition rather than maintaining it manually across multiple docs.

14. **BMAD-specific predicates**: Define P26-P30 and C17-C21 or remove the reservations. The current state (reserved IDs with no definitions anywhere) creates ambiguity.

---

## Summary Statistics

| Category             | Count |
| -------------------- | ----- |
| Documents read       | 20    |
| Contradictions found | 8     |
| Loose ends           | 6     |
| Structural issues    | 5     |
| Naming issues        | 4     |
| Completeness gaps    | 6     |
| Recommendations      | 14    |

**Overall assessment**: The documentation corpus is remarkably thorough for a project of this complexity. The brain-vs-app separation works well, with brain files acting as concept summaries that point to detailed app specs. The primary issues are **staleness** (README.md and conversation-analysis-framework.md lag behind the 924-session campaign findings) and **minor counting errors** (7 vs 8 observations). The enrichment-pipeline docs are internally consistent and well-cross-referenced. The pipeline-extension-plan.md introduces clean new concepts without breaking existing schemas.
