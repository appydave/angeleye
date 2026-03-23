# Wave 12 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 80 (bringing total to 666/799 = 83.4%)
**Agents**: 9 parallel (W12-01 through W12-09)
**Duration**: ~5-6 minutes to complete all 9 agents
**Third wave using campaign-status.py** for batch selection

## Application Learnings

### BUILD accuracy hits rock bottom at 2.5%

- **Wave 12 BUILD accuracy: 2.5% (2/80)**. Lowest ever — 7 of 9 agents had 0% BUILD accuracy.
- Only 2 genuine BUILDs: c613ccca (cross-project handover implementation) and ef6529fa (Oscar preflight workflow, typed not voice-dictated).
- This batch was 100% light scale, mostly brains/ CWD. The BUILD classifier is essentially useless at this scale.
- **Reclassification distribution**: KNOWLEDGE 35%, RESEARCH 18%, OPERATIONS 13%, SYSOPS 10%, ORIENTATION 10%, PLANNING 5%, BUILD 2.5%, other 7%.

### Voice dictation causes P13 misunderstandings

- P13 (misunderstood_request) fired in 16% of sessions (13/80) — dominant friction predicate.
- **Root cause in several cases**: voice mishearing product names. "codecs" for "codex" (W12-04) and "E-cam" for "Ecamm" (W12-09) both directly caused Claude to misunderstand the request.
- A pronunciation-aware entity dictionary would reduce P13 significantly.

### CLAUDE.md auto-load anti-pattern at extreme severity

- W12-01 session 3d8f7e59: 32 unauthorized tool calls (9 Edits + 14 Bash) before single "commit this" user prompt. 32:1 tool-to-prompt ratio.
- W12-03 session f9c47d5e: 11 unauthorized Edits before user spoke.
- P16 fires exclusively from this cause in wave 12.

### "Context available but ignored" failure mode

- W12-07: Claude gave wrong TDAC visa timing advice despite having the correct answer in its own brain file.
- Distinct from P13 (misunderstood request) — Claude understood the request but failed to consult its own knowledge.

### ChatGPT-to-Claude knowledge bridge

- W12-09 session 114c6d78: user pasted massive ChatGPT transcript into Claude for brain storage.
- Novel cross-platform capture pattern. New subtype: `knowledge.cross_platform_capture`.

### Skill self-documentation gap

- W12-06 session fe9cd78c: user loaded Ralphy, asked what it can do, Claude searched filesystem instead of using the loaded skill's self-knowledge.
- Actionable product insight — skills should be queryable about their own capabilities.

### Playwright semantic role: media_access

- W12-09 session 7e10b733: Loom video navigation for documentation purposes.
- Now 9-10 confirmed Playwright roles.

### Cross-session correction pattern

- W12-08: 3 sessions where users return to fix prior session failures (false git reports, wrong assumptions, forgotten SSH details).
- Distinct from continuation — these are error-correction sessions.

### ~50 new subtypes proposed (~0.63/session)

Discovery rate declining from 0.80 (wave 11) as expected — lighter sessions produce fewer novel patterns. Notable new subtypes:

- `build.cross_project_handover` — structured handover implementation across repos
- `knowledge.cross_platform_capture` — ChatGPT-to-Claude bridge
- `orientation.crash_recovery` — recovering from crashed sessions
- `knowledge.client_status_review` — status retrieval for client meetings
- `operations.repo_alignment` — cross-machine git push/pull via SSH
- `research.quick_answer_multi_topic` — multi-topic home terminal Q&A
- `planning.backlog_triage` — backlog management and prioritization
- `sysops.developer_support` — proxy troubleshooting on behalf of others (Angela on Windows/WSL)

### Voice dictation artifacts (~30 new)

- "codecs" = "codex" (caused P13)
- "E-cam" = "Ecamm" (caused P13+P14)
- "Decane" = "DeckHand"
- "Tahoe" = "macOS Tahoe"
- "Thumbrack" = "ThumbRack"
- "cast" = "cask"
- "scabber" = "scraper"
- "disposed" = "disk space"
- "Illustrations" = "Instructions"
- "M4A" = "M4 Pro"
- "Woi" = "WUI"

### PII detection incidents

12 PII incidents across 80 sessions (15%) — highest rate of any wave:

- **Highest severity**: W12-02 (3 live API keys: APILAYER_KEY, NEWS_API_KEY, API_NINJA_KEY pasted in prompt text)
- **Medical PII**: W12-03 (Phil's health conditions — fractured arm, osteoporosis, scoliosis)
- **Business PII**: W12-08 (ABN, ACN, director name, company address)
- **Travel/identity PII**: W12-03, W12-06, W12-07 (booking IDs, phone numbers, email, visa details)
- **Client PII**: W12-01 (Lars, lars@filt.dk)

PII rate increasing as sessions get lighter — lighter sessions are more personal/conversational.

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 12 of 12)

666 entries, 0 duplicates. Append-only pattern remains bulletproof through 12 waves.

### Light sessions are faster to process

All agents completed in ~5-6 minutes (vs 8-10 for moderate waves). Less JSONL to read.

### Discovery rate declining as expected

0.63/session (down from 0.80 in wave 11). Lighter sessions produce fewer novel patterns. The remaining 133 sessions (71 trivial + 39 micro + 23 light) will likely yield even fewer discoveries.

### P16 only fires from CLAUDE.md auto-load

In both wave 11 (zero) and wave 12 (2, both auto-load caused), P16 never fires from normal user-Claude interaction. It's exclusively a system anti-pattern, not a conversational one.

### Total subtypes: ~400+ across 22+ parent types from 666 sessions
