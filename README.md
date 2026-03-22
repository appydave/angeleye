# AngelEye

> Session intelligence for Claude Code — the only tool that understands your AI sessions at the event level.

When you run 5-10 concurrent Claude Code sessions across multiple projects, you don't need a chat log viewer. You need a command center. AngelEye is that command center.

It watches your Claude Code sessions in real time via hook events, classifies what type of work each session is doing, and gives you a live dashboard to monitor, organise, and annotate your AI workflow. It also backfills historical sessions from Claude Code's native JSONL transcripts so you can see your full session history from day one.

---

## Why AngelEye?

Claude Code generates a firehose of session data — JSONL transcripts, tool calls, prompts, subagent spawns — but provides no way to see across sessions. When you're running concurrent agents on a real codebase, the questions that matter aren't "what did this session say?" but:

- **Which of my 8 active sessions actually need my attention right now?**
- **Is that background agent still building, or did it stall 20 minutes ago?**
- **What kind of work is each session doing — and did I already start something similar in another terminal?**
- **Where did that session I renamed last Tuesday end up?**

AngelEye answers these by parsing Claude Code's own event model — 7 hook event types, normalised into a durable session registry — and projecting them into a live operational view. It doesn't wrap or replace Claude Code. It sits alongside it, the way a team lead uses a project board while engineers use their IDEs.

No other tool in the Claude Code ecosystem does this. Paperclip and similar orchestrators optimise for autonomous execution. AngelEye optimises for operator awareness — giving you the visibility to decide when to intervene, when to let agents run, and when to redirect.

---

## What It Does

**Observer** — Your running sessions are invisible by default. AngelEye's live feed turns them into a status board: every active and recent session with real-time status indicators (active/warm/inactive), session type, workspace, opening prompt, and idle timer. Click any session to expand its full event history with tool call details and a note field. When a session goes quiet, you see it immediately — not 30 minutes later when you switch terminals.

**Classification** — Claude Code doesn't know what kind of work a session is doing. AngelEye does. A pure rule-based classifier (no LLM) runs automatically on every session, detecting BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, and ORIENTATION sessions from tool usage patterns and project directory signals. It also catches junk — accidental starts, single-event abandoned sessions, subagent noise — so your session list shows real work, not debris.

**Organiser** — Sessions start in an inbox; drag them into named workspaces to group related work. AngelEye suggests workspace assignments based on project directory patterns. This is how you go from "I have 40 sessions from this week" to "these 6 are the FliVideo feature branch, these 4 are the brain update campaign."

**Backfill** — Every Claude Code session you've ever run left a JSONL transcript behind. AngelEye imports them all — prompts, tool calls, user-assigned session names — so your session history goes back to day one, not just to when you installed the hook. Runs automatically at server startup and on-demand via the Settings view.

**Session Naming** — Rename sessions from the UI, and AngelEye writes the name back to Claude Code's native JSONL format so `claude --resume "my-name"` still works. Your session names live in both systems.

---

## Analysis Campaign

AngelEye includes an ongoing analysis campaign (`docs/planning/angeleye-analysis-1/`) that systematically analyses session JSONL files to stress-test and improve the classification system. The findings so far reveal how much is hidden in Claude Code session data:

- **268 sessions analysed** across 30+ projects
- **155+ subtypes discovered** — the 6 top-level types (BUILD, TEST, etc.) are just the surface; underneath are fine-grained patterns like "spike-prototype", "config-migration", "brain-curation", "ci-fix"
- **8 classifiers identified** with 12 predicates and 5 gated observations — a taxonomy far richer than the current rule-based system
- **BUILD accuracy is ~20%** — the most common classification is also the least precise. What the registry calls BUILD is actually a grab-bag of prototyping, refactoring, debugging, config work, and feature development. The analysis campaign is producing the evidence to fix this.

This research feeds directly back into AngelEye's classifier. The goal: when you glance at your session list, the type badges actually tell you what's happening.

### Complementary to `/insights`

Claude Code's built-in `/insights` command generates retrospective HTML reports using Haiku-extracted facets (friction categories, satisfaction signals, goal categories). AngelEye's analysis campaign has independently discovered a richer taxonomy — 15 session types vs 5, 52 subtypes vs none, plus session chain tracking, subagent awareness, and CWD attribution that `/insights` doesn't attempt.

The two systems are complementary: `/insights` captures quality-of-experience metrics (was the user satisfied? did Claude's code work? was there friction?) while AngelEye captures work-type classification (what kind of session is this? how does it relate to other sessions? what project does it actually belong to?). A gap analysis (`docs/planning/insights-angeleye-comparison.md`) maps the two schemas and identifies where each system is stronger, plus opportunities to ingest `/insights` cached facets as a free supplementary data source.

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

## Built On

[AppyStack](https://github.com/appydave/appystack) RVETS template — React, Vite, Express, TypeScript, Socket.io.
