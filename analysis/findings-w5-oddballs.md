---
type: analysis
title: 'Findings W5 Oddballs'
description: 'Wave 5 oddballs: 10 sessions from non-standard CWD (home, monorepo root, tmp, worktrees) — building session classification rules.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# W5-oddballs Findings: Structural Oddball Sessions

**Wave**: W5-oddballs
**Date**: 2026-03-22
**Sessions analysed**: 10 (unusual project directories: home dir, monorepo root, dev parent, tmp, worktrees)

## Purpose

Classify 10 sessions from non-standard CWD locations. These are the sessions the classifier handles worst because their CWD does not map cleanly to a project. The goal is to understand the taxonomy of oddball sessions and produce classification rules.

## Summary

Of 10 oddball sessions:

- **2 are SYSOPS** (external drive management, git global config)
- **2 are OPERATIONS** (directory trust/permissions, file sync across machines)
- **2 are ORIENTATION** (monorepo exploration, project inventory lookup)
- **1 is RESEARCH** (hardware release date web search)
- **1 is META** (AngelEye skill restructuring + observer fixes, mislabelled as "unknown")
- **1 is REVIEW** (SupportSignal mock data review, CWD is worktree artefact)
- **1 is junk** (single "x" keystroke in /private/tmp)

### Key Taxonomic Findings

**Home dir sessions are NOT always SYSOPS.** They split:

- D01: SYSOPS (external drive dedup/cleanup) -- classic sysadmin task
- D02: OPERATIONS (Claude Code permissions config) -- tool configuration, not system admin

**Monorepo root (`ad`) sessions are always ORIENTATION or RESEARCH:**

- D03: RESEARCH (M5 Mini release date) -- pure web search, zero file interaction
- D04: ORIENTATION (Brand Dave directory exploration) -- discovering what exists

Neither is BUILD. The monorepo root is where David goes when he does not yet know which project to enter.

**`dev` parent directory sessions split SYSOPS vs OPERATIONS:**

- D07: SYSOPS (global gitignore setup) -- system-level config
- D08: OPERATIONS (cross-machine rsync) -- file management with frustration

**`unknown` project sessions need file-touch inference:**

- D05: Actually an AngelEye session (CWD = angeleye, file edits in angeleye). The "unknown" label in the task description was wrong; the shape shows `cwd: /Users/davidcruwys/dev/ad/apps/angeleye`. This is META (AngelEye working on itself).
- D06: Also AngelEye CWD, editing `~/.claude/settings.json`. This is SETUP (Claude Code settings configuration).

**`tmp` is always junk:**

- D09: Single "x" character, zero tools. Accidental launch or smoke test.

**`worktrees` CWD is always incidental:**

- D10: SupportSignal prompt engineering work. The CWD landed inside `.claude/worktrees/` but all file touches are in the SupportSignal worktree. Real project is SupportSignal.

## Classification Rules Derived

1. **CWD = home dir + Bash-heavy + external drive paths** -> SYSOPS / drive_maintenance
2. **CWD = home dir + editing ~/.claude/ or settings** -> OPERATIONS / tool_configuration
3. **CWD = monorepo root + WebSearch only** -> RESEARCH / hardware_research or general_web_query
4. **CWD = monorepo root + Bash exploring dirs** -> ORIENTATION / project_inventory
5. **CWD = dev parent + git config commands** -> SYSOPS / git_configuration
6. **CWD = dev parent + ssh/rsync commands** -> OPERATIONS / cross_machine_sync
7. **CWD = tmp + micro session** -> junk (always)
8. **CWD = worktrees + file touches elsewhere** -> is_cwd_incidental=true, attribute to file-touch project
9. **"unknown" project label** -> re-derive from CWD path; if CWD is a real project path, the registry label is wrong

## Per-Session Analysis

### D01: 02437ab7-17de-4964-846e-c53d207dd5be

- **Prompt**: "do you have the abilit to see my external hardrive, it has the name T7"
- **CWD**: `/Users/davidcruwys` (home dir)
- **Events**: 61 (13 user prompts, 48 tool uses)
- **Duration**: 93 min active
- **Tools**: Bash(43), Read(3), Edit(1), TaskOutput(1)
- **Classification**: SYSOPS / drive_maintenance
- **Opening**: voice_dictation (typos: "abilit", "hardrive", "coppied")
- **Closing**: abrupt_abandon (last events are Bash cleanup commands, no explicit close)
- **Tool profile**: operational_scripting (43 Bash commands, running checksums, du, find, rm)
- **Project attribution**: incidental -- CWD is home dir, real work is on /Volumes/T7
- **Session scale**: moderate (61 events, 93 min)
- **Predicates**:
  - P01 is_feature_construction: false (no product code)
  - P02 has_frustration_signals: false (cooperative flow, David says "yes go ahead" multiple times)
  - P03 is_multi_phase: true (Phase 1: discover dupes, Phase 2: checksums, Phase 3: delete/reorganize)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true (CWD is ~, work is on T7)
- **Disposition**: active
- **Interest**: high -- reveals David's backup/cleanup workflow, multi-machine context
- **Notes**: Three-phase session: (1) discover external drive, (2) compare three backup folders for duplicates using checksums, (3) delete dupes and reorganize folder hierarchy. Voice-dictated throughout. Also includes SSH alias setup for MacBook Pro M4 mid-session (a brief tangent). The Edit(1) was for ~/.zshrc to add ssh-macbook alias.

### D02: 4053fd5c-6163-4af5-8411-03137f1d28fd

- **Prompt**: "I'd like you to make David Cruwys, the director you're in, always available and trusted"
- **CWD**: `/Users/davidcruwys` (home dir)
- **Events**: 21 (2 user prompts, 19 tool uses)
- **Duration**: 4 min
- **Tools**: Bash(7), Glob(4), Read(3), Edit(2), WebFetch(2), Agent(1)
- **Classification**: OPERATIONS / tool_configuration
- **Opening**: voice_dictation (says "director" meaning "directory", natural speech transcription artefact)
- **Closing**: abrupt_abandon (ends with Edit, no explicit close)
- **Tool profile**: mixed (web research + local config editing)
- **Project attribution**: incidental -- CWD is home dir, editing Claude Code trust settings
- **Session scale**: light (21 events, 4 min)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: true (user is frustrated by permission dialogue popping up)
  - P03 is_multi_phase: false (single task)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true
- **Disposition**: active
- **Interest**: medium -- reveals voice-dictation UX patterns and Claude Code configuration workflow
- **Notes**: User wants to suppress the trust/permissions dialogue for the home directory. Claude researches `--dangerously-skip-permissions` flag and trust settings. Second prompt pastes terminal output showing the dialogue. WebFetch used to look up Claude Code docs. Voice-dictated: "director" = "directory", common speech-to-text error.

### D03: 22b1033f-5b25-4c43-a749-0376f8ae591d

- **Prompt**: "when is the m5 mini planned to be released?"
- **CWD**: `/Users/davidcruwys/dev/ad` (monorepo root)
- **Events**: 8 (3 user prompts, 5 tool uses)
- **Duration**: 9 min
- **Tools**: WebSearch(4), WebFetch(1)
- **Classification**: RESEARCH / hardware_research
- **Opening**: conceptual_question
- **Closing**: abrupt_abandon (last tool is WebSearch, no close)
- **Tool profile**: search_heavy (only web search tools, zero file interaction)
- **Project attribution**: incidental -- monorepo root is just where the terminal was open
- **Session scale**: micro (8 events)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: false
  - P03 is_multi_phase: false (single topic, escalating questions)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true
- **Disposition**: active
- **Interest**: low -- general hardware curiosity, no coding relevance
- **Notes**: Three questions about Apple M5 chip release timeline, rollout order, and M5 vs M4 comparison. Pure web research session. Voice-dictated (typo: "mimi" for "mini" in third prompt). CWD is monorepo root but session has zero file interaction.

### D04: 2aa2b5d7-81b3-4982-9d71-9cab54fae639

- **Prompt**: "What do you know about Brand Dave? What are all the directories related to Brand Dave, and what is all the stuff related to Dent? And the chaos method."
- **CWD**: `/Users/davidcruwys/dev/ad` (monorepo root)
- **Events**: 16 (2 user prompts, 14 tool uses)
- **Duration**: 6 min
- **Tools**: Bash(13), Task(1)
- **Classification**: ORIENTATION / project_inventory
- **Opening**: conceptual_question (multi-part question about brand structure)
- **Closing**: abrupt_abandon (ends with Bash listing git remotes)
- **Tool profile**: operational_scripting (13 Bash commands exploring directories)
- **Project attribution**: reliable -- monorepo root is the correct CWD for this exploration
- **Session scale**: light (16 events, 6 min)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: false
  - P03 is_multi_phase: false (single exploratory sweep)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: false (monorepo root is correct for cross-project inventory)
- **Disposition**: active
- **Interest**: medium -- reveals David's mental model of Brand Dave vs Dent vs Chaos Method
- **Notes**: User asks about Brand Dave ecosystem, then follows up asking for git remote URLs for every directory found. All 13 Bash commands are `git remote -v` or `ls` in various directories. Task(1) was likely a parallel directory scan. This is a genuine orientation session where monorepo root is the right CWD.

### D05: bbc86dc1-5776-4545-9d13-bd05dda100cd

- **Prompt**: (first visible prompt at event 50: "check this? Say the quick brown fox jumped over the lazy")
- **CWD**: `/Users/davidcruwys/dev/ad/apps/angeleye`
- **Events**: 77 (11 user prompts, 52 tool uses, 11 stops, 1 subagent)
- **Duration**: 782 min wall clock, 28 min active (754 min idle gap)
- **Tools**: Bash(24), Read(17), Edit(6), Glob(2), Skill(1), Write(1), Agent(1)
- **Classification**: META / tool_self_improvement
- **Opening**: skill_invocation (session starts with empty prompt + Skill call)
- **Closing**: context_capture (subagent writes SESSION_HANDOVER.md)
- **Tool profile**: build_focused (Edit/Write on angeleye code + skill restructuring)
- **Project attribution**: reliable -- CWD is angeleye, file edits in angeleye code
- **Session scale**: moderate (77 events, 28 active min)
- **Note on "unknown" label**: The task description listed this as project "unknown", but both CWD and file touches confirm this is AngelEye. The registry source is "hook" (not "transcript"), which may explain why project was not extracted.
- **Predicates**:
  - P01 is_feature_construction: true (edits to ObserverView.tsx, angeleye-data.ts, hooks.ts)
  - P02 has_frustration_signals: true ("It looks like I see stuff from your session but not the other session" -- data not appearing)
  - P03 is_multi_phase: true (Phase 1: skill restructuring into subdirectories, Phase 2: observer/data fixes, Phase 3: handover document)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: true (references "the other session")
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false (8 stops suggest Claude awaited permission)
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: false
- **Observations**:
  - frustration_analysis: Mild frustration at event 53 -- data from another session not visible in observer view
  - phase_breakdown: (1) Events 0-11: Skill restructuring (moved angeleye skill files into subdirectories), (2) Events 12-49: Observer UI and data service fixes, (3) Events 50-56: Testing, (4) Events 57-75: Handover via subagent
  - session_chain: References another concurrent session, suggesting multi-window workflow
- **Disposition**: active
- **Interest**: high -- AngelEye self-referential session with genuine feature work and handover ceremony
- **Notes**: This is a rich session. The first visible user prompt ("check this? quick brown fox") is a voice-input test at event 50, but the session had substantial automated/hook-triggered work before that. The skill restructuring moved `~/.claude/skills/angeleye/install.md` and `name-session.md` into proper subdirectories. Registry cleared (`echo '{}' > ~/.claude/angeleye/registry.json`). Subagent wrote SESSION_HANDOVER.md. The 754-min idle gap divides the session into two work windows.

### D06: ebd170c5-3e3d-476b-ba10-b49a2e5f3cc7

- **Prompt**: (empty/null -- no first_real_prompt captured)
- **CWD**: `/Users/davidcruwys/dev/ad/apps/angeleye`
- **Events**: 8 (3 user prompts, 3 tool uses, 2 stops)
- **Duration**: 5 min
- **Tools**: Read(2), Edit(1)
- **Classification**: SETUP / claude_settings_config
- **Opening**: bare_task_ref (empty prompt, immediately reads skill file)
- **Closing**: abrupt_abandon (ends with Edit, no close)
- **Tool profile**: read_only (2 reads, 1 edit on settings.json)
- **Project attribution**: unreliable -- CWD is angeleye but edits are on ~/.claude/settings.json
- **Session scale**: micro (8 events)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: false
  - P03 is_multi_phase: false
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true (angeleye CWD, but editing ~/.claude/settings.json)
- **Disposition**: active
- **Interest**: low -- tiny settings tweak
- **Notes**: Reads angeleye SKILL.md and ~/.claude/settings.json, then edits settings.json. Likely adjusting Claude Code settings related to AngelEye skill. The empty prompts suggest this was triggered via hook or the user typed very short instructions. Registry still shows status "active" but the session is from March 15 -- likely stale.

### D07: 32566acd-40e0-4251-bc88-0afe1a6fa9aa

- **Prompt**: "git config --global core.excludesfile ... do we have this config in place?"
- **CWD**: `/Users/davidcruwys/dev` (dev parent dir)
- **Events**: 9 (3 user prompts, 6 tool uses)
- **Duration**: 5 min
- **Tools**: Bash(4), Read(1), Write(1)
- **Classification**: SYSOPS / git_configuration
- **Opening**: context_loading_paste (user pastes code snippet with question)
- **Closing**: bookend_close (ends with Write to ~/.gitignore_global -- task complete)
- **Tool profile**: operational_scripting
- **Project attribution**: incidental -- dev parent dir is not a project
- **Session scale**: micro (9 events, 5 min)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: false
  - P03 is_multi_phase: false (single task)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true (dev/ is not a project)
- **Disposition**: active
- **Interest**: low -- routine git config
- **Notes**: User pastes gitignore setup commands, asks if already configured. Claude checks, adds .DS_Store to global gitignore, then user pastes a fuller gitignore template which Claude writes to ~/.gitignore_global. Clean, task-complete session.

### D08: 67c6f182-1d27-4001-860f-f96045cebbc6

- **Prompt**: "What did we do with my sites directory? Where is it now? Do I have a new one as of today as well?"
- **CWD**: `/Users/davidcruwys/dev` (dev parent dir)
- **Events**: 32 (8 user prompts, 24 tool uses)
- **Duration**: 147 min wall clock, 46 min active
- **Tools**: Bash(18), Read(4), Glob(1), Skill(1)
- **Classification**: OPERATIONS / cross_machine_sync
- **Opening**: keyword_orientation (searching for a directory)
- **Closing**: abrupt_abandon (last Bash is rsync attempt, unclear if it completed)
- **Tool profile**: operational_scripting (heavy Bash, SSH, rsync)
- **Project attribution**: incidental -- dev/ is the parent of all projects
- **Session scale**: moderate (32 events, 46 active min)
- **Predicates**:
  - P01 is_feature_construction: false
  - P02 has_frustration_signals: true ("Why are you asking me this? Why don't you know how to find this? Check the brains folder first.")
  - P03 is_multi_phase: true (Phase 1: find sites dir locally, Phase 2: SSH to MBP to find it, Phase 3: rsync back)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: true ("What did we do with my sites directory?" implies prior session context)
  - P07 has_skill_gap_signal: true (Claude does not know how to SSH to MBP, user has to correct it)
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true
- **Observations**:
  - frustration_analysis: Clear frustration at event 20 -- user upset that Claude cannot find the SSH config and doesn't check brains/ first. This is a skill gap: Claude should know about the multi-machine setup from brains/ documentation.
  - skill_gap: Claude fails to locate SSH alias for MacBook Pro. User says "MBP is not this machine; it's you go to SSH into." Brains folder has machine-roles.md but Claude did not check it proactively.
  - session_chain: "What did we do with my sites directory?" references a prior session where the directory was moved/reorganized.
- **Disposition**: active
- **Interest**: high -- reveals multi-machine workflow friction and knowledge gap about SSH aliases
- **Notes**: David is looking for a `sites` directory that was moved in a prior session. Claude searches locally, fails, then David tells it to SSH to the MacBook Pro. Claude does not know the SSH alias. Eventually finds it in brains/. Then attempts rsync to sync the directory to the M4 Mini. The Skill(1) call is likely the `remote-machines` skill. This session demonstrates a real pain point: cross-machine file management.

### D09: 7536c619-1622-43cd-88ba-06d39e16731a

- **Prompt**: "x"
- **CWD**: `/private/tmp`
- **Events**: 1 (1 user prompt, 0 tool uses)
- **Duration**: 0 min
- **Tools**: (none)
- **Classification**: META / accidental_launch
- **Opening**: bare_task_ref (single character)
- **Closing**: abrupt_abandon
- **Tool profile**: conversational (no tools)
- **Project attribution**: incidental
- **Session scale**: micro (1 event)
- **All predicates**: false
- **Disposition**: junk
- **Interest**: none
- **Notes**: Single "x" keystroke from /private/tmp. Either testing Claude Code installation or accidental launch. Registry already marks is_junk=true.

### D10: ae3beefe-3ff7-48f3-bef4-ca9064cdd11b

- **Prompt**: "/Users/davidcruwys/dev/clients/supportsignal/prompt.supportsignal.com.au/.claude/worktrees/ralphy-wui/poem/workflows/new-incident/mock-data/incidents\\ Can you just look through any of the narratives..."
- **CWD**: `/Users/davidcruwys/dev/clients/supportsignal/prompt.supportsignal.com.au/.claude/worktrees`
- **Events**: 23 (5 user prompts, 18 tool uses)
- **Duration**: 24 min
- **Tools**: Read(7), Bash(6), Edit(3), Task(1), Glob(1)
- **Classification**: REVIEW / mock_data_review
- **Opening**: paste_handover (pastes full file path + review request)
- **Closing**: abrupt_abandon (ends with Bash rsync/cp back to main branch)
- **Tool profile**: mixed (Read for review, Edit for modifications, Bash for file ops)
- **Project attribution**: unreliable -- CWD is .claude/worktrees/ but real project is SupportSignal
- **Session scale**: light (23 events, 24 min)
- **Predicates**:
  - P01 is_feature_construction: false (reviewing/editing mock data, not product code)
  - P02 has_frustration_signals: true (mild -- "You did not update the wrong incidents per se, but..." and "Actually, maybe I'm wrong")
  - P03 is_multi_phase: true (Phase 1: review narratives for risk, Phase 2: inject risk into mock data, Phase 3: investigate prompt structure, Phase 4: backport to main)
  - P04 has_brain_file_writes: false
  - P05 has_playwright_calls: false
  - P06 has_cross_session_refs: false
  - P07 has_skill_gap_signal: false
  - P08 has_unauthorized_edits: false
  - P09 is_compaction_resume: false
  - P10 is_cwd_incidental: true (CWD is inside .claude/worktrees/, real project is SupportSignal)
- **Observations**:
  - cwd_mismatch: CWD is `.claude/worktrees` but all file touches are inside the ralphy-wui worktree under SupportSignal's prompt app. The worktree directory is an implementation detail of `claude --worktree`, not a meaningful project location.
- **Disposition**: active
- **Interest**: medium -- SupportSignal NDIS incident mock data, risk/severity classification review
- **Notes**: David opens Claude from inside a git worktree and asks it to review NDIS incident narratives for signs of self-harm, high risk, and severity. Then asks Claude to inject risk signals into specific incidents. Then investigates why the prompt workflow is not generating questions for event phases. Finally backports worktree changes to main branch. The CWD in .claude/worktrees/ is the classic worktree CWD artefact -- the session should be attributed to SupportSignal.

## Proposed New Subtypes

- `sysops.drive_maintenance` -- external drive cleanup/dedup
- `operations.tool_configuration` -- Claude Code settings/permissions
- `research.hardware_research` -- hardware release date lookups
- `orientation.project_inventory` -- "what directories exist for X?"
- `meta.tool_self_improvement` -- AngelEye/Claude working on its own tooling
- `setup.claude_settings_config` -- editing ~/.claude/settings.json
- `sysops.git_configuration` -- global git config changes
- `operations.cross_machine_sync` -- rsync/scp between machines
- `meta.accidental_launch` -- junk sessions from tmp or single-char prompts
- `review.mock_data_review` -- reviewing test/mock data for correctness

## Taxonomy of Oddball CWDs

| CWD Category                  | Count | Typical Session Types | is_cwd_incidental                                  |
| ----------------------------- | ----- | --------------------- | -------------------------------------------------- |
| Home dir (`~`)                | 2     | SYSOPS, OPERATIONS    | always true                                        |
| Monorepo root (`ad/`)         | 2     | ORIENTATION, RESEARCH | sometimes (true for research, false for inventory) |
| Dev parent (`dev/`)           | 2     | SYSOPS, OPERATIONS    | always true                                        |
| App dir mislabelled "unknown" | 2     | META, SETUP           | false (CWD is correct, label was wrong)            |
| `/private/tmp`                | 1     | junk                  | always true                                        |
| `.claude/worktrees/`          | 1     | Real project work     | always true                                        |

### Rule: When is CWD incidental?

CWD is incidental when the session's file touches and commands operate on a different location than the CWD. Key signals:

1. **Home dir CWD + Bash commands referencing specific paths** -> incidental
2. **Dev parent CWD + SSH/rsync to remote machines** -> incidental
3. **Monorepo root + only web search, no file touch** -> incidental
4. **Monorepo root + ls/find exploring subdirectories** -> NOT incidental (CWD is correct for exploration)
5. **Worktree CWD** -> always incidental (worktree path is an implementation detail)
6. **tmp CWD** -> always incidental (and likely junk)
