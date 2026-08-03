---
type: analysis
title: 'Findings W8-06'
description: 'Wave 8 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch 06

**Sessions analysed**: 9 (1 heavy, 4 moderate, 2 light, 1 light/micro boundary, 1 micro)
**Projects**: flivideo, app.supportsignal (x3), signal-studio, v-appydave, supportsignal, storyline-app, ad
**Date range**: 2026-02-11 to 2026-03-17

---

## BUILD Accuracy: 2/9 (22%)

Registry classified all 9 as BUILD. Only 2 confirmed:

- **1cd5963d** (signal-studio): Genuine BUILD — incident data schema design with new UI screens
- **53e79368** (v-appydave): Genuine BUILD — prompt template engineering with HBS files

Reclassifications:
| Session | Registry | Actual | Why |
|---------|----------|--------|-----|
| 3eedefa5 | BUILD | RESEARCH | Architecture comparison across 4 apps, no product code |
| 11553e41 | BUILD | DEBUG | CI/CD investigation and targeted fixes |
| 959a8309 | BUILD | KNOWLEDGE | Workflow porting from POEM to SupportSignal |
| 5a04f602 | BUILD | RESEARCH | Crisis investigation (Convex compliance) |
| 07cdb085 | BUILD | PLANNING | BMAD v6 project restructure planning |
| 5cc3079e | BUILD | SETUP | npm install and start app |
| 51c6e510 | BUILD | OPERATIONS | Directory move and jump alias update |

BUILD accuracy 22% — consistent with waves 6-7.

---

## Friction Predicates (P13-P16) — Trial Results

### P13 has_misunderstood_request: 2/9 sessions

- **959a8309**: Claude searched BMAD docs exclusively when user said "two of them are not BMAD-related". Three prompts of misdirected search. Classic selective attention failure — Claude fixated on keyword "BMAD" and ignored the qualifier.
- **53e79368**: Claude confused generate-titles template with refined-chapters template. Notably bidirectional — user also contributed to confusion ("Now I think I'm confusing you big time").

### P14 has_wrong_approach: 1/9 sessions

- **959a8309**: Same session as P13. Should have searched KDD and broader docs first, not BMAD exclusively.

### P15 has_buggy_output: 1/9 sessions

- **3eedefa5**: Claude claimed quality tooling (npm test, lint, typecheck) was passing when it wasn't. User had to independently verify and paste error output back. Trust violation — user explicitly says "you are starting to look a bit stupid."

### P16 has_excessive_changes: 1/9 sessions

- **3eedefa5**: User expected ~4 planning files in AppyStack folder; Claude dumped many more. User: "You put a hell of a lot of files into that folder for me."

**Assessment**: P13-P16 are productive additions. They captured friction that P01-P12 wouldn't have flagged. P13 (misunderstood request) and P15 (buggy output) are the highest-signal new predicates.

---

## Key Observations

### 1. Third Concurrent Session Pair Confirmed

**959a8309** shows user working simultaneously in SupportSignal and POEM sessions, with explicit cross-paste: "Done a bit of the investigation in another window, but you actually had better context than that window." This is the third confirmed concurrent session pair (after W6 and W7 pairs). Concurrent sessions are a regular pattern, not an anomaly.

### 2. Crisis-Mode Sessions Are a Distinct Pattern

**5a04f602** shows a panic-triggered investigation: "I've got a disaster in front of me... I feel like we're totally fucked." The session has a unique tool_profile — 70% Task/TaskOutput (agent_orchestration). Crisis mode triggers heavy delegation to background agents. Proposed subtype: **research.crisis_investigation**.

### 3. Cross-Session Recovery as Heavy Session Opener

**3eedefa5** opens with a 20KB paste of a prior session's terminal output, followed by two more large pastes (19KB, 8KB) from "conversations that closed down." This recovery-from-context-exhaustion pattern drives the first ~30min of the session. Heavy sessions that open with paste_handover tend to be continuations, not fresh starts.

### 4. Persona Orchestration in BUILD Sessions

**53e79368** uses named personas (Penny the prompt engineer, Alex for schema/workflow) as work delegation mechanism within a single session. User explicitly says "switch to Penny and keep going" and later "can she ask for Alex to get involved." This is a human-directed multi-persona pattern, distinct from system-initiated subagents.

### 5. Bidirectional Confusion Is a Distinct Friction Pattern

**53e79368** shows both user AND Claude contributing to a misunderstanding about which template is being discussed. User later acknowledges "I think I'm confusing you big time." This is different from unilateral P13 (Claude misunderstands) — both parties co-create the confusion. May warrant a separate predicate or a qualifier on P13.

### 6. Liaison Pattern for Client Communication

**07cdb085** creates "liaison files" for Jan and Brian as a communication bridge for the BMAD v6 process. This is a new document type: planning artifacts specifically designed for non-technical stakeholder communication.

---

## New Subtypes Proposed

| Subtype                          | Session  | Evidence                                        |
| -------------------------------- | -------- | ----------------------------------------------- |
| research.architecture_comparison | 3eedefa5 | Systematic comparison of 4 app architectures    |
| research.crisis_investigation    | 5a04f602 | Panic-triggered compliance investigation        |
| debug.cicd_investigation         | 11553e41 | CI/CD pipeline investigation and fixes          |
| build.data_schema_design         | 1cd5963d | Schema design + seed data + UI screens          |
| build.prompt_engineering         | 53e79368 | HBS template design with persona-based workflow |
| knowledge.workflow_porting       | 959a8309 | Cross-project workflow adaptation               |
| planning.project_restructure     | 07cdb085 | Repo reorganization and BMAD v6 planning        |
| setup.app_install                | 5cc3079e | npm install + start                             |
| operations.repo_reorganization   | 51c6e510 | Directory move + alias update                   |

9 sessions, 9 distinct subtypes. 7 new (research.crisis_investigation, debug.cicd_investigation, build.data_schema_design, build.prompt_engineering, knowledge.workflow_porting, planning.project_restructure, operations.repo_reorganization).

---

## Frustration Summary

4/9 sessions had frustration signals:

1. **3eedefa5** (high): Broken quality tooling claimed working + naming instruction ignored + excessive file delivery
2. **959a8309** (high): Three prompts of misdirected search before correct answer
3. **53e79368** (low): Template confusion — partially user's own contribution
4. **5a04f602** (situational): "Totally fucked" — external trigger (Convex compliance), not Claude interaction failure

Sessions 1 and 2 are genuine Claude failures. Session 3 is bidirectional. Session 4 is situational stress, not interaction friction.

---

## Stats

- **Total sessions in index after this batch**: 321
- **Subtypes proposed this batch**: 9 (7 new)
- **Discovery rate**: 0.78 subtypes/session (rebound from 0.44 in wave 6)
- **P13-P16 hit rate**: P13=22%, P14=11%, P15=11%, P16=11%
