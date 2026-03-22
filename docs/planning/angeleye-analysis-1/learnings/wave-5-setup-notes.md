# Wave 5 Setup Notes

## What's ready

1. **Pre-processing script**: `scripts/compute-session-shape.py` — tested, working. Run against any session JSONL to get structured shape, tool counts, file paths, detections, project inference. No LLM needed.

2. **Analysis lenses**: `learnings/analysis-lenses.md` — 7 classifiers (C01-C07), 10 predicates (P01-P10), 5 observations (O01-O05). These are the structured interpretation prompts agents should run.

3. **v2 schema**: AGENTS.md updated. session-index.jsonl migrated to v2 (68 entries). Backup at session-index-v1.jsonl.bak.

4. **Migration script**: `~/dev/ad/brains/angeleye/analysis/migrations/migrate-v1-to-v2.py`

## What the next session needs to do

### Step 1: Find which sessions have JSONL files available

Many registry entries may not have JSONL files on this machine (M4 Mini). Run:

```bash
python3 -c "
import json, os
from pathlib import Path

sessions_dir = Path.home() / '.claude/angeleye/sessions'
archive_dir = Path.home() / '.claude/angeleye/archive'

# Get all available JSONL files
available = set()
for d in [sessions_dir, archive_dir]:
    for f in d.glob('session-*.jsonl'):
        sid = f.stem.replace('session-', '')
        available.add(sid)

# Load registry and analysed
with open(Path.home() / '.claude/angeleye/registry.json') as f:
    reg = json.load(f)

analysed = set()
with open(Path.home() / 'dev/ad/brains/angeleye/analysis/session-index.jsonl') as f:
    for line in f:
        line = line.strip()
        if line and line.startswith('{'):
            try:
                analysed.add(json.loads(line)['session_id'])
            except: pass

# Find unanalysed sessions WITH available JSONL files
candidates = {}
for sid in available:
    if sid in analysed or sid not in reg:
        continue
    entry = reg[sid]
    proj = entry.get('project', 'unknown')
    tp = entry.get('tool_pattern', 'unknown')
    path = sessions_dir / f'session-{sid}.jsonl'
    if not path.exists():
        path = archive_dir / f'session-{sid}.jsonl'
    size = path.stat().st_size if path.exists() else 0
    candidates.setdefault(proj, []).append((sid, size, tp))

print(f'Available unanalysed sessions with JSONL: {sum(len(v) for v in candidates.values())}')
print()
for proj, sessions in sorted(candidates.items(), key=lambda x: -len(x[1])):
    print(f'{proj:30s} {len(sessions):3d} sessions')
"
```

### Step 2: Select 40 sessions across 4 groups

Target distribution:

- **Group A (10)**: brains BUILD — sample mixed/bash-heavy/edit-heavy
- **Group B (10)**: prompt.supportsignal BUILD — sample mixed/bash-heavy/task-heavy
- **Group C (10)**: Never-seen projects — one from each new project
- **Group D (10)**: Structural oddballs — davidcruwys, ad root, supportsignal-v2-planning, ansible, apps

### Step 3: Pre-process all 40 sessions

Run `compute-session-shape.py` on each selected session BEFORE launching analysis agents. Save output to `scripts/precomputed/w5-XX-shape.json`. This gives agents:

- Exact tool counts (not parsed from prose)
- File paths touched (real project attribution)
- Detected patterns (compaction resume, loop runaway, etc.)
- First real prompt text

### Step 4: Launch agents with v2 output format

Each agent receives:

- AGENTS.md (with v2 schema and analysis lenses reference)
- The pre-computed shape JSON
- The session JSONL file
- Instructions to run all classifiers (C01-C07), predicates (P01-P10), and gated observations

Each agent outputs:

- `findings-w5-XX-*.md` (narrative findings)
- `index-w5-XX.json` (v2 schema entry with full classifiers/predicates/observations)

## Key improvements over wave 4

1. **Pre-computed shape** — agents get exact tool counts instead of counting themselves
2. **v2 schema** — structured classifiers/predicates/observations instead of free-text notes
3. **Analysis lenses** — every session gets the same 22 questions asked the same way
4. **Extractors and detectors are code** — LLM only used for judgment calls
5. **40 sessions per wave** — scaling up from 20
