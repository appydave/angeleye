# AngelEye Data Architecture

**Purpose**: Map every piece of session data in the system — where it lives, what created it, and how the pieces relate. Written so nobody has to ask "where is this?" or "why are there two counts?" again.

**Created**: 2026-03-25

---

## The Three Data Stores

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE (source of truth)                   │
│                                                                     │
│  ~/.claude/projects/<encoded-path>/<session-id>.jsonl               │
│                                                                     │
│  Raw session transcripts. One JSONL file per session.               │
│  Created by Claude Code itself. Read-only to AngelEye.              │
│  Contains: every tool call, prompt, response, event, timing.        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                   backfill / sync reads these
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANGELEYE REGISTRY (operational)                   │
│                                                                     │
│  ~/.claude/angeleye/registry.json                                   │
│                                                                     │
│  Live app data. One JSON object, keyed by session_id.               │
│  Currently 894 entries.                                             │
│  Created by: sync service (backfill + classify)                     │
│  Updated by: hooks (real-time), sync button, organiser actions      │
│                                                                     │
│  Per entry: session_id, project, project_dir, started_at,           │
│  last_active, name, tags, workspace_id, status, source,             │
│  is_junk, session_type (6 values), session_subtype,                 │
│  tool_pattern, first_edited_dir, first_real_prompt, pii_flags       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                   campaign joined these two stores
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 SESSION INDEX (research/analysis)                    │
│                                                                     │
│  ~/dev/ad/brains/angeleye/analysis/session-index.jsonl              │
│                                                                     │
│  Curated analysis output. One JSONL line per session.               │
│  Currently 924 entries (v3 schema).                                 │
│  Created by: analysis campaign (angeleye-analysis-1)                │
│  Updated by: manual campaign waves, migration scripts               │
│                                                                     │
│  Per entry: everything in registry PLUS                              │
│  25 predicates (P01-P25), 13 classifiers (C01-C13),                │
│  7 observations (O02-O08), shape metrics, derived metrics,          │
│  human overrides, pass metadata, proposed subtypes                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why the Counts Differ (894 vs 924)

| Store             | Count | Explanation                                                                                                                                                                                                         |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App registry**  | 894   | Sessions visible to AngelEye on this machine right now. Populated by sync scanning `~/.claude/projects/` on M4 Mini. Does NOT include M4 Pro sessions (those live on a different machine).                          |
| **Session index** | 924   | Sessions analysed during the campaign. Includes 814 from M4 Mini + 110 from M4 Pro (accessed via SSH during wave 14). Also includes sessions that may have been created between the last sync and the campaign end. |

**The 30-session gap** is primarily the M4 Pro sessions (110) minus sessions created after the campaign ended but before the last sync. These are not contradictory — they're different scopes.

---

## Data Flow Diagram

```
                    Claude Code sessions
                    (raw JSONL transcripts)
                           │
              ┌────────────┼────────────┐
              │            │            │
         M4 Mini      M4 Pro      MacBook Pro
              │            │            │
              ▼            │            │
     ┌─────────────┐      │            │
     │  AngelEye   │      │            │
     │  Sync/      │◄─────┘ (SSH)      │
     │  Backfill   │                   │
     └──────┬──────┘                   │
            │                          │
            ▼                          │
     ┌─────────────┐                   │
     │  classifier  │                   │
     │  .service.ts │                   │
     └──────┬──────┘                   │
            │ writes                   │
            ▼                          │
     ┌─────────────┐                   │
     │  registry   │                   │
     │  .json      │                   │
     │  (894)      │                   │
     └──────┬──────┘                   │
            │                          │
            │  campaign-status.py      │
            │  joins registry +        │
            │  session-index           │
            ▼                          │
     ┌─────────────┐                   │
     │  session-   │◄──────────────────┘
     │  index.jsonl│   (SSH during campaign)
     │  (924, v3)  │
     └─────────────┘
```

---

## File Locations (Absolute Paths)

### Claude Code Raw Data

```
~/.claude/projects/<encoded-path>/<session-id>.jsonl
```

One JSONL per session. AngelEye reads but never writes these.

### AngelEye App Data

```
~/.claude/angeleye/registry.json          — session registry (894 entries)
~/.claude/angeleye/last-sync.json         — timestamp of last sync
```

### AngelEye App Source

```
~/dev/ad/apps/angeleye/                   — app source code
~/dev/ad/apps/angeleye/CLAUDE.md          — app context for Claude
~/dev/ad/apps/angeleye/STEERING.md        — David↔Claude communication
~/dev/ad/apps/angeleye/docs/              — all documentation
```

### Analysis Campaign (in app docs)

```
~/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/
  IMPLEMENTATION_PLAN.md                  — master campaign plan
  AGENTS.md                               — agent definitions
  assessment.md                           — campaign assessment
  scripts/campaign-status.py              — batch selection + status tool
  findings-w1-* through findings-w6-*     — early wave per-session findings
  learnings/                              — 14 wave learnings + setup notes
    wave-1a-learnings.md through wave-14-learnings.md
    analysis-lenses.md
    skill-inventory.md
    subtype-candidates.md
```

### Analysis Data (in brain)

```
~/dev/ad/brains/angeleye/analysis/
  session-index.jsonl                     — master index, 924 entries, v3 schema
  session-index-v1.jsonl.bak             — v1 backup
  session-index-v2.jsonl.bak             — v2 backup
  migrations/migrate-v1-to-v2.py          — schema migration script
  migrations/migrate-v2-to-v3.py          — schema migration script
  fp-batch-01.jsonl through fp-batch-09.jsonl   — forward pass batch data
  bp-batch-01.jsonl through bp-batch-09.jsonl   — backward pass batch data
  findings-w5-* through findings-w15.md         — later wave findings
  bp-findings-01 through bp-findings-09.md      — backward pass findings
  fp-findings-01 through fp-findings-09.md      — forward pass findings
  discovery-d01 through discovery-d09.md        — discovery pass findings
  discovery-synthesis.md                        — discovery synthesis
```

### Patterns & Schema Definition (in app docs)

```
~/dev/ad/apps/angeleye/docs/intelligence/PATTERNS.md
  — v3 schema definition, signal reliability, all [VALIDATED-924] findings
```

### Brain (curated knowledge)

```
~/dev/ad/brains/angeleye/
  INDEX.md                                — brain navigation hub
  analysis-methodology.md                 — two-pass process description
  conversation-analysis-framework.md      — four-angle classification framework
  angeleye-fundamentals.md                — what AngelEye is, four jobs
  data-concepts.md                        — session/workspace/thread definitions
  ingestion-architecture.md               — hook pipeline, data layout
  ambient-intelligence.md                 — pattern mining, skill suggestion
  provenance-and-relationships.md         — brain relationships
  communication-patterns.md               — STEERING.md pattern
  future-features-inspector-research.md   — 14 feature ideas from inspector
  workspace-example-supportsignal-ux.md   — first real workspace example
```

---

## What's Annotated vs What's Raw

| Data                                           | Source            | Who creates it                          |
| ---------------------------------------------- | ----------------- | --------------------------------------- |
| JSONL transcript entries                       | Claude Code       | Claude Code runtime                     |
| Registry entry (project, started_at, status)   | Sync/backfill     | AngelEye server code                    |
| session_type, tool_pattern, is_junk            | Sync/classify     | `classifier.service.ts` (deterministic) |
| first_real_prompt, first_edited_dir, pii_flags | Sync/classify     | `classifier.service.ts` (deterministic) |
| name, tags, workspace_id, note                 | User              | David via AngelEye UI                   |
| Predicates P01-P25                             | Analysis campaign | Claude agents reading transcripts       |
| Classifiers C01-C13                            | Analysis campaign | Claude agents reading transcripts       |
| Observations O02-O08                           | Analysis campaign | Claude agents reading transcripts       |
| disposition, interest_level                    | Analysis campaign | David's human overrides                 |
| shape metrics                                  | Analysis campaign | Computed from JSONL by campaign agents  |

---

## The Gap (What This Pipeline Project Fixes)

Today:

- Sync produces **3 classifiers** (C01 session_type, C02 scale via tool count, C05 tool_pattern)
- Everything else requires a manual campaign

After this project:

- Sync produces **~16 predicates + ~7 classifiers** deterministically (no LLM)
- Background enrichment produces remaining **~9 predicates + ~6 classifiers** via LLM
- Reprocessing runs the same pipeline against historical sessions
- No manual campaign needed for known patterns

---

**Next**: See `predicate-tier-reference.md` for the full breakdown of what's deterministic vs LLM-required.
