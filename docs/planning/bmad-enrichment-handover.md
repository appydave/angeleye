# BMAD Enrichment Handover

**Purpose**: Detailed handover for a Claude session to enrich AngelEye data with the last 6-7 days of BMAD development sessions in SupportSignal.

**Created**: 2026-03-27
**Source session**: Research session in `~/dev/ad/brains/` — cloned 6 repos, deep-dived Kibitz/Citadel/Claude Agent Teams UI/RuFlo, created `angeleye/reference-landscape.md`.

---

## What Needs to Happen

Enrich AngelEye's session data with the recent BMAD v6 workflow sessions from SupportSignal. These are the named sessions David can see:

### Known Sessions to Process

```
bmad-bi-enrichment (b700bf1e) — "BMAD Session Inventory for AngelEye"
  - Analysis of BMAD workflow sessions, likely created the inventory docs

bmad-inventory-analysis (32fe11a1) — campaign dashboard related
  - Probably drove the angeleye-analysis-1 campaign

bmad-oversight (9bcb1d85) — Sprint state, Story 2.3
  - David running /bmad-oversight to track sprint progress

Multiple sessions (names TBD):
  - bmad-sat sessions — Taylor running acceptance tests
  - bmad-lib sessions — Lisa curating KDD learnings
  - bmad-dev sessions — Amelia implementing stories
  - bmad-dr sessions — Nate doing delivery reviews
  - bmad-sm sessions — Bob doing story creation/validation
```

### The Work

1. **Find all BMAD sessions from the last 7 days** (2026-03-20 to 2026-03-27)
   - Source: `~/.claude/angeleye/registry.json` — filter by `started_at` in date range
   - Source: `~/.claude/projects/` — scan for SupportSignal project sessions
   - Cross-reference with `docs/planning/workflow-orchestration/bmad-session-inventory.md` (covers Stories 0.1-2.3)
   - Look for sessions with trigger_commands matching `/bmad-*` patterns

2. **Run enrichment on each session**
   - The classifier service is at `server/src/services/classifier.service.ts` (667 lines, well-tested)
   - All Tier 1 deterministic predicates are implemented (P05, P09, P12, P19, P20, P21, P22, P23)
   - Most Tier 2 heuristics are implemented
   - Domain overlay for BMAD v6 is at `server/src/config/overlays/bmad-v6.json`
   - Extractors E01 (trigger_command) and E02 (trigger_arguments) are implemented
   - Overlay classifiers C14/C15/C16 (workflow_role/identity/action) are implemented

3. **Build affinity groups for the stories**
   - The correlator service is at `server/src/services/correlator.service.ts` (475 lines)
   - Signal 1 (Shared Story ID) should group sessions by story number from trigger_arguments
   - Signal 2 (Temporal Proximity) clusters by 4-hour gaps within same overlay
   - The affinity group schema supports `story_unit` type with chain_steps and backtrack tracking
   - Output goes to `data/affinity-groups.json`

4. **Update the BMAD session inventory**
   - `docs/planning/workflow-orchestration/bmad-session-inventory.md` — add Story 2.3+ sessions
   - `docs/planning/workflow-orchestration/bmad-session-boundaries.md` — add boundary data (start/end times, outputs, commits, test counts, verdicts)
   - Track backtrack patterns (CONDITIONAL PASS → re-review cycles)

5. **Populate chain-story data** (if the model exists yet)
   - Check `docs/planning/enrichment-pipeline/chain-visualization-exploration.md` (44KB) for the chain/sprint data model exploration
   - The three mochaccinos at `.mochaccino/designs/chain-sprint-board/`, `chain-story-pipeline/`, `chain-session-detail/` show the target UI

---

## Key Files to Read First

| File                                                              | Why                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `CLAUDE.md`                                                       | App conventions, architecture overview                             |
| `STEERING.md`                                                     | Current direction, blockers, resolved items                        |
| `shared/src/angeleye.ts`                                          | All TypeScript types — RegistryEntry, AffinityGroup, DomainOverlay |
| `server/src/config/overlays/bmad-v6.json`                         | BMAD agent roster and command→role mappings                        |
| `server/src/services/classifier.service.ts`                       | Predicate/classifier implementations                               |
| `server/src/services/correlator.service.ts`                       | Affinity group correlation logic                                   |
| `docs/planning/workflow-orchestration/bmad-session-inventory.md`  | Existing inventory (Stories 0.1-2.3)                               |
| `docs/planning/workflow-orchestration/bmad-session-boundaries.md` | Session boundary data format                                       |
| `docs/planning/enrichment-pipeline/predicate-tier-reference.md`   | Full predicate reference                                           |

---

## Reference Landscape Insights (from research session)

The research session deep-dived 4 repos. Key borrowable patterns for this enrichment work:

### From Kibitz (observability sibling)

- **Pre-LLM structured assessment**: Count reads/writes/searches/commands/tests/deploys/errors → classify direction (on-track/drifting/blocked). Zero LLM cost. Could be added as a new Tier 1 classifier.
- **Drift heuristics**: 4+ reads with 0 writes = drifting, 6+ commands without writes/tests = drifting. Could become predicates.
- **Security detection**: 10 regex rules (curl piped to shell, `rm -rf /`, secrets in args). Could become P-level predicates.

### From Citadel (campaign persistence)

- **Campaign file = chain-story data model**: Direction + Phases + Feature Ledger + Decision Log + Continuation State. Status: active/completed/parked = status pills.
- **HANDOFF blocks**: 3-5 bullets, <150 words. Cross-session context. Could map to affinity group summaries.
- **Discovery relay**: ~500-token compressed briefs between waves. Could be the format for chain-step summaries.
- **Circuit breaker heuristics**: 3 consecutive failures = suggest alternatives. Could become a predicate.

### From Claude Agent Teams UI (Kanban UX)

- **Dual column ownership**: Agent-driven (status) vs human-driven (kanban-state.json). Relevant for chain-sprint-board data model.
- **5-column flow**: TODO → IN PROGRESS → REVIEW → DONE → APPROVED. Maps well to BMAD story lifecycle.
- **MemberBadge**: Avatar + colored pill badge. Maps to BMAD agent identities (Bob, Amelia, Nate, Taylor, Lisa).

### From RuFlo (enterprise orchestration)

- **Event sourcing**: Typed domain events for time-travel debugging. Could inform session replay.
- **Checkpoint manager**: Uses Claude Code SDK message UUIDs. Could map to chain-step boundaries.
- **System trend analysis**: improving/declining/stable per metric with predictions. Could surface session quality trends.

### Full reference file

`~/dev/ad/brains/angeleye/reference-landscape.md` — 200+ lines with all deep dive findings, key file paths in each upstream repo, and the three synthesis patterns.

---

## Execution Approach

### Option A: Use the sync endpoint

The app has `/api/sync` which runs backfill + classify. If the server is running, this may do most of the work automatically for any new sessions it discovers.

### Option B: Direct service calls

If more control is needed, call the services directly:

1. `backfill.service.ts` — scan `~/.claude/projects/` for new sessions
2. `classifier.service.ts` — run predicates + classifiers on each
3. `overlay.service.ts` — resolve BMAD overlay for domain classifiers
4. `correlator.service.ts` — build affinity groups from classified sessions

### Option C: Extend the pipeline

If the existing pipeline doesn't capture everything needed:

1. Add new predicates inspired by Kibitz/Citadel patterns
2. Extend the correlator with new signals
3. Update the chain-visualization data model
4. Connect to the mochaccino mockups

### Recommended approach

Start with Option A (sync) to see what's already captured. Then inspect the results and use Option B/C to fill gaps. The BMAD overlay is already configured — most sessions should auto-classify if they used `/bmad-*` commands.

---

## Success Criteria

- All BMAD sessions from last 7 days are in the registry with enrichment data
- Affinity groups exist for each active story (Story 2.3+)
- Chain steps are tracked (which agent ran in what order)
- Backtracks are detected and logged
- The session inventory docs are updated with new sessions
- Boundary data (start/end, outputs, verdicts) is captured for each session

---

## What NOT to Do

- Don't modify the brain files (`~/dev/ad/brains/angeleye/`) — those are reference knowledge, not app state
- Don't run Tier 3 LLM enrichment yet — that infrastructure isn't built
- Don't redesign the enrichment pipeline — it's well-structured, just needs data fed through it
- Don't touch the mochaccino mockups — they're design explorations, not implementation targets yet
