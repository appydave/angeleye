# Findings: W2-04 — digital-stage-summit-2026 (3461a2ff)

## Classification

- **Registry**: BUILD / edit-heavy
- **Analysed type**: BUILD / campaign
- **Confidence**: high
- **Reasoning**: The registry got this one right. 13 user prompts, 144 tool invocations, 47 Edits + 14 Writes across a 55-minute active session. The session opens with a voice-transcribed multi-item backlog dump, invokes the /ralphy skill to load the campaign runner, then proceeds through planning and building across multiple backlog items (Swagger API nav link, sync folder setup, Wave 2 planning scaffolding, NotebookLM export feature). Edit > 15 and the multi-item execution pattern match build.campaign. Three Explore subagents were delegated for research tasks mid-build, but the dominant arc is backlog-to-implementation.

## Session Shape

- **Events**: 178 (144 tool_use, 13 user_prompt, 13 stop, 3 subagent_start, 3 subagent_stop, 1 session_start, 1 session_end)
- **Tools used**: Read x48, Edit x47, Bash x28, Write x14, Agent x3, Grep x2, Skill x1, Glob x1 — total 144 tool invocations
- **Duration**: ~55 minutes active (03:31 to 04:26 UTC, 2026-03-17)
- **Turns**: 13 user prompts, 13 stop events
- **Opening style**: voice transcription (contains artifacts: "proviso change" likely "provenance chain", "ruffy loop" = "Ralphy loop", "sixth script" = "sync script")
- **Closing style**: session continuity question ("If I exit out of this conversation and restart, will we be able to keep going from where we're at with a ruffy loop?") — not a closing ceremony but a continuity checkpoint
- **Skills invoked**: /ralphy (Turn 2, at 03:37) — loaded as campaign runner for backlog execution
- **Subagents**: 3 Explore agents (2 in Turn 1 for initial codebase + brains research, 1 in Turn 4 for deep research into sync patterns)

## Observations

1. **Multi-item voice backlog dump**: The first prompt is a 2528-character voice-transcribed monologue containing at least 5 distinct backlog items: (a) Swagger API nav link missing, (b) Swagger API styling, (c) requirements document for script sync, (d) David-Jan shared relay folder system, (e) provenance chain for file sync from brains to shared folder. This is a characteristic "brain dump" opening — David uses the first prompt as a project manager dictating work items, not as a developer requesting a single change.

2. **Correction-heavy middle phase**: Turns 5, 10, and 12 are explicit corrections. Turn 5: "no, no, no, you got it wrong" — corrects the David-Jan relay folder mental model (not inbox/outbox, but shared Dropbox). Turn 10: "Oh, that is horrible that you wrote it" — discovers Claude wrote a nano-banana-prompts file that should have come from the source brain, not been authored by the agent. Turn 12: "We're trying to make automation, so we're not trying to get you to use your copy capabilities" — clarifies that the goal is automated sync, not manual copy.

3. **Provenance chain teaching moment**: Turns 9-10 reveal a significant architectural concern. David discovers Claude wrote a nano-banana-prompts file directly instead of syncing it from the source brain. David's response ("you have to understand the Content Chain") is a real-time teaching moment about the provenance chain principle: the source brain owns the content, the DSS app only syncs it. Claude should transport, not author.

4. **Ralphy skill invocation**: The /ralphy skill is invoked in Turn 2, but the session does not follow a strict Ralphy loop pattern. Instead, it flows as a looser plan-then-build cycle. David asks for a plan (Turn 3), prioritises items (Turn 4), then building begins. The session ends with David asking whether a Ralphy loop can resume across sessions (Turn 13), suggesting Ralphy persistence is a concern.

5. **Relay folder creation**: Bash commands show the creation of ~/relay/david-jan/ as a shared sync location. Initially created with to-jan/from-jan subdirectories, then corrected (Turn 5) to a flat shared structure after David's "not an inbox" correction. Files from the brains directory were copied into this relay folder.

6. **Wave 2 planning scaffold**: Bash commands show mkdir for wave2-polish directories and copying of AGENTS.md from wave1-foundation. This is campaign infrastructure setup — preparing the Ralphy loop structure for the next wave.

7. **Cross-session context paste**: The first prompt contains a block of file paths ("Here are all the files created or modified this session") that was clearly pasted from another active Claude session. This confirms the ~40% handover/paste pattern noted in the framework.

## Patterns Found

- **Voice brain dump as PO dictation**: The opening prompt functions as a product owner dictating a sprint backlog via voice. This is distinct from a developer asking "how do I X?" — it is project management delegation. The voice transcription artifacts are heavy but do not impede understanding.
- **Correction-driven refinement**: Three of 13 turns (23%) are explicit corrections. Each correction reveals a mental model gap: the agent assumed inbox/outbox when David meant shared folder; the agent authored content when it should have synced; the agent suggested manual copy when David wanted automation. This is a normal BUILD pattern, not frustration — David is steering, not abandoning.
- **Provenance chain enforcement**: David catches a provenance violation in real time and uses it as a teaching moment. This is a significant pattern for AngelEye: sessions where the human enforces architectural principles on the agent are high-value content for video graphics (assumption_pivot content type).
- **Campaign with embedded research**: Turn 1 and Turn 4 both delegate to Explore subagents for research (brains directory structure, sync patterns), but the session's primary arc is building. The research is subordinate to the campaign — it feeds the build, it does not stand alone.

## New Types or Subtypes Proposed

- None. build.campaign fits well. The correction-heavy pattern and embedded research are variations within campaign, not distinct subtypes.

## Subtype Candidates Confirmed

- **build.campaign**: Confirmed. Multi-item backlog execution with Ralphy skill invocation, plan-then-build cycle, wave scaffolding, and 47 Edits + 14 Writes across multiple backlog items.

## Interest Level

high — Three reasons: (1) The provenance chain teaching moment (Turns 9-10) is a strong assumption_pivot visualization candidate — "Claude authored the file vs. Claude should only sync the file" is a clear before/after graphic. (2) The David-Jan relay folder correction (Turn 5) demonstrates real-time mental model alignment. (3) The session shows how Ralphy campaigns work in practice: voice dump, skill invocation, plan, prioritise, build, correct, checkpoint continuity. This is a reference session for documenting the Ralphy workflow pattern.
