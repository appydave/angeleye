/**
 * Add deterministic secondary tags to single-tag heavy/marathon sessions.
 *
 * Background: enriching this corpus produced ~1275 LLM-tagged sessions but
 * most got a single tag. Skill convention says expect 5–15 secondary tags
 * per 50 sessions for multi-activity work. This script adds secondaries
 * deterministically based on existing predicates — no LLM calls.
 *
 * Rules (only add when secondary signal is real and orthogonal to primary):
 *
 * | Primary               | Predicate                          | Secondary tag (conf 0.55–0.65)            |
 * |-----------------------|------------------------------------|-------------------------------------------|
 * | build.campaign        | has_git_outcome                    | build.shipped 0.60                        |
 * | build.campaign        | has_brain_file_writes              | knowledge.brain_capture 0.55              |
 * | build.campaign        | has_playwright_calls               | orientation.visual_inspection 0.55        |
 * | build.feature         | has_git_outcome                    | build.shipped 0.60                        |
 * | knowledge.brain_audit | has_git_outcome                    | build.shipped 0.55                        |
 * | knowledge.brain_capture | has_git_outcome                  | build.shipped 0.55                        |
 * | orientation.codebase_exploration | has_brain_file_writes   | knowledge.brain_capture 0.55              |
 * | orientation.codebase_exploration | has_git_outcome         | build.shipped 0.55                        |
 *
 * Run: npx tsx scripts/audits/backfill-secondary-tags.ts
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
  session_kind?: 'main' | 'subagent' | 'subprocess';
  is_junk?: boolean;
  session_scale?: string;
  session_tags?: SessionTag[];
  has_git_outcome?: boolean;
  has_brain_file_writes?: boolean;
  has_playwright_calls?: boolean;
}

interface Change {
  id: string;
  tags: SessionTag[];
}

const SECONDARY_RULES: Array<{
  primaryMatches: (tag: string) => boolean;
  predicate: (s: RegistryRow) => boolean;
  secondary: { tag: string; confidence: number };
  reason: string;
}> = [
  {
    primaryMatches: (t) => t === 'build.campaign',
    predicate: (s) => s.has_git_outcome === true,
    secondary: { tag: 'build.shipped', confidence: 0.6 },
    reason: 'BMAD/skill campaign that ended with git activity',
  },
  {
    primaryMatches: (t) => t === 'build.campaign',
    predicate: (s) => s.has_brain_file_writes === true && s.has_git_outcome !== true,
    secondary: { tag: 'knowledge.brain_capture', confidence: 0.55 },
    reason: 'campaign that also wrote brain content',
  },
  {
    primaryMatches: (t) => t === 'build.feature',
    predicate: (s) => s.has_git_outcome === true,
    secondary: { tag: 'build.shipped', confidence: 0.6 },
    reason: 'feature work that shipped',
  },
  {
    primaryMatches: (t) => t === 'knowledge.brain_audit' || t === 'knowledge.brain_capture',
    predicate: (s) => s.has_git_outcome === true,
    secondary: { tag: 'build.shipped', confidence: 0.55 },
    reason: 'brain work that ended with commit/push',
  },
  {
    primaryMatches: (t) => t === 'orientation.codebase_exploration',
    predicate: (s) => s.has_brain_file_writes === true,
    secondary: { tag: 'knowledge.brain_capture', confidence: 0.55 },
    reason: 'exploration that captured brain notes',
  },
];

async function main() {
  const reg = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryRow>;
  const changes: Change[] = [];
  const stats: Record<string, number> = {};

  for (const row of Object.values(reg)) {
    if (row.is_junk || row.session_kind === 'subagent' || row.session_kind === 'subprocess')
      continue;
    if (!row.session_tags || row.session_tags.length !== 1) continue;
    if (!row.session_tags.some((t) => t.source === 'llm')) continue;
    if (row.session_scale !== 'heavy' && row.session_scale !== 'marathon') continue;

    const primary = row.session_tags[0];
    if (!primary) continue;

    for (const rule of SECONDARY_RULES) {
      if (!rule.primaryMatches(primary.tag)) continue;
      if (!rule.predicate(row)) continue;
      // Add the secondary tag (don't duplicate)
      if (row.session_tags.some((t) => t.tag === rule.secondary.tag)) continue;
      changes.push({
        id: row.session_id,
        tags: [primary, rule.secondary],
      });
      stats[`${primary.tag} + ${rule.secondary.tag}`] =
        (stats[`${primary.tag} + ${rule.secondary.tag}`] || 0) + 1;
      break; // one secondary per row max — keeps things simple
    }
  }

  console.log(`Multi-tag candidates: ${changes.length}`);
  console.log('Rule application breakdown:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${v.toString().padStart(4)}  ${k}`));

  if (changes.length === 0) {
    console.log('No changes to apply.');
    return;
  }

  // Chunk into 100-row batches
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

  console.log(
    `✅ Multi-tag backfill complete: ${total} of ${changes.length} sessions got secondary tags`
  );
}

main().catch((err) => {
  console.error('backfill-secondary-tags failed:', err);
  process.exit(1);
});
