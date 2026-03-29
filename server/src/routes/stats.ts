import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readRegistry } from '../services/registry.service.js';
import { countByType, countByFields } from '../services/sync.service.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const registry = await readRegistry();
    const { counts: byType, total } = countByType(registry);
    const fields = countByFields(registry);

    return apiSuccess(res, { byType, total, fields });
  } catch (err) {
    logger.error({ err }, 'Stats failed');
    return apiFailure(res, 'Stats failed', 500);
  }
});

export default router;
