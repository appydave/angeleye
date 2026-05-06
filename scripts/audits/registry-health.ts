#!/usr/bin/env tsx
/**
 * Registry health audit. Scans:
 *   - ~/.claude/projects/      — raw Claude Code session JSONLs
 *   - ~/.claude/angeleye/*     — registry.json, sessions/, archive/
 *
 * Reports phantom/archive-only/orphan counts, subagent (Mechanism B) detection,
 * and writes a snapshot to ~/.claude/angeleye/diagnostics-snapshot.json which the
 * Diagnostics view consumes.
 *
 * Run: `npm run audit:registry`
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECTS_DIR = join(homedir(), '.claude', 'projects');
const ANGELEYE_DIR = join(homedir(), '.claude', 'angeleye');
const ARCHIVE_DIR = join(ANGELEYE_DIR, 'archive');
const REGISTRY_PATH = join(ANGELEYE_DIR, 'registry.json');
const SNAPSHOT_PATH = join(ANGELEYE_DIR, 'diagnostics-snapshot.json');

const TEAMMATE_REGEX = /<teammate-message\s+teammate_id="([^"]+)"/;

function listProjectDirs(): string[] {
  if (!existsSync(PROJECTS_DIR)) return [];
  return readdirSync(PROJECTS_DIR).filter((d) => {
    try {
      return statSync(join(PROJECTS_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });
}

function collectOnDiskJsonls(): { idsByDir: Map<string, string[]>; allIds: Set<string> } {
  const idsByDir = new Map<string, string[]>();
  const allIds = new Set<string>();
  for (const dir of listProjectDirs()) {
    const ids: string[] = [];
    for (const f of readdirSync(join(PROJECTS_DIR, dir))) {
      if (f.endsWith('.jsonl')) {
        const id = f.replace(/\.jsonl$/, '');
        ids.push(id);
        allIds.add(id);
      }
    }
    if (ids.length > 0) idsByDir.set(dir, ids);
  }
  return { idsByDir, allIds };
}

function listArchivedIds(): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(ARCHIVE_DIR)) return ids;
  for (const f of readdirSync(ARCHIVE_DIR)) {
    if (f.startsWith('session-') && f.endsWith('.jsonl')) {
      ids.add(f.replace(/^session-/, '').replace(/\.jsonl$/, ''));
    }
  }
  return ids;
}

function scanForTeammateMessage(filepath: string): string | null {
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
              : '';
        const match = text.match(TEAMMATE_REGEX);
        if (match) return match[1] ?? 'unknown';
      } catch {
        /* skip non-JSON line */
      }
    }
  } catch {
    /* file unreadable */
  }
  return null;
}

interface Registry {
  [id: string]: { project?: string; session_id: string };
}

function main() {
  console.log('Scanning ~/.claude/projects/ ...');
  const { idsByDir, allIds: onDisk } = collectOnDiskJsonls();
  console.log(`  ${onDisk.size} JSONL files across ${idsByDir.size} project dirs`);

  console.log('Scanning ~/.claude/angeleye/archive/ ...');
  const archived = listArchivedIds();
  console.log(`  ${archived.size} archived session files`);

  console.log('Reading registry.json ...');
  const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  const regIds = new Set(Object.keys(registry));
  console.log(`  ${regIds.size} registry rows`);

  // Reconciliation
  let withJsonl = 0;
  let archiveOnly = 0;
  let truePhantom = 0;
  for (const id of regIds) {
    if (onDisk.has(id)) withJsonl++;
    else if (archived.has(id)) archiveOnly++;
    else truePhantom++;
  }
  const orphans = [...onDisk].filter((id) => !regIds.has(id));

  // Orphan top dirs
  const orphanByDir = new Map<string, number>();
  for (const [dir, ids] of idsByDir) {
    const count = ids.filter((id) => !regIds.has(id)).length;
    if (count > 0) orphanByDir.set(dir, count);
  }
  const topOrphanDirs = [...orphanByDir.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([dir, count]) => ({ dir, count }));

  // Subagent (Mechanism B) scan
  console.log('Scanning for <teammate-message> markers (Mechanism B) ...');
  let teammateFiles = 0;
  const teammateIdCounts = new Map<string, number>();
  for (const dir of listProjectDirs()) {
    for (const f of readdirSync(join(PROJECTS_DIR, dir))) {
      if (!f.endsWith('.jsonl')) continue;
      const role = scanForTeammateMessage(join(PROJECTS_DIR, dir, f));
      if (role) {
        teammateFiles++;
        teammateIdCounts.set(role, (teammateIdCounts.get(role) ?? 0) + 1);
      }
    }
  }
  console.log(`  ${teammateFiles} files with teammate-message wrapper`);

  // Snapshot
  const snapshot = {
    generated_at: new Date().toISOString(),
    raw_jsonl: { total: onDisk.size, project_dirs: idsByDir.size },
    archive: { total: archived.size },
    registry: {
      total: regIds.size,
      with_jsonl: withJsonl,
      archive_only: archiveOnly,
      true_phantom: truePhantom,
    },
    orphans: { count: orphans.length, top_dirs: topOrphanDirs },
    teammate_message_files: teammateFiles,
    teammate_ids: Object.fromEntries(teammateIdCounts),
  };

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  console.log('');
  console.log('=== Audit summary ===');
  console.log(`Registry total:       ${regIds.size}`);
  console.log(`  with upstream JSONL: ${withJsonl}`);
  console.log(`  archive-only:        ${archiveOnly}`);
  console.log(`  true phantom:        ${truePhantom}`);
  console.log(`Orphans (on disk, not in registry): ${orphans.length}`);
  console.log(`Mechanism B subagents:  ${teammateFiles}`);
  console.log('');
  console.log(`Snapshot written: ${SNAPSHOT_PATH}`);
}

main();
