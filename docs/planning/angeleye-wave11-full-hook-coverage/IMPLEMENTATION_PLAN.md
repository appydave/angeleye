# IMPLEMENTATION_PLAN.md — AngelEye Wave 11: Full Hook Coverage

**Goal**: Complete the expansion from 7 to 24 Claude Code hook events. Server-side code is committed — remaining work is the install skill (7→24 hooks) and wiring settings.json.
**Started**: 2026-03-25
**Target**: All 24 hook events subscribed, install skill updated, settings.json wired, verified end-to-end.

---

## Summary

- Total: 2 | Complete: 2 | In Progress: 0 | Pending: 0 | Failed: 0

## Pre-committed (not tracked as work units)

The following was committed before this campaign started (`62cdef97`):

- `shared/src/angeleye.ts` — 17 new event types + `payload` + `error` fields
- `shared/src/constants.ts` — ANGELEYE_EVENTS expanded to 24
- `server/src/routes/hooks.ts` — EVENT_MAP (17 new), raw payload extraction, schema audit call
- `server/src/services/registry.service.ts` — `_auditDir()` + init
- `server/src/services/schema-auditor.service.ts` — full schema expectation audit system
- `server/src/services/schema-auditor.service.test.ts` — 25 tests
- `server/src/routes/hooks.test.ts` — 7 new tests for wave 11 event handling
- `docs/requirements.md` — updated

## Pending

## In Progress

## Complete

- [x] WU01 — Update install skill: expand from 7→24 hooks with safety guardrails. SKILL.md updated with all 24 events, additive-only safety rules, blast radius documentation.
- [x] WU02 — Wire settings.json: 17 new hook subscriptions added. All 24 events present. 6 non-AngelEye entries preserved (5 disler + 1 playwright). JSON validated.

## Complete

## Failed / Needs Retry

## Notes & Decisions

- **WU01 before WU02**: The install skill must be updated before we can use it to wire settings.json.
- **Install skill safety**: The skill modifies `~/.claude/settings.json` which is shared across ALL Claude Code sessions. It must be purely additive — only touch entries containing `localhost:5051`, never remove or modify hooks from other tools.
- **Blast radius awareness**: Adding 24 hooks means 24 curl commands fire per session. If AngelEye server isn't running, all 24 fail (fast, `|| true` handles it). This is acceptable but worth documenting in the skill.
- **Manual verification required**: WU02 includes a manual check — start a new Claude session and confirm new events appear in JSONL.
