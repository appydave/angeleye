---
name: angeleye-retrieve
description: Search the AngelEye session corpus by project, date range, and keywords. Returns ranked sessions with prompt excerpts, enrichment notes, and citations. Use when the user asks "what was the conversation about X" or "find sessions where I worked on Y" — anything that needs retrieval over historic conversation data, especially across multiple projects or wide time spans.
---

# AngelEye Retrieve

Search the AngelEye session corpus to find past conversations by project + date + keyword. Returns ranked sessions with citation-grade evidence (session_id, started_at, key prompts, enrichment notes).

This skill calls the server-side `/api/search` endpoint — single network call, sub-second response. The earlier client-side paging implementation was retired when the API gained search support (commit `2c1a438` on 2026-05-07).

## Hard boundary

**Read-only.** Never modify session data, enrichments, registry, or any code. If the search surfaces a structural retrieval gap (e.g. "the keyword I want is in tool calls, not prompts, and tool content isn't searchable"), append a one-line observation to `docs/intelligence/observations.jsonl` with `category: retrieval_gap`. Don't change indexers or schemas — write a requirement doc if a code change is needed.

## Host configuration — Tailscale by default

**Default: `http://100.82.235.39:5051`** (Tailscale IP for M4 Mini, where AngelEye's server lives).

Use the Tailscale IP from any machine on the Tailnet — it works from Roamy, M4 Mini hitting its own address, anywhere. `localhost:5051` is only correct when this skill is invoked **on the M4 Mini itself** as a marginal latency optimisation. When in doubt, use Tailscale.

This is one of three AngelEye skills with the dual-mode (Tailscale-vs-localhost) concern:

| Skill                      | Current default host           | Notes                                       |
| -------------------------- | ------------------------------ | ------------------------------------------- |
| `angeleye-retrieve`        | Tailscale `100.82.235.39:5051` | This skill                                  |
| `angeleye-enrichment-loop` | `localhost:5051`               | Designed for M4 Mini-local invocation today |
| `angeleye-dreaming`        | (uses retrieve internally)     | Inherits whichever host its callees use     |

When the canonical invocation site shifts entirely to M4 Mini, all three should switch to `localhost` together. Until then, prefer Tailscale for portability.

## Arguments

```
/angeleye-retrieve [query] [project=...] [project_match=exact|glob|regex] [since=...] [until=...] [limit=10] [fields=...] [subtype=...] [subtype_prefix=...]
```

- `query` — case-insensitive regex. Multiple keywords joined with `|` (e.g. `harness|rigid|flexible`). URL-encode special characters (`|` → `%7C`, space → `%20`).
- `project` — filter on `project` field. Default match is exact; pass `project_match=glob` (`*` and `?`) or `project_match=regex` for fuzzy.
- `since` / `until` — ISO date prefixes (e.g. `2026-04-01`). Lex-compared against `started_at`, so `2026-04` works as a "month" filter.
- `limit` — max sessions returned (default 10, max 100).
- `fields` — comma list of fields to search. Default: `notes,first_prompt,name,subtype,trigger_command`. Add `subtype_heuristic` to catch heuristic-only matches. `notes` reads the enrichment file per filtered session — opt out for speed if scanning a large unfiltered set.
- `subtype` / `subtype_prefix` — narrow by `session_subtype` exact or prefix match.
- `session_class` — filter to a specific class: `dialog` (conversations), `agent_run` (autonomous campaigns like Ralphy/BMAD), `machine_signal` (probes/heartbeats), or `subagent_leg`. By default the API filters to user-driven only (`dialog + agent_run`) — passing `session_class=` overrides that.
- `include_classes` — CSV; ADDS to the default user-driven set. e.g. `?include_classes=machine_signal,subagent_leg` returns everything.
- Implicit defaults: skips `is_junk: true` sessions, only returns `session_kind: 'main'`, only returns user-driven `session_class` (`dialog + agent_run`). Override individually as above.

Examples:

- `/angeleye-retrieve "harness|rigid|flexible" project=appy* project_match=glob since=2026-04-01`
- `/angeleye-retrieve "ralphy"` — defaults to user-driven only
- `/angeleye-retrieve "BMAD" since=2026-04-01 until=2026-04-30 subtype_prefix=build.bmad_`
- `/angeleye-retrieve "appyctrl" session_class=machine_signal` — investigate harness signals
- `/angeleye-retrieve "ralphy" session_class=agent_run` — only autonomous campaigns, no chat-about-Ralphy noise

## Step 1 — Single search call

Build the URL with all filters; one `curl`. URL-encode the query.

```bash
curl -sS 'http://100.82.235.39:5051/api/search?q=<URL-encoded-regex>&fields=<comma-list>&limit=<N>&since=<date>&until=<date>&project=<value>&project_match=<mode>&kind=main'
```

Response shape:

```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "session_id": "...",
        "score": 12,
        "matched_fields": ["notes", "first_prompt"],
        "session": {
          /* full RegistryEntry */
        },
        "enrichment_note": "<full notes>",
        "first_prompt_excerpt": "<first 250 chars of first_real_prompt>"
      }
    ],
    "total": 76,
    "scanned": 1170,
    "fields": ["notes", "first_prompt", "name", "subtype", "trigger_command"]
  }
}
```

If `data.total === 0`: stop and report. Common causes:

- Misspelled project name (the user said "api-sentinel" but it's `appysentinal`)
- Keyword exists only in tool calls (Bash commands, file reads), which the API doesn't index
- Query too restrictive (try widening the date range or removing the project filter)

> **Note — `appysentinal` → `appysentinel` rename (2026-06-11):** the AppySentinel project's folder/repo was corrected from the misspelled `appysentinal` to `appysentinel` (now at `apps/appysentinel`). Sessions recorded **before** the rename remain tagged `appysentinal` in the registry; sessions after it are tagged `appysentinel`. To retrieve the project's full history, **search both names**. The historical examples below intentionally retain the `appysentinal` tag — that is the real recorded project name for those sessions, not a typo to fix.

## Step 2 — Optional deep-dive (only when score-ranking is unclear)

For the top 1–3 results, fetch `user_prompt` events to surface the exact phrasing that matched the regex:

```bash
curl -sS "http://100.82.235.39:5051/api/sessions/<session_id>/events?limit=200"
```

Filter `event === 'user_prompt'` (the prompt text lives at top-level `prompt` field — not nested in `body` or `data`). Find prompts whose text matches the regex. Useful when the user wants to see exact prior wording.

Skip Step 2 if the `enrichment_note` from Step 1 already gives enough context.

## Step 3 — Output format

```markdown
## Found N matching sessions for "<query>"

(Server scanned <scanned> sessions after filters; top <limit> shown by score.)

| Date       | Project      | Subtype        | Score | Matched            | Session  |
| ---------- | ------------ | -------------- | ----- | ------------------ | -------- |
| 2026-04-28 | appysentinal | build.refactor | 20    | notes,first_prompt | 8f2325dd |
| ...        | ...          | ...            | ...   | ...                | ...      |

### Top sessions

#### 2026-04-28 `8f2325dd-426e-4674-a0f1-4a606e89c1f1` — appysentinal — build.refactor

**Enrichment note:** Major architecture refactor for appysentinal — 506 events, reading architecture-refactor-v2.md, tagging strategy.

**Excerpt:** Handover prompt: Read /Users/davidcruwys/dev/ad/apps/appysentinal/docs/architecture-refactor-v2.md in full ...

(Optional, from Step 2 — only when prompts add value beyond the note)

- P1 (01:16): "<prompt text matching regex>"
- P3 (02:04): "<prompt text matching regex>"
```

Trim excerpts to ~250 chars and replace newlines with spaces. Always include the full session_id (in backticks) so it's copyable.

## Step 4 — Spot retrieval gaps

If the search returned nothing, returned the wrong sessions, or the user follow-ups suggest the answer was elsewhere:

| Symptom                                               | Likely cause                                                              | Action                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Zero results despite known conversation               | Wrong project name (e.g. searched `api-sentinel` but it's `appysentinal`) | Hit `/api/sessions?limit=200` and group by `project` to see canonical names |
| Keywords about tool actions (file edit, bash command) | Tool content isn't indexed by the search                                  | Log observation, suggest fetching the raw transcript instead                |
| Right sessions, unhelpful excerpts                    | Enrichment notes thin or generic                                          | Suggest re-running enrichment on those sessions                             |
| Hits mostly in handover-paste prompts                 | Search matched the paste, not the working prompts                         | Note as future-improvement — filter handover language from scoring          |

When you spot a gap, append one line to `docs/intelligence/observations.jsonl`:

```json
{
  "observed_at": "<ISO>",
  "session_id": "<id-of-gap-session-if-applicable>",
  "category": "retrieval_gap",
  "description": "<plain English — what couldn't be retrieved and why>"
}
```

Don't change code. Notable patterns of gaps over time become a requirement doc input.

## Reference

- **API endpoints**: `/api/search` (this skill), `/api/sessions/:id/events`, `/api/sessions/:id/enrichments`
- **Spec for the search endpoint**: `docs/requirements/2026-05-07-api-search-and-time-filters.md`
- **Pagination on /api/sessions** (if you ever need it): `data.cursor` (next), `data.hasMore` (bool)
- **Session shape**: 50+ fields including `session_kind`, `is_junk`, `enrichment_version`, `subtype_heuristic`, `session_subtype`, `name`, `first_real_prompt`, `trigger_command`, `project`, `project_dir`, `started_at`
