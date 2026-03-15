# IMPLEMENTATION_PLAN.md — AngelEye Wave 6: Hardening

**Goal**: Fix two correctness bugs before they cause data loss; fix test gaps that hide real failure modes; clean up the worst duplication
**Started**: 2026-03-15
**Completed**: 2026-03-15
**Target**: Write queue safe, registry writes atomic, 5 new behaviour tests, session-helpers extracted

## Summary

- Total: 11 | Complete: 11 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] H01 — Fix write queue: add .catch() to chain so queue continues after a failed write
- [x] H02 — Atomic registry writes: write to .tmp then rename() for registry.json and workspaces.json
- [x] H03 — Extract sessionLabel/timeAgo/statusDot to client/src/utils/session-helpers.ts, import in ObserverView + OrganiserView
- [x] H04 — Fix initAngelEyeDirs: await it in index.ts before httpServer.listen(); remove per-request call from hooks.ts
- [x] H05 — Validate workspace_id exists on PATCH /api/sessions/:id (read workspaces, return 404 if not found)
- [x] T01 — Test: backfillTranscripts writes actual events to sessions/ dir (not just counters)
- [x] T02 — Test: getSessionEvents returns [] without throwing when JSONL contains a malformed line
- [x] T03 — Test: GET /api/sessions returns sessions sorted newest-first by last_active
- [x] T04 — Test: POST /hooks/SessionStart without session_id writes to session-unknown.jsonl
- [x] T05 — Test: PATCH /api/sessions/:id returns 400 when tags is a non-array value (documentation test)
- [x] T06 — Rewrite: backfill route test non-deterministic; replaced with shape assertion + vi.mock

## Failed / Needs Retry

## Notes & Decisions

- H01 and H02 are correctness bugs — done first, independent
- H03–H05 code quality, run in parallel after H01/H02
- T01–T06 test quality, run in parallel
- T03 revealed no sorting bug — route already sorted correctly
- H04: index.ts was fire-and-forget (.then/.catch), fixed with async IIFE
- H05: existing test updated to create workspace before PATCH (H05 validation broke the old test)
- Final: 173 tests passing (129 server + 44 client), typecheck clean, lint clean
