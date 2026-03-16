import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs, updateRegistry } from '../services/registry.service.js';
import statsRouter from './stats.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-stats-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use('/api/stats', statsRouter);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── GET /api/stats ─────────────────────────────────────────────────────────────

describe('GET /api/stats', () => {
  it('returns { byType, total } shape with 200', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveProperty('byType');
    expect(res.body.data).toHaveProperty('total');
  });

  it('empty registry returns total=0 and all zeros', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    const byType = res.body.data.byType as Record<string, number>;
    expect(byType.BUILD).toBe(0);
    expect(byType.TEST).toBe(0);
    expect(byType.RESEARCH).toBe(0);
    expect(byType.KNOWLEDGE).toBe(0);
    expect(byType.OPS).toBe(0);
    expect(byType.ORIENTATION).toBe(0);
    expect(byType.unclassified).toBe(0);
  });

  it('all 6 SessionType keys are always present in byType even with empty registry', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    const byType = res.body.data.byType as Record<string, number>;
    expect(byType).toHaveProperty('BUILD');
    expect(byType).toHaveProperty('TEST');
    expect(byType).toHaveProperty('RESEARCH');
    expect(byType).toHaveProperty('KNOWLEDGE');
    expect(byType).toHaveProperty('OPS');
    expect(byType).toHaveProperty('ORIENTATION');
    expect(byType).toHaveProperty('unclassified');
  });

  it('sessions with session_type are counted in their bucket', async () => {
    await updateRegistry('ses-build-1', {
      session_id: 'ses-build-1',
      project_dir: '/projects/a',
      last_active: '2026-03-01T10:00:00.000Z',
      session_type: 'BUILD',
    });
    await updateRegistry('ses-build-2', {
      session_id: 'ses-build-2',
      project_dir: '/projects/b',
      last_active: '2026-03-01T10:01:00.000Z',
      session_type: 'BUILD',
    });
    await updateRegistry('ses-research-1', {
      session_id: 'ses-research-1',
      project_dir: '/projects/c',
      last_active: '2026-03-01T10:02:00.000Z',
      session_type: 'RESEARCH',
    });

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    const byType = res.body.data.byType as Record<string, number>;
    expect(byType.BUILD).toBe(2);
    expect(byType.RESEARCH).toBe(1);
    expect(byType.unclassified).toBe(0);
  });

  it('sessions without session_type are counted in unclassified', async () => {
    await updateRegistry('ses-no-type-1', {
      session_id: 'ses-no-type-1',
      project_dir: '/projects/x',
      last_active: '2026-03-01T10:00:00.000Z',
    });
    await updateRegistry('ses-no-type-2', {
      session_id: 'ses-no-type-2',
      project_dir: '/projects/y',
      last_active: '2026-03-01T10:01:00.000Z',
    });
    await updateRegistry('ses-typed', {
      session_id: 'ses-typed',
      project_dir: '/projects/z',
      last_active: '2026-03-01T10:02:00.000Z',
      session_type: 'OPS',
    });

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    const byType = res.body.data.byType as Record<string, number>;
    expect(byType.unclassified).toBe(2);
    expect(byType.OPS).toBe(1);
  });

  it('counts all 6 session types correctly in a mixed registry', async () => {
    const types = ['BUILD', 'TEST', 'RESEARCH', 'KNOWLEDGE', 'OPS', 'ORIENTATION'] as const;
    for (const type of types) {
      await updateRegistry(`ses-${type.toLowerCase()}`, {
        session_id: `ses-${type.toLowerCase()}`,
        project_dir: `/projects/${type.toLowerCase()}`,
        last_active: '2026-03-01T10:00:00.000Z',
        session_type: type,
      });
    }

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(6);
    const byType = res.body.data.byType as Record<string, number>;
    expect(byType.BUILD).toBe(1);
    expect(byType.TEST).toBe(1);
    expect(byType.RESEARCH).toBe(1);
    expect(byType.KNOWLEDGE).toBe(1);
    expect(byType.OPS).toBe(1);
    expect(byType.ORIENTATION).toBe(1);
    expect(byType.unclassified).toBe(0);
  });
});
