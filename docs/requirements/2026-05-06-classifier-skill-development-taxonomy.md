---
id: req-2026-05-06-classifier-skill-development-taxonomy
title: Classifier — add skill.development to taxonomy or remap heuristic
category: classifier
status: open
created_at: 2026-05-06T15:47:00.000Z
evidence_sessions:
  - 77e7fffc-c1c4-4cce-a61b-037699aff490
---

## Proposed Change

Either (A) add `skill.development` to the taxonomy in `references/taxonomy.md` with a clear signal definition, or (B) remap the heuristic in `classifier.service.ts` to an existing taxonomy entry when it fires on sessions that are more accurately classified as `knowledge.methodology_design` or `build.prompt_engineering`.

## Why

The enrichment loop encountered `skill.development` as a heuristic value for session `77e7fffc` but it has no entry in the taxonomy. The session was David asking exploratory questions about how to manage the T3.code upstream dependency — a methodology design conversation, not a skill-building session. The LLM overrode it to `knowledge.methodology_design`.

If `skill.development` is intentional (sessions specifically about developing/improving a skill file), it overlaps heavily with `build.prompt_engineering`. Clarifying the distinction or consolidating them would reduce classification ambiguity.

## Evidence

| Session                                | Observation                                                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `77e7fffc-c1c4-4cce-a61b-037699aff490` | Heuristic = `skill.development`, trigger = `t3-upstream-refresh`. Session was David asking process questions about upstream dependency management. LLM classified as `knowledge.methodology_design` 0.65. |

## Acceptance Criteria

- [ ] `skill.development` either appears in the taxonomy with a signal definition distinct from `build.prompt_engineering`, or the classifier is updated to map it to the closest existing subtype
- [ ] If kept as a distinct subtype, the signal pattern is documented so the enrichment loop can use it for classification
