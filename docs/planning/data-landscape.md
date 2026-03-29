# AngelEye Data Landscape — What We Have, What's Missing, How to Close the Gap

**Created**: 2026-03-29
**Context**: Discovered during Phase 2 planning conversation. This document captures the full picture so future sessions don't need to re-derive it.

---

## 1. Runtime Data Files (~/.claude/angeleye/)

| File                   | Shape                                 | Created By                 | Updated By                                                |
| ---------------------- | ------------------------------------- | -------------------------- | --------------------------------------------------------- |
| `registry.json`        | `Record<session_id, RegistryEntry>`   | Hook events (init)         | Hook events (every event), classifier (on stop), backfill |
| `affinity-groups.json` | `AffinityGroup[]`                     | Correlator (batch on sync) | Correlator                                                |
| `workspaces.json`      | `WorkspaceEntry[]`                    | User via API               | User via API                                              |
| `workflows.json`       | `{ workflows: WorkflowInstance[] }`   | API (POST /api/workflows)  | API (PUT /api/workflows/:id)                              |
| `last-sync.json`       | `{ timestamp, imported, classified }` | Sync service               | Sync service                                              |
| `preferences.json`     | `Record<string, unknown>`             | UI preferences             | UI preferences                                            |

## 2. Config Files (server/src/config/)

| File                                | Purpose                                         | Shape           |
| ----------------------------------- | ----------------------------------------------- | --------------- |
| `overlays/bmad-v6.json`             | Maps `/bmad-*` commands → role/identity/action  | `DomainOverlay` |
| `workflows/bmad-regular-story.json` | 9-station Regular Story pipeline                | `WorkflowType`  |
| `workflows/bmad-epic-zero.json`     | Epic Zero pipeline (provisional — stations TBD) | `WorkflowType`  |

**Missing**: Project registry configs (see Section 6).

## 3. What RegistryEntry Captures Today

```
Base fields:        session_id, project, project_dir, started_at, last_active,
                    name, tags, workspace_id, status, source

Classification:     is_junk, session_type (6 values), session_subtype (string, rarely set),
                    tool_pattern (8 values), session_scale (5 values),
                    first_edited_dir, first_real_prompt, pii_flags

Tier 1 predicates:  has_playwright_calls, is_compaction_resume, is_machine_initiated,
                    has_web_research, has_parallel_subagent_bursts, has_task_orchestration,
                    has_git_outcome

Tier 1 extractors:  trigger_command, trigger_arguments, has_skill_created, has_skill_modified

Tier 2 predicates:  has_brain_file_writes, has_cross_session_refs, has_unauthorized_edits,
                    has_voice_dictation_artifacts, has_handover_context,
                    has_cross_project_reads, has_closing_ceremony

Domain overlay:     workflow_role, workflow_identity, workflow_action

Cross-refs:         group_ids (affinity group membership)
```

## 4. What the Analysis Campaign Found (924 sessions) That's NOT in the Live System

### 4.1 Classifier Dimensions (C08-C13) — NOT computed live

| Classifier             | Values                                                                                         | Distribution (from analysis) |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| C08 delegation_style   | conversational, directive, orchestrated, autonomous                                            | 45%, 36%, 10%, 6%            |
| C09 session_continuity | fresh, handover_paste, compaction, skill_launcher, recall                                      | 64%, 16%, 9%, 7%, 3%         |
| C10 output_type        | conversation_only, code_changes, knowledge_synthesis, mixed, new_artifacts                     | 30%, 25%, 19%, 14%, 12%      |
| C11 initiation_source  | user_typed, voice_dictated, handover_paste, skill_invoked, agent_dispatched                    | 58%, 18%, 14%, 7%, 1%        |
| opening_style          | 62 unique values (voice_dictation, conceptual_question, paste_handover, skill_invocation, ...) | —                            |
| closing_style          | 77 unique values (abrupt_abandon, commit_and_push, bookend_close, ...)                         | —                            |
| tool_profile           | 60 unique values (build_focused, conversational, synthesis, ...)                               | —                            |

### 4.2 Predicates NOT in live system (P01-P16)

| Predicate                   | What it detects                    | Why missing            |
| --------------------------- | ---------------------------------- | ---------------------- |
| P01 is_feature_construction | Code being built (semantic)        | Requires LLM           |
| P02 has_frustration_signals | User frustration (tone)            | Requires LLM           |
| P03 is_multi_phase          | Multiple work phases               | Requires LLM           |
| P04-P16                     | Various quality/behavioral signals | Mix of LLM + heuristic |

### 4.3 Session Subtypes — 50+ discovered, 19 exported, rarely computed

The analysis found granular subtypes like `build.campaign`, `knowledge.brain_update`, `orientation.artifact_retrieval`, `research.quick_answer`, etc. The live classifier assigns `session_type` (6 values) but rarely sets `session_subtype`.

### 4.4 Derived Metrics — NOT computed live

| Metric           | Formula                            | What it reveals                   |
| ---------------- | ---------------------------------- | --------------------------------- |
| autonomy_ratio   | tool_use_count / user_prompt_count | How independently the agent works |
| session_liveness | active_minutes / duration_minutes  | Focused vs parked vs zombie       |

### 4.5 Observations — NOT in live system

Free-text fields discovered in analysis: `frustration_analysis`, `phase_breakdown`, `session_chain`, `skill_gap`, `autonomy_profile`, `machine_character`. These require LLM analysis.

### 4.6 Cross-Session Linkage Patterns — NOT captured

- Paste-in review loops (Session A → paste output into Session B → corrections → paste back)
- Multi-day advisory sessions (resumed with context recovery prompts)
- Voice-driven decision workflows (50+ minute transcribed sessions)

## 5. The Gap Summary

| Layer                 | Live System                        | Analysis Campaign                   | Gap                                                 |
| --------------------- | ---------------------------------- | ----------------------------------- | --------------------------------------------------- |
| Base fields           | 16 fields                          | Same                                | None                                                |
| Tier 1+2 predicates   | ~15 implemented                    | ~22 evaluated                       | ~7 missing (mostly LLM-required)                    |
| Classifiers           | 3 live (type, scale, tool_pattern) | 13 evaluated                        | 10 missing (C08-C13 + opening/closing/tool_profile) |
| Subtypes              | 19 exported, rarely computed       | 50+ discovered                      | Huge — needs subtype classifier                     |
| Derived metrics       | None computed                      | 2 (autonomy, liveness)              | Easy to add (arithmetic on existing fields)         |
| Observations          | None                               | 7 free-text fields                  | Requires LLM — Phase 4+                             |
| Cross-session linkage | group_ids only                     | Paste-in, multi-day, voice patterns | Hard — Phase 4+                                     |

## 6. Project Registry — New Concept (Not Yet Built)

**Purpose**: Declare what we know about projects so the workflow router does lookup, not inference.

**Proposed location**: `server/src/config/projects/*.json`

**Proposed shape**:

```json
{
  "project_dir": "/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au",
  "name": "SupportSignal",
  "domain": "bmad-v6",
  "workflow_types": ["bmad-regular-story", "bmad-epic-zero"],
  "story_id_pattern": "\\d+\\.\\d+",
  "tags": ["client", "primary"],
  "notes": "NDIS application — primary client project"
}
```

**Discovery model**: Auto-discover projects from registry data (76+ known). Config files only needed for workflow-enabled projects (~5-10). Projects without config still appear in inspectors, just without workflow associations.

## 7. How to Close the Gap — Three Strategies

### Strategy A: Deterministic Enrichment (cheap, Phase 2-3)

Extend `classifier.service.ts` to compute fields that DON'T need LLM:

- **C08 delegation_style**: `tool_use_count / user_prompt_count` → bucket into conversational/directive/orchestrated/autonomous
- **C09 session_continuity**: Already partially detected (is_compaction_resume, has_handover_context). Formalize into enum.
- **C11 initiation_source**: First event type + first_real_prompt pattern matching
- **Derived metrics**: autonomy_ratio, session_liveness (pure arithmetic)
- **Subtypes**: Rule-based subtype assignment for the top 20 patterns (covers ~60% of sessions)

**Cost**: Zero LLM. Just more code in classifier.service.ts.
**Coverage**: Closes ~40% of the gap.

### Strategy B: Batch Enrichment Scan (moderate, Phase 3)

Periodic batch job that reads the last N sessions' JSONL files and computes richer classifications:

- Run on demand (button in Settings) or on schedule
- Processes sessions that have `session_type` but no `session_subtype`
- Uses heuristics + the analysis campaign's classification rules
- Writes enriched fields back to registry.json
- Could process last 100 sessions in ~2 minutes (file reads + pattern matching, no LLM)

**Cost**: CPU time for JSONL parsing. No LLM.
**Coverage**: Closes ~60% of the gap (all deterministic fields).

### Strategy C: LLM-Assisted Enrichment (expensive, Phase 4+)

For fields that truly need semantic understanding:

- Run as a background analysis campaign (like angeleye-analysis-1)
- Use `--bare` flag for zero-overhead Claude calls
- Process sessions in batches of 10-20
- Compute: frustration_signals, multi_phase detection, session_subtype for ambiguous cases, observations

**Cost**: LLM tokens per session (~1K tokens input, ~200 tokens output).
**Coverage**: Closes remaining ~40% of the gap.

### Recommended Sequence

1. **Phase 2**: Strategy A (deterministic enrichment) + project registry + inspector screens
2. **Phase 3**: Strategy B (batch scan) + workflow router (now has rich data to work with)
3. **Phase 4**: Strategy C (LLM-assisted) + cross-session linkage + full observations

## 8. Provenance Chain

Every enrichment field should track where it came from:

```
Hook event (raw)
  → classifier.service.ts (Tier 1+2, deterministic)
    → batch enrichment scan (Tier 2.5, heuristic, on-demand)
      → LLM analysis campaign (Tier 3, semantic, expensive)
```

Each enrichment tier writes to the same RegistryEntry but can be distinguished by a `_enrichment_source` or similar metadata field. Inspector screens show provenance: "session_subtype: build.campaign (source: batch_scan, 2026-03-29)".

---

**This document should be read by any future session planning workflow enrichment, inspector screens, or project registry work.**
