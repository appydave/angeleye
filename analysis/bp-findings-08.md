---
type: analysis
title: 'Backprop Findings 08'
description: 'Backprop phase analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, backprop, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Backward Pass — Batch 08 Findings

**Batch**: `bp-batch-08.json` (102 sessions)
**Machines**: M4 Mini (86), M4 Pro (16)
**Analysed**: 2026-03-23

---

## Predicate Distribution

| Predicate                        | True | False | Null | Rate |
| -------------------------------- | ---- | ----- | ---- | ---- |
| P17 has_handover_context         | 14   | 72    | 16   | 14%  |
| P18 has_cross_project_reads      | 16   | 63    | 23   | 16%  |
| P19 has_web_research             | 8    | 80    | 14   | 8%   |
| P20 has_parallel_subagent_bursts | 7    | 76    | 19   | 7%   |
| P21 has_task_orchestration       | 22   | 67    | 13   | 22%  |
| P22 has_git_outcome              | 11   | 73    | 18   | 11%  |

### Key predicate observations

- **P17 handover (14%)**: Handover sessions split into two distinct patterns — human-authored context pastes (sessions 1, 8, 12, 26, 33, 55, 58) and machine-generated agent dispatches (sessions 38, 53). The Paperclip agent chain (sessions 38+53) is a novel pattern: orchestrated agents with UUID identity injection.
- **P21 task orchestration (22%)**: Higher than expected. TaskList/TaskOutput calls are a strong POEM executor signature, confirming the `*run` sessions (20, 28, 31) as POEM workflow operations.
- **P20 parallel bursts (7%)**: Concentrated in power sessions. Sessions 3, 4, 6 have 5-8 parallel agents each. These are the "orchestrated marathon" pattern — David delegates research to a swarm.
- **P19 web research (8%)**: Web research correlates with knowledge/brain sessions (52, 69) and Paperclip autonomous agents (38). Low overall — David primarily works with local files.

---

## Classifier Distribution

### C08 Delegation Style

| Value          | Count | %   |
| -------------- | ----- | --- |
| conversational | 53    | 52% |
| directive      | 14    | 14% |
| unknown        | 12    | 12% |
| orchestrated   | 11    | 11% |
| delegated      | 9     | 9%  |
| autonomous     | 3     | 3%  |

**Analysis**: Over half of sessions are conversational — David frequently uses Claude Code as a thinking partner, not just a build tool. The 3 autonomous sessions (0, 38, 53) are genuinely machine-driven: Ralphy Mode 3 campaign and Paperclip agent dispatches. The 11 orchestrated sessions all involve 3+ parallel agents.

### C09 Session Continuity

| Value          | Count | %   |
| -------------- | ----- | --- |
| fresh          | 59    | 58% |
| unknown        | 12    | 12% |
| handover_paste | 11    | 11% |
| compaction     | 10    | 10% |
| skill_launcher | 6     | 6%  |
| recall         | 4     | 4%  |

**Analysis**: Majority fresh starts. Handover paste (11%) reveals a manual session continuity mechanism — David pastes context blocks because Claude Code lacks native cross-session memory. Compaction sessions (10%) are always marathon builds. The 4 recall sessions reference prior sessions without explicit paste, suggesting intermittent memory.

### C10 Output Type

| Value               | Count | %   |
| ------------------- | ----- | --- |
| code_changes        | 42    | 41% |
| knowledge_synthesis | 30    | 29% |
| conversation_only   | 14    | 14% |
| mixed               | 9     | 9%  |
| new_artifacts       | 7     | 7%  |

**Analysis**: The 29% knowledge_synthesis rate confirms that "brains" sessions are a major workload category. The 14% conversation_only includes ghost sessions, micro Q&A, and pure troubleshooting.

### C11 Initiation Source

| Value            | Count | %   |
| ---------------- | ----- | --- |
| user_typed       | 62    | 61% |
| voice_dictated   | 19    | 19% |
| handover_paste   | 11    | 11% |
| skill_invoked    | 4     | 4%  |
| unknown          | 4     | 4%  |
| agent_dispatched | 2     | 2%  |

**Analysis**: Voice dictation at 19% is significant — nearly 1 in 5 sessions initiated by voice. This has design implications for AngelEye: voice-originated sessions have characteristic artifacts (typos, run-on sentences, conversational tone) that affect classification accuracy. The 2 agent-dispatched sessions (Paperclip JJ agent) represent genuine machine autonomy.

---

## Machine Character (O07)

### M4 Pro (16 sessions)

- Used as portable field machine in Thailand (beauty-and-joy, joy-juice sessions)
- Handles Paperclip autonomous agent workloads
- Mixed personal (Apple Care questions) and development use
- Lower session count suggests it's the "on-the-go" machine

### M4 Mini (86 sessions)

- Primary development workhorse (84% of sessions)
- Handles all SupportSignal development
- Runs parallel agent bursts (sessions 3, 4, 6)
- Brain/knowledge management hub
- Always-on desktop machine handling the bulk of coding work

---

## Subtype Corrections (9 sessions)

| Session | Project           | Current | Corrected                 |
| ------- | ----------------- | ------- | ------------------------- |
| 48      | ansible           | BUILD   | operations.infrastructure |
| 50      | signal-studio     | BUILD   | operations.git_commit     |
| 72      | ad                | BUILD   | micro.unclassified        |
| 82      | brains            | BUILD   | operations.git_commit     |
| 89      | brains            | BUILD   | micro.unclassified        |
| 92      | app.supportsignal | unknown | ghost.empty               |
| 93      | angeleye          | ?       | ghost.empty               |
| 94      | brains            | ?       | ghost.empty               |
| 99      | angeleye          | unknown | ghost.empty               |

---

## New Candidate Predicates / Classifiers / Observations

### Candidate Predicate: P23_has_voice_artifacts

**Signal**: Garbled/phonetic text in opening prompt or notes mentioning voice transcription artifacts.
**Prevalence**: ~19 sessions (19%) — high enough to be systematically useful.
**Value**: Voice-initiated sessions have distinct quality characteristics: run-on instructions, phonetic misspellings, conversational (not imperative) framing. Affects how session intent should be parsed.
**Examples**: "colemedin" (Cole Medin), "secretes" (secrets), "exity" (exit), "cluaed" (Claude), "Lizada" (Lazada), "Mapbook Pro" (MacBook Pro).

### Candidate Predicate: P24_has_paperclip_orchestration

**Signal**: Agent UUID in opening prompt, Paperclip-specific naming, multi-session agent chains.
**Prevalence**: 2-3 sessions in this batch.
**Value**: Represents a genuinely new interaction paradigm — machine-dispatched agents with identity injection. Distinct from user-launched subagents. Would track the emergence and maturity of autonomous agent ecosystems.

### Candidate Classifier: C12_pii_sensitivity

**Values**: none / low / medium / high
**Signal**: Notes mentioning API keys, email addresses, client names, passwords, personal hardware.
**Prevalence**: At least 5 sessions flagged (51 has actual API keys in prompt text, 16 has client email abstractions, 83 has personal location/repair info).
**Value**: Critical for any session export, training data extraction, or knowledge graph. Sessions with high PII should be filtered from any public-facing outputs.

### Candidate Observation: O08_cwd_reliability

**Signal**: Whether the CWD matches the actual work being done.
**Prevalence**: ~25% of "brains" sessions have incidental CWD (work is actually on infrastructure, ansible, etc.).
**Value**: Tracks how often project attribution from CWD is misleading. High unreliability suggests AngelEye needs content-based project inference rather than CWD alone.

### Candidate Classifier: C13_session_lifecycle

**Values**: complete / abandoned / ghost / interrupted / compaction_exhausted
**Signal**: Closing style (natural end vs abrupt stop vs no interaction).
**Prevalence**: Ghost sessions (4), abandoned (several with "exity"/"eit"), compaction-exhausted marathons (sessions 0, 2, 8).
**Value**: Distinguishes sessions that achieved their goal from those that didn't. Important for measuring session success rate.

---

## Notable Patterns

### 1. The Paperclip Agent Chain

Sessions 38 and 53 (both joy-juice, M4 Pro) are machine-dispatched agents with UUID identity: `You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ)`. This is a novel pattern — the session is not initiated by David but by an orchestrating system (Paperclip AI). Session 38 ran 51 tool calls including 6 web searches autonomously. This represents the emergence of multi-session agent chains where Claude Code is a worker node, not the orchestrator.

### 2. Voice-to-Build Pipeline

19% of sessions start with voice dictation, but the resulting sessions span all types (BUILD, KNOWLEDGE, ORIENTATION). Voice is an input modality, not a session type. The voice artifacts create a predictable classification challenge — parsers must handle phonetic misspellings as first-class input.

### 3. The "Brains as Terminal" Pattern

Many brains/ sessions (30, 43, 46, 49, 73, 74, 78, 80, 88, 98) are not actually about brain content — David happens to have a terminal open to brains/ and asks whatever question is on his mind (iTerm settings, SSH hostnames, speaker recommendations, FliDeck hotkeys). CWD-based project attribution is unreliable for ~25% of brains sessions.

### 4. Marathon Session Anatomy

The 10 compaction sessions show a consistent pattern: plan-paste opening, autonomous execution bursts, mid-session voice corrections, compaction at context limit, then continued execution. Active minutes are typically 10-20% of wall-clock time due to overnight/multi-day spans.

### 5. Task Tool as POEM Signature

Sessions with Task/TaskOutput tools (22%) are almost exclusively POEM workflow executions. This is a reliable classifier: if TaskOutput appears, the session is running a POEM workflow, not doing ad-hoc development. The `*run NNN` prompt pattern further confirms this.
