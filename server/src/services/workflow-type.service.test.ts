import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadWorkflowTypes,
  getWorkflowTypes,
  getWorkflowType,
  _resetCache,
  _setConfigDir,
} from './workflow-type.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-wftype-test-'));
  _resetCache();
  _setConfigDir(testDir);
});

afterEach(async () => {
  _resetCache();
  await rm(testDir, { recursive: true, force: true });
});

// ── Loading configs ─────────────────────────────────────────────────────────

describe('loadWorkflowTypes', () => {
  it('loads all valid JSON configs from directory', async () => {
    const type1 = {
      id: 'alpha',
      name: 'Alpha',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    const type2 = {
      id: 'beta',
      name: 'Beta',
      domain: 'test',
      ceremony_level: 'minimal',
      stations: [],
      skip_rules: [],
    };

    await writeFile(join(testDir, 'alpha.json'), JSON.stringify(type1));
    await writeFile(join(testDir, 'beta.json'), JSON.stringify(type2));

    const types = await loadWorkflowTypes();
    expect(types).toHaveLength(2);

    const ids = types.map((t) => t.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
  });

  it('returns cached result on second call (no re-read)', async () => {
    const type1 = {
      id: 'cached_one',
      name: 'Cached',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'cached.json'), JSON.stringify(type1));

    const first = await loadWorkflowTypes();
    expect(first).toHaveLength(1);

    // Write another file after first load — should NOT appear due to cache
    const type2 = {
      id: 'sneaky',
      name: 'Sneaky',
      domain: 'test',
      ceremony_level: 'minimal',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'sneaky.json'), JSON.stringify(type2));

    const second = await loadWorkflowTypes();
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe('cached_one');
  });

  it('handles missing directory gracefully', async () => {
    _setConfigDir(join(testDir, 'nonexistent'));

    const types = await loadWorkflowTypes();
    expect(types).toEqual([]);
  });

  it('skips malformed JSON without crashing', async () => {
    const valid = {
      id: 'good',
      name: 'Good',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'good.json'), JSON.stringify(valid));
    await writeFile(join(testDir, 'bad.json'), '{not valid json!!!');

    const types = await loadWorkflowTypes();
    expect(types).toHaveLength(1);
    expect(types[0].id).toBe('good');
  });

  it('ignores non-JSON files', async () => {
    const valid = {
      id: 'only_json',
      name: 'Only JSON',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'valid.json'), JSON.stringify(valid));
    await writeFile(join(testDir, 'readme.txt'), 'Not a config');

    const types = await loadWorkflowTypes();
    expect(types).toHaveLength(1);
  });
});

// ── getWorkflowType by id ───────────────────────────────────────────────────

describe('getWorkflowType', () => {
  it('returns matching type by id', async () => {
    const type1 = {
      id: 'find_me',
      name: 'Find Me',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'find-me.json'), JSON.stringify(type1));

    const result = await getWorkflowType('find_me');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('find_me');
    expect(result!.name).toBe('Find Me');
  });

  it('returns null for unknown id', async () => {
    const type1 = {
      id: 'exists',
      name: 'Exists',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'exists.json'), JSON.stringify(type1));

    const result = await getWorkflowType('does_not_exist');
    expect(result).toBeNull();
  });
});

// ── getWorkflowTypes alias ──────────────────────────────────────────────────

describe('getWorkflowTypes', () => {
  it('returns same result as loadWorkflowTypes', async () => {
    const type1 = {
      id: 'alias_test',
      name: 'Alias Test',
      domain: 'test',
      ceremony_level: 'full',
      stations: [],
      skip_rules: [],
    };
    await writeFile(join(testDir, 'alias.json'), JSON.stringify(type1));

    const types = await getWorkflowTypes();
    expect(types).toHaveLength(1);
    expect(types[0].id).toBe('alias_test');
  });
});

// ── Real configs integration ────────────────────────────────────────────────

describe('real workflow configs', () => {
  it('loads 3 types with correct ids from actual config dir', async () => {
    _resetCache();
    const realConfigDir = resolve(process.cwd(), 'src', 'config', 'workflows');
    _setConfigDir(realConfigDir);

    const types = await loadWorkflowTypes();
    expect(types).toHaveLength(3);

    const ids = types.map((t) => t.id).sort();
    expect(ids).toEqual(['epic_zero', 'lightweight_story', 'regular_story']);
  });
});
