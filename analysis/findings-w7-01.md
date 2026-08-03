---
type: analysis
title: 'Findings W7-01'
description: 'Wave 7 analysis (W7-01) of 9 sessions — 11% BUILD accuracy, 4 new subtypes including research.concept_unpacking and knowledge.brain_synthesis.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 7-01

**Sessions analysed**: 9
**Wave date**: 2026-03-22
**Agent**: W7-01
**Projects spanned**: brain-dynamous (2), davidcruwys (1), v-appydave (1), appystack (1), lars (1), apps (1), flideck (1), brains (1)

---

## Session-by-Session Observations

### W7-df728ece — brain-dynamous / micro

**Classification**: META / meta.compaction_flush
**Registry type**: null (not in registry)

Pre-compaction memory flush triggered by the user's `/exit` command in the f2117010 session. Single event only. The flush content captures the CONTEXT GRAPHS / Knowledge RAG research question from the parent session. Zero analytical value as a standalone session but confirms the flush-then-exit pattern — the compaction fired before exit completed.

**Key observations**:

- System-generated flush, not a user work session
- Paired with f2117010 (the source session that was flushed)
- Confirms that flush sessions and their source sessions can be separate JSONL files when the session_id differs

---

### W7-f2117010 — brain-dynamous / light

**Classification**: RESEARCH / research.concept_unpacking
**Registry type**: null (not in registry)

User opens from brain-dynamous CWD with a voice-dictated research question about CONTEXT GRAPHS, Knowledge RAG, Semantic ontology. Single AskUserQuestion tool call before the session was abandoned via `/exit`. The session never completed — Claude started to clarify the scope but was interrupted.

**Key observations**:

- **New subtype proposed**: `research.concept_unpacking` — user wants to decompose a technical concept statement into a researchable scope. Different from `research.operational` (executing known research) or `research.workflow_design` (designing process). This is about taking a dense concept cluster and unpacking what to research.
- Voice artifact: `statment` = statement
- Session pair: this is the source for the df728ece compaction flush. The flush captures this session's single exchange.
- AskUserQuestion tool — interesting that Claude started with clarification, suggesting the prompt was ambiguous enough to warrant it before acting.

---

### W7-5145c4cb — davidcruwys / light

**Classification**: ORIENTATION / orientation.insight_review
**Registry type**: null (not in registry)

User opens from home directory with "Open this for me please." — then pastes a massive Claude Code Insights report covering 59 sessions over 3 days. The Insights report is the primary content of this session. User reads it and discusses key findings.

**Key observations**:

- **New subtype proposed**: `orientation.insight_review` — user reviews Claude Code Insights analytics about their own usage. Distinct from `orientation.cold_start` (first time) or `orientation.artifact_retrieval` (retrieving prior context). This is meta-review of aggregate analytics.
- The Insights content itself is extremely rich signal for AngelEye:
  - 860 messages, 59 sessions, 3 days, 209h compute
  - Top tools: Bash (1003), Edit (484), Read (424), Agent (116)
  - Top friction: wrong_approach (23), misunderstood_request (22)
  - 86 overlap events across 54 sessions — high multi-clauding rate (47% of messages)
  - 50 command failures, 38 other errors
- Home directory CWD — always incidental per established rule
- This session pattern suggests David periodically opens Insights to do a meta-review of his own workflow. AngelEye could surface this as an "analytics review" trigger.

---

### W7-d43bcb1a — v-appydave / moderate

**Classification**: KNOWLEDGE / knowledge.brain_creation
**Registry type**: null (not in registry)

User opens from v-appydave (video projects) CWD with a voice-dictated request to create a Mac OS best practices brain. Claude explores existing brain structure (5 Glob + 3 Read) then creates 3 new brain files (3 Write). Session completes in 2 minutes.

**Key observations**:

- **Subtype confirmed**: `knowledge.brain_creation` — distinct from `knowledge.brain_update` (editing existing) and `knowledge.brain_synthesis` (synthesizing multiple sources into new content). This is creating a new brain domain from scratch.
- CWD v-appydave is completely incidental — home terminal was open in video projects while user wanted to work in brains.
- Embedded frustration ("why the fuck does everything disappear") is Mac OS UX annoyance, not Claude-directed. Expletive embedded in knowledge request is a voice-dictation pattern — user doesn't switch register.
- Shape says "moderate" but 13 events / 2 active minutes is correctly "light" by event count threshold. Pre-computed shape used the project's batch label which may have been miscategorized.

---

### W7-649b08de — appystack / moderate

**Classification**: KNOWLEDGE / knowledge.doc_update
**Registry type**: null (not in registry)

User opens from appystack CWD asking for installation instructions (explicitly avoiding the outdated README). Then asks to update the README. 3 ToolSearch calls suggest looking for a recipe-related skill. Session closes with commit+push.

**Key observations**:

- Clear KNOWLEDGE not BUILD: all edits target documentation files. No new routes, components, or product code.
- Multi-phase: info-gathering/edit → commit+push gap (31 min) → clarification+final edit.
- **Skill gap signal**: 3 ToolSearch calls, user reports "recipes don't work at all" when clicking. The ToolSearch pattern suggests looking for a `/recipe` skill or similar. The GitHub README 500 error is a separate issue (rendering bug) from the skill gap.
- Recipe documentation gap confirmed: user explicitly asks about recipe workflow and doesn't understand how they're invoked. This is a candidate for CLAUDE.md improvement.
- Voice artifact: "It should be fairly high in the list; it's almost one of the early things" — characteristic rambling voice-dictated explanation.

---

### W7-a1ebdd28 — lars / moderate

**Classification**: OPERATIONS / operations.client_onboarding
**Registry type**: null (not in registry)

User pastes an email thread from Lars Filtenborg (new client in Denmark) about getting started with OMI, brains folder, and Ansible. Session involves processing emails, creating response materials, archiving the email thread, and closing with explicit "Commit, push, and then exit the conversation."

**Key observations**:

- **New subtype proposed**: `operations.client_onboarding` — managing the onboarding of a new client. Involves email processing, document creation, archival workflows. Distinct from `operations.client_email_processing` (ongoing management).
- **PII detected**: Email addresses (lars@tjeks.dk, david@ideasmen.com.au), client name (Lars Filtenborg), timezone info. AngelEye PII detection flag.
- Overnight gap (13.6 hours) between main work and final commit — user left the session open overnight.
- 3 ToolSearch calls — looking for a client management or email-response skill. Recurring pattern: client work generates ToolSearch calls suggesting unmet skill expectations.
- Voice artifact: "This is information about LAS" — "LAS" is "Lars" via voice transcription.
- The "Boom! There were two of them. I gave you two." prompt is classic voice-dictated exclamation when Claude missed processing a second email in the thread.
- Closing ceremony is explicitly instructed: "Commit, push, and then exit the conversation" — David's standard project close when he wants a clean exit.

---

### W7-d876db56 — apps / heavy

**Classification**: BUILD / build.multi_app_campaign
**Registry type**: null (not in registry)

Session opens with "Yeah, get going with it. Wave 2" — explicit continuation of a multi-app update campaign. 17 Edit + 6 Write + 4 Agent across the /apps/ monorepo root. Second prompt pastes output from a concurrent Claude session (the brains project orientation).

**Key observations**:

- **Genuine BUILD confirmed**: 17 Edit + 6 Write + 4 Agent delegation. Wave-based campaign language, apps/ root CWD as coordination point.
- Pre-computed shape marked as "heavy" but event count (48) and active time (24min) is correctly "moderate."
- **Concurrent session pair detected**: Second prompt pastes terminal output from a concurrent ~/dev/ad/brains session asking "What projects do I have?" — David was running two Claude sessions simultaneously, one doing the campaign wave, one answering orientation questions. This is the multi-clauding pattern confirmed in the Insights data.
- CWD /apps/ is a campaign coordination root — actual edits land in subdirectories (thumbrack confirmed in last line).
- `build.multi_app_campaign` subtype: applying a consistent change across multiple apps in the monorepo, orchestrated from the parent /apps/ directory.

---

### W7-9d791f83 — flideck / heavy

**Classification**: ORIENTATION / orientation.artifact_retrieval
**Registry type**: null (not in registry)

Opens with "Do you have knowledge of where we're up to looking at backlogs or documentation or anything?" — classic context retrieval cold open. 27 Read + 29 Bash + 3 ToolSearch, zero Edit. Session becomes multi-phase: context retrieval → image processing → app startup failure → frustrated abandonment.

**Key observations**:

- **Misclassified BUILD**: This is clearly ORIENTATION/artifact_retrieval despite being in a product repo (flideck). Zero Edit calls. The Bash calls are app execution and diagnostics, not code changes.
- Pre-computed shape marks as "heavy" (74 events) — confirmed. Two idle gaps (209min, 357min) with only 36 active minutes.
- **Frustration signals**: App not running on port 5200, route 404 error, ends with "How do I? exit" and "x" — classic frustrated abandonment after not resolving startup issue.
- **Skill gap**: 3 ToolSearch calls early + question about image placement ("Where would you put them, by the way?") — user expected flideck startup instructions and image workflow to be documented in a skill.
- Playwright calls (browser_install + 2 browser_navigate) used for app UI verification, not testing — confirms Playwright semantics depend on context.
- Phase structure: retrieval (05:04-05:39) → long gap → app troubleshooting (09:08-09:10) → long gap → frustrated exit (15:07).
- **New insight**: `orientation.artifact_retrieval` sessions can become blocked and produce frustrated exits when the context retrieval reveals broken infrastructure. The session type stays ORIENTATION because no new work was done.

---

### W7-59c2d164 — brains / marathon

**Classification**: KNOWLEDGE / knowledge.brain_synthesis
**Registry type**: null (not in registry)

Opens with a 60,390-char compaction resume from a prior session (agentic-os JSON validation work). Session continues extensive agentic-os architecture documentation: editing brain files, creating machine-readable system.json, staging documents for NotebookLM presentation, 4-phase structure over 5.75 hours.

**Key observations**:

- **Confirmed KNOWLEDGE not BUILD**: CWD brains/, 18 Edit + 3 Write all target brains/agentic-os/ documentation. Bash calls are for git operations and Python validation (not app code).
- **New subtype confirmed**: `knowledge.brain_synthesis` — reading multiple brain sources, editing/updating, creating machine-readable formats, staging for external tools (NotebookLM). More complex than `knowledge.brain_update` (simple edits) or `knowledge.brain_creation` (new domain).
- **Compaction resume confirmed**: 60,390-char first prompt is a structured compaction handover with prior Bash output and tool results embedded.
- **Multi-phase** (4 phases): JSON validation → NotebookLM staging → quality review → machine-readable JSON request. Clear phase transitions on time gaps and topic shifts.
- Mild frustration: "I feel like when you got me all the documents and put them into TMP earlier, you missed a whole section" (Ansible) — repeated twice. Claude had staged files from one subdir but missed another. Classic context-exhaustion/scope miss.
- Brief voice commands throughout: "push it", "commit this", "stack" — single-word follow-through commands that assume context.
- Session references KybernesisAI/kyberbot as a prior knowledge source — cross-repo knowledge extraction pattern.
- NotebookLM prompt design is a recurring pattern from prior waves — user wants to generate AI presentation materials from brain docs.

---

## Wave-Level Observations

### Pattern 1: BUILD misclassification rate in wave 7 = 1/9 (11%)

Only W7-d876db56 (apps campaign) is genuine BUILD. The other 8 sessions are META, RESEARCH, ORIENTATION (x2), KNOWLEDGE (x3), OPERATIONS. Without registry types to compare against, the baseline BUILD rate appears very low for this batch — this may be because the batch was selected from diverse project types rather than product repos.

### Pattern 2: New subtypes discovered (4)

1. `research.concept_unpacking` — decomposing a concept cluster into research scope (f2117010)
2. `orientation.insight_review` — reviewing Claude Code Insights analytics (5145c4cb)
3. `operations.client_onboarding` — new client setup workflow (a1ebdd28)
4. `knowledge.brain_synthesis` — multi-source synthesis with machine-readable output (59c2d164)

### Pattern 3: CWD incidental in 5/9 sessions

- df728ece: brain-dynamous (compaction artifact)
- f2117010: brain-dynamous (home terminal)
- 5145c4cb: /Users/davidcruwys (home dir)
- d43bcb1a: v-appydave (unrelated video project terminal)
- d876db56: /apps/ root (campaign coordination point, not a specific project)

CWD is unreliable in 56% of this batch. The oddball CWD rules from Wave 5 continue to hold.

### Pattern 4: PII flagged in 1 session

W7-a1ebdd28 (lars) contains: email addresses, client names, timezone/availability info. AngelEye needs PII detection for client work sessions.

### Pattern 5: Skill gap signals in 3/9 sessions (33%)

- W7-649b08de: recipe skill/documentation (3 ToolSearch)
- W7-a1ebdd28: client management skill (3 ToolSearch)
- W7-9d791f83: flideck startup/image workflow skill (3 ToolSearch)

The 3-ToolSearch threshold for skill gap signal continues to be reliable. All three match the pattern of a user expecting a skill that doesn't exist.

### Pattern 6: Concurrent multi-clauding confirmed in W7-d876db56

The apps campaign session includes a paste from a concurrent brains session. Consistent with the 47% multi-clauding rate from the Insights report reviewed in W7-5145c4cb. AngelEye should detect session content pastes from other sessions as a cross-session relationship signal.

### Pattern 7: Frustration-to-exit pattern in flideck (W7-9d791f83)

App startup failure → multiple failed troubleshooting attempts → gap → gap → "How do I? exit" / "x". This is a new frustration pattern variant: infrastructure-blocked orientation leading to complete abandonment rather than escalation or explicit correction. The 3 ToolSearch calls early suggest the user expected to find documentation but didn't — then couldn't get the app running either.

---

## Subtype Candidates (Wave 7 additions)

| Subtype                      | Count | Key signal                                                           |
| ---------------------------- | :---: | -------------------------------------------------------------------- |
| research.concept_unpacking   |   1   | User gives dense concept cluster, asks to unpack into research scope |
| orientation.insight_review   |   1   | User opens Claude Code Insights report and reviews analytics         |
| operations.client_onboarding |   1   | Email paste + doc creation + archival for new client                 |
| knowledge.brain_synthesis    |   1   | Multi-source brain synthesis + machine-readable output               |

---

## Schema Notes

No schema changes needed. All v2 fields populated correctly. One note: pre-computed shapes included `session_scale` labels in the wave batch description but the shapes themselves don't include this field — it was derived from event counts. The W7-d43bcb1a shape was labelled "moderate" in the batch but 13 events / 2 active minutes is correctly "light."
