/**
 * Backfill `session_kind: 'subprocess'` on existing registry rows that match
 * the headless-skill subprocess heuristic (omi-extract-haiku, "executing a
 * skill" wrappers, etc.).
 *
 * Why backfill: detection now runs at session_stop, but the registry has 185+
 * pre-existing rows from before the fix. They pollute LLM enrichment queues.
 * This script tags them so they get filtered out.
 *
 * Run: npx tsx scripts/audits/backfill-subprocess-kind.ts
 *
 * Requires: AngelEye server running on $ANGELEYE_API (default http://localhost:5051).
 *
 * See: docs/architecture/known-issues.md#subprocess-session-mechanism-3
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { detectSubprocess } from '../../server/src/services/subprocess-detection.service.js';

const REGISTRY_PATH = join(homedir(), '.claude', 'angeleye', 'registry.json');
const SESSIONS_DIR = join(homedir(), '.claude', 'angeleye', 'sessions');
const ARCHIVE_DIR = join(homedir(), '.claude', 'angeleye', 'archive');
const API_BASE = process.env.ANGELEYE_API ?? 'http://localhost:5051';
const ENDPOINT = `${API_BASE}/api/registry/session-kind`;

interface RegistryRow {
  session_id: string;
  session_kind?: 'main' | 'subagent' | 'subprocess';
  is_junk?: boolean;
}

interface AngelEyeEvent {
  event: string;
  prompt?: string;
}

function readEvents(sessionId: string): AngelEyeEvent[] {
  for (const dir of [SESSIONS_DIR, ARCHIVE_DIR]) {
    const f = join(dir, `session-${sessionId}.jsonl`);
    if (!existsSync(f)) continue;
    try {
      return readFileSync(f, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l) as AngelEyeEvent;
          } catch {
            return null;
          }
        })
        .filter((e): e is AngelEyeEvent => e !== null);
    } catch {
      continue;
    }
  }
  return [];
}

async function main() {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryRow>;
  const candidates: string[] = [];

  for (const row of Object.values(reg)) {
    if (row.session_kind === 'subagent' || row.session_kind === 'subprocess') continue;
    if (row.is_junk) continue;
    const events = readEvents(row.session_id);
    if (detectSubprocess(events as Parameters<typeof detectSubprocess>[0]).is_subprocess) {
      candidates.push(row.session_id);
    }
  }

  console.log(`Found ${candidates.length} subprocess sessions to backfill`);

  if (candidates.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const changes = candidates.map((id) => ({ id, kind: 'subprocess' as const }));

  // Chunk into 100-row batches to keep payload manageable.
  let totalWritten = 0;
  const chunkSize = 100;
  for (let i = 0; i < changes.length; i += chunkSize) {
    const chunk = changes.slice(i, i + chunkSize);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: chunk }),
    });
    if (!res.ok) {
      console.error(`Chunk ${i / chunkSize + 1} failed: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.error(body);
      process.exit(1);
    }
    const data = (await res.json()) as { data: { written: number; missing: string[] } };
    totalWritten += data.data.written;
    console.log(
      `Chunk ${i / chunkSize + 1}: written=${data.data.written}, missing=${data.data.missing.length}`
    );
  }

  console.log(
    `✅ Backfill complete: ${totalWritten} of ${candidates.length} rows marked session_kind='subprocess'`
  );
}

main().catch((err) => {
  console.error('backfill-subprocess-kind failed:', err);
  process.exit(1);
});
