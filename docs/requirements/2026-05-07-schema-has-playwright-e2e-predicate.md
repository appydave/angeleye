---
id: req-2026-05-07-schema-has-playwright-e2e-predicate
title: Add has_playwright_e2e predicate, fold playwright_e2e under build.campaign
category: schema
status: open
created_at: 2026-05-07T00:45:00.000Z
evidence_sessions:
  - 129a06a1-f648-4d95-a67c-ef51c784dc07
---

## Proposed Change

Two coupled changes:

1. **Schema:** add `has_playwright_e2e: boolean` to `RegistryEntry` in `shared/src/types.ts`. Set `true` during ingestion when a session has ≥ 5 tool calls matching `mcp__playwright__browser_*`.

2. **Classifier:** when `has_playwright_e2e === true`, the LLM/heuristic should still classify by _purpose_ (`build.campaign`, `build.feature`, etc.) but Playwright usage becomes a queryable characteristic. Remove `playwright_e2e` as a candidate `session_subtype` value from the heuristic — Playwright is a _how_, not a _what_.

## Why

Session `129a06a1` is a Ralphy autonomous campaign that performed end-to-end UI verification: 155 `browser_click`, 150 `browser_snapshot`, 110 `browser_take_screenshot`. The heuristic produced `playwright_e2e` as a subtype, but that mixes purpose (running a Ralphy campaign) with mechanism (using Playwright tools). The cleaner shape: classify the session as `build.campaign` and surface Playwright usage as a separate predicate.

This generalises beyond Ralphy. Any future session that uses Playwright (manual UI verification, regression sweeps, screenshot tours via the `screentour` project) gains a queryable flag without polluting the subtype taxonomy.

## Evidence

| Session                                | Observation                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `129a06a1-f648-4d95-a67c-ef51c784dc07` | 996 events, heuristic = `playwright_e2e`. Tool counts: 155 browser_click, 150 browser_snapshot, 110 browser_take_screenshot, 175 Bash, 87 Read. The session is a Ralphy campaign that happens to do heavy E2E. Subtype should be `build.campaign`; Playwright should be a predicate. |

## Acceptance Criteria

- [ ] `has_playwright_e2e: boolean` added to `RegistryEntry` type
- [ ] Ingestion sets it `true` when ≥ 5 `mcp__playwright__browser_*` tool calls observed in session events
- [ ] `playwright_e2e` removed as a heuristic-emitted subtype value (or remapped to `build.campaign`)
- [ ] UI exposes the predicate in the session detail view (small badge or chip is enough)
- [ ] Existing v1 enrichments not retroactively reclassified
