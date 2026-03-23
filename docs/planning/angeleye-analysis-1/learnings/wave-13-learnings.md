# Wave 13 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 133 (bringing total to 799/800 = 99.9%)
**Agents**: 9 parallel (W13-01 through W13-09)
**Duration**: ~5-6 minutes to complete all 9 agents
**Final wave** — processed all remaining sessions (71 trivial + 39 micro + 23 light)

## Application Learnings

### BUILD accuracy hits absolute zero at micro/light scale

- **Wave 13 BUILD accuracy: 0% (0/80+ BUILD-classified)**. Not a single correct BUILD classification across 133 sessions.
- Rule now iron-clad across waves 9-13: brains/ CWD + micro scale = never BUILD. Zero tool calls = never BUILD.
- The BUILD classifier is completely broken below moderate scale. The accuracy-by-scale curve is definitive: micro 0%, light 0-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%.

### KNOWLEDGE classifier also unreliable at micro scale

- KNOWLEDGE accuracy ~33% (2/6) in W13-04. The registry defaults brains/ CWD sessions to KNOWLEDGE, but most micro brains/ sessions are RESEARCH (quick questions) or ORIENTATION (inventory lookups).
- Discriminator: true KNOWLEDGE requires brain file writes. Read-only brain access is usually RESEARCH or ORIENTATION.

### Coordinator-spawned checklist spray — new session pattern

- User dispatches numbered questions from a single mental checklist to N independent micro sessions simultaneously.
- 6 sessions in W13-03/04 share a 15-minute timestamp cluster (14:53-15:08 on 2026-03-08).
- Sessions c6d033a1 and 04170faf asked identical questions — coordinator spawned duplicates.
- Detectable via: numbered prompt prefix + timestamp cluster + shared CWD.

### Ghost session clusters — automated batch spawning

- W13-07: 7 sessions from 2026-03-17 with exactly 2 events (session_start + session_end), zero prompts.
- 6 sessions started within 3 seconds (11:56:41 to 11:58:34 UTC).
- Hypothesis: automated spawning of subagents that never received work. New subtype: `meta.ghost_session`.

### Agent warmup probes

- W13-09: Two brain-dynamous subagent sessions fired simultaneously (same millisecond) with "Warmup" prompts. Died immediately.
- New subtype: `meta.agent_warmup`. These are not user sessions.

### CWD incidental rate 40-100% at micro scale

- P10 (CWD incidental) range: 40% (W13-04) to 100% (W13-07). Median ~53%.
- brains/ functions as a "home terminal" — default open directory — not a signal of brain-related work at micro scale.
- Nuanced rule from W13-05: CWD reliable only when prompt topic matches CWD content. "Do we have X in brains?" = reliable. "How do I SSH?" from brains/ = incidental.

### Phantom duration misleading for idle sessions

- Session 207cbdc1: 413-minute `duration_minutes` with 0 `active_minutes` — terminal left open overnight.
- `active_minutes: 0` is the accurate signal; `duration_minutes` is wall clock only.

### task-notification inflation confirmed

- W13-03 session 39f1499d: machine-generated `<task-notification>` XML callback counted as second "user_prompt". These inflate user_prompt counts and are not human intent.

### Self-resolution pattern

- W13-04 session 9b4de140: user typed "OK, I've found it. It's flip camera." while Claude was still searching brain docs.
- Anti-pattern for micro sessions where trying the software is faster than asking Claude.

### Recurring automation candidates still unresolved

- **Port-kill recurrence**: EADDRINUSE on port 5040 still happening manually (same pattern since wave 6).
- **SSH/remote access**: 3 sessions in W13-02 relate to M4 Mini ↔ M4 Pro connectivity.
- **Agent discovery**: Identical "who are my agents" prompt from same CWD, 3 days apart. A `/agents` command would eliminate these.

### Cross-platform knowledge bridge confirmed (second instance)

- W13-06 session c050ece0: 9.1KB XML-tagged prompt pasted from another AI platform. Second confirmed ChatGPT-to-Claude bridge (first was wave 12).

### Junk session taxonomy now complete

- W13-08: all 14 sessions empty/accidental (1-2 events each).
- W13-09: all 14 sessions single-event junk (12 accidental, 2 agent warmup).
- Combined with W13-07 ghost sessions: 37 of 133 sessions (28%) are non-human junk.
- Subtypes: `meta.accidental`, `meta.ghost_session`, `meta.agent_warmup`, `meta.empty_session`.

### ~42 new subtypes proposed (~0.32/session)

Discovery rate lowest ever — expected for trivial/micro tail. Notable new subtypes:

- `meta.ghost_session` — automated batch spawning with zero prompts (N=7)
- `meta.agent_warmup` — warmup probes that die immediately (N=2)
- `research.framework_survey` — evaluating frameworks/tools
- `research.omi_transcript_query` — querying OMI device transcripts
- `orientation.identity_check` — `/who-am-i` before real work
- `orientation.agent_discovery` — "who are my agents" lookup (N=2)
- `knowledge.cross_session_paste` — cross-session extraction via paste
- `operations.cross_session_commit` — paste prior session's diff then commit
- `operations.commit_and_push` — pure git operations
- `sysops.remote_exploration` — exploring remote machines
- `debug.payload_error` — debugging API payload errors
- `skill.bug_fix` — fixing a bug in a skill itself

### Voice dictation artifacts (~25 new)

- "a cam live" = "Ecamm Live"
- "Ralph Wiggums" = "Ralphy"
- "Overmine" = "Overmind"
- "ZS HRC" = ".zshrc"
- "Raft Loop" = "Ralph Loop"
- "SoloDeck" = "solo-deck / FliDeck"
- "ai-gentive" = "AIgentive"
- "cluaed" = "Claude"
- "Anthropik" = "Anthropic"
- "hanover" = "handover"
- "Lizada" = "Lazada"
- Garbled STT artifact in W13-06: profanity-containing string that was noise, not frustration

### PII detection incidents

4 PII incidents across 133 sessions (~3%):

- W13-02: Names (Jan, Phil), pricing from OMI device transcripts
- W13-03: Google results reveal user location (Suthep, Chiang Mai, Thailand)
- W13-06: Person name (Angela) + employer (SupportSignal) + platform (Windows)
- W13-06: Potential real NDIS participant data in incident discussion

PII rate 3% — lower than wave 12's 15%, consistent with earlier wave averages.

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 13 of 13)

799 entries, 0 duplicates. Append-only pattern bulletproof across all 13 waves and 799 sessions.

### Micro/trivial sessions are the fastest to process

All agents completed in ~5-6 minutes. Less JSONL to read, simpler classification decisions.

### Discovery rate declining as predicted

0.32/session (down from 0.63 in wave 12, 0.80 in wave 11). Trivial/micro sessions at the absolute tail produce the fewest novel patterns. The taxonomy is approaching saturation at ~440+ subtypes.

### Junk rate peaks at the tail

28% of sessions in wave 13 were non-human junk (ghost sessions, accidental opens, agent warmups). These need filtering before any aggregate statistics.

### Registry grew during processing

Registry went from 799 to 800 during wave 13 execution — 1 new session arrived. Campaign achieved 799/800 = 99.9% coverage.

### Total subtypes: ~440+ across 22+ parent types from 799 sessions
