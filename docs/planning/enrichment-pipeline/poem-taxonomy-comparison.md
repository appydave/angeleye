# POEM Signal Type Taxonomy vs AngelEye Enrichment Types

**Purpose**: Compare the POEM OS predicate/observation/categorization system (as implemented in prompt.supportsignal) with AngelEye's enrichment pipeline types, with particular focus on whether AngelEye's proposed "Extractor" concept has a POEM equivalent.

**Created**: 2026-03-27

**Sources examined**:

- `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/moment-analysis/` (workflow YAML + all 12 prompt schemas)
- `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/new-incident/` (workflow YAML + all 14 prompt schemas)
- `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/moment-nudge/` (screen classifier)
- `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/new-incident/docs/architecture/analysis-row-pattern.md` (canonical P/C/O architecture)
- `~/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/pipeline-extension-plan.md` (extractor proposal)
- `~/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/predicate-tier-reference.md` (full P/C/O inventory)
- `~/dev/ad/poem-os/poem/packages/poem-core/tasks/new-prompt.yaml` (POEM core prompt scaffold)

---

## 1. POEM Signal Type Taxonomy

POEM defines three signal types for LLM prompt outputs, declared via the `promptType` field on each prompt schema JSON. The canonical architecture document is `analysis-row-pattern.md` in the new-incident workflow.

### 1.1 Predicate (P)

**Purpose**: Binary gate. Does this dimension apply? YES or NO.

**Schema shape**:

```json
{
  "result": boolean,
  "justification": "string — one sentence referencing evidence"
}
```

**Characteristics**:

- Always returns exactly `{ result, justification }` — no other fields
- Cheap to run (small prompt, ~150 max tokens, temperature 0.2-0.3)
- Uses the `quick` model (Haiku) — optimised for speed and cost
- Acts as a cost gate: if result is false, downstream C and O are skipped
- `promptType: "predicate"` in the schema

**Examples from new-incident**:

- `was-harm-to-participant`: "Was harm detected?" -> true/false + justification
- `was-medication-involved`: "Is medication explicitly mentioned?" -> true/false + justification
- `was-known-risk`: "Was this a known risk?" -> true/false + justification

**Key observation**: POEM predicates are strictly boolean. The justification field is a one-sentence explanation, not structured data. No predicate ever returns complex data.

### 1.2 Classifier (C)

**Purpose**: Structured categorisation with machine-readable labels.

**Schema shape** (varies by classifier):

```json
// Example: classify-and-gate (moment-analysis)
{
  "inputClassification": {
    "momentType": "behavioural|health|positive|routine|general",
    "concernLevel": "low|medium|high",
    "primaryDomain": "string",
    "isRoutineDeviation": boolean
  },
  "gates": {
    "hasRestrictivePractices": boolean,
    "hasMedications": boolean,
    // ... 8 boolean gate flags
  }
}

// Example: classify-severity (new-incident)
{
  "severity": "care-note|minor|moderate|major",
  "confidence": "high|medium|low",
  "reasoning": "string",
  "escalationNote": "string|null"
}

// Example: screen-moment (moment-nudge)
{
  "flagged": boolean,
  "domain": "restrictive_practice|reportable_incident|...|null",
  "confidence": "low|medium|high|null",
  "curiosityQuestion": "string|null"
}
```

**Characteristics**:

- Returns structured JSON with categorical values (enums)
- Medium cost (~200-350 max tokens, temperature 0.2-0.3)
- Can use either `quick` or `analysis` model depending on complexity
- Provides machine-readable labels for routing, reporting, and downstream processing
- Can exist standalone (Pattern 5: C-only) or combined with P and O
- `promptType: "classifier"` in the schema

**Key observation**: POEM classifiers output structured JSON with enum fields, but also allow string fields (reasoning, notes). The output schema is always a JSON object, never a bare string. Classifiers can be quite complex (classify-and-gate returns 12+ fields across two nested objects).

### 1.3 Observation (O)

**Purpose**: Deep narrative analysis in prose.

**Schema shape**:

```json
// Standalone observation (e.g., de-escalation-quality)
{
  "observation": "string — 2-3 paragraphs of plain prose"
}

// Or bare string (new-incident observations)
"string"  // entire output is the observation text
```

**Characteristics**:

- Returns rich text: assessment, evidence gaps, recommendations
- Most expensive component (~300-500 max tokens, temperature 0.3)
- Always uses the `analysis` model (Sonnet) — deeper reasoning
- Provides human-readable insight for report generation
- `promptType: "observation"` in the schema

**Key observation**: POEM observations are strictly free-text prose. No observation ever returns structured data. The new-incident workflow returns bare strings; the moment-analysis workflow wraps them in `{ observation: string }`.

### 1.4 Fused Types (P+C+O Composition)

POEM's moment-analysis workflow introduced a critical evolution: **fused prompts** that combine P, C, and O in a single LLM call. This is not a fourth type but a composition pattern.

**Schema shape for `predicate+classification+observation`**:

```json
// Example: medication-signal
{
  "result": boolean,                    // P: the predicate gate
  "justification": "string",           // P: evidence sentence
  "classification": "missed_dose|refused|prn_triggered|...|null",  // C: categorical
  "observation": "string|null"          // O: 2-3 paragraphs, null if result=false
}

// Example: goal-progress-signal
{
  "result": boolean,
  "justification": "string",
  "classification": "string|null",      // C: "{goal title} -- {direction}"
  "observation": "string|null"
}
```

**Schema shape for `predicate+observation`**:

```json
// Example: warning-sign-match
{
  "result": boolean,
  "justification": "string",
  "observation": "string|null"          // null if result=false
}
```

**Key observation**: The fused prompt's `classification` field is always a string (sometimes constrained by enum, sometimes free-form like `"{goal title} -- {direction}"`). It never returns arrays, nested objects, or structured extraction of multiple values. The classification is a label, not extracted data.

### 1.5 Analysis Row (Meta-Layer)

The **Analysis Row** is POEM's meta-layer that groups P, C, and O into a single analytical dimension. It is explicitly called out as a "NEW concept for POEM" in the architecture doc.

**Five composition patterns**:

| Pattern   | Components                           | Example                                   |
| --------- | ------------------------------------ | ----------------------------------------- |
| P + C + O | Full analysis                        | harm, medication, restrictive-practice    |
| P + O     | Gated observation                    | emergency-services, known-risk            |
| C + O     | Always-run classification + analysis | preventable                               |
| O only    | Always-run observation               | staff-response-quality, emerging-concerns |
| C only    | Standalone classifier                | severity                                  |

**Gating logic**:

```
IF P is enabled:
  Run P
  IF P returns YES: Run C (if enabled), Run O (if enabled)
  IF P returns NO:  SKIP C and O entirely
IF P is NOT enabled:
  Run C (if enabled) -- always
  Run O (if enabled) -- always
```

**Key observation**: The Analysis Row is an execution orchestration concept, not a data type. It does not produce its own output — it orchestrates which P, C, and O prompts run and in what order.

---

## 2. AngelEye Signal Type Taxonomy

AngelEye defines four enrichment types, each with an ID prefix:

### 2.1 Predicates (P01-P35)

**Return type**: `boolean` + `justification: string`

**Same concept as POEM predicates** in shape and purpose. Binary gate: "Does this session exhibit X?"

**Execution difference**: AngelEye predicates span three tiers (deterministic code, heuristic regex, LLM-required). POEM predicates are always LLM calls. This is because AngelEye's domain (session transcript analysis) has many signals detectable by pattern matching, while POEM's domain (NDIS care moments) requires interpretation.

### 2.2 Classifiers (C01-C22)

**Return type**: categorical value from a defined set (e.g., `"BUILD" | "TEST" | "RESEARCH"`)

**Same concept as POEM classifiers**. Categorical labelling of a dimension.

**Structural difference**: AngelEye classifiers return a single value (string from an enum). POEM classifiers can return complex JSON objects with multiple fields (classify-and-gate returns 12+ fields). AngelEye has no equivalent to POEM's multi-field classifier outputs.

### 2.3 Observations (O02-O08)

**Return type**: free-text analysis summary (string)

**Same concept as POEM observations**. Narrative prose describing patterns and insights.

### 2.4 Extractors (E01-E04) -- PROPOSED

**Return types** (varies per extractor):

- E01 `trigger_command`: `string | null` (e.g., `/bmad-dev`)
- E02 `trigger_arguments`: `string[] | null` (e.g., `["DS", "2.1"]`)
- E03 `final_artifact`: `string | null` (e.g., file path, commit hash, verdict text)
- E04 `final_state`: `string | null` (1-2 sentence deliverable summary)

**Purpose**: Extract specific structured values from session transcripts. The output is not constrained to a fixed set of categories (unlike classifiers) and is not narrative prose (unlike observations). It is a concrete value that was present in or derivable from the source data.

---

## 3. Mapping: Where They Align, Where They Diverge

### Direct Correspondences

| POEM Type       | POEM promptType         | AngelEye Type         | Match Quality                                                                        |
| --------------- | ----------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Predicate       | `"predicate"`           | Predicate (P01-P35)   | **Exact** — same schema `{ result: boolean, justification: string }`                 |
| Classifier      | `"classifier"`          | Classifier (C01-C22)  | **Partial** — AngelEye returns single enum values; POEM returns complex JSON objects |
| Observation     | `"observation"`         | Observation (O02-O08) | **Exact** — both return free-text prose strings                                      |
| Analysis Row    | (orchestration concept) | (no equivalent)       | **No match** — AngelEye has no meta-grouping of P+C+O into dimensions                |
| (no equivalent) | —                       | Extractor (E01-E04)   | **No match** — POEM has no structured value extraction type                          |

### The Classifier Gap

POEM classifiers are more powerful than AngelEye classifiers. Compare:

- **POEM** `classify-and-gate`: Returns `{ inputClassification: { momentType, concernLevel, primaryDomain, isRoutineDeviation }, gates: { hasRestrictivePractices, hasMedications, ... } }` — a complex object with 12+ fields
- **AngelEye** `C01_session_type`: Returns `"BUILD"` — a single string

POEM uses classifiers for two purposes:

1. **Categorical labelling** (severity: "minor", momentType: "behavioural") — matches AngelEye classifiers
2. **Structured routing data** (gate flags, composite objects) — no AngelEye equivalent

This means POEM's `classifier` type already subsumes some of what AngelEye calls extraction, but only when the extracted values are categorical or boolean. POEM classifiers never extract free-form strings like file paths or command arguments.

### The Fused Classification Field

The `classification` field in POEM's fused prompts (e.g., medication-signal's `"missed_dose|refused|prn_triggered|..."`) is strictly categorical — it selects from a known set. Even goal-progress-signal's `"{goal title} -- {direction}"` is structured around a known pattern with a constrained direction component.

This is NOT extraction. It is classification with a structured label format.

---

## 4. Extractor Analysis

### Is the Extractor concept genuinely new?

**Yes.** Extractors are genuinely new relative to POEM's taxonomy. Here is the evidence:

**What POEM predicates return**: `{ result: boolean, justification: string }`. The justification is always a one-sentence explanation, never a structured value. No predicate returns "what command was used" or "which files were written."

**What POEM classifiers return**: Categorical values from fixed sets (enums) or structured routing objects (gate flags). Even complex classifiers like classify-and-gate return booleans and enum strings. No classifier returns a free-form value like a file path, commit hash, or argument list.

**What POEM observations return**: Free-text prose. No observation returns structured data.

**What extractors return**: Specific values that exist in the source data — a command string, an array of arguments, a file path. These are neither categorical (the set of possible values is unbounded) nor narrative (they are not prose). They are **extracted facts**.

### Why extractors do not map to existing POEM types

| Extractor                                                     | Could it be a predicate?                                                                                         | Could it be a classifier?                                                        | Could it be an observation?                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| E01 `trigger_command` = `/bmad-dev`                           | No — it is not boolean. "Was there a trigger command?" is a predicate, but "what was the command?" is extraction | No — the set of possible values is unbounded (any slash command, any skill name) | No — it is a 10-character string, not prose                               |
| E02 `trigger_arguments` = `["DS", "2.1"]`                     | No — it is not boolean                                                                                           | No — arguments are not categorical                                               | No — it is a structured array                                             |
| E03 `final_artifact` = `src/pages/Home.tsx`                   | No — it is not boolean                                                                                           | No — file paths are not an enum                                                  | No — it is a path, not analysis                                           |
| E04 `final_state` = "Added pagination to the table component" | No — it is not boolean                                                                                           | No — summaries are unbounded                                                     | **Borderline** — this is a short prose summary, similar to an observation |

**E04 is the edge case.** It is a 1-2 sentence summary, which is structurally similar to a very short observation. However, its intent is extraction ("what was produced?") not analysis ("what does this mean?"). The distinction matters for downstream consumers: E04 is used as a label/tag, not as insight.

### Should POEM's taxonomy be expanded to include extractors?

**Yes, and here is the proposed definition:**

> **Extractor (E)**: A prompt or computation that extracts a specific structured value from source data. The output is a concrete fact (string, array, number, path) — not a boolean judgment (predicate), not a categorical label from a fixed set (classifier), not a narrative assessment (observation). The value space is unbounded.

This fits cleanly alongside the existing three:

- **P**: Is it true? (boolean)
- **C**: What kind? (categorical)
- **O**: What happened? (narrative)
- **E**: What specifically? (structured value)

---

## 5. Naming Recommendations

### Option A: AngelEye adopts POEM naming (recommended)

Rename AngelEye's types to match POEM terminology exactly, with the addition of Extractor:

| Current AngelEye Name | POEM-aligned Name | Notes                           |
| --------------------- | ----------------- | ------------------------------- |
| Predicate (P01-P35)   | **Predicate**     | No change needed                |
| Classifier (C01-C22)  | **Classifier**    | No change needed                |
| Observation (O02-O08) | **Observation**   | No change needed                |
| Extractor (E01-E04)   | **Extractor**     | New type — propose back to POEM |

**Reasoning**: The naming already aligns perfectly. AngelEye and POEM independently arrived at the same names because they represent the same conceptual distinctions. Keeping them aligned means knowledge transfers cleanly between the two systems.

**One adjustment needed**: AngelEye's classifiers are simpler than POEM's (single values vs complex objects). If AngelEye ever needs complex classifier outputs (e.g., returning multiple fields from one classification step), the schema should follow POEM's pattern of returning a JSON object rather than a bare string.

### Option B: Unified naming with POEM expansion (aspirational)

If POEM formally adopts the Extractor type, the full unified taxonomy becomes:

| Letter | Full Name   | Returns                                      | POEM Status | AngelEye Status            |
| ------ | ----------- | -------------------------------------------- | ----------- | -------------------------- | ------------------- | ------------------ |
| **P**  | Predicate   | `{ result: boolean, justification: string }` | Implemented | Implemented (P01-P35)      |
| **C**  | Classifier  | `{ ... structured categorical object }`      | Implemented | Implemented (C01-C22)      |
| **O**  | Observation | `string` (prose narrative)                   | Implemented | Specified (O02-O08)        |
| **E**  | Extractor   | `string                                      | string[]    | object` (structured value) | **Not yet in POEM** | Proposed (E01-E04) |

### Terminology to avoid

- "Categorization" — POEM uses "Classifier" and "Classification" interchangeably, but the `promptType` field value is always `"classifier"`, never `"categorization"`. AngelEye should use "classifier" consistently.
- "Signal type" — ambiguous. In SupportSignal, "signal" means a detected pattern (medication-signal, warning-sign-match). In AngelEye, "signal type" could mean P/C/O/E. Use "enrichment type" for the P/C/O/E taxonomy and "signal" for specific instances.

---

## 6. Analysis Group Concept

### What POEM calls an Analysis Row

POEM's **Analysis Row** is a meta-layer that groups P, C, and O into a single analytical dimension. Each row represents one question about the data (e.g., "harm", "medication", "restrictive practice") and declares which components it needs.

The Analysis Row is an **execution orchestration pattern** — it controls which prompts run and in what order. It is NOT stored as a separate data entity; its output is the individual P, C, and O results.

### Does AngelEye need this?

**Not yet, but it should plan for it.** Here is why:

AngelEye's current enrichment items are independent — P05 (has_playwright_calls) does not gate O08 (tool_diversity_index). Each predicate, classifier, observation, and extractor runs independently.

But the pipeline-extension-plan already shows dependencies emerging:

- C15 (workflow_identity) depends on E01 (trigger_command)
- C16 (workflow_action) depends on E02 (trigger_arguments)
- C22 (infrastructure_impact) is a rollup of P31-P35

These are proto-Analysis Rows. When AngelEye adds LLM-powered enrichment (Tier 3), some observations will only make sense if a predicate fires first:

- O02 (frustration_analysis) should only run if P02 (has_frustration_signals) is true
- O04 (skill_gap) should only run if P07 (has_skill_gap_signal) is true

### Proposed approach for AngelEye

Do not implement a formal Analysis Row abstraction now. Instead:

1. **Document the implicit dependencies** between enrichment items (which items gate others)
2. **Add a `depends_on` field** to the enrichment item schema:
   ```typescript
   interface EnrichmentItemMeta {
     id: string; // "O02"
     type: 'P' | 'C' | 'O' | 'E';
     depends_on?: string[]; // ["P02"] — only run if P02 is true
     window?: 'opening' | 'closing' | 'full';
     tier: 1 | 2 | 3;
   }
   ```
3. **Let the pipeline scheduler use `depends_on`** to skip items when their gate predicate returns false
4. **Defer the formal "Analysis Row" grouping** until there are enough gated items to justify the abstraction (likely when Tier 3 observations are implemented)

This gives AngelEye the cost-saving benefit of POEM's gating pattern without the upfront complexity of a formal row abstraction.

### Naming for the meta-layer

If AngelEye does eventually need a formal grouping:

- **POEM term**: "Analysis Row" (a row in a table of analytical dimensions)
- **Suggested AngelEye term**: "Analysis Row" (adopt the POEM name for consistency)
- **Alternative**: "Enrichment Dimension" (more descriptive for AngelEye's context, but diverges from POEM)

---

## 7. Summary of Findings

1. **POEM defines 3 signal types** (Predicate, Classifier, Observation) with a meta-layer (Analysis Row) for orchestration. All three map directly to AngelEye's first three types.

2. **Extractors are genuinely new.** No POEM prompt type returns unbounded structured values. POEM's classifiers return categorical data from fixed sets; its predicates return booleans; its observations return prose. AngelEye's extractors fill a real gap.

3. **The naming already aligns.** No renaming needed. AngelEye should continue using P/C/O/E and propose E (Extractor) back to POEM as a fourth signal type.

4. **POEM classifiers are richer** than AngelEye classifiers. POEM's `classify-and-gate` returns a 12-field JSON object; AngelEye classifiers return single strings. AngelEye should consider allowing multi-field classifier outputs in future schema versions.

5. **The Analysis Row concept maps to a `depends_on` pattern** in AngelEye. Do not build the full abstraction yet; use lightweight dependency declarations and let the pipeline scheduler handle gating.

6. **E04 (final_state) is the weakest extractor** — it is closer to a short observation than a structured extraction. Consider whether it belongs in the O category instead. Counter-argument: its purpose is labelling, not analysis, so E is appropriate despite the prose format.

---

**Next steps**:

- Implement E01-E03 extractors in `classifier.service.ts` (Phase 1 of pipeline-extension-plan)
- Add `depends_on` metadata to the enrichment item schema for future gating
- Propose Extractor as a fourth POEM signal type in the next POEM core planning session

---

**Related docs**:

- Pipeline extension plan: `pipeline-extension-plan.md`
- Predicate tier reference: `predicate-tier-reference.md`
- POEM analysis row pattern: `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/new-incident/docs/architecture/analysis-row-pattern.md`
- POEM moment-analysis workflow: `~/dev/clients/supportsignal/prompt.supportsignal.com.au/poem/workflows/moment-analysis/moment-analysis.yaml`
