import { Router } from 'express';
import { checkStatus, pullUpstream } from '../services/git-sync.service.js';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const status = await checkStatus();
    return apiSuccess(res, status);
  } catch (err) {
    logger.error({ err }, 'git-sync status check failed');
    return apiFailure(res, 'Git sync status check failed', 500);
  }
});

router.post('/pull', async (_req, res) => {
  try {
    const result = await pullUpstream();
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'git-sync pull failed');
    return apiFailure(res, 'Git pull failed', 500);
  }
});

export { router as gitSyncRouter };
