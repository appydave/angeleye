import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { AngelEyeEvent, RegistryEntry } from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { _setDataDir, initAngelEyeDirs } from '../services/registry.service.js';
import { createHooksRouter, drainHookQueue } from './hooks.js';

const mockIo = { emit: vi.fn() };

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-hooks-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  mockIo.emit.mockClear();
  app = express();
  app.use(express.json());
  app.use(createHooksRouter(mockIo as never));
});

afterEach(async () => {
  // Deferred hook work must not outlive its temp dir — otherwise a late write
  // recreates a directory this test file just deleted, and (because _setDataDir
  // is module-global) can land in the NEXT test file's data dir.
  await drainHookQueue();
  await rm(testDir, { recursive: true, force: true });
});

// Helper: read the session JSONL file and parse lines
async function readSessionEvents(sessionId: string): Promise<AngelEyeEvent[]> {
  // The handler answers 202 and does its I/O off the response path, so a plain
  // `await request(...)` no longer guarantees the write has landed. Drain first.
  await drainHookQueue();
  const filePath = join(testDir, 'sessions', `session-${sessionId}.jsonl`);
  const raw = await readFile(filePath, 'utf-8');
  return raw
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as AngelEyeEvent);
}

// Helper: read the registry
async function readRegistry(): Promise<Record<string, RegistryEntry>> {
  await drainHookQueue();
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

    expect(res.status).toBe(202);
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
    await drainHookQueue();
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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

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
  it('stores last_message and the real Stop payload, updates registry', async () => {
    // Establish the session first
    await request(app).post('/hooks/SessionStart').send({
      session_id: 'ses-stop-1',
      cwd: '/projects/myapp',
    });
    mockIo.emit.mockClear();

    // Shaped like a real Claude Code 2.1.235 Stop payload. Note there is NO `reason` — that is a
    // SessionEnd field. The old test sent one and asserted it was promoted, which is why the dead
    // read survived: it agreed with the code, not with the platform. Measured 0/191 on real events.
    const res = await request(app)
      .post('/hooks/Stop')
      .send({
        session_id: 'ses-stop-1',
        last_assistant_message: 'done',
        prompt_id: 'prm-stop-1',
        background_tasks: [{ id: 'bg-1', status: 'running' }],
        session_crons: [],
        effort: { level: 'high' },
      });

    expect(res.status).toBe(202);

    const events = await readSessionEvents('ses-stop-1');
    expect(events).toHaveLength(2); // session_start + stop
    const stopEvt = events[1];
    expect(stopEvt?.event).toBe('stop');
    expect(stopEvt?.last_message).toBe('done');
    expect(stopEvt?.prompt_id).toBe('prm-stop-1');
    // The fields that used to be discarded by the ORIGINAL_EVENTS carve-out
    expect(stopEvt?.payload?.background_tasks).toEqual([{ id: 'bg-1', status: 'running' }]);
    expect(stopEvt?.payload?.session_crons).toEqual([]);
    expect(stopEvt?.payload?.effort).toEqual({ level: 'high' });

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

    expect(res.status).toBe(202);
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

    expect(res.status).toBe(202);

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

    expect(res.status).toBe(202);

    const events = await readSessionEvents('ses-override-1');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('session_start');

    // Registry created (only session_start path does full create)
    const registry = await readRegistry();
    expect(registry['ses-override-1']?.project).toBe('overrideapp');
  });
});

// ── Missing session_id falls back to 'unknown' ────────────────────────────────

describe('POST /hooks/UserPromptSubmit — missing session_id', () => {
  it('writes to session-unknown.jsonl when session_id is missing', async () => {
    // initAngelEyeDirs is needed because hooks.ts no longer calls it on startup
    await initAngelEyeDirs();

    const res = await request(app).post('/hooks/UserPromptSubmit').send({
      cwd: '/projects/anon-app',
      prompt: 'What is this?',
      // no session_id field
    });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ continue: true });

    // The session file must be session-unknown.jsonl
    const events = await readSessionEvents('unknown');
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]?.session_id).toBe('unknown');
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

    await drainHookQueue();
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

// ── Wave 11: New event types ──────────────────────────────────────────────────

describe('Wave 11 — new event accepted', () => {
  it('PostToolUseFailure returns 200 and writes tool_failure event', async () => {
    const res = await request(app).post('/hooks/PostToolUseFailure').send({
      session_id: 'ses-w11-fail',
      cwd: '/projects/app',
      tool_name: 'Read',
      error: 'File not found',
    });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ continue: true });

    const events = await readSessionEvents('ses-w11-fail');
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('tool_failure');
  });
});

describe('Wave 11 — payload stored for new events', () => {
  it('WorktreeCreate stores worktree fields in payload', async () => {
    const res = await request(app).post('/hooks/WorktreeCreate').send({
      session_id: 'ses-w11-wt',
      cwd: '/projects/app',
      worktree_path: '/tmp/wt-abc',
      worktree_branch: 'feature-x',
    });

    expect(res.status).toBe(202);
    const events = await readSessionEvents('ses-w11-wt');
    expect(events[0]?.payload).toMatchObject({
      worktree_path: '/tmp/wt-abc',
      worktree_branch: 'feature-x',
    });
  });
});

describe('Wave 11 — error field promoted for failure events', () => {
  it('StopFailure has error on top-level event', async () => {
    const res = await request(app).post('/hooks/StopFailure').send({
      session_id: 'ses-w11-sf',
      error: 'rate_limit_exceeded',
      status_code: 429,
    });

    expect(res.status).toBe(202);
    const events = await readSessionEvents('ses-w11-sf');
    expect(events[0]?.error).toBe('rate_limit_exceeded');
    expect(events[0]?.payload?.status_code).toBe(429);
  });
});

describe('Wave 11 — large payload fields truncated', () => {
  it('truncates string fields over 500 chars in payload', async () => {
    const longMessage = 'x'.repeat(1000);
    const res = await request(app).post('/hooks/Notification').send({
      session_id: 'ses-w11-trunc',
      message: longMessage,
    });

    expect(res.status).toBe(202);
    const events = await readSessionEvents('ses-w11-trunc');
    const msg = events[0]?.payload?.message as string;
    expect(msg.startsWith('x'.repeat(500))).toBe(true);
    // The marker records how much was dropped, so a truncated value is never mistaken for a
    // short one — length is 500 + the marker, not 500.
    expect(msg).toBe(`${'x'.repeat(500)}\u2026[+500]`);
  });
});

describe('Wave 11 — common fields stripped from payload', () => {
  it('payload does not contain session_id, cwd, hook_event_name', async () => {
    const res = await request(app).post('/hooks/CwdChanged').send({
      session_id: 'ses-w11-cwd',
      cwd: '/new/dir',
      hook_event_name: 'CwdChanged',
      transcript_path: '/path/to/transcript',
      old_cwd: '/old/dir',
      new_cwd: '/new/dir',
    });

    expect(res.status).toBe(202);
    const events = await readSessionEvents('ses-w11-cwd');
    const payload = events[0]?.payload;
    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty('session_id');
    expect(payload).not.toHaveProperty('cwd');
    expect(payload).not.toHaveProperty('hook_event_name');
    expect(payload).not.toHaveProperty('transcript_path');
    expect(payload?.old_cwd).toBe('/old/dir');
    expect(payload?.new_cwd).toBe('/new/dir');
  });
});

describe('Wave 11 + canonical reconcile — all 31 EVENT_MAP entries resolve', () => {
  const ALL_HOOKS = [
    'SessionStart',
    'UserPromptSubmit',
    'PostToolUse',
    'Stop',
    'SessionEnd',
    'SubagentStart',
    'SubagentStop',
    'PostToolUseFailure',
    'StopFailure',
    'WorktreeCreate',
    'WorktreeRemove',
    'CwdChanged',
    'PreToolUse',
    'InstructionsLoaded',
    'PreCompact',
    'PostCompact',
    'PermissionRequest',
    'Notification',
    'TeammateIdle',
    'TaskCompleted',
    'ConfigChange',
    'Elicitation',
    'ElicitationResult',
    'FileChanged',
    'TaskCreated',
    'PermissionDenied',
    'Setup',
    'UserPromptExpansion',
    'PostToolBatch',
    'MessageDisplay',
    // v2.1.219
    'DirectoryAdded',
  ];

  it.each(ALL_HOOKS)('%s is accepted (not unknown)', async (hookName) => {
    const res = await request(app)
      .post(`/hooks/${hookName}`)
      .send({ session_id: `ses-all-${hookName}`, cwd: '/tmp' });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ continue: true });
    // If it were unknown, mockIo.emit would NOT be called
    await drainHookQueue();
    expect(mockIo.emit).toHaveBeenCalled();
    mockIo.emit.mockClear();
  });
});

// ── Payload carve-out removal (2026-08-19) ────────────────────────────────────
// Regression cover for docs/architecture/staleness-review.md #a1-4, #a1-5, #a1-6.
// Every field asserted here was measured arriving from Claude Code 2.1.235 and being dropped.

describe('PostToolUse — tool_response, not tool_result', () => {
  it('captures tool_response and ignores the tool_result name that never arrives', async () => {
    const res = await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tr-1',
        tool_name: 'Bash',
        tool_input: { command: 'ls' },
        tool_response: { success: true, stdout: 'a.txt' },
        duration_ms: 42,
        // Claude Code has never sent this key; if it ever does it must not win.
        tool_result: 'should be ignored',
      });

    expect(res.status).toBe(202);
    const evt = (await readSessionEvents('ses-tr-1'))[0];
    expect(evt?.tool_response).toEqual({ success: true, stdout: 'a.txt' });
    expect(evt?.duration_ms).toBe(42);
    // `result` is the deprecated field — it must stay unset rather than quietly resurface.
    expect(evt?.result).toBeUndefined();
  });

  it('captures a string tool_response too', async () => {
    await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-tr-2',
        tool_name: 'Read',
        tool_input: { file_path: '/a' },
        tool_response: 'plain string response',
      });
    const evt = (await readSessionEvents('ses-tr-2'))[0];
    expect(evt?.tool_response).toBe('plain string response');
  });
});

describe('prompt_id — the turn-correlation key', () => {
  it('is promoted on every event type, not just the new ones', async () => {
    const cases: Array<[string, string, Record<string, unknown>]> = [
      ['UserPromptSubmit', 'ses-pid-1', { prompt: 'hello' }],
      ['PostToolUse', 'ses-pid-2', { tool_name: 'Bash', tool_input: { command: 'ls' } }],
      ['SessionStart', 'ses-pid-3', { cwd: '/p' }],
      ['CwdChanged', 'ses-pid-4', { old_cwd: '/a', new_cwd: '/b' }],
      ['Stop', 'ses-pid-5', { last_assistant_message: 'done' }],
    ];

    for (const [path, sid, extra] of cases) {
      await request(app)
        .post(`/hooks/${path}`)
        .send({ session_id: sid, prompt_id: `prm-${sid}`, ...extra });
      const evt = (await readSessionEvents(sid))[0];
      expect(evt?.prompt_id).toBe(`prm-${sid}`);
      // promoted, so it must not also sit in the residual payload
      expect(evt?.payload?.prompt_id).toBeUndefined();
    }
  });

  it('omits payload entirely when nothing survives the strip list', async () => {
    await request(app).post('/hooks/SessionStart').send({
      session_id: 'ses-pid-6',
      cwd: '/p',
      prompt_id: 'prm-6',
      hook_event_name: 'SessionStart',
    });
    const evt = (await readSessionEvents('ses-pid-6'))[0];
    expect(evt?.prompt_id).toBe('prm-6');
    expect(evt?.payload).toBeUndefined();
  });
});

describe('session_title — Claude Code\u2019s own session name', () => {
  it('is captured from SessionStart and UserPromptSubmit', async () => {
    await request(app)
      .post('/hooks/SessionStart')
      .send({ session_id: 'ses-title-1', cwd: '/p', session_title: 'Fix the parser' });
    expect((await readSessionEvents('ses-title-1'))[0]?.session_title).toBe('Fix the parser');

    await request(app)
      .post('/hooks/UserPromptSubmit')
      .send({ session_id: 'ses-title-2', prompt: 'hi', session_title: 'Second one' });
    expect((await readSessionEvents('ses-title-2'))[0]?.session_title).toBe('Second one');
  });
});

describe('SessionEnd — reason lives here, not on Stop', () => {
  it('promotes reason on SessionEnd', async () => {
    await request(app).post('/hooks/SessionStart').send({ session_id: 'ses-se-1', cwd: '/p' });
    await request(app)
      .post('/hooks/SessionEnd')
      .send({ session_id: 'ses-se-1', cwd: '/p', reason: 'clear' });

    // SessionEnd archives the session, so read from the archive
    await drainHookQueue();
    const raw = await readFile(join(testDir, 'archive', 'session-ses-se-1.jsonl'), 'utf-8');
    const events = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as AngelEyeEvent);
    const endEvt = events.find((e) => e.event === 'session_end');
    expect(endEvt?.reason).toBe('clear');
  });
});

describe('bounded truncation is deep, not just top-level', () => {
  it('truncates a long string nested inside tool_response', async () => {
    await request(app)
      .post('/hooks/PostToolUse')
      .send({
        session_id: 'ses-deep-1',
        tool_name: 'Read',
        tool_input: { file_path: '/big' },
        tool_response: { content: 'y'.repeat(50_000), ok: true },
      });

    const evt = (await readSessionEvents('ses-deep-1'))[0];
    const body = evt?.tool_response as { content: string; ok: boolean };
    // The OLD guard only looked at top-level strings, so a 50k string one level down went to
    // disk whole. tool_response gets a larger budget than the residual payload, but still bounded.
    expect(body.content.length).toBeLessThan(2100);
    expect(body.ok).toBe(true);
  });

  it('caps long arrays and deep nesting instead of copying them whole', async () => {
    await request(app)
      .post('/hooks/Notification')
      .send({ session_id: 'ses-deep-2', items: Array.from({ length: 500 }, (_, i) => i) });

    const evt = (await readSessionEvents('ses-deep-2'))[0];
    const items = evt?.payload?.items as unknown[];
    expect(items).toHaveLength(51); // 50 items + the "+450 more" marker
    expect(items[50]).toBe('[+450 more]');
  });
});

describe('GET /api/hooks/supported — registration source of truth', () => {
  it('returns all 31 events but a register list that excludes unsafe/opt-in hooks', async () => {
    const res = await request(app).get('/api/hooks/supported');
    expect(res.status).toBe(200);

    // Backward-compatible fields: the full set the server can ingest.
    expect(res.body.count).toBe(31);
    expect(res.body.events).toHaveLength(31);
    expect(res.body.events).toContain('WorktreeCreate');
    expect(res.body.events).toContain('MessageDisplay');

    // register = what the install skill should wire as command hooks.
    expect(res.body.register).toHaveLength(29);
    expect(res.body.register).not.toContain('WorktreeCreate');
    expect(res.body.register).not.toContain('MessageDisplay');
    expect(res.body.register).toContain('WorktreeRemove'); // observer-only — safe
    expect(res.body.register).toContain('SessionStart');
    expect(res.body.register).toContain('DirectoryAdded');
  });

  it('explains each exclusion and marks WorktreeCreate as a hard (non-optional) exclude', async () => {
    const res = await request(app).get('/api/hooks/supported');
    expect(res.body.excluded.WorktreeCreate.optional).toBe(false); // never register
    expect(res.body.excluded.WorktreeCreate.reason).toMatch(/worktree/i);
    expect(res.body.excluded.MessageDisplay.optional).toBe(true); // opt-in only
    // every excluded event is absent from register
    for (const ev of Object.keys(res.body.excluded)) {
      expect(res.body.register).not.toContain(ev);
    }
  });

  it('register equals events minus excluded (set arithmetic)', async () => {
    const res = await request(app).get('/api/hooks/supported');
    expect(res.status).toBe(200);
    const { events, register, excluded } = res.body as {
      events: string[];
      register: string[];
      excluded: Record<string, unknown>;
    };
    const expected = events.filter((e) => !Object.keys(excluded).includes(e));
    expect(new Set(register)).toEqual(new Set(expected));
    expect(register.length).toBe(events.length - Object.keys(excluded).length);
  });

  it('every excluded key is a real event in events (no ghost exclusions)', async () => {
    const res = await request(app).get('/api/hooks/supported');
    expect(res.status).toBe(200);
    const { events, excluded } = res.body as {
      events: string[];
      excluded: Record<string, unknown>;
    };
    for (const key of Object.keys(excluded)) {
      expect(events).toContain(key);
    }
  });

  it('WorktreeCreate is absent from register regardless of excluded-map state', async () => {
    const res = await request(app).get('/api/hooks/supported');
    expect(res.status).toBe(200);
    expect(res.body.register).not.toContain('WorktreeCreate');
  });
});

// ── Response-first processing (Q1) ─────────────────────────────────────────────

describe('hook handler answers before doing its I/O', () => {
  it('accepts with 202 { continue: true } and completes the write on drain', async () => {
    const res = await request(app)
      .post('/hooks/UserPromptSubmit')
      .send({ session_id: 'ses-202-1', cwd: '/projects/deferred', prompt: 'hello' });

    // 202 = accepted, not yet processed. The body is still the hook contract
    // Claude Code parses from curl's stdout.
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ continue: true });

    await drainHookQueue();

    const raw = await readFile(join(testDir, 'sessions', 'session-ses-202-1.jsonl'), 'utf-8');
    const events = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as AngelEyeEvent);
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe('user_prompt');
    expect(events[0]?.prompt).toBe('hello');
  });

  it('keeps one session strictly ordered when events are not drained between fires', async () => {
    // No drain between these three. session_start must reach the registry before
    // stop reclassifies it, and session_end archives the file the other two wrote
    // to — the failure this queue exists to prevent is archive-before-append.
    await request(app)
      .post('/hooks/SessionStart')
      .send({ session_id: 'ses-order-1', cwd: '/projects/ordered' });
    await request(app)
      .post('/hooks/Stop')
      .send({ session_id: 'ses-order-1', last_assistant_message: 'mid' });
    await request(app)
      .post('/hooks/SessionEnd')
      .send({ session_id: 'ses-order-1', reason: 'clear' });

    await drainHookQueue();

    const raw = await readFile(join(testDir, 'archive', 'session-ses-order-1.jsonl'), 'utf-8');
    const events = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as AngelEyeEvent);
    expect(events.map((e) => e.event)).toEqual(['session_start', 'stop', 'session_end']);
    expect(events[2]?.reason).toBe('clear');

    const registry = await readRegistry();
    expect(registry['ses-order-1']?.status).toBe('ended');
  });

  it('drainHookQueue resolves when there is nothing queued', async () => {
    await expect(drainHookQueue()).resolves.toBeUndefined();
  });
});
