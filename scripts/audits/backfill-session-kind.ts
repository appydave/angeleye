#!/usr/bin/env tsx
/**
 * Backfills `session_kind` and `teammate_id` across all existing registry rows.
 *
 * For each row, scans:
 *   1. raw Claude Code JSONL at ~/.claude/projects/<encoded-cwd>/<id>.jsonl
 *   2. AngelEye archive at ~/.claude/angeleye/archive/session-<id>.jsonl (fallback)
 *   3. AngelEye live sessions at ~/.claude/angeleye/sessions/session-<id>.jsonl
 *
 * If a `<teammate-message teammate_id="...">` wrapper is found in the first
 * 20 lines, stamps the row as session_kind: 'subagent' with teammate_id.
 * Otherwise stamps session_kind: 'main'.
 *
 * Run: `npm run audit:backfill-session-kind`
 *
 * Background: scripts/audits/registry-health.ts confirms 454/1378 raw JSONLs
 * carry the wrapper. This script propagates that information into the registry.
 *
 * See: docs/architecture/known-issues.md#subagent-detection
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECTS_DIR = join(homedir(), '.claude', 'projects');
const ANGELEYE_DIR = join(homedir(), '.claude', 'angeleye');
const ARCHIVE_DIR = join(ANGELEYE_DIR, 'archive');
const SESSIONS_DIR = join(ANGELEYE_DIR, 'sessions');
const REGISTRY_PATH = join(ANGELEYE_DIR, 'registry.json');
const TEAMMATE_REGEX = /<teammate-message\s+teammate_id="([^"]+)"/;

function encodeCwd(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

function scanForTeammate(filepath: string): string | null {
  try {
    const head = readFileSync(filepath, 'utf-8').split('\n').filter(Boolean).slice(0, 20);
    for (const line of head) {
      try {
        const e = JSON.parse(line);
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
        /* skip */
      }
    }
  } catch {
    /* unreadable */
  }
  return null;
}

function findFile(sessionId: string, cwd: string | undefined): string | null {
  if (cwd) {
    const direct = join(PROJECTS_DIR, encodeCwd(cwd), `${sessionId}.jsonl`);
    if (existsSync(direct)) return direct;
  }
  // Scan all project dirs
  if (existsSync(PROJECTS_DIR)) {
    for (const dir of readdirSync(PROJECTS_DIR)) {
      try {
        if (!statSync(join(PROJECTS_DIR, dir)).isDirectory()) continue;
        const candidate = join(PROJECTS_DIR, dir, `${sessionId}.jsonl`);
        if (existsSync(candidate)) return candidate;
      } catch {
        /* skip */
      }
    }
  }
  for (const dir of [ARCHIVE_DIR, SESSIONS_DIR]) {
    const candidate = join(dir, `session-${sessionId}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

interface Row {
  session_id: string;
  project_dir?: string;
  session_kind?: 'main' | 'subagent';
  teammate_id?: string | null;
  [key: string]: unknown;
}

function main() {
  // Backup
  const ts = new Date().toISOString().slice(0, 10);
  const backupPath = `${REGISTRY_PATH}.bak-pre-session-kind-${ts}`;
  if (!existsSync(backupPath)) {
    writeFileSync(backupPath, readFileSync(REGISTRY_PATH));
    console.log(`Backup → ${backupPath}`);
  } else {
    console.log(`Backup already exists, skipping: ${backupPath}`);
  }

  const registry: Record<string, Row> = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  const ids = Object.keys(registry);
  console.log(`Scanning ${ids.length} registry rows...`);

  let stampedSubagent = 0;
  let stampedMain = 0;
  let unknown = 0;
  let alreadySet = 0;

  for (const id of ids) {
    const row = registry[id]!;
    if (row.session_kind !== undefined) {
      alreadySet++;
      continue;
    }
    const file = findFile(id, row.project_dir);
    if (!file) {
      // Cannot determine — leave undefined (caller can decide later)
      unknown++;
      continue;
    }
    const teammateId = scanForTeammate(file);
    if (teammateId) {
      row.session_kind = 'subagent';
      row.teammate_id = teammateId;
      stampedSubagent++;
    } else {
      row.session_kind = 'main';
      stampedMain++;
    }
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  console.log('');
  console.log('=== Backfill summary ===');
  console.log(`Already stamped:  ${alreadySet}`);
  console.log(`→ subagent:       ${stampedSubagent}`);
  console.log(`→ main:           ${stampedMain}`);
  console.log(`Unknown (no file): ${unknown}`);
  console.log(`Total processed:  ${ids.length}`);
}

main();
