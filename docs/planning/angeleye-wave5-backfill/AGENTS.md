# AGENTS.md — AngelEye Wave 5: Transcript Backfill + Context Skill

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Populate registry from historical Claude JSONL transcripts; add context skill.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
node scripts/screenshot.mjs   # capture screenshots after changes
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in beforeEach, `rm(testDir)` in afterEach
- All fetch calls must have `.catch(() => {})`
- `AngelEyeSource` type already has `'transcript'` variant — defined in `shared/src/angeleye.ts`
- AngelEye data dir: `~/.claude/angeleye/`
- Claude projects dir: `~/.claude/projects/<project-slug>/<session-uuid>.jsonl`

---

## Claude JSONL Format (do not re-investigate)

Each line in `~/.claude/projects/<slug>/<session-id>.jsonl` is a JSON object. Key entry types:

```typescript
// User prompt
{ type: 'user', isMeta?: boolean, message: { role: 'user', content: string },
  timestamp: string, sessionId: string, cwd: string }

// Assistant turn (may contain tool_use blocks)
{ type: 'assistant', message: { role: 'assistant', content: Array<TextBlock | ToolUseBlock> },
  timestamp: string, sessionId: string, cwd: string }

// Tool use block (inside assistant content array)
{ type: 'tool_use', id: string, name: string, input: Record<string, unknown> }

// Progress (hook events, ignore for backfill)
{ type: 'progress', ... }

// file-history-snapshot, system, last-prompt — ignore for backfill
```

**Project dir decode**: The `<project-slug>` folder name encodes the absolute path with `-` replacing `/`.
e.g. `-Users-davidcruwys-dev-ad-apps-angeleye` → `/Users/davidcruwys/dev/ad/apps/angeleye`

Decode: `'/' + slug.replace(/-/g, '/')` — but note path separators in dir names may also be `-`, so use `cwd` from the JSONL entries directly (it's already an absolute path).

**Idempotency**: skip any `session_id` already present in the AngelEye registry.

---

## B007 — Transcript Backfill

### What to build

A server-side backfill that scans `~/.claude/projects/` and registers historical sessions.

### 1. New function in `server/src/services/angeleye-data.ts`

```typescript
export interface BackfillResult {
  scanned: number; // total JSONL files found
  imported: number; // new sessions added to registry
  skipped: number; // already in registry
  errors: number; // files that failed to parse
}

export async function backfillTranscripts(claudeProjectsDir?: string): Promise<BackfillResult>;
```

Implementation outline:

```typescript
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, homedir } from 'node:path'; // these already exist in file

export async function backfillTranscripts(
  claudeProjectsDir = join(homedir(), '.claude', 'projects')
): Promise<BackfillResult> {
  const result = { scanned: 0, imported: 0, skipped: 0, errors: 0 };

  // Read existing registry once
  const registry = await readRegistry();

  // Walk project dirs
  let projectDirs: string[];
  try {
    projectDirs = await readdir(claudeProjectsDir);
  } catch {
    return result; // dir doesn't exist — not an error
  }

  for (const projectSlug of projectDirs) {
    const projectPath = join(claudeProjectsDir, projectSlug);
    let sessionFiles: string[];
    try {
      sessionFiles = (await readdir(projectPath)).filter((f) => f.endsWith('.jsonl'));
    } catch {
      continue;
    }

    for (const file of sessionFiles) {
      const sessionId = file.replace('.jsonl', '');
      result.scanned++;

      // Skip already-known sessions
      if (registry[sessionId]) {
        result.skipped++;
        continue;
      }

      try {
        const raw = await readFile(join(projectPath, file), 'utf-8');
        const lines = raw.split('\n').filter((l) => l.trim());
        const entries = lines.map((l) => JSON.parse(l));

        // Extract metadata from entries
        const cwdEntry = entries.find((e) => e.cwd);
        const cwd: string = cwdEntry?.cwd ?? '';
        const timestamps = entries
          .filter((e) => e.timestamp)
          .map((e) => e.timestamp as string)
          .sort();
        const started_at = timestamps[0] ?? new Date().toISOString();
        const last_active = timestamps[timestamps.length - 1] ?? started_at;

        // Count real user prompts (non-meta, non-command)
        const promptCount = entries.filter(
          (e) =>
            e.type === 'user' &&
            !e.isMeta &&
            typeof e.message?.content === 'string' &&
            !e.message.content.startsWith('<')
        ).length;

        if (promptCount === 0) {
          result.skipped++; // empty/meta-only sessions aren't useful
          continue;
        }

        // Derive project from cwd
        const project_dir = cwd;
        const project = cwd.split('/').filter(Boolean).pop() ?? '';

        // Write to registry
        await updateRegistry(sessionId, {
          session_id: sessionId,
          project,
          project_dir,
          started_at,
          last_active,
          status: 'ended',
          source: 'transcript',
          name: null,
          tags: [],
          workspace_id: null,
        });

        // Write events to sessions dir
        const events = transcriptToEvents(sessionId, entries);
        for (const event of events) {
          await writeEvent(event);
        }

        registry[sessionId] = { session_id: sessionId } as RegistryEntry; // mark known
        result.imported++;
      } catch {
        result.errors++;
      }
    }
  }

  return result;
}
```

### 2. Helper: `transcriptToEvents`

Map Claude JSONL entries to `AngelEyeEvent[]`. Add this helper (not exported — internal to angeleye-data.ts):

```typescript
function transcriptToEvents(sessionId: string, entries: unknown[]): AngelEyeEvent[] {
  const events: AngelEyeEvent[] = [];

  for (const e of entries as Record<string, unknown>[]) {
    const ts = (e.timestamp as string) ?? new Date().toISOString();
    const cwd = (e.cwd as string) ?? '';

    if (e.type === 'user' && !e.isMeta) {
      const content = (e.message as Record<string, unknown>)?.content;
      if (typeof content === 'string' && content.length > 0 && !content.startsWith('<')) {
        events.push({
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts,
          source: 'transcript',
          event: 'user_prompt',
          cwd,
          prompt: content.slice(0, 500),
        });
      }
    }

    if (e.type === 'assistant') {
      const content = (e.message as Record<string, unknown>)?.content;
      if (Array.isArray(content)) {
        for (const block of content as Record<string, unknown>[]) {
          if (block.type === 'tool_use' && typeof block.name === 'string') {
            events.push({
              id: crypto.randomUUID(),
              session_id: sessionId,
              ts,
              source: 'transcript',
              event: 'tool_use',
              cwd,
              tool: block.name,
            });
          }
        }
      }
    }
  }

  return events;
}
```

### 3. New route: `server/src/routes/backfill.ts`

```typescript
import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { backfillTranscripts } from '../services/angeleye-data.js';
import { logger } from '../config/logger.js';

const router = Router();

router.post('/', async (_req, res) => {
  try {
    const result = await backfillTranscripts();
    logger.info(result, 'Backfill complete');
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'Backfill failed');
    return apiFailure(res, 'Backfill failed', 500);
  }
});

export default router;
```

Mount in `server/src/index.ts` — find where sessionsRouter is mounted, add:

```typescript
import backfillRouter from './routes/backfill.js';
// ...
app.use('/api/backfill', backfillRouter);
```

### 4. Tests: `server/src/routes/backfill.test.ts`

Create with at least 4 tests:

1. POST /api/backfill — empty projects dir → `{ scanned:0, imported:0, skipped:0, errors:0 }`
2. POST /api/backfill — one session JSONL with 2 real prompts → imported:1
3. POST /api/backfill — same session again → skipped:1 (idempotent)
4. POST /api/backfill — JSONL with only meta/system entries → skipped (no real prompts)

Use real tmpdir for both the AngelEye data dir AND a fake Claude projects dir. Write fixture JSONL files to test with.

**Fixture JSONL line format** (minimum viable):

```jsonl
{"type":"user","isMeta":false,"message":{"role":"user","content":"Fix the bug"},"timestamp":"2026-03-01T10:00:00.000Z","sessionId":"test-session-abc","cwd":"/Users/test/dev/myproject"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu1","name":"Read","input":{"file_path":"/foo"}}]},"timestamp":"2026-03-01T10:00:05.000Z","sessionId":"test-session-abc","cwd":"/Users/test/dev/myproject"}
{"type":"user","isMeta":false,"message":{"role":"user","content":"Looks good, commit it"},"timestamp":"2026-03-01T10:05:00.000Z","sessionId":"test-session-abc","cwd":"/Users/test/dev/myproject"}
```

### No new tests needed for client

This is server + data service only. No UI changes in B007.

### Done when

- `backfillTranscripts()` implemented and exported from `angeleye-data.ts`
- `POST /api/backfill` returns `BackfillResult`
- 4+ new tests in `backfill.test.ts` — all passing
- Original 160 tests still pass
- typecheck + lint clean

---

## B010 — /angeleye:context Skill

### What to build

A Claude Code skill file at `/Users/davidcruwys/dev/ad/apps/angeleye/.claude/skills/angeleye-context.md`.

When a user invokes `/angeleye:context` in any Claude session, it:

1. Fetches the session list from `GET http://localhost:5051/api/sessions`
2. Asks the user which session (or takes session_id as an arg)
3. Fetches events from `GET http://localhost:5051/api/sessions/:id/events`
4. Assembles and outputs a structured context block

### Skill file location

```
/Users/davidcruwys/dev/ad/apps/angeleye/.claude/skills/angeleye-context.md
```

This is inside the AngelEye project — the skill is project-local (available when working in this repo).

### Skill file structure

```markdown
---
name: angeleye-context
description: Fetch an AngelEye session's event history and assemble a context block for handover or analysis.
---

<skill-instructions>
When this skill is invoked...
[instructions for Claude to follow]
</skill-instructions>
```

### What the skill does (instructions for Claude)

```
1. Call GET http://localhost:5051/api/sessions and display a numbered list:
   - Show: session name (or project_dir basename), project, last_active, status
   - Ask user to pick one (or accept a session_id directly as the skill arg)

2. Call GET http://localhost:5051/api/sessions/:id/events

3. Assemble and output a context block in this format:

---
## AngelEye Context — [session name or project]
**Session**: [session_id]
**Project**: [project_dir]
**Period**: [started_at] → [last_active]
**Status**: [active|ended]

### What happened
[bullet list of user_prompt events — first 80 chars of each]

### Tools used
[bullet list of tool_use events grouped by tool name with counts]

### Summary
[3-sentence summary: what was worked on, key actions taken, last known state]
---

4. Tell the user they can paste this block into a new Claude conversation as context.
```

### No server changes needed

B010 is purely a skill file. It uses the existing `GET /api/sessions` and `GET /api/sessions/:id/events` endpoints.

### No new tests needed

Skills are markdown files — not unit-testable. Manually verify by checking the file exists and the skill description is clear.

### Done when

- `.claude/skills/angeleye-context.md` exists with correct frontmatter and instructions
- typecheck + lint still clean (no code changes — skill file is markdown)
- All 160+ tests still pass

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean
2. `npm run lint` passes clean
3. `npm test` passes (160+ tests — no regressions)
4. No `console.log` left in production code
5. All fetch calls have `.catch(() => {})`
6. Imports use `.js` extension (ESM)
7. No mocking fs — use real tmpdir + `_setDataDir`

---

## Anti-Patterns to Avoid

- **Do not use `apiError`** — it's `apiFailure(res, message, statusCode)`
- **Do not mock the filesystem** in tests — use real tmpdir + `_setDataDir`
- **Do not write events before checking idempotency** — check registry first, skip if known
- **Do not fail if `~/.claude/projects/` doesn't exist** — return empty result gracefully
- **Do not hardcode the Claude projects path** — accept it as an optional param (enables testing)
