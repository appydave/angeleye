---
id: req-2026-05-06-ingestion-backup-upstream-jsonl
title: Ingestion — back up upstream JSONL at session_end before Claude Code purges it
category: ingestion
status: open
created_at: 2026-05-06T15:20:00.000Z
evidence_sessions:
  - c408f239-869b-41a0-a40b-14afbea9fdbb
---

## Proposed Change

In the `session_end` hook handler (`server/src/routes/hooks.ts`), after writing the session_end event, copy the upstream Claude Code JSONL to AngelEye's own raw-transcript archive:

- Source: `~/.claude/projects/<encoded-project-dir>/<session_id>.jsonl`
- Destination: `~/.claude/angeleye/raw-transcripts/<session_id>.jsonl`

The copy should be non-blocking (fire-and-forget with error logging). If the source file doesn't exist or the copy fails, log a warning and continue — don't fail the hook response.

Also expose this via the existing `/api/sessions/:id/raw` endpoint: check `raw-transcripts/` first before falling back to the archive, so callers always get the richest available data.

## Why

Claude Code purges upstream JSONL files within roughly 24 hours of session end. The upstream JSONL contains data that AngelEye's hook-based events layer never captures:

- Full assistant response text
- Thinking blocks (`type: "thinking"` in assistant content)
- Attachment entries (60+ per session — file context Claude Code injects)
- `file-history-snapshot`, `permission-mode`, `last-prompt` entries

Once purged, this data is gone forever. The enrichment loop can only classify from the thin events layer, missing the reasoning and context that was present at session time.

AngelEye's hooks already fire at `session_end` with `session_id` and `project_dir`. The upstream file is still on disk at that moment. A single file copy at this point would preserve everything.

## Evidence

| Session                                | Observation                                                                                                                                                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c408f239-869b-41a0-a40b-14afbea9fdbb` | Upstream JSONL survived (538 lines). Contains 4 assistant turns with thinking blocks, 60 attachment entries. None of this exists in the events layer. Most sessions in the corpus have already been purged and this data is lost. |

## Acceptance Criteria

- [ ] On `session_end` hook, AngelEye copies `~/.claude/projects/<encoded>/<session_id>.jsonl` to `~/.claude/angeleye/raw-transcripts/<session_id>.jsonl`
- [ ] Copy failure is non-fatal — logs a warning, hook still returns 200
- [ ] `/api/sessions/:id/raw` checks `raw-transcripts/` directory first, before falling back to archive
- [ ] `source` field in the raw response is `"upstream-backup"` when served from the new location, to distinguish it from live upstream files
- [ ] A one-off backfill script or manual pass can copy any upstream files that still exist for sessions already in the registry
