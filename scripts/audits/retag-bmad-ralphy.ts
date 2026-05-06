/**
 * Deterministic retag of BMAD and Ralphy sessions based on `trigger_command`.
 *
 * Background: 348 BMAD sessions and 65 Ralphy sessions were enriched before
 * the orchestrator/agent distinction existed in the schema. They got generic
 * `build.campaign`. trigger_command gives us a deterministic split:
 *
 * - appydave:bmad-story-lifecycle / bmad-story-lifecycle → build.bmad_orchestrator
 * - any other bmad-* / appydave:bmad-*                   → build.bmad_agent
 * - ralphy / appydave:ralphy                            → build.ralphy_campaign
 *
 * Confidence: 0.95 (trigger_command is authoritative — no LLM judgement needed).
 *
 * Run: npx tsx scripts/audits/retag-bmad-ralphy.ts
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
  trigger_command?: string | null;
  session_tags?: SessionTag[];
}

interface Change {
  id: string;
  tags: SessionTag[];
}

function targetTag(tc: string): string | null {
  if (tc === 'appydave:bmad-story-lifecycle' || tc === 'bmad-story-lifecycle') {
    return 'build.bmad_orchestrator';
  }
  if (tc.startsWith('bmad-') || tc.startsWith('appydave:bmad-')) {
    return 'build.bmad_agent';
  }
  if (tc === 'ralphy' || tc === 'appydave:ralphy') {
    return 'build.ralphy_campaign';
  }
  return null;
}

async function main() {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryRow>;
  const changes: Change[] = [];
  const stats: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  for (const row of Object.values(reg)) {
    const tc = row.trigger_command ?? '';
    const target = targetTag(tc);
    if (!target) continue;

    const existing = row.session_tags ?? [];
    const primary = existing[0];

    // Already correctly tagged? skip.
    if (primary?.tag === target) {
      skipped[target] = (skipped[target] || 0) + 1;
      continue;
    }

    // Build new tag list: replace primary if present, else prepend.
    // Preserve secondary tags so we don't clobber multi-tag enrichment.
    const conf = primary?.confidence ?? 0.95;
    const newPrimary: SessionTag = {
      tag: target,
      confidence: Math.max(conf, 0.95),
      source: 'llm',
    };
    const rest = existing.slice(1).filter((t) => t.tag !== target);
    changes.push({ id: row.session_id, tags: [newPrimary, ...rest] });
    const key = `${primary?.tag ?? '<none>'} → ${target}`;
    stats[key] = (stats[key] || 0) + 1;
  }

  console.log(`Retag candidates: ${changes.length}`);
  console.log('Transitions:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)}  ${k}`));
  if (Object.keys(skipped).length) {
    console.log('Already correct (skipped):');
    Object.entries(skipped)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)}  ${k}`));
  }

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

  console.log(`✅ Done: ${total} of ${changes.length} sessions retagged`);
}

main().catch((err) => {
  console.error('retag-bmad-ralphy failed:', err);
  process.exit(1);
});
