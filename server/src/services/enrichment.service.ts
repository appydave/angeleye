import { readFile, writeFile, rename, appendFile } from 'node:fs/promises';
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
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EnrichmentPass[]) : [];
  } catch (err) {
    logger.warn({ err, sessionId }, 'Could not read enrichment sidecar, returning empty history');
    return [];
  }
}

// Serialise writes per session — prevents concurrent POSTs from overwriting each other (DVR-002)
const writeQueue = new Map<string, Promise<void>>();

export async function appendEnrichmentPass(sessionId: string, pass: EnrichmentPass): Promise<void> {
  const prev = writeQueue.get(sessionId) ?? Promise.resolve();
  const next = prev.then(() => _doAppend(sessionId, pass));
  writeQueue.set(sessionId, next);
  try {
    await next;
  } finally {
    if (writeQueue.get(sessionId) === next) writeQueue.delete(sessionId);
  }
}

async function _doAppend(sessionId: string, pass: EnrichmentPass): Promise<void> {
  const path = sidecarPath(sessionId);
  const history = await readEnrichmentHistory(sessionId);

  // Skip duplicate version — prevents double-writes from stamping the same pass twice
  if (history.some((p) => p.version === pass.version)) {
    logger.warn(
      { sessionId, version: pass.version },
      'Enrichment pass for this version already exists, skipping'
    );
    return;
  }

  history.push(pass);

  // Atomic write: tmp file in same dir then rename — crash mid-write leaves old file intact (DVR-004)
  const tmpPath = `${path}.tmp`;
  await writeFile(tmpPath, JSON.stringify(history, null, 2), 'utf-8');
  await rename(tmpPath, path);

  const logEntry: EnrichmentLogEntry = { session_id: sessionId, ...pass };
  await appendFile(_enrichmentsLogPath(), JSON.stringify(logEntry) + '\n', 'utf-8');
}
