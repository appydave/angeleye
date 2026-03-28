import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { backfillTranscripts } from './backfill.service.js';
import { readRegistry, updateRegistry, getDataDir } from './registry.service.js';
import { getSessionEvents } from './sessions.service.js';
import { classifySession } from './classifier.service.js';
import { logger } from '../config/logger.js';
import type { SessionType, Registry } from '@appystack/shared';

export type TypeCounts = Record<SessionType | 'unclassified', number>;

export interface NewByProject {
  project: string;
  count: number;
  type: SessionType | 'unclassified';
}

export interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
  before: TypeCounts;
  after: TypeCounts;
  totalBefore: number;
  totalAfter: number;
  newByProject: NewByProject[];
}

export interface LastSyncRecord {
  timestamp: string; // ISO 8601
  imported: number;
  classified: number;
}

function lastSyncPath(): string {
  return join(getDataDir(), 'last-sync.json');
}

export async function readLastSync(): Promise<LastSyncRecord | null> {
  try {
    const raw = await readFile(lastSyncPath(), 'utf-8');
    return JSON.parse(raw) as LastSyncRecord;
  } catch {
    return null; // file doesn't exist yet — first run
  }
}

export async function writeLastSync(record: LastSyncRecord): Promise<void> {
  await writeFile(lastSyncPath(), JSON.stringify(record, null, 2), 'utf-8');
}

/** Count sessions by type from a registry snapshot. */
export function countByType(registry: Registry): { counts: TypeCounts; total: number } {
  const counts: TypeCounts = {
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
      counts[entry.session_type] = (counts[entry.session_type] ?? 0) + 1;
    } else {
      counts['unclassified']++;
    }
  }
  return { counts, total };
}

export interface SyncOptions {
  /** When true, reclassify all sessions (not just unclassified ones) */
  force?: boolean;
}

export async function runSync(options: SyncOptions = {}): Promise<SyncResult> {
  const { force = false } = options;

  // Snapshot before-counts from registry before any changes
  const registryBefore = await readRegistry();
  const beforeSessionIds = new Set(Object.keys(registryBefore));
  const { counts: before, total: totalBefore } = countByType(registryBefore);

  // Step 1: backfill — imports sessions not yet in registry
  const backfillResult = await backfillTranscripts();

  // Step 2: classify sessions
  // Default: only sessions without session_type
  // force=true: reclassify all sessions (useful when new extractors are added)
  let classified = 0;
  let alreadyUpToDate = 0;
  let errors = 0;

  const registry = await readRegistry();

  // Track new sessions for by-project breakdown
  const newSessions: { project: string; type: SessionType | 'unclassified' }[] = [];

  for (const [sessionId, entry] of Object.entries(registry)) {
    try {
      if (entry.session_type && !force) {
        alreadyUpToDate++;
        // If this was a new session (not in before-snapshot), record it
        if (!beforeSessionIds.has(sessionId)) {
          newSessions.push({ project: entry.project, type: entry.session_type });
        }
        continue;
      }

      const events = await getSessionEvents(sessionId);
      const classificationResult = classifySession(events, sessionId, entry.project_dir ?? '');
      await updateRegistry(sessionId, { ...classificationResult });
      classified++;

      if (!beforeSessionIds.has(sessionId)) {
        newSessions.push({
          project: entry.project,
          type: classificationResult.session_type ?? 'unclassified',
        });
      }
    } catch (err) {
      logger.error({ err, sessionId }, 'sync: failed to classify session');
      errors++;
    }
  }

  // Compute after-counts
  const registryAfter = await readRegistry();
  const { counts: after, total: totalAfter } = countByType(registryAfter);

  // Group new sessions by project (dominant type per project)
  const projectMap = new Map<string, { count: number; types: Map<string, number> }>();
  for (const ns of newSessions) {
    const entry = projectMap.get(ns.project) ?? { count: 0, types: new Map() };
    entry.count++;
    entry.types.set(ns.type, (entry.types.get(ns.type) ?? 0) + 1);
    projectMap.set(ns.project, entry);
  }
  const newByProject: NewByProject[] = Array.from(projectMap.entries())
    .map(([project, data]) => {
      // Pick the most common type for this project
      let dominantType: SessionType | 'unclassified' = 'unclassified';
      let maxCount = 0;
      for (const [t, c] of data.types) {
        if (c > maxCount) {
          maxCount = c;
          dominantType = t as SessionType | 'unclassified';
        }
      }
      return { project, count: data.count, type: dominantType };
    })
    .sort((a, b) => b.count - a.count);

  const result: SyncResult = {
    imported: backfillResult.imported,
    classified,
    alreadyUpToDate,
    errors: backfillResult.errors + errors,
    before,
    after,
    totalBefore,
    totalAfter,
    newByProject,
  };

  // Persist delta record (non-fatal if it fails)
  await writeLastSync({
    timestamp: new Date().toISOString(),
    imported: result.imported,
    classified: result.classified,
  }).catch((err) => logger.warn({ err }, 'Failed to write last-sync.json'));

  return result;
}
