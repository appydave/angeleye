/**
 * Detects Agent Teams subagent sessions (Mechanism B) by scanning the raw
 * Claude Code JSONL for a `<teammate-message teammate_id="...">` wrapper in
 * the first user message.
 *
 * Background: 33% of raw JSONLs (454/1378 audited 2026-05-04) carry this
 * wrapper. Hook events alone are unreliable — only ~7% of teammate sessions
 * fire teammate_idle/subagent_start hooks. Reading the JSONL directly is the
 * only consistent signal in this Claude Code version.
 *
 * See: docs/architecture/known-issues.md#subagent-detection
 *      ~/dev/ad/brains/anthropic-claude/claude-code/observability.md
 *      §"Sub-Agent Sessions — Two Different Mechanisms"
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECTS_DIR = join(homedir(), '.claude', 'projects');
const ANGELEYE_ARCHIVE = join(homedir(), '.claude', 'angeleye', 'archive');
const ANGELEYE_SESSIONS = join(homedir(), '.claude', 'angeleye', 'sessions');
const TEAMMATE_REGEX = /<teammate-message\s+teammate_id="([^"]+)"/;
const HEAD_LINES = 20;

export interface TeammateDetectionResult {
  is_subagent: boolean;
  teammate_id?: string;
}

/**
 * Encodes a cwd to Claude Code's `~/.claude/projects/` directory naming.
 * `/Users/davidcruwys/dev/ad/apps/angeleye` → `-Users-davidcruwys-dev-ad-apps-angeleye`
 */
function encodeCwd(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

function findRawJsonlPath(sessionId: string, cwd: string | undefined): string | null {
  if (cwd) {
    const direct = join(PROJECTS_DIR, encodeCwd(cwd), `${sessionId}.jsonl`);
    if (existsSync(direct)) return direct;
  }
  // Fallback: scan all project dirs (rare path — used when cwd isn't passed)
  if (!existsSync(PROJECTS_DIR)) return null;
  for (const dir of readdirSync(PROJECTS_DIR)) {
    try {
      if (!statSync(join(PROJECTS_DIR, dir)).isDirectory()) continue;
      const candidate = join(PROJECTS_DIR, dir, `${sessionId}.jsonl`);
      if (existsSync(candidate)) return candidate;
    } catch {
      /* skip */
    }
  }
  return null;
}

function findArchivePath(sessionId: string): string | null {
  for (const dir of [ANGELEYE_ARCHIVE, ANGELEYE_SESSIONS]) {
    const candidate = join(dir, `session-${sessionId}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Scan the first N lines of a file for a teammate-message wrapper. Works on
 * either raw Claude Code JSONLs (looks at `message.content`) or AngelEye's
 * own event stream (looks at `prompt` field on user_prompt events — though
 * teammate sessions typically have no user_prompt events at all in the
 * AngelEye stream, which is why we prefer raw JSONL).
 */
function scanFile(filepath: string): string | null {
  try {
    const head = readFileSync(filepath, 'utf-8').split('\n').filter(Boolean).slice(0, HEAD_LINES);
    for (const line of head) {
      try {
        const e = JSON.parse(line);
        // Raw Claude Code JSONL shape
        const c = e?.message?.content;
        const text =
          typeof c === 'string'
            ? c
            : Array.isArray(c)
              ? c
                  .filter((x: { type: string }) => x.type === 'text')
                  .map((x: { text: string }) => x.text)
                  .join(' ')
              : typeof e?.prompt === 'string'
                ? e.prompt
                : '';
        const match = text.match(TEAMMATE_REGEX);
        if (match) return match[1] ?? 'unknown';
      } catch {
        /* skip malformed line */
      }
    }
  } catch {
    /* unreadable file */
  }
  return null;
}

/**
 * Detect whether `sessionId` is an Agent Teams subagent. Tries the raw
 * Claude Code JSONL first; falls back to AngelEye's own archive when raw
 * is missing (e.g., upstream JSONL pruned by Claude Code's retention).
 *
 * Returns `is_subagent: false` when no wrapper found OR when neither file
 * exists yet (caller should treat this as "not yet known" and let the
 * backfill script catch it later).
 */
export function detectTeammate(
  sessionId: string,
  cwd: string | undefined
): TeammateDetectionResult {
  const raw = findRawJsonlPath(sessionId, cwd);
  if (raw) {
    const id = scanFile(raw);
    if (id) return { is_subagent: true, teammate_id: id };
  }
  const archive = findArchivePath(sessionId);
  if (archive) {
    const id = scanFile(archive);
    if (id) return { is_subagent: true, teammate_id: id };
  }
  return { is_subagent: false };
}
