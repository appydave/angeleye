---
type: analysis
title: 'Findings W5 New Projects'
description: 'Wave 5 new projects: 7 sessions from first-seen projects (ad, ansible, appydave.com, beauty-and-joy, brain-cowork-upgrade, clients).'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# W5 Findings: New Projects Batch

**Wave**: W5 (new projects)
**Date**: 2026-03-22
**Sessions analysed**: 7 (from 7 never-before-seen projects)

## Purpose

Analyse sessions from projects not previously seen in waves 1-4: `ad` (monorepo root), `ansible`, `apps`, `appydave.com`, `beauty-and-joy`, `brain-cowork-upgrade`, and `clients`. These projects expand the classifier vocabulary and test whether existing subtypes cover David's full work pattern.

## Summary

| Wave ID | Project              | Type       | Subtype                 | Scale    | Interest  |
| ------- | -------------------- | ---------- | ----------------------- | -------- | --------- |
| W5-C01  | ad                   | SKILL      | skill_authoring         | light    | medium    |
| W5-C04  | ansible              | OPERATIONS | mac_provisioning        | moderate | high      |
| W5-C05  | apps                 | BUILD      | full_lifecycle_build    | heavy    | very-high |
| W5-C06  | appydave.com         | BRAND      | design_exploration      | moderate | high      |
| W5-C07  | beauty-and-joy       | BRAND      | brand_knowledge_capture | moderate | high      |
| W5-C08  | brain-cowork-upgrade | PLANNING   | brain_migration         | moderate | medium    |
| W5-C10  | clients              | OPERATIONS | repo_setup              | micro    | low       |

### Key Findings

1. **Registry misclassifications**: All 7 sessions were registered as BUILD by the registry. Only 1 (W5-C05) is actually BUILD. The registry's default-to-BUILD bias is severe for non-coding sessions.

2. **BRAND type confirmed as needed**: Two sessions (W5-C06, W5-C07) are pure brand work -- design mockups and product branding/menu planning. Neither fits BUILD, KNOWLEDGE, or RESEARCH well. BRAND is the right top-level type.

3. **New subtype: `brand.design_exploration`** (W5-C06): Mochaccino-driven rapid prototyping of 10 website design variants using subagents. The session uses 5 parallel subagents to produce designs, then reviews them with Playwright. This is a distinct pattern from build.ui_polish -- no production code is touched.

4. **New subtype: `brand.brand_knowledge_capture`** (W5-C07): Joy Juice brand session capturing menu recipes, pricing, taglines, branding.json schemas. Not knowledge management (that's about David's personal knowledge system); this is brand asset creation for a physical business.

5. **New subtype: `planning.brain_migration`** (W5-C08): Evaluating whether Anthropic's Claude Cowork productivity plugin is a better "second brain" than David's existing brains/ system. Involves copy scripts, gap analysis, and dashboard evaluation. Not BUILD (no app being constructed), not RESEARCH (actively migrating data).

6. **`ad` root monorepo sessions are SKILL, not BUILD** (W5-C01): CWD is the monorepo root, but the actual work is authoring a Claude Code skill (`capture-context`). The `ad` project attribution is incidental -- the skill lives in `appydave-plugins/`.

7. **`apps` directory sessions can be genuine BUILD** (W5-C05): This is a full lifecycle build of ThumbRack -- from business analysis through naming through AppyStack scaffold through Ralphy plan+build through Playwright UAT. The richest session in this batch by far: 238 events, compaction resume, playwright-driven UAT, and agent orchestration.

8. **Ansible project confirmed as OPERATIONS** (W5-C04): This aligns with the wave 3 rule: ansible = OPERATIONS, never BUILD. Session manages Homebrew cask/formula provisioning across 3 Macs (M4 Pro, M4 Mini, M2 Mini), runs dry-run playbooks, configures SSH keys.

---

## Per-Session Analysis

### W5-C01: a24496e0-ca60-44b3-8f7c-0755939c1b7b (ad)

**First prompt**: "Where do we keep our skills? What folder? I made a stuff we're working on and developing."

**What happened**: David asks where skills live in the monorepo. Claude finds them. David discusses the handover skill vs a more general "capture-context" skill. He asks Claude to build `capture-context` as a new skill using the skill-creator pattern. Claude writes it, installs it, commits, and pushes. After a 3-hour gap, David returns to debug a duplicate skill entry showing in another project (SupportSignal), then pushes the fix.

**Shape**: 40 events, 9 prompts, 28min active, 1 idle gap (3h10m). Tools: Bash 21, Read 3, Task 2, Skill 2, Glob 1, Write 1, Edit 1.

**Phase structure**:

- Phase 1 (07:17-07:36): Skill discovery, discussion, build `capture-context`, install, commit
- Phase 2 (10:47-10:57): Debug duplicate skill entry, push

**Classification**:

- C01 session_type: **SKILL** -- authoring a new Claude Code skill
- C02 session_subtype: **skill_authoring** -- creating `capture-context` skill from scratch
- C03 opening_style: **voice_dictation** -- informal phrasing, "I made a stuff we're working on"
- C04 closing_style: **commit_and_push** -- ends with "push it" and git push
- C05 tool_profile: **build_focused** -- Bash-heavy with Write/Edit for skill file creation
- C06 project_attribution: **incidental** -- CWD is `ad/` but work is in `appydave-plugins/`
- C07 session_scale: **light** -- 40 events, 28min active

**Predicates**:

- P01 is_feature_construction: false (skill authoring, not feature)
- P02 has_frustration_signals: false
- P03 is_multi_phase: true (two phases separated by 3h gap)
- P04 has_brain_file_writes: false
- P05 has_playwright_calls: false
- P06 has_cross_session_refs: true (references SupportSignal project seeing duplicate)
- P07 has_skill_gap_signal: false
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: true (work happens in appydave-plugins, CWD is ad/)

**Observations**:

- **cwd_mismatch**: CWD `/Users/davidcruwys/dev/ad` but last tool calls operate in `appydave-plugins/`. Project attribution "ad" is technically correct (monorepo root) but misleading.
- **session_chain**: Returns 3h later to debug a side-effect of the skill install in another project.

---

### W5-C04: b34be0e9-3a8e-42c5-965f-6bfcd10ba54f (ansible)

**First prompt**: "How many computers have I got set up with Ansible, and which is the most full-featured, and what do I do to make all three of them have similar capabilities?"

**What happened**: David is managing Ansible playbooks for his three Macs. Session covers: auditing current config across machines, adding Homebrew casks (Chrome, Docker, VSCode, WhatsApp, Teams, Ollama, Logitech Options Plus, etc.), removing M2/M4 diffs, setting up SSH keys for remote execution, running dry-run playbooks against the M4 Mini, adding machine-specific casks (Ecamm Live, Stream Deck for M4 Pro only), documenting decisions, adding Supabase/Ghostty/iTerm2, and verifying with a full dry run. Spans ~16h with two large gaps.

**Shape**: 131 events, 36 prompts, 119min active, 2 idle gaps (3h + 10.5h). Tools: Bash 33, Read 27, Edit 21, Glob 10, Write 3, Skill 1.

**Phase structure**:

- Phase 1 (08:48-09:58): Initial audit, cask additions, SSH setup, dry run, commit
- Phase 2 (13:02-13:42): Add supabase, ghostty, iTerm2; read architecture.json; add more casks
- Phase 3 (00:15-00:25): Final dry run, session summary

**Classification**:

- C01 session_type: **OPERATIONS** -- Ansible config management, not software development
- C02 session_subtype: **mac_provisioning** -- managing desired state of macOS machines
- C03 opening_style: **conceptual_question** -- "How many computers...which is the most full-featured?"
- C04 closing_style: **bookend_close** -- ends asking "what has this convo been about, break into list"
- C05 tool_profile: **build_focused** -- Read/Edit symmetry for config authoring
- C06 project_attribution: **reliable** -- CWD and all edits in agent-os/ansible
- C07 session_scale: **moderate** -- 131 events, 119min active

**Predicates**:

- P01 is_feature_construction: false (config management)
- P02 has_frustration_signals: false
- P03 is_multi_phase: true (3 phases over 16h)
- P04 has_brain_file_writes: false
- P05 has_playwright_calls: false
- P06 has_cross_session_refs: true (pastes analysis from another conversation about cask gaps)
- P07 has_skill_gap_signal: false (but SSH key setup is a learning moment)
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: false

**Observations**:

- **cross_session_refs**: David pastes formatted text from another conversation ("Casks Gap -- Instructions for all.yml" and "all.yml -- Looks great" analysis). This is a strong signal of multi-session workflow where analysis happens in one session and execution in another.
- **phase_breakdown**: Each phase ends with a commit or dry run. Clean operational workflow.
- **registry_mismatch**: Registry says BUILD; confirmed OPERATIONS as per wave 3 rule (ansible = OPERATIONS).

---

### W5-C05: cfa7f6a3-5e90-4bdd-bdc6-db2ab03428bb (apps)

**First prompt**: "Tell me a little bit about if I wanted to build an application..."

**What happened**: The richest session in this batch. Full lifecycle build of ThumbRack (image sequencer app):

1. **Business analysis** (01:37-02:08): David describes image reordering concept, discusses naming extensively (10 name candidates, meta-discussion about how to ask for names), settles on "ThumbRack"
2. **Requirements capture** (02:08-02:37): High-level requirements written in conversation
3. **AppyStack scaffold** (02:37-03:07): Uses `create-appystack` skill to scaffold RVETS monorepo
4. **Ralphy plan+build** (03:06-04:08): Plan mode (2) then Build mode (3) -- 12 work units across 4 agent waves
5. **Playwright UAT** (04:04-04:38): Human-style UAT using Playwright MCP tools. David corrects Claude: "you haven't used this application the way a human would"
6. **Bug documentation** (04:34-04:38): User tests, reports issues, documented as backlog
7. **Context compaction** (04:08): Full compaction summary captured as user_prompt
8. **Bug fixing** (06:43-06:47): Returns after 2h gap, fixes bugs found during UAT, continues Playwright testing

**Shape**: 238 events, 19 prompts, 184min active, 1 idle gap (2h5m). Tools: Bash 61, Edit 38, Read 29, Playwright 48 (browser_click 19, screenshot 8, navigate 7, type 5, fill_form 4, snapshot 3, press_key 1, console 1), Write 17, Agent 12, Glob 9, ToolSearch 4, Skill 1.

**Classification**:

- C01 session_type: **BUILD** -- genuine full-lifecycle application construction
- C02 session_subtype: **full_lifecycle_build** -- BA through scaffold through build through UAT in one session
- C03 opening_style: **voice_dictation** -- long informal description of desired app
- C04 closing_style: **abrupt_abandon** -- last event is tool_use (Bash), no closing ceremony
- C05 tool_profile: **build_focused** with **ui_audit** characteristics -- heavy playwright + build tools
- C06 project_attribution: **reliable** -- CWD starts at `apps/`, work moves to `apps/thumbrack/`
- C07 session_scale: **heavy** -- 238 events, 184min active, compaction detected

**Predicates**:

- P01 is_feature_construction: true (building ThumbRack from scratch)
- P02 has_frustration_signals: true ("you haven't used this application the way a human would" -- correcting UAT approach)
- P03 is_multi_phase: true (7+ distinct phases)
- P04 has_brain_file_writes: false
- P05 has_playwright_calls: true (48 Playwright tool calls -- highest in this batch)
- P06 has_cross_session_refs: false
- P07 has_skill_gap_signal: true (UAT approach correction -- Claude didn't understand human-style UAT)
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: true (1 compaction detected)
- P10 is_cwd_incidental: false

**Observations**:

- **frustration_analysis**: David's correction about UAT approach is the key moment: "UAT is User Acceptance Test Plans... you would have said that you opened the browser yourself and you used it. You haven't used this application the way a human would." This is a meta-learning moment about how Claude should approach manual testing vs automated E2E tests.
- **phase_breakdown**: Unusually rich -- 7 distinct phases (BA, naming, requirements, scaffold, build, UAT, bugfix) in a single session. Most sessions have 2-3 phases.
- **skill_gap**: The UAT-approach correction reveals a gap in Claude's understanding of manual vs automated testing. David expects Playwright MCP to be used for human-style clicking through the app, not writing test scripts.
- **ralphy_workflow**: Contains a complete Ralphy cycle (Plan mode 2, Build mode 3) with 12 work units across 4 agent waves. This is one of the clearest examples of the full Ralphy pattern.
- **compaction**: The compaction summary (event 148, line ~148) is one of the most detailed ever seen -- 9 numbered sections with code snippets, error analysis, and pending tasks.
- **new subtype proposed**: `build.full_lifecycle_build` -- covers the rare case where BA, naming, scaffold, build, test, and bug-fix all happen in a single session.

---

### W5-C06: b81e4057-b8f0-4328-940a-f0b9043bce59 (appydave.com)

**First prompt**: "Have you got any mock implementations of the API Dave website at the moment?"

**What happened**: David asks about existing website implementations. Claude finds the production Astro+React site. David asks whether it was built with Mochaccino (it wasn't -- it was built through BMAD workflow). Then David asks Claude to generate 5 new Mochaccino design variants of his website, open them in Chrome, review them with Playwright, self-critique, then produce 5 improved variants (10 total). Claude scaffolds 5 HTML mockups (v1-v5), spins up a Python HTTP server, views them with Playwright, then dispatches 5 parallel subagents to create v6-v10 as improvements of the originals. Ends with all 10 visible at `localhost:8787`.

**Shape**: 103 events, 8 prompts, 18min active, no idle gaps. Tools: Bash 19, Read 17, Write 11, Playwright 11 (navigate), Glob 7, Agent 5, Edit 3, Skill 1, ToolSearch 1. Source: **hook** (not transcript).

**Phase structure**:

- Phase 1 (10:22-10:25): Orientation -- what exists?
- Phase 2 (10:25-10:31): Generate v1-v5 Mochaccino mockups, open in Chrome
- Phase 3 (10:31-10:37): Playwright review of all 5, dispatch 5 subagents for v6-v10
- Phase 4 (10:34-10:37): Subagent completion, index page update, final Playwright review

**Classification**:

- C01 session_type: **BRAND** -- website design exploration, no production code touched
- C02 session_subtype: **design_exploration** -- rapid visual prototyping via Mochaccino
- C03 opening_style: **conceptual_question** -- "Have you got any mock implementations?"
- C04 closing_style: **bookend_close** -- ends with summary table of all 10 designs
- C05 tool_profile: **agent_orchestration** -- 5 parallel subagents + Playwright review
- C06 project_attribution: **reliable** -- CWD is appydave.com, all writes in `.mochaccino/designs/`
- C07 session_scale: **moderate** -- 103 events, but only 18min active (very dense)

**Predicates**:

- P01 is_feature_construction: false (design exploration, not feature build)
- P02 has_frustration_signals: false
- P03 is_multi_phase: true (4 phases)
- P04 has_brain_file_writes: false
- P05 has_playwright_calls: true (11 navigate calls for review)
- P06 has_cross_session_refs: false
- P07 has_skill_gap_signal: false
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: false

**Observations**:

- **hook_source**: This is the only session in this batch captured via hooks rather than transcript. Contains richer metadata (tool_summary, agent_id, last_message on stop events).
- **subagent_pattern**: 5 subagents dispatched in rapid succession (10:32-10:33), each creating one design variant. All complete within ~2.5min. Clean fork-join parallelism.
- **write_then_open**: 3 instances detected -- writes HTML files, opens in Chrome. Classic design exploration pattern.
- **density**: 103 events in 18 minutes = 5.7 events/minute. This is extremely dense, indicating heavy automation with minimal human interaction.

---

### W5-C07: e27dd3c2-59b6-422c-8ed6-dbb632f78347 (beauty-and-joy)

**First prompt**: "Just give me a brief understanding of the folders that we have here. And also a little bit about the brand and the different business units."

**What happened**: David explores the beauty-and-joy project structure, then dives deep into Joy Juice (Joy's juice shop opening the next day). The session covers:

1. Folder orientation and brand overview
2. Joy Juice brand exploration -- what the brand is, who the customers are
3. Processing a raw menu text file into structured data
4. Creating menu.json and branding.json with schemas
5. Thai vs Farang (Western) juice styles -- pricing (65 THB vs 75 THB), ingredients, philosophy
6. Brand taglines: "Your fruit, your way", feeling words (Aroy Makamak, etc.)
7. ChatGPT research import -- David pastes a long conversation from ChatGPT about menu structure
8. Schema design for menu/branding data structures
9. Thai language versions for NotebookLM rendering
10. Closing with capture-context skill invocation

**Shape**: 103 events, 28 prompts, 93min active, 1 idle gap (8.5h). Tools: Bash 26, Write 18, Read 14, TaskUpdate 8, TaskCreate 4, Skill 2, Edit 2, Agent 1.

**Phase structure**:

- Phase 1 (15:40-17:08): Brand orientation, menu processing, JSON/HTML rendering, Thai language
- Phase 2 (01:46-01:52): Import ChatGPT research, update schemas, capture context

**Classification**:

- C01 session_type: **BRAND** -- brand asset creation for physical business
- C02 session_subtype: **brand_knowledge_capture** -- capturing brand identity, menu structure, pricing for a juice shop
- C03 opening_style: **voice_dictation** -- "Just give me a brief understanding..."
- C04 closing_style: **context_capture** -- ends with Skill invocation (capture-context) and Bash
- C05 tool_profile: **synthesis** -- heavy Write (18), Read (14) for knowledge structuring
- C06 project_attribution: **reliable** -- CWD is beauty-and-joy, all work in joy-juice subdirectory
- C07 session_scale: **moderate** -- 103 events, 93min active

**Predicates**:

- P01 is_feature_construction: false (brand asset creation)
- P02 has_frustration_signals: true ("Then that took you a long, long time to find that information. I thought we were going to have a simple little brand document near the Joy Juice area")
- P03 is_multi_phase: true (2 phases separated by 8.5h gap)
- P04 has_brain_file_writes: false (writes are in project, not brains/)
- P05 has_playwright_calls: false
- P06 has_cross_session_refs: true (pastes ChatGPT conversation as input)
- P07 has_skill_gap_signal: false
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: false

**Observations**:

- **cross_platform_import**: David pastes a full ChatGPT conversation (~2400 chars) as a user prompt. This is a strong signal of multi-tool workflow where research happens in ChatGPT and structuring/storage happens in Claude Code.
- **real_world_urgency**: "We're opening the shop tomorrow" -- this session has real-world time pressure. The menu structure being built here is for a physical juice shop opening the next day.
- **bilingual_content**: Session involves Thai language content (Aroy Makamak, Lanna vs Farang terminology), which adds complexity to data structuring.
- **frustration_signal**: "That took you a long, long time to find that information" -- indicates Claude's search strategy for brand docs was suboptimal. David expected a brand document to exist near the joy-juice folder.

---

### W5-C08: 48465caa-8b11-4196-8490-92ac318c5640 (brain-cowork-upgrade)

**First prompt**: "I need you to come up with a plan of action on how you're going to solve a problem..."

**What happened**: David provides an extensive brief (2389 chars) about evaluating the Anthropic Claude Cowork productivity plugin as a potential replacement for his existing brains/ knowledge system. The plan involves:

1. Understanding the brain-cowork-upgrade folder
2. Researching the new Anthropic productivity plugin
3. Comparing the standard implementation (brain-cowork-fresh) with David's upgrade
4. Understanding how the dashboard HTML works
5. Importing David's existing brains into the upgrade system via non-destructive copy scripts
6. Gap analysis in both directions

Claude creates 5 tasks, builds copy scripts, migrates brain content, opens the dashboard in Playwright, takes a screenshot, and populates the memory system with David's current state (writes 14+ files in one batch).

**Shape**: 87 events, 6 prompts, 60min active, no idle gaps. Tools: Bash 20, Write 19, TaskUpdate 10, Edit 9, Read 7, Task 6, TaskCreate 5, Playwright 4 (navigate 3, screenshot 1), Skill 1.

**Phase structure**:

- Phase 1 (04:05-04:27): Planning, task creation, copy script, initial migration, documentation
- Phase 2 (04:57-05:06): Verify migration, dashboard review via Playwright, final improvements, populate memory with 14 files

**Classification**:

- C01 session_type: **PLANNING** -- evaluating a system migration path, not building production code
- C02 session_subtype: **brain_migration** -- migrating knowledge system between formats
- C03 opening_style: **voice_dictation** -- long dictated brief with nested requirements
- C04 closing_style: **memory_write** -- ends with massive batch of Write operations (14 memory files)
- C05 tool_profile: **operational_scripting** -- mix of Bash (scripts), Write (migration), Task (orchestration)
- C06 project_attribution: **reliable** -- CWD and all work in brain-cowork-upgrade
- C07 session_scale: **moderate** -- 87 events, 60min active

**Predicates**:

- P01 is_feature_construction: false (system evaluation/migration)
- P02 has_frustration_signals: false
- P03 is_multi_phase: true (2 phases)
- P04 has_brain_file_writes: true (14 files written to populate memory system)
- P05 has_playwright_calls: true (3 navigate + 1 screenshot for dashboard review)
- P06 has_cross_session_refs: true (references brain-cowork-fresh as comparison)
- P07 has_skill_gap_signal: false
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: false

**Observations**:

- **form_filling detected**: First prompt is 2389 chars, then 80% of remaining prompts are short confirmations. This matches the form_filling pattern where a detailed brief is followed by terse direction.
- **batch_write**: The final "populate the memory with my actual current state" triggers 14 Write operations in rapid succession -- this is the largest single-burst write in this batch.
- **evaluation_not_build**: Despite heavy file writes, this is not BUILD. The goal is evaluating whether the Cowork productivity plugin is better than David's existing brains system. The copy scripts and migration are means to that evaluation.

---

### W5-C10: eef93c68-39fe-4d92-91aa-ee1528dde126 (clients)

**First prompt**: "How many client directories do I have, and which ones have repositories? What would be the pattern for repositories if the ones that didn't have repositories had repositories?"

**What happened**: Quick 3-minute session. David asks about client directory structure and naming conventions. Identifies "Lars" as the only client without a repo. Creates a private GitHub repo for Lars following the existing pattern, pushes it.

**Shape**: 12 events, 4 prompts, 3min active, no idle gaps. Tools: Bash 8 (only tool).

**Classification**:

- C01 session_type: **OPERATIONS** -- repo creation/standardisation, not building software
- C02 session_subtype: **repo_setup** -- creating and configuring a git repository
- C03 opening_style: **conceptual_question** -- asks about structure and naming patterns
- C04 closing_style: **commit_and_push** -- ends with "Make sure you push it. exit"
- C05 tool_profile: **conversational** -- 8 Bash calls, all shell operations
- C06 project_attribution: **reliable** -- CWD is clients/, work creates clients/lars/
- C07 session_scale: **micro** -- 12 events, 3min active

**Predicates**:

- P01 is_feature_construction: false
- P02 has_frustration_signals: false
- P03 is_multi_phase: false
- P04 has_brain_file_writes: false
- P05 has_playwright_calls: false
- P06 has_cross_session_refs: false
- P07 has_skill_gap_signal: false
- P08 has_unauthorized_edits: false
- P09 is_compaction_resume: false
- P10 is_cwd_incidental: false

**Observations**:

- **efficiency**: This is the most efficient session in the batch. 3 minutes, 4 prompts, task completed with push. Clean operational workflow with zero friction.
- **naming_convention_inquiry**: David's opening question about naming patterns reveals he values consistency across client repos. The "lars" repo follows the existing "guy-monroe" pattern.

---

## New Subtypes Proposed

| Subtype                         | From Session | Justification                                                                                                                                                    |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build.full_lifecycle_build`    | W5-C05       | Complete BA-through-UAT cycle in one session. Distinct from `build.greenfield` (which is scaffold-only) and `build.feature_wave` (which is implementation-only). |
| `brand.design_exploration`      | W5-C06       | Rapid visual prototyping via Mochaccino, no production code touched. Subagent parallelism for variant generation.                                                |
| `brand.brand_knowledge_capture` | W5-C07       | Capturing brand identity, pricing, menus, taglines for a physical business. Not knowledge management; brand asset creation.                                      |
| `planning.brain_migration`      | W5-C08       | Evaluating and migrating between knowledge management systems. Not BUILD (no app), not RESEARCH (actively migrating).                                            |
| `operations.repo_setup`         | W5-C10       | Creating/configuring git repos to match existing patterns. Quick operational task.                                                                               |
| `skill.skill_authoring`         | W5-C01       | Creating a new Claude Code skill from scratch. Distinct from skill invocation.                                                                                   |

## Cross-Session Patterns

1. **ChatGPT-to-Claude pipeline** (W5-C07): David researches in ChatGPT, then pastes results into Claude Code for structuring and storage. This is a multi-tool workflow pattern worth tracking.

2. **Cross-session paste** (W5-C04): David pastes formatted analysis from a previous conversation into the current one. No explicit session reference, but the content format (indented bullet points with headings) suggests it was generated by Claude in another session.

3. **Hook vs transcript source** (W5-C06): The appydave.com session is captured via hooks rather than transcript. This provides richer metadata (tool_summary, last_message on stop events) but different event granularity.

4. **Registry default-to-BUILD bias**: 7/7 sessions were registered as BUILD. Only 1 is actually BUILD. The registry's classification logic needs improvement for non-coding sessions.
