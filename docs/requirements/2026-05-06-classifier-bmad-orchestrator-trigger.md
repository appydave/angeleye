---
id: req-2026-05-06-classifier-bmad-orchestrator-trigger
title: Classifier — detect bmad-story-lifecycle as build.bmad_orchestrator
category: classifier
status: open
created_at: 2026-05-06T14:56:30.000Z
evidence_sessions:
  - f7d51cbf-e74f-472b-bddb-23ce8baa2108
---

## Proposed Change

In `server/src/services/classifier.service.ts`, add a rule that sets `session_subtype = 'build.bmad_orchestrator'` and `subtype_heuristic = 'build.bmad_orchestrator'` when the first `user_prompt` event matches `/appydave:bmad-story-lifecycle` (or any `/appydave:bmad-*` lifecycle trigger). Currently the classifier falls through to `orientation.exploration` when the trigger command is set to a bmad skill name, because no explicit rule handles this prompt pattern.

## Why

The heuristic classified `f7d51cbf` as `orientation.exploration` despite the session opening with `/appydave:bmad-story-lifecycle 0.50` — a clear BMAD orchestrator trigger. The LLM corrected it to `build.bmad_orchestrator` at 0.72 confidence. This correction should be deterministic: any session whose first user prompt starts with `/appydave:bmad-story-lifecycle` is definitionally an orchestrator run.

The existing `trigger_command = 'appydave:bmad-story-lifecycle'` field is already set correctly on these sessions, so the fix may be as simple as mapping that trigger_command value to the `build.bmad_orchestrator` subtype in the classifier rules.

## Evidence

| Session                                | Observation                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `f7d51cbf-e74f-472b-bddb-23ce8baa2108` | First prompt `/appydave:bmad-story-lifecycle 0.50`, heuristic = `orientation.exploration`, correct subtype = `build.bmad_orchestrator`. Session failed early (tool_failure on first Bash) but the intent is unambiguous. |

## Acceptance Criteria

- [ ] Sessions with `trigger_command === 'appydave:bmad-story-lifecycle'` are classified as `build.bmad_orchestrator` by the heuristic, not `orientation.exploration`
- [ ] The fix does not affect sessions where the trigger is a non-lifecycle bmad skill (e.g. `appydave:bmad-dev`, `appydave:bmad-sm`) — those should remain `build.bmad_agent`
- [ ] Existing sessions already enriched at version ≥ 1 are not affected (enrichment takes precedence over heuristic in the UI)
