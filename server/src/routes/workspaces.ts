import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import {
  readWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../services/workspace.service.js';

const router = Router();

router.get('/api/workspaces', async (_req, res, next) => {
  try {
    const workspaces = await readWorkspaces();
    apiSuccess(res, { workspaces });
  } catch (err) {
    logger.error({ err }, 'Failed to read workspaces');
    next(err);
  }
});

router.post('/api/workspaces', async (req, res, next) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || name.trim() === '') {
      return apiFailure(res, 'name is required', 400);
    }
    const workspace = await createWorkspace(name.trim());
    apiSuccess(res, workspace, 201);
  } catch (err) {
    logger.error({ err }, 'Failed to create workspace');
    next(err);
  }
});

router.patch('/api/workspaces/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tags } = req.body as { name?: string; tags?: string[] };
    const updates: Partial<{ name: string; tags: string[] }> = {};
    if (name !== undefined) updates.name = name;
    if (tags !== undefined) updates.tags = tags;
    const workspace = await updateWorkspace(id, updates);
    apiSuccess(res, workspace);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.startsWith('Workspace not found')) {
      return apiFailure(res, message, 404);
    }
    logger.error({ err }, 'Failed to update workspace');
    next(err);
  }
});

router.delete('/api/workspaces/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteWorkspace(id);
    res.status(204).end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.startsWith('Workspace not found')) {
      return apiFailure(res, message, 404);
    }
    logger.error({ err }, 'Failed to delete workspace');
    next(err);
  }
});

export default router;
