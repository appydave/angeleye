# Wave 6 Setup Notes

## What's ready

1. **Pre-processing script**: `scripts/compute-session-shape.py` — tested, working on all 40 wave 5 sessions.
2. **Analysis lenses**: `learnings/analysis-lenses.md` — 8 classifiers (C01-C08), 12 predicates (P01-P12), 5 observations (O01-O05).
3. **v2 schema**: session-index.jsonl has 108 entries, all normalized to consistent key format.
4. **Manifest/selection script**: `scripts/w5-manifest.json` pattern can be reused.
5. **Wave 5 proved 6 parallel agents works with zero conflicts**.

## What the next session needs to do

### Step 1: Select 80 sessions organized by size

Target: 80 sessions from the 681 remaining, organized into 8-10 agent batches by event count:

```
Batch sizing by event count:
- Micro (< 10 events): 20 per agent → 1-2 agents
- Light (10-60 events): 12 per agent → 2-3 agents
- Moderate (60-200 events): 8 per agent → 2-3 agents
- Heavy (200-500 events): 4 per agent → 1-2 agents
- Marathon (500+): 1 per agent → 0-1 agents
```

Prioritize:

- **app.supportsignal** (48 remaining, 0 analysed in wave 5) — the main product app
- **signal-studio** (40 remaining) — confirmed variable BUILD accuracy
- **flihub** (23 remaining) — product app, should be genuine BUILD
- **appydave-plugins** (24 remaining) — mostly SKILL type
- **More brains** (277 remaining) — continue confirming 0% BUILD accuracy
- **Remaining prompt.supportsignal** (118 remaining) — more `*run`/`*execute` patterns

### Step 2: Pre-process with compute-session-shape.py

```bash
python3 scripts/compute-session-shape.py --batch scripts/w6-session-ids.txt > scripts/precomputed/w6-shapes.json
```

### Step 3: Launch 8-10 agents with v2 format + new lenses

Each agent receives:

- AGENTS.md analysis process
- Pre-computed shape JSON for their batch
- Session JSONL file paths
- Instructions to run C01-C08, P01-P12, and gated observations
- **New in wave 6**: C08 session_chain_role and P11 is_machine_initiated

Each agent outputs:

- Findings file: `findings-w6-{batch-name}.md`
- Index entries appended to `session-index.jsonl`

### Step 4: Consolidate

- Normalize classifier keys (use `session_type` not `C01_session_type`)
- Deduplicate index entries
- Update IMPLEMENTATION_PLAN.md
- Update subtype-candidates.md
- Write wave-6-learnings.md

## Key improvements over wave 5

1. **80 sessions** (up from 40) — organize by size not project group
2. **C08 session_chain_role** — detect multi-session workflows
3. **P11 is_machine_initiated** — separate automated from human sessions
4. **Explicit key format** in agent prompts to prevent C01\_ prefix inconsistency
5. **Agent batch assignment by event count** — better context window utilization

## Current state

- 108/789 sessions analysed (13.7%)
- 681 remaining with JSONL files available
- 15 parent types, ~80 subtypes
- Discovery rate: 0.5 subtypes/session (still productive)
- At 80/wave: ~8-9 more waves to complete full corpus
