import { readFile, writeFile, rename, appendFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AngelEyeEvent } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { _sessionsDir, _archiveDir, getDataDir } from './registry.service.js';

/**
 * Cross-session event index.
 *
 * Every other event API in AngelEye is scoped to one session
 * (`/api/sessions/:id/events`). Questions like "show me this week's tool
 * failures" had no answer short of opening all ~13k session files (289MB).
 *
 * This keeps a compact TSV sidecar — one line per event, filterable fields
 * only — so a query streams ~35MB of text instead of 289MB of JSON. Matched
 * events are then *hydrated* from their session files, but only for the page
 * being returned, so full payloads never have to fit in memory at once.
 *
 * TSV (not JSON) on purpose: filtering is a `split('\t')` and a few string
 * compares, with no JSON.parse in the hot loop.
 */

/** Column order of the index. Changing this requires an INDEX_VERSION bump. */
const COLUMNS = ['session_id', 'ts', 'event', 'tool', 'id'] as const;

/** Bumped when the on-disk format changes; a mismatch forces a rebuild. */
const INDEX_VERSION = 1;

export interface IndexMeta {
  version: number;
  built_at: string;
  files_indexed: number;
  events_indexed: number;
}

export interface EventLocator {
  session_id: string;
  ts: string;
  event: string;
  tool?: string;
  id: string;
}

export interface EventQuery {
  /** Event types to include. Empty/undefined = all types. */
  events?: string[];
  /** ISO prefix, inclusive lower bound compared lexically against `ts`. */
  since?: string;
  /** ISO prefix, inclusive upper bound. A date-only value covers the whole day. */
  until?: string;
  /** Restrict to one session. */
  sessionId?: string;
  /** Tool name filter (exact, case-insensitive). */
  tool?: string;
  /** Restrict to these session ids — used by the route to apply project filters. */
  sessionIds?: Set<string>;
  /** Max locators to return. */
  limit?: number;
  /** Locators to skip before collecting (paging). */
  offset?: number;
  /** Newest-first when true (default). */
  desc?: boolean;
}

export interface EventQueryResult {
  locators: EventLocator[];
  /** Total matches before limit/offset. */
  total: number;
  /** Index lines examined. */
  scanned: number;
}

export function _indexPath(): string {
  return join(getDataDir(), 'event-index.tsv');
}

export function _indexMetaPath(): string {
  return join(getDataDir(), 'event-index.meta.json');
}

/** Tabs/newlines would corrupt the row; no legitimate field contains them. */
function sanitize(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[\t\n\r]/g, ' ');
}

/**
 * The tool name lives in different places depending on how the event arrived:
 * transcript-backfilled events use `tool`, hook events nest it under
 * `payload.tool_name`. Callers shouldn't have to know which.
 */
export function extractTool(event: Partial<AngelEyeEvent>): string {
  if (event.tool) return String(event.tool);
  const payload = event.payload as Record<string, unknown> | undefined;
  const fromPayload = payload?.tool_name;
  return fromPayload ? String(fromPayload) : '';
}

function toRow(event: Partial<AngelEyeEvent>): string | null {
  if (!event.session_id || !event.ts || !event.event) return null;
  return (
    [
      sanitize(event.session_id),
      sanitize(event.ts),
      sanitize(event.event),
      sanitize(extractTool(event)),
      sanitize(event.id),
    ].join('\t') + '\n'
  );
}

function parseRow(line: string): EventLocator | null {
  const parts = line.split('\t');
  if (parts.length < COLUMNS.length) return null;
  const [session_id, ts, event, tool, id] = parts;
  if (!session_id || !ts || !event) return null;
  return { session_id, ts, event, tool: tool || undefined, id: id ?? '' };
}

async function readJsonlEvents(filePath: string): Promise<Partial<AngelEyeEvent>[]> {
  const raw = await readFile(filePath, 'utf-8');
  const out: Partial<AngelEyeEvent>[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    try {
      out.push(JSON.parse(line) as Partial<AngelEyeEvent>);
    } catch {
      // Skip torn/partial lines rather than failing the whole file.
    }
  }
  return out;
}

/**
 * Rebuild the index from every session file on disk.
 *
 * Writes to a temp path then renames, so a crash mid-build leaves the previous
 * index intact rather than a truncated one.
 */
export async function buildIndex(): Promise<IndexMeta> {
  const dirs = [_sessionsDir(), _archiveDir()];
  const tmpPath = `${_indexPath()}.tmp`;

  let filesIndexed = 0;
  let eventsIndexed = 0;
  let buffer: string[] = [];

  await writeFile(tmpPath, '', 'utf-8');

  const flush = async (): Promise<void> => {
    if (buffer.length === 0) return;
    await appendFile(tmpPath, buffer.join(''), 'utf-8');
    buffer = [];
  };

  // Live sessions first so an in-progress session's rows land before its
  // archived copy, if both somehow exist.
  const seen = new Set<string>();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch (err) {
      logger.error({ err, dir }, 'event-index: failed to read directory');
      continue;
    }

    for (const entry of entries) {
      if (!entry.endsWith('.jsonl')) continue;
      if (seen.has(entry)) continue;
      seen.add(entry);

      try {
        const events = await readJsonlEvents(join(dir, entry));
        for (const event of events) {
          const row = toRow(event);
          if (row) {
            buffer.push(row);
            eventsIndexed++;
          }
        }
        filesIndexed++;
        if (buffer.length >= 5000) await flush();
      } catch (err) {
        // One unreadable session must not abort the whole build.
        logger.warn({ err, entry }, 'event-index: skipped unreadable session file');
      }
    }
  }

  await flush();
  await rename(tmpPath, _indexPath());

  const meta: IndexMeta = {
    version: INDEX_VERSION,
    built_at: new Date().toISOString(),
    files_indexed: filesIndexed,
    events_indexed: eventsIndexed,
  };
  await writeFile(_indexMetaPath(), JSON.stringify(meta, null, 2), 'utf-8');
  logger.info(meta, 'event-index: rebuilt');
  return meta;
}

export async function readIndexMeta(): Promise<IndexMeta | null> {
  try {
    return JSON.parse(await readFile(_indexMetaPath(), 'utf-8')) as IndexMeta;
  } catch {
    return null;
  }
}

/** True when the index is absent or written by an older format version. */
export async function isIndexStale(): Promise<boolean> {
  if (!existsSync(_indexPath())) return true;
  const meta = await readIndexMeta();
  return !meta || meta.version !== INDEX_VERSION;
}

/** Build the index if it's missing or outdated. Returns meta either way. */
export async function ensureIndex(): Promise<IndexMeta> {
  if (await isIndexStale()) {
    logger.info('event-index: stale or missing — building');
    return buildIndex();
  }
  return (await readIndexMeta()) as IndexMeta;
}

/**
 * Append one event to the index as it's written.
 *
 * Best-effort by design: an index write must never break ingestion, so this
 * swallows its own errors. A dropped row is recoverable via reindex; a thrown
 * error here would lose the event itself.
 */
export async function appendToIndex(event: Partial<AngelEyeEvent>): Promise<void> {
  const row = toRow(event);
  if (!row) return;
  try {
    if (!existsSync(_indexPath())) return; // No index yet — a build will pick it up.
    await appendFile(_indexPath(), row, 'utf-8');
  } catch (err) {
    logger.warn({ err, session_id: event.session_id }, 'event-index: append failed');
  }
}

/**
 * Stream the index and collect matching locators.
 *
 * `until` is treated as inclusive over its whole precision, so `until=2026-08-01`
 * covers that entire day rather than stopping at midnight.
 */
export async function queryIndex(query: EventQuery): Promise<EventQueryResult> {
  const {
    events,
    since,
    until,
    sessionId,
    tool,
    sessionIds,
    limit = 100,
    offset = 0,
    desc = true,
  } = query;

  let raw: string;
  try {
    raw = await readFile(_indexPath(), 'utf-8');
  } catch {
    return { locators: [], total: 0, scanned: 0 };
  }

  const eventSet = events && events.length > 0 ? new Set(events) : null;
  const toolLower = tool ? tool.toLowerCase() : null;
  const untilBound = until ? `${until}￿` : null;

  const matches: EventLocator[] = [];
  let scanned = 0;

  for (const line of raw.split('\n')) {
    if (line === '') continue;
    scanned++;

    // Cheap string filters before allocating a locator object.
    const parts = line.split('\t');
    if (parts.length < COLUMNS.length) continue;
    const [sid, ts, evt, toolName] = parts;

    if (sessionId && sid !== sessionId) continue;
    if (sessionIds && !sessionIds.has(sid)) continue;
    if (eventSet && !eventSet.has(evt)) continue;
    if (since && ts < since) continue;
    if (untilBound && ts > untilBound) continue;
    if (toolLower && (toolName ?? '').toLowerCase() !== toolLower) continue;

    const locator = parseRow(line);
    if (locator) matches.push(locator);
  }

  matches.sort((a, b) => (desc ? b.ts.localeCompare(a.ts) : a.ts.localeCompare(b.ts)));

  return {
    locators: matches.slice(offset, offset + limit),
    total: matches.length,
    scanned,
  };
}

/**
 * Load full events for a page of locators.
 *
 * Groups by session so each file is read once, then matches on event id —
 * falling back to (ts, event) for rows indexed before ids were always present.
 */
export async function hydrate(locators: EventLocator[]): Promise<AngelEyeEvent[]> {
  const bySession = new Map<string, EventLocator[]>();
  for (const loc of locators) {
    const list = bySession.get(loc.session_id);
    if (list) list.push(loc);
    else bySession.set(loc.session_id, [loc]);
  }

  const resolved = new Map<string, AngelEyeEvent>();

  for (const [sessionId, locs] of bySession) {
    const filename = `session-${sessionId}.jsonl`;
    const candidates = [join(_sessionsDir(), filename), join(_archiveDir(), filename)];

    let events: Partial<AngelEyeEvent>[] | null = null;
    for (const filePath of candidates) {
      if (!existsSync(filePath)) continue;
      try {
        events = await readJsonlEvents(filePath);
        break;
      } catch (err) {
        logger.warn({ err, sessionId }, 'event-index: hydrate failed to read session');
      }
    }
    if (!events) continue;

    const byId = new Map<string, Partial<AngelEyeEvent>>();
    const byTsEvent = new Map<string, Partial<AngelEyeEvent>>();
    for (const event of events) {
      if (event.id) byId.set(event.id, event);
      byTsEvent.set(`${event.ts}|${event.event}`, event);
    }

    for (const loc of locs) {
      const found = (loc.id && byId.get(loc.id)) || byTsEvent.get(`${loc.ts}|${loc.event}`);
      if (found)
        resolved.set(`${loc.session_id}|${loc.ts}|${loc.event}|${loc.id}`, found as AngelEyeEvent);
    }
  }

  // Preserve the locator ordering the query established.
  const out: AngelEyeEvent[] = [];
  for (const loc of locators) {
    const found = resolved.get(`${loc.session_id}|${loc.ts}|${loc.event}|${loc.id}`);
    if (found) out.push(found);
  }
  return out;
}

/** Per-type counts across the whole index — the cheap "what happened" summary. */
export async function eventTypeCounts(
  query: Omit<EventQuery, 'limit' | 'offset' | 'desc'> = {}
): Promise<Record<string, number>> {
  const { locators } = await queryIndex({ ...query, limit: Number.MAX_SAFE_INTEGER, offset: 0 });
  const counts: Record<string, number> = {};
  for (const loc of locators) counts[loc.event] = (counts[loc.event] ?? 0) + 1;
  return counts;
}

/** Exposed for tests asserting on index size without reading the file. */
export async function _indexLineCount(): Promise<number> {
  try {
    const s = await stat(_indexPath());
    if (s.size === 0) return 0;
    const raw = await readFile(_indexPath(), 'utf-8');
    return raw.split('\n').filter((l) => l !== '').length;
  } catch {
    return 0;
  }
}
