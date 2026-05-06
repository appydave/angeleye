---
id: req-2026-05-06-schema-has-thinking-blocks
title: Schema — add has_thinking_blocks field to RegistryEntry
category: schema
status: open
created_at: 2026-05-06T15:15:00.000Z
evidence_sessions:
  - c408f239-869b-41a0-a40b-14afbea9fdbb
---

## Proposed Change

Add a boolean field `has_thinking_blocks: boolean` to `RegistryEntry` in `shared/src/types.ts`. Populate it during ingestion when any `assistant` entry in the upstream JSONL contains a content block with `type: "thinking"`. Default `false` when upstream is not available (archive-only sessions).

## Why

The upstream JSONL for session `c408f239` contains 4 assistant turns with thinking blocks — internal reasoning the model wrote before responding. The events layer strips these entirely. A `has_thinking_blocks` flag would let the UI surface these sessions separately and let the enrichment loop know when deeper upstream inspection would be worth doing.

Sessions with thinking tend to be more complex reasoning tasks. This field costs nothing to ingest and gives future classification passes a signal they currently can't see.

## Evidence

| Session                                | Observation                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c408f239-869b-41a0-a40b-14afbea9fdbb` | Upstream JSONL (538 lines) contains 4 `assistant` entries where `message.content` includes `{type: "thinking"}` blocks. Events layer has no record of this. |

## Acceptance Criteria

- [ ] `has_thinking_blocks` field exists on `RegistryEntry` type in `shared/src/types.ts`, defaults `false`
- [ ] Ingestion sets `has_thinking_blocks: true` when any `assistant` entry in the upstream JSONL has a thinking block
- [ ] Archive-only sessions remain `false` (archive format doesn't include thinking blocks)
- [ ] Field is surfaced in the `/api/sessions` response
