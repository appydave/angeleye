import { mkdtemp, rm, readFile, writeFile, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { _setDataDir, initAngelEyeDirs, _sessionsDir, _archiveDir } from './registry.service.js';
import {
  buildIndex,
  queryIndex,
  hydrate,
  appendToIndex,
  ensureIndex,
  isIndexStale,
  readIndexMeta,
  eventTypeCounts,
  extractTool,
  _indexPath,
  _indexMetaPath,
  _indexLineCount,
} from './event-index.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-event-index-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: '2026-08-01T10:00:00.000Z',
    source: 'hook',
    event: 'tool_use',
    ...overrides,
  } as AngelEyeEvent;
}

async function seedSession(
  sessionId: string,
  events: Partial<AngelEyeEvent>[],
  dir: 'sessions' | 'archive' = 'sessions'
): Promise<void> {
  const target = dir === 'sessions' ? _sessionsDir() : _archiveDir();
  const body = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
  await writeFile(join(target, `session-${sessionId}.jsonl`), body, 'utf-8');
}

// ── buildIndex ────────────────────────────────────────────────────────────────

describe('buildIndex', () => {
  it('indexes events from both the live sessions dir and the archive', async () => {
    await seedSession('ses-live', [
      makeEvent({ id: 'a1', session_id: 'ses-live', event: 'tool_use' }),
      makeEvent({ id: 'a2', session_id: 'ses-live', event: 'tool_failure' }),
    ]);
    await seedSession(
      'ses-archived',
      [makeEvent({ id: 'b1', session_id: 'ses-archived', event: 'stop' })],
      'archive'
    );

    const meta = await buildIndex();

    expect(meta.files_indexed).toBe(2);
    expect(meta.events_indexed).toBe(3);
    expect(await _indexLineCount()).toBe(3);
  });

  it('skips malformed JSONL lines without aborting the build', async () => {
    const path = join(_sessionsDir(), 'session-ses-torn.jsonl');
    await writeFile(path, JSON.stringify(makeEvent({ id: 'ok-1' })) + '\n', 'utf-8');
    await appendFile(path, '{ this is not json\n', 'utf-8');
    await appendFile(path, JSON.stringify(makeEvent({ id: 'ok-2' })) + '\n', 'utf-8');

    const meta = await buildIndex();

    expect(meta.events_indexed).toBe(2);
  });

  it('skips event records missing required fields', async () => {
    await seedSession('ses-partial', [
      makeEvent({ id: 'good' }),
      { id: 'no-session', ts: '2026-08-01T10:00:00.000Z', event: 'stop' },
      { id: 'no-ts', session_id: 'ses-partial', event: 'stop' },
    ]);

    const meta = await buildIndex();

    expect(meta.events_indexed).toBe(1);
  });

  it('writes meta with a version so a format change forces a rebuild', async () => {
    await seedSession('ses-a', [makeEvent()]);
    await buildIndex();

    const meta = await readIndexMeta();
    expect(meta?.version).toBe(1);
    expect(meta?.built_at).toBeTruthy();
  });
});

// ── queryIndex ────────────────────────────────────────────────────────────────

describe('queryIndex', () => {
  beforeEach(async () => {
    await seedSession('ses-1', [
      makeEvent({
        id: 'e1',
        session_id: 'ses-1',
        event: 'tool_use',
        ts: '2026-07-30T09:00:00.000Z',
        tool: 'Read',
      }),
      makeEvent({
        id: 'e2',
        session_id: 'ses-1',
        event: 'tool_failure',
        ts: '2026-07-31T09:00:00.000Z',
        tool: 'Bash',
      }),
    ]);
    await seedSession('ses-2', [
      makeEvent({
        id: 'e3',
        session_id: 'ses-2',
        event: 'tool_failure',
        ts: '2026-08-01T09:00:00.000Z',
        tool: 'Bash',
      }),
      makeEvent({ id: 'e4', session_id: 'ses-2', event: 'stop', ts: '2026-08-01T10:00:00.000Z' }),
    ]);
    await buildIndex();
  });

  it('finds one event type across every session — the whole point of the index', async () => {
    const res = await queryIndex({ events: ['tool_failure'] });

    expect(res.total).toBe(2);
    expect(res.locators.map((l) => l.id).sort()).toEqual(['e2', 'e3']);
    expect(new Set(res.locators.map((l) => l.session_id))).toEqual(new Set(['ses-1', 'ses-2']));
  });

  it('accepts multiple event types', async () => {
    const res = await queryIndex({ events: ['tool_failure', 'stop'] });
    expect(res.total).toBe(3);
  });

  it('returns newest first by default and oldest first when desc is false', async () => {
    const desc = await queryIndex({ events: ['tool_failure'] });
    expect(desc.locators[0].id).toBe('e3');

    const asc = await queryIndex({ events: ['tool_failure'], desc: false });
    expect(asc.locators[0].id).toBe('e2');
  });

  it('filters by since and treats until as covering the whole day', async () => {
    const res = await queryIndex({ since: '2026-08-01', until: '2026-08-01' });

    expect(res.total).toBe(2);
    expect(res.locators.map((l) => l.id).sort()).toEqual(['e3', 'e4']);
  });

  it('filters by tool case-insensitively', async () => {
    const res = await queryIndex({ tool: 'bash' });
    expect(res.total).toBe(2);
  });

  it('filters by session id', async () => {
    const res = await queryIndex({ sessionId: 'ses-1' });
    expect(res.total).toBe(2);
  });

  it('restricts to a supplied session id set (the project-filter path)', async () => {
    const res = await queryIndex({ sessionIds: new Set(['ses-2']) });
    expect(res.total).toBe(2);
    expect(res.locators.every((l) => l.session_id === 'ses-2')).toBe(true);
  });

  it('pages with limit and offset while reporting the unpaged total', async () => {
    const page = await queryIndex({ limit: 1, offset: 1 });

    expect(page.total).toBe(4);
    expect(page.locators).toHaveLength(1);
  });

  it('returns an empty result rather than throwing when no index exists', async () => {
    await rm(_indexPath(), { force: true });

    const res = await queryIndex({ events: ['tool_failure'] });

    expect(res).toEqual({ locators: [], total: 0, scanned: 0 });
  });
});

// ── hydrate ───────────────────────────────────────────────────────────────────

describe('hydrate', () => {
  it('loads full payloads for matched locators, preserving query order', async () => {
    await seedSession('ses-h', [
      makeEvent({
        id: 'h1',
        session_id: 'ses-h',
        event: 'tool_failure',
        ts: '2026-08-01T09:00:00.000Z',
        payload: { tool_name: 'Bash', tool_input: { command: 'git push' } },
      }),
      makeEvent({ id: 'h2', session_id: 'ses-h', event: 'stop', ts: '2026-08-01T10:00:00.000Z' }),
    ]);
    await buildIndex();

    const { locators } = await queryIndex({ sessionId: 'ses-h', desc: false });
    const events = await hydrate(locators);

    expect(events.map((e) => e.id)).toEqual(['h1', 'h2']);
    expect(events[0].payload).toEqual({ tool_name: 'Bash', tool_input: { command: 'git push' } });
  });

  it('reads each session file once when locators span sessions', async () => {
    await seedSession('ses-x', [
      makeEvent({ id: 'x1', session_id: 'ses-x', event: 'tool_failure' }),
    ]);
    await seedSession('ses-y', [
      makeEvent({
        id: 'y1',
        session_id: 'ses-y',
        event: 'tool_failure',
        ts: '2026-08-02T10:00:00.000Z',
      }),
    ]);
    await buildIndex();

    const { locators } = await queryIndex({ events: ['tool_failure'] });
    const events = await hydrate(locators);

    expect(events).toHaveLength(2);
  });

  it('falls back to archive when the live session file is gone', async () => {
    await seedSession(
      'ses-arch',
      [makeEvent({ id: 'z1', session_id: 'ses-arch', event: 'tool_failure' })],
      'archive'
    );
    await buildIndex();

    const { locators } = await queryIndex({ events: ['tool_failure'] });
    const events = await hydrate(locators);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('z1');
  });

  it('drops locators whose session file has disappeared instead of throwing', async () => {
    await seedSession('ses-gone', [makeEvent({ id: 'g1', session_id: 'ses-gone' })]);
    await buildIndex();
    const { locators } = await queryIndex({ sessionId: 'ses-gone' });
    await rm(join(_sessionsDir(), 'session-ses-gone.jsonl'), { force: true });

    const events = await hydrate(locators);

    expect(events).toEqual([]);
  });
});

// ── appendToIndex (incremental freshness) ─────────────────────────────────────

describe('appendToIndex', () => {
  it('makes a newly written event queryable without a rebuild', async () => {
    await seedSession('ses-1', [makeEvent({ id: 'seed' })]);
    await buildIndex();

    await appendToIndex(
      makeEvent({
        id: 'live',
        session_id: 'ses-1',
        event: 'tool_failure',
        ts: '2026-08-01T11:00:00.000Z',
      })
    );

    const res = await queryIndex({ events: ['tool_failure'] });
    expect(res.total).toBe(1);
    expect(res.locators[0].id).toBe('live');
  });

  it('is a no-op when no index exists, so ingestion is never blocked', async () => {
    await appendToIndex(makeEvent({ id: 'orphan' }));

    expect(await _indexLineCount()).toBe(0);
  });

  it('ignores events missing required fields', async () => {
    await seedSession('ses-1', [makeEvent()]);
    await buildIndex();
    const before = await _indexLineCount();

    await appendToIndex({ id: 'bad', event: 'stop' });

    expect(await _indexLineCount()).toBe(before);
  });
});

// ── staleness / ensureIndex ───────────────────────────────────────────────────

describe('ensureIndex', () => {
  it('reports stale when no index file exists', async () => {
    expect(await isIndexStale()).toBe(true);
  });

  it('builds on first call and reuses the index afterwards', async () => {
    await seedSession('ses-1', [makeEvent()]);

    const first = await ensureIndex();
    expect(first.events_indexed).toBe(1);
    expect(await isIndexStale()).toBe(false);

    // A second call must not rebuild — proven by an appended row surviving.
    await appendToIndex(makeEvent({ id: 'extra', ts: '2026-08-01T12:00:00.000Z' }));
    await ensureIndex();

    expect(await _indexLineCount()).toBe(2);
  });

  it('rebuilds when the on-disk index was written by an older version', async () => {
    await seedSession('ses-1', [makeEvent()]);
    await buildIndex();
    await writeFile(
      _indexMetaPath(),
      JSON.stringify({ version: 0, built_at: 'x', files_indexed: 0, events_indexed: 0 }),
      'utf-8'
    );

    expect(await isIndexStale()).toBe(true);
    const meta = await ensureIndex();
    expect(meta.version).toBe(1);
  });
});

// ── helpers ───────────────────────────────────────────────────────────────────

describe('extractTool', () => {
  it('reads the top-level tool field used by transcript-sourced events', () => {
    expect(extractTool({ tool: 'Read' })).toBe('Read');
  });

  it('falls back to payload.tool_name used by hook-sourced events', () => {
    expect(extractTool({ payload: { tool_name: 'Bash' } })).toBe('Bash');
  });

  it('returns empty string when neither is present', () => {
    expect(extractTool({})).toBe('');
  });
});

describe('eventTypeCounts', () => {
  it('counts by type across all sessions', async () => {
    await seedSession('ses-1', [
      makeEvent({ id: 'c1', event: 'tool_use' }),
      makeEvent({ id: 'c2', event: 'tool_use', ts: '2026-08-01T10:01:00.000Z' }),
      makeEvent({ id: 'c3', event: 'tool_failure', ts: '2026-08-01T10:02:00.000Z' }),
    ]);
    await buildIndex();

    const counts = await eventTypeCounts();

    expect(counts).toEqual({ tool_use: 2, tool_failure: 1 });
  });
});

// ── format safety ─────────────────────────────────────────────────────────────

describe('index row encoding', () => {
  it('strips tabs and newlines so an injected value cannot forge a row', async () => {
    await seedSession('ses-1', [
      makeEvent({ id: 'inj', tool: 'Bad\tTool\nses-evil\t2026-01-01T00:00:00Z\tfake' }),
    ]);

    const meta = await buildIndex();

    expect(meta.events_indexed).toBe(1);
    expect(await _indexLineCount()).toBe(1);
    const raw = await readFile(_indexPath(), 'utf-8');
    expect(raw.split('\n').filter((l) => l !== '')).toHaveLength(1);
  });
});
