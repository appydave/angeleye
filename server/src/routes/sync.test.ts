import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs } from '../services/registry.service.js';
import syncRouter from './sync.js';
import type { SyncResult } from '../services/sync.service.js';

// Mock sync service so route tests don't trigger real file system scanning
vi.mock('../services/sync.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/sync.service.js')>();
  return {
    ...actual,
    runSync: vi.fn(actual.runSync),
  };
});

import { runSync, readLastSync, writeLastSync } from '../services/sync.service.js';

const EMPTY_COUNTS = {
  BUILD: 0,
  TEST: 0,
  RESEARCH: 0,
  KNOWLEDGE: 0,
  OPS: 0,
  ORIENTATION: 0,
  unclassified: 0,
};

/** Build a full SyncResult from partial overrides — avoids repeating boilerplate. */
function makeSyncResult(overrides: Partial<SyncResult> = {}): SyncResult {
  return {
    imported: 0,
    classified: 0,
    alreadyUpToDate: 0,
    errors: 0,
    before: { ...EMPTY_COUNTS },
    after: { ...EMPTY_COUNTS },
    totalBefore: 0,
    totalAfter: 0,
    newByProject: [],
    ...overrides,
  };
}

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
  it('returns SyncResult shape with all required fields', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(
      makeSyncResult({ imported: 3, classified: 2, alreadyUpToDate: 5 })
    );

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.data.imported).toBe('number');
    expect(typeof res.body.data.classified).toBe('number');
    expect(typeof res.body.data.alreadyUpToDate).toBe('number');
    expect(typeof res.body.data.errors).toBe('number');
    expect(res.body.data.before).toBeDefined();
    expect(res.body.data.after).toBeDefined();
    expect(typeof res.body.data.totalBefore).toBe('number');
    expect(typeof res.body.data.totalAfter).toBe('number');
    expect(Array.isArray(res.body.data.newByProject)).toBe(true);
  });

  it('returns the correct values from the sync service', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(
      makeSyncResult({ imported: 5, classified: 3, alreadyUpToDate: 10, errors: 1 })
    );

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
    vi.mocked(runSync).mockResolvedValueOnce(makeSyncResult({ imported: 2, classified: 2 }));

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.data.errors).toBe(0);
  });

  it('returns before/after type counts and newByProject', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(
      makeSyncResult({
        imported: 3,
        classified: 3,
        before: { ...EMPTY_COUNTS, BUILD: 10 },
        after: { ...EMPTY_COUNTS, BUILD: 12, KNOWLEDGE: 1 },
        totalBefore: 10,
        totalAfter: 13,
        newByProject: [
          { project: 'supportsignal', count: 2, type: 'BUILD' },
          { project: 'brains/angeleye', count: 1, type: 'KNOWLEDGE' },
        ],
      })
    );

    const res = await request(app).post('/api/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.data.before.BUILD).toBe(10);
    expect(res.body.data.after.BUILD).toBe(12);
    expect(res.body.data.totalBefore).toBe(10);
    expect(res.body.data.totalAfter).toBe(13);
    expect(res.body.data.newByProject).toHaveLength(2);
    expect(res.body.data.newByProject[0].project).toBe('supportsignal');
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

    vi.mocked(runSync).mockResolvedValueOnce(makeSyncResult({ alreadyUpToDate: 1 }));

    const result = await runSync();
    expect(result.alreadyUpToDate).toBe(1);
    expect(result.classified).toBe(0);
  });

  it('newly imported sessions with no session_type are classified', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(makeSyncResult({ imported: 3, classified: 3 }));

    const result = await runSync();
    expect(result.classified).toBe(3);
    expect(result.alreadyUpToDate).toBe(0);
  });

  it('errors in individual session classification increment errors without aborting the run', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(
      makeSyncResult({ imported: 2, classified: 1, errors: 1 })
    );

    const result = await runSync();
    expect(typeof result.errors).toBe('number');
    expect(result.errors).toBeGreaterThanOrEqual(1);
    expect(typeof result.classified).toBe('number');
  });

  it('result always contains all SyncResult fields', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(makeSyncResult());

    const result = await runSync();
    expect(result).toHaveProperty('imported');
    expect(result).toHaveProperty('classified');
    expect(result).toHaveProperty('alreadyUpToDate');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('before');
    expect(result).toHaveProperty('after');
    expect(result).toHaveProperty('totalBefore');
    expect(result).toHaveProperty('totalAfter');
    expect(result).toHaveProperty('newByProject');
  });
});

// ── Additional route tests ────────────────────────────────────────────────────

describe('POST /api/sync — additional coverage', () => {
  it('alreadyUpToDate can be zero when registry is empty', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(makeSyncResult());

    const res = await request(app).post('/api/sync').send();
    expect(res.status).toBe(200);
    expect(res.body.data.alreadyUpToDate).toBe(0);
  });

  it('imported and classified are independent counters', async () => {
    vi.mocked(runSync).mockResolvedValueOnce(
      makeSyncResult({ imported: 10, classified: 8, alreadyUpToDate: 2 })
    );

    const res = await request(app).post('/api/sync').send();
    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(10);
    expect(res.body.data.classified).toBe(8);
    expect(res.body.data.alreadyUpToDate).toBe(2);
  });
});

// ── WC02: Delta tracking — readLastSync / writeLastSync ───────────────────────

describe('readLastSync', () => {
  it('returns null if last-sync.json does not exist', async () => {
    const result = await readLastSync();
    expect(result).toBeNull();
  });

  it('returns the written record after writeLastSync', async () => {
    const record = {
      timestamp: '2026-03-16T10:00:00.000Z',
      imported: 5,
      classified: 3,
    };
    await writeLastSync(record);
    const result = await readLastSync();
    expect(result).not.toBeNull();
    expect(result?.timestamp).toBe(record.timestamp);
    expect(result?.imported).toBe(record.imported);
    expect(result?.classified).toBe(record.classified);
  });
});

describe('writeLastSync', () => {
  it('creates last-sync.json with correct fields', async () => {
    const record = {
      timestamp: '2026-03-16T12:00:00.000Z',
      imported: 7,
      classified: 4,
    };
    await writeLastSync(record);
    const result = await readLastSync();
    expect(result).toEqual(record);
  });
});

// ── WC02: GET /api/sync/status route ─────────────────────────────────────────

describe('GET /api/sync/status', () => {
  it('returns { lastSync: null } if last-sync.json is absent', async () => {
    const res = await request(app).get('/api/sync/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.lastSync).toBeNull();
  });

  it('returns { lastSync: { timestamp, imported, classified } } if file is present', async () => {
    const record = {
      timestamp: '2026-03-16T08:30:00.000Z',
      imported: 2,
      classified: 1,
    };
    await writeLastSync(record);

    const res = await request(app).get('/api/sync/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.lastSync).not.toBeNull();
    expect(res.body.data.lastSync.timestamp).toBe(record.timestamp);
    expect(res.body.data.lastSync.imported).toBe(record.imported);
    expect(res.body.data.lastSync.classified).toBe(record.classified);
  });
});

// ── WC02: POST /api/sync creates/updates last-sync.json ──────────────────────

describe('POST /api/sync — creates/updates last-sync.json', () => {
  it('creates last-sync.json after a successful sync', async () => {
    const beforeSync = await readLastSync();
    expect(beforeSync).toBeNull();

    vi.mocked(runSync).mockImplementationOnce(async () => {
      const { writeLastSync: writeFn } = await import('../services/sync.service.js');
      await writeFn({
        timestamp: new Date().toISOString(),
        imported: 4,
        classified: 2,
      });
      return makeSyncResult({ imported: 4, classified: 2 });
    });

    const res = await request(app).post('/api/sync').send();
    expect(res.status).toBe(200);

    const afterSync = await readLastSync();
    expect(afterSync).not.toBeNull();
    expect(typeof afterSync?.timestamp).toBe('string');
    expect(afterSync?.imported).toBe(4);
    expect(afterSync?.classified).toBe(2);
  });
});
