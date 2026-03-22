# Findings: W2-12 — app.supportsignal.com.au / BMAD PRD creation (dc3e550b)

## Classification

- **Registry**: BUILD / mixed
- **Analysed type**: KNOWLEDGE / knowledge.skill_authoring (with ORIENTATION opening)
- **Registry challenged**: yes — BUILD is incorrect. No product source code was written. The entire session produced a single knowledge artifact: a PRD document (`_bmad-output/planning-artifacts/prd.md`) and a readiness report. The session used the `bmad-create-prd` skill workflow (steps 1-12) to co-author a planning document through facilitated elicitation. The project_dir is SupportSignal but no application code exists yet (greenfield). The output is a BMAD planning artifact, not product code. The `first_edited_dir` pointing to `.claude/skills/bmad-help` reinforces the skill/knowledge nature.
- **Confidence**: high
- **Reasoning**: The session opened with `/bmad-help` (an orientation skill invocation), then transitioned to the `bmad-create-prd` workflow. All 42 Edit operations target `prd.md` — a markdown planning document, not source code. The 2 Write operations created `prd.md` (from template) and `implementation-readiness-report-2026-03-16.md`. No application files were created or modified. The tool pattern is Read (60) + Edit (42) + Glob (25) + Bash (24) — but the Bash calls are directory listings for the subagent, not build/compile/test operations. The session is a human-AI co-authoring workflow for a BMAD planning artifact, which falls under knowledge work. The skill_authoring subtype fits because the output is a structured document produced via a skill workflow with a defined step sequence.

## Session Shape

- Events: 232 (158 tool_use, 34 user_prompt, 34 stop, 2 subagent_start, 3 subagent_stop, 1 session_end)
- Tools: Read x60, Edit x42, Glob x25, Bash x24, Write x2, Agent x2, Grep x2, Skill x1 — total 158
- Duration: ~6 days wall clock (2026-03-16T03:29 to 2026-03-22T03:12), but this is misleading
- Active time: ~4 hours across 3 work windows on March 16, plus 2 brief returns on March 18 and 20
- User prompts: 33 real (1 task-notification excluded)
- Opening style: skill invocation (`/bmad-help`)

### Skills

- **bmad-help**: Invoked as first prompt. Orientation skill — scanned BMAD config, listed available phases and workflows, recommended entry points.
- **bmad-bmm-create-prd**: Invoked as second prompt. Multi-step PRD creation workflow (12 steps). This was the main work of the session.
- **bmad-check-implementation-readiness**: Invoked near end (P30). Created a readiness report document.
- **bmad-help** (via Skill tool, P31): Re-invoked to show next steps after PRD completion.

### Phase Structure

Five phases across three calendar days:

1. **Orientation** (03:29 - 03:30, ~1 min): `/bmad-help` invocation. Claude scanned BMAD config, found no existing artifacts, presented the phase menu. David chose to create a PRD.

2. **PRD Creation — Steps 1-10** (03:34 - 05:43, ~2h 9m): The main work. David and Claude walked through the `bmad-create-prd` workflow steps: init, project discovery, vision, executive summary, success criteria, user journeys, domain requirements, innovation analysis, SaaS B2B requirements, scoping, functional requirements, non-functional requirements, and polish. David provided substantive domain input at each step. 9 single-char prompts ("c" or "a") advanced the workflow. 6 correction prompts refined Claude's drafts. One subagent dispatched for brownfield/greenfield re-evaluation.

3. **Polish and corrections** (10:14 - 14:06, ~2h with gaps): After a 4.5-hour break, David returned. Applied polish pass changes ("A" = accept all). Then a multi-prompt correction sequence: evaluated additional planning docs (`business-capabilities.json`, `user-journeys.json`), corrected FR inconsistencies, resolved predicate dimension count (5 vs 7). Ran `bmad-check-implementation-readiness` and `/bmad-help` for next steps.

4. **Skill debugging** (Mar 18, 03:43 - 03:44, ~1 min): David returned 38 hours later to ask why `/Sally` doesn't work as a slash command. Claude dispatched a subagent to inspect the `.claude/skills/` directory structure and explained the directory-name-based skill registration system.

5. **Context recovery** (Mar 20, 02:24, <1 min): David asked "What was this conversation about?" — Claude provided a comprehensive summary. No closing ceremony; session ended passively on Mar 22.

## Observations

1. **The BMAD workflow drives the session structure**: The 12-step PRD workflow creates a highly structured conversation where single-char prompts ("c" for continue, "a"/"A" for accept) are workflow navigation commands, not conversational turns. 9 of 33 prompts are single-char workflow commands. The workflow creates a predictable Read-step -> present -> user-input -> Edit-prd cycle that repeats for each step.

2. **Voice transcription present but not dominant**: 4 prompts show the `▎` voice transcription marker (P13, P15, P16, P17). The remaining substantive prompts are typed — they contain precise FR numbers, structured corrections, and domain-specific language that would be unusual for voice input. The mixed input mode (voice for some domain answers, typed for corrections) suggests David was comfortable with both modes.

3. **Domain expertise is the user's primary contribution**: David's prompts provide deep NDIS domain knowledge that Claude cannot generate. Examples: the "worker relief moment" vision statement (P7), severity level naming correction from 5 to 4 levels (P11), compliance framing correction — "incident records are for quality care, not compliance" (P16), NDIS predicate dimension count correction 5 vs 7 (P26), AWB integration risk assessment (P18). The session is elicitation-heavy — Claude structures, David provides domain truth.

4. **Correction prompts are a dominant interaction pattern**: At least 7 of 33 prompts are explicit corrections to Claude's draft content. This matches the "assumption pivot" content type from the framework. The corrections range from factual (predicate count) to framing (compliance vs care-quality) to strategic (business targets). Claude accepts and applies all corrections without resistance.

5. **The session is a marathon with deliberate breaks**: Three work windows on March 16 (03:29-05:43, then 10:14-14:06), plus returns on March 18 and 20. The 4.5-hour gap between phases 2 and 3 is a deliberate pause (David needed to think about polish recommendations). The 38-hour gap before the skill-debugging question and the 47-hour gap before the context-recovery question suggest David was using this session as a bookmark.

6. **No closing ceremony**: Unlike many David sessions, there is no explicit "can I close it off now?" or "exit" prompt. The session drifts into inactivity — the last real work was March 18 (skill debugging), followed by a context-recovery question on March 20, then passive session_end on March 22. This is an atypical ending pattern.

7. **The "brownfield vs greenfield" correction is significant**: David caught that Claude initially classified SupportSignal v2 as brownfield (because the planning repo exists), but the target app repo has zero source code — it's greenfield. David dispatched a background agent to verify this. This correction changed the initialization state of the entire PRD.

8. **Duplicate prompt detected**: P23 and P25 contain identical text ("I work with your recommendation. Here's some extra information to help you. The two files are real..."). This appears to be David re-sending a prompt, possibly because the first response didn't apply the changes or because context was lost. This is a context-window re-sync pattern.

## Patterns Found

- **BMAD workflow-driven session**: The `bmad-create-prd` skill imposes a rigid 12-step structure that defines the session's shape. The single-char "c" prompts are workflow navigation, not user input. This creates a distinctive session signature: high prompt count (33) but low conversational density — many prompts are just "continue" commands. For prompt counting purposes, workflow navigation prompts should be categorized separately from substantive prompts.
- **Elicitation-heavy knowledge creation**: The session's primary value is extracting David's NDIS domain knowledge and structuring it into a PRD format. Claude acts as facilitator/scribe, David acts as domain expert. This is closer to `orientation.requirements` in interaction pattern but produces a written artifact, making it knowledge work in output.
- **Session-as-bookmark pattern**: The returns on March 18 (skill question) and March 20 (context recovery) are unrelated to the PRD work. David used the existing session as a convenient entry point for quick questions about the same project. This inflates session duration and prompt count without changing the session's primary purpose.

## New Types or Subtypes Proposed

- **knowledge.planning_artifact**: The session produces a structured planning document (PRD) through a facilitated workflow, not a brain file or skill file. The existing knowledge subtypes (brain_update, brain_ingestion, skill_authoring, skill_update, pattern_design) don't quite fit because the output is a project planning artifact in `_bmad-output/`, not in brains or skills directories. A planning_artifact subtype would capture BMAD PRD/architecture/design document creation sessions.

## Subtype Candidates Confirmed

- **orientation.cold_start**: The opening `/bmad-help` invocation fits this subtype for the first 1-minute phase only. It is not the session type — it is a brief orientation phase before the real work begins.
- **knowledge.skill_authoring** (closest existing): The session uses a skill workflow to produce a structured document. The skill_authoring subtype is the closest match because the output is a templated, multi-step knowledge artifact. But the fit is imperfect — skill_authoring implies creating a skill, not using a skill to create a planning doc.

## Registry Correction

- **session_type**: BUILD -> KNOWLEDGE
- **tool_pattern**: mixed is acceptable (Read + Edit + Glob all significant)

## Interest Level

medium — The session demonstrates the BMAD workflow interaction pattern (elicitation-heavy, correction-driven, step-navigated), which is a distinctive and recurring session shape in David's work. The brownfield/greenfield correction and the domain expertise elicitation are good examples of assumption pivots. The session-as-bookmark pattern (returning days later for unrelated questions) is a useful finding for session boundary detection. Not a strong video content candidate on its own, but the BMAD PRD creation workflow could be instructive content for demonstrating the method.
