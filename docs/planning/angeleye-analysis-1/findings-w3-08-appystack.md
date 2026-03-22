# Findings: W3-08 — appystack / BUILD / build.template_maintenance (4c858f8a)

## Classification

- **Registry**: BUILD / mixed
- **Analysed type**: build.template_maintenance
- **Confidence**: high
- **Reclassification**: subtype correction only — type BUILD is correct, subtype refined
- **Reasoning**: The registry classified this as BUILD/mixed and that is correct — this is a product repo (appystack is the RVETS boilerplate template and its associated CLI). The `mixed` tool pattern is accurate: 9 Read, 12 Bash, 11 Edit, 2 Write, 2 Glob, 1 Agent, 1 Skill. What the registry missed is the _nature_ of the build work: this is not feature addition but architectural correction of a cross-cutting defect — the `data/` directory was being placed inside `server/src/`, which caused nodemon to restart the server on every data write. The fix affected the appystack template itself and then had to be back-propagated to the `create-appystack` CLI generator. The session also includes CLAUDE.md documentation updates and an npm publish. The best subtype is `build.template_maintenance` — a structural fix to a boilerplate template with propagation to the scaffolding tool.

## Session Shape

- **Events**: 44 total (6 user_prompt, 38 tool_use, 0 progress)
- **Duration**: ~33 minutes (2026-03-12T01:17 to 2026-03-12T01:50)
- **Real user prompts**: 6
- **cwd shifts**: Yes — session begins in `/apps/appystack`, then shifts to `/apps/appystack/create-appystack` at event 25 and bounces between both through the end
- **Opening style**: voice-transcribed — "I want you to consider what we're doing with AppyStack and a concept called NodeMon, I guess"

### Tools Breakdown

| Tool  | Count | % of tool_use |
| ----- | ----- | ------------- |
| Bash  | 12    | 31.6%         |
| Edit  | 11    | 28.9%         |
| Read  | 9     | 23.7%         |
| Write | 2     | 5.3%          |
| Glob  | 2     | 5.3%          |
| Agent | 1     | 2.6%          |
| Skill | 1     | 2.6%          |

### Skills Invoked

- `Skill` called once at event 25 — likely `recipe` or `create-appystack` skill to assist with the create-appystack CLI update.

### Phase Structure

The session has four distinct phases:

1. **Context injection and analysis (01:17–01:21)**: David pastes a long conversation from the `deckhand` project showing the EADDRINUSE crash caused by nodemon restarting when `deckhand.json` was written inside `server/src/config/`. He then asks Claude to think through the same failure mode for AppyStack and fix it proactively. The pasted conversation includes Ecamm scene data and full server log output — the prompt is very large (~100KB of context).

2. **Template fix — appystack root (01:21–01:33)**: Agent reads CLAUDE.md, env config, and key files; runs bash checks; then edits files to move the `data/` directory from `server/src/` to the monorepo root. Writes updated tests and documentation. Also considers whether an upgrade tool should be updated (David asks directly at 01:27). Agent concludes the upgrade tool doesn't apply because this is a template design decision, not a version migration.

3. **create-appystack propagation (01:33–01:42)**: David instructs Claude to capture the architectural insight in CLAUDE.md ("We're at dots for AppyStack"). Agent globs for create-appystack files, reads the CLI scaffolding, edits 4 files to propagate the data-at-root pattern to the generator, then runs bash commands to verify. The Skill invocation at event 25 occurs here — the cwd has shifted to `create-appystack`.

4. **Close-down and publish (01:42–01:50)**: David asks if it's safe to close. Agent runs bash checks (git status, test run, etc.). David is then sharp: "Why would you fucking make changes and then forget to do it in the template?" — implying Claude had updated the consumer app but not the template source. Agent fixes this, then runs git commit, git push, and npm publish for the create-appystack CLI package.

## Observations

1. **First prompt contains a full pasted conversation from a different project**: Prompt [0] contains the entire Ecamm/deckhand nodemon debugging transcript (scenes, UUIDs, server logs, full CLI output). David is using it as an example to pattern-match from, not asking Claude to work on deckhand. AngelEye must handle this — large paste artefacts from a different project inside the opening prompt are a false-project signal that will confuse naive keyword classifiers. The actual work is entirely in `appystack`.

2. **Voice transcription artifacts present**: "I want you to consider what we're doing with AppyStack and a concept called NodeMon, I guess" — hedged, spoken-register phrasing. "We're at dots for AppyStack" is almost certainly a mistranscription of "CLAUDE.md" ("dot MD" → "dots"). The phrase only makes sense if parsed as an instruction to document the architectural decision in CLAUDE.md. This is the most clear mistranscription artifact observed in the corpus so far: a command-name rendered as a phonetic approximation.

3. **cwd shifts mid-session as a phase boundary signal**: The first shift from `/apps/appystack` to `/apps/appystack/create-appystack` at event 25 marks the start of Phase 3. This is reliable — cwd changes within a session reliably indicate a scope shift to a sub-project or related package. AngelEye can use first-cwd-shift as a phase boundary detector for monorepo sessions.

4. **Agent frustration prompt at close-down — missed propagation**: David's final angry prompt ("Why would you fucking make changes and then forget to do it in the template?") is a missed-propagation failure. Claude fixed the consuming app but didn't update the template source that generates apps. This pattern — where a fix is applied in one place but the canonical generator is not updated — is common in monorepos with both template and consumer code. It's the inverse of the DRY violation: you fix the consumer but leave the origin stale.

5. **Close-down prompt is a session meta-pattern**: Prompt [34] "Are we at a point where we can close down this conversation?" is a recurring pattern in the corpus. David uses this as a structured end-of-session checklist request. The agent's response to this prompt (running git status, checking tests) is where the missed-template propagation was discovered — the close-down prompt is doing useful work as a final integration check.

6. **npm publish as terminal event**: The session ends with `npm publish` for the create-appystack CLI package — this is a production artefact. The session is not just code editing but a full release pipeline: fix → test → commit → push → publish. For AngelEye, this is a strong signal that the session produced lasting, user-visible change.

7. **Upgrade tool question reveals architectural awareness**: David's question at 01:27 ("Is it appropriate to put [this change] in the update tool?") shows he is thinking about the upgrade/migration pathway for existing consumers. This is a product-thinking prompt, not a bug-fix prompt. The agent correctly identified this as a template design decision that doesn't need an upgrade tool entry (because the data location is configured via env var, not hardcoded).

## Patterns Found

- **Cross-paste context injection**: A large pasted conversation from a different project (deckhand/Ecamm) appears in the opening prompt as an example or analogy. The session work has nothing to do with that project. AngelEye must not attribute the session to deckhand based on pasted content in the prompt. The `cwd` and the tool calls (which files are read/edited) are the reliable project signals.
- **"We're at dots" mistranscription of "CLAUDE.md"**: The phrase "We're at dots for AppyStack" is phonetically decoded as "CLAUDE.md" — "dot MD" → "dots", "AppyStack" preserved correctly. This is a command-token mistranscription: a filename became a near-phonetic approximation in spoken language. A voice artifact classifier should flag phrases like "we're at dots" as candidate mistranscriptions of `.md` file references.
- **Close-down prompt as integration check**: "Are we at a point where we can close down?" triggers a comprehensive status check that catches missed propagation. This prompt acts as a final integration test — its presence predicts a cluster of Bash calls (git status, test run) and may surface deferred work.
- **cwd shift as phase boundary in monorepo sessions**: A shift from the root package to a sub-package (e.g., `appystack` → `create-appystack`) reliably marks a scope change. In multi-package monorepos, cwd shifts are a cleaner phase signal than timestamp gaps.
- **Template-then-generator propagation pattern**: When the fix is in both a template app and the CLI generator that produces it, both must be updated. The session shows the generator update is consistently the second step (Phase 3 begins only after the template is fixed). Missing the generator update is the error David flags in Prompt [37].

## New Types or Subtypes Proposed

- **build.template_maintenance (new candidate)**: Sessions where the primary activity is correcting or improving a boilerplate template and propagating the change to its scaffolding CLI generator. Distinguishing signals: (a) cwd spans both a template root and a sub-package CLI directory, (b) Skill is invoked (often the create-appystack skill), (c) npm publish is a terminal Bash call, (d) prompts include "make the change everywhere" or similar propagation requests. Distinct from `build.feature` (adding new capability) and `build.bug_fix` (fixing a runtime defect) — template maintenance is structural improvement to the developer experience of downstream users.
- **voice.mistranscription.command_token (new candidate signal)**: A sub-signal within voice transcription classification — the specific case where a filename, command, or tool name is phonetically approximated in the transcription. "We're at dots" for "CLAUDE.md" is a clear example. Other candidates: "appystack" → preserved correctly; "NodeMon" correctly transcribed; "dots for" as the failure point. This signal is worth tracking separately from general voice artifacts because it causes semantic errors (the agent cannot act on "dots" without interpreting it).

## Subtype Candidates Confirmed

- **build.template_maintenance**: This session provides the first clean candidate instance. The pattern — architectural fix to a boilerplate, propagated to the generator CLI, ending in npm publish — is concrete enough to define as a subtype.
- **build.monorepo_propagation (secondary candidate)**: The specific mechanic of propagating a change from one package to another within a monorepo is a recurring pattern. This session shows it clearly: fix appystack → propagate to create-appystack. May warrant its own tag as a secondary label.

## Interest Level

high — This session is valuable for multiple reasons: (1) the "We're at dots" mistranscription is the clearest command-token voice artifact found in the corpus and should anchor the mistranscription classifier; (2) the cross-paste injection from deckhand in the opening prompt is a textbook false-project-signal case; (3) the close-down-prompt-as-integration-check pattern appears cleanly; (4) the missed-generator-propagation failure and David's sharp correction is a strong human-feedback-to-agent-error signal. The session is compact (44 events, 33 minutes) with dense signal content. Recommend using as a training case for the voice mistranscription classifier and the template_maintenance subtype.
