/**
 * Migrates registry.json from flat session_subtype strings to session_tags array format.
 *
 * Before: { session_subtype: "feature_implementation" }
 * After:  { session_subtype: "build.shipped", session_tags: [{tag: "build.shipped", confidence: 0.75}] }
 *
 * Rules:
 * - Sessions already having session_tags are skipped (idempotent)
 * - snake_case legacy subtypes are mapped to dot notation
 * - Fallback defaults (build.feature, orientation.quick_check, etc.) get confidence 0.50
 * - LLM-enriched specific values get confidence 0.85
 * - High-certainty values (meta.ghost_session, meta.accidental) get confidence 0.95
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

// DATA: paths.storage  +  confidence.ladder
// See docs/architecture/data-driven-extraction.md §10 and §8.
const REGISTRY_PATH = path.join(os.homedir(), '.claude/angeleye/registry.json');

// snake_case legacy → dot notation canonical
const LEGACY_MAP: Record<string, string> = {
  feature_implementation: 'build.shipped',
  bug_fix_round: 'build.bug_fix',
  refactoring: 'build.refactor',
  test_writing: 'build.test_writing',
  ci_pipeline: 'build.ci_pipeline',
  codebase_exploration: 'orientation.codebase_exploration',
  file_retrieval: 'orientation.file_retrieval',
  artifact_lookup: 'orientation.artifact_lookup',
  brain_capture: 'knowledge.brain_capture',
  brain_maintenance: 'knowledge.brain_maintenance',
  advisory_refinement: 'knowledge.advisory_refinement',
  technology_survey: 'research.technology_survey',
};

// Generic fallback subtypes — low confidence
const LOW_CONFIDENCE_SUBTYPES = new Set([
  'build.feature',
  'orientation.quick_check',
  'orientation.exploration',
  'knowledge.general',
  'research.exploration',
]);

// High certainty subtypes
const HIGH_CONFIDENCE_SUBTYPES = new Set(['meta.ghost_session', 'meta.accidental']);

function confidenceFor(tag: string): number {
  if (HIGH_CONFIDENCE_SUBTYPES.has(tag)) return 0.95;
  if (LOW_CONFIDENCE_SUBTYPES.has(tag)) return 0.5;
  return 0.85;
}

function migrate() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const reg: Record<string, Record<string, unknown>> = JSON.parse(raw);

  let skipped = 0;
  let migrated = 0;
  let remapped = 0;

  const subtypeDist: Record<string, number> = {};

  for (const [id, session] of Object.entries(reg)) {
    // Already has session_tags — skip
    if (
      session.session_tags &&
      Array.isArray(session.session_tags) &&
      (session.session_tags as unknown[]).length > 0
    ) {
      skipped++;
      continue;
    }

    const raw_subtype = (session.session_subtype as string) || 'build.feature';

    // Map legacy snake_case to dot notation
    const canonical = LEGACY_MAP[raw_subtype] ?? raw_subtype;
    if (canonical !== raw_subtype) remapped++;

    const confidence = confidenceFor(canonical);

    session.session_tags = [{ tag: canonical, confidence }];
    session.session_subtype = canonical;

    subtypeDist[canonical] = (subtypeDist[canonical] ?? 0) + 1;
    migrated++;
    void id; // suppress unused warning
  }

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));

  console.log(`Migration complete`);
  console.log(`  Migrated:  ${migrated}`);
  console.log(`  Skipped:   ${skipped} (already had session_tags)`);
  console.log(`  Remapped:  ${remapped} (snake_case → dot notation)`);
  console.log(`\nTop 20 effective subtypes after migration:`);

  const sorted = Object.entries(subtypeDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  for (const [tag, count] of sorted) {
    console.log(`  ${count.toString().padStart(4)}  ${tag}`);
  }
}

migrate();
