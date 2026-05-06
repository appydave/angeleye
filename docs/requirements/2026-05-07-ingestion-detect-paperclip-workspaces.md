---
id: req-2026-05-07-ingestion-detect-paperclip-workspaces
title: Ingestion — detect Paperclip workspace sessions and tag them correctly
category: ingestion
status: open
created_at: 2026-05-07T07:50:00.000Z
evidence_sessions:
  - 7addf7ed-f4ad-4f7d-b390-8dd82a453214
  - b32962e2-c999-4b9b-bfcb-04bd3240cadc
  - b653e697-bb5c-4f47-a009-07742a5eb24e
  - 392a775c
  - f64f60e3
  - 1ede25a0
  - 0510b580
  - 631ec536
---

## Proposed Change

In `server/src/routes/hooks.ts` at the `session_start` handler (and in any classifier service that derives `project` from `cwd`), add explicit detection for Paperclip workspaces:

```ts
const PAPERCLIP_WORKSPACE_RE = /\/\.paperclip\/instances\/[^/]+\/workspaces\/[a-f0-9-]{36}\/?$/i;

if (cwd && PAPERCLIP_WORKSPACE_RE.test(cwd)) {
  // Paperclip-hosted Claude session — not direct user work
  registryUpdate.session_kind = 'subprocess'; // platform-hosted
  registryUpdate.project = 'paperclip'; // canonical name, not the UUID
  // Optionally: registryUpdate.is_junk = true if these are autonomous platform runs
}
```

Apply the same rule to the `project` derivation in `registry.service.ts` so the project name doesn't become a UUID.

## Why

8 sessions in the corpus have `session_kind === 'main'` and a `project` field that is a UUID like `cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57`. All 8 are Paperclip-hosted sessions running in workspaces under `~/.paperclip/instances/default/workspaces/<uuid>/`. They're escaping the subagent/subprocess filter and entering the main enrichment queue.

These sessions:

- Pollute the AngelEye UI with UUID "projects" that don't represent real user work
- Skew project velocity analytics (3 distinct workspace UUIDs appearing as 3 different "projects")
- Waste enrichment LLM cycles when they should be filtered or grouped under a `paperclip` umbrella

This is the first concrete escape pattern surfaced by the new escapes ledger (`docs/intelligence/escapes-ledger.md`).

## Evidence

| session_id                             | project (UUID)                       | project_dir                                                                                       |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `7addf7ed-f4ad-4f7d-b390-8dd82a453214` | cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57` |
| `b32962e2-c999-4b9b-bfcb-04bd3240cadc` | 8fd2ea7b-2e4c-4d16-ab25-081937f39e4c | `/Users/davidcruwys/.paperclip/instances/default/workspaces/8fd2ea7b-2e4c-4d16-ab25-081937f39e4c` |
| `b653e697-bb5c-4f47-a009-07742a5eb24e` | 54ea7cf7-e406-4042-85ec-066c58e61c12 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/54ea7cf7-e406-4042-85ec-066c58e61c12` |
| Plus 5 more                            | (3 distinct workspace UUIDs total)   | (same Paperclip path pattern)                                                                     |

Full ledger: `docs/intelligence/escapes-ledger.md` (E1: UUID project — Paperclip workspace leak).

Detection rule (deterministic, re-runnable): scan all sessions where `session_kind === 'main'` and `project` matches `^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`.

## Acceptance Criteria

- [ ] `hooks.ts` (and `registry.service.ts` project-derivation) detects `/.paperclip/instances/*/workspaces/<uuid>` paths
- [ ] When detected, sets `session_kind: 'subprocess'` and `project: 'paperclip'`
- [ ] Backfill endpoint or one-off script applies the same rule retroactively to the existing 8 sessions
- [ ] After backfill, the E1 escape count in `escapes-ledger.md` drops to 0
- [ ] The enrichment loop's escape detection (per-batch) keeps watching for new instances appearing — quick alert if Paperclip starts using a new path pattern
