# Classification Goals

AngelEye's classification system extracts meaning from raw Claude Code session events — turning thousands of JSONL entries into structured, queryable intelligence about how agentic work actually happens. This matters because AngelEye's four jobs (Observer, Context Publisher, Session Archive, Ambient Intelligence) all depend on knowing _what kind of work_ happened, not just that work happened. Without classification, you have a log viewer. With it, you have a performance instrument that can answer questions like "which sessions produced brain writes today?" or "how many BMAD stories reached SHIP this week?"

---

## The Core Questions We're Answering

For each session, AngelEye aims to answer:

1. **What kind of work was this?** (`session_type` — 6 types: BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, ORIENTATION)
2. **How much work happened?** (`session_scale` — 5 levels: MICRO, SMALL, MEDIUM, LARGE, MARATHON)
3. **What tools dominated?** (`tool_pattern` — 8 patterns: CODE_HEAVY, READ_HEAVY, SEARCH_HEAVY, MIXED, PLAYWRIGHT_HEAVY, WRITE_HEAVY, SHELL_HEAVY, MINIMAL)
4. **What specifically was built/done?** (`session_subtype` — 25 confirmed subtypes, not yet implemented)
5. **How did this session start and end?** (`opening_style`, `closing_style` — implemented in Phase 2c)
6. **Was this part of a larger workflow?** (`workflow_role`, `workflow_action`, `group_ids` — role/action implemented via overlay; group correlation is designed, partially built)
7. **What signals of interest are present?** (boolean predicates: PII detection, voice dictation artifacts, brain file writes, compaction resume, machine initiation, and more)

---

## Current State

As of 2026-05-03, from the live registry:

| Metric                                       | Count | Notes                              |
| -------------------------------------------- | ----- | ---------------------------------- |
| Total sessions in registry                   | 2,476 |                                    |
| Sessions with `session_type` classified      | 1,820 | 74% coverage                       |
| Source: `hook` (live-captured)               | 1,317 | 53% — AngelEye was running         |
| Source: `transcript` (backfilled from JSONL) | 1,159 | 47% — recovered after the fact     |
| Marked `is_junk: true`                       | 439   | 18% — excluded from classification |

The remaining 26% untyped are either sessions that predate the classifier or edge cases that the current rules don't resolve to a type.

---

## What's Implemented

The following run today on every session that passes junk detection (Tier 1 deterministic + Tier 2 heuristic):

| What                                                                      | Result field                                                                                                                       | Method                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Junk detection (5 rules: empty, ultra-short, tool-only, ping, accidental) | `is_junk`                                                                                                                          | Deterministic counts                             |
| Session type (6 types, scale-aware with iron-clad rules)                  | `session_type`                                                                                                                     | Tool pattern + project_dir + prompt heuristics   |
| Session scale (5 levels by event count)                                   | `session_scale`                                                                                                                    | Deterministic event count thresholds             |
| Tool pattern (8 patterns by tool-use ratio)                               | `tool_pattern`                                                                                                                     | Deterministic tool-count ratios                  |
| PII flag (11 regex patterns)                                              | `is_pii`                                                                                                                           | Regex over prompt text                           |
| Brain file write detection                                                | `has_brain_file_writes`                                                                                                            | Path matching (`/brains/`) on Edit/Write events  |
| Voice dictation artifact detection                                        | `has_voice_dictation_artifacts`                                                                                                    | Voice dictionary regex over prompt text          |
| Compaction resume detection                                               | `is_compaction_resume`                                                                                                             | Checks for `compact`/`context_compaction` events |
| Machine initiation detection                                              | `is_machine_initiated`                                                                                                             | First event is not `user_prompt`                 |
| BMAD trigger command extraction                                           | `trigger_command`                                                                                                                  | XML tag parsing from skill invocation prompts    |
| Workflow role + action (via overlay config)                               | `workflow_role`, `workflow_action`                                                                                                 | `trigger_command` → overlay JSON lookup          |
| Phase 2c behavioural classifiers (7 fields)                               | `delegation_style`, `initiation_source`, `session_continuity`, `opening_style`, `closing_style`, `session_liveness`, `output_type` | Heuristics over event sequences                  |

---

## What's Designed But Not Built

The gap-analysis document (`docs/planning/enrichment-pipeline/gap-analysis.md`) puts this precisely: **~6 of 58 documented enrichment items are implemented (~10%)**. The remaining 90% falls into these categories:

**Session subtype detection** (25 confirmed subtypes such as `feature_build`, `bug_fix`, `test_write`, `brain_update`, `skill_author`) — requires Tier 3 LLM enrichment to reliably distinguish. The subtypes are catalogued in the 100-session analysis but no classifier exists yet.

**Unimplemented predicates** (~24 of 30 specified): cross-session references (P06), unauthorized edits (P08), CWD incidental (P10), multi-phase detection (P03), frustration signals (P02), feature construction flag (P01), skill gap signal (P07), and ~17 more. Some are easy Tier 1/2 wins (P05 playwright boolean, P06 cross-session refs). Most require LLM.

**Tier 3 LLM enrichment** (22 items): These need Claude to read the session content and make semantic judgments — classifying intent, detecting frustration, identifying what was produced. No LLM call infrastructure exists in the pipeline today.

**Observations and extractors** (7 observations O02-O08, 4 extractors E01-E04 beyond trigger_command): 0% implemented.

**Affinity groups / cross-session correlation**: The `correlator.service.ts` exists and the story-unit correlation runs during workflow seeding, but the general affinity group collection (epic_sprint, project_phase, ad_hoc temporal clusters) is not built.

---

## Data Completeness: Hooks vs Transcript

This is a structural gap in what the registry knows about any given session.

**`source: 'hook'`** means AngelEye was running when this session happened. It received all 25 Claude Code hook event types in real time: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStart`, `SubagentStop`, and 18 more. Event timing is precise. Every tool call is captured.

**`source: 'transcript'`** means the session was backfilled from the JSONL file at `~/.claude/projects/<path>/<session_id>.jsonl`. The backfill recovers conversation content — prompts, assistant messages, tool calls — but it is missing:

- Real-time event timing (only relative offsets can be inferred)
- `PreToolUse` events (hook-only, not in JSONL)
- `permission_request` events
- Hook-specific fields like `stop_hook_active`, `agent_type` (v2.1.69+)
- The `last_assistant_message` field from `Stop`/`SubagentStop` (v2.1.47+)

**Known gap — partial hook coverage**: There is no field that distinguishes between (a) full hook coverage from session start, (b) AngelEye started mid-session and captured partial hooks, and (c) transcript-only with no hooks at all. All three look like `source: 'hook'` or `source: 'transcript'` — the middle case is invisible.

**Period gap**: When AngelEye isn't running (machine off, service not started), sessions accumulate as JSONL only. The sync pipeline backfills these on the next `POST /api/sync`, recovering conversation content but not the hook events.

**Classification impact**:

- Tier 1+2 classifiers work on transcript-only sessions. The JSONL contains enough signal (tool names, prompt text, file paths) to classify type, scale, pattern, and most predicates.
- Tier 3 LLM enrichment also works on transcript-only. You'd feed the JSONL content to Claude regardless of whether hooks fired.
- The only real loss from transcript-only is timing precision and hook-exclusive fields (PreToolUse, permission events).

---

## Reclassification

The classification system is designed to be re-run as rules improve. Nothing is frozen.

- **Tier 1+2 reclassification**: Zero API cost. Re-runs in milliseconds per session. Trigger via `POST /api/sync?force=true` to reclassify all sessions, or `POST /api/sync` (without force) to only classify previously untyped sessions.
- **Tier 3 reclassification** (when built): API cost per session. Design principle: selective re-runs only — e.g. only sessions where `session_type` changed since last run, or sessions in a specific project_dir, or sessions in a date range.
- **Registry is the output**: Classification writes back to `~/.claude/angeleye/registry.json`. Re-running the classifier overwrites only the fields it computes — it does not touch manually-set fields or the raw event JSONL.

---

## Where The Rules Live

| What                                                                           | Where                                                           |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Session type rules (6 types, empirical basis from 100 + 924 session campaigns) | `docs/intelligence/research/100-session-analysis.md`            |
| All 58 enrichment items (full spec, tiers, status)                             | `docs/planning/enrichment-pipeline/predicate-tier-reference.md` |
| Implementation gap analysis (what's built vs documented)                       | `docs/planning/enrichment-pipeline/gap-analysis.md`             |
| Live pattern observation log (signal reliability, validated findings)          | `docs/intelligence/PATTERNS.md`                                 |
| Classifier implementation                                                      | `server/src/services/classifier.service.ts`                     |
| Why AngelEye scans (philosophy, four jobs, design principles)                  | `~/dev/ad/brains/angeleye/angeleye-fundamentals.md`             |
