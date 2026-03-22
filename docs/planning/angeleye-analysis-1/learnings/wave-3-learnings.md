# Wave 3 Learnings

**Wave**: 3 (20 sessions across 3 sub-waves: 3a TEST+RESEARCH, 3b Unseen projects, 3c prompt.supportsignal+v-appydave)
**Date**: 2026-03-22

## Application Learnings

### TEST classification is mostly correct (3/4) but playwright-heavy is not always testing

The 4 remaining TEST sessions split into 3 genuine UAT sessions and 1 misclassification:

- 3 signal-studio sessions: all genuine UAT with distinct subtypes (inline debug, sequential workflows, narrative execution)
- 1 appydave-plugins session: Playwright used for web scraping + skill creation, not testing at all

**Key signal**: Playwright + Skill/Write calls after the Playwright phase → not TEST, it's skill.creation. Playwright alone doesn't imply testing.

### TEST has real subtype variety

| Subtype                        | Signal                                                                  | Session |
| ------------------------------ | ----------------------------------------------------------------------- | ------- |
| test.uat_with_inline_debug     | UAT + bug discovery + code fixes + retest in one session                | W3-01   |
| test.uat_playwright_sequential | Sequential workflow narratives, autonomous gap, monitoring loop         | W3-02   |
| test.uat_narrative             | Claude reads workflow markdown and executes step-by-step via Playwright | W3-03   |

All three share Playwright-heavy tool patterns but differ in workflow structure and human involvement.

### RESEARCH classification is 100% correct at parent level

All 3 RESEARCH sessions confirmed. Three distinct subtypes discovered:

- `research.operational` — real-world procurement research, no artifacts (Philippines hardware)
- `research.knowledge_capture` — web research → brain file + CLAUDE.md write
- `research.dev_env_troubleshooting` — troubleshooting dev tools (Copilot, Ecamm), false project attribution

### CWD is unreliable for project attribution (confirmed 3 more times)

| Session | CWD says       | Actually about                        |
| ------- | -------------- | ------------------------------------- |
| W3-05   | brains         | Philippines hardware shopping         |
| W3-07   | signal-studio  | Copilot removal + Ecamm camera        |
| W3-16   | brain-dynamous | Pre-compaction memory flush (no work) |

Combined with W2-09 from wave 2, that's 4 confirmed false project attributions from CWD alone. **File-touch paths are the reliable signal, not CWD.**

### BUILD accuracy by project type (wave 3 data)

| Project type                   | Sessions | BUILD correct?                    |
| ------------------------------ | -------- | --------------------------------- |
| prompt.supportsignal (product) | 3        | 3/3 (100%)                        |
| appystack (product)            | 2        | 2/2 (100%)                        |
| v-appydave (product)           | 2        | 1/2 (50% — one was review.refine) |
| appydave-plugins (meta)        | 2        | 0/2 (0%)                          |
| ansible (infra)                | 2        | 0/2 (0%)                          |
| brain-dynamous (personal OS)   | 2        | 1/2 (50%)                         |

**Cumulative pattern across 48 sessions**: BUILD is accurate for product code repos, wrong for everything else.

### New parent types emerging

Wave 3 surfaced types that don't fit the original 6 (BUILD/TEST/RESEARCH/KNOWLEDGE/OPERATIONS/ORIENTATION):

| Proposed parent | Sessions            | Description                                          |
| --------------- | ------------------- | ---------------------------------------------------- |
| SKILL           | W3-04, W3-10, W3-11 | Creating, designing, or migrating Claude Code skills |
| SETUP           | W3-15               | First-time scaffold activation and onboarding        |
| META            | W3-16               | System-generated sessions (compaction flushes)       |
| REVIEW          | W3-20               | Auditing existing work without building new features |
| PLANNING        | W2-19               | Decision writeback to planning documents             |

These 5 new parent types each have only 1-3 examples. Need more data before formalising, but they keep appearing across different projects.

### Compaction flush sessions need early detection

W3-16 is a single-event session: a pre-compaction memory flush with zero real user prompts. The classifier assigns BUILD based on prose content in the flush text (which describes tools from the prior session). **Fix**: detect "Pre-compaction memory flush" in the first user_prompt and short-circuit to meta.compaction_flush before tool-pattern analysis runs.

### Design constraints lost across compaction is a real pain point

W3-19 captured David's explicit frustration: "Why do you constantly ignore my requests? This must be the third or fourth conversation we've had around this." The constraint (keep development panels in the development section) was never written to a file — it existed only in conversation context that gets compacted away. This is directly relevant to AngelEye's ambient intelligence goal.

### Unauthorised edit pattern

W3-20: Claude made 7 edits before being asked to. David caught it: "I just wanted you to read that stuff." Claude misread a restored prior-session transcript as an implicit action queue. This is a detectable anti-pattern: Edit calls occurring before any explicit user instruction to edit.

### Voice artifacts continue to evolve

New examples from wave 3:

- "We're at dots" = "CLAUDE.md" (W3-08) — filename as phonetic approximation
- "RAF Wiggum loop" = "Ralph Wiggum loop" (W3-01)
- "BULSHIT" = "bullshit" in voice transcription (W3-11)
- "Ralph Leap Button Plug-in Spelter" = voice noise (W3-11)

### Cross-paste injection as classifier risk

W3-08: First prompt contains ~100KB of pasted Ecamm/deckhand conversation as analogy. W3-18: POEM Alex agent output pasted into debug session. Any keyword-based classifier would wrongly attribute these sessions. **CWD and tool file paths are reliable; prompt text is not.**

## Loop Meta-Learnings

### 20-session wave with 3 sub-waves is sustainable

Wave 3 processed 20 sessions across 3 sub-waves (7 + 9 + 4) in a single coordinator session. All agents completed successfully. Sonnet agents handle 15-220KB sessions well.

### Discovery rate is NOT declining

Wave 3 produced **16 new subtypes** from 20 sessions (0.8 per session). Wave 2 produced ~12 new subtypes from 20 sessions (0.6 per session). Wave 1 produced 9 from 8 sessions (1.1 per session). The rate is stable — we are not yet at diminishing returns.

### Grouped waves produce richer findings

Grouping by type (TEST, RESEARCH) or project (ansible, brain-dynamous) forces comparison within a category, surfacing distinctions that a random sample wouldn't. The TEST group found 3 distinct UAT subtypes precisely because all 3 signal-studio sessions were compared side-by-side.

### Agent quality remains high

All 20 agents produced structured findings with classification challenges, observations, patterns, and subtype proposals. The AGENTS.md instructions continue to work well. No agents hit context limits.

### 42 subtype candidates accumulated

From 48 sessions across 3 waves: 42 distinct subtypes across 8+ parent types. The strongest signals (count >= 2): build.campaign (6), orientation.cold_start (2), build.migration (2), build.iterative_design (2), knowledge.advisory (2), knowledge.brain_update (2).
