# Session Findings: w3-09 — AppyStack Build & NPM Publishing

**Session ID**: 2421e5c5-e54d-4348-9118-90e95b207ca1
**Date**: 2026-02-26 (07:08 – 10:38 AEST, ~3.5 hours)
**Project**: appystack (`/Users/davidcruwys/dev/ad/apps/appystack`)
**File size**: 98,455 bytes (182 events, no progress entries)
**Registry classification**: BUILD
**Analysed classification**: build.audit.publish

---

## Classification Rationale

The registry classification of BUILD is justified but too coarse. This session has three distinct phases:

1. **Audit / gap analysis** (lines 1–26) — evaluating an existing boilerplate for defects
2. **Incremental build waves A–D** (lines 27–90) — fixing identified issues via Ralphy-managed task waves in a worktree
3. **NPM publish + distribution debugging** (lines 43–182) — publishing `@appydave/appystack-config` to npm and iterating on the template's degit-based distribution mechanism

The `publish` phase dominates the second half of the session by time and by frustration level. Subtype: `build.audit.publish`.

---

## Session Arc

### Phase 1: Boilerplate Audit (07:08–07:32)

David opens with a broad question about how to evaluate a boilerplate codebase. Claude performs a deep gap analysis using Task (subagent) and surfaces 46 issues across client, server, and shared layers. David pushes back, asking why a prior planning pass didn't catch these — a reasonable question. Claude proposes a Ralphy campaign plan.

Key decision: address all 46 issues in one conversation rather than piecemeal.

### Phase 2: Build Waves A–D via Ralphy (07:32–08:47)

Claude writes a Ralphy campaign plan and executes Waves A through D inside a git worktree (`appystack-wave2`). Tool pattern is heavily TaskCreate/TaskUpdate/Task (subagent dispatching). Waves complete with Read, Bash, Edit, Write, Glob as leaf operations. This is a clean multi-wave BUILD pattern with good structure.

### Phase 3: NPM Publishing Friction (07:36–10:38)

Parallel to the build waves, David wants to publish `@appydave/appystack-config` to npm. This branch of the session is turbulent:

- **OTP confusion**: Claude and David go back and forth about OTP vs automation token. David becomes increasingly frustrated. Multiple dead ends before landing on an automation token approach.
- **Vitest version mismatch**: The published `@appydave/appystack-config@1.0.0` declares `peerOptional vitest@"^4.1.1"` but the template pins `vitest@4.0.18`. This causes `npm install` to fail with ETARGET. David pastes the error twice; Claude fixes it via Read/Edit/Bash cycles.
- **pnpm warning**: After switching to `nrd` (pnpm dev), David sees a `"workspaces" field not supported by pnpm` warning — template uses npm workspaces syntax which pnpm doesn't read from package.json.
- **degit vs GitHub Template**: David realises mid-session that what was published (`@appydave/appystack-config`) is a shared config package, not the scaffolding mechanism to create a new project. He asks "have we done something totally different and totally wasted our time?" Claude proposes distribution options B (GitHub Template) and C (degit). Both are implemented and documented.
- **GitHub Actions CI/CD secret**: David updates `NPM_SECRET`/`GITHUB_SECRET` and pushes. Claude assists with the push and explains how to test the CI pipeline.
- **Context window exhaustion**: Around line 111, the session continues from a context-window rollover (`"This session is being continued from a previous conversation that ran out of context"`). The summary injection is visible as a user_prompt event.

Session ends mid-iteration on a Bash run fixing what appears to be a remaining pnpm/husky issue in the template.

---

## Tool Pattern Analysis

| Tool       | Count | Notes                                                         |
| ---------- | ----- | ------------------------------------------------------------- |
| Bash       | 50    | Dominant — npm publish, git push, vitest runs, version checks |
| Read       | 21    | package.json files, config, README                            |
| TaskUpdate | 19    | Ralphy wave management                                        |
| Edit       | 13    | package.json versions, README, GitHub Actions YAML            |
| Task       | 10    | Subagent dispatch for build waves                             |
| TaskCreate | 9     | Ralphy task creation                                          |
| Glob       | 5     | Config/package file discovery                                 |
| Write      | 5     | Plan documents, distribution docs                             |
| Skill      | 1     | `/agent-browser` invoked (for npm org linking)                |
| TaskOutput | 1     | Polling background task                                       |

Tool pattern is genuinely `mixed`: structured task-management (Ralphy) coexists with direct Bash execution and file editing. The Skill invocation for browser automation is notable — David tried to use a browser agent to link npm organisations.

---

## Working Directories

- `/Users/davidcruwys/dev/ad/apps/appystack` — primary
- `/Users/davidcruwys/dev/ad/apps/appystack/.worktrees/appystack-wave2` — Ralphy worktree
- `/Users/davidcruwys/dev/ad/apps/appystack/.worktrees/appystack-wave2/config` — config subpackage publish point
- `/Users/davidcruwys/dev/ad/apps/appystack/config` — config before worktree creation
- `/Users/davidcruwys/dev/ad/apps/appystack/template` — template subdirectory

---

## Friction Points

1. **OTP vs automation token**: Repeated back and forth (~6 prompts). Claude kept explaining OTP mechanics while David wanted a non-interactive auth path. Resolution: automation token.
2. **Vitest peer version conflict**: Published package pinned a vitest version that didn't exist at the time. Claude fixed it but only after David pasted the error twice — no proactive version validation before publish.
3. **Distribution mechanism confusion**: David didn't understand the difference between publishing a shared config npm package vs creating a project scaffolding tool. This fundamental misalignment surfaced late (prompt 96), after the publish work was done.
4. **pnpm workspaces warning**: Not resolved within session. The template's `package.json#workspaces` field is ignored by pnpm; requires a `pnpm-workspace.yaml`.
5. **Context window rollover**: Session was long enough to exhaust context, creating a visible seam in the conversation. The continuation prompt shows up as a `user_prompt` event — this is a known pattern for AngelEye to recognise.

---

## Patterns of Interest

- **Ralphy wave execution inside a worktree**: This is the canonical pattern for `appystack` build sessions. Wave letters (A, B, C, D) are used to sequence task groups.
- **Context window continuation as user_prompt**: The `"This session is being continued from a previous conversation"` text appears as event type `user_prompt`. This is a reliable marker for context rollovers.
- **User pasting terminal output as prompts**: Several prompts are raw terminal pastes (npm error logs, install output). These are diagnostic rather than conversational — useful for intent classification.
- **Emotional escalation markers**: Strong language appears at prompts 56, 96, 116, 118, 133. These cluster around the NPM auth and version mismatch issues, not the build waves. The build portion was smooth; publishing was the pain point.

---

## Interest Level: high

This session is high-interest because it contains several distinct patterns AngelEye should learn to recognise:

- Context window rollover marker
- User-pasted terminal error as diagnostic prompt
- Emotional escalation tied to specific tool failures (not general frustration)
- Worktree + Ralphy wave build pattern
- Skill invocation for browser automation

---

## Notes for Classifier Tuning

The registry classified this as BUILD. That is accurate but insufficient. The audit phase (gap analysis, 46-issue sweep) resembles RESEARCH. The publish phase resembles DEVOPS. A multi-label approach would capture this better than a single type. Suggested labels: `build`, `audit`, `publish`, `research.gap-analysis`.
