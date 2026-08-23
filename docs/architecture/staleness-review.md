# Staleness Review — AngelEye vs Claude Code 2.1.235

**Date**: 2026-08-19
**Reviewed against**: Claude Code **2.1.235** (installed at `~/.local/share/claude/versions/2.1.235`), plus this machine's live emitted data (456 JSONLs in `~/.claude/projects/`, 52,529 hook-payload audit records in `~/.claude/angeleye/audit/hook-schema-surprises.jsonl`, 18,304 registry rows).
**Method**: primary source = the installed binary and the real data it wrote. Brain docs used only as pointers.
**Scope**: survey only. No code changed.
**Revision**: reviewed at `4f385d4`; rebased onto 6 newer commits from the other machine (through `a8e52bb`, incl. the MCP server and `event-index.service.ts`) and every `file:line` anchor below re-verified against that HEAD. None of those commits changes any finding.

---

## 1. Subsystem age map

The repo is younger than assumed: **first commit 2026-03-12, last commit 2026-07-25** — roughly 5 months old, and 25 days since the last commit. But the age is very unevenly distributed, and the oldest code is the code that touches Claude Code's data.

| Subsystem              | First      | Last touched | Age of newest change | Commits |
| ---------------------- | ---------- | ------------ | -------------------- | ------- |
| `server/src/routes/`   | 2026-03-15 | 2026-07-25   | 25d                  | 40      |
| `shared/src/`          | 2026-03-15 | 2026-07-25   | 25d                  | 23      |
| `.claude/skills/`      | 2026-03-15 | 2026-07-22   | 28d                  | 20      |
| `server/src/config/`   | 2026-03-15 | 2026-07-22   | 28d                  | 15      |
| `server/src/services/` | 2026-03-15 | 2026-05-13   | **98d**              | 42      |
| `client/src/`          | 2026-03-15 | 2026-05-06   | **105d**             | 39      |

Only two source files carry the recent work: `server/src/routes/hooks.ts` and `shared/src/angeleye.ts` (both 2026-07-25). Everything else in the ingestion path is materially older:

| File                                                  | Last touched   | Age      | What it owns                            |
| ----------------------------------------------------- | -------------- | -------- | --------------------------------------- |
| `server/src/routes/hooks.ts`                          | 2026-07-25     | 25d      | hook ingest, EVENT_MAP                  |
| `shared/src/angeleye.ts`                              | 2026-07-25     | 25d      | event/registry types                    |
| `shared/src/constants.ts`                             | 2026-06-08     | 72d      | `ANGELEYE_EVENTS` list                  |
| `server/src/services/sessions.service.ts`             | 2026-05-13     | **98d**  | JSONL read/write, path encoding, backup |
| `server/src/services/classifier.service.ts`           | 2026-05-06     | **105d** | session classification                  |
| `server/src/services/sync.service.ts`                 | 2026-05-06     | **105d** | sync orchestration                      |
| `server/src/services/teammate-detection.service.ts`   | 2026-05-06     | **105d** | subagent detection                      |
| `server/src/services/backfill.service.ts`             | **2026-03-28** | **144d** | **transcript JSONL parser**             |
| `server/src/services/correlator.service.ts`           | 2026-03-28     | 144d     | turn correlation                        |
| middleware, health, api utils, socket hooks, AppShell | 2026-03-15     | **157d** | RVETS scaffolding                       |

**The lens this implies**: `hooks.ts` was maintained against the moving platform and is in good shape. `backfill.service.ts` (144d) and `sessions.service.ts` (98d) were not, and they are precisely the files that parse and locate Claude Code's own JSONL files. That is where the confirmed bugs are.

**One more age fact that reframes everything below**: AngelEye's own runtime data stops at **2026-08-01T05:07:13**. Nothing has been ingested for 18 days.

---

## 2. Axis 1 — stale assumptions about Claude Code that are now factually wrong

Ranked most severe first.

### A1-1 — The collection pipeline has been dark for 18 days, and it looks identical to healthy · **CONFIRMED** · CRITICAL

`~/.claude/settings.json` registers 29 command hooks, each `curl -s -X POST … http://localhost:5051/hooks/<Event> || true`. Nothing is listening on 5051 (`lsof -nP -i :5051` → empty). The last row in `~/.claude/angeleye/registry.json` has `last_active: 2026-08-01T05:07:13`.

**Failure scenario, currently live**: every session forks 29 curl processes into a closed port. `|| true` swallows the connection refusal, so Claude Code records `hook_success` for each — 145 such attachments appear in the last 120 transcripts, including today's. From inside AngelEye, "no new sessions" and "collection is dead" produce byte-identical evidence: an empty query result.

Anchors: `server/src/routes/hooks.ts:120` (`/api/hooks/supported`), `~/.claude/settings.json` hooks block.

This is the exact risk already specced in `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md` ("a dead server meaning 29 curl forks into the void per session"). Not re-litigated here — recorded only because it has now been true for 18 continuous days, and because it silently invalidates any "we have no data on X" conclusion drawn from AngelEye since 2026-08-01.

### A1-2 — `~/.claude/projects/` path encoding is wrong for any path containing a `.` · **CONFIRMED** · HIGH

AngelEye encodes a cwd to a project-dir name with `expandedDir.replace(/\//g, '-')` — slashes only.

- `server/src/services/sessions.service.ts:61` (`writeSessionName`)
- `server/src/services/sessions.service.ts:105` (`getRawTranscript`)
- `server/src/services/sessions.service.ts:153` (`backupUpstreamJSONL`)
- `server/src/services/teammate-detection.service.ts:36`

Claude Code 2.1.235 replaces **every** non-alphanumeric character, dots included:

```
cwd            /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
Claude Code →  -Users-davidcruwys-dev-clients-supportsignal-app-supportsignal-com-au   (exists on disk)
AngelEye    →  -Users-davidcruwys-dev-clients-supportsignal-app.supportsignal.com.au   (does not exist)
```

**Blast radius, measured**: 386 registry rows across 48 distinct `project_dir` values contain a dot — 238 of them SupportSignal's `app.supportsignal.com.au`, 95 `prompt.supportsignal.com.au`, plus `appydave.com` paths.

**Failure scenarios**, all silent:

1. `writeSessionName` hits the `access()` guard, logs `writeSessionName: JSONL not found, skipping`, and returns. Renaming a SupportSignal session from AngelEye **never writes back** — no error surfaces to the caller.
2. `getRawTranscript` skips the upstream branch and falls through to the archive copy, losing thinking blocks and attachments — the exact content the upstream branch exists to fetch.
3. `backupUpstreamJSONL` logs `upstream JSONL not found` and backs up nothing. When Claude Code purges that JSONL (see A1-10), the transcript is **permanently lost** for every dotted project. Note the log line for this case is shared with the genuine "already purged" case, so the logs cannot distinguish the bug from the expected condition.

**Why no test caught it**: `server/src/services/angeleye-data.test.ts:330,391` re-derives the expected path with the _same_ expression under test — `projectDir.replace(/\//g, '-')` — against dot-free fixture paths (`/Users/testuser/dev/myproject`). The test asserts that the code agrees with itself, never that it agrees with Claude Code. It will stay green through any fix or any further breakage.

This bug predates the platform drift — it is an inception-era assumption (`sessions.service.ts` unchanged in this respect since March) that was always wrong and has simply never been caught.

### A1-3 — `progress` entries no longer exist · **CONFIRMED** · HIGH

`CLAUDE.md` states: _"`progress` entries are the most numerous type (~75% in hook-heavy sessions) — skip when parsing for conversation content."_

Measured across **all 456 live JSONL files, 136,447 entries: zero `progress` entries.**

Current entry-type distribution (last 250 recent files):

| Type              | Count  | Type                     | Count   |
| ----------------- | ------ | ------------------------ | ------- |
| `assistant`       | 21,633 | `custom-title`           | 1,721   |
| `user`            | 12,200 | `agent-name`             | 1,718   |
| `attachment`      | 6,578  | `ai-title`               | 1,619   |
| `last-prompt`     | 3,539  | `file-history-snapshot`  | 1,023   |
| `permission-mode` | 3,126  | `queue-operation`        | 990     |
| `mode`            | 3,120  | `file-history-delta`     | 691     |
| `bridge-session`  | 3,005  | `atis-latch`             | 123     |
| `system`          | 2,221  | `pr-link` / `frame-link` | 55 / 17 |

`system` subtypes: `stop_hook_summary` (1,006), `turn_duration` (821), `away_summary` (331), `local_command` (36), `informational` (25), `compact_boundary` (2).

**Failure scenario**: any future parser written from CLAUDE.md filters for a type that never arrives, or budgets for a 75% volume that is now `assistant`+`user`+`attachment`. No current code path breaks — `backfill.service.ts` matches on `user`/`assistant` positively — so this is a documentation-driven trap rather than a live bug. It is high-ranked because CLAUDE.md is always-on context.

### A1-4 — `tool_use.result` is never populated; the entire tool response is discarded · **CONFIRMED** · HIGH

`server/src/routes/hooks.ts:203-205` reads `body.tool_result` as a string.

Claude Code sends **`tool_response`**, and it is an object. The binary's own hook documentation says `"tool_response": { "success": true }  // PostToolUse only`. The audit log records `tool_response` as an unexpected field **20,892 times**; `tool_result` appears nowhere.

**Verified downstream**: across 400 recent session files, **0 of 17,108** `tool_use` events have `.result` set.

There is no fallback: `tool_use` is in `ORIGINAL_EVENTS` (`hooks.ts:224-232`), so the raw-payload capture at `hooks.ts:243-249` is skipped for it. The tool response is dropped at ingest and is unrecoverable from AngelEye's store.

Two further PostToolUse fields are lost the same way: `duration_ms` (20,198 observations, first seen 2026-06-07) and `effort` (19,343 observations) — per-tool latency and reasoning-effort telemetry that arrives on every single tool call and is thrown away.

**Failure scenario**: any query of the form "what did that Bash command return" or "how long do Edit calls take in project X" returns null for every row, indistinguishable from "that session had no tool calls".

### A1-5 — `stop.reason` is never populated · **CONFIRMED** · HIGH

`server/src/routes/hooks.ts:209-211` reads `body.reason` on `stop`/`subagent_stop`. Verified: **0 of 191** stop events have `.reason`.

The Stop payload in 2.1.235 carries `background_tasks` (array), `session_crons` (array), `effort` (object), `prompt_id` (string) — and no `reason`. `reason` is a **SessionEnd** field (780 audit observations). The sibling read on the same line pair, `last_assistant_message` (`hooks.ts:212-214`), does work: 191/191 populated.

All four of the real Stop fields are discarded — `stop` is in `ORIGINAL_EVENTS`, so no payload capture. `background_tasks` and `session_crons` in particular describe work that outlived the turn, which is directly on AngelEye's stated subject matter.

### A1-6 — `prompt_id`: the turn-correlation key the platform now supplies, dropped on the events that need it · **CONFIRMED** · MEDIUM-HIGH

Since **2026-07-24**, Claude Code stamps `prompt_id` on 14 hook events (`PreToolUse` 6,096 obs, `PostToolUse` 5,956, `CwdChanged` 815, `UserPromptSubmit` 508, `SubagentStop` 538, `Stop` 529, and 8 more).

For the 24 non-original events it survives inside `event.payload`. For the 7 in `ORIGINAL_EVENTS` — `user_prompt`, `tool_use`, `stop`, `session_start`, `session_end`, `subagent_start`, `subagent_stop` — it is dropped entirely (`hooks.ts:224-249`).

**Failure scenario**: `server/src/services/correlator.service.ts` (untouched since 2026-03-28) hand-rolls turn grouping from timestamps, while the platform now hands over an exact turn key on every hook — but AngelEye discards it on precisely the prompt/tool/stop triple a turn is made of.

### A1-7 — `ai-title` and `session_title` are invisible to AngelEye · **CONFIRMED** · MEDIUM-HIGH

Claude Code now generates an LLM session title and persists it as a `type: "ai-title"` JSONL entry:

```json
{
  "type": "ai-title",
  "aiTitle": "Transfer downloaded files between computers",
  "sessionId": "a56202fe-…"
}
```

**1,619 such entries** in the live corpus. It also ships the title on hook payloads as `session_title` — `SessionStart` (152 obs, first 2026-06-15) and `UserPromptSubmit` (411 obs, first 2026-06-09).

AngelEye reads neither:

- `server/src/services/backfill.service.ts:15` — `extractCustomTitle` matches only `type === 'custom-title'`.
- `server/src/services/sessions.service.ts:87-97` — `KNOWN_UPSTREAM_TYPES` has no `ai-title`, so it is logged as an unknown type and otherwise ignored (191 such observations in `schema-observations.jsonl`).
- `session_title` lands on two `ORIGINAL_EVENTS` and is stripped.
- `grep -rn "ai-title\|aiTitle\|session_title" server/src client/src shared/src .claude/skills` → **no matches anywhere.**

**Failure scenario**: AngelEye runs an LLM enrichment loop (`.claude/skills/angeleye-enrichment-loop/`, `enrich-subtypes/`) to derive what a session was about, while Claude Code has been handing it a free, already-computed title per session since 2026-06-07. Sessions display as unnamed or fall to heuristics when a title exists on disk.

Note the write-back mechanism itself is **still correct**: `custom-title` + `agent-name` pairs are alive and current (1,721 / 1,718 in the live corpus, same shape as `sessions.service.ts:73-74`). `/rename` has not changed. This finding is about a _new_ signal not being read, not about the existing one breaking.

### A1-8 — Accumulating unknown JSONL entry types, including a session-identity concept AngelEye has no model for · **CONFIRMED** · MEDIUM

`KNOWN_UPSTREAM_TYPES` (`sessions.service.ts:82-92`) knows 10 types. AngelEye's own discovery log has been recording the gap:

| Unknown type                                 | Observations | First seen     | What it is                                |
| -------------------------------------------- | ------------ | -------------- | ----------------------------------------- |
| `mode`                                       | 246          | 2026-06-07     | permission/interaction mode marker        |
| `ai-title`                                   | 191          | 2026-06-07     | see A1-7                                  |
| `queue-operation`                            | 108          | 2026-06-07     | queued-prompt enqueue/dequeue             |
| `bridge-session`                             | 71           | **2026-07-24** | session bridged to a remote/cloud session |
| `file-history-delta`                         | 42           | 2026-07-24     | per-file edit delta + backup pointer      |
| `agent-setting`, `agent-color`, `frame-link` | 5            | 2026-06→07     | agent config; published-artifact link     |

`bridge-session` is the significant one — 3,005 entries in the live corpus, carrying `bridgeSessionId: "cse_01WbMf…"` and `lastSequenceNum`. It means one local `sessionId` is paired to a remote Claude session (Remote Control / claude.ai). AngelEye's registry models one flat `session_id` per row and has no concept of a bridged pair.

**Failure scenario**: a session driven partly from the phone or claude.ai appears in AngelEye as an ordinary local session with a gap in it; the remote half is neither linked nor countable. `pr-link` and `frame-link` are similarly free outbound artifacts (PR number + URL, artifact URL) that AngelEye could attribute to a session and currently discards.

### A1-9 — Transcript backfill only parses string-shaped user content · **CONFIRMED** · MEDIUM

`server/src/services/backfill.service.ts:63` — `if (typeof content === 'string' && content.length > 0)`.

Measured on 150 recent files: `user.message.content` is an **array 8,244 times vs a string 785 times** (91% array). Block types inside the arrays: `tool_result` 8,024, `image` 288, `text` 234.

Most of the array traffic is `tool_result` and correctly skipped. The loss is the **234 `text` blocks** — genuine user prompts that arrived alongside an image or attachment, which never become `user_prompt` events.

Related, same file: `last-prompt` (3,539 entries) is a first-class entry type carrying the user's prompt verbatim with a `leafUuid`, and is unread. It is a strictly better source for `first_real_prompt` than reconstructing from `type: "user"` entries.

**Failure scenario**: a session opened by pasting a screenshot plus a question backfills with zero user prompts, then trips the `hasNoUserPrompt` silent-session filter at `hooks.ts:340-344` and is marked `is_junk: true` / `meta.silent_session` — a real working session classified as noise.

### A1-10 — `~/.claude/projects/` retention is far shorter than documented · **CONFIRMED** · MEDIUM

`known-issues.md` → `upstream-jsonl-prune` records this as open with "cause unknown". It has got materially worse and is now quantified:

- **456** JSONL files remain on disk; oldest mtime **2026-07-21** — a ~30-day window.
- **44 of 75** project directories are completely empty.
- AngelEye's registry holds **18,304** rows; its raw-JSONL backup holds **760**.

Combined with A1-2, the dotted-path projects (386 rows, SupportSignal included) have **never** been backed up and their upstream JSONLs are already gone.

**Failure scenario**: `getRawTranscript` returns the archive fallback (no thinking blocks, no attachments) for anything older than ~30 days, and returns `null` for the 17,500+ registry rows that were never hook-ingested. Any retrieval feature promising "the full transcript" quietly degrades by age.

### A1-11 — The hook-event counts in the docs are wrong; the code is right · **CONFIRMED** · MEDIUM

Determined from the installed binary. Claude Code 2.1.235 defines exactly **31** hook events (canonical array extracted from the 2.1.235 bundle):

```
PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, UserPromptSubmit,
UserPromptExpansion, SessionStart, SessionEnd, Stop, StopFailure, SubagentStart, SubagentStop,
PreCompact, PostCompact, PermissionRequest, PermissionDenied, Setup, TeammateIdle, TaskCreated,
TaskCompleted, Elicitation, ElicitationResult, ConfigChange, WorktreeCreate, WorktreeRemove,
InstructionsLoaded, CwdChanged, FileChanged, DirectoryAdded, MessageDisplay
```

Diffed against `EVENT_MAP` (`server/src/routes/hooks.ts:25-66`): **31 entries, exact match, zero drift in either direction.** No event is missing and none is invented. `HOOK_REGISTRATION_EXCLUSIONS` (`hooks.ts:73-93`) removes 2, so `register` = **29**. `~/.claude/settings.json` has exactly **29** hooks registered, with `WorktreeCreate` and `MessageDisplay` correctly absent.

So the true numbers are **31 known / 29 wired**. Where the docs say otherwise:

| Location                                              | Says                                                                | Correct                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| `CLAUDE.md:30`                                        | "28 events wired, not 30"                                           | 29 wired, 31 known — **both numbers wrong** |
| `docs/architecture/hook-transport.md:224`             | "AngelEye handles **30 hook events** … **28 are wired**"            | stale v2.1.167-era text                     |
| `docs/architecture/hook-transport.md:154`             | "29 events: 31 canonical … minus WorktreeCreate and MessageDisplay" | **correct** — same file contradicts itself  |
| `~/.claude/skills/angeleye-install/SKILL.md:22,81,94` | 31 known / 29 registered                                            | **correct**                                 |

Version citations (`v2.1.219`, `v2.1.167`) are stale against 2.1.235 but the counts they carry are still accurate — no hook event has been added or removed between 2.1.219 and 2.1.235.

**Failure scenario**: a future session reads CLAUDE.md, believes 2 events are unaccounted for, and either re-registers `WorktreeCreate` (which breaks worktree creation — see `worktree-create-hook-unsafe`) or spends a session hunting a discrepancy that does not exist.

### A1-12 — `shared/src/constants.ts` missed the 31st event · **CONFIRMED** · LOW-MEDIUM (latent)

`shared/src/constants.ts` `ANGELEYE_EVENTS` has **30** entries; `shared/src/angeleye.ts` `AngelEyeEventType` has **31**. Missing: `directory_added`. The 2026-07-25 `DirectoryAdded` commit updated `hooks.ts` and the union type but not the constants object.

Severity is capped because `grep -rn "ANGELEYE_EVENTS" server/src client/src` returns **no consumers** — the constant is dead code. It is listed because it is the same parallel-list problem `/api/hooks/supported` was built to eliminate, surviving in a file the endpoint does not feed.

### A1-13 — `system/turn_duration` carries no auto-slug · **CONFIRMED** · LOW

`CLAUDE.md` states: _"Auto-slug (`witty-painting-plum` style) lives in `system/turn_duration` entries."_

Real shape in 2.1.235:

```json
{
  "parentUuid": "…",
  "isSidechain": false,
  "type": "system",
  "subtype": "turn_duration",
  "durationMs": 40218,
  "messageCount": 19,
  "timestamp": "2026-08-02T02:22:59.551Z",
  "uuid": "…",
  "isMeta": false,
  "userType": "external",
  "entrypoint": "cli",
  "cwd": "…",
  "sessionId": "…",
  "version": "2.1.220",
  "gitBranch": "main"
}
```

No slug field. A scan for slug-shaped keys (`slug`, `autoSlug`, `title`) across 200 files found none on any entry type. The auto-slug appears to have been superseded by `ai-title` (A1-7). No code depends on the claim — the impact is a doc that will send someone to the wrong entry type.

### A1-14 — Subagent detection is still correct, but its documented rate and status are stale · **CONFIRMED** · LOW

The mechanism holds. `server/src/services/teammate-detection.service.ts:23` matches `/<teammate-message\s+teammate_id="([^"]+)"/`, and in the live corpus that wrapper appears in **38 of 456 files (8%)**, 592 occurrences. The alternatives remain absent exactly as audited in May: `isSidechain: true` → **0** lines; `agent-*.jsonl` → **0** files.

Two `known-issues.md` rows are now **wrong**, not merely open:

- **`subagent-detection`** ("not yet at ingest") — `hooks.ts:269` calls `detectTeammate` at `session_start` and `hooks.ts:308` re-detects at `stop`. It _is_ at ingest.
- **`session-kind-field`** ("not yet added to schema") — `shared/src/angeleye.ts:302-303` defines `session_kind` and `teammate_id`, and the registry is populated: 606 `main`, 102 `subagent`, 13 `subprocess`.

The **33% (454/1,378)** figure quoted in both `known-issues.md` and `CLAUDE.md` is now **8%** — that is a corpus-composition change (the old raw corpus is largely purged), not a detection regression, but the number should not be quoted as current.

### A1-15 — Newer agent-stream wrapper tags AngelEye cannot see · **SUSPECTED** · LOW

Claude Code 2.1.235 defines a set of stream wrapper tags alongside `teammate-message`:

```
tool-call, user-message, tool-result, turn-ended, guidance-loaded, skills-discovered, coordinator-task
```

None appear anywhere in this machine's 456-file corpus (only `teammate-message`, 592×). `coordinator-task` in particular suggests a coordinator/teammate flow whose transcripts would not carry the single tag `teammate-detection.service.ts` matches on.

Marked SUSPECTED: the tag list is confirmed present in the binary, but I have no observed instance of these tags in a real transcript and therefore cannot say what a session using them looks like.

### A1-16 — Eight mapped events have never been ingested, and I cannot tell why · **AMBIGUOUS**

Full census of hook-sourced events across `~/.claude/angeleye/sessions/` (8,209 events) **and** `archive/` (61,000+ events), March→August:

Never observed: `directory_added`, `elicitation`, `elicitation_result`, `file_changed`, `message_display`, `setup`, `worktree_create`, `worktree_remove`.

- `worktree_create`, `message_display` — deliberately not registered. Zero is **correct**.
- `directory_added` — registered 2026-07-25, pipeline died 2026-08-01. A 7-day window against a rare trigger (`/add-dir`). **Untested in practice.**
- `elicitation`, `elicitation_result`, `file_changed`, `setup`, `worktree_remove` — registered since March or June, **zero observations in five months**.

For those five, "David never triggers this" and "the registration or the event name is broken" produce identical evidence from here. `FileChanged` returning zero across five months of heavy Edit/Write usage is the one I would treat as suspicious rather than expected — but I did not confirm either way. See §5.

---

### A1-17 — A strip list asserted "already first-class" for two fields that were promoted nowhere · **CONFIRMED · FIXED 2026-08-23** · MEDIUM-HIGH

`transcript_path` and `permission_mode` are documented common fields — Claude Code sends them on **every** hook event. Both sat in `STRIP_FROM_PAYLOAD` in `hooks.ts` under the comment `// envelope — already first-class on the event`. Neither was ever read into `event`. Neither existed on `AngelEyeEvent`. They appeared nowhere else in the codebase except the schema auditor's ignore list.

So the strip list removed them from the residual payload on the strength of a promotion that did not exist, and every event dropped them silently. **Measured 0 / 17,896 stored session files.**

**Failure scenario**: A1-2 (the dot-in-path encoding bug) exists because AngelEye re-derives `~/.claude/projects/<encoded>/` from `cwd`. `transcript_path` is the platform handing over that exact path, correct by construction, on every event — and AngelEye was throwing it away on arrival while hand-rolling a derivation that was already known to be wrong.

**Fix**: both promoted to first-class fields on `AngelEyeEvent` and read in the hook handler; they stay in the strip list so the residual does not duplicate them, and the comment is now true. Additive only — no stored record changes shape, and `last_message` is untouched.

**Verified on real state, all event classes including Stop.** `598df1f` was committed while a real Stop event had not yet fired, so its message says the Stop path was unit-tested only. That caveat is now closed: a live Stop at `2026-08-23T12:01:25Z` carries `transcript_path` and `permission_mode: "bypassPermissions"` alongside `last_message`, on the same session that made the change. Also confirmed live on `tool_use`, `pre_tool_use`, `post_tool_batch`, `cwd_changed` and `user_prompt` — the fields ride the shared envelope path, so coverage is all 31 events, not just Stop.

**The general lesson — a rename or a drop at the normaliser makes the stored copy unable to answer questions the raw source can.**

This is the failure mode AngelEye exists to catch, so it is worth stating flatly:

- The trigger for this investigation was AngelEye's rename of `last_assistant_message` → `last_message`. That rename turned out to be **cosmetic** — the value is preserved and 557 stored events carry it. It is kept, because renaming it now would orphan those rows to fix nothing.
- But the rename is what made the stored copy _look_ untrustworthy, and looking closer found two fields genuinely being dropped one line below it. **The cosmetic defect was a true signal about the lossy one.**
- The structural guard is the residual-payload capture added in `6c2808a`: unclaimed fields survive by default, so a new upstream field is retained without a code change. **Every name added to `STRIP_FROM_PAYLOAD` opts out of that guard** — so a name in the strip list that is not also read into `event` is a silent, permanent drop. That is the invariant to check, and the code comment now says so.
- A field is only "preserved" if you can read it back off a stored record. Reading the code and seeing an assignment is not the same check — here the code _said_ first-class and the data said absent.

---

## 3. Axis 2 — structural shape the platform now does better

### A2-1 — Hook installation mutates the user's `settings.json` instead of shipping a plugin

`angeleye-install` writes 29 curl hooks directly into `~/.claude/settings.json`. Claude Code now supports plugin-supplied hooks via `hooks/hooks.json`, and **5+ plugins already installed on this machine use it** (`addy-agent-skills`, `understand-anything`, `ralph-loop`, `hookify`, `claude-security`).

Evidence of the cost: **8 `settings.json.bak*` files** in `~/.claude/`, two of them named `…bak-2026-07-25-pre-directoryadded` and `…bak-20260607-angeleye` — a hand-rolled backup regime around a file the platform now lets you not touch.

Already designed in `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`. Recorded here only as _still unbuilt_, with A1-1 as live evidence of what the gap costs.

### A2-2 — The HTTP-hook rejection is 122 days old and untested since

`docs/architecture/hook-transport.md:32,52` rejects `type: "http"` hooks because `SessionStart` did not deliver — tested on **v2.1.89, 2026-05-13**. Current is 2.1.235. **SUSPECTED**: an HTTP transport would remove 29 curl forks per session and is the natural fix for A1-1's fork cost, but I did not re-test it (that would mean writing to `settings.json` and starting a listener, both out of scope for this pass).

### A2-3 — The platform now supplies three things AngelEye hand-rolls

| AngelEye machinery                                    | Platform primitive since                          | Anchor |
| ----------------------------------------------------- | ------------------------------------------------- | ------ |
| LLM enrichment to derive session meaning              | `ai-title` (2026-06-07), `session_title` on hooks | A1-7   |
| `correlator.service.ts` timestamp-based turn grouping | `prompt_id` on 14 events (2026-07-24)             | A1-6   |
| `first_real_prompt` reconstruction from `type:"user"` | `last-prompt` entry type (3,539 in corpus)        | A1-9   |

### A2-4 — `/api/hooks/supported` is the right pattern, incompletely applied

The endpoint (`hooks.ts:120-133`) exists specifically to kill parallel event lists, and `angeleye-install` correctly consumes its `register` array. But `shared/src/constants.ts` was never wired to it and has already drifted (A1-12), and two docs carry hand-maintained counts that are now wrong (A1-11).

### A2-5 — `.claude/` layout is current; nothing to do here

Checked against 2.1.235 conventions and found **healthy**: `.claude/skills/*/SKILL.md` with `name` + `description` frontmatter (current form), `.claude/rules/*.md` with `paths:` frontmatter (current directory-scoped-rules form), no legacy `.claude/commands/` directory, no stale agent conventions.

One loose end: `.claude/skills/angeleye-context.md` sits directly in `skills/` rather than in a skill directory, so it will never load as a skill. It is either a reference file in the wrong place or a skill that has silently never fired.

---

## 4. Axis 3 — code written defensively for weaker models

Genuinely thin. The skills are lean and mostly read as instructions rather than as guardrails; there is no retry scaffolding, no verifier-agent pattern, no multi-step decomposition around model calls anywhere in `.claude/`. Two items only, both deletions:

- **`.claude/rules/mochaccino-index.md:5-7`** — _"**EVERY TIME** you create, rename, move, or delete any design … you MUST update `client/src/views/MockupsView.tsx` before finishing. This is NON-NEGOTIABLE."_ Three escalating emphasis markers to enforce a hand-maintained registry. The rule itself is the smell: a glob over `.mochaccino/designs/` removes the need for the instruction entirely.
- **`.claude/skills/angeleye-enrichment-loop/SKILL.md`** — 11 imperative restatements of one hard boundary ("never modify code") across 236 lines. The boundary is right; stating it once is enough.

Not flagged: `enrich-subtypes` (4 markers / 278 lines), `angel` and `app-idea` (zero). These are fine as-is.

---

## 5. What these checks did **not** establish

Stated explicitly, because several of the results above are ambiguous by construction.

1. **The 18-day gap is not evidence about Claude Code.** With the server down since 2026-08-01, every "AngelEye shows no X" observation means _no ingestion_, not _no X_. Nothing in §2 was inferred from an absence in AngelEye's store; the payload findings all come from the audit log written **before** the gap (through 2026-08-01) and from live JSONLs written **after** it. But any future query against AngelEye covering 2026-08-01→now is measuring a dead pipeline.

2. **The audit log only reports _unexpected_ fields, never _missing expected_ ones.** `hook-schema-surprises.jsonl` flags a field when it is present and not in `HOOK_SCHEMA_EXPECTATIONS`. It cannot tell you that `tool_result` or `stop.reason` stopped arriving — those are in the expectation set, so their absence is silent. A1-4 and A1-5 were therefore confirmed a second way, by counting populated fields on 24,834 stored events. Any _other_ expected-field-vanished bug of the same shape would still be invisible to that log and was not searched for exhaustively.

3. **"Never ingested" ≠ "broken" for the eight events in A1-16.** For `elicitation`, `elicitation_result`, `file_changed`, `setup`, `worktree_remove` I cannot distinguish "never triggered by this user" from "registered but non-functional". Confirming would require triggering each event against a live listener — out of scope for a no-restart survey. `directory_added` specifically is **registered but has never once fired**; the recent commit adding it is unverified in practice.

4. **The event list came from string extraction on a minified binary, not from a schema.** The 31-event array is unambiguous (it is a single contiguous quoted array, and it round-trips exactly against `EVENT_MAP`), but I read _names_, not payload schemas. Payload-shape findings rest on observed data, not on the binary.

5. **Payload evidence is skewed to what David actually does.** `PostToolUse` has 20,892 observations; `TaskCompleted` has 41 and `PermissionDenied` has 7. Low-traffic events could have drifted in ways too rare to appear. `PostCompact`/`PreCompact` have not been observed since **2026-06-17** — that is two months of no data on the compaction events, and I cannot say whether their payloads have changed since.

6. **Single machine, single user.** Everything is from Roamy. The M4 Mini's `~/.claude/` was not inspected; `hook-transport.md` records M4 holding zero registered hooks for ~4 weeks, and this pass says nothing about whether that is still true.

7. **The client was not exercised.** `client/src/` (105 days stale) was reviewed by reading only. With the server down I could not load `/diagnostics`, so its live counts and the `OPEN_ISSUES` rendering are unverified. `~/.claude/angeleye/diagnostics-snapshot.json` was not refreshed (`npm run audit:registry` would have written to the user's data dir).

8. **No test run, no build.** `npm test` / `npm run typecheck` were not executed. A1-12 (`constants.ts` missing `directory_added`) is a type-level claim verified by reading, not by compiling.

---

## 6. Three things most worth fixing first

1. **A1-2 — the dot-in-path encoding bug** (`sessions.service.ts:61,105,153`; `teammate-detection.service.ts:36`). It is the only finding that causes **permanent, ongoing data loss**: 386 registry rows including all of SupportSignal have never had their upstream JSONL backed up, and Claude Code purges those files at ~30 days. Every day it stands, more transcripts become unrecoverable.

2. **A1-1 — make the collection layer survive a dead dashboard** (already specced in `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`). Eighteen days of total silence that reads as "quiet week" is the failure mode that invalidates every other measurement in this repo — and it will recur, because nothing currently distinguishes the two states.

3. **A1-4 + A1-5 + A1-6 — stop discarding the payloads on the seven `ORIGINAL_EVENTS`** (`hooks.ts:203-249`). `tool_response`, `duration_ms`, `effort`, `prompt_id`, `background_tasks`, `session_crons` all arrive on every session and are dropped by a 2026-03-era carve-out that predates their existence. Cheapest fix of the three, largest gain in what AngelEye can answer.

**Also worth doing at near-zero cost**: correct `CLAUDE.md` on the three factual claims it currently gets wrong — the hook counts (A1-11), `progress` being the dominant entry type (A1-3), and the auto-slug living in `system/turn_duration` (A1-13) — and re-status the two `known-issues.md` rows that have since been implemented (A1-14). CLAUDE.md is always-on context, so each wrong assertion costs a future session real time.
