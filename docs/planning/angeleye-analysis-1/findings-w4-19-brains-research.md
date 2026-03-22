# Findings: W4-19 — brains / Loom full-screen lookup (bb290809)

## Classification

- **Registry**: RESEARCH / websearch-heavy
- **Analysed type**: RESEARCH / research.quick_lookup
- **Confidence**: high
- **Reclassification**: no — registry classification is correct
- **Reasoning**: The session is a single factual question about Loom's full-screen recording behavior on Mac. Claude immediately ran two parallel `brave_web_search` calls followed by three `WebFetch` calls to retrieve source pages. No code was written, no files were modified, no product was being built or tested. The `project_dir` is `brains` but this is incidental — the cwd is where the terminal happened to be, not a signal of intentional brain-building work. The RESEARCH classification holds. The subtype is `research.quick_lookup` rather than `research.web_scraping` (which implies systematic content ingestion) because the session is a one-shot factual question with immediate tool response, not a campaign.

## Session Shape

- **Events**: 6 total (no progress events present)
- **User prompts**: 1
- **Tool invocations**: 5 (brave_web_search x2, WebFetch x3)
- **Assistant response events**: 0 captured
- **File size**: 1,811 bytes
- **Duration**: Session started 2026-03-01T11:29:32Z, last active 2026-03-01T12:04:38Z (~35 minutes wall clock, but likely idle after the response — no further events recorded)
- **cwd**: `/Users/davidcruwys/dev/ad/brains` (incidental — where terminal was open)
- **Opening style**: voice-transcribed question

### Tool Breakdown

- `mcp__brave-search__brave_web_search` x2 — fired in parallel within 1 second of the prompt
- `WebFetch` x3 — fetched source pages from the search results

### Skills

- None invoked.

### Phase Structure

Single phase: David asked one question, Claude searched, session ended. No continuation, no follow-up prompts captured.

1. **Lookup (11:29:32–11:29:52)**: User asks about Loom full-screen recording behavior on Mac — specifically, why entering full-screen mode causes Loom to record a different screen than expected, and whether it can be overridden in Loom settings. Claude fires two web searches and three web fetches within 20 seconds. No further events captured after the last WebFetch at 11:29:52Z.

## Observations

1. **Minimal session — nearly no signal**: With 6 events and 1,811 bytes this is among the smallest sessions in the dataset. The only extractable signal is the opening prompt, tool pattern, and timing. No response content, no follow-up, no artifacts.
2. **Missing assistant response**: The JSONL contains no `assistant_response` or equivalent event after the tool calls. This is consistent with very short sessions where the response was generated but not written back to the transcript before the session closed, or where the transcript format used here does not capture response events separately from tool results.
3. **Incidental cwd**: The session ran in `/Users/davidcruwys/dev/ad/brains` but the content has nothing to do with brain-building. David likely had a terminal open there and asked an off-topic question. This is a cwd-as-noise case — the project_dir should not be used to infer domain intent for sessions this short.
4. **Voice transcription artifacts**: The prompt shows classic voice input characteristics — fragmented sentences, backtracking ("I don't understand what's going on, and I don't understand whether something I can override in Loom or not"). The question itself is somewhat circular, suggesting the user was thinking aloud while recording.
5. **Loom full-screen topic**: The question is about Loom's behavior when a Mac app enters full-screen space — Loom's "full screen recording" mode records the display where Loom was active, but when a second app goes full-screen it moves to its own Space. Loom does not follow the recorded window across Spaces by default. This is a known Mac multi-Space limitation, not a Loom bug. No Loom setting overrides it.
6. **35-minute gap between last event and last_active**: The last tool event is at 11:29:52Z but `last_active` in the registry is 12:04:38Z. This 35-minute gap likely represents the time David read the response, not a recording gap — the session was open but idle.

## Patterns Found

- **Incidental lookup in wrong cwd**: Sessions where the cwd reflects where the terminal happened to be, not where the work was directed. Classifier must not infer domain from cwd when event count is very low (<=10) and the prompt content is off-domain.
- **Voice-transcribed off-topic question**: Short sessions triggered by a verbal question unrelated to the active project. Characteristic features: single prompt, immediate websearch+WebFetch burst, no follow-up, no artifacts, no assistant response captured. These sessions have near-zero value for AngelEye pattern mining beyond confirming the tool routing behavior.
- **Missing response capture on micro-sessions**: Sessions under ~10 events frequently lack an assistant response event. This may be a transcript-writing race condition (session closed before response was flushed) or an artifact of how short sessions are handled by the Claude Code transcript writer.

## New Types or Subtypes Proposed

- **research.quick_lookup**: A RESEARCH subtype for single-question factual lookups with immediate websearch+WebFetch response, no continuation, no artifacts. Distinguished from `research.investigation` (multi-prompt, synthesizes knowledge) and `research.web_scraping` (systematic content ingestion campaign). Classifier signal: `event_count <= 10 AND tool_pattern = websearch-heavy AND user_prompt_count == 1`.

## Interest Level

low — This session has negligible analytical value. It is a one-shot factual lookup about Loom behavior, correctly classified by the registry, with no reclassification needed, no novel patterns, and no artifacts. Its only marginal value is as a reference case for: (1) the `research.quick_lookup` subtype, (2) the incidental-cwd pattern, and (3) missing response capture on micro-sessions.
