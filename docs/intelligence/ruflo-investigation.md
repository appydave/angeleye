# Ruflo Investigation — Living Doc

**Started:** 2026-05-07
**Question:** When David made his Ruflo Swarm video, was he actually showing real Ruflo Swarm execution, or some other multi-agent mechanism (Claude Code Task subagents, Agent Teams, or main-agent background work)?
**Status:** investigating — accumulating evidence as Ruflo-related sessions are encountered during enrichment passes.

---

## Detection rules (deterministic — citable)

A session uses **real Ruflo Swarm** if:

1. Bash commands contain regex `/claude-flow|npx claude-flow|swarm init|swarm spawn/i`

A session uses **the Ruflo wrapper without swarm execution** if:

1. First prompt or any prompt contains `/appydave:ruflo` or `/ruflo`
2. AND no Bash commands match the above regex

A session uses **Claude Code Task subagents** if:

1. `Agent` tool calls present in events (independent signal — could co-occur with above)

A session uses **Agent Teams** if:

1. `session_kind === 'subagent'` on registry entry
2. OR `teammate_id` field is set
3. OR raw JSONL contains `<teammate-message>` markup at first user message

These are the four observable mechanisms. Detection runs against AngelEye event data — reproducible.

---

## Evidence ledger

Each entry: `session_id` | first-prompt opener | mechanism evidence | conclusion.

### `a6fde96f-eef3-4ada-a1c4-2c3a285bb2fe` (appyctrl, 2026-05-04 era)

| Signal                               | Value                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------- | ----- | ------------------ | ----- |
| First prompt                         | `/appydave:ruflo`                                                         |
| Workflow prompts                     | `refresh-upstream`, `install`, `commit`, `memory-init`, `status`, `prune` |
| Bash commands matching `/claude-flow | swarm                                                                     | ruflo | npx claude-flow/i` | **0** |
| `Agent` tool calls                   | 17                                                                        |
| Total events                         | 328                                                                       |
| Total prompts                        | 42                                                                        |

**Mechanism: Ruflo wrapper (install/maintenance) + Claude Code Task subagents.**

David's own prompts confirm uncertainty:

- P26: "Are we going to run a multi-agent workflow this time? Like a fan out or anything like that?"
- P31: "I need to understand what sort of swarm you're going to use"
- P38: "I don't know whether this should be done using Rooflow, or maybe we could just use our delivery review..."
- P39: "you have access to roof loo here. I don't want you to take action, but I want to understand, based on what the delivery review has done, how you would have used roof loo to do what..." — past hypothetical, confirms it wasn't used

**Conclusion:** No actual Ruflo Swarm execution. The 17 Agent calls were Claude Code's native Task subagents.

### `c408f239-869b-41a0-a40b-14afbea9fdbb` (appyctrl, 2026-05-04 era)

| Signal                                | Value                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| First prompt                          | "What can you tell me about the Ruflow agents we have at the moment and the workflows we've ever tested?" |
| Heuristic                             | `build.ruflo_orchestrator` (misclassified)                                                                |
| Bash commands matching swarm patterns | 0 (research session)                                                                                      |

**Mechanism: Skill-building, not skill-running.** This was David building the new "Rufus" companion skill, not running Ruflo. Heuristic was wrong.

### Other Ruflo-tagged sessions

(To be added as enrichment passes encounter them.)

---

## Patterns observed so far

1. **Wrapper-without-swarm is the dominant pattern.** The /appydave:ruflo skill is invoked for install/maintenance ("install", "prune", "memory-init", "status") but the actual claude-flow CLI is never called. No swarm task is launched.
2. **Multi-agent work in these sessions uses Claude Code Task subagents.** The `Agent` tool produces parallel work, but it's the native Claude Code mechanism, not Ruflo Swarm.
3. **The heuristic `build.ruflo_orchestrator` is misleading.** It fires on /appydave:ruflo invocation regardless of whether actual swarm execution occurred.

---

## What this means for the video

**If the video narration claimed:**

- "I'm running Ruflo Swarm" — likely incorrect; what was shown was Claude Code Task subagents
- "I just ran Ruflo install/setup" — accurate
- "I'm fanning out work across agents" — accurate, but the agents were Task subagents, not Ruflo swarm agents

The two mechanisms produce visually similar parallel work — distinguishing them requires examining the underlying calls.

---

## Salvage options

Possible paths forward:

1. **Re-record with real Ruflo Swarm** — actually invoke claude-flow CLI in Bash, demonstrate true swarm execution. Requires writing a script that launches a swarm task end-to-end.
2. **Reframe the existing video** — call it "Multi-agent fanout via Claude Code subagents" rather than "Ruflo Swarm." Honest, doesn't require re-recording.
3. **Make a follow-up that distinguishes the two mechanisms** — turn the confusion into educational content. Show what Ruflo Swarm actually looks like, contrast with Task subagents.

David has not chosen a path. This doc will hold evidence; the decision is his.

---

## How this doc gets updated

Future enrichment passes encountering Ruflo-related sessions should:

1. Run the detection rules against the session
2. Add an evidence-ledger entry with citations to specific events
3. Update "Patterns observed" if new mechanisms or surprises appear

The dreaming pass should pick this up automatically once it's running.

---

## Citations

- Event data: `http://100.82.235.39:5051/api/sessions/<session_id>/events`
- Detection script (deterministic): grep against tool_summary.command in Bash events
- Each evidence-ledger entry above cites the specific session_id and counts can be re-derived from events

This doc is the canonical investigation summary. The conversation that produced it is not.
