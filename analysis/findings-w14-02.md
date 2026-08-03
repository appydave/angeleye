---
type: analysis
title: 'Findings W14-02'
description: 'Wave 14-02: 13 M4 Pro sessions (Feb–Mar 2026) — brains triage, Joy Juice dev, FliVideo Ralphy loops, infrastructure sysops.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14-02 (M4 Pro, 13 sessions)

Wave 14-02 covers 13 sessions from the M4 Pro machine spanning 2026-02-28 to 2026-03-21. The M4 Pro is David's secondary machine (Chiang Mai field use), and these sessions show a distinct pattern: heavy orientation/triage work in brains/, Joy Juice product development for beauty-and-joy, FliVideo Ralphy loops, and infrastructure sysops.

## Session Summaries

### 1. `232bb5f3` — Evening mega-session: OMI RAID, status line, Syncthing, Paperclip, diagrams (MIXED)

- **Scale**: heavy (343 events, 51 prompts, 132 min)
- **CWD**: brains/ — but touches many projects
- **What happened**: Massive multi-phase evening session. Started with OMI todo triage and skill execution. Then pivoted to designing Claude Code terminal status line formatting (token count, Tailscale status, context %, dirty markers). Then researched Syncthing vs real-time sync for multi-machine brain repos. Then attempted Paperclip setup. Then used Playwright to create Claude interactive diagrams for agentic OS. Then did dirty-repo cleanup and git commits. Finally updated brain docs and checked off todo items. Two compaction resumes.
- **Phases**: (1) OMI triage, (2) status line design, (3) Syncthing research + Ansible integration, (4) Paperclip exploration, (5) Claude interactive diagrams via Playwright, (6) git cleanup, (7) brain updates
- **Accuracy**: 0% BUILD — this is classic MIXED (orientation + sysops + research + knowledge). No sustained feature construction.
- **Notable**: Playwright used to access Claude AI web app for interactive diagrams. Shows M4 Pro used for evening multi-topic sprint sessions.

### 2. `93b1c355` — VSCode agent build disable, Ansible SSH, app/port inventory (SYSOPS)

- **Scale**: heavy (159 events, 27 prompts, 160 active min across 626 min with 3 idle gaps)
- **CWD**: brains/ — but primary work is infrastructure
- **What happened**: Started with frustration about VSCode agent build behaviour ("the dam build with agent"). Searched for prior documentation of the fix. Then pivoted to Ansible-based deployment of the VSCode settings fix across all 5 machines (mini-m4, mini-m2, mini-jan, mini-mar, macbook-pro). Added SSH keys for Jan and Mary's machines. Then audited application/port inventories across machines (locations.json, app lists). Cleaned up stale backup files. Created canonical port registry. Ended with triage handover.
- **Accuracy**: 0% BUILD — infrastructure operations and machine management. Ansible playbook work, SSH key distribution, inventory auditing.
- **Notable**: Shows David managing a 5-machine fleet. Jan identified as male. Frustration signal on VSCode agent build issue.

### 3. `a16112ed` — FliDeck Ralphy prep and code quality campaign (BUILD)

- **Scale**: moderate (116 events, 9 prompts, 84 min)
- **CWD**: flivideo/flideck
- **What happened**: Long form-fill prompt to prepare FliDeck for Ralphy Wiggum loops: audit AGENTS.md, update BACKLOG.md, populate learnings from completed campaigns. Then loaded 3 coding skills (code quality, unit testing, architecture) and ran them. Did baseline commit. Ran Ralphy campaign to completion until context exhausted at 5%.
- **Accuracy**: 40% BUILD — genuine code quality improvement work via automated Ralphy campaigns. CWD reliable.
- **Notable**: Form-filling detected (3781-char first prompt, 0.88 short ratio). Classic Ralphy pattern: long initial prompt then short "go", "3" responses.

### 4. `fec6ab8b` — FliHub Ralphy continuation + relay sync research (MIXED)

- **Scale**: moderate (85 events, 21 prompts, 71 active min)
- **CWD**: flivideo/flihub
- **What happened**: Continued Ralphy loop from prior session (test-coverage-gaps-2). Confusion about whether relay or extend was recommended. Ran Ralphy campaign. Then pivoted to checking Playwright browser output, git sync issues (clicked sync on mobile), repo status checking. Investigated relay sync between m4-mini and m4-pro for recordings. Referenced "digital summit" using david-jan not flihub. Ended with commit/push.
- **Accuracy**: 35% BUILD — partial Ralphy execution but significant time on git operations and sync research.
- **Notable**: Frustration signal ("you need to have better dx then that"). Mobile phone usage mentioned (field conditions). Cross-session chain with a16112ed.

### 5. `1dd9c72c` — Joy Juice menu design and market research (BUILD)

- **Scale**: moderate (70 events, 19 prompts, 123 active min)
- **CWD**: beauty-and-joy
- **What happened**: Compacted session resume (95877-char first prompt!). Built out Joy Juice drink menus — ingredients, recipes, Thai/farang perspective. Designed physical A4 laminated menu cards per fruit. Discussed location context (canal road near CMU, facing 7-Eleven). Added Chinese customer segment. Discussed "ปลอดสาร" (chemical-free) as trust phrase. Created research docs. Drafted reply to Joy about ginger shot research (girlfriend Sutaksina). Tone correction ("over exuberant" style feedback). Handover requested.
- **Accuracy**: 45% BUILD — genuine product design work creating menu.json, research docs, card designs for a real business. CWD reliable.
- **Notable**: M4 Pro-specific project (joy-juice). Rich domain: Thai juice bar menu design. Tone feedback is a valuable quality signal. CronCreate/CronDelete detected (likely loop for monitoring).

### 6. `0428ffb6` — AngelEye brain update + mochaccino visualisation planning (KNOWLEDGE)

- **Scale**: light (51 events, 6 prompts, 43 min)
- **CWD**: brains/
- **What happened**: Updated Anthropic brain with new developments. Then discussed AngelEye's current state and planned two visual concepts: (1) better info cards for sessions, (2) mochaccino-style visualisation plans. Compaction resume mid-session. Committed and pushed.
- **Accuracy**: 10% BUILD — primarily brain file updates (knowledge capture) and planning.
- **Notable**: Shows AngelEye self-referential work happening on M4 Pro. Mochaccino concept referenced.

### 7. `122a5bd1` — Anthropic support ticket via Playwright (OPERATIONS)

- **Scale**: light (34 events, 9 prompts, 32 min)
- **CWD**: brains/ (incidental)
- **What happened**: Filed Anthropic support request about claude remote-control feature not being available. Used Playwright MCP to navigate claude.ai support interface. Signed in, attempted to submit ticket. Discussed claude --version output. Gathered evidence list for Anthropic. Pure operational task.
- **Accuracy**: 0% BUILD — support ticket filing. Playwright-heavy (8 clicks, 4 snapshots, 3 navigates).
- **Notable**: CWD incidental (brains/ but doing support operations). Playwright used for web form interaction, not testing.

### 8. `fa19414b` — Brain inventory and categorisation (KNOWLEDGE)

- **Scale**: light (23 events, 3 prompts, 7 min)
- **CWD**: brains/
- **What happened**: Quick session to list and categorise all brains. Read brain directories, wrote categorised inventory.
- **Accuracy**: 0% BUILD — pure knowledge inventory.

### 9. `ac7d89db` — DTV Thailand visa research (RESEARCH)

- **Scale**: light (19 events, 5 prompts, 10 min)
- **CWD**: brains/ (incidental)
- **What happened**: Fact-checked a Facebook post about DTV (Digital Nomad Visa) land border re-entry issues. Used Brave web search and WebFetch to verify 2025 rule changes for Chiang Khong-Laos crossing. Personal immigration research.
- **Accuracy**: 0% BUILD — web research, no code.
- **Notable**: Personal life context (living in Chiang Mai, Thailand visa management).

### 10. `39e07167` — "Tell me about btw" exploration (RESEARCH)

- **Scale**: micro (8 events, 4 prompts, 29 min)
- **CWD**: brains/ (incidental)
- **What happened**: Vague exploratory prompt "tell me about btw". Used Agent, WebFetch, Glob. Too little data to determine specifics.
- **Accuracy**: 0% BUILD — micro session, exploratory.

### 11. `bb352091` — Mac repair in Chiang Mai (OPERATIONS)

- **Scale**: micro (5 events, 5 prompts, 14 min)
- **CWD**: brains/ (incidental)
- **What happened**: Mac screen issue. Apple support gave repair centers not in Chiang Mai. Used Claude as personal assistant to find correct repair options (iCare, Central Airport Plaza). Zero tool calls — pure conversation.
- **Accuracy**: 0% BUILD — zero tools, personal operations.
- **Notable**: Confirms M4 Pro location context (Chiang Mai). Thai language in prompt (repair center names).

### 12. `88d1d301` — RTK repo evaluation + Ansible brain question (RESEARCH)

- **Scale**: micro (3 events, 2 prompts, 4 min)
- **CWD**: brains/ (incidental)
- **What happened**: Pasted rtk-ai/rtk GitHub README (15897 chars) and asked which brain to write it up in and how to set it up in Ansible. One Agent call. Extremely brief.
- **Accuracy**: 0% BUILD — micro, research/evaluation.

### 13. `80d84f1b` — Joy Juice hello test (trivial)

- **Scale**: trivial (1 event, 1 prompt, 0 min)
- **CWD**: beauty-and-joy/business-ventures/joy-juice
- **What happened**: "Respond with hello." — connection test. Zero tools.
- **Accuracy**: 0% BUILD — trivial/junk.

## Cross-Session Patterns

### M4 Pro Usage Profile

The M4 Pro is David's mobile/field machine. Sessions show:

- Evening mega-sprints (232bb5f3 at 12:34-14:46 UTC = ~8-10pm local)
- Field conditions (mobile data, 262-min idle gaps)
- Personal life integration (Joy Juice business, Thai visa research, Mac repair)
- Infrastructure management for the full machine fleet

### Session Chains

- `a16112ed` (flideck Ralphy) -> `fec6ab8b` (flihub Ralphy): sequential Ralphy campaigns across FliVideo sub-projects
- `1dd9c72c` (joy-juice menus) -> `80d84f1b` (joy-juice hello): same project, latter is just a connection test

### Registry Accuracy Issues

- 232bb5f3 registered as BUILD — should be MIXED (7 distinct phases, no sustained construction)
- 93b1c355 registered as BUILD — should be SYSOPS (Ansible, SSH, inventory)
- 0428ffb6 registered as BUILD — should be KNOWLEDGE (brain updates)
- fa19414b registered as BUILD — should be KNOWLEDGE (brain inventory)
- bb352091 registered as BUILD — should be OPERATIONS (zero tools, personal assistance)
- 88d1d301 registered as BUILD — should be RESEARCH (repo evaluation)
- 39e07167 registered as BUILD — should be RESEARCH (exploratory)
- 80d84f1b registered as BUILD — should be trivial/junk (connection test)
- Registry BUILD accuracy: 3/13 correct (a16112ed, fec6ab8b partially, 1dd9c72c) = 23%

### New Patterns

1. **Joy Juice as M4 Pro project**: beauty-and-joy/joy-juice is a real business product (Thai juice bar) with menu design, market research, Thai language content. Not just a hobby project.
2. **Multi-machine fleet management**: 5+ machines managed via Ansible from M4 Pro. SSH key distribution, VSCode settings sync, port inventory — this is serious sysops.
3. **Playwright for non-testing**: Two sessions use Playwright MCP for web interaction (support ticket filing, Claude AI diagrams) rather than test automation.
4. **Tone correction signal**: "over exuberant" feedback in 1dd9c72c shows David actively calibrating Claude's communication style. Useful for style preference training.
