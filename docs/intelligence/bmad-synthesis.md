---
title: BMAD Synthesis — Codified Skill + Corpus Evidence + Gap Analysis
date: 2026-05-07
purpose: Second application of the skill+corpus+gap pattern (after Ralphy). Pairs the codified BMAD lifecycle spec (`appydave:bmad-story-lifecycle` SKILL.md + bmad-method brain v6) with what the AngelEye corpus actually shows about BMAD in practice across ~84 orchestrator runs and ~300 phase sessions.
sources:
  - /Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/bmad-story-lifecycle/SKILL.md (codified intent)
  - /Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/bmad-story-lifecycle/references/command-sequence.md (paste-ready sequence)
  - /Users/davidcruwys/dev/ad/brains/bmad-method/INDEX.md (v4/v6 doctrine)
  - http://100.82.235.39:5051/api/sessions (lived experience — 383 BMAD-keyword sessions)
spike_validates: .claude/skills/angeleye-retrieve/SKILL.md (second use)
prior_synthesis: docs/intelligence/ralphy-synthesis.md
---

# BMAD Synthesis — Skill + Corpus + Gap

Second use of `angeleye-retrieve` as the corpus side of David's "skill + conversations" pattern. Where Ralphy is the **autonomous batch** harness archetype, BMAD is the **N coordinated phase processes** archetype — multiple Claude Code panes (or in-process Agent Team teammates) executing the canonical Bob → Amelia → Nate → Taylor → Lisa → Ship lifecycle.

The asymmetry is the point: BMAD's harness shape produces `1 orchestrator session + ~9 phase sessions per story` in early March/April, then collapses to `1 orchestrator session containing ~9 in-process Agent calls per story` from mid-April onward when Mode 1 (Agent Teams) became the default. AngelEye captures both — and the difference is visible in the data.

---

## Spike validation — the retrieve skill works (again)

Running `/angeleye-retrieve "bmad|/bmad-(pm|sm|dev|dr|sat|ux-designer|e0)|story.lifecycle|swagger"` against the live API:

- 2,495 sessions paged across 13 pages
- 383 cheap-match candidates (regex hit on cheap fields: name, first_real_prompt, session_subtype, subtype_heuristic, trigger_command, project)
- After tool/event sampling on the 84 orchestrator sessions, mode breakdown was crisp:
  - 69 Mode 1 (TeamCreate + Agent calls visible)
  - 12 Mode 3 (zero Agent calls — orchestrator did the work itself)
  - 3 partial (Agent calls without TeamCreate — likely transitional)

The skill scaled to a much larger result set than Ralphy (5x the raw candidate count). Time-ordered grouping by day surfaced lifecycle clusters cleanly — single-day sets like 2026-03-31 (58 phase sessions) decomposed into 6+ distinct story lifecycles by reading the `name` field (`bmad-sm CS 5.7`, `bmad-dev DS 5.7`, etc).

---

## Codified BMAD (what `appydave:bmad-story-lifecycle/SKILL.md` says)

The skill is the orchestrator entry point. Codified contract:

### The lifecycle (canonical 9 phases)

```
Swagger (orchestrator)
  → Bob CS (story creation, sonnet)
  → Bob VS (story validation, opus) ─── [HUMAN GATE]
  → Amelia DS (development, sonnet)
  → Nate DR (design review, sonnet) ─── [conditional gate, fix loop with fresh agents]
  → Taylor CS (SAT creation)
  → Taylor RA (SAT run + Playwright auto)
  → Lisa CU (curation)
  → Swagger self-maintenance
  ─── [HUMAN GATE — SHIP]
  → bmad-ship
```

That's 9 named phases (Bob CS, Bob VS, Amelia DS, Nate DR, Taylor CS, Taylor RA, Lisa CU, Swagger self-maintenance, Ship), with optional Amelia/Nate fix-loops adding more. David has previously confirmed ~9 phases per story.

### Three execution modes (per environment vars)

| Mode                  | What you see                                          | Requirement                              | Status                            |
| --------------------- | ----------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| **1 — Agent Teams**   | Agents in status bar (`@name`), all in-process        | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Default, working                  |
| **2 — Visible Panes** | Separate iTerm2 tabs per agent                        | `BMAD_VISIBLE_PANES=1`                   | **BROKEN** in Claude Code 2.1.212 |
| **3 — In-Context**    | Sequential Skill calls in the orchestrator's own pane | Neither env var set                      | Fallback only                     |

### Non-negotiables (from "Key Constraints")

1. Swagger never embodies agents — always uses `TeamCreate` + `Agent` tool
2. Bob VS gate is always human (no auto-proceed)
3. Amelia fix loops always use fresh agents (`amelia-fix-1`, `amelia-fix-2`)
4. Taylor runs Playwright automatically — no human prompt
5. Ship only after explicit human "go" — Lisa gate is always human
6. Full diagnostic required before any gate clears

### Gate protocol (mandatory format at each human gate)

1. Agent diagnostic — full unfiltered output
2. **`Swagger's Take`** section — synthesised recommendation, ends with **→ say "go"**
3. Append entry to `## Swagger's Log` in the story file: `[date] [gate] [verdict] [action]`

### Brain context (v6)

`~/dev/ad/brains/bmad-method/` covers v4 (template-driven, fast) and v6 (BMad-CORE + modules, AI-guided). The active flavour in the corpus is v6 with David's customisations (Bob/Amelia/Nate/Taylor/Lisa naming, Swagger overlay, supportsignal-v2 doctrine).

---

## Lived BMAD (what the corpus shows)

### Volume and distribution

383 BMAD-keyword sessions surfaced across the corpus (April–May 2026):

| Slice                                                      | Count   | Notes                                                     |
| ---------------------------------------------------------- | ------- | --------------------------------------------------------- |
| Total candidates                                           | 383     | Filtered to main, non-junk                                |
| Orchestrator (`appydave:bmad-story-lifecycle`)             | **84**  | The Swagger pane                                          |
| Phase agents (`bmad-sm/dev/dr/sat/lib/ship/oversight/etc`) | **267** | Individual phase processes                                |
| Sessions ABOUT BMAD (not driven by it)                     | 32      | `/focus`, `/model`, `/rename`, plain text mentioning BMAD |

Project distribution is heavily concentrated:

| Project                      | Sessions  | Notable                                         |
| ---------------------------- | --------- | ----------------------------------------------- |
| **app.supportsignal.com.au** | 367 (96%) | Effectively the only project running BMAD       |
| brains                       | 9         | Sessions about BMAD methodology, not running it |
| angeleye                     | 3         | Cross-references / discussion                   |
| appydave-plugins             | 2         | Skill development                               |
| signal-studio, dev           | 1 each    | One-off mentions                                |

**SupportSignal is the BMAD harness in practice.** Other projects mention BMAD; only SupportSignal runs it.

### The Mode-1 transition is visible in the data

Day-by-day pattern (orchestrator sessions / phase sessions):

| Period                       | Orch     | Agent        | Mode signal                                                                         |
| ---------------------------- | -------- | ------------ | ----------------------------------------------------------------------------------- |
| **2026-03-29 to 2026-04-05** | 0–4/day  | **5–58/day** | Mode 2 era (separate iTerm2 panes) — phase sessions visible to AngelEye             |
| **2026-04-06 onwards**       | 1–13/day | 0–4/day      | Mode 1 era (Agent Teams in-process) — phases collapse INTO the orchestrator session |

The discontinuity around 2026-04-05/06 is clean: 30 agent sessions on 2026-04-02, then drops to 4 on 2026-04-06, then 0–2/day from there. The orchestrator count stays roughly constant. This matches the SKILL.md's history — Mode 2 (visible panes) was tried, broke in Claude Code 2.1.212, and got forcibly migrated to Mode 1.

### Lifecycle clustering — the 9-phase reality

Reading the `name` field on March 30 (one of the heaviest Mode-2 days) decomposes 43 sessions into clean per-story lifecycles. **Story 5.1 lifecycle** (a single BMAD story across 2h15m):

```
04:00  bmad-sm  CS 5.1     story creation
04:00  bmad-sm  VS 5.1     story validation
04:02  bmad-oversight       overwatch checkin
04:07  bmad-dev DS 5.1     development
04:11  bmad-dr  DR 5.1     design review (issues found)
04:46  bmad-sat CS/RA 5.1  satellite acceptance
05:21  bmad-dev DS 5.1 - revision 2   ← fix loop starts
05:35  bmad-dr  DR 5.1 - revision 2
05:49  bmad-sat CS/RA 5.1 - revision 2
06:02  bmad-lib                       curation (Lisa CU)
06:15  bmad-ship                      ship
```

That's 11 phase sessions for one story (9 canonical + 2 from the Amelia/Nate fix loop). The skill predicted exactly this — "Loop: increment suffix each round (amelia-fix-2, nate-3, etc.) until Nate PASS or human overrides" — and the corpus shows it happened. Story 5.2 right after (06:29 → 09:15) is a clean 7-phase pass with no rework.

In Mode 1 era (post-April 6), the same lifecycle collapses INTO a single orchestrator session as Agent tool calls. **Sample Mode 1 orchestrator session** (`ba239633`, 2026-05-06, story 0.48):

```
TeamCreate=1, Agent=7, SendMessage=5, TaskCreate=15, TaskUpdate=26
events=100, prompts=12, scale=heavy
```

7 Agent calls = 7 in-process teammates spawned. The TaskCreate/TaskUpdate density confirms TeamCreate's task-list mechanism is active. The Mode 2 lifecycle of 11 separate sessions and the Mode 1 lifecycle of 1 session-with-7-agents are the **same conceptual workflow in two harness shapes**.

### Mode 1 phase counts vs the codified 9

Distribution of Agent-tool calls across the 69 Mode-1 orchestrator sessions:

| Agent calls | Sessions | %       | Reading                                        |
| ----------- | -------- | ------- | ---------------------------------------------- |
| 0           | 0        | 0%      | —                                              |
| 1–3         | 6        | 9%      | Aborted early or one-shot probe                |
| 4–6         | 13       | 19%     | Partial lifecycle (skipped phases / cut short) |
| **7–9**     | **36**   | **52%** | **Canonical lifecycle**                        |
| 10–12       | 12       | 17%     | Lifecycle + 1 fix loop                         |
| 13+         | 2        | 3%      | Lifecycle + multiple fix loops (max 16)        |

72% of Mode-1 runs land in the 7+ bucket — strong corpus support for the codified ~9-phase shape. Codified intent and lived behaviour line up here.

### Mode-3 fallback is a real failure mode

12 of 84 orchestrator sessions (14%) have **zero Agent tool calls** despite invoking `/appydave:bmad-story-lifecycle`. Sample (`d3b14ea3`, 2026-04-17, story 0.30):

```
event types: { user_prompt: 8, tool_use: 216 }
tools: { Bash: 57, Read: 53, Edit: 61, Glob: 3, Skill: 7, Write: 2,
         mcp__playwright__browser_*: 28 }
scale: marathon, tool_pattern: mixed
enrichment: "David ran the BMAD story lifecycle for app.supportsignal.com.au story 0.30. Standard orchestrator flow."
```

The orchestrator did **all the implementation work itself** — 61 Edit calls, 57 Bash calls, 28 Playwright calls. No agents spawned. This is the "Mode 3 in-context fallback" the skill warns about ("CRITICAL RULES: Do NOT use TeamCreate") but inverted — these sessions slipped INTO Mode 3 when they should have been Mode 1. The enrichment note ("Standard orchestrator flow") missed the anomaly entirely.

This is a real lived failure of the codified contract. The skill prescribes "Swagger never embodies agents" but in 14% of corpus runs, Swagger silently embodied every agent.

### Multi-attempt stories

60 distinct story IDs invoked. Most ran once. A handful ran multiple times same day:

| Story | Invocations | Dates                       |
| ----- | ----------- | --------------------------- |
| 0.28  | 3           | 2026-04-17 (all same day)   |
| 11    | 2           | 2026-04-21 (twice same day) |
| 0.30  | 2           | 2026-04-17                  |
| 0.16  | 2           | 2026-04-12, 2026-04-07      |
| 9.2   | 2           | 2026-04-09 (twice same day) |
| 6.10  | 2           | 2026-04-07 (twice same day) |

Same-day re-runs suggest aborted/restarted lifecycles, not separate work. The BMAD lifecycle has no "resume from where you stopped" semantic — restart = full new orchestration.

### Subtype detection — fresh classifier vs lived data

The classifier was updated **2026-05-06** (commit `f79a000`) to introduce `build.bmad_orchestrator` and `build.bmad_agent` subtypes. Effect on corpus:

| Subtype                                         | Count | Reading                                                            |
| ----------------------------------------------- | ----- | ------------------------------------------------------------------ |
| `build.bmad_orchestrator`                       | **5** | Only May 2026 sessions classified after the rule was added         |
| `build.bmad_agent`                              | **0** | All 267 phase sessions still show `build.campaign` etc             |
| `build.campaign` (orchestrator pre-fix)         | 71    | Pre-2026-05-06 orchestrators using the old fallback rule           |
| `build.campaign` (phase agents)                 | ~167  | Phase agents falling through `skillInvocation` rule                |
| `orientation.codebase_exploration`              | 52    | bmad-sm CS sessions where the SM read the repo to author the story |
| Other (file_retrieval, quick_check, feature, …) | ~88   | Long tail of misclassifications                                    |

**The new classifier rules only apply prospectively.** No backfill has run. So today, "find me all BMAD orchestrator runs by subtype" returns 5 instead of 84 — a 94% miss. The discoverable filter remains `trigger_command =~ /^(?:appydave:)?bmad-story-lifecycle$/` (which is what this synthesis used).

Same problem on the agent side: `build.bmad_agent` has zero occurrences in the corpus despite 267 sessions matching its trigger predicate. Backfill is needed for both.

---

## The Gap — Skill vs Reality

### What the spike confirms

- BMAD is concentrated in SupportSignal (96% of all BMAD sessions). Other projects don't use it.
- The Mode 2 → Mode 1 transition happened cleanly around 2026-04-05/06 — visible in the orchestrator/agent count split.
- The codified ~9-phase lifecycle is real: 52% of Mode-1 runs land at 7–9 Agent calls, another 20% at 10–12 (with fix loops). The shape matches the spec.
- Fix loops happen: ~17% of Mode-1 sessions have one fix loop (10–12 agents); ~3% have multiple (13+).
- David's stated 3–4 BMAD workflows per day rate is supported (heaviest day = 13 orchestrator runs on 2026-04-07).
- Same-day re-runs of the same story ID exist (multiple stories invoked 2–3x same day), indicating real-world abort/restart cycles.

### What the spike CAN'T confirm (would need deeper sampling)

1. Did each gate produce the **`Swagger's Take`** section per the protocol? (Would need to scan assistant turn text in orchestrator sessions, not just tool calls.)
2. Was the `## Swagger's Log` section actually appended to story files? (Filesystem check, not corpus check.)
3. Did Bob VS run on Opus as prescribed? (Would need model annotation per agent invocation; AngelEye doesn't track this per `Agent` call.)
4. Did Amelia fix loops actually use **fresh** agents, or did they reuse the same teammate? (Would need to read SendMessage targets — fresh agents would have suffix `-fix-1`, etc.)
5. Are Lisa's curation outputs landing in the right places? (Filesystem.)
6. Did the human-gate enforcement hold? (Hard to verify — gates are human pauses inside one session.)

### Detection gaps (NEW findings — log to observations)

1. **Mode 3 silent fallback**: 14% of orchestrator runs (12/84) have zero Agent calls — Swagger embodied every phase. Enrichment notes don't flag this as an anomaly. There's no automated "this orchestrator never spawned an agent" alert. This is a real codified-contract violation that goes undetected.
2. **Classifier backfill missing**: `build.bmad_orchestrator`/`build.bmad_agent` subtypes only apply forward from 2026-05-06. 79/84 orchestrator sessions and all 267 phase sessions still carry old subtypes. Anyone querying "all BMAD orchestrator sessions by subtype" gets 5 instead of 84. A re-classify pass on prior data would close the gap.
3. **Lifecycle bundle representation**: A "BMAD story lifecycle" is a real first-class entity — orchestrator + ~9 phase sessions (Mode 2) OR orchestrator + N Agent calls (Mode 1). Today AngelEye represents this as ~10 unrelated `session_id`s (Mode 2) or 1 session with internal Agent calls (Mode 1). No common abstraction. The story_id (e.g. `5.1`, `0.48`) is in `first_real_prompt` and session `name` but not extracted to a queryable field. This is the same "workflow infrastructure is a UI viz hack" gap as Ralphy/Ruflo — same disease, different symptoms.
4. **Mode is invisible to the data**: The skill defines three execution modes; the corpus has no `execution_mode` field. Mode is inferable only by counting `TeamCreate`/`Agent`/`SendMessage` tool calls. A computed field `bmad_execution_mode: 1|2|3` would be cheap and would let downstream queries distinguish "did this run use the right harness?".
5. **Phase agent subtype split**: All 267 phase sessions go to `build.campaign` (or various long-tail values). The new `build.bmad_agent` rule needs to actually fire — probably needs the backfill noted above. Even after backfill, distinguishing **which** BMAD phase a session represents (CS vs VS vs DS vs DR vs CU) requires parsing the `name` field. The phase identity is encoded in agent name + first prompt; not in any structured field.

---

## Open questions for David

1. **Was the Mode 2 → Mode 1 collapse intentional, or forced by the Claude Code 2.1.212 break?** SKILL.md says "Mode 2 broken — treat as Mode 1." But day-by-day data shows the migration happened weeks before the SKILL.md note was added. Worth confirming if the timeline matches your memory or if there's a missing chapter.
2. **Should the 12 Mode-3 fallback orchestrator runs be a UI alert?** These are codified-contract violations (Swagger embodied agents). Easy to detect: `trigger=appydave:bmad-story-lifecycle AND zero Agent tool calls`. Worth a diagnostics-page tile? "BMAD runs that bypassed the agent harness this week."
3. **Want to backfill the `build.bmad_orchestrator` / `build.bmad_agent` subtypes?** The new classifier rule (commit `f79a000`) doesn't reclassify history. A one-shot re-run would correctly label 79 orchestrator sessions and 267 phase sessions. Or — accept the moving cutoff and rely on `trigger_command` for historical queries.
4. **Story-as-entity question.** Each "BMAD story lifecycle" is a real concept. Should AngelEye track it explicitly — extract `story_id` from `first_real_prompt`/`name`, group orchestrator + phase sessions under it, surface the cluster as a single object? This is the same shape problem as the Ruflo-topology research (claude-flow swarm = N coordinated processes). A unified "multi-process workflow" abstraction could cover BMAD, Ruflo, and Ralphy autonomous campaigns.
5. **The 32 "about BMAD" sessions are actual signal.** Conversations like "I just finished 4 stories (41–44), maybe we need to tailor /bmad-sat" are methodology evolution moments. They're currently lumped with everything else. A `methodology_discussion` tag could surface them as a category — useful for retrospectives and skill iteration.
6. **Is the Mode 3 fallback ever desirable, or always a regression?** 12 out of 84 is high enough to wonder if there's a deliberate sub-pattern (e.g. tiny doc-only stories where spinning up agents is overhead). The enrichment notes say "standard orchestrator flow" on these — which is wrong. Worth deciding: alert on it, or recognise a fourth mode?

---

## Methodology note — what this proves about the pattern

The skill+corpus pairing surfaces things neither source contains alone. For BMAD specifically:

- The **skill** never says "and 14% of the time Swagger silently does all the work itself instead of spawning agents." That failure-rate fact only exists in the corpus.
- The **corpus** never says "this lifecycle was supposed to have a `Swagger's Take` section at every human gate." That contract only exists in the skill.
- The **gap** (Mode 3 silent fallback / classifier backfill missing / story-as-entity unrepresented) only exists at the intersection.

Two synthesis docs in (Ralphy + BMAD), the pattern is repeatable. Three more harness archetypes remain (Ruflo — research already exists; Paperclip-as-harness; AppyCtrl — T3.code fork). One synthesis per archetype completes the "codified vs lived" map across David's orchestrator portfolio.

A noteworthy convergence: both Ralphy and BMAD synthesises surfaced the **same structural gap** — workflow-as-entity is unrepresented. Ralphy "campaigns" and BMAD "story lifecycles" are conceptually first-class but live as scattered `session_id`s with no parent abstraction. The workflow-infrastructure-research doc named this; Ralphy and BMAD both confirm it from different angles. That's three independent witnesses (research + 2 syntheses) saying the representation gap is real and orthogonal to the classifier work.
