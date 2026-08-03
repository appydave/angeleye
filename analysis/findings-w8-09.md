---
type: analysis
title: 'Findings W8-09'
description: 'Wave 8 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch W8-09

**Sessions analysed**: 9 (2 heavy, 3 moderate, 3 light, 1 micro)
**Projects**: brains (2), supportsignal-v2-planning (1), deckhand (1), app.supportsignal (1), flihub (1), poem (1), video-projects (1), voz (1)
**Date**: 2026-03-23
**Analyst**: Claude analysis agent (W8-09)

---

## BUILD Registry Accuracy: 3/9 (33%)

Only 3 sessions are genuinely BUILD:

- **e726cab1** (poem) — Incremental enhancement to POEM triage workflows. Correct BUILD.
- **0af58053** (deckhand) — Data directory refactor + page management UI. Correct BUILD.
- **bc7f7f7a** (flihub) — Reclassified to DEBUG. Config fix, not feature construction.

Misclassified sessions:
| Session | Registry | Actual | Why wrong |
|---------|----------|--------|-----------|
| 8e8dac5b | BUILD | KNOWLEDGE | Web scraping training transcripts into brain files |
| febc6280 | BUILD | KNOWLEDGE | Brain file migration and reorganization |
| 9fe901a0 | BUILD | PLANNING | Gap analysis in explicit planning repo |
| 392ad41e | BUILD | OPERATIONS | Dependency vulnerability triage |
| 1b0559b7 | BUILD | OPERATIONS | Pure git commit/push operations |
| a22e8c1a | BUILD | KNOWLEDGE | Loom video reference capture |

**Pattern**: The brains sessions (2/2 wrong) and micro/light git-only sessions (2/2 wrong) continue the established BUILD misclassification trend. The planning repo session is notable — CWD literally contains "planning" yet was classified BUILD.

---

## Friction Predicates (P13-P16)

### P13 has_misunderstood_request: 1/9 sessions

- **0af58053** (deckhand): Claude applied the handover's data directory fix but missed the implicit expectation for page management UI. User had to explicitly point out missing add/delete buttons. The handover document focused on infrastructure, and Claude didn't extrapolate to the full feature scope.

### P14 has_wrong_approach: 1/9 sessions

- **febc6280** (brains): Claude searched too narrowly for brand identity data, staying within brains/ when the canonical files were scattered across ~/dev/ad/. User redirected twice. The wrong approach was CWD-anchored search instead of monorepo-wide scan.

### P15 has_buggy_output: 1/9 sessions

- **bc7f7f7a** (flihub): First fix attempt for brandConfig path was incomplete — file path was fixed but data shape was wrong. brandConfig was still null in the payload. Required a second handover with the data shape mapping table to fully resolve.

### P16 has_excessive_changes: 0/9 sessions

- No over-engineering detected in this batch.

**Observation**: P13-P15 each fired once in different sessions, affecting 3/9 sessions (33%). All three involved handover-driven sessions where the fix scope was partially understood. The friction pattern is: "Claude completes the literal instruction but misses the broader context."

---

## New Subtypes Proposed (7)

| Subtype                          | Session  | Signal                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| knowledge.web_scraping_ingestion | 8e8dac5b | Playwright scraping external site, writing to brain files     |
| knowledge.brain_migration        | febc6280 | Systematic migration between brain directories                |
| planning.gap_analysis            | 9fe901a0 | Multi-repo scanning from planning repo, writing planning docs |
| build.refactor_with_verification | 0af58053 | Architectural refactor + Playwright visual verification       |
| operations.dependency_triage     | 392ad41e | Vulnerability assessment with fix/defer/dismiss decisions     |
| operations.git_commit_push       | 1b0559b7 | Pure git operations via /commit skill                         |
| knowledge.loom_capture           | a22e8c1a | Loom video reference capture into project docs                |

**Strongest new subtypes**: knowledge.web_scraping_ingestion (first confirmed Playwright-for-knowledge pattern where scraping feeds brain, not product) and operations.dependency_triage (distinct from general OPERATIONS by its structured assess-decide-act workflow).

---

## Cross-Session Chain Patterns

### Handover-In / Handover-Out Pattern (bc7f7f7a)

This session both receives AND generates structured handovers. The user provides a SYMPTOM/ROOT CAUSE/FIX OPTIONS handover as input, then at session end asks Claude to generate a handover for "a different orchestrator." This is a confirmed 3-session chain:

1. Prior session (unknown ID) → diagnoses issue, writes handover
2. This session (bc7f7f7a) → applies fixes, generates handover for next
3. Next session (different orchestrator) → receives handover, continues

**Implication for AngelEye**: Handover documents in first_real_prompt are a strong signal for session chain membership. Detecting structured handover format (SYMPTOM/ROOT CAUSE/FIX sections, or "Handover:" prefix) could auto-flag chain relationships.

### Hotfix-to-Proper-Fix Chain (0af58053)

The handover explicitly states "Hotfix already applied (last session)" and describes the proper architectural fix. This is a corrective followup chain: hotfix session → proper fix session.

---

## Voice Dictation Artifacts Catalog (New Entries)

| Artifact        | Intended               | Session  |
| --------------- | ---------------------- | -------- |
| tube scripts    | transcripts            | 8e8dac5b |
| capenum         | Ecamm                  | 8e8dac5b |
| searchg hharder | search harder          | febc6280 |
| mucg            | much                   | febc6280 |
| beauth-joy      | beauty-joy             | febc6280 |
| traiage         | triage                 | 392ad41e |
| esp             | esbuild                | 392ad41e |
| FYI or Hint     | from the prior session | 9fe901a0 |

**Observation**: 5/9 sessions contain detectable voice dictation artifacts. The brains migration session (febc6280) has the densest artifacts, consistent with rapid voice-driven instructions during a frustration spike.

---

## Playwright Semantic Roles (Updated)

This batch confirms a fourth Playwright semantic role:

| Role                       | Session  | Context                                                           |
| -------------------------- | -------- | ----------------------------------------------------------------- |
| web_scraping_for_knowledge | 8e8dac5b | Scraping training website to extract transcripts into brain files |
| build_verification         | 0af58053 | Visual check that refactor didn't break UI                        |

The **web_scraping_for_knowledge** role is distinct from the previously identified `external_research` role. In external_research, Playwright browses to answer a question. In web_scraping_for_knowledge, Playwright systematically harvests content for durable knowledge storage. The difference: external_research is read-only lookup; web_scraping_for_knowledge produces brain file artifacts.

---

## Session Scale Distribution

| Scale    | Count | Session IDs                  |
| -------- | ----- | ---------------------------- |
| micro    | 1     | a22e8c1a                     |
| light    | 3     | bc7f7f7a, e726cab1, 1b0559b7 |
| moderate | 3     | 9fe901a0, 0af58053, 392ad41e |
| heavy    | 2     | 8e8dac5b, febc6280           |

Both heavy sessions are KNOWLEDGE type with brains CWD. Both have compaction events. The moderate sessions span 3 different types (PLANNING, BUILD, OPERATIONS). Light/micro sessions are either BUILD (poem) or OPERATIONS (git, loom capture).

---

## Observations Per Session (Quality Gate: minimum 2)

1. **8e8dac5b**: (a) Playwright-for-knowledge is a new semantic role distinct from UI testing. (b) Agent orchestration for parallel scraping across courses shows how subagents scale knowledge capture. (c) Two compactions in a scraping session suggest transcript content inflates context rapidly.

2. **febc6280**: (a) Brain migration is a distinct workflow type — systematic file-by-file decisions about where knowledge belongs in a new structure. (b) 44 prompts (highest in batch) shows migration requires heavy human involvement for each file's destination decision. (c) AskUserQuestion tool used for structured decisions — unusual tool in this corpus.

3. **9fe901a0**: (a) Planning repo CWD is the strongest possible signal for PLANNING type — the word is literally in the path. (b) 8 ToolSearch calls at start suggest Claude was probing for multi-repo scanning capabilities. (c) 14-hour idle gap cleanly separates analysis phase from architecture decisions phase.

4. **0af58053**: (a) Handover-driven sessions have a scope interpretation gap — Claude reads the literal instructions but doesn't extrapolate the broader feature scope. (b) Playwright visual verification as a BUILD sub-step (not a test session) is a recurring pattern.

5. **392ad41e**: (a) Failed /triage skill lookup ("Unknown skill: triage") suggests missing automation. The user expected a triage skill to exist. (b) Dependency triage follows a structured workflow: assess severity → decide fix/defer/dismiss → apply easy fixes → push. This could be codified as a skill.

6. **bc7f7f7a**: (a) Bidirectional handover pattern — receives structured handover AND generates one for a different orchestrator. First confirmed instance of this. (b) P15 (buggy output) from incomplete first fix — the path was fixed but the data shape was still wrong.

7. **e726cab1**: (a) Clean question-driven enhancement pattern: conceptual question → understand gap → show injection points → make edits → commit → push. (b) "Lisa the librarian" is a named persona in POEM OS, not a human — persona-named agents appear in voice prompts.

8. **1b0559b7**: (a) Pure git operations session — 2 prompts ("commit", "push"), 7 minutes. BUILD is maximally wrong here. (b) /commit skill works across multiple subdirectories (v-aitldr, v-shared) from a parent CWD.

9. **a22e8c1a**: (a) "add loom" as a command pattern — user has trained Claude to accept Loom URLs with transcript summaries as a structured input. (b) "Jan will guide you" references another agent/orchestrator in the voz project — evidence of multi-agent workflow.

---

## Summary Statistics

- Sessions analysed: 9
- BUILD registry correct: 3/9 (33%)
- New subtypes proposed: 7 (0.78/session)
- Friction predicates fired: P13 (1), P14 (1), P15 (1), P16 (0)
- Sessions with friction: 3/9 (33%)
- Voice artifacts detected: 5/9 (56%)
- Cross-session chains: 2 confirmed
- Playwright sessions: 2 (one knowledge scraping, one build verification)
