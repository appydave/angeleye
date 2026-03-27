import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs, updateRegistry } from '../services/registry.service.js';
import { saveAffinityGroups } from '../services/correlator.service.js';
import affinityRouter from './affinity.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-affinity-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use('/api/affinity-groups', affinityRouter);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── GET /api/affinity-groups ────────────────────────────────────────────────

describe('GET /api/affinity-groups', () => {
  it('returns empty list when no groups exist', async () => {
    const res = await request(app).get('/api/affinity-groups');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.groups).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('returns saved groups', async () => {
    await saveAffinityGroups([
      {
        group_id: 'g1',
        group_type: 'story_unit',
        label: 'Story 2.4',
        session_ids: ['a', 'b'],
        confidence: 'deterministic',
        created_at: '2026-03-01T10:00:00.000Z',
      },
    ]);

    const res = await request(app).get('/api/affinity-groups');

    expect(res.status).toBe(200);
    expect(res.body.data.groups).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});

// ── GET /api/affinity-groups/:groupId ───────────────────────────────────────

describe('GET /api/affinity-groups/:groupId', () => {
  it('returns 404 for unknown group', async () => {
    const res = await request(app).get('/api/affinity-groups/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('returns group with its sessions', async () => {
    await updateRegistry('ses-a', {
      session_id: 'ses-a',
      project_dir: '/projects/test',
      last_active: '2026-03-01T10:00:00.000Z',
      session_type: 'BUILD',
    });
    await updateRegistry('ses-b', {
      session_id: 'ses-b',
      project_dir: '/projects/test',
      last_active: '2026-03-01T12:00:00.000Z',
      session_type: 'BUILD',
    });

    await saveAffinityGroups([
      {
        group_id: 'g1',
        group_type: 'story_unit',
        label: 'Story 2.4',
        session_ids: ['ses-a', 'ses-b'],
        confidence: 'deterministic',
        created_at: '2026-03-01T10:00:00.000Z',
      },
    ]);

    const res = await request(app).get('/api/affinity-groups/g1');

    expect(res.status).toBe(200);
    expect(res.body.data.group.group_id).toBe('g1');
    expect(res.body.data.sessions).toHaveLength(2);
  });
});

// ── POST /api/affinity-groups/correlate ─────────────────────────────────────

describe('POST /api/affinity-groups/correlate', () => {
  it('returns 200 with empty results on empty registry', async () => {
    const res = await request(app).post('/api/affinity-groups/correlate');

    expect(res.status).toBe(200);
    expect(res.body.data.groups_created).toBe(0);
    expect(res.body.data.sessions_mapped).toBe(0);
  });

  it('creates groups from registry entries with matching story IDs', async () => {
    await updateRegistry('ses-ds', {
      session_id: 'ses-ds',
      project_dir: '/projects/test',
      last_active: '2026-03-01T10:00:00.000Z',
      started_at: '2026-03-01T10:00:00.000Z',
      trigger_command: 'bmad-dev',
      trigger_arguments: 'DS 2.4',
      workflow_role: 'builder',
      workflow_identity: 'Amelia',
    });
    await updateRegistry('ses-dr', {
      session_id: 'ses-dr',
      project_dir: '/projects/test',
      last_active: '2026-03-01T12:00:00.000Z',
      started_at: '2026-03-01T12:00:00.000Z',
      trigger_command: 'bmad-dr',
      trigger_arguments: 'DR 2.4',
      workflow_role: 'reviewer',
      workflow_identity: 'Nate',
    });

    const res = await request(app).post('/api/affinity-groups/correlate');

    expect(res.status).toBe(200);
    expect(res.body.data.groups_created).toBe(1);
    expect(res.body.data.sessions_mapped).toBe(2);
    expect(res.body.data.groups[0].label).toBe('Story 2.4');
  });
});
