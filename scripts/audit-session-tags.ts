/**
 * Session tag audit. Read-only — never writes to registry.
 *
 * Run: npx tsx scripts/audit-session-tags.ts
 *
 * Shows:
 *   1. Confidence distribution
 *   2. Sessions needing enrichment (top tag at 0.50)
 *   3. Top tags by count
 *   4. Tag-vs-canonical-taxonomy alignment (orphans, one-offs)
 *   5. Per-project distribution for top patterns
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const REGISTRY_PATH = path.join(os.homedir(), '.claude/angeleye/registry.json');

// Canonical taxonomy — must match shared/src/angeleye.ts SessionSubtype union
const CANONICAL_TAXONOMY = new Set([
  // BUILD
  'build.feature',
  'build.shipped',
  'build.bug_fix',
  'build.refactor',
  'build.test_writing',
  'build.ci_pipeline',
  'build.campaign',
  'build.orchestrated_campaign',
  'build.multi_phase',
  'build.project_scaffolding',
  'build.visual_implementation',
  'build.worktree_campaign',
  'build.prompt_engineering',
  'build.iterative_design',
  // ORIENTATION
  'orientation.quick_check',
  'orientation.codebase_exploration',
  'orientation.file_retrieval',
  'orientation.artifact_lookup',
  'orientation.feature_exploration',
  'orientation.identity_check',
  'orientation.morning_triage',
  'orientation.bookend',
  'orientation.exploration',
  // KNOWLEDGE
  'knowledge.general',
  'knowledge.brain_capture',
  'knowledge.brain_maintenance',
  'knowledge.advisory_refinement',
  'knowledge.brain_audit',
  'knowledge.methodology_design',
  'knowledge.loom_capture',
  'knowledge.omi_ingestion',
  // RESEARCH
  'research.exploration',
  'research.technology_survey',
  'research.tool_evaluation',
  'research.conceptual_exploration',
  'research.quick_answer',
  // META
  'meta.ghost_session',
  'meta.accidental',
]);

// Generic fallback subtypes (confidence 0.50 = needs enrichment)
const FALLBACK_TAGS = new Set([
  'build.feature',
  'orientation.quick_check',
  'orientation.exploration',
  'knowledge.general',
  'research.exploration',
]);

type Session = {
  session_id: string;
  project?: string;
  is_junk?: boolean;
  session_type?: string;
  session_tags?: { tag: string; confidence: number }[];
  session_subtype?: string;
  subtype_heuristic?: string;
};

function topTag(s: Session) {
  if (!s.session_tags || s.session_tags.length === 0) return null;
  return [...s.session_tags].sort((a, b) => b.confidence - a.confidence)[0];
}

function bar(n: number, max: number, width = 40) {
  const len = Math.round((n / max) * width);
  return '█'.repeat(len);
}

function pct(n: number, total: number) {
  return ((n / total) * 100).toFixed(1) + '%';
}

function section(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

const reg: Record<string, Session> = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const allSessions = Object.values(reg).filter((s) => !s.is_junk);
const total = allSessions.length;

console.log(`\nSESSION TAG AUDIT`);
console.log(`Registry: ${REGISTRY_PATH}`);
console.log(`Total non-junk sessions: ${total}`);

// ── 1. CONFIDENCE DISTRIBUTION ────────────────────────────────────────────
section('1. CONFIDENCE DISTRIBUTION (top tag only)');

const confBuckets: Record<string, number> = {};
const confOrder = ['0.95+', '0.80–0.94', '0.70–0.79', '0.60–0.69', '0.50–0.59', 'unknown'];
confOrder.forEach((b) => (confBuckets[b] = 0));

allSessions.forEach((s) => {
  const top = topTag(s);
  if (!top) {
    confBuckets['unknown']++;
    return;
  }
  const c = top.confidence;
  if (c >= 0.95) confBuckets['0.95+']++;
  else if (c >= 0.8) confBuckets['0.80–0.94']++;
  else if (c >= 0.7) confBuckets['0.70–0.79']++;
  else if (c >= 0.6) confBuckets['0.60–0.69']++;
  else if (c >= 0.5) confBuckets['0.50–0.59']++;
  else confBuckets['unknown']++;
});

const maxConf = Math.max(...Object.values(confBuckets));
confOrder.forEach((b) => {
  const n = confBuckets[b];
  console.log(
    `  ${b.padEnd(12)} ${n.toString().padStart(5)} ${pct(n, total).padStart(6)} ${bar(n, maxConf)}`
  );
});

const enriched = total - confBuckets['0.50–0.59'] - confBuckets['unknown'];
console.log(`\n  Enriched (≥ 0.60): ${enriched} (${pct(enriched, total)})`);
console.log(
  `  Needs enrichment (≤ 0.59): ${confBuckets['0.50–0.59']} (${pct(confBuckets['0.50–0.59'], total)})`
);

// ── 2. NEEDS ENRICHMENT (BREAKDOWN) ───────────────────────────────────────
section('2. NEEDS ENRICHMENT — top tag at 0.50 confidence');

const needsByTag: Record<string, number> = {};
allSessions.forEach((s) => {
  const top = topTag(s);
  if (top && top.confidence <= 0.55) {
    needsByTag[top.tag] = (needsByTag[top.tag] ?? 0) + 1;
  }
});
const needsSorted = Object.entries(needsByTag).sort((a, b) => b[1] - a[1]);
needsSorted.forEach(([tag, n]) => {
  const flag = FALLBACK_TAGS.has(tag) ? '  ' : ' ⚠';
  console.log(`  ${n.toString().padStart(4)}${flag} ${tag}`);
});

// ── 3. TOP TAGS BY COUNT ──────────────────────────────────────────────────
section('3. TOP TAGS BY COUNT (top tag, confidence > 0.50)');

const tagCounts: Record<string, number> = {};
const tagConfSum: Record<string, number> = {};
allSessions.forEach((s) => {
  const top = topTag(s);
  if (top && top.confidence > 0.55) {
    tagCounts[top.tag] = (tagCounts[top.tag] ?? 0) + 1;
    tagConfSum[top.tag] = (tagConfSum[top.tag] ?? 0) + top.confidence;
  }
});

const tagSorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
const maxTagCount = tagSorted[0]?.[1] ?? 1;
console.log(`  ${'count'.padEnd(7)} ${'avg conf'.padEnd(10)} tag`);
console.log(`  ${'─'.repeat(7)} ${'─'.repeat(10)} ${'─'.repeat(45)}`);
tagSorted.slice(0, 25).forEach(([tag, n]) => {
  const avgConf = (tagConfSum[tag] / n).toFixed(2);
  const inCanon = CANONICAL_TAXONOMY.has(tag) ? '  ' : ' ⚠';
  const barStr = bar(n, maxTagCount, 30);
  console.log(`  ${n.toString().padStart(5)}  ${avgConf.padEnd(8)} ${tag}${inCanon}  ${barStr}`);
});
if (tagSorted.length > 25) console.log(`  ... and ${tagSorted.length - 25} more tags`);

// ── 4. CANONICAL TAXONOMY ALIGNMENT ───────────────────────────────────────
section('4. CANONICAL TAXONOMY ALIGNMENT');

const tagsInData = new Set(Object.keys(tagCounts));
const orphanTags = [...tagsInData].filter((t) => !CANONICAL_TAXONOMY.has(t));
const unusedCanonical = [...CANONICAL_TAXONOMY].filter((t) => !tagsInData.has(t));

console.log(`  Canonical taxonomy size: ${CANONICAL_TAXONOMY.size}`);
console.log(`  Distinct tags in data:   ${tagsInData.size}`);
console.log(`  Orphan tags (in data, not canonical): ${orphanTags.length}`);
console.log(`  Unused canonical (in taxonomy, no data): ${unusedCanonical.length}\n`);

if (orphanTags.length > 0) {
  console.log(`  ORPHAN TAGS (consider migrating or adding to canon):`);
  orphanTags
    .map((t) => [t, tagCounts[t]] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => {
      const note = n === 1 ? ' (one-off)' : n <= 3 ? ' (rare)' : '';
      console.log(`    ${n.toString().padStart(4)}  ${t}${note}`);
    });
}

if (unusedCanonical.length > 0) {
  console.log(`\n  UNUSED CANONICAL TAGS:`);
  unusedCanonical.forEach((t) => console.log(`    ${t}`));
}

// ── 5. ONE-OFFS AND RARE TAGS ─────────────────────────────────────────────
section('5. ONE-OFFS & RARE TAGS (≤ 3 occurrences)');

const rareTags = tagSorted.filter(([, n]) => n <= 3);
console.log(
  `  Total rare tags: ${rareTags.length} (across ${rareTags.reduce((a, b) => a + b[1], 0)} sessions)`
);
console.log(`  These are candidates for consolidation, retirement, or promotion to canonical.\n`);
rareTags.forEach(([tag, n]) => {
  const inCanon = CANONICAL_TAXONOMY.has(tag) ? '  ' : ' ⚠';
  console.log(`    ${n}${inCanon} ${tag}`);
});

// ── 6. PROJECT × TOP TAG ───────────────────────────────────────────────────
section('6. PROJECT BREAKDOWN — top 3 tags per project');

const byProject: Record<string, Record<string, number>> = {};
allSessions.forEach((s) => {
  const proj = s.project ?? 'unknown';
  const top = topTag(s);
  if (!top || top.confidence <= 0.55) return;
  if (!byProject[proj]) byProject[proj] = {};
  byProject[proj][top.tag] = (byProject[proj][top.tag] ?? 0) + 1;
});

const projTotals = Object.entries(byProject)
  .map(([p, tags]) => [p, Object.values(tags).reduce((a, b) => a + b, 0)] as [string, number])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

projTotals.forEach(([proj, projTotal]) => {
  const tags = byProject[proj];
  const top3 = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  console.log(`\n  ${proj} (${projTotal} enriched sessions)`);
  top3.forEach(([t, n]) => {
    console.log(`    ${n.toString().padStart(4)}  ${pct(n, projTotal).padStart(6)}  ${t}`);
  });
});

// ── 7. HEURISTIC vs LLM DISAGREEMENT ──────────────────────────────────────
section('7. HEURISTIC vs LLM TAG DISAGREEMENT (where rules and LLM diverge)');

type Disagreement = { heur: string; llm: string; conf: number };
const disagreements: Disagreement[] = [];
const pairCounts: Record<string, number> = {};
let withBoth = 0;
let agreeing = 0;

allSessions.forEach((s) => {
  const top = topTag(s);
  const heur = s.subtype_heuristic;
  if (!top || !heur) return;
  withBoth++;
  if (top.tag === heur) {
    agreeing++;
    return;
  }
  // LLM tag must be confident enough to count as a real disagreement
  if (top.confidence <= 0.55) return;
  const key = `${heur}  →  ${top.tag}`;
  pairCounts[key] = (pairCounts[key] ?? 0) + 1;
  disagreements.push({ heur, llm: top.tag, conf: top.confidence });
});

console.log(`  Sessions with both signals: ${withBoth}`);
console.log(`  Heuristic and LLM agree:    ${agreeing} (${pct(agreeing, withBoth)})`);
console.log(`  Disagreements (LLM conf > 0.55): ${disagreements.length}`);

if (disagreements.length > 0) {
  console.log(`\n  TOP DISAGREEMENT PAIRS (heuristic → LLM):`);
  Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([pair, n]) => console.log(`    ${n.toString().padStart(4)}  ${pair}`));
}

// ── 8. SUMMARY VERDICT ────────────────────────────────────────────────────
section('8. SUMMARY');

console.log(`  ✓ Total sessions: ${total}`);
console.log(`  ✓ Enriched (conf > 0.55): ${enriched} (${pct(enriched, total)})`);
console.log(
  `  ⏳ Awaiting enrichment: ${confBuckets['0.50–0.59']} (${pct(confBuckets['0.50–0.59'], total)})`
);
console.log(`  ⚠ Orphan tags (not in canon): ${orphanTags.length}`);
console.log(`  ⚠ Rare tags (≤ 3 sessions): ${rareTags.length}`);

const overrepThreshold = total * 0.15;
const overrep = tagSorted.filter(([, n]) => n > overrepThreshold);
if (overrep.length > 0) {
  console.log(`\n  ⚠ Possibly overrepresented tags (> 15% of all sessions):`);
  overrep.forEach(([t, n]) => console.log(`    ${n}  ${pct(n, total)}  ${t}`));
  console.log(`     → Consider whether these need sub-tagging.`);
}
