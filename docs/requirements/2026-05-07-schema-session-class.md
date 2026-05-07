---
id: req-2026-05-07-schema-session-class
title: Schema — add session_class to distinguish dialog / agent_run / machine_signal at query time
category: schema
status: open
created_at: 2026-05-07T11:00:00.000Z
evidence_sessions:
  - 08fbfe17-f1c4-41ff-a713-4bdd3c7983f1
  - 7addf7ed-f4ad-4f7d-b390-8dd82a453214
---

## Proposed Change

Add a new field `session_class` to `RegistryEntry` that classifies sessions on the **who-drove-this** dimension, orthogonal to existing fields:

- `session_kind` — _technical capture mechanism_ (main / subagent / subprocess) — unchanged
- `is_junk` — _enrichment-queue eligibility_ — unchanged
- `session_class` — _NEW: who drove the work_ (see values below)

### Type definition (in `shared/src/angeleye.ts`)

```ts
export type SessionClass = 'dialog' | 'agent_run' | 'machine_signal' | 'subagent_leg';
```

| Value            | Meaning                                                | Examples                                                                                             |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `dialog`         | Human-initiated, conversation-shaped                   | Second-brain chats, design discussions, planning sessions                                            |
| `agent_run`      | Human-initiated, autonomous after kickoff              | Ralphy campaigns, BMAD orchestrators (especially Mode-1 with Agent calls), Swagger lifecycle drivers |
| `machine_signal` | Machine-initiated, no human in the loop                | AppyCtrl T3 capability probes, Paperclip workspace heartbeats                                        |
| `subagent_leg`   | Subagent execution leg of an Agent Teams orchestration | Currently identified by `session_kind === 'subagent'`; folded in for unified filtering               |

### API default-filter behaviour

`/api/sessions` and `/api/search` filter to `session_class IN ('dialog', 'agent_run')` by default — user-driven sessions only.

Override via:

- `?session_class=<value>` — query specifically for one class
- `?include_classes=<csv>` — explicitly include additional classes (e.g. `?include_classes=machine_signal,subagent_leg` to include everything)

Backwards compatible: existing sessions without `session_class` are treated as `dialog` by default at filter time. New params are additive — clients that pass nothing see the same data they used to today, minus `machine_signal` rows once they're populated (which is the intended behaviour change).

### Population

**At ingestion** — `server/src/routes/hooks.ts` at `session_start`:

```
machine_signal detection (high-confidence, deterministic):
  - cwd matches /^.*\/\.paperclip\/instances\/.+\/workspaces\/[a-f0-9-]{36}\/?$/i
  - cwd is "undefined" or missing AND session ends within 5 sec with no user_prompt events

agent_run detection (best-effort at session_start; refined at session_end):
  - first user prompt's trigger_command matches /^\/(appydave:)?(ralphy|bmad-(pm|sm|dev|dr|sat|ux-designer|e0)|bmad-story-lifecycle)$/

Default: dialog
```

**At session_end** — refine `agent_run` based on tool-to-prompt ratio (the dominant-shape rule):

```
if user_prompt_count > 0 AND tool_use_count / user_prompt_count >= 30:
  promote to agent_run (overrides previously-set 'dialog')
```

**Backfill endpoint** — `POST /api/registry/backfill-class` (mirrors the existing `backfill-silent` pattern):

- Idempotent over the registry
- Body: `{ dry_run?: boolean }` for preview
- Applies the same detection rules retroactively to historic rows where `session_class` is undefined or stale

## Why

Three concrete pollution problems in the current corpus:

1. **AppyCtrl probes** — ~657 silent sessions/week, flagged as `is_junk: true` but still appear in subtype counts and project rollups when those don't filter on `is_junk`.
2. **Paperclip heartbeats** — 18 sessions found in the 2026-05-07 audit, all with cwd → workspace UUIDs that masquerade as project names. They have user prompts so they're not junk-flagged, but they're not user-driven work either.
3. **Future probe systems** — any new harness that runs Claude on a clock will produce indistinguishable noise unless the registry carries a class dimension that the API can filter on by default.

Plus the conceptual distinction David surfaced today: _user-driven_ covers both **dialog** (a chat with the second brain) and **agent_run** (kicking off Ralphy on AWB). These look very different at the data level — dialog is balanced prompts/responses, agent_run is 3 prompts followed by 4,000 tool calls — and queries often want to distinguish them. Example session `08fbfe17` (Ralphy on angeleye) had ~183 prompts but **4,242 events** total; a typical 60-prompt design conversation has ~150 events. Same `kind=main, is_junk=false` today; very different shape and intent.

The new field gives:

- Default queries that exclude machine signals automatically (solves the "not queryable" problem)
- Optional precision to query dialog-only or agent-run-only when shape matters
- A clean fit alongside existing `session_kind` and `is_junk` without overloading either

## Evidence

| Session                                | Class            | Why                                                                                                              |
| -------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `08fbfe17-f1c4-41ff-a713-4bdd3c7983f1` | `agent_run`      | Ralphy campaign on angeleye — 4,242 events from ~3 prompts (tool/prompt ratio ≫ 30:1)                            |
| `7addf7ed-f4ad-4f7d-b390-8dd82a453214` | `machine_signal` | Paperclip-hosted session, cwd `/Users/davidcruwys/.paperclip/instances/default/workspaces/cfcc0c4b-9da7-4efd...` |
| (any silent.session row)               | `machine_signal` | Zero user_prompt events; AppyCtrl spawn signature                                                                |
| (typical 50-prompt session)            | `dialog`         | Default; human-initiated, conversation-shaped                                                                    |

Per-class corpus estimates (after backfill):

| Class            | Estimated count | Source                                               |
| ---------------- | --------------- | ---------------------------------------------------- |
| `dialog`         | ~1,000          | Most enriched sessions                               |
| `agent_run`      | ~150            | Ralphy (74) + BMAD orchestrators (84) + similar      |
| `machine_signal` | ~1,070          | Silent sessions (1,050) + Paperclip heartbeats (~20) |
| `subagent_leg`   | ~237            | Existing `session_kind === 'subagent'` rows          |

## Acceptance Criteria

- [ ] `SessionClass` type added to `shared/src/angeleye.ts`
- [ ] `session_class?: SessionClass` added to `RegistryEntry` (optional for backwards compat)
- [ ] `hooks.ts` at `session_start` sets initial `session_class` from cwd + trigger_command rules above
- [ ] `hooks.ts` at `session_end` refines `agent_run` based on tool/prompt ratio (≥ 30:1 promotes 'dialog' → 'agent_run')
- [ ] `applySessionFilters` in `routes/sessions.ts` defaults to `session_class IN ('dialog', 'agent_run')` when neither `?session_class=` nor `?include_classes=` is set
- [ ] `?session_class=<value>` and `?include_classes=<csv>` parameters added to the filter surface
- [ ] `POST /api/registry/backfill-class` endpoint implemented (idempotent, dry-run support)
- [ ] One-shot run of backfill on the historic corpus populates ≥ 95% of rows correctly (manual spot-check on 20 random rows per class)
- [ ] Existing `/api/sessions` and `/api/search` clients without filter params see the same data minus `machine_signal` rows after backfill (the intended behaviour change — call it out in the changelog)
- [ ] `angeleye-retrieve` SKILL.md updated to mention `session_class` as a filter option (no default behaviour change — it already filtered non-user content)

## Notes

- **`harness` dimension parked**: a parallel field (`harness: 'paperclip' | 'bmad' | 'ruflo' | 'ralphy' | 'appyctrl' | 'none'`) was discussed and is conceptually orthogonal to `session_class` (e.g. a BMAD orchestrator is `harness=bmad, class=agent_run`; a Paperclip heartbeat is `harness=paperclip, class=machine_signal`). Useful but not blocking; deferred to a future requirement.
- **Edge case — dialog→agent_run mid-session**: a session that starts as dialog but pivots to autonomous work mid-way (e.g. 20 prompts of discussion, then "go run it") classifies by **dominant shape** at session_end (final tool/prompt ratio). Not the most accurate possible approach but simplest. No `initial_class` / `dominant_class` split needed unless real edge cases prove it matters.
- **`subagent_leg` overlaps with `session_kind === 'subagent'`**: both fields will be set on those sessions. The class fold-in lets a single filter exclude them without composing two query params. Future cleanup could deprecate one or the other; for now they coexist.
- **30:1 ratio is a starting heuristic** — calibrate after backfill by inspecting borderline cases. Make the threshold configurable in `server/src/config/` if it needs tuning.
- **Reframes E1 escape category**: the existing `escapes-ledger.md` E1 (UUID project / Paperclip workspace leak) becomes a `machine_signal` detection signal rather than an "escape to filter." Update the ledger when this requirement ships.
- **Related requirement**: `2026-05-07-ingestion-detect-paperclip-workspaces.md` proposed setting `session_kind: 'subprocess'` for Paperclip workspaces. This requirement supersedes that recommendation — set `session_class: 'machine_signal'` instead, leaving `session_kind: 'main'` (which is technically correct — these ARE main sessions from the hooks layer's perspective).
