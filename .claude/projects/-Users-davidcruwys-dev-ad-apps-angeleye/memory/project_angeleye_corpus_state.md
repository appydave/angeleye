---
name: AngelEye corpus state — hollow since May, re-synced 2026-08-01
description: Registry was a skeleton for three months; sync fixed classification but enrichment notes are still 0, so content search stays structurally dead
type: project
---

As of 2026-08-01 the AngelEye registry holds ~2,087 sessions but had been a **skeleton since May**: `first_real_prompt` on 4 rows, `notes` 0/2083, `session_subtype` 0, `enrichment_version` 0. `last-sync.json` sat at **2026-05-03** — hooks wrote bare rows (id, project, status, timestamps) for three months while nothing filled them in. The registry also covers only 2026-05-20 onward; the earlier enriched era survives solely in `registry.json.bak-pre-*` backups (1,829 sessions, 2026-03-12→05-04, 1,211 prompts).

`POST /api/sync` on 2026-08-01 fixed the classification half: 2,075 sessions classified in 41s, 0 errors. Rollback point: `~/.claude/angeleye/registry.json.bak-pre-sync-2026-08-01`.

**Why this matters:** content search will still look broken, and it is not a bug to chase. `/api/search` indexes only `notes` (empty) plus a **200-char truncated stub** of the opening prompt — median `first_real_prompt` length is exactly 200. Searching "angeleye" across 2,083 sessions returned 1 hit. Structural, not fixable by re-syncing.

**How to apply:**

- Never route "find the conversation about X" through `/api/search`. Use the `find_events` MCP tool, `GET /api/events`, `/api/sessions/:id/events` (full prompt text at top-level `prompt` on `event: user_prompt`), or `npx tsx scripts/day-dump.ts [date] [project]`.
- Event richness varies by source: `pre_tool_use` (hook) carries full `tool_input`; `tool_use` carries the tool name only, whether backfilled or live.

**Still outstanding:**

- 1,551 enrichment files + `enrichments.jsonl` exist on disk but are **not joined** onto registry rows, so `notes` stays empty until someone writes that join. Everything after May needs the enrichment loop re-run (LLM cost).
- The May 4 → May 20 gap, and the Mar–May backup era, are unreconciled.
- 20 sessions carry `has_playwright_calls` and would reclassify under the now-wired Playwright branch, but only on `POST /api/sync?force=true` — not yet run. See `docs/architecture/known-issues.md` → `playwright-block-never-ran`.
- Related: [[feedback_priority_audit_versus_working_tool]]
