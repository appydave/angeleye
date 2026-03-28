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

Manages the feedback loop between the AngelEye user (daily operator) and David (product owner / developer).
Four modes. On entry, read state and report what's available before asking David what he wants.

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

## Entry — Read State First

Before presenting modes, scan:

- `AngelFeedback.md` — count pending items (numbered, under "Pending Items")
- `docs/angel-sync/decision-log.md` — last decision date and AE-NNN version
- `docs/angel-sync/audit-log.md` — last audit entry date

Report what you found, then offer the 4 modes:

> "Angel has [N] pending items. Last decision session: [date / 'none']. Last AE version: [AE-NNN / 'none'].
>
> What do you want to do?
>
> 1. **evaluate** — step through pending items, record your decisions
> 2. **summary** — plain-language recap of what was captured (user-readable)
> 3. **audit** — log a change, decision, or rollback to the audit trail
> 4. **handoff** — generate an implementation-ready requirements doc from approved items"

---

## Mode 1: Evaluate

Step through each pending item in `AngelFeedback.md` with David. One item at a time.

### Per item:

1. Read the item — present it in plain language
2. Check `docs/angel-sync/decision-log.md` — flag any contradiction with a prior decision
3. State the technical implication in 1-2 sentences (reference AngelEye architecture where relevant)
4. Ask David: **implement / defer / reject / modify?**
5. If modify — capture David's amended version
6. Record the decision immediately to `docs/angel-sync/decision-log.md` (format in `references/formats.md`)

### Contradiction detection:

Before presenting each item, scan the decision log for related keywords. If a prior decision conflicts:

> "Warning: Item [N] appears to conflict with a prior decision: [what was decided] on [date]. Proceed anyway?"

### After all items:

- Report: N implemented, N deferred, N rejected, N modified
- Ask: "Want to do a handoff now, or keep collecting?"

---

## Mode 2: Summary

Generate a plain-language summary of the latest feedback for the user to read.

- No developer terminology — translate AngelEye internals to user-facing language
- Cover: what was captured, what David has decided (if anything), what's still pending
- Tone: clear, professional — acknowledge that the observations are valued
- Output: display in conversation only (don't write to file)

---

## Mode 3: Audit

Log a change, decision, rollback, or reasoning note to `docs/angel-sync/audit-log.md`.

This is the knowledge transfer trail — designed so future sessions can understand not just what was built, but why decisions were made and what was tried and reversed.

Ask David:

1. What type of entry? (change / decision / rollback / note)
2. What's the context — what happened?
3. Why? (reasoning, constraints, alternatives tried)

Write the entry to `docs/angel-sync/audit-log.md` (format in `references/formats.md`).

**Proactively suggest audit entries** after evaluate mode when David makes a significant decision, reversal, or mentions "we tried X and it didn't work."

---

## Mode 4: Handoff

Generate a versioned requirements document from approved items, ready for plan-mode or recipe-based implementation within the AngelEye AppyStack project.

### Steps:

1. Read `docs/angel-sync/decision-log.md` — collect items marked `implement` or `modify` not yet in a prior AE-NNN handoff
2. Determine next version: scan `docs/angel-sync/` for existing `AE-*.md` files, increment (AE-001, AE-002, ...)
3. Generate `docs/angel-sync/AE-NNN-requirements.md` (format in `references/formats.md`)
4. Structure for plan-mode consumption — goal, discrete work units, done-when criteria, known constraints

After writing:

> "AE-NNN written to `docs/angel-sync/AE-NNN-requirements.md`.
> Use plan-mode or the recipe skill to implement — point it at this file."

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
