---
type: analysis
title: 'Findings W14-05'
description: 'Wave 14-05: 12 M4 Pro sessions (Feb–Mar 2026) — includes appydave-plugins multi-domain marathon session (196 min).'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W14-05 (M4 Pro Batch)

**Wave**: W14-05
**Machine**: m4-pro
**Sessions**: 12
**Date range**: 2026-02-28 to 2026-03-21

## Session Inventory

| #   | Session ID (short) | Project           | Type        | Subtype                 | Scale    | Duration | Events |
| --- | ------------------ | ----------------- | ----------- | ----------------------- | -------- | -------- | ------ |
| 1   | eca8f96f           | appydave-plugins  | MIXED       | multi_domain_marathon   | heavy    | 196m     | 209    |
| 2   | 6bc11c0f           | appydave.com      | BRAND       | design_review_iteration | moderate | 61m      | 136    |
| 3   | 2a76f890           | brains (agent-os) | SYSOPS      | infrastructure_audit    | moderate | 34m      | 100    |
| 4   | 04d3ec31           | brains (openclaw) | RESEARCH    | tooling_discovery       | moderate | 62m      | 78     |
| 5   | 670e11c5           | ~ (home)          | OPERATIONS  | migration_management    | light    | 103m     | 60     |
| 6   | 1fe7ad1d           | brains            | KNOWLEDGE   | brain_creation          | light    | 239m     | 48     |
| 7   | 27e871be           | joy-juice         | OPERATIONS  | poem_execution          | light    | 15m      | 28     |
| 8   | b4c6bfca           | brains (agent-os) | SYSOPS      | infrastructure_audit    | light    | 6m       | 22     |
| 9   | e9cb8121           | joy-juice         | OPERATIONS  | poem_execution          | micro    | 236m     | 14     |
| 10  | ac339def           | brains            | RESEARCH    | problem_diagnosis       | micro    | 12m      | 8      |
| 11  | b9860add           | beauty-and-joy    | OPERATIONS  | poem_execution          | micro    | 0m       | 5      |
| 12  | de8814c7           | ~ (dev)           | ORIENTATION | quick_lookup            | micro    | 0m       | 2      |

## Detailed Analysis

### 1. eca8f96f — MIXED / multi_domain_marathon (heavy)

**Project**: appydave-plugins
**Duration**: 196 minutes (3h16m), 39 user prompts, compaction resume detected
**Tools**: Bash(61), Edit(25), Read(17), Write(15), TaskUpdate(10), brave_web_search(8), Skill(8), Glob(7), TaskCreate(7), ToolSearch(4), Agent(3), chrome-devtools(4)

Multi-phase session spanning several domains:

1. **Playwright MCP troubleshooting** — investigated Chrome single-threading issues, searched for existing skills
2. **Brain creation** — wrote a Playwright/browser automation brain in the anthropic brain directory
3. **Web research** — searched internet for Playwright MCP best practices and workarounds
4. **Skill creation** — created a "browse-with-me" skill for browser automation (Playwright + Chrome DevTools)
5. **Chrome DevTools MCP debugging** — resolved Chrome path issues, fixed MCP server connection failures
6. **Mochaccino skill investigation** — searched for and found the mochaccino skill in Signal Studio plugins, evaluated its quality
7. **Impeccable Style research** — investigated impeccable.style website for design prompting
8. **Git operations** — committed and pushed changes

This is a classic David marathon: starts with a specific problem, branches into knowledge capture, skill creation, tool debugging, and research. The 39 prompts with compaction resume confirm context exhaustion mid-session. Heavy use of TaskCreate/TaskUpdate suggests structured todo tracking. Chrome DevTools MCP required multiple restart cycles to get working.

**CWD note**: CWD is appydave-plugins but work spans brains, skills, and system config. CWD unreliable for project attribution.

### 2. 6bc11c0f — BRAND / design_review_iteration (moderate)

**Project**: appydave.com
**Duration**: 61 minutes (30 active), 7 prompts
**Tools**: Edit(79), playwright(32), Bash(6), Read(4), Grep(4), Write(2)

Continuation of a website mockup review session. David handed over context from a prior session (9 HTML layouts remaining at /private/tmp/mockups/). The session focused on:

1. Opening each layout in Playwright, taking screenshots, evaluating font readability
2. Applying brand colour corrections (removing amber/orange violations)
3. Iterating on specific layouts (glassmorphism, scroll-activated hero)
4. Discussing muted orange-brown colour adjustments

79 Edit calls indicate heavy HTML modification of the mockup files. 32 Playwright calls (navigate + screenshot) confirm visual review loop. This is design iteration work, not code construction.

**Brand rules enforced**: No amber as primary, no gold on white nav, core 5-colour palette only.

### 3. 2a76f890 — SYSOPS / infrastructure_audit (moderate)

**Project**: brains (but actually agent-os + appydave-tools)
**Duration**: 34 minutes, 17 prompts
**Tools**: Bash(57), Read(10), Edit(10), Grep(4), Glob(1), Write(1)

Ansible and app registry audit session. David pasted handover context from a prior session covering:

- apps.json creation at ~/.config/appydave/apps.json (13 apps)
- Ansible playbook execution across 4 machines (VSCode settings)
- Jan and Mary's Philippines machines onboarded into Ansible network
- Cleaning up stale duplicates (skills/app-launcher/references/apps-registry.md)
- YouTube automation dead code cleanup in appydave-tools
- Dirty repo scan across M4 Pro and M4 Mini machines
- Git push operations for multiple repos

57 Bash calls = operational scripting (git status, git push, ansible commands, lsof). The 17 prompts with short active time (34m) shows rapid-fire operational commands. Session ended with pushing repos and killing background tasks.

**CWD note**: CWD is brains/ but actual work spans agent-os, appydave-tools, and system config. CWD unreliable.

### 4. 04d3ec31 — RESEARCH / tooling_discovery (moderate)

**Project**: brains (openclaw investigation)
**Duration**: 62 minutes (25 active), 6 prompts
**Tools**: Bash(39), Edit(19), Read(11), Glob(3)

Research session investigating OpenClaw — appears to be a tool/platform David is evaluating. First prompt asks "what is new and interesting in openclaw for the 2nd brain." Follow-up asks about using it with Max account, persisting findings, and updating locations.json with the remote.

19 Edit calls with 11 Reads in a brains CWD = brain file writes. This is knowledge capture about a new tool discovery. The unauthorized_edit_before_prompt detection (19 instances) suggests Claude was auto-writing brain content aggressively.

### 5. 670e11c5 — OPERATIONS / migration_management (light)

**Project**: ~ (home directory)
**Duration**: 103 minutes (35 active, 67m idle gap), 19 prompts
**Tools**: Bash(33), Edit(3), Glob(2), Agent(1), Read(1), Write(1)

Post-reboot recovery and machine migration management session. David rebooted and lost all iTerm sessions. The session evolved into:

1. Gap analysis of folders between machines (background agent)
2. Reviewing a repo-audit dashboard
3. Triaging which repos to copy from old machine (cmdlet, interactor, k_builder, etc.)
4. Marking items as transferred/skipped in a migration tracking file
5. Evaluating .nvm, .pyenv — deciding they should not be moved

19 prompts with triage-style decisions (keep/skip/copy) = migration management operations. The 32K first prompt is a pasted transcript from a previous session for context.

### 6. 1fe7ad1d — KNOWLEDGE / brain_creation (light)

**Project**: brains
**Duration**: 239 minutes (22 active, 186m idle gap overnight), 6 prompts
**Tools**: brave_web_search(10), Edit(11), Read(6), Glob(5), WebFetch(4), Write(3), ToolSearch(2), Grep(1)

Research and brain creation session. David directed Claude to research a topic (entry point from prior context), search the web, and create a brain file in the anthropic directory. Prompts include:

- "you have to create a brain in anthropic around this and keep an eye on this and link it to AppyStack"
- "can you confirm that Baku & Antspace is real"
- "how is ndjson different to jsonl"
- "keep updating the brain about what we are learning"

10 web searches + 4 WebFetch + 11 Edits + 3 Writes = active research and brain file construction. This is textbook KNOWLEDGE work: web research -> brain file creation -> knowledge persistence.

### 7. 27e871be — OPERATIONS / poem_execution (light)

**Project**: joy-juice (Beauty & Joy)
**Duration**: 15 minutes, 2 prompts
**Tools**: Bash(20), Agent(2), Skill(1), Write(1), Read(1), Edit(1)

Automated agent session — "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work." This is a POEM execution agent running a pre-defined workflow in the joy-juice project. 20 Bash calls in 15 minutes = operational scripting. Agent tool calls suggest subagent coordination.

### 8. b4c6bfca — SYSOPS / infrastructure_audit (light)

**Project**: brains (agent-os context)
**Duration**: 6 minutes, 5 prompts
**Tools**: Bash(12), Edit(3), Read(2)

Short continuation of the Ansible/app registry audit from session 3. David pasted a 7K handover context asking "what is all this about?" — reviewing the session summary. 6 minutes of quick follow-up questions and small edits. Essentially a debrief/review of the infrastructure work done in session 3.

### 9. e9cb8121 — OPERATIONS / poem_execution (micro)

**Project**: joy-juice (Beauty & Joy)
**Duration**: 236 minutes (0 active, 3 idle gaps >1h), 4 prompts
**Tools**: Bash(9), Skill(1)

Another POEM execution agent session — same agent ID (JJ/27231022). Nearly all time is idle gaps (60m, 60m, 81m). The agent appears to be running on a schedule or being periodically resumed. 9 Bash calls with Skill invocation = automated operational work. Zero active minutes confirms this is automated/background.

### 10. ac339def — RESEARCH / problem_diagnosis (micro)

**Project**: brains
**Duration**: 12 minutes, 3 prompts
**Tools**: Read(2), Edit(1), Bash(1), Write(1)

Short session where David pasted a 27K transcript about a device shutdown problem (OMI device?) and wanted to search Discord for related discussions. The prompt mentions "use Playwright MCP" to navigate Discord. Only 5 tool calls = very light work, likely just reading/writing a brain note about the problem. Despite mentioning Playwright, no Playwright tools were actually used.

### 11. b9860add — OPERATIONS / poem_execution (micro)

**Project**: beauty-and-joy
**Duration**: <1 minute, 1 prompt
**Tools**: Bash(3), Skill(1)

Third JJ agent session — same agent ID. Single prompt, 4 tool calls, near-instant completion. Likely a scheduled check-in that found nothing to do.

### 12. de8814c7 — ORIENTATION / quick_lookup (micro)

**Project**: ~ (dev)
**Duration**: <1 minute, 1 prompt
**Tools**: Bash(1)

Single question: "what is my host name of m4 pr". One Bash call to check hostname. Classic micro orientation session.

## Cross-Session Patterns

### JJ Agent Chain (sessions 7, 9, 11)

Three sessions share the same agent ID (27231022-d305-4069-a16a-472c98259e33, "JJ") doing "Paperclip work" in the beauty-and-joy/joy-juice project. These appear to be a POEM-orchestrated agent running periodically. Session 9 shows 3 idle gaps of 60-81 minutes, suggesting scheduled wake-ups. This is the first clear evidence of POEM execution agents on the M4 Pro.

### Ansible/Infrastructure Chain (sessions 3, 8)

Sessions 3 and 8 are a pair — session 8 is a short debrief of session 3's infrastructure audit work. Both share the agent-os + apps.json context.

### Playwright/Browser Theme (sessions 1, 2)

Both sessions 1 and 2 involve Playwright MCP usage — session 1 for debugging and skill creation, session 2 for design review. Session 1 also created the "browse-with-me" skill that session 2 may benefit from.

### Machine Migration (session 5)

Session 5 reveals ongoing M4 Pro <-> M4 Mini migration management with a structured tracking file. David is methodically transferring repos and marking status (transferred/skipped).

## Classification Summary

| Type        | Count | Sessions    |
| ----------- | ----- | ----------- |
| OPERATIONS  | 4     | 5, 7, 9, 11 |
| RESEARCH    | 2     | 4, 10       |
| SYSOPS      | 2     | 3, 8        |
| MIXED       | 1     | 1           |
| BRAND       | 1     | 2           |
| KNOWLEDGE   | 1     | 6           |
| ORIENTATION | 1     | 12          |

**Scale distribution**: 4 micro, 3 light, 3 moderate, 1 heavy (+ 1 absent = session 12 at 0 events practically)

**M4 Pro patterns**: This machine shows more operational and infrastructure work than the M4 Mini. The JJ agent chain is notable — automated POEM agents running in beauty-and-joy context. The machine migration session confirms M4 Pro is the "new" primary machine David is migrating to.
