---
type: analysis
title: 'Findings W8-02'
description: 'Wave 8 batch 02 analysis of 8 sessions — 43% BUILD accuracy, feature_wave BUILD subtype, triple compaction survival, context poisoning anti-pattern.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 8, Batch 02 (W8-02)

**Date**: 2026-03-23
**Sessions analysed**: 8
**Session IDs**: 0e6fe5b8 (signal-studio/heavy), 849e7e62 (flihub/moderate), 12c159ac (signal-studio/moderate), 0115fcb4 (brains/moderate), 31ffb14e (prompt.supportsignal/moderate), 5f04c048 (v-appydave/light), 7115c088 (voz/light), e53117f9 (poem/micro)

---

## Registry Accuracy

| Session  | Registry Type | Analysed Type | Correct?                                          |
| -------- | ------------- | ------------- | ------------------------------------------------- |
| 0e6fe5b8 | BUILD         | BUILD         | Yes                                               |
| 849e7e62 | BUILD         | BUILD         | Yes                                               |
| 12c159ac | BUILD         | MIXED         | No — has planning + review phases alongside build |
| 0115fcb4 | BUILD         | KNOWLEDGE     | No — brand canvas workshop in brains/             |
| 31ffb14e | BUILD         | OPERATIONS    | No — POEM executor (\*run 107)                    |
| 5f04c048 | BUILD         | BUILD         | Yes                                               |
| 7115c088 | BUILD         | KNOWLEDGE     | No — client documentation + email drafting        |
| e53117f9 | ORIENTATION   | ORIENTATION   | Yes                                               |

**BUILD accuracy this batch**: 3/7 (43%). Consistent with wave 6-7 findings (~20-45% range for moderate+ sessions). The 3 correct BUILD sessions are all product repo sessions with significant Edit/Write counts.

---

## Observations

### Session 0e6fe5b8 — signal-studio/heavy (BUILD confirmed)

1. **Plan-driven implementation is a distinct BUILD subtype**: User pastes a 14K-char Wave 5 feature plan as the first prompt. This is not iterative build — it is plan-driven batch implementation. The plan covered 7 sub-waves (5A-5G) and Claude executed them sequentially with subagent delegation. New subtype: `build.feature_wave_implementation`.

2. **Playwright as BUILD verification tool (confirmed)**: 54 Playwright events (17% of tools) used for dark mode visual audit, not for TEST. This is the strongest evidence yet for Playwright's dual semantic role: BUILD verification (this session) vs TEST (E2E UAT). The discriminator is whether Playwright is checking work just built (BUILD) or systematically validating requirements (TEST).

3. **Triple compaction survival pattern**: Session compacted 3 times and maintained coherent state across all compactions. The compaction summaries were extremely detailed (2000+ words each), carrying full file lists, error contexts, and pending tasks. This is a successful example of context management under heavy load.

4. **Post-build learnings prompt**: After commit, user reflects: "I bet you've been fixing problems that have to do more with bad patterns. Or not following known patterns." This meta-observation about Claude's code quality leads to a CLAUDE.md learnings section update — a feedback-loop pattern where debugging informs project knowledge.

### Session 849e7e62 — flihub/moderate (BUILD confirmed)

5. **Unauthorized edits after skill load**: 14 unauthorized edits detected before first user prompt. The /flivideo:dev skill loaded context and Claude began implementing FR-141 before the user gave explicit instructions. This is a skill-triggered unauthorized edit pattern — different from the compaction-triggered pattern seen in W3-20. Skills that load implementation context may prime Claude to act.

6. **UAT-in-session feedback loop**: User tests the built feature and reports issues in real-time: "I have files in my edit-first, but I still can't sync from source." This creates a build-test-fix cycle within a single session. The 5.5h gap between initial build and UAT feedback suggests the user was doing manual testing offline.

7. **PO handover as session closing pattern**: Session ends with a product owner handover discussion — user asks "was everything from the requirements implemented?" and pastes PO planning context for verification. This is a cross-role workflow pattern: developer session ends with PO role verification.

8. **Pre-existing bugs surfaced during new feature UAT**: 4 bugs found, most pre-existing (expandPath() missing was a systemic issue across all 7 s3-staging endpoints). New feature implementation is an effective pre-existing bug discovery mechanism.

### Session 12c159ac — signal-studio/moderate (MIXED, not BUILD)

9. **MIXED type confirmed as real**: Session has three distinct phases — planning (backlog bundling), building (52 Edits), and review (UAT plan audit). No single type captures this adequately. The MIXED type with subtypes like `mixed.build_then_review` is needed.

10. **"Context poisoning" as a named anti-pattern**: User: "You don't leave shit that's not useful. It just creates context poisoning. You get rid of it. We need UATs to be a reflexion of reality." This is an explicit user principle: documentation must reflect current state, not aspirational state. Stale/aspirational content in test plans actively harms future sessions.

11. **UAT maintenance as session activity**: The final 25 minutes are pure UAT document review and cleanup — not building, not testing. This is a REVIEW activity that doesn't fit BUILD or TEST. It validates REVIEW as a parent type.

### Session 0115fcb4 — brains/moderate (KNOWLEDGE, not BUILD)

12. **Conversational ratio as type signal**: 53 user prompts vs 51 tool calls = 1.04:1 ratio. Most sessions are 1:10+. This near-1:1 ratio is a strong signal for interactive knowledge work (workshops, advisory) vs build work (where Claude runs many tools per user prompt). Could be a computable classifier.

13. **External tool injection pattern**: User pastes Dent Canvas Wizard output into Claude session for processing. This is cross-tool injection: SaaS product output -> Claude -> brain files. Different from cross-session refs (Claude output -> Claude) or context pastes (documentation -> Claude).

14. **Voice artifact density correlates with session type**: This session has the highest voice artifact density observed: "understan d", "pelase", "value cnvas", "playwrite", "wego", "raws". Knowledge/workshop sessions may produce more voice artifacts because user is thinking aloud rather than dictating precise instructions.

15. **Misunderstood request from voice dictation**: Claude offered Playwright when user asked about the "vercel browser" tool — a voice-dictation interpretation error. P13 (has_misunderstood_request) fires here. The trigger is ambiguous voice input, not Claude reasoning failure.

### Session 31ffb14e — prompt.supportsignal/moderate (OPERATIONS, not BUILD)

16. **POEM executor pattern confirmed (3rd occurrence)**: `*run 107` matches the pattern from wave 5: `*run`/`*execute` + Task/TaskOutput dominant profile = OPERATIONS.poem_executor. The Task (13) + TaskOutput (13) signature is unique to POEM executor sessions.

17. **prompt.supportsignal CWD is universally incidental (confirmed)**: This is the 9th+ session from prompt.supportsignal where CWD doesn't indicate the actual work target. The CWD is the POEM execution platform — the workflow output domain is unknown from CWD alone.

### Session 5f04c048 — v-appydave/light (BUILD confirmed)

18. **Cross-project knowledge transfer pattern**: User pastes 5 WUI reference documents from prompt.supportsignal into a v-appydave session, asking Claude to align the youtube-launch-optimizer workflow with SupportSignal WUI patterns. This is intentional cross-pollination of design patterns between projects.

19. **Session chain initiator detection**: Session explicitly ends with "/capture-context" handover request for continuation. The `session_chain_role: initiator` classification is clear. Handover requests at session end are a reliable initiator signal.

### Session 7115c088 — voz/light (KNOWLEDGE, not BUILD)

20. **Client communication as KNOWLEDGE subtype**: Documenting a Loom video and drafting a client email is knowledge work, not building. Registry classified as BUILD because of 4 Edits + 1 Write, but the targets are documentation files, not product code. Edit target analysis (docs vs code) should inform the classifier.

21. **Human-in-the-loop gap pattern**: 94-minute gap between Phase 1 (doc + email draft) and Phase 2 (confirmation "sent email"). User performed the email sending manually outside Claude, then returned to confirm and update docs. This is an asynchronous human-AI collaboration pattern.

### Session e53117f9 — poem/micro (ORIENTATION confirmed)

22. **Micro orientation is always artifact retrieval**: This micro session follows the exact pattern: question -> Glob -> Read -> answer. The orientation.artifact_retrieval subtype continues to be the dominant micro pattern for genuine (non-junk) sessions.

---

## New Subtypes Proposed

| Subtype                                  | Count (this batch) | Session(s) | Signal                                    |
| ---------------------------------------- | :----------------: | ---------- | ----------------------------------------- |
| build.feature_wave_implementation        |         1          | 0e6fe5b8   | 14K plan paste + multi-sub-wave execution |
| build.feature_request_implementation     |         1          | 849e7e62   | Named FR + PRD + iterative UAT            |
| build.workflow_cleanup_and_alignment     |         1          | 5f04c048   | Cleanup + cross-project alignment         |
| mixed.build_then_review                  |         1          | 12c159ac   | Build + UAT review in one session         |
| knowledge.brand_canvas_workshop          |         1          | 0115fcb4   | Interactive brand methodology in brains/  |
| knowledge.client_documentation_and_comms |         1          | 7115c088   | Client docs + email drafting              |

**Discovery rate**: 6 new subtypes from 8 sessions (0.75/session). Higher than wave 7 (0.50) — likely due to project diversity in this batch.

---

## P13-P16 Trial Results

| Predicate                     | Fired | Sessions                                                                 |
| ----------------------------- | :---: | ------------------------------------------------------------------------ |
| P13 has_misunderstood_request |  1/8  | 0115fcb4 (voice-dictation ambiguity)                                     |
| P14 has_wrong_approach        |  0/8  | None                                                                     |
| P15 has_buggy_output          |  2/8  | 0e6fe5b8 (dark mode issues, DevToolsPanel bug), 849e7e62 (4 bugs in UAT) |
| P16 has_excessive_changes     |  0/8  | None                                                                     |

**Assessment**: P13 and P15 are productive — they capture real friction events. P14 and P16 did not fire in this batch. P13's trigger in 0115fcb4 was voice-dictation ambiguity rather than pure Claude reasoning failure, suggesting P13 may need sub-classification (voice_ambiguity vs reasoning_error). P15 fires on sessions with UAT feedback loops — expected correlation with BUILD sessions.

---

## Cross-Wave Patterns

- **Unauthorized edits now have 2 trigger modes**: (1) Compaction-triggered (W3-20 — Claude acts on restored context), (2) Skill-triggered (849e7e62 — skill loads implementation context, Claude starts building). Both are the same root cause: Claude interprets loaded context as an implicit action queue.

- **Conversational ratio as classifier input**: Sessions with user_prompt:tool_use ratio > 1:3 tend to be KNOWLEDGE/advisory. Sessions with ratio < 1:10 tend to be BUILD/OPERATIONS. The 1:1 ratio in 0115fcb4 is an extreme example. Worth exploring as a computed feature in compute-session-shape.py.

- **prompt.supportsignal CWD reliability**: 9+ sessions now confirm this CWD is always incidental. A hard rule could be added to the classifier.
