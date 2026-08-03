---
type: analysis
title: 'Findings W7-03'
description: 'Wave 7 analysis (W7-03) of 9 sessions — 89% BUILD misclassification, hardware-name voice artifact category, handover-brief as implementation driver, 8 new subtypes.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7, Agent W7-03

**Date**: 2026-03-22
**Sessions analysed**: 9
**Scale distribution**: micro(2), light(1), moderate(2), heavy(2), marathon(1), plus one recategorised moderate

---

## Session-by-Session Observations

### W7-38579dc4 — brains / micro / ORIENTATION.abandoned_start

**Registry**: BUILD → **Actual**: ORIENTATION

Truncated session: single prompt "What is the nature x" — sentence cut off. Session ended immediately. Zero tools. 3 events total (session_start + user_prompt + session_end). File size 661 bytes.

**Key observations**:

- This is a new micro subtype: `orientation.abandoned_start` — user opened Claude, started to type, abandoned before finishing the thought
- No analytical value, but pattern worth tracking — how often do sessions start and immediately die?
- CWD=brains is incidental — the terminal happened to be there
- Registry marked BUILD, which is wrong by all rules (zero tools, brains CWD, incomplete prompt)

---

### W7-a9605418 — ansible / micro / OPERATIONS.infra_question

**Registry**: BUILD → **Actual**: OPERATIONS

Micro session: 1 prompt about ensuring `uv` package manager is deployed on all machines. CWD=ansible. Only 1 Read tool call. Session terminates before response captured.

**Key observations**:

- Clean example of Rule 13 in action: Ansible project_dir → OPERATIONS, never BUILD
- Voice dictation artifact: 'uv Is on' (capital I mid-sentence)
- `operations.infra_question` as a subtype — single-question infra check, truncated before answer
- Truncation pattern: registry shows `last_active` later than JSONL captures — session continued beyond what was captured in the JSONL file?

---

### W7-24adc102 — custom / light / SYSOPS.shell_config

**Registry**: BUILD → **Actual**: SYSOPS

SSH alias configuration session in `.oh-my-zsh/custom`. 3-prompt pattern: ask about aliases → confirm creation → commit. CWD=.oh-my-zsh/custom.

**Key observations**:

- Canonical example of `sysops.shell_config` — asking about existing aliases, writing new ones, committing
- 1440min wall clock duration is entirely an idle gap artefact — 0 active minutes computed
- Voice + paste hybrid opening: voice question with terminal output pasted inline
- Skill invocation likely `/commit` (no skill name captured — skill_invocations field contains empty `{}`)
- The `.oh-my-zsh/custom` CWD is actually reliable here — the work correctly targets that directory

---

### W7-ac9d117b — appydave-plugins / moderate / SKILL.skill_update

**Registry**: BUILD → **Actual**: SKILL

Ralphy SKILL.md update to add `/loop` cron vs coordinator loop disambiguation. 3 prompts: conceptual question → clarification → structured handover brief driving implementation.

**Key observations**:

- Rule 14 confirmed: all edits target SKILL.md → SKILL type
- **Cross-session handover brief pattern**: Third prompt is a full structured brief in markdown table format — clearly generated in another session and pasted here to drive implementation. New `skill.skill_update` subtype confirmed
- Voice artifact: 'Ralph Williams loop' for 'Ralphy loop', 'Ralph Wiggum' referenced — dictation confused Ralphy with Simpsons character
- The `/loop` vs Ralphy loop confusion documented here is itself meta — this session is fixing the exact confusion we'd get when analysing Ralphy sessions
- session closed without commit (abrupt_abandon) — common in skill update sessions

---

### W7-fd6cb997 — voz / moderate / KNOWLEDGE.template_adaptation

**Registry**: BUILD → **Actual**: KNOWLEDGE

Client communication template adaptation — reads vOz templates, creates Lars client equivalents. 9 Write calls in 7 minutes. 2 prompts.

**Key observations**:

- **New subtype: `knowledge.template_adaptation`** — distinct from `knowledge.brain_update`. Takes existing client artifacts as source, produces new client artifacts. Not building product features.
- CWD=voz is misleading — it's the source reference, not the target. Write targets are Lars client files (`/dev/clients/lars`). CWD mismatch confirmed.
- TaskCreate + TaskUpdate tools used — user is tracking this work in a task system
- Very compressed session: 24 tool calls in 7 minutes — high velocity knowledge transfer
- Lars client not yet in registry — new project that hasn't been seen before

---

### W7-ca8ef6a7 — apps / moderate / MIXED.research_then_sysops

**Registry**: BUILD → **Actual**: MIXED

3-phase session: (1) Deckhand project orientation, (2) Ajazz hardware button research, (3) renaming a poorly-named prompt file. CWD=apps (parent of deckhand).

**Key observations**:

- **Voice artifacts in hardware names**: 'stream dates' for 'Stream Deck', 'dick' for 'deck' — severe voice dictation misfire on hardware product names
- **Naming frustration is a real signal**: User expressed 'what the fuck' twice about the 'new session prompt' label. This is not code frustration — it's naming convention confusion. The fix was renaming to 'Claude Instructions Build DeckHand'. Suggests a recurring pain point with opaque naming in the Claude ecosystem.
- Multi-phase session: orientation → hardware research → file sysops. None of the phases is BUILD.
- CWD=apps (monorepo parent) — per established rules, this is incidental. Actual work in deckhand subdirectory.
- Agent calls used for hardware research deep-dive (Ajazz specs) — interesting pattern: Agent used for external lookup, not just code tasks

---

### W7-c3bae9c6 — deckhand / heavy / DEBUG.feature_debug

**Registry**: BUILD → **Actual**: DEBUG

Ecamm scene switching debug session — verifying implementation, investigating why camera scenes don't change, resolving CSS conflict. 15 Edits, 11 Bash, 16 Read in 14 minutes.

**Key observations**:

- **Large file (140KB) but only 55 events** — file size is driven by large terminal output pastes in user prompts (pasted error output, nrd command output, `stayts` command output)
- 3 frustration signals in 7 prompts: 'nothing is changing on my ecamm? why', 'main camera is not working', 'why is it clashing?' — feature debug frustration pattern
- Cross-session reference: 'did we implement the code that is in the ecamm skill in the deckhand app?' — bookend verification of prior session's work
- CSS conflict discovered at end of session (unresolved) — session ends mid-investigation
- `debug.feature_debug` subtype: debugging newly-integrated feature code, not regressions
- Session is technically BUILD + DEBUG hybrid but DEBUG dominates because primary question is "why doesn't this work"

---

### W7-7a146e68 — flihub / heavy / BUILD.build_campaign

**Registry**: BUILD → **Actual**: BUILD (confirmed)

/ralphy campaign session. B042 (Regen Chapters removal) fixed, /critique run on Manage page, AGENTS.md created for manage-page-redesign wave. Edit-heavy with Playwright verification.

**Key observations**:

- **First confirmed BUILD.build_campaign in W7** — all 3 Ralphy-mode signals confirmed: /ralphy skill invocation + IMPLEMENTATION_PLAN.md access + Agent subagent calls
- Task-notifications from subagents appear as `user_prompt` events (lines 94, 97) — Ralphy's async pattern of injecting agent results
- ToolSearch called twice before /critique invocation — discovery before use, not a gap
- Playwright (5 calls) used for visual UI verification, not testing — confirms established pattern
- 3 distinct phases despite /ralphy orchestration: quick fixes → critique → planning docs
- Git commit in bash commands confirms feature delivery: 'fix: remove Regen Chapters button (B042)'
- Only 3 human prompts for 77 events — Ralphy maximally autonomously drives the workflow

---

### W7-1dda164f — app.supportsignal.com.au / marathon / PLANNING.architecture_planning

**Registry**: BUILD → **Actual**: PLANNING

SupportSignal v2 architecture planning. 26 prompts, 22 Writes, 1209min wall clock (128 active). Topics: RBAC/ABAC auth, Cerbos, data models, agent-friendly design. Closes with explicit handover.

**Key observations**:

- **Classic PLANNING.architecture_planning**: Opens with v1 status check, pivots to v2 design. All deliverables are planning docs, not product features.
- **22 Write calls is unusual** — driven by JSON structural documents + render script + OVERVIEW.md. High write count doesn't mean BUILD.
- Voice artifacts causing corrections: 'JSOM' for 'JSON', 'co-late' for 'collate', 'Ronnie' for 'Rony' (client name). Third one is a quality issue — Claude should catch client name misspellings.
- **Cerbos jargon introduced without explanation** — user explicitly confused: 'I don't really understand the term'. Claude failure mode: using unfamiliar technical terms without definition.
- 5 idle gaps totalling 1081 min — session spans an entire work day with breaks. 128 active minutes of real work.
- Closes with explicit handover: 'Can you hand over everything we've been doing in this window for another conversation?' + ToolSearch + Skill. This session is an `initiator` in a planning chain.

---

## Wave-Level Patterns

### BUILD misclassification rate: 8/9 (89%)

Only 1 of 9 sessions was genuinely BUILD. The other 8:

- 2 abandoned/incomplete (micro junk)
- 1 OPERATIONS (ansible)
- 1 SYSOPS (shell config)
- 1 SKILL (skill documentation)
- 1 KNOWLEDGE (template adaptation)
- 1 MIXED (research + sysops)
- 1 DEBUG (feature debugging)
- 1 PLANNING (architecture)

This confirms wave 6 finding: micro/light sessions are almost never BUILD (0%), and BUILD accuracy below moderate scale remains near zero.

### Voice dictation artifacts — hardware names are high-risk

New category of voice artifact: **product/hardware name misfires**.

- 'stream dates' → Stream Deck
- 'dick' → deck
- 'Ralph Williams' → Ralphy
- 'JSOM' → JSON
- 'Ronnie' → Rony (client name)

Hardware and product names are particularly vulnerable because they're uncommon words with no phonetic correction path.

### Template adaptation as a recurring workflow

vOz → Lars template adaptation (`fd6cb997`) matches an established workflow: reading one client's communication templates and generating equivalent versions for a new client. This is KNOWLEDGE work (synthesising existing knowledge into new form), not BUILD.

Suggested detector: CWD = known client dir + writes going to a different client dir = `knowledge.template_adaptation`.

### Handover brief as cross-session implementation driver

`ac9d117b` shows a refined pattern: a structured handover brief (with markdown table, insertion location, exact change spec) is pasted into a session to drive implementation. This is more structured than a simple cross-session reference — it's a formalized "implementation ticket" passed between sessions.

This pattern has appeared before (W1-03 advisory review, W3-08 cross-paste) but this is the most structured form: brief formatted explicitly as machine-readable implementation spec.

### Session chain: initiator → continuation

`1dda164f` closes with explicit handover, making it an `initiator` in a planning chain. The follow-on session would be `continuation`. This end-of-session handover capture pattern (`context_capture` closing style) is a reliable `initiator` signal.

---

## New Subtypes Proposed

| Subtype                          | Evidence                                         | Session     |
| -------------------------------- | ------------------------------------------------ | ----------- |
| `orientation.abandoned_start`    | Incomplete prompt, session dies immediately      | W7-38579dc4 |
| `operations.infra_question`      | Single ansible question, truncated               | W7-a9605418 |
| `sysops.shell_config`            | SSH alias creation in .oh-my-zsh/custom          | W7-24adc102 |
| `skill.skill_update`             | Edit targeting SKILL.md with structured brief    | W7-ac9d117b |
| `knowledge.template_adaptation`  | Reads one client's templates, writes for another | W7-fd6cb997 |
| `mixed.research_then_sysops`     | Orientation → research → file rename             | W7-ca8ef6a7 |
| `debug.feature_debug`            | Newly integrated feature not working as expected | W7-c3bae9c6 |
| `planning.architecture_planning` | Multi-day planning doc creation for v2 system    | W7-1dda164f |

`build.campaign` (W7-7a146e68) is confirmed from prior waves — not new.

---

## Quality Notes

- Pre-computed shapes from w7-03.json used for all sessions — eliminated manual counting errors
- `c3bae9c6` 140KB file size anomaly confirmed: large terminal pastes in prompts, only 55 actual events
- `skill_invocations` field in shapes returns `[{}]` (empty dict) when skill name not captured — name extraction needs fix in compute-session-shape.py
- `a9605418` registry `last_active` differs from JSONL capture — sessions sourced from `transcript` may have partial event captures
