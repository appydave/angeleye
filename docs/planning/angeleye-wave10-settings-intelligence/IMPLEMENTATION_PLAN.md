# IMPLEMENTATION_PLAN.md — AngelEye Wave 10: Settings Intelligence

**Goal**: Replace the two-step backfill+classify flow with a unified Sync operation, add delta tracking, add classification breakdown, add session type legend, and make backfill extract `/rename` names from JSONL.
**Started**: 2026-03-16
**Target**: All 5 backlog items (B032–B036) complete, Settings page meaningfully informative, Observer type badges self-documenting, `/rename` names visible without manual action.

---

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

---

## Pending

_(none)_

---

## In Progress

_(none)_

---

## Complete

- [x] WC02 — Delta tracking (B033) — LastSyncRecord, readLastSync/writeLastSync, GET /api/sync/status, status line in SettingsView, 7 tests. 204 server tests passing.
- [x] WC03 — Stats endpoint + classification breakdown panel (B034) — stats.ts route, SettingsView breakdown panel, 6 tests. 198 server tests passing.
- [x] WC01 — Sync endpoint + unified settings button (B032) — sync.service.ts, sync.ts route, SettingsView unified, 5 tests. 186 server tests passing.
- [x] WC04 — Session type legend in Observer (B035) — tooltips, ⓘ toggle, legend panel. 44 client tests passing.
- [x] WC05 — Backfill extracts `/rename` names (B036) — extractCustomTitle helper, new+existing sessions, 5 tests. 181 server tests passing.

---

## Failed / Needs Retry

_(none)_

---

## Notes & Decisions

- **WC01 before WC02**: WC02's Settings page status line depends on the sync endpoint existing. WC01 must be merged first.
- **WC03 is independent**: reads registry directly, no dependency on WC01/WC02. Can run in parallel with WC01.
- **WC04 is fully independent**: pure frontend, no new server endpoints. Can run at any time.
- **Rename "skipped" → "already classified"** in the classify result display (WC01 scope, UI side).
- **last-sync.json location**: `~/.claude/angeleye/last-sync.json` — same data dir as registry; use `getDataDir()` from `registry.service.ts` rather than hardcoding.
- **Relative time display**: implement a small helper (no third-party library) — "just now" (<1 min), "X minutes ago", "X hours ago", "X days ago".
- **Stats endpoint**: reads `readRegistry()` and counts in a single pass — no new storage, pure computation.
- **Old endpoints stay**: `POST /api/backfill` and `POST /api/classify` (via `/api` prefix on backfillRouter) remain mounted for backward compat and for the startup backfill in `index.ts`.
