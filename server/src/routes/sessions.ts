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
import { computeSessionClass, canonicalProjectFromCwd } from '../services/session-class.service.js';
import type { EnrichmentPass, RegistryEntry, SessionClass } from '@appystack/shared';

const router = Router();

// Apply optional, additive filters to a list of sessions.
// Filters are pure functions of req.query — absent params are no-ops, so existing
// callers that pass no filter params see identical behaviour. include_junk defaults
// to true (preserves the pre-filter behaviour where junk was always included).
function applySessionFilters(
  sessions: RegistryEntry[],
  query: Record<string, unknown>
): RegistryEntry[] {
  const since = query.since ? String(query.since) : undefined;
  const until = query.until ? String(query.until) : undefined;
  const project = query.project ? String(query.project) : undefined;
  const projectMatchMode = query.project_match ? String(query.project_match) : 'exact';
  const projectDir = query.project_dir ? String(query.project_dir) : undefined;
  const kind = query.kind ? String(query.kind) : undefined;
  const includeJunk = query.include_junk !== 'false'; // default true — preserves existing behaviour
  const subtype = query.subtype ? String(query.subtype) : undefined;
  const subtypePrefix = query.subtype_prefix ? String(query.subtype_prefix) : undefined;
  const enrichedParam = query.enriched;
  const enriched = enrichedParam === 'true' ? true : enrichedParam === 'false' ? false : undefined;

  // session_class: orthogonal to session_kind / is_junk. Default filter is the
  // user-driven set ('dialog', 'agent_run'). Override via ?session_class=<one>
  // (specific class) or ?include_classes=<csv> (default + extras). Sessions
  // without session_class set are treated as 'dialog' for backwards compat —
  // existing rows pass the default filter until backfill populates them.
  const sessionClassParam = query.session_class ? String(query.session_class) : undefined;
  const includeClassesParam = query.include_classes ? String(query.include_classes) : undefined;
  let allowedClasses: Set<SessionClass>;
  if (sessionClassParam) {
    allowedClasses = new Set([sessionClassParam as SessionClass]);
  } else if (includeClassesParam) {
    allowedClasses = new Set<SessionClass>(['dialog', 'agent_run']);
    for (const c of includeClassesParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      allowedClasses.add(c as SessionClass);
    }
  } else {
    allowedClasses = new Set<SessionClass>(['dialog', 'agent_run']);
  }

  // Build a project matcher closure (only when project filter is active).
  let projectMatcher: ((v: string) => boolean) | undefined;
  if (project) {
    if (projectMatchMode === 'glob') {
      const escaped = project.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      const pattern = '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
      const re = new RegExp(pattern, 'i');
      projectMatcher = (v) => re.test(v);
    } else if (projectMatchMode === 'regex') {
      try {
        const re = new RegExp(project, 'i');
        projectMatcher = (v) => re.test(v);
      } catch {
        // Bad regex — fall back to exact match rather than 500
        projectMatcher = (v) => v === project;
      }
    } else {
      projectMatcher = (v) => v === project;
    }
  }

  return sessions.filter((s) => {
    if (since && (s.started_at || '') < since) return false;
    if (until && (s.started_at || '') > until) return false;
    if (projectMatcher && !projectMatcher(s.project || '')) return false;
    if (projectDir && !(s.project_dir || '').includes(projectDir)) return false;
    if (kind && kind !== 'all' && s.session_kind !== kind) return false;
    if (!includeJunk && s.is_junk === true) return false;
    if (subtype && s.session_subtype !== subtype) return false;
    if (subtypePrefix && !(s.session_subtype || '').startsWith(subtypePrefix)) return false;
    if (enriched !== undefined) {
      const isEnriched = (s.enrichment_version ?? 0) > 0;
      if (enriched !== isEnriched) return false;
    }
    // session_class filter — undefined treated as 'dialog' for backwards compat
    const cls: SessionClass = s.session_class ?? 'dialog';
    if (!allowedClasses.has(cls)) return false;
    return true;
  });
}

router.get('/api/sessions', async (req, res, next) => {
  try {
    const registry = await readRegistry();
    let allSessions = Object.values(registry).sort(
      (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );

    // Apply optional filters (since/until/project/project_match/project_dir/kind/
    // include_junk/subtype/subtype_prefix/enriched). All absent → no-op.
    allSessions = applySessionFilters(allSessions, req.query as Record<string, unknown>);

    // If no limit param, return all (filtered) sessions (backward compatible).
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

// GET /api/search?q=<regex>&fields=<csv>&limit=N + all filters from /api/sessions
//
// Full-text search over session fields. Default fields are cheap (registry-only,
// no extra file reads). Including `notes` in the fields list reads enrichment
// files per filtered session (slower; prefer narrowing with filters first).
//
// `prompts_all` is reserved for future per-session events scanning — not yet wired.
router.get('/api/search', async (req, res, next) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    if (!q) return apiFailure(res, 'q parameter required', 400);

    let regex: RegExp;
    try {
      regex = new RegExp(q, 'gi');
    } catch {
      return apiFailure(res, 'Invalid regex in q parameter', 400);
    }

    const defaultFields = 'notes,first_prompt,name,subtype,trigger_command';
    const fieldsParam = req.query.fields ? String(req.query.fields) : defaultFields;
    const fields = new Set(
      fieldsParam
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
    );

    const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 20 : limitParam), 100);

    const registry = await readRegistry();
    let sessions = Object.values(registry).sort(
      (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );
    sessions = applySessionFilters(sessions, req.query as Record<string, unknown>);

    type Hit = {
      session: RegistryEntry;
      score: number;
      matched_fields: string[];
      enrichment_note?: string;
    };
    const hits = new Map<string, Hit>();

    function bump(s: RegistryEntry, field: string, count: number) {
      const existing = hits.get(s.session_id);
      if (existing) {
        existing.score += count;
        if (!existing.matched_fields.includes(field)) existing.matched_fields.push(field);
      } else {
        hits.set(s.session_id, { session: s, score: count, matched_fields: [field] });
      }
    }

    // Cheap fields — single-pass over the filtered set, no I/O.
    for (const s of sessions) {
      if (fields.has('name') && s.name) {
        const c = (s.name.match(regex) || []).length;
        if (c > 0) bump(s, 'name', c);
      }
      if (fields.has('first_prompt') && s.first_real_prompt) {
        const c = (s.first_real_prompt.match(regex) || []).length;
        if (c > 0) bump(s, 'first_prompt', c);
      }
      if (fields.has('subtype') && s.session_subtype) {
        const c = (s.session_subtype.match(regex) || []).length;
        if (c > 0) bump(s, 'subtype', c);
      }
      if (fields.has('subtype_heuristic') && s.subtype_heuristic) {
        const c = (s.subtype_heuristic.match(regex) || []).length;
        if (c > 0) bump(s, 'subtype_heuristic', c);
      }
      if (fields.has('trigger_command') && s.trigger_command) {
        const c = (s.trigger_command.match(regex) || []).length;
        if (c > 0) bump(s, 'trigger_command', c);
      }
    }

    // Notes — opt-in; reads enrichment file per filtered session.
    // Iterates over the FULL filtered set so notes-only matches surface
    // (not just sessions that already scored on cheap fields).
    if (fields.has('notes')) {
      for (const s of sessions) {
        try {
          const history = await readEnrichmentHistory(s.session_id);
          const note = history[0]?.notes;
          if (note) {
            const c = (note.match(regex) || []).length;
            if (c > 0) {
              bump(s, 'notes', c);
              const h = hits.get(s.session_id);
              if (h) h.enrichment_note = note;
            }
          }
        } catch {
          // missing/unreadable enrichment file — skip silently
        }
      }
    }

    const sorted = Array.from(hits.values()).sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.session.last_active).getTime() - new Date(a.session.last_active).getTime()
    );
    const top = sorted.slice(0, limit);

    apiSuccess(res, {
      results: top.map((h) => ({
        session_id: h.session.session_id,
        score: h.score,
        matched_fields: h.matched_fields,
        session: h.session,
        enrichment_note: h.enrichment_note,
        first_prompt_excerpt: h.session.first_real_prompt?.slice(0, 250),
      })),
      total: sorted.length,
      scanned: sessions.length,
      fields: Array.from(fields),
    });
  } catch (err) {
    logger.error({ err }, 'Search failed');
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

// POST /api/registry/backfill-class — populate session_class on historic rows
//
// Iterates the registry, reads events per session, recomputes session_class
// via the canonical detection rules in session-class.service.ts, and writes
// back where the value differs from what's stored. Idempotent — re-running
// with no changes in the registry is a no-op.
//
// Body: { dry_run?: boolean } — preview without writing.
//
// Implementation note: this is O(N) over the registry with per-session event
// reads. For ~2,500 sessions expect ~30-60 seconds wall-clock. Acceptable for
// a one-shot backfill; not a hot path.
router.post('/api/registry/backfill-class', async (req, res, next) => {
  try {
    const { dry_run = false } = req.body as { dry_run?: boolean };
    const registry = await readRegistry();
    const summary = {
      total: 0,
      dialog: 0,
      agent_run: 0,
      machine_signal: 0,
      subagent_leg: 0,
      changed: 0,
    };
    const updates: Array<{ id: string; cls: SessionClass }> = [];
    for (const [id, entry] of Object.entries(registry)) {
      summary.total++;
      const events = await getSessionEvents(id);
      const cls = computeSessionClass({
        events,
        cwd: entry.project_dir,
        session_kind: entry.session_kind,
        trigger_command: entry.trigger_command,
      });
      summary[cls]++;
      if (entry.session_class !== cls) updates.push({ id, cls });
    }
    if (dry_run) {
      return apiSuccess(res, { ...summary, would_change: updates.length, dry_run: true });
    }
    for (const { id, cls } of updates) {
      await updateRegistry(id, { session_class: cls });
      summary.changed++;
    }
    apiSuccess(res, { ...summary, dry_run: false });
  } catch (err) {
    logger.error({ err }, 'Backfill class failed');
    next(err);
  }
});

// POST /api/registry/backfill-project-canonical — collapse harness pseudo-projects
//
// Sessions started before the Phase 1.1 fix (commit 07314f3) still have their
// project field set to the derived last-path-segment (e.g. `d-<hex>` for ALS
// delamain workers, workspace UUIDs for Paperclip). This endpoint walks the
// registry and applies canonicalProjectFromCwd to each entry — if the cwd
// matches a known harness pattern (Paperclip workspace or ALS delamain
// worktree), the project is renamed to the canonical form ('paperclip' or
// 'als-delamain').
//
// Idempotent — entries already at canonical names are no-ops.
//
// Body: { dry_run?: boolean } — preview without writing.
router.post('/api/registry/backfill-project-canonical', async (req, res, next) => {
  try {
    const { dry_run = false } = req.body as { dry_run?: boolean };
    const registry = await readRegistry();
    const updates: Array<{ id: string; from: string; to: string }> = [];
    for (const [id, entry] of Object.entries(registry)) {
      const canonical = canonicalProjectFromCwd(entry.project_dir);
      if (canonical && entry.project !== canonical) {
        updates.push({ id, from: entry.project, to: canonical });
      }
    }
    if (dry_run) {
      return apiSuccess(res, {
        scanned: Object.keys(registry).length,
        would_change: updates.length,
        sample: updates.slice(0, 5),
        dry_run: true,
      });
    }
    for (const u of updates) {
      await updateRegistry(u.id, { project: u.to });
    }
    apiSuccess(res, {
      scanned: Object.keys(registry).length,
      changed: updates.length,
      dry_run: false,
    });
  } catch (err) {
    logger.error({ err }, 'Backfill project canonical failed');
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
