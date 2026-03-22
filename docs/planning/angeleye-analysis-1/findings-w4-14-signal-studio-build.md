# Findings: signal-studio BUILD session (9fe2fca6)

**Session ID**: `9fe2fca6-4ced-42ca-bdfa-c2678d4a0aa9`
**Date**: 2026-03-02 (06:23 – 12:33 UTC, ~6 hours)
**Project**: signal-studio (`/Users/davidcruwys/dev/clients/supportsignal/signal-studio`)
**File size**: 183,930 bytes / 349 events (0 progress events in transcript)
**Registry classification**: BUILD
**Analysed classification**: BUILD — confirmed correct

---

## Classification Verdict: BUILD (confirmed)

The registry marked this BUILD and that is accurate. Signal-studio is a client product repo (SupportSignal NDIS application), not a tooling or infrastructure project. The session is canonical product feature development: entity CRUD, relationship filtering, real-time socket events, and UI polish — exactly what BUILD means in this domain.

There is no reason to challenge the classification. The session involves no planning artefacts, no brain/knowledge work, and no tooling setup beyond committing the work to git.

---

## Session Summary

This is a long, continuous product development session (~6 hours, 32 user prompts). The first prompt is a structured handover note from prior sessions describing what was built (Nav Shell + File-CRUD persistence layer). The session continues that work and adds substantial new capability.

### What was built

**Phase 1 — Feature additions (prompts 2–4, ~06:23–07:34)**

David opened with a dense multi-topic prompt covering observations and feature requests after manually testing the app. Requested work included:

- Edit flows for all entities (companies, sites, users, participants, moments) — previously add + delete only
- Company-scoped filtering on Sites and Users views
- Participant view with two filters: company + site
- Dashboard stat cards wired to real counts
- Moments: stay-on-form after save (cancel to return to list), site auto-populate from focus user, default to previous values
- Cascade deletion policy on company delete (null-reference vs delete child records — David preferred null-reference)
- Role-based visibility: admin sees all, non-admin sees their company only

The agent used `TaskCreate` (14 times) to decompose this into tracked tasks, then proceeded with heavy Edit/Write work.

**Phase 2 — Entity relationship and UI refinement (prompts 5–9, ~07:34–11:17)**

A context window handover occurred mid-session (prompt 4 is a continuation-from-summary prompt, and prompt 8 is another one). The session survived multiple context limits and resumed. Continued implementing:

- Entity link resolution (displaying company name, user name instead of raw IDs in moments display — prompted by David at line 333: "why would it say companies? And not the company name.")
- Dashboard modal styling vs dashboard card styling discrepancy noted by David
- Typecheck runs via Bash to verify builds

**Phase 3 — Testing, git, and data strategy (prompts 10–32, ~11:17–12:33)**

- David requested UAT test plan; agent produced step-by-step checklist
- David asked agent to run UAT via `/agent-browser` skill — agent used `Skill` and `Agent` tools to invoke browser-based UAT
- Commit and push sequence: David initially had `data/` gitignored; discovered this was wrong because live data needs to sync across users; agent updated gitignore
- Push to a `-BAK` remote (backup/reset strategy)
- Unit test discussion: existing test suite had 4 failing tests; David asked agent to review in background Agent — agent ran `npm test` via Bash, resolved test isolation concern (tests using temp directories, not live data)
- Late prompt: David raised seed/faker data concept — wanted a "fill form" button on each entity view. Agent proposed seed script approach; David preferred a UI button. Decision deferred; David closed with "can you just commit please."

---

## Tool Pattern Analysis

| Tool       | Count | Notes                                                                             |
| ---------- | ----- | --------------------------------------------------------------------------------- |
| Edit       | 106   | Dominant — sustained file modification across many entity views and server routes |
| Read       | 67    | Heavy reading before editing; consistent context-gathering pattern                |
| Bash       | 59    | typecheck, git status/add/commit/push, npm test, port checks                      |
| Write      | 28    | New files: views, routes, handlers                                                |
| TaskUpdate | 25    | Active task tracking throughout                                                   |
| TaskCreate | 14    | All at session start — decomposition spike                                        |
| Glob       | 7     | File discovery                                                                    |
| Agent      | 6     | Background agents: UAT browser run, unit test run                                 |
| Skill      | 2     | `/agent-browser` invoked                                                          |
| TaskList   | 1     |                                                                                   |
| TaskOutput | 1     | Reading background agent result                                                   |
| Grep       | 1     |                                                                                   |

**edit-heavy** classification is correct: Edit (106) dominates over Write (28), consistent with incremental modification of existing entity views rather than greenfield creation.

---

## Patterns and Signals

### Positive signals

- **Task decomposition discipline**: 14 `TaskCreate` calls at the start of the large feature-request prompt — agent broke work into trackable units before executing. David never had to ask "what did you do?"
- **Background agent use**: David twice delegated work to background agents (UAT browser test, unit test run) — shows comfort with the agentic model
- **Context window resilience**: Session survived at least two context-limit handovers (prompts 4 and 8 are continuation summaries). Work continued without visible loss of direction.
- **Data philosophy clarified**: David explicitly stated `data/` files are live shared data and belong in git — this is a meaningful product architecture decision captured in session

### Issues surfaced

- **Test isolation concern**: David worried unit tests would blow away live data files. Agent confirmed tests use temp directories, not `data/` — but this concern should be documented in the test setup
- **Display name resolution**: A data modelling gap — moments stored raw IDs (companyId, userId) but views were rendering the literal field name ("companies", "users") rather than resolved display names. Fixed in-session.
- **UAT browser agent**: Agent invoked but result was unclear — David had to ask "Did we run the UAT?" suggesting the background agent result was not surfaced cleanly
- **Seed/faker deferred**: David raised this twice and it was deferred both times. Likely to resurface.

### Workflow observations

- David works in long sessions (6+ hours) with natural break points at context limits
- Multiple commit+push cycles within one session — David treats git as a safety mechanism, not just a delivery step
- David uses voice/dictation (visible in prompt phrasing: "RL unit test", fragments, speech-to-text artifacts)

---

## Files Touched (inferred from prompt + tool pattern)

Based on the first prompt's handover and the session's edit pattern, the primary files modified are in:

- `client/src/views/` — all 5 entity CRUD views (edit flows added)
- `client/src/views/MomentsView.tsx` — stay-on-form, site auto-populate, defaults
- `client/src/views/DashboardView.tsx` — real stat counts, layout/modal polish
- `server/src/routes/` — cascade null-reference on company delete
- `server/src/test/` — test isolation fixes
- `.gitignore` — `data/` line removed

---

## Interest Level: High

This session is high-value for AngelEye analysis because:

1. It demonstrates a complete feature development arc: decompose → implement → UAT → commit, all within one session
2. The context-window handover pattern (prompts 4 and 8) is a direct AngelEye concern — detecting session continuations and linking them
3. The task tracking pattern (TaskCreate at start, TaskUpdate throughout) is a signal-rich behaviour for classifying session intent
4. The data architecture decision (data/ in git) is the kind of design decision AngelEye should surface as a notable event
