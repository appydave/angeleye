# BMAD Session Inventory — SupportSignal v2

**Generated**: 2026-03-27 (v2 — expanded from original 2026-03-26 scan)
**Source**: Claude Code JSONL session transcripts
**Scan window**: 2026-03-10 to 2026-03-27 (~17 days)
**Primary project**: `~/.claude/projects/-Users-davidcruwys-dev-clients-supportsignal-app-supportsignal-com-au/`
**Secondary**: brains (`-Users-davidcruwys-dev-ad-brains`), v2-planning, signal-studio
**Companion doc**: [`bmad-session-boundaries.md`](bmad-session-boundaries.md) — start/end times, final outputs, test counts, commit hashes, DR verdicts

---

## Agent Roster

### Story Lifecycle Agents (the chain)

| Agent                   | Person     | Skill Command | Actions                                                                           |
| ----------------------- | ---------- | ------------- | --------------------------------------------------------------------------------- |
| Scrum Master            | **Bob**    | `/bmad-sm`    | WN (What's Next), CS (Create Story), VS (Validate Story), ER (Epic Retrospective) |
| Developer               | **Amelia** | `/bmad-dev`   | DS (Develop Story)                                                                |
| Delivery Reviewer       | **Nate**   | `/bmad-dr`    | DR (Delivery Review) — 7-dimension review                                         |
| Story Acceptance Tester | **Taylor** | `/bmad-sat`   | CS (Create Tests), RA (Run All / Autopilot), CU (Execute)                         |
| Librarian               | **Lisa**   | `/bmad-lib`   | CU (Curate KDD learnings)                                                         |
| Ship                    | —          | `/bmad-ship`  | Commit, push, watch CI                                                            |

### Planning Phase Agents (pre-build)

| Agent            | Person      | Skill Command       | Actions                                                                    |
| ---------------- | ----------- | ------------------- | -------------------------------------------------------------------------- |
| Product Manager  | **John**    | `/bmad-agent-pm`    | CP (Create PRD), VP (Validate PRD), CE (Create Epics), CC (Course Correct) |
| UX Designer      | **Sally**   | `/bmad-ux-designer` | CU (UX plan for architecture & implementation)                             |
| System Architect | **Winston** | `/bmad-architect`   | CA (Document technical decisions), IR (Integration Review)                 |

### Observer / Advisory Agents (outside the chain)

| Agent                 | Role                  | Skill Command             | Purpose                                                                     |
| --------------------- | --------------------- | ------------------------- | --------------------------------------------------------------------------- |
| Oversight / Overwatch | David's advisor       | `/bmad-oversight`         | Tracks sprint state, reviews agent output, generates paste-back corrections |
| Relay                 | Workflow orchestrator | (discussion sessions)     | Ensures agents run in correct sequence, generates paste-ready commands      |
| BMAD Advisor          | Method expert         | `/focus bmad-v6` (brains) | Researches BMAD v6 documentation, designs new agents                        |
| AngelEye              | Session analytics     | (this project)            | Observes and analyses session patterns                                      |

---

## Standard Story Chain

```
Bob WN → Bob CS → Bob VS → Amelia DS → Nate DR → Taylor CS → Taylor RA → Lisa CU → Ship
```

**Lightweight ceremony** (Epic 0): May skip VS, SAT, or both.
**Early stories** (1.1–1.3): Used older commands (`/bmad-create-story`, `/bmad-dev-story`, `/bmad-delivery-review`) — the chain stabilised from 1.4 onward.

---

## Phase 1: Planning (Pre-Build)

### John — Product Manager (PRD)

| #   | Step              | SID                    | Date                | Entries | Notes                                                                                                          |
| --- | ----------------- | ---------------------- | ------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| —   | PRD creation      | _predates scan window_ | Before 2026-03-10   | —       | Multiple sessions confirm PRD existed. David: "I've already built out the PRD using John, the product manager" |
| —   | Later refinement? | `dc3e550b`             | 2026-03-16 to 03-22 | —       | `/bmad-bmm-create-prd` invoked — may be a refinement pass                                                      |

### Sally — UX Designer

| #   | Step                     | SID                                    | Date             | Entries | Notes                                                                               |
| --- | ------------------------ | -------------------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------------- |
| 1   | Handover creation        | `95d99e79-806e-4b23-9aad-31862a0ca203` | 2026-03-18       | —       | Created handover with "three design capture reports" for Sally                      |
| 2   | UX Design (failed start) | `50cfaae9-3995-4284-ad92-1d90f0caec6b` | 2026-03-18 03:42 | 11      | `/bmad-ux-designer` — too short, likely restarted                                   |
| 3   | UX Design (main)         | `656018b4-0c07-48a7-b33c-d346f75956b7` | 2026-03-18 03:46 | —       | `/bmad-ux-designer` → `bmad-create-ux-design` called twice. Produced `ux-design.md` |

### Winston — System Architect

| #   | Step                | SID                                    | Date             | Entries | Notes                                                                                                                                                       |
| --- | ------------------- | -------------------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Architecture (main) | `28779669-f351-4249-8a44-8696766f6bf7` | 2026-03-20 04:04 | 875     | `/bmad-architect` → `bmad-create-architecture`. NFR corrections (no mobile), confirmed Next.js                                                              |
| 2   | Course correction   | `134e47bc-4a83-49d4-a9fe-ba98f5fb8912` | 2026-03-22 12:33 | —       | `/bmad-architect` + `/bmad-correct-course`. **Railway disqualified** (no Sydney region for NDIS data residency). Replaced with Vercel Pro (syd1) + Supabase |

---

## Phase 2: Build — Epic 1 (Stories 1.1–1.6)

### Story 1.1 — Project Scaffolding & Deployment Pipeline

**Note**: Used older BMAD commands (pre-relay era). No explicit `CS 1.1` / `VS 1.1` args.

| #   | Step                 | Agent             | SID                                    | Date             | Entries | Notes                                                                                     |
| --- | -------------------- | ----------------- | -------------------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------------------- |
| 1   | CS (Create Story)    | Bob (bmad-sm)     | `73dff618-5eea-4ded-900b-9abdaac1da4d` | 2026-03-22 03:28 | —       | `/bmad-sprint-status` then `/bmad-create-story`                                           |
| 2   | VS (Validate Story)  | Bob (bmad-sm)     | `54342a2e-222c-4a7e-969f-5bcbe7cfc88a` | 2026-03-23 01:19 | —       | `bmad-create-story Validate Mode` on `1-1-project-scaffolding-and-deployment-pipeline.md` |
| 3   | DS (Dev Story)       | Amelia (bmad-dev) | `cc357cb4-e34d-4791-92f6-62eac990ebd6` | 2026-03-23 01:30 | —       | `/bmad-dev` → `bmad-dev-story`                                                            |
| 4   | Code Review          | Amelia (bmad-dev) | `518bde06-ca0a-4ef0-a409-a0f8fd150b88` | 2026-03-23 01:42 | —       | `/bmad-code-review story 1.1`                                                             |
| 5   | DR (Delivery Review) | Nate (bmad-dr)    | Part of `cc357cb4`                     | 2026-03-23       | —       | `bmad-delivery-review` (6 dimensions, skip AT)                                            |

### Story 1.2

**Note**: Compressed workflow — CS/VS/DS/DR happened across fewer sessions.

| #   | Step    | Agent         | SID                                                                              | Date                   | Entries | Notes                                           |
| --- | ------- | ------------- | -------------------------------------------------------------------------------- | ---------------------- | ------- | ----------------------------------------------- |
| 1   | CS/VS   | Bob (bmad-sm) | `4c3f5765-9eec-4f56-a72f-d09225c231e6` or `e2624d94-a012-4351-99b7-461f6f1f8ba5` | 2026-03-23 08:28–09:48 | —       | `/bmad-sm` → `bmad-create-story`                |
| 2   | DS + DR | Amelia + Nate | `fb3670cb-4364-48e3-b4f1-3f9e59100da0`                                           | 2026-03-23 08:55       | —       | `/bmad-dev` → `bmad-dev-story`, then `/bmad-dr` |

### Story 1.3 (partial — CS/VS not found)

| #   | Step   | Agent             | SID                                                 | Date             | Entries | Notes                 |
| --- | ------ | ----------------- | --------------------------------------------------- | ---------------- | ------- | --------------------- |
| —   | CS/VS  | Bob               | Likely within `4c3f5765`, `ba19dbe2`, or `e2624d94` | 2026-03-23       | —       | Not explicitly tagged |
| 1   | DS 1.3 | Amelia (bmad-dev) | `719bbffe-871d-455d-b73f-e50f4a40a1ee`              | 2026-03-23 10:14 | 736     | `/bmad-dev DS 1.3`    |
| 2   | DR 1.3 | Nate (bmad-dr)    | `23509d3a-d530-4696-800f-02ed3118c6ab`              | 2026-03-23 11:55 | 339     | `/bmad-dr`            |

### Story 1.4

| #   | Step                      | Agent             | SID                                    | Date             | Entries | Notes                                         |
| --- | ------------------------- | ----------------- | -------------------------------------- | ---------------- | ------- | --------------------------------------------- |
| 0   | Context / Lisa discussion | Advisory          | `a7cde8c9-bdef-4c40-9910-5a14a47510a0` | 2026-03-24 00:58 | 306     | Oversight — Lisa/KDD integration, 1.4 preview |
| 1   | CS                        | Bob (bmad-sm)     | `210117c1-e983-4ec9-8640-0f29fefd3d59` | 2026-03-24 01:03 | 325     | `/bmad-sm` → `cs`                             |
| 2   | VS                        | Bob (bmad-sm)     | `29f5e9b6-caec-4246-8db3-5f1ca5e8029e` | 2026-03-24 01:42 | 360     | `/bmad-sm` → `vs`                             |
| 3   | DS 1.4                    | Amelia (bmad-dev) | `e4bc7f23-c4da-4a09-8cf4-d50b8927174c` | 2026-03-24 01:56 | 891     | Heaviest DS session                           |
| 4   | DR (attempt 1)            | Nate (bmad-dr)    | `7ae37b7e-d31e-4a96-8c42-3cfe73077b10` | 2026-03-24 02:06 | 45      | Short — likely CONDITIONAL PASS or failure    |
| 5   | DR (attempt 2)            | Nate (bmad-dr)    | `2f4f7606-4911-4b7d-9723-776ee233ed92` | 2026-03-24 02:08 | 226     | Retry with corrections                        |

### Story 1.5

| #   | Step   | Agent             | SID                                    | Date             | Entries | Notes                            |
| --- | ------ | ----------------- | -------------------------------------- | ---------------- | ------- | -------------------------------- |
| 1   | CS 1.5 | Bob (bmad-sm)     | `d0950d3a-2265-455f-ad6c-e959900e8364` | 2026-03-24 02:50 | 258     |                                  |
| 2   | VS 1.5 | Bob (bmad-sm)     | `fe0e653e-624d-4cce-a2f9-03697f1ed8a6` | 2026-03-24 03:03 | 132     |                                  |
| 3   | DS 1.5 | Amelia (bmad-dev) | `752bd2ba-190b-4eef-b49e-aa227d502e33` | 2026-03-24 03:13 | 371     |                                  |
| 4   | DR 1.5 | Nate (bmad-dr)    | `b2567e1c-5bab-4a6d-8327-77f3806f81ca` | 2026-03-24 04:05 | 829     |                                  |
| 5   | CI Fix | (no bmad agent)   | `462d6d62-2719-4dd6-8264-3b2d6829ce7e` | 2026-03-24 04:48 | 425     | CI failure — Next.js build broke |
| 6   | CU     | Lisa (bmad-lib)   | `eafe8ddc-50c4-4a0c-99ce-64b5e842989b` | 2026-03-24 06:55 | 522     |                                  |

### Story 1.6

| #   | Step                 | Agent             | SID                                    | Date             | Entries | Notes                                |
| --- | -------------------- | ----------------- | -------------------------------------- | ---------------- | ------- | ------------------------------------ |
| 1   | WN 1.6               | Bob (bmad-sm)     | `ed696c30-113e-4e2d-885a-2fd015f32c95` | 2026-03-24 05:17 | 417     |                                      |
| 2   | VS 1.6               | Bob (bmad-sm)     | `8b1cd208-cf69-4031-9b94-f5fba318c220` | 2026-03-24 05:28 | 256     |                                      |
| 3   | DS 1.6               | Amelia (bmad-dev) | `1d9b6781-e48e-4be1-8523-1d47e06bacd6` | 2026-03-24 05:37 | 770     |                                      |
| 4   | DR 1.6 (wrong agent) | Bob (bmad-sm)     | `20a70f80-4968-4597-af95-48a77b2de238` | 2026-03-24 05:49 | 22      | Sent to wrong agent — quick abort    |
| 5   | DR 1.6 (correct)     | Nate (bmad-dr)    | `9577d288-8a66-461e-a1d1-8a43c2327fdf` | 2026-03-24 05:50 | 319     |                                      |
| 6   | CU                   | Lisa (bmad-lib)   | `eafe8ddc-50c4-4a0c-99ce-64b5e842989b` | 2026-03-24 06:55 | 522     | May have covered both 1.5 and 1.6 CU |

---

## Epic 1 Retrospective

| #   | Step | Agent         | SID                                    | Date             | Entries | Notes                                                         |
| --- | ---- | ------------- | -------------------------------------- | ---------------- | ------- | ------------------------------------------------------------- |
| 1   | ER   | Bob (bmad-sm) | `d40755e8-c219-4ceb-b722-f4974421f953` | 2026-03-24 15:45 | 706     | `/bmad-sm ER` — only ER session found. Reviewed all of Epic 1 |

---

## Phase 3: Build — Epic 2 (Stories 2.1–2.4) + Epic 0 (0.1–0.2)

### Story 2.1

| #   | Step               | Agent             | SID                                    | Date             | Entries |
| --- | ------------------ | ----------------- | -------------------------------------- | ---------------- | ------- |
| 1   | WN                 | Bob (bmad-sm)     | `9909d615-5243-42fa-9d9a-a4cbb0d5bf3c` | 2026-03-25 01:00 | 465     |
| 2   | VS 2.1             | Bob (bmad-sm)     | `3374c009-0741-4b8d-9d1a-eb36b90aff09` | 2026-03-25 01:53 | 157     |
| 3   | DS 2.1             | Amelia (bmad-dev) | `8aa3f8c1-e3c6-4420-8217-dce2dce9a910` | 2026-03-25 02:10 | 242     |
| 4   | DR 2.1 (attempt 1) | Nate (bmad-dr)    | `2cb52200-089d-45cd-9d5b-c95e3fd1796f` | 2026-03-25 02:17 | 328     |
| 5   | DR 2.1 (attempt 2) | Nate (bmad-dr)    | `57341a7b-6d19-4e39-84f9-fbb5c90cc463` | 2026-03-25 02:35 | 99      |
| 6   | SAT CS 2.1         | Taylor (bmad-sat) | `e0bc71bd-4f84-4e33-8185-ff2fcd15a393` | 2026-03-25 02:38 | 314     |
| 7   | CU 2.1             | Lisa (bmad-lib)   | `c0c3a020-bf8d-40b5-a1f4-10b06cab1bb4` | 2026-03-25 03:09 | 279     |

### Story 0.1 — Epic Zero (cross-cutting refactor: role system, RLS factory, test mock centralisation)

Triggered by duplication found in Stories 2.1 and 2.2. Lightweight ceremony.

| #   | Step    | Agent             | SID                                    | Date             | Entries |
| --- | ------- | ----------------- | -------------------------------------- | ---------------- | ------- |
| 0   | Context | Discussion        | `d4eb779b-d64d-48fe-98b4-438c4ba6a2f6` | 2026-03-25 02:32 | 50      |
| 1   | CS 0.1  | Bob (bmad-sm)     | `b1831067-9fae-446b-aa86-4d9d653af1fc` | 2026-03-25 03:22 | 311     |
| 2   | VS 0.1  | Bob (bmad-sm)     | `3c0ca17d-ebc5-41b6-a5e6-e79962d297c3` | 2026-03-25 04:10 | 245     |
| 3   | DS 0.1  | Amelia (bmad-dev) | `7f5950ea-0c35-4d80-9adb-d8ae56ebd2ee` | 2026-03-25 04:31 | 690     |
| 4   | DR 0.1  | Nate (bmad-dr)    | `a0ac9d71-8498-4894-89b2-684391c1ef40` | 2026-03-25 04:47 | 241     |
| 5   | CU 0.1  | Lisa (bmad-lib)   | `ebd423bf-1717-4999-8133-62fa684741b5` | 2026-03-25 05:06 | 261     |
| 6   | Ship    | (bmad-ship)       | `04bf77c4-085b-4282-9775-5aa402c871dd` | 2026-03-25 05:12 | 98      |

**Skipped SAT** — lightweight ceremony for refactoring story.

### Story 2.2 — Site Publish Endpoint

| #   | Step       | Agent             | SID                                    | Date             | Entries |
| --- | ---------- | ----------------- | -------------------------------------- | ---------------- | ------- |
| 1   | WN         | Bob (bmad-sm)     | `7335846f-4285-4ba0-a0e1-e5462a0e7c29` | 2026-03-26 00:19 | 405     |
| 2   | VS 2.2     | Bob (bmad-sm)     | `508cf747-0db7-4483-aeb4-2c9b6379af80` | 2026-03-26 00:26 | 180     |
| 3   | DS 2.2     | Amelia (bmad-dev) | `6e85723e-ed4c-41e7-a684-c7e544f6b44b` | 2026-03-26 00:27 | 342     |
| 4   | DR 2.2     | Nate (bmad-dr)    | `f908644a-1963-4fab-be76-a11908557e6d` | 2026-03-26 00:39 | 222     |
| 5   | SAT CS 2.2 | Taylor (bmad-sat) | `48bb39ae-7e1e-4f8d-89ae-d07331302702` | 2026-03-26 01:00 | 313     |
| 6   | CU 2.2     | Lisa (bmad-lib)   | `3762dd24-e75e-474e-92c0-a1ec362e1a21` | 2026-03-26 01:05 | 267     |
| 7   | Ship       | (bmad-ship)       | `c6493c66-179e-4ede-9b89-d5abafef9367` | 2026-03-26 01:13 | 102     |

**Cleanest run** — 54 minutes, 7 sessions, zero backtracks.

### Story 0.2 — Epic Zero (shared publish validation helpers + tenant boundary lock)

| #   | Step       | Agent             | SID                                    | Date             | Entries |
| --- | ---------- | ----------------- | -------------------------------------- | ---------------- | ------- |
| 1   | WN         | Bob (bmad-sm)     | `ea935e51-3e34-4371-b2bf-8db6f8cad45d` | 2026-03-26 01:19 | 116     |
| 2   | CS 0.2     | Bob (bmad-sm)     | `bb69f2f5-6079-43fd-bdf5-6ce8349de2cc` | 2026-03-26 01:29 | 313     |
| 3   | VS 0.2     | Bob (bmad-sm)     | `b25abd32-dffd-475b-b8ad-7890679d0597` | 2026-03-26 01:38 | 218     |
| 4   | DS 0.2     | Amelia (bmad-dev) | `0afc0efc-e5c9-4386-ade1-4a8d35e6d9e9` | 2026-03-26 01:39 | 396     |
| 5   | DR 0.2     | Nate (bmad-dr)    | `9f501885-80d2-4a45-aaf4-d23879dca72a` | 2026-03-26 01:45 | 244     |
| 6   | SAT CS 0.2 | Taylor (bmad-sat) | `149f2afd-3299-4600-950e-76de2839a5af` | 2026-03-26 02:10 | 362     |
| 7   | CU 0.2     | Lisa (bmad-lib)   | `55d7f373-8f62-4ddc-b9eb-9e431c99d8d2` | 2026-03-26 02:18 | 371     |
| 8   | Ship       | (bmad-ship)       | `59e43819-d833-4fc1-b0db-a02e409c74eb` | 2026-03-26 02:24 | 351     |

**SAT restored** — ceremony tuned up after Story 0.1.

### Story 2.3 — User Publish Endpoint (AT-8)

| #   | Step       | Agent             | SID                                    | Date             | Entries |
| --- | ---------- | ----------------- | -------------------------------------- | ---------------- | ------- |
| 1   | WN         | Bob (bmad-sm)     | `018e8742-04ef-470f-9731-34c46b3e1c67` | 2026-03-26 02:26 | 376     |
| 2   | CS+VS 2.3  | Bob (bmad-sm)     | `442f0de2-c3cd-4461-92fb-2a6311260fcb` | 2026-03-26 03:07 | 271     |
| 3   | DS 2.3     | Amelia (bmad-dev) | `63aaae31-a655-497f-8975-09cc561c5a27` | 2026-03-26 03:09 | 533     |
| 4   | DR 2.3     | Nate (bmad-dr)    | `8f43498c-4392-42d9-bcf9-c2782c3e0ce6` | 2026-03-26 03:32 | 272     |
| 5   | SAT CS 2.3 | Taylor (bmad-sat) | `631dbfa4-481b-47d8-b44e-d7c5971d308e` | 2026-03-26 03:40 | 444     |
| 6   | SAT RA 2.3 | Taylor (bmad-sat) | `ee1bfd7e-4e8e-4aa9-b095-d4e83a1ae81e` | 2026-03-26 04:00 | 405     |
| 7   | CU 2.3     | Lisa (bmad-lib)   | `e1338f98-6c7a-4664-aa21-6d1b4d3d8e5b` | 2026-03-26 04:24 | 358     |
| 8   | Ship       | (bmad-ship)       | `2bbfe21f-9d11-419f-9cd3-296327e295af` | 2026-03-26 04:42 | 92      |

**Bug got through**: Oversight caught that a bug made it past Amelia and Nate into Lisa's stage (AC5 — cross-company user linking contradicts users.id=authUser design).

### Story 2.4 — Participant Publish Endpoint (in progress)

| #   | Step       | Agent             | SID                                    | Date             | Entries |
| --- | ---------- | ----------------- | -------------------------------------- | ---------------- | ------- |
| 1   | WN         | Bob (bmad-sm)     | `f879e832-cfac-41cb-9518-0e32dacc5f4b` | 2026-03-26 04:58 | 458     |
| 2   | VS 2.4     | Bob (bmad-sm)     | `c6e59f7d-8ab3-4880-9eec-401822f42773` | 2026-03-26 05:06 | 263     |
| 3   | DS 2.4     | Amelia (bmad-dev) | `bb75e368-5d30-4ab4-9d8e-d4e61a7ad756` | 2026-03-26 06:04 | 690     |
| 4   | DR 2.4     | Nate (bmad-dr)    | `df0fea84-b456-4f8e-95a0-3016abc54923` | 2026-03-26 06:05 | 256     |
| 5   | SAT RA 2.4 | Taylor (bmad-sat) | `08609089-6044-4e92-87cd-ea68556d35c3` | 2026-03-26 08:06 | 431     |
| —   | CU 2.4     | Lisa (bmad-lib)   | _not found — possibly not yet run_     | —                | —       |
| —   | Ship 2.4   | (bmad-ship)       | _not found — possibly not yet run_     | —                | —       |

---

## Oversight / Overwatch Sessions

These run **in parallel** with the story lifecycle. David uses them to track sprint state, review agent output, generate paste-back corrections, and make routing decisions.

| #   | Title                              | SID                                    | Dates              | Entries | Stories Covered | Key Activity                                                                                                                                                                                   |
| --- | ---------------------------------- | -------------------------------------- | ------------------ | ------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `bmad-oversight-winston-bob-start` | `3701e9b8-8004-4ecb-8865-68c6f5b2b968` | 2026-03-20         | —       | Pre-build       | Ran while Winston's architecture session was active                                                                                                                                            |
| 2   | (early oversight)                  | `08152bc4-48eb-4395-b42b-518db6f20297` | 2026-03-20         | —       | Pre-build       | Early oversight setup                                                                                                                                                                          |
| 3   | `bmad-oversight-for-ssv2`          | `a4fd902a-cdbe-4533-b563-d9f86a3333a2` | 2026-03-20 → 03-24 | 1682    | 1.1–1.4         | **Main Phase 1 oversight**. Railway→Vercel migration, MCP setup, Supabase region, code reviews, Sprint planning. Context ran out 2x                                                            |
| 4   | `bmad-relay-design-docs`           | `00befc58-6638-49f6-9a3e-b41938b0e775` | 2026-03-23 → 03-24 | 2680    | 1.1–1.6         | **Genesis session**: Created Nate, Lisa, Taylor, Ship, WN. Formalised story chain. Separation of concerns. Lisa 17/17 autopilot tests                                                          |
| 5   | `bmad-oversight`                   | `c758c8ee-6c7f-4305-912b-b0ca1744d114` | 2026-03-24         | 117     | 1.5–1.6         | Quick oversight check, reviewed Story 1.6 DS output                                                                                                                                            |
| 6   | `bmad-oversite-ssv2`               | `a7cde8c9-bdef-4c40-9910-5a14a47510a0` | 2026-03-24         | 306     | 1.4             | Lisa/KDD integration research, 5 KDD improvements launched as parallel agents                                                                                                                  |
| 7   | `bmad-oversight-command-setup`     | `fef74880-0f8a-46ff-9b55-d20615db1b18` | 2026-03-24 → 03-25 | 659     | 0.1, 2.1        | Setup Oversight as proper skill. Story Zero research. Lisa KDD upgrade. Epic 0 sprint-status handling                                                                                          |
| 8   | `bmad-overwatch`                   | `94178674-d112-49d8-b1a1-47fa3c0f7856` | 2026-03-25 → 03-26 | 221     | 0.1, 2.2, 2.3   | **Active oversight**. Story 0.1 CONDITIONAL PASS with 3 patches. Paste-back messages for Amelia. Refactoring opportunity flagged. "Agent bias isolation" noted as AngelEye metric. Shipped 2.2 |
| 9   | (no title)                         | `fe9b310d-2361-4efe-aa57-d6d577ed9e0f` | 2026-03-26         | 257     | 0.2, 2.3        | Signal Studio push compatibility audit. Gap found: no one tracks when Signal Studio needs updates. Proposed "push handover" step                                                               |
| 10  | `bmad-overwatch`                   | `541a8f18-cf3d-4e2f-ad32-e1e3f0849db6` | 2026-03-26         | 294     | 2.2, 2.3        | Sprint state table. Bug got through Amelia+Nate into Lisa stage. Context at 6% before handover                                                                                                 |
| 11  | `bmad-oversight`                   | `9bcb1d85-bd81-4d30-b34b-f5e85a0ac0e2` | 2026-03-26         | 171     | 2.3, 2.4        | Handover from previous. AT-8 failure on AC5. Story 2.4 review                                                                                                                                  |

---

## Relay Sessions

The Relay orchestrates the agent chain — generates paste-ready commands, ensures correct sequence, improves agents.

| #   | Title                    | SID                                    | Dates              | Entries | Key Activity                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------ | -------------------------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `bmad-relay-design`      | `6ba65a37-5b76-47fe-8d6a-c88a8c6be907` | 2026-03-22 → 03-23 | —       | Sprint planning and story flow design                                                                                                                                                                                                                                                                                     |
| 2   | `bmad-relay-design-docs` | `00befc58-6638-49f6-9a3e-b41938b0e775` | 2026-03-23 → 03-24 | 2680    | _Same session as Oversight #4 above_ — created agents + relay docs                                                                                                                                                                                                                                                        |
| 3   | `bmad-relay`             | `9ce6fb0e-9b39-4b70-8289-ee8a7b1cb006` | 2026-03-24 → 03-26 | 1032    | **Active relay**. Generated paste-ready commands for 2.1–2.3. Fixed CI lint gate across agents. David corrected relay multiple times for forgetting Taylor's dual commands. Wrote comprehensive agent write-up for BMAD brain. Discrepancy tracking (SupportSignal custom agents vs upstream BMAD v6). Context ran out 2x |
| 4   | (BMAD Agent Fact Sheet)  | `467a2dec-443d-47ae-b7d1-519d0d349a81` | 2026-03-26         | 152     | Full agent roster definition. Observer/advisor agent definitions (Relay, Overwatch, Advisor, AngelEye)                                                                                                                                                                                                                    |

---

## BMAD Advisor / Brain Sessions

Sessions in the brains directory where David researched BMAD methodology directly.

| #   | Title                | SID        | Project | Dates              | Entries | Key Activity                                                                                                                                                                                                                                       |
| --- | -------------------- | ---------- | ------- | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | (BMAD brain refresh) | `8efb371e` | brains  | 2026-02-25         | 209     | `/brand-dave:refresh-bmad-brain` — early refresh                                                                                                                                                                                                   |
| 2   | (BMAD focus)         | `f9c47d5e` | brains  | 2026-03-10         | 123     | `/focus bmad` — general focus                                                                                                                                                                                                                      |
| 3   | (BMAD brain refresh) | `4e8c5897` | brains  | 2026-03-16 → 03-20 | 1400    | `/brand-dave:refresh-bmad-brain` — comprehensive v6 refresh                                                                                                                                                                                        |
| 4   | (BMAD v6 focus)      | `2a247732` | brains  | 2026-03-17 → 03-18 | 140     | `/focus bmad-method-v6`                                                                                                                                                                                                                            |
| 5   | `bmad-advisor`       | `3fa5e03b` | brains  | 2026-03-22 → 03-26 | 1243    | **Main advisor session**. Designed Nate (Delivery Reviewer concept). Researched Taylor from POEM OS. Story validation flow gap identified. Epic Zero pattern. Agent presentation HTML with Oversight section. v6 upgrade notes. Context ran out 3x |

---

## Special / Support Sessions

| Type                      | SID                                    | Date       | Entries | Description                                                                       |
| ------------------------- | -------------------------------------- | ---------- | ------- | --------------------------------------------------------------------------------- |
| Lisa KDD Upgrade          | `9cf1804f-130f-4a70-ac6e-f7f2b6d13a05` | 2026-03-25 | 353     | Upgraded Lisa from basic 10-command to POEM parity, then simplified to 4 commands |
| Playwright Login Debug    | `6f007464-2360-451c-aacd-bb1dbfb1df52` | 2026-03-24 | 1139    | Debugging sign-in with Playwright MCP                                             |
| Epic 0 Setup Discussion   | `d4eb779b-d64d-48fe-98b4-438c4ba6a2f6` | 2026-03-25 | 50      | "We're in the middle of working on 2.1 and realised our mistake"                  |
| Signal Studio Integration | `82754c82-20cb-4290-8092-61479b239e3c` | 2026-03-25 | 799     | Signal Studio push integration work                                               |

---

## Observed Patterns

### Chain Efficiency Over Time

| Story   | Sessions    | Backtracks      | Notes                                         |
| ------- | ----------- | --------------- | --------------------------------------------- |
| 1.1     | 4-5         | 0               | Old commands, compressed workflow             |
| 1.2     | 2-3         | 0               | Very compressed — DS+DR in one session        |
| 1.3     | 2 (partial) | 0               | Only DS+DR tracked                            |
| 1.4     | 6           | 1 (DR retry)    | First full chain with new relay system        |
| 1.5     | 6           | CI failure      | Build broke mid-chain                         |
| 1.6     | 6           | 1 (wrong agent) | DR sent to Bob instead of Nate                |
| **ER**  | 1           | —               | Epic Retrospective                            |
| 2.1     | 7           | 1 (DR retry)    | First Epic 2 story                            |
| 0.1     | 7           | 0               | No SAT (lightweight ceremony)                 |
| **2.2** | **7**       | **0**           | **Cleanest run — 54 minutes**                 |
| 0.2     | 8           | 0               | SAT restored after 0.1 experience             |
| 2.3     | 8           | 0               | SAT split into CS + RA. Bug got through to CU |
| 2.4     | 5+          | —               | In progress — CU + Ship not yet run           |

### Workflow Evolution

1. **Stories 1.1–1.3** (pre-relay): Used old BMAD commands (`/bmad-create-story`, `/bmad-dev-story`). Sessions were fewer and more compressed. No formal chain.
2. **Session `00befc58`** (2026-03-23): **Genesis moment** — Nate, Lisa, Taylor, Ship, WN created. Story chain formalised. This is the inflection point.
3. **Stories 1.4–1.6** (post-relay): New chain structure. Backtracks visible (DR retries, wrong agent routing). Learning curve.
4. **Stories 2.1–2.4** (mature): Clean runs. Ceremony tuning (Epic 0 skips SAT, then restores it). Oversight catches bugs that agents miss.

### Observer/Advisory Interaction Pattern

Oversight sessions run **alongside** story chains, not in sequence. The pattern is:

1. David runs a story lifecycle step in one window
2. Oversight in another window reviews the output, generates corrections
3. Corrections are paste-backed into the story window as self-contained messages
4. Relay tracks which commands to run next

**Temporal overlap**: Oversight sessions span multiple days (e.g., `a4fd902a` ran for 4 days). Story chains are fast (30 min to 4 hours). The two timescales are very different.

### Recurring Friction Points (from oversight deep-dive)

1. **Taylor's dual commands** forgotten repeatedly by relay (CS + RA are two steps)
2. **Context windows exhausted** — oversight sessions compact 2-3 times each
3. **Oversight docs grow too large** and get auto-abridged
4. **No push handover** — after Ship, nobody tells Signal Studio what changed
5. **Bug escape** in Story 2.3 — got past Amelia (DS) and Nate (DR) into Lisa (CU)

---

## For AngelEye: Business Intelligence Layer

### What This Inventory Reveals

The current AngelEye workspace/organisation view groups sessions by folder. But the real grouping is:

**A Story Unit** = 6-8 lifecycle sessions + 1-2 oversight sessions + 0-1 relay interactions + 0-1 advisor lookups, all working on the same story number.

**An Epic Sprint** = N story units in sequence, bookended by WN (orientation) sessions and an ER (retrospective), with Epic 0 interleaves when cross-cutting debt is detected.

**A Project Phase** = Planning (John → Sally → Winston) → Build (Epic 1 → ER → Epic 2...) → Ship

### Proposed Grouping Hierarchy

```
Project Phase (Planning / Build / Ship)
  └── Epic Sprint (Epic 1, Epic 2, ...)
       ├── Epic Retrospective
       ├── Story Unit (2.1, 2.2, 0.1, ...)
       │    ├── Lifecycle Sessions (WN, CS, VS, DS, DR, SAT, CU, Ship)
       │    ├── Oversight Interactions (paste-backs, corrections)
       │    └── Backtracks (DR retry, CI fix, bug fix)
       └── Epic 0 Interleaves
            └── Lightweight Story Units (may skip SAT/VS)
```

### Recommended New Classifiers for AngelEye

| ID  | Name                        | What It Detects                                                               |
| --- | --------------------------- | ----------------------------------------------------------------------------- |
| C14 | `bmad_phase`                | Planning / Build / Ship                                                       |
| C15 | `bmad_agent_role`           | Which BMAD agent ran (sm, dev, dr, sat, lib, ship, oversight, relay, advisor) |
| C16 | `bmad_action`               | What action was performed (WN, CS, VS, DS, DR, SAT-CS, SAT-RA, CU, ER, Ship)  |
| C17 | `bmad_story_id`             | Story identifier (e.g., "2.1", "0.2")                                         |
| C18 | `bmad_chain_position`       | Position in lifecycle (1-8)                                                   |
| C19 | `bmad_is_backtrack`         | Whether this is a retry/backtrack                                             |
| C20 | `bmad_ceremony_level`       | Full / Lightweight / Compressed                                               |
| C21 | `bmad_epic_id`              | Which epic (0, 1, 2)                                                          |
| P26 | `has_bmad_skill_invocation` | Session starts with a `/bmad-*` command                                       |
| P27 | `has_paste_back_correction` | Session received corrections from oversight                                   |
| P28 | `has_dr_verdict`            | Session contains PASS / CONDITIONAL PASS / REJECT                             |
| P29 | `has_ci_outcome`            | Session triggered git push and watched CI                                     |
| P30 | `has_story_file_writes`     | Session wrote to `_bmad-output/implementation-artifacts/`                     |

---

## Session Count Summary

| Category                            | Count   | Total Entries (est.) |
| ----------------------------------- | ------- | -------------------- |
| Planning (John, Sally, Winston)     | 5       | ~1,100               |
| Story lifecycle (chain steps)       | ~55     | ~18,000              |
| Epic Retrospective                  | 1       | 706                  |
| Oversight / Overwatch               | 11      | ~6,500               |
| Relay                               | 4       | ~3,900               |
| BMAD Advisor (brains)               | 5       | ~3,100               |
| Special (Lisa upgrade, debug, etc.) | 4       | ~2,300               |
| **Total BMAD-related**              | **~85** | **~35,600**          |
