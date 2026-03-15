# IMPLEMENTATION_PLAN.md — AngelEye Wave 2: Hardening

**Goal**: Full test coverage for all AngelEye-specific code; fix stale tests from DemoPage deletion; add PATCH /api/sessions/:id endpoint; fix subtle breaking points discovered during testing.
**Started**: 2026-03-15
**Target**: `npm test` passes clean with zero failures. All three AngelEye server modules have solid unit tests. No excessive mocking — real Express/supertest for routes, real tmpdir for file operations.

## Summary

- Total: 6 | Complete: 4 | In Progress: 1 | Pending: 1 | Failed: 0

## Pending

- [ ] W06-typecheck-lint — Final pass: npm run typecheck + npm run lint clean across all workspaces; fix any type issues surfaced by new tests

## In Progress

- [~] W05-patch-endpoint — Add PATCH /api/sessions/:id to sessions.ts router; tests; makes angeleye-name-session skill work server-side without file fallback

## Complete

- [x] W01-fix-stale-tests — App.test.tsx + main.test.tsx rewritten for AppShell. Bug fix: ObserverView unhandled fetch rejections. Bug fix: env.test.ts wrong port numbers. 123 tests passing.
- [x] W02-data-service-tests — 13 tests; \_setDataDir pattern; write queue concurrency; archive rotation.
- [x] W03-hooks-tests — 14 tests: stop guard, unknown event, SessionStart, UserPromptSubmit (prompt + user_prompt), PostToolUse (Bash/Write/Read/MCP), Stop, SessionEnd, project-from-cwd, hook_event_name override, io.emit args.
- [x] W04-sessions-tests — 7 tests: empty registry, 2-entry registry, response shape, malformed JSON graceful handling, unknown session events, 3-event session, event field shape. Response shape confirmed: data.sessions[] and data.events[]+data.count. Note: helper is apiFailure not apiError.

## Failed / Needs Retry

## Notes & Decisions

- Server port: 5051. Client port: 5050.
- Test strategy: real tmpdir (no fs mocks), supertest for routes, minimal io.emit mock only
- \_setDataDir(dir) resets both paths and write queue — use in beforeEach
- Response helper is apiFailure (not apiError) — AGENTS.md had wrong name; W05 must use apiFailure
- W05 PATCH endpoint: allows updating name/tags/workspace_id only; returns 404 if session not found
- W06 is the final gate before merge
