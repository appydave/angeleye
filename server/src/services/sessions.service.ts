import { readFile, rename, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AngelEyeEvent } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { _sessionsDir, _archiveDir } from './registry.service.js';

export async function writeEvent(event: AngelEyeEvent): Promise<void> {
  const filePath = join(_sessionsDir(), `session-${event.session_id}.jsonl`);
  try {
    await appendFile(filePath, JSON.stringify(event) + '\n', 'utf-8');
  } catch (err) {
    logger.error({ err, session_id: event.session_id }, 'Failed to write event');
    throw err;
  }
}

export async function getSessionEvents(sessionId: string): Promise<AngelEyeEvent[]> {
  const filePath = join(_sessionsDir(), `session-${sessionId}.jsonl`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    return raw
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as AngelEyeEvent);
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return [];
    }
    logger.error({ err, sessionId }, 'Failed to read session events');
    return [];
  }
}

export async function archiveSession(sessionId: string): Promise<void> {
  const src = join(_sessionsDir(), `session-${sessionId}.jsonl`);
  const dest = join(_archiveDir(), `session-${sessionId}.jsonl`);
  try {
    await rename(src, dest);
    logger.info({ sessionId, dest }, 'Session archived');
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to archive session');
    throw err;
  }
}
