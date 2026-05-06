# Classifier Observations — From Enrichment Work

Captures recurring patterns, signal-reliability findings, taxonomy gaps, and heuristic candidates discovered while running LLM enrichment over the `build.feature` queue (batches 1–6, 2026-05-04).

Living document. Updated as new patterns emerge. Source of truth for what the classifier should learn next.

---

## 1. Signal reliability

### `first_real_prompt` is often noise

Opening prompts are frequently context loads, handover receipts, or housekeeping ("yes", "continue", "/exit", "open a file in VS Code"). The current classifier and the LLM enrichment skill both over-index on the first prompt.

**Rule**: when classifying, look at prompts 2–5 as much as prompt 1. If prompt 1 is paste/handover/yes/continue, treat it as noise and weight subsequent prompts more.

### `paste_handover` + immediate execution = missing human-in-the-loop

Sessions where `opening_style === 'paste_handover'` and a large doc is fed in often have the agent execute immediately without pausing for guidance. This is a known flaw in the handover pattern, not a classification signal about _what_ the work was.

**Rule**: paste_handover + heavy edits in first 10 events → flag as "context-load pending decision", not classified by what the agent did next. Real intent comes 3–5 prompts later (or never, if the user abandoned).

---

## 2. Missing axes (not new tags — new fields)

### `subproject_path` — for monorepo-style projects with internal sub-projects

`brains/` is a 70-brain monorepo, not a single project. Sessions tagged `project: brains` may be working in completely different sub-brains (`anthropic-claude/`, `agent-workflow-builder/`, `brand-dave/`, `ruflo/`, etc.). Classifying them all as one project loses signal.

Same pattern can apply to general code monorepos when consumers want sub-folder tagging.

**Action**: add `subproject_path` derived from edited file paths (e.g., `brains/anthropic-claude/claude-code/`). Not a tag — a missing axis.

### Session topology, not session pairs

Current schema has `opening_style` / `closing_style` per session but no notion of `predecessor_session_id` / `successor_session_id` / `parent_session_id`. The David workflow is **tree-shaped, not chain-shaped**:

- A session can have multiple parents (idea source + handover source)
- A session can spawn multiple children (rabbit-hole branches)
- Subagent legs (see §3) are children of a parent campaign session
- 5–10 session "explorations" off a single morning intent form a forest, not a list

Linear seam detection (predecessor/successor) is a v1 — useful but won't scale to David's actual workflow.

**Action backlog (post 2,000-session enrichment)**: model session-trees. Detect intent drift (morning vs current focus). Visualize daily session-spawn forests. Flag rabbit-hole days vs focus days as a metric.

### Rabbit hole syndrome

Daily pattern: David starts intending to solve problem X, but each new idea spawns a fresh session, then those spawn further sessions. By end of day: a hierarchy of explored concepts when the morning intent was a single problem.

`original_intent` (morning) vs `actual_focus` (where the session went) vs `descendant_sessions` (what it spawned) is a real first-class concept. AngelEye could surface this: "you started today on X, now 14 sessions in, working on Y — was this intentional?"

---

## 3. Taxonomy gaps

### Subagent sessions — mechanism revised (2026-05-04 audit)

**Prior claim (FALSIFIED)**: I previously wrote that subagents in this environment live in `agent-*.jsonl` files with `isSidechain: true`. The audit on 2026-05-04 confirms that across 1,378 JSONL files / 279,348 events, **zero** files use the `agent-` prefix and **zero** entries have `isSidechain: true`. That mechanism (Mechanism A in the brain doc) is not present in this Claude Code installation.

**Verified mechanism (Mechanism B — Agent Teams)**: subagents spawned by Anthropic's Agent Teams feature (Opus 4.6 research preview) are **regular `.jsonl` files in the same project directory** as primary sessions, identified by an XML wrapper in the first user message:

```
<teammate-message teammate_id="team-lead">
You are Amelia, the BMAD Dev implementer. Your job is to run the skill `/bmad-dev DS 6.6`.
...
```

**Scale**: 454 of 1,378 files (33%) are subagents under this mechanism. All currently have `teammate_id="team-lead"`.

**Sources contributing to the 454**:

- BMAD tmux campaigns (Amelia, Quinn, etc.)
- Agent Teams research preview spawns
- Paperclip multi-agent runs
- David's skill-orchestrated agents — when those skills internally use Agent Teams

**Ruflo** (installed 2026-05-04 evening) Mode B uses Agent Teams under the hood, so it will add to this count going forward.

**Why the classifier currently mistags them**: AngelEye's parser sees the first user message contains a teammate-message wrapper and either (a) doesn't extract real text from it, (b) classifies it as a system event, or (c) ingests it as a normal user prompt. Result: zero `user_prompt` events + an `agent_initiated` opening_style label. Identical fingerprint to "headless run" but for different reasons. Batches 5–6 wrote `build.campaign` to ~47 such rows on the assumption they were human-driven campaigns; they're not.

**Action plan**:

1. **Ingestion fix (priority)**: detect `<teammate-message>` regex on first ~20 lines of each JSONL at parse time. Add `session_kind: 'main' | 'subagent'` and `teammate_id` to the registry schema (`shared/src/angeleye.ts`).
2. **Backfill**: re-scan existing JSONLs, mark the 454 subagent rows with `session_kind: 'subagent'` retroactively.
3. **Re-evaluate batches 5–6 LLM tags**: identify the subset that are subagents and adjust tags — likely a future `meta.subagent_session` or `subagent_of:<parent_tag>` form. Naming TBD; defer the taxonomy decision until the schema fields are in place.
4. **Parent linkage** (deferred — harder): match each subagent's session_id to the parent's `Agent` tool call timestamps to populate `parent_session_id` and build the spawn tree. Required for the topology arguments in §2.

**Taxonomy proposal (deferred until schema fix lands)**: add `meta.subagent_session` (or rename — "build.subagent_session" was an earlier attempt). Once the schema distinguishes `session_kind`, the tag is somewhat redundant — it just becomes derived from the field. Decision: probably **don't add a new tag** — use the `session_kind` field instead. Tags stay focused on _what the work was_, fields capture _what kind of session ran it_.

### `build.story_authoring` — for Story 0 / Epic 0 write-up

Some projects (BMAD-style) have a known pattern: session N explores an idea + writes it up as a planning artifact, then session N+1 executes on it. Currently both phases get classified the same way (often `knowledge.methodology_design` or `build.feature`).

**Proposal**: `build.story_authoring` for the write-up phase, distinct from generic methodology design. Only applies to projects using Epic 0 / Story 0.

### `build.story_authoring` — for Story 0 / Epic 0 write-up

Some projects (BMAD-style) have a known pattern: session N explores an idea + writes it up as a planning artifact, then session N+1 executes on it. Currently both phases get classified the same way (often `knowledge.methodology_design` or `build.feature`).

**Proposal**: `build.story_authoring` for the write-up phase, distinct from generic methodology design. Only applies to projects using Epic 0 / Story 0.

---

## 4. Heuristic candidates ready for code

### `/appydave:system-context` → `knowledge.advisory_refinement` (2026-05-04, batch 10)

Heuristic flags any skill invocation as `build.campaign`. But `/appydave:system-context` is a context-refresh skill that updates `CONTEXT.md` files — it's maintenance, not a build campaign. Batch 10 surfaced 7 of 9 moved rows in this exact pattern (78% of moved tags).

**Proposed rule** (not yet in code):

```ts
// DATA: classifier.system_context_skill
if (firstPrompt?.startsWith('/appydave:system-context')) return 'knowledge.advisory_refinement';
```

Promotes from inline pattern detection to a deterministic rule. Same logic likely applies to `/appydave:plugin-index`, `/appydave:relay-register` and other "registry maintenance" skills — verify before generalising.

### Bug fix detection — diagnostic prompts

Original `build.bug_fix` regex only matched `fix/bug/broken/error`, missing diagnostic phrasings. Already expanded in `classifier.service.ts`:

```ts
/\b(?:fix|bug|broken|error)s?\b/i
/\bwhy (?:did|is|does|has|was)\b.{0,60}\b(?:fail|break|crash|not work|wrong|not (?:run|start|load))\b/i
/\bfigure out why\b/i
/\bdiagnos[ei]/i
/\bkeeps? (?:fail|break|crash)/i
```

### Subagent fingerprint heuristic (proposed, not yet in code)

```
agent_initiated + zero user_prompts + (Skill ≥ 1 OR SendMessage ≥ 1)
  → build.campaign (0.85) or build.subagent_session (0.85) [if tag added]
```

Fired ≈47 times across batches 5–6 with no false positives. Strong promotion candidate after `build.subagent_session` is added.

### Project-level historical context (notes for the classifier, not heuristics)

- All `signal-studio` sessions are mock/POC predating SupportSignal proper
- `paperclip` UUID-projects are subagent BMAD campaigns
- `dev` project + agent_initiated = subagent legs spawned by `cwd: ~/dev` parent (a Ralphy or skill-orchestrated run)
- `kiros-sentinal` (2026-05-04 evening onward) is the ruflo testing ground — expect rising subagent volume there

---

## 5. Confidence calibration notes

- `0.95` reserved for unambiguous structural signals (ghost session, explicit /skill, parallel_subagent_bursts: true)
- `0.85` strong fingerprint match (e.g., subagent fingerprint, marathon-edit-heavy)
- `0.75` good fit, one signal confirms
- `0.65` minor confidence bump on existing tag when no sharper signal available
- `0.55` heuristic_only baseline (the source threshold the LLM enrichment is replacing)

---

## 6. Portability note

Each section above with code or config implications has `// DATA: <key>` markers in source — see `data-driven-extraction.md`. Keep adding markers as observations accumulate. **Do not extract config out of code yet** — wait until after the full 2,000-session enrichment pass.

---

## Status

| Batch | Date            | Sessions classified | Cumulative LLM-enriched | build.feature remaining |
| ----- | --------------- | ------------------- | ----------------------- | ----------------------- |
| 1–3   | 2026-05-03 → 04 | 232                 | 232                     | ~554                    |
| 4     | 2026-05-04      | 67                  | 299                     | 401                     |
| 5     | 2026-05-04      | 28                  | 319                     | 314 (after re-extract)  |
| 6     | 2026-05-04      | 50                  | 369                     | 266                     |

Next: `/enrich-subtypes 50 build.feature`.
