# Handover: 2026-05-06 — Workflow Enrichment Plan

**Project**: AngelEye (Claude Code session observability)
**Session date**: 2026-05-06
**Supersedes**: handover-2026-05-06-ruflo-deep-enrichment.md

---

## State at handover

Two sessions of classifier work are complete. Enrichment queues are drained (1275 LLM-enriched sessions). The strategic gap: BMAD, Ralphy, and RuFlo sessions have never been LLM-enriched with the current taxonomy. Without this, the workflow view has no meaningful data.

Backfill scripts are running at handover time — verify they completed before starting new work.

---

## What was done this session

### Commit b19311ba — 8 classifier rules (were uncommitted from previous session)

- Skill-name lookup table, subprocess detection, empty-ghost rule, single-word test-prompt, bash-heavy commit, iterative_design tighten, Playwright disambiguation, findFirstRealPrompt fix
- New service: `subprocess-detection.service.ts` (196 historical haiku rows backfilled)
- New endpoints: `POST /api/registry/llm-tags`, `POST /api/registry/session-kind`
- New: DiagnosticsView, 5 audit scripts, enrich-subtypes skill

### Commit 652f5d61 — RuFlo detection + ghost/probe split + Ralphy subtype

- **Ghost rule bug fixed**: 59 k-lars subprocess sessions incorrectly ghost-tagged — subprocess guard added
- **meta.ghost_session split into two subtypes**:
  - `meta.ghost_session`: human opened a session, did nothing
  - `meta.scheduled_probe`: scheduler spawned with no prompt, lifecycle-only events ≤7
- `has_ruflo_context` predicate: detects `CLAUDE.local.md` or `.appydave/*` in `instructions_loaded` events
- `subagent_start_count` predicate
- New subtypes added: `build.ruflo_orchestrator`, `build.bmad_orchestrator` (schema only, LLM assigns), `build.ralphy_campaign`, `meta.scheduled_probe`
- `classifySession` now accepts `sessionKind` param
- 710 tests passing

---

## RuFlo investigation findings

RuFlo is a config layer, not AI. 98 agents are role templates. Nothing runs autonomously.

The appyctrl probe sessions (116 tagged as ghost) are scheduled Claude invocations with no prompt — NOT RuFlo doing autonomous work. They run at ~5 min intervals, 5-6 second lifetime, lifecycle events only.

Real RuFlo sessions load `CLAUDE.local.md` + `.appydave/*` in addition to the standard CLAUDE.md trio.

**4 RuFlo session shapes:**

1. Probe — lifecycle only (now correctly → `meta.scheduled_probe`)
2. Sequential — Phase 1, one agent, no subagent_start
3. Fan-out orchestrator — Phase 2/3, multiple subagent_starts
4. Research leg — read-heavy, may compact, feeds into coder agents

RuFlo subagents appear in AngelEye as Mechanism B teammate sessions — they are NOT invisible.

---

## Ghost session breakdown (218 total tagged)

| Project       | Count | Correct tag                        | Action                       |
| ------------- | ----- | ---------------------------------- | ---------------------------- |
| appyctrl      | 116   | `meta.scheduled_probe`             | fix-scheduled-probe-tags.ts  |
| k-lars        | 59    | remove `meta.ghost_session`        | fix-subprocess-ghost-tags.ts |
| supportsignal | 13    | `meta.ghost_session` (likely real) | leave                        |
| brains        | 10    | `meta.ghost_session` (likely real) | leave                        |
| angeleye      | 2     | `meta.ghost_session` (real)        | leave                        |
| other         | ~18   | `meta.ghost_session` (likely real) | leave                        |

---

## Backfill scripts running at handover

David is running these now. Verify before starting new work:

1. `scripts/audits/fix-subprocess-ghost-tags.ts` — remove `meta.ghost_session` from 59 k-lars subprocess sessions
2. `scripts/audits/fix-scheduled-probe-tags.ts` — retag 116 appyctrl ghost → `meta.scheduled_probe`
3. `scripts/audits/backfill-secondary-tags.ts` — 13-row multi-tag backfill (pending from last session)

---

## The strategic gap

All enrichment queues are drained (1275 LLM-enriched). But the sessions that matter most for workflow understanding have never been LLM-enriched with the current taxonomy:

**BMAD**: 92 sessions enriched months ago, but taxonomy has changed significantly. The orchestrator/agent distinction didn't exist then. BMAD chains (story groupings) are the foundation of the workflow model. Without fresh enrichment, chain groupings have nothing to anchor to.

**Ralphy**: Zero LLM enrichment ever. We have the `build.ralphy_campaign` subtype now but no understanding of what Ralphy sessions contain — topic, scale, content pipelines vs research vs campaigns.

**RuFlo**: Zero LLM enrichment ever. Can now detect them via `has_ruflo_context` but haven't looked at what work they actually did.

**Workflow consequence**: The workflow view depends on understanding which sessions are orchestrators vs agents vs UAT vs knowledge capture. Without enrichment on these families, the pipeline visualization shows structure without meaning.

---

## Next session priorities

### Step 0 — Confirm backfill ran cleanly (5 min)

```bash
# Check appyctrl sessions now show meta.scheduled_probe
curl -s http://localhost:5051/api/sessions?limit=10 | python3 -c "import sys,json; d=json.load(sys.stdin); print([s.get('session_subtype') for s in d['data']['sessions'] if s.get('project')=='appyctrl'][:5])"

npm run audit:registry
```

Expected: appyctrl rows show `meta.scheduled_probe`, not `meta.ghost_session`. k-lars subprocess rows have no ghost tag.

---

### Step 1 — BMAD targeted enrichment pass (highest priority)

**Filter**: sessions where `workflow_role IS NOT NULL` OR `trigger_command LIKE '/bmad-%'`

The enrich-subtypes skill filters by subtype queue name. For BMAD you need a predicate filter. Two options:

- Modify the skill to accept a `--filter` flag (see Step below on skill tweak)
- Or extract BMAD session IDs manually and pass as a list

**What to look for in LLM review:**

- Is this the orchestrator session (Swagger/lead) or an agent session (Bob, Nate, Amelia, etc.)?
- Which story does it belong to? (story ID in `trigger_arguments`)
- What station is it? (WN, CS, DS, DR, SAT, LIB, SHIP)
- Orchestrator → `build.bmad_orchestrator`; agent leg → keep `build.campaign` with overlay?

---

### Step 2 — Ralphy targeted enrichment pass

**Filter**: sessions where `first_real_prompt LIKE '/ralphy%'` OR `first_real_prompt LIKE '/appydave:ralphy%'`

These will have heuristic tag `build.ralphy_campaign`. LLM review should:

- Confirm the tag or correct it
- Capture: what kind of Ralphy run? Content pipeline? Research? Campaign coordination?
- Note scale and what was actually produced

---

### Step 3 — RuFlo targeted enrichment pass

**Filter**: sessions where `project = 'appyctrl'` AND `session_kind != 'subprocess'` AND `subtype_heuristic != 'meta.scheduled_probe'`

**Read this session first**: `~/.claude/angeleye/sessions/session-a6fde96f-eef3-4ada-a1c4-2c3a285bb2fe.jsonl`

This is the Phase 3 fan-out session (researcher + 2 coders). It's the most complete RuFlo example in the corpus.

LLM review should distinguish:

- Probe sessions — already tagged `meta.scheduled_probe`, skip
- Sequential work — Phase 1 shape: no `subagent_start`
- Fan-out orchestrator — Phase 2/3: multiple `subagent_start` events
- Research/ADR leg — read-heavy before coders spawn

---

### Step 4 — Workflow grouping review

After BMAD enrichment: check whether story groupings can now be populated. The BMAD chain grouping architecture is documented in `docs/architecture/known-issues.md` (bmad-chain-grouping item). With enriched sessions, session-to-story assignment should become feasible.

---

## Enrich-subtypes skill tweak needed

Current skill at `.claude/skills/enrich-subtypes/SKILL.md` filters by subtype queue name (e.g., `build.campaign`). For the targeted passes above, it needs a predicate filter.

Options:

- Add a `--filter` flag to the skill (e.g., `/enrich-subtypes 50 --filter workflow_role:IS_NOT_NULL`)
- Or extract session IDs manually and pass as a list to the existing skill

The place to add the filter: the Step 1 bash command inside the skill that extracts session data from the registry. The SQL query there is where the predicate would be injected.

---

## Open architectural items (unchanged)

From `docs/architecture/known-issues.md`:

| Item                      | Priority | Description                                                               |
| ------------------------- | -------- | ------------------------------------------------------------------------- |
| `bmad-chain-grouping`     | HIGH     | Story-level grouping across BMAD lifecycle chains — blocked on enrichment |
| `project-field-uuid-leak` | MEDIUM   | Paperclip agent UUIDs leaking into project field                          |
| `paste-handover-pattern`  | MEDIUM   | Truncated `first_real_prompt` for paste-opening sessions                  |
| `subproject-path-missing` | LOW      | Sub-brain detection inside brains/ monorepo                               |

---

## Memory notes (auto-loads next session)

- "go" = approval phrase (not "approve")
- Enrichment loop: write automatically after each batch, show full 6-column review table
- Never compress rows: `# | ID | Project | Before | After | Key signal`
- Assign secondary tags when overlap; expect 5–15 per 50
