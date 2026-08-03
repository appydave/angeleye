---
type: analysis
title: 'Findings W10-05'
description: 'W10-05: 9 sessions, 22% BUILD accuracy; proposes 8 subtypes including brain_maintenance, brain_creation, cross_project_survey, workflow_execution.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W10-05

**Wave**: 10, Agent 05
**Sessions analysed**: 9
**Date**: 2026-03-23

## BUILD Accuracy Assessment

**Registry BUILD accuracy: 2/9 (22%)**

| Session  | Registry | Actual                        | Correct? |
| -------- | -------- | ----------------------------- | -------- |
| c9a2f3a2 | BUILD    | knowledge.brain_maintenance   | No       |
| 983d70b0 | BUILD    | knowledge.brain_architecture  | No       |
| f75655f0 | BUILD    | build.multi_phase_build       | Yes      |
| 802ae066 | BUILD    | research.cross_project_survey | No       |
| d3a8db00 | BUILD    | build.infrastructure_build    | Yes      |
| 880e197b | BUILD    | knowledge.methodology_design  | No       |
| 733f8cd4 | BUILD    | knowledge.brain_creation      | No       |
| 49d66aad | BUILD    | research.technology_survey    | No       |
| 335e73af | BUILD    | operations.workflow_execution | No       |

Consistent with wave 8-9 findings (~20-25% BUILD accuracy for moderate sessions). The 2 correct BUILD classifications both involve creation of real infrastructure artifacts (Ansible playbook, HTML mockups).

**Key discriminator**: Sessions in brains/ CWD that only Read/Edit/Write brain files are KNOWLEDGE, not BUILD — even with high Edit counts. Brain file edits are documentation, not feature construction.

## Per-Session Observations

### c9a2f3a2 — Brain Maintenance (knowledge.brain_maintenance)

- **Multi-burst pattern**: 3 work bursts separated by 10h and 2h idle gaps
- **TaskCreate parallelization**: 10 TaskCreate calls to spawn parallel brain audits — notable workflow pattern for batch operations
- **/brain-librarian skill** invoked for brain health verification
- Voice artifact: "kie-ai" = KieAI

### 983d70b0 — Brain Architecture (knowledge.brain_architecture)

- **Highest prompt count in batch**: 38 user prompts in 135 active minutes — highly conversational/advisory mode
- **Naming discussion**: Extended negotiation about "upstream" as consolidation location for JS3rd/Py3rd SDK repos
- **Memory save closing ceremony**: "save this session to memory" as explicit session close
- **1 compaction** — moderate context pressure
- Voice artifacts: "Agentico S" = agentic-os, "Verso" = Vercel

### f75655f0 — Multi-Phase Build (build.multi_phase_build)

- **CWD incidental (confirmed)**: CWD=prompt.supportsignal.com.au but work targets AWB intake system
- **Playwright semantic role: ui_audit** — 5 HTML mockup versions evaluated via screenshots
- **Context divergence**: User expected registry+JSON system, found hard-coded intake. "Context poisoning" variant.
- **3 distinct phases** across 7h: research → decision review → mockup generation with Playwright QA
- Voice artifact: "Bart" = Claude

### 802ae066 — Cross-Project Survey (research.cross_project_survey)

- **Frustration-driven session**: Explicit profanity ("shit", "damn") about recurring machine config issues
- **Context paste opener**: 3.6KB paste from another FliHub session — corrective followup
- **3 Explore subagents** do parallel CLAUDE.md survey across 25 files in 6 minutes
- **File size inflation**: 89KB for 121 events — massive subagent report text
- **P13 fired**: Claude pivoted to CLAUDE.md survey instead of fixing root machine config issue
- **Cross-session chain**: Follows a prior FliHub machineRole configuration session

### d3a8db00 — Infrastructure Build (build.infrastructure_build)

- **BUILD is correct**: Creates new Ansible playbook for client template, refactors existing playbooks, writes handover docs
- **PII abstraction discussion**: GitHub username/email needs extraction for public template
- **Client template pattern**: "miniLars" renamed to "macminiClientTemplate" with "Joe Blow" as example user
- **P15 fired**: Broken URLs in README needed fixing in verification phase
- Voice artifacts: "miniLars", "Joe Blow" naming discussion

### 880e197b — Methodology Design (knowledge.methodology_design)

- **P14 fired (doc bias)**: User calls out Claude for reading biased internal docs: "you are not impartial, be objective"
- **Unauthorized edit before first prompt**: Claude started work before user confirmed — first prompt is "yes"
- **Heavy voice dictation artifacts**: "copmparioon", "amekse", "beliving", "intenetion", "alginmnet"
- **Comparative analysis**: Bash ralph vs Task Agent ralph — user wants genuine comparison, not doc parroting
- Continuous 77-minute focused session with no idle gaps

### 733f8cd4 — Brain Creation (knowledge.brain_creation)

- **New brain from TIL seed**: brains/til/2026-02-23-ssh-claude-code-remote-machine-control.md seeds machine-control brain
- **24h span**: 3 work bursts with 1.5h and 22h idle gaps
- **Brain creation workflow**: Read TIL → create structure → write brain files → follow-up edits next day
- Session type confirmed by pattern: Read seed → Write new brain → Edit INDEX

### 49d66aad — Technology Survey (research.technology_survey)

- **WebFetch for GitHub API**: 5 WebFetch calls surveying Vercel GitHub repos (star ratings, usefulness)
- **Multi-topic exploration**: A2A protocol, Vercel AI SDK, Agent Skills, v0-sdk, Geist, Portless, Remotion
- **Brain creation as research output**: Research produces new brain files (Vercel, Remotion collections)
- Voice artifacts: "Verso" = Vercel, "Jason Rendor" = Remotion/Jason Renderer

### 335e73af — Workflow Execution (operations.workflow_execution)

- **POEM executor pattern**: "\*run 105" command, Task-heavy execution (40% task orchestration tools)
- **Workflow routing confusion**: User discovers Oscar does work meant for Penny/Alex agents
- **P13 + P14 fired**: Oscar wrote to wrong file and ran wrong test type
- User asks "What are we missing in the system?" — discovering workflow delegation gaps
- CWD=prompt.supportsignal is reliable here (unusual for this CWD)

## Pattern Highlights

### Brain sessions dominate (7/9)

7 of 9 sessions have CWD=brains or primarily work in brain files. All 7 are misclassified as BUILD. Pattern: brains/ CWD + Read/Edit/Write brain files = never BUILD.

### Voice dictation artifacts (new catalog entries)

- "kie-ai" = KieAI (brain name)
- "Agentico S" = agentic-os
- "Verso" = Vercel (2 sessions)
- "Jason Rendor" = Remotion/Jason Renderer
- "Bart" = Claude (in f75655f0)
- "copmparioon", "amekse", "beliving", "intenetion", "alginmnet" = heavy typo artifacts

### Multi-phase sessions: 6/9

Consistent with wave 6 finding that 75%+ of moderate sessions have clear phase transitions. Idle gaps often >1h, some >10h.

### Friction predicates summary

- P13 (misunderstood_request): 3/9 (33%) — higher than wave 8 average
- P14 (wrong_approach): 2/9 (22%) — doc bias and workflow routing
- P15 (buggy_output): 1/9 (11%)
- P16 (excessive_changes): 0/9 (0%)

### New subtype proposals

- **knowledge.brain_maintenance** — batch brain health audit with TaskCreate parallelization
- **knowledge.brain_architecture** — structural design decisions about brain organization (naming, consolidation)
- **knowledge.brain_creation** — creating new brain from seed material
- **research.cross_project_survey** — subagent-driven survey across entire ecosystem
- **research.technology_survey** — external technology exploration with WebFetch
- **build.infrastructure_build** — Ansible playbook / infrastructure artifact creation
- **build.multi_phase_build** — session with research → decision → build phases
- **operations.workflow_execution** — POEM executor (\*run) sessions

### Context paste as session opener (2/9)

802ae066 opens with 3.6KB paste from prior session. This is consistent with wave 7 "context handover paste" pattern. Second instance (f75655f0) has implicit cross-session context about AWB changes.

### Unauthorized edit before prompt (1/9)

880e197b shows Claude starting work before user confirms. First prompt is "yes" — confirming unauthorized pre-work. This is a known but rare anti-pattern.
