# BMAD Deep Analysis — 2026-04-09

**Source**: 7-agent parallel analysis of ~100 Claude Code sessions (Apr 7–9 2026)
**Method**: Direct JSONL extraction — custom-title, trigger commands, conversation content, tool results
**Sessions covered**: ~80 SupportSignal BMAD sessions + ~20 non-SS sessions across AWB, FliHub, AppyRadar, AngelEye, Brains, Lars, AppyDave tools

---

## Sprint Reconstruction — Stories Worked (Apr 7–9)

### Story 0.13 — Epic 6 Post-Sprint Cleanup — SHIPPED

**Date**: Apr 7, ~06:19–07:24 UTC
**Agents**: Amelia DS → Nate DR → Taylor CS+RA → Lisa CU → Ship
**Duration**: ~65 minutes end-to-end

**What was delivered**:

- `formatTimestamp` extracted to `lib/utils/format-timestamp.ts` — removed 3 local copies
- Display maps extracted to `lib/utils/display-maps.ts` — removed 6 local copies
- EmptyState filter/no-data distinction added to incidents, participants, sites list clients
- `SemanticBadge` adopted in `health-conditions-section.tsx`
- 5 display-map labels capitalized (e.g., "Flexible" not "flexible")
- Test count: ~1190 → **1217 tests passing** (27 net new)

**Notable events**:

- Amelia hit a Radix mock failure mid-session (`Label` missing from mock) — self-corrected using `importOriginal` Vitest pattern without escalating. Pattern later captured by Lisa as KDD `radix-partial-mock-import-original-kdd.md`.
- Taylor ran CS then RA in the same session (combined) without returning to orchestrator between stations — efficient for small stories.
- Lisa flagged process/ KDD folder at 22 files (threshold=20) — deferred, first of what became multiple deferrals.
- Ship commit: `84ebded` (code) + `0adee38` (Lisa artifacts), CI run #24069454718 green in 3m7s.

---

### Story 7.1 — Test Plan Synthesis — SHIPPED

**Date**: Apr 7, ~07:24–11:40 UTC
**Agents**: Bob CS → Bob VS (Opus) → Amelia DS → Nate DR → Taylor CS → Taylor RA → Lisa CU → Ship
**Duration**: ~4 hours 16 minutes wall time

**What was delivered**:

- `_bmad-output/planning-artifacts/master-test-matrix.md` — 205 entries across 27 routes (31 UAT, 106 E2E-automatable, 68 code-inspection-only), every entry with source story ID
- `_bmad-output/planning-artifacts/security-test-checklist.md` — 16 auth gaps, 6 KDD entries
- 38 completed stories synthesised, 27 routes enumerated from route map
- Commit `ffe9987` — 9 files, 1106 insertions, CI green in 3m6s

**Notable events**:

- Amelia DS used parallel sub-agents to read all 38 story files simultaneously (split by epic) — first observed use of this enumeration pattern.
- David asked mid-session: "If we're only doing Markdown, what does Taylor need to test?" — Orchestrator acknowledged as valid process feedback and saved it, but let Taylor complete since already running.
- Bob VS on Opus validated that all 41 story paths exist at expected locations.
- Human gates: after Bob VS (David said "proceed"), and SHIP gate.
- Taylor RA found AT-2 discrepancy: SAT said 27 routes, found 23 — explained as grouping (7+10+6=23 distinct groups), logged but not failed.
- process/ KDD folder flagged again at 22 files — deferred again (second deferral this sprint).

---

### Story 7.2 — UI UAT Pass — SHIPPED

**Date**: Apr 7, ~11:42–12:36 UTC
**Agents**: Bob CS → Bob VS (Opus) → Amelia DS (18MB Playwright session) → Nate DR → Lisa CU → Ship
**Duration**: ~54 minutes for main lifecycle, then 0.15 rolled immediately

**What was delivered**:

- 31-entry systematic Playwright UAT pass across 10 routes + 9 cross-cutting concerns
- Results: 24 PASS, 6 PARTIAL PASS (data-constraint), 1 FAIL
- FAIL = Entry #61 (participant search — genuine regression from Story 6.9 filter migration)
- PARTIAL PASSes all data-constraint blocked (sparse dev DB) — accepted per existing KDD
- Full UAT report created: `_bmad-output/planning-artifacts/uat-report-2026.md`
- Failure brief created: `_bmad-output/implementation-artifacts/briefs/0-14-participant-search-missing-brief.md`
- Commit `224e2be`, CI run green 3m10s

**Notable events**:

- The 18MB session (`8a89cd15`) — 362 lines total, entirely driven by 14 embedded Playwright base64 screenshots (~8.5MB) + accumulated DOM snapshots. This is the clearest documented case of the Playwright size problem.
- Amelia's outbound summary said 20 Pass / 10 Partial. Nate noticed the discrepancy. Lisa corrected to 24/6. Quality chain working correctly.
- Bob VS on Opus caught a login route test ordering issue (Task 3 tested /login _after_ Task 2 logged in — would redirect away from /login). Real bug, would have caused confusing Amelia results.
- Taylor station skipped (zero source code changes — UAT-only story).
- After ship, Orchestrator recommended Story 0.15 before 7.3 (seed data first, then E2E). David agreed.

---

### Story 0.14 — Participant Search Restore — SHIPPED

**Date**: Apr 7, ~13:24–13:47 UTC
**Orchestrator**: Overwatch (e9efd76b) — inline mode, auto-proceeded all gates
**Agents**: Bob CS → Amelia DS → Nate DR → Lisa CU → Ship
**Duration**: 23 minutes 30 seconds end-to-end (entire lifecycle)

**What was delivered**:

- `searchTerm` + `debouncedTerm` (300ms) state added to `participants-list-client.tsx`
- Search input inline with Company/Site filter dropdowns
- Search-aware EmptyState ("No participants match your search")
- 6 new search tests added with fake timers pattern
- Lucide `Search` mock gap self-corrected by Amelia (out of scope, but correct)
- 1222 tests passing. Commits `b8150f8` (implementation) + `e438163` (Lisa CU), CI run #24084649524 green 3m5s

**Notable events**:

- Root cause: Story 6.9 filter migration silently dropped the search input added in Story 5.3. Classic Epic 6 regression.
- Overwatch ran Epic 0 ceremony: skipped Bob VS (standing rule), skipped Taylor SAT (Nate clean PASS), auto-proceeded all intermediate gates. Only SHIP required human approval.
- Human gate only at SHIP — 4-agent pipeline in 23 minutes. Fastest complete lifecycle this sprint.
- Overwatch self-maintenance ran between Lisa completion and ship gate: doctrine scan, added lucide-react mock note to Bob build phase rules.
- Amelia DS (e36ca6e4) was 3MB — caused by 2 Playwright screenshots embedded in tool results during browser verification. Confirmed again: screenshots drive file size, not session length.

---

### Story 0.15 — Dev Seed Data Enrichment — SHIPPED

**Date**: Apr 7, ~12:44–13:23 UTC (Note: ran before 0.14 in actual time)
**Agents**: Bob CS → Amelia DS → Nate DR → Lisa CU
**Duration**: ~39 minutes

**What was delivered**:

- `scripts/seed-dev-data.ts` — standalone seed script using postgres driver, deterministic UUIDs, `ON CONFLICT DO NOTHING` for idempotency
- Seeded incidents with severity diversity, populated optional participant fields
- Fixed the root cause of all 6 PARTIAL PASSes in Story 7.2 UAT
- KDDs: `seed-script-idempotency-pattern-kdd.md`, `dev-data-id-divergence-runtime-audit-kdd.md`; resolved existing stub `dev-data-constraint-browser-verification-kdd.md`

**Notable events**:

- Amelia made 12+ direct `mcp__supabase__execute_sql` queries to the live dev DB — real audit of row counts, FK relationships, and idempotency verification.
- Nate recommended skipping Taylor SAT (seed script only, no application source code changes).
- Lisa marked `dev-data-constraint-browser-verification` KDD as RESOLVED — the recurring partial-pass problem is now fixed at the root.
- `dev-data-constraint` KDD recurrence bumped to 3 across stories 7.2 → 0.15 → final closure.
- Note: No Overwatch session for 0.15 in batches analyzed. The pipeline was orchestrated but the orchestrator session precedes the batch window or ran in a separate session.

---

### Story 0.16 — KDD Folder Reorganisation — ABORTED

**Date**: Apr 7, ~13:48–14:02 UTC
**Status**: Story returned to backlog. No code changes.

**What happened**:

- Overwatch launched for 0.16 (`kdd-folder-reorganisation`)
- Overwatch tried to spawn Bob CS via `npx claude --dangerously-skip-permissions` — spawned a nested Claude CLI process instead of a proper sub-agent
- David noticed: "Why does Bob have this running?"
- Overwatch then tried to fix by invoking `/bmad-sm CS 0.16` via Skill tool in its own context — turning itself into Bob instead of spawning a new agent
- David interrupted: "Why would you be running the BMAD SM skill here in your context? You're meant to be orchestrating other agents. This is broken."

**Root cause**: `bmad-story-lifecycle` skill had a fallback: "when in doubt: assume in-context mode." In in-context mode it correctly uses Skill tool calls. But it was running in tmux (where it should spawn background sub-agents), and the detection logic failed — defaulted to in-context behavior incorrectly.

**Resolution**: David: "Document the problem and update your own skill set so we don't see it again, then restart."

- Overwatch updated `bmad-story-lifecycle/SKILL.md` with mandatory environment detection step
- Added explicit in-context execution table: sequential Skill tool calls only
- Hard prohibition on TeamCreate, Agent tool, and `npx claude` in non-tmux context
- Wrote memory file `feedback_bmad_lifecycle_in_context_mode.md`
- Story 0.16 status: still `backlog`. Restart attempted in subsequent session.

**Bob CS ghost session**: A Bob CS session (`aab38c17`) was spawned incorrectly via nested CLI. Bob then tried to use `npx claude` again — same bug propagating. David killed it with `{"summary": "Stop — wrong approach, shutting down"}` via teammate message after 4+ minutes of stuck execution. The bug was baked into two levels of the orchestration stack simultaneously.

**Current status**: KDD directories at 23 files (process/) and 20+ files (testing/) — both over the VAL-003 threshold of 20. Story 0.16 deferred, remains a known maintenance item.

---

### Story 7.3 — E2E Suite Build — SHIPPED (after extended repair loop)

**Date**: Apr 7 14:03 → Apr 8 05:10 UTC (approximately 15 hours wall time)
**Primary orchestrator session**: `da39bfcd` (15.5 hours, 314 lines)
**Completion session**: `a572f298` (02:33–05:10 UTC, inline Taylor + Lisa + Ship)

**Lifecycle reconstruction**:

```
Apr 7 14:03  Overwatch starts (da39bfcd)
             → detects Story 7.3 as next in Epic 7
             → Amelia built 33 specs; Bob CS already done (pre-batch)

14:03–14:17  Orchestrator: env detection bug surfaces
             → David points out in-context/tmux confusion in SKILL
             → Overwatch identifies structural bug, patches skill file live
             → David: "Why is it a memory fix?" → "Memory fucking changes."
             → Overwatch does structural fix instead (removes "when in doubt" fallback)

14:17–14:20  Bob VS (87175f62, background sub-agent, Opus)
             → 3 criticals + 3 enhancements fixed in story file
             → C1: Missing .gitignore entries for Playwright artifacts
             → C2: Missing loginAsSupportWorker fixture
             → C3: No task for .gitignore update
             → Human gate: David reads for 65 minutes, then approves

15:27–15:35  Amelia DS (1f2f1dba, background sub-agent)
             → Playwright installed from zero, chromium downloaded
             → 33 E2E specs across 7 files created
             → Support-worker user created in Supabase via SQL (was missing)
             → CI triple: lint ✓ test 1222 ✓ build ✓
             → Task 8 (Quinn augmentation) marked pending

             Orchestrator decision gate: run Quinn or go straight to Nate?
             → David chose Quinn: "regression safety net for Epic 3"

15:42–15:47  Quinn QA coverage review (ee0518eb)
             → Mapped 33 specs against 106 E2E-automatable entries
             → 81 of 106 uncovered; 8 HIGH/CRITICAL gaps identified
             → Created users.spec.ts (admin RBAC, security-critical)
             → Added 17 specs to existing files
             → 33 → 50 specs total

15:48–15:57  Nate DR (645695cb) — CONDITIONAL PASS
             → P1 (HIGH): incidents test #127 clicks Continue with empty localStorage
               (fresh Playwright context = no wizard pre-fill → disabled button)
             → P2 (MEDIUM): afterEach cleans [E2E] TestParticipant but delete creates [E2E] DeleteTest
             → P3 (LOW): Task 8.x checkboxes unmarked despite Quinn completion

~23:00       [Gap: corrupted session — Amelia took over orchestration position]

23:06–23:10  Amelia fix-1 (6ee117ce, 3 min 12 sec)
             → P1: added page.evaluate() to pre-seed localStorage wizard draft
             → P2: unified to E2E_PARTICIPANT_FULL constant
             → P3: Task 8 checkboxes all [x]
             → CI clean

23:10–23:12  Nate-2 re-review (12c6d80a, 1 min 34 sec — fastest session in batch)
             → Spot-verified P1/P2/P3 in place
             → PASS — automated handoff to Taylor at 23:12:06 (11-second gap)

23:12–23:55  Taylor SAT (4b1062df, 43 min)
             → 7 autopilot checks: all PASS
             → Live E2E run: 24/50 PASS, 26/50 FAIL
             → 7 failure categories documented
             → CONDITIONAL FAIL — AC2 (≥45/50) not met

00:36–01:23  Amelia fix-2 (53cabf62, 47 min)
             → Fixed all 7 Taylor-identified selector issues
             → Extra fixes: localStorage.clear() → removeItem() (was nuking Supabase auth)
             → role="dialog" → role="alertdialog" global replace
             → Deleted 10 orphaned [E2E] TestParticipant + 10 [E2E] Test Site from DB
             → 41 → 45 → 47/50 (target ≥45 met)
             → 3 failures remain (tests 34, 36, 38)

01:27–02:15  Amelia fix-3 (23af8796, 47 min, INCOMPLETE AT SESSION BOUNDARY)
             → Fix participant save navigation bug (root: router.refresh() Next.js 16 behavior)
             → Added aria-label="Edit" to all 6 sub-entity pencil icon buttons (WCAG 2.1 AA)
             → Tests #36 and #38 resolved
             → Test #34: form not submitting — active debugging cut off (session terminated)

02:17–02:29  Recovery/assessment session (a43daa3b)
             → David: "Amelia kind of took over the orchestration position, everything was stuck"
             → Overwatch explains tmux architecture limitation for spawning sub-agents
             → David frustrated. Session ends with instructions for new tmux session.

02:33–05:10  Completion session (a572f298, inline mode)
             → Taylor RA run inline: 49/50 immediately (one remaining in participants.spec.ts:124)
             → Root cause found: NDIS seed data bug — "4312345678" is 10 digits
               (NDIS requires exactly 9 digits starting with 4)
             → Seed fixed to "431234567", DB updated
             → Playwright assertion fixed: used success message → Edit button return signal
             → 50/50 E2E specs passing
             → Lisa CU inline: 6 new KDD learnings, total 168
             → Ship: commit bc3fe1b — 35 files, 3897 insertions, CI green
             → UAT runner built (tools/uat-runner.html → public/uat-runner.html)
             → Credentials page added (16 users across 4 companies)
```

**Final outcome**: SHIPPED. 50/50 E2E specs passing. CI green. UAT runner live at `https://app.supportsignal.com.au/uat-runner.html`.

---

### Story 7.4 — Security Audit Pass — SHIPPED

**Date**: Apr 8, ~06:06–08:08 UTC
**Duration**: ~2 hours from CS to done (5 sessions, all first-pass PASS)
**Notable**: Fastest complete story lifecycle. Zero backtracks.

**Lifecycle**:

```
06:06–06:11  Bob CS (75d4d379)
             → Created 7-4-security-audit-pass.md with 4 ACs, 10 tasks
             → Classified: doc-only, Taylor SAT skip pre-decided
             → 8 KDD references, dev credentials included

07:31–07:34  Bob VS (9ae18265, Opus)
             → Verified 12 referenced source files exist
             → Ran grep checks against codebase
             → Found 1 real error: draft-sync.ts misattributed as localStorage consumer
             → Applied correction. PASS.

07:37–08:02  Amelia DS (24e09d05) — Playwright headed browser for auth testing
             → K1-K6 code inspections: all Mitigated
             → Gap 1: Password "password" accepted (6-char Supabase min only) — Verified Exploitable
             → Gap 2: 15 rapid logins, all HTTP 200, no 429 — Verified Exploitable
             → Gap 3-5: No idle timeout, no MFA, no change password — all Verified Exploitable
             → Gap 6-8: No profile/account routes, users read-only — Verified Exploitable
             → Gap 9-14: Theoretical (sessions, email change, OAuth, audit trail, devices)
             → Gap 15: /sign-up open to anyone, no invite code — Verified Exploitable
             → Gap 16: Reclassified Mitigated (Framework) — Next.js server actions = implicit CSRF
             → RLS cross-tenant: all 14 entity tables have isolation policies; fake UUID → 404
             → 7 story stubs created (P1-P4 priority), security-audit-report-2026.md created
             → Test account created: secaudit-test-7891@testmail.com (side effect, noted)
             → 22 items verified: 10 Exploitable, 5 Theoretical, 7 Mitigated

08:02–08:05  Nate DR (39cd13cf, 3 min)
             → Pre-review: lint ✓ 1222 tests ✓ build ✓
             → All 4 ACs: PASS
             → 3 KDD candidates identified
             → PASS — no patches

08:05–08:08  Lisa CU (a4cd4275, 3 min)
             → 3 new KDDs: supabase-password-min-length-only, supabase-ssr-cookie-not-httponly,
               supabase-getclaims-auto-refresh
             → KDD count: 168 → 171; Security category: 2 → 5
             → Story 7.4 closed. Epic 7 closed. All 4 stories done.
```

**Why this worked cleanly**: Pure verification/documentation story with no source code changes. Amelia used Playwright headed browser for interactive auth verification — right tool for the job, pre-planned in story file. Taylor skipped correctly (doc-only). Nate and Lisa both had 3 minutes of work. The story itself was well-scoped.

---

## Orchestration Patterns Observed

### Overwatch Lifecycle Management

Overwatch runs as the `bmad-story-lifecycle` skill, invoked by David as `/appydave:bmad-story-lifecycle`. It is the meta-orchestrator — it:

1. Runs a boot/freshness protocol (5 checks: repo inventory, Supabase/Vercel stability, planning files, satellite drift, BMAD config present)
2. Reads sprint-status.yaml and auto-resolves the current story if none specified
3. Spawns specialist agents sequentially (or in background tmux sub-agents in tmux mode)
4. Manages human gates — decides autonomously which gates to hold vs auto-proceed
5. Runs self-maintenance between Lisa CU completion and the SHIP gate
6. Waits for David's SHIP approval, then commits/pushes/monitors CI

**Session longevity**: The Story 7.3 orchestrator session ran for approximately 15.5 hours of wall time (`da39bfcd`: 14:03 to next-day ~01:27+ UTC). This is normal — Overwatch sessions stay alive across the entire story lifecycle. Context doesn't compact or expire; it accumulates the full history of the story's lifecycle.

**In-context vs tmux mode**: This is the key operational distinction. In tmux mode, Overwatch can spawn background sub-agents via TeamCreate/AgentTool/npx — these appear as separate JSONL files. In in-context mode (conversation running directly), it must use sequential Skill tool calls within its own context. The Story 0.16 abort was caused by getting this wrong.

**Epic-level ceremony rules** (observed in practice):

- Epic 0 stories: Bob VS skipped, Taylor SAT skipped, auto-proceed all intermediate gates, only SHIP requires human
- Epic 7 stories: Full ceremony. Taylor skipped only for doc-only/QA-only stories. Quinn added as pre-DR gate when story involves test coverage.
- All stories: Bob VS on Opus model (higher capability for validation tasks)

---

### Self-Healing Behaviors

**Self-Correction #1 — Agent Idle Rule** (session `b710fa33`, Apr 6)

Overwatch had been auto-spawning agents after idle periods without checking with David first. David complained explicitly. Overwatch gave verdict: "Process failure — should surface to human first."

Files patched in a 4-file refactor:

1. `bmad-oversight-role.md` — removed 3 stale sections, added Self-Maintenance Protocol, extracted AC contradiction lesson as Consistency Check #7
2. `orchestrator-prompt.md` — added Agent Idle Rule (surface to human before re-spawning), 4-step startup sequence
3. `command-sequence.md` — added Step 5.5 (Overwatch self-maintenance between Lisa CU and ship gate)
4. `SKILL.md` — updated Overwatch description in workflow summary

**Self-Correction #2 — Env Detection Bug** (session `da39bfcd`, Apr 7)

The `bmad-story-lifecycle` skill had line 65: "when in doubt: assume in-context mode" — a heuristic that caused it to run agents inline when it should have been spawning tmux sub-agents.

David's challenge: "What's broken in your instructions?" → "Why is it a memory fix? Why? Memory fucking changes."

Overwatch identified the structural bug, removed the ambiguous fallback, and replaced with explicit detection:

- Check `$TMUX` env var
- Check `AGENT_TEAMS=1` env var
- Only if both present: tmux sub-agent spawning
- Otherwise: sequential Skill tool calls in-context

Fix written into the skill file itself, not memory. This happened mid-session `da39bfcd` before Story 7.3 development started.

---

### Human Gate Mechanics

**When gates fire (observed)**:

- After Bob VS if CONDITIONAL PASS (always) — David must approve patches
- After Bob VS on PASS for some stories — David reviews before proceeding to Amelia
- SHIP gate (always) — David must explicitly approve commit and push
- When Overwatch surfaces a routing decision (e.g., run Quinn or go straight to Nate?)
- When a CONDITIONAL FAIL comes back from Taylor — David decides scope of fix

**When gates are bypassed**:

- Epic 0 ceremony: all intermediate gates auto-proceed
- Clean Nate PASS after CONDITIONAL PASS repair: auto-proceed (Nate-2 case in Story 7.3)
- Taylor skip for doc-only stories: auto-proceed to Lisa
- Clean Bob VS PASS: sometimes auto-proceed (Story 7.1), sometimes held (Story 7.2)

**Story 0.11 stuck case**: As of Apr 6, Story 0.11 (`emergency-oom-fix`) was in human-gate limbo — technically in-progress but waiting for David to confirm webpack-mode fix stability before closing. Known inconsistency. David had not resolved it within the batch window.

**Gate timing**:

- Automated handoffs (agent → agent): 11–15 seconds (Nate-2 → Taylor in Story 7.3: 11 sec)
- Manual review holds: 4+ minutes minimum (Amelia fix-2 → fix-3: 4 min)
- David reading Bob VS before approval: 65 minutes (Story 7.3)
- David's SHIP approval: conversational, immediate (Story 0.14: same session)

---

### Parallel vs Sequential — The mtime Problem

**The key finding**: All apparent "parallel runs" observed in this analysis were macOS mtime artifacts. The file mtime reflects when macOS flushed the extended attribute or wrote the file index entry — NOT when the session started. This was confirmed three times:

**Case 1 (Batch C)**: Six Story 7.3 repair sessions appeared to share an "Apr 8 09:16" mtime cluster, implying simultaneous execution. Actual JSONL timestamps showed a 10.5-hour sequential window (Apr 7 15:42 → Apr 8 02:15 UTC). The sessions were a tightly-choreographed sequential repair loop.

**Case 2 (Batch D)**: Four Story 0.14 sessions appeared in a "20:48 mtime cluster." Actual embedded timestamps showed a sequential 23-minute pipeline (13:24–13:47 UTC). The cluster was because all 4 sessions completed before the mtime was written.

**Case 3 (Batch F)**: Story 7.1 satellite sessions (Bob CS through Ship) showed an "18:40 cluster" in the batch indexer. Actual session start times spanned 07:24–11:40 UTC — a 4-hour sequential window. The clustering was a timezone mismatch in the indexer (UTC vs AEST+10) compounded by mtime flushing.

**Fix required**: AngelEye must extract session start time from the first entry inside the JSONL file, specifically the timestamp in the first `user` or `assistant` entry. Do not use filesystem mtime for anything timing-related.

---

## Critical Bugs Found in the Wild

### Bug 1: Archon YAML Out of Sync with Skill Reference Files

**Observed in**: Session `b710fa33` (Apr 6 Overwatch self-refactor)

The bmad-story-lifecycle skill reference files (`orchestrator-prompt.md`, `command-sequence.md`, `SKILL.md`) were updated during Overwatch's self-refactor. However, `.archon/workflows/bmad-story-lifecycle.yaml` was NOT updated — it's a separate execution path (Archon YAML graph nodes vs skill reference files).

David started asking about this at the end of the session but the message was cut off. Whether this was followed up is unknown.

**Impact**: Two execution paths — Archon YAML and skill reference files — are now out of sync. Any behavior governed by the YAML that was also updated in the skill files may diverge.

---

### Bug 2: bmad-story-lifecycle In-Context/tmux Detection

**Observed in**: Sessions `da39bfcd` (Story 7.3) and `3043a9dd` (Story 0.16)

Described above. Root cause: line 65 "when in doubt: assume in-context mode." This caused Overwatch to use inline Skill tool calls when it was actually in a tmux context capable of spawning background sub-agents, and vice versa.

**Fixed live**: Removed the ambiguous fallback. Added explicit `$TMUX` + `AGENT_TEAMS` env var detection.

---

### Bug 3: Agent Idle Rule — Auto-Spawning Without Human Gate

**Observed in**: Session `b710fa33` (Apr 6)

Orchestrator was auto-spawning a fresh Nate after idle without asking David. David described this as a process failure. Overwatch agreed and added the Agent Idle Rule: "Surface to human first before re-spawning any agent."

**Fixed live**: Added to `orchestrator-prompt.md`.

---

### Bug 4: NDIS Seed Data — 10-Digit Number Failing Zod Validation

**Observed in**: Session `a572f298` (Story 7.3 completion)

Seed data had NDIS number `4312345678` — 10 digits. NDIS requires exactly 9 digits starting with 4. The value bypassed Supabase insert validation but failed Next.js form Zod validation on save, silently blocking all participant-edit E2E tests.

The idempotency guard in the seed script (`ON CONFLICT DO NOTHING` / only updates NULL values) prevented a simple re-run from fixing bad data — required a direct DB update.

**Fixed live**: Corrected to `431234567`. Overwatch also proposed adding Zod schema validation to `seed-dev-data.ts` before any insert — validate payload, throw loudly if invalid.

---

### Bug 5: localStorage.clear() Nuking Supabase Auth Token

**Observed in**: Session `53cabf62` (Amelia fix-2, Story 7.3)

Playwright E2E test for the incident wizard called `localStorage.clear()` before each test for isolation. This cleared the Supabase auth session token, causing all subsequent tests to fail with authentication errors — a cascade failure masking the real test results.

**Fixed live**: Changed to targeted `localStorage.removeItem('incident-wizard-draft')`. This removes only the wizard state, preserving the Supabase auth session.

**KDD created**: `playwright-fresh-context-localstorage-kdd.md`

---

### Bug 6: router.refresh() Next.js 16 Navigation Trap

**Observed in**: Session `23af8796` (Amelia fix-3, Story 7.3)

In Next.js 16 App Router, `router.refresh()` causes actual navigation to the previous route (in this case `/participants` list) rather than cache refresh. This is a behavioral change from earlier Next.js versions. Amelia added `router.refresh()` to fix the participant save navigation, which then:

1. Broke unit tests (mock didn't handle it)
2. Caused the E2E test to navigate away from the detail page

**Fixed live**: Removed `router.refresh()`. The participant save now correctly stays on detail page using the inline edit-toggle pattern (consistent with company/sites edit behavior).

---

## AngelEye Enrichment Implications

### Timestamp Extraction

**The problem**: Using filesystem mtime to determine session start time is wrong. macOS writes mtime at file close or attribute update time, not session start. In BMAD sessions, the file may be written hours after the session began. The discrepancy can be 4+ hours (Story 7.1: session started 07:24 UTC, mtime shows ~18:40 AEST cluster).

**What to use instead**: Extract the timestamp from the first entry inside the JSONL file. Look for the first `user` message entry — its `timestamp` field is the actual session start. The `requestId` in the first entry also serves as a stable anchor.

**Implementation note**: The first meaningful entry is typically a `user` message with type `human`. Skip any `system` preamble entries — they may have artificial timestamps.

---

### Playwright Session Detection

**The size signature**: Playwright sessions with screenshots can be identified by extremely high bytes-per-line ratio:

- Normal conversation: ~2-5KB per entry average
- Playwright with screenshots: ~100-200KB+ per entry average (base64 PNG)
- Story 7.2 Amelia DS: 362 lines, 18.9MB = ~52KB average per line

**Detection heuristic**:

- Entry type: `tool_result` with content type `image`
- Or: `tool_use` where `name` contains `browser_take_screenshot` or `browser_snapshot`
- Or: file size > 5MB with < 1000 lines (high bytes/line ratio)

**Skip strategy**: When parsing for conversation content, skip `tool_result` entries where content type is `image`. These contribute nothing to semantic analysis and dominate file size. For station detection, the `tool_use` entries (before the result) carry the intent signal.

**DOM snapshot handling**: `browser_snapshot` and `browser_evaluate` results can also be large (DOM JSON). These should be summarized or truncated rather than stored verbatim.

---

### Station Router Improvements

**Quinn role**: Quinn (`/bmad-bmm-qa-automate`) is a custom QA agent, not in the standard BMAD station roster. Quinn fires between Amelia DS and Nate DR — as a pre-DR coverage augmentation gate. This appears when the Orchestrator decides coverage gaps need addressing before review. Session names: `ee0518eb` (Story 7.3 Quinn session). AngelEye station router should classify this as `station: QUINN` or `station: QA_COVERAGE`.

**Scoped Amelia names**: When Overwatch dispatches multiple Amelia instances for a repair loop, it gives them scoped `agent-name` values: `amelia-fix-1`, `amelia-fix-2`, `amelia-fix-3`. These appear in the JSONL `agent-name` custom-title field. AngelEye should:

- Detect the `-fix-N` suffix pattern
- Group these as a repair loop on the same story
- Track the fix number as `repair_iteration: N`

**Scoped Nate names**: Same pattern — `nate-2` for focused re-verification sessions. Much shorter (90 seconds vs full DR). Should be classified as `station: NATE_REVERIFY` or tagged as `is_re_review: true`.

**Taylor skip signal**: When Taylor is skipped, the Overwatch session includes text like "Skip Taylor — doc-only story" or "Taylor SAT skipped (no source code changes)". The story's `is_entity_story` and `is_ui_story` flags in Bob CS output determine this. AngelEye should look for the skip signal in the orchestrator session and mark the story as `taylor_skipped: true` with the reason.

**Multi-instance agent pattern**: The Story 7.3 repair loop involved 3 Amelia instances + 2 Nate instances. AngelEye should track story-level agent instance counts: `amelia_instances: 3, nate_instances: 2` etc. High instance counts are a signal of repair depth.

---

### New Agent Identities to Add to Overlay

**Quinn** (`/bmad-bmm-qa-automate`)

- Role: Pre-DR QA coverage augmentation
- Position in chain: After Amelia DS, before Nate DR (optional, orchestrator decision)
- Files created: new spec files, additions to existing spec files
- Output: coverage gap report + augmented test suite
- Session identifier: `agent-name` field contains `quinn` or `bmad-bmm-qa-automate` in trigger

**Overwatch as meta-station**

- Currently the orchestrator role. Not a station in the delivery chain — it manages the chain.
- Should be classified as `role: orchestrator` not `role: agent`
- Sessions: long-running, many entries, contains all other agent trigger messages
- Key signal: contains `<teammate-message>` tool calls to other agents

**Bob VS vs Bob CS distinction**:

- `bob-cs`: Creates story file, updates sprint-status to ready-for-dev
- `bob-vs`: Validates story file against codebase, runs grep checks, uses Opus model
- AngelEye should distinguish these — both are `agent: bob` but `station: CS` vs `station: VS`

---

## KDD and Process Signals

**KDD folder threshold (VAL-003)**: process/ directory has been at or above 20 files since Story 0.13. Flagged by Lisa at:

- Story 0.13 CU: 22 files — deferred
- Story 7.1 CU: 22 files — deferred (second flag)
- Story 7.2 CU: 23 files — advisory flagged alongside testing/ directory

Story 0.16 was created to address this but aborted. Until 0.16 is completed, the KDD directories are unmaintained above threshold. AngelEye could surface this as a process health signal: "KDD directory VAL-003 threshold breached for 5+ consecutive stories."

**David's Taylor-skip question** (Story 7.1): David questioned whether Taylor's autopilot tests add value for pure documentation stories ("If we're only doing Markdown, what does Taylor need to test?"). The Orchestrator acknowledged this as valid process improvement feedback. This may result in a conditional SAT step for doc-only stories — a process change that would affect AngelEye's expected station sequence.

**Process improvements made this sprint**:

1. Agent Idle Rule added to orchestrator (no auto-respawn without human gate)
2. Env detection made structural (tmux vs in-context — explicit check, no heuristic)
3. Overwatch self-maintenance now wired into command-sequence.md (Step 5.5)
4. Seed script Zod validation proposed (not yet implemented)
5. localStorage.removeItem pattern captured as KDD

**Credit burning as deliberate strategy**: Two sessions this window (`399a54fc`, `de5ac1f0`) were explicitly structured to maximize parallel agent credit consumption before window reset. AngelEye should recognize this pattern — high parallelism spike before a predictable boundary is a credit optimization signal, not a workflow signal.
