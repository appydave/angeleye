/**
 * Reader for `~/.claude/sessions/*.json` — Claude Code's own live session registry.
 *
 * Claude Code maintains one JSON file per running session, keyed by PID. It carries information
 * AngelEye currently reconstructs the hard way or does not have at all:
 *
 *   status / statusUpdatedAt  → liveness, without waiting for a session_end hook that may never fire
 *   name / nameSource         → the session name, without LLM enrichment
 *   formerNames / nameSince   → rename history
 *   kind / entrypoint         → main vs headless, without the three hand-rolled detection mechanisms
 *   bridgeSessionId           → the join key for `bridge-session` JSONL entries
 *   version                   → the Claude Code build that ran the session
 *
 * This needs no hook and no transport. It works while the collection pipeline is down.
 *
 * ── Measured behaviour on this machine, 2026-08-19 (two samples ~90 min apart) ──────────────
 *
 *  - 16 files, 16 live PIDs, both times. Far more than 16 sessions ran in the same window
 *    (265 JSONLs modified in 14 days), so Claude Code REMOVES the file when a session exits.
 *    That is inferred from the population, not from watching an exit — see the caveat below.
 *
 *  - File mtime is NOT a heartbeat. The oldest live file was 8.3 days stale while its process
 *    was still running. `statusUpdatedAt` tracks status CHANGES, not activity. So neither mtime
 *    nor `status` can be used to decide whether a session is alive — only the PID can, which is
 *    why every row is `kill -0` checked here rather than trusted.
 *
 *  - Every observed row was `kind: "interactive"`. Whether subagent or headless sessions get a
 *    file at all is UNKNOWN — none were running during either sample. Do not infer from a missing
 *    file that a session is not a subagent.
 *
 * See docs/architecture/collection-layer-comparison.md §6.
 */

import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../config/logger.js';

// Module-level dir — overridable via _setSessionsDir (test-only), matching registry.service.ts.
let _sessionsDirPath: string = join(homedir(), '.claude', 'sessions');

/** Test-only override. */
export function _setSessionsDir(dir: string): void {
  _sessionsDirPath = dir;
}

/** One row of Claude Code's live session registry, plus AngelEye's own liveness verdict. */
export interface ClaudeLiveSession {
  session_id: string;
  pid: number;
  /** True when the PID still exists. The only trustworthy liveness signal — see module docs. */
  process_alive: boolean;
  cwd: string | null;
  name: string | null;
  /** e.g. 'derived'. Absent when the user has not (re)named the session. */
  name_source: string | null;
  former_names: string[];
  /** Claude Code's own status string: 'idle' | 'busy' | 'shell' observed so far. */
  status: string | null;
  /** Every observed value was 'interactive'. See the UNKNOWN caveat in the module docs. */
  kind: string | null;
  entrypoint: string | null;
  /** Claude Code build that started this session, e.g. '2.1.235'. */
  version: string | null;
  /** Join key for `bridge-session` JSONL entries (remote / claude.ai-bridged sessions). */
  bridge_session_id: string | null;
  started_at: string | null;
  /** When the status last CHANGED — not a heartbeat. */
  status_updated_at: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function epochToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

/**
 * `kill(pid, 0)` — sends no signal, just checks the process exists and is visible to us.
 * Throws ESRCH when there is no such process, EPERM when it exists but is owned by someone else
 * (which still means alive).
 */
function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function parseSession(raw: unknown): ClaudeLiveSession | null {
  if (raw === null || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const sessionId = str(d.sessionId);
  const pid = typeof d.pid === 'number' ? d.pid : null;
  // Both are required — without them the row cannot be joined or liveness-checked.
  if (sessionId === null || pid === null) return null;

  return {
    session_id: sessionId,
    pid,
    process_alive: isProcessAlive(pid),
    cwd: str(d.cwd),
    name: str(d.name),
    name_source: str(d.nameSource),
    former_names: Array.isArray(d.formerNames)
      ? d.formerNames.filter((n): n is string => typeof n === 'string')
      : [],
    status: str(d.status),
    kind: str(d.kind),
    entrypoint: str(d.entrypoint),
    version: str(d.version),
    bridge_session_id: str(d.bridgeSessionId),
    started_at: epochToIso(d.startedAt),
    status_updated_at: epochToIso(d.statusUpdatedAt),
  };
}

/**
 * Read every session file Claude Code currently has on disk.
 *
 * Returns `[]` both when the directory is absent and when it is genuinely empty — those two cases
 * are NOT distinguishable from the return value, so callers that need to tell "Claude Code has
 * never run here" from "nothing is running right now" must stat the path returned by `sessionsDir()`.
 *
 * Unreadable or malformed individual files are skipped and logged rather than failing the batch:
 * these are written by a live process and a partial read is expected occasionally.
 */
export async function readClaudeLiveSessions(): Promise<ClaudeLiveSession[]> {
  let names: string[];
  try {
    names = (await readdir(_sessionsDirPath)).filter((n) => n.endsWith('.json'));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      logger.warn(
        { err, dir: _sessionsDirPath },
        'readClaudeLiveSessions: could not list sessions dir'
      );
    }
    return [];
  }

  const sessions: ClaudeLiveSession[] = [];
  for (const name of names) {
    const path = join(_sessionsDirPath, name);
    try {
      const parsed = parseSession(JSON.parse(await readFile(path, 'utf-8')));
      if (parsed !== null) sessions.push(parsed);
    } catch (err) {
      logger.debug({ err, path }, 'readClaudeLiveSessions: skipping unreadable session file');
    }
  }

  // Live first, then most recently active.
  sessions.sort((a, b) => {
    if (a.process_alive !== b.process_alive) return a.process_alive ? -1 : 1;
    return (b.status_updated_at ?? '').localeCompare(a.status_updated_at ?? '');
  });
  return sessions;
}

/** Index by `session_id` for joining against AngelEye's registry. */
export async function readClaudeLiveSessionsById(): Promise<Record<string, ClaudeLiveSession>> {
  const sessions = await readClaudeLiveSessions();
  return Object.fromEntries(sessions.map((s) => [s.session_id, s]));
}

/** Exposed so callers can tell "no Claude Code history here" from "nothing running". */
export function sessionsDir(): string {
  return _sessionsDirPath;
}
