# Handover — RuFlo Agent Patterns + Deep Enrichment Review (2026-05-06)

**Author**: Claude (Opus 4.7) at end of 2026-05-04→05 session
**Audience**: next Claude session continuing the enrichment + agent-pattern work
**Status**: enrichment loop fully drained (1275 LLM-enriched), 8 code changes shipped uncommitted, RuFlo angle opening up

---

## What this next session is for

Two threads, almost certainly the same problem:

1. **Continue the deep-enrichment review** — go back over what was tagged this session and check it carefully (esp. the things tagged programmatically, like the 98 empty ghosts). Refine taxonomy where needed.

2. **Investigate the RuFlo agent patterns** running in `~/dev/ad/apps/appyctrl/`. David has been testing a new agent pattern there for the last couple of days. He'll supply screenshots and documentation of how RuFlo works.

**The connection between them**: the 98 sessions I bulk-tagged `meta.ghost_session` in batch 4 of `orientation.quick_check` were heavy in `appyctrl` (47 of 50 in one batch). They were marked ghosts because they had `agent_initiated` opening + zero `user_prompt` events + 4-7 lifecycle events. If RuFlo is the source of these, **they're not ghosts** — they're real agent invocations that need a new classification (probably `session_kind: 'agent_run'` or a new subtype).

**Action priority on resume**:

1. Have David share the RuFlo screenshots/docs first.
2. Re-examine 5–10 of the 98 sessions tagged `meta.ghost_session` (filter `project: 'appyctrl' AND session_tags[0].tag = 'meta.ghost_session'`) — read their actual JSONL events.
3. Decide: should empty-ghost rule be split (real ghosts vs. agent runs)? Should session_kind get a new value?
4. If yes, ship the code change + backfill the 98 ghost tags before continuing other enrichment work.

---

## What was already done this session (2026-05-04→05)

### Code shipped (all green, 707 tests passing, **uncommitted**)

In `server/src/services/classifier.service.ts`:

1. **Skill-name lookup table** — `/brain-librarian` → `knowledge.brain_audit`, `/release-notes` → `knowledge.brain_maintenance`, `/omi-*` → `knowledge.omi_ingestion`, `/system-context` → `knowledge.advisory_refinement`, `/screenshot-tour` → `orientation.documentation_capture`. Runs FIRST in `detectSessionSubtype` before sessionType routing.
2. **Empty-ghost rule** — no `user_prompt` events + 2–10 events + <2 tool_use → `meta.ghost_session`. **THIS IS THE RULE THAT NEEDS REVISITING FOR RUFLO.**
3. **Single-word/test-prompt rule** — `session`, `/exit`, `/model X`, `Unknown skill: X`, `say hello`, etc. → `meta.accidental` (when ev ≤ 3).
4. **Bash-heavy commit/push rule** — `bash-heavy + has_git_outcome + commit/push prompt` → `build.shipped`.
5. **`build.iterative_design` tightened** — now requires >5 Edit/Write events alongside `agent-heavy`.
6. **Playwright disambiguation** — 4 distinct activities:
   - test files edited → `playwright_e2e`
   - `/screenshot-tour` or sequential nav+screenshot → `orientation.documentation_capture`
   - `/bmad-sat` or AC keywords → `build.user_acceptance_test`
   - clicks/screenshots without edits → `orientation.visual_inspection`
7. **`findFirstRealPrompt` skips settings-only built-ins** — `/model sonnet` alone, `/login`, `/clear` etc. as first prompt are skipped so the next real instruction wins.

In `server/src/services/subprocess-detection.service.ts` (new): 8. **Subprocess detection** — first prompt starts with `-\n`, `You are executing`, `Pre-compaction memory flush`, or matches known extraction templates → `session_kind: 'subprocess'`. Wired into `hooks.ts` at the `stop` event after `detectTeammate` runs.

In `shared/src/angeleye.ts`:

- Added 3 new subtypes: `orientation.visual_inspection`, `orientation.documentation_capture`, `build.user_acceptance_test`.
- Extended `session_kind` to include `'subprocess'`.

In `server/src/routes/sessions.ts`:

- New endpoint `POST /api/registry/llm-tags` (write-race fix — routes through `updateRegistry` queue).
- New endpoint `POST /api/registry/session-kind` (bulk session_kind updates via the same queue).

### Backfill scripts created (in `scripts/audits/`)

- `backfill-subprocess-kind.ts` — tagged 196 historical Haiku/skill subprocess rows. Already run.
- `backfill-secondary-tags.ts` — adds deterministic secondary tags for heavy/marathon single-tag rows. **NOT RUN YET** (server was down). Identifies 13 candidates: 9 `build.campaign + build.shipped`, 3 `build.feature + build.shipped`, 1 `build.campaign + knowledge.brain_capture`. Queue with `npx tsx scripts/audits/backfill-secondary-tags.ts`.

### Enrichment progress

| Metric                    | Start of session       | End of session             |
| ------------------------- | ---------------------- | -------------------------- |
| LLM-enriched              | 386 (clobber-inflated) | **1275**                   |
| Heuristic-only queue      | ~741                   | **0**                      |
| Untagged                  | 160                    | **0**                      |
| Subagent (filtered)       | 0 detected             | 273                        |
| Subprocess (filtered)     | 0 detected             | 196                        |
| Empty ghost (bulk-tagged) | 0                      | 98 ← **REVISIT FOR RUFLO** |
| Junk                      | 88                     | 88                         |

Queues drained in this order: `build.campaign` (184) → `orientation.quick_check` (200) → `orientation.codebase_exploration` (85) → `knowledge.general` (75) → `orientation.file_retrieval` (47) → `orientation.exploration` (36) → `build.bug_fix` (28) → `orientation.artifact_lookup` (25) → `build.iterative_design` (20) → `playwright_e2e` (18) → `build.shipped` (17) → `undefined` (13) → final mass-write (104).

### Memory feedback saved (auto-loads in future sessions)

`~/.claude/projects/-Users-davidcruwys-dev-ad-apps-angeleye/memory/MEMORY.md` indexes:

- `feedback_approval_phrase.md` — David uses "go" not "approve" for batch authorizations
- `feedback_enrichment_autopilot.md` — in `/loop`, write automatically each batch but show full review table; only pause on trip-wire
- `feedback_table_format_strict.md` — never compress rows; canonical 6-column format every batch (#, ID, Project, Before, After, Key signal)
- `feedback_multi_tag_classification.md` — assign secondary tags when activities overlap; expect 5–15 per 50

---

## Files of interest for the next session

**Read first**:

- `docs/planning/handover-2026-05-04-enrichment-loop.md` — yesterday's setup (still partly relevant)
- `docs/architecture/known-issues.md` — has architectural items including new `bmad-chain-grouping` and `subproject-path-missing` observations from end of session
- `.claude/skills/enrich-subtypes/SKILL.md` — the enrichment skill, already updated for port 5051 + "go" phrase + filter `subprocess`/`subagent`
- `~/dev/ad/brains/angeleye/` — full domain knowledge (workflow-model.md, observability.md)

**Code to inspect**:

- `server/src/services/classifier.service.ts` (~1100 lines, all 8 changes here)
- `server/src/services/subprocess-detection.service.ts` (new, the empty-ghost rule pattern is in classifier.service.ts not here)
- `shared/src/angeleye.ts` (schema)

**Run on resume**:

- `npm run audit:registry` — refresh diagnostics-snapshot.json
- `npx vitest run` — confirm 707 tests still pass
- (Server up?) `npx tsx scripts/audits/backfill-secondary-tags.ts` — apply the queued 13-row multi-tag backfill

---

## RuFlo investigation — concrete starting points

David has RuFlo running in `~/dev/ad/apps/appyctrl/` for the last couple of days. He'll supply screenshots and docs of how RuFlo works. Use those as the source of truth for what RuFlo IS — don't assume.

### What we already know from the registry data

Filter: `project: 'appyctrl' AND session_tags[0].tag = 'meta.ghost_session'`

**Sample IDs** to investigate (from this session's batches):

```
d3d42458, 7ee5a1bf, 818b4b0a, 38a5a69e, df91a949, 9e158786, 69501422, 5efc5ff2,
260b6572, 44b665e5, 370d16cc, 6daa097d, 91a7dacc, a904d545, 272e0a78, 11627269,
c19adb14, 65db63a3, d0bd5168, 399035d2, 561079b3, aee21982, 10c10553, 6c4abc73,
b83c182e, d0540383, 84be5954, 5fdceec0, 8a87fcce, d8284608, 8b8b7ae3, ecb52c90,
e8e9b4b4, 7856c643, 8e74ec00, 833c0503, b503daab, c795d8a0, 39606ed1, e06b1d65,
e406e21d, e54d3589, 9a149358, 43bc4ddd, 6d2cc060, 562ec887, 676c6936, 768dc274,
7d6ec58b, 1b039249, f0a34fef, 1711864b, ea068b6a, f3b0492c, 54388c4f, fb6827ff,
4c227c24, 972f80a5, c11aca6c, 9079ba23, 56210bf5, ed1a30c9, be0e5456, 46b4b30d,
7a6781ae, 91550ecf, 19f11d7e, 0d032139, 2d7d4259, 8e4dfcea
```

(Plus several outside `appyctrl` — see registry. Some non-`appyctrl` ones might be genuine ghosts.)

**Common shape (all 47 in batch 4 looked like this)**:

- `project: 'appyctrl'`
- `scale: 'micro'`
- `pattern: 'mixed'`
- `opening_style: 'agent_initiated'`
- `first_real_prompt: ''` (empty)
- `event_count`: 4–7
- `tools`: empty (no tool_use events)

### How to read a session

```bash
# See raw events for one of the IDs above
cat ~/.claude/angeleye/sessions/session-d3d42458-83b7-4ace-985a-d43a5b13ba75.jsonl
# Or fall back to archive
cat ~/.claude/angeleye/archive/session-d3d42458-83b7-4ace-985a-d43a5b13ba75.jsonl
```

The earlier inspection showed: `instructions_loaded` (CLAUDE.md, project CLAUDE.md, `/dev/ad/CLAUDE.md`), then `session_start`, then `session_end` ~6 seconds later. That's it. **No** user_prompt, **no** tool_use. Looks like a session that opened, loaded context, closed.

### Hypotheses to test (have RuFlo docs in hand first)

1. **RuFlo spawns headless agent runs that don't capture in AngelEye's hook stream**. The work is happening but the events aren't reaching us. → Audit RuFlo's invocation mechanism vs. how Claude Code emits hooks.
2. **RuFlo creates "warm-up" sessions** that load context and exit, deliberately. → These ARE ghosts in the AngelEye sense, but intentional. Should still be filtered, but tagged differently.
3. **RuFlo runs sub-instructions inside a single Claude Code session** that ingest as multiple sessions through some mechanism. → Need to look at session_id correlations.
4. **The instructions_loaded events contain RuFlo-specific context** that we could use as a detection signal.

### Suggested investigation flow

1. Read the RuFlo screenshots/docs David supplies.
2. Pick 5 representative `appyctrl` sessions across different timestamps. Read their full JSONL.
3. Compare to a known "real" `appyctrl` session if any exist (filter where `appyctrl` project has user_prompt events).
4. Decide on classification: `session_kind: 'agent_run'`? new subtype `meta.agent_warmup`? something else?
5. If new schema needed: add to `shared/src/angeleye.ts`, add classifier rule, write backfill script, run.
6. Then: continue the deeper enrichment review on other parts of the corpus.

---

## Pending decisions for David

These came up at the end of the previous session and weren't resolved:

1. **Commit the 8 code changes**? (Currently uncommitted across `classifier.service.ts`, `shared/src/angeleye.ts`, `subprocess-detection.service.ts`, hooks, routes, scripts, tests, docs.)
2. **Run the 13-row multi-tag backfill**? (Quick — `npx tsx scripts/audits/backfill-secondary-tags.ts`.)
3. **Ship `bmad-chain-grouping`**? Highest-leverage architectural move per David's note: "find BMAD lifecycle tag, then find children of that session." Story-level grouping across sessions, not session-level tags. Requires: detection + new entity type + UI surface.
4. **Ship `subproject-path-missing`**? Schema field for `brains/<sub-brain>/`. Useful but lower urgency than RuFlo investigation.

---

## Things to NOT redo

- **Don't re-run blanket enrichment** — every active session is LLM-enriched. Cost > value for routine confidence bumps.
- **Don't assume the heuristic was right** for the 98 ghosts in `appyctrl` — that's the open question.
- **Don't ship more deferred code changes without checking with David first** — pattern from this session was to log small ones and ship after explicit approval.

---

## Pattern observations to apply going forward

From end-of-session reflection (worth remembering):

1. **Audit pollution FIRST, enrich second.** Look for subprocess/ghost/automation patterns before classifying. A 10-min audit + bulk tag saves hours of LLM-classification on rubber-stamp work.
2. **Code-then-enrich, not enrich-then-code.** When 5+ sessions show the same correction, ship a code rule. Don't keep hand-tagging the same pattern.
3. **Skill-chain priors > project priors.** "BMAD lifecycle" can run in any project. The skill prefix is the durable signal, not the project name.
4. **Multi-tag is undertagged systemically** — the secondary signal often exists in predicates already (has_git_outcome, has_brain_file_writes, has_playwright_calls). Use deterministic rules, not LLM judgment, where signal is observable.
5. **The "confidence" field can carry real info** — 0.95 multiple corroborating signals, 0.85 clear primary, 0.75 primary but ambiguous, 0.65 best guess. I collapsed it during this session; better calibration next time.
