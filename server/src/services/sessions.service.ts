import { readFile, rename, appendFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
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
  source: 'upstream' | 'archive';
}

export async function getRawTranscript(
  sessionId: string,
  projectDir: string
): Promise<RawTranscript | null> {
  // Try upstream Claude Code JSONL first
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;
  const encoded = expandedDir.replace(/\//g, '-');
  const upstreamPath = join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);

  if (existsSync(upstreamPath)) {
    const raw = await readFile(upstreamPath, 'utf-8');
    const lines = raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as unknown);
    return { lines, total: lines.length, source: 'upstream' };
  }

  // Fall back to AngelEye's own archive — present for any session AngelEye tracked,
  // even after Claude Code purges the upstream file
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
