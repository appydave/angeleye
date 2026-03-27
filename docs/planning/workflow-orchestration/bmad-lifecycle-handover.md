# AngelEye Workflow Orchestration Handover

**Provenance**: Copied from SupportSignal v2 BMAD oversight session output.
**Original location**: `~/dev/clients/supportsignal/app.supportsignal.com.au/_bmad-output/planning-artifacts/angeleye-workflow-orchestration-handover.md`
**Brain context**: See `~/dev/ad/brains/angeleye/orchestration-concepts.md` for the curated conceptual summary.

---

## What This Is

Observed patterns from BMAD story lifecycle execution across Stories 0.1, 2.1, and 2.2 in SupportSignal v2. These patterns define how a control plane (AngelEye) should orchestrate Claude Code sessions — launching them, passing handover signals, detecting backtrack conditions, and managing context budgets.

**Source**: Oversight session `bmad-overwatch` (2026-03-26), observing 6+ agent sessions across the full Story 2.2 lifecycle and Story 0.1 Epic 0 interleave.

**Intent**: AngelEye currently does observation and telemetry on Claude Code sessions. The reverse capability is for AngelEye to _execute_ Claude Code sessions as a control plane — launching agents in sequence, making routing decisions, and handling the backtrack/interleave patterns documented here.

---

## The Story Lifecycle Chain

Each story runs through this linear chain. Every step is an isolated Claude Code session.

```
/bmad-sm CS {N.N}    → Bob creates story context file
/bmad-sm VS {N.N}    → Bob validates story (MUST be fresh window — different context than CS)
/bmad-dev DS {N.N}   → Amelia implements the story
/bmad-dr DR {N.N}    → Nate reviews delivery (MUST be fresh window — bias isolation)
/bmad-sat CS {N.N}   → Taylor creates acceptance tests
/bmad-sat RA {N.N}   → Taylor runs autopilot acceptance tests
/bmad-lib CU {N.N}   → Lisa curates KDD learnings and closes story
/bmad-ship            → Commit, push, watch CI
```

### Handover Contract

The **story file** (`_bmad-output/implementation-artifacts/{story-key}.md`) is the handover medium. Each agent writes to a specific section:

| Agent       | Reads                                           | Writes                                         |
| ----------- | ----------------------------------------------- | ---------------------------------------------- |
| Bob (CS)    | Epics, architecture, PRD, KDD, previous stories | Story file (problem, AC, tasks, dev notes)     |
| Bob (VS)    | Story file, source artifacts, actual codebase   | Corrections applied to story file              |
| Amelia (DS) | Story file, codebase                            | Code changes + Dev Agent Record section        |
| Nate (DR)   | Story file, code diff                           | Review Intelligence + Delivery Review sections |
| Taylor (CS) | Story file, Review Intelligence, code           | Story Acceptance Tests section                 |
| Taylor (RA) | SAT section, running server, Supabase MCP       | Test results updated in SAT section            |
| Lisa (CU)   | Story file (all sections), KDD directory        | Knowledge Assets section + KDD files           |
| Ship        | Sprint status, git diff                         | Git commit + CI verification                   |

**Key insight for AngelEye**: The story file is the baton. Each agent appends to it. A control plane can verify handover readiness by checking whether the expected section exists and has content before launching the next agent.

---

## Routing Decisions

### Fresh Window vs Same Window

Two variables determine whether to start a fresh Claude Code session:

| Variable           | Fresh Window                            | Same Window                         |
| ------------------ | --------------------------------------- | ----------------------------------- |
| **Bias isolation** | Agent is judging work it didn't produce | Agent is continuing its own work    |
| **Context budget** | Previous step consumed >60% context     | Previous step consumed <60% context |

**Rules observed**:

1. **CS → VS**: Fresh window. Different Bob context avoids confirmation bias on the story he just wrote.
2. **VS → DS**: Fresh window. Amelia should implement from the corrected story file, not Bob's validation context.
3. **DS → DR**: Fresh window. **Critical** — Nate must not share context with Amelia. Different LLM recommended for maximum independence.
4. **DR → SAT CS**: Either. Taylor benefits from Review Intelligence already loaded, but can also read it from the story file. Decision is context budget.
5. **SAT CS → SAT RA**: Same window. Same agent continuing its own work. No bias risk. Context budget is typically low (28% observed for CS+RA combined).
6. **SAT RA → CU**: Fresh window. Lisa should read the story file cold.
7. **CU → Ship**: Fresh window. Ship is a mechanical step.

**AngelEye decision function**:

```
if (next_agent != current_agent) → fresh window
if (next_agent == current_agent AND same_work_product) → same window
if (context_used > 60%) → fresh window regardless
```

### Backtrack Pattern

When Nate (DR) returns **CONDITIONAL PASS** with required patches:

```
DR (CONDITIONAL PASS with patches)
  → David pastes patch instructions to Amelia (DS) — can be same or new window
  → Amelia applies patches
  → DR re-review (same window if alive, fresh if not) — lighter pass, focused on patches only
```

**Observed**: Story 0.1 had 3 required patches from Nate. David pasted a self-contained correction message to Amelia. Amelia applied patches. Nate re-reviewed with a focused pass.

**AngelEye orchestration**: Detect `CONDITIONAL PASS` in DR output. Extract patch list. Generate paste-ready message for DS. Launch DS session with the message. After DS completes, launch DR again with instruction "re-review focused on patches from previous DR."

When Nate returns **PASS**: No backtrack. Continue to SAT.
When Nate returns **REJECT**: Story needs significant rework. Back to CS or DS depending on the nature of rejection.

### Verdict Detection

AngelEye should parse the DR output for these signals:

| Signal                      | Action                                          |
| --------------------------- | ----------------------------------------------- |
| `Verdict: PASS`             | Continue to SAT CS                              |
| `Verdict: CONDITIONAL PASS` | Backtrack to DS with patches, then re-DR        |
| `Verdict: REJECT`           | Backtrack to CS or DS (assess rejection reason) |
| All SAT tests `PASS`        | Continue to CU                                  |
| Any SAT test `FAIL`         | Backtrack to DS with failure details            |
| CI green                    | Story complete, determine next story            |
| CI red                      | Backtrack to DS with CI failure details         |

---

## Epic 0 Interleave Pattern

The lifecycle chain is per-story, but Epic 0 (maintenance/tech debt) stories can be **injected between feature stories** when technical debt would compound.

**Observed sequence**:

```
Story 2.1 (Epic 2) → complete → shipped
Story 0.1 (Epic 0) → injected — retro items before 2.2
Story 2.2 (Epic 2) → complete → shipped
Story 0.2 (Epic 0) → injected — shared helpers before 2.3
Story 2.3 (Epic 2) → next
```

**Decision criteria for interleave**:

- Technical debt from DR deferred items is about to multiply (e.g., validation duplication across 4+ routes)
- A locked product decision needs to be codified before more code builds on the wrong assumption (e.g., tenant boundary immutability)
- Retro action items were explicitly flagged as "before next epic"

**AngelEye orchestration**: After Ship completes, don't automatically start the next sequential story. Check:

1. Are there pending Epic 0 stories in sprint-status.yaml?
2. Did the DR deferred items include any flagged as "before Story N.N"?
3. Did oversight recommend an interleave?

If yes, route to the Epic 0 story first. Epic 0 stories use **lighter ceremony** — may skip VS, SAT, or both (pure refactors with existing test coverage).

---

## Epic 0 Ceremony Reduction

Not all stories need the full 8-step chain. Epic 0 stories (tech debt, refactoring) can skip steps when:

| Skip             | When                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| VS (validation)  | Story scope is small and well-defined (e.g., rename + extract)                      |
| SAT (acceptance) | Pure refactor with zero new user-facing behavior — existing tests prove equivalence |
| Full DR          | Can use a lighter review pass if changes are mechanical                             |

**Never skip**: DS (implementation), CU (KDD curation), Ship. Lisa should always curate because refactoring stories produce reusable learnings.

---

## Paste-Back Message Pattern

When oversight or David needs to send corrections to an agent, the message must be **self-contained**. BMAD agents cannot see external documents or the oversight session.

**Good**: Full instruction with all context inline

```
Nate's delivery review returned CONDITIONAL PASS with 3 required patches. Apply these:
1. Add JSDoc warning on `createJoinThroughIsolationPolicies` in `lib/db/rls.ts`...
2. In `tests/web/lib/db/rls.test.ts` lines 22-26...
3. Add a test case for `{ select: false, insert: true }` branch...
```

**Bad**: Reference to external context

```
Apply the corrections from the cross-reference analysis.
```

**AngelEye orchestration**: When generating paste-back messages for agents, always include: what the previous agent found, what needs to change, and where in the code. Never reference documents the target agent can't see.

---

## Context Budget Observations

| Step                  | Typical Context Used | Notes                                     |
| --------------------- | -------------------- | ----------------------------------------- |
| CS (create story)     | 15-25%               | Heavy artifact reading                    |
| VS (validate story)   | 20-30%               | Reads story + source artifacts + codebase |
| DS (dev story)        | 40-70%               | Heaviest — reads, writes code, runs tests |
| DR (delivery review)  | 30-50%               | 6 parallel review agents                  |
| SAT CS (create tests) | 15-25%               | Reads story + Review Intelligence         |
| SAT RA (run tests)    | 10-20%               | Mostly curl commands + SQL                |
| SAT CS + RA combined  | 25-35%               | Safe to run in same window                |
| CU (KDD curation)     | 15-25%               | Reads story + KDD directory               |
| Ship                  | 10-15%               | Mechanical — git + CI                     |

**Key insight**: DS is the only step that routinely exceeds 50%. All other steps are lightweight enough that adjacent steps _could_ share a window if bias isolation permits.

---

## Signals AngelEye Should Capture

During session observation, these are high-value telemetry points:

1. **Story status transitions** in sprint-status.yaml — tracks lifecycle progress
2. **DR verdict** — determines forward/backtrack routing
3. **SAT pass/fail count** — determines story readiness
4. **Context usage at session end** — informs future routing decisions
5. **Backtrack events** — DR → DS → DR cycles (measure frequency and cause)
6. **Epic 0 injection points** — when and why maintenance was interleaved
7. **Agent model used** — tracks which LLM ran each step (bias isolation verification)
8. **Time per step** — identifies bottlenecks in the chain
9. **KDD recurrence counts** — tracks when learnings should promote to patterns (threshold: 3)
10. **Deferred DR items** — accumulating debt that may trigger Epic 0 interleave

---

## Open Questions for AngelEye Design

1. **Human-in-the-loop gates**: Which steps require David's approval before proceeding? Currently all of them, but the goal is to reduce to: DS start, DR verdict review, and Epic 0 injection decisions.
2. **Parallel story execution**: Can AngelEye run Story 5.1 (Epic 5, parallel track) simultaneously with Story 2.3? The stories are independent, but they share the same codebase and test suite.
3. **LLM selection**: DR recommends "different LLM than DS." AngelEye should track which model ran DS and route DR to a different one. How does this interact with cost/speed preferences?
4. **Failure recovery**: If a session crashes mid-step (context limit, API error), how does AngelEye resume? The story file is the checkpoint — restart the step from scratch with the story file as input.
5. **Oversight integration**: This session (bmad-overwatch) ran as a separate human-driven session reviewing agent output. Should AngelEye absorb oversight functions, or keep them as a separate human-advisory channel?

---

**Created**: 2026-03-26
**Session**: bmad-overwatch
**Stories observed**: 0.1 (full lifecycle), 2.2 (full lifecycle), 0.2 (planned)
**Next update**: After Story 0.2 and 2.3 complete — will add shared-helper refactoring patterns and the pattern-promotion workflow
