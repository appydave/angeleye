# IMPLEMENTATION_PLAN.md — AngelEye Wave 1: Foundation

**Goal**: Get real Claude Code session data flowing into AngelEye — hooks received, JSONL written, Socket.io broadcasting, Observer UI showing live events.
**Started**: 2026-03-15
**Target**: Hook events visible in Observer view in real time. Install skill wires Claude Code → AngelEye in one command.

## Summary

- Total: 6 | Complete: 6 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] W01-shared-types — AngelEyeEvent, RegistryEntry, WorkspaceEntry, Registry types in shared/src/angeleye.ts; Socket.io events extended; typecheck clean.
- [x] W02-data-service — server/src/services/angeleye-data.ts; all 7 functions implemented; typecheck + lint clean.
- [x] W03-hook-endpoint — server/src/routes/hooks.ts; createHooksRouter(io); stop guard, tool summarisation, registry lifecycle, Socket.io emit; typecheck + lint clean.
- [x] W04-sessions-api — server/src/routes/sessions.ts; GET /api/sessions + GET /api/sessions/:id/events; typecheck + lint clean.
- [x] W05-observer-ui — ObserverView.tsx; 3-layer layout (header/feed/focus); Socket.io live feed; idle counters; typecheck clean.
- [x] W06-install-skill — ~/.claude/skills/angeleye/install.md + name-session.md; idempotent hook wiring; curl + registry fallback.
- [ ] W02-data-service — AngelEye data service: init ~/.claude/angeleye/ dirs, write events to JSONL, update registry.json, archive rotation
- [ ] W03-hook-endpoint — Express POST /hooks/:event — normalise payload, summarise tools, stop hook guard, write via data service, emit Socket.io
- [ ] W04-sessions-api — Express GET /api/sessions (registry) + GET /api/sessions/:id/events (session JSONL lines)
- [ ] W05-observer-ui — Observer view: Socket.io activity feed (recency sorted), session list with idle counter, click-to-focus detail
- [ ] W06-install-skill — /angeleye:install skill: reads ~/.claude/settings.json, appends HTTP hook config for 7 events, writes back

## In Progress

## Complete

## Failed / Needs Retry

## Notes & Decisions

- Server port: 5051. Client port: 5050. Hook URLs: http://localhost:5051/hooks/:event
- Data location: ~/.claude/angeleye/ (sessions/, archive/, registry.json, workspaces.json)
- Source field on every event: 'hook' | 'transcript' — extensible for future providers, not used in wave 1 logic
- Tool summarisation: Bash→command only, Write→path+line_count, Read→path only, Edit→path+lines_changed, MCP→{server,tool}. Never store raw tool_input.
- Stop hook guard: always check stop_hook_active flag first, exit 0 immediately if set.
- Wave build order: W01 → W02 → (W03 + W04 parallel) → (W05 + W06 parallel)
- Transcript reader (scanning ~/.claude/projects/ for existing sessions) is wave 2 scope — not in this wave.
