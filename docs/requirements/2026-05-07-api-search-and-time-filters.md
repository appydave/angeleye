---
id: req-2026-05-07-api-search-and-time-filters
title: API — server-side search, time-range, and project filters on /api/sessions plus a new /api/search endpoint
category: api
status: open
created_at: 2026-05-07T09:00:00.000Z
evidence_sessions:
  - 56ce2c7e-8d4f-47ec-957a-9f6d42c9f672
---

## Proposed Change

Add server-side filter parameters to `GET /api/sessions` and ship a new full-text search endpoint over enrichment notes + first prompts.

### A. Filters on `GET /api/sessions`

| Param            | Type                                               | Effect                                    | Notes                                                                                                                                                                                |
| ---------------- | -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `since`          | ISO datetime prefix                                | only sessions with `started_at >= since`  | string compare; `2026-04` works as a month filter                                                                                                                                    |
| `until`          | ISO datetime prefix                                | only sessions with `started_at <= until`  | same                                                                                                                                                                                 |
| `project`        | string                                             | filter on `project` field                 | exact by default                                                                                                                                                                     |
| `project_match`  | enum `exact` \| `glob` \| `regex`                  | match mode for `project`                  | default `exact`                                                                                                                                                                      |
| `project_dir`    | string                                             | filter on `project_dir` (substring match) | for path-based searches                                                                                                                                                              |
| `kind`           | enum `main` \| `subagent` \| `subprocess` \| `all` | filter on `session_kind`                  | default `all` (current behaviour)                                                                                                                                                    |
| `include_junk`   | bool                                               | include `is_junk: true` sessions          | default `false` (current default-to-skip behaviour preserved if `false` is the new default; if today's behaviour is "include all", flip to `true` and call out as a breaking change) |
| `subtype`        | string                                             | exact match on `session_subtype`          |                                                                                                                                                                                      |
| `subtype_prefix` | string                                             | prefix match (e.g. `build.bmad_`)         |                                                                                                                                                                                      |
| `enriched`       | bool                                               | filter on `enrichment_version > 0`        | useful for "only enriched" sweeps                                                                                                                                                    |

Filters compose. Example: `?since=2026-04-01&project=appystack&project_match=glob&kind=main`.

### B. New endpoint: `GET /api/search`

Full-text search over enrichment notes, first prompts, and session names, with the filter surface from (A) composed in.

Query params:

- `q` (required) — keywords; case-insensitive regex syntax
- `fields` — comma list, default `notes,first_prompt,name,subtype,trigger_command`. Allowed values: `notes`, `first_prompt`, `name`, `subtype`, `subtype_heuristic`, `trigger_command`, `prompts_all` (expensive — searches all `user_prompt` events, not just the first)
- `limit` — default 20
- All filters from (A) compose

Response shape:

```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "session_id": "abc...",
        "score": 12,
        "matched_fields": ["notes", "first_prompt"],
        "session": {
          /* RegistryEntry — same shape as /api/sessions */
        },
        "enrichment_note": "<full notes>",
        "first_prompt_excerpt": "<first 250 chars of first_real_prompt>",
        "prompt_hits": [{ "ts": "...", "excerpt": "<200 chars around the hit>" }]
      }
    ],
    "total": 47,
    "scanned": 1150
  }
}
```

`prompt_hits` is only populated when `fields` includes `prompts_all`; default response is the cheap one.

## Why

Over the course of one session (2026-05-07 — `56ce2c7e-8d4f-47ec-957a-9f6d42c9f672`), David asked three times in different framings for retrieval over the corpus:

1. The AppyStack vs AppySentinel rigid-vs-flexible discussion lookup
2. A live demonstration of the search pattern (worked, but took 4 paged calls + N per-session enrichment fetches)
3. Ralphy as the next thing he'd want to retrieve information about

The current pattern requires:

- Paging `/api/sessions` 13+ times (~2,500 sessions / 200 per page)
- Holding the full corpus in client memory
- N additional fetches per candidate session (`/events`, `/enrichments`)
- Client-side regex scoring

Server-side filters collapse the prefilter step to one network call. A dedicated `/api/search` endpoint eliminates the per-session fetch loop entirely — the server already has `enrichments.history[0].notes` and `first_real_prompt` in the registry; an in-memory inverted index over those two fields rebuilds in <100ms for ~2,500 sessions and serves sub-100ms queries.

Today the retrieval works (proof: lookup completed during the same session), but it's craft, not a product. The new `angeleye-retrieve` skill (`.claude/skills/angeleye-retrieve/SKILL.md`) codifies the pattern client-side as a stopgap; this requirement makes it cheap.

## Evidence

| Session                                | Observation                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `56ce2c7e-8d4f-47ec-957a-9f6d42c9f672` | Today's appystack session — David asked "We did some around improving the installation process. We got away from the prescriptive 'do it all in the installation harness'. Do you have knowledge of that available to you?" The retrieval pattern that answered this question is exactly what the skill + this API formalise. |

(Skill demonstration also surfaced 14 appystack + 11 appysentinal sessions across 2 months, confirming cross-project search is a common need.)

## Acceptance Criteria

- [ ] `GET /api/sessions?since=&until=` filters by `started_at` lexical compare
- [ ] `GET /api/sessions?project=&project_match=exact|glob|regex` filters by project
- [ ] `GET /api/sessions?project_dir=` filters by project_dir substring
- [ ] `GET /api/sessions?kind=&include_junk=` filters on session_kind and is_junk
- [ ] `GET /api/sessions?subtype=&subtype_prefix=` filters on session_subtype
- [ ] `GET /api/sessions?enriched=` filters on `enrichment_version > 0`
- [ ] All filters compose without precedence surprises
- [ ] Existing `/api/sessions` clients still work — filters are additive, no breaking change to default response
- [ ] `GET /api/search?q=` searches `notes`, `first_prompt`, `name`, `subtype`, `subtype_heuristic`, `trigger_command` by default
- [ ] `?fields=` controls the searched field list including the expensive `prompts_all` mode
- [ ] Search response includes `score`, `matched_fields`, and short excerpts (not full prompts)
- [ ] In-memory index rebuilds on registry change (no separate index file required at this scale)
- [ ] `angeleye-retrieve` skill updated to use the new endpoints once shipped (separate PR, tracked in skill `## Future API improvements`)

## Notes

- **Index strategy**: at ~2,500 sessions an in-memory inverted index over `enrichments.history[0].notes` + `first_real_prompt` is sufficient. Watch for breaching this assumption at 50,000+ sessions; at that point introduce a SQLite FTS5 layer or migrate to a proper search engine. Don't over-engineer the first cut.
- **Tool-call content NOT searched**: Bash commands, file paths in Read/Edit calls, tool arguments are out of scope here. If retrieval gaps show this matters, log observations to `docs/intelligence/observations.jsonl` with `category: retrieval_gap` and revisit as a separate requirement.
- **Pagination on filtered/search results**: same `cursor` + `hasMore` shape as `/api/sessions` — cursor encodes the position in the filtered result set, not the underlying registry.
- **Backwards compatibility**: today's `/api/sessions` does not appear to support `?since=` etc. Adding these as query params is additive. Confirm by inspecting `server/src/routes/sessions.ts` before implementation.
- **Future filter candidates** (not in initial scope, parked): `min_event_count`, `has_thinking_blocks`, `is_compaction_resume`, `teammate_id`. Add when a concrete retrieval need surfaces.
