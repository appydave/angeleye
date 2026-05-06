# BMAD Extended Analysis — 2026-04-09

**Source**: Second-pass analysis covering Mar 26–Apr 6 gap + sub-agent internals + non-SS projects
**Companion to**: bmad-deep-analysis-2026-04-09.md (which covers Apr 7–9)

---

## Sprint Arc — Mar 26 to Apr 6

### Mar 26–Apr 1: Epic 2 Finale + Epic 5 Launch

**Coverage**: 207 sessions across the SupportSignal `app.supportsignal.com.au` project directory.

**Date breakdown by session volume:**

- Mar 26: ~35 sessions (heavy — many simultaneous story runs)
- Mar 27: 1 session (light — `bmad-dr` only)
- Mar 28: 2 sessions (light — CU 2.4, a stub)
- Mar 29: ~20 sessions
- Mar 30: ~65 sessions (heaviest day — Epic 2 closure + retrospective + Epic 5 launch)
- Mar 31: ~65 sessions (very heavy — 0.x stories + 5.x mid-run)
- Apr 1: ~20 sessions (5.7 wrap-up, 5.8 started)

**Largest sessions by bytes:**
| Size | Date | Session | Content |
|------|------|---------|---------|
| 15.5 MB | Mar 29 | cddb77c9 | Mochaccino × 10 background tasks (UI mockups) |
| 4.2 MB | Mar 31 | 5eeca3a2 | Bob SM VS 5.3 |
| 4.2 MB | Mar 31 | ea1e7807 | Signal Studio API debug + dateOfBirth fix |
| 3.0 MB | Mar 26 | 9ce6fb0e | BMAD relay design review + renaming |
| 2.9 MB | Apr 1 | 154b70a4 | Taylor SAT CS 5.8 |
| 2.6 MB | Mar 31 | c2a26813 | Amelia DS 5.4 |
| 2.5 MB | Mar 30 | 4f832be9 | Amelia DS 5.2 |

#### Story Timeline

**Epic 2 Completion (Mar 26–29)**

Mar 25 ended with Story 2.1 shipped and 2.2 in progress. This window completed Epic 2.

| Date         | Story            | Station     | Agent       | Outcome                                                                                    |
| ------------ | ---------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------ |
| Mar 26 am    | 0.2 CS/VS        | WN/CS       | Bob         | Story file created for "Shared Publish Validation Helpers & Tenant Boundary Lock"          |
| Mar 26       | 0.2 DS           | DS          | Amelia      | Extracted shared validation helpers; 335 tests (up from 321)                               |
| Mar 26       | 0.2 DR           | DR          | Nate        | CONDITIONAL PASS → patches applied (type signature, test path)                             |
| Mar 26       | 0.2 CU           | CU          | Lisa        | Curated knowledge assets                                                                   |
| Mar 26       | 0.2 SHIP         | SHIP        | —           | Shipped Story 0.2                                                                          |
| Mar 26 night | 2.3 CS/VS        | CS/VS       | Bob         | Story 2.3: User Publish Endpoint                                                           |
| Mar 26 night | 2.3 DS           | DS          | Amelia      | Implemented user publish endpoint                                                          |
| Mar 26 night | 2.3 DR           | DR          | Nate        | CONDITIONAL PASS (null guard + siteIds fallback patches)                                   |
| Mar 26 night | 2.3 SAT          | SAT         | Taylor      | Ran 20 autopilot tests                                                                     |
| Mar 26 night | 2.3 CU           | CU          | Lisa        | 403 tests; story curated, closed                                                           |
| Mar 26–27    | 2.4 CS/VS        | CS/VS       | Bob         | Story 2.4: Participant Publish Endpoint (first transactional publish, 7 child tables)      |
| Mar 27–28    | 2.4 DS/DR/SAT/CU | Full chain  | All         | Story 2.4 completed; Lisa curated: FK ordering, Drizzle enum casting, contactIndex mapping |
| Mar 28–29    | 2.5 CS→SHIP      | Full chain  | All         | Story 2.5: RoutineShiftProfile Publish Endpoint                                            |
| Mar 29       | 2.6 CS/VS        | CS/VS       | Bob         | Story 2.6: Publish Dependency Ordering & Integration Validation                            |
| Mar 29       | 2.6 DS           | DS          | Amelia      | Implemented dependency chain enforcement across all 5 endpoints                            |
| Mar 29       | 2.6 DR           | DR          | Nate        | PASS                                                                                       |
| Mar 29       | 2.6 SAT/CU/SHIP  | SAT/CU/SHIP | Taylor/Lisa | Epic 2 complete. 6/6 stories shipped.                                                      |

**Retrospective & Epic 0 Cleanup Story 0.3 (Mar 30 am)**

| Date   | Story    | Station       | Agent              | Outcome                                                                                                                                                           |
| ------ | -------- | ------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mar 30 | Retro    | Retrospective | bmad-retrospective | Epic 2 retro completed; 31 KDD learnings; 5 action items                                                                                                          |
| Mar 30 | 0.3 DS   | DS            | (quick-dev path)   | Pre-Epic 3 cleanup: shared Drizzle mock factory, `validateTenantBoundary()` helper, unified error channels, removed dead NextResponse passthrough; 545 tests pass |
| Mar 30 | 0.3 SHIP | SHIP          | —                  | Story 0.3 shipped                                                                                                                                                 |

**Epic 5 Launch: Company Views (Mar 30 pm)**

Epic 5 was the first frontend-heavy epic after the API-focused Epics 1–2 — read-only entity view pages for the SupportSignal UI.

| Date       | Story           | Station     | Agent       | Outcome                                                                                         |
| ---------- | --------------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------- |
| Mar 30 pm  | 5.1 CS/VS       | CS/VS       | Bob         | Story 5.1: Company Details View (Read-Only) — establishes Server Component read-only pattern    |
| Mar 30 pm  | 5.1 DS          | DS          | Amelia      | 17-line API route + async Server Component; 563 tests                                           |
| Mar 30 pm  | 5.1 DR          | DR          | Nate        | PASS (6 deferred items)                                                                         |
| Mar 30 pm  | 5.1 SAT         | SAT         | Taylor      | AT-2, 5, 6 passed; Playwright AT-1, 3, 4 run                                                    |
| Mar 30 pm  | 5.1 CU/SHIP     | CU/SHIP     | Lisa        | Story 5.1 curated and shipped                                                                   |
| Mar 30 eve | 5.2 CS/VS       | CS/VS       | Bob         | Story 5.2: Sites List View (Read-Only) — first HTML table in the app                            |
| Mar 30 eve | 5.2 DS          | DS          | Amelia      | 566 tests (4 new)                                                                               |
| Mar 30 eve | 5.2 DR          | DR          | Nate        | CONDITIONAL PASS — 3 patches: "Edit Site"→"Site Details", remove asterisk, add htmlFor/id pairs |
| Mar 30–31  | 5.2 SAT/CU/SHIP | SAT/CU/SHIP | Taylor/Lisa | Story 5.2 shipped                                                                               |

**Epic 0 + Epic 5 Interleaved (Mar 30–31)**

Multiple Epic 0 cleanup stories ran concurrently with Epic 5 development.

| Date         | Story               | Station       | Agent              | Outcome                                                                                                      |
| ------------ | ------------------- | ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Mar 30 eve   | 0.4 CS/VS           | CS/VS         | Bob                | Story 0.4: Schema audit / DB field expansion (enables pages to show all fields)                              |
| Mar 30 eve   | 0.4 DS/DR/CU        | DS/DR/CU      | All                | Story 0.4 shipped                                                                                            |
| Mar 30–31    | 0.5 CS/VS           | CS/VS         | Bob                | Story 0.5: UI upgrade — Company details, Site detail, Site list table to form-like layout + Badge components |
| Mar 31       | 0.5 DS/DR/SAT       | DS/DR/SAT     | Amelia/Nate/Taylor | Story 0.5 shipped (full chain — UI story requires SAT)                                                       |
| Mar 31       | 0.6 CS/VS           | CS/VS         | Bob                | Story 0.6: Story Creation Process Hardening (auto-detect entity/UI story types, inject mandatory gates)      |
| Mar 31       | 0.6 DS/DR/CU        | DS/DR/CU      | Amelia/Nate/Lisa   | Story 0.6 shipped                                                                                            |
| Mar 31       | 5.3–5.6 CS→SHIP     | Full chains   | All                | Stories 5.3–5.6 (entity views) shipped                                                                       |
| Mar 31 eve   | 0.7                 | Various       | —                  | Story 0.7 (CU session present; details unclear)                                                              |
| Mar 31       | 0.8                 | CS/SAT        | Bob/Taylor         | Story 0.8 in-progress                                                                                        |
| Mar 31–Apr 1 | 5.7 CS→SHIP         | Full chain    | All                | Story 5.7: Entity list view with role-filtering; 4x formatTimestamp duplication flagged → spawned 0.10       |
| Apr 1        | 5.8 CS/VS/DS/DR/SAT | Partial chain | All                | Story 5.8 in-progress (SAT 5.8 reached 780 tests; teal button cascade issue fixed)                           |

**Stories 0.9 and 0.10 Planned:**

- 0.9: Sign-out bug (handleLogout fires on mount during login navigation)
- 0.10: formatTimestamp extraction (4 copies) — spawned as action item during DR 5.7

#### Key Milestones

**Overwatch Evolution in This Window**

Overwatch was already active before Mar 26. The first session in this window (Mar 26 08:42, session `94178674`) shows Overwatch resuming with a freshness protocol, reviewing existing sprint state.

Key Overwatch evolution events:

- **Mar 26**: Overwatch caught its own error — told David to jump straight to Amelia on Story 2.3 before Bob had created the story file for 0.2. Self-corrected.
- **Mar 26**: Overwatch's oversight doc was trimmed from 588 → 272 lines (54% reduction) after David complained about wall-of-text responses.
- **Mar 30 eve**: David explicitly demanded paste-ready text as the FIRST output, not summaries. Overwatch updated its own `oversight-workflow.md` Step 5 on the spot. Feedback memory saved.
- Overwatch ran in parallel across ~30 separate sessions in this window, maintaining sprint state across all story runs.

**Epic Completion Status at Apr 1:**
| Epic | Completion | Notes |
|------|-----------|-------|
| Epic 2: Push Integration | Mar 29 | 6/6 stories (2.1–2.6) complete; retrospective run Mar 30 |
| Epic 0 (cleanup stories) | Ongoing | Stories 0.1–0.8+ interleaved throughout; 0.2, 0.3, 0.4, 0.5, 0.6 confirmed shipped |
| Epic 5: Entity Views | In progress | Started Mar 30; 5.1–5.7 done by Apr 1; 5.8 in-progress end of Apr 1 |
| Epic 3/4 | Not started | Retro recommended starting Epic 3 after 0.3 cleanup; not launched in this window |

**Major Failures and Process Changes:**

Failures / Incidents:

1. **Story 0.2 creation confusion** (Mar 26): Overwatch told David to "skip VS, go straight to DS 2.3" when Story 0.2 didn't have a file yet and Bob had been given wrong scope. Required backtrack.
2. **Signal Studio serialization bugs** (Mar 31 eve): Sites push failing due to `value || undefined` dropping fields + dateOfBirth Date object serialization. Required out-of-band debug and fix session; not a story — direct patch.
3. **Overwatch wall-of-text pattern**: Persistent; David escalated twice. Final fix Mar 30 eve locked in "paste-ready text FIRST" as a process rule.

Process Changes:

1. **Lighter ceremony for Epic 0**: Skip SAT for pure refactoring stories; full chain for UI-changing stories.
2. **Story creation hardening (Story 0.6)**: `bmad-create-story` workflow now auto-detects entity/UI story type and injects mandatory gates.
3. **Overwatch doc trimmed 54%** (Mar 26): Removed planning-phase artifacts; doc now fits in working context.
4. **Overwatch "paste-ready first" rule** (Mar 30): Now leads with the agent paste command, not analysis narrative.
5. **Super-admin scope killed** (Mar 31): Decision to NOT build cross-company switcher for v1. Logged as three distinct future feature options.

**Notable Out-of-Band Sessions:**

- **Mar 29 cddb77c9 (15.5 MB)**: Mochaccino × 10 background tasks — built 10 participant data web page mockups.
- **Mar 29 467a2dec**: BMAD Relay self-analysis session — David exploring "BMAD Relay" identity, gathering agent chain knowledge for relay orchestrator planning. "You are the relay team" — Relay is race official + all runners combined.
- **Mar 31 ea1e7807 (4.2 MB)**: Signal Studio API debug — sites push failing; root causes: `value || undefined` → JSON.stringify drops fields; `dateOfBirth mode: 'date'` returns Date objects serialised wrong. Fix: `mode: 'string'` on schema.
- **Mar 31 a49f3380**: Super-admin cross-company switcher design session; clarified 3 distinct capabilities: Impersonation, Cross-company viewer, Cross-company administrator; decided NOT to build cross-company switcher yet.

---

### Apr 2–5: Epic 6 CRUD Sprint

**Epic active throughout**: Epic 6 — Entity CRUD (parallel track: Epic 0 / Story 0.11 OOM fix)
**Test count progression**: 849 (6.1 DR) → 931 (6.2 DR) → 933 (6.3 DS) → 996 (6.4 DR) → tracked for 6.5

#### Story Velocity Table

| Date  | Story                   | Agent             | Station         | Outcome                                                                                         |
| ----- | ----------------------- | ----------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Apr 2 | 0.11 Emergency OOM Fix  | bmad-dev (Amelia) | DS              | Complete → review                                                                               |
| Apr 2 | 0.11 OOM Fix            | bmad-dr (Nate)    | DR              | PASS (2 separate CI ships)                                                                      |
| Apr 2 | 0.11 OOM Fix            | bmad-lib (Lisa)   | CU              | **Shipped** — CI #23896342656 + #23906195963 (iterated)                                         |
| Apr 2 | 6.1 Design Foundation   | bmad-sm (Bob)     | CS 6.1          | Story context created                                                                           |
| Apr 2 | 6.1 Design Foundation   | bmad-sm (Bob)     | VS 6.1          | Validated — story improved                                                                      |
| Apr 2 | 6.1 Design Foundation   | bmad-dev (Amelia) | DS 6.1          | Complete → review                                                                               |
| Apr 2 | 6.1 Design Foundation   | bmad-dr (Nate)    | DR 6.1          | PASS — 849 tests                                                                                |
| Apr 2 | 6.1 Design Foundation   | bmad-sat (Taylor) | CS 6.1          | Test guide created (15 autopilot + 4 manual); autopilot 15/15 PASSED                            |
| Apr 2 | 6.1 Design Foundation   | bmad-lib (Lisa)   | CU 6.1          | **Shipped** — CI #23894471074, commit `1ab5e5f`                                                 |
| Apr 2 | 6.2 CRUD Infrastructure | bmad-sm (Bob)     | CS 6.2          | Story context created                                                                           |
| Apr 2 | 6.2 CRUD Infrastructure | bmad-sm (Bob)     | VS 6.2          | Validated (two VS sessions — iteration on story)                                                |
| Apr 2 | 6.2 CRUD Infrastructure | bmad-dev (Amelia) | DS 6.2          | Complete → review                                                                               |
| Apr 2 | 6.2 CRUD Infrastructure | bmad-dr (Nate)    | DR 6.2          | PASS — 931 tests (9 pre-existing memory tests excluded)                                         |
| Apr 2 | 6.2 CRUD Infrastructure | bmad-lib (Lisa)   | CU 6.2          | **Shipped** — CI #23906615241, commit `9a751b2`                                                 |
| Apr 2 | 6.3 Company Edit        | bmad-sm (Bob)     | CS 6.3          | Story context created                                                                           |
| Apr 2 | 6.3 Company Edit        | bmad-sm (Bob)     | VS 6.3          | Validated — 12 improvements applied                                                             |
| Apr 2 | 6.3 Company Edit        | bmad-dev (Amelia) | DS 6.3          | Complete                                                                                        |
| Apr 2 | 6.3 Company Edit        | bmad-dr (Nate)    | DR 6.3          | PASS Rev 2 — 6 patches applied                                                                  |
| Apr 2 | 6.3 Company Edit        | bmad-sat (Taylor) | CS+RA 6.3       | 18/18 autopilot PASSED, 4 manual tests                                                          |
| Apr 2 | 6.3 Company Edit        | bmad-lib (Lisa)   | CU 6.3          | **Shipped** — CI #23909782523, commit `bc85c6c`                                                 |
| Apr 3 | 0.11 OOM Fix            | bmad-oversight    | Oversight       | Verified Bob's 3 criticals; confirmed globalThis fix real                                       |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-sm (Bob)     | CS 6.4          | Story context created                                                                           |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-sm (Bob)     | VS 6.4          | Validated — C1/C2/E3 applied (siteLead mismatch, system-admin tests)                            |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-oversight    | Overwatch       | Reviewed Nate's DR — confirmed all 4 patches legitimate                                         |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-dev (Amelia) | DS 6.4          | Complete — 996 tests pass, 4 patches (BH-1, BH-6, UT-3, compound WHE)                           |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-dr (Nate)    | DR 6.4          | PASS Rev 2 — 996 tests, lint+build clean                                                        |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-sat (Taylor) | CS 6.4          | 26/26 autopilot PASSED                                                                          |
| Apr 3 | 6.4 Sites Full CRUD     | bmad-lib (Lisa)   | CU 6.4          | **Shipped** — CI #23912889153, commit `2d0d6ea`                                                 |
| Apr 4 | 0.11 OOM Fix            | bmad-sm (Bob)     | WN              | Status check — 0.11 complete except manual HMR verification                                     |
| Apr 4 | 6.1 Design Foundation   | bmad-oversight    | Oversight       | Monitored SAT stage — confirmed CS done, directed RA run                                        |
| Apr 4 | 6.5 Participants CRUD   | bmad-dr (Nate)    | DR 6.5          | Started (session used wrong skill name `bmad-nat`, corrected to `bmad-dr`)                      |
| Apr 5 | 6.5 Participants CRUD   | bmad-oversight    | Oversight       | Full multi-loop retrospective — 4 revisions with 3 backward loops documented                    |
| Apr 5 | 6.5 Participants CRUD   | bmad-relay        | Relay/Archon    | Agent normalization: persona.md extracted for all 5 chain agents; Archon v2 committed `fbabc8f` |
| Apr 5 | 6.5 Participants CRUD   | —                 | Context refresh | CONTEXT.md refreshed (system-context skill, 3 runs) — Epic 6 CRUD infrastructure reflected      |
| Apr 5 | 6.5 Participants CRUD   | bmad-sm (Bob)     | CS 6.5          | Story context created (session: 38b3)                                                           |

#### Sprint Velocity

| Date  | Stories Shipped                        | Stories In-Flight                 | Notes                                                                |
| ----- | -------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| Apr 2 | 5 (0.11, 6.1, 6.2, 6.3 + 0.11 re-ship) | 6.4 CS started                    | Exceptionally high velocity — full lifecycle per story in same day   |
| Apr 3 | 1 (6.4)                                | 0.11 oversight, 6.5 setup         | Solid day — 6.4 full CRUD with 996 tests                             |
| Apr 4 | 0                                      | 6.5 DR started, 6.1 SAT oversight | Lighter day — diagnostic + oversight work                            |
| Apr 5 | 0 (6.5 not yet shipped)                | 6.5 in CS stage                   | Infrastructure day — Archon v2, agent normalization, context refresh |

**Sprint total shipped (Apr 2–5)**: 6 stories (0.11, 6.1, 6.2, 6.3, 6.4 confirmed shipped; 6.5 in-flight at end of Apr 5)

#### Notable Events

**Story 6.5 — 3-Day Troubled Cycle (Apr 2–4)**

The most significant event of the sprint. Story 6.5 spanned 3 days and required 4 revisions with 3 backward loops:

- **Revision 1 (Apr 2)**: Amelia v1 submitted with 127 test failures → Nate blocked, sent back
- **Loop 1 → Amelia v2**: Fresh session, fixed all test failures, schema migration (name → firstName/lastName)
- Further DR passes required before reaching Taylor for SAT
- **Root cause**: Schema mismatch — story context assumed split `firstName`/`lastName` but DB had single `name` field. Migration 0004 left the legacy `name` column as NOT NULL while Drizzle schema dropped it — every INSERT omitted `name` → constraint violation.
- **ZodError silent trap** discovered: `safeAction` only catches `AppError`; any `.parse()` call throwing `ZodError` becomes `INTERNAL_ERROR` to client. Flagged as Story 0.x candidate.

**Apr 2 — Exceptional Velocity Day**: Apr 2 processed 5 full story lifecycles in a single day (22+ BMAD sessions, each story completing full CS→VS→DS→DR→SAT→CU→SHIP chain).

**Story 0.11 — Two CI Ships**: First the DB pool + RSC cache fix, then a follow-up removing Turbopack and switching to webpack after diagnosis confirmed Turbopack as the memory leak source. Story remained "in-progress" pending manual HMR stability verification through Apr 4.

**Wrong Skill Name (Apr 4)**: The Apr 4 DR 6.5 session started with `bmad-nat` (not found), then corrected to `bmad-dr`. Session was only 49KB — likely immediately abandoned or blocked.

**Archon v2 Infrastructure (Apr 5)**: Apr 5 was largely an infrastructure repair day. The BMAD relay architecture was normalized — all 5 chain agents consolidated into `.claude/skills/` with `persona.md` files extracted. Archon's forward-only lifecycle and sub-workflow pattern for fix loops were formalized (commit `fbabc8f`). This was prompted by problems encountered during the Story 6.5 troubled cycle.

**safeAction Promoted to Standard Pattern**: Story 6.4 shipped with `safeAction` elevated from feature-specific to standard CRUD pattern across the application — a structural decision affecting all future stories 6.5–6.9.

**VS 6.2 Iterated Twice**: Story 6.2 validation ran in two separate sessions (`13f74ef9` and `2b60e23f`), suggesting the first pass was incomplete or the story needed additional iteration before Bob declared it validated.

---

### Apr 6: Stories 6.5 Resolution + 6.6 + 0.12

#### Sprint State at Start of Day

| Story | Title                                    | Status                   | Note                                                                                                         |
| ----- | ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 0.11  | Emergency OOM Fix & Memory Observability | in-progress (Human Hold) | MT-1 is human-only (HMR stability). Lisa already curated. Close with `/bmad-lib CU 0.11` after manual verify |
| 0.12  | Epic 6 Systemic Deferred Items           | ready-for-dev            | 9 cross-cutting issues from Epic 6                                                                           |
| 0.9   | Sign-out button fires on mount           | ready-for-dev            | parallel Epic 0 work                                                                                         |
| 6.5   | Participants CRUD                        | in-progress (DR FAIL)    | Amelia had test failures, DR returned FAIL                                                                   |
| 6.6   | Participant Profile Sub-Entity CRUD      | backlog                  | no story file yet                                                                                            |
| 6.7   | Users List and Detail View               | backlog                  |                                                                                                              |
| 6.8   | Dashboard Stat Cards & Recent Activity   | backlog                  |                                                                                                              |

**Test count at start of day**: ~969 (6.5 Amelia initial rev), rising to 1001 → 1057 → 1061 → 1130 through the day.

#### Schema Migration Crisis — Story 6.5

The DR FAIL crisis was the most significant drama of the day:

- Nate's first DR returned FAIL — 127 tests failing, 889 passing (session: 0a188fbd)
- Root causes: `name` → `firstName`/`lastName` schema migration applied to prod code but NOT propagated to 8 test files; `getDb` unmocked in participant-actions.test.ts; ZodError not caught by safeAction
- Bob's VS had already caught the schema mismatch earlier — added AC #0 pre-condition gate and Task 0.2 (conditional migration)
- Migration 0004 left legacy `name` column as NOT NULL; Drizzle schema dropped it — every INSERT omitted `name` → constraint violation → "Internal error"

**Amelia Repair Round 1 (session: 72ee8ca0)**: Fixed schema propagation in 7 test files, added `vi.hoisted()` mock pattern.

**Amelia Repair Round 2 (session: 8e30b37d)**: ZodError handling in safe-action.ts, notFound() in page.tsx, participant-actions.test.ts getDb mock, 8 test files updated, 2 new component tests written.

**Nate DR Rev 2 → CONDITIONAL PASS (session: eb603164)**: After Amelia's repairs: 969/969 tests pass, lint+build clean. 5 patches required. 5 deferred items created for Story 0.x.

**DR Rev 3 → PASS**: All 5 patches confirmed, 1001/1001 tests.

**Taylor SAT (session: 985d9b98)**: 10 Autopilot tests 10/10 PASS. MT-1 PASS, MT-2 PASS (after migration 0005), MT-3 SKIPPED (role gating covered by unit tests).

**Lisa CU 6.5 (session: 8156ed29)**: 4 new KDD learnings: `safe-action-error-class-contract-kdd`, `nextjs-notfound-vs-inline-jsx-kdd`, `readonly-null-placeholder-vs-value-kdd`, `vitest-hoisted-mock-factory-kdd`. `edit-toggle-read-write-hybrid-kdd` hit promotion threshold (3 recurrences). Story 0.12 seeded (5 deferred items from 6.5 DR). Ship: CI run #23991150567.

#### Story 0.12 — Epic 6 Systemic Deferred Items

9 cross-cutting issues resolved as a cleanup sweep:

1. `coerceEmpty` extracted to `lib/utils/coerce.ts` (also added `coerceEnum` generic)
2. `readOnlyInputClassName` extracted to `lib/ui/readonly-input.ts`
3. 10 inline enum arrays removed from server actions → schema imports
4. Cross-section state sync: `router.refresh()` after contact delete
5. `useAutoClear` hook created, replaced 23 raw `setTimeout` usages across 11 files
6. Delete actions: `.returning()` + empty-result guard
7. `optionalIsoDate` on 3 date fields
8. 6 section components got tests
9. No `z.boolean().default()` in schemas (replaced with explicit handling)

Nate DR: All 3 pre-review gates passed. CONDITIONAL PASS patches (coerceEmpty import fixes), then Re-Review PASS (1130/1130 tests). Taylor SAT: All 10 Autopilot PASS. Lisa CU: 2 new KDD learnings, `drizzle-returning-guard-pattern.md` created (10th pattern). Ship: CI run #24035365948, commit `fb39442`.

#### Story 6.6 — Participant Profile Sub-Entity CRUD

Full-day story running the complete BMAD pipeline via orchestrator (session: aec44254).

**What was built:**

- Participant detail page → full profile management hub
- 6 sub-entity sections: health conditions, risk items, contacts, support goals, notification rules, restrictive practices
- 18 server actions (create/update/delete × 6 entities)
- 6 Zod schemas
- Epic 5 read-only components → editable client components with edit-toggle, inline add, delete-with-confirm
- 32 files, 4,622 insertions, CI commit: `434744e`

Bob VS (session: da67be5a): 3 critical issues, 4 enhancements, 2 optimizations found.

**Archon background task failure (session: df8b1b65)**: Tried running BMAD lifecycle via Archon background task — Bob CS: DONE, Bob VS: DONE, triage-validation: CANCELLED mid-stream when the background task terminated. Recovered manually. This was an early Archon integration test.

**Orchestrator run (session: aec44254)**: Full pipeline: Bob CS → Bob VS → [human gate] → Amelia DS → Nate DR → Taylor SAT+RA → Lisa CU → Ship. Taylor RA: 20/21 PASS, 1 SKIPPED (MT-6 role gating, no support-worker account in dev env). Lisa CU: 2 new KDD, 9 updated, 2 patterns updated, 140 total learnings, 9 patterns. Ship: CI green, commit `434744e`.

#### Stories Completed on Apr 6

| Story | Title                               | CI Run                | Commit    | Tests |
| ----- | ----------------------------------- | --------------------- | --------- | ----- |
| 6.5   | Participants CRUD                   | #23991150567 (2m 21s) | `98f5303` | 1001  |
| 0.12  | Epic 6 Systemic Deferred Items      | #24035365948 (2m 47s) | `fb39442` | 1130  |
| 6.6   | Participant Profile Sub-Entity CRUD | (CI green)            | `434744e` | 1057  |

**3 stories shipped on Apr 6.** All CI green.

#### Notable Events Apr 6

**Archon Background Task Failure**: The BMAD lifecycle attempt via Archon background orchestration was an early integration test — Bob CS and VS completed, but `triage-validation` node was CANCELLED mid-stream when the background task terminated.

**Wrong Agent Command**: David accidentally typed `/bmad-sat CU 0.12` (Taylor can't do CU). Taylor correctly redirected: "CU is Lisa's command."

**/bmad-relay is a stub**: Confirmed in session f9bb2d52 that `/bmad-relay` is not yet built — it's a design doc at `_bmad-output/planning-artifacts/bmad-relay-design.md`. All 6 chain agents operational, but relay isn't wired.

**Orchestrator Pattern Maturing**: Story 6.6 ran through the entire BMAD pipeline from one orchestrator session (aec44254), with human gates between Bob VS and Amelia, and between Taylor and Lisa. This is the pattern David is moving toward.

**Clauding Lab / Teammate Mode (session: 41e9ed50 — 10MB)**: Largest session was a group chat debrief about Noah's `claude --teammate-mode tmux --dangerously-skip-permissions` setup, iTerm2 `-CC` flag, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env var. Discussion of skill briefs for generic orchestrator and BMAD story lifecycle.

**Knowledge Base Growth through Apr 6:**

- Learnings: ~131 → 140 (9 new during day)
- Patterns: 9 → 10 (`drizzle-returning-guard-pattern.md` promoted)
- 3 more learnings past promotion threshold, deferred to Epic 6 retro

#### Sprint State at End of Apr 6

| Story | Status                                                |
| ----- | ----------------------------------------------------- |
| 0.11  | in-progress (human hold — HMR stability MT-1 pending) |
| 0.12  | done (shipped)                                        |
| 0.9   | ready-for-dev (untouched)                             |
| 6.5   | done (shipped)                                        |
| 6.6   | done (shipped)                                        |
| 6.7   | backlog (story file not created)                      |
| 6.8   | backlog                                               |

---

## Sub-Agent Internals

_Extracted from deep read of 14 sub-agent JSONL files across 6 parent sessions (Apr 7–9)._

### Prompt Injection Anatomy

Four distinct injection styles were observed:

**1. Teammate-message format (tmux sub-agent windows)**

Used in Amelia fix-3 (23af8796). The initial prompt is wrapped in a `<teammate-message>` XML tag with a `teammate_id="team-lead"` attribute, giving the agent its persona, project root, team name, and task in one block. Highly structured — fixes are written as numbered tasks with specific files, expected outcomes, and a full test sequence to run after.

Example structure:

```
<teammate-message teammate_id="team-lead">
You are Amelia (Dev), fixing 2 issues for story 7.3.
Project root: /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
Team: story-7-3
Your name: amelia-fix-3
[detailed fix instructions]
Report back with: [specific output requirements]
</teammate-message>
```

Ends with: "DO NOT ask for user input. Run to completion and send your full diagnostic to team lead when done."

**2. Plain prompt (in-context sub-agents via Agent tool)**

Used for the UAT runner builder (agent-a97fbaaf, launched with `Agent` tool). Plain English prompt with step-by-step instructions, no persona wrapping. Significantly less structured — relies on agent judgment for sequencing.

**3. Explore sub-agent (Amelia's own sub-agent)**

Amelia spawned her own explore sub-agent (agent-a69f6ec6) with a tightly scoped information-gathering prompt: read specific files, identify patterns, return under 500-word report. This is a "reconnaissance" pattern — gather before acting. Pure information-gathering, no false positives.

**4. Aside-question format (compaction continuations)**

The aside_question files for a572f298 are NOT separate task agents — they are continuation shards of the same orchestrator session after context compaction. Each one receives the same compacted summary as its "initial prompt" and resumes the same orchestrator thread. They contain `SendMessage` tool calls to query the sub-agent about its progress.

**Handoff mechanisms:**

- **`SendMessage` tool**: Orchestrator sends a direct message to a named agent by ID. Used to check progress of background agents.
- **Compaction summary**: When context overflows, the orchestrator session compresses its history. The compacted summary becomes the "initial prompt" for the continuation shard.

### Compaction: Preserved vs Dropped

**What gets preserved (a572f298 / acompact-9a2de63a):**

1. **Full BMAD lifecycle chain** — the exact station sequence with no abbreviation
2. **Critical bug fixes with exact code** — both the wrong version and the corrected version (verbatim)
3. **Specific file paths and line numbers** — exact problematic line content
4. **System constraints** — `useAutoClear` hook 3s timing, Playwright 5s default timeout, `workers:1` requirement, Supabase RLS tenant scoping
5. **In-flight agent status** — background sub-agents tracked by name
6. **User's architectural preferences** — preferences expressed mid-session preserved as learnings

**What gets dropped:**

- Intermediate reasoning steps, internal monologue
- Tool call results that have been consumed (e.g., file read outputs used to make edits)
- Failed tool attempts that were retried successfully
- CI polling intermediate status checks
- Story file section-by-section read chunks (collapsed to "read the story file")

The compaction is strongly biased toward **state that affects future decisions** and **technical facts that would be expensive to re-derive**.

**Mid-session snapshot vs true compaction:** The Amelia fix-3 compaction file (23af8796 / acompact-82a8bb8f) has 309 non-progress entries with NO summary entries — this is a live mid-session snapshot, not a true compaction. Amelia's context was never compacted before the session terminated externally.

### Invisible Events (Orchestrator Never Saw)

Events that happened inside sub-agents but were never surfaced to the parent orchestrator:

**1. Duplicate UAT runner write (agent-a97fbaaf)**
Internally: wrote the HTML file twice. The compaction artefact caused the same UAT runner prompt to be re-sent to the same agent, which overwrote the first write. Externally: "I've built the UAT runner at tools/uat-runner.html." No mention of the double-write.

**2. Amelia's sub-agent delegation (acompact-82a8bb8f)**
Internally: Amelia spawned her own explore sub-agent before acting. Externally: Amelia returns findings as if she discovered them herself. The sub-delegation is invisible from the outside.

**3. Taylor's Supabase direct access (acompact-9a2de63a)**
Internally: Used `mcp__supabase__execute_sql` to directly query and modify participant data (fixing the NDIS number in the live DB). Externally: "Fixed seed data." The mechanism — direct SQL vs app layer vs seed script — is abstracted.

**4. Story 0.11 status discrepancy (agent-a3229ac22bccb510f)**
Internally: Cross-checked story file (shows in-progress) vs sprint-status.yaml (shows done). Flagged the discrepancy in its return. Externally: Only the final determination matters to the orchestrator.

**5. Epic 2 format adaptation (agent-a39c25fadddb6596b)**
Internally: Had to switch from Read to Grep mid-task because Epic 2 files used different section headers. Externally: Returned clean structured output with no mention of the format mismatch.

**6. Story 5.3 status discovery (agent-a23c8c9a607f678d9)**
Internally: Discovered story 5.3 was `review` not `done` by reading the file header. Externally: Reported this discrepancy to orchestrator — one of the few cases where internal discovery was surfaced completely rather than abstracted.

**7. Compaction shard Q2 superseded by Q1 (agent-aside_question-9cb4dfa)**
Internally: Q2 started running (19 tool calls, including beginning Lisa CU) but was superseded when Q1's longer shard completed the same work. Externally: The user sees one continuous orchestrator response — the internal shard competition is invisible.

**8. UAT runner written twice**: The Agent tool was launched in background while the orchestrator got compacted, and when the compaction aside resumed, it re-sent the same prompt to the same agent, causing a duplicate write cycle. The second write overwrote the first.

**9. Amelia terminated mid-fix (23af8796)**: Was ~20-30 minutes from completion (Fix 1 done, Fix 2 ~60% complete — 2 of 6 sub-entity sections aria-labelled). Session was killed externally (user terminated or tmux window closed) rather than completing normally or hitting a context limit. The last captured text: "Let me check what the Form component actually renders:" — mid-investigation.

### Parallel Document Reader Pattern

The Story 7.2 orchestrator (ee66207d) launched 6 sub-agents simultaneously as parallel document readers — not BMAD persona agents (those run in the orchestrator session or as tmux windows). These are unnamed extraction agents:

- **agent-a3229ac2**: Epic 0 extractor — 23 calls, flagged 0.11 status discrepancy
- **agent-a5e8e2ae**: Auth gap + security KDD reader — 7 calls, "do not summarize" constraint honored
- **agent-a23c8c9a**: Epic 5 extractor — 21 calls, independently discovered story 5.3 `review` not `done`
- **agent-abdd1c6e**: Epic 6 extractor — 15 calls, adopted offset-read strategy
- **agent-a8b44bad**: Epic 1 extractor — 13 calls, originated the "initial read → offset re-read" pattern
- **agent-a39c25fa**: Epic 2 extractor — 18 calls, most Grep-heavy due to different Epic 2 section headers

The offset-reading pattern originated with agent-a8b44bad and was independently adopted by later agents in the same batch — emergent best-practice spread without explicit instruction.

### Bob VS Pre-Flight Sub-Agent

Bob VS's "quick check" (Story 7.4, agent-a321198f) is a minimal file-existence probe — 12 sequential Read calls, one per file, zero analysis. Returns "All files exist." The 3-minute VS review refers to wall-clock time including the orchestrator's reasoning around this sub-agent call. The actual Bob VS security analysis happens in the orchestrator session after this sub-agent confirms the filesystem state.

---

## Non-SS Projects Mar 26–Apr 6

### Paperclip — Self-Hosted Multi-Agent Control Plane

**One-line summary**: If OpenClaw is an employee, Paperclip is the company.

Paperclip is a self-hosted multi-agent control plane — not an agent, not a workflow builder, not a chatbot. It orchestrates existing Claude Code agents into a virtual company with an org chart, task system, budgets, and board governance.

**Architecture:**

```
You (Board of Directors)
    ↓ approve hires, set budgets, approve CEO strategy
CEO Agent (e.g., cfcc0c4b — strategic coordinator)
    ↓ delegates
CTO / CPO / Spec Writer... (department heads)
    ↓ delegate
Leaf agents doing actual work
```

**The Heartbeat Model:**

Agents do NOT run continuously. Heartbeat cycle:

1. Paperclip fires trigger (timer, task assignment, @-mention)
2. Paperclip spawns agent process, injects env vars: `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY`, `PAPERCLIP_RUN_ID`
3. Agent wakes, reads context from Paperclip REST API
4. Agent does useful work, reports status/cost
5. Agent exits — Claude session ID persisted so next heartbeat resumes same conversation context

**Workspaces vs Projects:**

- **Workspaces**: Per-agent long-running sessions (one workspace UUID per agent instance). Agent checks its inbox, acts, exits.
- **Projects**: Task/issue hierarchy within a Paperclip company.
- Session path encodes: `paperclip-instances-default-workspaces-<agent-uuid>` or `paperclip-instances-default-projects-<company-uuid>-<project-uuid>--default`

**Multi-Company Support:**

```
Paperclip (localhost:3100)
├── Company: Brains Management   → brain librarian agents
├── Company: FliVideo            → dev agents
└── Company: AppyDave Content    → content pipeline agents
```

**What David Was Doing (Mar 29–31) — ANG Project:**

The observed Paperclip sessions ran a small virtual company on the ANG project (AngelEye's station-based workflow spec):

- **ANG-2**: "Research and outline the station-based workflow system" — parent tracker owned by CEO
- **ANG-3**: Parent initiative (CEO delegating)
- **ANG-4**: "Research and verify BMAD workflow documentation" — researched by Spec Writer
- **ANG-5**: "Spec 1: Workflow Schema & Storage" — completed by Spec Writer, in review with David

**Agents active:**

- `cfcc0c4b` = CEO — tracked ANG-2, delegated to Spec Writer, waited on board review
- `8fd2ea7b` = Spec Writer — did the actual research (BMAD doc verification, AngelEye station sequences)
- `54ea7cf7` = CTO — mostly idle (no tasks assigned)

**Key research finding by Spec Writer on ANG-4**: David's description said "Developer (Nate)" for sessions 3–4, but Amelia is the developer and Nate is the delivery reviewer (intentionally separate for bias isolation). The actual BMAD workflow had 9 stations documented, not 8 as described.

**David's feedback on ANG-3**: The plan doc "jumped ahead" by defining station sequences for workflows without evidence. David asked for: remove fabricated "Lightweight Story" workflow type, mark Epic Zero as TBD/provisional, add Epic Retrospective as known-but-undefined.

**Problems encountered:**

- No heartbeat intervals were initially set on any agent — all three sat `idle`
- Some heartbeats blocked by shell permissions (curl calls denied)

**Resolution (Mar 31 session 6bbdf751):** Created `brand-dave:paperclip` skill (21 cherry-picked API endpoints, 3 tiers: read/write/admin), set heartbeats to 30m for all 3 agents, added `jup-paperclip` jump alias. Brain expanded to 9 files at `~/dev/ad/brains/paperclip/`. Committed to 3 repos (brains, appydave-plugins, appydave-tools). Pull instructions for M2 Mini and M4 Mini issued.

**Paperclip skill location:** `brand-dave:paperclip` (`.claude/skills/`)
**Brain location:** `~/dev/ad/brains/paperclip/` — 9 files including: `paperclip-fundamentals.md`, `paperclip-concepts.md`, `paperclip-adapters.md`, `paperclip-davids-companies.md`, `paperclip-installation.md`, `paperclip-observations.md`

---

### AppyDave Plugins v1.18→v1.21 (Mar 29)

Mar 29 was a major plugin evolution day. Plugin version went from ~v1.18 to v1.21.0 in a single day.

**Ralphy v2.0.0 (sessions: d08bbb5a + fc650f31):**

Full Ralphy background research produced 5 handover files; all 5 executed. Ralphy v2.0.0 implemented — 8 changes:

- Profiles system (Development profile as campaign default)
- Registry updates
- Self-assessment fix
- Lisa auto-promotion
- AGENTS.md handling (breaking change — hence v2.0.0)

Key bug found and fixed: `set -euo pipefail` + `awk | head` caused SIGPIPE (exit 141) after ~30 skills in the validation script.

Two commits pushed:

- `eccc650` — March 27 backlog: doc-review suite (7 skills), enrich-metadata, refresh-google-brain, mochaccino/refresh-claude-brain updates
- `1c3b7b4` — Ralphy v2.0.0: all 8 changes, plugin version 2.0.0

Post-upgrade fix (session fd19f955): Campaign gate prompt now offers `delivery-review` (6 dimensions) instead of old `code-quality-audit` + `test-quality-audit` pair. Legacy audit skills marked as superseded.

**Delivery Review Skill Suite — plugin v1.21.0 (session: ee147e0c):**

6 review lenses extracted + orchestrator following doc-review pattern:

- 6 review lenses built
- Orchestrator following doc-review pattern

**UX Review Orchestrator — plugin v1.20.0 (session: 1d3935b6):**

Built `appydave:ux-review` orchestrator for 14 design skills in 5 tiers:

- Normalized finding format: `UX-T{tier}-{CODE}-NNN` with 42 classifications
- Tier definitions with provenance (Anthropic's `frontend-design` + Impeccable skills)

---

### Brains — Dark Factories + Brain Librarian (Mar 27–28)

**Dark Factories Brain Curation (session 970d0ef0):**

6 parallel research agents covered:

1. **Trycycle pattern** (Dan Shapiro, March 2026) — iterative loop at heart of autonomous coding workflows; CEO of Glowforge; three parallel attempts, winner survives tests
2. **Attractor repo** (StrongDM, 1002 stars, Apache-2.0, created 2026-02-05) — spec-only repo; no implementation, just a standard/protocol for dark factory workflows
3. **Holdout validation** — end-to-end "user stories" stored outside the codebase so the coding agent cannot see them (prevents overfitting to known tests)
4. **OctopusGarden** (foundatron, Go) — autonomous software dev system: provide specs + test scenarios, it orchestrates agents
5. CXDB and ecosystem tooling
6. Trycycle + darkfactory.dev combination

Important correction: the 100K-line compiler was Anthropic's project, not StrongDM's. 4 new brain files created. `brains/anthropic-claude/INDEX.md` updated (113 → 117 files).

**Brain Librarian — Tag Extraction Benchmark (Mar 28, sessions 4c883255, a12136c9, 78ee4e0e, 06712468):**

Multi-session work:

- **BMAD-Method health check** — 18 broken links fixed
- **5 providers kept**: Gemini (discovery), Codex (validation), Qwen 14B local (free validation), Mistral-Nemo (fast API), Haiku (entities/summaries)
- **5 providers dropped**: Qwen 7B (undisciplined), Mistral-Small 24B (slow), 3 OpenRouter free models
- **Tag ontology refactor** — 8 tag promotions applied, brain-librarian skill updated to v1.3.0
- Cross-session handover pattern used: saved to `/tmp/handover-ontology-refactor.md`, resumed in next window

Also in this cluster:

- **Agent OS template repo** created at `~/dev/ad/agent-os/agent-os-template/` with 29 files
- **Rename audit**: ~35 files across 10 locations needed updating for `agent-os` → `agentic-os`

---

### Other Projects

**FliHub Mar 30 (Two large sessions: 9c3c681e + 9c8be142):**

Session 9c3c681e (9.3MB): Relay/sync system redesign + video player code review. Starting issue: Jan's git problem — `edit-1st/` directories showing as dirty. Root cause: `.gitignore` missing entries + `!**/*.json` rule actively un-ignoring `.flihub-state.json`. Major work: fixed gitignore, deep code review of three video players (found ~90% clones with triplicated speed state/effects/handlers), extracted shared video infrastructure, fixed buggy local `formatDuration`, added space-to-pause keyboard shortcut, standardized speed presets, added Relay video preview capability. Ended with 4 A/B/C/D refined project list mockups.

Session 9c8be142 (6MB): Project list mockup review + visual polish pass. Committed and pushed. Next priorities: Feedback loop (PRD Part 5) using real project data, real-data edge cases.

Note: Both sessions are large but driven by dense assistant responses with detailed code, not Playwright screenshot inflation.

**AppyStack Mar 29 (session 5ea96e77):**

- Deep research into multi-machine sync patterns across projects
- Four actor model analyzed: David (CLI-native), Jan (Editor, Dropbox), Other Macs (auto-detect/pull), Angela
- `--dangerously-skip-permissions` bug in subagents documented (not fixed)
- Recipe cleanup: removed all personal names and client references from AppyStack recipe files for public release
- `app-idea` skill created and published to AppyStack template (v0.4.11)

**Lars Agent OS Onboarding (session 8410f099):**

Prepared Lars onboarding transcript for NotebookLM — 5-slide prompt about the horizontal infrastructure layer (Syncthing, Dropbox, Tailscale, Ansible, Second Brain) and vertical capability stack (BMAD Agents, AWB, AngelEye, Paperclip). Suggests David was preparing to bring Lars into the Agent OS / Paperclip ecosystem.

**OMI Tag Extraction (session 4a2dc705):**

Ran new OMI extraction schema on 50 most recent files in `~/dev/raw-intake/omi/`. Key feedback received: future sessions should create skills in the AppyDave plugin source, not as personal skills.

---

## Cross-Project Patterns Mar 26–Apr 6

**1. Paperclip adoption was the defining event of this window.** The entire Mar 27–31 period was shaped by Paperclip onboarding. David went from "what is Paperclip?" to running a real multi-agent company (ANG project) with CEO, CTO, and Spec Writer agents doing actual spec work on AngelEye. The heartbeat misconfiguration (no `heartbeatIntervalMs`) was the main friction point.

**2. Handover-driven parallel work.** Nearly every project used the `/tmp/handover-*.md` pattern to split work across sessions. Multiple handovers created in one session, executed in parallel from separate windows.

**3. Dark factories as emerging knowledge domain.** The "dark factory" paradigm (autonomous agents writing code in isolation; holdout validation; Trycycle pattern) was actively researched and curated. Paperclip adoption + dark factory patterns suggests David is moving toward fully autonomous agent pipelines.

**4. Plugin architecture matured significantly.** Mar 29 was a major plugin evolution day: Ralphy v2.0.0 (breaking change), delivery-review suite (6 lenses replacing 2-lens system), UX review orchestrator (5-tier, 42 classifications). Plugin version v1.18 → v1.21.0 in a single day.

**5. FliHub's relay system shows cross-project complexity.** The FliHub relay/sync session touched Signal Studio, AngelEye, and AppyStack. The four-actor model and mix of git/Syncthing/Dropbox patterns shows this system is not yet unified.

**6. AppyStack approaching public release.** Recipe files cleaned of personal names and client references (Joy, Lars, Angela, Signal Studio, AngelEye, FliHub, NDIS). `app-idea` skill published in template.

---

## Additional AngelEye Implications

The following implications extend or complement those in the first-pass doc (bmad-deep-analysis-2026-04-09.md).

### Paperclip Session Path Detection

Paperclip sessions have a distinctive session path encoding that AngelEye needs to recognize:

- **Workspace sessions**: `paperclip-instances-default-workspaces-<agent-uuid>` — heartbeat-based agent work sessions. These are NOT developer work sessions; they're autonomous agent heartbeats.
- **Project sessions**: `paperclip-instances-default-projects-<company-uuid>-<project-uuid>--default` — task-level work within a Paperclip company.
- **Classification**: These should be `project: paperclip`, `role: ceo|cto|spec-writer|...`, `pattern: heartbeat`. The BMAD station routing logic does NOT apply.

### Heartbeat Sessions as a Distinct Pattern

Paperclip heartbeat sessions are structurally unlike any BMAD session:

- Very short (agent wakes, reads API, does work, exits)
- Session ID is reused across heartbeats (Claude session ID persisted by Paperclip)
- The agent's "memory" lives in the Paperclip API, not in the JSONL compaction summary
- No custom-title agent-name field expected — naming comes from the Paperclip workspace UUID

AngelEye enrichment should detect these by project-path pattern and skip BMAD station inference entirely.

### Mar 26–Apr 6 BMAD Workflow Events — Timing Note

The Overwatch evolution across Mar 26–Apr 1 demonstrates that doc-trimming and rule updates (54% trim, paste-ready rule) are permanent skill modifications that show up as edits to skill files, not as JSONL entries. AngelEye cannot detect these changes from session analysis alone — they require git diff on the `.claude/skills/bmad-oversight/` directory.

### Troubled Cycle Detection

Story 6.5's 3-day troubled cycle (Apr 2–5) had a recognizable signature:

- Same story ID appearing across multiple days in DR station
- Amelia sessions on the same story ID after a Nate FAIL
- Session count for a single story disproportionately high (9+ sessions vs typical 5–6)

AngelEye enrichment should flag stories where `session_count > 7` or `nate_instances > 1` as troubled cycles, and compute a `backward_loops` metric from the station sequence.

### The `bmad-relay` Non-Existence Signal

As of Apr 6, `/bmad-relay` is a design artifact only (`_bmad-output/planning-artifacts/bmad-relay-design.md`). Any session appearing to invoke `bmad-relay` is David testing the concept, not a production workflow station. AngelEye should tag these sessions as `experimental: true` and `station: RELAY_PROTOTYPE` rather than mapping them to a production station.

### Archon as Alternative Execution Path

Archon YAML (`archon/workflows/bmad-story-lifecycle.yaml`) is a separate execution path from the skill reference files. When Archon runs a BMAD lifecycle, session paths may encode under an `archon` project rather than the SS project. The Apr 6 Archon background task (session df8b1b65) showed that Archon executes Bob CS/VS but may terminate at triage-validation nodes — AngelEye should not assume lifecycle completion when seeing an Archon-originated session.

### Plugin Version as a Cross-Session Signal

The Mar 29 plugin evolution (v1.18 → v1.21.0) was entirely in AppyDave plugins sessions, not SS sessions. AngelEye's enrichment of SS sessions for that day should not attempt to infer plugin version from SS session content. Plugin version is a separate data axis that requires querying the plugins repo git log.

### OMI Skill Placement Lesson

The OMI tag extraction work (session 4a2dc705) produced an explicit feedback signal: skills should be created in the AppyDave plugin source, not as personal skills. This is relevant for AngelEye's own skill design — any AngelEye ingestion or enrichment skills should live in the plugin, not as ad-hoc personal skills in `~/.claude/skills/`.

### Dark Factories — Holdout Validation as an AngelEye Test Pattern

The "holdout validation" concept from the dark factories research (test scenarios stored outside the codebase, invisible to the coding agent) is directly applicable to AngelEye's own development. AngelEye could use holdout validation to test enrichment accuracy: store ground-truth station labels for a set of sessions outside the enrichment pipeline, then evaluate the enricher against them without the enricher having access to the ground truth during training.

### Compaction Shard Competition

The Q1/Q2 compaction shard competition (aside_question-7e362ae4 and aside_question-9cb4dfa) is a concrete case of the same work being started twice. AngelEye should detect when two aside_question shards share the same parent session ID and compacted summary — this indicates shard competition, and only the shard with more tool calls is the "winner." The partial shard should be annotated as `shard_superseded: true`.
