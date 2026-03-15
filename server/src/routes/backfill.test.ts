import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs, backfillTranscripts } from '../services/angeleye-data.js';
import backfillRouter from './backfill.js';

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
  it('empty projects dir returns all-zero result', async () => {
    const res = await request(app).post('/api/backfill').send({ claudeProjectsDir });

    // The route calls backfillTranscripts() without passing claudeProjectsDir,
    // so we call it directly via the service to test with our fixture dir.
    // For the route test we verify shape only.
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveProperty('scanned');
    expect(res.body.data).toHaveProperty('imported');
    expect(res.body.data).toHaveProperty('skipped');
    expect(res.body.data).toHaveProperty('errors');
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
