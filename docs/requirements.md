# AngelEye — Requirements

**App name**: AngelEye
**Name rationale**: "Angelic" sounds like "Agentic" — the paradigm it watches. Eye = instrument of observation. All-seeing, always watching, messenger. Three layers of meaning.
**Stack**: AppyStack (React 19 + Vite 7 + Express 5 + TypeScript + Socket.io)
**Data store**: JSONL flat files (no database — see Data Architecture)
**Config location**: `~/.claude/angeleye/`
**Status**: Operational — v2 schema, 924 sessions indexed

---

## What It Is

A session intelligence layer for agentic AI workflows. AngelEye watches everything happening across Claude Code sessions, surfaces patterns, publishes context to image generation tools, and lets you query your own activity history.

It is **not** an ops dashboard. It is not a log viewer. It is a live performance instrument for a creator who works across many concurrent agent sessions.

---

## The Four Jobs

### 1. Observer (live view) — BUILT

Watch what agents are doing across sessions in near real-time. Glanceable from a second monitor while recording video. Answers: "what is happening right now, and where?"

**What's built**: Session list with focus panel, All/Starred/Named filters, workspace badges on session rows, session type legend with tooltips, prompt expansion on click, v2-linen UI design. Scales to 690+ sessions (pagination backlog item B023 for 2000+).

### 2. Context Publisher — PARTIALLY BUILT

As agent workflows run — BMAD sessions, Mary → Bob handoffs, Ralph loops — accumulated context gets packaged and sent to image generation (Nano Banana / FliDeck) on demand or triggered automatically at natural boundaries (Stop events, agent handoffs).

**What's built**: `/angeleye:context` skill assembles session context blocks for Claude analysis windows.
**Backlog**: `/angeleye:publish` (Nano Banana / FliDeck integration) is B011.

### 3. Session Archive + Query — BUILT

Interrogatable history. Filter by tool type, event type, workspace, tag. Chain events into a Claude window for analysis. Long-running memory emerges when sessions share tags — same project over time.

**What's built**: Backfill pipeline scans `~/.claude/projects/`, extracts session shapes from JSONL transcripts, classifies sessions. 924-session analysis index with v2/v3 schema. Delta tracking via `last-sync.json`. Unified Sync button runs backfill + classify in one action. `/rename` names extracted from `custom-title` JSONL entries during backfill.

---

## Data Sources

### Source 1: Claude Code Hook Events (real-time, interactive sessions)

Claude Code fires 25 hook events total (as of v2.1.83). AngelEye subscribes to all 25 (expanded in Wave 11 from the original 7). All delivered as JSON via stdin to command hooks.

**Common fields on every event**: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `agent_id`, `agent_type` (v2.1.69+)

**`$CLAUDE_SESSION_ID`** is also available as an environment variable in all command hooks (v2.1.9+) — no stdin parsing needed for session identification.

#### v1 Hooks (subscribed)

| Hook               | Key payload                                                           | Why we want it                             |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| `SessionStart`     | session_id, cwd, project_dir                                          | Register session in registry               |
| `UserPromptSubmit` | user_prompt                                                           | Capture intent                             |
| `PostToolUse`      | tool_name, tool_input, tool_result, tool_use_id                       | Core activity stream                       |
| `Stop`             | reason, stop_hook_active, transcript_path, **last_assistant_message** | Chapter boundary + context publish trigger |
| `SessionEnd`       | transcript_path, reason                                               | Rotate hot file, mark ended                |
| `SubagentStart`    | agent_type                                                            | BMAD agent handoff — Mary starts           |
| `SubagentStop`     | reason, last_assistant_message                                        | BMAD agent handoff — Mary finishes         |

**`last_assistant_message`** (v2.1.47) — Stop and SubagentStop hooks now include the final response text directly. AngelEye can capture this for context publishing without parsing the transcript file.

**Stop hook guard**: check `stop_hook_active` flag — exit immediately if set. Prevents infinite loops when Claude continues after Stop.

#### v2 Hooks (future — multi-agent awareness)

| Hook            | When                                   | Use for                                     |
| --------------- | -------------------------------------- | ------------------------------------------- |
| `TeammateIdle`  | Agent teammate finishes and waits      | Detect idle teammates in orchestrated flows |
| `TaskCompleted` | Task completed in multi-agent workflow | Task-level analytics, verification triggers |
| `PreCompact`    | Before context compaction              | Preserve critical context                   |
| `PostCompact`   | After context compaction               | Recovery tasks                              |

**Full hook reference**: `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md` — 25 events, all schemas, all versions.

**Tool summarisation before storage** (not raw):

- Bash → command only (not output)
- Write → file path + line count (not content)
- Read → file path only
- Edit → file path + lines changed
- MCP tools → split `tool_name` on `__` → `{server, tool}`

### Source 2: Native JSONL Session Transcript (backup/query source)

Location: `~/.claude/projects/<project-dir>/session-<id>.jsonl`
Written incrementally during session. Five entry types: `user`, `assistant`, `summary`, `system`, `queue-operation`.

**Critical**: Claude streams assistant responses — same message appears multiple times with progressively more content. Parser must deduplicate with `seenKeys` set. Last occurrence wins.

Tool calls in `assistant` entries as `tool_use` blocks. Results in subsequent `user` entries as `tool_result` blocks, matched by `tool_use_id`.

### Source 3: Stream-JSON subprocess output (deferred — multi-format ingestion)

For agents run programmatically (Paperclip, OpenClaw, KyberBot, future automated agents):
`claude --print - --output-format stream-json`

Produces same logical events (session_id, tool calls, tokens, cost) via a different mechanism.

**Multi-format ingestion architecture**: normalised internal event format with adapters:

```
Interactive session  →  hooks adapter      ─┐
Paperclip agent      →  stream-json adapter ─┼→  normalised event  →  JSONL hot file  →  UI
KyberBot/OpenClaw    →  their adapter      ─┘
```

AngelEye's server, UI, and query layer never know which adapter produced an event. Adapters are the extension point for future agent runtimes. (Deferred — B013.)

---

## Data Architecture

**No database. JSONL flat files only.**

### Hot files

```
~/.claude/angeleye/
  registry.json              ← shared index of all active sessions
  sessions/
    session-abc123.jsonl     ← one per active session
    session-def456.jsonl
  archive/
    session-abc123.jsonl     ← rotated here at SessionEnd
  workspaces.json            ← named workspace configs
  last-sync.json             ← delta tracking (last backfill timestamp per project dir)
```

### Analysis layer

```
~/dev/ad/brains/angeleye/analysis/
  session-index.jsonl        ← 924-entry analysis index (v2/v3 schema)

<app-root>/docs/planning/
  angeleye-analysis-1/       ← analysis campaign: wave index files, findings, scripts
```

Session shapes are precomputed by `compute-session-shape.py` during backfill — event counts, tool distributions, prompt fingerprints — and stored in the analysis index for classification.

### Registry format

```json
{
  "abc123": {
    "session_id": "abc123",
    "project": "supportsignal",
    "project_dir": "/dev/clients/supportsignal/...",
    "started_at": "2026-03-12T10:00:00Z",
    "last_active": "2026-03-12T10:47:32Z",
    "name": null,
    "tags": [],
    "workspace_id": null
  }
}
```

### Hot file event format (one JSON line per event)

```json
{"event": "UserPromptSubmit", "prompt": "Add auth middleware", "ts": "...", "session_id": "abc123"}
{"event": "PostToolUse", "tool": "Write", "file": "src/auth.ts", "result": "success", "ts": "..."}
{"event": "PostToolUse", "tool": "Bash", "command": "npm test", "result": "12 passed", "ts": "..."}
{"event": "Stop", "reason": "end_turn", "ts": "...", "session_id": "abc123"}
```

### Workspaces format

```json
{
  "workspaces": [
    {
      "id": "ws-001",
      "name": "SupportSignal sprint",
      "tags": ["supportsignal"],
      "created_at": "2026-03-12T10:00:00Z"
    }
  ]
}
```

### Why no database

- JSONL is human-readable, greppable, portable
- No setup, no server, no migrations
- Session files are naturally partitioned (one file = one session)
- Socket.io pushes on file change — no polling needed
- AppyStack's Express watches files directly
- Skills read files without hitting a server
- Add SQLite/Supabase later if cross-session indexed search becomes needed

---

## Hook Ingestion — Decision: Command Hooks

**Canonical reference**: `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md`

### Chosen: Command hooks with curl (B024 — completed)

AngelEye uses `curl ... || true` command hooks configured in `~/.claude/settings.json`. Each hook event fires a curl POST to the AngelEye Express server. The `|| true` ensures hooks never block Claude Code if the server is down.

```
Hook event → curl POST to localhost:5501/hooks/:event || true → Express → JSONL write + Socket.io push
```

The `/angeleye:install` skill writes this configuration automatically.

### Considered and rejected: HTTP hooks

Claude Code's native HTTP hook type (v2.1.63) posts directly to a URL without a shell script. Rejected because command hooks with `curl || true` give the same result with more control over failure modes and logging.

### Considered and rejected: Python scripts

Three Python files (`session_start.py`, `post_tool_use.py`, `session_end.py`) writing to JSONL, Express watches files with chokidar. More resilient (works even if server is down) but more moving parts. Rejected in favour of the simpler curl approach.

**Hooks load at session start** — changes require restarting Claude Code. `/hooks` shows what's currently loaded.

**Patterns from disler** (`claude-code-hooks-observability`):

- Stop hook guard (`stop_hook_active` check)
- Tool summarisation by type
- MCP tool detection (split on `__`)

---

## Skills

All personal skills (`~/.claude/skills/angeleye/`).

**`/angeleye:install`** — BUILT (B006)
One-time setup. Reads `~/.claude/settings.json`, appends hooks config pointing at AngelEye hook scripts, writes back. Run once after cloning the project.

**`/angeleye:name-session`** — BUILT (B006)
Tags current session in registry.json with human name and optional tags. Updates `name` and `tags` fields. Optionally assigns to a workspace.
Usage: `/angeleye:name-session "BMAD Story 1.2" --tags bmad,supportsignal --workspace "SupportSignal sprint"`

**`/angeleye:context`** — BUILT (B010)
Reads current session's hot file (or named session from registry) and assembles a context block. Used to drop session context into a Claude window for analysis.
Usage: `/angeleye:context --last 20` or `/angeleye:context --session abc123`

**`/angeleye:publish`** — BACKLOG (B011)
Reads session context and sends to Nano Banana or FliDeck for image generation. Triggered manually or automatically on Stop events.
Usage: `/angeleye:publish --session --concept "auth middleware" --direction "circuit board"`

---

## UI

### Observer (primary view)

The live session monitoring view. Selecting what to watch and watching it.

**Built features**:

- Session list sorted by recency (most active at top)
- Focus panel: click any session row to expand its event timeline
- Prompt expansion: click prompt rows in focus panel to see full text
- Filters: All / Starred / Named toggle
- Workspace badges on session rows
- Session type legend with tooltips and info panel
- Star/bookmark toggle with note field
- Inline rename with full JSONL write-back (appends `custom-title` + `agent-name` entries)
- Copy-resume button (copies session UUID for `claude --resume`)
- v2-linen UI design (B020)

**Key UI principles**:

- Idle counter is the most prominent live number — counts up, turns amber at 8s, red at 15s, resets on any event
- Activity feed sorted by recency, not session ID — most active always at top
- Named sessions, never hashes visible to user
- Timestamp left-aligned and large (readable from distance on second monitor)
- Start maximally filtered — open up from there, never start with everything

**Scaling**: Designed for 20-30 concurrent sessions. Three-layer model (overview dots + recency feed + single focus panel) scales to any number. Pagination (B023) needed at 2000+ sessions.

### Organizer

Managing where sessions live. Not a live view — visited occasionally.

**Built features** (B008):

- Inbox of unassigned sessions
- Named workspaces (create, rename, delete)
- Drag sessions into workspaces, or move between them
- Workspace CRUD API (B019)
- Folder inference: session starting in a known directory shows suggestion badge
- `/angeleye:name-session` skill mirrors this from inside Claude

### Settings

Configuration and intelligence dashboard.

**Built features** (B032-B034):

- Unified Sync button: runs backfill + classify in one action
- Delta tracking status line (shows last sync time, sessions found/new)
- Classification breakdown panel: session type distribution across all indexed sessions
- Auto-run backfill on server start (B031)

---

## Workspace Model

- Sessions always start in **inbox** (unassigned)
- User creates named workspaces (not folders — work contexts)
- A workspace holds sessions from any number of directories
- Sessions assigned via drag in UI or `/angeleye:name-session` skill
- Workspace config persisted in `~/.claude/angeleye/workspaces.json`

**Folder inference** (suggestion only, never auto-assign):

```
Known project dir  →  suggest matching workspace     high confidence
Brains dir         →  no suggestion, land in inbox   too ambiguous
First prompt text  →  re-suggest after SessionStart  medium confidence
Learned pattern    →  v2 feature, auto-assign        future
```

---

## Intelligence Layer

Ambient intelligence system for automatic session understanding.

### Rule-based session classification (B012 — completed)

Sessions are classified by type using rule-based heuristics applied to session shape data (event counts, tool distributions, prompt fingerprints, CWD patterns). Classification runs as part of the unified Sync action.

### Session type taxonomy

12+ primary types with 500+ candidate subtypes identified from the 924-session analysis campaign. Primary types include: BUILD, EXPLORE, DOCS, ANALYSIS, CONFIG, REFACTOR, DEBUG, REVIEW, OPERATIONS, CONVERSATION, PLANNING, RESEARCH.

Subtype examples: `build.feature_implementation`, `docs.brain_curation`, `operations.poem_execution`, `explore.codebase_orientation`.

### Backfill pipeline

1. Scans `~/.claude/projects/` for all JSONL transcript files
2. Extracts session shapes via `compute-session-shape.py` (event counts, tool distributions, prompt content)
3. Extracts `/rename` names from `custom-title` JSONL entries (B036)
4. Classifies sessions using rule-based heuristics
5. Writes results to analysis index (`session-index.jsonl`)
6. Delta tracking via `last-sync.json` — only processes new/changed sessions on subsequent syncs (B033)

### Analysis campaigns

The 924-session analysis was conducted across 14 waves (plus discovery rounds), processing sessions from both M4 Mini and M4 Pro machines. Campaign artifacts live in `docs/planning/angeleye-analysis-1/`. Findings are recorded per-wave in `~/dev/ad/brains/angeleye/analysis/`.

### Classifier improvement backlog (completed)

All items below were completed during the analysis-1 campaign:

- ~~B038 — Scale-aware BUILD guard~~ (done: commit 3f593607)
- ~~B039 — Iron-clad classifier rules~~ (done: commit 3f593607)
- ~~B040 — PII detection pass during backfill~~ (done: commit 9b692fae)
- ~~B041 — Paperclip/autonomous agent detection~~ (done: commit 3f593607)
- ~~B042 — Voice dictation entity dictionary~~ (done: commit 9b692fae)
- ~~B043 — Promote confirmed subtypes to canonical taxonomy~~ (done: commit 9b692fae)

---

## Future Capabilities

- **`/angeleye:publish` skill** (B011): Context packaging to Nano Banana / FliDeck for image generation
- **launchd plist** (B025): Always-on persistent service, auto-restart on crash/reboot
- **Multi-machine registry sync** (B044): Classification rules applied across machines
- **Pattern miner / skill suggester**: detect repeated prompt phrases across sessions, surface as skill candidates
- **BMAD agent handoffs as named transitions**: Map agent_type values to BMAD role names (Mary, Bob, Quinn) so the UI shows named transitions
- **Silence detection**: Flag sessions quiet for 20+ seconds mid-task (stuck, waiting for permission, crashed)
- **Session cost / token tracking**: Per-session and per-workspace cost — especially important for BMAD multi-agent loops
- **Terminal / iTerm2 integration**: Click session in AngelEye → focus corresponding iTerm2 tab (via iTerm2 Python API / AppleScript)
- **tmux integration**: `tmux list-sessions` / `tmux list-windows` as inference signal for workspace assignment
- **Stream-JSON adapter** (B013, deferred): Ingest Paperclip / OpenClaw / KyberBot agent output via normalised adapter
- **Session continuity tracking**: `sessionIdBefore`/`sessionIdAfter` for conversation thread tracing across sessions
- **Self-intelligence / auto-assign**: Learn "this folder + this prompt pattern = this workspace" and auto-assign without user intervention

---

## Reference Repos (upstream)

| Repo                                     | Path                                                   | Steal                                                                    |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `disler/claude-code-hooks-observability` | `~/dev/upstream/repos/claude-code-hooks-observability` | Hook script patterns, tool summarisation, stop hook guard, MCP detection |
| `es617/claude-replay`                    | `~/dev/upstream/repos/claude-replay`                   | Streaming dedup (seenKeys), JSONL parser structure                       |
| `thedotmack/claude-mem`                  | `~/dev/upstream/repos/claude-mem`                      | Content-hash dedup pattern                                               |
| `paperclipai/paperclip`                  | `~/dev/upstream/repos/paperclip`                       | Stream-JSON parser, session continuity, event log schema                 |

---

## Related App Docs

- `docs/planning/enrichment-pipeline/` — predicate tier reference, data architecture, gap analysis, execution paths, mockup brief, pipeline extension plan
- `docs/planning/workflow-orchestration/` — BMAD lifecycle handover, routing rules, workflow model specs
- `docs/planning/angeleye-analysis-1/` — analysis campaign plan, wave learnings, agents
- `docs/intelligence/PATTERNS.md` — v3 schema definition, signal reliability, observations log

## Related Brain Files

- `brains/angeleye/` — full domain knowledge (concepts, data model, ingestion architecture, ambient intelligence)
- `brains/angeleye/analysis/` — per-wave findings from 924-session analysis campaign
- `brains/anthropic-claude/claude-code/hooks-reference.md` — **all 25 hook events + schemas** (canonical hook reference)
- `brains/anthropic-claude/claude-code/observability.md` — hook input formats, 4 data streams, JSONL format
- `brains/anthropic-claude/claude-code/session-management.md` — session resume, /rename, /fork behaviour
- `brains/agentic-os/communication-architecture.md` — Supabase schema (future cold path if needed)
- `apps/appystack/docs/app-naming.md` — naming convention reference

## JSONL Schema Sources

For JSONL parsing implementation, reference these before writing parsers:

| File                                                             | What it contains                      |
| ---------------------------------------------------------------- | ------------------------------------- |
| `~/dev/upstream/repos/claude-code-log/claude_code_log/models.py` | Pydantic JSONL schema (authoritative) |
| `~/dev/upstream/repos/claude-mem/src/types/transcript.ts`        | TypeScript JSONL types                |
| `~/dev/upstream/repos/claude-mem/src/utils/transcript-parser.ts` | How to parse JSONL correctly          |
| `~/dev/upstream/repos/claude-replay/src/parser.mjs`              | Turn reconstruction + streaming dedup |

---

**Created**: 2026-03-12
**Updated**: 2026-03-29
**Context**: Originally designed in conversation (Q&A-driven discovery session). Updated to reflect operational state after 10 build waves and 924-session analysis campaign.
