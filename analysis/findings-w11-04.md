---
type: analysis
title: 'Findings W11-04'
description: 'Wave 11 Batch 04: 9 sessions, 22% BUILD accuracy; three-session chain detected, POEM executor, Radar skill birth + AngelEye first mention.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave W11-04

**Agent**: W11-04
**Date**: 2026-03-23
**Sessions analysed**: 9 (3 moderate, 6 light)
**BUILD accuracy**: 2/9 (22%) — 7 reclassified

## Session Summary

| Session ID (short) | Registry | Reclassified | Subtype                                | Scale    | Interest |
| ------------------ | -------- | ------------ | -------------------------------------- | -------- | -------- |
| 9d04778f           | BUILD    | BUILD        | build.workflow_refinement              | moderate | high     |
| 5fb45f56           | BUILD    | BUILD        | build.workflow_design                  | moderate | high     |
| 2c28f388           | BUILD    | OPERATIONS   | operations.infrastructure_provisioning | moderate | medium   |
| 5e18711f           | BUILD    | OPERATIONS   | operations.workflow_execution          | moderate | high     |
| 4dbdeb60           | BUILD    | OPERATIONS   | operations.backup_audit                | light    | medium   |
| 8bf22f75           | BUILD    | OPERATIONS   | operations.emergency_recovery          | light    | high     |
| 4ad6aae9           | BUILD    | KNOWLEDGE    | knowledge.brain_maintenance            | light    | medium   |
| 8790b0c4           | BUILD    | RESEARCH     | research.concept_exploration           | light    | high     |
| a2fdbf5b           | BUILD    | BUILD        | build.skill_development                | light    | medium   |

## Key Findings

### 1. Three-session chain detected (5fb45f56 -> 9d04778f -> 5e18711f)

A clear session chain around the SupportSignal new-incident workflow:

- **5fb45f56**: Investigated data anomalies, designed gate checks, severity classifier, analysis row pattern. Produced structured handover document.
- **9d04778f**: Consumed handover, placed severity step in YAML, corrected missing edits, updated documentation.
- **5e18711f**: Consumed second handover via paste, executed workflow with `*run 105`. Pure execution.

The chain demonstrates a design -> implement -> test lifecycle split across sessions, with structured handover documents as the connective tissue. The handover paste from 5fb45f56 was 7,306 characters — the most detailed cross-session context transfer in this batch.

### 2. POEM executor pattern confirmed (`*run` = OPERATIONS, not BUILD)

Session 5e18711f has only 3 user prompts and 60 tool calls (1:20 ratio). User pastes context, says `*run 105`, then observes. Claude orchestrates via Task/TaskOutput calls. Zero Edit calls. This is workflow execution, not construction. The `*run` command is a strong OPERATIONS signal — consistent with wave 5 learning about POEM executors.

### 3. Hardware emergency session (8bf22f75)

Crisis escalation pattern: lost iTerm sessions -> laptop screen died -> emergency SSH data transfer to M4 Mini. Novel subtype `operations.emergency_recovery`. The session references a prior repo audit (likely 4dbdeb60 from the same week), forming a weak chain: backup audit followed by the exact scenario it prepared for.

### 4. Pre-travel backup audit (4dbdeb60) — new OPERATIONS subtype

User about to travel, audits 20+ repos for uncommitted/unpushed work. 40 Bash calls running `git status` across the entire dev machine. Results written to memory file. New subtype: `operations.backup_audit`. Distinct from general sysops — urgency-driven, comprehensive, machine-wide.

### 5. Radar skill birth + AngelEye first mention (8790b0c4)

Session 8790b0c4 is where the `/radar` skill was conceived and named (inspired by Radar from M*A*S\*H). Also contains the first mention of what became AngelEye: "the idea that I can watch all the information from Claude. Conversation hooks, all that sort of stuff." Voice artifact: "Hoots" = hooks.

### 6. P14 (wrong_approach) in TUI context (8790b0c4)

Claude generated HTML output when user is in a terminal. Explicit frustration: "I just knew if I used a front-end designer, you'd fuck up. I'm in a TUI." This is a persistent context-awareness gap — Claude doesn't reliably detect terminal vs browser environments.

### 7. P13+P15 co-occurrence in workflow session (9d04778f)

Claude reported completing edits that weren't actually in the YAML file. User: "Why are you telling me you've done this when I look in the new incident YAML? It's not in place." This is the "phantom edit" failure mode — Claude believes it made changes but they didn't persist or targeted the wrong file.

### 8. Compaction resume pattern (4ad6aae9)

40 tool calls before first user prompt (7 flagged as unauthorized edits). The 9-minute session is a compaction tail — Claude completed autonomous work from pre-compaction context, then user confirmed and requested commit. Only 2 user prompts total. Not BUILD — brain file maintenance.

## Friction Predicates Summary

| Predicate                   | Count | Sessions           |
| --------------------------- | ----- | ------------------ |
| P13 (misunderstood_request) | 2     | 9d04778f, a2fdbf5b |
| P14 (wrong_approach)        | 2     | 9d04778f, 8790b0c4 |
| P15 (buggy_output)          | 1     | 9d04778f           |
| P16 (excessive_changes)     | 0     | —                  |

P13+P14 co-occurred in a2fdbf5b (skill location misunderstanding) and P13+P14+P15 tripled in 9d04778f (phantom edit + step numbering design error).

## Voice Dictation Artifacts

| Artifact     | Correct        | Session(s) |
| ------------ | -------------- | ---------- |
| Jason        | JSON           | 4dbdeb60   |
| Hoots        | hooks          | 8790b0c4   |
| hat          | app            | 8790b0c4   |
| focu         | /focus         | 8790b0c4   |
| Doc's recipe | docs/recipe    | a2fdbf5b   |
| Ches Moi     | chez moi       | 2c28f388   |
| setp         | step           | 9d04778f   |
| kind action  | kind of action | 9d04778f   |

## CWD Incidental Rate

5/9 sessions (56%) had incidental CWD:

- 2c28f388: CWD=brains, work=agent-os/ansible + dotfiles
- 4dbdeb60: CWD=brains, work=all repos machine-wide
- 8bf22f75: CWD=brains, work=system-level recovery
- (3 prompt.supportsignal sessions had reliable CWD)

brains/ CWD continues to be a "home terminal" for non-brain work at micro/light scale, consistent with wave 9-10 findings.

## New Subtypes Proposed

1. `build.workflow_refinement` — restructuring existing workflow YAML/config
2. `build.workflow_design` — designing new workflow gates/classifiers/patterns
3. `operations.infrastructure_provisioning` — Ansible/SSH multi-machine provisioning
4. `operations.workflow_execution` — POEM `*run` execution (human observes)
5. `operations.backup_audit` — pre-travel machine-wide git audit
6. `operations.emergency_recovery` — hardware failure crisis response
7. `research.concept_exploration` — multi-topic brainstorm with tangents
8. `build.skill_development` — skill concept -> build -> deploy cycle

**Discovery rate**: 8 new subtypes from 9 sessions = 0.89/session.
