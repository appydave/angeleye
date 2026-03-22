# Findings: W3-06 — brains / Claude API + /loop research (b9d30d9f)

## Classification

- **Registry**: RESEARCH / websearch-heavy
- **Analysed type**: RESEARCH / research.knowledge-capture
- **Confidence**: high
- **Reclassification**: no — RESEARCH is correct; subtype refinement only
- **Reasoning**: The registry classification of RESEARCH is accurate. The tool pattern label "websearch-heavy" is also correct — 9 brave_web_search calls plus 12 WebFetch calls account for 65.6% of all tool invocations, making web research the dominant activity. However the subtype is more specific than generic research: this session follows a two-phase pattern of (1) deep web research on a new API/feature, then (2) immediately codifying the findings into a persistent brain document and updating CLAUDE.md with behavioural rules. The correct subtype is `research.knowledge-capture` — research whose terminal artifact is a brain/config write, not just a summary response.

## Session Shape

- **Events**: 34 total (2 user_prompt, 32 tool_use)
- **Total tool invocations**: 32
- **Web research tools**: 21 (65.6%) — WebFetch x12, brave_web_search x9
- **Brain write tools**: 9 (28.1%) — Read x3, Edit x3, Write x1, Bash x2
- **Utility tools**: 2 (6.3%) — ToolSearch x2
- **Duration**: ~1h38m wall clock (08:27–10:05), with a ~1h35m gap between the two prompts (08:29–10:04)
- **Real user prompts**: 2
- **Context continuations**: 0
- **Brain subfolder**: `anthropic-claude/` (specifically `claude-code/` and `ralph-wiggum/` subfolders — the session covers Claude API SDK and the /loop command, which maps to Ralph Wiggum in David's brain taxonomy)
- **Write destination confirmed**: `~/.claude/CLAUDE.md` (global CLAUDE.md) — the `/loop` proactive suggestions section at the top of that file originates from this session's Edit operations
- **Opening style**: voice-transcribed — "One is Claude/Loop, which is kind of like a Ralph Wiggum Loop"
- **cwd**: `/Users/davidcruwys/dev/ad/brains` throughout

### Skills

- None invoked via `/skill` mechanism.

### Phase Structure

Two distinct phases separated by a ~1h35m break:

1. **Web Research Phase (08:27–08:29)**: David asks about two new Anthropic APIs — the Claude API (agent SDK) and the `/loop` command (referred to as "Ralph Wiggum Loop"). Agent immediately fires ToolSearch x2 (likely loading web search and WebFetch tools), then launches a parallel web research campaign: brave_web_search x9 and WebFetch x12 in rapid succession (~2 minutes wall clock). The research phase ends abruptly — Claude likely delivered a long synthesis response which David read during the ~1h35m break.

2. **Knowledge Capture Phase (10:04–10:05)**: David returns with a second prompt. He confirms the Claude API research was "really interesting" and immediately pivots to operationalising the findings: (a) document it in the second brain, and (b) update the global CLAUDE.md with proactive `/loop` suggestion rules so every future session automatically watches for `/loop` use cases. The agent executes: Bash x2 (likely listing/checking existing files), Read x2 (reading existing brain/CLAUDE.md content), Write x1 (creating a new brain file or section), Edit x3 (updating CLAUDE.md with the loop suggestion rules). David also explicitly defers desktop scheduled tasks to a future OMI/email session — "not now."

## Observations

1. **Registry subtype is undersized**: "websearch-heavy" describes the tool distribution correctly but misses the session's most distinctive feature — it terminates in a structured brain write. Most websearch-heavy sessions end with a summary response. This one ends with Write+Edit to both a brain file and the global CLAUDE.md. The `research.knowledge-capture` subtype captures this distinction.

2. **Two-prompt compressed research cycle**: The entire session — from initial question to brain write — fits in exactly 2 user prompts. This is a highly compressed version of the research-to-knowledge pipeline: one prompt to trigger research, one prompt to commit findings. The ~1.5 hour gap is David reading Claude's synthesis, not additional interaction. This session shape (2 prompts, large gap, knowledge write at end) is a recognisable pattern worth naming.

3. **Voice transcription artifacts**: "Ralph Wiggum Loop" is David's voice-transcription of `/loop` — confirmed by the brain taxonomy (`ralph-wiggum/` subfolder exists in `anthropic-claude/`). "Claude/Loop" is another voice artifact. These confirm the opening prompt is dictated, not typed.

4. **CLAUDE.md write-back confirmed**: The `~/.claude/CLAUDE.md` file contains a "Proactive /loop Suggestions" section at the top (lines 1–25) with the exact framing David described in his second prompt — "if you think, David, here's a good idea you could have done with the loop, then I'm going to understand how to use it." The Edit x3 events at the end of this session almost certainly wrote this section. The current CLAUDE.md last-modified date (2026-03-14) reflects later edits, but the content origin is this session.

5. **Desktop scheduled tasks deferred deliberately**: David explicitly scopes the session — "not now" on desktop scheduled tasks. This is a deliberate session boundary pattern. David knows where he wants to go next but intentionally limits scope. The AngelEye registry has no explicit session-boundary signal — this is only visible from the user_prompt content.

6. **Dual-artifact session**: The session produces two persistent artifacts: (a) a brain file in `anthropic-claude/` and (b) a behavioural rule injected into the global CLAUDE.md. The CLAUDE.md write is the higher-impact artifact — it affects every future Claude Code session. Most research sessions produce zero durable artifacts (only a chat response). This session is an outlier.

7. **Research scope matches known brain taxonomy**: The two APIs researched (Claude Agent SDK + /loop) map exactly to two existing brain subfolders: `anthropic-claude/agent-sdk/` and `anthropic-claude/ralph-wiggum/`. This suggests the research was targeted — David knew where findings would land before asking.

## Patterns Found

- **Two-prompt knowledge-capture pattern**: A session where prompt 1 triggers deep web research and prompt 2 commits findings to the brain. Signals: (a) user_prompt count = 2, (b) large time gap between prompts, (c) terminal phase contains Write+Edit to brain files or config, (d) no context continuations. This is distinct from a general research session because the research phase is agent-autonomous (David reads the output offline) and the second prompt is purely operational.
- **CLAUDE.md injection as session output**: The session's terminal artifact is a rule injected into `~/.claude/CLAUDE.md`. This is a form of self-modification — research findings become behavioural constraints on all future sessions. AngelEye currently has no way to detect or track CLAUDE.md writes. Sessions that modify CLAUDE.md are high-leverage — their effects persist indefinitely.
- **Voice-scoped session**: David uses voice transcription to ask the research question, then returns with a more deliberate typed (or refined) second prompt to direct the write-back. The shift in prompt style between prompt 1 (voice artifacts, exploratory) and prompt 2 (structured, action-oriented) is a reliable signal that the session has crossed from discovery to codification.

## New Types or Subtypes Proposed

- **research.knowledge-capture**: A research session whose terminal artifact is a structured write to a brain file, CLAUDE.md, or configuration document. Signals: (a) brave_web_search or WebFetch > 5, (b) terminal tool sequence contains Write or Edit, (c) project_dir is brains or cwd is `~/.claude/`. Distinguishes from `research.websearch` (summary response only) and `build.documentation` (no prior web research phase).

## Subtype Candidates Confirmed

- **research.knowledge-capture**: This session is the proposed canonical example. Two-prompt structure, large inter-prompt gap, heavy web research phase, terminal brain+CLAUDE.md write. Interest level is elevated because the CLAUDE.md injection gives this session ongoing influence on all future sessions.

## Interest Level

medium-high — The session itself is compact (9KB, 34 events, 2 prompts) and straightforward to classify. Interest is elevated for two reasons: (1) it produced a write to `~/.claude/CLAUDE.md` that permanently altered Claude's proactive suggestion behaviour — a high-leverage artifact that AngelEye currently cannot detect or attribute, and (2) the two-prompt knowledge-capture pattern is clean enough to become a reference case for the `research.knowledge-capture` subtype. The gap between tool-pattern label ("websearch-heavy") and actual session value (CLAUDE.md behaviour injection) illustrates why subtype classification matters beyond tool counting.
