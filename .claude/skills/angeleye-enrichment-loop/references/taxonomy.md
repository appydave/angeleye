# Session Subtype Taxonomy — Enrichment Reference

Full patterns and heuristics are in `docs/intelligence/PATTERNS.md`. This is the quick-reference for classification during an enrichment pass.

## BUILD — code production

| Subtype                       | Signal                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| `build.shipped`               | Clear deliverable + git outcome (`has_git_outcome: true`)                   |
| `build.bug_fix`               | "fix", "bug", "broken", "why did X fail" in prompts                         |
| `build.feature`               | Generic BUILD fallback (confidence ≤ 0.55 only)                             |
| `build.campaign`              | Skill invocation OR `has_task_orchestration + has_parallel_subagent_bursts` |
| `build.orchestrated_campaign` | Agent-heavy + task orchestration, no parallel bursts                        |
| `build.bmad_agent`            | BMAD skill trigger (`/bmad-sm`, `/bmad-dev`, `/bmad-dr`, etc.)              |
| `build.bmad_orchestrator`     | BMAD lifecycle lead (Swagger/orchestrator pane pattern)                     |
| `build.prompt_engineering`    | Edits to SKILL.md, CLAUDE.md, prompt files                                  |
| `build.visual_implementation` | UI/CSS/Tailwind edits, component work                                       |
| `build.refactor`              | "refactor", "rename", "extract", "move" without feature addition            |
| `build.test_writing`          | Majority of edits are test files                                            |
| `build.project_scaffolding`   | "scaffold", "init", "setup", "create new" in opening prompts                |

## KNOWLEDGE — brain and documentation

| Subtype                        | Signal                                              |
| ------------------------------ | --------------------------------------------------- |
| `knowledge.brain_capture`      | New findings written to `brains/` for first time    |
| `knowledge.brain_maintenance`  | Updating/reorganising existing brain files          |
| `knowledge.methodology_design` | Designing a process, workflow, or method            |
| `knowledge.omi_ingestion`      | OMI wearable transcript processing                  |
| `knowledge.general`            | Generic KNOWLEDGE fallback (confidence ≤ 0.55 only) |

## ORIENTATION — lookup and navigation

| Subtype                            | Signal                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| `orientation.codebase_exploration` | Broad read of codebase, no writes                               |
| `orientation.file_retrieval`       | Fetching a specific known file                                  |
| `orientation.morning_triage`       | "what should I work on", "what's next", first prompt of the day |
| `orientation.quick_check`          | Generic ORIENTATION fallback (confidence ≤ 0.55 only)           |

## RESEARCH — investigation

| Subtype                           | Signal                                             |
| --------------------------------- | -------------------------------------------------- |
| `research.technology_survey`      | WebSearch-heavy, comparing tools/libraries         |
| `research.conceptual_exploration` | Ideas, no specific deliverable                     |
| `research.quick_answer`           | Short session, specific question answered          |
| `research.exploration`            | Generic RESEARCH fallback (confidence ≤ 0.55 only) |

## META — session quality

| Subtype               | Signal                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meta.silent_session` | No `user_prompt` events between session_start and session_end. Cause unknown without further evidence — note the hypothesis (T3 capability probe, human-opened-and-closed, scheduler ping, future host app) in the notes field, not the tag. Auto-flagged `is_junk: true` at ingestion. (confidence 0.95) |
| `meta.accidental`     | Micro + no tool use + abrupt abandon (confidence 0.95)                                                                                                                                                                                                                                                    |

**Deprecated:** `meta.ghost_session` and `meta.scheduled_probe` were both observable-pattern misnomers (they baked cause into the tag). Both are folded into `meta.silent_session`. Existing v1 enrichments using those tags are not retroactively reclassified.

## Classification rules

1. **Subtype hierarchy**: LLM judgment (`session_tags`) > deterministic heuristic (`subtype_heuristic`). You are the LLM judgment layer.
2. **Confidence floors**: Fallback subtypes (`build.feature`, `orientation.quick_check`, etc.) are only valid at confidence ≤ 0.55. If you can score ≥ 0.60 on a specific subtype, use it.
3. **Don't over-classify**: "build.shipped" requires evidence of a completed deliverable. "build.feature" at 0.50 is better than "build.shipped" at 0.55 when the session just looks like generic coding work.
4. **Subagents**: `session_kind === 'subagent'` sessions are legs of a parent campaign. They should be filtered out at Step 1. If one appears, skip it — don't classify it.
5. **Session scale context**: `micro` (< 5 events) is often `meta.accidental` or `orientation.quick_check`. `marathon` (> 200 events) is often a campaign or orchestrated run.
