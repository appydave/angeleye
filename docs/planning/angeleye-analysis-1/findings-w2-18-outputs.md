# Findings: W2-18 — outputs (b61d5adf)

## Classification

- **Registry**: BUILD / edit-heavy (238KB)
- **Analysed type**: BUILD / build.content_production (talk_visual_materials)
- **Confidence**: high
- **Reasoning**: The session produced tangible artifacts — 15 HTML variant files, 3 JSON data files, an index page, and brand colour remapping — all for the Digital Stage Summit 2026 talk. While the opening prompt was a handover and the early phase involved auditing/Q&A (which looks like ORIENTATION), the majority of the session was spent creating files, launching build subagents, running gap analyses, and applying fixes. The edit-heavy tool pattern matches: 13 Edits, 3 Writes, 12 Agent spawns. The "outputs" project name is the `outputs/` subdirectory under `brains/summits/digital-stage-2026/` — the HTML variant gallery for the talk. BUILD is correct; the subtype is content_production because the artifacts are presentation visuals (HTML mockups of David's agent stack, apps, and skills for a conference talk), not product code.

## Session Shape

- Events (hook): 265 (183 tool_use, 28 user_prompt, 12 subagent_start, 13 subagent_stop, 26 stop, 2 session_start, 1 session_end)
- Tools used (main): Edit x13, Agent x12, Read x11, mcp**playwright**browser_navigate x7, mcp**playwright**browser_take_screenshot x6, Write x3, Bash x2, Glob x1, Grep x1, ToolSearch x1, Skill x1 — total 58
- Subagents: 12 (see below)
- Duration: ~75 minutes active (08:38 to 09:54 UTC on 2026-03-17), plus a context continuation that ran until 00:39 next day
- User prompts: 28 (15 real prompts, 7 task-notification returns, 4 interrupts/retries, 2 local commands)
- Context continuation at L589 (ran out of context, resumed with summary)
- Opening style: handover paste from prior session

### Subagents (12)

| Agent             | Task                                                          |
| ----------------- | ------------------------------------------------------------- |
| a114bcc77f800cd62 | Find CLI entry point commands for AppyDave Tools              |
| a39e814d8d41cd050 | Find API/CLI entry points for FliVideo apps                   |
| aeaacad516ab612fd | Build 5 Personal Agent Stack HTML variants                    |
| a1b2a9cc145e8e4c5 | Build 5 Agentic Applications HTML variants                    |
| a2a348d4bfb67daf6 | Build 5 Agent Skills HTML variants                            |
| a2ca33c6e2bf80ad2 | Gap analysis between JSON and two HTML app variants           |
| aa3130307f5f0b7e6 | Gap analysis between stack JSON and two stack HTML variants   |
| a957a71431680e627 | Gap analysis between skills JSON and two skills HTML variants |
| a308a740ace4f2d25 | Update 2 JSON files with missing canonical data               |
| a26dd44c81b99ec2c | Fix stack-v1 and stack-v5 HTML files                          |
| abe473a28e5252aea | Fix apps-v1 and apps-v3 HTML files                            |
| a13915358f292d542 | Fix skills-v2 and skills-v3 HTML files                        |

### Prompt Timeline

| #     | Time (UTC)  | Prompt                                                                                        | Gap    |
| ----- | ----------- | --------------------------------------------------------------------------------------------- | ------ |
| 1     | 08:38       | Handover paste from prior session                                                             | —      |
| 2     | 08:41       | Audit agentic applications list — missing apps, CLI tools, Samantha                           | 3 min  |
| 3     | 08:44       | List workflow engines as POEM/AWB/N8N, add Comfy UI, Samantha uses ElevenLabs                 | 3 min  |
| 4     | 08:47       | Build 15 Mochaccino variants (5x3 groups) with index page                                     | 3 min  |
| 5-7   | 08:59–09:02 | Task notifications (stack, apps, skills variants complete)                                    | —      |
| 8-9   | 09:22       | ASCII layout review of agentic applications (retry after interrupt)                           | 20 min |
| 10-12 | 09:25–09:26 | Request app descriptions (retry, then "or application descriptions")                          | 3 min  |
| 13    | 09:28       | Corrections: Deckhand is StreamDeck, Digital Stage Summit app, Samantha != KyberBot           | 2 min  |
| 14    | 09:28       | "What are the four main areas?"                                                               | <1 min |
| 15    | 09:30       | Corrects Claude: not variant gallery — 4 areas are stack/apps/skills/OS, asks for JSON review | 2 min  |
| 16    | 09:35       | Gap analysis on apps-v1.html and apps-v3.html vs JSON                                         | 5 min  |
| 17-18 | 09:36       | Gap analysis on stack-v1/v5 (interrupted, retried as background)                              | <1 min |
| 19-22 | 09:36–09:39 | Task notifications + skills gap analysis request                                              | —      |
| 23    | 09:41       | Feedback on gap results — ports OK in JSON not HTML, stats section good, fix contradictions   | 2 min  |
| 24-27 | 09:43–09:46 | Task notifications (JSON updates, HTML fixes all 3 groups)                                    | —      |
| 28    | 09:49       | Remap stack-v5.html colours to AppyDave brand palette                                         | 3 min  |

### Skills

- **brand-appydave** (prompt 28 area, L551): Loaded via `/recipe` Skill tool to get AppyDave CSS variables for colour remapping. Palette: brand-brown #342d2d, brand-gold #ccba9d, brand-yellow #ffde59, brand-cream #e8dcc8.

## The "outputs" Project

The project_dir is `/Users/davidcruwys/dev/ad/brains/summits/digital-stage-2026/outputs`. This is the HTML variant gallery subdirectory for the Digital Stage Summit 2026 conference talk. The broader project at `brains/summits/digital-stage-2026/` contains:

- `data/` — canonical JSON files (personal-agent-stack.json, agentic-applications.json, agents-and-skills.json)
- `outputs/` — HTML visualizations (15 Mochaccino design variants + index.html)
- `INDEX.md` — talk structure and session tracking

The talk covers David's personal AI agent ecosystem across four body sections: Personal Agent Stack, Agentic OS, Agentic Applications, and Agent Skills. This session worked on three of the four (OS was deferred).

## Files Touched (main session only)

### Written

- `outputs/index.html` — gallery index with iframe thumbnails for all 15 variants
- `data/agentic-applications.json` — new file, structured inventory of all 7 app sections
- `brains/memory/samantha-vs-kyberbot.md` — memory note clarifying Samantha != KyberBot

### Edited

- `data/personal-agent-stack.json` — POEM OS renamed to POEM, workflow_engines restructured into built/external, Comfy UI added, standalone_apps added
- `outputs/stack-v5.html` — 9 colour edits remapping from dark Mochaccino palette to AppyDave brand palette
- `.claude/projects/.../memory/MEMORY.md` — added Samantha vs KyberBot distinction

### Read

- `INDEX.md`, `data/personal-agent-stack.json`, `data/agents-and-skills.json`, `outputs/personal-agent-stack.html`, `outputs/stack-v5.html`, memory files

### Subagent-created (15 HTML variants)

- `outputs/stack-v1.html` through `stack-v5.html`
- `outputs/apps-v1.html` through `apps-v5.html`
- `outputs/skills-v1.html` through `skills-v5.html`

## Observations

1. **Voice transcription artifacts throughout**: David is using speech-to-text. "A10" for N8N, "N18" for N8N, "Mocaccino" for Mochaccino, "Samantra" for Samantha, "mislabling" preserved as-is. Claude correctly decoded all of these. The "damn speech recognition" frustration at prompt 10 is explicit.
2. **Massive parallel subagent usage**: 12 subagents in one session — the highest count seen so far. Three waves: (a) 2 research agents for CLI entry points, (b) 3 parallel build agents for 15 HTML variants, (c) 3 gap analysis agents + 4 fix agents. This is heavy orchestration of background agents.
3. **Playwright visual QA loop**: Claude spun up a Python HTTP server (`python3 -m http.server 7800`) to serve the HTML variants, then used Playwright to navigate and screenshot 5 variants for visual QA. This is a mature pattern — build, serve, screenshot, verify.
4. **JSON-as-canonical-source pattern**: David explicitly stated "JSON is the canonical source of truth; HTML derives from JSON; ports stay in JSON but removed from HTML visuals." This is a deliberate data architecture decision. Gap analysis ran in both directions (JSON to HTML and HTML to JSON).
5. **Context exhaustion**: The session ran out of context and continued with a summary (L589). The summary is comprehensive (2000+ chars) and covers all key technical concepts. The continuation session applied brand colours to stack-v5.html — a relatively small task that suggests context was nearly full before the continuation.
6. **Mochaccino design system**: A warm cream/amber visual design system (`--canvas: #f2ece4`, `--amber: #c8841a`, `--header-bg: #1c1714`) used for the HTML variant gallery. Five variants per group with distinct visual styles (e.g., Noir, Scoreboard, Command, Cockpit).
7. **Samantha vs KyberBot correction**: David corrected Claude twice about conflating Samantha (his ElevenLabs voice agent) with KyberBot (Ian's framework). Claude wrote a memory note to prevent future conflation. This is a meaningful domain boundary that keeps recurring.
8. **Four-area talk structure clarification**: When Claude listed WUI Variant Gallery as one of the four areas, David corrected: the four areas are Personal Agent Stack, Agentic Applications, Agent Skills, and Agentic OS. The gallery is a tool, not a content area. Claude course-corrected immediately.
9. **No closing ceremony**: Session ends with colour edits applied, a summary table of changes, and then `/exit`. No explicit "close it off" or handover generation at session end. The handover was generated mid-session (L539) before the brand colour work began.
10. **Session spans two session_start events**: Hook data shows session_start at 08:38 and again at 09:53 (the context continuation). Total wall-clock time from first start to session_end: ~16 hours, but active time was approximately 75 minutes.

## Patterns Found

- **Parallel build-then-verify**: Build artifacts with parallel subagents, visually verify with Playwright, run gap analysis, apply fixes. Four-phase pipeline within a single session.
- **Voice-driven iterative refinement**: David speaks prompts (with transcription errors), Claude decodes, David corrects, repeats. The prompt timeline shows multiple retries and corrections that are characteristic of voice input.
- **JSON-first data architecture**: Canonical data in JSON, HTML derived from JSON, gap analysis to keep them in sync. This is a deliberate pattern David is establishing for the talk materials.
- **Context continuation**: Session exhausted context and continued with a structured summary. The continuation picked up cleanly with brand colour work.

## New Types or Subtypes Proposed

- **build.content_production**: Content assets (HTML mockups, visual galleries, presentation materials) built for a specific purpose (conference talk), not product code. Distinguished from build.feature or build.infrastructure by the output type — visual/presentation artifacts rather than shipped software.

## Subtype Candidates Confirmed

- **build.content_production**: Signal — output directory is `outputs/`, all artifacts are HTML visualizations for a conference talk, JSON data files describe talk content (agent stack, applications, skills) not product schemas, no product source code touched, Mochaccino design system is for presentation not product UI.

## Type Correction

- **Registry said**: BUILD / edit-heavy
- **Actual**: BUILD / build.content_production
- **Why**: Registry classification of BUILD is correct. The edit-heavy tool pattern is accurate (13 Edits, 3 Writes, 12 Agent spawns). The subtype refinement to content_production captures that these are talk preparation materials, not product code. The project "outputs" is not a standalone project — it is a subdirectory of the Digital Stage Summit 2026 brain.

## Interest Level

medium — The session demonstrates heavy parallel subagent orchestration (12 agents), a Playwright visual QA pipeline, and a JSON-canonical data architecture pattern. The voice transcription artifacts and corrections are a recurring AngelEye signal worth tracking. The Samantha vs KyberBot conflation pattern appears in multiple sessions and reveals a domain boundary that AI agents struggle with.
