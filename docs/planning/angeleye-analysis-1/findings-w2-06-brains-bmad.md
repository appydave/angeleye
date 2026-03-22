# Findings: W2-06 — brains/bmad-method (4e8c5897)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: knowledge.brain_update (Phase 1) pivoting to orientation.advisory (Phase 2-4)
- **Primary type**: orientation.advisory (proposed new subtype)
- **Confidence**: high
- **Reasoning**: The registry classification of BUILD is incorrect. The `project_dir` is `/dev/ad/brains` which should block BUILD per the composite classifier rule (`Bash dominant AND project_dir contains brains -> KNOWLEDGE_WORK`). Phase 1 (lines 1-46, ~5 minutes) is a textbook `knowledge.brain_update` driven by the `/refresh-bmad-brain` skill: git pull upstream BMAD-METHOD repo, diff changelog, update brain files (v6-fundamentals.md, SOURCES.md, INDEX.md). Phase 2 onwards (~4.5 hours across 3 days) is the session's dominant character: David uses this session as a persistent BMAD method advisor while he works with BMAD agents (John the PM, Sally the UX designer) in parallel sessions. This is the Sally/Advisor pattern described in the framework's Angle 2 (Conversation Role) — this session is the SUPPORT/ADVISORY conversation. The brain refresh was just the warmup; the advisory work is 95% of the session's value and volume.

## Session Shape

- Events: 366 lines (158 tool_use, 101 user_prompt, 95 stop, 6 subagent_stop, 5 subagent_start, 1 session_end)
- Tools used: Bash (75), Read (53), Edit (14), Grep (5), Write (5), Agent (5), Glob (1) — total 158
- User prompts: 101
- Subagents: 5 (1 in Phase 2, 1 in Phase 3, 3 in Phase 4)
- Duration: ~4 days wall clock (2026-03-16T01:39 to 2026-03-20T03:01), active across 4 sessions with large gaps
- Active work time: ~8-9 hours estimated from event clustering
- Opening style: skill invocation (`/refresh-bmad-brain`)

### Skills

- **refresh-bmad-brain** (line 1): session opener, triggered the brain sync from upstream BMAD-METHOD repo

### Brain Subfolder

- **bmad-method** — all knowledge work targets `~/dev/ad/brains/bmad-method/` (v6/v6-fundamentals.md, INDEX.md, SOURCES.md)
- Also touches SupportSignal planning docs and Claude memory files in later phases

### Session Phases (4 distinct phases across 3 days)

**Phase 1 — Brain Refresh (Mar 16, 01:39-01:44, ~5 min)**
Lines 1-46. Pure knowledge.brain_update. Skill-driven: git pull BMAD-METHOD, read CHANGELOG, explore new repo structure (src/bmm/, src/core/), update 3 brain files. Output: BMAD v6.0.4 -> v6.2.0 delta documented. 44 tool calls, zero user prompts after the initial skill invocation.

**Phase 2 — BMAD Agent Advisory for John/PRD (Mar 16, 01:46-14:13, ~10h wall / ~4h active)**
Lines 47-189. Session pivot: David immediately asks two strategic BMAD questions, then begins using this session as his thinking layer while working with John (PM agent) in a separate BMAD session building the SupportSignal PRD. David pastes John's output here, gets advisor guidance, formulates responses, returns to John's session. ~55 user prompts. Covers PRD Steps 1-13. Includes a /compact at line 123. Subagent launched at line 107 to read planning documents. Key decisions: greenfield vs brownfield, v1 scope negotiations, Epic prioritization.

**Phase 3 — BMAD Agent Advisory for Sally/UX (Mar 18, 03:44-06:20, ~2.5h)**
Lines 190-279. Two-day gap. David returns with Sally the UX designer running in parallel. Same advisory pattern: David pastes Sally's UX design steps here, advisor analyzes and drafts paste-back responses. Covers Sally's 14-step UX specification. Key outputs: emotional design for NDIS care workers (Priya/Kai personas), component strategy, design system decisions. Includes Playwright research suggestion, WCAG AA compliance discussion.

**Phase 4 — Meta-Reflection and Oversight Tooling (Mar 20, 02:23-03:01, ~40 min)**
Lines 280-366. Two-day gap. David returns asking meta-questions: "Has this conversation been working with an advisor?" — explicitly reflecting on the advisory pattern. 3 subagents launched to research oversight architecture. Key outputs: bmad-oversight-role.md written, bmad-planning-state.md memory file created, bmad-oversight.md command created for SupportSignal app. Session ends naturally with information about third-party references.

## Observations

1. **Canonical example of the Session Pivot Pattern**: Phase 1 is knowledge.brain_update. Within 2 minutes of the refresh completing (01:44 stop -> 01:46 next prompt), David asks strategic BMAD questions and the session permanently becomes an advisory conversation. It never returns to brain maintenance. This is the exact pattern described in the framework under "Session Pivot Pattern" — and notably, the framework cites this very session (4e8c5897) as the example.

2. **Canonical example of the Sally/Advisor Pattern**: Phases 2-3 are the textbook implementation of the framework's Conversation Role distinction. David maintains parallel sessions with BMAD agents (John, Sally) and uses this session as the invisible advisory layer. Sally never sees this conversation. The paste-back pattern is explicit: advisor drafts responses, David copies them into the primary session.

3. **Voice transcription is pervasive**: Nearly every user prompt shows voice artifacts — run-on sentences ("If I was starting a new project, what would be the first three agents I'm working with?"), corrections mid-thought ("sThe fact that we only use Tailwind version 4"), repetitions (lines 273-274 are duplicate prompts), informal speech patterns ("now what?", "yes", "I don't have a lot of insight but").

4. **Three BMAD agents referenced across sessions**: John the PM (Phase 2, PRD creation Steps 1-13), Sally the UX designer (Phase 3, UX specification Steps 1-14), and the concept of Winston (architect) discussed but not yet engaged. The session tracks agent sequencing decisions.

5. **Correction and contradiction catching**: The advisor catches issues Sally cannot see: WCAG AA was called "non-negotiable for NDIS" but David pushes back ("things that affect functionality because they're for compliance reasons do not get precedence"). Blue action button contradicts the design language. These cross-session contradictions validate the framework's "Cross-Session Contradiction Detection" concept.

6. **101 user prompts — highest prompt count seen**: This is an extraordinarily conversational session. The majority of exchanges are short (David pastes, advisor responds with paste-back draft, David confirms with "yes" or "now what:"). The Q&A cadence resembles a real-time collaborative editing session.

7. **Closing ceremony absent**: The session ends naturally at line 365 with a factual answer about third-party references. No explicit "close it off" or "say yay" ceremony. Session_end follows 32 seconds later. This suggests the session was left to expire rather than deliberately closed.

8. **Files written span 3 projects**: Brain files (bmad-method/), SupportSignal planning docs (supportsignal-v2-planning/), and Claude memory files (two project memory directories + a command file). The advisor's output crosses project boundaries, which is characteristic of advisory work.

9. **BUILD misclassification confirmed**: The bash-heavy tool pattern triggered BUILD classification. But the 75 Bash calls are exploratory reads (ls, find, grep, cat, head) and git pulls — not build commands. The 14 Edits target brain files and planning docs, not application code. Zero application code was modified. The composite rule `project_dir=brains -> KNOWLEDGE_WORK` should have been applied.

## Patterns Found

- **Pivot-from-skill**: A brain-refresh skill completes, and the warmed-up context immediately enables a strategic advisory conversation. The skill invocation is a context-loading mechanism, not the session's purpose. Detection signal: skill completes in first 5 minutes, then user asks strategic questions about the domain the skill just refreshed.
- **Paste-and-draft-back loop**: The dominant interaction pattern in advisory sessions. David pastes agent output -> advisor analyzes -> advisor drafts a response -> David confirms ("yes") or refines -> David copies to primary session. The confirm/refine step is usually 1-3 words.
- **Multi-day advisory persistence**: The session spans 4 days with 3 active windows. Each return is with a different BMAD agent in the primary session (John, then Sally, then meta-reflection). The advisory context persists across agent changes because the advisor session maintains the full history.
- **Meta-reflection trigger**: After extensive advisory use, the user reflects on the pattern itself ("Has this conversation been working with an advisor?") and formalizes it as a tool (bmad-oversight command). This is the pattern-to-tool evolution: observe a useful pattern, name it, then build it.

## New Types or Subtypes Proposed

- **orientation.advisory** — A session whose primary value is acting as a thinking/preparation layer for decisions made in a parallel primary session. Distinguished from knowledge work (no brain artifacts are the primary output) and from orientation.ideation (tools are used, artifacts are produced, but they serve another session). Signals: high prompt count, short user prompts (pastes + confirmations), responses structured as paste-back drafts, references to agents/sessions the advisor cannot see. This is the programmatic form of the Conversation Role "Support/Advisory" distinction.

## Subtype Candidates Confirmed

- **knowledge.brain_update**: Phase 1 confirms this subtype cleanly. Signal: Edit/Write in brains dir after skill-driven exploration of upstream source. The refresh-bmad-brain skill is a formalized version of this pattern.
- **Session Pivot Pattern**: Confirmed. This is the session cited as the canonical example in the framework. The pivot from knowledge.brain_update to advisory happens within 2 minutes and is permanent.

## Interest Level

high — This is one of the most valuable sessions in the dataset for three reasons: (1) it is the canonical real-world example of the Sally/Advisor pattern that the framework's Conversation Role (Angle 2) was designed to capture, (2) it demonstrates the Session Pivot Pattern that the framework documents, and (3) it contains the meta-reflection moment where David explicitly recognizes the advisory pattern and formalizes it as a tool — the pattern discovering itself. For video content, the two-actor interplay (Priya the support worker, Kai the team leader) and the cross-session contradiction detection are both strong visualization candidates.
