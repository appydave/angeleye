import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { apiSuccess } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { getWorkflowTypes } from '../services/workflow-type.service.js';
import { readRegistry } from '../services/registry.service.js';
import { readWorkflows } from '../services/workflow.service.js';
import { countByType, countByFields } from '../services/sync.service.js';

const router = Router();

/** Path to the shared types source file — derived from monorepo layout (server/ → shared/) */
const SHARED_TYPES_PATH =
  process.env.SHARED_TYPES_PATH ??
  path.resolve(process.cwd(), '..', 'shared', 'src', 'angeleye.ts');

// ── GET /api/inspector/types ────────────────────────────────────────────────

router.get('/api/inspector/types', async (_req, res, next) => {
  try {
    const sharedTypes = await readFile(SHARED_TYPES_PATH, 'utf-8');
    const workflowTypes = await getWorkflowTypes();

    apiSuccess(res, {
      sharedTypes,
      workflowTypes,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to read inspector types');
    next(err);
  }
});

// ── GET /api/inspector/summary ──────────────────────────────────────────────

router.get('/api/inspector/summary', async (_req, res, next) => {
  try {
    const registry = await readRegistry();
    const entries = Object.values(registry);

    const { counts: byType, total } = countByType(registry);
    const fields = countByFields(registry);

    const byProject: Record<string, number> = {};
    entries.forEach((e) => {
      const p = e.project ?? 'unknown';
      byProject[p] = (byProject[p] ?? 0) + 1;
    });

    const workflows = await readWorkflows();
    const byStatus: Record<string, number> = {};
    workflows.forEach((w) => {
      byStatus[w.status] = (byStatus[w.status] ?? 0) + 1;
    });

    apiSuccess(res, {
      sessions: { total, byType, byProject, fields },
      workflows: { total: workflows.length, byStatus },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to read inspector summary');
    next(err);
  }
});

export default router;
