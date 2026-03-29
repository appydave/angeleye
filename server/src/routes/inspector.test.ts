import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { WorkflowType, WorkflowInstance, Registry } from '@appystack/shared';

// Mock services and fs before importing the route
vi.mock('../services/workflow-type.service.js', () => ({
  getWorkflowTypes: vi.fn(),
}));
vi.mock('../services/registry.service.js', () => ({
  readRegistry: vi.fn(),
}));
vi.mock('../services/workflow.service.js', () => ({
  readWorkflows: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { getWorkflowTypes } from '../services/workflow-type.service.js';
import { readRegistry } from '../services/registry.service.js';
import { readWorkflows } from '../services/workflow.service.js';
import { readFile } from 'node:fs/promises';
import inspectorRouter from './inspector.js';

const mockGetWorkflowTypes = vi.mocked(getWorkflowTypes);
const mockReadRegistry = vi.mocked(readRegistry);
const mockReadWorkflows = vi.mocked(readWorkflows);
const mockReadFile = vi.mocked(readFile);

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use(inspectorRouter);
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

const fakeSharedTypes = `export interface RegistryEntry {
  session_id: string;
  project: string;
}`;

const fakeWorkflowType: WorkflowType = {
  id: 'bmad-regular-story',
  name: 'BMAD Regular Story',
  domain: 'bmad',
  stations: [
    {
      position: 1,
      action_code: 'WN',
      role: 'product-owner',
      identity: null,
      requires_fresh_session: false,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
  ],
  ceremony_level: 'full',
  skip_rules: [],
};

const baseEntry = {
  project_dir: '/dev/ad/apps/angeleye',
  last_active: '2026-03-29T11:00:00.000Z',
  name: null,
  tags: [],
  workspace_id: null,
  status: 'ended' as const,
  source: 'transcript' as const,
};

const fakeRegistry: Registry = {
  's-001': {
    ...baseEntry,
    session_id: 's-001',
    project: 'angeleye',
    session_type: 'BUILD',
    started_at: '2026-03-29T10:00:00.000Z',
  },
  's-002': {
    ...baseEntry,
    session_id: 's-002',
    project: 'angeleye',
    session_type: 'TEST',
    started_at: '2026-03-29T12:00:00.000Z',
    last_active: '2026-03-29T13:00:00.000Z',
  },
  's-003': {
    ...baseEntry,
    session_id: 's-003',
    project: 'flivideo',
    project_dir: '/dev/ad/flivideo',
    started_at: '2026-03-29T14:00:00.000Z',
    last_active: '2026-03-29T15:00:00.000Z',
    // no session_type — should count as 'unclassified'
  },
};

const fakeWorkflows: WorkflowInstance[] = [
  {
    instance_id: 'wf-001',
    workflow_type_id: 'bmad-regular-story',
    work_item_id: 'story-1',
    work_item_label: 'Login page',
    status: 'in_progress',
    current_station: 2,
    created_at: '2026-03-29T10:00:00.000Z',
    updated_at: '2026-03-29T11:00:00.000Z',
    stations: [],
    backtracks: [],
    metadata: {},
  },
  {
    instance_id: 'wf-002',
    workflow_type_id: 'bmad-regular-story',
    work_item_id: 'story-2',
    work_item_label: 'Dashboard',
    status: 'closed',
    current_station: 9,
    created_at: '2026-03-29T08:00:00.000Z',
    updated_at: '2026-03-29T09:00:00.000Z',
    stations: [],
    backtracks: [],
    metadata: {},
  },
];

// ── GET /api/inspector/types ────────────────────────────────────────────────

describe('GET /api/inspector/types', () => {
  it('returns 200 with sharedTypes and workflowTypes', async () => {
    mockReadFile.mockResolvedValueOnce(fakeSharedTypes);
    mockGetWorkflowTypes.mockResolvedValueOnce([fakeWorkflowType]);

    const res = await request(app).get('/api/inspector/types');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.sharedTypes).toBe(fakeSharedTypes);
    expect(res.body.data.workflowTypes).toHaveLength(1);
    expect(res.body.data.workflowTypes[0].id).toBe('bmad-regular-story');
  });

  it('returns 500 when readFile throws', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('file not found'));

    const res = await request(app).get('/api/inspector/types');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when getWorkflowTypes throws', async () => {
    mockReadFile.mockResolvedValueOnce(fakeSharedTypes);
    mockGetWorkflowTypes.mockRejectedValueOnce(new Error('config dir missing'));

    const res = await request(app).get('/api/inspector/types');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});

// ── GET /api/inspector/summary ──────────────────────────────────────────────

describe('GET /api/inspector/summary', () => {
  it('returns 200 with session and workflow counts', async () => {
    mockReadRegistry.mockResolvedValueOnce(fakeRegistry);
    mockReadWorkflows.mockResolvedValueOnce(fakeWorkflows);

    const res = await request(app).get('/api/inspector/summary');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    const { sessions, workflows } = res.body.data;

    // Session counts
    expect(sessions.total).toBe(3);
    expect(sessions.byType).toEqual({
      BUILD: 1,
      TEST: 1,
      unclassified: 1,
    });
    expect(sessions.byProject).toEqual({
      angeleye: 2,
      flivideo: 1,
    });

    // Workflow counts
    expect(workflows.total).toBe(2);
    expect(workflows.byStatus).toEqual({
      in_progress: 1,
      closed: 1,
    });
  });

  it('returns zeroes for empty data', async () => {
    mockReadRegistry.mockResolvedValueOnce({});
    mockReadWorkflows.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/inspector/summary');

    expect(res.status).toBe(200);
    expect(res.body.data.sessions.total).toBe(0);
    expect(res.body.data.sessions.byType).toEqual({});
    expect(res.body.data.sessions.byProject).toEqual({});
    expect(res.body.data.workflows.total).toBe(0);
    expect(res.body.data.workflows.byStatus).toEqual({});
  });

  it('returns 500 when readRegistry throws', async () => {
    mockReadRegistry.mockRejectedValueOnce(new Error('disk failure'));

    const res = await request(app).get('/api/inspector/summary');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('returns 500 when readWorkflows throws', async () => {
    mockReadRegistry.mockResolvedValueOnce(fakeRegistry);
    mockReadWorkflows.mockRejectedValueOnce(new Error('file corrupted'));

    const res = await request(app).get('/api/inspector/summary');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
