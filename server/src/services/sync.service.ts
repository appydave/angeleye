import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { backfillTranscripts } from './backfill.service.js';
import { readRegistry, updateRegistry, getDataDir } from './registry.service.js';
import { getSessionEvents } from './sessions.service.js';
import { classifySession } from './classifier.service.js';
import { logger } from '../config/logger.js';

export interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
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

export async function runSync(): Promise<SyncResult> {
  // Step 1: backfill — imports sessions not yet in registry
  const backfillResult = await backfillTranscripts();

  // Step 2: classify only sessions that have no session_type yet
  let classified = 0;
  let alreadyUpToDate = 0;
  let errors = 0;

  const registry = await readRegistry();

  for (const [sessionId, entry] of Object.entries(registry)) {
    try {
      if (entry.session_type) {
        alreadyUpToDate++;
        continue;
      }

      const events = await getSessionEvents(sessionId);
      const classificationResult = classifySession(events, sessionId, entry.project_dir ?? '');
      await updateRegistry(sessionId, { ...classificationResult });
      classified++;
    } catch (err) {
      logger.error({ err, sessionId }, 'sync: failed to classify session');
      errors++;
    }
  }

  const result: SyncResult = {
    imported: backfillResult.imported,
    classified,
    alreadyUpToDate,
    errors: backfillResult.errors + errors,
  };

  // Persist delta record (non-fatal if it fails)
  await writeLastSync({
    timestamp: new Date().toISOString(),
    imported: result.imported,
    classified: result.classified,
  }).catch((err) => logger.warn({ err }, 'Failed to write last-sync.json'));

  return result;
}
