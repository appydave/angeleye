# Findings: W2-20 — flideck (d7ca10ed)

## Classification

- **Registry**: BUILD / bash-heavy (190KB)
- **Analysed type**: BUILD / build.migration (ralphy_mode_3)
- **Confidence**: high
- **Reasoning**: The session is a multi-day, multi-phase autonomous migration campaign. It opens by reading planning docs and invoking Ralphy Mode 2 to plan, then escalates to Mode 3 (autonomous coordinator loop). The work is migrating ~519 HTML presentation slides from iframe-based rendering to a web component / harness-shell system, using custom toolchain scripts (migrate-type-a.js, migrate-type-b.js) and a Playwright pixel-diff pipeline (pipeline.js) for verification. The registry classification of BUILD/bash-heavy is correct — the session is dominated by Bash tool invocations executing migration scripts, running Playwright verification, and managing dev servers.

## Session Shape

- Events: 524 (481 tool_use, 43 user_prompt)
- Tools used: Bash x265, Edit x102, Read x47, Agent x17, ToolSearch x14, Write x13, mcp**playwright**browser_navigate x7, mcp**playwright**browser_take_screenshot x6, Skill x5, Glob x4, TaskList x1
- Total tool invocations: 481
- Subagents: 17 Agent invocations — early phase used agents for parallel batch migrations, later for background cleanup tasks
- Duration: ~47 hours wall clock (2026-03-06 15:46 to 2026-03-08 14:29), across 7 work phases with overnight gaps
- User prompts: 43 (many are conversational/voice-transcribed, 4 are context continuation summaries)
- Context continuations: 4 (ran out of context window 4 times — extremely long session)
- Opening style: structured directive with doc references and skill invocation

### Skills

- **ralphy** (prompt 1, 15:46): Invoked as "Ralphy Mode 2" for implementation campaign planning. Read corpus-synthesis.md and architectural-decisions.md, then transitioned to Mode 3 (autonomous coordinator loop) on user command.
- **4 additional skill invocations** (02:05, 13:04, 13:26, 13:56): Later skill calls during cleanup and documentation phases.

### Prompt Timeline

| #     | Time               | Prompt (summary)                                                              | Gap    |
| ----- | ------------------ | ----------------------------------------------------------------------------- | ------ |
| 1     | 03-06 15:46        | "FliDeck harness migration. Read docs... run Ralphy Mode 2"                   | --     |
| 2     | 03-06 15:53        | "mode 3"                                                                      | 7 min  |
| 3     | 03-06 15:57        | "yes"                                                                         | 4 min  |
| 4     | 03-06 16:00        | "Let you run it in the order you think"                                       | 3 min  |
| 5     | 03-07 02:14        | Asks about running both application versions and port conflicts               | 10h    |
| 6     | 03-07 02:27        | Can you start the servers and deal with devops?                               | 13 min |
| 7     | 03-07 02:30        | Open that folder in VS Code                                                   | 3 min  |
| 8     | 03-07 02:31        | "What am I looking at with the diff highlight?"                               | 1 min  |
| 9     | 03-07 02:33        | "This is incredible. I'm loving looking at this" — asks about metrics         | 2 min  |
| 10    | 03-07 05:18        | "How long is this going to take?" (for video)                                 | 2.7h   |
| 11-12 | 03-07 23:23-23:26  | Same question repeated 3x (voice input duplication)                           | 18h    |
| 13    | 03-07 23:33        | Document how 3 windows are set up, then do the setup                          | 7 min  |
| 14    | 03-07 23:52        | Consider clearing context, get into Ralphy loop                               | 19 min |
| 15-16 | 03-08 00:02        | "Have we done any diffs yet?" / "What did the harness do for us?"             | 10 min |
| 17    | 03-08 00:03        | "I need 519 done. When is that coming?"                                       | 1 min  |
| 18-19 | 03-08 00:10, 00:34 | Context continuation summaries (compaction)                                   | --     |
| 20    | 03-08 01:19        | "I thought I was going to get slide-by-slide diffs"                           | 45 min |
| 21    | 03-08 01:29        | "Where did you write it to? results.json didn't get detail"                   | 10 min |
| 22    | 03-08 01:30        | "I want results.json updated. Run a background task."                         | 1 min  |
| 23    | 03-08 01:55        | "Can we close off everything? Merge and clean up."                            | 25 min |
| 24    | 03-08 02:00        | "Go for it."                                                                  | 5 min  |
| 25    | 03-08 06:50        | Context continuation summary                                                  | 4.7h   |
| 26    | 03-08 13:00        | "Can we work through B021?"                                                   | 6.2h   |
| 27    | 03-08 13:08        | "Why do we have a double up of all the slides?"                               | 8 min  |
| 28    | 03-08 13:20        | "Do you have access to the Playwright tests?"                                 | 12 min |
| 29    | 03-08 13:29        | "Your approach is fundamentally flawed. You haven't done what I told you."    | 9 min  |
| 30    | 03-08 13:49        | "Can we do that cleanup now?"                                                 | 20 min |
| 31    | 03-08 13:51        | "What about the no V2 counterpart?"                                           | 2 min  |
| 32    | 03-08 13:54        | "Run a deletion on the stuff we don't need"                                   | 3 min  |
| 33    | 03-08 13:58        | Context continuation summary                                                  | 4 min  |
| 34    | 03-08 14:01        | "You deleted the old slides used by the iframe. Is that the problem?"         | 3 min  |
| 35    | 03-08 14:02        | "Are we back to only one version, the newer one with manifest?"               | 1 min  |
| 36    | 03-08 14:03        | "All web components visually isolated from the harness" — understanding check | 1 min  |
| 37    | 03-08 14:04        | "Does this style block generate random CSS keys?" — web components question   | 1 min  |
| 38    | 03-08 14:09        | "Why didn't we use Web Components?" — rationale challenge                     | 5 min  |
| 39    | 03-08 14:15        | "Look at five slides from each presentation — web components better?"         | 6 min  |
| 40    | 03-08 14:22        | "Is everything checked in? Anything to document?"                             | 7 min  |
| 41    | 03-08 14:27        | "Execute on all of that."                                                     | 5 min  |

### CWD Distribution

- `/Users/davidcruwys/dev/ad/flivideo/flideck`: 310 events (59%)
- `/Users/davidcruwys/dev/ad/flivideo/flideck/playwright`: 133 events (25%)
- `/Users/davidcruwys/dev/ad/flivideo/flideck/.worktrees/harness-migration`: 81 events (15%)

## Observations

1. **Ralphy Mode 2 to Mode 3 escalation**: The session began with Ralphy Mode 2 (planning), then David immediately said "mode 3" to escalate to autonomous coordinator loop. This is the most extensive Ralphy Mode 3 session observed — running across 3 calendar days with 4 context window exhaustions. The autonomous loop executed phased migrations (Phase 3 through Phase 6) without user intervention for hours at a time.
2. **Voice-transcribed prompts throughout**: Many prompts show clear speech-to-text artifacts ("Her approach, while potentially okay, is fundamentally flawed", "How am I meant to run both versions", "Where the heck do we do solo deck"). These are conversational, sometimes rambling, with repeated prompts (prompts 10-12 are the same question sent 3x). The session has a strong exploratory, conversational quality despite being a BUILD session.
3. **User frustration and correction pattern**: David expressed frustration multiple times: "I need 519 done. When is that coming?" (prompt 17), "Your approach is fundamentally flawed" (prompt 29), "You deleted the old slides which were being used by the iframe" (prompt 34). These are course-correction moments where Claude's autonomous work diverged from user expectations.
4. **Playwright pixel-diff pipeline**: A core innovation of this session — a custom Playwright pipeline that screenshots original and migrated slides, computes pixel-level diffs, and categorizes results into quality tiers (perfect <0.1%, excellent 0.1-0.5%, good 0.5-1.0%, review 1-3%, fail >3%). David's reaction: "This is incredible. I'm loving looking at this."
5. **CSS token injection discovery**: The pipeline exposed that original slides used CSS custom properties (`--pain-red`, `--doc-blue`) defined only by the harness, not in the slides' own `:root`. The fix was `page.addStyleTag()` to inject tokens before screenshotting originals — a non-obvious insight that reduced false-positive diffs from 16-25% to near-zero.
6. **CORS blocker in Playwright**: An attempt to route original screenshots through harness-shell was blocked by browser CORS policy (different ports = different origins). This forced the `addStyleTag()` approach instead. A real debugging discovery, not predicted by planning.
7. **4 context continuations**: The session exhausted the context window 4 times. Each continuation carries a detailed summary of prior work. This is the longest observed session by context exhaustion count, indicating extraordinary session density.
8. **Worktree usage**: CWD shows 81 events in `.worktrees/harness-migration`, confirming Claude was using git worktrees to run the old and new application versions simultaneously on different ports for comparison.
9. **Web component architecture debate**: The session ends with a substantive architectural discussion. David asks why the migration used a harness/style-injection approach instead of true Web Components with Shadow DOM. This reveals David expected Shadow DOM isolation but the implementation used a different encapsulation strategy. The final prompts ("Look at five slides from each presentation — web components better?") show David evaluating the architectural decision retroactively.
10. **Closing ceremony**: The session ends with "Execute on all of that" — David instructed Claude to commit, document learnings, and finalize. The last events are Edit and Write operations (documentation updates) followed by Bash (likely git commit). No explicit session naming or `/rename`.
11. **Migration scale**: ~519 HTML slides across ~14 presentation decks. The pipeline processed massive batches: bmad-poem alone had 339 slides passing, 2 failing (anti-aliasing), 2 manual review. appystack had 35/35. The campaign reached Phase 6 (complex/Type C presentations) before the session ended.
12. **Agent subagents for parallel batch work**: 17 Agent tool invocations, concentrated in the early autonomous phase (9 within the first 42 minutes) for parallel batch classification and migration of multiple presentations simultaneously. Later agents handled background cleanup.

## Patterns Found

- **ralphy_mode_3_campaign**: Ralphy Mode 2 for planning, immediate escalation to Mode 3 for autonomous execution. The coordinator runs phased migrations without user input, using context continuations to survive window exhaustion. This is the canonical example of a long-running autonomous build campaign.
- **voice_frustration_correction**: Voice-transcribed prompts that express dissatisfaction ("fundamentally flawed", "you haven't done what I told you") followed by Claude adjusting course. The pattern is: autonomous work diverges, user intervenes with voice correction, Claude realigns. Appears 3 times in this session.
- **pixel_diff_verification**: Playwright pipeline screenshots original vs migrated, computes diff percentage, categorizes into quality tiers. This is a novel QA pattern for visual migration — the diff pipeline catches CSS token gaps, asset copy failures, and viewport-lock issues that code review would miss.
- **context_exhaustion_continuation**: Session uses 4 context continuations, each carrying a structured summary. The summaries preserve: primary request, technical concepts, files modified, errors and fixes, problem solving narrative, pending tasks. This is a user-level workaround for extremely long autonomous sessions.

## New Types or Subtypes Proposed

- None — `build.migration` captures this accurately. The Ralphy Mode 3 orchestration is a workflow pattern, not a session type.

## Subtype Candidates Confirmed

- **build.migration**: Confirmed. Signal: bulk file transformation (iframe to harness/web-component), custom toolchain scripts (migrate-type-a.js, migrate-type-b.js), verification pipeline (pipeline.js), phased execution plan with explicit implementation plan document.

## Type Correction

- **Registry said**: BUILD / bash-heavy
- **Actual**: BUILD / build.migration
- **Why**: The registry correctly identified BUILD. The tool_pattern "bash-heavy" is accurate (265 Bash calls, 51% of all tool invocations). The subtype refinement to build.migration reflects that this is not general-purpose building but a structured migration campaign with a planning phase, phased execution, and verification pipeline.

## Interest Level

high — This is the most extensive Ralphy Mode 3 session observed. It demonstrates: (1) autonomous multi-day build campaigns with 4 context continuations, (2) a novel Playwright pixel-diff verification pipeline for visual migration QA, (3) voice-transcribed user frustration and course-correction patterns, (4) real debugging discoveries (CSS token injection, CORS blockers), and (5) a substantive closing architectural debate (harness injection vs Web Components/Shadow DOM). Strong candidate for video content showcasing AI-assisted migration at scale.
