---
name: angel
description: >
  Angel Sync — feedback evaluation and knowledge transfer for AngelEye session intelligence dashboard.
  The user is the daily operator of AngelEye (feature requests, UX feedback, workflow observations).
  David is the product owner / developer.
  Use when David says "angel", "angel sync", "angel-sync", "evaluate feedback", "review angel requests",
  "angel decisions", "angel audit", "angel handoff", "process angel feedback", "angel evaluate",
  "what's in the angel queue", or any variant of processing pending AngelEye user requests
  or preparing them for implementation.
---

# Angel Sync

Manages the feedback loop between two roles — often the same person wearing different hats.

## Entry — Read State, Then Offer Two Modes

Before presenting modes, scan:

- `AngelFeedback.md` — count pending items (numbered, under "Pending Items")
- `docs/angel-sync/decision-log.md` — last decision date and AE-NNN version

Report what you found, then present:

> Angel has [N] pending items. Last decision session: [date / 'none'].
>
> **C — Capture** (user hat)
> You're the daily operator. Describe features, observations, pain points, ideas — anything you notice while using AngelEye. I'll write them up in AngelFeedback.md.
>
> **T — Triage** (product owner hat)
> You're the decision-maker. Step through pending items one by one — implement, defer, reject, or modify each one. Then optionally generate a handoff doc for implementation.
>
> Which mode? (C/T)

## Domain Context

AngelEye is a session intelligence dashboard for Claude Code. Key concepts the user may reference:

- **Sessions** — Claude Code JSONL transcripts (ingested, classified, enriched)
- **Observer view** — read-only session timeline and detail
- **Organiser view** — workspace assignment, tagging, manual overrides
- **Classifiers** — predicates (P-prefixed), classifiers (C-prefixed), observations (O-prefixed)
- **Enrichment pipeline** — backfill, sync, classify, correlate chain
- **Affinity groups** — cross-session correlation (story units, workflow clusters, epic sprints)
- **Workspaces** — project-level grouping of sessions
- **Hooks** — Claude Code command hooks that feed live events to AngelEye
- **Overlays** — domain-specific config (e.g. BMAD agent roles mapped to generic workflow classifiers)

---

## Mode C: Capture

The user describes features, pain points, observations, or ideas in plain language. Claude's job:

1. Listen, clarify if needed, then write each item as a numbered entry under "Pending Items" in `AngelFeedback.md`
2. Use the user's language — don't over-engineer the description
3. Flag anything that contradicts a prior decision in `docs/angel-sync/decision-log.md`
4. Keep going until the user says they're done
5. Report: "Added [N] items. You now have [total] pending. Run /angel again and pick T when you're ready to triage."

---

## Mode T: Triage

Step through each pending item in `AngelFeedback.md` one at a time.

### Per item:

1. Present the item in plain language
2. Check `docs/angel-sync/decision-log.md` — flag any contradiction with a prior decision
3. State the technical implication in 1-2 sentences (reference AngelEye architecture where relevant)
4. Ask: **implement / defer / reject / modify?**
5. If modify — capture the amended version
6. Record the decision immediately to `docs/angel-sync/decision-log.md` (format in `references/formats.md`)

### Contradiction detection:

Before presenting each item, scan the decision log for related keywords. If a prior decision conflicts:

> "Warning: This appears to conflict with a prior decision: [what was decided] on [date]. Proceed anyway?"

### After all items:

- Report: N implemented, N deferred, N rejected, N modified
- Ask: "Want to generate a handoff doc for the approved items?"

### Handoff (optional, offered after triage):

Generate a versioned requirements document from approved items.

1. Collect items marked `implement` or `modify` not yet in a prior AE-NNN handoff
2. Determine next version: scan `docs/angel-sync/` for existing `AE-*.md` files, increment (AE-001, AE-002, ...)
3. Generate `docs/angel-sync/AE-NNN-requirements.md` (format in `references/formats.md`)
4. Structure for plan-mode consumption — goal, discrete work units, done-when criteria, known constraints

> "AE-NNN written to `docs/angel-sync/AE-NNN-requirements.md`.
> Use plan-mode or the recipe skill to implement — point it at this file."

### Audit (proactive):

After triage, if David made a significant decision, reversal, or mentioned "we tried X and it didn't work" — suggest logging it to `docs/angel-sync/audit-log.md` for the knowledge trail.

---

## Key Files

| File                                     | Purpose                                                 |
| ---------------------------------------- | ------------------------------------------------------- |
| `AngelFeedback.md`                       | User's raw input — source of truth for pending items    |
| `docs/angel-sync/decision-log.md`        | David's decisions on every feedback item                |
| `docs/angel-sync/audit-log.md`           | Change/decision/rollback trail for knowledge transfer   |
| `docs/angel-sync/AE-NNN-requirements.md` | Versioned implementation handoffs (AE-001, AE-002, ...) |

Create `docs/angel-sync/` on first use if it doesn't exist.

See `references/formats.md` for all file formats.
