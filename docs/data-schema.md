# AngelEye Data Schema Reference

Consolidated reference for all data schemas used or produced by AngelEye. Covers what it reads (Claude Code JSONL + hook events), what it writes (`~/.claude/angeleye/`), and the full TypeScript type model.

---

## Data Sources AngelEye Reads

### Claude Code Session JSONL Files

Location: `~/.claude/projects/<encoded-path>/<session_id>.jsonl`

Each file is a newline-delimited JSON log of a single Claude Code session. Key entry types:

| Entry type             | Key fields                                              | Notes                                                                                                                                             |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`                 | `type`, `message.content`, `timestamp`, `cwd`, `isMeta` | Real user prompts have `isMeta: false` and `content` as a plain string. Skill-expanded prompts start with `<command-name>...</command-name>` XML. |
| `assistant`            | `type`, `message.content[]`, `timestamp`                | Content is an array of blocks. Tool calls appear as `{ type: 'tool_use', name: string, input: object }` blocks.                                   |
| `custom-title`         | `type: 'custom-title'`, `customTitle: string`           | Written by `/rename`. Last entry wins. Tree-detached (no `parentUuid`).                                                                           |
| `agent-name`           | `type: 'agent-name'`, `agentName: string`               | Written alongside `custom-title` by `/rename`.                                                                                                    |
| `progress`             | `type: 'progress'`                                      | Most numerous type (~75% in hook-heavy sessions). Skip when parsing for conversation content.                                                     |
| `system/turn_duration` | `type`, auto-slug                                       | Contains the auto-generated slug (`witty-painting-plum` style). Not the user-assigned name.                                                       |

**Key parsing rules:**

- Skip entries where `isMeta: true` — these are context injections, not real user input
- Skip `content` strings starting with `<` unless they match `<command-name>` (skill expansion)
- Skip prompts starting with `"This session is being continued"` — compaction context injections
- `progress` entries dominate large sessions; always filter before iterating for conversation data
- Sub-agent files are named `agent-*.jsonl` and contain `isSidechain: true` entries

### Hook Events (live ingestion)

Hook events arrive as HTTP POST to `/hooks/:event`. All events share a set of common fields:

**Common fields** (present on every hook payload):

| Field              | Type    | Description                                                      |
| ------------------ | ------- | ---------------------------------------------------------------- |
| `session_id`       | string  | Identifies the session                                           |
| `cwd`              | string  | Current working directory                                        |
| `hook_event_name`  | string  | Raw hook name from Claude Code                                   |
| `transcript_path`  | string  | Path to the JSONL transcript file                                |
| `permission_mode`  | string  | Claude Code permission mode                                      |
| `stop_hook_active` | boolean | Guard flag — if true, exit immediately to prevent infinite loops |
| `agent_id`         | string  | Agent identifier (subagent sessions)                             |
| `agent_type`       | string  | Type of agent                                                    |

**Event-specific fields** by event type:

| Event type            | Additional fields                                                                    | Notes                                |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `session_start`       | (none beyond common)                                                                 |                                      |
| `user_prompt`         | `user_prompt`, `prompt`                                                              | Both may be present                  |
| `tool_use`            | `tool_name` (required), `tool_input` (object), `tool_result` (string), `tool_use_id` | Core activity stream                 |
| `stop`                | `reason`, `last_assistant_message`                                                   | Chapter boundary                     |
| `session_end`         | (none beyond common)                                                                 | Signals session has closed           |
| `subagent_start`      | (none beyond common)                                                                 | BMAD agent handoff — agent starting  |
| `subagent_stop`       | `reason`, `last_assistant_message`                                                   | BMAD agent handoff — agent finishing |
| `tool_failure`        | `tool_name`, `tool_input`, `tool_use_id`, `error`                                    | Tool error events                    |
| `stop_failure`        | `error`, `status_code`                                                               | API error endings                    |
| `worktree_create`     | `worktree_path`, `worktree_branch`                                                   |                                      |
| `worktree_remove`     | `worktree_path`                                                                      |                                      |
| `cwd_changed`         | `old_cwd`, `new_cwd`                                                                 |                                      |
| `pre_tool_use`        | `tool_name`, `tool_input`, `tool_use_id`                                             | High-volume; filtered as noise in UI |
| `instructions_loaded` | `files` (array)                                                                      | Which CLAUDE.md files were loaded    |
| `pre_compact`         | (none beyond common)                                                                 |                                      |
| `post_compact`        | (none beyond common)                                                                 |                                      |
| `permission_request`  | `tool_name`                                                                          |                                      |
| `notification`        | `message`, `type`                                                                    |                                      |
| `teammate_idle`       | (none beyond common)                                                                 |                                      |
| `task_completed`      | (none beyond common)                                                                 |                                      |
| `config_change`       | `file_path`                                                                          |                                      |
| `elicitation`         | `server_name`                                                                        | MCP structured input                 |
| `elicitation_result`  | `server_name`                                                                        |                                      |
| `file_changed`        | `file_path`                                                                          |                                      |

**Important hook rules:**

- The hooks endpoint always returns `{ continue: true }` — even on errors. Returning non-200 would block Claude Code's hook pipeline.
- Rate limiting is excluded for `/hooks/*` routes — hook events can burst rapidly.
- The `/hooks/:event` handler silently swallows errors to protect the hook pipeline.

---

## AngelEye's Own Storage

Location: `~/.claude/angeleye/`

```
~/.claude/angeleye/
  registry.json                    <- flat dict of all known sessions
  workspaces.json                  <- workspace definitions
  last-sync.json                   <- timestamp of last POST /api/sync
  sessions/
    session-<session_id>.jsonl     <- one AngelEyeEvent per line, append-only
  archive/
    session-<session_id>.jsonl     <- rotated here at session end
  audit/
    hook-schema-surprises.jsonl    <- schema drift log entries
```

**Write safety:** All writes to `registry.json` go through a serial promise queue (`writeQueue`) with atomic temp-file-then-rename. This handles concurrent hook POSTs within a single process. No file locking — running two AngelEye instances against the same data dir will corrupt the registry.

### registry.json — RegistryEntry schema

`registry.json` is a `Record<string, RegistryEntry>` — keyed by `session_id`.

**Identity and lifecycle fields:**

| Field          | Type                       | Description                                              |
| -------------- | -------------------------- | -------------------------------------------------------- |
| `session_id`   | string                     | UUID matching the Claude Code session                    |
| `project`      | string                     | Last path segment of `cwd` (e.g., `angeleye`)            |
| `project_dir`  | string                     | Full path to the project directory                       |
| `started_at`   | string (ISO)               | Timestamp of first event                                 |
| `last_active`  | string (ISO)               | Updated on every incoming event                          |
| `name`         | string or null             | User-assigned name via `/rename`; always wins in display |
| `tags`         | string[]                   | Human-set tags                                           |
| `workspace_id` | string or null             | Organiser workspace assignment                           |
| `status`       | `'active'` or `'ended'`    |                                                          |
| `source`       | `'hook'` or `'transcript'` | How the session was ingested                             |
| `note`         | string or null             | Free-text user annotation                                |

**Junk and scale fields:**

| Field           | Type           | Description                                                                      |
| --------------- | -------------- | -------------------------------------------------------------------------------- |
| `is_junk`       | boolean        | True for noise sessions (single event, tmp path, agent- prefix, etc.)            |
| `session_scale` | `SessionScale` | `micro` / `light` / `moderate` / `heavy` / `marathon` — based on tool call count |

**Classification fields:**

The subtype layer uses a three-field model. `subtype_heuristic` is written by the deterministic classifier on every sync (free, sometimes wrong). `session_tags` is written by the LLM enrichment skill (manual, considered) and is the source of truth when present. `session_subtype` is derived: it equals `session_tags[0].tag` when present, otherwise `subtype_heuristic`.

| Field               | Type             | Description                                                                                      |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `session_type`      | `SessionType`    | Primary type: BUILD / TEST / RESEARCH / KNOWLEDGE / OPS / ORIENTATION                            |
| `subtype_heuristic` | `SessionSubtype` | Deterministic-classifier output. Always present after sync. Approximate.                         |
| `session_tags`      | `SessionTag[]`   | LLM enrichment output. Multiple tags with confidence scores, sorted descending. Source of truth. |
| `session_subtype`   | `SessionSubtype` | DERIVED: `session_tags[0].tag` if tags present, else `subtype_heuristic`.                        |
| `tool_pattern`      | `ToolPattern`    | Dominant tool usage pattern                                                                      |
| `first_edited_dir`  | string           | First directory meaningfully touched                                                             |
| `first_real_prompt` | string           | First non-junk prompt snippet, max 200 chars                                                     |
| `pii_flags`         | string[]         | PII categories detected in prompts (email, ipv4, api_key patterns, etc.)                         |

**`SessionTag` shape:** `{ tag: SessionSubtype, confidence: number, source?: 'llm' | 'migrated' | 'heuristic_only' }`. `source` is provenance — `'llm'` for considered enrichment work, `'migrated'` for backfill from older snake_case subtypes, `'heuristic_only'` for automation-confirmed fallbacks. Treat undefined as `'migrated'` for back-compat.

**Tier 1 predicates (deterministic):**

| Field                          | Type    | Detection basis                                                                                |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| `has_playwright_calls`         | boolean | Any `mcp__playwright__*` tool call                                                             |
| `is_compaction_resume`         | boolean | `pre_compact` or `post_compact` event present                                                  |
| `is_machine_initiated`         | boolean | First event is not `user_prompt`                                                               |
| `has_web_research`             | boolean | `WebFetch`, `WebSearch`, or `mcp__brave-search__*` present                                     |
| `has_parallel_subagent_bursts` | boolean | 3+ Agent tool calls within 60-second window                                                    |
| `has_task_orchestration`       | boolean | `TaskCreate`, `TaskUpdate`, `TaskOutput`, or `TaskList` present                                |
| `has_git_outcome`              | boolean | `git commit`, `git push`, `git merge`, or `gh pr create` in Bash commands                      |
| `has_skill_created`            | boolean | `Write` tool targeting `/.claude/skills/`                                                      |
| `has_skill_modified`           | boolean | `Edit`/`MultiEdit` targeting `/.claude/skills/`                                                |
| `has_ruflo_context`            | boolean | `instructions_loaded` event with file path containing `.appydave/` or ending `CLAUDE.local.md` |
| `subagent_start_count`         | number  | Count of `subagent_start` events in the session — proxy for subagents spawned                  |

**Tier 1 extractors:**

| Field               | Type           | Description                                                          |
| ------------------- | -------------- | -------------------------------------------------------------------- |
| `trigger_command`   | string or null | Slash command from first user prompt (e.g., `bmad-sm`)               |
| `trigger_arguments` | string or null | Arguments following the slash command, first line only, max 50 chars |

**Tier 2 predicates (regex/heuristic):**

| Field                           | Type    | Detection basis                                                              |
| ------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `has_brain_file_writes`         | boolean | Edit/Write/MultiEdit targeting paths containing `/brains/`                   |
| `has_cross_session_refs`        | boolean | UUID pattern or cross-session phrases in user prompts                        |
| `has_unauthorized_edits`        | boolean | Edit/Write targeting paths outside `project_dir`                             |
| `has_voice_dictation_artifacts` | boolean | Run-on segments >100 words, STT errors, or long unformatted prompts          |
| `has_handover_context`          | boolean | First prompt starts with handover markers or is >2000 chars                  |
| `has_cross_project_reads`       | boolean | Read/Glob/Grep targeting paths outside `project_dir`                         |
| `has_closing_ceremony`          | boolean | `git commit`/`push` in tail events, or summary language in last stop message |

**Domain overlay fields (C14-C16):**

| Field               | Type           | Description                                                                     |
| ------------------- | -------------- | ------------------------------------------------------------------------------- |
| `workflow_role`     | string or null | Role mapped from trigger_command via overlay config (e.g., `builder`, `tester`) |
| `workflow_identity` | string or null | Agent identity from overlay (e.g., `Bob`, `Amelia`, `Nate`)                     |
| `workflow_action`   | string or null | Action code parsed from trigger arguments (e.g., `CS`, `DS`, `WN`)              |

**Phase 2c behavioural classifiers (B060):**

| Field                | Type                | Description                                                                               |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `delegation_style`   | `DelegationStyle`   | `conversational` / `directive` / `orchestrated` / `autonomous`                            |
| `initiation_source`  | `InitiationSource`  | `user_typed` / `voice_dictated` / `handover_paste` / `skill_invoked` / `agent_dispatched` |
| `session_continuity` | `SessionContinuity` | `fresh` / `handover_paste` / `compaction` / `skill_launcher` / `recall`                   |
| `opening_style`      | `OpeningStyle`      | How the session began (see enum values below)                                             |
| `closing_style`      | `ClosingStyle`      | How the session ended (see enum values below)                                             |
| `autonomy_ratio`     | number (0.0–1.0)    | `tool_calls / (tool_calls + user_prompts)`                                                |
| `session_liveness`   | `SessionLiveness`   | `high` / `medium` / `low` — based on events-per-minute                                    |
| `output_type`        | `OutputType`        | `conversation_only` / `code_changes` / `knowledge_synthesis` / `mixed` / `new_artifacts`  |

**Affinity group reference:**

| Field       | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| `group_ids` | string[] | IDs of `AffinityGroup` records this session belongs to |

**Session origin classification:**

`session_kind` distinguishes how a session came into existence — important for filtering enrichment work, since subagent and subprocess sessions should be excluded from primary-session classification.

| Field          | Type                                   | Description                                                                                                          |
| -------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `session_kind` | `'main' \| 'subagent' \| 'subprocess'` | Detected at SessionStart; backfilled by `scripts/audits/backfill-session-kind.ts` and `backfill-subprocess-kind.ts`. |
| `teammate_id`  | string or null                         | Set on subagent sessions. Observed values: `'team-lead'`.                                                            |

- `main` — human-driven primary session.
- `subagent` — spawned by Agent Teams (Mechanism B). First user message is wrapped in `<teammate-message teammate_id="...">`.
- `subprocess` — headless skill subprocess (e.g. `omi-extract-haiku` Haiku invocations). Identified by `event_count <= 5` plus first prompt matching template patterns (`"-\nGenerate..."`, `"-\nExtract..."`, `"You are executing..."`). See `docs/architecture/known-issues.md#subprocess-session-mechanism-3`.

### sessions/session-`<id>`.jsonl — AngelEyeEvent schema

One JSON object per line. Append-only. Written by the hooks handler and the backfill service.

| Field          | Type                       | Required | Description                                              |
| -------------- | -------------------------- | -------- | -------------------------------------------------------- |
| `id`           | string                     | yes      | `crypto.randomUUID()`                                    |
| `session_id`   | string                     | yes      | Matches the registry key                                 |
| `ts`           | string (ISO)               | yes      | Event timestamp                                          |
| `source`       | `'hook'` or `'transcript'` | yes      | Origin of the event                                      |
| `event`        | `AngelEyeEventType`        | yes      | One of 24 event type values                              |
| `cwd`          | string                     | no       | Working directory at time of event                       |
| `agent_id`     | string                     | no       | Set for subagent events                                  |
| `prompt`       | string                     | no       | User prompt text (`user_prompt` events)                  |
| `tool`         | string                     | no       | Tool name (`tool_use` events)                            |
| `tool_use_id`  | string                     | no       | Claude Code tool use correlation ID                      |
| `tool_summary` | object                     | no       | Structured summary — `file`, `command` etc.              |
| `result`       | string                     | no       | Tool result snippet                                      |
| `reason`       | string                     | no       | Stop reason                                              |
| `last_message` | string                     | no       | Last assistant message (`stop` / `subagent_stop` events) |
| `agent_type`   | string                     | no       | Type of subagent                                         |
| `payload`      | object                     | no       | Generic bucket for Wave 11 event-specific data           |
| `error`        | string                     | no       | Error message (`tool_failure`, `stop_failure` events)    |

### archive/

Session JSONL files rotated here after `session_end` is received. Same schema as `sessions/`. No automatic cleanup.

### audit/hook-schema-surprises.jsonl

Written when incoming hook payloads contain fields that differ from expectations in `HOOK_SCHEMA_EXPECTATIONS`. Each line is an `AuditEntry`:

| Field        | Type   | Description                                                      |
| ------------ | ------ | ---------------------------------------------------------------- |
| `ts`         | string | When the surprise was logged                                     |
| `hook`       | string | Hook name                                                        |
| `event_type` | string | Event type                                                       |
| `surprises`  | array  | `{ field, expected, got }` — each mismatched or unexpected field |

Used to detect Claude Code format changes without crashing.

---

## Shared TypeScript Schema

Canonical source: `/Users/davidcruwys/dev/ad/apps/angeleye/shared/src/angeleye.ts`

### Key Enums

**SessionType** — Primary work classification (validated across 924 sessions):

| Value         | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `BUILD`       | Product code changes — Edit/Write/Bash dominant. Only assigned at moderate+ scale. |
| `TEST`        | UAT, Playwright, test running                                                      |
| `RESEARCH`    | Web search, reading, external investigation                                        |
| `KNOWLEDGE`   | Brain/docs updates — no product changes                                            |
| `OPS`         | Infrastructure, CI/CD, Bash-only campaigns, POEM execution                         |
| `ORIENTATION` | Cold start, reorientation, lookup. Default for micro/light sessions.               |

Note: The 924-session campaign identified 12 extended types (META, SYSOPS, PLANNING, MIXED, SKILL, SETUP). These are not yet in the codebase enum — the current enum covers 6.

**SessionSubtype** — Dot-notation sub-labels within each primary type. Detection is a mix of deterministic rules (in `classifier.service.ts`) and LLM-assigned tags (via the enrichment skill). Full list is the canonical source in `shared/src/angeleye.ts` — do not duplicate it here.

Subtype namespaces and examples:

- `build.*` — code production sessions: `build.feature`, `build.shipped`, `build.bug_fix`, `build.refactor`, `build.test_writing`, `build.campaign`, `build.orchestrated_campaign`, `build.bmad_orchestrator`, `build.bmad_agent`, `build.ruflo_orchestrator`, `build.ralphy_campaign`, `build.user_acceptance_test`, etc.
- `orientation.*` — navigation and lookup: `orientation.codebase_exploration`, `orientation.morning_triage`, `orientation.bookend`, `orientation.visual_inspection`, etc.
- `knowledge.*` — brain and documentation: `knowledge.brain_capture`, `knowledge.brain_audit`, `knowledge.advisory_refinement`, `knowledge.omi_ingestion`, etc.
- `research.*` — investigation: `research.technology_survey`, `research.tool_evaluation`, `research.quick_answer`, etc.
- `meta.*` — session quality classifications: `meta.ghost_session` (human opened, did nothing, closed), `meta.scheduled_probe` (scheduler-spawned context-load-only session), `meta.accidental`.
- `skill.*` — skill creation/development sessions.

Each tag has `confidence` 0.0–1.0 and a `source` field tracking provenance. The `SessionSubtype` union is also a `string` escape-hatch — the classifier may produce values not yet in the union (logged as schema surprises).

**ToolPattern** — Dominant tool pattern over all tool calls in the session:

| Value              | Threshold                                          |
| ------------------ | -------------------------------------------------- |
| `playwright-heavy` | `mcp__playwright__*` > 40%                         |
| `bash-heavy`       | `Bash` > 40%                                       |
| `edit-heavy`       | `Edit` + `Write` > 40%                             |
| `task-heavy`       | `Task*` tools > 40%                                |
| `agent-heavy`      | `Agent` > 20% (lower threshold)                    |
| `websearch-heavy`  | `WebFetch` + `mcp__brave-search__*` > 30%          |
| `read-heavy`       | `Glob` + `Read` + `Grep` > 60% with minimal writes |
| `mixed`            | No dominant pattern, or fewer than 3 tool calls    |

**SessionScale** — Based on raw tool call count:

| Value      | Tool call count |
| ---------- | --------------- |
| `micro`    | 0–3             |
| `light`    | 4–10            |
| `moderate` | 11–50           |
| `heavy`    | 51–200          |
| `marathon` | 201+            |

**Phase 2c classifier enums:**

| Enum                | Values                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DelegationStyle`   | `conversational`, `directive`, `orchestrated`, `autonomous`                                                                                                                            |
| `InitiationSource`  | `user_typed`, `voice_dictated`, `handover_paste`, `skill_invoked`, `agent_dispatched`                                                                                                  |
| `SessionContinuity` | `fresh`, `handover_paste`, `compaction`, `skill_launcher`, `recall`                                                                                                                    |
| `OpeningStyle`      | `typed_question`, `typed_instruction`, `voice_dictation`, `skill_invocation`, `paste_handover`, `code_paste`, `continuation`, `greeting`, `context_dump`, `agent_initiated`, `unknown` |
| `ClosingStyle`      | `commit_push`, `commit_only`, `summary_close`, `abrupt_abandon`, `task_handoff`, `question_answer`, `error_bail`, `natural_completion`, `unknown`                                      |
| `OutputType`        | `conversation_only`, `code_changes`, `knowledge_synthesis`, `mixed`, `new_artifacts`                                                                                                   |
| `SessionLiveness`   | `high`, `medium`, `low`                                                                                                                                                                |

---

## Classification Fields

### Tier 1 Predicates (deterministic)

All boolean. Computed from event counts and patterns — no regex, no heuristics.

| Predicate                      | Detection logic summary                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `is_junk`                      | 1 event + prompt ≤2 chars; in `/tmp`; `agent-` prefix; "Hello how can I"; ≤3 events + no tools + prompt ≤5 chars |
| `has_playwright_calls`         | Any `mcp__playwright__*` tool call                                                                               |
| `is_compaction_resume`         | `pre_compact` or `post_compact` event present                                                                    |
| `is_machine_initiated`         | First event is not `user_prompt`                                                                                 |
| `has_web_research`             | `WebFetch`, `WebSearch`, or `mcp__brave-search__*` present                                                       |
| `has_parallel_subagent_bursts` | 3+ `Agent` calls within 60s window                                                                               |
| `has_task_orchestration`       | Any of `TaskCreate`, `TaskUpdate`, `TaskOutput`, `TaskList`                                                      |
| `has_git_outcome`              | `git commit/push/merge` or `gh pr create` in Bash tool events                                                    |
| `has_skill_created`            | `Write` to `/.claude/skills/`                                                                                    |
| `has_skill_modified`           | `Edit`/`MultiEdit` on `/.claude/skills/`                                                                         |
| `has_ruflo_context`            | `instructions_loaded` with `.appydave/` path, or path ending `CLAUDE.local.md`                                   |
| `subagent_start_count`         | Number of `subagent_start` events (counter, not boolean) — used for orchestrator detection                       |

### Tier 1 Extractors

| Extractor | Field               | Logic                                                             |
| --------- | ------------------- | ----------------------------------------------------------------- |
| E01       | `trigger_command`   | `/[\w:-]+` regex on first user prompt                             |
| E02       | `trigger_arguments` | Text after the slash command, first line only, capped at 50 chars |

`trigger_command` is also used by the subtype classifier to deterministically route BMAD lifecycle sessions: `appydave:bmad-story-lifecycle` → `build.bmad_orchestrator`, any other `bmad-*` or `appydave:bmad-*` → `build.bmad_agent`. Ralphy sessions (`ralphy` / `appydave:ralphy`) → `build.ralphy_campaign`.

### Tier 2 Predicates (heuristic/regex)

| Predicate                       | Detection logic summary                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `has_brain_file_writes`         | Edit/Write/MultiEdit where file path contains `/brains/`                                                                             |
| `has_cross_session_refs`        | UUID pattern or phrases like "previous session", "last session" in prompts                                                           |
| `has_unauthorized_edits`        | Edit/Write to paths outside `project_dir`                                                                                            |
| `has_voice_dictation_artifacts` | Run-on sentences >100 words; STT errors ("cloud"/"claw" in long prompt); long prompt with no markdown                                |
| `has_handover_context`          | First prompt starts with "This session is being continued", `<task-notification`, or "Session Context:"; or first prompt >2000 chars |
| `has_cross_project_reads`       | Read/Glob/Grep on paths outside `project_dir`                                                                                        |
| `has_closing_ceremony`          | `git commit`/`push` in tail Bash commands, or closing language in last stop message                                                  |

### Extractors

| Extractor           | Field                 | Logic                                                                                                                                                        |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `first_edited_dir`  | Directory             | `path.dirname()` of first Edit/Write/Read/Glob target                                                                                                        |
| `first_real_prompt` | String, max 200 chars | First `user_prompt` > 2 chars, not a context injection, not a paste (>2000 chars)                                                                            |
| `pii_flags`         | string[]              | Regex scan of prompts for: email, ipv4, npm_token, openai_key, bsa_key, github_token, slack_token, aws_key, birthdate, generic_secret, generic_base64_secret |

### Phase 2c Behavioural Classifiers

All computed in `classifier.service.ts`. All depend on Tier 1/2 results.

| Classifier | Field                | Summary of logic                                                                                                                                                                                             |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C08        | `delegation_style`   | `orchestrated` if task orch/parallel subagents/agent-heavy; `autonomous` if machine-initiated at moderate+ scale; `directive` if first prompt is short imperative (<50 chars, no `?`); else `conversational` |
| C09        | `initiation_source`  | `agent_dispatched` if machine-initiated; `skill_invoked` if trigger_command set; `voice_dictated` if voice artifacts; `handover_paste` if handover; else `user_typed`                                        |
| C10        | `session_continuity` | `compaction` if compaction events; `handover_paste` if handover context; `skill_launcher` if trigger_command and single-line slash prompt; `recall` if cross-session refs; else `fresh`                      |
| C11        | `opening_style`      | Cascade: `agent_initiated` → `skill_invocation` → `paste_handover` → `voice_dictation` → `code_paste` → `context_dump` → `greeting` → `continuation` → `typed_instruction` → `typed_question` → `unknown`    |
| C12        | `closing_style`      | `error_bail` → `commit_push` → `commit_only` → `task_handoff` → `summary_close` → `question_answer` → `natural_completion` → `abrupt_abandon`                                                                |
| C13        | `autonomy_ratio`     | `tool_calls / (tool_calls + user_prompts)`, 0.0–1.0                                                                                                                                                          |
| C14        | `session_liveness`   | Events-per-minute bucketed: >5 = `high`, ≥1 = `medium`, <1 = `low`                                                                                                                                           |
| C15        | `output_type`        | Based on write targets: no writes = `conversation_only`; `.md`/`/brains/` only = `knowledge_synthesis`; code only = `code_changes`; mix = `mixed`; Write-only (no Edit) = `new_artifacts`                    |

### Session Type Detection — Iron-Clad Rules

These rules have no known exceptions and apply before all other type logic:

1. First prompt matches `*run NNN` → `OPS` (POEM execution)
2. First prompt matches `You are agent <UUID>` → `OPS` (Paperclip agent)
3. Zero tool calls → `ORIENTATION` (never BUILD)
4. `brains/` in CWD + micro/light scale → `KNOWLEDGE` (never BUILD)
5. Micro scale + would-be-BUILD pattern → `ORIENTATION`
6. Light scale + would-be-BUILD pattern → `ORIENTATION` (or `KNOWLEDGE` if brains CWD)

---

## Workflow / Domain Overlay Data

### Domain Overlays

Config files at: `server/src/config/overlays/<domain>.json`

Overlays map slash commands to workflow roles, identities, and action codes. Currently ships `bmad-v6.json`.

**DomainOverlay schema:**

| Field           | Type                                | Description                                      |
| --------------- | ----------------------------------- | ------------------------------------------------ |
| `domain`        | string                              | Domain identifier, e.g., `bmad-v6`               |
| `role_mappings` | `Record<string, DomainRoleMapping>` | Key is a skill command pattern, e.g., `/bmad-sm` |

**DomainRoleMapping:**

| Field      | Type           | Description                                                                                                |
| ---------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `role`     | string         | Generic role: `builder`, `reviewer`, `tester`, `planner`, `observer`, `orchestrator`, `advisor`, `shipper` |
| `identity` | string or null | Agent persona: `Bob`, `Amelia`, `Nate`, `Taylor`, `Lisa`, etc.                                             |
| `actions`  | string[]       | Action codes this role handles: `WN`, `CS`, `DS`, `VS`, `DR`, `ER`, etc.                                   |

### WorkflowType (config)

Config files at: `server/src/config/workflows/<name>.json`

Pure data — no runtime state. Defines a production-line template.

| Field            | Type                                 | Description                                    |
| ---------------- | ------------------------------------ | ---------------------------------------------- |
| `id`             | string                               | e.g., `regular_story`                          |
| `name`           | string                               | Display name                                   |
| `domain`         | string                               | e.g., `bmad-v6`                                |
| `stations`       | `StationConfig[]`                    | Ordered pipeline stations                      |
| `ceremony_level` | `'full'` / `'reduced'` / `'minimal'` | How much process formality is expected         |
| `skip_rules`     | `SkipRule[]`                         | Conditions under which stations can be skipped |

**StationConfig:**

| Field                    | Type           | Description                                                    |
| ------------------------ | -------------- | -------------------------------------------------------------- |
| `position`               | number         | 1-based order in the pipeline                                  |
| `action_code`            | string         | Maps to `workflow_action` on sessions (e.g., `WN`, `CS`, `DS`) |
| `role`                   | string         | Expected role for this station                                 |
| `identity`               | string or null | Expected agent identity                                        |
| `requires_fresh_session` | boolean        | Whether this station needs a new session                       |
| `can_spawn_subagents`    | boolean        | Whether this station is expected to use sub-agents             |
| `backtrack_target`       | boolean        | Whether sessions can backtrack to this station                 |

### WorkflowInstance (runtime)

Stored in `data/workflows/` (flat files, not JSONL). One instance per story/work item.

| Field                       | Type                | Description                                 |
| --------------------------- | ------------------- | ------------------------------------------- |
| `instance_id`               | string              | UUID                                        |
| `workflow_type_id`          | string              | References a `WorkflowType.id`              |
| `work_item_id`              | string              | Story identifier (e.g., `B025`)             |
| `work_item_label`           | string              | Human-readable story title                  |
| `project_dir`               | string              | Optional — project the work item belongs to |
| `status`                    | `WorkflowStatus`    | `not_started` / `in_progress` / `closed`    |
| `current_station`           | number              | Position of the active station              |
| `created_at` / `updated_at` | string (ISO)        | Timestamps                                  |
| `stations`                  | `StationInstance[]` | Runtime state per station                   |
| `backtracks`                | `BacktrackRecord[]` | History of backtrack events                 |
| `metadata`                  | object              | Free-form extra data                        |

**StationInstance:**

| Field                         | Type           | Description                                                             |
| ----------------------------- | -------------- | ----------------------------------------------------------------------- |
| `position`                    | number         | Matches `StationConfig.position`                                        |
| `action_code`                 | string         | Matches `StationConfig.action_code`                                     |
| `state`                       | `StationState` | `not_started` / `in_progress` / `completed` / `skipped` / `backtracked` |
| `session_ids`                 | string[]       | Sessions routed to this station (can be multiple)                       |
| `started_at` / `completed_at` | string or null | ISO timestamps                                                          |
| `duration_ms`                 | number or null |                                                                         |
| `context_used_pct`            | number or null | Context window % used                                                   |
| `subagent_count`              | number         | How many sub-agents spawned                                             |
| `verdict`                     | string or null | Human or automated assessment                                           |

### Affinity Groups

Stored in `data/affinity-groups/`. Cluster related sessions without requiring workflow config.

| Field            | Type                 | Description                                               |
| ---------------- | -------------------- | --------------------------------------------------------- |
| `group_id`       | string               | UUID                                                      |
| `group_type`     | `AffinityGroupType`  | `story_unit` / `epic_sprint` / `project_phase` / `ad_hoc` |
| `label`          | string               | Human-readable description                                |
| `session_ids`    | string[]             | Members                                                   |
| `confidence`     | `AffinityConfidence` | `deterministic` / `heuristic` / `inferred`                |
| `domain_overlay` | string               | Optional overlay reference                                |
| `created_at`     | string (ISO)         |                                                           |
| `metadata`       | object               | Extra data                                                |

**Important:** Story units and ad-hoc clusters must NOT be merged. The correlator's union-find has a type guard for this; any new signal type must also implement it.

---

## Canonical Sources

| Schema                                   | Canonical location                                                |
| ---------------------------------------- | ----------------------------------------------------------------- |
| All TypeScript types (enums, interfaces) | `shared/src/angeleye.ts`                                          |
| Hook schema expectations + common fields | `server/src/services/schema-auditor.service.ts`                   |
| All classification detection functions   | `server/src/services/classifier.service.ts`                       |
| Backfill / JSONL parsing logic           | `server/src/services/backfill.service.ts`                         |
| Registry read/write + path constants     | `server/src/services/registry.service.ts`                         |
| Domain overlay resolution                | `server/src/services/overlay.service.ts`                          |
| Workflow type configs                    | `server/src/config/workflows/*.json`                              |
| Overlay configs                          | `server/src/config/overlays/*.json`                               |
| Signal reliability data (924-session)    | `docs/intelligence/PATTERNS.md`                                   |
| Hook pipeline architecture               | `~/dev/ad/brains/angeleye/ingestion-architecture.md`              |
| Claude Code JSONL entry types            | `~/dev/ad/brains/anthropic-claude/claude-code/observability.md`   |
| All 25 hook events + input format        | `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md` |
| Workflow domain model (conceptual)       | `~/dev/ad/brains/angeleye/workflow-model.md`                      |
| Enrichment pipeline (Tier 1–3 design)    | `~/dev/ad/brains/angeleye/enrichment-pipeline.md`                 |
