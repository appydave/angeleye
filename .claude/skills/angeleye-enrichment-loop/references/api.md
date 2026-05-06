# AngelEye HTTP API — Enrichment Loop Reference

Base URL: `http://localhost:5051`

## Session listing

```
GET /api/sessions?limit=N&after=cursor
```

Response:

```json
{
  "status": "ok",
  "data": {
    "sessions": [RegistryEntry],
    "cursor": "ses-xxx",
    "hasMore": true,
    "total": 1829
  }
}
```

Key fields on each session: `session_id`, `project`, `session_kind`, `is_junk`, `session_subtype`, `subtype_heuristic`, `opening_style`, `trigger_command`, `session_scale`, `enrichment_version`, `enriched_at`.

Filter for enrichment candidates:

- `session_kind === 'main'` (skip `'subagent'`, `'subprocess'`)
- `is_junk !== true`
- `enrichment_version < target_version` (or undefined/null)

## Session events

```
GET /api/sessions/:id/events
```

Response:

```json
{
  "status": "ok",
  "data": {
    "events": [AngelEyeEvent],
    "count": 42
  }
}
```

Key event types: `user_prompt` (prompt text in `.prompt`), `tool_use` (tool name in `.tool`), `stop` (reason in `.reason`), `session_start`, `session_end`.

Skip: `progress`, `pre_tool_use` — these are high-volume noise entries.

## Enrichment history (sidecar)

```
GET /api/sessions/:id/enrichments
```

Response:

```json
{
  "status": "ok",
  "data": {
    "history": [EnrichmentPass],
    "count": 2
  }
}
```

`EnrichmentPass` shape:

```json
{
  "version": 1,
  "enriched_at": "2026-05-06T12:00:00.000Z",
  "model": "claude-opus-4-7",
  "changes": { "session_subtype": "build.shipped", "session_tags": [...] },
  "notes": "..."
}
```

If `history` is non-empty and `history[0].version >= target_version`, skip this session.

## Raw transcript

```
GET /api/sessions/:id/raw?limit=N
```

Returns the raw Claude Code JSONL lines for a session. Default limit 200, max 2000.

Response:

```json
{
  "status": "ok",
  "data": {
    "lines": [{ "type": "user", "message": {...}, ... }],
    "count": 100,
    "total": 566,
    "source": "upstream"
  }
}
```

Returns 404 if the upstream JSONL was purged by Claude Code (file no longer exists at `~/.claude/projects/`).

Key `type` values in raw lines:

| type           | What it contains                                            |
| -------------- | ----------------------------------------------------------- |
| `user`         | Human message — full text, tool results                     |
| `assistant`    | Model response — text, thinking blocks, tool calls          |
| `summary`      | Compaction summary — session resumed from compacted context |
| `custom-title` | User renamed session via `/rename`                          |
| `agent-name`   | Agent-set session name                                      |

## Write enrichment pass

```
POST /api/sessions/:id/enrichments
Content-Type: application/json
```

Body (all fields required except `notes`):

```json
{
  "version": 1,
  "enriched_at": "2026-05-06T12:00:00.000Z",
  "model": "claude-opus-4-7",
  "changes": {
    "session_tags": [{ "tag": "build.shipped", "confidence": 0.88, "source": "llm" }],
    "session_subtype": "build.shipped"
  },
  "notes": "Optional explanation of the judgment."
}
```

`changes` must only contain enrichment fields: `session_tags`, `session_subtype`. Never include identity fields (`session_id`, `project`, `status`, `source`, `started_at`).

Response: `{ "status": "ok", "data": { "written": true } }`
Returns 404 if session not found, 400 if required fields missing.
