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

AngelEye answers these by parsing Claude Code's own event model — all 24 hook event types, normalised into a durable session registry — and projecting them into a live operational view. It doesn't wrap or replace Claude Code. It sits alongside it, the way a team lead uses a project board while engineers use their IDEs.

No other tool in the Claude Code ecosystem does this. Paperclip and similar orchestrators optimise for autonomous execution. AngelEye optimises for operator awareness — giving you the visibility to decide when to intervene, when to let agents run, and when to redirect.

---

## What It Does

**Observer** — Your running sessions are invisible by default. AngelEye's live feed turns them into a status board: every active and recent session with real-time status indicators (active/warm/inactive), session type, workspace, opening prompt, and idle timer. Click any session to expand its full event history with tool call details and a note field. When a session goes quiet, you see it immediately — not 30 minutes later when you switch terminals.

**Classification** — Claude Code doesn't know what kind of work a session is doing. AngelEye does. A three-tier detection system (deterministic rules, regex/heuristic, and LLM enrichment) runs automatically on every session. The deterministic tier fires on every sync, classifying session type, scale, tool pattern, and 20 boolean predicates with zero LLM cost. It detects BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, and ORIENTATION sessions from tool usage patterns, project directory signals, and session scale. The analysis campaign validated 12+ top-level types and 500+ subtypes across the full corpus — far richer than what any single classifier captures.

**Organiser** — Sessions start in an inbox; drag them into named workspaces to group related work. AngelEye suggests workspace assignments based on project directory patterns. This is how you go from "I have 40 sessions from this week" to "these 6 are the FliVideo feature branch, these 4 are the brain update campaign."

**Backfill** — Every Claude Code session you've ever run left a JSONL transcript behind. AngelEye imports them all — prompts, tool calls, user-assigned session names — so your session history goes back to day one, not just to when you installed the hook. Runs automatically at server startup and on-demand via the Settings view.

**Session Naming** — Rename sessions from the UI, and AngelEye writes the name back to Claude Code's native JSONL format so `claude --resume "my-name"` still works. Your session names live in both systems.

---

## Enrichment Pipeline

AngelEye's classifier has grown from a simple 6-type rule engine into a multi-tier enrichment pipeline, driven by findings from a 924-session analysis campaign (`docs/planning/angeleye-analysis-1/`).

### What's Detected

The pipeline currently defines 58 enrichment items across four categories:

| Category     | IDs              | Count | Description                                                                       |
| ------------ | ---------------- | ----- | --------------------------------------------------------------------------------- |
| Predicates   | P01-P25, P31-P35 | 30    | Boolean signals (has playwright calls, is machine-initiated, has PII, etc.)       |
| Classifiers  | C01-C16, C22     | 17    | Categorical labels (session type, scale, tool profile, workflow role, etc.)       |
| Extractors   | E01-E04          | 4     | Positional value extraction (trigger command, arguments, opening/closing windows) |
| Observations | O02-O08          | 7     | Free-text analysis summaries (frustration, phase breakdown, skill gaps)           |

29 of these 58 items are implemented and run on every sync. The remainder are either Tier 2 heuristic (partially implemented) or Tier 3 LLM-required (pending infrastructure).

### Three-Tier Detection

| Tier                       | What it does                                                          | Cost       | Items implemented |
| -------------------------- | --------------------------------------------------------------------- | ---------- | ----------------- |
| **Tier 1 — Deterministic** | Count events, check tool names, match paths. Same input = same answer | Zero       | All 11            |
| **Tier 2 — Heuristic**     | Regex on prompt text, file paths. High accuracy, not 100%             | Zero       | All 12            |
| **Tier 3 — LLM-Required**  | Claude reads conversation content and makes judgment calls            | API tokens | 0 of 22 (pending) |

### Domain Overlay System

Generic workflow role detection (C14-C16) with pluggable domain-specific configuration. A session that invokes `/bmad-sm` gets classified as `role: orchestrator, identity: SallyMae, action: WN` via a JSON-based domain mapping. Currently ships with a BMAD v6 overlay config.

### Analysis Campaign Results

The analysis campaign processed **924 sessions** across 30+ projects on two machines (M4 Mini: 807, M4 Pro: 116). Key findings:

- **12+ top-level session types** validated (BUILD, TEST, RESEARCH, KNOWLEDGE, OPERATIONS, ORIENTATION, META, SYSOPS, PLANNING, MIXED, SKILL, SETUP, and others)
- **500+ subtypes** discovered — the 6 classifier types are just the surface
- **Session scale** is the strongest predictor of classification accuracy — micro sessions are mostly junk, marathon sessions are almost always BUILD
- BUILD accuracy varies 0-70% by scale; the scale-aware guard (B038) prevents mis-classification of small sessions

Full campaign findings: `docs/intelligence/PATTERNS.md`

### Coming Soon: Affinity Groups

Cross-session correlation that groups related sessions into business units — Story Units (sessions working on one story), Epic Sprints (stories grouped by epic), and Project Phases. Designed from analysis of BMAD workflow orchestration sessions. See `docs/planning/enrichment-pipeline/pipeline-extension-plan.md`.

### Complementary to `/insights`

Claude Code's built-in `/insights` command generates retrospective HTML reports using Haiku-extracted facets (friction categories, satisfaction signals, goal categories). AngelEye captures a different dimension: work-type classification, cross-session correlation, and project attribution. A gap analysis (`docs/planning/insights-angeleye-comparison.md`) maps the two schemas.

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
    | hook POST
AngelEye server (/hooks/:event)
    | normalise -> store -> classify -> broadcast
JSONL event file + registry.json + Socket.io -> browser
```

All 24 Claude Code hook events are accepted. The original 7 core events drive classification; the remaining 17 (added in wave 11) are stored for future enrichment:

**Core events (classification triggers):**

| Hook Event         | What AngelEye Does                                 |
| ------------------ | -------------------------------------------------- |
| `SessionStart`     | Creates registry entry, starts JSONL event file    |
| `UserPromptSubmit` | Stores prompt, captures `first_real_prompt`        |
| `PostToolUse`      | Stores tool call, builds tool pattern profile      |
| `Stop`             | Triggers classification, updates session type      |
| `SessionEnd`       | Final classification, archives JSONL to `archive/` |
| `SubagentStart`    | Tracks subagent spawning                           |
| `SubagentStop`     | Tracks subagent completion                         |

**Additional events (stored, enrichment-ready):**

`ToolFailure`, `StopFailure`, `WorktreeCreate`, `WorktreeRemove`, `CwdChanged`, `PreToolUse`, `InstructionsLoaded`, `PreCompact`, `PostCompact`, `PermissionRequest`, `Notification`, `TeammateIdle`, `TaskCompleted`, `ConfigChange`, `Elicitation`, `ElicitationResult`, `FileChanged`

A stop-hook guard prevents infinite loops when AngelEye's own hook fires during a Claude Code stop event.

### Data Storage

```
~/.claude/angeleye/
+-- registry.json           <- session index (keyed by session_id)
+-- workspaces.json         <- workspace definitions
+-- last-sync.json          <- last sync timestamp and counts
+-- sessions/
|   +-- session-<id>.jsonl  <- active session events (one JSON line per event)
+-- archive/
    +-- session-<id>.jsonl  <- completed sessions (moved here at SessionEnd)
```

Registry writes use a serial promise queue with atomic write-to-temp-then-rename to prevent lost updates from concurrent hook events.

### Classification

Pure rule-based at Tier 1 and 2, no LLM. Runs at `stop` and `session_end` events, and on bulk re-classify via sync.

**Junk detection**: single-event empty prompts, `/tmp` CWD starts, subagent files, ultra-short sessions with no tool use, auto-hello prompts.

**Session scale**: micro (0-3 tools), light (4-10), moderate (11-50), heavy (51-200), marathon (200+). Scale gates classification — micro/light sessions are demoted from BUILD to ORIENTATION to avoid false positives.

**Tool pattern**: derived from tool_use event distribution — `edit-heavy`, `bash-heavy`, `playwright-heavy`, `read-heavy`, `agent-heavy`, `task-heavy`, `websearch-heavy`, `mixed`.

**Session type**: derived from tool pattern + project directory + session scale:

- **BUILD** — edit-heavy/task-heavy/agent-heavy in product repos (moderate+ scale only)
- **TEST** — playwright-heavy
- **RESEARCH** — websearch-heavy
- **KNOWLEDGE** — read-heavy in brain directories, or any light session in brain dirs
- **OPS** — bash-heavy in infrastructure directories, paperclip agents, poem execution
- **ORIENTATION** — read-heavy in non-brain directories, zero tool calls, micro/light scale

**Predicates**: 20 boolean signals fire per session, covering playwright usage, compaction, machine initiation, web research, subagent bursts, task orchestration, git outcomes, skill creation/modification, brain file writes, cross-session references, unauthorized edits, voice dictation artifacts, handover context, cross-project reads, closing ceremonies, and PII detection.

**Domain overlays**: Workflow role (C14), identity (C15), and action (C16) resolved from trigger command via pluggable JSON config.

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

| Direction        | Event            | Payload                                 |
| ---------------- | ---------------- | --------------------------------------- |
| Server -> Client | `angeleye:event` | Real-time hook event as `AngelEyeEvent` |
| Client -> Server | `client:ping`    | Keepalive                               |
| Server -> Client | `server:pong`    | Keepalive response                      |

---

## UI Views

### Observer (default)

The live session feed. Sessions are sorted by last activity with real-time status indicators:

- **Green dot** — active (event within 30s)
- **Amber dot** — warm (30s-2min since last event)
- **Grey dot** — inactive (>2min)

Each row shows: session name, type badge, workspace badge, project, opening prompt, idle timer. Click to expand the focus panel showing full event history with collapsible tool call groups and a note field.

Filter by: All / Starred / Named. Toggle junk visibility.

### Organiser

Two-column drag-and-drop layout:

- **Inbox** (left) — unassigned sessions
- **Workspaces** (right) — named workspace cards as drop targets

Drag sessions between inbox and workspaces. AngelEye suggests workspace assignments based on project directory patterns.

### Settings

- **Sync** — trigger backfill + classification, see last sync results with diff table showing what changed
- **Stats** — session type breakdown (how many BUILD, TEST, RESEARCH, etc.)

---

## Scripts

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start client + server concurrently     |
| `npm run build`        | Build shared -> server -> client       |
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
- **Classification**: `session_type`, `session_subtype`, `tool_pattern`, `session_scale`, `is_junk`
- **Predicates**: 20 boolean flags (playwright, compaction, machine-initiated, web research, subagent bursts, task orchestration, git outcome, skill created/modified, brain writes, cross-session refs, unauthorized edits, voice dictation, handover context, cross-project reads, closing ceremony)
- **Extractors**: `trigger_command`, `trigger_arguments`
- **Domain overlay**: `workflow_role`, `workflow_identity`, `workflow_action`
- **PII**: `pii_flags` (email, IP, API keys, tokens, secrets)
- **Context**: `first_real_prompt` (first 200 chars), `first_edited_dir`
- **Organisation**: `workspace_id`, `note`

The registry currently holds 894+ sessions across 30+ projects. The analysis campaign's session index covers 924 sessions (includes a second machine).

---

## Built On

[AppyStack](https://github.com/appydave/appystack) RVETS template — React, Vite, Express, TypeScript, Socket.io.
