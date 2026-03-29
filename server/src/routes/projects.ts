import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { getProjectConfigs, getProjectConfig } from '../services/project-config.service.js';

const router = Router();

// ── GET /api/projects ──────────────────────────────────────────────────────

router.get('/api/projects', async (_req, res, next) => {
  try {
    const projects = await getProjectConfigs();
    apiSuccess(res, { projects });
  } catch (err) {
    logger.error({ err }, 'Failed to read project configs');
    next(err);
  }
});

// ── GET /api/projects/:id ──────────────────────────────────────────────────

router.get('/api/projects/:id', async (req, res, next) => {
  try {
    const project = await getProjectConfig(req.params.id);
    if (!project) {
      return apiFailure(res, 'Project not found', 404);
    }
    apiSuccess(res, project);
  } catch (err) {
    logger.error({ err }, 'Failed to get project config');
    next(err);
  }
});

export default router;
