# AGENTS.md — AngelEye Wave 3: Organiser View

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript + Socket.io (npm workspaces: client/, server/, shared/)
**Worktree**: `/Users/davidcruwys/dev/ad/apps/angeleye-wave3/` — ALL work here
**Wave goal**: Organiser view — workspace CRUD, inbox, drag-to-assign, folder inference.

---

## Build & Run Commands

```bash
# From worktree root
npm run typecheck
npm test
npm run lint
npm run build -w shared    # rebuild shared if types change
npm test --workspace server
npm test --workspace client
```

---

## Directory Structure

```
angeleye-wave3/
├── shared/src/
│   ├── angeleye.ts        ← AngelEye types — add WorkspaceEntry here if needed
│   └── index.ts
├── server/src/
│   ├── helpers/response.ts    ← apiSuccess, apiFailure (NOT apiError)
│   ├── routes/
│   │   ├── sessions.ts        ← PATCH /api/sessions/:id already here
│   │   └── workspaces.ts      ← W01: create this file
│   ├── services/
│   │   └── angeleye-data.ts   ← W01: add workspace CRUD functions here
│   └── index.ts               ← W01: mount workspaces router here
├── client/src/
│   └── views/
│       └── OrganiserView.tsx  ← W02/W03/W04: replace stub
└── docs/planning/angeleye-wave3-organiser/
```

---

## Data Layout

```
~/.claude/angeleye/
  registry.json         ← sessions (already exists)
  workspaces.json       ← workspaces: { workspaces: WorkspaceEntry[] }
  sessions/
  archive/
```

**workspaces.json format**:

```json
{
  "workspaces": [
    { "id": "ws-abc123", "name": "SupportSignal", "tags": [], "created_at": "2026-03-15T..." }
  ]
}
```

---

## Core Types (shared/src/angeleye.ts)

Already defined:

```typescript
export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}
```

---

## Test Isolation Pattern (from wave 2)

```typescript
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _setDataDir, initAngelEyeDirs } from '../services/angeleye-data.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});
```

---

## Route Pattern

```typescript
// server/src/routes/workspaces.ts
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
// import workspace functions from angeleye-data

const router = Router();
// routes here
export default router;
```

Mount in server/src/index.ts — find where sessionsRouter is mounted, add workspacesRouter the same way.

---

## W01 — Workspace Data Service + API

### Functions to add to angeleye-data.ts

```typescript
export async function readWorkspaces(): Promise<WorkspaceEntry[]>;
export async function writeWorkspaces(workspaces: WorkspaceEntry[]): Promise<void>;
export async function createWorkspace(name: string): Promise<WorkspaceEntry>;
export async function updateWorkspace(
  id: string,
  updates: Partial<Pick<WorkspaceEntry, 'name' | 'tags'>>
): Promise<WorkspaceEntry>;
export async function deleteWorkspace(id: string): Promise<void>;
```

`createWorkspace` generates id with `crypto.randomUUID()`, sets `created_at` to current ISO timestamp.

### Routes (server/src/routes/workspaces.ts)

```
GET  /api/workspaces          → { workspaces: WorkspaceEntry[] }
POST /api/workspaces          → body: { name: string } → 201, created entry
PATCH /api/workspaces/:id     → body: { name?, tags? } → updated entry, 404 if not found
DELETE /api/workspaces/:id    → 204, 404 if not found
```

### Tests (server/src/services/angeleye-data.test.ts additions or new file)

Create `server/src/routes/workspaces.test.ts`:

1. GET /api/workspaces — empty list
2. POST /api/workspaces — creates entry with id, name, created_at
3. POST /api/workspaces — missing name returns 400
4. GET /api/workspaces — returns created workspace
5. PATCH /api/workspaces/:id — updates name
6. PATCH /api/workspaces/:id — unknown id returns 404
7. DELETE /api/workspaces/:id — removes workspace
8. DELETE /api/workspaces/:id — unknown id returns 404

Also add to angeleye-data.test.ts (or separate service test file): 9. readWorkspaces — returns [] when file has empty array 10. createWorkspace — returns entry with correct fields 11. updateWorkspace — merges partial updates 12. deleteWorkspace — removes by id, leaves others intact

---

## W02 — OrganiserView UI Foundation

Replace the stub at `client/src/views/OrganiserView.tsx`.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ORGANISER     [+ New Workspace]                        │
├──────────────────────────┬──────────────────────────────┤
│  INBOX (unassigned)      │  WORKSPACES                  │
│                          │                              │
│  ○ supportsignal  3m ago │  ┌─ SupportSignal ─────┐   │
│  ○ angeleye      12m ago │  │  (empty)             │   │
│  ○ bmad-mary      1h ago │  └──────────────────────┘   │
│                          │                              │
│                          │  ┌─ FliVideo ──────────┐   │
│                          │  │  ○ flivideo   5m ago │   │
│                          │  └──────────────────────┘   │
└──────────────────────────┴──────────────────────────────┘
```

### Data fetching

```typescript
// Fetch on mount, no polling — this view is visited occasionally
const [sessions, setSessions] = useState<RegistryEntry[]>([]);
const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);

useEffect(() => {
  fetch('/api/sessions')
    .then((r) => r.json())
    .then((d) => setSessions(d.data.sessions))
    .catch(() => {});
  fetch('/api/workspaces')
    .then((r) => r.json())
    .then((d) => setWorkspaces(d.data.workspaces))
    .catch(() => {});
}, []);
```

### Session assignment (W02 — click only, no drag yet)

Each session card in inbox has a dropdown or simple button: "Assign to workspace →". Clicking opens a small menu of workspaces. Selecting one calls `PATCH /api/sessions/:id` with `{ workspace_id }` and updates local state.

### Create workspace

"+ New Workspace" button opens an inline input. On submit: POST /api/workspaces, add to local workspaces state.

### Styling

Follow the warm dark palette from AGENTS.md wave 1:

- Background: `bg-background`, surface: `bg-surface`
- Border: `border border-border`
- Primary: `text-primary` (warm beige)
- Muted: `text-muted-foreground`
- Font: `font-bebas` for section headings

---

## W03 — Drag-to-Assign

Wrap OrganiserView content with `@dnd-kit/core` DndContext.

### Pattern

```typescript
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'

// Draggable session card
function DraggableSession({ session }: { session: RegistryEntry }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: session.session_id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>...</div>
}

// Droppable zone (inbox or workspace)
function DroppableZone({ id, children }: { id: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} className={isOver ? 'ring-1 ring-primary' : ''}>{children}</div>
}

// DragEnd handler
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return
  const sessionId = active.id as string
  const targetWorkspaceId = over.id === 'inbox' ? null : over.id as string
  // PATCH /api/sessions/:id with { workspace_id: targetWorkspaceId }
  // Update local state optimistically
}
```

Inbox droppable id: `'inbox'`
Workspace droppable id: the workspace's `id` field

---

## W04 — Folder Inference Badge

On each inbox session, check if any workspace name fuzzy-matches the session's `cwd` last path segments.

```typescript
function inferWorkspace(
  session: RegistryEntry,
  workspaces: WorkspaceEntry[]
): WorkspaceEntry | null {
  if (!session.project_dir) return null;
  const segments = session.project_dir.split('/').filter(Boolean).slice(-3);
  return (
    workspaces.find((ws) =>
      segments.some(
        (seg) =>
          seg.toLowerCase().includes(ws.name.toLowerCase()) ||
          ws.name.toLowerCase().includes(seg.toLowerCase())
      )
    ) ?? null
  );
}
```

If a match is found AND session doesn't already have `'inference:dismissed'` in its tags:
Show a small badge below the session name:

```
"Looks like SupportSignal?" [✓ Yes] [✗ No]
```

- ✓ Yes → PATCH session with `{ workspace_id: ws.id }` → removes from inbox
- ✗ No → PATCH session with `{ tags: [...session.tags, 'inference:dismissed'] }` → hides badge

---

## Quality Gates

1. `npm run typecheck` passes clean
2. `npm test` passes clean (all workspaces)
3. All new server code has tests
4. Client components use `.catch(() => {})` on all fetch calls (lesson from wave 2)
5. No `console.log` — use `logger` server-side
6. Imports use `.js` extension (ESM)
7. No mocking fs — use real tmpdir + \_setDataDir

---

## Anti-Patterns to Avoid

- **Do not auto-assign** based on folder inference — suggestion only, user confirms
- **Do not poll** in OrganiserView — fetch on mount only (this view is visited occasionally)
- **Do not add data-testid to production code** just to make tests pass
- **Do not use apiError** — it's apiFailure
- **Do not write to main repo** — all changes in angeleye-wave3 worktree
- **Do not touch ObserverView** — that's wave 1 code, leave it alone

---

## Learnings from Wave 2

- `_setDataDir(dir)` resets both paths AND the write queue — always call in beforeEach
- Route helpers: `apiSuccess(res, data)` and `apiFailure(res, message, statusCode)`
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- `void fetch()` without `.catch()` causes unhandled rejections — always add `.catch(() => {})`
- Session response: `data.sessions[]`, events response: `data.events[] + data.count`
