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
import { appendToIndex } from './event-index.service.js';
import { encodeProjectPath } from './claude-paths.js';

export async function writeEvent(event: AngelEyeEvent): Promise<void> {
  const filePath = join(_sessionsDir(), `session-${event.session_id}.jsonl`);
  try {
    await appendFile(filePath, JSON.stringify(event) + '\n', 'utf-8');
  } catch (err) {
    logger.error({ err, session_id: event.session_id }, 'Failed to write event');
    throw err;
  }
  // Keep the cross-session index current. Deliberately after the event is
  // durable and non-throwing: a missed index row is fixable with a reindex,
  // a thrown error here would lose the event.
  await appendToIndex(event);
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
  const encoded = encodeProjectPath(expandedDir);

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
//
// Counts below are from a census of the 455 live JSONLs on 2026-08-21. The nine
// entries below `system` were all missing, so every one of them was being logged
// as "unknown" on every scan — 20,600 entries of permanent noise that buried any
// genuinely new type. `progress`, which this list never had, is now extinct:
// 0 occurrences across the whole corpus.
const KNOWN_UPSTREAM_TYPES = new Set([
  'user', // 23,424
  'assistant', // 41,817
  'summary', // 0 in the live corpus — kept; older archives still carry it
  'custom-title', // 2,783 — user-chosen name (/rename)
  'agent-name', // 2,754
  'permission-mode', // 6,481
  'attachment', // 24,468
  'file-history-snapshot', // 2,209
  'last-prompt', // 7,154
  'system', // 4,755
  'ai-title', // 4,115 — machine-chosen name; see extractSessionTitle()
  'mode', // 6,468
  'bridge-session', // 6,219
  'queue-operation', // 2,012
  'file-history-delta', // 1,376
  'atis-latch', // 318
  'pr-link', // 55
  'frame-link', // 32
  'artifact-comment-monitor', // 5
]);

export async function getRawTranscript(
  sessionId: string,
  projectDir: string
): Promise<RawTranscript | null> {
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;
  const encoded = encodeProjectPath(expandedDir);
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
  if (!projectDir) {
    logger.warn({ sessionId }, 'backupUpstreamJSONL skipped: empty projectDir');
    return;
  }
  const expandedDir = projectDir.startsWith('~') ? homedir() + projectDir.slice(1) : projectDir;
  const encoded = encodeProjectPath(expandedDir);
  const upstreamPath = join(homedir(), '.claude', 'projects', encoded, `${sessionId}.jsonl`);

  if (!existsSync(upstreamPath)) {
    // Most common failure mode — Claude Code purged the JSONL before session_end
    // fired, OR the cwd encoding doesn't match Claude Code's actual path scheme.
    // Log both inputs so we can diagnose which case from the logs.
    logger.warn(
      { sessionId, projectDir, upstreamPath },
      'backupUpstreamJSONL skipped: upstream JSONL not found'
    );
    return;
  }

  const destPath = join(_rawTranscriptsDir(), `${sessionId}.jsonl`);
  // Overwrite if already backed up — Claude Code may have appended content since
  // the previous backup (e.g. backup fired at `stop`, more activity, now at
  // `session_end`). The latest copy is always the most complete.

  try {
    const raw = await readFile(upstreamPath, 'utf-8');
    await writeFile(destPath, raw, 'utf-8');
    logger.info(
      { sessionId, destPath, bytes: raw.length },
      'backupUpstreamJSONL ok: upstream JSONL backed up'
    );

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
  } catch (err) {
    logger.error(
      { err, sessionId, upstreamPath, destPath },
      'backupUpstreamJSONL failed: I/O error'
    );
    throw err;
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
