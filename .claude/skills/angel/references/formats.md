# Angel Sync — File Formats

## decision-log.md

```markdown
# Angel Decision Log

**Project**: AngelEye — Session Intelligence Dashboard
**Last updated**: YYYY-MM-DD
**Current AE version**: AE-NNN (or 'none')

---

## Decisions

### D001 — [Short title of feedback item]

**Date**: YYYY-MM-DD
**Feedback item**: [Item number from AngelFeedback.md, e.g. "Item 3 — workspace auto-assign"]
**Decision**: implement | defer | reject | modify
**David's version** _(if modify)_: [Amended description]
**Reasoning**: [Why — constraints, alternatives, what mattered]
**Included in**: [AE-NNN, or 'pending handoff']

---
```

D### IDs are sequential and permanent. Never reuse or renumber.

---

## audit-log.md

```markdown
# Angel Sync — Audit Log

Knowledge transfer trail for developers building AngelEye.
Covers decisions, changes, rollbacks, and reasoning — not just what was built, but why.

---

## Entries

### [YYYY-MM-DD] — [Short title]

**Type**: change | decision | rollback | note
**Context**: [What happened — brief description]
**Why**: [Reasoning, constraints, what was tried first]
**Outcome**: [What was decided or done]
**Related items**: [Feedback item numbers, D### IDs, or AE-NNN if applicable]

---
```

Entries are chronological — newest at the bottom.

---

## AE-NNN-requirements.md (implementation handoff)

```markdown
# Requirements — AE-NNN

**Date**: YYYY-MM-DD
**Source**: Angel feedback items [list item numbers included]
**Status**: ready for plan-mode / recipe implementation

---

## Goal

[1-3 sentences: what this batch of work achieves and why it matters]

---

## Work Units

### [Short name]

**What**: [What needs to be built or changed — plain language]
**Why**: [User's reasoning / David's decision context]
**Done when**: [Concrete completion criteria — what can be verified]
**Constraints**: [Technical limits, things to avoid, prior decisions that apply]

### [Next work unit]

...

---

## Known Constraints (applies to all units)

- [Stack constraints: RVETS (React 19 + Vite 7 + Express 5 + TypeScript + Socket.io)]
- [Prior decisions that limit approach]
- [Things the user requested but David rejected — so implementors don't re-propose them]

---

## Context for Implementors

[Optional — paste in relevant sections from AngelFeedback.md, STEERING.md, or decision log if agents need domain context to do the work]
```

AE-NNN versioning: scan existing files in `docs/angel-sync/`, find highest number, increment by 1.
First handoff = AE-001.

---

## AngelFeedback.md

```markdown
# Angel Feedback

> **Angel Mode** — conversational product feedback from the AngelEye user.
> Claude writes into this document on their behalf, flags conflicts, and surfaces implications for David to review.
> David processes this file via angel-sync, then archives resolved items.

---

## How This Works

1. The user describes what they want in plain language — Claude writes it up here
2. Claude flags anything unclear, conflicting, or technically significant
3. When David is ready, he runs angel-sync to evaluate each item
4. After processing, resolved items are struck through or archived

---

## Pending Items

### [Category name]

1. **[Short title]** — [Description in the user's own words. What they want, why it matters, what's frustrating about the current behaviour.]

---

## Resolved

_Struck-through items moved here after angel-sync evaluation._

---
```

Items are numbered sequentially within each category. Categories are flexible — use whatever grouping makes sense for the feedback (e.g. UX, Observer View, Enrichment, Workspaces, Bugs).
