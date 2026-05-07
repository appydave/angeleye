---
title: Ralphy Synthesis — Codified Skill + Corpus Evidence + Gap Analysis
date: 2026-05-07
purpose: First validation of the angeleye-retrieve skill; demonstrates the "skill + conversations" research pattern. Pairs the codified Ralphy spec (`appydave:ralphy` SKILL.md) with what the AngelEye corpus actually shows about Ralphy in practice.
sources:
  - /Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ralphy/SKILL.md (codified intent)
  - http://100.82.235.39:5051/api/sessions (lived experience — 74 sessions)
spike_validates: .claude/skills/angeleye-retrieve/SKILL.md
---

# Ralphy Synthesis — Skill + Corpus + Gap

This is the first real use of the new `angeleye-retrieve` skill. Two purposes:

1. **Validate the skill works** — does the codified search pattern actually produce useful results when run against the live corpus?
2. **Demonstrate the principle** — for any David-authored skill (Ralphy, Ruflo, Mochaccino, BMAD, etc.), the skill captures _codified intent_ and the AngelEye corpus captures _lived experience_. Both are needed; the gap between them is the actual knowledge.

---

## Spike validation — the retrieve skill works

Running `/angeleye-retrieve "ralphy|ralph wiggum|ralphy_campaign|/ralphy" limit=15` against the live API:

- 2,493 sessions paged
- ~1,170 pre-filtered (main, not junk)
- 74 cheap-match candidates (regex hit on cheap fields: name, first_real_prompt, session_subtype, subtype_heuristic, trigger_command, project)
- After full scoring (events + enrichment notes), top 15 ranged from 62 hits down to 10
- Top result: 4,242-event angeleye campaign on 2026-03-24 (`08fbfe17`)

The skill produces ranked, citable results. It's slow (~50 candidates × 2 API calls each = 100 round-trips after the 13-page prefilter) but it works. Server-side filters from the pending API requirement doc would collapse this to 1-2 calls.

---

## Codified Ralphy (what `appydave:ralphy/SKILL.md` says)

The skill is large (~815 lines) and prescriptive. Core structure:

### Four modes

| #   | Mode         | Purpose                                                                      |
| --- | ------------ | ---------------------------------------------------------------------------- |
| 1   | Requirements | Stakeholder expresses what to build (BRD-style)                              |
| 2   | Plan         | Build IMPLEMENTATION_PLAN.md + AGENTS.md from scratch (wave 1 or new domain) |
| 3   | Build        | Coordinator loop — autonomous wave execution                                 |
| 4   | Extend       | Plan next wave with inherited AGENTS.md (normal mode for wave 2+)            |

### Three profiles

| Profile     | Wave size  | Quality gates                               | Output              |
| ----------- | ---------- | ------------------------------------------- | ------------------- |
| Development | 3-5 agents | Tests + typecheck + lint + delivery review  | Code + tests        |
| Analysis    | 8-9 agents | Schema validation + completeness + no dupes | Knowledge artifacts |
| Content     | 6 agents   | Per-dimension verdicts roll up              | Quality report      |

Each profile gets its own `AGENTS-{profile}.md` file. Switching profile archives the current AGENTS.md and loads the new one.

### Non-negotiable rules (from "Key Principles" section, 18 of them)

- **Bold workflow gates** in every response — David scans for them; no gate = broken response
- **campaign = PR = worktree** — interchangeable terms
- **AGENTS.md is critical** — always inherit, never rebuild from scratch
- **3-5 agents per wave** for Development profile
- **BACKLOG.md is the master record** — B### IDs canonical and permanent
- **Mandatory delivery-review hard stops** — between waves and at campaign end
- **KDD auto-promotion** — librarian promotes high/critical learnings to permanent KDD
- **Human review gate before worktree removal** — never autonomous
- **Read actual files before designing data shapes** — don't infer from memory
- **Never decline lifecycle tracking** — even simple tasks build AGENTS.md richness

### Lifecycle stages owned

Planning → Execution → Validation → Assessment.
Intake/Triage/Backlog (B###)/Knowledge (Lisa) sit upstream and downstream as composable interfaces.

---

## Lived Ralphy (what the corpus shows)

### Volume and distribution

74 sessions surfaced across 5+ projects in 6 weeks (mid-March → late-April 2026):

| Project          | Approx sessions | Latest     | Notable                                                             |
| ---------------- | --------------- | ---------- | ------------------------------------------------------------------- |
| awb              | ~24             | 2026-04-22 | Heavy Playwright E2E testing                                        |
| angeleye         | ~8              | 2026-03-24 | Two enormous campaigns (4,242 + 1,909 events)                       |
| flihub           | ~8              | 2026-04-14 | Multiple campaigns over March-April                                 |
| appydave-plugins | ~6              | 2026-03-16 | Some are _about_ Ralphy (skill development), not driven _by_ Ralphy |
| client (kiros)   | ~3              | 2026-03-23 | Smaller campaigns                                                   |

Average ~12 Ralphy sessions per week. Steady, heavy use.

### Trigger evolution

- **Early (March)**: `/ralphy` (raw, before plugin namespace)
- **Mid-March onward**: `/appydave:ralphy` (plugin-namespaced)
- Both forms appear in the same projects, suggesting drift rather than clean migration

The newer form is canonical per the SKILL.md frontmatter. Old `/ralphy` invocations still resolve because the skill name matches.

### Session shape

Top 5 detailed:

| Date       | Project  | Trigger         | Prompts | Events | Note                                        |
| ---------- | -------- | --------------- | ------- | ------ | ------------------------------------------- |
| 2026-03-24 | angeleye | ralphy          | 183     | 4,242  | "Ralphy campaign on angeleye"               |
| 2026-03-22 | angeleye | ralphy          | 108     | 1,909  | Same                                        |
| 2026-03-23 | client   | appydave:ralphy | 90      | 1,004  | "Continue from the next-round brief"        |
| 2026-04-22 | awb      | appydave:ralphy | 43      | 996    | Playwright E2E heavy (165+ browser actions) |
| 2026-04-14 | flihub   | appydave:ralphy | 48      | 308    | "Build archive-tool campaign"               |

The angeleye runs are _enormous_ — 4,242 events in one session. That's far outside typical Claude Code session sizes. Consistent with autonomous batch campaign mode where the coordinator loop drives many internal iterations.

### Subtype in the data: `build.campaign`

Not `build.ralphy_campaign` (which is what the workflow-infrastructure-research doc reported the classifier code names). The actual subtype written to the registry is `build.campaign`. Either:

- The classifier code differs from what the research-doc agent saw (worth a recheck of `classifier.service.ts:1123-1147`), or
- The mapping happens elsewhere (heuristic vs final subtype divergence)

This is a real finding — anyone trying to filter "Ralphy sessions" via `subtype === 'build.ralphy_campaign'` would get zero hits. The discoverable filter is `subtype === 'build.campaign' AND trigger_command =~ /ralphy/`.

---

## The Gap — Skill vs Reality

### What the spike confirms

- Ralphy is heavily used and cross-project (validates the SKILL.md was a real workflow, not aspirational)
- Trigger evolved from `/ralphy` to `/appydave:ralphy` — naming consistency happened mid-stream
- Sessions get massive (4k events) — autonomous coordinator loops are real, not theoretical
- Different shapes per project: angeleye (analysis-style massive runs), awb (Playwright E2E focus), flihub (smaller focused campaigns) — suggests profile-appropriate behaviour even if profile-scoped AGENTS.md isn't visible at this layer

### What the spike CAN'T confirm (would need deeper session sampling)

1. Did sessions actually use the bold-gates format? (Would need to scan assistant turn text, not just user prompts)
2. Were waves actually 3-5 agents per the Development profile? Or did they balloon?
3. Was `appydave:delivery-review` actually invoked at wave boundaries?
4. Did sessions end with proper assessment.md generation and BACKLOG.md updates?
5. Were profile-scoped `AGENTS-{profile}.md` files actually created?
6. Is the human-review-gate before worktree removal actually respected?

These are checkable but would need ~5-10 deeper session samples (full event timelines, not just prompts) — a follow-up investigation rather than this first synthesis.

### Detection gap (NEW finding)

- Subtype is `build.campaign` in the registry, not `build.ralphy_campaign` as previously documented
- A session "about Ralphy" (e.g. `0d6cbb83` — appydave-plugins, build.feature) ranks alongside sessions "driven by Ralphy" (build.campaign + trigger=ralphy) on a keyword search — better search would distinguish via trigger_command + subtype combination

---

## Open questions for David

1. **Is the subtype `build.campaign` (not `build.ralphy_campaign`) intentional?** If so, the workflow-infrastructure-research doc has an outdated reference; if not, the classifier needs reconciliation. Either way it's a 5-minute confirmation.
2. **Want a deeper session sample?** Pulling full event timelines from 5 representative sessions (one per project type) would let us answer "did the bold gates / delivery review / wave sizing actually happen in practice?" — that's where the _real_ gap analysis lives.
3. **The `/ralphy` → `/appydave:ralphy` evolution** — was that a deliberate plugin migration, or is the older form just legacy that still works? If deliberate, the older trigger could be deprecated/aliased.
4. **Should this synthesis pattern (skill + corpus + gap) become a routine?** The retrieve skill enables it cheaply for any David-authored workflow (Ruflo, BMAD, Mochaccino, Paperclip-as-harness, AppyCtrl). One synthesis per archetype would give a complete map of "codified vs lived" across the orchestrator portfolio.

---

## What this proves about the methodology

The skill+corpus pairing surfaces things neither source contains alone:

- The **skill** never says "and you'll occasionally hit 4,242 events in one session." That scale fact only exists in the corpus.
- The **corpus** never says "this campaign was supposed to use the Development profile with 3-5 agents." That intent only exists in the skill.
- The **gap** (e.g. `build.campaign` vs `build.ralphy_campaign`) only exists at the intersection.

The principle generalises. Any future "research X archetype" task should follow this template: read the skill, retrieve the corpus, write the gap. The retrieve skill makes the corpus side cheap.
