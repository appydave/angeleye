# AngelEye — Session Handover (Session 5 → Session 6)

**Date**: 2026-03-15
**Status**: Wave 5 complete. Wave 6 fully planned — two parallel campaigns ready to build.

## Session 6 Start Prompt

> Read the AngelEye handover at ~/dev/ad/apps/angeleye/docs/planning/SESSION_HANDOVER.md.
> Two Wave 6 campaigns are ready. Start with hardening (correctness bugs first), then UI.
> Use Ralphy build mode: fire agents per IMPLEMENTATION_PLAN.md work units.

---

## What Was Done (Waves 4 + 5)

- Wave 4: workspace delete, observer column headers, session label fallback
- Wave 5: transcript backfill (POST /api/backfill, 650 sessions imported), /angeleye:context skill, Settings page Run Backfill button
- Wave 6 audits: deep test quality audit, deep code quality audit, deep design analysis — all findings documented in wave 6 planning folders

---

## Wave 6: Two Campaigns

### Campaign 1 — Hardening

AGENTS.md: docs/planning/angeleye-wave6-hardening/AGENTS.md
PLAN: docs/planning/angeleye-wave6-hardening/IMPLEMENTATION_PLAN.md

**Correctness bugs (do these first — they are latent data loss):**

- H01: Write queue halts permanently on any error (add .catch to chain)
- H02: Non-atomic registry writes (write to .tmp then rename)

**Code quality:**

- H03: Extract session-helpers.ts (sessionLabel/timeAgo/statusDot duplicated in two views)
- H04: Fix initAngelEyeDirs — await at startup, remove from per-request hooks
- H05: Validate workspace_id on PATCH /sessions

**Test quality (behaviour tests hiding real failure modes):**

- T01: Backfill actually writes events to disk (most critical missing test)
- T02: getSessionEvents handles malformed JSONL line
- T03: GET /sessions sorted newest-first
- T04: Hook without session_id → session-unknown.jsonl
- T05: PATCH /sessions rejects non-array tags
- T06: Rewrite non-deterministic backfill route test

### Campaign 2 — UI Polish

AGENTS.md: docs/planning/angeleye-wave6-ui/AGENTS.md
PLAN: docs/planning/angeleye-wave6-ui/IMPLEMENTATION_PLAN.md

- UI01: Remove ContentPanel p-6 (highest impact — makes views edge-to-edge)
- UI02: CSS variable corrections + surface-mid + border-raised + muted-foreground temperature
- UI03: Observer focused row bg-primary/10 → bg-surface-mid
- UI04: Observer column header bg-surface
- UI05: Organiser inbox/workspace visual split

---

## Key Technical Facts

Ports: Client 5050, Server 5051
Test isolation: \_setDataDir(tmpDir) resets paths + write queue
Response helpers: apiSuccess(res, data) and apiFailure(res, msg, code) — NOT apiError
Client reads: response.data.sessions[], response.data.workspaces[], response.data.events[]
Data dir: ~/.claude/angeleye/ (registry.json, workspaces.json, sessions/, archive/)
165 tests currently passing (121 server / 44 client)
Backlog: 15/15 done | 4 deferred (B011, B012, B013, B014)

**Architectural note for Wave 7**: Split angeleye-data.ts into registry.service.ts + workspace.service.ts + backfill.service.ts before building B012 ambient intelligence. The write queue is a module-level singleton and B012 will add a 6th responsibility to the file.

**Handover written**: 2026-03-15
