import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { AngelEyeEvent } from '@appystack/shared';
import { _setDataDir, initAngelEyeDirs, updateRegistry } from '../services/registry.service.js';
import { writeEvent } from '../services/sessions.service.js';
import { createWorkspace } from '../services/workspace.service.js';
import sessionsRouter from './sessions.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-sessions-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use(sessionsRouter);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// Helper to build a minimal valid AngelEyeEvent
function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: new Date().toISOString(),
    source: 'hook',
    event: 'session_start',
    ...overrides,
  };
}

// ── GET /api/sessions ─────────────────────────────────────────────────────────

describe('GET /api/sessions', () => {
  it('returns 200 with empty sessions array when registry is empty', async () => {
    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.sessions).toEqual([]);
  });

  it('returns both entries when registry has 2 sessions', async () => {
    const now = new Date().toISOString();
    await updateRegistry('ses-aaa', {
      session_id: 'ses-aaa',
      project_dir: '/projects/alpha',
      last_active: '2026-01-01T10:00:00.000Z',
    });
    await updateRegistry('ses-bbb', {
      session_id: 'ses-bbb',
      project_dir: '/projects/beta',
      last_active: now,
    });

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(2);
    const ids = (res.body.data.sessions as Array<{ session_id: string }>).map((s) => s.session_id);
    expect(ids).toContain('ses-aaa');
    expect(ids).toContain('ses-bbb');
  });

  it('each session entry has session_id, status, and last_active fields', async () => {
    await updateRegistry('ses-shape', {
      session_id: 'ses-shape',
      project_dir: '/projects/shape-test',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    const sessions = res.body.data.sessions as Array<Record<string, unknown>>;
    expect(sessions).toHaveLength(1);
    const entry = sessions[0];
    expect(entry).toHaveProperty('session_id', 'ses-shape');
    expect(entry).toHaveProperty('status');
    expect(entry).toHaveProperty('last_active');
  });

  it('returns sessions sorted newest-first by last_active', async () => {
    await updateRegistry('session-a', {
      session_id: 'session-a',
      project_dir: '/projects/alpha',
      last_active: '2026-03-01T10:00:00Z',
    });
    await updateRegistry('session-b', {
      session_id: 'session-b',
      project_dir: '/projects/beta',
      last_active: '2026-03-15T10:00:00Z',
    });

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    const sessions = res.body.data.sessions as Array<{ session_id: string }>;
    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.session_id).toBe('session-b');
    expect(sessions[1]?.session_id).toBe('session-a');
  });

  it('handles a malformed registry.json gracefully and returns empty sessions', async () => {
    // Write corrupt JSON directly to the registry file
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(testDir, 'registry.json'), '{ not valid json', 'utf-8');

    const res = await request(app).get('/api/sessions');

    // readRegistry returns {} on error, so sessions should be []
    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toEqual([]);
  });
});

// ── GET /api/sessions (paginated) ──────────────────────────────────────────────

describe('GET /api/sessions (paginated)', () => {
  async function seedSessions(count: number) {
    for (let i = 0; i < count; i++) {
      const id = `ses-page-${String(i).padStart(3, '0')}`;
      await updateRegistry(id, {
        session_id: id,
        project_dir: `/projects/page-${i}`,
        last_active: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
      });
    }
  }

  it('returns all sessions when no limit param is provided (backward compatible)', async () => {
    await seedSessions(10);
    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(10);
    // No cursor or hasMore in backward-compatible mode
    expect(res.body.data.cursor).toBeUndefined();
    expect(res.body.data.hasMore).toBeUndefined();
  });

  it('limit=5 returns only 5 sessions', async () => {
    await seedSessions(10);
    const res = await request(app).get('/api/sessions?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(5);
    expect(res.body.data.hasMore).toBe(true);
    expect(res.body.data.cursor).toBeDefined();
  });

  it('after=<id> returns the next page of sessions', async () => {
    await seedSessions(10);

    // First page
    const page1 = await request(app).get('/api/sessions?limit=5');
    expect(page1.body.data.sessions).toHaveLength(5);
    const cursor = page1.body.data.cursor;

    // Second page
    const page2 = await request(app).get(`/api/sessions?limit=5&after=${cursor}`);
    expect(page2.body.data.sessions).toHaveLength(5);

    // No overlap between pages
    const page1Ids = (page1.body.data.sessions as Array<{ session_id: string }>).map(
      (s) => s.session_id
    );
    const page2Ids = (page2.body.data.sessions as Array<{ session_id: string }>).map(
      (s) => s.session_id
    );
    expect(page1Ids.filter((id: string) => page2Ids.includes(id))).toEqual([]);
  });

  it('hasMore is false when at the end', async () => {
    await seedSessions(3);
    const res = await request(app).get('/api/sessions?limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(3);
    expect(res.body.data.hasMore).toBe(false);
  });

  it('invalid limit values are handled gracefully', async () => {
    await seedSessions(5);

    // Negative limit clamps to 1
    const res1 = await request(app).get('/api/sessions?limit=-5');
    expect(res1.status).toBe(200);
    expect(res1.body.data.sessions).toHaveLength(1);

    // Non-numeric limit defaults to 50
    const res2 = await request(app).get('/api/sessions?limit=abc');
    expect(res2.status).toBe(200);
    expect(res2.body.data.sessions).toHaveLength(5); // only 5 seeded

    // Limit > 200 clamps to 200
    const res3 = await request(app).get('/api/sessions?limit=500');
    expect(res3.status).toBe(200);
    expect(res3.body.data.sessions).toHaveLength(5); // only 5 seeded, but limit was clamped
  });

  it('after with unknown cursor id starts from the beginning', async () => {
    await seedSessions(5);
    const res = await request(app).get('/api/sessions?limit=3&after=ses-nonexistent');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(3);
  });
});

// ── GET /api/sessions/:id/events ──────────────────────────────────────────────

describe('GET /api/sessions/:id/events', () => {
  it('returns 200 with empty events array for an unknown session id', async () => {
    const res = await request(app).get('/api/sessions/ses-unknown/events');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.events).toEqual([]);
    expect(res.body.data.count).toBe(0);
  });

  it('returns all 3 events in order for a seeded session', async () => {
    const sessionId = 'ses-events-3';
    const e1 = makeEvent({ id: 'evt-1', session_id: sessionId, event: 'session_start' });
    const e2 = makeEvent({ id: 'evt-2', session_id: sessionId, event: 'user_prompt' });
    const e3 = makeEvent({ id: 'evt-3', session_id: sessionId, event: 'tool_use' });
    await writeEvent(e1);
    await writeEvent(e2);
    await writeEvent(e3);

    const res = await request(app).get(`/api/sessions/${sessionId}/events`);

    expect(res.status).toBe(200);
    const events = res.body.data.events as Array<{ id: string }>;
    expect(events).toHaveLength(3);
    expect(events[0]?.id).toBe('evt-1');
    expect(events[1]?.id).toBe('evt-2');
    expect(events[2]?.id).toBe('evt-3');
    expect(res.body.data.count).toBe(3);
  });

  it('each event has id, session_id, ts, event, and source fields', async () => {
    const sessionId = 'ses-event-shape';
    const evt = makeEvent({
      id: 'evt-shape',
      session_id: sessionId,
      event: 'user_prompt',
      source: 'hook',
      ts: '2026-03-15T10:00:00.000Z',
    });
    await writeEvent(evt);

    const res = await request(app).get(`/api/sessions/${sessionId}/events`);

    expect(res.status).toBe(200);
    const events = res.body.data.events as Array<Record<string, unknown>>;
    expect(events).toHaveLength(1);
    const event = events[0];
    expect(event).toHaveProperty('id', 'evt-shape');
    expect(event).toHaveProperty('session_id', sessionId);
    expect(event).toHaveProperty('ts', '2026-03-15T10:00:00.000Z');
    expect(event).toHaveProperty('event', 'user_prompt');
    expect(event).toHaveProperty('source', 'hook');
  });
});

// ── PATCH /api/sessions/:id ────────────────────────────────────────────────────

describe('PATCH /api/sessions/:id', () => {
  it('update name — response has updated name', async () => {
    await updateRegistry('ses-patch-name', {
      session_id: 'ses-patch-name',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-name')
      .send({ name: 'my-session' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.name).toBe('my-session');
  });

  it('update tags — response has updated tags', async () => {
    await updateRegistry('ses-patch-tags', {
      session_id: 'ses-patch-tags',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-tags')
      .send({ tags: ['bmad', 'supportsignal'] });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.tags).toEqual(['bmad', 'supportsignal']);
  });

  it('update workspace_id — response has updated workspace_id', async () => {
    const ws = await createWorkspace('PatchWorkspace');
    await updateRegistry('ses-patch-ws', {
      session_id: 'ses-patch-ws',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-ws')
      .send({ workspace_id: ws.id });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.workspace_id).toBe(ws.id);
  });

  it('unknown session — returns 404', async () => {
    const res = await request(app)
      .patch('/api/sessions/ses-does-not-exist')
      .send({ name: 'ghost' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('partial update preserves other fields — name unchanged when only tags patched', async () => {
    await updateRegistry('ses-patch-partial', {
      session_id: 'ses-patch-partial',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
      name: 'original',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-partial')
      .send({ tags: ['x'] });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('original');
    expect(res.body.data.tags).toEqual(['x']);
  });

  it('null clears name — response has name=null', async () => {
    await updateRegistry('ses-patch-null', {
      session_id: 'ses-patch-null',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
      name: 'to-be-cleared',
    });

    const res = await request(app).patch('/api/sessions/ses-patch-null').send({ name: null });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBeNull();
  });

  it('returns 404 when workspace_id does not exist', async () => {
    await updateRegistry('ses-patch-ws-invalid', {
      session_id: 'ses-patch-ws-invalid',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-ws-invalid')
      .send({ workspace_id: 'ws-does-not-exist' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/workspace not found/i);
  });

  it('accepts workspace_id=null without checking workspaces (clear is always valid)', async () => {
    await updateRegistry('ses-patch-ws-clear', {
      session_id: 'ses-patch-ws-clear',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
      workspace_id: 'some-existing-ws',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-ws-clear')
      .send({ workspace_id: null });

    expect(res.status).toBe(200);
    expect(res.body.data.workspace_id).toBeNull();
  });

  it('returns 200 when workspace_id exists in workspaces store', async () => {
    const ws = await createWorkspace('MyWorkspace');
    await updateRegistry('ses-patch-ws-valid', {
      session_id: 'ses-patch-ws-valid',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-ws-valid')
      .send({ workspace_id: ws.id });

    expect(res.status).toBe(200);
    expect(res.body.data.workspace_id).toBe(ws.id);
  });

  it('update note — registry updated with note text', async () => {
    await updateRegistry('ses-patch-note', {
      session_id: 'ses-patch-note',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-note')
      .send({ note: 'interesting auth pattern' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.note).toBe('interesting auth pattern');
  });

  it('update note with null — clears existing note', async () => {
    await updateRegistry('ses-patch-note-clear', {
      session_id: 'ses-patch-note-clear',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
      note: 'old annotation',
    });

    const res = await request(app).patch('/api/sessions/ses-patch-note-clear').send({ note: null });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.note).toBeNull();
  });

  it('update note and name together — both fields updated', async () => {
    await updateRegistry('ses-patch-note-name', {
      session_id: 'ses-patch-note-name',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-note-name')
      .send({ name: 'auth-investigation', note: 'started looking at JWT expiry' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.name).toBe('auth-investigation');
    expect(res.body.data.note).toBe('started looking at JWT expiry');
  });

  it('documents: PATCH with non-array tags currently writes without error (known gap)', async () => {
    // tags validation is a known gap — add Zod body schema in a future wave
    await updateRegistry('ses-patch-tags-invalid', {
      session_id: 'ses-patch-tags-invalid',
      project_dir: '/projects/patch',
      last_active: '2026-03-15T09:00:00.000Z',
    });

    const res = await request(app)
      .patch('/api/sessions/ses-patch-tags-invalid')
      .send({ tags: 'not-an-array' });

    // Current behaviour: no Zod validation, so non-array tags writes without error
    expect(res.status).toBe(200);
  });
});
