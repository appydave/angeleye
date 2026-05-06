/**
 * Remove `meta.ghost_session` from sessions that are correctly tagged as
 * `session_kind: 'subprocess'`. Subprocess sessions (e.g. omi-extract-haiku
 * spawns) were retroactively detected by backfill-subprocess-kind.ts but
 * retained a stale LLM-assigned `meta.ghost_session` tag. The new classifier
 * guard prevents future mis-tagging; this script fixes existing rows.
 *
 * Run: npx tsx scripts/audits/fix-subprocess-ghost-tags.ts
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REGISTRY_PATH = join(homedir(), '.claude', 'angeleye', 'registry.json');
const API_BASE = process.env.ANGELEYE_API ?? 'http://localhost:5051';
const ENDPOINT = `${API_BASE}/api/registry/llm-tags`;

interface SessionTag {
  tag: string;
  confidence: number;
  source?: string;
}

interface RegistryRow {
  session_id: string;
  project?: string;
  session_kind?: 'main' | 'subagent' | 'subprocess';
  session_tags?: SessionTag[];
}

interface Change {
  id: string;
  tags: SessionTag[];
}

async function main() {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryRow>;
  const changes: Change[] = [];
  const projectStats: Record<string, number> = {};

  for (const row of Object.values(reg)) {
    if (row.session_kind !== 'subprocess') continue;
    if (!row.session_tags || row.session_tags.length === 0) continue;
    if (!row.session_tags.some((t) => t.tag === 'meta.ghost_session')) continue;

    const cleaned = row.session_tags.filter((t) => t.tag !== 'meta.ghost_session');
    changes.push({ id: row.session_id, tags: cleaned });
    const proj = row.project ?? 'unknown';
    projectStats[proj] = (projectStats[proj] || 0) + 1;
  }

  console.log(`Subprocess+ghost rows to fix: ${changes.length}`);
  console.log('By project:');
  Object.entries(projectStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)}  ${k}`));

  if (changes.length === 0) {
    console.log('No changes to apply.');
    return;
  }

  let total = 0;
  for (let i = 0; i < changes.length; i += 100) {
    const chunk = changes.slice(i, i + 100);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: chunk }),
    });
    if (!res.ok) {
      console.error(`Chunk ${Math.floor(i / 100) + 1} failed: ${res.status}`);
      console.error(await res.text());
      process.exit(1);
    }
    const data = (await res.json()) as { data: { written: number } };
    total += data.data.written;
    console.log(`Chunk ${Math.floor(i / 100) + 1}: written=${data.data.written}`);
  }

  console.log(`✅ Done: ${total} of ${changes.length} subprocess rows had ghost tag removed`);
}

main().catch((err) => {
  console.error('fix-subprocess-ghost-tags failed:', err);
  process.exit(1);
});
