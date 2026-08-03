---
type: analysis
title: 'Findings W5 Brains'
description: 'Wave 5 brains sessions (W5-A04, A06–A10): 6 brains-project batches from Feb–Mar 2026 analysed 2026-03-22.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings: Wave 5 — Brains Sessions

**Batch**: W5-A04, W5-A06, W5-A07, W5-A08, W5-A09, W5-A10
**Project**: brains (`/Users/davidcruwys/dev/ad/brains`)
**Analysed**: 2026-03-22

---

## W5-A04 — `7cf5cc25-7ac1-4e58-bb48-1e4214679ee9`

**Date**: 2026-02-27, 86 min wall / 41 min active
**Opening**: "Unknown skill: focu" — typo from failed `/focus` skill invocation
**Tools**: Bash(17), Read(11), Glob(3), Edit(2), Write(1)

### What happened

David started by accidentally triggering an unknown skill ("focu" instead of `/focus`). The session then pivoted to exploring Cole Medin's Second Brain architecture (dynamous-engine). David pasted the entire README of the dynamous-engine repo, discussed upstream repo structure (`/Users/davidcruwys/dev/upstream`), and explored setting up a test second brain system at `/Users/davidcruwys/dev/ad/brain-dynamous`. The session also explored existing brain-cowork and brain-cowork-upgrade directories. A brain file was written (Write x1, Edit x2), and the session ended with a reflective question: "What do I do professionally?"

### Classifiers

- **C01 session_type**: RESEARCH — Exploring Cole Medin's second brain architecture, comparing with own system
- **C02 session_subtype**: research.architecture_comparison — Comparing dynamous-engine architecture with David's brain system
- **C03 opening_style**: skill_invocation (failed) — Typo `/focu` instead of `/focus`
- **C04 closing_style**: abrupt_abandon — Ended with a reflective question, no closure action
- **C05 tool_profile**: search_heavy — Bash(17) for directory exploration + Read(11) for examining files
- **C06 project_attribution**: reliable — CWD is brains, work is brain-related
- **C07 session_scale**: light — 41 events

### Predicates

| #   | Predicate               | Result | Justification                                                                                     |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| P01 | is_feature_construction | false  | No feature built; exploratory only                                                                |
| P02 | has_frustration_signals | false  | No frustration detected                                                                           |
| P03 | is_multi_phase          | true   | Phase 1: skill fail + orientation; Phase 2: Cole Medin research; Phase 3: brain setup exploration |
| P04 | has_brain_file_writes   | true   | Write(1) + Edit(2) — wrote a file to brains, edited brain-dynamous reference                      |
| P05 | has_playwright_calls    | false  | No Playwright                                                                                     |
| P06 | has_cross_session_refs  | true   | Pasted content from other Claude Code sessions visible in prompt                                  |
| P07 | has_skill_gap_signal    | true   | Failed skill invocation "focu" — typo, not missing skill                                          |
| P08 | has_unauthorized_edits  | false  | No unauthorized edits                                                                             |
| P09 | is_compaction_resume    | false  | No compaction                                                                                     |
| P10 | is_cwd_incidental       | false  | CWD matches work                                                                                  |

### Observations

- **Registry mismatch**: Registry says BUILD but this is clearly RESEARCH — exploring architecture, not building anything.
- **Interesting pattern**: David pasted a 2400-word README into a prompt as context seeding. This is a `context_loading_paste` opening style (masked by the failed skill invocation before it).
- **Brain subfolder**: Work touches cole-medin brain area and brain-dynamous setup.

---

## W5-A06 — `66b802a7-c830-44c9-8e6b-2f70cffd0bbc`

**Date**: 2026-02-20, 2 min wall / 2 min active
**Opening**: Long paste of another session's output about installing vercel agent-browser skill
**Tools**: WebFetch(4), Bash(4), Task(1)

### What happened

David pasted a long transcript from another Claude Code session where `claude skill install vercel-labs/agent-browser` was hanging. He asked "why is this not finishing?" and then "this command does not work, it just loads claude and thinks skill is a prompt?" Claude used WebFetch(4) to research the issue and Bash(4) to investigate. Extremely short session (2 minutes, 11 events). This is a debugging/troubleshooting session about Claude Code's own skill install mechanism.

### Classifiers

- **C01 session_type**: DEBUG — Troubleshooting a broken `claude skill install` command
- **C02 session_subtype**: debug.tool_install — Debugging Claude Code skill installation
- **C03 opening_style**: context_loading_paste — Massive paste of another session's output (6773 chars)
- **C04 closing_style**: abrupt_abandon — No resolution captured, just 2 prompts
- **C05 tool_profile**: conversational — WebFetch(4) for research + Bash(4) for checking; no file edits
- **C06 project_attribution**: incidental — CWD is brains but work is about Claude Code tooling
- **C07 session_scale**: micro — 11 events, 2 minutes

### Predicates

| #   | Predicate               | Result | Justification                                                                 |
| --- | ----------------------- | ------ | ----------------------------------------------------------------------------- |
| P01 | is_feature_construction | false  | Debugging, not building                                                       |
| P02 | has_frustration_signals | true   | "why is this not finishing", "this command does not work" — clear frustration |
| P03 | is_multi_phase          | false  | Single troubleshooting thread                                                 |
| P04 | has_brain_file_writes   | false  | No brain writes                                                               |
| P05 | has_playwright_calls    | false  | No Playwright                                                                 |
| P06 | has_cross_session_refs  | true   | Entire prompt is pasted from another session                                  |
| P07 | has_skill_gap_signal    | true   | `claude skill install` not working as expected                                |
| P08 | has_unauthorized_edits  | false  | No edits at all                                                               |
| P09 | is_compaction_resume    | false  | No compaction                                                                 |
| P10 | is_cwd_incidental       | true   | CWD is brains but work is about Claude Code skill install debugging           |

### Observations

- **Registry mismatch**: Registry says BUILD — should be DEBUG.
- **Cross-session paste pattern**: David is using one Claude Code session to debug another session's behavior. This is a META pattern.
- **Micro session**: Only 11 events, 2 minutes. Likely gave up and tried something else.

---

## W5-A07 — `4e3b83f7-2df0-4694-a2d3-c596aadc0d42`

**Date**: 2026-02-18 to 2026-02-19, 777 min wall / 139 min active (10.5h idle gap)
**Opening**: Long paste with context from previous sessions about brain metadata work
**Tools**: Edit(39), Read(29), Bash(20), TaskUpdate(6), Write(6), TaskCreate(4), Task(2), Skill(1)

### What happened

This is a substantial brain curation session focused on the agentic-os brain. David opened by pasting content from previous sessions and asking if the work was still relevant. The session had two major phases separated by a 10.5-hour idle gap:

**Phase 1** (Feb 18, ~38 min): Explored the agentic-os brain INDEX.md structure, fixed JSON formatting issues. Short prompts: "is this JSON prominent", "yes, fix both", answering with "1" to select options.

**Phase 2** (Feb 19, ~100 min): Extended brain curation work — Claude iteratively improved the brain files with David approving each step ("yes", "keep going", "yes" x8). Topics included: removing stubs that cause context poisoning, archiving decisions, recounting metadata, and general brain file hygiene. Ended with "commit this" followed by documenting the process as a "brain librarian checklist."

This session produced the brain-librarian-checklist — a reusable process document for brain file maintenance.

### Classifiers

- **C01 session_type**: KNOWLEDGE — Brain file curation and maintenance
- **C02 session_subtype**: knowledge.brain_curation — Systematic brain file cleanup and metadata improvement
- **C03 opening_style**: context_loading_paste — Pasted content from prior sessions (72KB first prompt)
- **C04 closing_style**: commit_and_push — "commit this" then documented the process
- **C05 tool_profile**: synthesis — Edit(39) + Read(29) + Write(6) = heavy file transformation
- **C06 project_attribution**: reliable — CWD is brains, work is brain file curation
- **C07 session_scale**: heavy — 130 events, 139 active minutes

### Predicates

| #   | Predicate               | Result | Justification                                                                             |
| --- | ----------------------- | ------ | ----------------------------------------------------------------------------------------- |
| P01 | is_feature_construction | false  | Curation/maintenance, not feature building                                                |
| P02 | has_frustration_signals | false  | Session flows smoothly with approvals                                                     |
| P03 | is_multi_phase          | true   | Two phases separated by 10.5h gap; Phase 1 = fix + explore, Phase 2 = systematic curation |
| P04 | has_brain_file_writes   | true   | Edit(39) + Write(6) — extensive brain file modifications                                  |
| P05 | has_playwright_calls    | false  | No Playwright                                                                             |
| P06 | has_cross_session_refs  | true   | First prompt pastes content from multiple prior sessions                                  |
| P07 | has_skill_gap_signal    | false  | Skill invoked successfully                                                                |
| P08 | has_unauthorized_edits  | false  | No unauthorized edits                                                                     |
| P09 | is_compaction_resume    | false  | No compaction detected                                                                    |
| P10 | is_cwd_incidental       | false  | CWD matches work                                                                          |

### Observations

- **Form-filling detected**: First prompt is 72KB, and short_prompt_ratio is 0.95. After the initial context dump, David switches to terse approval mode ("yes", "1", "keep going"). This is a guided-curation pattern.
- **Registry mismatch**: Registry says BUILD — should be KNOWLEDGE.
- **Brain librarian checklist**: This session produced a reusable process document. High-value output.
- **New subtype candidate**: `knowledge.brain_curation` — systematic cleanup of brain file metadata, stubs, and structure. Distinct from `knowledge.brain_authoring` (creating new content) or `knowledge.brain_retrieval` (reading only).

---

## W5-A08 — `d0d48243-812c-43e4-8eb0-fd46619dadd8`

**Date**: 2026-03-01, 56 min wall / 56 min active
**Opening**: Voice-dictated architectural discussion about agentic-os vertical/horizontal stacks
**Tools**: Edit(19), Read(7), TaskUpdate(6), Bash(6), TaskCreate(2), WebFetch(2), Glob(1), AskUserQuestion(1)

### What happened

David launched into a detailed architectural planning session for the agentic-os. His opening prompt was a voice-dictated monologue describing:

- **Vertical stack**: Brain -> Second Brain -> Harness (Claude Agent SDK) -> Claude Co-work -> Chat interface -> Voice (Samantha/11 Labs) -> Telegram
- **Horizontal stack**: M4 Mini, M4 MacBook Pro, M2 Mini, two M4/M5s for Philippines (Jan, Mary), Tailscale mesh, replicated brains via GitHub
- He asked for JSON documentation of both stacks, gap analysis vs OpenClaw

The session progressed through drafting system.json additions, exploring upstream repos for OpenClaw, WebFetching Kybernesis.ai/kyberbot, and updating architecture files with real product names (FliHub, FliDeck, StorylineApp, FliGen, Deckhand, Samantha). CWD shifted mid-session from brains root to `brains/agentic-os/architecture`.

### Classifiers

- **C01 session_type**: KNOWLEDGE — Authoring architectural documentation for agentic-os brain
- **C02 session_subtype**: knowledge.architecture_authoring — Creating/updating system architecture JSON docs
- **C03 opening_style**: voice_dictation — Long unstructured monologue with natural speech patterns
- **C04 closing_style**: abrupt_abandon — Ends after product name updates, no explicit close
- **C05 tool_profile**: synthesis — Edit(19) dominant, creating/updating architectural JSON and markdown
- **C06 project_attribution**: reliable — CWD is brains, work is in brains/agentic-os/
- **C07 session_scale**: moderate — 49 events, 56 active minutes

### Predicates

| #   | Predicate               | Result | Justification                                                                                                    |
| --- | ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| P01 | is_feature_construction | false  | Documentation/architecture authoring                                                                             |
| P02 | has_frustration_signals | false  | Smooth session                                                                                                   |
| P03 | is_multi_phase          | true   | Phase 1: vertical/horizontal architecture draft; Phase 2: OpenClaw gap analysis; Phase 3: product catalog update |
| P04 | has_brain_file_writes   | true   | Edit(19) to agentic-os brain files                                                                               |
| P05 | has_playwright_calls    | false  | No Playwright                                                                                                    |
| P06 | has_cross_session_refs  | false  | No cross-session references                                                                                      |
| P07 | has_skill_gap_signal    | false  | No skill issues                                                                                                  |
| P08 | has_unauthorized_edits  | false  | No unauthorized edits                                                                                            |
| P09 | is_compaction_resume    | false  | No compaction                                                                                                    |
| P10 | is_cwd_incidental       | false  | CWD matches work                                                                                                 |

### Observations

- **Registry mismatch**: Registry says BUILD — should be KNOWLEDGE.
- **Voice dictation pattern**: Opening prompt is clearly voice-dictated (natural speech, run-on sentences, "I should say", hedging). This is a common David pattern.
- **CWD drift**: Started at `/Users/davidcruwys/dev/ad/brains`, drifted to `/Users/davidcruwys/dev/ad/brains/agentic-os/architecture` mid-session. CWD drift is informative — it shows the work narrowing.
- **AskUserQuestion used**: Claude asked David to clarify product names — interactive refinement pattern.
- **WebFetch for research**: WebFetch(2) used to check Kybernesis.ai — research embedded in authoring.

---

## W5-A09 — `41024780-a533-4e5c-a68e-63bb6ada6e2e`

**Date**: 2026-03-01 to 2026-03-02, 706 min wall / 10 min active (583 min + 112 min idle gaps)
**Opening**: "Where have we been keeping information about other models, especially graphic diffusion models and either Fal.ai or Kai.ai"
**Tools**: Edit(27), Read(6), Grep(5), playwright_navigate(5), playwright_click(2), Write(2), Glob(1), Skill(1)

### What happened

David asked where diffusion model information is stored in brains. Claude searched via Grep and found the kie-ai brain. David then asked to refresh knowledge about Fal.ai models, specifically "nano banana 2" and web-search-capable image generation. Claude used Playwright to browse Fal.ai and Kie.ai websites, gathering model information. David then directed: "yes, update the kie-ai brain with everything you found."

A massive editing burst followed — 27 Edits updating kie-ai brain files with new model information, creating a new file (Write x2), and updating INDEX.md. After a 583-minute gap, David returned to ask "update the INDEX.md in the brains root." After another 112-minute gap: "save this to brain" (triggering Skill invocation), then "commit this."

### Classifiers

- **C01 session_type**: KNOWLEDGE — Research and brain file updates for kie-ai
- **C02 session_subtype**: knowledge.brain_authoring — Researching and writing new content into kie-ai brain
- **C03 opening_style**: keyword_orientation — Short question locating existing knowledge
- **C04 closing_style**: commit_and_push — "commit this"
- **C05 tool_profile**: synthesis — Edit(27) dominant, with Playwright for web research
- **C06 project_attribution**: reliable — CWD is brains, work is brain file updates
- **C07 session_scale**: moderate — 55 events, but only 10 active minutes

### Predicates

| #   | Predicate               | Result | Justification                                                                                                      |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| P01 | is_feature_construction | false  | Brain content authoring, not feature building                                                                      |
| P02 | has_frustration_signals | false  | Smooth session                                                                                                     |
| P03 | is_multi_phase          | true   | Phase 1: research (Playwright browsing); Phase 2: kie-ai brain updates; Phase 3: INDEX.md updates; Phase 4: commit |
| P04 | has_brain_file_writes   | true   | Edit(27) + Write(2) — extensive kie-ai brain updates                                                               |
| P05 | has_playwright_calls    | true   | playwright_navigate(5) + playwright_click(2) = 7 calls                                                             |
| P06 | has_cross_session_refs  | false  | No cross-session references                                                                                        |
| P07 | has_skill_gap_signal    | false  | Skill invoked successfully                                                                                         |
| P08 | has_unauthorized_edits  | false  | No unauthorized edits                                                                                              |
| P09 | is_compaction_resume    | false  | No compaction                                                                                                      |
| P10 | is_cwd_incidental       | false  | CWD matches work                                                                                                   |

### Observations

- **Registry mismatch**: Registry says BUILD — should be KNOWLEDGE.
- **Playwright for research**: Interesting tool profile — Playwright used not for UI testing but for web research to gather model information. This is a `research_browsing` tool pattern.
- **search_without_read detected**: 4 instances — Grep results not followed by Read. Possibly Claude finding enough info from search results alone.
- **Sparse active time**: 706 min wall but only 10 min active. David dropped in briefly across three bursts separated by long gaps. Classic "return to finish" pattern.
- **Brain subfolder**: kie-ai (AI image generation models — Fal.ai, Kie.ai, diffusion models).

---

## W5-A10 — `3646e49e-15fa-4907-83b9-8135bb94c4f0`

**Date**: 2026-03-15, 10 min wall / 10 min active
**Opening**: "Where would you document this conversation? I might want it in the future."
**Tools**: Read(2), Edit(1), Bash(1), Write(1)
**Source**: hook (not transcript)

### What happened

A compact, focused session captured via hooks. David asked where to document a conversation about Android share + cloudflared local tunnels. Claude suggested TIL (`brains/til/`) as the best fit. David agreed and asked to add cloudflared to Ansible's `david.yml`. Claude:

1. Read Ansible role files (homebrew, applications)
2. Edited `agent-os/ansible/inventory/group_vars/david.yml` — added cloudflare tap and cloudflared formula
3. Wrote `brains/til/2026-03-15-android-share-cloudflared-local-tunnels.md` (104 lines)

Clean two-action session: one Ansible config edit + one TIL write.

### Classifiers

- **C01 session_type**: KNOWLEDGE — Writing TIL + updating Ansible config
- **C02 session_subtype**: knowledge.til_capture — Capturing a Today-I-Learned entry with a side config edit
- **C03 opening_style**: conceptual_question — "Where would you document this?"
- **C04 closing_style**: bookend_close — Clean completion with both actions done
- **C05 tool_profile**: synthesis — Read(2) + Edit(1) + Write(1) — small targeted file changes
- **C06 project_attribution**: unreliable — CWD is brains but edits touch agent-os/ansible
- **C07 session_scale**: micro — 10 events, 10 minutes

### Predicates

| #   | Predicate               | Result | Justification                                         |
| --- | ----------------------- | ------ | ----------------------------------------------------- |
| P01 | is_feature_construction | false  | Documentation capture                                 |
| P02 | has_frustration_signals | false  | Smooth, clean session                                 |
| P03 | is_multi_phase          | false  | Single phase: document + config edit                  |
| P04 | has_brain_file_writes   | true   | Write(1) to brains/til/                               |
| P05 | has_playwright_calls    | false  | No Playwright                                         |
| P06 | has_cross_session_refs  | false  | Refers to "this conversation" but no session ID paste |
| P07 | has_skill_gap_signal    | false  | No skill issues                                       |
| P08 | has_unauthorized_edits  | false  | No unauthorized edits                                 |
| P09 | is_compaction_resume    | false  | No compaction                                         |
| P10 | is_cwd_incidental       | true   | CWD is brains but also edits agent-os files           |

### Observations

- **Registry marked is_junk: true** — This is wrong. The session produced a TIL entry and an Ansible config update. Should be active.
- **Hook source**: This is a hook-captured session, not transcript. Slightly different event structure (has `tool_summary` fields, `stop` events).
- **Cross-project edits**: CWD is brains but touches agent-os/ansible — project_attribution is unreliable.
- **Efficient session**: 5 tool calls, 2 user prompts, two concrete outputs. High signal-to-noise ratio.

---

## Cross-Session Patterns

### Registry accuracy

All 6 sessions were tagged BUILD in the registry. Zero are actually BUILD:

- 1x RESEARCH (W5-A04)
- 1x DEBUG (W5-A06)
- 4x KNOWLEDGE (W5-A07, W5-A08, W5-A09, W5-A10)

This confirms the known pattern: **BUILD is almost never correct for brains CWD** (0% in this batch, consistent with waves 1-4).

### Brain subfolders touched

- **agentic-os**: W5-A07, W5-A08 (architecture planning and brain curation)
- **cole-medin/dynamous**: W5-A04 (research)
- **kie-ai**: W5-A09 (model research and brain authoring)
- **til**: W5-A10 (TIL capture)
- **None specific**: W5-A06 (debugging Claude Code, incidental CWD)

### Proposed new subtypes

1. `knowledge.brain_curation` — Systematic cleanup/maintenance of existing brain files (W5-A07)
2. `knowledge.architecture_authoring` — Creating/updating system architecture documentation (W5-A08)
3. `knowledge.til_capture` — Quick TIL entries with optional side-effect config changes (W5-A10)
4. `debug.tool_install` — Debugging tool/skill installation issues (W5-A06)
5. `research.architecture_comparison` — Comparing external system architectures with own (W5-A04)

### Voice dictation detection

W5-A08 is a clear voice-dictation opening. Signals: run-on sentences, hedging ("I should say"), natural speech flow, no formatting. Worth flagging as a distinct `opening_style` pattern.

### Playwright-for-research pattern

W5-A09 uses Playwright not for UI testing but for web research (browsing Fal.ai, Kie.ai). This is a distinct tool_profile variant — `research_browsing` rather than `ui_audit`.
