# Findings: W2-02 — digital-stage-summit-2026 (699cab47)

## Classification

- **Registry**: BUILD / mixed
- **Analysed type**: build.campaign
- **Ralphy mode**: Build (Extend variant)
- **Confidence**: high
- **Reasoning**: This is genuine BUILD. The session opens with `/ralphy`, gets a status report (Wave 2 complete), then immediately enters Extend mode for Wave 3. Four parallel background agents (A-D) execute implementation tasks: sync server routes, swagger fix, chokidar watcher, ScriptSyncView client updates. Files are created, edited, and tested. A second burst fixes runtime bugs and resolves BLOCKERs from quality audits. The Ralphy mode is Build (specifically "Extend" — extending existing capability), not Plan or Requirements. TaskCreate bursts via background agents and Write/Edit-heavy tool usage confirm this is execution, not design.

## Session Shape

- Events: 228
- Tools used: Read (84), Bash (36), Edit (31), Glob (10), Agent (8), Write (5), Grep (1), ToolSearch (1), Skill (1) — total 177 tool invocations
- Duration: ~2.5 hours active (04:26 to 06:50), session_end at 07:00 (idle timeout)
- Opening style: command (`/ralphy`)
- Turns (user prompts): 17 (9 genuine, 8 task-notification callbacks)
- Subagents: 8 (1 research, 4 Wave 3 build agents A-D, 3 quality audit agents)
- Skills invoked: `/ralphy` (first prompt), 1 additional Skill tool call at 06:38 (likely recipe or similar)
- Closing ceremony: conversational handover — user asks "give me the handover" for next session

## Observations

1. **Ralphy Extend mode**: The user asks "Is this a plan or a build?" and Claude responds "Extend -> Build" — the plan already exists from Wave 2, so this session extends the implementation. This is the Ralphy Extend variant, which is clearly BUILD. The user explicitly uses the phrase "Go into extend."
2. **Two-burst pattern with ~2h gap**: Burst 1 (04:26-04:45, ~19 min) is the Wave 3 build campaign with 4 parallel agents. Burst 2 (06:25-06:50, ~25 min) starts when the user reports a runtime bug, triggers quality audits, fixes BLOCKERs, and prepares a handover. The ~100-minute gap between bursts is the user testing the delivered feature.
3. **Wave-within-wave structure**: The Ralphy campaign calls its internal phases "Wave 1" and "Wave 2" within the project's overall "Wave 3." Wave 1 deploys Agents A+B (server-side), Wave 2 deploys Agents C+D (client-side + watcher). This hierarchical wave naming could cause confusion in analysis.
4. **Quality gate failure pattern**: The user returns after testing to report a runtime error. They explicitly challenge: "you are also not doing unit tests, because how did this come through?" This triggers 3 parallel audit agents (architectural review, code quality, test quality). The code quality audit returns "damning" results — 2 BLOCKERs and 3 MAJORs. The user asks Claude to document the failure in a "plugin issues" file for the Ralphy plugin to learn from.
5. **Self-assessment request**: The user asks Claude to write an assessment of "why you screwed up and what went wrong" into the AppyDave plugins docs folder. This is a meta-feedback loop — the user is using Claude to improve Claude's own tooling.
6. **Provenance chain as domain concept**: The digital-stage-summit-2026 project has a "provenance chain" for syncing script files from a brain/source-of-truth to the app. The user asks to see this chain and later asks to add a file path to it. This is a domain-specific concept within this project.
7. **Voice transcription pervasive**: Multiple prompts show speech patterns ("Go into extend. Please extend the capability", "Do we have the code quality, the unit test quality, and the architect agent being utilised in the Ralph Wiggum loop?"). "Ralph Wiggum loop" = Ralphy loop.
8. **Handover closing**: The session ends with the user asking for a conversational handover rather than using `/capture-context`. Claude fixes BLOCKERs, then writes a handover summary. This is a distinct closing pattern from skill-based capture.
9. **Rapid agent turnaround**: The 4 Wave 3 build agents complete in 5-11 minutes each. The 3 audit agents complete in under 3 minutes. Background agent orchestration is efficient here.
10. **Cross-tool reference**: The user mentions wanting to add a file from `template/.claude/skills/recipe/references/appydave-palette.md` into the provenance chain — showing awareness of the AppyStack template's skill structure while working in a consumer app.

## Patterns Found

- **Extend-then-audit cycle**: Build via parallel agents, user tests, reports bugs, triggers audit agents, fix BLOCKERs, handover. This is a complete quality loop within a single session.
- **User-as-QA**: The ~2h gap between bursts is the user manually testing the delivered feature. The bug report is direct human QA, not automated testing.
- **Plugin self-improvement feedback**: Asking Claude to write a "plugin issues" document about its own failure for the Ralphy plugin to consume. Meta-level tooling improvement.
- **Conversational handover vs /capture-context**: This session uses a natural-language handover request instead of a skill-based context capture. Both achieve the same goal but the conversational style gives the user more control over what gets included.

## New Types or Subtypes Proposed

- None new. This session confirms **build.campaign** — a Ralphy Build/Extend session with parallel agent execution, quality gates, and bug fixing. It is a textbook multi-wave build campaign.

## Subtype Candidates Confirmed

- **build.campaign** (new subtype not in the existing candidate list): A Ralphy-orchestrated build session with parallel background agents executing a wave plan. Distinguished from `build.migration` by being greenfield feature work rather than reactive schema changes.

## Interest Level

high — Demonstrates the full Ralphy Build/Extend lifecycle including the failure mode (quality gate catching bugs the agents missed). The self-assessment feedback pattern (writing plugin issues for Ralphy to learn from) is a novel meta-improvement loop worth tracking. Rich example of the two-burst build-then-debug pattern with user-as-QA in between.
