# Findings: W2-17 — prompt-ss (59aedbad)

## Classification

- **Registry**: BUILD / mixed (256KB)
- **Analysed type**: build.iterative_design
- **Confidence**: high
- **Reasoning**: This is a sustained build session where David iteratively designs and debugs AWB (Agent Workflow Builder) UI features through a tight conversation loop. It spans 20 user prompts (17 real, 3 compaction summaries), 299 tool calls, and ~3.5 hours of active work. The session covers feature implementation (Output Files panel, resume flow), UX design iteration (colour contrast, toolbar hierarchy, human labels), live bug fixing (FliHub resume, UX button hiding, parallel step stuck), and concludes with a Ralphy test campaign plan. The heavy Edit count (49), heavy Playwright usage (38 browser interactions), and 3 context compactions confirm this is a long-running iterative build session, not orientation or research. The opening question about "recent changes" to AWA workflow resumption was answered through code exploration and immediately pivoted to building.

## Session Shape

- Events: 319 (299 tool_use, 20 user_prompt)
- Tools used: Bash (105), Read (62), Edit (49), Grep (26), mcp\_\_playwright (38 total: click 18, screenshot 10, snapshot 5, navigate 4, console 1), Agent (7), ToolSearch (5), Skill (3), Glob (2), Write (2)
- Duration: ~3h40m active (11:39 to 15:05 UTC), plus an 8-hour gap before final "commit & push" at 23:18
- User prompts: 17 real prompts + 3 compaction summaries
- Opening style: exploratory question (voice-transcribed)
- Context compactions: 3 (at lines 138, 201, 280) — session exhausted context window three times
- Closing ceremony: "can we commit & push" — minimal, no session naming

### Skills

- **Skill** (line 55, 11:57): Invoked immediately after David chose "option A" for Output Files panel placement. Likely a recipe or context skill.
- **Skill** (line 235, 13:15): Invoked during the test coverage audit section. Based on context, this is likely `/ralphy` (Ralph Wiggum test campaign skill).
- **Skill** (line 314, 15:05): Invoked near the very end of the session, likely a commit-related skill.

### Prompt Timeline

| #   | Time  | Prompt                                                                             | Gap    |
| --- | ----- | ---------------------------------------------------------------------------------- | ------ |
| 1   | 11:39 | "What are the recent changes we've done to allow the resumption of Awa workflows?" | —      |
| 2   | 11:57 | "I like option A."                                                                 | 18 min |
| 3   | 12:10 | Design feedback paste — action the AWB colour contrast fixes                       | 13 min |
| 4   | 12:12 | "Let you go on the toolbar hierarchy. Be ready to undo."                           | 2 min  |
| 5   | 12:18 | "Use the MCP server. Look at the three colour areas."                              | 6 min  |
| 6   | 12:30 | "end, step, pending don't tell me anything useful"                                 | 12 min |
| 7   | 12:32 | "Make the fix, but also: what decisions do I need to remember?"                    | 2 min  |
| 8   | 12:36 | [COMPACTION 1 — 14,415 chars]                                                      | 4 min  |
| 9   | 12:37 | "Trigger descriptions on same line, right-aligned"                                 | 1 min  |
| 10  | 12:40 | FliHub resume bug report (new data vs resume banner)                               | 3 min  |
| 11  | 12:43 | DEV/UX button bug report                                                           | 3 min  |
| 12  | 12:45 | Resume not working — provides incoming JSON data                                   | 2 min  |
| 13  | 12:48 | "Why would FliHub be stripping anything? Isn't the idea verbatim?"                 | 3 min  |
| 14  | 12:58 | "How good is our unit test and scenario system?"                                   | 10 min |
| 15  | 13:02 | "You deleted the visual highlighter" — UX ring highlight correction                | 4 min  |
| 16  | 13:10 | [COMPACTION 2 — 17,033 chars]                                                      | 8 min  |
| 17  | 14:35 | "Do you want to do it in a Ralph Wiggum look?"                                     | 85 min |
| 18  | 14:41 | "option a" (chose pure test campaign)                                              | 6 min  |
| 19  | 14:46 | [COMPACTION 3 — 14,017 chars]                                                      | 5 min  |
| 20  | 23:18 | "can we commit & push"                                                             | 8h 32m |

## Observations

1. **Three context compactions in one session**: This session hit the context limit three times, generating detailed compaction summaries each time. The compaction summaries themselves (14-17K chars each) are highly structured with 9 sections including "Primary Request and Intent," "Key Technical Concepts," "Files and Code Sections," "Errors and Fixes," and "Pending Tasks." This is a significant signal for session complexity — it indicates the session was doing dense, varied work that filled context quickly.

2. **Voice-transcribed design critique**: Prompts 6, 10, 11, 12, 15 are clearly voice input — conversational, stream-of-consciousness, with verbal corrections. David uses voice to explain what he sees in the UI and what feels wrong, then expects Claude to translate that into code fixes. The voice style is distinctively different from his typed prompts (which are terse: "I like option A", "option a").

3. **Playwright MCP as design verification loop**: 38 browser interactions (click, screenshot, snapshot, navigate) show a pattern where Claude makes code changes, then immediately verifies them via Playwright. David explicitly requested this at prompt 5: "use the MCP server." This becomes the primary verification mechanism for the rest of the session — edit, reload, screenshot, assess.

4. **Design micro-corrections**: David provides detailed but impressionistic design feedback. He explains things like "end, step, pending don't tell me anything useful" and "when you click UX, the developer area disappears" — user-level observations that require Claude to diagnose root causes and implement fixes. Claude initially overcorrected on the UX button (removed panel visibility entirely instead of just removing the highlight), and David caught it: "You deleted the ability to see the visual highlighter."

5. **Inline bug discovery during design work**: While doing UI design iteration, David discovered the FliHub resume bug (prompt 10-13). The session seamlessly absorbed this tangent — going from colour contrast fixes to debugging the intake route's handling of `currentStepId`, fixing `peekPendingIntake()`, and resolving the "one step back" off-by-one error. Then returned to design work.

6. **Ralphy test campaign planned**: After all the build work, David asked about test coverage (prompt 14) and then invoked `/ralphy` to plan a test campaign (wui-round21-tests). The output was IMPLEMENTATION_PLAN.md and AGENTS.md covering 5 work units across 4 waves. This is the build-then-heal pattern also seen in W2-11.

7. **8-hour gap before final commit**: The last real work ended at ~15:05. David returned at 23:18 to commit and push — a same-day cleanup, probably end-of-evening. No further changes were made.

8. **No session naming**: Despite a long, complex session with 3 compactions, David never used `/rename`. The registry shows `name: null`. This is a missed opportunity for session resumption tracking.

9. **Seven Agent tool calls**: Background agents were used, primarily in the Ralphy test campaign planning phase (lines 285-296, 4 of 7 calls) and during the Expand button investigation and DataPanel redesign.

10. **Key files modified**: Based on the compaction summaries, the primary targets were `WizardShell.jsx` (toolbar, DataPanel, resume flow, banner logic) and `StepRenderer.jsx` (OutputFilesPanel, right panel styling, UX ring highlight). Server-side: `intake.js` (currentStepId handling, peek-intake route) and `intake-state.js` (peekPendingIntake).

## Patterns Found

- **Design-debug-design loop**: David alternates between aesthetic design feedback and functional bug reports within the same session. The Playwright MCP bridges both — it can verify colour changes and functional flow. This interleaving is natural in UI-focused sessions.
- **Voice-to-code translation**: David's voice prompts describe problems impressionistically ("it's just odd", "I don't find this very useful the way it is"). Claude must translate these into specific code changes. When Claude's interpretation is wrong, David corrects verbally and Claude adjusts. This is a distinctive interaction pattern worth tracking.
- **Compaction-as-architecture-document**: The three compaction summaries collectively form a detailed architecture document of the AWB WUI system (component structure, state management, theme token inventory, intake route contract). This is an unintentional but valuable byproduct of long sessions.
- **Build-then-heal tail**: Same pattern as W2-11. After completing feature work and bug fixes, the session pivots to project hygiene (test coverage audit, Ralphy campaign planning).
- **Overcorrection-and-catch**: Claude made a broad fix (removed panel visibility on UX toggle) when a narrow fix was needed (visual highlight only). David caught and corrected it. This pattern — AI overreaches, human catches the semantic error — is worth tracking as a quality signal.

## New Types or Subtypes Proposed

- **build.iterative_design**: A build session characterized by tight design iteration loops with visual verification (Playwright MCP), voice-driven design critique, and inline bug fixing. Distinguished from `build.campaign` by the absence of pre-planned work units and the presence of real-time aesthetic feedback driving implementation. The tool profile (high Playwright + high Edit + voice prompts) is distinctive. This session is the archetype.

## Subtype Candidates Confirmed

- **build.iterative_design** (proposed above): Signal fingerprint is Edit-heavy + Playwright-heavy + voice prompts with design critique + inline bug tangents + no pre-planned task list. Confidence: high. This session is the first clear example.

## Type Correction

- **Registry said**: BUILD / mixed
- **Actual**: build.iterative_design
- **Why**: The registry's BUILD classification is correct at the top level — this session edits product code, fixes bugs, and commits. But "mixed" as a tool_pattern undersells the session's character. The tool pattern is actually dominated by Edit (49) + Playwright MCP (38) + Read (62), with the Playwright interactions being the distinctive feature. The session is iterative design — a rapid loop of change, verify visually, get feedback, adjust. The "mixed" tool pattern likely came from the spread across Bash/Read/Edit/Grep/Playwright without any single tool exceeding ~35%.

## Interest Level

high — This session is rich in several dimensions: (1) it demonstrates the Playwright MCP as a design verification tool in a sustained loop, (2) the voice-to-code translation pattern is distinctive and shows how David naturally communicates design intent, (3) three context compactions in one session is an edge case worth understanding, (4) the inline bug discovery pattern (resume flow found while doing colour fixes) shows how real work sessions are non-linear. The AWB theme contrast analysis and Tailwind token audit are substantive technical content. Good candidate for understanding long-running iterative UI development sessions.
