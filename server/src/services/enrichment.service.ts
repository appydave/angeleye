import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { EnrichmentPass, EnrichmentLogEntry } from '@appystack/shared';
import { _enrichmentsDir, _enrichmentsLogPath } from './registry.service.js';
import { logger } from '../config/logger.js';

function sidecarPath(sessionId: string): string {
  return join(_enrichmentsDir(), `${sessionId}.json`);
}

export async function readEnrichmentHistory(sessionId: string): Promise<EnrichmentPass[]> {
  const path = sidecarPath(sessionId);
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as EnrichmentPass[];
  } catch (err) {
    logger.warn({ err, sessionId }, 'Could not read enrichment sidecar, returning empty history');
    return [];
  }
}

export async function appendEnrichmentPass(sessionId: string, pass: EnrichmentPass): Promise<void> {
  const path = sidecarPath(sessionId);
  const history = await readEnrichmentHistory(sessionId);
  history.push(pass);
  await writeFile(path, JSON.stringify(history, null, 2), 'utf-8');

  const logEntry: EnrichmentLogEntry = { session_id: sessionId, ...pass };
  await appendFile(_enrichmentsLogPath(), JSON.stringify(logEntry) + '\n', 'utf-8');
}
