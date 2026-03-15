import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { backfillTranscripts } from '../services/angeleye-data.js';
import { logger } from '../config/logger.js';

const router = Router();

// SECURITY: do NOT accept a user-supplied dir from req.body — backfillTranscripts() scans
// the filesystem. The dir must always be the server-side default (~/.claude/projects).
// If this route ever needs to accept a custom path, validate it is within homedir() first.
router.post('/', async (_req, res) => {
  try {
    const result = await backfillTranscripts();
    logger.info(result, 'Backfill complete');
    return apiSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'Backfill failed');
    return apiFailure(res, 'Backfill failed', 500);
  }
});

export default router;
