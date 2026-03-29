import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { ProjectConfig } from '@appystack/shared';

// Mock the service before importing the route
vi.mock('../services/project-config.service.js', () => ({
  getProjectConfigs: vi.fn(),
  getProjectConfig: vi.fn(),
}));

import { getProjectConfigs, getProjectConfig } from '../services/project-config.service.js';
import projectsRouter from './projects.js';

const mockGetProjectConfigs = vi.mocked(getProjectConfigs);
const mockGetProjectConfig = vi.mocked(getProjectConfig);

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use(projectsRouter);
  // Error handler so next(err) produces a 500 response
  app.use(((
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    res.status(500).json({ status: 'error', error: err.message });
  }) as express.ErrorRequestHandler);
});

const fakeProject: ProjectConfig = {
  id: 'angeleye',
  name: 'AngelEye',
  path: '~/dev/ad/apps/angeleye',
  description: 'Session intelligence layer for Claude Code',
  repository: 'github.com/appydave/angeleye',
  tags: ['appystack', 'intelligence', 'claude-code'],
};

const fakeProject2: ProjectConfig = {
  id: 'flivideo',
  name: 'FliVideo',
  path: '~/dev/ad/flivideo',
  description: 'Video asset management tools',
  tags: ['content', 'video'],
};

// ── GET /api/projects ──────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  it('returns 200 with project configs', async () => {
    mockGetProjectConfigs.mockResolvedValueOnce([fakeProject, fakeProject2]);

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.projects).toHaveLength(2);
    expect(res.body.data.projects[0].id).toBe('angeleye');
  });

  it('returns 200 with empty array when no projects', async () => {
    mockGetProjectConfigs.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.projects).toEqual([]);
  });
});

// ── GET /api/projects/:id ──────────────────────────────────────────────────

describe('GET /api/projects/:id', () => {
  it('returns 200 with a single project config', async () => {
    mockGetProjectConfig.mockResolvedValueOnce(fakeProject);

    const res = await request(app).get('/api/projects/angeleye');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.id).toBe('angeleye');
    expect(res.body.data.name).toBe('AngelEye');
  });

  it('returns 404 when project not found', async () => {
    mockGetProjectConfig.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/projects/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Project not found');
  });
});

// ── 500 Error Paths ────────────────────────────────────────────────────────

describe('500 error paths', () => {
  it('GET /api/projects returns 500 when service throws', async () => {
    mockGetProjectConfigs.mockRejectedValueOnce(new Error('disk read failed'));

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/projects/:id returns 500 when service throws', async () => {
    mockGetProjectConfig.mockRejectedValueOnce(new Error('disk read failed'));

    const res = await request(app).get('/api/projects/angeleye');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
