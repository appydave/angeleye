---
type: analysis
title: 'Findings W9-06'
description: 'Wave 9 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W9-06

**Wave**: 9, Batch 06
**Sessions analysed**: 9
**Date**: 2026-03-23
**Scale distribution**: 1 moderate, 2 light, 6 micro

---

## BUILD Accuracy

**Registry BUILD count**: 8/9 (only e8b25fc5 was ORIENTATION in registry)
**Actual BUILD count**: 1/9 (d844716d — startup.sh parameter cleanup)
**BUILD accuracy**: 12.5% (1/8)

Reclassifications:
| Session | Registry | Actual | Subtype |
|---------|----------|--------|---------|
| e8b25fc5 | ORIENTATION | REVIEW | review.bmad_audit |
| eea00425 | BUILD | OPERATIONS | operations.repo_cleanup |
| d844716d | BUILD | BUILD | build.script_maintenance |
| 8ca94a94 | BUILD | ORIENTATION | orientation.context_resume |
| e5687c61 | BUILD | DEBUG | debug.cross_project_port_kill |
| 36ea26e4 | BUILD | SYSOPS | sysops.shell_config_fix |
| 2be6a6d2 | BUILD | ORIENTATION | orientation.memory_probe |
| 5fe1e918 | BUILD | SYSOPS | sysops.remote_keyboard_debug |
| b61e8341 | BUILD | META | meta.smoke_test |

Consistent with wave 6-8 findings: micro/light sessions are almost never BUILD (0% micro accuracy this batch, 50% light accuracy).

---

## Key Findings

### F1 — EADDRINUSE session chain (4 sessions across 3 projects)

Three sessions in this batch form part of a multi-session chain tracking the EADDRINUSE port conflict issue:

1. **2be6a6d2** (micro, appystack) — User probes session memory: "Were we talking about port number failures in this conversation?" Then pastes prompt.supportsignal EADDRINUSE on port 3001.
2. **e5687c61** (light, appystack) — User pastes signal-studio EADDRINUSE on port 6041, plus output from a separate quick Claude session (2a918928) that killed the port. Claude applies fix at template level in appystack.
3. Referenced external session **2a918928** (signal-studio) — Port-kill one-liner session referenced in e5687c61's paste.

This confirms the port-kill recurring micro pattern identified in wave 6. The chain shows David's workflow: encounter crash in derived project -> quick kill session -> template-level fix session to prevent recurrence. The memory probe session (2be6a6d2) is interesting — David is testing whether Claude remembers prior port discussions, revealing an expectation of cross-session memory that does not exist.

**Implication for AngelEye**: Session chain detection should flag EADDRINUSE as a known multi-session pattern. The memory probe pattern ("were we talking about X in this conversation?") is a new session_chain_role candidate: `memory_probe` — user testing if current session has context from a prior session.

### F2 — /capture-context paste as session opener (confirmed pattern)

Session 8ca94a94 opens with a 4.7KB /capture-context output — a structured briefing with sections for Working On, Current State, Key Decisions Made, Important References, Active Files, What We Ruled Out, Gotchas, What's Next, How to Resume. This confirms the wave 7 learning about context handover pastes as openers.

The structure is highly consistent, suggesting /capture-context has a template format. This is a reliable signal for `orientation.context_resume` subtype.

### F3 — BMAD audit as REVIEW subtype

Session e8b25fc5 uses /bmad-sm to invoke the Scrum Master agent, then asks for a comprehensive audit of all BMAD planning artifacts (PRD, UX spec, architecture, epics). Six parallel Explore agents are dispatched. The session is purely read-only — zero Edit/Write calls.

This is not ORIENTATION (the registry classification) because the user already knows the project well and is asking for a structured status report. It is a REVIEW session with a new subtype: `review.bmad_audit`. The agent_orchestration tool profile (6 parallel Explore agents) is distinctive.

Notable: User initially got abridge summarisation and corrected Claude: "Don't use abridgments. Just use a bunch of background agents." This is a mild P13 (misunderstood_request) — Claude defaulted to summarisation when the user wanted thorough parallel reading.

### F4 — Video project repo cleanup (OPERATIONS, not BUILD)

Session eea00425 is a classic OPERATIONS session misclassified as BUILD. The user noticed git push was slow, investigated large video files in git history, then used git filter-branch/BFG to remove them. The session includes Task agents for parallel investigation of repo rules and patterns.

The 30 Bash calls are all git operations (filter-branch, BFG, force push), not code execution. The single Write is a .gitignore update. This is repo maintenance — `operations.repo_cleanup`.

### F5 — Zero-tool-call sessions are never BUILD (reconfirmed)

Three sessions (2be6a6d2, 5fe1e918, b61e8341) have zero tool calls. All three are classified BUILD in the registry. This continues to confirm the wave 4 finding: zero tool calls = never BUILD.

### F6 — New voice artifacts

| Artifact       | Intended        | Session  |
| -------------- | --------------- | -------- |
| "ralph"        | "Ralphy"        | 8ca94a94 |
| "Studi Signal" | "signal-studio" | e5687c61 |
| "borken"       | "broken"        | 5fe1e918 |

"ralph" for "Ralphy" is a new variant (previous: "Raffi" from wave 7, "Ralph William" from wave 8).

### F7 — CWD incidental rate high in micro sessions

4/6 micro sessions have incidental CWD (36ea26e4, 2be6a6d2, 5fe1e918, b61e8341). This aligns with the pattern: micro sessions are often quick troubleshooting where the terminal happened to be open in an unrelated directory.

---

## New Subtypes Proposed

| Subtype                       | Count | Evidence                                                                     |
| ----------------------------- | :---: | ---------------------------------------------------------------------------- |
| review.bmad_audit             |   1   | e8b25fc5 — /bmad-sm + parallel Explore agents reading all planning artifacts |
| operations.repo_cleanup       |   1   | eea00425 — git filter-branch/BFG to remove large files                       |
| build.script_maintenance      |   1   | d844716d — editing startup.sh parameters, verifying with vitest              |
| orientation.context_resume    |   1   | 8ca94a94 — /capture-context paste as opener, post-wave housekeeping          |
| debug.cross_project_port_kill |   1   | e5687c61 — EADDRINUSE fix applied at template level for derived projects     |
| sysops.shell_config_fix       |   1   | 36ea26e4 — fixing zsh alias unalias error                                    |
| orientation.memory_probe      |   1   | 2be6a6d2 — user asking if prior port discussion happened in this session     |
| sysops.remote_keyboard_debug  |   1   | 5fe1e918 — SSH to remote Mac to debug broken spacebar                        |
| meta.smoke_test               |   1   | b61e8341 — "3+3" arithmetic test                                             |

**New subtype of interest**: `orientation.memory_probe` — user testing whether current session has memory of prior discussion. Distinct from artifact_retrieval (looking for files) and cold_start (first time in project). This reveals the user's mental model of session continuity.

---

## Disposition Summary

| Disposition | Count | Sessions                                                                       |
| ----------- | :---: | ------------------------------------------------------------------------------ |
| active      |   8   | e8b25fc5, eea00425, d844716d, 8ca94a94, e5687c61, 36ea26e4, 2be6a6d2, 5fe1e918 |
| junk        |   1   | b61e8341                                                                       |

---

## Running Totals

- Sessions analysed: 356 (347 + 9)
- BUILD accuracy: ~25% (consistent with waves 6-8)
- New subtypes this batch: 9
- Discovery rate: 1.0/session (high — all 9 sessions yielded unique subtypes, though several are single-instance)
