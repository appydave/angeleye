# AngelEye — Steering Document

A shared communication channel between David (working in the app) and Claude (holding the knowledge and giving direction).

**Protocol**:

- David writes observations, blockers, and questions in the `David → Claude` section while working
- Claude reads this at the start of each session, processes it, writes direction back, and marks items resolved
- Stable direction gets absorbed into CLAUDE.md over time

---

## David → Claude

_Write observations, blockers, questions here while working in the app. Be direct — what you noticed, what's unclear, what's stuck._

<!-- Example format:
- [observation] The registry.json gets stale when sessions crash — SessionEnd never fires
- [question] Should workspace assignment live in registry.json or workspaces.json?
- [blocker] HTTP hook POST is failing — 404 on /events endpoint
-->

_(empty — add items as you work)_

---

## Claude → David

_Current direction, analysis, priorities. Updated by Claude at the start of each session after reading the David section._

### Mochaccino API-Driven Mockups + Sample Data Fallback (2026-03-28)

**What was done this session:**

- **Converted all 9 HTML mockups from hardcoded data to API-driven** — each mockup now fetches from `/api/mock-views/*` endpoints instead of embedding data inline
- **Built sample data fallback layer** — when real data is thin or missing, curated JSON from `.mochaccino/samples/` is served automatically
- **New service**: `server/src/services/sample-data.service.ts` — `loadSample()` and `loadParamSample()` read JSON from disk
- **New helper**: `apiSuccessWithSource()` in `response.ts` — tags every response with `"source": "live"` or `"source": "sample"`
- **Rewrote mock-views routes** — all 10 endpoints have fallback logic + `?sample=true` override + generic catch-all for future sample-only views
- **Created 4 priority sample files**: `chain-session-detail/_default.json`, `chain-sprint-board.json`, `chain-story-pipeline/_default.json`, `chat-panel.json`
- **Fixed cross-machine access** — all HTML mockups use `window.location.hostname` instead of `localhost` for API base URL
- **Fixed visual parity issues** — action codes (WN/CS/DS/DR), column mapping (`advisor` → CURATE), event noise filtering (skip `pre_tool_use`, `progress`, etc.)
- **Documented the architecture** — `.mochaccino/mock-data-fallback.md` + updated Mochaccino skill with API-driven section

**Key pattern for future mockups (no server code needed):**

1. Write HTML in `.mochaccino/designs/{name}/index.html`
2. Drop JSON at `.mochaccino/samples/{name}.json`
3. HTML fetches from `/api/mock-views/{name}` — the generic catch-all serves it

**Not done (lower priority):**

- 5 remaining sample files (observer, organiser, named-rows, sync, story-chains) — real data exists for these
- Story 2.3 backtrack visualization (curved SVG arrow, conditional pass nodes)

---

### BMAD Enrichment — Full Pipeline Fix (2026-03-27)

**What was done this session:**

- **Fixed skill-expanded prompt extraction** — the backfill's `content.startsWith('<')` filter was discarding all skill-triggered prompts (Claude Code wraps `/bmad-sm wn` as `<command-name>bmad-sm</command-name><command-args>wn</command-args>`). Added `extractSkillPrompt()` to parse command + args from XML tags. This was the root cause — every BMAD session was being silently dropped.
- **Fixed sync to support force reclassification** (`POST /api/sync?force=true`) — previously skipped sessions that already had `session_type`
- **Fixed backfill orphan repair** — sessions in registry but missing event files now get re-extracted (286→64 orphaned)
- **Fixed correlator merge logic** — story_unit groups were being merged with ad_hoc temporal clusters via union-find bridge. Added type guard: only merge groups of the same type. Also excluded story-covered sessions from Signal 2 temporal clustering.
- **Added 3 legacy overlay mappings** — bmad-help, bmad-sprint-status, bmad-check-implementation-readiness

**Results:**

- **92 BMAD sessions enriched** (was 0 before this session)
  - Bob (planner): 32 | Nate (reviewer): 14 | Amelia (builder): 13
  - Observer: 8 | Lisa (advisor): 6 | Taylor (tester): 6 | Shipper: 4
  - Sally (UX): 2 | Winston (architect): 2 | Utility: 5
- **8 deterministic story groups**: Stories 0.1, 0.2, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4
- **8 workflow clusters**: oversight (7), bmad-sm batches (4 clusters), ux-designer (2), sprint-status (5), readiness-check (3)
- Story 2.2 confirmed as cleanest run (zero backtracks, 5 sessions)
- Stories 1.1-1.4 not grouped because those sessions didn't include story IDs in trigger_arguments (e.g. `/bmad-dev` without `DS 1.1`)

**Changes made:**

- `server/src/services/backfill.service.ts` — `extractSkillPrompt()` parses `<command-name>/<command-args>` from JSONL; orphan event repair; `repaired` counter
- `server/src/services/sync.service.ts` — `SyncOptions.force` parameter to reclassify all sessions
- `server/src/routes/sync.ts` — accepts `?force=true` query parameter
- `server/src/services/correlator.service.ts` — type-guarded merge (story_unit won't merge with ad_hoc); exclude story sessions from temporal clustering
- `server/src/config/overlays/bmad-v6.json` — added bmad-help, bmad-sprint-status, bmad-check-implementation-readiness

**What's next:**

1. **Stories 1.1-1.4 grouping** — those sessions used commands like `/bmad-dev` without story args. Options: (a) parse story ID from the session content/first prompt, (b) manually tag them, (c) add a heuristic that infers story from temporal position + agent sequence
2. **Ship/oversight story assignment** — `/bmad-ship` and `/bmad-oversight` don't carry story IDs. Could infer from temporal proximity to the preceding story chain
3. **Chain visualization data** — connect affinity groups to the mochaccino mockups (chain-sprint-board, chain-story-pipeline, chain-session-detail)

---

### BMAD BI Enrichment — Extension Plan + Implementation Sprint (2026-03-27)

**What was done this session:**

- Received handover from BMAD inventory session (3 workflow orchestration docs: bmad-session-inventory.md, bmad-session-boundaries.md, bmad-lifecycle-handover.md)
- Wrote formal Pipeline Extension Plan (docs/planning/enrichment-pipeline/pipeline-extension-plan.md) — 4 new capability layers:
  1. Extractors (E01-E04) — positional value extraction with opening/closing windows
  2. Domain Overlays (C14-C16) — generic workflow roles with pluggable domain-specific mappings (BMAD overlay example)
  3. Affinity Groups — cross-folder session correlation into business units (Story Units → Epic Sprints → Project Phases)
  4. Agent Genesis (P31-P35, C22) — infrastructure impact detection
- Ran doc coherence review (docs/planning/enrichment-pipeline/doc-coherence-review.md) — found 8 contradictions, 6 loose ends
- Ran gap analysis (docs/planning/enrichment-pipeline/gap-analysis.md) — ~10% of documented enrichment was implemented, core pipeline solid
- Fixed doc quick wins: P16 label, observation count (7 not 8), B038/B039/B040 moved to resolved
- Added pii_flags and session_scale to shared TypeScript types
- Implemented 11 new Tier 1 detections in classifier.service.ts:
  - P05 (playwright), P09 (compaction), P12 (machine-initiated), P19 (web research), P20 (parallel subagents), P21 (task orchestration), P22 (git outcome), P34 (skill created), P35 (skill modified)
  - E01 (trigger_command), E02 (trigger_arguments)
- Added positional windows documentation to PATTERNS.md

**Implementation totals now:** 17 implemented enrichment items (up from 6), out of 58 documented. All Tier 1 deterministic predicates are now covered.

**What's next (recommended priority):**

1. Tier 2 predicates (P04, P06, P08, P11, P17, P18, P25) — regex/heuristic, no LLM cost
2. Domain overlay infrastructure (JSON config loader + C14-C16 generic classifiers)
3. Affinity group correlator (start with deterministic links: shared story IDs, temporal proximity)
4. Tier 3 LLM infrastructure (API client, enrichment queue, batch processing)

**Helmet CSP fix** from prior session is still uncommitted in server/src/index.ts.

---

### Campaign Complete + v3 Schema Migrated (2026-03-24)

**angeleye-analysis-1 is done.** 924 sessions fully processed across M4 Mini (807) and M4 Pro (116). Three analysis passes complete: forward (waves 1-14), backward (P17-P22, C08-C11, O06-O07), final (P23-P25, C12-C13, O08).

**v3 schema migration complete.** All 924 entries unified into consistent structure — canonical P/C/O-prefixed keys, normalized predicate/classifier formats, `forward_pass` metadata (null for 418 backward-pass-born entries). Migration script at `brains/angeleye/analysis/migrations/migrate-v2-to-v3.py`.

**Doc updates complete:** PATTERNS.md (v3 schema + 924-session findings), requirements.md (operational status), README.md, campaign dashboard + infographic (Chart.js + data tables).

**Optional future work:**

- Promote confirmed subtypes (N >= 3) from 500+ candidates to canonical taxonomy (B043)
- Multi-machine registry sync (B044)

---

## Resolved

_Processed items moved here for reference. Date + brief resolution note._

<!-- Example:
- 2026-03-18 [blocker] HTTP hook 404 → resolved: server wasn't mounting /events route, fixed in server/src/index.ts
-->

- 2026-03-24 B038 — Scale-aware BUILD guard → implemented in commit 3f593607
- 2026-03-24 B039 — Iron-clad classifier rules → implemented in commit 3f593607
- 2026-03-24 B040 — PII detection → implemented in classifier.service.ts (detectPiiFlags with pattern matching)
