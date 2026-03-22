# Findings: W3-15 — brain-dynamous / setup.onboarding_and_integration (830bd3ac)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: setup.onboarding_and_integration
- **Confidence**: high
- **Reclassification**: refinement — BUILD is correct, but the subtype matters
- **Reasoning**: The registry's BUILD classification is accurate — this session produces real file artefacts (Write x2, Edit x5, Bash x17 including installs and moves). "bash-heavy" is also correct: Bash accounts for 17 of 31 tool_use events (54.8%). However, BUILD alone misses the structural character of this session. There is no product feature being built. The entire session is the initial setup, onboarding interview, and integration wiring of `brain-dynamous` — a pre-built personal AI second brain scaffold. David is activating the system for himself (filling in USER.md via BOOTSTRAP interview), wiring Gmail/Calendar OAuth credentials, and debugging the heartbeat script. The correct subtype is `setup.onboarding_and_integration`: the scaffold exists, the session brings it online.

---

## What is brain-dynamous?

`brain-dynamous` is a personal AI operating system scaffold built for Claude Code. It is not a product or client app. It is a self-contained second brain that wraps a user's personal context (identity, habits, schedule, integrations) around Claude Code's hook system to create an AI companion that knows who you are and checks in with you periodically.

Key structural components visible from the session:

- **`Dynamous/Memory/`** — persona and context files: `SOUL.md` (AI personality template), `USER.md` (owner profile), `MEMORY.md` (persistent key facts), `HEARTBEAT.md` (defines what to monitor), `BOOTSTRAP.md` (triggers onboarding interview on first launch, self-destructs afterward), `daily/` (daily context files)
- **`.claude/hooks/`** — `SessionStart`, `SessionEnd`, `PreCompact` hooks
- **`.claude/scripts/`** — Python scripts: `heartbeat.py`, `memory_search.py`, `memory_index.py` and others; all run in a `.venv` with `fastembed`, `claude-agent-sdk`, and integration deps
- **`.claude/scripts/.env`** — `OWNER_NAME`, `timezone`, and integration tokens (Gmail, Calendar, Asana, Slack, Circle, Supabase)
- **`master.env`** — top-level environment config
- **Integrations**: Gmail, Google Calendar, Asana, Slack, Circle (community platform), Supabase — wired via OAuth or API tokens
- **Heartbeat**: a scheduled Python script that gathers context from all integrations (inbox, calendar, tasks, community) and sends it to Claude as a periodic briefing. Costs ~$0.22/run.

This is not the `brains/` knowledge base system David uses elsewhere. It is a separate, opinionated scaffold designed as a ready-to-deploy personal AI companion — a "second brain OS." David appears to be activating it for the first time in this session.

---

## Session Shape

- **Events**: 51 total (20 user_prompt, 31 tool_use, 0 progress)
- **Total tool invocations**: 31
- **Bash**: 17 (54.8% of all tool_use events)
- **Edit**: 5 (16.1%)
- **Read**: 4 (12.9%)
- **Write**: 2 (6.5%)
- **Glob**: 2 (6.5%)
- **Skill**: 1 (3.2%)
- **Duration**: ~22 hours wall clock (2026-02-27T04:45 to 2026-02-28T02:59), split by an overnight gap. Active working time is approximately 2–3 hours across two sessions of work: (1) onboarding interview (04:45–04:58 on Feb 27), (2) integration setup and heartbeat debugging (01:57–02:59 on Feb 28)
- **Real user prompts**: 20
- **cwd shift**: yes — starts at `/Users/davidcruwys/dev/ad/brain-dynamous`, shifts to `/Users/davidcruwys/dev/ad/brain-dynamous/.claude/scripts` from event 35 onward (once David is debugging `heartbeat.py`)
- **Opening style**: structured, paste-heavy — David pastes the full directory tree of the brain-dynamous scaffold to orient Claude

### Tools Breakdown

| Tool  | Count | % of tool_use |
| ----- | ----- | ------------- |
| Bash  | 17    | 54.8%         |
| Edit  | 5     | 16.1%         |
| Read  | 4     | 12.9%         |
| Write | 2     | 6.5%          |
| Glob  | 2     | 6.5%          |
| Skill | 1     | 3.2%          |

### Skills Invoked

- **Skill x1** at event 25: fired when David says "set up Gmail and Calendar auth" — likely a google-auth or oauth skill loaded in this project's `.claude/skills/` directory

---

## Phase Structure

### Phase 1 — BOOTSTRAP Onboarding Interview (04:45–04:58 UTC, Feb 27)

David pastes the full brain-dynamous directory tree and announces the system is ready. Claude (presumably triggered by `BOOTSTRAP.md`) runs an onboarding interview. David provides: location (Chiang Mai, Thailand / Australian), brand (AppyDave), email (`david@ideasmen.com.au`), confirms "yes to asia" (timezone or regional scope), gives a detailed summary of his projects/brand/products, deflects on brand positioning ("too much about that, we'll figure it out later"), confirms scope ("all of it, it's a generalist second brain"), and mentions his existing 36-odd brains at `/Users/davidcruwys/dev/ad/brains`. No tools are called during this phase — it is entirely conversational.

### Phase 2 — Memory File Writes (02:04 UTC, Feb 28)

After an overnight gap, Claude picks up the conversation and writes the onboarding data into the memory files. Events 12–23 show: Read x4 (reading existing memory files), Write x2 (writing updated USER.md or MEMORY.md), Edit x4, Bash x2. This is the "commit onboarding data to disk" phase. The integration between BOOTSTRAP interview and persistent memory files is the core mechanism being exercised.

### Phase 3 — Gmail and Calendar Auth (02:09–02:21 UTC, Feb 28)

David issues "set up Gmail and Calendar auth" (event 24). Claude fires a Skill (event 25) and Bash (event 26) — likely loading an OAuth skill and running an auth setup script. David asks where to save the secret (event 27), Claude runs Bash (event 28) to check. David asks Claude to find and move an OAuth credentials file from Downloads to the right location (event 29) — Claude uses Glob + Bash x2 (events 30–32) to find and move/rename it.

### Phase 4 — Heartbeat Test and Debug (02:22–02:48 UTC, Feb 28)

David says "test the heartbeat" (event 33). Claude runs Bash x2 and Edit x1 (events 34–36). David pastes the full heartbeat output (event 37) — a 35-line log showing: Gmail integration working (201 unread, 0 urgent), Calendar working (4 today, 2 upcoming), Asana/Slack modules missing (non-fatal), Circle missing token, `sqlite_vec` module missing (non-fatal for memory index), heartbeat completed successfully, cost $0.2231. David says "can you fix it" (event 38), triggering a burst of 6 Bash calls and Glob (events 39–48) to diagnose and install `sqlite_vec`.

### Phase 5 — Cron and Supabase Architecture Discussion (02:48–02:59 UTC, Feb 28)

No tool calls in this phase. David asks three conceptual questions: what is heartbeat.md vs cron jobs (event 49), whether systems should update cron dynamically (event 50), whether there's a Supabase-native pattern for cron configuration and tooling (event 51). This is a planning/architecture discussion that closes the session — no code produced.

---

## Observations

1. **brain-dynamous is a personal AI OS, not a knowledge base**: The name similarity to David's `brains/` system is misleading. `brain-dynamous` is a scaffold for a living, hook-driven, integration-connected AI companion. The `brains/` system is a static knowledge base. These are architecturally and functionally distinct. AngelEye's project classifier should distinguish between sessions in `brain-dynamous` (personal AI OS work) and sessions in `brains/` (knowledge base curation).

2. **BOOTSTRAP.md is a single-use onboarding mechanism**: The system uses a file (`BOOTSTRAP.md`) that triggers onboarding on first launch and self-deletes afterward. This is a clever pattern — it makes the first-run experience deterministic without requiring code changes. The session shows this pattern working in practice: Phase 1 is entirely BOOTSTRAP-driven, Phase 2 commits the results to disk.

3. **Overnight gap does not imply two sessions**: The registry shows a single session from Feb 27 04:44 to Feb 28 05:06. The 22-hour wall clock gap is because the session was left open overnight (Mac stayed awake, or `claude` terminal stayed open). The cwd shift to `.claude/scripts` confirms this is continuous work in one Claude Code session, not two separate sessions. The heartbeat runs, David resumes the next morning to debug.

4. **Heartbeat cost is meaningful**: The test run costs $0.2231. David notes this in passing. If the heartbeat runs every 30 minutes from 05:30 to 23:30 (18 hours), that is 36 runs × $0.22 = ~$8/day, ~$240/month. This is a significant operational cost that is likely to drive architectural decisions (batch context, cache more, reduce frequency). AngelEye could flag sessions where API cost is mentioned explicitly as a signal for cost-aware architecture work.

5. **Integration dependencies are non-fatal by design**: The heartbeat script handles missing modules gracefully (Asana: no module, Slack: no module, sqlite_vec: no module — all non-fatal). This is intentional scaffolding — the system degrades gracefully as integrations are added. The `can you fix it` prompt (event 38) is specifically about sqlite_vec, suggesting David prioritises the memory index over the other missing integrations.

6. **Skill x1 is an OAuth/auth skill**: The Skill invocation on "set up Gmail and Calendar auth" (event 25) indicates the brain-dynamous project has at least one skills file in `.claude/skills/` for handling OAuth setup. The directory tree lists `skills/` containing "content skills (pptx, remotion, linkedin, etc.)" — so the OAuth skill is either a general one loaded from the global skill set or a local one. Either way, the Skill mechanism is working here as intended: David uses a natural language command, Claude dispatches to the appropriate skill.

7. **cwd shift is a meaningful debugger signal**: When Claude shifts cwd from the project root to `.claude/scripts`, it signals that active debugging is happening in that subdirectory. This is a reliable signal that the session has moved from architectural/setup work to script-level debugging. AngelEye could track cwd shifts within a session as phase-change indicators.

8. **Phase 5 architecture questions are rich classifier material**: The closing discussion — what is a heartbeat vs cron, should cron be dynamically updated, does Supabase have native cron tooling — is not BUILD work. It is architectural planning. This session ends in a PLAN-adjacent phase even though no tools are called. A multi-phase session that starts as BUILD/setup and ends in PLAN discussion is a pattern worth flagging: the session type is the dominant phase (setup), but the closing phase is a planning signal for the next session.

---

## Patterns Found

- **Scaffold activation session**: A distinct session type where the user does not build a scaffold from scratch but activates a pre-built one by personalising it. The work is: fill in identity data, wire credentials, run first test, debug blockers. This is different from `build.feature` (adding capability) and from `setup.environment` (installing dev tools). It deserves its own subtype: `setup.scaffold_activation`.

- **Overnight session gap as false duration signal**: A session with a 22-hour wall clock span that contains ~2–3 hours of actual work. The session stayed open overnight. AngelEye's duration-based classifiers will over-weight this session if they use `last_active - started_at`. The correct signal is active_time (sum of inter-event gaps below a threshold, e.g., 30 minutes), not wall clock duration.

- **Paste-heavy opening orientation**: David pastes a full directory tree in the first prompt to orient Claude to the project structure. This "paste the map" pattern appears in first-contact sessions where Claude has no prior context about a project. It is a reliable signal that the session is an introduction to a new system, not continuation of known work.

- **Cost-aware session tail**: The heartbeat cost ($0.2231/run) is noted explicitly. Sessions where API cost appears in a user prompt or tool output are candidates for a `cost_aware` tag — useful for tracking when David is making architecture decisions driven by operational expense.

- **Phase 5 planning tail on a BUILD session**: The last three user prompts contain no tool calls and are architectural questions. A session that ends with a burst of conceptual questions after completing hands-on work signals that the next session will likely start with planning or implementation of what was discussed. AngelEye could use this as a forward-linking signal between sessions.

---

## New Types or Subtypes Proposed

- **setup.scaffold_activation (new candidate)**: Sessions where a pre-built scaffold is being personalised and activated for the first time. Distinguishing signals: (a) initial prompt pastes directory tree of an existing system, (b) first phase is an onboarding interview with the user as the data source, (c) credential wiring and first-run testing dominate, (d) no new features built — the scaffold is the feature. Distinct from `build.feature` and from `setup.environment`.

- **session.overnight_gap (tag candidate)**: A cross-cutting tag for sessions where the wall clock duration far exceeds active working time due to leaving the session open overnight. Signal: `last_active - started_at` > 8 hours but event density is low. Useful for correcting duration-based heuristics.

---

## Subtype Candidates Confirmed

- **build.bash_heavy**: Confirmed — 17 Bash calls (54.8% of tool_use) in a session that is actively installing dependencies, running scripts, moving files, and debugging. However, this session shows that bash-heavy alone does not mean automation/scripting — it can also mean interactive setup work where Bash is the tool for everything from `ls` to `python heartbeat.py --test` to `pip install sqlite_vec`.

---

## Interest Level

high — This session is uniquely interesting for several reasons: (1) it introduces `brain-dynamous` as a new project type (personal AI OS scaffold) that needs its own classifier category; (2) it demonstrates the scaffold-activation session pattern cleanly; (3) it shows the overnight-gap false duration problem in an extreme form (22 hours wall clock, ~2–3 hours active); (4) the heartbeat cost note is a rare explicit cost signal; (5) the Phase 5 planning tail is a good example of a session that ends in a different mode than it started. The session is also rich in personal context data (David's identity, brand, projects) which makes it useful for understanding what brain-dynamous is trying to capture about its owner.
