---
id: req-2026-05-13-unified-tag-architecture
title: Schema/Architecture — unified tag system with multi-source provenance and layered config
category: schema
status: open
created_at: 2026-05-13T01:00:00.000Z
evidence_sessions:
  - 08fbfe17-f1c4-41ff-a713-4bdd3c7983f1
---

## Proposed Change

Collapse the three current tag-like fields on `RegistryEntry` into one unified tag system with multi-source provenance. Drive the tag definitions from layered config files (global + machine + lazy project) rather than hardcoded TypeScript regexes. Expose a uniform REST-y API for stored vs derived tag queries.

This supersedes the original "cut 7 `has_*` fields" cleanup path — same underlying problem, broader solution.

### A. Unified tag schema

```ts
export type TagSource = 'heuristic' | 'llm' | 'manual' | 'dreaming' | 'derived';

export type TagName =
  // Heuristic predicates (was: has_skill_created etc.)
  | 'agent_genesis' // session edited a file in .claude/skills/
  | 'skill_modified' // session edited an existing skill
  | 'brain_writes' // session wrote to ~/dev/ad/brains/
  | 'git_outcome' // session produced a git commit or push
  | 'compaction_resume' // session resumed from a compacted context
  // Harness-archetype tags (was: detected via cwd regexes in code)
  | 'paperclip_harness'
  | 'als_delamain_harness'
  | 'appyctrl_probe'
  // LLM-derived classifications (was: session_tags[].tag — already free-form)
  | 'build.feature'
  | 'build.campaign'
  | 'build.bmad_orchestrator'
  | string; // open for now until enrichment stabilises the vocabulary

export interface SessionTag {
  tag: TagName;
  source: TagSource;
  confidence?: number; // 0-1, omitted for deterministic sources
  derived_at?: string; // ISO timestamp
  config_ref?: string; // sha256 hash of the rule that produced this tag — for provenance lookup
  evidence?: string; // optional pointer to event_id or rationale
}

export interface RegistryEntry {
  // ...
  tags: SessionTag[]; // unified — replaces both `tags` and `session_tags`
  // CUT: tags: string[], session_tags: SessionTag[], all 14 has_* fields
}
```

Tag entries are **sparse** — only present facts are stored. Empty `tags: []` is the default.

### B. Three-layer config

Tag definitions move from TypeScript regexes to JSON config files. Layered:

| Layer             | Location                                           | Lifecycle                                                                                 | Use for                                                                    |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Global / user** | `~/.config/appydave/angeleye-tags.json`            | Eager-loaded at server boot; held in memory; hot-reloadable via `POST /api/config/reload` | Universal facts that hold on every machine                                 |
| **Machine**       | `~/.config/appydave/angeleye-tags.<hostname>.json` | Same as global                                                                            | Machine-specific patterns (Roamy Kyberbot, M4 Mini AppyCtrl)               |
| **Project**       | `<cwd>/.angeleye/tags.json` (optional)             | **Lazy-loaded at session_start hook only; NOT retained**                                  | Project-specific overrides — read once, applied to this session, discarded |

Merge rules: later layers (machine > global) override same-named tags. Project layer adds to the merged set for THIS session only.

**Project-config statelessness is the discipline that prevents memory accumulation** — AngelEye runs for months on a single boot; lazy-load-and-discard keeps the daemon bounded.

### C. Detector types

A tag definition specifies how its truth-value is determined. Initial set:

```jsonc
{
  "tags": [
    {
      "name": "git_outcome",
      "description": "Session produced a git commit or push",
      "source": "heuristic",
      "detector": {
        "type": "tool_use_regex",
        "tool": "Bash",
        "pattern": "^git\\s+(commit|push)\\b",
      },
    },
    {
      "name": "paperclip_harness",
      "description": "Session running inside a Paperclip workspace",
      "source": "heuristic",
      "detector": {
        "type": "cwd_regex",
        "pattern": "/\\.paperclip/instances/[^/]+/workspaces/[a-f0-9-]{36}/?$",
      },
    },
    {
      "name": "agent_genesis",
      "description": "Session created a new skill",
      "source": "heuristic",
      "detector": {
        "type": "tool_use_target_regex",
        "tool": "Write",
        "target_field": "file_path",
        "pattern": "\\.claude/skills/[^/]+/SKILL\\.md$",
      },
    },
    {
      "name": "compaction_resume",
      "description": "Session resumed from a compacted context",
      "source": "heuristic",
      "detector": {
        "type": "raw_jsonl_entry_type",
        "entry_type": "summary",
        "position_max": 2,
      },
    },
  ],
}
```

Initial detector types:

| Type                    | Reads                                               | Use for                                               |
| ----------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `cwd_regex`             | session start cwd                                   | Harness detection (Paperclip, delamain, future)       |
| `trigger_command_regex` | first prompt's `/command`                           | BMAD, Ralphy, orchestrator skills                     |
| `tool_use_regex`        | Bash command bodies                                 | Git outcomes, scheduled jobs, deploy commands         |
| `tool_use_target_regex` | Tool input fields (`file_path` for Edit/Write/Read) | Brain writes, skill edits, project anchor             |
| `event_count_predicate` | counts of event types                               | Silent session (zero `user_prompt`), heavy tool usage |
| `raw_jsonl_entry_type`  | upstream JSONL entry types                          | Compaction resume (summary entries), thinking blocks  |

New detector types can be added as registered detector implementations. The config file references them by `type:`; the server has a registry of detector executors.

### D. Unified REST-y API

Same noun (`tags`), uniform verbs, mode switches via parameters:

| Endpoint                                     | Default behaviour                           | Mode override                                          |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| `GET /api/sessions?tag=X`                    | Filter corpus by **stored** tag             | `&source=derived` → also compute on-demand             |
| `GET /api/sessions?tag=X&source=llm`         | Filter by tag from a specific source        | —                                                      |
| `GET /api/sessions?tag=X&min_confidence=0.8` | Filter by tag with minimum confidence       | —                                                      |
| `GET /api/sessions/:id/tags`                 | All stored tags for this session            | `?source=derived` → compute-on-demand for this session |
| `POST /api/sessions/:id/tags`                | Add a manual tag                            | body: `{tag, source: 'manual'}`                        |
| `DELETE /api/sessions/:id/tags/:tag`         | Remove a tag (any source)                   | —                                                      |
| `POST /api/tags/backfill`                    | Re-derive all heuristic tags across corpus  | `?tag=X` (one tag), `?source=heuristic` (one source)   |
| `POST /api/config/reload`                    | Re-read global + machine configs at runtime | —                                                      |

### E. Migration plan

Phased — schema first, then data, then code consolidation:

1. **Schema additions** — add `tags: SessionTag[]` to `RegistryEntry`. Type-only commit; doesn't break anything.
2. **Config loader** — implement global + machine eager loaders, project lazy reader, detector registry.
3. **Heuristic detectors** — port the 5 worth-keeping `has_*` predicates (`agent_genesis`, `skill_modified`, `brain_writes`, `git_outcome`, `compaction_resume`) into config-driven detectors. Also port the existing hardcoded harness regexes (`PAPERCLIP_WORKSPACE_RE`, `ALS_DELAMAIN_WORKER_RE`) into config.
4. **Hook-time tagging** — at `session_start` and `session_end`, run applicable detectors and append `SessionTag` entries to `tags`.
5. **API endpoints** — add the new unified endpoints. Keep old endpoints temporarily for compatibility.
6. **Backfill** — `POST /api/tags/backfill` runs all heuristic detectors across the corpus.
7. **LLM enrichment migration** — enrichment loop writes to `tags` instead of `session_tags`. Backfill: copy existing `session_tags[]` entries into `tags[]` with `source: 'llm'`.
8. **Cut old fields** — once all readers migrated: drop `session_tags`, drop the 14 `has_*` boolean columns, drop `tags: string[]`. Schema v2.

Backward compatibility during migration: maintain both shapes in parallel for one release cycle. New writers populate `tags`; old readers can still read the legacy fields. After migration completes, do a final cut.

## Why

Three pressures converge here, all surfaced 2026-05-13:

1. **Schema audit** (`docs/intelligence/schema-audit-2026-05-13.md`) found 14 `has_*` boolean columns with <2% true rates and no readers outside the campaign-UI viz layer. Their cost as top-level fields outweighs their signal value. The audit also flagged `tags: string[]` as effectively unused (4 distinct values across 4,395 sessions).

2. **Predicate/tag conceptual unification**: predicates and tags encode the same kind of information (facts about a session). The current schema has three implementations (`has_*` columns, `session_tags`, `tags`) of one underlying concept. Consolidating to one tag system with multi-source provenance is the natural completion.

3. **Portability**: 6 harness archetypes have surfaced (BMAD, Ruflo, Ralphy, Paperclip, AppyCtrl, ALS delamain). Each requires its own detection pattern. Hardcoding patterns in TypeScript means a code deploy for every new pattern. Config-driven detection lets David add a new harness regex by editing JSON — and the same config travels across his 5 machines via dotfile sync.

The convergence makes a single architectural move the right scope — not three separate cleanups.

## Evidence

| Concern                                                             | Source                                                      |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| 14 dense `has_*` boolean columns with low signal density            | Schema audit 2026-05-13, "HIGH-priority cuts" section       |
| `tags: string[]` near-empty                                         | Schema audit 2026-05-13                                     |
| `session_tags` already structured with confidence + source          | Existing `SessionTag` type, already populated by enrichment |
| 6 distinct harness archetypes detected via hardcoded regexes        | Handover doc 2026-05-13 update                              |
| ~88 sessions affected per predicate at <2% true rate × 4,395 corpus | Schema audit distribution numbers                           |

## Acceptance Criteria

- [ ] `SessionTag` struct + `TagName` enum + `TagSource` enum defined in `shared/src/angeleye.ts`
- [ ] `tags: SessionTag[]` field added to `RegistryEntry`
- [ ] Three-layer config loader: global eager, machine eager, project lazy at `session_start`
- [ ] `POST /api/config/reload` endpoint for runtime reload of global + machine configs
- [ ] Detector registry with initial 6 types (`cwd_regex`, `trigger_command_regex`, `tool_use_regex`, `tool_use_target_regex`, `event_count_predicate`, `raw_jsonl_entry_type`)
- [ ] At `session_start` and `session_end`, applicable detectors run and append to `tags`
- [ ] Unified API: `GET /api/sessions?tag=`, `GET /api/sessions/:id/tags`, `POST /api/sessions/:id/tags`, `DELETE /api/sessions/:id/tags/:tag`, `POST /api/tags/backfill`
- [ ] `?source=derived` mode triggers on-demand computation
- [ ] Initial global config file at `~/.config/appydave/angeleye-tags.json` populated with the 5 portable heuristics + harness archetypes
- [ ] Machine config files seeded for `roamy` and `m4-mini` (placeholder for now)
- [ ] Migration: backfill copies legacy `session_tags` → `tags`, derives 5 heuristic tags from events, drops the 14 `has_*` columns
- [ ] After migration: legacy fields removed from schema, all clients updated

## Future considerations

### Config provenance ledger

Append-only ledger at `~/.claude/angeleye/tag-config-history.jsonl`, deduplicated by content hash. One entry per distinct config (not per session):

```jsonl
{"config_id":"sha256-abc...","source_path":"<path>","layer":"project|machine|global","first_seen":"...","last_seen":"...","content":{...},"tag_names":["..."]}
```

Each `SessionTag` written carries `config_ref: <hash>` linking back to the rule that produced it. Solves the backfill-fidelity problem for lazy-loaded project configs (rules can be re-applied even after the file is deleted) and provides version history for global/machine rules. Storage growth bounded by distinct configs (~10s/year), not by sessions.

Same construction as the four-pillars Provenance Chain principle, applied to classifier rules. Not in the initial spec; revisit when backfill fidelity becomes a real concern.

### File-watching for hot reload

Instead of (or in addition to) the manual `POST /api/config/reload` endpoint, a chokidar file-watcher on the global + machine config paths would auto-reload on edit. Adds ~one small dependency, removes the manual reload step. Worth adding once the basic system is stable.

### Tag name namespacing

If the typed `TagName` enum grows beyond ~30 values, consider namespacing: `harness:paperclip`, `predicate:git_outcome`, `subtype:build.feature`. Keeps the vocabulary organised as it expands. Don't do it preemptively — wait for the count to justify it.

### LLM-driven tag suggestion

A future enrichment pass could suggest new tag NAMES (not just values) when it sees patterns the current vocabulary doesn't cover. Output to a "proposed tags" log; human reviews; promotes to the enum if useful. Closes the loop between dreaming and the tag system.

## Notes

- **Pattern name**: "predicate-based tagging with multi-source provenance" — the formal name for what's described here.
- **Discipline principle surfaced**: AngelEye should never accumulate state that the user can't explicitly clear. Project-scoped configs are stateless-by-design; global/machine are explicitly bounded by edit count.
- **Relationship to `session_class`**: `session_class` is the user-driven-vs-machine-driven dimension; it stays as a dedicated field because it's queried on EVERY default list (special status, not a regular tag). Don't fold it into tags. Same reasoning for `is_junk`, `session_kind`, and `enrichment_version` — these are query-critical dimensions, not facts to discover.
- **Relationship to the parked `harness` field**: this requirement effectively answers that question. Harness archetypes become tags (`paperclip_harness`, `als_delamain_harness`, etc.) rather than a dedicated enum field. The decision parked from 2026-05-07 can be closed.
- **Versioning**: the `classifier_version` field discussed in earlier requirements (for backfill triggers) can be replaced by the `config_ref` in `SessionTag`. Tag entries naturally carry the version of the rule that produced them.
- **Backwards compatibility window**: keep dual-shape (legacy + unified) for one release cycle. Drop legacy fields in a clearly-labelled v2 commit.
