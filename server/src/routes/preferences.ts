import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readPreferences, setMockupRating } from '../services/preferences.service.js';

const router = Router();

router.get('/api/preferences', async (_req, res, next) => {
  try {
    const prefs = await readPreferences();
    apiSuccess(res, prefs);
  } catch (err) {
    logger.error({ err }, 'Failed to read preferences');
    next(err);
  }
});

router.patch('/api/preferences/mockup-rating', async (req, res, next) => {
  try {
    const { key, rating } = req.body as { key?: string; rating?: string | null };
    if (!key || typeof key !== 'string') {
      return apiFailure(res, 'key is required', 400);
    }
    if (rating !== null && rating !== 'liked' && rating !== 'chosen') {
      return apiFailure(res, 'rating must be "liked", "chosen", or null', 400);
    }
    const prefs = await setMockupRating(key, rating as 'liked' | 'chosen' | null);
    apiSuccess(res, prefs);
  } catch (err) {
    logger.error({ err }, 'Failed to update mockup rating');
    next(err);
  }
});

export default router;
