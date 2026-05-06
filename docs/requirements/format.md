# Enrichment Loop — Requirement Document Format

Requirement docs are written by the enrichment loop when it spots a code-change opportunity. They are consumed by a developer-agent in a separate session. The loop never changes code; it only writes these documents.

## Path convention

```
docs/requirements/<YYYY-MM-DD>-<slug>.md
```

- `YYYY-MM-DD` — date the loop wrote the doc
- `slug` — kebab-case summary, max 5 words (e.g. `add-session-kind-field`, `fix-slash-command-classifier`)
- One file per distinct change. A single enrichment pass may produce multiple docs.

## Schema

Each file is a markdown doc with YAML frontmatter.

```markdown
---
id: req-<YYYY-MM-DD>-<slug>
title: <short human-readable title>
category: schema | classifier | predicate | ui | ingestion
status: open | in_progress | resolved
created_at: <ISO 8601 timestamp>
evidence_sessions:
  - <session_id>
  - <session_id>
---

## Proposed Change

<One paragraph. What specifically should change and where. Enough detail that
a developer-agent can act on it without reading the evidence sessions.>

## Why

<What the loop observed that triggered this. Pattern, anomaly, or gap.>

## Evidence

| Session        | Observation                           |
| -------------- | ------------------------------------- |
| `<session_id>` | <what was notable about this session> |

## Acceptance Criteria

- [ ] <testable condition>
- [ ] <testable condition>
```

## Categories

| Category     | Meaning                                                                               |
| ------------ | ------------------------------------------------------------------------------------- |
| `schema`     | Add or change a field on `RegistryEntry`, `EnrichmentPass`, or shared types           |
| `classifier` | New or updated rule in `classifier.service.ts` — deterministic, no LLM cost           |
| `predicate`  | New boolean predicate on `RegistryEntry` (e.g. `has_handover_context`)                |
| `ui`         | Gap in the UI — missing column, view, or filter the loop needed but couldn't find     |
| `ingestion`  | Problem in the ingest pipeline — missed sessions, wrong parsing, archive fallback gap |

## Status lifecycle

```
open → in_progress → resolved
```

The loop always writes `open`. A developer-agent changes it to `in_progress` when picking it up, `resolved` when the change is shipped. The loop must not re-file a requirement that already exists as `open` or `in_progress` for the same proposed change.

## Hard boundary

The loop writes these docs. It does not implement them. It does not modify `shared/src/`, `server/src/services/`, tests, or skills. If the loop finds it wants to change code, it writes a requirement doc and stops.
