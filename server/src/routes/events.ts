import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readRegistry } from '../services/registry.service.js';
import {
  buildIndex,
  ensureIndex,
  queryIndex,
  hydrate,
  eventTypeCounts,
  readIndexMeta,
} from '../services/event-index.service.js';

const router = Router();

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

function csv(value: unknown): string[] | undefined {
  if (!value) return undefined;
  const parts = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/**
 * Resolve a project filter to the set of session ids it covers.
 *
 * The index deliberately holds no project column — project lives on the
 * registry entry and can be corrected after the fact (backfill-project-canonical),
 * so denormalising it into the index would let the two drift.
 */
async function sessionIdsForProject(project: string, mode: string): Promise<Set<string>> {
  const registry = await readRegistry();
  let matcher: (value: string) => boolean;

  if (mode === 'glob') {
    const escaped = project.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    matcher = (v) => re.test(v);
  } else if (mode === 'regex') {
    try {
      const re = new RegExp(project, 'i');
      matcher = (v) => re.test(v);
    } catch {
      matcher = (v) => v === project; // Bad regex — exact match beats a 500.
    }
  } else {
    matcher = (v) => v === project;
  }

  const ids = new Set<string>();
  for (const [sessionId, entry] of Object.entries(registry)) {
    if (matcher(entry.project ?? '')) ids.add(sessionId);
  }
  return ids;
}

// GET /api/events — cross-session event query.
//
//   ?event=tool_failure,permission_request   CSV of event types
//   ?since=2026-08-01&until=2026-08-01       ISO prefixes, both inclusive
//   ?project=captains-log[&project_match=glob|regex]
//   ?session_id=<id>  ?tool=Bash
//   ?limit=100&offset=0  ?order=asc|desc  ?hydrate=false
router.get('/api/events', async (req, res, next) => {
  try {
    await ensureIndex();

    const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? DEFAULT_LIMIT : limitParam), MAX_LIMIT);
    const offsetParam = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
    const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam);

    let sessionIds: Set<string> | undefined;
    if (req.query.project) {
      sessionIds = await sessionIdsForProject(
        String(req.query.project),
        req.query.project_match ? String(req.query.project_match) : 'exact'
      );
      // An unmatched project is an empty result, not "no filter".
      if (sessionIds.size === 0) {
        return apiSuccess(res, {
          events: [],
          locators: [],
          total: 0,
          scanned: 0,
          limit,
          offset,
          hydrated: false,
        });
      }
    }

    const result = await queryIndex({
      events: csv(req.query.event),
      since: req.query.since ? String(req.query.since) : undefined,
      until: req.query.until ? String(req.query.until) : undefined,
      sessionId: req.query.session_id ? String(req.query.session_id) : undefined,
      tool: req.query.tool ? String(req.query.tool) : undefined,
      sessionIds,
      limit,
      offset,
      desc: String(req.query.order ?? 'desc') !== 'asc',
    });

    const wantHydrate = String(req.query.hydrate ?? 'true') !== 'false';
    const events = wantHydrate ? await hydrate(result.locators) : [];

    // Attach project so a caller can group results without a second lookup.
    const projectBySession: Record<string, string> = {};
    if (result.locators.length > 0) {
      const registry = await readRegistry();
      for (const loc of result.locators) {
        const entry = registry[loc.session_id];
        if (entry) projectBySession[loc.session_id] = entry.project ?? '';
      }
    }

    return apiSuccess(res, {
      events,
      locators: result.locators,
      total: result.total,
      scanned: result.scanned,
      limit,
      offset,
      hydrated: wantHydrate,
      projects: projectBySession,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/summary — counts by event type for the same filter set.
router.get('/api/events/summary', async (req, res, next) => {
  try {
    await ensureIndex();

    let sessionIds: Set<string> | undefined;
    if (req.query.project) {
      sessionIds = await sessionIdsForProject(
        String(req.query.project),
        req.query.project_match ? String(req.query.project_match) : 'exact'
      );
      if (sessionIds.size === 0) return apiSuccess(res, { counts: {}, total: 0 });
    }

    const counts = await eventTypeCounts({
      events: csv(req.query.event),
      since: req.query.since ? String(req.query.since) : undefined,
      until: req.query.until ? String(req.query.until) : undefined,
      sessionId: req.query.session_id ? String(req.query.session_id) : undefined,
      tool: req.query.tool ? String(req.query.tool) : undefined,
      sessionIds,
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return apiSuccess(res, { counts, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/index — index health (built_at, counts, staleness).
router.get('/api/events/index', async (_req, res, next) => {
  try {
    const meta = await readIndexMeta();
    return apiSuccess(res, { meta });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/reindex — full rebuild.
router.post('/api/events/reindex', async (_req, res) => {
  try {
    const meta = await buildIndex();
    logger.info(meta, 'event-index: reindex via API');
    return apiSuccess(res, { meta });
  } catch (err) {
    logger.error({ err }, 'event-index: reindex failed');
    return apiFailure(res, 'Reindex failed', 500);
  }
});

export default router;
