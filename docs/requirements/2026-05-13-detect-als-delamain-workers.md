---
id: req-2026-05-13-detect-als-delamain-workers
title: Ingestion — detect ALS delamain workers as machine_signal harness archetype
category: ingestion
status: open
created_at: 2026-05-13T00:00:00.000Z
evidence_sessions:
  - 21fa9582
  - 5f592574
---

## Proposed Change

Add a second cwd-based detection rule to `detectMachineSignalFromCwd` in `server/src/services/session-class.service.ts` so that ALS delamain worker sessions are classified as `machine_signal` at ingestion. Also canonicalise the project name so the corpus stops accumulating `d-<hex>` pseudo-project entries.

### Detection rule

```ts
// Existing
const PAPERCLIP_WORKSPACE_RE = /\/\.paperclip\/instances\/[^/]+\/workspaces\/[a-f0-9-]{36}\/?$/i;

// NEW
const ALS_DELAMAIN_WORKER_RE = /\/\.worktrees\/delamain\/[^/]+\//i;

export function detectMachineSignalFromCwd(cwd: string | undefined | null): boolean {
  if (!cwd) return false;
  return PAPERCLIP_WORKSPACE_RE.test(cwd) || ALS_DELAMAIN_WORKER_RE.test(cwd);
}
```

### Project name canonicalisation

In `server/src/routes/hooks.ts` at `session_start`, when cwd matches the delamain pattern, override the derived project name:

```ts
if (ALS_DELAMAIN_WORKER_RE.test(cwd)) {
  project = 'als-delamain'; // instead of `d-<hex>` derived from the worktree dir
}
```

Same pattern as the Paperclip canonicalisation (`paperclip` rather than the workspace UUID).

### Enrichment-loop skill — filter by session_class

The `angeleye-enrichment-loop` SKILL.md currently filters only on `session_kind === 'main' && !is_junk`. Add an explicit `session_class IN ('dialog', 'agent_run')` check to Step 1 so delamain workers (and any future harness signals) don't waste LLM cycles.

### Backfill

The existing `POST /api/registry/backfill-class` endpoint already uses `computeSessionClass` which reads `detectMachineSignalFromCwd`. Re-running it after this fix will retroactively reclassify the 73 delamain sessions.

For project-name canonicalisation, the 73 affected sessions already have `project: d-<hex>`. A small one-shot script or new backfill endpoint can rename these to `als-delamain`. Mark as a follow-up — not blocking the session_class fix.

## Why

The 2026-05-13 enrichment pass surfaced 73 of 125 user-driven-looking sessions (58%) that are actually ALS delamain worker legs:

- cwd pattern: `~/.worktrees/delamain/bulk-analysis/<task>/`
- project (derived from worktree dirname): `d-<hex>` (e.g. `d-0b42699aa79e`, `d-d6a133b2033d`)
- All running the same P07_EMOTIONAL_TONE YouTube strategist prompt (dispatcher-fed, identical first user prompt across all 73)
- No teammate_id, no Paperclip cwd, no orchestrator trigger_command → current heuristic doesn't catch them

These are functionally **harness signals**, not user-driven work:

- David did NOT initiate each one (the ALS delamain dispatcher did)
- The prompt content is dispatcher-controlled, not user input
- They pollute "what was David working on" queries with 73 copies of the same agent run

This is the same harness-signal-leak pattern that Paperclip workspace heartbeats had — handled in the existing `2026-05-07-schema-session-class.md` requirement via the cwd-regex approach. Extending that approach to delamain is additive: one regex, one consistent handling.

## Evidence

| Aspect                 | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| Sessions affected      | 73 in the 2026-05-07 → 2026-05-13 window alone                             |
| Project pollution      | 12+ distinct `d-<hex>` projects added to corpus                            |
| cwd pattern            | `~/.worktrees/delamain/bulk-analysis/*/` (100% of 73 sessions)             |
| First prompt           | Identical P07_EMOTIONAL_TONE template across all 73                        |
| Current classification | `session_class: 'dialog'` (default) or `'agent_run'` (if tool/prompt > 10) |
| `is_junk`              | false (they DO produce output, unlike silent probes)                       |

Sample sessions (from the May 2026 corpus):

- `21fa9582-...` — 2026-05-11, project `app.supportsignal.com.au` (different project pattern but same delamain cwd?)
- `5f592574-...` — 2026-05-08, project `app.supportsignal.com.au`
- Most others in `d-<hex>` projects

(Re-query `/api/search?q=delamain&include_classes=machine_signal,subagent_leg` after fix lands to confirm 73+ matches.)

## Acceptance Criteria

- [ ] `ALS_DELAMAIN_WORKER_RE` regex added to `session-class.service.ts`
- [ ] `detectMachineSignalFromCwd` returns true for cwd matching the delamain worktree pattern
- [ ] `hooks.ts` at `session_start` overrides project name to `'als-delamain'` when cwd matches
- [ ] Re-running `POST /api/registry/backfill-class` reclassifies the existing 73 delamain sessions to `machine_signal`
- [ ] `angeleye-enrichment-loop` SKILL.md updated to filter eligibility by `session_class IN ('dialog', 'agent_run')` (prevents future cycle waste)
- [ ] After fix lands, default `/api/sessions` and `/api/search` queries no longer return delamain workers (they're machine_signal, excluded by default)
- [ ] `d-<hex>` projects stop accumulating in the corpus (verify by listing distinct projects after a few days)

## Notes

- **Why this is a NEW archetype, not just an escape**: Paperclip (workspace hosting), AppyCtrl (T3 probes), and ALS delamain (worktree-isolated worker swarm) are all **harness archetypes** that drive Claude. They join BMAD/Ruflo/Ralphy on the harness-technique axis. This is the 6th archetype identified — the 5-archetype map in the handover doc should be updated.
- **`is_junk` stays false**: unlike silent probes (zero prompts, no content), delamain workers actually produce content and complete work. They're still `machine_signal` (not user-driven) but not junk. The distinction is real: `is_junk=true` excludes from enrichment queue; `session_class=machine_signal` excludes from default user-facing queries. A delamain worker should be queryable via `?session_class=machine_signal` for analysis, but shouldn't pollute "what did I work on" results.
- **Project-name backfill is optional but recommended**: 73 sessions × 12 distinct `d-<hex>` projects creates noise in project enumerations. A follow-up backfill endpoint (`backfill-project-canonical`) could clean them up retroactively. Or wait until a `harness` field requirement lands (parked) and handle both consolidations at once.
- **Possible additional canonicalisations**: the 24 stale-active sessions audit (2026-05-13) noted that some `d-<hex>` projects might appear outside the delamain cwd pattern (e.g. on M4 main work). Confirm via `?project=d-*` listing before assuming all `d-<hex>` are delamain.
