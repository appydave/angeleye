import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readRegistry, updateRegistry } from '../services/registry.service.js';
import { getSessionEvents, writeSessionName } from '../services/sessions.service.js';
import { readWorkspaces } from '../services/workspace.service.js';
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
    const { name, tags, workspace_id, note } = req.body as {
      name?: string | null;
      tags?: string[];
      workspace_id?: string | null;
      note?: string | null;
    };
    const updates: Partial<RegistryEntry> = {};
    if (name !== undefined) {
      updates.name = name;
      // write-back to Claude Code JSONL so claude --resume "name" works
      if (name !== null) {
        const entry = registryBefore[id];
        if (entry?.project_dir) {
          writeSessionName(id, name, entry.project_dir).catch((err) =>
            logger.warn({ err }, 'writeSessionName failed (non-fatal)')
          );
        }
      }
    }
    if (tags !== undefined) updates.tags = tags;
    if (workspace_id !== undefined) updates.workspace_id = workspace_id;
    if (note !== undefined) updates.note = note;
    if (updates.workspace_id !== null && updates.workspace_id !== undefined) {
      const workspaces = await readWorkspaces();
      const exists = workspaces.some((w) => w.id === updates.workspace_id);
      if (!exists) {
        return apiFailure(res, 'Workspace not found', 404);
      }
    }
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
