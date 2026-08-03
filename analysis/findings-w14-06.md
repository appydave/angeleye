---
type: analysis
title: 'Findings W14-06'
description: 'Wave 14-06: 12 M4 Pro sessions — flideck BUILD, appydave.com experiments, voice-agent debug, brains knowledge/ops.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Wave W14-06 Findings — M4 Pro Sessions

**Agent**: W14-06 | **Machine**: m4-pro | **Sessions**: 12 | **Date**: 2026-03-23

## Summary

12 sessions from the M4 Pro machine spanning 2026-02-01 to 2026-03-19. Mixed across flideck BUILD, brains KNOWLEDGE/OPERATIONS, appydave.com BUILD experiments, voice-agent DEBUG, and several micro/orientation sessions. Notable: 3 appydave.com sessions appear to be a coordinated demo/experiment burst (all within 8 minutes on Mar 12).

---

## Session Classifications

### 1. 7e050438 — flideck | BUILD.feature_construction | heavy

- **Event count**: 207 | **Active**: 262 min | **Duration**: 644 min | **Prompts**: 22
- **Tools**: Bash 58, Edit 26, Read 18, Agent 17, Playwright 36, Write 11
- **Registry**: BUILD (correct)
- **Evidence**: Handover from prior session — user received ralphy handover instructions and continued FliDeck development. 22 prompts across multiple work windows (3 idle gaps >1h). Playwright used heavily for visual QA. Compaction resume detected. Multiple waves of build-test-commit cycles. User delegating heavily ("do what you think next", "go", "yes, build").
- **Subtype**: build.feature_construction
- **Interest**: high — long multi-phase BUILD with Playwright QA and ralphy-style handover chain

### 2. 2051dcf8 — brains | OPERATIONS.brain_maintenance | moderate

- **Event count**: 135 | **Active**: 81 min | **Duration**: 262 min | **Prompts**: 15
- **Tools**: Bash 54, Read 30, Edit 27, Skill 4, Agent 3
- **Registry**: BUILD (incorrect)
- **Evidence**: Opens with "is brain committed and pushed at moment" — git status check. Then "we have done a lot of work on brains, been a while since we healed or did work" — launching brain librarian maintenance. Broken link checks, memory cleanup ("DELETE MEMORIES"), file count investigation via background agent. 4 skill invocations. This is brain repo maintenance/operations, not feature construction.
- **Subtype**: operations.brain_maintenance
- **Interest**: medium — standard brain hygiene session

### 3. 6d935c3b — brains | KNOWLEDGE.research_and_capture | moderate

- **Event count**: 96 | **Active**: 75 min | **Duration**: 410 min | **Prompts**: 14
- **Tools**: Bash 43, Write 13, Edit 11, Read 10, brave_web_search 3, Agent 2
- **Registry**: BUILD (incorrect)
- **Evidence**: Opens with git pull on brains. Then pivots to research: Moom vs Hammerspoon window management, Rectangle alternatives. Web searches (3 brave_web_search calls). Ansible/iTerm configuration investigation. Writes 13 files — brain knowledge capture about workspace automation tools. Discussion of naming a new application "Workspace Automation". Cross-machine concerns (M4 Mini vs M4 Pro). This is research and knowledge capture into brains, not BUILD.
- **Subtype**: knowledge.research_and_capture
- **Interest**: medium — workspace automation tooling research with brain writes

### 4. a554e693 — voice-agent | DEBUG.regression | moderate

- **Event count**: 77 | **Active**: 56 min | **Duration**: 56 min | **Prompts**: 6
- **Tools**: Bash 47, Read 12, Edit 11, Grep 1
- **Registry**: BUILD (incorrect)
- **Evidence**: Opens with "how do I start the voice-agent". Immediately hits Rust compilation errors. User reports "this is a new reboot of the computer, can you add some logging". Frustration: "last time I was testing this code base, it worked, nothing has changed in 2 weeks, wtf". The fn key processing application broke after a reboot. Bash-heavy (47 calls) with 11 edits — debugging/fixing, not constructing new features.
- **Subtype**: debug.regression
- **Interest**: medium — post-reboot regression in Rust voice-agent, frustration signals

### 5. bcfaa06e — davidcruwys (home) | RESEARCH.system_audit | light

- **Event count**: 57 | **Active**: 75 min | **Duration**: 122 min | **Prompts**: 17
- **Tools**: Read 14, Bash 9, Edit 8, Write 5, Glob 4
- **Registry**: BUILD (incorrect)
- **Evidence**: CWD is /Users/davidcruwys (home dir). First prompt: "Have you got any way of figuring out of the dev directory, which projects have I been actively working on?" Mentions "save-the-machine because the monitor has died problem". This is a system audit/discovery session — understanding project activity across repos. Read-heavy with some writes. Not BUILD.
- **Subtype**: research.system_audit
- **Interest**: medium — machine migration context, monitor failure recovery

### 6. f1a7214e — appydave.com | BUILD.prototype | light

- **Event count**: 46 | **Active**: 7 min | **Duration**: 7 min | **Prompts**: 2
- **Tools**: Read 15, Bash 14, Write 5, Playwright 5, Glob 2, ToolSearch 2
- **Registry**: BUILD (correct)
- **Evidence**: "I need you to build this website for me... open it up in Playwright MCP". Quick prototype build — 7 minutes total. Mentions "practical AI translator" for Bob. Part of a coordinated burst of 3 sessions at appydave.com on Mar 12 (all started within 2 minutes of each other). Light scale but genuine BUILD.
- **Subtype**: build.prototype
- **Interest**: low — quick demo/experiment build

### 7. 5bf67eee — appydave.com | BUILD.prototype | micro

- **Event count**: 27 | **Active**: 6 min | **Duration**: 6 min | **Prompts**: 1
- **Tools**: Read 11, Bash 5, Write 5, Playwright 3, Glob 1, ToolSearch 1
- **Registry**: BUILD (correct)
- **Evidence**: "Create the AI Creative Studio website for me... do it in a work tree and make sure you open it up in Playwright MCP". Single-prompt prototype. Worktree usage. Same burst as f1a7214e. 6 minutes. Micro but genuine BUILD.
- **Subtype**: build.prototype
- **Interest**: low — quick demo/experiment build

### 8. 07ee5ed8 — appydave.com | BUILD.prototype | micro

- **Event count**: 21 | **Active**: 7 min | **Duration**: 7 min | **Prompts**: 1
- **Tools**: Read 6, Bash 5, Edit 5, Agent 4
- **Registry**: BUILD (correct)
- **Evidence**: "I need you to create a work tree called '30 year' and I need you to build this application". Single-prompt, worktree-based prototype build. Same burst. Agent calls (4) suggest delegated sub-tasks. Micro but genuine BUILD.
- **Subtype**: build.prototype
- **Interest**: low — quick demo/experiment build

### 9. 57f28430 — brains | ORIENTATION.information_retrieval | micro

- **Event count**: 12 | **Active**: 1 min | **Duration**: 1 min | **Prompts**: 2
- **Tools**: Read 8, Bash 2
- **Registry**: KNOWLEDGE (reasonable but too strong)
- **Evidence**: "Do you know what computers I have on my mesh?" — pure information retrieval from brain files. 1 minute, read-only. No writes. Not KNOWLEDGE (no brain writes). This is orientation/retrieval.
- **Subtype**: orientation.information_retrieval
- **Interest**: low

### 10. e9761f48 — brains | ORIENTATION.compaction_resume_check | micro

- **Event count**: 8 | **Active**: 1 min | **Duration**: 1 min | **Prompts**: 3
- **Tools**: Read 2, Edit 2, Glob 1
- **Registry**: BUILD (incorrect)
- **Evidence**: User pasted compacted conversation output asking "what was this conversation about?" — reviewing a prior session about file-sync-strategy and Syncthing ansible configs. 2 edits but only 8 events in 1 minute. Micro session checking a compacted conversation's topic.
- **Subtype**: orientation.compaction_resume_check
- **Interest**: low

### 11. 492c6676 — repo-audit | ORIENTATION.cold_start | micro

- **Event count**: 4 | **Active**: 4 min | **Duration**: 4 min | **Prompts**: 2
- **Tools**: Bash 1, Read 1
- **Registry**: BUILD (incorrect)
- **Evidence**: "how to run the audit tool" — asking how to use the repo-audit utility. 2 tools in 4 minutes. Pure cold-start orientation.
- **Subtype**: orientation.cold_start
- **Interest**: low

### 12. 993c5520 — brains | META.test_session | micro

- **Event count**: 2 | **Active**: 3 min | **Duration**: 3 min | **Prompts**: 1
- **Tools**: Read 1
- **Registry**: BUILD (incorrect)
- **Evidence**: "the quick brown fox" — test input. Single Read tool call. This is a throwaway test session, not BUILD.
- **Subtype**: meta.test_session
- **Interest**: low — junk/test

---

## Patterns and Observations

### Registry Misclassification Rate

- 9 of 12 sessions were classified as BUILD in the registry
- Only 3 are actually BUILD (the appydave.com prototype burst)
- The M4 Pro registry appears to default everything to BUILD — same pattern seen on M4 Mini

### Appydave.com Prototype Burst

Sessions f1a7214e, 5bf67eee, 07ee5ed8 all started within ~90 seconds of each other (12:07-12:09 on Mar 12). All are in /dev/ad/sites/appydave.com. Two use worktrees. This looks like a coordinated demo — possibly showing someone how Claude Code can build websites quickly, or testing parallel session capability.

### Voice-Agent Rust Project

Session a554e693 reveals a Rust-based voice-agent in /dev/ad/experiments/voice-agent that processes the fn key. Post-reboot regression with frustration signals. This is the first time this project appears in analysis.

### M4 Pro Usage Pattern

The M4 Pro sessions skew toward:

- Research/knowledge work in brains (4 sessions)
- Quick experiments/demos (3 sessions)
- Active development on flideck (1 heavy session)
- Utilities and debug (4 sessions)

This contrasts with M4 Mini which had more sustained BUILD sessions. The M4 Pro appears to be used more for exploratory and maintenance work.

### Frustration Signals

- **a554e693** (voice-agent): "wtf" — post-reboot regression
- **bcfaa06e**: Monitor death, machine migration stress

### Cross-Machine References

- Session 6d935c3b explicitly discusses M4 Mini vs M4 Pro configuration differences
- Session bcfaa06e references "save-the-machine because the monitor has died"
