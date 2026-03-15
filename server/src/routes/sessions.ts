import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readRegistry, getSessionEvents, updateRegistry } from '../services/angeleye-data.js';
import type { RegistryEntry } from '@appystack/shared';

const router = Router();

router.get('/api/sessions', async (_req, res, next) => {
  try {
    const registry = await readRegistry();
    const sessions = Object.values(registry).sort(
      (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );
    apiSuccess(res, { sessions });
  } catch (err) {
    logger.error({ err }, 'Failed to read sessions registry');
    next(err);
  }
});

router.get('/api/sessions/:id/events', async (req, res, next) => {
  try {
    const events = await getSessionEvents(req.params.id);
    apiSuccess(res, { events, count: events.length });
  } catch (err) {
    logger.error({ err, sessionId: req.params.id }, 'Failed to read session events');
    next(err);
  }
});

// PATCH /api/sessions/:id — update name, tags, workspace_id
router.patch('/api/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const registryBefore = await readRegistry();
    if (!registryBefore[id]) {
      return apiFailure(res, 'Session not found', 404);
    }
    const { name, tags, workspace_id } = req.body as {
      name?: string | null;
      tags?: string[];
      workspace_id?: string | null;
    };
    const updates: Partial<RegistryEntry> = {};
    if (name !== undefined) updates.name = name;
    if (tags !== undefined) updates.tags = tags;
    if (workspace_id !== undefined) updates.workspace_id = workspace_id;
    await updateRegistry(id, updates);
    const registry = await readRegistry();
    const entry = registry[id];
    if (!entry) {
      return apiFailure(res, 'Session not found', 404);
    }
    apiSuccess(res, entry);
  } catch (err) {
    next(err);
  }
});

export default router;
