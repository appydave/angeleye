# Ruflo / claude-flow — Topology Research

**Started:** 2026-05-07
**Researcher:** Claude Opus 4.7 (1M)
**Question:** How does claude-flow (the upstream project that AppyDave's "Ruflo" wraps) model swarm topologies and agent team composition, and how should AngelEye's workflow factory model accommodate Ruflo-shaped runs alongside BMAD-shaped runs?
**Status:** First pass — research and proposals only. No requirement docs, no code changes.

This complements `docs/intelligence/ruflo-investigation.md` (the living evidence ledger about whether David's video showed real Ruflo execution). This doc covers the upstream architecture; the ledger covers per-session detection.

---

## Executive summary

1. **`claude-flow` was renamed to `ruflo` upstream in 2026** — `github.com/ruvnet/claude-flow` now redirects to `github.com/ruvnet/ruflo`. The npm package `claude-flow@latest` (v3.6.27 as of 2026-05-04) still publishes the old name. The local upstream clone at `/Users/davidcruwys/dev/upstream/repos/ruflo/` shipped with `package.json` `name: "claude-flow"`, `version: "3.6.27"` (file:8).
2. **claude-flow is plumbing, not a runtime.** It is (a) a CLAUDE.md/AGENTS.md prompt layer that tells Claude Code or Codex how to coordinate, (b) an MCP server exposing `swarm_init`, `agent_spawn`, `memory_*`, `neural_*` tools, and (c) a SQLite database (`.swarm/memory.db`) for HNSW vector memory. The actual work is done by Claude Code's native `Task` tool subagents — claude-flow does not own an executor.
3. **Four canonical topologies**: `hierarchical` (queen + worker delegation), `mesh` (peer-to-peer), `ring` (sequential pipeline), `star` (centralised hub). A fifth, `adaptive`, switches between the others at runtime based on heuristics or a small ML model. Default in v3.5+ docs is `mesh`; the canonical "anti-drift coding swarm" preset is `hierarchical` with `maxAgents: 8`, `strategy: "specialized"`.
4. **The "meta-prompt that builds JSON" mechanism is real but narrower than the framing suggests.** Ruflo's CLAUDE.md and per-coordinator agent definitions are large prompt templates that instruct the host LLM to emit `mcp__ruv-swarm__swarm_init({...})` and a batch of `Task({prompt, subagent_type, name, run_in_background})` calls **in a single message**. The "JSON" is the literal arguments-object the LLM types for those tool calls. Composition is **runtime LLM-decided within a fixed schema** (topology enum, agent-type enum, named-agent slot pattern) — not free-form, not pure declarative, not pure orchestration code.
5. **For AngelEye:** Ruflo runs map naturally onto a new `AffinityGroup` of type `swarm_run`, with a corresponding `WorkflowType` whose `stations` are the swarm coordinator + the named workers it spawns. The topology becomes a `WorkflowType.metadata` field. Detection signals are deterministic and cheap — Bash invocations of `npx claude-flow`, `swarm_init` MCP tool calls, or the `ruv-swarm` MCP server name.

---

## claude-flow architecture overview

### Repo and version

- Upstream: `https://github.com/ruvnet/ruflo` (formerly `github.com/ruvnet/claude-flow`, now redirects)
- Local clone: `/Users/davidcruwys/dev/upstream/repos/ruflo/`
- npm package: `claude-flow@latest` → currently `3.6.27`
- Claimed stable release: **v3.6** (2026-04-29) "agent federation and comms-first coordination, 6,000+ commits, 314 MCP tools, 16 agent roles + custom types, 19 AgentDB controllers, 21 native plugins" (`/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:1-7`)
- Companion packages: `@claude-flow/cli@3.6.10`, `claude-flow@3.6.10`, `ruflo@3.6.10`

### Three layers

From `/Users/davidcruwys/dev/ad/brains/ruflo/INDEX.md:46-52` and the upstream `package.json`:

1. **Prompt layer** — `CLAUDE.md` / `AGENTS.md` and per-agent markdown files in `.claude/agents/` instruct the host CLI how to coordinate
2. **MCP server** — exposes tools like `mcp__ruv-swarm__swarm_init`, `mcp__claude-flow__agent_spawn`, `mcp__claude-flow__memory_store`, `mcp__claude-flow__neural_patterns`, `mcp__claude-flow__neural_train`
3. **SQLite database** — `.swarm/memory.db` with HNSW vector index, ~12 tables (memory_entries, vectors, patterns, sessions, swarms, …)

The host CLI (Claude Code in "Mode B", Codex in "Mode A") is the executor. claude-flow CLI commands return immediately — they don't spawn workers.

### Two operating modes

From `/Users/davidcruwys/dev/ad/brains/ruflo/INDEX.md:54-62` and `/Users/davidcruwys/dev/ad/brains/dark-factory/ruflo-actual-model.md:34-43`:

| Mode                        | Coordinator API          | Executor                            | Pattern                                                                         |
| --------------------------- | ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------- |
| **Mode A — Codex**          | claude-flow CLI commands | Codex CLI itself                    | Ledger only — Codex does sequential work                                        |
| **Mode B — Claude Code** ⭐ | claude-flow MCP tools    | Claude Code's `Task` tool subagents | MCP `swarm_init` + N `Task()` calls in one message → subagents do parallel work |

David uses Mode B. Mode A is a fallback hedge.

### Lifecycle

```
1. User triggers (Auto-Start Swarm Protocol on "complex task")
2. Host LLM emits ONE message containing:
     a. mcp__ruv-swarm__swarm_init({ topology, maxAgents, strategy })   ← coordination state
     b. N × Task({ prompt, subagent_type, name, run_in_background:true }) ← actual workers
     c. SendMessage({ to: <first-worker>, message: <task-context> })       ← kick-off
     d. TodoWrite([...])                                                   ← shared todo list
3. Subagents run in background, communicate via SendMessage to named peers
4. Lead agent integrates results, posts back to user
5. post-task hooks fire, neural_train + memory_store persist patterns
```

Source: `/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:252-298` (the full "Auto-Start Swarm Protocol" code block).

### CLI surface (verified from upstream)

```bash
npx claude-flow@latest init [--full | --minimal] [--with-embeddings]
npx claude-flow hive init --topology <mesh|hierarchical|ring|star|adaptive> --agents N
npx claude-flow hive status
npx claude-flow hive monitor --live
npx claude-flow orchestrate "<task>" --agents N --topology <type> --parallel
npx claude-flow agent spawn <type> --capabilities "skill1,skill2"
npx claude-flow memory init|store|recall|search|export
npx claude-flow-codex dual run <template> --task "<task>"
npx claude-flow-codex dual run --worker "<platform>:<role>:<prompt>"
```

CLI commands shown in: Quick Start wiki (https://github.com/ruvnet/ruflo/wiki/Quick-Start), CLAUDE.md dual-mode section (`/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:155-174`).

---

## Agent team composition mechanism — the JSON structure question

David's framing was: "claude-flow uses meta prompts that build little JSON structures that look like agent teams." This is verified, with two important nuances.

### Verified: there ARE agent definition files

Top-level role templates at `/Users/davidcruwys/dev/upstream/repos/ruflo/agents/`:

```
architect.yaml
coder.yaml
reviewer.yaml
security-architect.yaml
tester.yaml
```

Documented schema (from https://github.com/ruvnet/ruflo/wiki/Agent-System-Overview, YAML frontmatter form):

```yaml
---
name: agent-name
type: agent-type # coordinator | developer | tester | analyzer | security | synchronizer | …
color: '#HEX_COLOR'
description: Brief description
capabilities:
  - capability_1
  - capability_2
priority: high|medium|low|critical
hooks:
  pre: |
    echo "Pre-execution commands"
  post: |
    echo "Post-execution commands"
---
# Agent Documentation
…
```

A second documented form (less common in repo) — `.claude-flow/agents.yml`:

```yaml
agents:
  agent-name:
    type: [architect|coder|tester|analyst|researcher|specialist]
    capabilities: [list of skills]
    neural_patterns: [pattern names]
    memory_access: [read-write|read-only]
    coordination_priority: [low|high|critical]
```

(Source: https://github.com/ruvnet/ruflo/wiki/Hive-Mind-Intelligence)

### Verified: the swarm_init call IS a JSON config

```javascript
mcp__ruv -
  swarm__swarm_init({
    topology: 'hierarchical',
    maxAgents: 8,
    strategy: 'specialized',
  });
```

This is the canonical "anti-drift coding swarm" preset (`/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:96-102`). The arguments-object IS the swarm declaration.

### Where the "meta-prompt builds JSON" framing comes from

The Ruflo `CLAUDE.md` and the per-coordinator agent files (e.g. `hierarchical-coordinator.md`, `adaptive-coordinator.md`) are large instructive prompt templates that the host LLM reads as system context. They tell the LLM:

- when to call `swarm_init`
- which topology to pick for which task shape
- how to construct the batch of `Task()` calls
- how to wire up SendMessage between named workers

Concrete example, from `/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:252-289`:

```javascript
// STEP 1: Initialize swarm coordination via MCP
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// STEP 2: Spawn NAMED agents concurrently — all in ONE message
Task({ prompt: "Research requirements and codebase. SendMessage findings to 'architect' when done.",
       subagent_type: "researcher", name: "researcher", run_in_background: true })
Task({ prompt: "Wait for research from 'researcher'. Design implementation. SendMessage design to 'coder'.",
       subagent_type: "system-architect", name: "architect", run_in_background: true })
Task({ prompt: "Wait for design from 'architect'. Implement the solution. SendMessage code paths to 'tester'.",
       subagent_type: "coder", name: "coder", run_in_background: true })
…
```

The LLM **types** that block of code into a Task tool call. The "JSON" is the live arguments to the tool calls. The "meta-prompt" is the CLAUDE.md instructions that train the LLM to produce that exact shape.

### The honest characterisation

| Claim                                                              | Verdict                                                                                                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Pure declarative agent teams in JSON files"                       | **False.** Top-level YAML files (`agents/*.yaml`) are role templates, not team compositions. Team composition happens at runtime.                                               |
| "Pure LLM free-improvisation"                                      | **False.** The CLAUDE.md prescribes the exact shape (topology enum, ordered Task calls, named workers, SendMessage wiring).                                                     |
| "Meta-prompts that emit JSON-shaped tool calls"                    | **True.** This is the actual mechanism. The LLM reads the prompt-layer instructions and types `swarm_init({...}) + Task({...}) + SendMessage({...})` — JSON-arg tool calls.     |
| "Composition decided at runtime by the LLM, within a fixed schema" | **True.** Topology enum is fixed; agent-type enum is fixed; the LLM picks N (≤ maxAgents), selects which agent types to spawn, names them, and writes their per-worker prompts. |

So David's intuition was right — the JSON-team-config exists, but it lives ephemerally in the assistant turn rather than as a persisted file. There's no swarm.json at rest.

### Pre-built collaboration templates exist

`/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:144-152`:

| Template   | Workers                                           | Pipeline                 |
| ---------- | ------------------------------------------------- | ------------------------ |
| `feature`  | 🔵 Architect → 🟢 Coder → 🔵 Tester → 🟢 Reviewer | Full feature development |
| `security` | 🔵 Analyst → 🟢 Scanner → 🔵 Reporter             | Security audit workflow  |
| `refactor` | 🔵 Architect → 🟢 Refactorer → 🔵 Tester          | Code modernization       |
| `bugfix`   | 🔵 Researcher → 🟢 Coder → 🔵 Tester              | Bug investigation & fix  |

These are programmatic compositions exposed via `npx claude-flow-codex dual run <template>` and the TypeScript API:

```typescript
const workers = CollaborationTemplates.featureDevelopment('Add OAuth login');
const results = await orchestrator.runCollaboration(workers, 'Implement OAuth feature');
```

(`/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md:228-246`)

So the picture is mixed: **some** swarm shapes are pre-baked named templates; **most** are LLM-composed at runtime from the instructions in CLAUDE.md.

---

## Topologies supported and what each implies

From the `adaptive-coordinator.md` template (`/Users/davidcruwys/dev/upstream/repos/ruflo/.claude/agents/swarm/adaptive-coordinator.md`) and the Hive Mind wiki (https://github.com/ruvnet/ruflo/wiki/Hive-Mind-Intelligence):

| Topology       | Shape                                                     | Documented when-to-use                                                                   | Coordination overhead                    |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| `hierarchical` | Queen + delegated workers, cascading                      | Complexity > 0.8, interdependencies > 0.7, central decision-making, resource arbitration | High efficiency, clear hierarchy         |
| `mesh`         | Peer-to-peer, all-to-all                                  | Parallelizability > 0.8, exploration, peer review                                        | Moderate efficiency, high coord overhead |
| `ring`         | A → B → C → A sequential                                  | Sequential pipeline, dependent stages, data processing                                   | Consistent, moderate                     |
| `star`         | Hub + spokes                                              | Simple centralised control, prototyping                                                  | Simple, single point of failure          |
| `adaptive`     | Switches at runtime based on heuristics or small ML model | When task shape is unknown upfront                                                       | Variable; pays a measurement cost        |

### Topology selection heuristic (lifted from adaptive-coordinator.md)

```python
def recommend_topology(self, characteristics):
    if characteristics['complexity'] == 'high' and characteristics['interdependencies'] == 'many':
        return 'hierarchical'
    elif characteristics['parallelizability'] == 'high' and characteristics['time_sensitivity'] == 'low':
        return 'mesh'
    elif characteristics['interdependencies'] == 'sequential':
        return 'ring'
    else:
        return 'hybrid'
```

(File: `/Users/davidcruwys/dev/upstream/repos/ruflo/.claude/agents/swarm/adaptive-coordinator.md`, around the topology recommendation block.)

### David's anti-drift preset

For coding work, the upstream CLAUDE.md (file:84-102) prescribes:

- topology: `hierarchical` (always)
- maxAgents: 6-8
- strategy: `specialized`
- consensus: `raft` (single leader)
- Frequent post-task checkpoint hooks
- Shared memory namespace
- Short verification gates

This is the closest thing to a "default" for software-build use. It maps 1:1 onto David's BMAD tmux pattern (`/Users/davidcruwys/dev/ad/brains/ruflo/bmad-tmux-vs-ruflo-mode-b.md`).

### Three coordination patterns over the topologies

(From the upstream playbook gist https://gist.github.com/ruvnet/9b066e77dd2980bfdcc5adf3bc082281 and the upstream CLAUDE.md)

- **Pipeline** (sequential): `architect → developer → tester → reviewer`, each `SendMessage`s the next
- **Fan-out / Fan-in** (parallel collection): lead spawns N workers, collects, synthesises
- **Supervisor / Worker** (bidirectional): lead ↔ worker-1, lead ↔ worker-2, persistent two-way

These patterns are what David's curated `ruflo` skill calls "Pipeline / Fan-out / Supervisor" — and what the install-customization plan recommends moving out of CLAUDE.md and into per-pattern skills (`/Users/davidcruwys/dev/ad/brains/ruflo/install-customization-appydave.md:67-83`).

---

## Local Ruflo wrapper findings

David has built a real, committed wrapper. It is not just a research thread.

### The brain (rationale)

Location: `/Users/davidcruwys/dev/ad/brains/ruflo/`

| File                                | Purpose                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INDEX.md`                          | Brain index, version notes, mental model                                                                                                                         |
| `install-customization-appydave.md` | The 5-customization install plan (use `--full --with-embeddings`, prune 98 → ~13 agents, lift coordination patterns out of CLAUDE.md, prune skills, verify HNSW) |
| `bmad-tmux-vs-ruflo-mode-b.md`      | Direct comparison: same hierarchical pattern, different transport (separate Claude processes vs subagents-in-process)                                            |
| `_observations-kiros-sentinal.md`   | Live observation log from first real install on kiros-sentinal — 119 files added, 0 modified, 88 commands installed, additional prune categories identified      |

### The skill (action)

Location: `/Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/SKILL.md`
Cache: `/Users/davidcruwys/.claude/plugins/cache/appydave-plugins/appydave/3.35.0/skills/ruflo/`

Trigger phrases: "install ruflo", "set up ruflo", "ruflo init", "prune ruflo", "ruflo status", "ruflo customize", "what does ruflo install", "orient", "what agents do I have", etc.

10 operations (SKILL.md:21-32):

| Operation        | What it does                                                               |
| ---------------- | -------------------------------------------------------------------------- |
| install          | `npx claude-flow@latest init --full --with-embeddings` after pre-checks    |
| memory-init      | Initialises persistent HNSW + vector memory in `.swarm/memory.db`          |
| prune            | Interactive — deletes ~117 of the 119 installed files                      |
| status           | Reports counts, HNSW state, prune candidates                               |
| refresh-upstream | Pulls latest upstream, detects drift, flags when defaults need review      |
| upgrade          | Safe upgrade of installed project, backs up CLAUDE.md, re-prunes           |
| watch            | Live observability dashboard (refreshes every 2s)                          |
| capture-swarm    | Post-build ritual — writes `docs/swarm-builds/<date>.md` and AgentDB entry |
| orient           | Reads live agent inventory and recommends workflow pattern                 |
| (plain reading)  | All 6 ops gate at install/maintenance, not at swarm execution              |

**Critical for AngelEye detection**: this skill almost never invokes `claude-flow` to run a swarm. It invokes `npx claude-flow@latest init`, `sqlite3`, `ls`, `rm -rf`. The investigation in `docs/intelligence/ruflo-investigation.md` already concluded zero real swarm executions in tagged sessions.

### What's NOT yet built

- No `ruflo-spawn` skill at the user level (per `install-customization-appydave.md:73-83`, this is planned but not done)
- No `ruflo-pipeline` / `ruflo-fanout` / `ruflo-supervisor` skills extracting coordination patterns out of CLAUDE.md into on-demand skills
- No mechanism to actually trigger a swarm (`mcp__ruv-swarm__swarm_init` from within David's normal sessions)

The plumbing is installed in projects (kiros-sentinal); the trigger surface for using it has not been built. This is consistent with the investigation finding that no real Ruflo Swarm execution shows up in the AngelEye corpus.

---

## Mapping to AngelEye's factory model — concrete proposals

These are first-pass proposals, not requirement docs. Each maps a Ruflo concept to existing AngelEye types from `shared/src/angeleye.ts`.

### Proposal 1 — Add `swarm_run` to `AffinityGroupType`

`shared/src/angeleye.ts:338`:

```typescript
export type AffinityGroupType = 'story_unit' | 'epic_sprint' | 'project_phase' | 'ad_hoc';
//                                                                                ^^ add: | 'swarm_run'
```

A `swarm_run` group bundles: the orchestrator session that called `swarm_init` + the worker sessions/subagents it spawned. Sibling concept to `story_unit` (which bundles BMAD phases of one story).

**Why it deserves its own group_type:** unlike `story_unit` (lifecycle-shaped) or `epic_sprint` (multi-day), a swarm_run is short-lived (minutes to hours), parallel-shaped, and the workers don't necessarily live in separate sessions — they may be `Task` tool subagents within the same session. The grouping criteria is different (one session + N tool calls vs N sessions linked by trigger_command).

### Proposal 2 — Register a `WorkflowType` per swarm template

`shared/src/angeleye.ts:378`:

```typescript
export interface WorkflowType {
  id: string; // e.g. "ruflo-feature-pipeline-claude-only"
  name: string; // "Ruflo Feature Pipeline (Claude-only)"
  domain: string; // "ruflo"
  stations: StationConfig[];
  ceremony_level: CeremonyLevel;
  skip_rules: SkipRule[];
}
```

Pre-built Ruflo templates (`feature`, `security`, `refactor`, `bugfix`) become first-class `WorkflowType` registrations. Custom swarms (LLM-composed at runtime via the auto-start protocol) become a single `ruflo-adhoc-swarm` WorkflowType whose stations are inferred from the actual `Task()` calls observed.

Speculation flag: this requires the correlator (the layer that doesn't exist yet for BMAD either) to inspect `Task()` arguments and reconstruct the spawn order. Cheap to add to the same correlator pass.

### Proposal 3 — Topology lives in `WorkflowType.metadata` (or extend the type)

Topology is foundational to Ruflo and isn't representable in the current `WorkflowType` shape. Two ways:

a. **Stuff it in metadata** (low-risk, no schema change):

```typescript
// hypothetical metadata field — not yet in WorkflowType
metadata: { topology: 'hierarchical', max_agents: 8, strategy: 'specialized', consensus: 'raft' }
```

b. **Extend the type** (cleaner but invasive):

```typescript
export interface WorkflowType {
  …
  topology?: 'hierarchical' | 'mesh' | 'ring' | 'star' | 'adaptive';  // optional, only Ruflo populates
  max_agents?: number;
  coordination_strategy?: 'specialized' | 'balanced' | 'adaptive';
}
```

For BMAD these stay undefined. For Ruflo they're populated. Cleaner because topology fundamentally changes how stations relate (mesh = bidirectional, ring = cyclic, hierarchical = tree).

### Proposal 4 — `WorkflowDomain.role_mappings` for Ruflo

For BMAD, role_mappings keys on slash-commands (`/bmad-sm`, `/bmad-dev`, …). Ruflo doesn't use slash-commands; it uses `Task({subagent_type})` arguments and `mcp__ruv-swarm__agent_spawn(<type>, …)`.

So the lookup needs a different key. Suggested shape:

```typescript
const rufloOverlay: DomainOverlay = {
  domain: 'ruflo',
  role_mappings: {
    // key form: "tool:<tool>:<discriminator>"
    'tool:Task:researcher': { role: 'researcher', identity: null, actions: ['RA'] },
    'tool:Task:system-architect': { role: 'architect', identity: null, actions: ['AD'] },
    'tool:Task:coder': { role: 'builder', identity: null, actions: ['IM'] },
    'tool:Task:tester': { role: 'tester', identity: null, actions: ['TS'] },
    'tool:Task:reviewer': { role: 'reviewer', identity: null, actions: ['RV'] },
    'mcp:swarm_init:hierarchical': { role: 'orchestrator', identity: 'queen', actions: ['OR'] },
    'mcp:swarm_init:mesh': { role: 'orchestrator', identity: 'mesh-coord', actions: ['OR'] },
  },
};
```

The classifier would need a small extension to look up tool-call+arg patterns, not just trigger_command. That's the only structural addition; everything else fits.

### Proposal 5 — A new `session_kind` for the Ruflo orchestrator session

Currently: `'main' | 'subagent' | 'subprocess'` (`shared/src/angeleye.ts:289`).

A Ruflo orchestrator session is `main` (human-driven) but plays a special role — it's the swarm captain. The Task subagents it spawns appear as event-level `Agent` calls, not separate registry entries (because Task subagents don't get session JSONLs). So we don't need a new kind for the workers, just for the captain.

Option: add `'swarm_orchestrator'` to `session_kind`, OR reuse `'main'` with a new flag like `is_swarm_captain: boolean`. The flag is lighter; it's not a different kind of session, just a marker.

Speculation: until real Ruflo Swarm sessions appear in the corpus (per the investigation, none have appeared yet), defer the decision. The detection signals below are deterministic — easy to backfill once data exists.

### Proposal 6 — A `parent_orchestrator_session_id` field still helps Ruflo

The handover doc (`docs/planning/handover-2026-05-07-corpus-cleared.md:88`) proposes adding `parent_orchestrator_session_id` for BMAD. The same field works for Ruflo if real Ruflo sessions ever spawn separate orchestrator + worker sessions (they don't today — Mode B does Task subagents in-process). It's not a Ruflo-driven need today, but the field is generic and would also serve any future "spawns a sub-session" pattern.

---

## Detection signals AngelEye could use

These are deterministic — no LLM needed. Cheap to compute at sync time.

### Tier 1 — strongest signals (real Ruflo Swarm execution)

| Signal                                                                           | Source                                                                          | What it confirms                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- | ------------------------------------------ |
| Bash command matches `/(npx\s+)?claude-flow\s+(swarm                             | hive                                                                            | orchestrate)/`                          | `tool_summary.command` on Bash events | The session shelled out to claude-flow CLI |
| MCP tool call to `mcp__ruv-swarm__swarm_init` or `mcp__claude-flow__agent_spawn` | event.tool field                                                                | The session called the Ruflo MCP server |
| MCP tool call to `mcp__claude-flow__memory_*`                                    | event.tool field                                                                | The session used Ruflo's HNSW memory    |
| `.swarm/memory.db` file present in cwd or referenced in events                   | filesystem inspection at sync, or Edit/Read events targeting `.swarm/memory.db` | Project has Ruflo installed             |

If any Tier 1 signal fires → high-confidence `swarm_run` AffinityGroup candidate.

### Tier 2 — wrapper signals (Ruflo plumbing operated, no swarm executed)

| Signal                                              | Source            | What it confirms                        |
| --------------------------------------------------- | ----------------- | --------------------------------------- | ------------------- | -------------------- | -------------------------------------------------- |
| `trigger_command === '/appydave:ruflo'` or `/ruflo` | classifier output | David invoked the curated wrapper skill |
| Bash command matches `/(npx claude-flow.\*init      | memory init       | prune                                   | refresh-upstream)/` | tool_summary.command | Maintenance operations only — install/prune/status |

If only Tier 2 fires (and Tier 1 does not) → `ruflo_wrapper_maintenance` subtype, NOT a swarm run. This is what the existing investigation calls "wrapper-without-swarm" and the dominant pattern in the corpus today.

### Tier 3 — weak signals (could be Ruflo, could be something else)

| Signal                                                                | Source                      | Caveat                                                                              |
| --------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| Multiple `Task({run_in_background:true})` calls in one assistant turn | event sequence inspection   | Could also be Claude Code Task subagents without Ruflo                              |
| `SendMessage` tool calls between named agents                         | event.tool field            | Real Ruflo coordination signal, but SendMessage exists in Anthropic Agent Teams too |
| Specific worker prompts containing "SendMessage findings to '<name>'" | `tool_summary.prompt` regex | Strong text signal, but could also be a manually-typed instruction                  |

Use Tier 3 only as confirmation alongside Tier 1 or 2.

### Co-occurrence with existing signals

- Ruflo Mode B will co-occur with `has_parallel_subagent_bursts: true` (already extracted) and `has_task_orchestration: true`
- It may co-occur with `Agent` tool counts > 5 (Task subagents fire as Agent events)
- It will NOT co-occur with `session_kind: 'subagent'` because the workers are tool calls, not sessions

So a confident detection is something like:

```
has_task_orchestration && has_parallel_subagent_bursts &&
  (any Bash matches /claude-flow.*(swarm|hive|orchestrate)/ ||
   any tool ∈ {mcp__ruv-swarm__swarm_init, mcp__claude-flow__agent_spawn})
```

→ `subtype: build.ruflo_swarm_run` and create AffinityGroup `swarm_run`.

### What changes at ingestion vs at enrichment

Most signals are computable at sync (deterministic, no LLM). The only thing that benefits from enrichment is reconstructing the swarm shape — what workers were named, which messaged whom, was it pipeline or fan-out — which requires reading the assistant turn that issued the spawns. That fits naturally into the enrichment loop's existing per-session pass.

---

## Open questions for David

1. Does David want Ruflo runs to share the BMAD `WorkflowType` model, or live in their own concept (e.g. `SwarmRunType`)? They're both "factory workflows" but with different shape primitives — phase-sequential vs topology-coordinated.
2. Should `topology` be promoted to a first-class field on `WorkflowType`, or stay in metadata? The first is cleaner; the second avoids schema churn for BMAD.
3. The pre-built Ruflo templates (`feature`, `security`, `refactor`, `bugfix`) are LLM-orchestrated **collaboration recipes**, not user-typed slash-commands. Should they become first-class `WorkflowType` registrations (auto-detected from the template selection), or only the LLM-composed ad-hoc swarms?
4. When a Ruflo swarm fans out N parallel workers via `Task({run_in_background:true})`, do those workers become individual `StationInstance`s? Or one StationInstance with `subagent_count: N`? Both fit the schema; the choice affects how reports read.

These are not blockers — they're shape decisions for the next requirement-doc round.

---

## Sources

### External (cited)

- [GitHub: ruvnet/ruflo (formerly claude-flow)](https://github.com/ruvnet/ruflo)
- [Ruflo wiki: Hive Mind Intelligence](https://github.com/ruvnet/ruflo/wiki/Hive-Mind-Intelligence) — queen/worker, topology options, agents.yml schema
- [Ruflo wiki: Quick Start](https://github.com/ruvnet/ruflo/wiki/Quick-Start) — CLI commands and topology flags
- [Ruflo wiki: Agent System Overview](https://github.com/ruvnet/ruflo/wiki/Agent-System-Overview) — agent definition file format, role types, Task() spawning syntax
- [Ruflo wiki: Home](https://github.com/ruvnet/ruflo/wiki) — entry index
- [Claude Flow Playbook gist (ruvnet)](https://gist.github.com/ruvnet/9b066e77dd2980bfdcc5adf3bc082281) — coordination patterns, artifact-centric swarms, agent_spawn examples
- [Pasquale Pillitteri: "Claude Flow (Ruflo) v3.5: Complete Guide"](https://pasqualepillitteri.it/en/news/774/claude-flow-ruflo-multi-agent-orchestration-guide) — third-party walkthrough confirming v3.5+ structure

### Local upstream (cited)

- `/Users/davidcruwys/dev/upstream/repos/ruflo/CLAUDE.md` — operating manual: anti-drift preset, dual-mode protocol, auto-start swarm protocol (lines 84-298 most relevant)
- `/Users/davidcruwys/dev/upstream/repos/ruflo/package.json:1-9` — version 3.6.27, name still `claude-flow`
- `/Users/davidcruwys/dev/upstream/repos/ruflo/agents/coder.yaml`, `architect.yaml`, `reviewer.yaml`, `security-architect.yaml`, `tester.yaml` — top-level role templates
- `/Users/davidcruwys/dev/upstream/repos/ruflo/.claude/agents/swarm/hierarchical-coordinator.md` — Queen-led swarm coordination prompt template (lines 1-120)
- `/Users/davidcruwys/dev/upstream/repos/ruflo/.claude/agents/swarm/mesh-coordinator.md`, `adaptive-coordinator.md` — peer and adaptive coordinator templates

### Local AppyDave (cited)

- `/Users/davidcruwys/dev/ad/brains/ruflo/INDEX.md` — brain index, mental model, mode comparison
- `/Users/davidcruwys/dev/ad/brains/ruflo/install-customization-appydave.md` — David's 5-customization install plan
- `/Users/davidcruwys/dev/ad/brains/ruflo/bmad-tmux-vs-ruflo-mode-b.md` — direct comparison table
- `/Users/davidcruwys/dev/ad/brains/ruflo/_observations-kiros-sentinal.md` — live observation log
- `/Users/davidcruwys/dev/ad/brains/dark-factory/ruflo-actual-model.md` — "what Ruflo actually is" rationale
- `/Users/davidcruwys/dev/ad/appydave-plugins/appydave/skills/ruflo/SKILL.md` — the executable wrapper skill (10 operations)
- `/Users/davidcruwys/dev/ad/apps/angeleye/shared/src/angeleye.ts:338-431` — AffinityGroup, WorkflowType, StationConfig types
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/ruflo-investigation.md` — existing evidence ledger this doc complements
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/observations.jsonl` — existing intelligence entries on Ruflo (4 entries dated 2026-05-06 / 2026-05-07)
