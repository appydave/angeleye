---
type: analysis
title: 'Findings W14-01'
description: 'Wave 14 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14-01 (M4 Pro batch)

**Wave**: W14-01
**Machine**: m4-pro
**Sessions**: 13
**Analysed**: 2026-03-23

---

## Session Summaries

### 1. 3f66732c — beauty-and-joy (MARATHON BUILD)

- **Scale**: marathon (952 events, 54 prompts, 680 min, 8 compactions)
- **CWD**: `/Users/davidcruwys/dev/ad/beauty-and-joy`
- **Project**: beauty-and-joy
- **Type**: BUILD → operations.paperclip_agent
- **Tools**: Bash(522), Read(173), Edit(141), Write(30), Grep(16), Skill(10)
- **Pattern**: Automated Paperclip agent ("JJ") running on a loop. Every prompt is the same agent-injected continuation message: "You are agent JJ. Continue your Paperclip work." 8 compactions show this ran until context exhaustion. 10 skill invocations, heavy Bash (522). The agent was doing autonomous BUILD work on the beauty-and-joy project — writing, editing, reading files across the codebase.
- **Interest**: high — first marathon-scale Paperclip session seen on M4 Pro; demonstrates autonomous agent pattern
- **Disposition**: active

### 2. 7e356115 — fligen (HEAVY BUILD)

- **Scale**: heavy (164 events, 16 prompts, 307 min wall / 107 active, 1 compaction)
- **CWD**: `/Users/davidcruwys/dev/ad/flivideo/fligen`
- **Project**: fligen
- **Type**: BUILD → build.ralphy_driven
- **Tools**: Bash(38), Edit(31), Read(25), Agent(25), Write(9), Skill(7), Playwright(7)
- **Pattern**: Ralphy-driven feature development session. Started with "resume from checkpoint", ran through extend+arch review cycles, Playwright browser testing (7 MCP calls), commits. Multi-phase: plan → extend → build → test → commit. Agent subtools (25 calls) confirm Ralphy orchestration. Session spanned a 2-hour idle gap.
- **Interest**: high — Ralphy workflow on fligen with Playwright integration
- **Disposition**: active

### 3. 20e00a59 — flideck (MODERATE BUILD)

- **Scale**: moderate (121 events, 14 prompts, 36 min)
- **CWD**: `/Users/davidcruwys/dev/ad/flivideo/flideck`
- **Project**: flideck
- **Type**: BUILD → build.ralphy_driven
- **Tools**: Read(24), Edit(24), Agent(21), Bash(19), Write(10), Glob(6), Skill(2)
- **Pattern**: Ralphy-driven AC verification session. Prompt mentions "dismiss archived/deferred ACs", "verify bug-fix ACs", "verify implemented FR ACs". Ran through wave 1-3 of acceptance criteria verification with 21 Agent calls. David asked about "vacuous" test meaning, then wrapped up with commit+push. Clean close.
- **Interest**: medium — standard Ralphy verification workflow
- **Disposition**: active

### 4. cf5bb749 — joy-juice (MODERATE BUILD)

- **Scale**: moderate (85 events, 4 prompts, 69 min)
- **CWD**: `/Users/davidcruwys/dev/ad/beauty-and-joy/business-ventures/joy-juice`
- **Project**: joy-juice
- **Type**: BUILD → operations.paperclip_agent
- **Tools**: Bash(64), Read(6), Write(4), Edit(3), CronList(1)
- **Pattern**: Another Paperclip agent (JJ) session, same pattern as session 1 but smaller scale. 4 periodic continuation prompts at ~18 min intervals. Heavy Bash (64 of 81 tool calls). CronList call suggests cron/scheduling work. Autonomous agent doing BUILD on joy-juice.
- **Interest**: medium — Paperclip agent pattern on joy-juice subproject
- **Disposition**: active

### 5. 5df98c8e — brains (MODERATE MIXED)

- **Scale**: moderate (71 events, 13 prompts, 39 min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains → actually appydave.com site planning
- **Type**: MIXED → mixed.planning_then_setup
- **Tools**: Bash(23), Read(8), Agent(6), Glob(5), Edit(5), Playwright(4), Skill(3), Write(3)
- **Pattern**: Multi-phase session that pivoted mid-stream. Started with "research on who Appy Dave is" (RESEARCH), then shifted to "I want to build a website today" (PLANNING), explored branding, created requirements.md for appydave.com, then git init. CWD in brains/ but actual work was in sites/appydave.com. Playwright calls (3 navigate + 1 screenshot) suggest checking existing site. Ended with setup for website build.
- **Interest**: high — CWD mismatch example; multi-phase session spanning research→planning→setup
- **Disposition**: active

### 6. 1e4ed4e6 — brains (LIGHT SETUP)

- **Scale**: light (51 events, 8 prompts, 44 active min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains → general setup/orientation
- **Type**: SETUP → setup.environment_prep
- **Tools**: Bash(31), Read(7), Grep(3), Glob(1)
- **Pattern**: Environment setup session. Started with "npm install globally for pnpm", then "jump generate aliases", checked Deckhand/AngelEye repos, asked about NotebookLM, AppyStack install process, pulled repos. Final prompt was about "tonight's agenda" in angeleye repo. No writes/edits — read-only plus bash commands. CWD brains/ is incidental.
- **Interest**: low — routine environment prep
- **Disposition**: resolved

### 7. 12172e43 — brains (LIGHT KNOWLEDGE)

- **Scale**: light (40 events, 4 prompts, 17 min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains
- **Type**: KNOWLEDGE → knowledge.brain_curation
- **Tools**: Bash(22), Read(8), Edit(6)
- **Pattern**: Git conflict resolution + brain file updates. Pasted terminal output showing git pull with conflicts. Then evaluated Cole Medin video transcript for brain relevance, accepted recommendations, and requested colemedin tubescript update. 6 Edits to brain files confirm actual KNOWLEDGE work. Clean close.
- **Interest**: medium — brain curation with git conflict handling
- **Disposition**: resolved

### 8. 6ae7b120 — appydave.com (MICRO ORIENTATION)

- **Scale**: micro (23 events, 6 prompts, 9 min)
- **CWD**: `/Users/davidcruwys/dev/ad/sites/appydave.com`
- **Project**: appydave.com
- **Type**: ORIENTATION → orientation.exploration
- **Tools**: Agent(5), Bash(3), Glob(3), Read(3), Playwright(2)
- **Pattern**: "What is in here? Give me a tree." Quick exploration of the appydave.com site folder. Playwright navigate + screenshot suggests checking the live site. No writes. Pure orientation.
- **Interest**: low — quick folder exploration
- **Disposition**: resolved

### 9. 40d5fc0e — brains (LIGHT RESEARCH)

- **Scale**: light (20 events, 3 prompts, 55 min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains → angeleye research
- **Type**: RESEARCH → research.competitive_analysis
- **Tools**: Read(8), Agent(3), Bash(2), Write(2), Edit(2)
- **Pattern**: Evaluated claude-inspector GitHub repo for AngelEye relevance. Asked about prompt injection concerns, then requested deep feature analysis from AngelEye perspective. 2 Writes + 2 Edits suggest findings were written to brain files. Typo "AngelLie" for AngelEye. Session ended with "exig" (likely cut off).
- **Interest**: high — competitive analysis of claude-inspector for AngelEye feature roadmap; writes confirm KNOWLEDGE output
- **Disposition**: active

### 10. 574e11fd — beauty-and-joy (MICRO OPERATIONS)

- **Scale**: micro (9 events, 1 prompt, <1 min)
- **CWD**: `/Users/davidcruwys/dev/ad/beauty-and-joy`
- **Project**: beauty-and-joy
- **Type**: OPERATIONS → operations.paperclip_agent
- **Tools**: Bash(7), Skill(1)
- **Pattern**: Single Paperclip agent continuation prompt. Ran 7 Bash commands + 1 Skill, then stopped. Likely a quick JJ agent ping that completed its work fast or was terminated. Precursor to session 1 (started 1 min before the marathon session cf5bb749).
- **Interest**: low — minimal agent pulse
- **Disposition**: resolved

### 11. 66c34922 — brains (MICRO RESEARCH)

- **Scale**: micro (5 events, 1 prompt, <1 min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains
- **Type**: RESEARCH → research.personal_query
- **Tools**: Read(3), Glob(1)
- **Pattern**: "what do we know about meetings that I do in chiang mai" — quick knowledge lookup. Read 3 files, no writes. Registry has workspace_id set, suggesting part of a workspace. Trivial.
- **Interest**: low — quick personal lookup
- **Disposition**: resolved

### 12. b5a94a77 — brains (MICRO ORIENTATION)

- **Scale**: micro (3 events, 2 prompts, 4 min)
- **CWD**: `/Users/davidcruwys/dev/ad/brains`
- **Project**: brains
- **Type**: ORIENTATION → orientation.skill_discovery
- **Tools**: Bash(1)
- **Pattern**: "what are my 5 skill variants that do something like a close session" — skill discovery question. 1 Bash command, 2 prompts. Minimal.
- **Interest**: low — quick Q&A about skills
- **Disposition**: resolved

### 13. 3d9157bb — joy-juice (TRIVIAL)

- **Scale**: trivial (1 event, 1 prompt, 0 min)
- **CWD**: `/Users/davidcruwys/dev/ad/beauty-and-joy/business-ventures/joy-juice`
- **Project**: joy-juice
- **Type**: OPERATIONS → operations.health_check
- **Tools**: none
- **Pattern**: "Respond with hello." — zero tool calls, single prompt. Agent ping/health check. Zero information content.
- **Interest**: none — trivial ping
- **Disposition**: junk

---

## M4 Pro Observations

1. **Paperclip Agent Pattern (JJ)**: Sessions 1, 4, 10, 13 all show the same automated agent pattern with ID `27231022-d305-4069-a16a-472c98259e33` named "JJ". This is a loop-driven autonomous agent that receives periodic continuation prompts. The beauty-and-joy marathon (952 events, 8 compactions) is the largest Paperclip session seen across any machine.

2. **New Projects**: joy-juice (business-ventures subproject of beauty-and-joy), appydave.com (sites), flideck — all unique to M4 Pro.

3. **Ralphy Workflow**: Sessions 2 and 3 show mature Ralphy-driven development on flivideo subprojects (fligen, flideck) with Agent orchestration, acceptance criteria verification, and Playwright testing.

4. **CWD Reliability**: Confirmed unreliable below moderate scale. Session 5 (brains/ CWD) was actually planning appydave.com. Session 6 (brains/ CWD) was general environment setup.

5. **Registry Type Accuracy**: Registry marked most sessions as BUILD regardless of actual activity. Sessions 6 (SETUP), 8 (ORIENTATION), 11 (RESEARCH), 12 (ORIENTATION) were all incorrectly typed as BUILD in registry.

---

## Scale Distribution

| Scale    | Count | Sessions                               |
| -------- | ----- | -------------------------------------- |
| marathon | 1     | 3f66732c                               |
| heavy    | 1     | 7e356115                               |
| moderate | 3     | 20e00a59, cf5bb749, 5df98c8e           |
| light    | 3     | 1e4ed4e6, 12172e43, 40d5fc0e           |
| micro    | 4     | 6ae7b120, 574e11fd, 66c34922, b5a94a77 |
| trivial  | 1     | 3d9157bb                               |

## Type Distribution

| Type        | Count |
| ----------- | ----- |
| BUILD       | 4     |
| OPERATIONS  | 2     |
| RESEARCH    | 2     |
| ORIENTATION | 2     |
| MIXED       | 1     |
| KNOWLEDGE   | 1     |
| SETUP       | 1     |
