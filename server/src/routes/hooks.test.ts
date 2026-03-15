import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { AngelEyeEvent, RegistryEntry } from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { _setDataDir } from '../services/angeleye-data.js';
import { createHooksRouter } from './hooks.js';

const mockIo = { emit: vi.fn() };

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-hooks-test-'));
  _setDataDir(testDir);
  mockIo.emit.mockClear();
  app = express();
  app.use(express.json());
  app.use(createHooksRouter(mockIo as never));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// Helper: read the session JSONL file and parse lines
async function readSessionEvents(sessionId: string): Promise<AngelEyeEvent[]> {
  const filePath = join(testDir, 'sessions', `session-${sessionId}.jsonl`);
  const raw = await readFile(filePath, 'utf-8');
  return raw
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as AngelEyeEvent);
}

// Helper: read the registry
async function readRegistry(): Promise<Record<string, RegistryEntry>> {
  const raw = await readFile(join(testDir, 'registry.json'), 'utf-8');
  return JSON.parse(raw) as Record<string, RegistryEntry>;
}

// ── Stop hook guard ────────────────────────────────────────────────────────────

describe('POST /hooks/Stop — stop_hook_active guard', () => {
  it('returns 200 { continue: true } immediately, no event written, io.emit not called', async () => {
    const res = await request(app).post('/hooks/Stop').send({
      stop_hook_active: true,
      session_id: 'ses-guard-1',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ continue: true });
    expect(mockIo.emit).not.toHaveBeenCalled();

    // No session file should exist (dirs may not even be created)
    const sessionFile = join(testDir, 'sessions', 'session-ses-guard-1.jsonl');
    await expect(readFile(sessionFile, 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

// ── Unknown event ──────────────────────────────────────────────────────────────

describe('POST /hooks/UnknownEvent', () => {
  it('returns 200 { continue: true }, no event written', async () => {
    const res = await request(app).post('/hooks/UnknownEvent').send({
      session_id: 'ses-unknown-1',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ continue: true });
    expect(mockIo.emit).not.toHaveBeenCalled();
  });
});

// ── SessionStart ───────────────────────────────────────────────────────────────

describe('POST /hooks/SessionStart', () => {
  it('returns 200, writes event to JSONL, creates registry entry, emits angeleye:event', async () => {
    const res = await request(app).post('/hooks/SessionStart').send({
      session_id: 'ses-start-1',
      cwd: '/projects/my-cool-app',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ continue: true });

    // Event written to JSONL
    const events = await readSessionEvents('ses-start-1');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('session_start');
    expect(events[0]?.session_id).toBe('ses-start-1');
    expect(events[0]?.source).toBe('hook');
    expect(events[0]?.cwd).toBe('/projects/my-cool-app');

    // Registry entry created
    const registry = await readRegistry();
    const entry = registry['ses-start-1'];
    expect(entry).toBeDefined();
    expect(entry?.status).toBe('active');
    expect(entry?.project).toBe('my-cool-app');
    expect(entry?.project_dir).toBe('/projects/my-cool-app');

    // io.emit called once with correct event name and event object
    expect(mockIo.emit).toHaveBeenCalledOnce();
    const [eventName, emittedEvent] = mockIo.emit.mock.calls[0] as [string, AngelEyeEvent];
    expect(eventName).toBe(SOCKET_EVENTS.ANGELEYE_EVENT);
    expect(emittedEvent.event).toBe('session_start');
    expect(emittedEvent.session_id).toBe('ses-start-1');
  });
});

// ── UserPromptSubmit — prompt field ───────────────────────────────────────────

describe('POST /hooks/UserPromptSubmit — prompt field', () => {
  it('stores event with prompt text from `prompt` field', async () => {
    const res = await request(app).post('/hooks/UserPromptSubmit').send({
      session_id: 'ses-prompt-1',
      cwd: '/projects/app',
      prompt: 'What does this file do?',
    });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-prompt-1');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('user_prompt');
    expect(events[0]?.prompt).toBe('What does this file do?');
  });
});

// ── UserPromptSubmit — user_prompt fallback ───────────────────────────────────

describe('POST /hooks/UserPromptSubmit — user_prompt fallback', () => {
  it('stores event correctly using `user_prompt` field when `prompt` is absent', async () => {
    const res = await request(app).post('/hooks/UserPromptSubmit').send({
      session_id: 'ses-prompt-2',
      cwd: '/projects/app',
      user_prompt: 'Explain this code please',
    });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-prompt-2');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('user_prompt');
    expect(events[0]?.prompt).toBe('Explain this code please');
  });
});

// ── PostToolUse — Bash ─────────────────────────────────────────────────────────

describe('POST /hooks/PostToolUse — Bash', () => {
  it('stores tool_summary with command, raw tool_input not stored', async () => {
    const res = await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tool-bash',
        tool_name: 'Bash',
        tool_input: { command: 'npm test', env: { NODE_ENV: 'test' } },
      });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-tool-bash');
    expect(events).toHaveLength(1);
    const evt = events[0];
    expect(evt?.event).toBe('tool_use');
    expect(evt?.tool).toBe('Bash');
    expect(evt?.tool_summary).toEqual({ command: 'npm test' });
    // raw tool_input fields must not appear on the event
    expect(evt).not.toHaveProperty('tool_input');
  });
});

// ── PostToolUse — Write ────────────────────────────────────────────────────────

describe('POST /hooks/PostToolUse — Write', () => {
  it('stores tool_summary with file and line count', async () => {
    const res = await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tool-write',
        tool_name: 'Write',
        tool_input: { file_path: 'src/foo.ts', content: 'x\ny\nz' },
      });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-tool-write');
    expect(events).toHaveLength(1);
    expect(events[0]?.tool_summary).toEqual({ file: 'src/foo.ts', lines: 3 });
  });
});

// ── PostToolUse — Read ─────────────────────────────────────────────────────────

describe('POST /hooks/PostToolUse — Read', () => {
  it('stores tool_summary with file path', async () => {
    const res = await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tool-read',
        tool_name: 'Read',
        tool_input: { file_path: 'src/bar.ts' },
      });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-tool-read');
    expect(events).toHaveLength(1);
    expect(events[0]?.tool_summary).toEqual({ file: 'src/bar.ts' });
  });
});

// ── PostToolUse — MCP ─────────────────────────────────────────────────────────

describe('POST /hooks/PostToolUse — MCP', () => {
  it('stores tool_summary with mcp_server and mcp_tool', async () => {
    const res = await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tool-mcp',
        tool_name: 'mcp__brave-search__brave_web_search',
        tool_input: { query: 'node.js docs' },
      });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-tool-mcp');
    expect(events).toHaveLength(1);
    expect(events[0]?.tool_summary).toEqual({
      mcp_server: 'brave-search',
      mcp_tool: 'brave_web_search',
    });
  });
});

// ── Stop (not stop_hook_active) ────────────────────────────────────────────────

describe('POST /hooks/Stop — normal stop', () => {
  it('stores event with reason and last_message, updates registry', async () => {
    // Establish the session first
    await request(app).post('/hooks/SessionStart').send({
      session_id: 'ses-stop-1',
      cwd: '/projects/myapp',
    });
    mockIo.emit.mockClear();

    const res = await request(app).post('/hooks/Stop').send({
      session_id: 'ses-stop-1',
      reason: 'end_turn',
      last_assistant_message: 'done',
    });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-stop-1');
    expect(events).toHaveLength(2); // session_start + stop
    const stopEvt = events[1];
    expect(stopEvt?.event).toBe('stop');
    expect(stopEvt?.reason).toBe('end_turn');
    expect(stopEvt?.last_message).toBe('done');

    // Registry updated (last_active changed)
    const registry = await readRegistry();
    expect(registry['ses-stop-1']?.status).toBe('active');
  });
});

// ── SessionEnd ─────────────────────────────────────────────────────────────────

describe('POST /hooks/SessionEnd', () => {
  it('sets registry status to ended and archives the session file', async () => {
    // Create session first so the JSONL file exists for archiving
    await request(app).post('/hooks/SessionStart').send({
      session_id: 'ses-end-1',
      cwd: '/projects/endapp',
    });
    mockIo.emit.mockClear();

    const res = await request(app).post('/hooks/SessionEnd').send({
      session_id: 'ses-end-1',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ continue: true });

    // Registry status set to ended
    const registry = await readRegistry();
    expect(registry['ses-end-1']?.status).toBe('ended');

    // Active session file should be gone (archived)
    const sessionFile = join(testDir, 'sessions', 'session-ses-end-1.jsonl');
    await expect(readFile(sessionFile, 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });

    // Archive file should exist
    const archiveFile = join(testDir, 'archive', 'session-ses-end-1.jsonl');
    const archiveContent = await readFile(archiveFile, 'utf-8');
    expect(archiveContent.trim().length).toBeGreaterThan(0);
  });
});

// ── Non-SessionStart derives project from cwd ─────────────────────────────────

describe('Non-SessionStart populates project from cwd', () => {
  it('first event for a session is UserPromptSubmit — registry entry has project from cwd basename', async () => {
    const res = await request(app).post('/hooks/UserPromptSubmit').send({
      session_id: 'ses-cwd-1',
      cwd: '/projects/derived-project',
      prompt: 'hello',
    });

    expect(res.status).toBe(200);

    const registry = await readRegistry();
    const entry = registry['ses-cwd-1'];
    expect(entry).toBeDefined();
    expect(entry?.project).toBe('derived-project');
    expect(entry?.project_dir).toBe('/projects/derived-project');
  });
});

// ── hook_event_name field overrides URL param ─────────────────────────────────

describe('hook_event_name field in body', () => {
  it('uses hook_event_name over URL param when both present', async () => {
    // URL says Stop but body says SessionStart — body wins
    const res = await request(app).post('/hooks/Stop').send({
      session_id: 'ses-override-1',
      cwd: '/projects/overrideapp',
      hook_event_name: 'SessionStart',
    });

    expect(res.status).toBe(200);

    const events = await readSessionEvents('ses-override-1');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('session_start');

    // Registry created (only session_start path does full create)
    const registry = await readRegistry();
    expect(registry['ses-override-1']?.project).toBe('overrideapp');
  });
});

// ── io.emit called with correct event ─────────────────────────────────────────

describe('io.emit on valid hook', () => {
  it('emits once with SOCKET_EVENTS.ANGELEYE_EVENT and the event object', async () => {
    await request(app).post('/hooks/UserPromptSubmit').send({
      session_id: 'ses-emit-1',
      cwd: '/projects/emitapp',
      prompt: 'test prompt',
    });

    expect(mockIo.emit).toHaveBeenCalledOnce();
    const [eventName, emittedEvent] = mockIo.emit.mock.calls[0] as [string, AngelEyeEvent];
    expect(eventName).toBe(SOCKET_EVENTS.ANGELEYE_EVENT);
    expect(emittedEvent.event).toBe('user_prompt');
    expect(emittedEvent.session_id).toBe('ses-emit-1');
    expect(emittedEvent.prompt).toBe('test prompt');
    expect(typeof emittedEvent.id).toBe('string');
    expect(typeof emittedEvent.ts).toBe('string');
  });
});
