import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { _setDataDir, initAngelEyeDirs } from '../services/registry.service.js';
import { _setSessionsDir } from '../services/claude-sessions.service.js';
import liveSessionsRouter from './live-sessions.js';

let dataDir: string;
let sessDir: string;
let app: express.Express;

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'angeleye-ls-data-'));
  sessDir = await mkdtemp(join(tmpdir(), 'angeleye-ls-sess-'));
  _setDataDir(dataDir);
  _setSessionsDir(sessDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use(liveSessionsRouter);
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
  await rm(sessDir, { recursive: true, force: true });
});

describe('GET /api/live-sessions', () => {
  it('returns empty counts and dir_exists when nothing is running', async () => {
    const res = await request(app).get('/api/live-sessions');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.dir_exists).toBe(true);
    expect(res.body.data.counts).toEqual({ files: 0, alive: 0, alive_unknown_to_angeleye: 0 });
    expect(res.body.data.sessions).toEqual([]);
  });

  it('distinguishes a missing sessions dir from an empty one', async () => {
    _setSessionsDir(join(sessDir, 'nope'));
    const res = await request(app).get('/api/live-sessions');
    expect(res.body.data.dir_exists).toBe(false);
    expect(res.body.data.sessions).toEqual([]);
  });

  it('flags a live session AngelEye has never ingested — the dead-collector signature', async () => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(
      join(sessDir, 'live.json'),
      JSON.stringify({
        pid: process.pid,
        sessionId: 'ses-live-1',
        cwd: '/p',
        name: 'unseen-session',
        status: 'busy',
        kind: 'interactive',
      }),
      'utf-8'
    );

    const res = await request(app).get('/api/live-sessions');
    expect(res.body.data.counts.alive).toBe(1);
    // AngelEye's registry is empty, so a running session is unknown to it.
    expect(res.body.data.counts.alive_unknown_to_angeleye).toBe(1);
    const row = res.body.data.sessions[0];
    expect(row.in_angeleye).toBe(false);
    expect(row.angeleye_name).toBeNull();
    expect(row.name).toBe('unseen-session');
    expect(row.process_alive).toBe(true);
  });
});
