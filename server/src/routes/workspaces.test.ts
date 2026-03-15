import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs } from '../services/angeleye-data.js';
import workspacesRouter from './workspaces.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-workspaces-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use(workspacesRouter);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── GET /api/workspaces ────────────────────────────────────────────────────────

describe('GET /api/workspaces', () => {
  it('returns empty array when no workspaces exist', async () => {
    const res = await request(app).get('/api/workspaces');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.workspaces).toEqual([]);
  });

  it('returns previously created workspace', async () => {
    await request(app).post('/api/workspaces').send({ name: 'SupportSignal' });

    const res = await request(app).get('/api/workspaces');

    expect(res.status).toBe(200);
    const workspaces = res.body.data.workspaces as Array<Record<string, unknown>>;
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toHaveProperty('name', 'SupportSignal');
  });
});

// ── POST /api/workspaces ───────────────────────────────────────────────────────

describe('POST /api/workspaces', () => {
  it('creates workspace and returns 201 with id, name, tags, and created_at', async () => {
    const res = await request(app).post('/api/workspaces').send({ name: 'AngelEye' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    const ws = res.body.data as Record<string, unknown>;
    expect(ws).toHaveProperty('id');
    expect(ws).toHaveProperty('name', 'AngelEye');
    expect(ws).toHaveProperty('tags');
    expect(ws).toHaveProperty('created_at');
    expect(Array.isArray(ws.tags)).toBe(true);
    expect(typeof ws.id).toBe('string');
    expect(typeof ws.created_at).toBe('string');
  });

  it('missing name returns 400', async () => {
    const res = await request(app).post('/api/workspaces').send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('empty string name returns 400', async () => {
    const res = await request(app).post('/api/workspaces').send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});

// ── PATCH /api/workspaces/:id ──────────────────────────────────────────────────

describe('PATCH /api/workspaces/:id', () => {
  it('updates name and returns updated entry', async () => {
    const createRes = await request(app).post('/api/workspaces').send({ name: 'OldName' });
    const id = (createRes.body.data as Record<string, unknown>).id as string;

    const res = await request(app).patch(`/api/workspaces/${id}`).send({ name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.name).toBe('NewName');
    expect(res.body.data.id).toBe(id);
  });

  it('unknown id returns 404', async () => {
    const res = await request(app)
      .patch('/api/workspaces/ws-does-not-exist')
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ── DELETE /api/workspaces/:id ─────────────────────────────────────────────────

describe('DELETE /api/workspaces/:id', () => {
  it('removes workspace and returns 204 with no body', async () => {
    const createRes = await request(app).post('/api/workspaces').send({ name: 'ToDelete' });
    const id = (createRes.body.data as Record<string, unknown>).id as string;

    const res = await request(app).delete(`/api/workspaces/${id}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('unknown id returns 404', async () => {
    const res = await request(app).delete('/api/workspaces/ws-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('does not affect other workspaces — create 2, delete 1, GET returns 1', async () => {
    await request(app).post('/api/workspaces').send({ name: 'Keep' });
    const deleteRes = await request(app).post('/api/workspaces').send({ name: 'Remove' });
    const deleteId = (deleteRes.body.data as Record<string, unknown>).id as string;

    await request(app).delete(`/api/workspaces/${deleteId}`);

    const getRes = await request(app).get('/api/workspaces');
    const workspaces = getRes.body.data.workspaces as Array<Record<string, unknown>>;
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toHaveProperty('name', 'Keep');
  });
});
