# Findings: W1-08 — angeleye (11553588)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: ORIENTATION / cold_start
- **Confidence**: high
- **Reasoning**: No files were created, edited, or written. The entire session is a single-turn search for an HTML mock file created in a prior session. All 13 tool invocations are search or navigation tools (Glob, find, ls, open). The user explicitly references "earlier today I asked you to..." — this is context recovery, not building. The bash-heavy tool pattern tripped the registry classifier into BUILD, but the intent and outcome are purely orientation: locate a prior artifact and open it.

## Session Shape

- Events: 19
- Tools used: Bash x9, Glob x3, Agent (Explore subagent) x1 — total 13 tool invocations
- Duration: ~77 seconds active (08:33:06 to 08:34:23), session_end 16 hours later (idle timeout)
- Opening style: voice (contains transcription artifacts: "How named a session should be" is likely "how a named session should be" or "how to name a session")

## Observations

1. **Misclassification case study**: This is a textbook example of BUILD being overassigned. The bash-heavy tool pattern (9 Bash calls) triggers the infra/build heuristic, but every Bash call is a `find` or `ls` command — purely search, zero modification. The composite classifier rule "Bash >= 50% of tools AND no playwright -> INFRASTRUCTURE_WORK" fires incorrectly here because it does not distinguish read-only Bash (find, ls, open) from write Bash (npm, git, ansible).
2. **Cross-session reference**: The first prompt explicitly references a prior session ("Earlier today I asked you to use mocaccino to build an HTML mock"). The prior session created 5 mochaccino design variants (v1-paper through v5-brief) on March 15. This session on March 17 cannot find them because the user expected them to be more recent.
3. **Skill reference without invocation**: The user mentions "mocaccino" (misspelled — voice transcription artifact). The mochaccino skill was used in the prior session but is not invoked here. The session is about finding the output, not using the skill.
4. **Subagent delegation**: Claude immediately delegated to an Explore subagent, which ran 11 of the 13 tool calls. The main session only ran 2 tools (the Agent call and the final `open` command). This is an efficient pattern for file-finding tasks.
5. **Single-turn session**: One user prompt, one response cycle, done. The session achieved its goal (opened the HTML file in browser) and stopped. No follow-up from the user.
6. **Voice transcription error**: "How named a session should be" is garbled — likely "how a session should be named" or similar. This confirms the ~60-65% voice-transcription rate noted in the framework.

## Patterns Found

- **Read-only Bash misclassification**: The classifier rule for bash-heavy sessions needs a refinement: distinguish between write-intent Bash (npm install, git commit, mkdir, echo >) and read-intent Bash (find, ls, cat, open). Read-only Bash sessions are almost never BUILD.
- **Micro-session pattern**: 77 seconds, single turn, single goal. These ultra-short sessions are common for "where did I put that?" tasks. They may warrant a distinct subtype or at minimum should not be classified as BUILD.
- **Explore subagent as search proxy**: The Explore subagent handled the entire search. Main session only orchestrated and acted on the result. This delegation pattern is characteristic of orientation/retrieval sessions.

## New Types or Subtypes Proposed

- **orientation.artifact_retrieval**: A session whose sole purpose is locating a file or artifact created in a prior session. Distinct from cold_start (which is about recovering context/direction) and handover_check (which verifies a handover document). Signal: single-turn, all-search tools, cross-session reference in first prompt, no file writes.

## Interest Level

medium — This session is individually trivial (find a file, open it), but it is a high-value misclassification example. It demonstrates that the bash-heavy heuristic needs a read-vs-write refinement, and it suggests a new orientation subtype for artifact retrieval. Both findings improve the classifier.
