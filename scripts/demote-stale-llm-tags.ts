/**
 * Demote stale migration-derived tags so they fall back to subtype_heuristic.
 *
 * Background:
 *   The original migration script blanket-assigned confidence 0.85 to every
 *   non-fallback session_subtype value, treating the rule-based classifier's
 *   output as if it were considered LLM work. That promoted a lot of buggy
 *   classifications (especially build.campaign) into "high-confidence" tags.
 *
 * Safety:
 *   This script ONLY touches tags with source === 'migrated'. Real LLM work
 *   (source === 'llm') is never modified. Run scripts/backfill-tag-source.ts
 *   first to ensure all tags are stamped.
 *
 * Behaviour for migrated tags:
 *   - If the migrated tag still matches the (now-tightened) subtype_heuristic
 *     → keep it but drop confidence to 0.55 + change source to 'heuristic_only'
 *     (signals "rule-based confirmed, awaiting LLM verification")
 *   - If the migrated tag DISAGREES with the heuristic
 *     → drop the tag entirely; session_subtype falls back to the heuristic
 *
 * Idempotent — safe to re-run. Tags already at 'heuristic_only' or 'llm' are skipped.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import type { SessionTag } from '@appystack/shared';

const REGISTRY_PATH = path.join(os.homedir(), '.claude/angeleye/registry.json');

const reg: Record<string, Record<string, unknown>> = JSON.parse(
  fs.readFileSync(REGISTRY_PATH, 'utf8')
);

let demoted = 0;
let agreedKept = 0;
let llmPreserved = 0;
let heuristicOnlyPreserved = 0;
let unstamped = 0;
let noTags = 0;
let junk = 0;

for (const entry of Object.values(reg)) {
  if (entry.is_junk) {
    junk++;
    continue;
  }

  const tags = entry.session_tags as SessionTag[] | undefined;
  if (!tags || tags.length === 0) {
    noTags++;
    continue;
  }

  // Only operate on single-tag arrays from migration. Multi-tag arrays are
  // always real LLM work and never touched.
  if (tags.length > 1) {
    llmPreserved++;
    continue;
  }

  const tag = tags[0]!;

  // SAFETY: source must be explicitly 'migrated'. Anything else is left alone.
  if (tag.source === 'llm') {
    llmPreserved++;
    continue;
  }
  if (tag.source === 'heuristic_only') {
    heuristicOnlyPreserved++;
    continue;
  }
  if (tag.source !== 'migrated') {
    // Unstamped tag — refuse to touch. Run backfill-tag-source.ts first.
    unstamped++;
    continue;
  }

  const heur = entry.subtype_heuristic as string | undefined;

  if (heur === tag.tag) {
    // Heuristic agrees — demote to 'heuristic_only' at low confidence.
    tag.confidence = 0.55;
    tag.source = 'heuristic_only';
    agreedKept++;
  } else {
    // Heuristic disagrees — drop the tag, fall back to heuristic.
    entry.session_tags = [];
    demoted++;
  }

  // Recompute derived session_subtype
  const updatedTags = entry.session_tags as SessionTag[];
  if (updatedTags.length > 0) {
    const sorted = [...updatedTags].sort((a, b) => b.confidence - a.confidence);
    entry.session_subtype = sorted[0]!.tag;
  } else if (heur) {
    entry.session_subtype = heur;
  }
}

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));

console.log('Demotion complete (safe-mode: source=migrated only)');
console.log(`  LLM tags preserved:           ${llmPreserved}`);
console.log(`  heuristic_only preserved:     ${heuristicOnlyPreserved}`);
console.log(`  Unstamped (skipped):          ${unstamped}`);
console.log(`  Heuristic-confirmed (→ 0.55): ${agreedKept}`);
console.log(`  Disagreement (tag dropped):   ${demoted}`);
console.log(`  No tags:                      ${noTags}`);
console.log(`  Junk:                         ${junk}`);
if (unstamped > 0) {
  console.log(`\n⚠ ${unstamped} unstamped tags skipped. Run backfill-tag-source.ts to fix.`);
}
