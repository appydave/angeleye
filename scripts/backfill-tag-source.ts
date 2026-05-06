/**
 * One-time backfill: stamp `source` on every existing SessionTag.
 *
 * - Sessions classified by the LLM in this conversation → source: 'llm'
 * - All other tags → source: 'migrated'
 *
 * After this runs, demote-stale-llm-tags.ts can safely target
 * source === 'migrated' tags only.
 *
 * Idempotent — safe to re-run. Existing source values are preserved.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import type { SessionTag } from '@appystack/shared';

const REGISTRY_PATH = path.join(os.homedir(), '.claude/angeleye/registry.json');

// Session IDs (8-char prefixes) we LLM-classified across the three batches in
// this conversation. Order: batch 1 (28) + batch 2 (27) + batch 3 (92) = 147.
const LLM_TOUCHED_IDS = [
  // Batch 1
  '7d20393a',
  '9bd87bb5',
  '3646e49e',
  'cfc63f23',
  '02437ab7',
  '0aabff8e',
  '6e540b21',
  '67c6f182',
  'ca8ef6a7',
  'cfa7f6a3',
  '201aec50',
  '0ae7df7c',
  '19643e68',
  '19e974c6',
  '2238b9f1',
  '2421e5c5',
  '2738f3e0',
  '3335c76f',
  '39d9224e',
  '4905b3ee',
  '4c858f8a',
  '4ff362fe',
  '55a6468b',
  '649b08de',
  '6f12067a',
  '77d71fc4',
  'a2fdbf5b',
  'bfa26edf',
  // Batch 2
  'e907c7f1',
  'abf3549a',
  '0af58053',
  '86ad9f30',
  'a84d4902',
  'c3bae9c6',
  'e3c9e049',
  'b0215876',
  '1422b159',
  '1727cafa',
  '794eef99',
  'bfaa39a7',
  'd363ca82',
  'f1183f53',
  'e27dd3c2',
  '48465caa',
  '830bd3ac',
  '030059a0',
  '03127725',
  '085f085c',
  '114c6d78',
  '1258366a',
  '131d186c',
  '14011e56',
  '1700f3ec',
  '248480a0',
  '24f5b175',
  // Batch 3 (the 92 changes from the most recent batch)
  '2efc01af',
  '2f22e5b7',
  '40c44dee',
  '41024780',
  '44d4d314',
  '4f494a9c',
  '4f7716c8',
  '56fd3f82',
  '580c428a',
  '5942ce2f',
  '5a85b671',
  '5ab3c274',
  '5ea99ae9',
  '5eb6cff1',
  '67dfdd2e',
  '74d062d8',
  '7cfbfc5c',
  '83734245',
  '8bf22f75',
  '8eb0eb2c',
  '99b470e2',
  '9d63797d',
  'a1f083ac',
  'ad22e674',
  'aebac8d2',
  'b95a97be',
  'c0ee8c35',
  'c2460616',
  'c4c30dc9',
  'c9a2f3a2',
  'ce158a14',
  'dc408618',
  'de3c8a74',
  'de52510d',
  'dfc912b1',
  'ed421e41',
  'f3395cf9',
  'f3f48d9f',
  'f5d141ee',
  'f8a2bdb2',
  'febf22a3',
  '9d791f83',
  '0510f9c2',
  '27e99b38',
  '3aa4e5aa',
  '6739f1c0',
  'a9f68828',
  'bc7f7f7a',
  'd9348668',
  'eef93c68',
  '9e87b170',
  '07cdb085',
  '95f33c73',
  '042f3f13',
  'd0799256',
  'e3f78527',
  '0057da96',
  '05ce5c2a',
  '0daf8585',
  '2c59011a',
  '59aedbad',
  '5abfd4f1',
  '64410d3b',
  '76e2b0c7',
  '851f7ac8',
  '8a4a0414',
  'a2dd3f2d',
  'b3ae2275',
  'bfe3e2e1',
  'c05895fc',
  'c613ccca',
  'c7b6f60f',
  'd0af1944',
  'd22cbb1c',
  'da040e73',
  'ea0cafc6',
  'f12c0a0b',
  'f45b1521',
  'f75655f0',
  '0e6fe5b8',
  '1cd5963d',
  '21d6ffaf',
  '3bfcf4c7',
  '4bb89879',
  '520b517b',
  '65f77723',
  '698ddfb2',
  '79c7317b',
  'a7b733ff',
  'b06245d7',
  'b0b9ca8d',
  'da13f544',
];

const llmSet = new Set(LLM_TOUCHED_IDS);

const reg: Record<string, { session_tags?: SessionTag[] }> = JSON.parse(
  fs.readFileSync(REGISTRY_PATH, 'utf8')
);

let llm = 0,
  migrated = 0,
  alreadyStamped = 0,
  noTags = 0,
  llmIdsNotFound = 0;
const llmIdsSeen = new Set<string>();

for (const [fullId, entry] of Object.entries(reg)) {
  const tags = entry.session_tags;
  if (!tags || tags.length === 0) {
    noTags++;
    continue;
  }
  const prefix = fullId.slice(0, 8);
  const isLlm = llmSet.has(prefix);
  if (isLlm) llmIdsSeen.add(prefix);

  let stampedAny = false;
  let preStamped = false;
  for (const t of tags) {
    if (t.source) {
      preStamped = true;
      continue;
    }
    t.source = isLlm ? 'llm' : 'migrated';
    stampedAny = true;
  }

  if (stampedAny) {
    if (isLlm) llm++;
    else migrated++;
  } else if (preStamped) {
    alreadyStamped++;
  }
}

for (const id of LLM_TOUCHED_IDS) {
  if (!llmIdsSeen.has(id)) llmIdsNotFound++;
}

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));

console.log('Source-field backfill complete');
console.log(`  Stamped 'llm':       ${llm}`);
console.log(`  Stamped 'migrated':  ${migrated}`);
console.log(`  Already stamped:     ${alreadyStamped}`);
console.log(`  No tags:             ${noTags}`);
console.log(`  LLM IDs not in registry: ${llmIdsNotFound} (suspicious if > 0)`);
