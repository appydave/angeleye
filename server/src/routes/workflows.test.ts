import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { WorkflowType, WorkflowInstance } from '@appystack/shared';

// Mock the services before importing the route
vi.mock('../services/workflow-type.service.js', () => ({
  getWorkflowTypes: vi.fn(),
  getWorkflowType: vi.fn(),
}));
vi.mock('../services/workflow.service.js', () => ({
  readWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
}));

import { getWorkflowTypes, getWorkflowType } from '../services/workflow-type.service.js';
import { readWorkflows, getWorkflow, createWorkflow } from '../services/workflow.service.js';
import workflowsRouter from './workflows.js';

const mockGetWorkflowTypes = vi.mocked(getWorkflowTypes);
const mockGetWorkflowType = vi.mocked(getWorkflowType);
const mockReadWorkflows = vi.mocked(readWorkflows);
const mockGetWorkflow = vi.mocked(getWorkflow);
const mockCreateWorkflow = vi.mocked(createWorkflow);

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use(workflowsRouter);
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

const fakeType: WorkflowType = {
  id: 'bmad-regular-story',
  name: 'BMAD Regular Story',
  domain: 'bmad',
  stations: [
    {
      position: 1,
      action_code: 'plan',
      role: 'product-owner',
      identity: null,
      requires_fresh_session: false,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 2,
      action_code: 'build',
      role: 'developer',
      identity: null,
      requires_fresh_session: true,
      can_spawn_subagents: true,
      backtrack_target: true,
    },
  ],
  ceremony_level: 'full',
  skip_rules: [],
};

const fakeInstance: WorkflowInstance = {
  instance_id: 'wf-001',
  workflow_type_id: 'bmad-regular-story',
  work_item_id: 'story-123',
  work_item_label: 'Add login page',
  status: 'not_started',
  current_station: 1,
  created_at: '2026-03-29T10:00:00.000Z',
  updated_at: '2026-03-29T10:00:00.000Z',
  stations: [
    {
      position: 1,
      action_code: 'plan',
      state: 'not_started',
      session_ids: [],
      started_at: null,
      completed_at: null,
      duration_ms: null,
      context_used_pct: null,
      subagent_count: 0,
      verdict: null,
    },
    {
      position: 2,
      action_code: 'build',
      state: 'not_started',
      session_ids: [],
      started_at: null,
      completed_at: null,
      duration_ms: null,
      context_used_pct: null,
      subagent_count: 0,
      verdict: null,
    },
  ],
  backtracks: [],
  metadata: {},
};

// ── GET /api/workflow-types ──────────────────────────────────────────────────

describe('GET /api/workflow-types', () => {
  it('returns 200 with workflow types', async () => {
    mockGetWorkflowTypes.mockResolvedValueOnce([fakeType, { ...fakeType, id: 'bmad-epic-zero' }]);

    const res = await request(app).get('/api/workflow-types');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.types).toHaveLength(2);
    expect(res.body.data.types[0].id).toBe('bmad-regular-story');
  });
});

// ── GET /api/workflows ───────────────────────────────────────────────────────

describe('GET /api/workflows', () => {
  it('returns 200 with workflows array', async () => {
    mockReadWorkflows.mockResolvedValueOnce([fakeInstance]);

    const res = await request(app).get('/api/workflows');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.workflows).toHaveLength(1);
    expect(res.body.data.workflows[0].instance_id).toBe('wf-001');
  });
});

// ── GET /api/workflows/:id ───────────────────────────────────────────────────

describe('GET /api/workflows/:id', () => {
  it('returns 200 with a single workflow instance', async () => {
    mockGetWorkflow.mockResolvedValueOnce(fakeInstance);

    const res = await request(app).get('/api/workflows/wf-001');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.instance_id).toBe('wf-001');
    expect(res.body.data.stations).toHaveLength(2);
  });

  it('returns 404 when workflow not found', async () => {
    mockGetWorkflow.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/workflows/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Workflow not found');
  });
});

// ── POST /api/workflows ─────────────────────────────────────────────────────

describe('POST /api/workflows', () => {
  it('returns 201 with created workflow instance', async () => {
    mockGetWorkflowType.mockResolvedValueOnce(fakeType);
    mockCreateWorkflow.mockResolvedValueOnce(fakeInstance);

    const res = await request(app).post('/api/workflows').send({
      workflow_type_id: 'bmad-regular-story',
      work_item_id: 'story-123',
      work_item_label: 'Add login page',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.instance_id).toBe('wf-001');
    expect(mockCreateWorkflow).toHaveBeenCalledWith({
      workflow_type_id: 'bmad-regular-story',
      work_item_id: 'story-123',
      work_item_label: 'Add login page',
      stations: [
        { position: 1, action_code: 'plan' },
        { position: 2, action_code: 'build' },
      ],
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/workflows').send({
      workflow_type_id: 'bmad-regular-story',
      // missing work_item_id and work_item_label
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toContain('required');
  });

  it('returns 400 when workflow type is unknown', async () => {
    mockGetWorkflowType.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/workflows').send({
      workflow_type_id: 'nonexistent-type',
      work_item_id: 'story-123',
      work_item_label: 'Add login page',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Unknown workflow type');
  });
});

// ── 500 Error Paths ─────────────────────────────────────────────────────────

describe('500 error paths', () => {
  it('GET /api/workflow-types returns 500 when service throws', async () => {
    mockGetWorkflowTypes.mockRejectedValueOnce(new Error('disk read failed'));

    const res = await request(app).get('/api/workflow-types');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/workflows returns 500 when service throws', async () => {
    mockReadWorkflows.mockRejectedValueOnce(new Error('disk read failed'));

    const res = await request(app).get('/api/workflows');

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });

  it('POST /api/workflows returns 500 when createWorkflow throws', async () => {
    mockGetWorkflowType.mockResolvedValueOnce(fakeType);
    mockCreateWorkflow.mockRejectedValueOnce(new Error('write failed'));

    const res = await request(app).post('/api/workflows').send({
      workflow_type_id: 'bmad-regular-story',
      work_item_id: 'story-123',
      work_item_label: 'Add login page',
    });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
