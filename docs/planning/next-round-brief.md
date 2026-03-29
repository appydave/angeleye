# Next Round Brief — AngelEye Workflow Phase 2

**Created**: 2026-03-29
**Context**: End of Phase 1 build + Phase 2 planning conversation
**Campaign**: angeleye-workflow-phase2
**Profile**: Development

---

## Goal

Prove that ~70% of the analysis campaign's data richness can be achieved with pure deterministic code (no LLM), then build visibility and project config on top of it.

## Phase 2 is three sub-phases

### Phase 2a — "Separate and validate" (proof-of-concept)

Extract data from the two existing static HTML dashboards into standalone JSON:

- `campaign-infographic.html` → `campaign-infographic.json`
- `campaign-dashboard.html` → `campaign-dashboard.json`

Then build a **hybrid HTML view** that:

1. Loads the mock JSON as baseline
2. Overlays real session data (from registry.json + classifier output) where available
3. Visually delineates mock data vs real data (e.g., opacity, border color, label)
4. Real data takes priority over mock data where both exist

**The test**: If JSON extraction is correct, the original HTML should render identically from JSON. The hybrid view shows exactly which fields we can populate from live data today vs what's still mock.

**Source HTML locations**:

- `http://localhost:5050/mockups/docs/planning/angeleye-analysis-1/campaign-infographic.html`
- `http://localhost:5050/mockups/docs/planning/angeleye-analysis-1/campaign-dashboard.html`

### Phase 2b — "See the data" (inspector screens + project registry)

- Project registry config loader (static JSON in `server/src/config/projects/`)
- Schema inspector screen (renders type definitions + config JSON from real code)
- Data inspector screen (browse live registry entries, workflows, affinity groups)
- Add `project_dir` field to WorkflowInstance shared type

### Phase 2c — "Enrich cheaply" (deterministic classifier extensions)

Add ~8 new deterministic fields to `classifier.service.ts`:

- `delegation_style` (autonomy ratio bucketing)
- `initiation_source` (first event + prompt pattern)
- `session_continuity` (combine existing predicates)
- `opening_style` (simplified: skill/paste/voice/typed)
- `closing_style` (simplified: commit/bookend/abrupt)
- `autonomy_ratio` (tool_use_count / user_prompt_count)
- `session_liveness` (active_minutes / duration_minutes)
- `output_type` (heuristic from tool patterns)

Plus top-20 session subtype rules (~60% coverage).
Plus "Re-enrich last N sessions" button in Settings.

## Key references (read before planning)

- `docs/planning/data-landscape.md` — full gap analysis, enrichment strategies, project registry concept
- `docs/planning/hooks-cheat-sheet.md` — all 25 hooks with AngelEye integration notes
- `docs/planning/workflow-feature-requirements.md` — R1-R6 requirements
- `docs/planning/angeleye-workflow-phase1/AGENTS.md` — inherited AGENTS.md (stack, patterns, anti-patterns)
- `docs/planning/angeleye-workflow-phase1/assessment.md` — Phase 1 learnings

## Key decisions already made

1. **Router fires on Stop hook** (after classifier runs), not on session start or UserPromptSubmit
2. **Workflow creation**: Human-initiated primary (UI: pick type + enter reference ID + project). System-suggested secondary (nudge when unmatched story ID detected).
3. **WorkflowInstance needs `project_dir`** — compound key is `work_item_id + project_dir`
4. **Project registry is static config** (JSON files, like workflow types), not runtime state
5. **Auto-discover projects from registry** — config files only needed for workflow-enabled projects (~5-10)
6. **Router deferred to Phase 3** — needs visible data + project config + richer classification first
7. **LLM enrichment deferred to Phase 4+** — frustration signals, multi-phase detection, observations

## Backlog items to create

- B056 — Extract mock HTML data to JSON + hybrid real/mock view (Phase 2a)
- B057 — Project registry config loader (Phase 2b)
- B058 — Schema inspector screen (Phase 2b)
- B059 — Data inspector screen (Phase 2b)
- B060 — Deterministic classifier extensions (~8 new fields) (Phase 2c)
- B061 — Top-20 session subtype rules (Phase 2c)
- B062 — Re-enrich button in Settings (Phase 2c)
- B063 — `project_dir` on WorkflowInstance (Phase 2b)
