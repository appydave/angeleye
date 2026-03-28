import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { runSync, readLastSync } from '../services/sync.service.js';
import { logger } from '../config/logger.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await runSync({ force });
    logger.info(result, 'Sync complete');
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'Sync failed');
    return apiFailure(res, 'Sync failed', 500);
  }
});

router.get('/status', async (_req, res) => {
  try {
    const lastSync = await readLastSync();
    return apiSuccess(res, { lastSync }); // null if never run
  } catch (err) {
    logger.error({ err }, 'Failed to read sync status');
    return apiFailure(res, 'Failed to read sync status', 500);
  }
});

export default router;
