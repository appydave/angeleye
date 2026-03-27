# Enrichment Pipeline — Gap Analysis

**Generated**: 2026-03-27
**Method**: Systematic comparison of all documentation in `docs/planning/enrichment-pipeline/`, `docs/planning/workflow-orchestration/`, and `docs/intelligence/PATTERNS.md` against the actual server, shared, and client source code.

---

## 1. Executive Summary

**The documented system envisions 58 enrichment items (30 predicates, 17 classifiers, 7 observations, 4 extractors) plus affinity groups and domain overlays. The actual codebase implements approximately 6-8 of these items, all deterministic (Tier 1/2).**

| Category                     | Documented   | Implemented            | Coverage |
| ---------------------------- | ------------ | ---------------------- | -------- |
| Predicates (P01-P35)         | 30           | 2 (P23, P24)           | **7%**   |
| Classifiers (C01-C22)        | 17           | 4 (C01, C02, C05, C06) | **24%**  |
| Observations (O02-O08)       | 7            | 0                      | **0%**   |
| Extractors (E01-E04)         | 4            | 0                      | **0%**   |
| Domain Overlays (C14-C16)    | 3            | 0                      | **0%**   |
| Affinity Groups              | 1 collection | 0                      | **0%**   |
| Agent Genesis (P31-P35, C22) | 6            | 0                      | **0%**   |

**Overall**: ~6 of 58 documented enrichment items are implemented (~10%). The core pipeline architecture (JSONL -> backfill -> classify -> registry) is solid and production-ready. The gap is almost entirely in the enrichment breadth — the classifier does a handful of things well, but the vast majority of documented intelligence remains unbuilt.

**What IS built and working well**:

- Hook ingestion pipeline (all 24 Claude Code events)
- Transcript backfill from JSONL files
- Session registry with CRUD operations
- Workspace management
- Real-time WebSocket event streaming
- Schema auditor for hook payload validation
- Voice dictation dictionary
- Junk detection (5 rules)
- Session type classification (6 types, scale-aware with iron-clad rules)
- Tool pattern detection (8 patterns)
- PII flag detection (11 patterns)
- First real prompt extraction
- First edited directory extraction
- Session naming write-back to Claude Code JSONL

---

## 2. Predicate/Classifier Matrix

### Predicates

| ID      | Name                            | Doc Status             | Code Status     | Notes                                                                                                                                                                                                                                                                                                    |
| ------- | ------------------------------- | ---------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P01** | is_feature_construction         | Specified (Tier 3 LLM) | **None**        | Requires LLM — no infrastructure for LLM calls exists                                                                                                                                                                                                                                                    |
| **P02** | has_frustration_signals         | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P03** | is_multi_phase                  | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P04** | has_brain_file_writes           | Specified (Tier 2)     | **None**        | Easy win — Edit/Write paths containing `/brains/`                                                                                                                                                                                                                                                        |
| **P05** | has_playwright_calls            | Specified (Tier 1)     | **Partial**     | Tool pattern detection counts playwright calls but does not expose as a standalone boolean predicate. The `detectToolPattern()` function checks `playwright / total > 0.4` but P05 asks "any playwright at all". The signal exists in the code but not as a named predicate field on the registry entry. |
| **P06** | has_cross_session_refs          | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P07** | has_skill_gap_signal            | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P08** | has_unauthorized_edits          | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P09** | is_compaction_resume            | Specified (Tier 1)     | **None**        | Easy win — check for `compact`/`context_compaction` events. New hook events `pre_compact` and `post_compact` could support this.                                                                                                                                                                         |
| **P10** | is_cwd_incidental               | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P11** | has_voice_dictation_artifacts   | Specified (Tier 2)     | **None**        | Voice dictionary exists (`voice-dictionary.ts`) but is not wired into classification. No regex check on prompts for dictation artifacts.                                                                                                                                                                 |
| **P12** | is_machine_initiated            | Specified (Tier 1)     | **None**        | Easy win — check if first event is NOT `user_prompt`                                                                                                                                                                                                                                                     |
| **P13** | misunderstood_request           | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P14** | wrong_approach                  | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P15** | buggy_output                    | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P16** | excessive_changes               | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P17** | has_handover_context            | Specified (Tier 2)     | **Partial**     | `findFirstRealPrompt()` already skips handover patterns ("This session is being continued", `<task-notification`, "Session Context:") — the detection logic exists but is used for filtering, not stored as a boolean predicate.                                                                         |
| **P18** | has_cross_project_reads         | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P19** | has_web_research                | Specified (Tier 1)     | **Partial**     | `detectToolPattern()` counts WebFetch/brave-search but only as part of tool_pattern ratio. Not exposed as boolean.                                                                                                                                                                                       |
| **P20** | has_parallel_subagent_bursts    | Specified (Tier 1)     | **None**        | Subagent events are captured (subagent_start/stop) but no burst detection logic.                                                                                                                                                                                                                         |
| **P21** | has_task_orchestration          | Specified (Tier 1)     | **Partial**     | Task tools are counted in `detectToolPattern()` but not exposed as standalone boolean.                                                                                                                                                                                                                   |
| **P22** | has_git_outcome                 | Specified (Tier 1)     | **None**        | Not checked. Bash tool_input content (which contains command text) is summarised in hooks but `tool_summary.command` is truncated to 300 chars.                                                                                                                                                          |
| **P23** | is_paperclip_agent              | Specified (Tier 1)     | **Implemented** | `detectIsPaperclipAgent()` at `classifier.service.ts:139`. Regex: `/^You are agent\s+[0-9a-f-]{36}/i`. Used in `detectSessionType()` to route to OPS.                                                                                                                                                    |
| **P24** | has_pii_content                 | Specified (Tier 2)     | **Implemented** | `detectPiiFlags()` at `classifier.service.ts:277`. 11 regex patterns. Returns array of flag names. However, `pii_flags` field is NOT on the shared `RegistryEntry` type — it is only on `ClassificationResult` and gets spread into the registry via `updateRegistry()`.                                 |
| **P25** | has_closing_ceremony            | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P31** | has_agent_definition_created    | Specified (Tier 2)     | **None**        | Agent Genesis — not yet started                                                                                                                                                                                                                                                                          |
| **P32** | has_agent_definition_modified   | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P33** | has_workflow_definition_changed | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P34** | has_skill_created               | Specified (Tier 1)     | **None**        |                                                                                                                                                                                                                                                                                                          |
| **P35** | has_skill_modified              | Specified (Tier 1)     | **None**        |                                                                                                                                                                                                                                                                                                          |

### Classifiers

| ID      | Name                  | Doc Status             | Code Status     | Notes                                                                                                                                                                                                                                                                                                                       |
| ------- | --------------------- | ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C01** | session_type          | Specified (Tier 2)     | **Implemented** | `detectSessionType()` at `classifier.service.ts:147`. Returns 6 values (BUILD/TEST/RESEARCH/KNOWLEDGE/OPS/ORIENTATION). Includes scale-aware BUILD guard (B038) and iron-clad rules (B039, B041). Docs mention 12+ types (adds META, SYSOPS, PLANNING, MIXED, SKILL, SETUP, unknown) but code only produces the original 6. |
| **C02** | session_scale         | Specified (Tier 1)     | **Implemented** | `detectSessionScale()` at `classifier.service.ts:124`. Five buckets: micro/light/moderate/heavy/marathon. Thresholds match docs exactly. However, the scale value is used internally by `detectSessionType()` but is NOT stored as a separate field on `RegistryEntry`.                                                     |
| **C03** | opening_style         | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C04** | closing_style         | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C05** | tool_profile          | Specified (Tier 1)     | **Implemented** | `detectToolPattern()` at `classifier.service.ts:66`. 8 patterns. Stored as `tool_pattern` on registry.                                                                                                                                                                                                                      |
| **C06** | project_attribution   | Specified (Tier 1)     | **Implemented** | Derived from `project_dir` last path segment. Stored as `project` on registry.                                                                                                                                                                                                                                              |
| **C07** | session_subtype       | Specified (Tier 3 LLM) | **Type only**   | `SessionSubtype` union type exists in `shared/src/angeleye.ts:64` with 25 values. Field exists on `ClassificationResult` and `RegistryEntry`. NO detection logic — test explicitly confirms `session_subtype` is always undefined.                                                                                          |
| **C08** | delegation_style      | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C09** | session_continuity    | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C10** | output_type           | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C11** | initiation_source     | Specified (Tier 2)     | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C12** | prompt_verbosity      | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C13** | session_lifecycle     | Specified (Tier 3 LLM) | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C14** | workflow_role         | Specified (Tier 2)     | **None**        | Domain Overlay — not yet started                                                                                                                                                                                                                                                                                            |
| **C15** | workflow_identity     | Specified (Tier 1)     | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C16** | workflow_action       | Specified (Tier 1)     | **None**        |                                                                                                                                                                                                                                                                                                                             |
| **C22** | infrastructure_impact | Specified (Tier 2)     | **None**        | Agent Genesis meta-classifier                                                                                                                                                                                                                                                                                               |

### Observations

| ID      | Name                 | Doc Status             | Code Status | Notes                                       |
| ------- | -------------------- | ---------------------- | ----------- | ------------------------------------------- |
| **O02** | frustration_analysis | Specified (Tier 3 LLM) | **None**    | All observations require LLM                |
| **O03** | phase_breakdown      | Specified (Tier 3 LLM) | **None**    |                                             |
| **O04** | skill_gap            | Specified (Tier 3 LLM) | **None**    |                                             |
| **O05** | session_chain        | Specified (Tier 3 LLM) | **None**    |                                             |
| **O06** | autonomy_profile     | Specified (Tier 3 LLM) | **None**    | Partially automatable (tool/prompt ratio)   |
| **O07** | machine_character    | Specified (Tier 3 LLM) | **None**    |                                             |
| **O08** | tool_diversity_index | Specified (Tier 3 LLM) | **None**    | Partially automatable (distinct tool count) |

---

## 3. Pipeline Architecture Gaps

### Documented Flow vs Actual Flow

**Documented** (from `data-architecture.md` and `execution-paths.md`):

```
Claude Code JSONL → backfill → classify (Tier 1+2) → registry
                                   ↓ (future)
                              Tier 3 LLM enrichment → session-index.jsonl
```

**Actual** (from code):

```
Hook events → writeEvent() → session JSONL → on stop/end: classifySession() → registry
Backfill → scan ~/.claude/projects/ → transcriptToEvents() → classifySession() → registry
Sync = backfill + classify unclassified sessions
```

**Architecture alignment**: The core pipeline matches the documented flow well. The backfill-then-classify pattern is implemented exactly as described.

**Key gaps**:

1. **No Tier 3 pipeline exists at all** — no LLM call infrastructure, no enrichment queue, no batch processing
2. **No session-index.jsonl integration** — the session index (924 entries, v3 schema) lives in `~/dev/ad/brains/angeleye/analysis/` and is never read or written by the app. The registry and the session index are completely separate stores with no code bridge.
3. **No reprocessing capability** — `POST /api/backfill/classify?force=true` can re-classify all sessions, but only with the same Tier 1/2 logic. There is no way to selectively re-enrich or upgrade sessions.
4. **Classification runs on hook events only** — on `stop` and `session_end` events. During backfill, events are extracted from transcripts but classified identically.

### Services in Code but Not in Docs

| Service                     | File                   | What it does                                                                          | Documented?                                           |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `schema-auditor.service.ts` | `server/src/services/` | Validates hook payload schemas, logs surprises to `audit/hook-schema-surprises.jsonl` | Not mentioned in enrichment docs                      |
| `voice-dictionary.ts`       | `server/src/services/` | 35 voice dictation correction patterns                                                | Mentioned tangentially (P11) but not as a service     |
| `workspace.service.ts`      | `server/src/services/` | CRUD for workspace entries                                                            | Mentioned as existing feature, not part of enrichment |

### Documented Services That Don't Exist in Code

| Service                | Documented in                          | Status                                                   |
| ---------------------- | -------------------------------------- | -------------------------------------------------------- |
| Extractor service      | `pipeline-extension-plan.md` Section 3 | Not started — no extractor code exists                   |
| Domain overlay loader  | `pipeline-extension-plan.md` Section 4 | Not started — no overlay config or loader                |
| Affinity correlator    | `pipeline-extension-plan.md` Section 5 | Not started — no cross-session correlation               |
| LLM enrichment service | `execution-paths.md` all 3 paths       | Not started — no API client code                         |
| Campaign status tool   | `execution-paths.md`                   | Exists as Python script in docs, not integrated into app |

---

## 4. Data Model Gaps

### Fields in Docs but Not in Code (RegistryEntry)

| Field                              | Documented in                         | Status                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pii_flags: string[]`              | `data-architecture.md`, `PATTERNS.md` | **Computed but not typed** — `detectPiiFlags()` returns `string[]` and gets spread into registry via `ClassificationResult`, but `pii_flags` is NOT defined on the shared `RegistryEntry` type in `angeleye.ts`. Works at runtime due to JS spread but TypeScript doesn't know about it. |
| `session_scale`                    | `predicate-tier-reference.md` (C02)   | **Computed but not stored** — `detectSessionScale()` is called inside `detectSessionType()` but the scale value is not written to the registry as a field.                                                                                                                               |
| All predicates (P01-P25)           | `PATTERNS.md` schema                  | **Not on RegistryEntry** — predicates exist only in the session-index.jsonl (brain analysis data), not in the app's registry data model.                                                                                                                                                 |
| All classifiers except C01/C05/C06 | `PATTERNS.md` schema                  | Same — not on RegistryEntry                                                                                                                                                                                                                                                              |
| All observations (O02-O08)         | `PATTERNS.md` schema                  | Same                                                                                                                                                                                                                                                                                     |
| `extractors` block                 | `pipeline-extension-plan.md`          | Planned for v4 schema — not yet defined anywhere in code                                                                                                                                                                                                                                 |
| `group_ids: string[]`              | `pipeline-extension-plan.md`          | Planned for v4 schema — not yet defined                                                                                                                                                                                                                                                  |
| `_window_hints`                    | `pipeline-extension-plan.md`          | Planned for v4 schema — not yet defined                                                                                                                                                                                                                                                  |

### Fields in Code but Not in Docs

| Field                             | Location                             | Notes                                                                                                           |
| --------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `note: string \| null`            | `RegistryEntry` in `angeleye.ts:122` | Free-text annotation, set by user. Not mentioned in `data-architecture.md` or `PATTERNS.md`.                    |
| `is_junk: boolean`                | `RegistryEntry` in `angeleye.ts:124` | Documented in PATTERNS.md but not in `data-architecture.md` registry field list.                                |
| `session_subtype: SessionSubtype` | `RegistryEntry` in `angeleye.ts:126` | Type exists with 25 values but no detection logic. Not mentioned as a registry field in `data-architecture.md`. |

### RegistryEntry vs SessionIndexEntry Divergence

The codebase has one data model (`RegistryEntry` in `shared/src/angeleye.ts`) while the documentation describes two (`RegistryEntry` in `data-architecture.md` and `SessionIndexEntry` in `PATTERNS.md`). These are completely separate schemas:

- **RegistryEntry (code)**: 14 fields — identity, metadata, classification (type, subtype, tool_pattern, first_edited_dir, first_real_prompt)
- **SessionIndexEntry (docs only)**: 50+ fields — everything in RegistryEntry PLUS 25 predicates, 13 classifiers, 7 observations, shape metrics, derived metrics, pass metadata, human overrides

There is no code that reads or writes `SessionIndexEntry`. The session index exists only as a JSONL file in the brain directory, created by the analysis campaign (external to this app).

---

## 5. New Extension Readiness

### Extension 1: Extractors (E01-E04)

**Existing infrastructure that supports it**:

- Hook events capture `tool_name`, `tool_input` (summarised), and `prompt` text — enough for E01/E02
- `findFirstRealPrompt()` already parses opening prompts — similar pattern needed for E01
- `summariseTool()` in hooks router captures Bash commands (truncated to 300 chars) — could detect git commits for E03
- Event writing and registry update patterns are well-established

**What's completely missing**:

- No extractor concept in code (no types, no functions, no storage)
- No closing-window analysis — all current detection is full-session or opening-only
- No LLM call infrastructure for E04 (final_state)
- No `extractors` field on RegistryEntry

**Estimated complexity**: **Small** for E01-E03 (Tier 1/2 — pattern matching on existing data), **Medium** for E04 (requires LLM infrastructure)

### Extension 2: Domain Overlays (C14-C16)

**Existing infrastructure that supports it**:

- `project_dir` is stored on every registry entry — needed for overlay matching
- `first_real_prompt` extraction exists — could be extended for trigger command detection
- JSON file read/write patterns established (registry.json, workspaces.json)

**What's completely missing**:

- No overlay JSON schema or loader
- No `data/overlays/` directory or config
- No concept of "trigger command" extraction (prerequisite: E01)
- No workflow role, identity, or action fields on RegistryEntry
- C14-C16 depend on E01/E02 — must build extractors first

**Estimated complexity**: **Medium** — overlay format is simple JSON, but the matcher logic, fallback heuristics for C14, and Settings UI integration add up

### Extension 3: Affinity Groups

**Existing infrastructure that supports it**:

- Session registry keyed by ID — can be cross-referenced
- Timestamps on every session — supports temporal clustering
- `project_dir` stored — supports cross-project correlation
- File read/write patterns established for new collections

**What's completely missing**:

- No `affinity-groups.json` collection
- No `AffinityGroup` type definition
- No `group_ids` field on sessions
- No correlator pipeline
- No cross-session analysis of any kind — every piece of current classification is single-session
- Depends on E01/E02 for story ID grouping (Signal 1) and C14-C16 for command chain detection (Signal 6)

**Estimated complexity**: **Large** — 7 signal sources, merge logic, new data collection, UI for browsing groups, and multiple dependencies on earlier extensions

### Extension 4: Agent Genesis (P31-P35, C22)

**Existing infrastructure that supports it**:

- `tool_use` events capture `tool_name` — can distinguish Write vs Edit
- `tool_summary` captures `file` path for Write/Edit/Read tools — can glob-match against agent/skill paths
- Hook events for `file_changed` exist (Wave 11) — could detect skill file mutations in real-time

**What's completely missing**:

- No genesis predicate functions
- No configurable path patterns
- No C22 rollup classifier
- No P31-P35 fields on RegistryEntry

**Estimated complexity**: **Small** — pure file path glob matching on existing tool event data. The patterns are well-defined in the plan.

---

## 6. Undocumented Code

Features/services that exist in code but are not mentioned in any enrichment pipeline or planning document:

| Feature                     | Location                                        | What it does                                                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema auditor service**  | `server/src/services/schema-auditor.service.ts` | Validates every hook payload against expected schemas for all 24 events. Logs "surprises" (unexpected/missing fields, type mismatches) to `~/.claude/angeleye/audit/hook-schema-surprises.jsonl`. Comprehensive schema expectations for all events. |
| **Voice dictionary**        | `server/src/services/voice-dictionary.ts`       | 35 regex patterns mapping voice dictation misheard terms to correct forms (e.g., "Angel Lie" -> "AngelEye", "convects" -> "Convex"). `normalizeVoiceText()` exported but NOT called from any other file — orphaned code.                            |
| **Session archiving**       | `sessions.service.ts:63`                        | `archiveSession()` moves session JSONL from `sessions/` to `archive/` on session_end. Not documented in enrichment docs.                                                                                                                            |
| **Startup backfill**        | `index.ts:160`                                  | On server start, automatically runs `backfillTranscripts()` to catch up on sessions missed while server was down.                                                                                                                                   |
| **Port cleanup**            | `index.ts:128`                                  | `cleanupPort()` kills existing processes on the port before starting.                                                                                                                                                                               |
| **Mockup static serving**   | `index.ts:72`                                   | `app.use('/mockups', express.static(monorepoRoot))` serves HTML mockup files from the repo root.                                                                                                                                                    |
| **Session name write-back** | `sessions.service.ts:36`                        | `writeSessionName()` appends `custom-title` and `agent-name` entries to Claude Code's own JSONL files, enabling `claude --resume "name"`.                                                                                                           |
| **Stop hook guard**         | `hooks.ts:67`                                   | Prevents infinite loops by checking `stop_hook_active === true` and returning immediately.                                                                                                                                                          |
| **Wave 11 payload bucket**  | `hooks.ts:144-173`                              | New events (beyond original 7) store raw payload with large-field truncation. Undocumented in enrichment docs.                                                                                                                                      |

---

## 7. API Surface Inventory

### Implemented Endpoints

| Endpoint                   | Method | Route File      | Implementation                                                       | Documented?                          |
| -------------------------- | ------ | --------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `/health`                  | GET    | `health.ts`     | Returns `{ status: 'ok' }`                                           | AppyStack default                    |
| `/api/info`                | GET    | `info.ts`       | Server metadata                                                      | AppyStack default                    |
| `/api/sessions`            | GET    | `sessions.ts`   | List sessions with optional pagination (`?limit=N&after=cursor`)     | Not in enrichment docs               |
| `/api/sessions/:id/events` | GET    | `sessions.ts`   | Get all events for a session                                         | Not in enrichment docs               |
| `/api/sessions/:id`        | PATCH  | `sessions.ts`   | Update name, tags, workspace_id, note                                | Not in enrichment docs               |
| `/api/workspaces`          | GET    | `workspaces.ts` | List workspaces                                                      | Not in enrichment docs               |
| `/api/workspaces`          | POST   | `workspaces.ts` | Create workspace                                                     | Not in enrichment docs               |
| `/api/workspaces/:id`      | PATCH  | `workspaces.ts` | Update workspace                                                     | Not in enrichment docs               |
| `/api/workspaces/:id`      | DELETE | `workspaces.ts` | Delete workspace                                                     | Not in enrichment docs               |
| `/hooks/:event`            | POST   | `hooks.ts`      | Receive Claude Code hook events (24 types)                           | Documented in Wave 11 docs           |
| `/api/backfill`            | POST   | `backfill.ts`   | Run transcript backfill                                              | Referenced in `data-architecture.md` |
| `/api/backfill/classify`   | POST   | `backfill.ts`   | Classify all unclassified sessions (`?force=true` to reclassify all) | Not explicitly documented            |
| `/api/sync`                | POST   | `sync.ts`       | Backfill + classify in one step                                      | Referenced in `data-architecture.md` |
| `/api/sync/status`         | GET    | `sync.ts`       | Last sync timestamp                                                  | Not explicitly documented            |
| `/api/stats`               | GET    | `stats.ts`      | Session count by type                                                | Not explicitly documented            |

### Documented Endpoints That Don't Exist

| Endpoint           | Documented in                    | Status                                    |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `/api/enrich`      | `execution-paths.md` (Phase 3)   | Not implemented — no enrichment API       |
| `/enrichment` page | `mochaccino-brief.md` (Mockup 3) | Not implemented — no enrichment dashboard |

### WebSocket Events

| Event                         | Direction        | Status                                            |
| ----------------------------- | ---------------- | ------------------------------------------------- |
| `angeleye:event`              | Server -> Client | Implemented — emitted on every hook event         |
| `angeleye:registry`           | Server -> Client | Defined in types but NOT emitted anywhere in code |
| `client:ping` / `server:pong` | Bidirectional    | Implemented                                       |

**Note**: `angeleye:registry` is defined in `ServerToClientEvents` but never emitted. This was likely intended for real-time registry updates pushed to the UI.

---

## 8. Test Coverage

### What's Tested

| Test File                                                             | What it covers                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classifier.service.test.ts`                                          | Junk detection (5 rules + edge cases), tool pattern detection (7 patterns), session type detection (6 types + iron-clad rules + scale guard), first_edited_dir, first_real_prompt, PII detection (11 patterns), session_subtype type existence |
| `schema-auditor.service.test.ts`                                      | Schema surprise detection for all 24 event types, expected/unexpected field detection, common field filtering                                                                                                                                  |
| `voice-dictionary.test.ts`                                            | All 35 voice correction patterns                                                                                                                                                                                                               |
| `angeleye-data.test.ts`                                               | Unknown (not read)                                                                                                                                                                                                                             |
| `hooks.test.ts`                                                       | Hook endpoint routing, event writing, classification on stop/end                                                                                                                                                                               |
| `sessions.test.ts`                                                    | Sessions CRUD endpoints                                                                                                                                                                                                                        |
| `workspaces.test.ts`                                                  | Workspace CRUD endpoints                                                                                                                                                                                                                       |
| `backfill.test.ts`                                                    | Backfill and classify endpoints                                                                                                                                                                                                                |
| `sync.test.ts`                                                        | Sync endpoint                                                                                                                                                                                                                                  |
| `stats.test.ts`                                                       | Stats endpoint                                                                                                                                                                                                                                 |
| `health.test.ts`, `info.test.ts`                                      | Health and info endpoints                                                                                                                                                                                                                      |
| `app.test.ts`, `shutdown.test.ts`, `socket.test.ts`, `static.test.ts` | App-level, shutdown, socket, static serving                                                                                                                                                                                                    |
| Middleware tests (4 files)                                            | Error handler, rate limiter, request logger, validate                                                                                                                                                                                          |

### Critical Services Lacking Tests

| Service                | Gap                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `backfill.service.ts`  | Has route-level tests but no dedicated unit tests for `transcriptToEvents()`, `extractCustomTitle()`, or the full backfill scan logic |
| `registry.service.ts`  | No dedicated unit tests. Write queue serialisation is untested. `_doUpdateRegistry()` self-heal logic is untested.                    |
| `sync.service.ts`      | Has route-level tests but `countByType()`, `runSync()` logic (before/after diff, newByProject grouping) not unit-tested               |
| `workspace.service.ts` | Has route-level tests but no unit tests for edge cases                                                                                |
| `sessions.service.ts`  | `writeSessionName()` path encoding logic is untested                                                                                  |

### What's NOT Tested (Future Code)

None of the planned enrichment items (predicates P01-P22 that should be deterministic, extractors, overlays) have any test infrastructure. When implementing, tests will need to be written from scratch.

---

## 9. Recommendations

### Priority 1 — Quick Wins (Small, High Value)

1. **Add `pii_flags` and `session_scale` to `RegistryEntry` type** (`shared/src/angeleye.ts`). Both are already computed but not typed. This is a 5-minute fix that makes the data model honest.

2. **Wire `normalizeVoiceText()` into `findFirstRealPrompt()`** or the hook handler. The voice dictionary is orphaned code — it's tested but never called.

3. **Emit `angeleye:registry` WebSocket event** after registry updates. The type is defined, the client socket infrastructure exists, but the event is never emitted.

4. **Implement 8 Tier 1 deterministic predicates** (P05, P09, P12, P19, P20, P21, P22). These are all simple boolean checks on existing event data — can be added to `classifySession()` as individual functions. Estimated: ~100 lines of code total. Store as new fields on `RegistryEntry`.

5. **Store `session_scale` as a field** — it is computed but discarded. Adding it to the registry makes C02 fully implemented.

### Priority 2 — Moderate Effort, High Value

6. **Implement Tier 2 predicates** (P04, P06, P08, P11, P17, P18, P24 already done, P25). These are regex/heuristic checks, slightly more complex but still zero-cost.

7. **Implement Tier 2 classifiers** (C03 opening_style, C09 session_continuity, C11 initiation_source). These derive from first-event analysis already partially done in `findFirstRealPrompt()`.

8. **Build E01 and E02 extractors** (trigger command and arguments). E01 is parsing the first prompt for `/slash-command` patterns or Skill tool events. E02 is splitting arguments. Both are Tier 1 deterministic. These unlock domain overlays and affinity groups.

9. **Expand SessionType to 12 types** to match the documented taxonomy (add META, SYSOPS, PLANNING, MIXED, SKILL, SETUP). Currently only 6 types exist in the union.

### Priority 3 — Larger Efforts

10. **Agent Genesis predicates (P31-P35, C22)** — file path glob matching on tool events. Small effort, medium value.

11. **Domain Overlays (C14-C16)** — requires E01/E02 first. Medium effort. Create the overlay JSON schema, loader, bmad-v6 config, and C14 heuristic fallback.

12. **LLM enrichment infrastructure** — build an `/api/enrich` endpoint that calls Claude API for Tier 3 items. This is the largest architectural addition and unlocks all 22 LLM-required items.

13. **Affinity Groups** — largest effort. Build after extractors and overlays are in place.

### Priority 4 — Documentation Sync

14. **Update `data-architecture.md`** to include `note`, `is_junk`, `session_subtype`, and `pii_flags` in the registry field list.

15. **Document the schema auditor** and voice dictionary in the appropriate docs.

16. **Create an API surface reference** document listing all endpoints — currently spread across route files with no single index.

---

**Summary**: The pipeline architecture is sound and the core services are well-implemented. The gap is in enrichment breadth — implementing Tier 1 predicates (Priority 1, item 4) would immediately add 8 new data points per session at zero cost, and is the highest-value next step.
