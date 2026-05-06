---
id: req-2026-05-06-apply-changes-to-registry
title: Apply enrichment changes to registry entry
category: schema
status: open
created_at: 2026-05-06T14:16:00.000Z
evidence_sessions:
  - 464e8e87-859d-4ab6-8003-3fe46bc13ea2
  - 044f935a-d2d4-47f9-85f0-4934224aa478
  - c555ecc1-57da-4a1e-b382-7a29bbba39ad
---

## Proposed Change

In `server/src/routes/sessions.ts`, the `POST /api/sessions/:id/enrichments` handler currently syncs `enrichment_version` and `enriched_at` to the registry entry but does not apply `changes.session_subtype` or `changes.session_tags`. After writing the sidecar, the handler should also update the live registry row:

```ts
// after appendEnrichmentPass(...)
if (changes.session_subtype) {
  await updateRegistry(id, { session_subtype: changes.session_subtype });
}
if (changes.session_tags) {
  await updateRegistry(id, { tags: changes.session_tags.map((t) => t.tag) });
}
```

The registry field for LLM tags is `tags` (array of strings). `session_subtype` maps directly to `session_subtype` on `RegistryEntry`. Confirm correct field names before implementing.

## Why

The enrichment loop classifies sessions and writes `session_subtype` and `session_tags` into the sidecar — but those judgments never reach the registry. After running the first 5-session batch, verified that `enrichment_version` and `enriched_at` updated on the registry row but `session_subtype` and `tags` did not. This means LLM judgments are invisible to the UI, the sessions API filter, and any downstream analysis that reads the registry.

The `changes` field was named "changes" with the intent that they'd be applied. This confirms they should be — the alternative (renaming to `observed_changes` and keeping them sidecar-only) would make the enrichment loop useless for the primary goal of improving session classification quality in the UI.

## Evidence

| Session    | Observation                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `464e8e87` | POST returned `written: true`. Verified `enrichment_version: 1` and `enriched_at` set on registry. But `tags: []` — session_tags `["build.shipped"]` not applied. |
| `c555ecc1` | Same pattern. `meta.scheduled_probe` tag written to sidecar, not reflected in registry `tags`.                                                                    |

## Acceptance Criteria

- [ ] After `POST /api/sessions/:id/enrichments` with `changes.session_subtype`, the registry row reflects the new `session_subtype`
- [ ] After `POST /api/sessions/:id/enrichments` with `changes.session_tags`, the registry row reflects the new `tags` array
- [ ] `GET /api/sessions?limit=200` returns the updated `session_subtype` and `tags` for enriched sessions
- [ ] Existing tests for the POST endpoint assert registry state after the call (currently DVR-009 — test does not check registry)
