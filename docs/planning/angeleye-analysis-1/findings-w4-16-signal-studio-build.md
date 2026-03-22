# Findings: w4-16 — signal-studio / BUILD (challenged)

**Session ID**: f9a685e2-5105-4a5a-883a-25661196d055
**Project**: signal-studio
**Project dir**: `/Users/davidcruwys/dev/clients/supportsignal/signal-studio`
**Date range**: 2026-03-13T06:52 → 2026-03-14T02:22 (~19.5 hours, likely two working blocks)
**File size**: 160,877 bytes / 429 events
**Registry classification**: BUILD
**Analysed classification**: BUILD + UI_REVIEW + DESIGN_EXPLORATION (multi-phase)

---

## Classification Challenge

The registry labels this BUILD. That is accurate for the first ~2 hours but undersells the session. The session has three distinct phases:

1. **BUILD** (07:00–07:54): AWB integration feature — backend endpoint, env var rename, Edit/Read/Bash heavy
2. **UI_REVIEW via Playwright** (07:54–16:33): Visual style audit of all Signal Studio pages using Playwright MCP screenshots, then live edits driven by visual feedback
3. **DESIGN_EXPLORATION** (01:23–02:22, next calendar day): AWB landing page variants (V7–V17 mock HTML pages), AppyStack recipe concept formalisation, resumed via compaction

A more precise classification would be `BUILD+UI_REVIEW` or `MIXED_BUILD_DESIGN`. The `mixed` tool_pattern in the registry is the strongest signal — pure BUILD sessions lean Edit/Write heavy with low Playwright MCP counts. Here, Playwright MCP accounts for 100 events (navigate + screenshot + click + snapshot + resize), which is atypically high for a feature build.

---

## Session Narrative

### Phase 1: AWB Integration Build (06:52–07:54)

The session begins with a handover prompt (pasted from another agent/session) describing two AWB integration tasks for Signal Studio:

- **Moments → AWB**: New POST endpoint `/api/moments/:id/send-to-awb` + "Analyse in AWB" button on MomentsView
- **Incidents → AWB**: Fix existing `buildPoemPayload()` to include full participant fields (described as a 10-line change)

David immediately asked "Is this simple enough to do right now?" — Claude read the codebase (Glob, Grep, Read burst on lines 3–15) and then confirmed yes. Build started on line 16 with "rename it to AWB URL and yes you can start building."

Key BUILD actions:

- Renamed env var from `POEM_URL` (or similar) to `AWB_URL` across server and client (lines 17–35: Read + Edit burst)
- Port conflict encountered — Signal Studio client jumped to port 6041 instead of 6040 due to something already on 6040; this confused the server which was hardcoded to 6041 (line 38, full EADDRINUSE error paste). Resolved via Bash + Edit (lines 39–45)
- AWB endpoint and button built (lines 17–79 broadly, with sub-bursts of Edit)
- Brief concern from David that code had been reverted (line 87: "Have you gone and reverted my code?") — this was investigated via git status (lines 88–92); likely a visual glitch or hot-reload artefact, not an actual revert
- David asked about unit tests (line 93), discussed E2E limitations for cross-boundary systems (line 96), then declared "we don't need tests" (line 99)

### Phase 2: Playwright UI Audit (07:54–~16:33)

David asked Claude to commit then run a full visual audit of the running app on port 6040 using Playwright MCP (line 100). Claude invoked the `frontend-designer` skill (line 101), then launched into Playwright navigation.

The Playwright block is large — 42 screenshots, 31 navigates, 26 clicks. Pages audited include: Dashboard, Participants, Moments list, Moment detail, Incidents list, Incident detail, and others.

Key UI issues surfaced and acted on:

- **Incident list table columns**: Too wide; David asked to drop Company and Reporter columns, shorten Event Time (line 192–199 Edit burst)
- **Button colour inconsistency**: Delete/danger button was red on one screen but unstyled on others (line 205). David asked for consistency but then withdrew the status-change request (line 206)
- **Moments heading confusion**: Dashboard showed count of 5, Moments page showed 1 — data/filtering mismatch noted
- **Incident "New" colour**: The "new incident" badge and "New Incident" button used off-brand colours — David called this out as the most important issue (line 207). Claude fixed via Read + Grep + 5 × Edit (lines 208–229)
- **AWB/POEM rename cleanup**: Remaining "POEM" strings in toast messages and error messages renamed to "AWB"

A notable gap: between approximately lines 120 and 180 (timestamps 07:55–14:24, roughly 6.5 hours), there are no user_prompts — only tool_use events. This suggests Claude was working autonomously on the visual audit while David was away. This is plausible given the Playwright screenshot loop.

### Phase 3: Design Exploration — AWB Landing Variants (01:23–02:22, next day)

The session was resumed via a compaction summary injected as a user_prompt on line 316 (~700 lines of summary). This is the largest single prompt in the session.

The compaction reveals work that happened in a prior context window (not visible in this JSONL chunk):

- V7–V17 mock HTML landing page variants created in `poc/wui/mock-landing-pages/`
- `LandingScreen.jsx` rewritten using V15 Magazine layout + V13 warm earth palette
- David gave detailed design feedback on all 17 variants

After resumption, Claude took wide-viewport MCP screenshots of all 17 variants (lines 317–349, navigate+screenshot pairs), then worked on the AWB workflow step indicator to match V10's pipeline style (lines 380–418, Grep + Read + Edit + MCP verify).

David then complained (line 401) that the post-compaction work missed most of what he asked for — specifically the design preference write-up and comparative analysis. Claude launched two Agent sub-calls (lines 403 and 419) to catch up. The session ended with Write + Edit operations (lines 423–428) producing the write-ups.

Final line 420 contains `"Unknown skill: near-compassion"` as a user_prompt — this is an accidental input, likely a voice-to-text error or stray paste.

---

## Tool Pattern Analysis

| Category        | Tools                                         | Count | % of tool_use |
| --------------- | --------------------------------------------- | ----- | ------------- |
| Code editing    | Edit, Write                                   | 82    | 20.8%         |
| Code reading    | Read, Grep, Glob                              | 116   | 29.4%         |
| Runtime / shell | Bash                                          | 80    | 20.3%         |
| Playwright MCP  | navigate, screenshot, click, snapshot, resize | 101   | 25.6%         |
| Agent/skill     | Agent, Skill, ToolSearch                      | 16    | 4.1%          |

The 25.6% Playwright share is anomalously high for a BUILD session. A pure BUILD session would typically see Playwright MCP under 5%. The session genuinely has a UI_REVIEW character that the registry's single label misses.

34 user prompts across 429 events gives a prompt-to-tool ratio of approximately 1:11.6 — Claude was taking many autonomous actions per user message, consistent with the 6.5-hour autonomous Playwright audit block.

---

## Key Facts for AngelEye Knowledge Base

- **Port assignment**: Signal Studio is on 6040 (client) / 6041 (server). AWB POC is on 5040/5041. This caused confusion during the session when 6040 was already in use.
- **AWB env var**: The integration env var is `AWB_URL` (previously `POEM_URL` or similar). This is in Signal Studio's server config.
- **Warm earth palette** used for AWB landing variants: `#f5f0e8` (page bg), `#342d2d` (dark text/header), `#FFDE59` (accent yellow), `#e0d4b8` (border). Bebas Neue for display headings.
- **5 app entry shell archetypes** formalised: Split, Tiles, Minimal, Compact, Hero — with three universal zones (Identity / Navigation / Action). These are abstract AppyStack recipe candidates.
- **Compaction event at line 316**: Very long compaction summary injected as a user_prompt. AngelEye should be able to detect these (large prompt containing "This session is being continued from a previous conversation" and "Summary:").
- **Accidental prompt at line 420**: `"Unknown skill: near-compassion"` — likely voice-to-text artefact. AngelEye's classifier should recognise these as noise.
- **Agent sub-calls at lines 403 and 419**: The main session spawned sub-agents. These will appear as `isSidechain: true` entries in separate `agent-*.jsonl` files.

---

## Classification Recommendation

| Field                      | Value                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registry classification    | BUILD                                                                                                                                                        |
| Challenged?                | Yes — undersells scope                                                                                                                                       |
| Recommended classification | MIXED (BUILD + UI_REVIEW + DESIGN_EXPLORATION)                                                                                                               |
| Basis for challenge        | Playwright MCP = 101 events (25.6%), visual design work spans >12 hours of session time, design artefacts created (17 HTML mock pages, AppyStack recipe doc) |
| Interest level             | high                                                                                                                                                         |

---

## Patterns Worth Noting for AngelEye

1. **Long autonomous Playwright blocks** produce a very low user_prompt density — the session looks like a BUILD if you only count edits, but the Playwright volume reveals the true character.
2. **Compaction summary as user_prompt** is detectable by content prefix. These are not real user intent — they are context reconstruction. AngelEye should tag these as `compaction_resume` event subtype.
3. **Multi-day session** (06:52 Mar 13 to 02:22 Mar 14) with long gaps between user prompts (the 6.5-hour gap at ~08:00–14:30). The session is `status: ended` in the registry despite spanning ~19.5 hours — ended means the Claude Code process closed, not that it was a short session.
4. **Voice-to-text noise**: `"why? i"` (line 36) and `"Unknown skill: near-compassion"` (line 420) are characteristic voice input artefacts. These should be classified as noise/accidental rather than intent signals.
