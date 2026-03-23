# Wave 10 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 80 (bringing total to 506/799 = 63.3%)
**Agents**: 9 parallel (W10-01 through W10-09)
**Duration**: ~8-9 minutes to complete all 9 agents
**First wave using campaign-status.py** for batch selection

## Application Learnings

### BUILD accuracy scales sharply with session complexity — confirmed at scale

- **Wave 10 BUILD accuracy: ~43% aggregate** across all 9 agents. Significantly higher than waves 8-9 (11-25%) because this batch was 95% moderate + 5% heavy.
- Per-agent range: W10-09 at 12.5% (lowest) to W10-04 at 86% (highest single batch ever).
- The BUILD accuracy-by-scale curve is now well-established: micro 0-5%, light 10-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%.

### P13 (misunderstood_request) is the dominant friction predicate at moderate scale

- P13 fired in ~30% of moderate sessions across the wave — significantly higher than in lighter sessions.
- Common variant: "depth mismatch" — Claude does something shallower than the user intended.
- P13+P14 co-occurrence correlates with highest frustration levels.
- P15 (buggy_output) was rare this wave. P16 (excessive_changes) confirmed again (W10-04).

### 100% multi-phase rate at moderate scale

- Every single moderate/heavy session across all 9 agents showed clear phase transitions.
- This confirms: moderate sessions always have 3+ phases. Single-phase sessions are a micro/light phenomenon.

### "Naming-constrains-cognition" anti-pattern discovered

- W10-04: Claude named a file "two-approaches.md" then couldn't see a third approach despite user demands.
- The filename acted as a cognitive anchor, constraining Claude's own reasoning. Novel failure mode — distinct from P13/P14.

### Proxy interaction pattern

- W10-01: User in live meeting with Lars, Claude mediating between user and remote machine operator.
- Claude's default explanatory output caused friction — paste-ready commands were needed, not explanations.
- Distinct from "in-meeting assistant" (wave 9) — here Claude is an active participant, not a lookup tool.

### brains/ CWD reliability flips at moderate scale

- Wave 9 (micro/light): brains/ CWD was almost always incidental (used as "home terminal").
- Wave 10 (moderate): brains/ CWD was mostly primary — these sessions involved actual brain work.
- Rule: brains/ CWD reliability correlates with session scale. Micro = incidental, moderate+ = primary.

### Playwright semantic role #7 proposed

- `feature_discovery_audit` — UI observation during product owner feature gathering. Distinct from the 6 prior roles.
- Now 7 proposed roles: ui_audit, external_research, documentation_verification, web_scraping_for_knowledge, form_filling, design_extraction, feature_discovery_audit.

### AngelEye naming genesis found

- Session b95a97be traces the full naming journey: NanoBanano → AngelicEye → AngelEye.
- Historical artifact — the product discovery session that created this project's identity.

### Cross-session handover failure anti-pattern

- Claude fails to include documentation for new concepts in handovers, causing the next session to reinvent or misunderstand.
- Distinct from "context poisoning" (wave 8) — this is information loss, not misinformation.

### Extreme autonomy ratio

- W10-04: 2 user prompts → 81 tool calls (1:40 ratio) via /bmad-dev skill.
- Highest autonomy observed across all 10 waves. Skill-as-conductor pattern for project scaffolding.

### ~60 new subtypes proposed (~0.75/session)

Discovery rate rebounded from 0.51 (wave 9) to 0.75 — moderate sessions are richer than micro/light. Notable new subtypes:

- `sysops.machine_sync` — syncing state between M4 Mini and M4 Pro
- `research.reverse_engineering` — reverse-engineering external tools/systems
- `research.deep_then_build` — deep QA research producing skills
- `knowledge.brain_audit_and_design` — systematic brain audit with 21 parallel workers
- `knowledge.brain_architecture` / `brain_maintenance` / `brain_creation` — coherent brain management family
- `planning.product_owner_feature_dump` — voice-dictated feature observations while using app
- `planning.architecture_course_correction` — mid-project architectural pivot
- `knowledge.cross_system_advisory` — one system reviews another's architecture
- `build.worktree_campaign` — Ralphy worktree campaigns
- `review.consultant_qa` — consultant-style QA review
- `mixed.review_research_build` — genuine multi-type sessions
- `operations.infrastructure_security` — infrastructure security ops

### Voice dictation artifact catalog growing

20+ new artifacts this wave:

- "Verso" = "Vercel" (2 sessions)
- "Jason Rendor" = "Remotion"
- "Bart" = "Claude"
- "angel hands" = "AngelEye"
- "Cold Med" = "Cole Medin"
- "Lisa" = "LISA"
- "PocWoi" = "POEM WUI"
- "pannal" = "panel"
- "Maine" = "main"
- "work trade" = "worktree"
- "MOTS service worker" = "MSW"
- "flijam" = "FliGen"
- "Agnle" = "Angle"

### PII detection incidents

- Passport number and DOB via voice dictation (W10-07)
- Infrastructure session with potential credential exposure (W10-09)
- Reinforces need for PII detection in AngelEye (flagged since wave 6)

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 10 of 10)

506 entries, 0 duplicates. Append-only pattern continues bulletproof.

### campaign-status.py worked first time

- Batch selection was automated — no manual ID file curation needed.
- Sorted by event count descending gave good load balancing (962-1308 events per batch).
- The tool correctly excluded already-analysed sessions and test-debug-001.

### Moderate sessions take longer but produce more

- All agents completed in ~6-9 minutes (vs 5-7 for wave 9's micro/light sessions).
- Discovery rate 0.75/session (up from 0.51 in wave 9). Moderate sessions are significantly richer.
- Multi-phase rate: 100% (vs ~50% for wave 9's lighter sessions).

### Discovery rate not declining at moderate scale

- 0.75/session is the highest since wave 3 (0.80). The apparent decline in waves 8-9 was a scale effect (micro/light sessions), not taxonomy saturation.
- Consolidation is still not needed — new subtypes are appearing at useful rates.

### Total subtypes: ~310+ across 20+ parent types from 506 sessions
