/**
 * Backfill subtype_heuristic on every registry entry by re-running the
 * deterministic classifier. Leaves session_tags untouched. Recomputes
 * session_subtype using the standard derivation (LLM tags > heuristic).
 *
 * Idempotent — safe to re-run.
 *
 * Run: npx tsx scripts/backfill-subtype-heuristic.ts
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { classifySession } from '../server/src/services/classifier.service.js';
import { deriveSessionSubtype } from '../server/src/services/sync.service.js';
import type { AngelEyeEvent, SessionTag } from '@appystack/shared';

const REGISTRY_PATH = path.join(os.homedir(), '.claude/angeleye/registry.json');
const SESSIONS_DIR = path.join(os.homedir(), '.claude/angeleye/sessions');
const ARCHIVE_DIR = path.join(os.homedir(), '.claude/angeleye/archive');

function readEvents(sessionId: string): AngelEyeEvent[] {
  for (const dir of [SESSIONS_DIR, ARCHIVE_DIR]) {
    const f = path.join(dir, `session-${sessionId}.jsonl`);
    if (fs.existsSync(f)) {
      return fs
        .readFileSync(f, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l) as AngelEyeEvent;
          } catch {
            return null;
          }
        })
        .filter((x): x is AngelEyeEvent => x !== null);
    }
  }
  return [];
}

const reg: Record<string, Record<string, unknown>> = JSON.parse(
  fs.readFileSync(REGISTRY_PATH, 'utf8')
);

let processed = 0;
let withHeuristic = 0;
let llmPreserved = 0;
let derivedChanged = 0;
let noEvents = 0;
let skippedJunk = 0;

for (const [sessionId, entry] of Object.entries(reg)) {
  if (entry.is_junk) {
    skippedJunk++;
    continue;
  }

  const events = readEvents(sessionId);
  if (events.length === 0) {
    noEvents++;
    continue;
  }

  const projectDir = (entry.project_dir as string) ?? '';
  const result = classifySession(events, sessionId, projectDir);

  if (result.subtype_heuristic !== undefined) {
    entry.subtype_heuristic = result.subtype_heuristic;
    withHeuristic++;
  }

  // Re-derive session_subtype using the canonical rule:
  // LLM session_tags wins if present, else fall back to heuristic.
  const tags = entry.session_tags as SessionTag[] | undefined;
  const previousSubtype = entry.session_subtype;
  const newSubtype = deriveSessionSubtype({
    session_tags: tags,
    subtype_heuristic: result.subtype_heuristic,
  });

  if (tags && tags.length > 0) {
    llmPreserved++;
  }

  if (newSubtype !== previousSubtype) {
    derivedChanged++;
  }

  if (newSubtype !== undefined) {
    entry.session_subtype = newSubtype;
  }

  processed++;
}

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));

console.log('Backfill complete');
console.log(`  Processed:           ${processed}`);
console.log(`  Heuristic written:   ${withHeuristic}`);
console.log(`  LLM tags preserved:  ${llmPreserved}`);
console.log(`  Derived changed:     ${derivedChanged}`);
console.log(`  Skipped (junk):      ${skippedJunk}`);
console.log(`  Skipped (no events): ${noEvents}`);
