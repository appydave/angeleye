import { Router } from 'express';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DiagnosticsResponse } from '@appystack/shared';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readRegistry } from '../services/registry.service.js';
import { logger } from '../config/logger.js';

const router = Router();

const PROJECTS_DIR = join(homedir(), '.claude', 'projects');
const ANGELEYE_DIR = join(homedir(), '.claude', 'angeleye');
const ARCHIVE_DIR = join(ANGELEYE_DIR, 'archive');
const SNAPSHOT_PATH = join(ANGELEYE_DIR, 'diagnostics-snapshot.json');

// Open issues live in docs/architecture/known-issues.md — link surfaces in UI.
// Keys here are anchor ids; UI links to the file with the anchor appended.
const OPEN_ISSUES = [
  {
    id: 'subagent-detection',
    title: 'Subagent (Mechanism B / Agent Teams) detection not yet at ingest',
    doc_link: 'docs/architecture/known-issues.md#subagent-detection',
  },
  {
    id: 'session-kind-field',
    title: 'session_kind / teammate_id field not yet added to schema',
    doc_link: 'docs/architecture/known-issues.md#session-kind-field',
  },
  {
    id: 'archive-fallback',
    title: 'Enrichment scripts read raw JSONL only — should fall back to AngelEye archive',
    doc_link: 'docs/architecture/known-issues.md#archive-fallback',
  },
  {
    id: 'orphan-ingest',
    title: 'Orphan JSONLs on disk not ingested (mostly archon-workspaces)',
    doc_link: 'docs/architecture/known-issues.md#orphan-ingest',
  },
  {
    id: 'upstream-jsonl-prune',
    title: 'Upstream Claude Code JSONLs disappear over time — cause unknown',
    doc_link: 'docs/architecture/known-issues.md#upstream-jsonl-prune',
  },
];

function listOnDiskJsonlIds(): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(PROJECTS_DIR)) return ids;
  for (const dir of readdirSync(PROJECTS_DIR)) {
    const full = join(PROJECTS_DIR, dir);
    try {
      if (!statSync(full).isDirectory()) continue;
      for (const f of readdirSync(full)) {
        if (f.endsWith('.jsonl')) ids.add(f.replace(/\.jsonl$/, ''));
      }
    } catch {
      /* skip unreadable dirs */
    }
  }
  return ids;
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

function readSnapshot(): {
  generated_at?: string;
  teammate_message_files?: number;
  orphans?: { count: number; top_dirs?: { dir: string; count: number }[] };
} | null {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8'));
  } catch (err) {
    logger.warn({ err }, 'Failed to read diagnostics snapshot');
    return null;
  }
}

router.get('/', async (_req, res) => {
  try {
    const registry = await readRegistry();
    const onDisk = listOnDiskJsonlIds();
    const archived = listArchivedIds();
    const snapshot = readSnapshot();

    let withJsonl = 0;
    let archiveOnly = 0;
    let truePhantom = 0;
    let isJunk = 0;
    let llmEnriched = 0;
    let heuristicOnly = 0;
    let migratedOnly = 0;
    let untagged = 0;
    let buildFeatureQueue = 0;

    for (const [id, row] of Object.entries(registry)) {
      if (row.is_junk) isJunk++;

      if (onDisk.has(id)) withJsonl++;
      else if (archived.has(id)) archiveOnly++;
      else truePhantom++;

      const tags = row.session_tags ?? [];
      const sources = new Set(tags.map((t) => t.source));
      if (sources.has('llm')) llmEnriched++;
      else if (sources.has('migrated')) migratedOnly++;
      else if (sources.has('heuristic_only')) heuristicOnly++;
      else untagged++;

      const top = tags.length > 0 ? [...tags].sort((a, b) => b.confidence - a.confidence)[0] : null;
      const effective = top?.tag ?? row.session_subtype;
      // Match the enrichment skill's filter exactly:
      // build.feature backlog = main sessions, not junk, not yet LLM-reviewed
      const sessionKind = (row as unknown as Record<string, unknown>).session_kind;
      if (
        effective === 'build.feature' &&
        !row.is_junk &&
        sessionKind !== 'subagent' &&
        !sources.has('llm')
      ) {
        buildFeatureQueue++;
      }
    }

    // Sample the registry for backfill state of session_kind
    const fieldPopulated = Object.values(registry).some(
      (r) => (r as unknown as Record<string, unknown>).session_kind !== undefined
    );

    const response: DiagnosticsResponse = {
      generated_at: new Date().toISOString(),
      registry: {
        total: Object.keys(registry).length,
        with_jsonl: withJsonl,
        archive_only: archiveOnly,
        true_phantom: truePhantom,
        is_junk: isJunk,
      },
      tags: {
        llm_enriched: llmEnriched,
        heuristic_only: heuristicOnly,
        migrated: migratedOnly,
        untagged,
        build_feature_queue: buildFeatureQueue,
      },
      subagents: snapshot?.teammate_message_files
        ? {
            snapshot_present: true,
            snapshot_path: SNAPSHOT_PATH,
            teammate_message_files: snapshot.teammate_message_files,
            field_populated: fieldPopulated,
          }
        : { snapshot_present: false, field_populated: fieldPopulated },
      orphans: snapshot?.orphans
        ? {
            snapshot_present: true,
            count: snapshot.orphans.count,
            top_dirs: snapshot.orphans.top_dirs,
          }
        : { snapshot_present: false },
      open_issues: OPEN_ISSUES,
    };

    return apiSuccess(res, response);
  } catch (err) {
    logger.error({ err }, 'Diagnostics failed');
    return apiFailure(res, 'Diagnostics failed', 500);
  }
});

export default router;
