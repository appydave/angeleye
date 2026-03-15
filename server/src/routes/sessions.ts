import { Router } from 'express';
import { apiSuccess } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readRegistry, getSessionEvents } from '../services/angeleye-data.js';

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

export default router;
