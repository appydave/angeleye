---
id: req-2026-05-07-schema-has-scheduling-setup-predicate
title: Add has_scheduling_setup predicate (≥3 CronCreate tool calls)
category: schema
status: open
created_at: 2026-05-07T00:45:00.000Z
evidence_sessions:
  - 5b5b4d5c-7e69-4ee0-93e8-968fb32338ac
---

## Proposed Change

Add `has_scheduling_setup: boolean` to `RegistryEntry` in `shared/src/types.ts`. Set `true` during ingestion when a session has ≥ 3 `CronCreate` tool calls.

This is purely a predicate addition — no taxonomy change. Sessions that build automation infrastructure get a queryable flag.

## Why

Session `5b5b4d5c` (a Baku organisation campaign) made 19 `CronCreate` calls — David was setting up scheduled automation as part of the work. That's a recognisable pattern: the session's _purpose_ is varied (it's a campaign, a build, sometimes orientation), but the _characteristic_ of "I built scheduled jobs in this session" is consistent and queryable.

A predicate lets you ask "show me sessions where I configured automation" without polluting the subtype taxonomy.

## Evidence

| Session                                | Observation                                                                                                                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `5b5b4d5c-7e69-4ee0-93e8-968fb32338ac` | 598 events, classified as `build.campaign` (Baku organisation). 19 CronCreate calls within the session — David scheduled many recurring tasks. Currently no way to surface this from the registry. |

## Acceptance Criteria

- [ ] `has_scheduling_setup: boolean` added to `RegistryEntry` type, defaults `false`
- [ ] Ingestion sets it `true` when ≥ 3 `CronCreate` tool calls observed in session events
- [ ] Field surfaced in `/api/sessions` response
- [ ] No taxonomy change — subtype classification unaffected
- [ ] Existing v1 enrichments not retroactively reclassified
