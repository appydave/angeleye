import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { readRegistry, updateRegistry } from '../services/registry.service.js';
import {
  getSessionEvents,
  writeSessionName,
  getRawTranscript,
} from '../services/sessions.service.js';
import { readEnrichmentHistory, appendEnrichmentPass } from '../services/enrichment.service.js';
import { readWorkspaces } from '../services/workspace.service.js';
import type { EnrichmentPass, RegistryEntry } from '@appystack/shared';

const router = Router();

router.get('/api/sessions', async (req, res, next) => {
  try {
    const registry = await readRegistry();
    const allSessions = Object.values(registry).sort(
      (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );

    // If no limit param, return all sessions (backward compatible)
    const limitParam = req.query.limit;
    if (limitParam === undefined) {
      apiSuccess(res, { sessions: allSessions });
      return;
    }

    const limit = Math.min(Math.max(1, parseInt(String(limitParam), 10) || 50), 200);
    const after = req.query.after ? String(req.query.after) : undefined;

    let startIndex = 0;
    if (after) {
      const cursorIndex = allSessions.findIndex((s) => s.session_id === after);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const page = allSessions.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allSessions.length;
    const cursor = page.length > 0 ? page[page.length - 1].session_id : null;

    apiSuccess(res, { sessions: page, cursor, hasMore, total: allSessions.length });
  } catch (err) {
    logger.error({ err }, 'Failed to read sessions registry');
    next(err);
  }
});

router.get('/api/sessions/:id/events', async (req, res, next) => {
  try {
    const events = await getSessionEvents(req.params.id);
    apiSuccess(res, { events, count: events.length });
  } catch (err) {
    logger.error({ err, sessionId: req.params.id }, 'Failed to read session events');
    next(err);
  }
});

const SAFE_SESSION_ID = /^[a-zA-Z0-9_-]+$/;

router.get('/api/sessions/:id/enrichments', async (req, res, next) => {
  try {
    if (!SAFE_SESSION_ID.test(req.params.id)) return apiFailure(res, 'Invalid session id', 400);
    const registry = await readRegistry();
    if (!registry[req.params.id]) return apiFailure(res, 'Session not found', 404);
    const history = await readEnrichmentHistory(req.params.id);
    apiSuccess(res, { history, count: history.length });
  } catch (err) {
    logger.error({ err, sessionId: req.params.id }, 'Failed to read enrichment history');
    next(err);
  }
});

router.post('/api/sessions/:id/enrichments', async (req, res, next) => {
  try {
    if (!SAFE_SESSION_ID.test(req.params.id)) return apiFailure(res, 'Invalid session id', 400);
    const registry = await readRegistry();
    if (!registry[req.params.id]) return apiFailure(res, 'Session not found', 404);

    const { version, enriched_at, model, changes, notes } = req.body as Partial<EnrichmentPass>;

    if (!Number.isInteger(version) || (version as number) < 1)
      return apiFailure(res, 'version must be a positive integer', 400);
    const trimmedAt = enriched_at?.trim();
    if (!trimmedAt || isNaN(Date.parse(trimmedAt)))
      return apiFailure(res, 'enriched_at must be a valid ISO timestamp', 400);
    if (!model || !changes) return apiFailure(res, 'model and changes are required', 400);

    const pass: EnrichmentPass = {
      version: version as number,
      enriched_at: trimmedAt,
      model,
      changes,
      notes,
    };
    await appendEnrichmentPass(req.params.id, pass);

    // Apply enrichment changes back to registry so UI and API filters see them
    const registryUpdate: Partial<RegistryEntry> = {
      enrichment_version: version as number,
      enriched_at: trimmedAt,
    };
    if (changes.session_subtype) registryUpdate.session_subtype = changes.session_subtype;
    if (changes.session_tags) registryUpdate.session_tags = changes.session_tags;
    await updateRegistry(req.params.id, registryUpdate);

    apiSuccess(res, { written: true });
  } catch (err) {
    logger.error({ err, sessionId: req.params.id }, 'Failed to append enrichment pass');
    next(err);
  }
});

router.get('/api/sessions/:id/raw', async (req, res, next) => {
  try {
    if (!SAFE_SESSION_ID.test(req.params.id)) return apiFailure(res, 'Invalid session id', 400);
    const registry = await readRegistry();
    const entry = registry[req.params.id];
    if (!entry) return apiFailure(res, 'Session not found', 404);
    if (!entry.project_dir) return apiFailure(res, 'No project_dir on registry entry', 404);

    const limitParam = req.query.limit;
    const limit = limitParam
      ? Math.min(Math.max(1, parseInt(String(limitParam), 10) || 200), 2000)
      : 200;

    const result = await getRawTranscript(req.params.id, entry.project_dir);
    if (!result)
      return apiFailure(res, 'Raw JSONL not found — file may have been purged by Claude Code', 404);

    apiSuccess(res, {
      lines: result.lines.slice(0, limit),
      count: Math.min(result.total, limit),
      total: result.total,
      source: result.source,
    });
  } catch (err) {
    logger.error({ err, sessionId: req.params.id }, 'Failed to read raw transcript');
    next(err);
  }
});

// POST /api/registry/llm-tags — bulk write LLM-stamped session_tags
//
// Routes writes through updateRegistry's serialised queue, preventing the
// race condition where concurrent hook events overwrite enrichment writes.
// Used by the enrich-subtypes skill instead of writing registry.json directly.
//
// See: docs/architecture/known-issues.md#registry-write-race
router.post('/api/registry/llm-tags', async (req, res, next) => {
  try {
    const { changes } = req.body as {
      changes?: Array<{ id: string; tags: Array<{ tag: string; confidence: number }> }>;
    };
    if (!Array.isArray(changes)) {
      return apiFailure(res, 'changes array required', 400);
    }
    const registry = await readRegistry();
    let written = 0;
    const missing: string[] = [];
    for (const { id, tags } of changes) {
      if (!registry[id]) {
        missing.push(id);
        continue;
      }
      const stamped = tags.map((t) => ({ ...t, source: 'llm' as const }));
      const sorted = [...stamped].sort((a, b) => b.confidence - a.confidence);
      const top = sorted[0];
      if (!top) continue;
      await updateRegistry(id, {
        session_tags: sorted,
        session_subtype: top.tag,
      });
      written++;
    }
    apiSuccess(res, { written, missing, total: changes.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/registry/session-kind — bulk write session_kind on existing rows.
//
// Used by backfill scripts that retroactively classify sessions as 'subagent'
// or 'subprocess' (Mechanism B and C detection). Routes through the same
// serialised queue as hooks to avoid the registry write race.
//
// See: docs/architecture/known-issues.md#subprocess-session-mechanism-3
router.post('/api/registry/session-kind', async (req, res, next) => {
  try {
    const { changes } = req.body as {
      changes?: Array<{
        id: string;
        kind: 'main' | 'subagent' | 'subprocess';
        teammate_id?: string | null;
      }>;
    };
    if (!Array.isArray(changes)) {
      return apiFailure(res, 'changes array required', 400);
    }
    const registry = await readRegistry();
    let written = 0;
    const missing: string[] = [];
    for (const { id, kind, teammate_id } of changes) {
      if (!registry[id]) {
        missing.push(id);
        continue;
      }
      const update: Partial<RegistryEntry> = { session_kind: kind };
      if (teammate_id !== undefined) update.teammate_id = teammate_id;
      await updateRegistry(id, update);
      written++;
    }
    apiSuccess(res, { written, missing, total: changes.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/registry/backfill-silent — flag historic silent sessions as junk
//
// Pages through the registry, finds any session with no `user_prompt` events,
// and marks it { is_junk: true, session_subtype: 'meta.silent_session' }.
// Idempotent — only flags entries where is_junk is currently false/undefined.
//
// Body: { dry_run?: boolean } — if true, returns what would change without writing.
router.post('/api/registry/backfill-silent', async (req, res, next) => {
  try {
    const { dry_run = false } = req.body as { dry_run?: boolean };
    const registry = await readRegistry();
    const candidates: string[] = [];
    let scanned = 0;
    for (const [id, entry] of Object.entries(registry)) {
      scanned++;
      if (entry.is_junk === true) continue; // already flagged
      const events = await getSessionEvents(id);
      const hasPrompt = events.some((e) => e.event === 'user_prompt');
      if (!hasPrompt) candidates.push(id);
    }
    if (dry_run) {
      return apiSuccess(res, { scanned, would_flag: candidates.length, dry_run: true });
    }
    let flagged = 0;
    for (const id of candidates) {
      await updateRegistry(id, {
        is_junk: true,
        session_subtype: 'meta.silent_session',
      });
      flagged++;
    }
    apiSuccess(res, { scanned, flagged, dry_run: false });
  } catch (err) {
    logger.error({ err }, 'Backfill silent failed');
    next(err);
  }
});

// PATCH /api/sessions/:id — update name, tags, workspace_id
router.patch('/api/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const registryBefore = await readRegistry();
    if (!registryBefore[id]) {
      return apiFailure(res, 'Session not found', 404);
    }
    const { name, tags, workspace_id, note } = req.body as {
      name?: string | null;
      tags?: string[];
      workspace_id?: string | null;
      note?: string | null;
    };
    const updates: Partial<RegistryEntry> = {};
    if (name !== undefined) {
      updates.name = name;
      // write-back to Claude Code JSONL so claude --resume "name" works
      if (name !== null) {
        const entry = registryBefore[id];
        if (entry?.project_dir) {
          writeSessionName(id, name, entry.project_dir).catch((err) =>
            logger.warn({ err }, 'writeSessionName failed (non-fatal)')
          );
        }
      }
    }
    if (tags !== undefined) updates.tags = tags;
    if (workspace_id !== undefined) updates.workspace_id = workspace_id;
    if (note !== undefined) updates.note = note;
    if (updates.workspace_id !== null && updates.workspace_id !== undefined) {
      const workspaces = await readWorkspaces();
      const exists = workspaces.some((w) => w.id === updates.workspace_id);
      if (!exists) {
        return apiFailure(res, 'Workspace not found', 404);
      }
    }
    await updateRegistry(id, updates);
    const registry = await readRegistry();
    const entry = registry[id];
    if (!entry) {
      return apiFailure(res, 'Session not found', 404);
    }
    apiSuccess(res, entry);
  } catch (err) {
    next(err);
  }
});

export default router;
