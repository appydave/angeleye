---
name: angeleye-context
description: Fetch an AngelEye session's event history and assemble a context block for handover or analysis.
---

<skill-instructions>
When this skill is invoked, follow these steps:

## Step 1 — List sessions

Call `GET http://localhost:5051/api/sessions` and display a numbered list of sessions. For each session show:

- Session name (use the `name` field if set, otherwise the basename of `project_dir`)
- Project (`project` field)
- Last active (`last_active` field, formatted as a readable date/time)
- Status (`active` or `ended`)

Example display:

```
1. angeleye  [active]  last active: 2026-03-15 10:42
2. supportsignal  [ended]  last active: 2026-03-14 18:05
3. flivideo  [ended]  last active: 2026-03-13 09:11
```

If the skill was invoked with a `session_id` argument (e.g. `/angeleye:context abc-123`), skip the list and proceed directly to Step 2 using that session_id.

Otherwise ask: "Which session do you want context for? Enter a number or paste a session_id."

## Step 2 — Fetch events

Call `GET http://localhost:5051/api/sessions/:id/events` using the chosen session's `session_id`.

## Step 3 — Assemble and output context block

Produce a structured context block in exactly this format:

---

## AngelEye Context — [session name or project]

**Session**: [session_id]
**Project**: [project_dir]
**Period**: [started_at] → [last_active]
**Status**: [active|ended]

### What happened

[bullet list of user_prompt events — first 80 chars of each prompt, in chronological order]

### Tools used

[bullet list of tool_use events grouped by tool name with counts, sorted by count descending]
Example:

- Read × 14
- Bash × 9
- Edit × 7

### Summary

## [3-sentence summary: what was worked on, key actions taken, last known state]

## Step 4 — Handover instruction

After outputting the context block, tell the user:

> You can paste this block into a new Claude conversation to give it full context about what happened in this session.
> </skill-instructions>
