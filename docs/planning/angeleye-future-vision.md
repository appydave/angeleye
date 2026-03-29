# AngelEye — Future Vision

> From session observability to controlled acceleration.

This document captures where AngelEye could go, based on what it already does well and the gap it's uniquely positioned to fill in the agent orchestration landscape.

---

## The Gap AngelEye Can Fill

The agent tooling market is splitting into two camps:

**Autonomy-first systems** (Paperclip, Manus, AutoGPT) — optimise for throughput. Agents run unsupervised, spawn tasks recursively, and operate without human approval. The result: you wake up to 100 completed tasks, some great, some misaligned, with no way to have intervened. These systems are "procedurally persistent" but not strategically intelligent.

**Workflow-first systems** (LangGraph, Temporal, n8n) — optimise for control. Rigid, deterministic pipelines where agents follow predefined paths. Safe but slow, and they don't handle the messy reality of concurrent, overlapping, voice-driven AI work sessions.

Neither camp solves what David (and likely many Claude Code power users) actually want: **controlled acceleration** — the ability to run many agents in parallel while maintaining visibility, interruptibility, and delegation control.

AngelEye already has the hardest part: it understands Claude Code sessions at the event level. It can parse, classify, and model what agents are doing in real time. That semantic understanding is what every control plane needs but none of the autonomy tools have built properly.

---

## The Thesis

**AngelEye is not another Paperclip. It's the air-traffic control tower for all agent work.**

Paperclip starts from org chart metaphors (CEO, employees, heartbeats). AngelEye starts from operations center metaphors (sessions, runs, tasks, workspaces, attention, drift). That distinction matters — it means AngelEye's primitives are closer to how the work actually happens.

The evolution path:

```
Today:     Observability    → "What are my sessions doing?"
Next:      Task projection  → "What work state are they in?"
Then:      Control surface  → "I want to redirect this one."
Finally:   Orchestration    → "Spin up 3 agents for this plan."
```

---

## Five Properties of the Command Center

### 1. Live Operational Awareness (today)

See terminals/sessions as active units of work, not opaque chat logs. AngelEye already has the event stream, status indicators, and real-time Socket.io broadcasts for this. The Observer view is the foundation.

### 2. Task-State Projection (next)

Translate raw events into work objects with meaningful states:

| State            | What it means                            |
| ---------------- | ---------------------------------------- |
| Inbox            | New session, unreviewed                  |
| Investigating    | Agent is exploring/reading, no edits yet |
| Building         | Active code changes happening            |
| Ready for Review | Agent stopped, work looks complete       |
| Waiting on Human | Agent asked a question, no response      |
| Running          | Background agent executing autonomously  |
| Blocked          | Agent hit an error or needs input        |
| Done             | Work committed, session ended cleanly    |

This transforms the Observer from a session list into a Kanban board where cards move automatically based on event patterns. The classification system already detects the signals — tool patterns, idle gaps, stop reasons — that would drive these state transitions.

### 3. Interruptibility (then)

Step in, re-route, pin, freeze, or redirect a running line of work. Today AngelEye can observe the moment to intervene; adding actions (not just views) is the gap:

- **Pause attention** — flag a session for review before it continues
- **Escalate** — push a notification when a session enters a specific state
- **Pin** — keep a session visible regardless of sort order
- **Annotate** — add context that the next human (or agent) session can read

Some of these (pin, annotate) are close to what exists. Others (pause, escalate) require either Claude Code hook extensions or a companion process that can inject into sessions.

### 4. Delegation Control (future)

Make delegation visible, bounded, and policy-driven:

- See when an agent spawns subagents and what they're doing
- Set constraints: "this workspace only gets 3 concurrent agents"
- Review delegation chains before they execute
- Track cost/token spend per workspace, per initiative

This is where AngelEye diverges from Paperclip most sharply. Paperclip's recursive delegation is invisible by default — you find out what happened after the fact. AngelEye could make delegation a first-class visible operation.

### 5. Cross-Runtime Neutrality (long-term)

AngelEye's event model is already generic enough to classify work without requiring one specific orchestrator. The hook ingestion pipeline normalises events into a common format. Future stream adapters could ingest from:

- Claude Code (today, via hooks + transcript backfill)
- Paperclip (future adapter)
- OpenClaw / Codex (future adapter)
- Bare terminal sessions (future adapter)
- Cursor / other IDE agents (future adapter)

This makes AngelEye the neutral layer above all of them — the command center that works regardless of which agent system is doing the executing.

---

## What Controlled Acceleration Means in Practice

It's not "raw autonomy" (let agents run wild).
It's not "rigid control" (define every step in advance).
It's the middle ground:

- **Define lanes** — workspaces, initiatives, budgets
- **Let agents run** — within those lanes, autonomously
- **Watch the flow** — live task-state projection, not after-the-fact logs
- **Intervene when needed** — interruptibility at natural boundaries
- **Review in batches** — not every action, but every meaningful state change

The Ralphy workflow is already an instance of this pattern: plan → launch agents → watch results → intervene at wave boundaries → repeat. AngelEye could make that workflow native to the UI rather than requiring a coordinator session.

---

## What's Already Built That Supports This

| Capability                  | Current state                                     | What it enables               |
| --------------------------- | ------------------------------------------------- | ----------------------------- |
| Hook event pipeline         | Working, 25 event types                           | Live awareness                |
| Session registry            | Working, 924+ sessions                            | Identity + lifecycle tracking |
| Classification              | Working, 12+ types, 25 predicates, 7 observations | Automatic type detection      |
| Workspaces                  | Working, drag-and-drop                            | Grouping and organisation     |
| Real-time Socket.io         | Working                                           | Instant UI updates            |
| Session naming + write-back | Working                                           | Cross-tool session identity   |
| Transcript backfill         | Working                                           | Historical data import        |
| Analysis campaign           | 924 sessions analysed                             | Rich classification knowledge |
| Serial write queue          | Working                                           | Safe concurrent writes        |

The foundation is solid. The gaps are in task projection (events → work states), control actions (view → interact), and delegation visibility (subagent tracking → constraints).

---

## The Product Direction

> Agent orchestration + visibility + control, with a terminal-native command center UX.

Not a SaaS dashboard that replaces the terminal. A command center that sits alongside it — the way a team lead uses a project board while their engineers use their IDEs.

AngelEye is already the best-positioned tool to become this because it starts from the data, not the metaphor. It knows what sessions actually do, not what an org chart says they should do.

---

## Open Questions

1. **How much control is possible without Claude Code API extensions?** Today hooks are fire-and-forget — AngelEye can observe but not inject. Could a companion MCP server or scheduled task provide a feedback channel?

2. **Should task-state projection be rule-based or LLM-assisted?** The analysis campaign is producing rich classification knowledge. Some states (Blocked, Waiting on Human) might need LLM interpretation of the last few events.

3. **What's the right abstraction above sessions?** Sessions are ephemeral. Initiatives, campaigns, and projects are durable. The Organiser's workspaces are a start, but the hierarchy might need another level (workspace → initiative → session).

4. **Multi-machine visibility** — sessions run on M4 Mini and M4 Pro. The backfill already handles local files; how does cross-machine observability work? SSH polling? Supabase cold path? Event forwarding?

5. **Where does Paperclip fit?** Not as a competitor — as a possible execution backend. AngelEye provides the command center; Paperclip (or Claude Code directly, or Codex) provides the execution. The adapter pattern keeps this flexible.
