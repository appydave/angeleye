# Wave 8 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 79 (bringing total to 347/794 = 43.7%)
**Agents**: 9 parallel (W8-01 through W8-09)
**Duration**: ~8 minutes to complete all 9 agents

## Application Learnings

### BUILD misclassification remains consistent

- **Wave 8 BUILD accuracy: ~25% (20/79)**. Consistent with waves 6-7 (~20-22%).
- Per-batch: W8-01 11%, W8-02 37.5%, W8-03 33%, W8-04 22%, W8-05 33%, W8-06 22%, W8-07 37.5%, W8-08 22%, W8-09 33%
- Pattern holds: accuracy scales with session complexity (micro/light near 0%, heavy 50%+)

### Friction predicates P13-P16 validated

First wave trialling the new friction predicates from the /insights comparison:

| Predicate                     | Fires | Notes                                                                   |
| ----------------------------- | ----- | ----------------------------------------------------------------------- |
| P13 has_misunderstood_request | ~8/79 | Strongest signal in handover-driven sessions and voice-dictated prompts |
| P14 has_wrong_approach        | ~7/79 | Often co-occurs with P13. Right goal, wrong method                      |
| P15 has_buggy_output          | ~9/79 | Most common friction type. Error-fix cycles clearly detectable          |
| P16 has_excessive_changes     | ~2/79 | Rarest. Only confirmed in 2 sessions across all 9 batches               |

**Assessment**: P13-P15 add real signal beyond the binary P02 (has_frustration_signals). P16 is rare but when it fires, it's meaningful. All four should be promoted to the permanent predicate set.

**Key insight**: P13-P14 tend to co-occur in handover-driven sessions where literal instructions were followed but broader context was missed. This is a distinct failure mode from P15 (buggy code).

### ~55 new subtypes proposed (~0.70/session discovery rate)

Discovery rate remains strong despite being 347 sessions deep. Notable new subtypes:

- `debug.skill_failure` — cross-session debugging relay for failing skills (2 instances)
- `research.crisis_investigation` — panic-triggered compliance investigation with agent orchestration
- `research.codebase_archaeology` — exploring unfamiliar codebase structure
- `research.project_revival` — returning to dormant project after extended absence
- `build.greenfield_app` — new application from scratch (distinct from feature work)
- `build.tooling_replication` — replicating tooling patterns across projects
- `build.prompt_engineering` — prompt template work classified as BUILD (not KNOWLEDGE)
- `knowledge.recipe_design` — designing reusable recipes/templates
- `knowledge.feedback_consolidation` — consolidating feedback items into actionable work
- `knowledge.web_scraping_ingestion` — Playwright-driven web scraping for brain content
- `planning.product_vision` — high-level product direction sessions
- `planning.requirements_gathering` — structured requirements capture
- `planning.gap_analysis` — identifying gaps between current and desired state
- `sysops.git_conflict_resolution` — resolving git conflicts as primary activity
- `setup.tool_installation` — installing/configuring tools (not building)

### "Context poisoning" anti-pattern named

User explicitly named the anti-pattern of stale/aspirational documentation misleading Claude. When docs describe what the system should do rather than what it does, Claude builds to the docs rather than the code. This is distinct from P13 (misunderstood request).

### Plan-paste-then-execute workflow confirmed

Sessions opening with 5K-86KB context pastes (plans, handovers, capture-context output) are a distinct workflow. When Claude deviates from the explicit plan, it causes severe frustration — stronger than typical P13/P14 signals.

### Bidirectional confusion pattern

New failure mode where both user and Claude co-create a misunderstanding. Neither party is "wrong" — the ambiguity is structural. Harder to detect than unilateral misunderstanding (P13).

### Concurrent session pairs: now 4+ confirmed

Third and fourth concurrent session pairs discovered. Sessions touching the same files simultaneously cause git confusion. Automation candidate for AngelEye conflict detection.

### Playwright semantic role #5 confirmed

`web_scraping_for_knowledge` — distinct from `external_research`. Produces durable brain artifacts, not ephemeral research. Now 5 confirmed roles: ui_audit, external_research, documentation_verification, web_scraping_for_knowledge, and form_filling.

### Record-breaking session extremes

- **21-day idle gap** — longest ever observed. Session resumed after 3 weeks.
- **86KB context paste** — largest single prompt. Plan-paste-then-execute pattern.
- **Live stakeholder session** — user running Claude while on a video call with stakeholder.

### New voice dictation artifacts

- "Ralph William" = Ralphy
- "stask" = stack
- Plus 5 additional artifacts catalogued by W8-01

### CWD incidental rate remains high

~40-44% of sessions have incidental CWDs. File-touch paths remain the reliable signal.

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 8 of 8)

Append-only index: 347 entries, 0 duplicates. The pattern continues to be bulletproof.

### All agents completed within a 2-minute window

Fastest: W8-08 (~5.5 min). Slowest: W8-03, W8-07 (~7.5 min). Load balancing (834-836 events per batch) continues to work well.

### P13-P16 integration was seamless

Agents picked up the new predicates from the prompt without any schema migration needed. The predicate system is extensible by design — adding new predicates doesn't require changing existing ones.

### Discovery rate holding at 0.70/session

Not declining. The diversity of projects (20 in this wave) continues to expose new patterns. Consolidation is not yet needed — new subtypes are still appearing at useful rates.

### Total subtypes: ~210+ across 15+ parent types from 347 sessions
