import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { _setDataDir, initAngelEyeDirs } from './registry.service.js';
import { readEnrichmentHistory, appendEnrichmentPass } from './enrichment.service.js';
import type { EnrichmentPass } from '@appystack/shared';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-enrich-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function makePass(overrides: Partial<EnrichmentPass> = {}): EnrichmentPass {
  return {
    version: 1,
    enriched_at: '2026-05-06T10:00:00.000Z',
    model: 'claude-sonnet-4-6',
    changes: { session_subtype: 'build.feature' },
    ...overrides,
  };
}

describe('readEnrichmentHistory', () => {
  it('returns empty array when no sidecar exists', async () => {
    const history = await readEnrichmentHistory('ses-missing');
    expect(history).toEqual([]);
  });

  it('returns empty array when sidecar contains corrupt JSON', async () => {
    const { _enrichmentsDir } = await import('./registry.service.js');
    await writeFile(join(_enrichmentsDir(), 'ses-corrupt.json'), '{ not valid', 'utf-8');
    const history = await readEnrichmentHistory('ses-corrupt');
    expect(history).toEqual([]);
  });

  it('returns empty array when sidecar contains a non-array value', async () => {
    const { _enrichmentsDir } = await import('./registry.service.js');
    await writeFile(join(_enrichmentsDir(), 'ses-obj.json'), '{"version":1}', 'utf-8');
    const history = await readEnrichmentHistory('ses-obj');
    expect(history).toEqual([]);
  });
});

describe('appendEnrichmentPass', () => {
  it('creates sidecar with one entry on first write', async () => {
    const pass = makePass();
    await appendEnrichmentPass('ses-first', pass);

    const history = await readEnrichmentHistory('ses-first');
    expect(history).toHaveLength(1);
    expect(history[0]?.version).toBe(1);
    expect(history[0]?.model).toBe('claude-sonnet-4-6');
  });

  it('accumulates entries across multiple passes with different versions', async () => {
    await appendEnrichmentPass('ses-multi', makePass({ version: 1 }));
    await appendEnrichmentPass('ses-multi', makePass({ version: 2, model: 'claude-opus-4-7' }));

    const history = await readEnrichmentHistory('ses-multi');
    expect(history).toHaveLength(2);
    expect(history[0]?.version).toBe(1);
    expect(history[1]?.version).toBe(2);
    expect(history[1]?.model).toBe('claude-opus-4-7');
  });

  it('skips duplicate version — same version written twice stays as one entry', async () => {
    await appendEnrichmentPass('ses-dedup', makePass({ version: 1 }));
    await appendEnrichmentPass('ses-dedup', makePass({ version: 1, model: 'claude-opus-4-7' }));

    const history = await readEnrichmentHistory('ses-dedup');
    expect(history).toHaveLength(1);
    expect(history[0]?.model).toBe('claude-sonnet-4-6');
  });

  it('concurrent writes for the same session serialise correctly — no entries lost', async () => {
    const passes = [1, 2, 3, 4, 5].map((v) => makePass({ version: v }));
    await Promise.all(passes.map((p) => appendEnrichmentPass('ses-concurrent', p)));

    const history = await readEnrichmentHistory('ses-concurrent');
    expect(history).toHaveLength(5);
    const versions = history.map((p) => p.version).sort((a, b) => a - b);
    expect(versions).toEqual([1, 2, 3, 4, 5]);
  });
});
