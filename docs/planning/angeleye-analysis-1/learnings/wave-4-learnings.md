# Wave 4 Learnings

**Wave**: 4 (20 sessions across 4 groups: A=8 ORIENTATION, B=5 KNOWLEDGE, C=3 signal-studio BUILD, D=4 oddballs)
**Date**: 2026-03-22

## Application Learnings

### ORIENTATION has a dominant subtype: artifact_retrieval (5/8)

| Subtype                        | Count | Sessions                          |
| ------------------------------ | :---: | --------------------------------- |
| orientation.artifact_retrieval |   5   | W4-01, W4-05, W4-06, W4-07, W4-08 |
| orientation.cold_start         |   1   | W4-04                             |
| orientation.bookend            |   1   | W4-03                             |
| orientation.requirements       |   1   | W4-02                             |

Artifact retrieval is the most common ORIENTATION pattern: short sessions where Claude reads prior session output, planning docs, or recipe files to retrieve context. Distinguishing signal: Read-heavy, zero or near-zero Edit/Write, session duration under 5 minutes. The `orientation.bookend` subtype is a 2-prompt verification check between sessions.

**Cumulative ORIENTATION counts** (11 sessions total across all waves): artifact_retrieval (6), cold_start (3), bookend (2), requirements (2), morning_triage (1), loop_runaway (1).

### KNOWLEDGE subtypes split into 5 distinct patterns

Wave 4 analysed 5 KNOWLEDGE sessions and found 5 different subtypes — no two alike:

| Subtype                        | Session | What it actually is                                             |
| ------------------------------ | ------- | --------------------------------------------------------------- |
| brand.speaker_submission       | W4-09   | Brand copywriting for external form (NOT KNOWLEDGE)             |
| knowledge.brain_curation       | W4-10   | Ansible companion: running infra + documenting drift            |
| knowledge.brain_synthesis      | W4-11   | Reading brain files → assembling NotebookLM dataset deliverable |
| knowledge.survey_and_implement | W4-12   | 36-brain taxonomy survey → agent-dispatched implementation      |
| knowledge.personal_advisory    | W4-13   | Personal purchase advisory via Playwright e-commerce browsing   |

Two of these (W4-09, W4-13) are KNOWLEDGE false positives — the project_dir=brains trigger fires but the session is doing non-knowledge work. Three are genuine KNOWLEDGE with distinct subtypes.

### signal-studio BUILD: 1/3 correct, 1/3 wrong, 1/3 mixed

| Session | Registry | Actual                             | Correct?                          |
| ------- | -------- | ---------------------------------- | --------------------------------- |
| W4-14   | BUILD    | build.campaign                     | Yes — 6h product dev              |
| W4-15   | BUILD    | debug.e2e_campaign                 | No — 14h debugging, zero features |
| W4-16   | BUILD    | MIXED (BUILD + UI_REVIEW + DESIGN) | Partial — BUILD in phase 1 only   |

Signal-studio BUILD is more accurate than brains BUILD but still has errors. The key discriminator: **was feature code written?** W4-15 had 182 Bash calls but zero new routes, components, or data models — it was entirely test infrastructure debugging. W4-16 started BUILD but spent 25.6% of tool calls on Playwright visual audit.

### Home directory and monorepo root sessions are never BUILD

| Session | project_dir               | Registry | Actual                    |
| ------- | ------------------------- | -------- | ------------------------- |
| W4-17   | /Users/davidcruwys/dev/ad | BUILD    | research.external_intake  |
| W4-18   | /Users/davidcruwys        | BUILD    | sysops.multi_machine_sync |

Both are BUILD false positives. When project_dir is the home directory or monorepo root, the classifier should default to SYSOPS or RESEARCH, not BUILD. Zero-tool-call sessions (W4-17) should never classify as BUILD.

### New parent types confirmed

Wave 4 adds 3 new parent type proposals to the 5 from wave 3:

| Parent type   | Sessions        | Description                                                                           |
| ------------- | --------------- | ------------------------------------------------------------------------------------- |
| BRAND/CONTENT | W4-09           | Brand copywriting for external forms/submissions                                      |
| DEBUG         | W4-15           | Test infrastructure debugging campaigns (not feature work)                            |
| SYSOPS        | W4-18           | Machine-level operations (repo sync, provisioning) distinct from app-level OPERATIONS |
| UI_REVIEW     | W4-16 (phase 2) | Visual audit of running app via Playwright screenshots                                |

Combined with wave 3 proposals (SKILL, SETUP, META, REVIEW, PLANNING), that's 9 new parent types across 68 sessions. The original 6 (BUILD, TEST, RESEARCH, KNOWLEDGE, OPERATIONS, ORIENTATION) need significant expansion.

### Classifier learning signals from wave 4

1. **Playwright call = external_research or UI_REVIEW flag**: mcp**playwright**browser_navigate in a brains session = personal_advisory. High Playwright volume (>20%) in a product session = UI_REVIEW component.
2. **Zero tool calls = not BUILD**: W4-17 had 2 prompts and zero tool calls. Any session with zero tool calls should not classify as BUILD.
3. **Write+Bash(open) = delivery pattern**: In brains sessions, Write followed by Bash `open` is file delivery to Finder, not code execution. Disambiguate Bash semantics by adjacent tool context.
4. **Empty brain search = knowledge gap, not KNOWLEDGE session**: If Grep/Glob search finds no brain content, the session is discovering a gap, not consuming knowledge.
5. **ToolSearch early in session = skill-gap signal**: 3+ ToolSearch calls before the first real work begins indicates the user expected a skill that doesn't exist.
6. **CronCreate/CronDelete pairs in a session = background polling**: 7 pairs in W4-15. These are within-session orchestration, not persistent scheduled tasks.
7. **Home-dir project_dir**: `/Users/<username>` should default SYSOPS or AMBIENT, never BUILD.
8. **Multi-phase sessions need multi-label classification**: W4-16 had 3 distinct phases each with a different type. Single-label classification loses information.

### User frustration as a session signal

W4-15 contained distributed frustration markers across 14 hours: "This is shit", "Not only do I not have any faith in you", "you fuck", "No, it isn't clean. No, it isn't fucking set up. I asked this three times." This correlates with:

- Long session duration (>8h)
- Multiple context continuations (3)
- Data state bleed (seed data regenerated on each test run)
- Repeated unmet cleanup requests

Frustration density (frustration-events / total-prompts) could be a session quality metric.

### NotebookLM dataset assembly is a recurring workflow

W4-11 is the second or third session where NotebookLM is the named output target. The pattern: Glob-heavy discovery → Read-heavy retrieval → Write (single Markdown) → Bash `open` to reveal in Finder. The user explicitly noted a missing "Gather" skill for this workflow.

## Loop Meta-Learnings

### 20-session wave with 4 groups is the sweet spot

Wave 4 processed 20 sessions across 4 groups (8 ORIENTATION + 5 KNOWLEDGE + 3 signal-studio BUILD + 4 oddballs). All 20 agents completed successfully with rich findings. The grouping by type forced within-category comparison and produced 10+ new subtypes.

### Discovery rate remains high

Wave 4 produced **10 new subtypes** from 20 sessions (0.5 per session). Cumulative: wave 1 = 1.1, wave 2 = 0.6, wave 3 = 0.8, wave 4 = 0.5. The rate is declining but still producing novel types. The decline is expected — we're now finding subtypes in less-common parent types rather than reclassifying the dominant BUILD bucket.

### ORIENTATION exhaustion achieved

With 11 ORIENTATION sessions analysed (8 in wave 4), the subtype space is well-mapped: artifact_retrieval dominates, cold_start and bookend are confirmed recurring types, requirements and morning_triage are rarer. Further ORIENTATION analysis would likely yield diminishing returns.

### KNOWLEDGE is more diverse than expected

5 KNOWLEDGE sessions yielded 5 different subtypes — the parent type covers a very wide range of activities from brand copywriting to personal shopping advisory. The KNOWLEDGE classifier needs significant subtype discrimination.

### Agent quality consistent

All 20 agents produced structured findings with classification challenges, tool breakdowns, patterns, and subtype proposals. The W4-16 agent produced the richest output — 121 lines with a full phase-by-phase breakdown and tool category percentages. No agents hit context limits.
