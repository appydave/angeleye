---
type: analysis
title: 'Findings W10-01'
description: 'W10-01: 9 sessions, 37.5% BUILD accuracy; proposes 8 subtypes including product_discovery, cross_project_fix, and remote_onboarding.'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — Wave 10, Agent W10-01

**Analysed**: 2026-03-23
**Sessions**: 9 (1 heavy, 8 moderate)
**BUILD accuracy**: 3/8 = 37.5% (session 33bbe033 had no registry type; of 8 with BUILD, 3 correct)

## BUILD Accuracy Assessment

Of 8 sessions classified BUILD by the registry:

- **Correct (3)**: 77d71fc4 (appystack campaign), 866cd7ea (prompt.supportsignal refactoring), 33bbe033 (angeleye campaign — no registry type but would be correct)
- **Incorrect (5)**: b95a97be (RESEARCH), 656018b4 (KNOWLEDGE), 59c75fd2 (OPERATIONS), 67dfdd2e (DEBUG), 77764bc1 (KNOWLEDGE), 1432e6e9 (OPERATIONS)

Accuracy is ~37.5%, higher than wave average (~20-25%) as expected for moderate-heavy sessions. The 33bbe033 heavy session had no registry type but is genuine BUILD. If included, 4/9 = 44%.

Pattern confirmed: moderate sessions hit ~30-40% BUILD accuracy, consistent with wave 6-8 findings.

## Per-Session Observations

### 33bbe033 — AngelEye wave6 campaign (HEAVY, BUILD)

**Type**: build.campaign (confirmed)

Multi-phase Ralphy campaign session with 17 subagents. Four distinct phases:

1. Ralphy hardening campaign (H01-H05, T01-T06)
2. UI polish attempt — user frustrated with subagent output quality
3. Mochaccino design exploration — 5 design variants generated (paper/linen/continuity/cockpit-light/brief) for observer+organiser views
4. Commit and cleanup

Key finding: **Frustration-driven phase pivot**. User dissatisfied with subagent polish ("incredibly minor changes") pivoted to Mochaccino design exploration to establish proper design direction before continuing implementation. This is a productive frustration response — the user recognized the root cause (no design direction) and used a design tool to fix it.

Playwright used for **design preview** — navigating generated HTML prototypes, taking screenshots of 5 design variants. This is the ui_audit semantic role.

### b95a97be — AngelEye genesis (MODERATE, RESEARCH)

**Type**: research.product_discovery (reclassified from BUILD)

This is the historical genesis session for the AngelEye product. The session traces the entire conceptual journey:

- Claude Code hooks research
- "NanoBanano" concept for observability
- Web search for existing session replay tools
- Playwright evaluation of existing tools (external_research role)
- Product naming progression: NanoBanano -> AngelicEye -> AngelEye
- Architecture and data design

Key finding: **Product birth session**. This session shows a complete product discovery arc from initial concept through tool evaluation to naming and architecture. The compaction at L93 shows context exhaustion mid-research — the session survived via structured summary.

Voice artifacts: "Nano Banana" = NanoBanano, "Angelic" was the word the user said that Claude missed, leading to "AngelicEye" -> "AngelEye."

Frustration: "I'm still trying to figure out what the fucking Open Floor is" — terminology confusion about an existing tool (OpenReplay?).

6 ToolSearch calls = skill_gap signal. User expected observability skills that didn't exist — this gap directly motivated building AngelEye.

### 77d71fc4 — AppyStack template build (MODERATE, BUILD)

**Type**: build.campaign (confirmed)

Clean Ralphy campaign using Task/TaskCreate/TaskUpdate parallel pattern. 18 work units (WU-1 through WU-19) executed via worktree. Opened with a massive 27KB context paste from prior session (form_filling detected).

Notable: User had to repeat question at L16 about WU-1 to WU-19 file — Claude initially misunderstood and searched wrong locations (P13 fired).

Clean session overall — worktree merge, commit, push. No significant friction beyond the initial misunderstanding.

### 656018b4 — SupportSignal UX Design Spec (MODERATE, KNOWLEDGE)

**Type**: knowledge.ux_design_specification (reclassified from BUILD)

BMAD UX Designer skill produces a comprehensive 13-step UX design specification. User provides expert domain corrections via a distinctive "c" (continue) + inline feedback pattern. Zero code written — output is a single UX design specification markdown document.

Key finding: **Guided skill workflow with domain expert Q&A**. The session has a highly structured interaction pattern: skill produces a section, user provides corrections/refinements with domain expertise (NDIS sector knowledge, competitor analysis, design system decisions), then continues. This is a knowledge production workflow, not BUILD.

4-day idle gap (5572 minutes) between two active bursts — user returned to same session after days away. Session_start at L108 suggests a resume.

### 59c75fd2 — Infrastructure setup (MODERATE, OPERATIONS)

**Type**: operations.infrastructure_setup (reclassified from BUILD)

Multi-topic infrastructure session covering:

1. Tailscale VPN setup for M4 Mini and M2
2. File transfer methods (rsync vs SMB)
3. BlackHole audio aggregate device documentation
4. Commit and brain librarian

CWD=brains is incidental — work spans Ansible playbooks and agentic OS configuration. Voice: "VPS into the M4 Mini" = VPN/SSH, "EcammLive hijacking audio."

### 67dfdd2e — Cross-project port conflict fix (MODERATE, DEBUG)

**Type**: debug.cross_project_fix (reclassified from BUILD)

Key finding: **Single-issue, multi-repo debug session**. A port conflict problem is diagnosed and fixed across 6+ repos (thumbrack, flideck, flihub, brainss, angeleye, appystack template, prompt.supportsignal). The AppyStack template is updated to prevent future recurrence.

CWD=brains is completely incidental — zero brain files touched. This is a new subtype: debug.cross_project_fix, where the debug scope spans multiple projects.

Frustration: "This is an ongoing problem" and "this is just shit" — user has hit port conflicts repeatedly. Wave 6 identified "port-kill sessions" as a recurring micro pattern; this is the systematic fix session.

Two large idle gaps (148min, 414min) but only 20 active minutes — user left and came back, likely after checking affected apps.

### 77764bc1 — Brain reorganization (MODERATE, KNOWLEDGE)

**Type**: knowledge.brain_reorganization (reclassified from BUILD)

Session creates a new "dent" brain (business methodology), moves content from brand-dave, processes PDFs, and sets up archive patterns.

Key finding: **Domain confusion friction**. At L38, user is frustrated that Claude confused "dent" (business methodology) with "brand-dave" (personal brand). These are related but distinct knowledge domains. This is a P13 (misunderstood_request) where the AI fails to maintain domain boundaries.

Voice artifacts: "stretcher" (structure?), "Bray and Dave" (brand-dave), "Yamil" (YAML).

Compaction at L92 — session survived but post-compaction was just migration verification.

### 1432e6e9 — Remote Mac onboarding with Lars (MODERATE, OPERATIONS)

**Type**: operations.remote_onboarding (reclassified from BUILD)

Key finding: **Live stakeholder session**. User is in a meeting with Lars, a coworker setting up a new Mac. User pastes terminal output from Lars's machine, generates paste-ready commands for the meeting chat.

Multiple friction points:

- L23: Claude gave bullet points instead of paste-ready commands — "That's next to useless for us"
- L27: Claude assumed Claude Code was available on remote machine when only Claude Co-work was available
- L87: End-of-session reflection — "a huge amount of things failed" in Ansible setup

This session shows a distinctive **proxy interaction pattern** — the user is mediating between Claude and a remote machine operator. Real-time actionability matters more than thoroughness. Claude needs to produce immediately-pasteable commands, not explanatory bullet points.

Voice artifacts: "answerable" (Ansible), "Yamil" (YAML), "Claudemd" (CLAUDE.md).

### 866cd7ea — Schema case convention fix (MODERATE, BUILD)

**Type**: build.refactoring (confirmed)

Clean 31-minute refactoring session. Snake_case normalization across prompt schemas using parallel Task pattern (8 TaskCreate, 16 TaskUpdate). Only 5 user prompts, 82 tool calls — highly automated, low interaction ratio.

No friction. No frustration. Efficient execution.

## New Subtype Proposals

| Subtype                           | Session  | Confidence | Notes                                                               |
| --------------------------------- | -------- | ---------- | ------------------------------------------------------------------- |
| research.product_discovery        | b95a97be | high       | Product birth — concept through naming and architecture             |
| debug.cross_project_fix           | 67dfdd2e | high       | Single issue fixed across 6+ repos                                  |
| operations.remote_onboarding      | 1432e6e9 | high       | Live meeting, proxy interaction with remote machine                 |
| operations.live_stakeholder       | 1432e6e9 | medium     | Could be a modifier rather than subtype                             |
| knowledge.ux_design_specification | 656018b4 | high       | BMAD skill-driven design doc production                             |
| knowledge.brain_reorganization    | 77764bc1 | high       | Brain directory restructuring and content migration                 |
| build.design_exploration          | 33bbe033 | medium     | Mochaccino design variant generation — phase within larger campaign |
| build.convention_normalization    | 866cd7ea | medium     | Case convention fix — variant of refactoring                        |

## Novel Patterns

### 1. Frustration-driven phase pivot

Session 33bbe033 shows a productive frustration response: user unhappy with subagent polish quality -> pivots to design tool (Mochaccino) to establish proper direction -> design variants generated -> session can continue with clear direction. The frustration was a signal that the session lacked prerequisite design work.

### 2. Proxy interaction pattern

Session 1432e6e9 shows Claude mediating between the user and a remote machine operator in a live meeting. The user needs paste-ready commands, not explanations. Claude's default behavior (explanatory bullet points) creates friction. This pattern needs detection — when the user is relaying commands to a third party, output format matters critically.

### 3. Product birth arc

Session b95a97be traces a complete product discovery journey: pain point -> research -> tool evaluation -> naming -> architecture. This is a rare session type that creates something conceptually new rather than building or modifying existing work.

### 4. Cross-project debug sweep

Session 67dfdd2e shows a single-issue debug session spanning 6+ repos. The template update at the end shows "learn and prevent" — the user ensures the root cause is fixed in the template that generates new projects.

### 5. Guided skill workflow with domain corrections

Session 656018b4 shows a distinctive pattern: BMAD skill drives the workflow, user provides domain expertise corrections via "c" + inline feedback. The user is a domain expert reviewer, not a developer. The session produces knowledge artifacts, not code.

## Voice Artifact Catalog (new entries)

| Artifact      | Intended   | Session            |
| ------------- | ---------- | ------------------ |
| Nano Banana   | NanoBanano | b95a97be           |
| Bray and Dave | brand-dave | 77764bc1           |
| Yamil         | YAML       | 77764bc1, 1432e6e9 |
| stretcher     | structure  | 77764bc1           |
| answerable    | Ansible    | 1432e6e9           |
| Claudemd      | CLAUDE.md  | 1432e6e9           |
| VPS           | VPN/SSH    | 59c75fd2           |
| propt/pormpt  | prompt     | 866cd7ea           |

## Friction Predicates Summary (P13-P16)

| Predicate                   | Fired | Sessions                     |
| --------------------------- | ----- | ---------------------------- |
| P13 (misunderstood_request) | 3/9   | 77d71fc4, 77764bc1, 1432e6e9 |
| P14 (wrong_approach)        | 1/9   | 1432e6e9                     |
| P15 (buggy_output)          | 1/9   | 33bbe033                     |
| P16 (excessive_changes)     | 0/9   | none                         |

P13 is most common, consistent with wave 8 findings. P14+P13 co-occurrence in 1432e6e9 (live stakeholder session) — Claude both misunderstood the format requirement AND took the wrong approach by assuming Claude Code availability.

## Playwright Semantic Roles Observed

- **ui_audit**: 33bbe033 — previewing Mochaccino design variants
- **external_research**: b95a97be — evaluating existing session replay tools

## Summary Statistics

- Sessions analysed: 9
- BUILD confirmed: 3 (33bbe033, 77d71fc4, 866cd7ea)
- Reclassified: 5 (RESEARCH x1, KNOWLEDGE x2, OPERATIONS x2, DEBUG x1)
- No registry type: 1 (33bbe033 — would be correct BUILD)
- Multi-phase: 8/9 (89%)
- Has frustration: 5/9 (56%)
- CWD incidental: 4/9 (44%)
- Voice transcribed: 8/9 (89%)
- New subtypes proposed: 8
- New voice artifacts: 8
