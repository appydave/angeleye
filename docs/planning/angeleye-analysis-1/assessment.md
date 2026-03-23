# Assessment: angeleye-analysis-1

**Campaign**: angeleye-analysis-1 (full campaign — M4 Mini + M4 Pro)
**Date**: 2026-03-22 → 2026-03-23
**Results**: 910 complete, 0 failed
**Quality audit**: N/A — analysis campaign, no code changes

## Results Summary

| Wave      | Sessions | Machine  | Scale                   | BUILD Accuracy    | Discovery Rate     | Duration |
| --------- | -------- | -------- | ----------------------- | ----------------- | ------------------ | -------- |
| 1a-1b     | 12       | Mini     | Calibration mix         | N/A (calibration) | 1.0/session        | Manual   |
| 2         | 20       | Mini     | Heavy/marathon          | ~60%              | 0.80               | ~15 min  |
| 3         | 20       | Mini     | Heavy/marathon          | ~55%              | 0.80               | ~12 min  |
| 4         | 18       | Mini     | Moderate/heavy          | ~40%              | 0.75               | ~10 min  |
| 5         | 18       | Mini     | Mixed                   | ~30%              | 0.50               | ~10 min  |
| 6         | 80       | Mini     | Mixed (micro-heavy)     | 17.5%             | 0.44               | ~8 min   |
| 7         | 80       | Mini     | Mixed (30+ projects)    | 22%               | 0.50               | ~8 min   |
| 8         | 79       | Mini     | Mixed (20 projects)     | 25%               | 0.70               | ~8 min   |
| 9         | 79       | Mini     | 49% micro, 44% light    | 11%               | 0.51               | ~7 min   |
| 10        | 80       | Mini     | 95% moderate, 5% heavy  | 43%               | 0.75               | ~9 min   |
| 11        | 80       | Mini     | All light/micro/trivial | 12%               | 0.80               | ~9 min   |
| 12        | 80       | Mini     | All light               | 2.5%              | 0.63               | ~6 min   |
| 13        | 133      | Mini     | All trivial/micro/light | 0%                | 0.32               | ~5 min   |
| Final     | 1        | Mini     | Light                   | N/A               | N/A                | ~2 min   |
| 14        | 110      | Pro      | Mixed (all scales)      | 17-33%            | 0.55               | ~5-8 min |
| **Total** | **910**  | **Both** |                         |                   | **~500+ subtypes** |          |

### Machine Breakdown

| Machine | Sessions | Waves | BUILD Accuracy Range | Unique Projects |
| ------- | -------- | ----- | -------------------- | --------------- |
| M4 Mini | 800      | 1-13  | 0-60%                | ~40             |
| M4 Pro  | 110      | 14    | 17-33%               | ~15 (5 new)     |

## What Worked Well

1. **Append-only JSONL index** — 910 entries across 14 waves with 9 parallel agents each, zero duplicates ever. Bulletproof from wave 1 through wave 14, including the first remote-machine wave.

2. **campaign-status.py + compute-session-shape.py pipeline** — automated batch selection and pre-computed shapes. Extended mid-campaign with `--machine` flag for M4 Pro — single SSH call batches event counts for all 409 remote sessions.

3. **9 parallel agents per wave** — the sweet spot across all 14 waves. Zero file conflicts, zero coordination overhead, 5-10 minute completion windows. Worked identically for local and remote sessions.

4. **Wave ordering by scale** (heaviest first) — maximized discovery rate early. The accuracy-by-scale curve was established by wave 6, confirmed definitive by wave 14.

5. **Librarian pass after each wave** — AGENTS.md grew from ~100 to 550+ lines of operational knowledge. Each wave's agents performed better than the last.

6. **Pre-computed shapes for remote sessions** — agents received full shape data without needing SSH access. Eliminated per-session SSH overhead entirely for wave 14.

## What Didn't Work

1. **BUILD classifier is fundamentally broken at micro/light scale** — 0% accuracy for micro, 0-15% for light, 17-33% overall on M4 Pro. The registry's session_type field is unreliable for 60%+ of sessions. A CWD guard + tool-call minimum would fix most cases.

2. **M4 Pro was deferred, not planned** — campaign goal stated "across two machines" but 13 waves processed only M4 Mini. Tooling assumed local-only access. SSH hostname was wrong in AGENTS.md (`MacBook-Pro.local` instead of `macbook-pro-m4`). Should have verified against brains/machine-control/ before writing.

3. **Voice dictation artifact catalog grew without consolidation** — 220+ artifacts across 14 waves scattered across learnings files. No single canonical list. Should have been consolidated after wave 8.

4. **PII detection raised repeatedly but never acted on** — flagged since wave 6, incidents in every subsequent wave. Still no detection mechanism in AngelEye.

5. **M4 Pro registry defaults everything to BUILD** — no discrimination for SYSOPS, RESEARCH, MIXED, ORIENTATION, META, BRAND, DEBUG. The M4 Pro registry is less mature than M4 Mini's.

## Key Learnings — Application

1. **BUILD accuracy-by-scale curve** (definitive across 910 sessions): micro 0%, light 0-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%. The classifier needs a scale-aware guard.

2. **Three iron-clad classifier rules**: (a) `*run NNN` first prompt = `operations.poem_execution`, (b) brains/ CWD + light scale = never BUILD, (c) zero tool calls = never BUILD.

3. **CWD is unreliable below moderate scale** — 40-100% incidental rate at micro. brains/ is a "home terminal", not a project signal. File-touch paths are the reliable attribution signal. On M4 Pro, brains/ CWD is the most unreliable signal in the entire 910-session dataset.

4. **P13+P14 co-occurrence is the dominant friction pattern** — misunderstood request + wrong approach always co-occur and correlate with highest user frustration. Confirmed on both machines.

5. **500+ subtypes across 24+ parent types** — taxonomy saturated at micro/trivial scale on M4 Mini but rebounded on M4 Pro (0.55/session vs 0.32 on Mini wave 13). New machine = new projects = new patterns.

6. **Voice dictation is a first-class input modality** — 220+ artifacts. Higher rate on M4 Pro (7-9/12 sessions per batch). Causes P13 in ~16% of sessions. A pronunciation-aware entity dictionary would reduce misunderstandings.

7. **CLAUDE.md auto-load anti-pattern is escalating** — up to 32:1 tool-to-prompt ratio with unauthorized edits before the user speaks. P16 fires exclusively from this cause.

8. **Playwright has 9-10 confirmed semantic roles** — ui_audit, external_research, documentation_verification, web_scraping, form_filling, design_extraction, feature_discovery, product_onboarding, visual_comparison, media_access.

9. **Paperclip/JJ Agent is a production autonomous system** — UUID `27231022-d305-4069-a16a-472c98259e33`. 4 session subtypes: marathon (952 events), work bursts, hourly polling, liveness pings. First confirmed machine-initiated agent pattern.

10. **Machine character matters** — M4 Pro (field/mobile, evening mega-sprints, voice-heavy, fleet hub) produces fundamentally different session patterns than M4 Mini (server, focused, sustained). Classifiers trained on one machine will underperform on the other.

## Key Learnings — Ralph Loop

1. **9 parallel agents is the proven sweet spot** — consistent across 14 waves, two machines, local and remote sessions. Never a conflict, always 5-10 minutes.

2. **Wave ordering matters** — heavy sessions first produces more discoveries and establishes patterns that improve lighter-session classification in later waves.

3. **Pre-computed shapes transformed agent quality** — agents stopped hallucinating tool counts. Essential infrastructure for both local and remote sessions.

4. **Discovery rate is scale-dependent, not time-dependent** — apparent decline in waves 8-9 was a scale effect (micro/light), not taxonomy saturation. Wave 10 (moderate) rebounded to 0.75. Wave 14 (new machine) rebounded to 0.55.

5. **Librarian → AGENTS.md feedback loop works** — AGENTS.md grew from ~100 to 550+ lines. Each wave's agents performed better. The knowledge accumulated across 14 waves is the campaign's most durable artifact.

6. **Multi-machine campaigns need tooling investment upfront** — extending campaign-status.py and compute-session-shape.py mid-campaign worked but should have been done before wave 1. The `--machine` flag pattern is reusable for future campaigns.

## Promote to Main KDD?

- [ ] BUILD accuracy-by-scale curve — add to conversation-analysis-framework.md
- [ ] Three iron-clad classifier rules — add as detection rules
- [ ] CWD reliability rules by scale — add to attribution logic
- [ ] P13+P14 co-occurrence pattern — add to friction analysis
- [ ] Voice dictation artifact catalog (220+ entries) — consolidate into reference file
- [ ] Playwright semantic roles (9-10) — add to tool semantics documentation
- [ ] 500+ subtypes — promote confirmed subtypes (N >= 3) to taxonomy
- [ ] Paperclip/JJ agent pattern — add to autonomous agent documentation
- [ ] Machine character profiles — add to multi-machine analysis framework
- [ ] CLAUDE.md auto-load anti-pattern (P16) — add to friction pattern catalog

## Suggestions for Next Campaign

1. **Implement classifier improvements** — the 910-session dataset provides definitive evidence for 3 iron-clad rules and a scale-aware guard. Build these into AngelEye's classify endpoint.

2. **PII detection** — 14 waves of evidence says it's needed. Could be a simple regex pass in compute-session-shape.py or a server-side scan during backfill.

3. **Voice dictation entity dictionary** — consolidate 220+ artifacts into a canonical lookup. Use it to pre-process prompts before classification.

4. **Paperclip agent detection** — machine-initiated sessions (fingerprint: "You are agent {uuid}") need automatic classification. Currently misclassified as BUILD.

5. **Multi-machine registry sync** — M4 Pro registry defaults everything to BUILD. Consider syncing classification rules across machines, or centralising classification in AngelEye server.

6. **Subtype promotion** — 500+ candidates accumulated. Promote confirmed subtypes (N >= 3 occurrences) to the canonical taxonomy in the brain.
