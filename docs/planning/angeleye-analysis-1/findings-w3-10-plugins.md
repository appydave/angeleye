# Session Findings: d363ca82 — appydave-plugins / Ralphy skill design

**Session ID**: d363ca82-0496-4ff8-8011-d0346b1ae4fb
**Project**: appydave-plugins
**Project dir**: /Users/davidcruwys/dev/ad/appydave-plugins
**Registry classification**: BUILD
**Analysed classification**: skill.design
**Date range**: 2026-02-24T15:25 → 2026-02-25T04:45 (~13 hours, likely paused overnight)
**File size**: 52KB
**Events**: 44 total (18 user_prompt, 26 tool_use — no progress events present)

---

## Classification Challenge

The registry says BUILD. This is **incorrect**.

The session is entirely about **designing and improving the Ralphy skill** (a markdown-defined Claude Code plugin). No application code was written. The edits made were to `SKILL.md` and related skill documentation files inside `appydave-plugins`. This is skill authoring — the appydave-plugins repo _is_ the plugin authoring system; editing SKILL.md files here is the primary work product.

Correct classification: **skill.design** — a design and documentation session that reworks the conceptual model of a skill (Ralphy's modes, terminology, startup behaviour) and commits those decisions into the skill's markdown files.

---

## What Actually Happened

### Phase 1 — Capability discovery failure (prompts 1–5)

David loaded Ralphy (`/appydave:ralphy`) in a different window (supportsignal project) and tried to discover what Ralphy could do. Ralphy searched the filesystem instead of reading from its own brain/SKILL.md first. David was frustrated — Ralphy behaved like a black box with no discoverable capabilities.

This session opened with David asking Claude (in the appydave-plugins repo) to check the Ralphy second brain and plugin to understand his capabilities. This is **meta work** — using one Claude session to diagnose a skill running in another session.

### Phase 2 — Diagnosing the discoverability problem (prompts 14–16)

David delivered a lengthy, pointed critique: Ralphy's modes, commands, and history are not discoverable. The existing campaign-type taxonomy (unit-test-campaign, ui-generation-campaign, etc.) was a relic of early thinking and no longer matched how Ralphy was actually being used. There was no canonical list of what Ralphy does. No separate documents per capability. No index.

Key insight David articulated: Ralphy works in four modes operationally:

1. Requirements — capturing what the user wants
2. Plan — PRD + architecture + implementation plan
3. Build — the Ralphy Wiggum loop (coordinated wave-based development)
4. Extend — adding features to an existing campaign/wave

The word "Extend" had been forgotten (David thought it started with C, then remembered E). This signals the modes were never properly encoded in the skill.

### Phase 3 — Terminology canonicalisation (prompts 17–18)

David clarified that campaign = PR = worktree — three terms users might use interchangeably. Ralphy should accept all three without confusion. The skill should be directive: on startup, Ralphy should read current state and tell the user what's in progress and what options exist.

### Phase 4 — Skill file edits (prompts 19–23, tool burst)

After David said "yes, go ahead," Claude read the SKILL.md (tool: Read), then made edits (tools: Write, Edit, Edit, Bash). This is where the actual SKILL.md update happened — encoding the four modes, the terminology equivalences, and the startup behaviour directive.

### Phase 5 — Overnight gap, then wui-round9 review (prompt 25)

~8 hour gap. David returned and pasted a full transcript from a separate Ralphy session (supportsignal / wui-round9). He wanted Claude to evaluate whether Ralphy performed correctly and identify improvements. This is **skill evaluation** — reviewing a run of the skill against expectations.

The transcript showed Ralphy working well: it detected wui-round9 was complete, noticed 12 campaigns with no BACKLOG.md, offered a "Project Heal" option, and executed it when asked. David was satisfied with this performance.

### Phase 6 — Project Heal concept and skill improvement (prompts 26–37)

David asked whether Ralphy could have a "self-healing" or "project healing" command available cross-project. Discussion followed about canonical vs. messy state. David said "go ahead and write" (clean canonical approach). Another burst of Edits (6 × Edit, 1 × Bash) updated the SKILL.md with Project Heal capability.

### Phase 7 — Review of Ralphy's backlog management (prompt 37)

David pasted another long transcript showing Ralphy doing the full Project Heal operation on the supportsignal project, building BACKLOG.md from 12 campaigns, then trimming prompt-engineering items that belonged to a different system. David asked Claude to add improvements to the Ralphy skill based on what it observed.

Final tool burst: 4 × Edit, 1 × Bash — adding the improvement to SKILL.md.

---

## Tool Usage

| Tool  | Count | Role                                                    |
| ----- | ----- | ------------------------------------------------------- |
| Edit  | 15    | Dominant — all edits to SKILL.md and related skill docs |
| Read  | 5     | Reading SKILL.md, brain docs                            |
| Bash  | 4     | Likely git commits or file verification                 |
| Write | 1     | Writing a new doc section                               |
| Glob  | 1     | File discovery                                          |

Edit-heavy classification from registry is accurate as a tool pattern, but the target of edits is markdown skill files, not application code.

---

## Key Patterns

**Skill authoring via transcript review**: David pastes transcripts of Ralphy running in another session into this session. Claude analyses the transcript and proposes SKILL.md improvements. This is an effective but labour-intensive workflow for skill iteration.

**Frustrated discovery loop**: The session began because Ralphy couldn't explain himself in another window. This is a recurring pain point — skills that don't self-describe on load. The four-mode taxonomy and startup directive pattern directly address this.

**Terminology drift**: "Campaign" vs "worktree" vs "PR" had diverged in usage. The session canonicalised these as synonyms. This is a maintenance cost of natural-language skill interfaces — vocabulary drift is invisible until a user hits a mismatch.

**Cross-session skill debugging**: The user ran a skill in project A, hit a problem, opened project B (the skill's authoring repo), debugged, iterated, then went back to project A. The two-repo, two-session workflow is how skill development actually happens in this ecosystem.

**Project Heal as emergent capability**: The "Project Heal" mode was not pre-designed — it emerged from observing Ralphy's suggestion in a live session. David asked if this could be formalised, it was, and it was added to SKILL.md. This shows the skill evolving organically from usage patterns.

---

## Notable Quotes (David)

> "Not one of these capabilities, commands, or functions that he can do is discoverable. They don't show up in a list. I don't have a name. There's nothing. He's just a black box that you can't investigate."

> "We've been using this skill partly with the second brain... For a couple of weeks now. We've learned a lot along the way, but we've lost every learning, which sucks."

> "I wouldn't mind knowing the 4 modes that he can work in."

These quotes are directly useful for AngelEye classifier training — they represent a user articulating skill discoverability requirements.

---

## Interest Level: high

This session has unusually high signal for AngelEye because:

1. It is a user explicitly articulating what skill metadata they wish existed (modes, discoverability, startup state)
2. It demonstrates the transcript-review workflow for skill iteration — a pattern AngelEye could potentially support
3. The four-mode taxonomy David defined (requirements / plan / build / extend) is a clean mental model that may recur across other skill sessions
4. David's frustration with "lost learnings" is directly relevant to AngelEye's purpose of making session history queryable

---

## Disposition

active — the skill edits were committed (Bash calls at end of each phase likely included git commits). The work was completed within the session.
