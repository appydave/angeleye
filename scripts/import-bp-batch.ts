/**
 * import-bp-batch.ts
 *
 * Imports session_subtype (and optionally other Phase 2c fields) from the
 * March 2026 bp-batch JSONL files into the live registry.
 *
 * Only writes to sessions that have NO existing value for the field.
 * Never overwrites. Safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/import-bp-batch.ts [--dry-run] [--field <field>]
 *
 * Default field: session_subtype (the primary gap — 1959 missing)
 */

import { readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { glob } from 'node:fs/promises';

const REGISTRY_PATH = join(homedir(), '.claude', 'angeleye', 'registry.json');
const BATCH_DIR = join(homedir(), 'dev', 'ad', 'brains', 'angeleye', 'analysis');

// bp-batch files with a different schema (backward_pass only) — skip these
const SKIP_BATCHES = new Set([
  'bp-batch-03.jsonl',
  'bp-batch-05.jsonl',
  'bp-batch-06.jsonl',
  'bp-batch-08.jsonl',
]);

// Registry field ← bp-batch classifier key
const FIELD_MAP: Record<string, string> = {
  session_subtype: 'session_subtype',
  opening_style: 'opening_style',
  closing_style: 'closing_style',
  delegation_style: 'C08_delegation_style',
  session_continuity: 'C09_session_continuity',
  output_type: 'C10_output_type',
  initiation_source: 'C11_initiation_source',
};

interface ClassifierEntry {
  value: string;
  confidence?: string;
  reasoning?: string;
}

interface BpRecord {
  session_id?: string;
  classifiers?: Record<string, ClassifierEntry | boolean | string>;
}

type RegistryEntry = Record<string, unknown>;

async function readBatchLines(filePath: string): Promise<BpRecord[]> {
  const records: BpRecord[] = [];
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line) as BpRecord);
    } catch {
      // malformed line — skip
    }
  }
  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fieldArg = args.indexOf('--field');
  const targetFields =
    fieldArg !== -1 && args[fieldArg + 1] ? [args[fieldArg + 1]] : ['session_subtype'];

  console.log(`\nBOLT Phase 2 — bp-batch import`);
  console.log(`Target fields: ${targetFields.join(', ')}`);
  if (dryRun) console.log('DRY RUN — no changes will be written\n');
  else console.log('');

  // Load registry
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as Record<string, RegistryEntry>;
  const totalSessions = Object.keys(registry).length;
  console.log(`Registry loaded: ${totalSessions} sessions`);

  // Count initial coverage
  for (const field of targetFields) {
    const set = Object.values(registry).filter((s) => s[field] !== undefined).length;
    console.log(`  ${field}: ${set} already set, ${totalSessions - set} missing`);
  }
  console.log('');

  // Find all batch files
  const batchFiles: string[] = [];
  for await (const f of glob('bp-batch-*.jsonl', { cwd: BATCH_DIR })) {
    if (!SKIP_BATCHES.has(f)) batchFiles.push(f);
  }
  batchFiles.sort();
  console.log(
    `Found ${batchFiles.length} usable batch files (skipping ${SKIP_BATCHES.size} with different schema)\n`
  );

  // Process each batch
  const stats: Record<string, { found: number; matched: number; written: number }> = {};
  for (const field of targetFields) {
    stats[field] = { found: 0, matched: 0, written: 0 };
  }

  for (const batchFile of batchFiles) {
    const records = await readBatchLines(join(BATCH_DIR, batchFile));
    let batchWritten = 0;

    for (const record of records) {
      const sessionId = record.session_id;
      if (!sessionId || !record.classifiers) continue;

      const entry = registry[sessionId];
      if (!entry) continue; // session not in registry

      for (const field of targetFields) {
        const classifierKey = FIELD_MAP[field];
        if (!classifierKey) continue;

        const classifier = record.classifiers[classifierKey];
        if (!classifier || typeof classifier !== 'object' || !('value' in classifier)) continue;

        const value = (classifier as ClassifierEntry).value;
        if (!value) continue;

        stats[field].found++;

        // Only write if field is currently missing
        if (entry[field] !== undefined) continue;

        stats[field].matched++;
        if (!dryRun) {
          entry[field] = value;
          batchWritten++;
        }
        stats[field].written++;
      }
    }

    console.log(`  ${batchFile}: ${records.length} records, ${batchWritten} fields written`);
  }

  // Write registry back
  if (!dryRun && Object.values(stats).some((s) => s.written > 0)) {
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    console.log('\nRegistry saved.');
  }

  // Summary
  console.log('\n── Summary ─────────────────────────────────────────────');
  for (const field of targetFields) {
    const s = stats[field];
    const after = Object.values(registry).filter((e) => e[field] !== undefined).length;
    console.log(`${field}:`);
    console.log(`  Classified values found in batches: ${s.found}`);
    console.log(`  Matched sessions in registry:       ${s.matched}`);
    console.log(`  ${dryRun ? 'Would write' : 'Written'}:                       ${s.written}`);
    console.log(`  Coverage after: ${after}/${totalSessions}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
