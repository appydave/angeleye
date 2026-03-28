# IMPLEMENTATION_PLAN.md — AngelEye Wave 12: Network Sync + Angel Feedback

**Goal**: Git-based sync so every AngelEye instance detects upstream changes within 2 minutes and offers one-click pull. Plus field-test the Angel feedback pipeline skill.
**Started**: 2026-03-27
**Target**: GitSyncPill visible in header, polling working, pull+restart cycle verified end-to-end. Angel skill tested with one real feedback cycle.

---

## Summary

- Total: 7 | Complete: 7 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

- [ ] WU04 — Git sync service tests: `server/src/services/git-sync.service.test.ts` — mock `execFile`, test all 7 state derivations, test pull refuse-on-dirty, test rebase-abort-on-conflict
- [ ] WU05 — Git sync route tests: `server/src/routes/git-sync.test.ts` — mock service, test HTTP status codes and response shapes
- [ ] WU06 — Client hook + pill + modal: `useGitSync.ts` polling hook, `GitSyncPill.tsx` header indicator, `GitSyncModal.tsx` pull confirmation, integrate into `Header.tsx`, add `sync-pulse` keyframe to `index.css`
- [ ] WU07 — Env var: add `GIT_SYNC_POLL_MS` to `server/src/config/env.ts` Zod schema (default 120000), expose via `/api/info` so client reads it

## In Progress

## Complete

- [x] WU01 — Shared types: `shared/src/git-sync.ts` + re-export. Types compile, shared built.
- [x] WU02 — Git sync service: `checkStatus()`, `pullUpstream()`, `withGitLock()` mutex, `git()` helper with `execFile`. Typecheck clean.
- [x] WU03 — Git sync route: `GET /status`, `POST /pull` mounted at `/api/git-sync` in index.ts. Typecheck clean.
- [x] WU04 — Git sync service tests: 10 test cases (all 7 states + pull success/refuse/conflict + mutex serialisation). All passing.
- [x] WU05 — Git sync route tests: 5 test cases (status 200/500, pull success/dirty/500). All passing.
- [x] WU06 — Client: `useGitSync.ts` hook, `GitSyncPill.tsx` indicator, `GitSyncModal.tsx` confirmation, Header integration, sync-pulse keyframe. Typecheck clean, no regressions.
- [x] WU07 — Env var: `GIT_SYNC_POLL_MS` in Zod schema, exposed via `/api/info` as `gitSyncPollMs`. `.env.example` updated.

## Failed / Needs Retry

## Notes & Decisions

- **WU01 before WU02-WU05**: Shared types must exist before service and route code.
- **WU02 before WU03**: Service must exist before routes import it.
- **WU04-WU05 can parallel**: Service tests and route tests are independent.
- **WU06 depends on WU01+WU03**: Client needs types and a working endpoint to poll.
- **WU07 is independent**: Env var extension can happen any time.
- **Naming**: All files use `git-sync` prefix to avoid collision with existing `sync.ts` (data backfill+classify).
- **No push UI**: David pushes from CLI. Only detect+pull is in scope.
- **Conflict handling**: Simple — `git rebase --abort` + error message. No per-file resolution.
- **Restart strategy**: `setTimeout(() => process.exit(0), 2000)` after pull. Overmind restarts both processes. Check `OVERMIND_SOCKET` to detect Overmind; warn if absent.
- **Angel skill (B048-B049)**: Already created at `.claude/skills/angel/`. Field-testing is manual — run through capture → evaluate → handoff cycle. Not a code work unit.
