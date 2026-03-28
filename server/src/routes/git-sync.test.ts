import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { GitSyncStatus, GitPullResult } from '@appystack/shared';

// Mock the git-sync service before importing the route
vi.mock('../services/git-sync.service.js', () => ({
  checkStatus: vi.fn(),
  pullUpstream: vi.fn(),
}));

import { checkStatus, pullUpstream } from '../services/git-sync.service.js';
import { gitSyncRouter } from './git-sync.js';

const mockCheckStatus = vi.mocked(checkStatus);
const mockPullUpstream = vi.mocked(pullUpstream);

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use('/api/git-sync', gitSyncRouter);
});

// ── GET /api/git-sync/status ──────────────────────────────────────────────────

describe('GET /api/git-sync/status', () => {
  it('returns 200 with correct GitSyncStatus shape', async () => {
    const fakeStatus: GitSyncStatus = {
      state: 'behind',
      branch: 'main',
      localCommit: 'abc1234',
      remoteCommit: 'def5678',
      behind: 3,
      ahead: 0,
      dirty: false,
      dirtyFiles: [],
      dirtyCount: 0,
      lastChecked: '2026-03-27T10:00:00.000Z',
      behindCommits: [
        {
          sha: 'aaa1111',
          message: 'feat: something',
          author: 'Dave',
          date: '2026-03-27T09:00:00.000Z',
        },
      ],
    };
    mockCheckStatus.mockResolvedValueOnce(fakeStatus);

    const res = await request(app).get('/api/git-sync/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toEqual(fakeStatus);
    expect(res.body.data.state).toBe('behind');
    expect(res.body.data.branch).toBe('main');
    expect(res.body.data.behind).toBe(3);
    expect(res.body.data.behindCommits).toHaveLength(1);
  });

  it('returns 500 when service throws', async () => {
    mockCheckStatus.mockRejectedValueOnce(new Error('git fetch timed out'));

    const res = await request(app).get('/api/git-sync/status');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Git sync status check failed');
  });
});

// ── POST /api/git-sync/pull ───────────────────────────────────────────────────

describe('POST /api/git-sync/pull', () => {
  it('returns 200 with GitPullResult on success', async () => {
    const fakeResult: GitPullResult = {
      success: true,
      previousCommit: 'abc1234',
      newCommit: 'def5678',
      commitsPulled: 3,
      restartTriggered: false,
    };
    mockPullUpstream.mockResolvedValueOnce(fakeResult);

    const res = await request(app).post('/api/git-sync/pull');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toEqual(fakeResult);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.commitsPulled).toBe(3);
  });

  it('returns 200 with success false when pull fails', async () => {
    const failResult: GitPullResult = {
      success: false,
      previousCommit: 'abc1234',
      newCommit: 'abc1234',
      commitsPulled: 0,
      error: 'Pull failed: merge conflict',
      restartTriggered: false,
    };
    mockPullUpstream.mockResolvedValueOnce(failResult);

    const res = await request(app).post('/api/git-sync/pull');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.success).toBe(false);
    expect(res.body.data.error).toContain('Pull failed');
  });

  it('returns 500 when service throws', async () => {
    mockPullUpstream.mockRejectedValueOnce(new Error('git pull catastrophic failure'));

    const res = await request(app).post('/api/git-sync/pull');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Git pull failed');
  });
});
