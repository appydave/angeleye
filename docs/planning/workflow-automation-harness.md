# Workflow Automation — Harness Integration Architecture

**Status**: Architecture draft
**Provenance**: Handover from Ralphy multi-lens analysis session (2026-03-29)
**Brain context**: `~/dev/ad/brains/anthropic-claude/INDEX.md`, `~/dev/ad/brains/angeleye/workflow-model.md`
**Depends on**: `workflow-feature-requirements.md` (R1-R6)

---

## Purpose

Map Claude Code harness capabilities to AngelEye's factory workflow model. Each capability below has a concrete integration point in the workflow feature (R1-R6 from requirements).

---

## H1 — Hook-Driven Station Transitions

**Harness feature**: 25 hook events fire as Claude Code operates. Five are directly useful for workflow automation.

| Hook Event      | AngelEye Action                                                                   | Workflow Phase |
| --------------- | --------------------------------------------------------------------------------- | -------------- |
| `TaskCompleted` | Mark station complete, advance `current_station`                                  | Phase 2 (R2)   |
| `TaskCreated`   | Log sub-task spawn on active station, increment `subagent_count`                  | Phase 3 (R3.5) |
| `FileChanged`   | Trigger re-enrichment of `session-index.jsonl` — feed updated data to router      | Phase 2 (R2.1) |
| `CwdChanged`    | Detect project switch — route session to correct workspace before station binding | Phase 2 (R2.1) |
| `TeammateIdle`  | Assign next pending station to idle agent (dark factory mode)                     | Phase 4+       |

**Implementation approach**:

- Add hook listener endpoints to AngelEye's Express server (POST `/api/hooks/:event`)
- Hook configs in `.claude/settings.json` point to these endpoints
- Router receives hook payloads, correlates with active workflow instances, updates station state
- Socket broadcasts `workflow:updated` on state change

**Key constraint**: Hooks fire per-session. AngelEye must correlate the session to an active workflow instance before acting. The session-to-station router (R2) is prerequisite.

---

## H2 — Agent `initialPrompt` for Self-Starting Stations

**Harness feature**: Agent frontmatter `initialPrompt` auto-submits the first turn.

```yaml
---
name: bmad-ds-story-2.5
initialPrompt: '/bmad-dev DS 2.5'
---
```

**AngelEye integration**:

- Each `StationConfig` gains an optional `initial_prompt_template` field
- Template uses `{{work_item_id}}` and `{{action_code}}` placeholders
- When the workflow advances to a station with a template, AngelEye can generate the agent frontmatter
- The coordinator (or Sentinel) spawns the agent with the rendered template

**Template examples**:

| Station | Template                        |
| ------- | ------------------------------- |
| WN      | `/bmad-sm wn {{work_item_id}}`  |
| CS      | `/bmad-sm cs {{work_item_id}}`  |
| DS      | `/bmad-dev DS {{work_item_id}}` |
| DR      | `/bmad-dev DR {{work_item_id}}` |
| SHIP    | `/bmad-ship {{work_item_id}}`   |

**Phase**: Phase 4+ (requires agent spawning infrastructure)

---

## H3 — Swarm Teams for Inter-Agent Coordination

**Harness feature**: `TeammateIdle` hook + `SendMessage` tool (message, broadcast, request, response types) + `TeammateTool` (spawn, discover, join, approve, cleanup).

**AngelEye integration**:

Three out-of-workflow agents map to swarm team roles:

| Agent             | Swarm Role            | Coordination Pattern                                                                                                                                                       |
| ----------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sentinel**      | Observer teammate     | Receives `broadcast` from every station agent. Watches for anomalies, context exhaustion, drift from story scope. Sends `request` to station agent if intervention needed. |
| **Relay**         | Quality gate teammate | Listens for station completion via `TeammateIdle`. Runs handover quality check between outgoing and incoming stations. Posts `message` with verdict.                       |
| **Documentation** | Background teammate   | Receives `broadcast` on station completion. Updates canonical docs if station produced artifacts. Runs in background, never blocks pipeline.                               |

**Data flow**:

```
Station Agent completes work
    → TeammateIdle fires
    → AngelEye marks station complete
    → Relay runs handover check
    → Next station agent spawns (H2)
    → Sentinel observes via broadcast
    → Documentation updates in background
```

**Phase**: Phase 4+ (advanced orchestration — requires H1 + H2 working first)

---

## H4 — Persistent Plugin State for Campaign Progress

**Harness feature**: `${CLAUDE_PLUGIN_DATA}` directory survives plugin updates.

**AngelEye integration**:

Store durable state that shouldn't live in `data/` (which is app runtime data):

| State             | File              | Purpose                                  |
| ----------------- | ----------------- | ---------------------------------------- |
| Campaign progress | `campaigns.json`  | Which sessions analyzed, pending, failed |
| Active profile    | `profile.json`    | Analysis mode vs development mode        |
| Wave metrics      | `waves.json`      | Wave count, timing, discovery rates      |
| Automation config | `automation.json` | Which H1-H7 features are enabled         |

**Key distinction**: `data/` holds AngelEye's operational data (registry, workflows, events). Plugin state holds _meta-operational_ data about how AngelEye itself is being used.

**Phase**: Can implement incrementally — start with `automation.json` (feature flags for H1-H7).

---

## H5 — Background Agents for Parallel Pipeline Execution

**Harness feature**: `run_in_background=true` on Agent tool. `Ctrl+T` overlay shows up to 10 tasks.

**AngelEye integration**:

Two modes of parallel execution:

1. **Analysis campaigns** (existing): 9 parallel analysis agents processing session batches. Already proven in analysis-1 campaign. Automate via `TeammateIdle` → assign next batch.

2. **Multi-story pipelines** (new): When multiple stories are in-progress simultaneously, each station agent runs in background. The Workflows view shows all active agents. Socket events update station states in real-time.

**StationConfig addition**: `run_in_background: boolean` — defaults to `true` for DS (long builds), `false` for WN (interactive gatekeeper).

**Phase**: Phase 2 (basic background tracking), Phase 4 (automated background spawning)

---

## H6 — `--bare` Flag for Deterministic Operations

**Harness feature**: Zero-overhead scripted calls — skips hooks, LSP, plugin sync.

**AngelEye integration**:

Use `--bare` for helper scripts that don't need the full harness:

| Script                            | Purpose                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| `compute-session-shape.py`        | Calculate session metrics without triggering AngelEye's own hooks |
| `campaign-status.py --next-batch` | Query next batch for analysis agents                              |
| Workflow state queries            | Read `workflows.json` without triggering FileChanged hooks        |
| Health checks                     | Verify AngelEye server is running without generating events       |

**Implementation**: When AngelEye spawns helper processes (via Bash tool or agent), use `claude --bare` prefix for deterministic operations.

**Phase**: Immediate — no infrastructure needed, just a convention.

---

## H7 — Conditional Rules for Context-Appropriate Guidance

**Harness feature**: `.claude/rules/*.md` with `paths:` frontmatter for conditional loading.

**AngelEye integration** (already implemented):

| Rule File                | Paths                                                                                  | Purpose                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `workflow-automation.md` | `server/src/config/workflows/**`, `docs/planning/workflow-*`, `shared/src/angeleye.ts` | Loads harness reference links and design principles when editing workflow code |
| `mochaccino-index.md`    | `.mochaccino/**`                                                                       | Existing — ensures design indexes stay in sync                                 |
| `react-hooks.md`         | `client/src/**/*.tsx`, `client/src/**/*.ts`                                            | Existing — React hooks ordering rules                                          |

**Future rules to consider**:

- `analysis-campaign.md` — loads when touching `data/campaigns/` or analysis scripts
- `enrichment-pipeline.md` — loads when touching `server/src/services/*classifier*` or `*correlator*`

**Phase**: Immediate — `workflow-automation.md` created this session.

---

## Implementation Phases (Mapped to Workflow Feature R6)

| Workflow Phase                              | Harness Features                                                      | Status             |
| ------------------------------------------- | --------------------------------------------------------------------- | ------------------ |
| **Phase 1** — Schema + Static View          | H7 (rules)                                                            | H7 done            |
| **Phase 2** — Session Router + Live Binding | H1 (hooks), H5 (background basics)                                    | Next               |
| **Phase 3** — Backtracking + Sub-Agents     | H1 (TaskCreated hook)                                                 | Blocked by Phase 2 |
| **Phase 4** — Automation + Polish           | H2 (initialPrompt), H3 (swarm), H4 (plugin state), H5 (auto-spawning) | Blocked by Phase 3 |

**Standalone** (no phase dependency): H6 (`--bare` convention), H7 (conditional rules)

---

## Open Questions

1. **Hook endpoint security**: Should AngelEye's hook endpoints require a shared secret, or is localhost-only sufficient?
2. **initialPrompt ownership**: Does AngelEye generate agent frontmatter files, or does it call the Agent tool directly with `initialPrompt`?
3. **Swarm team persistence**: Do Sentinel/Relay/Documentation agents persist across station transitions, or spawn fresh per-station?
4. **Plugin state vs data/ boundary**: Should campaign progress really live in plugin state, or is `data/campaigns/` simpler and sufficient?

---

**Created**: 2026-03-29
**Last Updated**: 2026-03-29
