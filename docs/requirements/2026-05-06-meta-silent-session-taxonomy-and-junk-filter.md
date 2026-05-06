---
id: req-2026-05-06-meta-silent-session-taxonomy-and-junk-filter
title: Replace ghost/probe subtypes with meta.silent_session + auto-junk filter
category: classifier
status: resolved
created_at: 2026-05-06T16:45:00.000Z
evidence_sessions:
  - 9112177a-3028-438e-ab57-e7995eeb2d19
  - 1b259fe0-c48b-4025-aa4c-c671a81d3c17
  - cd6c6cbc-ad5f-4f3c-8d59-bda3ecd19876
  - af3e4e24-7f70-4558-99e4-ba86b055606b
---

## Proposed Change

Two coupled changes — one taxonomy, one ingestion filter:

### 1. Taxonomy

Replace `meta.ghost_session` and `meta.scheduled_probe` in `references/taxonomy.md` with a single observable-pattern entry:

| Subtype               | Signal                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `meta.silent_session` | Session has no `user_prompt` events between session_start and session_end. Cause is unknown without further evidence. |

Cause hypotheses (T3/OpenCode capability probe, human-opened-and-closed, scheduler ping, future host app) belong in the **notes field**, not in the tag. The classification describes what is observable; the notes describe what the LLM (or heuristic) suspects caused it.

### 2. Ingestion filter

In `server/src/routes/hooks.ts` at the `session_end` handler, after classification runs, check for the silent-session pattern. If the session has zero `user_prompt` events, set `is_junk: true` on the registry entry. This prevents the session from entering the enrichment queue.

Pattern detection logic (deterministic, no LLM):

```ts
const hasNoUserPrompt = !allEvents.some((e) => e.event === 'user_prompt');
if (hasNoUserPrompt) {
  registryUpdate.is_junk = true;
  registryUpdate.session_subtype = 'meta.silent_session';
}
```

The check uses only events AngelEye already has in `allEvents`, so no extra I/O.

## Why

The corpus is being polluted by appyctrl sessions caused by T3/OpenCode's `probeClaudeCapabilities` function (`apps/server/src/provider/Layers/ClaudeProvider.ts:445`). It spawns Claude every 5 minutes (`SNAPSHOT_REFRESH_INTERVAL`) with an intentionally infinite-wait prompt generator — purely to read account info and slash-command metadata, then aborts. AngelEye's hooks fire `SessionStart` + `InstructionsLoaded` + `SessionEnd` but never `UserPromptSubmit`, producing a recognisable pattern.

At ~288 probes/day while appyctrl is running, this generates ~2000 corpus entries per week. The existing tags both lie about the cause:

- `meta.ghost_session` ("Human opened Claude, typed nothing") — wrong; it wasn't a human
- `meta.scheduled_probe` ("Scheduler spawned Claude") — closer but assumes a generic scheduler

A pattern-based tag is durable. If a different tool (Codex, Cursor, future host) does the same thing tomorrow, the same observable pattern still applies. If a human really does open Claude and type nothing, the same tag still applies. The classification doesn't have to guess.

The `is_junk` filter saves ~2000 LLM enrichment calls/week and stops these sessions from drowning out real work in the AngelEye UI. They remain in the registry (so the data isn't lost, and `is_junk` can be unset later if needed).

## Evidence

| Session                                | Observation                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `9112177a-3028-438e-ab57-e7995eeb2d19` | appyctrl, 7 events: `instructions_loaded` × 5 + `session_start` + `session_end`. No prompt. Heuristic: `meta.scheduled_probe`. |
| `1b259fe0-c48b-4025-aa4c-c671a81d3c17` | appyctrl, same pattern. Heuristic: `meta.ghost_session`. Same underlying cause as 9112177a but classified differently.         |
| `cd6c6cbc-ad5f-4f3c-8d59-bda3ecd19876` | appyctrl, same pattern. Heuristic: `meta.ghost_session`. Confirms inconsistent heuristic distinction.                          |
| `af3e4e24-7f70-4558-99e4-ba86b055606b` | appyctrl, 15 events including 3 `config_change`, no prompt, no clean end. Variant of the same silent pattern.                  |

Root cause traced to `apps/server/src/provider/Layers/ClaudeProvider.ts:445` (probeClaudeCapabilities) in the appyctrl/T3 codebase. Every 5 minutes via `SNAPSHOT_REFRESH_INTERVAL = Duration.minutes(5)`.

## Acceptance Criteria

- [ ] `references/taxonomy.md` lists `meta.silent_session` and removes (or marks deprecated) `meta.ghost_session` and `meta.scheduled_probe`
- [ ] `server/src/routes/hooks.ts` `session_end` handler sets `is_junk: true` and `session_subtype: 'meta.silent_session'` when no `user_prompt` events exist in the session
- [ ] Existing v1-enriched sessions are not retroactively modified — the new logic applies to all newly-ingested sessions and is the default for any future v2 reclassification pass
- [ ] The enrichment loop's eligibility filter already excludes `is_junk: true`, so silent sessions never reach the queue going forward
- [ ] A backfill script exists (or the ingestion filter is run retroactively over the registry) so the ~2000 historic ghost/probe sessions get the new tag and `is_junk: true`
