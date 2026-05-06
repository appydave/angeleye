import { readFile, writeFile, rename, appendFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import type { AngelEyeEvent } from '@appystack/shared';
import { logger } from '../config/logger.js';
import {
  _sessionsDir,
  _archiveDir,
  _rawTranscriptsDir,
  _schemaObservationsPath,
} from './registry.service.js';

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
  const filename = `session-${sessionId}.jsonl`;
  // Try live sessions first, then archive (so reclassification covers both)
  const candidates = [join(_sessionsDir(), filename), join(_archiveDir(), filename)];
  for (const filePath of candidates) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      return raw
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as AngelEyeEvent);
    } catch (err) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code !== 'ENOENT') {
        logger.error({ err, sessionId }, 'Failed to read session events');
        return [];
      }
      // ENOENT — try next candidate
    }
  }
  return [];
}

export async function writeSessionName(
  sessionId: string,
  name: string,
  projectDir: string
): Promise<void> {
  // Expand ~ to home directory
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;

  // Encode path: replace each / with -
  const encoded = expandedDir.replace(/\//g, '-');

  const jsonlPath = join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);

  // Check if file exists; if not, warn and return (don't throw)
  try {
    await access(jsonlPath);
  } catch {
    logger.warn({ jsonlPath }, 'writeSessionName: JSONL not found, skipping');
    return;
  }

  const line1 = JSON.stringify({ type: 'custom-title', customTitle: name, sessionId }) + '\n';
  const line2 = JSON.stringify({ type: 'agent-name', agentName: name, sessionId }) + '\n';

  await appendFile(jsonlPath, line1 + line2, 'utf-8');
}

export interface RawTranscript {
  lines: unknown[];
  total: number;
  source: 'upstream' | 'upstream-backup' | 'archive';
}

// Types seen in upstream Claude Code JSONLs. Any type not in this set is logged
// to schema-observations.jsonl for discovery.
const KNOWN_UPSTREAM_TYPES = new Set([
  'user',
  'assistant',
  'summary',
  'custom-title',
  'agent-name',
  'permission-mode',
  'attachment',
  'file-history-snapshot',
  'last-prompt',
  'system',
]);

export async function getRawTranscript(
  sessionId: string,
  projectDir: string
): Promise<RawTranscript | null> {
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;
  const encoded = expandedDir.replace(/\//g, '-');
  const upstreamPath = join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);

  // 1. Live upstream Claude Code JSONL (richest — has thinking blocks, attachments)
  if (existsSync(upstreamPath)) {
    const raw = await readFile(upstreamPath, 'utf-8');
    const lines = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as unknown);
    return { lines, total: lines.length, source: 'upstream' };
  }

  // 2. AngelEye's own backup of the upstream JSONL (backed up at session_end before purge)
  const backupPath = join(_rawTranscriptsDir(), `${sessionId}.jsonl`);
  if (existsSync(backupPath)) {
    const raw = await readFile(backupPath, 'utf-8');
    const lines = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as unknown);
    return { lines, total: lines.length, source: 'upstream-backup' };
  }

  // 3. AngelEye event archive (same as /events but unfiltered — no thinking blocks)
  for (const archivePath of [
    join(_archiveDir(), `session-${sessionId}.jsonl`),
    join(_sessionsDir(), `session-${sessionId}.jsonl`),
  ]) {
    if (existsSync(archivePath)) {
      const raw = await readFile(archivePath, 'utf-8');
      const lines = raw
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((l) => JSON.parse(l) as unknown);
      return { lines, total: lines.length, source: 'archive' };
    }
  }

  return null;
}

export async function backupUpstreamJSONL(sessionId: string, projectDir: string): Promise<void> {
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;
  const encoded = expandedDir.replace(/\//g, '-');
  const upstreamPath = join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);

  if (!existsSync(upstreamPath)) return;

  const destPath = join(_rawTranscriptsDir(), `${sessionId}.jsonl`);
  if (existsSync(destPath)) return;

  const raw = await readFile(upstreamPath, 'utf-8');
  await writeFile(destPath, raw, 'utf-8');

  // Scan for types not in our known set and log them for discovery
  const unknownTypes = new Set<string>();
  for (const line of raw.split('\n').filter((l) => l.trim())) {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      const type = typeof parsed.type === 'string' ? parsed.type : null;
      if (type && !KNOWN_UPSTREAM_TYPES.has(type)) unknownTypes.add(type);
    } catch {
      // skip malformed lines
    }
  }

  if (unknownTypes.size > 0) {
    const entry = {
      session_id: sessionId,
      observed_at: new Date().toISOString(),
      unknown_types: [...unknownTypes],
    };
    await appendFile(_schemaObservationsPath(), JSON.stringify(entry) + '\n', 'utf-8');
    logger.info(
      { sessionId, unknownTypes: [...unknownTypes] },
      'New JSONL types observed in upstream backup'
    );
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
