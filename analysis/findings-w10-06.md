---
type: analysis
title: 'Findings W10-06'
description: 'W10-06: 9 sessions, 33% BUILD accuracy; proposes 5 subtypes including brain_health_check, product_owner_feature_dump, cross_system_advisory.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W10-06

**Wave**: 10, Agent 06
**Sessions analysed**: 9 (4 brains CWD, 5 prompt.supportsignal CWD)
**Date**: 2026-03-23
**Scale**: 1 light, 8 moderate

---

## BUILD Accuracy

**Registry BUILD count**: 9/9 (all classified BUILD)
**Actual BUILD**: 3/9 (33%)
**Accuracy**: 33% — higher than wave 9 average (11%) but consistent with moderate session accuracy (30-40% from wave 6 learnings).

### Correctly classified BUILD:

1. **84e401ee** — `build.infrastructure_setup` — Ansible playbook development for mac-mini-m4 (tailscale, docker, SSH keys, oh-my-zsh)
2. **521221f0** — `build.infrastructure_setup` — Companion session, ansible provisioning for mac-mini-m2
3. **86a9a3bc** — `build.campaign` — Ralphy wui-round3 worktree build with merge/commit/push

### Incorrectly classified BUILD:

1. **be47bbd8** — Should be `operations.brain_health_check` — Systematic health check across 8+ brain subfolders
2. **8e5e717d** — Should be `planning.product_owner_feature_dump` — Voice-dictated feature observations + campaign planning
3. **49ef67ad** — Should be `planning.product_discovery_and_naming` — AWB naming exercise (Preview -> Pilot) + observation dumping
4. **460a1312** — Should be `knowledge.methodology_design` — Architectural discussion about chat, write-back patterns, display YAML
5. **612e20d9** — Should be `knowledge.cross_system_advisory` — POEM system reviews SupportSignal schema decisions
6. **7263fd75** — Should be `research.tool_evaluation` — Processing group discussion notes, evaluating OpenClaw alternatives + AionUI

---

## Per-Session Observations

### Session 1: be47bbd8 — operations.brain_health_check

- **Pattern**: User runs systematic "health check X" commands across 8+ brain subfolders (agentic-os, anthropic-claude, bmad-method, indiedevdan, valor-agent, mac-os, ansible, dev-environment, live-streaming)
- **Novel subtype**: `operations.brain_health_check` — periodic inventory/status pass on knowledge base
- **Opening frustration**: "Bullshit. There is, you probably got a missname. Do not create, find it." — resolved immediately
- **CWD reliable**: brains/ CWD is correct for this session
- **Tool pattern**: 68% Bash — systematic directory exploration + health status checks
- **Closing**: Explicit handover request

### Session 2: 8e5e717d — planning.product_owner_feature_dump

- **Pattern**: Product owner uses the app and voice-dictates feature observations. 4-5 detailed feature descriptions captured (text area paste, API endpoint, prompt navigation arrows, data folder path truncation)
- **Playwright as UI audit**: 38 Playwright calls used to observe/verify existing UI, NOT to build or test
- **Multi-phase**: Feature observation (morning) + review/planning (afternoon after 7.5h gap)
- **Cross-session**: Plans round 10 campaign, creates round 11 campaign, creates API discovery doc for FliHub integration
- **P13 fired**: Claude misunderstood API endpoint requirement — user had to clarify
- **Closing**: Handover note + plans delegation to new window

### Session 3: 84e401ee — build.infrastructure_setup (GENUINE BUILD)

- **Pattern**: Highly interactive ansible development — 46 user prompts in 115 minutes (1 prompt every 2.5 minutes)
- **Context paste opener**: 7.4KB paste from prior session with ansible output
- **Infrastructure issues**: Tailscale brew cask failed, Docker brew cask failed, SSH key permission denied, sudo password missing
- **P14 fired**: Multiple failed approaches — brew cask installations that needed manual/website alternatives
- **CWD incidental**: CWD is brains/ but work is agent-os/ansible
- **Companion session**: Same day as 521221f0

### Session 4: 521221f0 — build.infrastructure_setup (GENUINE BUILD)

- **Pattern**: Ansible provisioning for mac-mini-m2 + future machine planning
- **PII detected**: References "Jan" and "Mary" as people in Philippines who will get new machines
- **Infrastructure frustration**: Ansible hanging for 30+ minutes during remote cask installations — "its still going, its been a long time, it looks like it is hung"
- **P14 fired**: Remote ansible execution via SSH caused repeated hanging/failures
- **CWD incidental**: brains/ CWD, work is agent-os/ansible
- **Notable**: Architecture planning for 4-machine network across Thailand and Philippines

### Session 5: 49ef67ad — planning.product_discovery_and_naming

- **Pattern**: Naming exercise for AWB modes (Preview -> Reviewer -> Pilot). User explores 10 naming options
- **Delegation pattern**: User observes and captures requirements -> Claude writes tasks -> Background agents build features in worktree
- **EnterWorktree used**: Worktree wui-round13 created for build delegation
- **Abandoned**: 2-day idle gap after worktree setup. Session never resumed.
- **Voice artifacts**: "Any interact, probably most of it is till" — voice dictation artifacts

### Session 6: 460a1312 — knowledge.methodology_design

- **Cross-session handover failure**: User explicitly frustrated — "it didn't know what the fuck you were talking about" — target system couldn't understand handover because Claude didn't include documentation about new concepts (display YAML)
- **Anti-pattern**: Handover without adequate context documentation. Target system receives instructions about concepts it has never seen.
- **ToolSearch cluster**: 7 ToolSearch calls at session start — skill-gap signal
- **Two-day revisit**: Returns 2 days later just to check status and commit uncommitted files
- **Deep architectural discussion**: Chat architecture, write-back patterns, display YAML, delegation protocols — all conceptual, zero code

### Session 7: 612e20d9 — knowledge.cross_system_advisory

- **Confirmed advisory role**: User pastes full SupportSignal PO transcript (~5KB) into POEM session for review
- **Cross-paste injection**: Intentional — user wants this system to evaluate the other's work as source of truth
- **Key insight captured**: "Schema is the contract, type is suggestive" — user corrects Claude's framing
- **Background task delegation**: Requests YAML schema updates via background tasks
- **Edit-heavy**: 33 edits — batch updating promptType fields across all prompt YAML/JSON schemas

### Session 8: 7263fd75 — research.tool_evaluation

- **Pattern**: Processing group discussion notes (#387) about OpenClaw alternatives
- **Web search heavy**: 16 Brave web searches for repos (Nanobot, PocketPaw, Hermes, etc.)
- **P13 fired**: Claude catalogued rather than researched — "You've kind of been adding it to the research topic, so that's not really what I wanted you to do"
- **Background agents**: 5 Agent calls for deep research on AionUI and competing tools
- **Voice artifacts**: "OpenClaw clones" — "Pico cloris in Go" (Pico Claude), "Antico S" (agentic OS)
- **Clean close**: "commit & push"

### Session 9: 86a9a3bc — build.campaign (GENUINE BUILD)

- **Ralphy campaign**: Context paste from prior session with round-3-brief.md
- **Highly autonomous**: Only 5 user prompts. Claude builds in worktree independently.
- **Worktree lifecycle**: Create -> build -> merge -> commit -> push — complete lifecycle
- **Multi-day**: Work spans 12h but only 36 active minutes in short bursts
- **Cross-project research**: Final phase involves investigating AWB visualization components (Astro+Svelte) from agent-workflow-builder repo

---

## New Subtype Proposals

| Subtype                                 | Session(s)         | Description                                                      |
| --------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| `operations.brain_health_check`         | be47bbd8           | Systematic health/status check across brain subfolders           |
| `planning.product_owner_feature_dump`   | 8e5e717d           | Voice-dictated feature observations while using app              |
| `planning.product_discovery_and_naming` | 49ef67ad           | Naming exercises + observation dumping ground + delegation       |
| `knowledge.cross_system_advisory`       | 612e20d9           | One system reviews another system's architectural decisions      |
| `build.infrastructure_setup`            | 84e401ee, 521221f0 | Ansible/infrastructure automation (distinct from build.campaign) |

---

## Patterns and Anti-Patterns

### Cross-session handover failure (460a1312)

When Claude delegates to another session/system, it often fails to include documentation about new concepts introduced in the current session. The target system receives instructions referencing concepts it has never seen. Fix: handovers should include or reference documentation for any concept not already in the target system's knowledge base.

### Companion session pairs

Sessions 84e401ee and 521221f0 are companion sessions — same day, same project (agent-os/ansible), different target machines (m4 vs m2). Session shapes are similar but distinct enough to be separate sessions. Both share CWD incidental pattern (brains/ CWD, agent-os work).

### Voice dictation remains pervasive

All 9 sessions show voice-dictated prompts. Notable artifacts: "Pico cloris" (Pico Claude), "Antico S" (agentic OS), "tail scale" (Tailscale), "instaded" (instead).

### Playwright as UI audit tool (not testing)

Session 8e5e717d uses 38 Playwright calls for UI observation during feature discovery, not for automated testing. This is Playwright semantic role #7: `feature_discovery_audit`.

### Product owner workflow pattern

Sessions 8e5e717d and 49ef67ad show a product-owner workflow: user observes app -> voice-dictates observations -> Claude captures as backlog items -> background agents build features. The human never writes code. This is a PLANNING pattern misclassified as BUILD.

---

## Friction Predicates Summary

| Predicate                   | Fired | Sessions                                                                                    |
| --------------------------- | ----- | ------------------------------------------------------------------------------------------- |
| P13 (misunderstood_request) | 3/9   | 8e5e717d (API endpoint), 460a1312 (handover quality), 7263fd75 (cataloguing vs researching) |
| P14 (wrong_approach)        | 2/9   | 84e401ee (brew cask failures), 521221f0 (ansible remote hanging)                            |
| P15 (buggy_output)          | 0/9   | None — no code output to be buggy                                                           |
| P16 (excessive_changes)     | 0/9   | None                                                                                        |

P13 is the dominant friction predicate in this batch. All three P13 instances involve Claude doing something shallower than what the user wanted — a recurring "depth mismatch" pattern.

---

## Discovery Rate

- **New subtypes proposed**: 5
- **Sessions**: 9
- **Rate**: 0.56/session (consistent with wave 9's 0.51, above wave 6's 0.44)
