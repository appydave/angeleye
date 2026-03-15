# IMPLEMENTATION_PLAN.md — AngelEye Wave 6: Hardening

**Goal**: Fix two correctness bugs before they cause data loss; fix test gaps that hide real failure modes; clean up the worst duplication
**Started**: 2026-03-15
**Target**: Write queue safe, registry writes atomic, 5 new behaviour tests, session-helpers extracted

## Summary

- Total: 11 | Complete: 0 | In Progress: 0 | Pending: 11 | Failed: 0

## Pending

### Correctness (fix first — these are bugs, not debt)

- [ ] H01 — Fix write queue: add .catch() to chain so queue continues after a failed write
- [ ] H02 — Atomic registry writes: write to .tmp then rename() for registry.json and workspaces.json

### Code quality

- [ ] H03 — Extract sessionLabel/timeAgo/statusDot to client/src/utils/session-helpers.ts, import in ObserverView + OrganiserView
- [ ] H04 — Fix initAngelEyeDirs: await it in index.ts before httpServer.listen(); remove per-request call from hooks.ts
- [ ] H05 — Validate workspace_id exists on PATCH /api/sessions/:id (read workspaces, return 404 if not found)

### Test quality (behaviour tests that currently hide real failure modes)

- [ ] T01 — Test: backfillTranscripts writes actual events to sessions/ dir (not just counters)
- [ ] T02 — Test: getSessionEvents returns [] without throwing when JSONL contains a malformed line
- [ ] T03 — Test: GET /api/sessions returns sessions sorted newest-first by last_active
- [ ] T04 — Test: POST /hooks/SessionStart without session_id writes to session-unknown.jsonl
- [ ] T05 — Test: PATCH /api/sessions/:id returns 400 when tags is a non-array value
- [ ] T06 — Rewrite: backfill route test is non-deterministic (hits real ~/.claude/projects); replace with deterministic service-level assertion that events are written to disk

## In Progress

## Complete

## Failed / Needs Retry

## Notes & Decisions

- H01 and H02 are correctness bugs — do these first, they are independent
- H03–H05 are code quality, safe to run in parallel after H01/H02
- T01–T06 are test quality, safe to run in parallel
- H01+H02 together: under 30 minutes
- T01 is the highest value test: backfill writing events is the most important untested side effect
