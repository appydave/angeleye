# AngelEye — Requirements

**App name**: AngelEye
**Name rationale**: "Angelic" sounds like "Agentic" — the paradigm it watches. Eye = instrument of observation. All-seeing, always watching, messenger. Three layers of meaning.
**Stack**: AppyStack (React 19 + Vite 7 + Express 5 + TypeScript + Socket.io)
**Data store**: JSONL flat files (no database — see Data Architecture)
**Config location**: `~/.claude/angeleye/`
**Status**: Requirements / pre-build

---

## What It Is

A session intelligence layer for agentic AI workflows. AngelEye watches everything happening across Claude Code sessions, surfaces patterns, publishes context to image generation tools, and lets you query your own activity history.

It is **not** an ops dashboard. It is not a log viewer. It is a live performance instrument for a creator who works across many concurrent agent sessions.

---

## The Three Jobs

### 1. Observer (live view)
Watch what agents are doing across sessions in near real-time. Glanceable from a second monitor while recording video. Answers: "what is happening right now, and where?"

### 2. Context Publisher
As agent workflows run — BMAD sessions, Mary → Bob handoffs, Ralph loops — accumulated context gets packaged and sent to image generation (Nano Banana / FliDeck) on demand or triggered automatically at natural boundaries (Stop events, agent handoffs).

### 3. Session Archive + Query
Interrogatable history. Filter by tool type, event type, workspace, tag. Chain events into a Claude window for analysis. Long-running memory emerges when sessions share tags — same project over time.

---

## Data Sources

### Source 1: Claude Code Hook Events (real-time, interactive sessions)
Five hooks, fired by Claude Code into hook scripts:

| Hook | Key payload |
|------|-------------|
| `SessionStart` | session_id, cwd, project_dir |
| `UserPromptSubmit` | user_prompt |
| `PostToolUse` | tool_name, tool_input (summarised), tool_result, tool_use_id |
| `Stop` | reason, stop_hook_active flag, transcript_path |
| `SessionEnd` | transcript_path, reason |

All delivered as JSON via stdin. Common fields: `session_id`, `transcript_path`, `cwd`, `hook_event_name`.

**Stop hook guard**: check `stop_hook_active` flag — exit immediately if set. Prevents infinite loops when Claude continues after Stop.

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

### Source 3: Stream-JSON subprocess output (future — multi-format ingestion)
For agents run programmatically (Paperclip, OpenClaw, KyberBot, future automated agents):
`claude --print - --output-format stream-json`

Produces same logical events (session_id, tool calls, tokens, cost) via a different mechanism.

**Multi-format ingestion architecture**: normalised internal event format with adapters:
```
Interactive session  →  hooks adapter      ─┐
Paperclip agent      →  stream-json adapter ─┼→  normalised event  →  JSONL hot file  →  UI
KyberBot/OpenClaw    →  their adapter      ─┘
```
AngelEye's server, UI, and query layer never know which adapter produced an event. Adapters are the extension point for future agent runtimes.

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
```

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

## Hook Scripts

Three Python files, ~150 lines total. Live inside the AngelEye project at `angeleye/hooks/`.

| Script | Event | Responsibility |
|--------|-------|----------------|
| `session_start.py` | `SessionStart` | Register session in registry.json, create hot file |
| `post_tool_use.py` | `PostToolUse` + `UserPromptSubmit` | Summarise tool input, append event, update last_active, stop hook guard |
| `session_end.py` | `SessionEnd` | Rotate hot file to archive, mark session ended |

**Rules**: `uv run`, always exit 0 (never block Claude), run in under 200ms.

**Installation**: one-time setup via `/angeleye:install` skill or `npm run setup-hooks`. Writes hooks config into `~/.claude/settings.json` with absolute paths to the AngelEye project's hook scripts.

**Patterns stolen from disler** (`claude-code-hooks-observability`):
- Stop hook guard (`stop_hook_active` check)
- Tool summarisation by type
- MCP tool detection (split on `__`)

---

## Skills

All personal skills (`~/.claude/skills/angeleye/`).

**`/angeleye:install`**
One-time setup. Reads `~/.claude/settings.json`, appends hooks config pointing at AngelEye hook scripts, writes back. Run once after cloning the project.

**`/angeleye:name-session`**
Tags current session in registry.json with human name and optional tags. Updates `name` and `tags` fields. Optionally assigns to a workspace.
Usage: `/angeleye:name-session "BMAD Story 1.2" --tags bmad,supportsignal --workspace "SupportSignal sprint"`

**`/angeleye:context`**
Reads current session's hot file (or named session from registry) and assembles a context block. Used to drop session context into a Claude window for analysis.
Usage: `/angeleye:context --last 20` or `/angeleye:context --session abc123`

**`/angeleye:publish`**
Reads session context and sends to Nano Banana or FliDeck for image generation. Triggered manually or automatically on Stop events.
Usage: `/angeleye:publish --session --concept "auth middleware" --direction "circuit board"`

---

## UI — Two Pages

### Page 1: Organizer
Managing where sessions live. Not a live view — visited occasionally.
- Inbox of unassigned sessions
- Named workspaces (create, rename, delete)
- Drag sessions into workspaces, or move between them
- Folder inference: session starting in a known directory shows suggestion badge ("looks like SupportSignal?") — confirm or dismiss
- Brains folder: no inference (too ambiguous) — lands in inbox, post-hoc suggestion from first prompt content
- `/angeleye:name-session` skill mirrors this from inside Claude

### Page 2: Observer (live view)
Selecting what to watch and watching it. Select one or more workspaces.

**Three-layer layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 👁 AngelEye                    idle: 4s ↑        ● LIVE  29 sessions│
├─────────────────────────────────────────────────────────────────────┤
│ OVERVIEW — all workspaces as compact dot groups                     │
│ [SupportSignal ●●○] [FliVideo ●○] [BMAD ●○○○] [brains ○○]         │
│  ● = active <30s   ○ = idle                                         │
├─────────────────────────────────────────────────────────────────────┤
│ ACTIVITY FEED — sorted by most recently active                      │
│                                                                     │
│ ● ss-app        Bash: npm test -- auth.spec.ts        2s ago  ▶   │
│ ● brains        Read: CLAUDE.md                       8s ago  ▶   │
│ ● bmad-mary     UserPrompt: "Story 1.2 acceptance"   14s ago  ▶   │
│ ○ flivideo      Stop                                  5m ago  ▶   │
│                                                         more ▼    │
├─────────────────────────────────────────────────────────────────────┤
│ FOCUS PANEL — click any row to expand                              │
│                                                                     │
│ ss-app  idle: 2s ↑   sonnet-4-6   [🎨 publish]    [✕ dismiss]    │
│ ─────────────────────────────────────────────────────────────────── │
│ 11:21:13  Bash                                                      │
│ npm test → 12 passed                                                │
│ 11:21:07  Write                                                     │
│ src/auth/middleware.ts                                              │
│ 11:20:58  UserPrompt                                                │
│ "Add auth middleware to the login route"                            │
│ ■ Stop  11:21:20  [🎨]                                             │
├─────────────────────────────────────────────────────────────────────┤
│ filter: [all workspaces ▼]  [all tools ▼]  [search regex...     ] │
└─────────────────────────────────────────────────────────────────────┘
```

**Key UI principles** (from designer analysis):
- Idle counter is the most prominent live number — counts up, turns amber at 8s, red at 15s, resets on any event
- Activity feed sorted by recency, not session ID — most active always at top
- Named sessions, never hashes visible to user
- Timestamp left-aligned and large (readable from distance on second monitor)
- `[🎨 publish]` button on Stop markers = Nano Banana / FliDeck trigger
- Start maximally filtered — open up from there, never start with everything

**Scaling**: Designed for 20-30 concurrent sessions. Fixed columns don't scale — three-layer model (overview dots + recency feed + single focus panel) scales to any number.

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

**Future self-intelligence**: AngelEye reads all conversations — it has the raw material to eventually learn "this folder + this prompt pattern = this workspace" and auto-assign. The data foundation is being built now. No implementation needed yet.

---

## Future Capabilities (not v1)

- **Pattern miner / skill suggester**: detect repeated prompt phrases across sessions, surface as skill candidates ("You've typed 'did you commit?' 14 times this week — want a skill?")
- **BMAD agent handoffs as first-class events**: when Mary finishes and Bob starts, mark that transition explicitly — not just a subagent boundary but a named handoff event. Enables workflow-level narrative (which agent did what, in sequence).
- **Silence detection**: if a session has been quiet for 20+ seconds mid-task, flag it visually (stuck, waiting for permission, crashed). Different from idle-after-Stop — this is unexpected silence during active work.
- **Session cost / token tracking**: token cost per session and per workspace — especially important for BMAD multi-agent loops which accumulate significant spend. Per-session cost visible in focus panel. Paperclip's `cost_events` pattern is the reference.
- **Terminal / iTerm2 integration**: read-only access to iTerm2 tab names, current directory per pane. Future: click session in AngelEye → focus corresponding iTerm2 tab. Possible via iTerm2 Python API / AppleScript.
- **tmux integration**: `tmux list-sessions` / `tmux list-windows` as inference signal for workspace assignment
- **Stream-JSON adapter**: ingest Paperclip / OpenClaw / KyberBot agent output via normalised adapter (multi-format ingestion)
- **Session continuity tracking**: `sessionIdBefore`/`sessionIdAfter` for conversation thread tracing across sessions (Paperclip pattern)
- **Self-intelligence / auto-assign**: AngelEye reads all conversations — it has the raw material to eventually learn "this folder + this prompt pattern = this workspace" and auto-assign without user intervention

---

## Reference Repos (upstream)

| Repo | Path | Steal |
|------|------|-------|
| `disler/claude-code-hooks-observability` | `~/dev/upstream/repos/claude-code-hooks-observability` | Hook script patterns, tool summarisation, stop hook guard, MCP detection |
| `es617/claude-replay` | `~/dev/upstream/repos/claude-replay` | Streaming dedup (seenKeys), JSONL parser structure |
| `thedotmack/claude-mem` | `~/dev/upstream/repos/claude-mem` | Content-hash dedup pattern |
| `paperclipai/paperclip` | `~/dev/upstream/repos/paperclip` | Stream-JSON parser, session continuity, event log schema |

---

## Related Brain Files

- `brains/agentic-os/claude-code-observability.md` — hook pipeline design, hot file architecture
- `brains/anthropic-claude/claude-code/observability.md` — hook events reference, JSONL format
- `brains/agentic-os/communication-architecture.md` — Supabase schema (future cold path)
- `apps/appystack/docs/app-naming.md` — naming convention reference

---

**Created**: 2026-03-12
**Context**: Designed in conversation — Q&A-driven discovery session
