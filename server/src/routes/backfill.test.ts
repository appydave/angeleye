import { mkdtemp, rm, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs } from '../services/registry.service.js';
import { backfillTranscripts } from '../services/backfill.service.js';
import backfillRouter from './backfill.js';

// Mock the service module so route-level tests don't scan real ~/.claude/projects
// or fire async write queues that contaminate subsequent tests' temp dirs.
// Service-level tests (below) call backfillTranscripts() directly via the real import.
vi.mock('../services/backfill.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/backfill.service.js')>();
  return {
    ...actual,
    backfillTranscripts: vi.fn(actual.backfillTranscripts),
  };
});

let testDir: string;
let claudeProjectsDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-backfill-test-'));
  claudeProjectsDir = join(testDir, 'claude-projects');
  await mkdir(claudeProjectsDir, { recursive: true });

  _setDataDir(join(testDir, 'angeleye-data'));
  await initAngelEyeDirs();

  app = express();
  app.use(express.json());
  app.use('/api/backfill', backfillRouter);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// Fixture JSONL lines
const realPromptLine1 = JSON.stringify({
  type: 'user',
  isMeta: false,
  message: { role: 'user', content: 'Fix the bug' },
  timestamp: '2026-03-01T10:00:00.000Z',
  sessionId: 'test-session-abc',
  cwd: '/Users/test/dev/myproject',
});

const assistantLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: '/foo' } }],
  },
  timestamp: '2026-03-01T10:00:05.000Z',
  sessionId: 'test-session-abc',
  cwd: '/Users/test/dev/myproject',
});

const realPromptLine2 = JSON.stringify({
  type: 'user',
  isMeta: false,
  message: { role: 'user', content: 'Looks good, commit it' },
  timestamp: '2026-03-01T10:05:00.000Z',
  sessionId: 'test-session-abc',
  cwd: '/Users/test/dev/myproject',
});

const metaLine = JSON.stringify({
  type: 'user',
  isMeta: true,
  message: { role: 'user', content: 'some meta content' },
  timestamp: '2026-03-01T09:00:00.000Z',
  sessionId: 'meta-only-session',
  cwd: '/Users/test/dev/myproject',
});

const systemLine = JSON.stringify({
  type: 'system',
  timestamp: '2026-03-01T09:00:00.000Z',
  sessionId: 'meta-only-session',
  cwd: '/Users/test/dev/myproject',
});

async function writeFixtureJsonl(
  projectSlug: string,
  sessionId: string,
  lines: string[]
): Promise<void> {
  const projectDir = join(claudeProjectsDir, projectSlug);
  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, `${sessionId}.jsonl`), lines.join('\n') + '\n', 'utf-8');
}

// ── POST /api/backfill ─────────────────────────────────────────────────────────

describe('POST /api/backfill', () => {
  it('returns backfill result shape', async () => {
    // Stub the service so this route test does not scan real ~/.claude/projects
    // or fire async write queues that contaminate subsequent tests' temp dirs.
    // route scans real ~/.claude/projects; service-level tests (T01) cover actual write behaviour
    vi.mocked(backfillTranscripts).mockResolvedValueOnce({
      scanned: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    });

    // POST /api/backfill (no body or empty body)
    const res = await request(app).post('/api/backfill').send();

    // Assert response 200
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    // Assert response.body.data has shape: { scanned: number, imported: number, skipped: number, errors: number }
    expect(typeof res.body.data.scanned).toBe('number');
    expect(typeof res.body.data.imported).toBe('number');
    expect(typeof res.body.data.skipped).toBe('number');
    expect(typeof res.body.data.errors).toBe('number');
  });

  it('one session JSONL with 2 real prompts is imported (service-level)', async () => {
    await writeFixtureJsonl('-Users-test-dev-myproject', 'test-session-abc', [
      realPromptLine1,
      assistantLine,
      realPromptLine2,
    ]);

    const result = await backfillTranscripts(claudeProjectsDir);

    expect(result.scanned).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('writes events to sessions dir from fixture transcripts (T01)', async () => {
    // Fixture: project dir with one session JSONL containing 2 user prompts + 1 tool_use
    await writeFixtureJsonl('-Users-test-dev-myproject', 'test-session-disk-write', [
      realPromptLine1,
      assistantLine,
      realPromptLine2,
    ]);

    // Call backfillTranscripts directly (service-level, not via HTTP route)
    const result = await backfillTranscripts(claudeProjectsDir);

    // Backfill should import the session
    expect(result.scanned).toBe(1);
    expect(result.imported).toBe(1);

    // Assert: sessions dir contains a file for session-test-session-disk-write
    const sessionsDir = join(testDir, 'angeleye-data', 'sessions');
    const sessionFiles = await readdir(sessionsDir);
    expect(sessionFiles).toContain('session-test-session-disk-write.jsonl');

    // Read and parse the JSONL file
    const sessionFilePath = join(sessionsDir, 'session-test-session-disk-write.jsonl');
    const raw = await readFile(sessionFilePath, 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim() !== '');

    // Assert: events were written — 2 user_prompt + 1 tool_use = 3 events
    expect(lines.length).toBe(3);

    const events = lines.map((l) => JSON.parse(l));

    // Assert each event has: session_id, source: 'transcript', correct event_type
    for (const event of events) {
      expect(event.session_id).toBe('test-session-disk-write');
      expect(event.source).toBe('transcript');
      expect(typeof event.id).toBe('string');
      expect(typeof event.ts).toBe('string');
    }

    const eventTypes = events.map((e: { event: string }) => e.event);
    expect(eventTypes).toContain('user_prompt');
    expect(eventTypes).toContain('tool_use');
    expect(eventTypes.filter((t: string) => t === 'user_prompt')).toHaveLength(2);
    expect(eventTypes.filter((t: string) => t === 'tool_use')).toHaveLength(1);
  });

  it('same session again is skipped — idempotent (service-level)', async () => {
    await writeFixtureJsonl('-Users-test-dev-myproject', 'test-session-idempotent', [
      realPromptLine1,
      realPromptLine2,
    ]);

    // First run — should import
    const first = await backfillTranscripts(claudeProjectsDir);
    expect(first.imported).toBe(1);

    // Second run — should skip the already-known session
    const second = await backfillTranscripts(claudeProjectsDir);
    expect(second.scanned).toBe(1);
    expect(second.skipped).toBe(1);
    expect(second.imported).toBe(0);
  });

  it('JSONL with only meta/system entries is skipped (service-level)', async () => {
    await writeFixtureJsonl('-Users-test-dev-metaproject', 'meta-only-session', [
      metaLine,
      systemLine,
    ]);

    const result = await backfillTranscripts(claudeProjectsDir);

    expect(result.scanned).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toBe(0);
  });

  it('missing claude projects dir returns empty result without error (service-level)', async () => {
    const nonExistentDir = join(testDir, 'does-not-exist');

    const result = await backfillTranscripts(nonExistentDir);

    expect(result.scanned).toBe(0);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
  });
});
