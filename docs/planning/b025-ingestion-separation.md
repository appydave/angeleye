# B025 — Always-On Ingestion Pipeline (Architecture Research)

**Date**: 2026-03-30
**Status**: Design phase — no code yet

## Problem

AngelEye runs as a single Express server handling both hook ingestion and the web UI. The web UI goes up and down frequently during development. When it's down, hooks fire into nothing and data is lost. The ingestion pipeline must be always-on.

## Recommended Architecture: Two Processes, Single Writer

```
                ~/.claude/settings.json hooks
                curl ... localhost:5051/hooks/:event || true
                          |
                ┌─────────v──────────┐
                │  Ingestion Process  │  port 5051 (launchd-managed)
                │  - hooks.ts route   │
                │  - writeEvent       │  SOLE WRITER to ~/.claude/angeleye/
                │  - updateRegistry   │
                │  - classifySession  │
                │  - auditPayload     │
                │  - mutation API     │  POST /internal/rename, /internal/sync, etc.
                │  - Socket.io server │
                └────────┬───────────┘
                         │ Socket.io (port 5051)
                ┌────────v───────────┐
                │    Web UI Server    │  port 5052 (Overmind-managed)
                │  - All read APIs   │
                │  - Static files    │  READS ~/.claude/angeleye/ (never writes)
                │  - Proxies writes  │  to ingestion process internal API
                │  - Socket.io relay │  connects to ingestion as client
                └────────────────────┘
```

## Key Design Decisions

1. **Single writer principle** — Only the ingestion process writes to `~/.claude/angeleye/`. Eliminates all file locking concerns. Web UI reads files directly but proxies mutations to ingestion.

2. **Ingestion includes classification** — The classifier is deterministic pure logic. Including it means real-time classification on Stop/SessionEnd, just like today.

3. **Socket.io lives on ingestion** — Ingestion emits events. Web UI connects as a Socket.io client and relays to browser. If web UI is down, ingestion emits to nobody (harmless).

4. **Internal mutation API** — Small set of endpoints for web UI to trigger writes:
   - `POST /internal/rename`
   - `POST /internal/sync` (backfill + reclassify)
   - `POST /internal/update-registry`
   - `POST /internal/archive`

5. **No hook config changes** — Hooks stay pointed at `localhost:5051`.

6. **launchd plist for ingestion only** — Auto-start on login, auto-restart on crash. Web UI stays Overmind-managed.

## Options Considered

| Option                                 | Description                                    | Verdict                               |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| A. Minimal shell/node daemon           | ~50 lines, just append files                   | Too fragile for registry updates      |
| **B. Two Express processes**           | **Recommended** — shared codebase, clean split | **Best balance**                      |
| C. SQLite shared store                 | Replace JSON files with SQLite                 | High migration cost, future evolution |
| D. Ingestion writes only, UI read-only | Strict single writer                           | Forces too much into ingestion        |
| E. File locking protocol               | Both processes write with flock                | Cross-process locking is fragile      |

## Migration Path

1. **Extract** — Create `server/src/ingestion.ts` as standalone entry point with hooks route + internal mutation API + Socket.io
2. **Strip** — Remove hooks route from `server/src/index.ts`, change web UI to port 5052, add Socket.io client relay
3. **launchd** — Create `~/Library/LaunchAgents/com.angeleye.ingestion.plist` with KeepAlive
4. **Move backfill/sync** — Since backfill writes to registry, it belongs in the ingestion process. Web UI's "Sync" button calls `POST /internal/sync`.

## Crash Recovery

- launchd restarts ingestion within seconds
- `|| true` on curl commands means Claude Code never blocks
- Events during brief restart window are caught by backfill scanning Claude Code's own JSONL transcripts

## Files to Extract

- `server/src/routes/hooks.ts` — the hook endpoint
- `server/src/services/registry.service.ts` — registry read/write
- `server/src/services/sessions.service.ts` — event write + archive
- `server/src/services/classifier.service.ts` — deterministic classification
- `server/src/services/backfill.service.ts` — transcript scanner
- `server/src/services/schema-auditor.service.ts` — audit append
