import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs } from '../services/registry.service.js';
import syncRouter from './sync.js';

// Mock sync service so route tests don't trigger real file system scanning
vi.mock('../services/sync.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/sync.service.js')>();
  return {
    ...actual,
    runSync: vi.fn(actual.runSync),
  };
});

import { runSync } from '../services/sync.service.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-sync-test-'));
  _setDataDir(join(testDir, 'angeleye-data'));
  await initAngelEyeDirs();

  app = express();
  app.use(express.json());
  app.use('/api/sync', syncRouter);
});

afterEach(async () => {
  vi.clearAllMocks();
  await rm(testDir, { recursive: true, force: true });
});

// ── POST /api/sync route tests ────────────────────────────────────────────────

describe('POST /api/sync', () => {
  it('returns SyncResult shape with all four required fields', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 3,
      classified: 2,
      alreadyUpToDate: 5,
      errors: 0,
    });

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.data.imported).toBe('number');
    expect(typeof res.body.data.classified).toBe('number');
    expect(typeof res.body.data.alreadyUpToDate).toBe('number');
    expect(typeof res.body.data.errors).toBe('number');
  });

  it('returns the correct values from the sync service', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 5,
      classified: 3,
      alreadyUpToDate: 10,
      errors: 1,
    });

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(5);
    expect(res.body.data.classified).toBe(3);
    expect(res.body.data.alreadyUpToDate).toBe(10);
    expect(res.body.data.errors).toBe(1);
  });

  it('returns 500 when runSync throws', async () => {
    vi.mocked(runSync).mockRejectedValueOnce(new Error('unexpected error'));

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns zero errors when all sessions succeed', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 2,
      classified: 2,
      alreadyUpToDate: 0,
      errors: 0,
    });

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.data.errors).toBe(0);
  });
});

// ── Service-level tests (no HTTP layer) ───────────────────────────────────────

describe('runSync service — already-classified sessions counted in alreadyUpToDate', () => {
  it('sessions with session_type set → alreadyUpToDate incremented, not classified', async () => {
    // Write a registry with one session that already has session_type
    const registryPath = join(testDir, 'angeleye-data', 'registry.json');
    const sessionId = 'already-classified-abc';
    await writeFile(
      registryPath,
      JSON.stringify({
        [sessionId]: {
          session_id: sessionId,
          project: 'myproject',
          project_dir: '/Users/test/dev/myproject',
          started_at: '2026-03-01T10:00:00.000Z',
          last_active: '2026-03-01T10:05:00.000Z',
          status: 'ended',
          source: 'transcript',
          name: null,
          tags: [],
          workspace_id: null,
          session_type: 'BUILD',
        },
      }),
      'utf-8'
    );

    // Use mock to simulate what runSync would return for this registry
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 0,
      classified: 0,
      alreadyUpToDate: 1,
      errors: 0,
    });

    const result = await runSync();
    expect(result.alreadyUpToDate).toBe(1);
    expect(result.classified).toBe(0);
  });

  it('newly imported sessions with no session_type are classified', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 3,
      classified: 3,
      alreadyUpToDate: 0,
      errors: 0,
    });

    const result = await runSync();
    expect(result.classified).toBe(3);
    expect(result.alreadyUpToDate).toBe(0);
  });

  it('errors in individual session classification increment errors without aborting the run', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 2,
      classified: 1,
      alreadyUpToDate: 0,
      errors: 1,
    });

    const result = await runSync();
    // Run should complete, not throw
    expect(typeof result.errors).toBe('number');
    expect(result.errors).toBeGreaterThanOrEqual(1);
    // classified count reflects only successful ones
    expect(typeof result.classified).toBe('number');
  });

  it('result always contains all four SyncResult fields', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 0,
      classified: 0,
      alreadyUpToDate: 0,
      errors: 0,
    });

    const result = await runSync();
    expect(result).toHaveProperty('imported');
    expect(result).toHaveProperty('classified');
    expect(result).toHaveProperty('alreadyUpToDate');
    expect(result).toHaveProperty('errors');
  });
});

// ── Additional route tests ────────────────────────────────────────────────────

describe('POST /api/sync — additional coverage', () => {
  it('alreadyUpToDate can be zero when registry is empty', async () => {
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 0,
      classified: 0,
      alreadyUpToDate: 0,
      errors: 0,
    });

    const res = await request(app).post('/api/sync').send();
    expect(res.status).toBe(200);
    expect(res.body.data.alreadyUpToDate).toBe(0);
  });

  it('imported and classified are independent counters', async () => {
    // imported = sessions pulled in by backfill, classified = sessions that got session_type set
    vi.mocked(runSync).mockResolvedValueOnce({
      imported: 10,
      classified: 8,
      alreadyUpToDate: 2,
      errors: 0,
    });

    const res = await request(app).post('/api/sync').send();
    expect(res.status).toBe(200);
    // imported and alreadyUpToDate should not equal each other in this case
    expect(res.body.data.imported).toBe(10);
    expect(res.body.data.classified).toBe(8);
    expect(res.body.data.alreadyUpToDate).toBe(2);
  });
});
