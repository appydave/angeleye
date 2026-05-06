/**
 * Retag appyctrl ghost sessions as `meta.scheduled_probe`. The 116 appyctrl
 * sessions tagged `meta.ghost_session` are scheduler-spawned probe sessions
 * (Claude launched with no prompt, loads context, exits within seconds — fires
 * roughly every 5 minutes). They are NOT human-opened ghosts.
 *
 * Filter: project === 'appyctrl' AND primary tag is meta.ghost_session.
 *
 * Run: npx tsx scripts/audits/fix-scheduled-probe-tags.ts
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
  session_tags?: SessionTag[];
}

interface Change {
  id: string;
  tags: SessionTag[];
}

async function main() {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryRow>;
  const changes: Change[] = [];

  for (const row of Object.values(reg)) {
    if (row.project !== 'appyctrl') continue;
    if (!row.session_tags || row.session_tags.length === 0) continue;
    const ghostIdx = row.session_tags.findIndex((t) => t.tag === 'meta.ghost_session');
    if (ghostIdx === -1) continue;

    const original = row.session_tags[ghostIdx]!;
    const next = [...row.session_tags];
    next[ghostIdx] = {
      tag: 'meta.scheduled_probe',
      confidence: original.confidence,
      source: original.source ?? 'llm',
    };
    changes.push({ id: row.session_id, tags: next });
  }

  console.log(`appyctrl ghost → scheduled_probe rows: ${changes.length}`);

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

  console.log(`✅ Done: ${total} of ${changes.length} appyctrl rows retagged as scheduled_probe`);
}

main().catch((err) => {
  console.error('fix-scheduled-probe-tags failed:', err);
  process.exit(1);
});
