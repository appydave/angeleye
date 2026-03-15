# AGENTS.md — AngelEye Wave 1

You are a background agent implementing one work unit for AngelEye — a session intelligence layer for Claude Code.
Read this file fully before writing any code. It is your complete reference.

---

## Project Overview

**App**: AngelEye — watches Claude Code sessions in real time, writes events to JSONL flat files, broadcasts via Socket.io to a React UI.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript + Socket.io (npm workspaces: client/, server/, shared/)
**Data store**: JSONL flat files at `~/.claude/angeleye/` — no database.
**Your job**: Implement the assigned work unit only. Do not touch files outside your unit's scope.

---

## Build & Run Commands

```bash
# From project root (/Users/davidcruwys/dev/ad/apps/angeleye/)
npm run typecheck          # type check all workspaces — must pass before marking done
npm run test               # run all tests
npm run lint               # eslint
npm run build -w shared    # build shared types (required before server/client can see them)
```

**Typecheck must pass clean before marking your work unit done.**

---

## Directory Structure

```
angeleye/
├── shared/src/
│   ├── types.ts           ← shared TypeScript types (ApiResponse, Socket events, etc.)
│   ├── constants.ts       ← ROUTES, SOCKET_EVENTS constants
│   └── index.ts           ← re-exports everything
├── server/src/
│   ├── config/
│   │   ├── env.ts         ← validated env (PORT=5051, CLIENT_URL=http://localhost:5050)
│   │   └── logger.ts      ← pino logger
│   ├── helpers/
│   │   └── response.ts    ← apiSuccess(res, data), apiError(res, msg, code)
│   ├── middleware/         ← requestLogger, errorHandler, rateLimiter
│   ├── routes/
│   │   ├── health.ts      ← GET /health pattern to follow
│   │   └── info.ts        ← GET /api/info pattern to follow
│   ├── services/           ← business logic (create new files here)
│   └── index.ts           ← Express app + Socket.io server setup
├── client/src/
│   ├── components/         ← AppShell, Header, Sidebar, ContentPanel, SidebarGroup
│   ├── contexts/
│   │   └── NavContext.tsx  ← useNav() hook, NavProvider
│   ├── config/
│   │   └── nav.ts         ← navConfig (Observer, Organiser, Settings)
│   ├── views/
│   │   ├── ObserverView.tsx   ← your target for W05
│   │   ├── OrganiserView.tsx  ← stub, leave alone
│   │   └── SettingsView.tsx   ← stub, leave alone
│   └── styles/index.css   ← Tailwind v4, AWB warm dark palette
└── docs/planning/angeleye-wave-1/
    ├── IMPLEMENTATION_PLAN.md
    └── AGENTS.md           ← this file
```

---

## AngelEye Data Layout

```
~/.claude/angeleye/
  registry.json              ← index of all sessions (created/updated by data service)
  sessions/
    session-<id>.jsonl       ← one per active session, one JSON line per event
  archive/
    session-<id>.jsonl       ← rotated here at SessionEnd
  workspaces.json            ← named workspace configs (create empty if missing)
```

---

## Core Types (defined in W01, used by all subsequent units)

```typescript
// shared/src/angeleye.ts

export type AngelEyeEventType =
  | 'session_start'
  | 'user_prompt'
  | 'tool_use'
  | 'stop'
  | 'session_end'
  | 'subagent_start'
  | 'subagent_stop';

export type AngelEyeSource = 'hook' | 'transcript'; // transcript = wave 2

export interface AngelEyeEvent {
  id: string; // nanoid generated server-side
  session_id: string;
  ts: string; // ISO8601
  source: AngelEyeSource;
  event: AngelEyeEventType;
  cwd?: string;
  agent_id?: string;
  // event-specific payload (all optional — only set for relevant event type)
  prompt?: string; // user_prompt events
  tool?: string; // tool_use events
  tool_use_id?: string;
  tool_summary?: Record<string, unknown>; // summarised — never raw tool_input
  result?: string; // tool_use events
  reason?: string; // stop, session_end, subagent_stop
  last_message?: string; // stop, subagent_stop (v2.1.47+)
  agent_type?: string; // subagent_start, subagent_stop
}

export interface RegistryEntry {
  session_id: string;
  project: string; // derived from cwd (last path segment)
  project_dir: string; // full cwd at session_start
  started_at: string; // ISO8601
  last_active: string; // ISO8601
  name: string | null; // set by /angeleye:name-session skill
  tags: string[];
  workspace_id: string | null;
  status: 'active' | 'ended';
  source: AngelEyeSource;
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export type Registry = Record<string, RegistryEntry>;
```

---

## Socket.io Event Pattern

**Existing events** (in `shared/src/types.ts` — do not change):

```typescript
interface ServerToClientEvents {
  'server:pong': (data: { message: string; timestamp: string }) => void;
  // ... entity events
}
```

**Add AngelEye events** — extend the interfaces (W01 adds these to shared/):

```typescript
interface ServerToClientEvents {
  // existing events...
  'angeleye:event': (data: AngelEyeEvent) => void;
  'angeleye:registry': (data: Registry) => void;
}
```

**Server-side emit pattern** (copy from server/src/index.ts — `io` is the Socket.io server):

```typescript
// In a route handler that has access to io:
io.emit('angeleye:event', event);
io.emit('angeleye:registry', registry);
```

**Passing `io` to routes**: inject via middleware or pass directly when registering the router.
See how the existing routes work in server/src/index.ts and follow the same pattern.

---

## Route Pattern (copy from server/src/routes/health.ts)

```typescript
import { Router } from 'express';
import { apiSuccess } from '../helpers/response.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/your-path', async (req, res, next) => {
  try {
    // logic here
    apiSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

export default router;
```

**Register route in server/src/index.ts**:

```typescript
import yourRouter from './routes/your-route.js';
// ...
app.use(yourRouter);
```

---

## Hook Endpoint Specifics (W03)

### Incoming payload shape (from Claude Code)

```typescript
interface HookPayload {
  session_id: string;
  hook_event_name: string;
  transcript_path?: string;
  cwd?: string;
  agent_id?: string;
  agent_type?: string;
  // SessionStart
  source?: string;
  model?: string;
  // UserPromptSubmit
  user_prompt?: string;
  // PostToolUse
  tool_name?: string;
  tool_use_id?: string;
  tool_input?: Record<string, unknown>;
  tool_result?: string;
  // Stop
  reason?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string;
  // SubagentStart/Stop
  // (uses agent_type, agent_id, reason, last_assistant_message from above)
}
```

### Stop hook guard — CRITICAL

```typescript
// Check this FIRST before any other logic
if (body.stop_hook_active === true) {
  return res.status(200).json({ continue: true });
}
```

### Tool summarisation

```typescript
function summariseTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Record<string, unknown> {
  if (toolName === 'Bash') return { command: String(toolInput.command ?? '').slice(0, 300) };
  if (toolName === 'Write')
    return { file: toolInput.file_path, lines: String(toolInput.content ?? '').split('\n').length };
  if (toolName === 'Read') return { file: toolInput.file_path };
  if (toolName === 'Edit' || toolName === 'MultiEdit') return { file: toolInput.file_path };
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__');
    return { mcp_server: parts[1], mcp_tool: parts.slice(2).join('__') };
  }
  return { keys: Object.keys(toolInput).slice(0, 5) };
}
```

### Hook event name → internal event type mapping

```typescript
const EVENT_MAP: Record<string, AngelEyeEventType> = {
  SessionStart: 'session_start',
  UserPromptSubmit: 'user_prompt',
  PostToolUse: 'tool_use',
  Stop: 'stop',
  SessionEnd: 'session_end',
  SubagentStart: 'subagent_start',
  SubagentStop: 'subagent_stop',
};
```

### Response format

Always return 200 with `{ continue: true }`. Never return 4xx/5xx — Claude Code treats non-200 as a hook failure.

---

## Data Service Specifics (W02)

Use Node.js `fs/promises` — no external file-watching library needed in wave 1.
Use `nanoid` for generating event IDs — already available in the project or install as needed.

```typescript
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ANGELEYE_DIR = join(homedir(), '.claude', 'angeleye');
const SESSIONS_DIR = join(ANGELEYE_DIR, 'sessions');
const ARCHIVE_DIR = join(ANGELEYE_DIR, 'archive');
const REGISTRY_PATH = join(ANGELEYE_DIR, 'registry.json');
const WORKSPACES_PATH = join(ANGELEYE_DIR, 'workspaces.json');
```

**Init**: create all dirs + empty registry.json + empty workspaces.json if missing.
**Write event**: append one JSON line to `sessions/session-<id>.jsonl`.
**Update registry**: read registry.json, update entry, write back atomically.
**Archive**: `rename` sessions/session-<id>.jsonl → archive/session-<id>.jsonl at SessionEnd.

---

## Client-Side Socket.io Pattern

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { AngelEyeEvent } from '@appystack/shared';

// Connect once, outside component
const socket = io('/', { path: '/socket.io' });

// Inside component
const [events, setEvents] = useState<AngelEyeEvent[]>([]);

useEffect(() => {
  socket.on('angeleye:event', (event) => {
    setEvents((prev) => [event, ...prev].slice(0, 200)); // keep last 200
  });
  return () => {
    socket.off('angeleye:event');
  };
}, []);
```

---

## CSS / Styling

Tailwind v4 with AWB warm dark palette. Key classes:

- Background: `bg-background` (#0f0d0c)
- Surface: `bg-surface` (#1a1614)
- Borders: `border-border` (#342d2d)
- Primary accent: `text-primary` (#ccba9d warm beige)
- Muted text: `text-muted-foreground` (#879294)
- Font: `font-bebas` for headings (Bebas Neue, loaded via Google Fonts)
- Base font: monospace (body default)

---

## Quality Gates (all must pass before marking work unit done)

1. `npm run typecheck` passes with zero errors
2. `npm run lint` passes with zero errors
3. The work unit's specific function is testable (write at least one test for new server-side logic)
4. No raw `tool_input` stored — only summarised payloads
5. No `console.log` — use `logger.info/error` from `server/src/config/logger.ts`
6. Imports use `.js` extension (ESM — e.g. `import foo from './foo.js'`)

---

## Anti-Patterns to Avoid

- **Do not store raw `tool_input`** — can be 100KB+. Always summarise.
- **Do not return non-200 from hook endpoint** — Claude Code treats it as failure.
- **Do not skip the stop_hook_active guard** — causes infinite loops.
- **Do not use `require()`** — project is ESM throughout.
- **Do not use `any` types** — use `unknown` and narrow properly.
- **Do not import from `@appystack/shared` without rebuilding shared first** — run `npm run build -w shared` if types are missing.
- **Do not write to `server/src/index.ts` beyond adding route imports** — it's complex, changes break Socket.io setup.
- **Skill files must be named `SKILL.md`** — Claude Code only discovers skills via `~/.claude/skills/<name>/SKILL.md`. Files named `install.md`, `name-session.md` etc. inside a skill directory are NOT discovered. Always write the primary skill file as `SKILL.md`.

---

## Learnings

(Updated by coordinator as waves complete)
