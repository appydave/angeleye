# AngelEye Architecture Refactor — Ingestion Split + Stability

**Created**: 2026-04-01
**Status**: Draft — requirements captured from OMI voice sessions
**Source sessions**: OMI 2026-04-01 (11:24 "architecture and requirements", 11:34 "architecture and migration")
**Depends on**: Wave 12 complete or running in parallel

---

## Problem

AngelEye is currently a single process: the ingestion pipeline (watching Claude files, processing hook events) and the web application (Socket.IO visualisation, API, UI) are tightly coupled. This causes:

1. **Frequent crashes** — Socket.IO instability and/or cache management failures bring down the entire app including ingestion
2. **Data loss risk** — when the app crashes, in-flight hook events may be missed
3. **Scale ceiling** — high session volume strains memory that is shared between ingestion and the visualisation layer
4. **Single-harness assumption** — ingestion is wired only for Claude Code hooks; Codex and Gemini harnesses can't plug in cleanly

---

## Goal

Split AngelEye into two independently deployable services:

| Service               | Responsibility                                                          | Crash impact                          |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| **Ingestion service** | Watch Claude files, receive hook events, write JSONL, maintain registry | App crashes → ingestion keeps running |
| **Web app**           | Socket.IO, Observer UI, Organiser UI, API for visualisation             | App crashes → no data loss            |

Each service starts independently on boot, restarts independently on crash.

---

## Requirements

### REQ-1: Extract ingestion as a standalone web service

- The ingestion mechanism (file watcher + hook endpoint) is extracted from the current Express server
- Runs as its own Node process on a dedicated port (separate from the UI server)
- Exposes `POST /hooks/:event` as before — hook scripts continue to work unchanged
- Writes JSONL hot files and updates registry independently of the web app
- Web app reads from the JSONL/registry layer (already flat files — no shared in-process state needed)

**Done when**: AngelEye web app can be stopped and restarted without missing any hook events from active Claude Code sessions.

### REQ-2: Multi-harness support in ingestion service

- Ingestion service is designed to receive events from multiple harness types, not just Claude Code
- Initial target harnesses: **Codex**, **Gemini** (in addition to existing Claude Code)
- Each harness posts to the same `POST /hooks/:event` endpoint with a harness identifier in the payload
- Ingestion normalises events to the existing AngelEye schema regardless of source harness

**Done when**: A Codex or Gemini harness can post events to the ingestion endpoint and they appear in the session registry with correct harness attribution.

### REQ-3: Auto-start on boot (both services)

- Both the ingestion service and the web app are registered as launchd plists
- Both restart automatically on crash (`KeepAlive: true`)
- The ingestion service starts before the web app (dependency ordering)
- Relates to existing backlog item **B025** — update B025 to cover the split architecture

**Done when**: After a full machine restart, both services are running within 60 seconds with no manual intervention.

### REQ-4: Fix Socket.IO crash loop

- Investigate root cause of frequent AngelEye web app crashes
- Likely candidates: unbounded Socket.IO event queue, cache not being cleared, memory leak in session list rendering
- Add cache clearing strategy (e.g. max events in memory, TTL on hot-file buffers)
- Fix should be validated against a high-volume scenario (500+ sessions, continuous hook traffic)

**Done when**: AngelEye web app runs for 72 hours without crashing under normal usage.

---

## Architecture Diagram

```
Claude Code hooks ──┐
Codex hooks ────────┼──→ Ingestion Service (port TBD)
Gemini hooks ───────┘         │
                              │ writes
                              ▼
                    JSONL flat files + registry
                              │
                              │ reads
                              ▼
                    Web App (port 5051)
                         │
                         │ Socket.IO
                         ▼
                    Observer UI (port 5050)
```

---

## Backlog Items

| ID   | Description                                                          | Priority |
| ---- | -------------------------------------------------------------------- | -------- |
| B051 | Extract ingestion into standalone web service, separate from web app | High     |
| B052 | Multi-harness ingestion: Codex + Gemini event normalisation          | Medium   |
| B053 | Update launchd plist (B025) to cover split architecture — two plists | Medium   |
| B054 | Fix Socket.IO crash loop — root cause investigation + cache clearing | High     |

---

## Open Questions

1. **What port does the ingestion service run on?** Need to update port registry (`brand-dave/app-port-registry.md`).
2. **Should the web app subscribe to ingestion events via an internal socket, or just poll flat files?** Flat files are simpler; internal socket gives lower latency for live Observer updates.
3. **Does B025 get superseded by B053, or does B025 stay as-is for the web app and B053 covers the new ingestion service plist?**
4. **Codex/Gemini hook format** — do these harnesses have a hook/event system, or do we need to build adapters?

---

## Related

- `requirements.md` — canonical requirements doc
- `BACKLOG.md` — backlog items B051–B054 added
- `angeleye-future-vision.md` — cross-runtime neutrality (REQ-2 is the first step toward this)
- `agentic-os/agentic-apps.md` — port registry update needed once ingestion port is assigned
