# Findings: W2-07 — brains / dynamous research (2ed25517)

## Classification

- **Registry**: TEST / playwright-heavy
- **Analysed type**: RESEARCH / research.web_scraping
- **Confidence**: high
- **Reclassification**: yes — registry classification of TEST is incorrect
- **Reasoning**: The registry classified this as TEST due to heavy Playwright usage (466 Playwright tool calls, 67.9% of all tools). However, the session intent is unambiguously research and content ingestion. David asked for "deep research" into second brains and the Dynamous/Cole Medin ecosystem, then pivoted into systematically scraping Zoom transcript VTT files from the Dynamous Circle community. No product was being tested — Playwright was used as a web automation tool for authenticated site navigation and file download, not for UAT. The composite classifier rule `browser_evaluate > 30 AND browser_navigate > 30 → WEB_AUTOMATION (0.92)` fires correctly. The `project_dir` (brains) further confirms this is knowledge work, not testing. The correct type is `research.web_scraping`.

## Session Shape

- **Events**: 722 (686 tool_use, 36 user_prompt)
- **Total tool invocations**: 686
- **Playwright tools**: 466 (67.9%) — browser_evaluate x163, browser_navigate x146, browser_click x51, browser_type x45, browser_snapshot x40, browser_fill_form x9, browser_take_screenshot x5, browser_wait_for x5, browser_tabs x1, browser_network_requests x1
- **Non-Playwright tools**: Bash x174, ToolSearch x23, Read x6, Edit x5, Write x5, brave_web_search x5, Agent x1, WebFetch x1
- **Duration**: ~8.5 hours wall clock (2026-03-08T06:44 to 15:13), with two major gaps (~2h from 06:55–09:07 and ~3.5h from 09:21–12:49)
- **Real user prompts**: 27 (excluding 9 context-continuation summaries)
- **Context continuations**: 9 — the session exhausted context and was resumed 9 times using compaction summaries
- **Brain subfolder**: `cole-medin/` and `~/dev/upstream/community/dynamous/` (upstream ingestion target)
- **Opening style**: voice-transcribed research request
- **cwd shift**: Session started at `/Users/davidcruwys/dev/ad/brains`, shifted to `/Users/davidcruwys/dev/ad/brains/.playwright-mcp` partway through (Playwright download directory)

### Skills

- None invoked via `/skill` mechanism. The session used raw Playwright MCP tools directly.

### Phase Structure

The session has five distinct phases:

1. **Research & Discovery (06:44–06:55)**: David asks about second brains and the Dynamous/Cole Medin ecosystem. Agent delegated, brave_web_search x4, WebFetch x1. Initial exploration of what's available.

2. **Community Login & Exploration (09:07–09:21)**: 2-hour gap, then David provides Circle community credentials. Playwright logs in, navigates community.dynamous.ai. David asks "put yourself in my shoes" — what content is interesting? Discussion of upstream folder structure and what to capture locally. Ends with an Edit+Write to create initial notes and a git repo plan.

3. **Transcript Download Campaign (12:49–14:46)**: The bulk of the session. Systematic scraping of Zoom recording transcripts from ~200 Dynamous community events. Circle event pages navigated, Zoom recording URLs extracted via browser_evaluate, passcodes entered via browser_type, transcript VTTs downloaded, moved to `~/dev/upstream/community/dynamous/live-events/`, MP4/m4a cleanup after each download. This phase contains all 9 context continuations — the session hit context limits repeatedly and was resumed with compaction summaries carrying forward the task state. The repetitive navigate→type_passcode→click_download→bash_mv→bash_rm cycle is the characteristic fingerprint. Approximately 59 transcripts were downloaded by session end.

4. **Brain Quality Testing (14:46–15:08)**: David pivots to testing whether the downloaded content is discoverable. Asks "where did we document this?" then proposes 5 questions to ask fresh Claude instances to test brain discoverability. Claude edits brain files to improve discoverability. David pastes back the responses from 5 clean Claude instances, evaluating whether each gave correct answers. One question (Q1) got a wrong answer, one (Q5) partially wrong — directly leading to brain file improvements.

5. **Closing Ceremony (15:08–15:13)**: David says "Shane, you're meant to read this and see whether it gave the right answer." Followed by "Can you commit and push please?" then "continue." Git commit and push executed. Session ends.

## Observations

1. **Misclassification root cause**: The playwright-heavy tool pattern triggered a TEST classification, but the session has zero test assertions, zero UAT intent, and zero product-under-test. Playwright was used purely as a web scraping tool. This is the exact scenario the framework warns about: tool-only classification fails for knowledge/brain sessions. The composite `(project_dir=brains, tool_pattern=playwright-heavy)` pair should map to RESEARCH, not TEST.
2. **Marathon scraping session with 9 context continuations**: This is an extreme example of a repetitive automation task that exhausted context 9 times. Each continuation carried forward the task list, technical approach (JS snippets for Zoom download), and progress counter. The compaction summaries are remarkably detailed — they function as self-contained handover documents with code snippets, error fixes, and remaining work items.
3. **Voice transcription artifacts throughout**: "cirle" (Circle), "Colmeddon" (Cole Medin), "cole medan" (Cole Medin), "dynamus" (Dynamous), "transcriptive" (transcript). The opening prompt is clearly voice — "We've got my own brain. We've got the brain siblings directory."
4. **Credential exposure in prompt**: Line 19 contains a login URL, email, and password in plaintext. David directly pasted credentials into the prompt for Claude to log in via Playwright. This is a security pattern worth noting — the JSONL transcript permanently records these credentials.
5. **Brain quality testing loop is novel**: Phase 4 shows David running 5 fresh Claude instances with test questions, pasting their responses back into this session for evaluation. This is a manual eval loop — testing whether second brain content is discoverable by a clean agent. The pattern is: (a) formulate test questions, (b) run them in isolated instances, (c) paste results back, (d) edit brain files based on failures, (e) re-run. This is effectively a brain discoverability UAT, but the session type remains RESEARCH because the primary purpose and tool budget is web scraping.
6. **59 transcripts downloaded in one session**: The destination was `~/dev/upstream/community/dynamous/live-events/` with files named `YYYY-MM-DD-kebab-title.transcript.vtt`. A `SCRAPING-GUIDE.md` and `index.md` were created or updated as documentation artifacts.
7. **Closing ceremony present**: "Can you commit and push please?" followed by "continue" — a standard David closing pattern. The session ends with git operations.

## Patterns Found

- **Web scraping marathon pattern**: A session whose primary value is bulk-downloading content from an authenticated web platform. Characterized by: (a) extremely high Playwright tool count, (b) repetitive navigate→interact→download→cleanup cycle, (c) multiple context continuations with detailed handover summaries, (d) Bash used for file moves and cleanup between browser actions. This is distinct from test.uat_execution because there is no product under test.
- **Context continuation as handover document**: The 9 compaction summaries in this session are more detailed than most handover documents. They contain: task state, technical approach with code snippets, error fixes discovered, files created, remaining work items with exact counts. The compaction summary format functions as an implicit handover protocol.
- **Brain discoverability eval**: Phase 4 introduces a manual evaluation pattern — asking test questions to fresh Claude instances and grading the responses. This is a form of knowledge quality assurance that could become a formalized workflow (the "brain librarian" role David mentions).
- **Research-to-knowledge pipeline**: The session moves from research (discovery) through web scraping (ingestion) to knowledge QA (validation). This is the full upstream ingestion pipeline: discover → authenticate → download → organize → test discoverability → commit.

## New Types or Subtypes Proposed

- **research.web_scraping (confirm existing)**: This session is the strongest example yet. The subtype signal `browser_evaluate > 30 AND browser_navigate > 30` fires with browser_evaluate=163 and browser_navigate=146. The project_dir=brains discriminator is essential — without it, the Playwright volume would classify as TEST.
- **Subtype candidate: research.ingestion_campaign**: A potential refinement of research.web_scraping for marathon sessions focused on bulk content download rather than investigation. Signals: (a) context continuations >= 3, (b) file Write/Bash mv pattern in repetitive cycles, (c) destination path contains "upstream". Not proposing as a formal new subtype yet — needs more examples.

## Subtype Candidates Confirmed

- **research.web_scraping**: Strongly confirmed. This is the canonical example. The composite classifier rule `browser_evaluate > 30 AND browser_navigate > 30 → WEB_AUTOMATION (0.92)` plus `project_dir contains brains → KNOWLEDGE_WORK (not infra)` together produce the correct classification.

## Interest Level

high — This session is valuable for three reasons: (1) it demonstrates a clear misclassification case where tool-only signals produce the wrong session type, directly validating the framework's warning about bimodal accuracy, (2) it contains the longest context-continuation chain in the dataset (9 resumptions) with high-quality handover summaries, making it a reference case for understanding how marathon scraping sessions behave, and (3) the Phase 4 brain discoverability testing pattern is a novel workflow that could inform AngelEye's knowledge quality features.
