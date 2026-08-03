---
type: analysis
title: 'Findings W14-04'
description: 'Wave 14-04: 12 M4 Pro sessions (Feb–Mar 2026) — session-type distribution batch.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14-04 (M4 Pro, 12 sessions)

**Wave**: W14-04
**Machine**: m4-pro (MacBook Pro M4)
**Sessions analysed**: 12
**Date range**: 2026-02-28 to 2026-03-21
**Analyst**: W14-04 agent

## Type Distribution

| Type     | Count | Sessions                                           |
| -------- | ----- | -------------------------------------------------- |
| MIXED    | 3     | df963b70, bb70eaaf, feb95744                       |
| RESEARCH | 4     | 1381f3bd, 56e458e4, 624b0fa3, d684351a (reclassed) |
| SYSOPS   | 2     | d2db22bc, ce9def08                                 |
| BUILD    | 2     | e679775b, 25750964                                 |
| META     | 1     | eee1dbf6                                           |

## Registry Disagreements

The M4 Pro registry typed 10 of 12 sessions as BUILD and 1 as KNOWLEDGE. This is a near-total misclassification — only 2 of 12 are genuinely BUILD sessions. The M4 Pro registry classifier appears to default to BUILD for everything, making it unreliable.

| Session  | Registry  | Actual     | Why                                             |
| -------- | --------- | ---------- | ----------------------------------------------- |
| df963b70 | BUILD     | MIXED      | Research + knowledge + skill authoring marathon |
| d2db22bc | BUILD     | SYSOPS     | Remote M2 Mini provisioning via SSH/Ansible     |
| bb70eaaf | BUILD     | MIXED      | Paperclip AI setup + Joy Juice research         |
| feb95744 | BUILD     | MIXED      | Git ops then T7 drive investigation             |
| ce9def08 | BUILD     | SYSOPS     | SSH/Tailscale connectivity troubleshooting      |
| 1381f3bd | BUILD     | RESEARCH   | Searching for Twitter handle across machine     |
| d684351a | BUILD     | OPERATIONS | Running repo-audit tool (reclassed to RESEARCH) |
| 56e458e4 | KNOWLEDGE | RESEARCH   | Quick doc search — read-only, no writes         |
| 624b0fa3 | BUILD     | RESEARCH   | NVIDIA curl command syntax help                 |
| eee1dbf6 | BUILD     | META       | Question about Claude Code UX behaviour         |

## Scale Distribution

| Scale    | Count | Sessions                                                   |
| -------- | ----- | ---------------------------------------------------------- |
| heavy    | 2     | df963b70 (223 events), d2db22bc (137 events)               |
| moderate | 3     | e679775b (111), 25750964 (79), bb70eaaf (64)               |
| light    | 1     | feb95744 (48)                                              |
| micro    | 6     | ce9def08, 1381f3bd, d684351a, 56e458e4, 624b0fa3, eee1dbf6 |

## Key Sessions

### df963b70 — NVIDIA NemoClaw Research Marathon (MIXED, heavy)

**Duration**: 7 hours (163 active mins), compaction mid-session.
Three distinct phases: (1) NVIDIA OpenShell/NemoClaw research — understanding the open-source agent runtime, (2) Brain skill template architecture — shared patterns for consultant/audit/context skills, (3) Claude brain corrections (hook count discrepancy: 27 actual vs 23 documented), skill creation, open loop triage. Highly productive multi-topic session. Voice artifact: "nvideo nemoclaw" = NVIDIA NemoClaw.

### d2db22bc — M2 Mini Remote Provisioning (SYSOPS, heavy)

**Duration**: 12.5 hours (122 active mins), started at AI meetup.
Full remote provisioning of M2 Mini from M4 Pro: SSH/Tailscale troubleshooting, Ansible playbook execution, repo cloning (brains, appydave-tools, appydave-brand, poem-os, apps, upstream), gap analysis between machines (apps.json, locations.json comparison), brew/ruby/npm setup. CronCreate/CronDelete pair detected but benign.

### e679775b — FliDeck Feature Build (BUILD, moderate)

**Duration**: 81 minutes, no idle gaps.
Systematic backlog execution in flideck — items b42, b43 implemented. 9 Agent subagent calls indicate plan-driven build. Short confirmatory prompts ("yes", "looks good", "b42", "b43"). Ends with explicit handover: "we're going to have to do it in the next window because we're running out of context."

### 25750964 — AppyDave.com Mocchino Content (BUILD, moderate)

**Duration**: 13 hours (42 active mins), three bursts across the day.
Content creation for appydave.com using Mocchino skill. Created mock web pages, reviewed via Playwright screenshots (6 navigate + 5 screenshot calls). Design frustration with orange colour and API Day logo. Kept pages 2/3/6, created pages 10-19.

### bb70eaaf — Paperclip AI Setup + Joy Juice Research (MIXED, moderate)

**Duration**: 5.8 hours (71 active mins).
Compaction resume with 5KB context dump. Paperclip AI advisor setup (CEO workspace), Joy Juice business research for Chiang Mai juice/smoothie shop (menu design, bilingual content, schema planning), Paperclip brain documentation, M4 Mini config sync. 3 Brave web searches for Paperclip docs.

## Patterns Observed

### M4 Pro Usage Profile

- **Multi-machine management hub**: 4 of 12 sessions involve remote machine access (SSH to M2 Mini, M4 Mini). The M4 Pro serves as David's primary control machine.
- **Session chaining**: Several sessions chain together — 56e458e4 (remote docs search) leads to ce9def08 (SSH attempt) leads to d2db22bc (full provisioning). Similarly, 624b0fa3 (NemoClaw curl) relates to df963b70 (NemoClaw research).
- **Voice dictation prevalence**: 9 of 12 sessions show voice dictation artifacts ("nvideo nemoclaw", "m4-minii", "papwerclip", "vCan", "an where").
- **MIXED sessions dominate**: 3 of 12 are MIXED — David's M4 Pro sessions tend to span multiple topics within a single session, especially from brains/ CWD.

### CWD Reliability

- 7 of 12 sessions have CWD `/Users/davidcruwys/dev/ad/brains` — but only 2-3 actually do brains work. The M4 Pro brains/ CWD is highly incidental, likely the default terminal starting point.
- CWD is reliable for flideck (e679775b), appydave.com (25750964), and repo-audit (d684351a).

### Registry Classifier Failure

The M4 Pro registry defaulted almost everything to BUILD. This strongly suggests the registry classifier on M4 Pro is not functioning correctly — it lacks the granularity to distinguish SYSOPS, RESEARCH, META, or MIXED sessions. This should be investigated as a potential AngelEye improvement.

## Subtypes Proposed

- `mixed.research_then_knowledge_then_skill` — Multi-phase brain session (research, then brain writes, then skill work)
- `mixed.setup_then_research` — New tool setup followed by exploratory research
- `mixed.operations_then_sysops` — Quick git ops followed by system investigation
- `sysops.remote_provisioning` — Full remote machine setup via SSH/Ansible
- `sysops.remote_connectivity` — Quick SSH/Tailscale connection attempt
- `build.feature_construction` — Backlog item execution with confirmatory prompts
- `build.content_creation` — Mock page creation with visual review
- `operations.tooling_usage` — Running existing audit/refresh tools
- `research.file_search` — Searching for specific strings across machine
- `research.quick_answer` — Sub-5-minute Q&A lookup
- `meta.claude_code_usage` — Questions about Claude Code itself
