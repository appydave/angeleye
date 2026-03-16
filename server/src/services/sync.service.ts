import { backfillTranscripts } from './backfill.service.js';
import { readRegistry, updateRegistry } from './registry.service.js';
import { getSessionEvents } from './sessions.service.js';
import { classifySession } from './classifier.service.js';
import { logger } from '../config/logger.js';

export interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
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

  return {
    imported: backfillResult.imported,
    classified,
    alreadyUpToDate,
    errors: backfillResult.errors + errors,
  };
}
