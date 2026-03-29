import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadProjectConfigs,
  getProjectConfigs,
  getProjectConfig,
  _resetCache,
  _setConfigDir,
} from './project-config.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-project-test-'));
  _resetCache();
  _setConfigDir(testDir);
});

afterEach(async () => {
  _resetCache();
  await rm(testDir, { recursive: true, force: true });
});

// ── Loading configs ─────────────────────────────────────────────────────────

describe('loadProjectConfigs', () => {
  it('loads all valid JSON configs from directory', async () => {
    const p1 = {
      id: 'alpha',
      name: 'Alpha',
      path: '~/dev/alpha',
      description: 'Alpha project',
    };
    const p2 = {
      id: 'beta',
      name: 'Beta',
      path: '~/dev/beta',
      description: 'Beta project',
      tags: ['test'],
    };

    await writeFile(join(testDir, 'alpha.json'), JSON.stringify(p1));
    await writeFile(join(testDir, 'beta.json'), JSON.stringify(p2));

    const projects = await loadProjectConfigs();
    expect(projects).toHaveLength(2);

    const ids = projects.map((p) => p.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
  });

  it('returns cached result on second call (no re-read)', async () => {
    const p1 = {
      id: 'cached_one',
      name: 'Cached',
      path: '~/dev/cached',
      description: 'Cached project',
    };
    await writeFile(join(testDir, 'cached.json'), JSON.stringify(p1));

    const first = await loadProjectConfigs();
    expect(first).toHaveLength(1);

    // Write another file after first load — should NOT appear due to cache
    const p2 = {
      id: 'sneaky',
      name: 'Sneaky',
      path: '~/dev/sneaky',
      description: 'Sneaky project',
    };
    await writeFile(join(testDir, 'sneaky.json'), JSON.stringify(p2));

    const second = await loadProjectConfigs();
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe('cached_one');
  });

  it('handles missing directory gracefully', async () => {
    _setConfigDir(join(testDir, 'nonexistent'));

    const projects = await loadProjectConfigs();
    expect(projects).toEqual([]);
  });

  it('skips malformed JSON without crashing', async () => {
    const valid = {
      id: 'good',
      name: 'Good',
      path: '~/dev/good',
      description: 'Good project',
    };
    await writeFile(join(testDir, 'good.json'), JSON.stringify(valid));
    await writeFile(join(testDir, 'bad.json'), '{not valid json!!!');

    const projects = await loadProjectConfigs();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('good');
  });

  it('ignores non-JSON files', async () => {
    const valid = {
      id: 'only_json',
      name: 'Only JSON',
      path: '~/dev/only-json',
      description: 'Only JSON project',
    };
    await writeFile(join(testDir, 'valid.json'), JSON.stringify(valid));
    await writeFile(join(testDir, 'readme.txt'), 'Not a config');

    const projects = await loadProjectConfigs();
    expect(projects).toHaveLength(1);
  });

  it('skips configs missing required fields', async () => {
    const valid = {
      id: 'complete',
      name: 'Complete',
      path: '~/dev/complete',
      description: 'Complete project',
    };
    const missingPath = { id: 'no_path', name: 'No Path', description: 'Missing path' };
    const missingName = { id: 'no_name', path: '~/dev/no-name', description: 'Missing name' };

    await writeFile(join(testDir, 'complete.json'), JSON.stringify(valid));
    await writeFile(join(testDir, 'no-path.json'), JSON.stringify(missingPath));
    await writeFile(join(testDir, 'no-name.json'), JSON.stringify(missingName));

    const projects = await loadProjectConfigs();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('complete');
  });
});

// ── getProjectConfig by id ─────────────────────────────────────────────────

describe('getProjectConfig', () => {
  it('returns matching project by id', async () => {
    const p1 = {
      id: 'find_me',
      name: 'Find Me',
      path: '~/dev/find-me',
      description: 'Find me project',
    };
    await writeFile(join(testDir, 'find-me.json'), JSON.stringify(p1));

    const result = await getProjectConfig('find_me');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('find_me');
    expect(result!.name).toBe('Find Me');
  });

  it('returns null for unknown id', async () => {
    const p1 = {
      id: 'exists',
      name: 'Exists',
      path: '~/dev/exists',
      description: 'Existing project',
    };
    await writeFile(join(testDir, 'exists.json'), JSON.stringify(p1));

    const result = await getProjectConfig('does_not_exist');
    expect(result).toBeNull();
  });
});

// ── getProjectConfigs alias ────────────────────────────────────────────────

describe('getProjectConfigs', () => {
  it('returns same result as loadProjectConfigs', async () => {
    const p1 = {
      id: 'alias_test',
      name: 'Alias Test',
      path: '~/dev/alias-test',
      description: 'Alias test project',
    };
    await writeFile(join(testDir, 'alias.json'), JSON.stringify(p1));

    const projects = await getProjectConfigs();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('alias_test');
  });
});

// ── Real configs integration ───────────────────────────────────────────────

describe('real project configs', () => {
  it('loads 3 projects with correct ids from actual config dir', async () => {
    _resetCache();
    const realConfigDir = resolve(import.meta.dirname, '..', 'config', 'projects');
    _setConfigDir(realConfigDir);

    const projects = await loadProjectConfigs();
    expect(projects).toHaveLength(3);

    const ids = projects.map((p) => p.id).sort();
    expect(ids).toEqual(['angeleye', 'flivideo', 'supportsignal']);
  });
});
