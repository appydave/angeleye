---
name: angeleye-retrieve
description: Search the AngelEye session corpus by project, date range, and keywords. Returns ranked sessions with prompt excerpts, enrichment notes, and citations. Use when the user asks "what was the conversation about X" or "find sessions where I worked on Y" — anything that needs retrieval over historic conversation data, especially across multiple projects or wide time spans.
---

# AngelEye Retrieve

Search the AngelEye session corpus to find past conversations by project + date + keyword. Returns ranked sessions with citation-grade evidence (session_id, started_at, key prompts, enrichment notes).

## Hard boundary

**Read-only.** Never modify session data, enrichments, registry, or any code. If the search surfaces a structural retrieval gap (e.g. "the keyword I want is in tool calls, not prompts, and tool content isn't searchable"), append a one-line observation to `docs/intelligence/observations.jsonl` with `category: retrieval_gap`. Don't change indexers or schemas — write a requirement doc if a code change is needed.

## Arguments

```
/angeleye-retrieve [query] [project=...] [since=...] [until=...] [limit=10]
```

- `query` — keyword(s) to search for. Treated as a case-insensitive regex. Multiple keywords joined with `|` (e.g. `harness|rigid|flexible`).
- `project` — optional. Regex on `project` and `project_dir`. Examples: `appystack`, `appy(stack|sentinal)`, `bmad`. Leave empty to search all projects.
- `since` / `until` — optional ISO date prefixes (e.g. `2026-04-01`). Compared lexically against `started_at`, so `2026-04` works as a "month" filter.
- `limit` — max sessions returned (default 10).
- Implicit defaults: skips `is_junk: true` sessions and `session_kind: subagent`/`subprocess`. To override, mention `include_junk` or `kind=all` in the query and the skill will adjust.

Examples:

- `/angeleye-retrieve "harness|rigid|flexible" project=appy(stack|sentinal) since=2026-04-01`
- `/angeleye-retrieve "ralphy|ralph wiggum"`
- `/angeleye-retrieve "BMAD orchestrator" since=2026-04-01 until=2026-04-30`

## Step 1 — Page the corpus and pre-filter

The API caps at 200 per page; pagination uses `data.cursor` + `data.hasMore`. Pre-filter while paging to avoid holding the full corpus in memory.

Default host: `http://localhost:5051` (when running on the M4 Mini where AngelEye lives). Cross-machine fallback: `http://100.82.235.39:5051` (Tailscale).

```bash
node -e "
async function fetchAll() {
  const matches = [];
  let cursor = null;
  while (true) {
    const url = cursor
      ? 'http://localhost:5051/api/sessions?limit=200&after=' + encodeURIComponent(cursor)
      : 'http://localhost:5051/api/sessions?limit=200';
    const j = await (await fetch(url)).json();
    const sessions = j.data?.sessions || [];
    if (sessions.length === 0) break;
    for (const s of sessions) {
      if (PROJECT_RE && !PROJECT_RE.test(s.project || '') && !PROJECT_RE.test(s.project_dir || '')) continue;
      if (!INCLUDE_JUNK && s.is_junk) continue;
      if (KIND_FILTER !== 'all' && s.session_kind !== KIND_FILTER) continue;
      if (SINCE && (s.started_at || '') < SINCE) continue;
      if (UNTIL && (s.started_at || '') > UNTIL) continue;
      matches.push(s);
    }
    if (!j.data?.hasMore) break;
    cursor = j.data?.cursor;
    if (!cursor) break;
  }
  return matches;
}
"
```

If the pre-filter set is empty: stop and report. Common cause is a misspelt project — list all projects first via a count-by-project pass before guessing.

## Step 2 — Score by keyword match

For each pre-filtered session:

1. Read events: `curl -s "http://localhost:5051/api/sessions/<id>/events?limit=200"` — filter `event === 'user_prompt'`. The prompt text lives at top-level `prompt` field (not nested in `body` or `data`).
2. Read enrichment: `curl -s "http://localhost:5051/api/sessions/<id>/enrichments"` — take `data.history[0].notes` if present.
3. Score = total regex hits across:
   - All `user_prompt` event prompts
   - The enrichment note (if any)
   - `name`, `first_real_prompt`, `session_subtype`, `subtype_heuristic`, `trigger_command`
4. Rank by score descending; tie-break on most recent `started_at`.

Skip score=0. Take the top `limit`.

## Step 3 — Output format

Print a summary table with citations, then per-session detail for the top 3:

```markdown
## Found N matching sessions for "<query>"

(Search ran across <total> pre-filtered sessions; <pre_filter_count> matched filters before keyword scoring.)

| Date       | Project      | Subtype        | Hits | Session  |
| ---------- | ------------ | -------------- | ---- | -------- |
| 2026-04-28 | appysentinal | build.refactor | 20   | 8f2325dd |
| ...        | ...          | ...            | ...  | ...      |

### Top sessions

#### 2026-04-28 `8f2325dd-426e-4674-a0f1-4a606e89c1f1` — appysentinal — build.refactor

**Enrichment note:** Major architecture refactor for appysentinal — 506 events, reading architecture-refactor-v2.md, tagging strategy.

**Key prompts (with hits):**

- P1 (01:16): "Handover prompt: Read /Users/davidcruwys/dev/ad/apps/appysentinal/docs/architecture-refactor-v2.md in full ..."
- P3 (02:04): "When I read 'What is AppySentinel?', I love it from my perspective. But I can't go to a client with this. Because it's very technology-oriented ..."
```

Trim each prompt excerpt to ~250 chars, replace newlines with spaces. Show only prompts that actually matched the regex; if a session ranked high purely on the enrichment note or name, surface that explicitly.

## Step 4 — Spot retrieval gaps

If the search returned nothing, returned the wrong sessions, or the user follow-ups suggest the answer was elsewhere:

| Symptom                                                    | Likely cause                                                                  | Action                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| Zero results despite known conversation                    | Wrong project name (e.g. you searched `api-sentinel` but it's `appysentinal`) | Run a project-list scan, retry                          |
| Keywords are about a tool action (file edit, bash command) | Tool content isn't surfaced in prompts or notes                               | Log observation, suggest broader scope (raw transcript) |
| Right sessions found but excerpts unhelpful                | Enrichment notes thin or generic                                              | Suggest re-running enrichment on those sessions         |
| Hits mostly in handover-paste prompts                      | Search matched the paste, not the working prompts                             | Filter handover language out of scoring (TODO)          |

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

## Future API improvements

This skill works client-side because the API doesn't yet support search-friendly filters. Once `/api/sessions` gains `?since=&until=&project=&kind=&subtype=` filters and a new `/api/search?q=` endpoint is shipped, this skill should be updated to call them — collapses 13+ network calls into 1.

Tracking doc: `docs/requirements/2026-05-07-api-search-and-time-filters.md`.

## Reference

- API endpoints + shapes — same set as `angeleye-enrichment-loop`'s `references/api.md`
- Pagination: `data.cursor` (next), `data.hasMore` (bool)
- Session shape: 50+ fields including `session_kind`, `is_junk`, `enrichment_version`, `subtype_heuristic`, `session_subtype`, `name`, `first_real_prompt`, `trigger_command`, `project`, `project_dir`, `started_at`
