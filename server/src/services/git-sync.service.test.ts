import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock setup ──────────────────────────────────────────────────────────────

/**
 * We mock `node:child_process` so that `promisify(execFile)` returns our
 * controlled async function. We use the `util.promisify.custom` symbol so
 * Node's `promisify` picks up our async implementation directly.
 */

const { mockExecFileAsync } = vi.hoisted(() => ({
  mockExecFileAsync: vi.fn<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>(),
}));

vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util');
  // Create a fake execFile with the custom promisify symbol
  const fakeExecFile = (() => {}) as unknown as Record<symbol, unknown>;
  fakeExecFile[promisify.custom] = mockExecFileAsync;
  return { execFile: fakeExecFile };
});

vi.mock('../config/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Queue up git command results in call order */
function enqueueGitResults(results: Array<{ stdout?: string; error?: Error }>) {
  let callIndex = 0;
  mockExecFileAsync.mockImplementation(async () => {
    const result = results[callIndex] ?? { stdout: '' };
    callIndex++;
    if (result.error) throw result.error;
    return { stdout: result.stdout ?? '', stderr: '' };
  });
}

/**
 * Build the standard sequence for a checkStatus call:
 * 1. fetch, 2. rev-parse branch, 3. rev-parse local, 4. rev-parse remote,
 * 5. rev-list, 6. status --porcelain, 7. (optional) log for behind commits
 */
function checkStatusResults(
  overrides: {
    fetchError?: Error;
    branch?: string;
    local?: string;
    remote?: string;
    remoteError?: Error;
    revList?: string;
    porcelain?: string;
    log?: string;
  } = {}
) {
  const results: Array<{ stdout?: string; error?: Error }> = [];

  // 1. fetch
  if (overrides.fetchError) {
    results.push({ error: overrides.fetchError });
    return results;
  }
  results.push({ stdout: '' });

  // 2. branch
  results.push({ stdout: overrides.branch ?? 'main' });

  // 3. local commit
  results.push({ stdout: overrides.local ?? 'abc1234' });

  // 4. remote commit
  if (overrides.remoteError) {
    results.push({ error: overrides.remoteError });
    return results;
  }
  results.push({ stdout: overrides.remote ?? 'abc1234' });

  // 5. rev-list --left-right --count
  results.push({ stdout: overrides.revList ?? '0\t0' });

  // 6. status --porcelain
  results.push({ stdout: overrides.porcelain ?? '' });

  // 7. log (only when behind > 0)
  if (overrides.log !== undefined) {
    results.push({ stdout: overrides.log });
  }

  return results;
}

// ── Import service under test (must come after vi.mock) ─────────────────────

import { checkStatus, pullUpstream } from './git-sync.service.js';

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.OVERMIND_SOCKET;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkStatus', () => {
  it('returns clean when fetch succeeds, rev-list 0/0, status empty', async () => {
    enqueueGitResults(checkStatusResults());

    const result = await checkStatus();

    expect(result.state).toBe('clean');
    expect(result.branch).toBe('main');
    expect(result.behind).toBe(0);
    expect(result.ahead).toBe(0);
    expect(result.dirty).toBe(false);
    expect(result.behindCommits).toBeUndefined();
  });

  it('returns behind when rev-list shows 0 ahead 3 behind, with behindCommits', async () => {
    const log = [
      'aaa1111|feat: add widget|Alice|2026-03-27T10:00:00Z',
      'bbb2222|fix: typo|Bob|2026-03-27T09:00:00Z',
      'ccc3333|chore: deps|Carol|2026-03-27T08:00:00Z',
    ].join('\n');

    enqueueGitResults(
      checkStatusResults({
        revList: '0\t3',
        remote: 'def5678',
        log,
      })
    );

    const result = await checkStatus();

    expect(result.state).toBe('behind');
    expect(result.behind).toBe(3);
    expect(result.ahead).toBe(0);
    expect(result.behindCommits).toHaveLength(3);
    expect(result.behindCommits![0]).toEqual({
      sha: 'aaa1111',
      message: 'feat: add widget',
      author: 'Alice',
      date: '2026-03-27T10:00:00Z',
    });
  });

  it('returns diverged when dirty AND behind', async () => {
    enqueueGitResults(
      checkStatusResults({
        revList: '0\t2',
        porcelain: ' M server/src/index.ts\n',
        log: 'aaa1111|fix: thing|Alice|2026-03-27T10:00:00Z\nbbb2222|fix: other|Bob|2026-03-27T09:00:00Z',
      })
    );

    const result = await checkStatus();

    expect(result.state).toBe('diverged');
    expect(result.dirty).toBe(true);
    expect(result.behind).toBe(2);
  });

  it('returns dirty when status has output but not behind', async () => {
    enqueueGitResults(
      checkStatusResults({
        porcelain: ' M server/src/index.ts\n',
      })
    );

    const result = await checkStatus();

    expect(result.state).toBe('dirty');
    expect(result.dirty).toBe(true);
    expect(result.behind).toBe(0);
  });

  it('returns ahead when rev-list shows 2 ahead 0 behind', async () => {
    enqueueGitResults(checkStatusResults({ revList: '2\t0' }));

    const result = await checkStatus();

    expect(result.state).toBe('ahead');
    expect(result.ahead).toBe(2);
    expect(result.behind).toBe(0);
  });

  it('returns diverged when rev-list shows 2 ahead 3 behind', async () => {
    const log = [
      'aaa1111|feat: one|Alice|2026-03-27T10:00:00Z',
      'bbb2222|feat: two|Bob|2026-03-27T09:00:00Z',
      'ccc3333|feat: three|Carol|2026-03-27T08:00:00Z',
    ].join('\n');

    enqueueGitResults(
      checkStatusResults({
        revList: '2\t3',
        log,
      })
    );

    const result = await checkStatus();

    expect(result.state).toBe('diverged');
    expect(result.ahead).toBe(2);
    expect(result.behind).toBe(3);
  });

  it('returns error when fetch throws', async () => {
    enqueueGitResults(checkStatusResults({ fetchError: new Error('Network unreachable') }));

    const result = await checkStatus();

    expect(result.state).toBe('error');
    expect(result.error).toContain('Fetch failed');
    expect(result.error).toContain('Network unreachable');
  });
});

describe('pullUpstream', () => {
  it('returns success when tree is clean and pull succeeds', async () => {
    enqueueGitResults([
      { stdout: 'aaa1111' }, // 1. rev-parse HEAD (previous commit)
      { stdout: '' }, // 2. status --porcelain (clean)
      { stdout: '' }, // 3. pull --rebase ok
      { stdout: 'bbb2222' }, // 4. rev-parse HEAD (new commit)
      { stdout: '3' }, // 5. rev-list count
    ]);

    const result = await pullUpstream();

    expect(result.success).toBe(true);
    expect(result.previousCommit).toBe('aaa1111');
    expect(result.newCommit).toBe('bbb2222');
    expect(result.commitsPulled).toBe(3);
    expect(result.restartTriggered).toBe(false);
  });

  it('auto-stashes dirty tree, pulls, then restores', async () => {
    enqueueGitResults([
      { stdout: 'aaa1111' }, // 1. rev-parse HEAD (previous commit)
      { stdout: ' M file.ts\n' }, // 2. status --porcelain (dirty)
      { stdout: '' }, // 3. stash push
      { stdout: '' }, // 4. pull --rebase ok
      { stdout: '' }, // 5. stash pop
      { stdout: 'bbb2222' }, // 6. rev-parse HEAD (new commit)
      { stdout: '2' }, // 7. rev-list count
    ]);

    const result = await pullUpstream();

    expect(result.success).toBe(true);
    expect(result.commitsPulled).toBe(2);

    // Verify stash push was called
    const calls = mockExecFileAsync.mock.calls;
    const stashPush = calls.find(
      (c: unknown[]) => Array.isArray(c[1]) && c[1].includes('stash') && c[1].includes('push')
    );
    expect(stashPush).toBeDefined();

    // Verify stash pop was called
    const stashPop = calls.find(
      (c: unknown[]) => Array.isArray(c[1]) && c[1].includes('stash') && c[1].includes('pop')
    );
    expect(stashPop).toBeDefined();
  });

  it('aborts rebase and restores stash on pull failure', async () => {
    enqueueGitResults([
      { stdout: 'aaa1111' }, // 1. rev-parse HEAD
      { stdout: '' }, // 2. status --porcelain (clean)
      { error: new Error('CONFLICT in file.ts') }, // 3. pull fails
      { stdout: '' }, // 4. rebase --abort
    ]);

    const result = await pullUpstream();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Pull failed');
    expect(result.restartTriggered).toBe(false);

    // Verify rebase --abort was called
    const calls = mockExecFileAsync.mock.calls;
    const abortCall = calls.find((c: unknown[]) => Array.isArray(c[1]) && c[1].includes('--abort'));
    expect(abortCall).toBeDefined();
    expect(abortCall![1]).toContain('rebase');
  });
});

describe('withGitLock (mutex serialisation)', () => {
  it('serialises concurrent calls so they do not interleave', async () => {
    const callOrder: string[] = [];
    let callIndex = 0;

    // First checkStatus: 6 git calls (clean)
    // Second checkStatus: 6 git calls (clean)
    const allResults = [
      { stdout: '', label: 'fetch-1' },
      { stdout: 'main', label: 'branch-1' },
      { stdout: 'abc1234', label: 'local-1' },
      { stdout: 'abc1234', label: 'remote-1' },
      { stdout: '0\t0', label: 'revlist-1' },
      { stdout: '', label: 'status-1' },
      { stdout: '', label: 'fetch-2' },
      { stdout: 'main', label: 'branch-2' },
      { stdout: 'def5678', label: 'local-2' },
      { stdout: 'def5678', label: 'remote-2' },
      { stdout: '0\t0', label: 'revlist-2' },
      { stdout: '', label: 'status-2' },
    ];

    mockExecFileAsync.mockImplementation(async () => {
      const entry = allResults[callIndex] ?? { stdout: '', label: 'unknown' };
      callOrder.push(entry.label);
      callIndex++;
      return { stdout: entry.stdout, stderr: '' };
    });

    // Fire both concurrently
    const [r1, r2] = await Promise.all([checkStatus(), checkStatus()]);

    expect(r1.state).toBe('clean');
    expect(r2.state).toBe('clean');

    // Verify serialisation: all of first batch complete before second starts
    const fetch1Idx = callOrder.indexOf('fetch-1');
    const status1Idx = callOrder.indexOf('status-1');
    const fetch2Idx = callOrder.indexOf('fetch-2');

    expect(fetch1Idx).toBeLessThan(status1Idx);
    expect(status1Idx).toBeLessThan(fetch2Idx);
  });
});
