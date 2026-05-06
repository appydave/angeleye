# Handover — Enrichment Loop, 2026-05-04 Evening

**Author**: Claude (Opus 4.7)
**Audience**: the next Claude session resuming this work
**Status**: paused mid-loop, write-race bug fixed, ready to resume

---

## TL;DR for the next session (under 2 minutes)

1. Read this whole doc — every section matters, none of it is filler.
2. Open `/diagnostics` in the running AngelEye app (port 5050). Confirm it loads.
3. Run `npm run audit:registry` to refresh the snapshot.
4. Resume enrichment with `/loop /enrich-subtypes 50 build.campaign` — the write-race fix is live, so this is now safe to run on autopilot.
5. After the build.campaign queue empties, work the rest in this order: `orientation.quick_check` → `knowledge.general` → `orientation.codebase_exploration` → `orientation.file_retrieval` → `orientation.exploration` → specific subtypes last.

If anything in steps 1–4 doesn't match reality, **stop and audit before continuing**.

---

## What we set out to do today

Mass-enrich AngelEye's session registry by running LLM classification (this skill) over rows the deterministic heuristic couldn't classify sharply. Started at 232 LLM-enriched, target was full corpus.

## What we actually discovered (the real story)

### 1. The brain doc on subagents was wrong

`~/dev/ad/brains/anthropic-claude/claude-code/observability.md` claimed subagents live in `agent-*.jsonl` files with `isSidechain: true`. Audited the corpus: **0 such files, 0 such entries** across 1,378 JSONLs / 279,348 events.

**Reality**: Anthropic's Agent Teams feature (Opus 4.6) spawns subagents into normal `.jsonl` files in the same project directory, marked with a `<teammate-message teammate_id="...">` XML wrapper inside the first user message body. **454 of 1,378 files (33%) are subagents** by this signal. All currently have `teammate_id="team-lead"`.

Brain doc updated to document both mechanisms with verification status. **Future investigations: audit before assuming a mechanism.**

### 2. 1,555 phantom registry rows existed

Registry had 2,623 rows; only 1,068 had a JSONL on disk. Of the 1,555 missing, 761 had AngelEye archived event streams (data preserved upstream pruning by Claude Code), 794 had nothing anywhere (true phantoms).

**Outcome**: 794 dropped, 761 restored. Registry now 1,829.

### 3. `is_junk` heuristic was misleading

Of the 444 prior `is_junk: true` rows, 433 were phantoms. The heuristic had effectively become "JSONL no longer exists" rather than "session was junk content." After cleanup, `is_junk` count is 88 (real junk).

### 4. The write-race bug (the big one — fixed late evening)

**Symptom**: same 6 sessions appearing as candidates in batch N+1 immediately after we wrote them in batch N. Three confirmed cases (f0a2a451, 5648cb84, 21c960c4) early on; later batch 15 started with 6 of the same sessions from batch 14, proving it was widespread.

**Cause**: The enrichment skill's Step 4 wrote `registry.json` directly via `fs.writeFileSync`. Meanwhile, AngelEye's hook server (handling events from David's _current_ Claude Code session) reads → modifies one row → writes the whole file back through `registry.service.ts updateRegistry`. The two write paths race. Hook reads stale → writes back → my LLM tags vanish.

**Fix (live)**: Added `POST /api/registry/llm-tags` to `server/src/routes/sessions.ts`. It accepts `{changes: [{id, tags}]}` and routes each through `updateRegistry`, sharing the serialised write queue with hooks. The skill's Step 4 now `curl`s the endpoint instead of writing the file. Direct file writes are forbidden going forward.

**Implication**: an unknown fraction of LLM tags from batches 7–14 are clobbered. Reported "LLM-enriched: 386" is overstated. Re-running those subtype queues through the new endpoint will surface the clobbered rows for re-tagging — they show up as un-LLM-enriched candidates again. **Task #34 tracks the audit.**

### 5. Other discoveries

- **Brains is a 70-brain monorepo**, not one project. Sessions tagged `project: brains` are working in different sub-brains. Need a `subproject_path` field eventually.
- **Rabbit hole syndrome**: David's daily pattern is starting one task → spawning many sessions → ending the day with a tree of explorations. Linear `predecessor/successor` modelling won't scale; need tree topology.
- **`/appydave:system-context` ≠ `build.campaign`**: it's a context-refresh skill, should be `knowledge.advisory_refinement`. Same logic for `/brand-dave:refresh-*` skills (brain_maintenance) and `/brain-librarian` (brain_audit).
- **Project field corruption**: session bac6c10f has `project: '{"continue":true}'` — JSON snippet leaked into project name during ingest. Task #33 tracks the fix.
- **310 orphan JSONLs** on disk weren't ingested (mostly archon-workspaces — David archived the archon dirs; 282 non-archon orphans remain). Task #29.

---

## Where things sit right now

### Registry state (last known)

- Total rows: 1,829
- LLM-enriched (reported): 386 — but **inflated by clobbering**, real number is lower
- build.feature queue: 0 (worked to completion)
- build.campaign queue: ~184 reported, but ~6+ per past batch were silently lost; expect re-surfacing

### Code changes landed today

- `shared/src/angeleye.ts` — added `session_kind`, `teammate_id` fields
- `server/src/routes/hooks.ts` — Mechanism B detection at SessionStart and Stop
- `server/src/services/teammate-detection.service.ts` — new file, `<teammate-message>` regex scanner with archive fallback
- `server/src/routes/diagnostics.ts` — new endpoint for the Diagnostics view
- `server/src/routes/sessions.ts` — **NEW**: `POST /api/registry/llm-tags` (the write-race fix)
- `server/src/index.ts` — wired diagnosticsRouter
- `client/src/views/DiagnosticsView.tsx` — new view, plain-English labels
- `client/src/components/ContentPanel.tsx`, `client/src/config/nav.ts` — wired into nav
- `scripts/audits/registry-health.ts` — versioned audit script
- `scripts/audits/backfill-session-kind.ts` — versioned backfill script
- `package.json` — `npm run audit:registry`, `npm run audit:backfill-session-kind`
- `.claude/skills/enrich-subtypes/SKILL.md` — filter excludes subagents + already-LLM, Step 4 uses the new endpoint

### Docs landed today

- `docs/architecture/classifier-observations.md` — 7 sections of classifier insights
- `docs/architecture/known-issues.md` — open + resolved data-quality issues with verification scripts
- `docs/planning/handover-2026-05-04-enrichment-loop.md` — this doc
- `~/dev/ad/brains/anthropic-claude/claude-code/observability.md` — corrected subagent docs
- `STEERING.md` — running session log

### Tasks (live)

Pending tasks: #29 (orphans), #31 (resume enrichment with main filter — superseded by /loop), #33 (corrupted project field), #34 (audit clobbered tags).
Completed today: #14, #15, #16, #17, #18, #19, #20, #21, #22, #23, #24, #25, #26, #27, #28, #30, #32.

---

## What to do next session — concrete actions

### Step 0 — Sanity checks (5 min)

1. Confirm AngelEye server is running (`overmind ps` or open http://localhost:5050). If not, `overmind start` from repo root.
2. Open `/diagnostics` in the browser. Verify the "At a glance" panel shows numbers consistent with the registry state above. If wildly different, run `npm run audit:registry` and re-check.
3. Run `git status` — there should be uncommitted changes from today. Don't commit yet; we want to verify the loop works first.

### Step 1 — Verify the write-race fix is live (5 min)

Test the new endpoint with one row:

```bash
curl -sS -X POST http://localhost:5051/api/registry/llm-tags \
  -H 'Content-Type: application/json' \
  -d '{"changes":[{"id":"<pick-any-build.campaign-id>","tags":[{"tag":"build.campaign","confidence":0.95}]}]}' | jq .
```

Expected: `{"status":"ok","data":{"written":1,"missing":[],"total":1}}`. Then read the registry and confirm the row has `source: 'llm'` on its tag. Wait 60 seconds (let hooks fire on ambient activity) and re-read. Tag should still be there.

If the tag is **gone after 60 seconds**, the fix didn't work — investigate before resuming the loop.

### Step 2 — Audit clobbered tags from earlier batches (10 min)

Quick sanity:

```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const reg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude/angeleye/registry.json'), 'utf8'));
let llm = 0, heuristicOnly = 0, none = 0;
Object.values(reg).forEach(s => {
  if (s.session_kind === 'subagent' || s.is_junk) return;
  const tags = s.session_tags || [];
  if (tags.some(t => t.source === 'llm')) llm++;
  else if (tags.some(t => t.source === 'heuristic_only')) heuristicOnly++;
  else none++;
});
console.log('Main, non-junk:', llm + heuristicOnly + none);
console.log('LLM-enriched:', llm);
console.log('Heuristic only:', heuristicOnly);
console.log('Untagged:', none);
"
```

The "LLM-enriched" number is the real count. If it's significantly below 386, the clobbering was substantial.

### Step 3 — Resume the loop (autonomous, 30–60 min)

```
/loop /enrich-subtypes 50 build.campaign
```

Watch for:

- Trip-wire failures (top tag >40% on moved rows — means a new pattern is being missed)
- Same row re-appearing in consecutive batches (write didn't persist — escalate)
- Project field corruption (`project: '{"continue":true}'` style) — already known, just classify and move on

Stop the loop when build.campaign empties. Do not chain to next subtype automatically — let David choose.

### Step 4 — Move to next subtype queue

Recommended order (per `classifier-observations.md` §loop-3):

1. `orientation.quick_check` (~428 rows) — highest learning yield, lots of meta.accidental / meta.ghost_session candidates hidden in here
2. `knowledge.general` (~75 rows)
3. `orientation.codebase_exploration` (~85 rows) — should be mostly correct already
4. `orientation.file_retrieval` (~47)
5. `orientation.exploration` (~39)
6. specific subtypes (build.bug_fix, build.refactor, etc.) — these are usually right; low yield

Each queue: same `/loop /enrich-subtypes 50 <target>` pattern.

### Step 5 — Apply the captured heuristics to code (when you've got time)

These patterns surfaced during enrichment and should become deterministic rules in `server/src/services/classifier.service.ts`:

| Skill / opening                                                                    | Tag                                |
| ---------------------------------------------------------------------------------- | ---------------------------------- |
| `/appydave:system-context`                                                         | `knowledge.advisory_refinement`    |
| `/brand-dave:refresh-*`                                                            | `knowledge.brain_maintenance`      |
| `/brain-librarian`                                                                 | `knowledge.brain_audit`            |
| `/appydave:bmad-story-lifecycle <N.M>`                                             | `build.campaign` (high confidence) |
| `/appydave:ralphy`                                                                 | `build.campaign` (high confidence) |
| `/focus <name>`                                                                    | `build.campaign` (high confidence) |
| `/bmad-retro-quiet`, `/bmad-sm`, `/bmad-dev`, `/bmad-dr`, `/bmad-sat`, `/bmad-lib` | `build.campaign`                   |

Promote these into a skill-name → tag lookup table in `detectSessionSubtype()`. Already 4 batches of evidence behind each one.

---

## What NOT to do

1. **Do not write `registry.json` directly** — anywhere, ever. Use the API endpoint. The skill's Step 4 is updated; if you find another script doing direct writes, fix it.
2. **Do not skip the trip-wire check** — even on auto-approve. If a single tag appears on >40% of _moved_ rows, pause and investigate.
3. **Do not delete phantom backups** — `registry.json.bak-pre-*` files are forensic evidence for the clobber audit.
4. **Do not enable the loop without verifying Step 1** — the write-race fix is unproven until you test it.

---

## Lessons captured (for permanent reference)

1. **Audit corpus before trusting any brain doc claim.** The sidechain mechanism doc was wrong for our environment. Always verify.
2. **Trip-wire metrics catch shoehorning.** When 78% of batch 6 went to `build.campaign`, that should have stopped me. Now it's structural — every batch checks `top tag concentration on moved rows`.
3. **Hooks are concurrent writers.** Anything that touches `registry.json` outside the server's `updateRegistry` queue is unsafe. The serialised queue is the contract.
4. **`is_junk` accumulation hides data quality drift.** Periodic audits should re-evaluate junk against current heuristics, not trust historical flags.
5. **The diagnostics view is the early-warning system.** Open it before each batch, not after problems appear. The "at a glance" line is designed for 3-second reads.
6. **Project context is a strong classification signal.** `appydave-plugins` sessions are nearly always `build.prompt_engineering`; `app.supportsignal.com.au` sessions are usually `build.campaign` (BMAD lifecycle); `brains` sessions are knowledge work. Use this in heuristics.
7. **Skill name in opening prompt is decisive.** `/appydave:ralphy` is unambiguous. Build a skill-name lookup table — it would resolve 60%+ of build.campaign queue without LLM cost.
8. **Subagents inherit `cwd` from parent.** A subagent spawned from `kiros-sentinal` shows `project: kiros-sentinal` even though the work is "leg 17 of orchestration." Project attribution alone is misleading for subagents.
9. **The classifier is correct most of the time.** When LLM enrichment confirms 90%+ of a queue, that's a signal the heuristic is working — not that LLM enrichment is redundant. The 10% disagreement is where the value is.

---

## Files to read on next session-start

In order:

1. `STEERING.md` — current direction
2. `docs/architecture/known-issues.md` — what's broken
3. `docs/architecture/classifier-observations.md` — accumulated insights
4. This file — handover
5. `~/dev/ad/brains/anthropic-claude/claude-code/observability.md` §Sub-Agent Sessions — for context on subagent mechanism

CLAUDE.md files in this project already link to all the above.
