import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { runSync } from '../services/sync.service.js';
import { logger } from '../config/logger.js';

const router = Router();

router.post('/', async (_req, res) => {
  try {
    const result = await runSync();
    logger.info(result, 'Sync complete');
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'Sync failed');
    return apiFailure(res, 'Sync failed', 500);
  }
});

export default router;
