---
type: analysis
title: 'Findings W11-02'
description: 'Wave 11 Batch 02: 9 sessions, 89% BUILD misclassification; SME-driven design sessions + growing voice artifact catalog.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave W11-02

**Agent**: W11-02
**Sessions analysed**: 9
**Date**: 2026-03-23

---

## Wave-Level Summary

### BUILD Misclassification Rate: 89% (8/9)

The registry auto-classified all 9 sessions as BUILD. Only **1** was genuinely BUILD (17f663ad — AppyStack template updates with 3 npm publishes). The remaining 8 span 6 distinct parent types:

| Corrected Type | Count | Sessions           |
| -------------- | ----- | ------------------ |
| PLANNING       | 2     | 3a66b975, df50ec48 |
| OPERATIONS     | 2     | dfc912b1, 9d1d85be |
| SYSOPS         | 1     | b76d267b           |
| RESEARCH       | 1     | 52b9a192           |
| BRAND          | 1     | 9182b9b9           |
| KNOWLEDGE      | 1     | 13b51e25           |
| BUILD          | 1     | 17f663ad           |

### CWD Incidental Pattern

5/9 sessions had CWD in `brains/` or `prompt.supportsignal.com.au` used as a "home terminal" — actual file touches were elsewhere. This confirms David's warning: CWD alone is unreliable for classification.

### Voice Dictation Artifacts (7/9 sessions)

| Artefact               | Intended      | Sessions |
| ---------------------- | ------------- | -------- |
| Crisp                  | Krisp         | b76d267b |
| Hemispin / Hammerspin  | Hammerspoon   | b76d267b |
| Deccan / DeckHand      | DeckHand      | 52b9a192 |
| David Yama / david.yml | david.yml     | 9d1d85be |
| OSCE / Oscar           | Oscar (agent) | 3a66b975 |
| npm run scene          | npm run sync  | 17f663ad |
| NA10 / N8N             | N8N           | 13b51e25 |
| Cybernesis             | Kybernesis    | 13b51e25 |

Voice artifacts are now a reliable signal for dictated sessions. Claude handles most corrections inline without user re-prompting.

### Cross-Session Pairs

Two concurrent-session patterns detected:

1. **52b9a192** references a "DeckHand window" — parallel session doing Stream Deck work while this one reverse-engineers the Ecamm API.
2. **3a66b975 / df50ec48** — cross-paste content detected. POEM workflow planning (3a66b975) and NDIS severity design (df50ec48) ran close together with shared context snippets.

---

## Friction Predicates (P13–P16)

### P13 — has_misunderstood_request (3/9)

| Session  | Detail                                                                                 |
| -------- | -------------------------------------------------------------------------------------- |
| df50ec48 | Claude produced wrong output format for severity tiers; Angela (SME) had to re-specify |
| 9d1d85be | Claude expanded scope beyond OMI transcript fetch into unrelated Syncthing config      |
| 13b51e25 | Claude attempted integration code when David wanted filing/ingestion only              |

### P14 — has_wrong_approach (3/9)

| Session  | Detail                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| b76d267b | Initially blamed wrong app for stealing Cmd+Shift+D; systematic macOS debugging eventually found the real culprit |
| 3a66b975 | Started with `claude -p` piping approach before realising SDK agent pattern was needed                            |
| 13b51e25 | Tried premature integration of brain files before structure was defined                                           |

### P15 — has_buggy_output (1/9)

| Session  | Detail                                                                    |
| -------- | ------------------------------------------------------------------------- |
| 17f663ad | Upgrade from 0.4.5 to 0.4.7 introduced a UX regression in template output |

### P16 — has_excessive_changes (0/9)

No sessions exhibited excessive/unnecessary changes.

---

## Per-Session Classifications

### b76d267b — SYSOPS.hotkey_troubleshooting

- **Scale**: moderate (82 events)
- **Summary**: Cmd+Shift+D hotkey stolen by unknown macOS process. Systematic debugging: `lsof`, accessibility permissions, Karabiner inspection. Eventually identified culprit.
- **Classifiers**: C01=sysops, C02=hotkey_troubleshooting, C03=moderate, C04=single_focus, C05=true (voice), C06=false (cross-ref), C07=macOS, C08=Hammerspoon/Karabiner
- **Predicates**: P01=true (tool_use), P02=false (no code gen), P03=true (file reads), P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=true (config changes), P11=false, P12=false, P13=false, P14=true, P15=false, P16=false
- **Observation O03**: Voice artifact "Crisp"→Krisp, "Hemispin"→Hammerspoon

### 3a66b975 — PLANNING.workflow_architecture

- **Scale**: moderate (74 events)
- **Summary**: POEM workflow executor design. Analysed Oscar agent's prompt chain, designed execution pipeline for multi-step prompt workflows.
- **Classifiers**: C01=planning, C02=workflow_architecture, C03=moderate, C04=single_focus, C05=true, C06=true (cross-session), C07=TypeScript, C08=POEM/Oscar
- **Predicates**: P01=true, P02=false, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=false, P11=false, P12=false, P13=false, P14=true, P15=false, P16=false
- **Observation O01**: Cross-session content shared with df50ec48

### df50ec48 — PLANNING.domain_design

- **Scale**: moderate (67 events)
- **Summary**: NDIS severity tier taxonomy design with Angela (SME). Domain-driven design for participant risk classification. Angela provided corrections on clinical terminology.
- **Classifiers**: C01=planning, C02=domain_design, C03=moderate, C04=single_focus, C05=true, C06=true, C07=n/a, C08=SupportSignal/NDIS
- **Predicates**: P01=true, P02=false, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=false, P11=false, P12=false, P13=true, P14=false, P15=false, P16=false
- **Observation O02**: SME-driven session — Angela's domain expertise shaped output

### 52b9a192 — RESEARCH.api_reverse_engineering

- **Scale**: moderate (63 events)
- **Summary**: Ecamm Live API reverse engineering + Stream Deck SDK documentation research. Parallel with DeckHand session.
- **Classifiers**: C01=research, C02=api_reverse_engineering, C03=moderate, C04=dual_focus, C05=true, C06=true, C07=TypeScript, C08=Ecamm/StreamDeck
- **Predicates**: P01=true, P02=false, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=false, P11=false, P12=false, P13=false, P14=false, P15=false, P16=false
- **Observation O01**: Concurrent with DeckHand window session

### dfc912b1 — OPERATIONS.multi_task_triage

- **Scale**: light (58 events)
- **Summary**: Multi-task triage session: OMI transcript retrieval, environment variable debugging, skill file creation. Classic "morning terminal" pattern.
- **Classifiers**: C01=operations, C02=multi_task_triage, C03=light, C04=multi_focus, C05=true, C06=false, C07=mixed, C08=OMI/skills
- **Predicates**: P01=true, P02=true (small), P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=true, P11=false, P12=false, P13=false, P14=false, P15=false, P16=false

### 17f663ad — BUILD.template_update_and_publish

- **Scale**: light (55 events)
- **Summary**: AppyStack template maintenance. Three consecutive npm publishes (0.4.5 → 0.4.6 → 0.4.7). Config updates, ESLint migration, dependency bumps.
- **Classifiers**: C01=build, C02=template_update_and_publish, C03=light, C04=single_focus, C05=true, C06=false, C07=TypeScript, C08=AppyStack/npm
- **Predicates**: P01=true, P02=true, P03=true, P04=true (3 publishes), P05=false, P06=false, P07=false, P08=false, P09=false, P10=true, P11=false, P12=false, P13=false, P14=false, P15=true, P16=false
- **Observation O03**: Voice artifact "npm run scene"→"npm run sync"

### 9d1d85be — OPERATIONS.infra_configuration

- **Scale**: light (48 events)
- **Summary**: Started as OMI transcript fetch, expanded into Syncthing Ansible configuration for multi-Mac sync. Scope creep detected.
- **Classifiers**: C01=operations, C02=infra_configuration, C03=light, C04=dual_focus, C05=true, C06=false, C07=YAML/Ansible, C08=OMI/Syncthing
- **Predicates**: P01=true, P02=true, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=true, P11=false, P12=false, P13=true, P14=false, P15=false, P16=false
- **Observation O03**: Voice artifact "David Yama"→david.yml

### 9182b9b9 — BRAND.presentation_creation

- **Scale**: light (42 events)
- **Summary**: Ralph Wiggum-themed presentation slides for community talk. Creative content generation, not code.
- **Classifiers**: C01=brand, C02=presentation_creation, C03=light, C04=single_focus, C05=false, C06=false, C07=Markdown/HTML, C08=Skool/community
- **Predicates**: P01=true, P02=false, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=false, P11=false, P12=false, P13=false, P14=false, P15=false, P16=false

### 13b51e25 — KNOWLEDGE.brain_architecture

- **Scale**: light (37 events)
- **Summary**: Ingesting Kybernesis, N8N, and ComfyUI knowledge into agentic-os brain structure. Filing and organising, not building.
- **Classifiers**: C01=knowledge, C02=brain_architecture, C03=light, C04=single_focus, C05=true, C06=false, C07=Markdown, C08=agentic-os/brains
- **Predicates**: P01=true, P02=false, P03=true, P04=false, P05=false, P06=false, P07=false, P08=false, P09=false, P10=true, P11=false, P12=false, P13=true, P14=true, P15=false, P16=false
- **Observation O03**: Voice artifacts "NA10"→N8N, "Cybernesis"→Kybernesis

---

## New Subtypes Proposed

| Parent Type | Subtype                 | Source Session |
| ----------- | ----------------------- | -------------- |
| SYSOPS      | hotkey_troubleshooting  | b76d267b       |
| PLANNING    | workflow_architecture   | 3a66b975       |
| PLANNING    | domain_design           | df50ec48       |
| RESEARCH    | api_reverse_engineering | 52b9a192       |
| OPERATIONS  | multi_task_triage       | dfc912b1       |
| OPERATIONS  | infra_configuration     | 9d1d85be       |
| BRAND       | presentation_creation   | 9182b9b9       |
| KNOWLEDGE   | brain_architecture      | 13b51e25       |

---

## Patterns Worth Watching

1. **Morning terminal pattern**: Sessions like dfc912b1 and 9d1d85be start with a quick OMI fetch then drift into unrelated tasks. The CWD is `brains/` but work touches 3+ different project trees. These are OPERATIONS.multi_task_triage, not BUILD.

2. **SME-driven design sessions**: df50ec48 shows Angela providing domain corrections. These planning sessions have a distinct shape — shorter user prompts, longer assistant outputs, and correction cycles. Worth a dedicated classifier flag.

3. **Voice artifact density increasing**: 7/9 sessions contain voice artifacts. The artifact catalog is growing and could become a lookup table for automatic correction detection.

4. **Friction clustering**: P13 and P14 co-occur in 13b51e25 (misunderstood + wrong approach). This double-friction pattern correlates with sessions where David's intent was filing/organising but Claude assumed building/integrating.
