# RegistryEntry Schema Audit — 2026-05-13

Audit of every field on `RegistryEntry` (`shared/src/angeleye.ts:208-303`) against (1) writers in `server/src/`, (2) readers across `server/src/` + `client/src/`, (3) actual distribution on the live corpus pulled from `http://100.82.235.39:5051` via `/api/sessions?include_classes=dialog,agent_run,subagent_leg,machine_signal&include_junk=true` (4,393 entries, full snapshot).

Workflow-related fields (`workflow_role`, `workflow_identity`, `workflow_action`, `group_ids`) are already audited in `docs/intelligence/workflow-infrastructure-research.md` — that conclusion (UI viz hack, dormant infrastructure) is taken as given here.

Field count: **56** declared on `RegistryEntry`.

---

## Section 1 — Field inventory

### A. Identity / ingestion provenance (10)

`session_id`, `project`, `project_dir`, `started_at`, `last_active`, `status`, `source`, `name`, `tags`, `workspace_id`

### B. User / curation (3)

`note`, `tags`, `name`

(`name` and `tags` straddle A & B — same fields, different purpose.)

### C. Session origin / topology (4)

`session_kind` (`main` | `subagent` | `subprocess`), `teammate_id`, `session_class` (`dialog` | `agent_run` | `machine_signal` | `subagent_leg`), `is_junk`

### D. Subtype trinity + enrichment metadata (5)

`subtype_heuristic`, `session_tags`, `session_subtype`, `enrichment_version`, `enriched_at`

### E. Core classifier outputs (4)

`session_type` (BUILD/TEST/RESEARCH/KNOWLEDGE/OPS/ORIENTATION), `tool_pattern`, `session_scale`, `first_real_prompt`, `first_edited_dir`, `pii_flags`

### F. Tier-1 predicates — boolean flags from event analysis (7)

`has_playwright_calls`, `is_compaction_resume`, `is_machine_initiated`, `has_web_research`, `has_parallel_subagent_bursts`, `has_task_orchestration`, `has_git_outcome`

### G. Tier-1 extractors (2)

`trigger_command`, `trigger_arguments`

### H. Agent-genesis predicates (2)

`has_skill_created`, `has_skill_modified`

### I. Tier-2 predicates — regex/heuristic (7)

`has_brain_file_writes`, `has_cross_session_refs`, `has_unauthorized_edits`, `has_voice_dictation_artifacts`, `has_handover_context`, `has_cross_project_reads`, `has_closing_ceremony`

### J. Domain overlay (workflow viz) — already audited (4)

`workflow_role`, `workflow_identity`, `workflow_action`, `group_ids`

→ see `workflow-infrastructure-research.md`. **Verdict carried in: viz hack, sparse (workflow_action 4.3% non-null, all BMAD).**

### K. Phase 2c classifiers — "style" dimensions (8)

`delegation_style`, `initiation_source`, `session_continuity`, `opening_style`, `closing_style`, `autonomy_ratio`, `session_liveness`, `output_type`

**Total: 56 fields** (matches type definition).

---

## Section 2 — Per-field assessment

### A. Identity / ingestion provenance

| Field                        | Writers                                        | Readers                                                             | Distribution                       | Verdict                                                                                                                         |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `session_id`                 | hooks, sync, backfill                          | everywhere                                                          | 100%                               | **keep** — PK                                                                                                                   |
| `project`                    | hooks, registry (derived from project_dir)     | DiagnosticsView, ObserverView, OrganiserView, sessions route filter | 99.6%                              | **keep** — derived but cached for cheap filter                                                                                  |
| `project_dir`                | hooks (cwd), backfill (jsonl path), workspaces | sessions route, ObserverView, backfill correlation                  | 99.6%                              | **keep** — source of truth for project derivation                                                                               |
| `started_at` / `last_active` | hooks every event                              | sorting, sessions API, time filters                                 | 100%                               | **keep**                                                                                                                        |
| `status`                     | hooks (`session_end` → `ended`), classifier    | sessions route, ObserverView, mock-views                            | active=2.6%, ended=97.4%           | **keep** — operational flag                                                                                                     |
| `source`                     | hooks (`hook`), backfill (`transcript`)        | mock-views, sessions route                                          | hook=88%, transcript=12%           | **keep** — provenance, used by mock-views                                                                                       |
| `note`                       | `POST /api/sessions/:id/note` (user only)      | ObserverView, SettingsView, CampaignInfographicView                 | 2 entries out of 4,393 (**0.05%**) | **keep but unused** — no UI to set it routinely, only one entry path. Honest free-text annotation surface but in practice dead. |

### B. Curation surface

| Field          | Writers                                                                        | Readers                                                 | Distribution                                                                                                    | Verdict                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`         | `POST /api/sessions/:id/name` (angeleye-name-session skill), hooks (null init) | many UI surfaces                                        | 4.1% (180/4,393)                                                                                                | **keep** — primary user-set label                                                                                                                                  |
| `tags`         | hooks (init `[]`), `POST /api/sessions/:id/tags`, workspace association        | OrganiserView, ObserverView, DiagnosticsView, SchemaTab | **0.1%** — only 4 unique values across entire corpus (`bmad`, `business-intelligence`, `enrichment`, `starred`) | **dormant** — defined as primary curation surface but corpus has 4 tags total. Surface exists, user never tags. Either kill or push enrichment to write tags here. |
| `workspace_id` | hooks (null init), `PATCH /api/sessions/:id/workspace`, backfill               | OrganiserView (FK), ObserverView (label lookup)         | **0.4%** — 8 unique workspace IDs, 18 sessions assigned                                                         | **dormant** — 99.6% of sessions never get assigned to a workspace. Either the UX doesn't surface this enough or the concept isn't pulling weight.                  |

### C. Session origin / topology

| Field           | Writers                                                                                           | Readers                                                            | Distribution                                                            | Verdict                                                                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_kind`  | hooks `session_start` (detectTeammate), backfill, classifier                                      | sessions route filter (`?kind=`), diagnostics, classifier branches | main=84.5%, subagent=11.0%, subprocess=4.5%                             | **keep** — foundational topology field, finally populated (was 0% before recent backfill)                                                                                                                                                                                       |
| `teammate_id`   | hooks `session_start` (teammate-detection.service)                                                | diagnostics counts, sessions read-back                             | only `team-lead` (n=482, 11.0%)                                         | **keep but degenerate** — single observed value across corpus. Could be a boolean (`is_teammate`) until a 2nd value emerges, but the open string is more forward-compatible. **Low priority dedupe with `session_kind === 'subagent'` (they have 100% overlap by definition).** |
| `session_class` | hooks `session_start` (cwd → machine_signal), `session_end` (computeSessionClass), backfill route | sessions route DEFAULT FILTER                                      | dialog=23.1%, agent_run=11.5%, subagent_leg=11.0%, machine_signal=54.4% | **keep** — newest field (added today), already the load-bearing API filter.                                                                                                                                                                                                     |
| `is_junk`       | hooks `session_end` (silent-session shortcut), classifier                                         | mock-views, sessions API, diagnostics, correlator                  | true=65.7% (2,872/4,374)                                                | **keep** — used by every read path. **But 65.7% true is a smell**: junk dominates the corpus. See "missing fields" below — likely `session_class=machine_signal` already covers most of this.                                                                                   |

### D. Subtype trinity

| Field                | Writers                                                                                                                         | Readers                                         | Distribution                                       | Verdict                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subtype_heuristic`  | classifier (line 871+, always)                                                                                                  | sync derivation, search route                   | 97.2% non-null                                     | **keep** — always-present approximation                                                                                                                              |
| `session_tags`       | enrich-subtypes skill (LLM, llm/heuristic_only/migrated provenance)                                                             | sync derivation, search, diagnostics            | 49.6% — 1,863 llm, 353 heuristic_only, 86 migrated | **keep** — source of truth for considered classification                                                                                                             |
| `session_subtype`    | sync.service (derived: tags[0].tag ?? subtype_heuristic) BUT also hooks (overrides to `meta.silent_session` for empty sessions) | every UI display, the search route, diagnostics | 99.4% non-null                                     | **keep but document the override** — see findings: 84.3% of entries have `session_subtype != subtype_heuristic` (because `meta.silent_session` overrides everywhere) |
| `enrichment_version` | enrich-subtypes (writes via POST), sessions route schema                                                                        | sessions route (filter `?enriched=true`)        | v1=1,549, v2=2                                     | **keep** — operational invalidation marker                                                                                                                           |
| `enriched_at`        | enrich-subtypes (POST)                                                                                                          | sessions route filter                           | 35.3% non-null                                     | **keep** — operational                                                                                                                                               |

### E. Core classifier outputs

| Field               | Writers                                                      | Readers                                                                                                                    | Distribution                                                                                                                                   | Verdict                                                                                                                                |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `session_type`      | classifier (and bypassed by silent-session shortcut → unset) | mock-views, ObserverView, backfill route, sync.service derivation                                                          | ORIENTATION=70.3%, BUILD=26.7%, KNOWLEDGE=1.9%, TEST=1.0%, RESEARCH=0.1%, OPS=0.02% (1 session)                                                | **keep** — but heavily skewed; RESEARCH and OPS are statistical ghosts. Worth reconsidering taxonomy.                                  |
| `tool_pattern`      | classifier                                                   | mock-views, CampaignInfographicView                                                                                        | mixed=78.6%, bash-heavy=9.8%, read-heavy=5.6%, edit-heavy=2.8%, agent-heavy=2.0%, playwright-heavy=1.0%, websearch-heavy=0.1%, task-heavy=0.1% | **keep but rebalance thresholds** — `mixed` swallows 78.6%, signal is weak. `task-heavy` and `websearch-heavy` are degenerate (<0.2%). |
| `session_scale`     | classifier                                                   | CampaignDashboardView, mock-views                                                                                          | micro=62.6%, moderate=18.4%, heavy=12.0%, light=5.2%, marathon=1.7%                                                                            | **keep** — well-distributed                                                                                                            |
| `first_real_prompt` | hooks (early capture on `user_prompt`), classifier           | ObserverView, sessions route, mock-views, search route                                                                     | 29.4% non-null                                                                                                                                 | **keep** — sparse because silent sessions have no prompt; viable for UI display                                                        |
| `first_edited_dir`  | classifier only                                              | classifier-internal only — **zero UI/route readers** (only client/src/views/SettingsView shows it in inspector debug view) | 30.3% non-null                                                                                                                                 | **keep but de-prioritise** — useful telemetry, not surfaced anywhere meaningful                                                        |
| `pii_flags`         | classifier (with regex sweep)                                | none beyond schema inspector                                                                                               | 8.9% non-null; only 4 flag types ever emitted (`generic_base64_secret`, `email`, `ipv4`, `generic_secret`)                                     | **dead-leaning** — written but no reader. If we don't ship a UI badge or block on PII, this is wasted work.                            |

### F. Tier-1 predicates (boolean event derivations)

All written by `classifier.service.ts`, all read by `CampaignInfographicView.tsx` + `CampaignDashboardView.tsx` (campaign UI), and most also read by `mock-views.service.ts`.

| Field                          | true% (of populated) | Used outside campaign UI? | Verdict                                                                                                                 |
| ------------------------------ | -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `has_playwright_calls`         | 3.7%                 | mock-views                | **keep** — clean signal                                                                                                 |
| `is_compaction_resume`         | 0.7%                 | mock-views                | **dormant** — 29 sessions across 4,393. Either compaction is rare or detection is wrong.                                |
| `is_machine_initiated`         | **71.7%**            | mock-views                | **overlapping** — 75% overlap with `session_class === 'machine_signal'`. See findings.                                  |
| `has_web_research`             | 0.9%                 | mock-views                | **dormant signal** — 39 sessions. Probably real but rare.                                                               |
| `has_parallel_subagent_bursts` | 5.7%                 | mock-views                | **keep** — meaningful Ralphy/Agent-Teams indicator                                                                      |
| `has_task_orchestration`       | 3.8%                 | mock-views                | **keep but overlapping** — likely correlates with `has_parallel_subagent_bursts` and `subtype_heuristic.build.campaign` |
| `has_git_outcome`              | 1.7%                 | mock-views                | **dormant** — 73 sessions out of 4,393. Either git outcomes are rare OR detection misses commits via Bash.              |

### G. Tier-1 extractors

| Field               | Writers                             | Readers                                                                                                                  | Distribution                                                                                                               | Verdict                                                                                                                                                                              |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trigger_command`   | classifier (line 436, `/cmd` parse) | session-class.service (orchestrator detection), correlator, mock-views, workflow-router, search, CampaignInfographicView | 13.2% non-null. Top: `appydave:bmad-story-lifecycle`(98), `bmad-sm`(81), `appydave:ralphy`(57), `focus`(46), `bmad-dr`(41) | **keep, load-bearing** — this is the live cross-tier signal (session_class promotion uses it).                                                                                       |
| `trigger_arguments` | classifier (line 449)               | correlator (story-id signal), mock-views                                                                                 | 7.9% non-null. Top: `wn`(7), `opus`(5), `sonnet`(5), `ansible`(5)                                                          | **keep but rename** — name suggests structured args but it's just "first line after the slash command, max 50 chars". Used for both BMAD story IDs and model names. Naming is a lie. |

### H. Agent-genesis predicates

| Field                | true%           | Verdict                                                                          |
| -------------------- | --------------- | -------------------------------------------------------------------------------- |
| `has_skill_created`  | 0.2% (9/4,300)  | **dormant** — 9 sessions. Useful future signal, but currently statistical noise. |
| `has_skill_modified` | 0.3% (11/4,300) | **dormant** — 11 sessions. Same.                                                 |

### I. Tier-2 predicates (regex/heuristic)

| Field                           | true% | Readers outside CampaignViews? | Verdict                                                                                                                                                        |
| ------------------------------- | ----- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `has_brain_file_writes`         | 0.4%  | none                           | **dormant** — 18 sessions.                                                                                                                                     |
| `has_cross_session_refs`        | 5.7%  | none                           | **keep** — meaningful continuity signal                                                                                                                        |
| `has_unauthorized_edits`        | 1.4%  | none                           | **dormant** — 59 sessions. Defined but no surface lights up on it.                                                                                             |
| `has_voice_dictation_artifacts` | 14.2% | none                           | **keep** — distinctive enough                                                                                                                                  |
| `has_handover_context`          | 7.1%  | none                           | **keep but overlaps** — correlates strongly with `session_continuity === 'handover_paste'` and `opening_style === 'paste_handover'`. Three fields, one signal. |
| `has_cross_project_reads`       | 2.8%  | correlator                     | **keep** — used by correlator signalCrossProjectAccess                                                                                                         |
| `has_closing_ceremony`          | 1.9%  | none                           | **dormant-leaning** — 80 sessions. Mostly redundant with `closing_style` enum.                                                                                 |

### J. Domain overlay (workflow viz)

Inherited verdict from `workflow-infrastructure-research.md`:

| Field               | Distribution                                                                                                 | Verdict                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `workflow_role`     | 5.9% non-null, 7 values (planner=85, reviewer=41, builder=36, advisor=33, observer=29, tester=29, shipper=8) | **viz-only**, 100% BMAD                                                                                              |
| `workflow_identity` | 4.9% non-null (Bob=81, Nate=41, Amelia=36, Taylor=29, Lisa=26 …)                                             | **viz-only**, 100% BMAD                                                                                              |
| `workflow_action`   | 4.3% non-null — top values are unstructured (`wn`, `DR 5.4`, `CS 5.1`)                                       | **viz-only, naming-misleading** (it's just `trigger_arguments` passed through, no validation)                        |
| `group_ids`         | 2.0% non-null (88/4,393)                                                                                     | **batch-only**, requires manual `POST /api/affinity-groups/correlate` — `affinity-groups.json` doesn't exist on disk |

### K. Phase 2c classifiers — "style" dimensions

| Field                | Distribution                                                                                                                                                                                          | Verdict                                                                                                                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delegation_style`   | conversational=71%, autonomous=11%, orchestrated=10%, directive=9%                                                                                                                                    | **keep** — balanced                                                                                                                                                                                                                                                            |
| `initiation_source`  | agent_dispatched=72%, skill_invoked=12%, voice_dictated=8%, user_typed=7%, handover_paste=2%                                                                                                          | **keep but overlapping** with `opening_style` (next row)                                                                                                                                                                                                                       |
| `session_continuity` | fresh=77%, skill_launcher=13%, handover_paste=7%, recall=2%, compaction=0.7%                                                                                                                          | **keep**                                                                                                                                                                                                                                                                       |
| `opening_style`      | agent_initiated=72%, skill_invocation=12%, paste_handover=5%, unknown=4%, typed_question=3%, context_dump=2%, typed_instruction=2%, code_paste=0.2%, voice_dictation=0%, continuation=0%, greeting=0% | **overlapping** — top 2 (agent_initiated, skill_invocation) are 84% of the field; they're identical signals to `initiation_source`'s top 2 (agent_dispatched=72%, skill_invoked=12%). The lower buckets (`voice_dictation`, `continuation`, `greeting`) **are never written**. |
| `closing_style`      | abrupt_abandon=90%, summary_close=5%, natural_completion=4%, q&a=0.4%, task_handoff=0.3%, commit_only=0.3%, commit_push=0.3%, error_bail=0.05%                                                        | **degenerate** — abrupt_abandon dominates. The 7 other values share <10%.                                                                                                                                                                                                      |
| `autonomy_ratio`     | 0–1 numeric. Bimodal: 60% at 0.0, 30% at 0.8–1.0, almost nothing in between                                                                                                                           | **keep but understand bimodality** — this is really a categorical (human vs agent) trying to be a continuous.                                                                                                                                                                  |
| `session_liveness`   | medium=68%, low=24%, high=8%                                                                                                                                                                          | **keep** — usable distribution but unsure what action it drives                                                                                                                                                                                                                |
| `output_type`        | conversation_only=69%, new_artifacts=22%, knowledge_synthesis=5%, mixed=2%, code_changes=0.6%                                                                                                         | **keep but `code_changes` is degenerate** — 27 sessions out of 4,291.                                                                                                                                                                                                          |

---

## Section 3 — Findings

### Dead fields (defined but no live readers beyond debug/inspector)

1. **`note`** — 2 entries set. UI surface exists (SettingsView) but it's a free-text afterthought.
2. **`pii_flags`** — written by classifier on every session (8.9% have flags), but no reader: no UI badge, no router, no filter. Pure telemetry-by-accident.
3. **`first_edited_dir`** — 30% populated, only readers are the inspector debug tab. Useful raw data, no consumer.
4. **`has_brain_file_writes`** (0.4%), **`has_unauthorized_edits`** (1.4%), **`has_skill_created/modified`** (0.2–0.3%), **`has_closing_ceremony`** (1.9%) — only readers are the Campaign UI views, which are themselves the "viz hack" layer per the workflow research doc.

### Dormant fields (always null/false/single-value)

1. **`tags`** — 4 unique values across 4,393 sessions. Curation surface that's not used.
2. **`workspace_id`** — 0.4% non-null, 8 workspaces, 18 assignments. The workspace concept is dormant.
3. **`teammate_id`** — only one observed value (`team-lead`). Functionally a boolean today.
4. **`has_git_outcome`** — 1.7%; either detection is too narrow (misses Bash-driven git) or git outcomes are rare.
5. **`is_compaction_resume`** — 0.7%, suspiciously low.

### Overlapping pairs / redundant signals

1. **`is_machine_initiated` ↔ `session_class === 'machine_signal'`** — 2,333 sessions have both true, 749 have only `is_machine_initiated`, 44 have only `session_class=machine_signal`. ~75% overlap. The newer `session_class` makes the older `is_machine_initiated` largely redundant. **The 749 disagreements would be worth a one-off audit — they likely point at the gap between the two detectors.**

2. **`subtype_heuristic` ↔ `session_subtype`** — disagree on **84.3% of populated entries**. Why? Hooks force `session_subtype: 'meta.silent_session'` for sessions with no user prompt, while classifier independently writes a `subtype_heuristic` (often `meta.scheduled_probe` or whatever the rules suggested). Both are correct in different senses, but the docstring at line 230-232 of the schema is **wrong** — it says `session_subtype` equals `session_tags[0].tag` OR `subtype_heuristic`. In reality `session_subtype` can override both with `meta.silent_session`, and the sync.service `deriveSessionSubtype` doesn't know about that override. Documentation drift.

3. **`session_subtype` ↔ `session_tags[0].tag`** — disagree on 494 of 2,178 sessions where both exist (22.7%). Same root cause: silent-session override fires after tags are written.

4. **`initiation_source` ↔ `opening_style`** — top 2 buckets of each are identical signals: `agent_dispatched`/`agent_initiated` (72%), `skill_invoked`/`skill_invocation` (12%). The remaining lower-frequency buckets of `opening_style` (`voice_dictation`, `continuation`, `greeting`, `code_paste`) are 0–0.2% — most are never emitted. This is two fields representing one decision.

5. **`has_handover_context` ↔ `session_continuity === 'handover_paste'` ↔ `opening_style === 'paste_handover'` ↔ `initiation_source === 'handover_paste'`** — four predicates for "this session opened with a handover paste."

6. **`subtype_heuristic ∋ {build.bmad_orchestrator, build.bmad_agent, build.ruflo_orchestrator, build.ralphy_campaign}` ↔ `trigger_command` matching same patterns ↔ `workflow_role/identity/action`** — the classifier already names these frameworks via subtypes; `trigger_command` re-captures it; `workflow_role/identity/action` re-derives it via overlay. Three representations of the same fact, one of which (workflow\_\*) is acknowledged as a viz hack.

7. **`name` ↔ no schema link to JSONL `custom-title`** — `name` is the user-set label, but the brain docs note the JSONL stores `custom-title` and `agent-name`. The registry doesn't track which is which. Not strictly a duplication but a missing distinction.

### Normalisation candidates

1. **`has_*` predicates → `predicates: Record<string, boolean>`** — 16 boolean predicates spread across Tier-1, Agent-genesis, and Tier-2 sections. The shape is screaming for a map. Adding a new predicate today requires touching the type and every read site; with a map, classifier writes one key, readers query by name, and rarely-true predicates don't bloat the entry shape.

2. **Phase 2c style fields → `style: { delegation, initiation, continuity, opening, closing, autonomy_ratio, liveness, output_type }`** — these 8 fields are 100% co-written by classifier on every successful classification (98.5–98.7% co-occurrence on populated entries). They're a unit. Nesting them surfaces the concept and removes 7 shallow fields from `RegistryEntry`.

3. **Workflow factory triple → `overlay?: { domain, role, identity, action } | null`** — `workflow_role`, `workflow_identity`, `workflow_action` are always co-written from `OverlayResult` and always co-null on non-BMAD sessions (95.7% null). Pack them into one optional field, lose three top-level slots.

4. **Subtype trinity → `subtype: { effective, heuristic, tags: SessionTag[] | null, enriched_at, enrichment_version }`** — the four+ subtype-related fields belong together; the API and UI almost always read them as a unit.

5. **Topology fields → `topology: { kind, teammate_id, class, is_junk }`** — `session_kind`, `teammate_id`, `session_class`, `is_junk` are the "who ran this and is it noise" cluster. They drive every default filter.

6. **`trigger_command` + `trigger_arguments` → `trigger: { command, arguments_raw } | null`** — naturally paired, always co-null when there's no slash command, and `trigger_arguments` is misleadingly named (it's a raw passthrough). Re-naming would also be an opportunity to actually parse arguments into structured form (BMAD story ID, model name, etc.).

### Missing fields (signals visible in data, not captured)

1. **No `event_count` / `tool_count` / `prompt_count`** — `computeSessionClass` recounts events from the JSONL on every call. These are cheap aggregates worth caching on the entry, especially given the existing `session_scale` is just a coarse bucket.

2. **No `duration_ms`** — derivable from `started_at` / `last_active`, but every UI computes it. Cache it.

3. **No `git_commits` count / `commit_shas[]`** — `has_git_outcome` is a boolean but the natural follow-on question ("which commits?") has no field. Same for "which files were edited?" (`first_edited_dir` is a tease).

4. **No `workflow_framework`** — the classifier knows whether a session is BMAD, RuFlo, or Ralphy (via `subtype_heuristic`) but there's no clean field to filter on. The `workflow_role/identity/action` triple only reflects BMAD because that's the only overlay. A `framework: 'bmad' | 'ruflo' | 'ralphy' | null` field would let queries cleanly say "show me all Ralphy runs" without parsing subtypes.

5. **No `phase` / `lifecycle_position`** — the BMAD-phase question from `workflow-infrastructure-research.md` is structurally invisible. `current_station` lives on `WorkflowInstance` (which doesn't exist on disk), not on `RegistryEntry`. A session has no concept of "what phase of BMAD am I in".

6. **No `parent_session_id` for subagents** — `session_kind === 'subagent'` and `teammate_id` are set, but the parent session that spawned the subagent is not linked. Cross-referencing requires JSONL parsing.

7. **No `last_seen_event_ts` separate from `last_active`** — useful for detecting still-running vs gracefully-ended sessions, but currently conflated.

8. **No `model` field** — `trigger_arguments` sometimes contains `opus` or `sonnet`, but model usage isn't captured first-class. Would be useful for cost / capability analysis.

---

## Section 4 — Recommendations

### HIGH (clear cuts / clear bugs)

1. **Fix or rewrite the docstring at `shared/src/angeleye.ts:230-232`.** It claims `session_subtype = session_tags[0].tag ?? subtype_heuristic`. In reality 84% of corpus disagrees because of the silent-session override at `hooks.ts:266`. Either document the override or move it into `deriveSessionSubtype`.

2. **Cut `is_machine_initiated`.** 75% overlap with `session_class === 'machine_signal'`. The newer field subsumes it. Investigate the 749 disagreements first to make sure no signal is lost, then deprecate. Reading code at `CampaignInfographicView.tsx` and `mock-views.service.ts` would shift to read `session_class`.

3. **Cut `pii_flags` or wire it to something.** Either expose it (UI badge + filter) or stop writing it — 391 sessions have flags and zero consumers.

4. **Cut/move `has_skill_created`, `has_skill_modified`, `has_brain_file_writes`, `has_unauthorized_edits`, `has_closing_ceremony`, `has_git_outcome`, `is_compaction_resume`** — all <2% true, no readers outside the campaign UI viz layer. If kept, they should become tags on the map proposed below; their cost as top-level boolean fields outweighs their occasional signal value.

5. **Cut legacy SessionSubtype union members.** `playwright_e2e`, `skill.development`, `skill.creation`, `knowledge.brain_creation`, `orientation.artifact_retrieval`, `operations.poem_execution` — corpus shows 44 entries still have these as `subtype_heuristic` (so the classifier still produces them!). Either back-rewrite or admit they're current.

6. **Cut or fix `tags` field semantics.** 4 distinct values across 4,393 sessions = unused. Either remove from the schema or have enrichment populate it (e.g. with framework names) to make it useful.

### MEDIUM (normalisation — same info, cleaner shape)

7. **Collapse all 16 `has_*` predicates into `predicates: Record<string, boolean>`.** Single field, extensible without schema changes, no nulls cluttering sparse entries.

8. **Collapse the 8 Phase 2c style fields into `style: { ... }`.** They co-write 98%, they co-read everywhere, they are conceptually a unit ("how was this session driven").

9. **Collapse the workflow triple into `overlay: OverlayResult | null`.** It's literally `OverlayResult` already (`shared/src/angeleye.ts:329`); just store the object.

10. **Collapse the subtype trinity (+ enrichment metadata) into `subtype: { effective, heuristic, tags, version, enriched_at }`.** Same readers, same write path, natural unit.

11. **Collapse `trigger_command` + `trigger_arguments` into `trigger: { command, raw_args }` and rename `raw_args` to something honest** (it's not parsed args, it's raw passthrough). Optional: add a parsed `story_id` / `model` extractor on top.

12. **De-overlap `opening_style` and `initiation_source`.** Pick one; the duplication isn't earning its keep. The `opening_style` enum has 6 values that are effectively never written (`voice_dictation` 0%, `continuation` 0%, `greeting` 0%, `code_paste` 0.2%).

13. **Drop the empty variants of enum types** — `StationState: skipped`, `StationState: backtracked`, `AffinityGroupType: epic_sprint`, `AffinityGroupType: project_phase`, `AffinityConfidence: inferred` (per workflow-infrastructure-research.md), plus the unused `opening_style` and `closing_style` variants. Lying-by-availability.

### LOW (cosmetic / future)

14. **Add cheap aggregates: `event_count`, `tool_count`, `prompt_count`, `duration_ms`.** Every reader computes them; cache once at classify time.

15. **Add `framework: 'bmad' | 'ruflo' | 'ralphy' | null`** as a clean top-level filter, derived from `subtype_heuristic`. Stops UI/clients from regexing subtypes.

16. **Add `parent_session_id?: string`** when `session_kind === 'subagent'`. Currently the relationship is invisible.

17. **Rename `note` to `user_note`** for clarity vs. enrichment notes.

18. **Reconsider `session_type` taxonomy.** RESEARCH (0.1%) and OPS (0.02%, n=1) are degenerate. Either fix detection or collapse them.

19. **`tool_pattern` thresholds.** `mixed` swallows 78.6% — re-calibrate, or accept and add a `tool_mix: Record<string, number>` for the actual percentages.

20. **Document why `closing_style === 'abrupt_abandon'` is 90%** — is that a detector flaw (Claude Code sessions just don't end gracefully?), or is the world really that messy? If the former, the field is broken; if the latter, the field carries almost no information.
