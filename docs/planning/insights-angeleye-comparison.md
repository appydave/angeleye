# /insights vs AngelEye — Feature Comparison & Gap Analysis

Planning artifact. Compares Claude Code's `/insights` command (documented in Rob Zolkos's deep dive, Feb 2026) against AngelEye's analysis lenses (C01-C08, P01-P12, O01-O05, from 108 sessions across waves 1-5).

---

## 1. What /insights Extracts (Exact Schema)

### Facet Extraction JSON (per session, via Haiku)

```json
{
  "underlying_goal": "string",
  "goal_categories": {"category_name": count},
  "outcome": "fully_achieved | mostly_achieved | partially_achieved | not_achieved | unclear_from_transcript",
  "user_satisfaction_counts": {"level": count},
  "claude_helpfulness": "unhelpful | slightly_helpful | moderately_helpful | very_helpful | essential",
  "session_type": "single_task | multi_task | iterative_refinement | exploration | quick_question",
  "friction_counts": {"friction_type": count},
  "friction_detail": "string",
  "primary_success": "none | fast_accurate_search | correct_code_edits | good_explanations | proactive_help | multi_file_changes | good_debugging",
  "brief_summary": "string"
}
```

### Goal Categories (13 values)

`debug_investigate`, `implement_feature`, `fix_bug`, `write_script_tool`, `refactor_code`, `configure_system`, `create_pr_commit`, `analyze_data`, `understand_codebase`, `write_tests`, `write_docs`, `deploy_infra`, `warmup_minimal`

### Satisfaction Levels (6 values)

`frustrated`, `dissatisfied`, `likely_satisfied`, `satisfied`, `happy`, `unsure`

### Friction Categories (12 values)

`misunderstood_request`, `wrong_approach`, `buggy_code`, `user_rejected_action`, `claude_got_blocked`, `user_stopped_early`, `wrong_file_or_location`, `excessive_changes`, `slow_or_verbose`, `tool_failed`, `user_unclear`, `external_issue`

### Primary Success Categories (7 values)

`none`, `fast_accurate_search`, `correct_code_edits`, `good_explanations`, `proactive_help`, `multi_file_changes`, `good_debugging`

### Session Metadata (extracted without LLM)

`duration_minutes`, `user_message_count`, `input_tokens`, `output_tokens`, `tool_counts`, `languages`, `git_commits`, `git_pushes`, `user_interruptions`, `tool_errors`, `lines_added`, `lines_removed`, `files_modified`, `uses_task_agent`, `uses_mcp`, `uses_web_search`, `uses_web_fetch`, `first_prompt`, `summary`

---

## 2. Direct Mapping — /insights to AngelEye Lenses

| /insights concept             | AngelEye equivalent                                                                 | Notes                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `session_type` (5 values)     | **C01 session_type** (15 values) + **C02 session_subtype** (52 values)              | AngelEye far richer. /insights lumps everything into 5 buckets                                                                     |
| `goal_categories` (13 values) | **C01 + C02** combined                                                              | Partial overlap. /insights has `write_tests`, `write_docs`, `deploy_infra` as explicit goals; AngelEye captures these via subtypes |
| `friction_counts`             | **P02 has_frustration_signals** + **O01 frustration_analysis**                      | AngelEye gates on frustration then does deep prose analysis. /insights counts friction types per session                           |
| `outcome`                     | No direct equivalent                                                                | AngelEye tracks session lifecycle (C04 closing_style) but not task outcome                                                         |
| `user_satisfaction_counts`    | No direct equivalent                                                                | AngelEye only has binary frustration detection (P02)                                                                               |
| `claude_helpfulness`          | No equivalent                                                                       | Not tracked                                                                                                                        |
| `primary_success`             | No equivalent                                                                       | Not tracked                                                                                                                        |
| `tool_counts`                 | **C05 tool_profile**                                                                | AngelEye classifies the tool distribution into a named profile; /insights passes raw counts                                        |
| `user_interruptions`          | No direct equivalent                                                                | Could be derived from JSONL event types                                                                                            |
| `lines_added/removed`         | Not in lenses                                                                       | Available in session shape data but not classified                                                                                 |
| Multi-phase detection         | **P03 is_multi_phase** + **O02 phase_breakdown**                                    | AngelEye stronger — gates an observation for prose analysis                                                                        |
| Cross-session                 | **P06 has_cross_session_refs** + **O03 session_chain** + **C08 session_chain_role** | AngelEye much stronger — tracks chain roles, cross-paste injection, bookend verification                                           |
| Opening/closing patterns      | **C03 opening_style** + **C04 closing_style**                                       | /insights has nothing equivalent                                                                                                   |
| CWD reliability               | **P10 is_cwd_incidental** + **C06 project_attribution** + **O04 cwd_mismatch**      | /insights has nothing equivalent                                                                                                   |
| Machine vs human              | **P11 is_machine_initiated**                                                        | /insights filters out agent sub-sessions but doesn't detect cron/heartbeat sessions                                                |

---

## 3. Gaps — Things /insights Captures That AngelEye Doesn't

### 3.1 Friction Categories (no AngelEye equivalent)

/insights tracks 12 friction types with per-session counts. AngelEye has only a binary predicate (P02 `has_frustration_signals`) and prose observation (O01). The specific friction taxonomy is missing:

| /insights friction       | Proposed AngelEye addition                     |
| ------------------------ | ---------------------------------------------- |
| `misunderstood_request`  | **P13** — Claude misinterpreted user intent    |
| `wrong_approach`         | **P14** — correct goal, wrong solution method  |
| `buggy_code`             | **P15** — Claude-generated code didn't work    |
| `excessive_changes`      | **P16** — over-engineered or changed too much  |
| `wrong_file_or_location` | **P17** — edited wrong file/location           |
| `user_rejected_action`   | **P18** — user explicitly rejected a tool call |

Already partially covered: `tool_failed` maps to existing tool error tracking in session shape. `user_unclear`, `external_issue`, `claude_got_blocked`, `user_stopped_early`, `slow_or_verbose` are less actionable as binary predicates but could be friction count fields on the session record.

### 3.2 Positive Satisfaction Signals

AngelEye only detects negative (frustration). /insights tracks a 6-level satisfaction scale including positive signals: `happy`, `satisfied`, `likely_satisfied`. This is a real gap — knowing which sessions went well is as useful as knowing which went badly.

**Proposed**: New predicate **P19 has_positive_signals** (detects "thanks", "perfect", "great", "that works") gating a new observation **O06 satisfaction_analysis** that characterises the positive experience.

Alternatively, add a classifier **C09 user_satisfaction** with the /insights 6-level enum. This is more informative than a predicate but costs an LLM call per session.

### 3.3 Outcome Tracking

/insights tracks `outcome` (5 levels from `not_achieved` to `fully_achieved`). AngelEye has no equivalent. C04 `closing_style` captures how a session ends (commit, abandon, memory write) but not whether the user's goal was actually met.

**Proposed**: New classifier **C09 task_outcome** (or C10 if satisfaction takes C09) with values: `fully_achieved`, `mostly_achieved`, `partially_achieved`, `not_achieved`, `unclear`.

### 3.4 Claude Helpfulness Rating

/insights rates `claude_helpfulness` on a 5-point scale. AngelEye doesn't assess Claude's contribution quality at all. This is useful for identifying sessions where Claude was a net negative.

**Proposed**: New classifier **C10 claude_effectiveness** with values: `unhelpful`, `slightly_helpful`, `moderately_helpful`, `very_helpful`, `essential`.

### 3.5 Primary Success Category

/insights identifies what specifically went right: `fast_accurate_search`, `correct_code_edits`, `good_explanations`, `proactive_help`, `multi_file_changes`, `good_debugging`. AngelEye doesn't track positive outcomes at all.

**Proposed**: New classifier **C11 primary_success** with the same enum. Low cost, high value for understanding what Claude is actually good at per-session.

### 3.6 Goal Categories as Explicit Taxonomy

/insights has 13 goal categories. AngelEye's C01/C02 overlap but don't map 1:1. Some /insights goals have no direct AngelEye subtype: `write_tests`, `write_docs`, `deploy_infra`, `analyze_data`, `create_pr_commit`. These are captured implicitly in AngelEye subtypes but not as first-class enumerable values.

**Recommendation**: Don't add a separate goal classifier. AngelEye's subtype system is richer. But ensure subtype candidates include explicit test-writing, doc-writing, and deploy subtypes if they don't already.

---

## 4. What AngelEye Does Better

### 4.1 Richer Session Taxonomy

- 15 session types vs 5
- 52 subtypes vs none
- Opening/closing style classifiers (C03, C04) — /insights has nothing

### 4.2 Real-Time vs Batch

/insights runs retrospectively on up to 50 sessions. AngelEye can classify sessions as they complete (or even mid-session via hooks). This enables alerting, dashboards, and live workflow tracking.

### 4.3 Session Chain Tracking

C08 `session_chain_role` + P06 + O03 together model multi-session workflows. /insights treats each session independently with no chain awareness.

### 4.4 Subagent Awareness

AngelEye knows about `agent-*.jsonl` files and `isSidechain: true` entries. /insights explicitly filters out agent sub-sessions — it can't see delegated work.

### 4.5 Predicate-Gated Observations

AngelEye's two-tier model (cheap binary predicate gates expensive prose observation) is more cost-efficient than /insights' flat facet extraction on every session. A session with no frustration skips O01 entirely.

### 4.6 CWD Attribution

P10 + C06 + O04 detect when the working directory lies about what project a session belongs to. /insights trusts CWD implicitly.

### 4.7 Machine-Initiated Detection

P11 filters out cron/heartbeat sessions. /insights only filters agent sub-sessions.

### 4.8 Voice Dictation Awareness

P12 flags speech-to-text artifacts that cause misinterpretation. /insights doesn't account for input modality.

---

## 5. Free Data Source — Cached Facets

/insights caches per-session facets at `~/.claude/usage-data/facets/<session-id>.json`. These are free to read — no LLM cost, already computed.

Each facet file contains the full JSON schema from section 1 above: goal categories, satisfaction counts, friction counts, outcome, helpfulness, primary success, and summary.

**How AngelEye could use these**:

1. **Ingest as supplementary data** — read facet files during session indexing, store alongside AngelEye's own classifications
2. **Cross-validate** — compare /insights `session_type` against AngelEye C01/C02 to find systematic disagreements
3. **Fill gaps cheaply** — use cached satisfaction, outcome, and helpfulness data instead of building new classifiers for those dimensions
4. **Backfill** — run `/insights` once to generate facets for all historical sessions, then read the cache

**Caveat**: Facets are Haiku-generated with a generic prompt. AngelEye's David-specific classifiers (voice artifacts, CWD attribution, skill gaps) will always be more accurate for David's workflow patterns.

---

## 6. Recommended Additions for Next Wave

Prioritised by value and implementation cost.

### Tier 1 — Low Cost, High Value (add as predicates)

| ID  | Name                      | Type      | What it detects              | Implementation                                                    |
| --- | ------------------------- | --------- | ---------------------------- | ----------------------------------------------------------------- |
| P13 | has_misunderstood_request | predicate | Claude misinterpreted intent | Scan for corrections: "no, I meant...", "that's not what I asked" |
| P14 | has_wrong_approach        | predicate | Right goal, wrong method     | Scan for approach rejection: "try a different way", "don't use X" |
| P15 | has_buggy_output          | predicate | Claude-generated code failed | Scan for error-fix cycles: test failure → edit → retest pattern   |
| P16 | has_excessive_changes     | predicate | Over-engineering             | Scan for: "too much", "revert", "just change X not everything"    |

These are cheap binary gates (Haiku). They decompose the current monolithic P02 `has_frustration_signals` into actionable categories. P02 stays as the broad gate; P13-P16 refine it.

### Tier 2 — Medium Cost, High Value (add as classifiers)

| ID  | Name              | Type       | Values                                                                     | Notes                               |
| --- | ----------------- | ---------- | -------------------------------------------------------------------------- | ----------------------------------- |
| C09 | task_outcome      | classifier | fully_achieved, mostly_achieved, partially_achieved, not_achieved, unclear | Biggest single gap vs /insights     |
| C10 | user_satisfaction | classifier | happy, satisfied, likely_satisfied, dissatisfied, frustrated, unsure       | Replaces binary P02 with a spectrum |

### Tier 3 — Consider After Tier 1-2 Land

| ID  | Name                  | Type        | Notes                                                      |
| --- | --------------------- | ----------- | ---------------------------------------------------------- |
| C11 | primary_success       | classifier  | What went right. Less urgent than what went wrong          |
| C12 | claude_effectiveness  | classifier  | Helpful for macro analysis but subjective                  |
| O06 | satisfaction_analysis | observation | Gated by C10 != unsure. Prose on what drove the experience |

### Alternative: Ingest /insights Facets Instead

For C09 (outcome), C10 (satisfaction), C11 (success), and C12 (effectiveness), consider reading the cached facets at `~/.claude/usage-data/facets/` instead of building new classifiers. This gives you the data for zero LLM cost, with the tradeoff of Haiku-quality classification using a generic (not David-specific) prompt.

**Hybrid approach**: Ingest facets as baseline, run AngelEye's own classifiers only on sessions where the facet data seems wrong or missing.

---

## 7. Summary Table

| Dimension             | /insights                                 | AngelEye                                              | Winner                    |
| --------------------- | ----------------------------------------- | ----------------------------------------------------- | ------------------------- |
| Session type taxonomy | 5 types                                   | 15 types + 52 subtypes                                | AngelEye                  |
| Goal categorisation   | 13 explicit goals                         | Implicit via subtypes                                 | /insights (more explicit) |
| Friction detection    | 12 typed categories with counts           | Binary gate + prose                                   | /insights (granularity)   |
| Satisfaction tracking | 6-level scale, both positive and negative | Negative only (frustration)                           | /insights                 |
| Outcome tracking      | 5-level scale                             | Not tracked                                           | /insights                 |
| Claude quality rating | helpfulness + primary success             | Not tracked                                           | /insights                 |
| Session lifecycle     | Not tracked                               | Opening/closing style classifiers                     | AngelEye                  |
| Multi-session chains  | Not tracked                               | Chain role + cross-refs + observations                | AngelEye                  |
| Subagent awareness    | Filtered out                              | Tracked                                               | AngelEye                  |
| CWD attribution       | Trusts CWD                                | Detects misattribution                                | AngelEye                  |
| Real-time capability  | Batch only                                | Real-time capable                                     | AngelEye                  |
| Cost model            | Flat (every session gets full analysis)   | Predicate-gated (expensive analysis only when needed) | AngelEye                  |
| Free cached data      | Yes (facets/)                             | Can ingest                                            | Both                      |
