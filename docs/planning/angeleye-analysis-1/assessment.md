# Assessment: angeleye-analysis-1

**Campaign**: angeleye-analysis-1 (M4 Mini phase)
**Date**: 2026-03-22 → 2026-03-23
**Results**: 800 complete, 0 failed
**Quality audit**: N/A — analysis campaign, no code changes

## Results Summary

| Wave      | Sessions | Scale                   | BUILD Accuracy    | Discovery Rate     | Duration |
| --------- | -------- | ----------------------- | ----------------- | ------------------ | -------- |
| 1a-1b     | 12       | Calibration mix         | N/A (calibration) | 1.0/session        | Manual   |
| 2         | 20       | Heavy/marathon          | ~60%              | 0.80               | ~15 min  |
| 3         | 20       | Heavy/marathon          | ~55%              | 0.80               | ~12 min  |
| 4         | 18       | Moderate/heavy          | ~40%              | 0.75               | ~10 min  |
| 5         | 18       | Mixed                   | ~30%              | 0.50               | ~10 min  |
| 6         | 80       | Mixed (micro-heavy)     | 17.5%             | 0.44               | ~8 min   |
| 7         | 80       | Mixed (30+ projects)    | 22%               | 0.50               | ~8 min   |
| 8         | 79       | Mixed (20 projects)     | 25%               | 0.70               | ~8 min   |
| 9         | 79       | 49% micro, 44% light    | 11%               | 0.51               | ~7 min   |
| 10        | 80       | 95% moderate, 5% heavy  | 43%               | 0.75               | ~9 min   |
| 11        | 80       | All light/micro/trivial | 12%               | 0.80               | ~9 min   |
| 12        | 80       | All light               | 2.5%              | 0.63               | ~6 min   |
| 13        | 133      | All trivial/micro/light | 0%                | 0.32               | ~5 min   |
| Final     | 1        | Light                   | N/A               | N/A                | ~2 min   |
| **Total** | **800**  |                         |                   | **~440+ subtypes** |          |

## What Worked Well

1. **Append-only JSONL index** — 800 entries across 13 waves with 9 parallel agents each, zero duplicates ever. The pattern was bulletproof from wave 1 through wave 13.

2. **campaign-status.py + compute-session-shape.py pipeline** — automated batch selection (sorted by richness) and pre-computed shapes eliminated manual session curation and gave agents consistent, high-quality input. Introduced in wave 5, became standard immediately.

3. **9 parallel agents per wave** — the sweet spot. All agents completed within 5-10 minutes. Zero file conflicts, zero coordination overhead. Agents were fully independent.

4. **Wave ordering by scale** (heaviest first) — processing heavy/marathon sessions first maximized discovery rate early. The accuracy-by-scale curve was established by wave 6, confirming the approach.

5. **Librarian pass after each wave** — wave learnings documents captured both application insights and loop meta-learnings. AGENTS.md accumulated 500+ lines of operational knowledge that improved agent quality each round.

## What Didn't Work

1. **BUILD classifier is fundamentally broken at micro/light scale** — 0% accuracy for micro, 2.5-15% for light. The registry's session_type field is unreliable for 60%+ of sessions. A CWD guard + tool-call minimum would fix most cases.

2. **AGENTS.md SSH hostname was wrong** — listed `MacBook-Pro.local` instead of `macbook-pro-m4` (Tailscale alias). Discovered only when preparing for M4 Pro waves. Should have been verified against brains/machine-control/ before writing.

3. **M4 Pro sessions were deferred, not planned** — the campaign goal stated "across two machines (M4 Mini: 773+, M4 Pro: 409+)" but all 13 waves processed only M4 Mini. The tooling assumed local-only access until forced to extend.

4. **Voice dictation artifact catalog grew without consolidation** — 200+ artifacts across 13 waves scattered across learnings files. No single canonical list exists. Should have been consolidated into a single reference file after wave 8.

5. **PII detection raised repeatedly but never acted on** — flagged since wave 6, incidents in every subsequent wave (peaking at 15% in wave 12). Still no detection mechanism in AngelEye.

## Key Learnings — Application

1. **BUILD accuracy-by-scale curve** (definitive): micro 0%, light 0-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%. The classifier needs a scale-aware guard.

2. **Three iron-clad classifier rules**: (a) `*run NNN` first prompt = `operations.poem_execution`, (b) brains/ CWD + light scale = never BUILD, (c) zero tool calls = never BUILD.

3. **CWD is unreliable below moderate scale** — 40-100% incidental rate at micro. brains/ is a "home terminal", not a project signal. File-touch paths are the reliable attribution signal.

4. **P13+P14 co-occurrence is the dominant friction pattern** — misunderstood request + wrong approach always co-occur and correlate with highest user frustration.

5. **440+ subtypes across 22+ parent types** — taxonomy is approaching saturation at micro/trivial scale but may still have discoveries at moderate+ for new projects (M4 Pro has beauty-and-joy, joy-juice, appydave.com not yet seen).

6. **Voice dictation is a first-class input modality** — causes P13 in ~16% of sessions through mishearing product names. A pronunciation-aware entity dictionary would reduce misunderstandings significantly.

7. **CLAUDE.md auto-load anti-pattern is escalating** — up to 32:1 tool-to-prompt ratio with unauthorized edits before the user speaks. P16 fires exclusively from this cause.

8. **Playwright has 9-10 confirmed semantic roles** — far beyond just "testing". Roles include ui_audit, external_research, documentation_verification, web_scraping, form_filling, design_extraction, feature_discovery, product_onboarding, visual_comparison, media_access.

## Key Learnings — Ralph Loop

1. **9 parallel agents is the proven sweet spot** — consistent across 13 waves. Never had a conflict, timing was always 5-10 minutes.

2. **Wave ordering matters** — heavy sessions first produces more discoveries and establishes patterns that improve lighter-session classification in later waves.

3. **Pre-computed shapes transformed agent quality** — agents stopped hallucinating tool counts. compute-session-shape.py is essential infrastructure.

4. **Discovery rate is scale-dependent, not time-dependent** — the apparent decline in waves 8-9 was a scale effect (micro/light), not taxonomy saturation. Wave 10 (moderate) rebounded to 0.75.

5. **Librarian → AGENTS.md feedback loop works** — each wave's learnings improved the next wave's agents measurably. The AGENTS.md grew from ~100 lines to 500+ lines of operational knowledge.

## Promote to Main KDD?

- [ ] BUILD accuracy-by-scale curve — add to conversation-analysis-framework.md
- [ ] Three iron-clad classifier rules — add as detection rules
- [ ] CWD reliability rules by scale — add to attribution logic
- [ ] P13+P14 co-occurrence pattern — add to friction analysis
- [ ] Voice dictation artifact catalog (200+ entries) — consolidate into reference file
- [ ] Playwright semantic roles (9-10) — add to tool semantics documentation
- [ ] 440+ subtypes — promote confirmed subtypes (N >= 3) to taxonomy

## Suggestions for Next Campaign

1. **M4 Pro sessions next** — 110 pending (40 light, 35 moderate, 14 micro, 15 trivial, 5 heavy, 1 marathon). The moderate/heavy sessions will likely produce new patterns from unseen projects (beauty-and-joy, joy-juice, appydave.com).

2. **Use `--machine m4-pro` flag** — tooling is ready. `campaign-status.py --machine m4-pro --next-batch 80` and `compute-session-shape.py --batch file.txt --machine m4-pro` both work.

3. **Agent prompts need SSH instruction** — agents must use `ssh macbook-pro-m4 "cat ..."` to read session JSONL files, or receive pre-computed shapes (preferred).

4. **Consolidate voice artifacts** — create a single `voice-dictation-catalog.md` before starting M4 Pro waves.

5. **Consider PII detection** — 13 waves of evidence says it's needed. Could be a simple regex pass in compute-session-shape.py.
