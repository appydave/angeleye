# Wave 6 Learnings

**Date**: 2026-03-22
**Sessions analysed**: 80 (bringing total to 188/789 = 23.8%)
**Agents**: 9 parallel (micro-1, light-1, light-2, moderate-1/2/3, heavy-1/2, marathon-1)
**Duration**: ~8 minutes to complete all 9 agents

## Application Learnings

### BUILD misclassification is worse than thought

- **Wave 6 BUILD accuracy: 17.5% (14/80)**. All 80 sessions had registry_type=BUILD. Only 14 were genuinely BUILD.
- Micro sessions: 0% accuracy (0/23 — worst category)
- Light sessions: ~12% accuracy (3/24)
- Moderate sessions: ~45% accuracy (10/22)
- Heavy sessions: ~70% accuracy (7/10)
- **Pattern**: BUILD accuracy scales with session complexity. Micro/light sessions are almost never BUILD.

### Classification distribution (wave 6)

BUILD(14), OPERATIONS(12), KNOWLEDGE(8), PLANNING(8), ORIENTATION(8), RESEARCH(6), SKILL(6), MIXED(4), TEST(3), REVIEW(3), META(3), DEBUG(2), SETUP(2), SYSOPS(1)

### New subtypes discovered (~35 new across 80 sessions, ~0.44/session)

Key new subtypes:

- `test.field_testing` — manual workflow testing without pre-written plan
- `build.handover_execution` — formal developer briefing with scope/deliverables/DoD
- `build.uat_driven_iteration` — BUILD driven by live user feedback, not implementation plan
- `operations.remote_provisioning` — live Ansible provisioning with human-as-hands pattern
- `operations.port_cleanup` — recurring EADDRINUSE kill pattern (automation candidate)
- `planning.decision_making` — architectural decisions in product repo (not BUILD)
- `planning.requirements_capture` — requirements gathering (not BUILD)
- `debug.data_recovery` — data loss recovery with extreme frustration
- `meta.skill_error` — skill system failures
- `build.campaign_with_research` — meta-recursive BUILD that includes research phases

### app.supportsignal is NOT a universal BUILD signal

- Only ~40% of app.supportsignal sessions are genuine BUILD
- Others are PLANNING (architectural decisions, schema design), KNOWLEDGE (advisory), REVIEW
- The classifier needs to distinguish planning-in-product-repo from building-in-product-repo

### Multi-phase sessions dominate at moderate+ scale

- 5/6 moderate-3 sessions, 6/8 moderate-2 sessions had clear phase transitions
- Heavy sessions are 100% substantive (zero junk)
- Moderate sessions consistently span 2-3 distinct work phases

### Concurrent session pair discovered

- Sessions 65f77723 and 24d71c92 overlap on March 9 with explicit cross-window feedback sharing
- First confirmed concurrent session pair in the dataset
- Implications for session chain analysis (C08)

### PII in JSONL

- Session 120c7392 contains full names, birthdays, emails, and IP addresses
- AngelEye needs PII detection before any data sharing or visualization

### Voice dictation artifacts catalog expanded

- "mope down"=map out, "RAAF Loop"=Ralphy Loop, "cellite, till"=CLI tool
- "Ralpy"="Ralphy", "gip pull"="git pull", "mpn"="npm", "exti"="exit"
- "blog"=bug

### Ralphy pattern without /ralphy invocation

- Marathon session uses full Ralphy pattern (IMPLEMENTATION_PLAN.md + Agent/Task + subagent orchestration) without invoking the skill
- The pattern has been internalized by the user

### Port-kill sessions as automation candidate

- 3 micro sessions are EADDRINUSE port kills on signal-studio ports 6040/6041
- Candidate for automated handling in AngelEye or dev tooling

### Closing ceremony patterns by session scale

- Micro: no closing (100%)
- Light: abrupt abandon (67%)
- Moderate: mixed (commit, memory write, or abandon)
- Heavy/marathon: commit_and_push or memory_write dominant

## Loop Meta-Learnings

### 9 parallel agents worked flawlessly

- Zero conflicts on session-index.jsonl (append-only works)
- No duplicate entries (188 total, 0 dupes)
- Agent completion times: marathon (3min) → heavy (6min) → moderate (6-7min) → light (7min) → micro (8min)
- Counter-intuitive: micro agent was slowest (23 sessions to process, many tiny reads)

### Event-count-based batching > project-based batching

- Wave 5 used project groups; wave 6 used size buckets
- Size buckets gave more even agent workloads
- All agents finished within a 5-minute window

### Pre-computed shapes continue to be essential

- compute-session-shape.py gave agents consistent raw data
- No manual counting inconsistencies across 9 agents
- Detections (D01-D08) caught patterns agents might have missed

### Discovery rate declining but still productive

- Wave 6: 0.44 subtypes/session (down from 0.5 in wave 5, 0.8 in wave 3)
- Diminishing returns setting in for subtypes, but BUILD misclassification patterns are still informative
- Next waves should focus on confirming/consolidating existing subtypes rather than discovering new ones
