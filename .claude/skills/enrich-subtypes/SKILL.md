---
name: enrich-subtypes
description: Review and refine generic session classifications in batches. Targets sessions with fallback defaults (build.feature, orientation.quick_check, knowledge.general, etc.) and proposes specific session_tags with confidence scores.
---

<skill-instructions>

# Enrich Subtypes — Review Mode

Classify sessions by writing `session_tags: [{tag, confidence}]` sorted descending by confidence. The top tag IS the effective subtype — `session_subtype` is derived from it.

<!-- DATA: skill.enrichment_targets
     See docs/architecture/data-driven-extraction.md §9.
     Valid targets and the taxonomy reference below duplicate shared/src/angeleye.ts.
     When extracted, both should read from the same canonical config. -->

## Arguments

- First argument: batch size (default: 50)
- Second argument: target to refine (default: `build.feature`)
  - Valid targets: `build.feature`, `orientation.quick_check`, `knowledge.general`, `orientation.exploration`, `research.exploration`

Example: `/enrich-subtypes 50 build.feature`

---

## Step 1 — Extract batch

```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const BATCH = parseInt(process.env.BATCH || '30');
const TARGET = process.env.TARGET || 'build.feature';
const regPath = path.join(os.homedir(), '.claude/angeleye/registry.json');
const sessDir = path.join(os.homedir(), '.claude/angeleye/sessions');
const archDir = path.join(os.homedir(), '.claude/angeleye/archive');

const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));

function effectiveSubtype(s) {
  if (s.session_tags && s.session_tags.length > 0) {
    return [...s.session_tags].sort((a,b) => b.confidence - a.confidence)[0].tag;
  }
  return s.session_subtype;
}

// Filter rules:
//   - matches the target subtype (e.g., build.feature)
//   - not flagged junk
//   - not an Agent Teams subagent (session_kind: 'subagent') — these are legs of a parent
//     campaign and should be classified relative to their parent, not standalone.
//     See docs/architecture/known-issues.md#subagent-detection.
//   - not a headless skill subprocess (session_kind: 'subprocess') — single-shot
//     Haiku/sub-LLM invocations from skills like omi-extract-haiku. Recorded as
//     primary sessions because they don't carry a teammate-message wrapper, but
//     they aren't real user sessions. See known-issues.md#subprocess-session-mechanism-3.
//   - not already LLM-enriched (any tag with source === 'llm') — those have been considered
//     and either kept at build.feature with confidence bump or moved elsewhere; either way,
//     they're done. Re-running would just churn the same rows.
const candidates = Object.values(reg)
  .filter(s =>
    effectiveSubtype(s) === TARGET &&
    !s.is_junk &&
    s.session_kind !== 'subagent' &&
    s.session_kind !== 'subprocess' &&
    !(s.session_tags && s.session_tags.some(t => t.source === 'llm'))
  )
  .slice(0, BATCH);

function readEvents(id) {
  for (const dir of [sessDir, archDir]) {
    const f = path.join(dir, 'session-' + id + '.jsonl');
    try {
      return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);
    } catch {}
  }
  return [];
}

const result = candidates.map(s => {
  const events = readEvents(s.session_id);
  const toolUses = events.filter(e => e.event === 'tool_use');
  const toolCounts = {};
  toolUses.forEach(e => { toolCounts[e.tool] = (toolCounts[e.tool]||0)+1; });
  const editedFiles = toolUses
    .filter(e => ['Edit','Write','MultiEdit'].includes(e.tool) && e.tool_summary?.file)
    .map(e => e.tool_summary.file).slice(0, 5);
  const promptEvents = events.filter(e => e.event === 'user_prompt');
  const prompts = promptEvents.map(e => (e.prompt || '').slice(0, 120)).filter(Boolean).slice(0, 3);
  return {
    id: s.session_id,
    project: s.project,
    session_type: s.session_type,
    session_scale: s.session_scale,
    tool_pattern: s.tool_pattern,
    delegation_style: s.delegation_style,
    opening_style: s.opening_style,
    closing_style: s.closing_style,
    first_real_prompt: s.first_real_prompt,
    existing_tags: s.session_tags || [],
    predicates: {
      has_brain_file_writes: s.has_brain_file_writes,
      has_git_outcome: s.has_git_outcome,
      has_task_orchestration: s.has_task_orchestration,
      has_parallel_subagent_bursts: s.has_parallel_subagent_bursts,
      has_skill_created: s.has_skill_created,
      has_skill_modified: s.has_skill_modified,
      has_web_research: s.has_web_research,
      has_playwright_calls: s.has_playwright_calls,
    },
    event_count: events.length,
    tool_counts: toolCounts,
    edited_files: editedFiles,
    prompts: prompts,
  };
});

console.log(JSON.stringify(result, null, 2));
" BATCH=$BATCH TARGET=$TARGET
```

---

## Step 2 — Classify

For each session, assign `session_tags` as an array of `{tag, confidence}` objects sorted descending.

**Confidence guidelines:**

- `0.95` — unambiguous signal (ghost session, skill invocation, explicit scaffolding prompt)
- `0.85` — strong signal from first_real_prompt + corroborating predicates
- `0.75` — good fit, one signal confirms
- `0.60` — secondary activity, weaker signal (add as 2nd tag)
- Below `0.60` — exclude (noise)

**When a session has two distinct activities**, add both as tags:

- Primary (higher confidence) → becomes effective subtype
- Secondary (0.60–0.70) → adds context without overriding primary

**Key signals to read:**

- `first_real_prompt` — strongest signal
- `tool_pattern` — what tools dominated
- `predicates` — boolean flags
- `edited_files` — file paths reveal domain (test files, UI components, brain files, SKILL.md)
- `session_scale` + `closing_style` — micro + abrupt_abandon = quick/accidental
- `project` — context for what work is likely

---

### Taxonomy — dot notation only

**BUILD**
| Tag | When |
|-----|------|
| `build.campaign` | /skill invocation OR task_orchestration + parallel_bursts |
| `build.orchestrated_campaign` | agent-heavy + task_orchestration, no parallel bursts |
| `build.multi_phase` | session spans multiple distinct work phases |
| `build.project_scaffolding` | scaffold/init/setup prompt, creates file structure |
| `build.visual_implementation` | UI/CSS/Tailwind edits, component work |
| `build.worktree_campaign` | worktree in file paths or prompt |
| `build.prompt_engineering` | edits to SKILL.md, CLAUDE.md, prompt files |
| `build.shipped` | edit-heavy + git outcome, clear feature shipped |
| `build.bug_fix` | fix/bug/broken in prompt or edit targets |
| `build.refactor` | refactor/rename/extract in prompt |
| `build.test_writing` | majority of edits are .test.ts/.spec files |
| `build.ci_pipeline` | CI/deploy/pipeline edits, bash-heavy |
| `build.feature` | generic — use when nothing specific fires |

**ORIENTATION**
| Tag | When |
|-----|------|
| `meta.accidental` | micro + no real tool use + abrupt_abandon — wrong window |
| `meta.ghost_session` | near-zero events, nothing happened |
| `orientation.identity_check` | prompt asks who Claude is, what project |
| `orientation.morning_triage` | first prompt about what to work on today |
| `orientation.bookend` | opening/closing bookend around another session |
| `orientation.feature_exploration` | exploring how a specific feature works |
| `orientation.file_retrieval` | clearly just fetching a known file |
| `orientation.artifact_lookup` | looking for config, credential, or specific output |
| `orientation.codebase_exploration` | broad read of codebase, read-heavy |
| `orientation.quick_check` | micro/light brief lookup — generic fallback |

**KNOWLEDGE**
| Tag | When |
|-----|------|
| `knowledge.brain_capture` | capturing new findings for first time |
| `knowledge.brain_maintenance` | updating/reorganising existing brain files |
| `knowledge.advisory_refinement` | editing CLAUDE.md, skills, prompt docs |
| `knowledge.brain_audit` | auditing brain structure, planning organisation |
| `knowledge.methodology_design` | designing a process, workflow, or method |
| `knowledge.loom_capture` | processing Loom/video transcript |
| `knowledge.omi_ingestion` | OMI wearable transcript processing |
| `knowledge.general` | miscellaneous knowledge — generic fallback |

**RESEARCH**
| Tag | When |
|-----|------|
| `research.technology_survey` | websearch-heavy, evaluating tools/libraries |
| `research.tool_evaluation` | comparing specific tools or approaches |
| `research.conceptual_exploration` | exploring ideas, no specific deliverable |
| `research.quick_answer` | short session, specific question answered |
| `research.exploration` | general research — generic fallback |

---

## Step 3 — Present review table

```
## Enrich Subtypes — Batch Review

Target: build.feature | Batch: 50 | Changes: N

| # | ID | Project | Before | After | Key signal |
|---|----|---------|--------|-------|------------|
| 1 | abc12345 | angeleye | build.feature (0.50) | build.campaign (0.85) | /skill invocation + parallel bursts |
| 2 | def67890 | flivideo | build.feature (0.50) | build.shipped (0.85) + build.visual_implementation (0.65) | UI edits + git commit |
| 3 | ghi11223 | signal-studio | build.feature (0.50) | build.feature (0.75) | keep — no sharper signal, bumped confidence |
...

**Keep (no write)**: N — sessions already llm-enriched or no signal above 0.70
**Refine**: N sessions

Say **go** to write all N changes, or call out IDs to skip/correct.
```

Show all sessions including keeps. Flag any low-confidence classifications explicitly.

---

## Step 4 — Write back on go

**Critical**: do NOT write `registry.json` directly — that races with hook events and gets clobbered. Use the AngelEye API endpoint, which queues writes through the same serialised path that hooks use. See `docs/architecture/known-issues.md#registry-write-race`.

Replace `CHANGES_JSON` with the actual array, then run:

```bash
curl -sS -X POST http://localhost:5051/api/registry/llm-tags \
  -H 'Content-Type: application/json' \
  -d "$(cat <<'EOF'
{"changes": CHANGES_JSON}
EOF
)" | jq .
```

If the AngelEye server isn't running, start it (`overmind start` from the repo root) before writing. Direct `fs.writeFileSync(registry.json)` is forbidden — every batch we tried that way lost ~6–12 rows to the hook race.

The `changes` array format:

```json
[
  {
    "id": "abc12345-full-uuid",
    "tags": [
      { "tag": "build.shipped", "confidence": 0.85 },
      { "tag": "build.visual_implementation", "confidence": 0.65 }
    ]
  }
]
```

Only include sessions where tags change. Skip sessions marked as keep (—).

After writing, report: how many updated, new distribution of top tags across the batch.

---

## Notes

- **session_subtype is derived**: always computed as `session_tags[0].tag` after sorting by confidence desc
- **Keep threshold**: if no tag scores above 0.70, keep the existing classification
- **Skip junk**: if a session looks like junk but `is_junk` is false, note it but don't classify — separate task
- **Session IDs**: use first 8 characters in table, full UUID in write-back

</skill-instructions>
