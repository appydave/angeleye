# Wave 9 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 79 (bringing total to 426/794 = 53.7%)
**Agents**: 9 parallel (W9-01 through W9-09)
**Duration**: ~7 minutes to complete all 9 agents

## Application Learnings

### BUILD accuracy drops sharply in lighter sessions

- **Wave 9 BUILD accuracy: ~11% (9/79)**. Significantly lower than waves 6-8 (~20-25%).
- W9-04 hit 0% (0/9). W9-07 also 0% (0/9). W9-01 at 14% (1/7).
- **Root cause**: this wave is 49% micro, 44% light. Micro sessions are almost never BUILD. The BUILD over-classification problem is most severe in the lightest sessions.
- Pattern now very clear: micro 0-5%, light 10-15%, moderate 30-40%, heavy 50%+, marathon 60-70%.

### Micro sessions have distinct taxonomies

With 39 micro sessions analysed this wave, clear patterns emerge:

- **ORIENTATION/artifact_retrieval**: most common micro type — user grabbing a file path, checking a setting
- **META/smoke_test**: "2+2" or "x" — testing if Claude works
- **META/accidental**: single event, no work
- **RESEARCH/quick_answer**: hardware lookup, tool question, in-meeting query
- **SYSOPS/secret_management**: token/key retrieval
- **ORIENTATION/memory_probe**: testing if Claude remembers prior conversations

### "Home terminal" CWD patterns confirmed

- **brains/**: used as "home terminal" for quick Q&A unrelated to brain content (N=10+ cumulative)
- **prompt.supportsignal/**: CWD always incidental (N=11+ cumulative). Work spans 4+ repos.
- CWD incidental rate: ~60% across micro/light sessions

### Playwright semantic role #6 confirmed

`design_extraction` — systematic crawl of own production app to extract reusable UI patterns for v2 rebuild. Now 6 confirmed roles: ui_audit, external_research, documentation_verification, web_scraping_for_knowledge, form_filling, design_extraction.

### Product-owner workflow detected

Sessions where user manages backlogs, generates developer handovers, and reviews agent reports — zero code edits but classified BUILD. This is PLANNING or REVIEW, not BUILD.

### Claude as in-meeting assistant

User voice-querying Claude during live Teams/video calls for quick lookups. Very short, 1-2 prompt sessions. A new usage pattern distinct from all other types.

### "Vent sessions" confirmed

Voice dictation lowers the barrier to accidental emotional sessions — frustrated user vents, zero tool calls, session classified BUILD. Should be META/junk.

### AngelEye birth session found

Session e154b011 is the `@appystack` scaffold that created this project. Historical artifact.

### Cross-session commit pattern confirmed

Paste prior session's change summary → verify → commit = OPERATIONS, not BUILD. Appeared in 3+ sessions across waves 8-9.

### CLAUDE.md auto-load triggering wrong-epic searches

Anti-pattern: CLAUDE.md loads context that triggers Claude to execute 12+ searches for wrong sprint/epic before user even speaks. Wastes tokens.

### ~40 new subtypes proposed (~0.51/session)

Discovery rate declining from 0.70 (wave 8) but still productive. Notable new subtypes:

- `orientation.memory_probe` — testing if Claude remembers
- `debug.cross_project_port_kill` — EADDRINUSE chain spanning 3 projects
- `planning.interactive_design` — PlanMode + AskUserQuestion elicitation
- `planning.handover_creation` — generating developer handovers
- `planning.agent_design` — designing agent architectures
- `operations.cross_session_commit` — commit from prior session's output
- `operations.doc_cleanup` — CLAUDE.md and doc maintenance
- `research.design_extraction` — Playwright crawl for UI patterns
- `research.quick_answer` — in-meeting or quick lookup
- `review.design_verification` — checking design implementation
- `review.qa_oversight` — QA oversight of multi-agent work
- `meta.session_introspection` — "say yay" session-alive ping
- `skill.creation_and_fix` — creating/fixing skills
- `setup.install_attempt` — tool installation

### Voice dictation artifact catalog growing

15+ new artifacts this wave:

- "community history" = "commit history"
- "rough Wiggum" = "Ralphy"
- "Mockachino" = "Mochaccino"
- "Revit" = "RVETS"
- "content" = "context"
- "absolute pop step" = "absolute paths"
- "browlser" = "browser"
- "NPN" = "npm"
- "Studi Signal" = "signal-studio"
- "drawer.io" = "Draw.io"
- "Wispr" = "Whisper"
- "builk" = "bulk"

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 9 of 9)

426 entries, 0 duplicates. Still bulletproof.

### Lighter sessions = faster agents

All agents completed in ~5-7 minutes (vs 7-10 for wave 8). Micro/light sessions require less JSONL reading.

### Discovery rate declining but not plateauing

0.51/session (down from 0.70 in wave 8, 0.50 in wave 7). The lighter sessions produce fewer novel patterns but still contribute. Consolidation may be warranted after wave 10.

### Micro sessions need different quality gates

"At least 2 observations per session" doesn't make sense for 1-2 event micro sessions. The predicate-gated observation model handles this naturally — no triggered predicates = no observations. The quality gate should be "all assessable predicates evaluated" rather than "N observations produced."

### Total subtypes: ~250+ across 18+ parent types from 426 sessions
