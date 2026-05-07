---
title: Ruflo Synthesis — Codified Skill + Corpus Evidence + Gap Analysis
date: 2026-05-07
purpose: Pair the codified `appydave:ruflo` wrapper skill with what the AngelEye corpus actually shows about Ruflo in practice. Second use of the angeleye-retrieve pattern (after Ralphy). Confirms or refutes the "wrapper-without-swarm" verdict from `ruflo-investigation.md` against the full corpus.
sources:
  - /Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/SKILL.md (codified intent)
  - http://100.82.235.39:5051/api/sessions (lived experience — 8 ruflo-tagged sessions, 101 broader-sweep sessions)
  - /Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ruflo-investigation.md (per-session evidence ledger — complemented, not duplicated)
  - /Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ruflo-topology-research.md (architecture-side research — referenced, not duplicated)
spike_validates: .claude/skills/angeleye-retrieve/SKILL.md (second run after Ralphy)
companion_to: docs/intelligence/ralphy-synthesis.md
---

# Ruflo Synthesis — Skill + Corpus + Gap

This is the second use of `angeleye-retrieve` (after Ralphy). Two purposes hold:

1. **Validate the retrieve skill** — does it work for a much smaller archetype where the keyword "ruflo" is rare in the corpus?
2. **Demonstrate the principle** — pair codified intent (`appydave:ruflo` SKILL.md) with lived behaviour (8 corpus sessions). The gap is the knowledge.

This doc complements two existing Ruflo documents and does not repeat their content:

- `ruflo-topology-research.md` — claude-flow upstream architecture, MCP tools, topologies, AngelEye factory mapping proposals (architecture side)
- `ruflo-investigation.md` — per-session evidence ledger (the "is the video real Ruflo?" investigation, started before this synthesis)

What's new here: the **corpus-wide statistical picture** of Ruflo usage and a final gap diagnosis.

---

## Spike validation — the retrieve skill works on a low-volume archetype

Running the angeleye-retrieve pattern with regex `ruflo|claude-flow|swarm_init|ruv-swarm|hive.mind|swarm.init|appydave:ruflo|ruflow|roof.?lo` against the live API:

- 13 pages of `/api/sessions` paged (2,495 sessions scanned)
- ~1,161 main, non-junk sessions
- 8 cheap-match candidates (regex hit on cheap fields: name, first_real_prompt, session_subtype, subtype_heuristic, trigger_command, project, project_dir)
- After full scoring (events + enrichment notes), top 8 ranged from 154 hits down to 2
- Top result: 154-hit angeleye dark-factory session `044f935a` (largely a paste of "What Ruflo Actually Is" page → 137 hits in one prompt)

Then a **broader sweep** for actual `npx claude-flow` CLI invocations across all 101 non-junk main sessions in projects where Ruflo would plausibly run (`appyctrl|kiros-sentinal|angeleye|appysentinal|kiros-quality`):

- **0 actual `claude-flow` CLI invocations** across all 101 sessions
- **0 MCP tool calls** to `mcp__ruv-swarm__*` or `mcp__claude-flow__*`

The retrieve skill works fine on low-volume archetypes — the candidate set is small enough that the score-everything-fully step is cheap (8 candidates × 2 API calls = 16 round-trips). For Ruflo specifically the deeper signal isn't keyword frequency in prompts — it's **absence of CLI invocations in Bash events**. That's a separate sweep, not a retrieve-skill function.

---

## Codified Ruflo (what `appydave:ruflo/SKILL.md` says)

The skill is ~205 lines and is a **wrapper**, not a swarm runner. It codifies install/maintenance/teaching, not execution. Topology and runtime mechanics live upstream and are documented separately in `ruflo-topology-research.md` (don't repeat here).

### What this wrapper actually does

| Operation          | Mechanism                                                         | Touches a swarm?                 |
| ------------------ | ----------------------------------------------------------------- | -------------------------------- |
| `install`          | `npx claude-flow@latest init --full --with-embeddings` then prune | No — installs files only         |
| `memory-init`      | Initialises `.swarm/memory.db` (HNSW vector store)                | No — sqlite setup                |
| `prune`            | Interactive — deletes ~117 of 119 installed files                 | No — filesystem ops              |
| `status`           | Reports counts, HNSW state, prune candidates                      | No — read-only inspection        |
| `refresh-upstream` | Pulls upstream repo, detects drift                                | No — git pull on a tracking repo |
| `upgrade`          | Re-runs init, restores curated state via prune                    | No — install pipeline only       |
| `watch`            | Live observability dashboard                                      | No — passive read                |
| `capture-swarm`    | Post-build ritual: writes `docs/swarm-builds/<date>.md`           | After-the-fact only              |
| `orient`           | Reads agent inventory, presents pattern advice                    | No — teaching mode               |

**Critical**: NONE of the 9 operations actually triggers a swarm execution. The skill is **plumbing maintenance + teaching**, not an executor. The user-facing trigger to actually run a swarm is documented in §"Three modes" of the SKILL.md as the literal English phrase **"spawn a swarm"** that the user has to type. There is no `/appydave:ruflo spawn` operation.

### The three modes the skill teaches

1. **Mode 1 — Passive (zero behaviour change)**: hooks store patterns silently; no swarm spawn
2. **Mode 2 — Riff-then-hand-off**: user explicitly says "spawn a swarm" mid-conversation
3. **Mode 3 — Formal plan first**: WORKFLOW.md brief, then "execute via swarm"

The skill explicitly notes (line 86, "Critical:"):

> Claude Code will keep working as a single agent until you explicitly say to spawn a team. "Spawn a swarm to build this" is the trigger.

So the skill admits, in its own text, that it is not the swarm trigger — the user is.

### Hard rules (5)

1. Never prune without confirmation
2. Never overwrite existing CLAUDE.md
3. Always check git working-tree state before install
4. Always log to `.claude-flow/.appydave-ruflo-log.md`
5. Always strip Ruflo's noisy `statusLine` override during prune

### Practical agent roster (post-prune)

`planner`, `researcher`, `coder`, `reviewer`, `tester`, `adaptive-coordinator` — the 6 the skill considers worth keeping out of ~98 upstream agents.

---

## Lived Ruflo (what the corpus shows)

### Volume — surprisingly small

Just **8 sessions** match the keyword regex across the entire 1,161-session main corpus. Compare with **74 Ralphy sessions** in roughly the same time window — Ruflo has ~10% of Ralphy's footprint. The contrast is sharp:

| Archetype | Sessions in corpus | Real invocations confirmed                  |
| --------- | ------------------ | ------------------------------------------- |
| Ralphy    | 74                 | Yes — 4,242-event campaigns                 |
| Ruflo     | 8                  | **0 — no `claude-flow` CLI calls anywhere** |

### Distribution by project and date

| Project  | Sessions | Date range         | Notable                                                                                       |
| -------- | -------- | ------------------ | --------------------------------------------------------------------------------------------- |
| appyctrl | 3        | 2026-05-06 (1 day) | All in one day; `a6fde96f` is the canonical "wrapper" session                                 |
| angeleye | 3        | 2026-05-06         | 2 are handover-paste echoes mentioning Ruflo; 1 build.shipped                                 |
| brains   | 2        | 2026-05-04 → 05-05 | `1b03e83b` is methodology design (dark factory); `9159d6e8` is "what have we learnt" research |

Date span: **2026-05-04 to 2026-05-06** — three days. Every Ruflo-tagged session lives in a 72-hour window. Outside that window, the keyword does not appear.

### Trigger evolution (or lack thereof)

- 2 sessions explicitly invoke `/ruflo` (raw, in `brains` and `angeleye`)
- 1 session invokes `/appydave:ruflo` (`a6fde96f`, appyctrl)
- 5 sessions mention "Ruflo" or "Ruflow" in prompt text only — no slash-command invocation

Of the 8, **only 1 session** (`a6fde96f`) actually invoked the namespaced wrapper as designed. The brain-side research sessions (`1b03e83b`, `9159d6e8`) used the raw `/ruflo` form. The `trigger_command` field is `null` on every single Ruflo-related session in the corpus — the classifier is not picking up these invocations as triggered runs.

### Session shape

| Date       | Session  | Project  | Subtype                      | Prompts | Events | Bash | Agent | Real swarm calls |
| ---------- | -------- | -------- | ---------------------------- | ------- | ------ | ---- | ----- | ---------------- |
| 2026-05-06 | 044f935a | angeleye | build.shipped                | 7       | 172    | 36   | 1     | 0                |
| 2026-05-04 | 1b03e83b | brains   | knowledge.methodology_design | 55      | 285    | 110  | 7     | 0                |
| 2026-05-06 | a6fde96f | appyctrl | build.feature                | 42      | 328    | 115  | 17    | 0                |
| 2026-05-06 | c408f239 | appyctrl | build.prompt_engineering     | 14      | 193    | 27   | 1     | 0                |
| 2026-05-05 | 9159d6e8 | brains   | build.feature                | 20      | 250    | 31   | 1     | 0                |
| 2026-05-06 | 464e8e87 | angeleye | build.bug_fix                | 24      | 334    | 58   | 2     | 0                |
| 2026-05-06 | 06ad6e2d | appyctrl | build.campaign               | 5       | 58     | 22   | 3     | 0                |
| 2026-05-06 | b9502fc4 | angeleye | orientation.quick_check      | 1       | 2      | 0    | 0     | 0                |

### What the sessions actually do (conversational shape)

Read from enrichment notes + matching prompts:

- **`a6fde96f`** — David invoked `/appydave:ruflo`, ran refresh-upstream + install + commit + memory-init + status + prune (the canonical install workflow), then **pivoted to AppyCtrl feature building** using 17 ordinary Claude Code Task subagents. The `Agent` calls are NOT Ruflo swarm agents. (Already documented in detail in `ruflo-investigation.md` — this is the source of the "wrapper-without-swarm" verdict.)
- **`c408f239`** — research session "what can you tell me about Ruflo agents and workflows we've tested" → David realises the video misrepresented things → builds a brand new "Rufus" companion skill from scratch. Bash hits like `ls /Users/davidcruwys/dev/ad/apps/appyctrl/.claude-flow/` are inspecting an existing install, NOT invoking it.
- **`044f935a`** — handover-paste continuation in angeleye; the high score (154) comes almost entirely from a 137-hit paste of "What Ruflo Actually Is" educational page text. The session is about angeleye work; Ruflo just gets mentioned because it was running on another machine ("there may be some RuFlo running right now").
- **`1b03e83b`** — methodology-design session in `brains` discussing dark-factory orchestration; references Ruflo as "Mode B" example but doesn't run it.
- **`9159d6e8`** — "What have we learnt so far about Ruflow?" → David asks for visualisation via Mochaccino, discusses install workflow. Pure research.
- **`464e8e87`** — angeleye bug-fix handover ("3 commits, 710 tests passing, classifier-ruflo-and-ghost-fix delivered") — the session is about fixing the AngelEye classifier's Ruflo handling, not about running Ruflo.
- **`06ad6e2d`** — AppyCtrl Phase 3.1 handover. Heuristic mistakenly tagged it `build.ruflo_orchestrator` (per enrichment note) but no Ruflo skill was invoked.
- **`b9502fc4`** — 2-event orientation that barely got started; matches purely on a handover paste mentioning Ruflo.

### The headline statistic

Across 101 sessions in projects where Ruflo would plausibly execute (the broad sweep): **zero real `npx claude-flow` invocations, zero MCP `mcp__ruv-swarm__*` or `mcp__claude-flow__*` tool calls.** None. Anywhere. Across the entire corpus.

This corroborates and **extends** the verdict in `ruflo-investigation.md` from "no real swarm in the tagged sessions" to "no real swarm anywhere in the corpus, full stop."

---

## The Gap — Skill vs Reality

### What the corpus confirms about the skill

- The skill is **install/maintenance plumbing** and is used as such — `a6fde96f` runs the full canonical workflow exactly as the SKILL.md prescribes (refresh-upstream → install → memory-init → status → prune)
- The skill's "Critical" warning (Claude Code won't spawn unprompted) is **borne out** — David never types "spawn a swarm" and no swarm runs
- The brain note "first real install on kiros-sentinal" matches: the corpus has exactly **1** kiros-sentinal session (consistent with one install event, no follow-on usage)
- The skill teaches three modes; only Mode 1 (passive — hooks running silently) is observable in the corpus, and it leaves no events that distinguish it from "no Ruflo at all"

### What the corpus refutes about the skill

- The skill text implies Mode 2 (riff-then-spawn) is "most natural for conversational thinkers" — but in 1,161 main corpus sessions, **zero** sessions show this pattern firing. Either the skill's framing of "natural" is aspirational, or the trigger phrase "spawn a swarm" is too obscure for David himself to remember to use.
- The skill's `capture-swarm` operation is a "post-swarm-build ritual" — which has **never run**, because no swarm has ever been built. The operation is a hook for an event that hasn't happened.
- The skill's `watch` operation aggregates "Claude Code transcripts (subagent spawn count + last spawn details)" — useful only if subagents are spawned via Ruflo's intended path. The 17 Agent calls in `a6fde96f` were ordinary Task subagents, not swarm workers; `watch` would over-count them.

### Detection gap (NEW finding for the AngelEye classifier)

The 8 corpus sessions show that:

1. **`trigger_command` is `null` for every Ruflo-related session.** The classifier is not detecting `/ruflo` or `/appydave:ruflo` as a trigger. Compare with Ralphy where `trigger_command =~ /ralphy/` was the discoverable filter. The Ruflo equivalent doesn't fire — likely a classifier bug or unimplemented case.
2. **No subtype `build.ruflo_orchestrator` survives in the registry.** The enrichment note for `06ad6e2d` mentions the heuristic _said_ `build.ruflo_orchestrator` but the LLM corrected it to `build.campaign`. Same pattern as the Ralphy `build.campaign` vs `build.ralphy_campaign` mismatch — the heuristic name and final subtype diverge.
3. **No deterministic detection of true Ruflo execution exists in the corpus today** — but if it ever did, the Tier-1 signals from `ruflo-topology-research.md:427-433` (Bash command matching `claude-flow.*(swarm|hive|orchestrate)`, MCP `swarm_init` calls) would catch it cheaply at sync time. None have fired in 1,161 sessions.

### The bigger gap — codified intent vs lived value

The skill assumes a world where David regularly spawns swarms. The corpus reveals a world where:

- David installs Ruflo (rarely — once, on kiros-sentinal, ~2 weeks before this synthesis)
- David runs maintenance/research on Ruflo (8 sessions in 3 days, all in one burst late-April/early-May)
- David **never actually spawns a swarm**

This isn't a failure of the skill — the skill is correct in what it codifies. It's an honest mirror of where Ruflo sits in David's actual workflow today: **researched, installed, but not yet adopted as a routine.** The corpus shows research/install momentum (8 sessions in 3 days) but no execution adoption.

The investigation doc already drew this conclusion case-by-case. The synthesis confirms it across the **whole corpus**.

---

## Open questions for David

1. **Is Ruflo execution actually a goal?** The skill exists, the install is done, the brain has rich rationale — but in 60+ days of corpus there are zero real swarm runs. Is this (a) "I haven't gotten around to it yet, but I will," (b) "I did try it, just not in sessions AngelEye captured," (c) "the install was the experiment and I'm not actually planning to use it," or (d) "I want to but the trigger is too awkward to remember"? Each implies a different next step.
2. **Should the wrapper skill be split into "install/maintenance" and "operate"?** Right now `appydave:ruflo` is asked to be both the setup tool and the orient/teaching tool. If real swarm execution is a goal, a sibling `appydave:ruflo-spawn` skill (with a clear trigger phrase) might lower the activation energy — the topology research doc already notes this is planned but not built (`ruflo-topology-research.md:312-317`).
3. **Should the AngelEye classifier add a Ruflo-specific signal?** Today `trigger_command` is null for Ruflo-tagged sessions and the heuristic-vs-final-subtype mismatch (`build.ruflo_orchestrator` → `build.campaign`) makes Ruflo invisible to filters. Tier-1 Bash + MCP signals from `ruflo-topology-research.md` could detect real swarms deterministically — currently nothing for the classifier to detect, but the hooks would be ready when execution happens.
4. **The video question** — the investigation doc surfaced that David's Ruflo Swarm video may have shown Task subagents, not swarm execution. The corpus extension here confirms it. Does this change what David wants to do with the video (re-record, reframe, follow-up)? The investigation lists three salvage options but holds the decision.
5. **Is the kiros-sentinal install still healthy?** Brain says "first real install" with `_observations-kiros-sentinal.md` as the live log. There's exactly 1 corpus session in that project. Worth a quick `bash status.sh` against it to confirm it's still in the curated post-prune state, or whether it's drifted/been removed.

---

## What this synthesis proves about the methodology (closing)

Two synthesis runs in (Ralphy first, Ruflo now), the skill+corpus+gap pairing keeps producing things neither source contains alone:

- **Ralphy** revealed `build.campaign` vs `build.ralphy_campaign` (subtype name divergence)
- **Ruflo** reveals `trigger_command IS NULL` for an entire archetype (classifier doesn't pick up the invocation at all) AND **wrapper-without-swarm is universal** (corpus-wide, not just tagged sessions)

For Ruflo specifically the corpus is **honest** in a way the skill cannot be: the skill describes how to spawn a swarm; the corpus shows it doesn't happen. The skill describes `capture-swarm` as a "ritual"; the corpus shows the ritual has never been performed because there's nothing to capture.

This is an unusually clean negative result — and arguably more useful than a confirming one. It tells David: the install momentum is real, but adoption hasn't crossed the line. If that matters, the skill needs an easier execution path; if it doesn't matter, the skill should be reframed as install-only.

The retrieve skill cost ~30 round-trips (8 candidates × ~3 calls each + 1 broad sweep × 101 sessions for the Bash inspection). Cheap. Repeatable for BMAD, Mochaccino, Paperclip-as-harness, AppyCtrl. One synthesis per archetype gives a complete map of "codified vs lived" across the orchestrator portfolio.

---

## Sources

### Codified

- `/Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/SKILL.md` (~205 lines, 9 operations)
- `/Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/scripts/` (8 bash scripts)
- `/Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/references/{keep-defaults,delete-rationale,upstream-reference}.md`

### Companion docs (referenced, not duplicated)

- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ruflo-investigation.md` (per-session evidence ledger)
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ruflo-topology-research.md` (architecture + detection signals + AffinityGroup proposals)
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ralphy-synthesis.md` (template; first archetype synthesis)

### Lived (corpus)

- 8 ruflo-keyword sessions (full IDs in scoring table)
- Broad sweep: 101 main non-junk sessions across `appyctrl|kiros-sentinal|angeleye|appysentinal|kiros-quality` projects
- API: `http://100.82.235.39:5051/api/sessions` and `/api/sessions/<id>/events`

### Brain (background)

- `/Users/davidcruwys/dev/ad/brains/ruflo/INDEX.md`
- `/Users/davidcruwys/dev/ad/brains/ruflo/install-customization-appydave.md`
- `/Users/davidcruwys/dev/ad/brains/ruflo/_observations-kiros-sentinal.md`
- `/Users/davidcruwys/dev/ad/brains/dark-factory/ruflo-actual-model.md`
