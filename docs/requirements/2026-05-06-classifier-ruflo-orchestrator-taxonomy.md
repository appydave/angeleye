---
id: req-2026-05-06-classifier-ruflo-orchestrator-taxonomy
title: Classifier — add build.ruflo_orchestrator to taxonomy or remap heuristic
category: classifier
status: open
created_at: 2026-05-06T15:15:00.000Z
evidence_sessions:
  - c408f239-869b-41a0-a40b-14afbea9fdbb
---

## Proposed Change

Either (A) add `build.ruflo_orchestrator` to the taxonomy in `references/taxonomy.md` and document its signal pattern, or (B) remap the heuristic in `classifier.service.ts` to an existing taxonomy entry when it fires on skill-building sessions rather than actual Ruflo orchestration runs.

The heuristic currently fires `build.ruflo_orchestrator` on sessions in the appyctrl project that involve Ruflo-related tool patterns, but `c408f239` was actually a skill-building session (`build.prompt_engineering`) — not running Ruflo as an orchestrator.

## Why

The enrichment loop encountered `build.ruflo_orchestrator` as a heuristic value but it has no entry in the taxonomy. The LLM had to override it to `build.prompt_engineering`. If this subtype is intentional (sessions where David runs the Ruflo swarm workflow as orchestrator), it should be in the taxonomy with a clear signal definition. If it's firing on the wrong sessions, the classifier rule needs tightening.

## Evidence

| Session                                | Observation                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c408f239-869b-41a0-a40b-14afbea9fdbb` | Heuristic = `build.ruflo_orchestrator`, but session was David building the Rufus skill from scratch (Write/Edit on SKILL.md, skill-creator audit, deploy). LLM classified as `build.prompt_engineering` 0.75. |

## Acceptance Criteria

- [ ] `build.ruflo_orchestrator` either appears in the taxonomy with a signal definition, or the heuristic is updated to not fire on skill-building sessions
- [ ] Sessions where David actually _runs_ the Ruflo orchestrator (invokes ruflo skill to kick off swarm work) are correctly tagged, distinct from sessions where he _edits_ the skill files
