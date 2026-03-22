# Findings: W2-03 — digital-stage-summit-2026 (99b75591)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: BUILD / build.campaign
- **Ralphy mode**: Build
- **Confidence**: high
- **Reasoning**: The session opens with `/ralphy`, which loads the Ralphy campaign runner skill. After a brief orientation phase (~2 minutes reading planning docs), the user says "build" at 07:07, triggering Ralphy Build mode. From that point, the session executes a multi-agent wave 4 campaign: writing IMPLEMENTATION_PLAN.md and AGENTS.md, then dispatching 4 background agents across git worktrees (agent-a8309601, agent-af220813, agent-a1325a91, agent-ad42bfd0) to implement subfolder support across shared types, server routes, and client views. The registry classification of BUILD is correct. The bash-heavy tool pattern (106 Bash calls) is explained by the subagents running build/lint/typecheck/test cycles and performing diff/cp operations to merge worktree changes back to main.

## Session Shape

- **Events**: 232
- **Tools used**: Bash x106, Read x40, Edit x32, Write x7, Glob x6, Agent x5, Grep x2 — total 198 tool invocations
- **Subagents**: 5 launched (4 in worktrees, 1 inline). Named agents: route-path-params, readfolder-children, scriptsynview-subfolders
- **User turns**: 11 (of which 3 are task-notification callbacks, reducing real human turns to 8)
- **Duration**: ~54 minutes active (06:57 to 07:51), session_end 17 hours later (idle timeout)
- **Active time**: ~54 minutes with one 7-minute gap (07:12 to 07:19)
- **Skills invoked**: ralphy (first prompt)
- **Opening style**: skill invocation (`/ralphy`), followed by voice-transcribed steering prompts
- **Closing style**: no closing ceremony. Final agent callback is processed, implementation plan updated, then session goes idle

## Observations

1. **Ralphy Build mode confirmed**: The session follows the Ralphy lifecycle precisely — orientation (read backlog/plan docs), user says "build", Ralphy creates planning artifacts (IMPLEMENTATION_PLAN.md, AGENTS.md), then dispatches agents to worktrees. This is the canonical Ralphy Build flow.
2. **Voice transcription pervasive**: Prompts 2-7 are all voice-transcribed. Telltale signs: "Ada's backlog item" (likely "add a backlog item"), "it looks like shit" (raw conversational tone), "you went and created it kind of and never really thought about an API" (accusatory natural speech pattern). Prompt 3 is a single run-on voice dump asking Claude to find the plugins issues register and log a complaint.
3. **Mid-session feedback loop**: Between 07:19 and 07:25, the user interrupts the build campaign to give feedback on a separate backlog item (Swagger API quality). David calls the API visualization "incredible" (likely "incredibly bad" — truncated) and notes Claude "created an API behind my back." This is a backlog grooming detour mid-build.
4. **Agent confusion**: At 07:21-07:24, David asks "Are we in the middle of wave four?" and "Why did it pause? Did I pause it?" — indicating the background agent status was not visible or clear to the user. This is a recurring UX issue with Ralphy's agent delegation pattern.
5. **Cross-project side-quest**: The session briefly touches `/appydave-plugins/PLUGIN-ISSUES.md` to log an issue about Ralphy not providing clear next-action recommendations. This is meta-feedback: using the tool to file a bug about the tool itself.
6. **Worktree merge pattern**: The subagents use a diff-then-cp strategy — diffing worktree files against main, then copying changed files back. This involves heavy read-intent Bash (diff, ls, cat, git status, git show) interleaved with write-intent Bash (cp, mkdir). The 106 Bash calls split evenly: 53 read-intent, 53 write-intent.
7. **Planning-then-execution shape**: The session has two distinct phases. Phase 1 (06:57-07:07): orientation, read planning docs, handle plugin issues feedback, create wave 4 planning artifacts. Phase 2 (07:07-07:51): "build" trigger, agent dispatch, agent callbacks, implementation plan updates. The phase boundary is the single word "build".

## Patterns Found

- **Ralphy Build as campaign orchestrator**: The main session acts as orchestrator — it writes plans, dispatches agents, processes callbacks, updates status. Actual code changes happen in worktrees. The main session's Edit/Write calls target planning docs (IMPLEMENTATION_PLAN.md, AGENTS.md, BACKLOG.md), not source code.
- **Task-notification as pseudo-prompt**: 3 of 11 user turns are `<task-notification>` XML payloads from background agents completing. These are machine-generated, not human. Real human turns: 8. Prompt counts should exclude task-notifications.
- **Voice-to-frustration pipeline**: David's voice prompts carry raw emotional tone that would be filtered in typed input. "It looks like shit", "you went and created it behind my back", "Why did it pause?" — these are not mild corrections but real-time frustration during a build session. Consistent with the framework's finding that frustration appears in 70-80% of multi-hour product sessions, though this is under 1 hour.
- **Single-word mode trigger**: "build" as the entire prompt at 07:07 is a Ralphy protocol — the skill expects a mode keyword. This is a skill-specific interaction pattern not seen in non-Ralphy sessions.

## New Subtypes Proposed

- **build.campaign_ralphy**: A refinement of build.campaign specifically for Ralphy-orchestrated multi-agent builds. Signal: `/ralphy` in first prompt, mode keyword ("build"/"extend"/"plan") in a subsequent prompt, Agent calls with `run_in_background` and `isolation`, task-notification callbacks. Distinct from generic build.campaign because the orchestration pattern is skill-driven, not ad-hoc.

## Subtype Candidates Confirmed

- **build.campaign**: Confirmed. TaskCreate-equivalent (Agent x5 with worktrees), Edit/Bash cycle across agents, planning doc creation — all campaign signals present.

## Interest Level

high — This is the first fully analysed Ralphy Build session. It demonstrates the complete Ralphy lifecycle (orient -> plan -> dispatch -> callback -> update), the worktree merge pattern, the task-notification pseudo-prompt pattern, and the voice-frustration pipeline. It also contains a cross-project side-quest (plugin issues) and a mid-build backlog grooming detour, making it a rich example of how real build sessions deviate from the linear plan-execute model.
