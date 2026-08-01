import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { AngelEyeEvent } from '@appystack/shared';
import {
  _setDataDir,
  initAngelEyeDirs,
  updateRegistry,
  _sessionsDir,
} from '../services/registry.service.js';
import { buildIndex, _indexPath } from '../services/event-index.service.js';
import { errorHandler } from '../middleware/errorHandler.js';
import eventsRouter from './events.js';

let testDir: string;
let app: express.Express;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-events-route-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
  app = express();
  app.use(express.json());
  app.use(eventsRouter);
  app.use(errorHandler);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function makeEvent(overrides: Partial<AngelEyeEvent> = {}): Partial<AngelEyeEvent> {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: '2026-08-01T10:00:00.000Z',
    source: 'hook',
    event: 'tool_use',
    ...overrides,
  };
}

async function seedSession(sessionId: string, events: Partial<AngelEyeEvent>[]): Promise<void> {
  const body = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
  await writeFile(join(_sessionsDir(), `session-${sessionId}.jsonl`), body, 'utf-8');
}

/** Two sessions in different projects, with a failure in each. */
async function seedCorpus(): Promise<void> {
  await seedSession('ses-cl', [
    makeEvent({
      id: 'c1',
      session_id: 'ses-cl',
      event: 'tool_use',
      ts: '2026-07-30T09:00:00.000Z',
      tool: 'Read',
    }),
    makeEvent({
      id: 'c2',
      session_id: 'ses-cl',
      event: 'tool_failure',
      ts: '2026-07-31T09:00:00.000Z',
      payload: { tool_name: 'Bash', tool_input: { command: 'git push' } },
    }),
  ]);
  await seedSession('ses-ae', [
    makeEvent({
      id: 'a1',
      session_id: 'ses-ae',
      event: 'tool_failure',
      ts: '2026-08-01T09:00:00.000Z',
      tool: 'Bash',
    }),
    makeEvent({ id: 'a2', session_id: 'ses-ae', event: 'stop', ts: '2026-08-01T10:00:00.000Z' }),
  ]);
  await updateRegistry('ses-cl', { project: 'captains-log' });
  await updateRegistry('ses-ae', { project: 'angeleye' });
  await buildIndex();
}

// ── GET /api/events ───────────────────────────────────────────────────────────

describe('GET /api/events', () => {
  it('returns failures from every session in one call', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=tool_failure');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.locators.map((l: { id: string }) => l.id).sort()).toEqual(['a1', 'c2']);
  });

  it('hydrates full payloads by default so a failure shows its command', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=tool_failure&session_id=ses-cl');

    expect(res.body.data.hydrated).toBe(true);
    expect(res.body.data.events[0].payload).toEqual({
      tool_name: 'Bash',
      tool_input: { command: 'git push' },
    });
  });

  it('skips hydration when hydrate=false', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=tool_failure&hydrate=false');

    expect(res.body.data.hydrated).toBe(false);
    expect(res.body.data.events).toEqual([]);
    expect(res.body.data.locators).toHaveLength(2);
  });

  it('builds the index on first request when none exists', async () => {
    await seedSession('ses-1', [makeEvent({ id: 'auto', event: 'tool_failure' })]);
    await updateRegistry('ses-1', { project: 'p' });
    // No buildIndex() call — the route must do it.

    const res = await request(app).get('/api/events?event=tool_failure');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  it('filters by project via the registry join', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=tool_failure&project=captains-log');

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.locators[0].session_id).toBe('ses-cl');
  });

  it('supports glob project matching', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?project=*log&project_match=glob');

    expect(res.body.data.total).toBe(2);
  });

  it('returns empty for an unmatched project rather than ignoring the filter', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?project=does-not-exist');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.events).toEqual([]);
  });

  it('filters by date range with an inclusive until', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?since=2026-08-01&until=2026-08-01');

    expect(res.body.data.total).toBe(2);
  });

  it('filters by tool name', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?tool=Bash');

    expect(res.body.data.total).toBe(2);
  });

  it('attaches the project for each returned session', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=tool_failure');

    expect(res.body.data.projects).toEqual({
      'ses-cl': 'captains-log',
      'ses-ae': 'angeleye',
    });
  });

  it('caps limit at 500 and floors it at 1', async () => {
    await seedCorpus();

    const high = await request(app).get('/api/events?limit=99999');
    expect(high.body.data.limit).toBe(500);

    const low = await request(app).get('/api/events?limit=0');
    expect(low.body.data.limit).toBe(1);
  });

  it('falls back to defaults on non-numeric limit and offset', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?limit=abc&offset=xyz');

    expect(res.body.data.limit).toBe(100);
    expect(res.body.data.offset).toBe(0);
  });

  it('pages with offset while reporting the unpaged total', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?limit=1&offset=1');

    expect(res.body.data.total).toBe(4);
    expect(res.body.data.locators).toHaveLength(1);
  });

  it('orders newest first by default and oldest first with order=asc', async () => {
    await seedCorpus();

    const desc = await request(app).get('/api/events?event=tool_failure');
    expect(desc.body.data.locators[0].id).toBe('a1');

    const asc = await request(app).get('/api/events?event=tool_failure&order=asc');
    expect(asc.body.data.locators[0].id).toBe('c2');
  });

  it('returns an empty result set rather than erroring when nothing matches', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?event=no_such_event');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  it('does not fail when a bad regex is supplied as a project filter', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events?project=[unclosed&project_match=regex');

    expect(res.status).toBe(200);
  });
});

// ── GET /api/events/summary ───────────────────────────────────────────────────

describe('GET /api/events/summary', () => {
  it('counts by event type across all sessions', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events/summary');

    expect(res.status).toBe(200);
    expect(res.body.data.counts).toEqual({ tool_use: 1, tool_failure: 2, stop: 1 });
    expect(res.body.data.total).toBe(4);
  });

  it('honours the project filter', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events/summary?project=angeleye');

    expect(res.body.data.counts).toEqual({ tool_failure: 1, stop: 1 });
  });

  it('returns empty counts for an unmatched project', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events/summary?project=nope');

    expect(res.body.data).toEqual({ counts: {}, total: 0 });
  });
});

// ── index management ──────────────────────────────────────────────────────────

describe('GET /api/events/index', () => {
  it('reports null meta before any index is built', async () => {
    const res = await request(app).get('/api/events/index');

    expect(res.status).toBe(200);
    expect(res.body.data.meta).toBeNull();
  });

  it('reports counts once built', async () => {
    await seedCorpus();

    const res = await request(app).get('/api/events/index');

    expect(res.body.data.meta.events_indexed).toBe(4);
    expect(res.body.data.meta.files_indexed).toBe(2);
  });
});

describe('POST /api/events/reindex', () => {
  it('rebuilds from disk and returns fresh meta', async () => {
    await seedCorpus();
    await rm(_indexPath(), { force: true });

    const res = await request(app).post('/api/events/reindex');

    expect(res.status).toBe(200);
    expect(res.body.data.meta.events_indexed).toBe(4);
  });

  it('picks up sessions added since the last build', async () => {
    await seedCorpus();
    await seedSession('ses-new', [
      makeEvent({ id: 'n1', session_id: 'ses-new', event: 'tool_failure' }),
    ]);

    const res = await request(app).post('/api/events/reindex');

    expect(res.body.data.meta.events_indexed).toBe(5);
  });
});
