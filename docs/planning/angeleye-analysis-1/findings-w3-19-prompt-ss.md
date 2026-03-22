# Findings: W3-19 — prompt-ss (05ce5c2a)

## Classification

- **Registry**: BUILD / bash-heavy (137KB)
- **Analysed type**: build.iterative_design
- **Confidence**: high
- **Reasoning**: This is a sustained UI build session on the POEM OS WUI (Web UI Interface) for SupportSignal's `prompt.supportsignal.com.au`. David works through the Display Manifest highlight/inspect feature across ~15 hours (13:44 UTC Feb 26 to 05:03 UTC Feb 27, with a large overnight gap). The session contains 24 user prompts (21 real + 3 compaction summaries), 325 tool calls, two explicit worktrees (`wui-highlight-inspect`, `wui-template-modal`), and multiple git commits. The registry said BUILD/bash-heavy, but Bash (142) is inflated by worktree creation and git operations — the real work is a tight Read/Edit loop (78 Reads, 84 Edits) plus Bash for build/lint checks and worktree management. This is `build.iterative_design` rather than a bash-heavy scripting or automation session.

## Session Shape

- Events: 349 total (325 tool_use, 24 user_prompt)
- Tools used: Bash (142), Edit (84), Read (78), Grep (13), Glob (4), Skill (2), Task (2)
- Duration: ~2.5h active work (13:44–16:13 UTC), ~11h gap, then 10 min cleanup (04:59–05:03 UTC next day)
- User prompts: 21 real prompts + 3 compaction summaries
- Opening style: large structured session-context block (the POEM OS continuation pattern)
- Context compactions: 2 (at lines ~240 and ~285, corresponding to prompts 9 and 15)
- Closing ceremony: "commit this" → "git pull" → "untracked files?" → "yes commit them"

### Worktrees Used

- `wui-highlight-inspect` — created during lines 48–65, used for the DEV/UX ring overlay implementation
- `wui-template-modal` — created during lines 167–169, used for the TemplatePreview modal promotion

### Skills Invoked

- **Skill** (line 330, 16:10 UTC): Invoked during the end-of-session commit phase. Likely the commit skill.
- **Skill** (line 2, 13:44 UTC): Invoked at session start, likely a context-loading skill.

### Prompt Timeline

| #   | Time (UTC) | Prompt                                                                                                                                                                                                              | Gap      |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | 13:44      | [Large session context block — Display Manifest campaign complete, highlight/inspect feature designed but not built]                                                                                                | —        |
| 2   | 13:53      | "How do I run the dev server from my command line? Keeping in mind that I think you are working in a work-stream."                                                                                                  | 9 min    |
| 3   | 14:00      | "But that doesn't really make any sense. That seems like a flaw in your own original designs..." [pushback on hard-coded sections not being manifest-controlled]                                                    | 7 min    |
| 4   | 14:01      | "yes, implement that fix"                                                                                                                                                                                           | 1 min    |
| 5   | 14:06      | "Is the store inspector a new concept that we added? I don't remember seeing it that way before. And what makes it different to the session data in the footer?"                                                    | 5 min    |
| 6   | 14:08      | "I am happy for you to remove the footer session data. But I know there was something on the right before, so what have we lost?"                                                                                   | 2 min    |
| 7   | 14:11      | "I need you to highlight them for me because I'm not exactly sure what I'm looking at yet. Just give them a red colour so I can see them..." [also asks about YAML hot-reload]                                      | 3 min    |
| 8   | 14:19      | "So I am expecting you to remove the footer inspector. So the template fields model badge has been added. Is there something similar to that...?"                                                                   | 8 min    |
| 9   | 14:28      | [COMPACTION 1 — session continued from previous context]                                                                                                                                                            | 9 min    |
| 10  | 14:45      | "Are you using terminology that matches the cells that you're colouring? Because I'm trying to figure out what you're talking about by looking at the coloured boxes with the labels."                              | 17 min   |
| 11  | 14:49      | "go with option A"                                                                                                                                                                                                  | 4 min    |
| 12  | 15:28      | "Why do you constantly ignore my requests? About keeping the development areas panels in the development section. This must be the third or fourth conversation we've had around this..." [frustrated escalation]   | 39 min   |
| 13  | 15:35      | "I see the prompt template opens okay, but I think you got rid of the interpolated vs non-interpolated capability that we used to have."                                                                            | 7 min    |
| 14  | 15:43      | "Can you swap the panels around so that the output fields are on top of that?"                                                                                                                                      | 8 min    |
| 15  | 15:47      | [COMPACTION 2 — session continued from previous context]                                                                                                                                                            | 4 min    |
| 16  | 15:49      | "commit this"                                                                                                                                                                                                       | 2 min    |
| 17  | 15:49      | "With the store state, it has subkeys. Is there any way that they can be rendered in the drop-down rather than JSON?"                                                                                               | <1 min   |
| 18  | 15:53      | "I just want to let you know that for the YouTube launch optimizer, I've asked about five or six times to get text areas involved. And it always tells me it's done, but it never is..." [frustrated UX regression] | 4 min    |
| 19  | 15:58      | "We make our panel even wider again." [voice transcription artefact: "wqWe"]                                                                                                                                        | 5 min    |
| 20  | 16:02      | "Can you go look at the date/time on the new incident? It's on the first step. Can you make it optional?"                                                                                                           | 4 min    |
| 21  | 04:59      | "commit this"                                                                                                                                                                                                       | ~11h gap |
| 22  | 04:59      | "You can meet everything we're going to do. Git pulled." [voice transcription: likely "commit everything we're going to do, git pull"]                                                                              | <1 min   |
| 23  | 05:01      | "I've still got untracked files. What's going on here?"                                                                                                                                                             | 2 min    |
| 24  | 05:02      | "yes commit them"                                                                                                                                                                                                   | 1 min    |

## Observations

1. **Two compaction events, same session architecture as W2-17**: This session hit the context limit twice (prompts 9 and 15), generating detailed continuation summaries. This is a marker of a long, dense build session. The compaction summaries follow the same structured format seen in W2-17 (chronological analysis with numbered points). The pattern is consistent: David's POEM OS WUI work reliably exhausts context within a single active period.

2. **"bash-heavy" misclassification in registry**: Bash (142 calls) is the highest tool count, but the majority are worktree management (git worktree add, npm install, build checks, port checks) and dev-server interaction, not scripting work. The real productive work is the Read/Edit loop (78 + 84 = 162 combined). The registry's `bash-heavy` tag was applied at ingestion time based on raw count — this is a known weakness of the simple tool_pattern classifier when worktrees inflate Bash. Actual subtype is `build.iterative_design`.

3. **Two worktrees for two features**: The session opened a `wui-highlight-inspect` worktree for the DEV/UX ring overlay feature, then later opened a `wui-template-modal` worktree for the TemplatePreview modal promotion. Using multiple worktrees within a single session is a more advanced pattern — it keeps feature branches isolated while David and Claude switch between design concerns.

4. **Recurring alignment failure around panel placement**: Prompt 12 contains explicit frustration: "Why do you constantly ignore my requests? About keeping the development areas panels in the development section. This must be the third or fourth conversation we've had around this." This is a cross-session persistent failure — Claude repeatedly restructures panel layout incorrectly. The pattern: David specifies a design constraint; Claude acknowledges it; Claude then violates it again on the next edit. This is not a single-session failure but a multi-session drift problem.

5. **Voice-transcribed prompts with artefacts**: Prompts 2, 3, 5, 7, 10, 12, 13, 17, 18, 19 are clearly voice-transcribed (conversational phrasing, mid-sentence course corrections, verbal hedging). Prompt 19 has a visible artefact ("wqWe make our panel even wider again") — a keystroke bleed before voice input. Prompt 22 is likely mis-transcribed ("You can meet everything" → "commit everything" or "you can commit everything"). These artefacts are consistent with David dictating while looking at the screen.

6. **Cross-workflow frustration reported**: Prompt 18 is notable — David pivots mid-session to report a different workflow (YouTube launch optimizer) where text area changes never stick. This is not a coding request but a meta-complaint about repeated failures across multiple sessions. It suggests a pattern where David is tracking failures across sessions but Claude does not have persistent cross-session memory of what was actually changed vs. what was said to be changed.

7. **Session context block as continuation protocol**: Prompt 1 is the large structured block — a continuation handoff with explicit sections for "Working On," "Current State," "Key Decisions Made," "Important References," "Active Files," "What We Ruled Out," "Gotchas / Watch Out For," "What's Next," and "How to Resume." This is a sophisticated prompt engineering pattern: David has built a session continuation protocol that encodes the full working context. The fact that this session still needed two compactions suggests the initial context block takes significant tokens before any work begins.

8. **YAML hot-reload question (prompt 7)**: David asks whether changing the display YAML hot-reloads. This is an orientation question mid-build — he doesn't yet understand the live-reload behaviour of the manifest system he helped design. This is common in long multi-session campaigns where implementation details drift from design memory.

9. **11-hour gap before final commit**: Active work ended around 16:13 UTC. David returned at 04:59 UTC the next day to commit. The "I've still got untracked files" exchange suggests the previous commit attempt missed files — probably worktree artefacts or generated files that weren't staged. Claude identified and committed them on the second pass.

10. **No session naming**: Despite complexity (2 compactions, 2 worktrees, ~15h span), `name: null` in registry. Session was never `/rename`d. This is a consistent pattern in David's POEM OS sessions.

## Patterns Found

- **Compaction as session boundary marker**: Two compaction events divide the session into three identifiable phases: (1) initial highlight/inspect feature build with worktree setup, (2) dev-panel placement controversy and template refactor, (3) small refinements and commit ceremonies. Each compaction is followed by Claude reconstructing context before continuing — but the reconstruction is imperfect (the panel placement constraint was lost at least once).

- **Persistent design constraints not surviving compaction**: The panel placement rule ("development panel areas belong in the development section") was stated multiple times across this session and previous sessions, yet it continues to be violated after compactions. This suggests that design constraints stated in conversation are not durable — they need to be encoded in a file (CLAUDE.md, MEMORY.md, or a project design doc) to survive context resets.

- **Multi-worktree build sessions**: Using 2 worktrees in a single session is more organized than single-branch editing but introduces coordination overhead (npm install in each worktree, separate build checks). The Bash inflation in tool counts is a side effect of this coordination.

- **Voice-driven UX feedback loop (without Playwright)**: Unlike W2-17 which used Playwright MCP for visual verification, this session has no Playwright calls. David's UX feedback is purely verbal ("highlight them for me", "I don't know what I'm looking at"). This means the verification loop is: David runs the dev server manually → looks at the browser → gives voice feedback → Claude edits. The absence of Playwright makes the feedback loop more opaque and increases the chance of Claude misinterpreting what David is seeing.

- **Commit ceremony fragmentation**: The end-of-session commit required 4 prompts: "commit this" → git pull confusion → untracked files discovery → "yes commit them." This fragmentation is common when leaving a session overnight and returning cold — the working state is partially committed, partially staged, and David has to reconstruct what needs to go in.

## New Types or Subtypes Proposed

None — this session confirms `build.iterative_design` as established in W2-17. The absence of Playwright and presence of double-worktree workflow are variations within that type, not a new type.

## Type Correction

- **Registry said**: BUILD / bash-heavy
- **Actual**: build.iterative_design
- **Why**: Bash count is inflated by worktree setup and git operations (not scripting/automation). The true work pattern is iterative UI edits driven by verbal design feedback, which is `build.iterative_design`. The registry classifier counts raw tool invocations without distinguishing productive Bash (scripting) from administrative Bash (git/npm/build checks).

## Interest Level

medium-high — This session is interesting for three reasons: (1) the cross-session panel placement failure (prompt 12) is a concrete example of design constraints not surviving context resets, and is worth capturing as a learnable pattern; (2) the double-worktree approach within a single session is a useful workflow pattern to document; (3) the session-context continuation block (prompt 1) is a sophisticated prompt engineering pattern that might be worth extracting as a template. The session is less technically rich than W2-17 (no Playwright, no Ralphy campaign, no inline bug tangents) but has cleaner signal on the compaction/drift problem.
