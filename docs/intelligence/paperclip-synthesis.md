---
title: Paperclip Synthesis — Codified Skill + Corpus Evidence + Harness Reframe
date: 2026-05-07
purpose: Pair the codified `brand-dave:paperclip` skill with what the AngelEye corpus actually shows about Paperclip in practice, and reframe the 8 "escape" sessions (E1 in the escapes ledger) as evidence of a fifth harness archetype rather than ingestion noise to be filtered.
sources:
  - /Users/davidcruwys/dev/ad/appydave-plugins/brand-dave/skills/paperclip/SKILL.md (codified intent — board operator)
  - /Users/davidcruwys/dev/ad/brains/paperclip/ (10 brain docs — fundamentals, concepts, adapters, companies, observations, handover)
  - /Users/davidcruwys/.claude/angeleye/registry.json (lived experience — 21 paperclip-mentioning sessions in local registry)
  - /Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/escapes-ledger.md (E1 category — 8 escape sessions)
  - /Users/davidcruwys/dev/ad/apps/angeleye/docs/requirements/2026-05-07-ingestion-detect-paperclip-workspaces.md
  - /Users/davidcruwys/.paperclip/instances/default/workspaces/ (5 live workspace UUIDs on disk)
  - ~/.claude/angeleye/archive/session-7a463d02-*.jsonl (operator session — David driving Paperclip)
spike_validates: .claude/skills/angeleye-retrieve/SKILL.md (Paperclip search via local registry; M4 corpus pagination found 0 paperclip path/UUID hits)
---

# Paperclip Synthesis — Skill + Corpus + Reframe

This is the fourth use of the synthesis pattern (after Ralphy, BMAD, AppyCtrl, Ruflo) and the first one for an archetype that was previously misclassified — Paperclip slipped past as **escape category E1** rather than being recognised as a harness archetype in its own right. The same skill+corpus pairing that surfaced the `build.campaign` mis-naming in Ralphy here surfaces something bigger: a missing **`harness_runs`** classification entirely.

---

## Spike validation — the retrieve skill works (with caveats)

Two attempts:

1. **M4 Tailscale corpus** (`http://100.82.235.39:5051/api/sessions`) — paged through ~64,800 sessions before manual stop. Cursor pagination didn't terminate (`hasMore` stayed true past the actual corpus size — likely a pagination bug worth its own observation), and zero paperclip-related hits surfaced. The list endpoint also doesn't expose `first_real_prompt` for older sessions in the same shape the local registry does.
2. **Local registry on Roamy** (`~/.claude/angeleye/registry.json`, 10,390 sessions) — found 21 paperclip-mentioning sessions in seconds via direct JSON scan.

The local registry is the authoritative evidence source for Paperclip on this machine because the 8 escape sessions (E1, ledger entry) and the JJ heartbeat sessions are all from March 2026 — before the M4 became the primary AngelEye host. The retrieve skill's `localhost:5051` example happens to be correct here for historical reasons.

**Caveat for the skill:** Searching for archetypes whose evidence predates a corpus migration is fragile. The retrieve skill should document "if recent → M4 Tailscale; if pre-2026-05 archetype evidence → also check local registry/archive."

---

## Codified Paperclip (what the skill + brain say)

The codified intent has two layers — much richer than any other AppyDave archetype I've inventoried:

### Layer 1 — `brand-dave:paperclip` skill (board operator interface)

Source: `/Users/davidcruwys/dev/ad/appydave-plugins/brand-dave/skills/paperclip/SKILL.md` (~307 lines).

Three tiers of curl-driven operations against `http://127.0.0.1:3100/api`:

| Tier                     | Purpose           | Examples                                                                                    |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| 1: Situational awareness | Read state        | List companies, dashboard, agents, issues, live runs, pending approvals                     |
| 2: Make things happen    | Mutate state      | Create issue, comment with @mention to wake agent, update issue, approve/reject, wake agent |
| 3: Fix the config        | Tune the platform | Set heartbeat interval, create project+workspace, fix workspace cwd, pause/resume agent     |

Conversational mapping (David says → API call) is explicit, e.g. "Wake the CEO" → `POST /api/agents/{ceoId}/wakeup`.

### Layer 2 — Brain docs (the mental model that frames the skill)

Source: `~/dev/ad/brains/paperclip/` — 10 files, last major update 2026-04-01.

| File                            | What it adds                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paperclip-fundamentals.md`     | "If OpenClaw is an employee, Paperclip is the company." Control plane, never an agent. Heartbeat model. Multi-company isolation.                                                    |
| `paperclip-concepts.md`         | Heartbeats, org chart, task hierarchy, governance, cost                                                                                                                             |
| `paperclip-adapters.md`         | All adapter types — `claude_local` is David's primary. **Spawns local `claude` CLI as child process; injects `PAPERCLIP_*` env vars; resumes session via `--resume <session-id>`.** |
| `paperclip-davids-companies.md` | Three companies designed: AngelEye Factory, Quality Loop, Brains Ops                                                                                                                |
| `paperclip-observations.md`     | Live observations from real sessions                                                                                                                                                |
| `paperclip-installation.md`     | Step-by-step install with the WHY                                                                                                                                                   |

### Critical fact for AngelEye

**Paperclip uses the `claude_local` adapter to spawn the actual `claude` CLI as a subprocess.** Each agent's heartbeat invocation produces a real Claude Code session — same JSONL format, same hook events, same AngelEye ingestion path. From AngelEye's perspective, a Paperclip-driven heartbeat looks identical to a David-typed `claude` invocation, except for two signatures:

1. The first user prompt is shaped: `"-\nYou are agent <UUID> (JJ). Continue your Paperclip work."`
2. Either `cwd` is the workspace (`~/.paperclip/instances/.../workspaces/<uuid>/`) or it's the workspace's configured `cwd` (a real project directory). Both patterns appear in evidence.

This is what makes Paperclip an AngelEye-relevant harness — it's not just an external system, it _generates Claude Code sessions in our corpus_.

---

## Lived Paperclip (what the corpus shows)

### Two distinct evidence shapes

| Shape                                           | Count                                 | What it is                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hosted-agent sessions** (heartbeat wake-ups)  | 18 in local registry                  | JJ ("Joy Juice agent") — agent UUID `27231022-...` (15) and `b38ea7f3-...` (3). Each session opens with `"You are agent <UUID> (JJ). Continue your Paperclip work."` |
| **Operator sessions** (David driving Paperclip) | 3 in local registry                   | David typing `claude` himself, then asking the assistant to drive Paperclip via the curl recipes                                                                     |
| **Workspace-pathed sessions** (E1 escapes)      | 8 (per ledger, no longer in registry) | Sessions whose `project_dir` matched `~/.paperclip/instances/*/workspaces/<uuid>/` directly                                                                          |

That's three distinct manifestations of one platform — and the classifier currently has zero of them in its vocabulary.

### Hosted-agent sessions — the quiet majority

**Date range:** 2026-03-21 → 2026-03-30 (a 9-day burst when David first set up Brand Joy company)

**Project distribution (per cwd):**

- `joy-juice` — 13 sessions
- `beauty-and-joy` — 5 sessions

**Classification status:**

- `is_junk: false` for all 18
- `session_subtype: null` for all 18 (never classified)
- `subtype_heuristic: null` for all 18 (heuristic never ran)
- `session_kind: null` for all 18

**Detection signature (high-confidence):** First user prompt matches `"You are agent [a-f0-9-]{36} \(.+\)\. Continue your Paperclip work\."`. This is Paperclip's deterministic wake-up template — perfect for ingestion-time detection.

**Sample event timeline** (session `3f66732c-274a-41de-ac84-2b813b39f249`, beauty-and-joy, 2026-03-21):

- t+0s: `user_prompt` "You are agent 27231022-... (JJ). Continue your Paperclip work."
- t+2.6s: `tool_use` Skill (loading the Paperclip agent SKILL.md from the spawned environment)
- t+8s onward: stream of Bash calls (the agent is doing its heartbeat-cycle work)

That's the canonical Paperclip-hosted shape — **terse heartbeat prompt + immediate Skill load + tool-heavy execution**.

### Operator sessions — David driving Paperclip

Three sessions where David himself initiated:

| session_id                             | started          | first prompt (truncated)                                                                                 |
| -------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `bb70eaaf-5036-4b8f-9046-297b923c1cdf` | 2026-03-21T05:06 | "Can you become my advisor for papwerclip ai... help me setup my first paperclipai, /who-am-i"           |
| `7a463d02-668a-466f-97aa-b1ea027c00a6` | 2026-03-30T11:59 | "Okay, I want you to interact with paperclip now. I want you to have a look at what employees we got..." |
| `8ebde1d0-3026-4585-a90b-28dc55452ba0` | 2026-03-30T14:15 | "Handover written to ~/Relay/paperclip/to-app/handover-2026-03-30.md..."                                 |

Session `7a463d02` is the richest sample: 443 events, 76 Bash calls, 44 Reads, 5 Agent calls, 1 CronCreate. The user prompts trace David exploring Paperclip, switching the CEO to Codex, and creating a side-project schedule — the full board-operator workflow that the SKILL.md codifies.

**Detection signature:** prompt contains "paperclip" (case-insensitive) AND `cwd` is NOT under `~/.paperclip/`. These are normal AngelEye sessions where the topic happens to be Paperclip.

### Workspace-pathed sessions — the E1 "escapes"

The ledger documents 8 sessions with `project_dir` matching `~/.paperclip/instances/default/workspaces/<uuid>/`:

| session_id     | workspace UUID (project field)    |
| -------------- | --------------------------------- |
| `7addf7ed-...` | cfcc0c4b-... (CEO per skill docs) |
| `b32962e2-...` | 8fd2ea7b-... (Spec Writer)        |
| `b653e697-...` | 54ea7cf7-... (CTO)                |
| `392a775c-...` | 8fd2ea7b-...                      |
| `f64f60e3-...` | cfcc0c4b-...                      |
| `1ede25a0-...` | 8fd2ea7b-...                      |
| `0510b580-...` | 8fd2ea7b-...                      |
| `631ec536-...` | cfcc0c4b-...                      |

**Critical observation:** All 8 workspace UUIDs match the agent IDs documented in the SKILL.md for the **AngelEye Factory** company (CEO/CTO/Spec Writer). Paperclip names workspaces after the agent ID. The 8 sessions are the AngelEye Factory's three agents executing heartbeats — exactly the Layer-1 architecture from `paperclip-adapters.md`.

The 8 sessions are no longer in the live registry (corpus was cleared in the 2026-05-07 enrichment reset, per `handover-2026-05-07-corpus-cleared.md`). Live workspace dirs as of today:

```
~/.paperclip/instances/default/workspaces/
├── 27231022-d305-4069-a16a-472c98259e33  (current JJ — Brand Joy)
├── b38ea7f3-b6d2-490a-aaa8-de963e2449d9  (alt JJ — Brand Joy)
├── cb5c5104-7225-4b60-ac9a-b8802567a3ab
├── d5f4cef0-3cd1-47bf-82d6-fedbc5c8a079
└── faf4afaf-8ecb-429b-b73b-e3f919f75b1a
```

The skill-documented AngelEye Factory IDs (`cfcc0c4b`, `54ea7cf7`, `8fd2ea7b`) are **gone** — those agents were torn down and replaced. Workspace UUIDs are not stable IDs we can hardcode.

---

## Gap analysis — codified intent vs lived behaviour

### What the codified Paperclip _is_

A multi-agent control plane with a REST API on `127.0.0.1:3100`. The skill is for the **board operator** (David) to interact with it. The brain explicitly says: "Paperclip never does work — it assigns work to agents and tracks it."

### What the corpus actually shows

Three things, none of which the skill explicitly anticipates AngelEye seeing:

1. **The agents that Paperclip orchestrates produce Claude Code sessions in our corpus** (the 18 hosted JJ sessions + the 8 escape AngelEye Factory sessions). The skill describes the API for talking to Paperclip; it doesn't describe what the workers leave behind in the JSONL transcripts. AngelEye is a third-party observer that the codified skill never mentions.
2. **Two distinct cwd patterns** for the same conceptual thing:
   - 18 JJ sessions had `cwd` = the workspace's _configured working directory_ (real project: `joy-juice`, `beauty-and-joy`)
   - 8 AngelEye Factory sessions had `cwd` = the workspace _itself_ (`~/.paperclip/instances/.../workspaces/<uuid>/`)
     The brain doc `paperclip-fundamentals.md` actually flags this: _"The fallback workspace is Paperclip trying to track its own internal session state, not JJ's working directory. JJ's actual work always happens in the configured working directory."_ So the 8 escapes were **fallback-workspace runs** (configuration not yet pointing at a real project) and the 18 were **configured-workspace runs**. Two states of the same archetype.
3. **No classification at all.** All 18 hosted sessions have `session_subtype: null`, `subtype_heuristic: null`, `session_kind: null`, `is_junk: false`. They're invisible to every AngelEye filter. They're not "escapes" being miscategorised — they're _not categorised_.

### The single biggest gap

**There is no `harness_runs` (or `harness_session`, `platform_hosted`, `subprocess_session`) classification in the AngelEye taxonomy.** The closest concepts:

- `session_kind: 'subprocess'` exists (per the requirement doc) but is currently used for Claude Code Agent Teams subagents detected via `<teammate-message teammate_id="...">` in raw JSONLs (see `docs/architecture/known-issues.md`)
- `is_junk: true` is the catch-all "don't enrich this" flag

The proposed E1 fix (set `session_kind: 'subprocess'` and `project: 'paperclip'`) treats Paperclip-hosted sessions as the same category as Agent Teams subagents — collapsing two genuinely different harness mechanisms into one bucket. That's the same kind of vocabulary collapse Ralphy hit (everything ends up `build.campaign` regardless of what drove the campaign).

### Detection signatures available (high → low confidence)

1. **Prompt template** (highest): `^-?\nYou are agent [a-f0-9-]{36} \(.+\)\. Continue your Paperclip work\.$` — Paperclip's deterministic wake-up. 18/18 hosted hits in corpus.
2. **Workspace cwd**: `cwd ~ ^.+/\.paperclip/instances/[^/]+/workspaces/[a-f0-9-]{36}/?$` — catches fallback-workspace runs (8/8 in escape ledger).
3. **PAPERCLIP\_\* env vars at session_start**: per the adapters doc, every Paperclip-spawned `claude` invocation has `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_RUN_ID` set. AngelEye's hooks could capture these at `session_start` for an authoritative signal — _if_ Claude Code's session_start hook input includes env. (Worth checking against `~/dev/ad/brains/anthropic-claude/claude-code/hooks/events-reference.md`.)
4. **`--resume` invocation**: heartbeat reuses the same session ID across wake-ups. Multiple sessions with the same JSONL would actually be _one_ logical agent's heartbeat history. AngelEye currently treats each as separate.

Combining 1+2 catches all known evidence. Adding 3 would make detection bulletproof and would surface the company/agent/run linkage in the registry itself.

---

## Reframe — Paperclip as a fifth harness archetype

David's reframe lands cleanly. The five archetypes share one trait: **they each codify a distinctive technique for orchestrating Claude Code work that produces sessions in the AngelEye corpus.** They differ in how they coordinate.

### The harness-technique axis

| Archetype     | Coordination mechanism                                                                                                  | What AngelEye sees                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BMAD**      | Multiple human-attended `claude` instances in tmux panes, coordinated via shared filesystem (story files)               | N independent main sessions, same project, sequential or near-simultaneous, each with `/appydave:bmad-*` triggers                                        |
| **Ruflo**     | Single `claude` session that fans out to subagents via `Task` tool (claude-flow v3.5+)                                  | One session with `has_task_orchestration: true`, `has_parallel_subagent_bursts: true`, sometimes `<teammate-message>` raw markers                        |
| **Ralphy**    | Single autonomous coordinator loop iterating waves inside one session                                                   | One session, massive event count (4k+), `subtype: build.campaign`, `trigger_command: ralphy`                                                             |
| **Paperclip** | External control plane spawns `claude` as a subprocess per heartbeat, env-var-injected, session-resumed across wake-ups | Many short sessions per agent, deterministic `"You are agent <UUID> (JJ)..."` prompt, optional `.paperclip/workspaces/<uuid>` cwd, classified as nothing |
| **AppyCtrl**  | T3.code fork — Claude Code reskinned with project-specific prompts and tools                                            | (Per appyctrl-synthesis.md — separate doc)                                                                                                               |

Paperclip is the only one of the five where **a non-Claude-Code system originates the work**. The others are Claude-Code-driven (David starts the session). Paperclip is platform-driven — heartbeats fire, agents wake, sessions get created without David in the loop.

### What "recognising Paperclip as a harness" would mean

Not necessarily code changes — this is a research synthesis. But the conceptual move is:

- **Stop treating the 8 escape sessions as bugs to filter.** They're evidence of Paperclip running. Filtering them silently means we lose the ability to ask "what did Paperclip do this week?"
- **Add a `harness` dimension to the registry**, parallel to `session_kind`. Possible values: `paperclip`, `bmad`, `ruflo`, `ralphy`, `appyctrl`, `none` (= ordinary direct user session). One session can be `kind: subprocess` AND `harness: paperclip` — kind tells AngelEye how to handle ingestion (don't ride hooks twice, etc.), harness tells the user what they're looking at.
- **Per-harness detection rules** become a first-class part of the classifier. Paperclip's rule is the prompt template + cwd pattern + (eventually) env vars. Ralphy's is the trigger command + event scale. BMAD's is the trigger command family + tmux pattern.
- **Per-harness analytics views** in the AngelEye UI. "Show me all Paperclip-hosted sessions this week, grouped by company, agent, and outcome" is a meaningful question that the current model can't answer — the data isn't tagged, and the UUID-as-project encoding loses the company-agent linkage entirely.

The escapes ledger remains valid as an _operational_ document (these are sessions slipping through unintended paths), but the _classification_ should live in a positive vocabulary (`harness: paperclip`), not a negative one (`escape: E1`).

---

## Open questions for David

1. **`harness` as a first-class dimension — yes/no?** The proposal above adds a parallel field to `session_kind`. Cheap (additive, no migration risk for existing fields), surfaces the archetype directly. Or: do you prefer a deeper rework of `session_subtype` to cover harness-driven categories like `harness.paperclip.heartbeat`?
2. **Fallback-workspace runs (the 8 escapes) vs configured-workspace runs (the 18 JJ sessions) — same or different?** Per the brain doc they're the same conceptual thing in different config states. Should the registry collapse them under one `harness: paperclip` flag, or distinguish (`harness_state: fallback_workspace` vs `harness_state: configured_workspace`)?
3. **Capture company/agent/run linkage from PAPERCLIP\_\* env vars?** Worth checking whether Claude Code's `session_start` hook input exposes child-process env vars. If yes, AngelEye could record `paperclip_company_id`, `paperclip_agent_id`, `paperclip_run_id` on the session — letting you query "what did the AngelEye Factory CEO do across all its heartbeats" without log mining. If no, prompt regex is the fallback.
4. **`--resume` collapsing.** A single Paperclip agent re-uses its session ID across heartbeats (per `paperclip-adapters.md`). Should AngelEye visualise these as one long session with N wake-up boundaries, or keep them as N short sessions with a `paperclip_run_id` linkage? Different answers serve different questions.
5. **Should the Paperclip skill itself be updated to acknowledge AngelEye?** Right now `brand-dave:paperclip` describes only the operator-facing API. A "Tier 4 — what the platform leaves behind" section pointing the operator at AngelEye for transcript history would close a loop the brain partially flags but the skill doesn't.
6. **Apply this reframe pattern to the other four archetypes?** Ruflo, BMAD, Ralphy, AppyCtrl all have synthesis docs. The "harness vs escape" distinction is sharper for Paperclip because of the platform-driven origin, but the underlying point — codify positive recognition rather than filter negatively — generalises. A short audit of the four existing synthesis docs through the harness-axis lens might surface similar reframing opportunities.

---

## Methodology note

This synthesis used the same skill+corpus+gap pattern as `ralphy-synthesis.md`, with one important deviation: the corpus side required **two evidence sources** because the lived data spans a 2026-05-07 corpus reset.

- The M4 Tailscale endpoint (canonical for current AngelEye) returned zero paperclip hits in 60K+ paged sessions. Either the older sessions never made it into M4's registry, or pagination has a defect (cursor never terminates).
- The local Roamy registry (`~/.claude/angeleye/registry.json`) had the 21 historical paperclip sessions intact, plus the archive JSONLs.
- The escapes ledger documented 8 more sessions that are now gone from both endpoints.
- The codified intent has _two_ layers (skill + brain) where the other archetypes have one. The brain docs added concepts (heartbeat, multi-company, fire-and-forget) that the skill alone wouldn't have surfaced.

**Generalisable insight:** when an archetype evidence trail predates a corpus migration, the local registry and archive must be cross-checked, not just the live API. The retrieve skill should grow a "look in archive" mode for historical archetype work.

**The reframe was the more important output than the gap.** For Ralphy/BMAD/AppyCtrl/Ruflo the synthesis pattern surfaced naming/detection drift. For Paperclip it surfaced an entirely missing category — and corrected a misframing (escape → harness). The next iteration of the synthesis pattern probably needs an explicit "is this archetype recognised as such, or is it being filtered out?" check as Step 0.
