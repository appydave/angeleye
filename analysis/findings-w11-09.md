---
type: analysis
title: 'Findings W11-09'
description: 'Wave 11 Batch 09: 8 sessions, 25% BUILD accuracy; Playwright visual_comparison role confirmed + knowledge capture closing ceremony.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings -- W11-09

**Wave**: 11, Batch 09
**Sessions**: 8 (3 moderate, 5 light)
**Analysed**: 2026-03-23
**BUILD accuracy**: 2/8 (25%) -- e05f8858 (Ralphy campaign) and 339a580a (content production) confirmed BUILD. 6 reclassified.

---

## Session Summaries

### e05f8858 -- prompt.supportsignal / moderate

**Registry**: BUILD | **Actual**: BUILD (confirmed)
**Subtype**: build.campaign

Ralphy campaign fixing 8 WUI wizard bugs across 3 waves with parallel subagent dispatches. User opens with compaction resume (tool_use before first user_prompt), then confirms a 6-unit plan. Wave 1: 4 parallel agents (back-button cache, debug panel, phase visibility, completion summary). Wave 2: true parallel execution. Wave 3: conditional substep evaluation. Agent introduced backslash-bang (`\!`) syntax bug in LlmStep.jsx causing esbuild failure -- user pasted terminal error, fixed manually. After campaign completes, user reports 4 new problems (P10-P13) but session ends mid-investigation after second compaction.

**Key observations**:

- CWD prompt.supportsignal is incidental -- all work targets `.claude/worktrees/ralphy-wui/poc/wui/`
- P15 (buggy_output): Agent wrote escaped `\!` instead of `!` in 3 places -- build-breaking syntax error
- Voice artifact: "Promblem" (repeated twice) = "Problem"
- Compaction resume at both start and end -- long-running session that exhausted context twice
- Race condition documented: 2 parallel agents edited WizardShell.jsx -- last writer won

### 6a182630 -- prompt.supportsignal / light (reclassified from moderate)

**Registry**: BUILD | **Actual**: OPERATIONS (reclassified)
**Subtype**: operations.poem_execution

POEM Oscar agent `*run 105` -- automated incident workflow execution. 15 Task + 13 TaskOutput calls = pipeline execution pattern. Only 3 human prompts: the `*run` command, "yes" confirmation, and a diagnostic review asking about malformed Q&A data (line 24 uses comma instead of answer field). Zero Edit calls -- this is execution, not construction.

**Key observations**:

- `*run NNN` command pattern = POEM executor, always OPERATIONS
- Task/TaskOutput dominance (28 of 65 tool calls) = pipeline execution profile
- Sibling session to f0a50528 (`*run 107`) -- same pattern, same day, 47 min apart
- Voice dictation in final review prompt: natural speech with run-on sentences

### c2460616 -- brains / moderate

**Registry**: BUILD | **Actual**: KNOWLEDGE (reclassified)
**Subtype**: knowledge.methodology_design

Major prompt pattern methodology session. User voice-dictates extensive conceptual monologues (one prompt ~3600 chars) about recipes, system comprehension, and preparation patterns. Claude creates 2 new pattern files (system-comprehension-pattern.md, preparation-pattern.md), rewrites 2 AppyStack recipe references (nav-shell.md, file-crud.md), and gathers 16 JSON structures for visualisation. 74-min idle gap splits the session. Ends with creative wind-down: infographic design aesthetics and negative prompts.

**Key observations**:

- Massive voice monologues: user thinks aloud, mixing instructions, corrections, and tangents in single prompts
- Voice artifacts: "nano banana" (NanoBanano), "Gabber" (gather capability), "she can build JSON" (Claude = she), "it's a bad colour to discovery prompt" (garbled)
- 20 Edit + 7 Write = substantial brain content creation
- /capture-context skill invocation for handover -- closing ceremony pattern
- Session references prior conversation ("we just did a bunch of information") -- chain_end

### f0a50528 -- prompt.supportsignal / light

**Registry**: BUILD | **Actual**: OPERATIONS (reclassified)
**Subtype**: operations.poem_execution

POEM Oscar agent `*run 107` -- sibling to `*run 105` (6a182630). Same automated workflow pipeline pattern. Compaction summary at end captures 4 data flow schema mismatches: (1) question generation outputs `{question, purpose}` but mock answers expect `question_id`, (2) `beforeEvent.summary` vs flat strings, (3) no Q&A merge step, (4) Oscar improvised around gaps. User explicitly tells Claude "report back to me why you're not going to fix anything" -- diagnostic-only posture.

**Key observations**:

- Compaction summary is extraordinarily detailed (4800+ chars) -- captures full diagnostic state
- User voice-dictates "you, Oscar" -- persona mode where Claude is addressed by agent name
- 4 schema mismatches identified between workflow YAML, Handlebars templates, and runtime data flow
- P15 (buggy_output): workflow design produced malformed data, not Claude's fault but detectable

### f5e0d853 -- brains / light

**Registry**: BUILD | **Actual**: SYSOPS (reclassified)
**Subtype**: sysops.remote_machine_setup

SSH + tmux troubleshooting session across M2 and M4 Mac Minis. User discovers .zshenv isn't loading correctly for non-interactive SSH shells (nvm, aliases). Claude fixes .zshenv on both machines via SSH, then explores running Claude Code remotely. Session ends with explicit knowledge capture: "What did we learn in this session?" and "If I needed to tell people what decisions and changes we had made..." -- textbook closing ceremony.

**Key observations**:

- Bash 28 (67%) -- SSH commands, .zshenv inspection, remote fixes
- P13 (misunderstood_request): Claude didn't source shell environment correctly -- user corrected
- 5 voice artifacts in one session: "correcly", "insturcitons", "tmuz", "vcomputer", "enviornment"
- Strong knowledge capture pattern: user explicitly asks for session learnings and action fact sheet
- CWD brains/ is incidental -- work targets remote machines via SSH

### 8e27eff4 -- brains / light

**Registry**: BUILD | **Actual**: RESEARCH (reclassified)
**Subtype**: research.web_research

Single-prompt deep web research: Next.js hosting providers in Australia with database options. 1 user prompt spawns a subagent that fires 34 Brave web searches + 6 WebFetch calls in 5 minutes, producing a comprehensive 13-provider ranked comparison with database matrix, tier rankings, and 4 recommended stack combinations. Zero file system interaction -- pure information retrieval.

**Key observations**:

- Extreme autonomy ratio: 1 prompt -> 43 tool calls (1:43) -- highest in this batch
- All tool calls are from subagent (ae43251a) -- main agent delegated entirely
- Zero file output -- research delivered conversationally, not persisted to disk
- Voice artifact: "in some sort of sane or ultrathink Really go deep" -- instruction mixing
- CWD brains/ is incidental -- zero interaction with brain files
- This is a pure "Claude as search engine" session

### 339a580a -- brains / light

**Registry**: BUILD | **Actual**: BUILD (confirmed with subtype change)
**Subtype**: build.content_production

Slide deck production from Q&A transcript data. Multi-phase: (1) background agent for AppyStack vs BMADPOEM styling comparison, (2) read raw2.txt + extract Q&A into raw-ralph.txt, (3) build slides via Task agents + Playwright screenshots of existing slides for visual comparison. Playwright semantic role here is visual_comparison -- comparing slide styling across two systems, distinct from ui_audit or external_research.

**Key observations**:

- Playwright semantic role: visual_comparison -- 4 navigate + 3 screenshot of slide decks for styling comparison
- CWD brains/ is incidental -- Playwright targets brand-dave/presentation-assets/appystack
- "Ralph Wiggum" = slide deck name (not the Simpsons character) -- voice naming
- @file reference in prompt 2: "@/Users/davidcruwys/dev/ad/apps/appystack/raw2.txt" -- file attachment syntax
- Build confirmed but subtype is content_production -- producing presentation content, not application features

### c15e692a -- brains / light

**Registry**: BUILD | **Actual**: OPERATIONS (reclassified)
**Subtype**: operations.personal_document_management

Personal document intake and filing session. User drops files in Downloads, Claude moves them to appropriate brain folders (passport scan -> davidcruwys/personal/documents/, visa stamp -> dtv/documents/, TDAC PDF -> dtv/documents/). Claude reads passport image (multimodal), verifies PII against personal-info.md, explains MRZ code format, and updates dates.yaml with entry dates.

**Key observations**:

- **Heavy PII exposure**: Full name, DOB, passport number, passport MRZ, address, phone number, visa details all visible in hook stop messages
- Claude used multimodal image reading to verify passport data -- cross-referencing image against markdown file
- MRZ code explanation: user asked "what does the digital number at the bottom mean" -- Claude decoded the machine-readable zone
- /focus skill opener: "/focus DTV and personal" -- loads two brain contexts
- Session has clean session_end event -- rare in the corpus
- PII detection: this session should be flagged for PII scrubbing before any external analysis

---

## Cross-Session Patterns

### BUILD accuracy: 2/8 (25%)

Two confirmed BUILD (e05f8858 Ralphy campaign, 339a580a content production). Six reclassified: 2 OPERATIONS (POEM execution), 1 KNOWLEDGE, 1 SYSOPS, 1 RESEARCH, 1 OPERATIONS (document management). The `*run NNN` pattern is a reliable OPERATIONS signal.

### POEM executor pattern (`*run NNN`) confirmed as OPERATIONS

Sessions 6a182630 and f0a50528 are sibling sessions running POEM Oscar agent workflows. Both have: `*run` opener, Task/TaskOutput pipeline, zero Edit calls, diagnostic review phase. The `*run` command pattern should be an early classifier rule: `*run` or `*execute` as first prompt = OPERATIONS.poem_execution.

### Playwright semantic role #8: visual_comparison

Session 339a580a uses Playwright to screenshot slide decks from two different systems (AppyStack vs BMADPOEM) for visual styling comparison. This is distinct from all prior roles (ui_audit, external_research, documentation_verification, design_extraction, feature_discovery_audit). Now 8 confirmed Playwright semantic roles.

### PII density correlates with personal brain access

Session c15e692a has the highest PII density in this batch -- passport number, DOB, MRZ, full address, phone. The /focus skill loading personal/DTV brains is the signal. Any session that touches `davidcruwys/` or `dtv/` brain paths should be flagged for PII review.

### Voice artifact catalog additions

- "Promblem" = "Problem" (e05f8858, repeated 2x)
- "correcly" = "correctly" (f5e0d853)
- "insturcitons" = "instructions" (f5e0d853)
- "tmuz" = "tmux" (f5e0d853)
- "vcomputer" = "computer" (f5e0d853)
- "enviornment" = "environment" (f5e0d853)
- "nano banana" = "NanoBanano" (c2460616)
- "Gabber" = "gatherer" or gather capability (c2460616)
- "sane or ultrathink" = voice instruction mixing (8e27eff4)
- "she can build JSON" = Claude gendered as "she" (c2460616)

### Knowledge capture as closing ceremony

Session f5e0d853 has the clearest closing ceremony pattern: user explicitly asks "What did we learn in this session?" followed by "If I needed to tell people what decisions and changes we had made, would you be able to tell them?" This is a conscious knowledge extraction step that should be detected as a session wind-down signal.

### Compaction summary quality varies dramatically

Session f0a50528 has a 4800+ char compaction summary with full diagnostic state, file paths, and issue analysis. Session e05f8858 has a similarly detailed one. These are high-quality context handovers that preserve session state across compaction boundaries. AngelEye could use compaction summary quality as a session complexity signal.

### CWD incidental rate: 5/8 (62.5%)

Five of 8 sessions have CWD brains/ or prompt.supportsignal as incidental -- actual work targets other repos, worktrees, or remote machines. Consistent with wave 9-10 findings for light sessions. Only c15e692a and c2460616 have CWD brains/ as primary (actual brain file work). The 6a182630/f0a50528 pair has prompt.supportsignal as primary for POEM system.

### New subtype proposals (6)

1. **operations.poem_execution** -- Automated POEM workflow execution via `*run NNN` (2 instances, strong pattern)
2. **knowledge.methodology_design** -- Designing conceptual methodology frameworks into brain files
3. **sysops.remote_machine_setup** -- SSH-based troubleshooting and configuration of remote machines
4. **research.web_research** -- Pure web research via Brave/WebFetch with zero file output
5. **build.content_production** -- Building presentation/content artifacts (slides, decks) rather than application features
6. **operations.personal_document_management** -- Personal document intake, filing, and PII verification
