import { Router } from 'express';
import { existsSync } from 'node:fs';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readClaudeLiveSessions, sessionsDir } from '../services/claude-sessions.service.js';
import { readRegistry } from '../services/registry.service.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * GET /api/live-sessions
 *
 * Claude Code's own live session registry, joined against AngelEye's.
 *
 * Deliberately independent of the hook pipeline: this answers "what is running right now" even
 * when the collector is down, which is exactly the state AngelEye was in for the 18 days before
 * this endpoint existed. See docs/architecture/collection-layer-comparison.md §6.
 *
 * `dir_exists` is returned because an empty `sessions` array means BOTH "nothing is running" and
 * "Claude Code has never run here" — the caller cannot tell those apart from the array alone.
 */
router.get('/api/live-sessions', async (_req, res) => {
  try {
    const sessions = await readClaudeLiveSessions();
    const registry = await readRegistry();

    const rows = sessions.map((s) => {
      const known = registry[s.session_id];
      return {
        ...s,
        // Whether AngelEye has ingested this session at all. A live session that AngelEye does
        // not know about is the signature of a dead collector.
        in_angeleye: known !== undefined,
        angeleye_status: known?.status ?? null,
        angeleye_name: known?.name ?? null,
      };
    });

    const alive = rows.filter((r) => r.process_alive);
    return apiSuccess(res, {
      dir_exists: existsSync(sessionsDir()),
      counts: {
        files: rows.length,
        alive: alive.length,
        // Live right now but absent from AngelEye's registry — collector-health signal.
        alive_unknown_to_angeleye: alive.filter((r) => !r.in_angeleye).length,
      },
      sessions: rows,
    });
  } catch (err) {
    logger.error({ err }, 'GET /api/live-sessions failed');
    return apiFailure(res, 'Failed to read Claude Code live sessions', 500);
  }
});

export default router;
