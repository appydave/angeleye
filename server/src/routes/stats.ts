import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readRegistry } from '../services/registry.service.js';
import type { SessionType } from '@appystack/shared';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const registry = await readRegistry();
    const byType: Record<SessionType | 'unclassified', number> = {
      BUILD: 0,
      TEST: 0,
      RESEARCH: 0,
      KNOWLEDGE: 0,
      OPS: 0,
      ORIENTATION: 0,
      unclassified: 0,
    };
    let total = 0;

    for (const entry of Object.values(registry)) {
      total++;
      if (entry.session_type) {
        byType[entry.session_type] = (byType[entry.session_type] ?? 0) + 1;
      } else {
        byType['unclassified']++;
      }
    }

    return apiSuccess(res, { byType, total });
  } catch (err) {
    logger.error({ err }, 'Stats failed');
    return apiFailure(res, 'Stats failed', 500);
  }
});

export default router;
