import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { getWorkflowTypes, getWorkflowType } from '../services/workflow-type.service.js';
import { readWorkflows, getWorkflow, createWorkflow } from '../services/workflow.service.js';
import { seedWorkflowsFromRegistry } from '../services/workflow-router.service.js';

const router = Router();

// ── GET /api/workflow-types ──────────────────────────────────────────────────

router.get('/api/workflow-types', async (_req, res, next) => {
  try {
    const types = await getWorkflowTypes();
    apiSuccess(res, { types });
  } catch (err) {
    logger.error({ err }, 'Failed to read workflow types');
    next(err);
  }
});

// ── GET /api/workflows ───────────────────────────────────────────────────────

router.get('/api/workflows', async (_req, res, next) => {
  try {
    const workflows = await readWorkflows();
    apiSuccess(res, { workflows });
  } catch (err) {
    logger.error({ err }, 'Failed to read workflows');
    next(err);
  }
});

// ── GET /api/workflows/:id ───────────────────────────────────────────────────

router.get('/api/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await getWorkflow(req.params.id);
    if (!workflow) {
      return apiFailure(res, 'Workflow not found', 404);
    }
    apiSuccess(res, workflow);
  } catch (err) {
    logger.error({ err }, 'Failed to get workflow');
    next(err);
  }
});

// ── POST /api/workflows ─────────────────────────────────────────────────────

router.post('/api/workflows', async (req, res, next) => {
  try {
    const { workflow_type_id, work_item_id, work_item_label, project_dir } = req.body as {
      workflow_type_id?: string;
      work_item_id?: string;
      work_item_label?: string;
      project_dir?: string;
    };

    if (
      !workflow_type_id ||
      typeof workflow_type_id !== 'string' ||
      !work_item_id ||
      typeof work_item_id !== 'string' ||
      !work_item_label ||
      typeof work_item_label !== 'string'
    ) {
      return apiFailure(
        res,
        'workflow_type_id, work_item_id, and work_item_label are required strings',
        400
      );
    }

    const type = await getWorkflowType(workflow_type_id);
    if (!type) {
      return apiFailure(res, 'Unknown workflow type', 400);
    }

    const stations = type.stations.map((s) => ({
      position: s.position,
      action_code: s.action_code,
    }));

    const instance = await createWorkflow({
      workflow_type_id,
      work_item_id,
      work_item_label,
      ...(project_dir ? { project_dir } : {}),
      stations,
    });

    apiSuccess(res, instance, 201);
  } catch (err) {
    logger.error({ err }, 'Failed to create workflow');
    next(err);
  }
});

// ── POST /api/workflows/seed ────────────────────────────────────────────────

router.post('/api/workflows/seed', async (req, res, next) => {
  try {
    const dryRun = req.query.dry_run === 'true';
    const result = await seedWorkflowsFromRegistry({ dryRun });
    apiSuccess(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'Seed already in progress') {
      apiFailure(res, message, 409);
      return;
    }
    logger.error({ err }, 'Failed to seed workflows from registry');
    next(err);
  }
});

export default router;
