# AngelEye

> Session intelligence for Claude Code — live observability, classification, and workspace management for people who run many concurrent AI sessions.

AngelEye watches your Claude Code sessions in real time via hook events, classifies what type of work each session is doing, and gives you a live dashboard to monitor, organise, and annotate your AI workflow. It also backfills historical sessions from Claude Code's native JSONL transcripts so you can see your full session history from day one.

---

## What It Does

**Observer** — a live session feed showing every active and recent Claude Code session. Each row shows status (active/idle/ended), session type, workspace, the opening prompt, and a real-time idle timer. Click any session to expand its full event history with tool call details and a note field.

**Organiser** — drag-and-drop workspace management. Sessions start in an inbox; drag them into named workspaces to group related work. AngelEye suggests workspace assignments based on project directory patterns.

**Classification** — rule-based session typing that runs automatically on every session. Detects BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, and ORIENTATION sessions based on tool usage patterns and project directory signals. Also detects junk sessions (accidental starts, single-event abandoned sessions).

**Backfill** — imports historical sessions from `~/.claude/projects/` transcripts, extracting prompts, tool calls, and user-assigned session names. Runs automatically at server startup and on-demand via the Settings view.

**Session naming** — rename sessions from the UI, and AngelEye writes the name back to Claude Code's native JSONL so `claude --resume "my-name"` works.

---

## Stack

| Layer   | Technology                         | Role                                              |
| ------- | ---------------------------------- | ------------------------------------------------- |
| Client  | React 19 + Vite 7 + TailwindCSS v4 | UI on port 5050                                   |
| Server  | Express 5 + Socket.io + Pino       | REST API + real-time events on port 5051          |
| Shared  | TypeScript interfaces              | Domain types shared between client and server     |
| Storage | JSONL flat files + JSON registry   | No database — everything in `~/.claude/angeleye/` |
| Quality | Vitest + ESLint 9 + Prettier       | Tests, linting, formatting                        |

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
# Client: http://localhost:5050
# Server: http://localhost:5051
```

Then install the Claude Code hook to start receiving live events:

```bash
# Add to ~/.claude/settings.json under "hooks"
# See docs/ for hook configuration details
```

Without the hook, AngelEye still works — it backfills from existing Claude Code transcripts at startup.

---

## How It Works

### Live Event Pipeline

```
Claude Code session
    ↓ hook POST
AngelEye server (/hooks/:event)
    ↓ normalise → store → classify → broadcast
JSONL event file + registry.json + Socket.io → browser
```

Seven Claude Code hook events are captured:

| Hook Event         | What AngelEye Does                                 |
| ------------------ | -------------------------------------------------- |
| `SessionStart`     | Creates registry entry, starts JSONL event file    |
| `UserPromptSubmit` | Stores prompt, captures `first_real_prompt`        |
| `PostToolUse`      | Stores tool call, builds tool pattern profile      |
| `Stop`             | Triggers classification, updates session type      |
| `SessionEnd`       | Final classification, archives JSONL to `archive/` |
| `SubagentStart`    | Tracks subagent spawning                           |
| `SubagentStop`     | Tracks subagent completion                         |

A stop-hook guard prevents infinite loops when AngelEye's own hook fires during a Claude Code stop event.

### Data Storage

```
~/.claude/angeleye/
├── registry.json           ← session index (keyed by session_id)
├── workspaces.json         ← workspace definitions
├── last-sync.json          ← last sync timestamp and counts
├── sessions/
│   └── session-<id>.jsonl  ← active session events (one JSON line per event)
└── archive/
    └── session-<id>.jsonl  ← completed sessions (moved here at SessionEnd)
```

Registry writes use a serial promise queue with atomic write-to-temp-then-rename to prevent lost updates from concurrent hook events.

### Classification

Pure rule-based, no LLM. Runs at `stop` and `session_end` events.

**Junk detection**: single-event empty prompts, `/tmp` CWD starts, subagent files, ultra-short sessions with no tool use.

**Tool pattern**: derived from tool_use event distribution — `edit-heavy`, `bash-heavy`, `playwright-heavy`, `read-heavy`, `agent-heavy`, `task-heavy`, `websearch-heavy`, `mixed`.

**Session type**: derived from tool pattern + project directory:

- **BUILD** — edit-heavy/task-heavy/agent-heavy in product repos
- **TEST** — playwright-heavy
- **RESEARCH** — websearch-heavy
- **KNOWLEDGE** — read-heavy in brain directories
- **OPS** — bash-heavy in infrastructure directories
- **ORIENTATION** — read-heavy in non-brain directories

---

## API

| Method | Path                       | Purpose                                      |
| ------ | -------------------------- | -------------------------------------------- |
| POST   | `/hooks/:event`            | Hook ingestion (Claude Code POSTs here)      |
| GET    | `/api/sessions`            | List all sessions, sorted by recency         |
| GET    | `/api/sessions/:id/events` | Fetch event history for a session            |
| PATCH  | `/api/sessions/:id`        | Update name, tags, workspace, or note        |
| GET    | `/api/workspaces`          | List workspaces                              |
| POST   | `/api/workspaces`          | Create workspace                             |
| PATCH  | `/api/workspaces/:id`      | Update workspace                             |
| DELETE | `/api/workspaces/:id`      | Delete workspace                             |
| POST   | `/api/backfill`            | Import sessions from Claude Code transcripts |
| POST   | `/api/backfill/classify`   | Re-run classification on all sessions        |
| POST   | `/api/sync`                | Combined backfill + classify                 |
| GET    | `/api/sync/status`         | Last sync timestamp and results              |
| GET    | `/api/stats`               | Session type breakdown counts                |

### Socket.io Events

| Direction       | Event            | Payload                                 |
| --------------- | ---------------- | --------------------------------------- |
| Server → Client | `angeleye:event` | Real-time hook event as `AngelEyeEvent` |
| Client → Server | `client:ping`    | Keepalive                               |
| Server → Client | `server:pong`    | Keepalive response                      |

---

## UI Views

### Observer (default)

The live session feed. Sessions are sorted by last activity with real-time status indicators:

- **Green dot** — active (event within 30s)
- **Amber dot** — warm (30s–2min since last event)
- **Grey dot** — inactive (>2min)

Each row shows: session name, type badge, workspace badge, project, opening prompt, idle timer. Click to expand the focus panel showing full event history with collapsible tool call groups and a note field.

Filter by: All / Starred / Named. Toggle junk visibility.

### Organiser

Two-column drag-and-drop layout:

- **Inbox** (left) — unassigned sessions
- **Workspaces** (right) — named workspace cards as drop targets

Drag sessions between inbox and workspaces. AngelEye suggests workspace assignments based on project directory patterns.

### Settings

- **Sync** — trigger backfill + classification, see last sync results
- **Stats** — session type breakdown (how many BUILD, TEST, RESEARCH, etc.)

---

## Scripts

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start client + server concurrently     |
| `npm run build`        | Build shared → server → client         |
| `npm test`             | Run all tests                          |
| `npm run typecheck`    | TypeScript check across all workspaces |
| `npm run lint`         | ESLint across all workspaces           |
| `npm run format:check` | Prettier check                         |

For persistent background running:

```bash
./scripts/start.sh    # builds shared, port-checks, launches via Overmind
overmind connect client  # attach to client logs (Ctrl+B D to detach)
overmind connect server  # attach to server logs
overmind stop            # stop all processes
```

---

## Environment

| Variable          | Default                 | Purpose             |
| ----------------- | ----------------------- | ------------------- |
| `PORT`            | `5051`                  | Express server port |
| `CLIENT_URL`      | `http://localhost:5050` | CORS origin         |
| `VITE_APP_NAME`   | `AppyStack`             | Display name        |
| `VITE_SOCKET_URL` | `http://localhost:5051` | Socket.io URL       |

---

## Session Registry

Each session in `registry.json` tracks:

- **Identity**: `session_id`, `project`, `project_dir`, `name`, `tags`
- **Lifecycle**: `status` (active/ended), `started_at`, `last_active`, `source` (hook/transcript)
- **Classification**: `session_type`, `tool_pattern`, `is_junk`
- **Context**: `first_real_prompt` (first 200 chars), `first_edited_dir`
- **Organisation**: `workspace_id`, `note`

The registry currently holds 794 sessions across 30+ projects.

---

## Analysis Campaign

AngelEye includes an ongoing analysis campaign (`docs/planning/angeleye-analysis-1/`) that systematically analyses session JSONL files to improve the classification system. As of wave 7: 268 sessions analysed, ~155 subtypes discovered across 15+ parent types, with evidence that the current rule-based classifier over-classifies BUILD (only ~20% accuracy vs ~80% for the registry's BUILD label).

This research is producing a richer classification taxonomy with 8 classifiers, 12 predicates, and 5 gated observations — knowledge that will feed back into AngelEye's classifier in future.

---

## Built On

[AppyStack](https://github.com/appydave/appystack) RVETS template — React, Vite, Express, TypeScript, Socket.io.
