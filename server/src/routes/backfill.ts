import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { backfillTranscripts } from '../services/backfill.service.js';
import { readRegistry, updateRegistry } from '../services/registry.service.js';
import { classifySession } from '../services/classifier.service.js';
import { getSessionEvents } from '../services/sessions.service.js';
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

router.post('/classify', async (req, res) => {
  const force = req.query.force === 'true';
  let classified = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const registry = await readRegistry();

    for (const [sessionId, entry] of Object.entries(registry)) {
      try {
        if (!force && entry.session_type) {
          skipped++;
          continue;
        }

        const events = await getSessionEvents(sessionId);
        const classificationResult = classifySession(events, sessionId, entry.project_dir ?? '');
        await updateRegistry(sessionId, { ...classificationResult });
        classified++;
      } catch (err) {
        logger.error({ err, sessionId }, 'Failed to classify session');
        errors++;
      }
    }

    logger.info({ classified, skipped, errors }, 'Classification complete');
    return apiSuccess(res, { classified, skipped, errors });
  } catch (err) {
    logger.error({ err }, 'Classification failed');
    return apiFailure(res, 'Classification failed', 500);
  }
});

export default router;
