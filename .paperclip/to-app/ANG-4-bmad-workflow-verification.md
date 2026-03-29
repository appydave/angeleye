# BMAD Workflow Documentation Research Report

**Researcher**: Spec Writer
**Date**: 2026-03-29
**Scope**: READ-ONLY research — no files modified

---

## 1. Where is the BMAD workflow documented?

BMAD workflow documentation exists across **four main locations**:

### A. Brain documentation (`~/dev/ad/brains/bmad-method/`)

- `v6/v6-workflows.md` — 3 planning tracks, 4 phases, #yolo mode, story lifecycle
- `v6/v6-agents-reference.md` — 12+ agent definitions
- `v6/v6-fundamentals.md` — core concepts and module system
- `v6/v6-practical-examples.md` — worked examples
- `nate-agent-handover.md` — Nate (Delivery Reviewer) build spec, Taylor heritage

### B. AngelEye workflow configs (`~/dev/ad/apps/angeleye/server/src/config/`)

- `workflows/bmad-regular-story.json` — **the authoritative 9-station workflow definition**
- `overlays/bmad-v6.json` — role-to-identity mappings and action codes

### C. Workflow orchestration docs (`~/dev/ad/apps/angeleye/docs/planning/workflow-orchestration/`)

- `bmad-session-inventory.md` — comprehensive session ID inventory across 17 days
- `bmad-session-boundaries.md` — per-session start/end/output with test counts, commits, DR verdicts
- `bmad-lifecycle-handover.md` — orchestration patterns, routing decisions, backtrack handling

### D. BMAD agent definitions (`~/dev/ad/appydave-app-a-day/007-bmad-claude-sdk/.claude/commands/BMad/agents/`)

- Individual agent definition files: `sm.md` (Bob), `dev.md` (Amelia), `sat.md` (Taylor), etc.

---

## 2. Does the documentation match the expected workflow?

### David's Expected Sequence vs Documented Workflow

| #   | David's Description                                  | `bmad-regular-story.json` Station | Agent                | Match?                                                                                         |
| --- | ---------------------------------------------------- | --------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Scrum Master creates a story (session 1)             | Pos 0: WN + Pos 1: CS             | Bob (planner)        | **PARTIAL** — documented as 2 stations (WN then CS), David describes as 1                      |
| 2   | Scrum Master validates the story (session 2)         | Pos 2: VS                         | Bob (planner)        | **YES**                                                                                        |
| 3   | Developer (Nate) implements the story (session 3)    | Pos 3: DS                         | **Amelia** (builder) | **DISCREPANCY** — developer is Amelia, not Nate                                                |
| 4   | Developer (Nate) reviews the delivery (session 4)    | Pos 4: DR                         | **Nate** (reviewer)  | **PARTIAL** — Nate does DR (review), not DS (development). Nate is the reviewer, not developer |
| 5   | Taylor does story acceptance testing (session 5)     | Pos 5: SAT-CS                     | Taylor (tester)      | **YES**                                                                                        |
| 6   | Taylor executes story acceptance testing (session 6) | Pos 6: SAT-RA                     | Taylor (tester)      | **YES**                                                                                        |
| 7   | Lisa curates the story into KDD (session 7)          | Pos 7: CU                         | Lisa (advisor)       | **YES**                                                                                        |
| 8   | Ship the story (session 8)                           | Pos 8: SHIP                       | null (shipper)       | **YES**                                                                                        |
| 9   | Move on to next story                                | Return to WN                      | —                    | **YES** (implicit)                                                                             |

### Key Discrepancies Found

**1. Agent name confusion: Nate vs Amelia**
David's description says "Developer (Nate)" for both sessions 3 and 4. In reality:

- **Amelia** is the developer (DS — Develop Story, position 3)
- **Nate** is the delivery reviewer (DR — Delivery Review, position 4)

Nate never implements code. He independently reviews what Amelia built. This is a critical design feature — bias isolation requires different agents for development and review.

**2. Station count: 9 stations vs 8 sessions**
David describes 8 sessions (steps 1-8), but `bmad-regular-story.json` defines **9 stations** (positions 0-8). The difference is that David's "session 1" (Scrum Master creates a story) maps to **two** stations:

- Position 0: **WN** (What's Next — pick the next story to work on)
- Position 1: **CS** (Create Story — draft the story file)

In practice, these are sometimes run as separate sessions and sometimes combined (e.g., Story 2.3 had a combined `CS+VS` session).

**3. Session count varies in practice**
The session boundaries data shows the actual number of sessions varies:

- Story 2.1: **7 sessions** (WN, VS, DS, DR×2, SAT-CS, CU) — DR needed 2 passes, no Ship recorded separately
- Story 2.2: **7 sessions**, 54 min wall clock, zero backtracks — the "cleanest run"
- Story 0.1: **6 sessions** — lightweight ceremony, no SAT step
- Story 2.3: **8 sessions** — CS+VS combined, but SAT split into CS and RA

**4. "Session 4" description**
David wrote: "Developer (Nate) reviews the delivery / checks code quality from Amelia". This correctly describes what happens (Nate reviews Amelia's work) but incorrectly labels Nate as "Developer". Nate's role is **reviewer**, not developer.

---

## 3. Claude Code Session IDs

Session IDs are extensively tracked in `bmad-session-inventory.md` and `bmad-session-boundaries.md`. Here is the complete mapping for the best-documented stories:

### Story 2.1 — Company Publish Endpoint (2026-03-25)

| Step   | SID (short) | Agent  | Outcome                           |
| ------ | ----------- | ------ | --------------------------------- |
| WN     | `9909d615`  | Bob    | Created story file                |
| VS     | `3374c009`  | Bob    | Applied fixes                     |
| DS     | `8aa3f8c1`  | Amelia | 16 new tests, 285 total           |
| DR #1  | `2cb52200`  | Nate   | CONDITIONAL PASS                  |
| DR #2  | `57341a7b`  | Nate   | PASS (1.9 min)                    |
| SAT-CS | `e0bc71bd`  | Taylor | 12/12 SAT tests passed            |
| CU     | `c0c3a020`  | Lisa   | 5 KDD learnings, commit `e4aaabf` |

### Story 2.2 — Site Publish Endpoint (2026-03-26, cleanest run)

| Step   | SID (short) | Agent  | Outcome                    |
| ------ | ----------- | ------ | -------------------------- |
| WN     | `7335846f`  | Bob    | Created story file         |
| VS     | `508cf747`  | Bob    | Applied fixes              |
| DS     | `6e85723e`  | Amelia | 24 new tests, 321 total    |
| DR     | `f908644a`  | Nate   | 8 deferred items           |
| SAT-CS | `48bb39ae`  | Taylor | 18/18 passed               |
| CU     | `3762dd24`  | Lisa   | Recurrence 2 pattern       |
| Ship   | `c6493c66`  | —      | Commit `4dbefbb`, CI green |

### Full inventory covers: Stories 1.1–1.6, 2.1–2.4, 0.1–0.2, plus planning sessions (John, Sally, Winston)

---

## 4. What's missing or inaccurate?

### Documentation Gaps

1. **No single "workflow overview" document exists.** The workflow is split across brain docs (conceptual), JSON config (technical), and orchestration docs (operational). A reader must consult all three to understand the complete picture.

2. **WN station is underdocumented.** The brain workflows doc (`v6-workflows.md`) describes the flow as `Bob → *create-story → *story-ready → *story-context` but doesn't explicitly mention WN (What's Next) as a separate station. The JSON config has it at position 0, and session data confirms it runs as a separate session.

3. **SAT-RA station not always executed.** Some stories (0.1) skip SAT entirely (lightweight ceremony). The JSON config doesn't encode skip rules — `skip_rules: []` is empty. The skip logic is documented only in `bmad-lifecycle-handover.md`.

4. **Ship station has no agent identity.** `bmad-regular-story.json` sets `identity: null` for SHIP. The overlay maps it to `/bmad-ship` but there's no corresponding agent persona. Session data shows it's run as a mechanical step with no personality.

5. **Backtrack patterns not in JSON config.** The `backtrack_target: true` flags exist (CS at position 1, DS at position 3) but the actual backtrack routing logic (DR CONDITIONAL PASS → back to DS → re-DR) is only documented in `bmad-lifecycle-handover.md`, not in the workflow JSON.

6. **Code review in overlay has Amelia, not Nate.** The `bmad-v6.json` overlay maps `/bmad-code-review` to `identity: "Amelia"`. This is the older tactical code review, separate from Nate's DR. But the naming overlap could cause confusion.

### Inaccuracies in David's Expected Sequence

1. **"Developer (Nate)"** — Nate is the Delivery Reviewer, not the Developer. Amelia is the developer.
2. **8 sessions for 9 stations** — WN and CS are separate stations that sometimes run in one session, sometimes two.
3. **Linear assumption** — The actual workflow includes backtrack loops (DR → DS → DR) and Epic 0 interleaving that aren't captured in the linear 1-8 sequence.

---

## Recommendations

1. **Create a single workflow overview document** that unifies the brain docs, JSON config, and orchestration patterns into one readable reference.
2. **Clarify agent names** in any user-facing documentation — Amelia develops, Nate reviews. They are never the same person.
3. **Document skip rules** in the JSON config or a companion file, rather than relying on prose in the lifecycle handover doc.
4. **Add WN as an explicit step** in the brain workflows documentation to match the JSON config.
5. **Document the backtrack routing logic** alongside the workflow definition, not just in the orchestration handover.

---

## Source Files Consulted (all read-only)

- `~/dev/ad/apps/angeleye/server/src/config/workflows/bmad-regular-story.json`
- `~/dev/ad/apps/angeleye/server/src/config/overlays/bmad-v6.json`
- `~/dev/ad/brains/bmad-method/v6/v6-workflows.md`
- `~/dev/ad/brains/bmad-method/nate-agent-handover.md`
- `~/dev/ad/apps/angeleye/docs/planning/workflow-orchestration/bmad-session-inventory.md`
- `~/dev/ad/apps/angeleye/docs/planning/workflow-orchestration/bmad-session-boundaries.md`
- `~/dev/ad/apps/angeleye/docs/planning/workflow-orchestration/bmad-lifecycle-handover.md`
