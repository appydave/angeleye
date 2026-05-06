---
name: angeleye-enrichment-loop
description: Run LLM enrichment passes over AngelEye session data. Reads sessions and events via the HTTP API, classifies session subtypes and extracts insights, writes results back via the enrichment endpoints. Writes requirement docs when it spots code-change opportunities — never modifies code directly. Use when asked to enrich, classify, or run a batch pass over AngelEye sessions.
---

# AngelEye Enrichment Loop

## Hard boundary

**Read and enrich data only.** When you spot a code-change opportunity (new classifier rule, schema field, predicate, UI gap, ingestion problem), write a requirement doc to `docs/requirements/YYYY-MM-DD-slug.md` using the format in `docs/requirements/format.md`. Stop there.

Never modify: `shared/src/`, `server/src/services/`, tests, skills, or any code file.

## Arguments

```
/angeleye-enrichment-loop [batch_size] [version] [raw_mode]
```

- `batch_size` — sessions per pass (default: 20)
- `version` — enrichment version number to stamp (default: 1)
- `raw_mode` — when to read the raw Claude Code JSONL (default: `fallback`)
  - `off` — events layer only, never fetch raw
  - `fallback` — fetch raw only when events are thin (< 15 filtered events) or confidence would be low
  - `always` — fetch raw for every session in the batch (slower, best for data quality audit)

Examples:

- `/angeleye-enrichment-loop 20 1` — standard pass, raw fallback on thin sessions
- `/angeleye-enrichment-loop 5 1 always` — full raw audit pass
- `/angeleye-enrichment-loop 50 1 off` — fast pass, events only

## Step 1 — Fetch batch

Fetch unenriched `main` sessions. Skip subagents, subprocesses, and junk.

```bash
curl -s "http://localhost:5051/api/sessions?limit=200" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const { data } = JSON.parse(Buffer.concat(chunks));
  const VERSION = parseInt(process.env.VERSION || '1');
  const BATCH = parseInt(process.env.BATCH || '20');
  const eligible = (data.sessions || []).filter(s =>
    s.session_kind === 'main' &&
    !s.is_junk &&
    (s.enrichment_version === undefined || s.enrichment_version === null || s.enrichment_version < VERSION)
  ).slice(0, BATCH);
  console.log(JSON.stringify(eligible.map(s => ({
    id: s.session_id,
    project: s.project,
    subtype: s.session_subtype,
    heuristic: s.subtype_heuristic,
    opening: s.opening_style,
    trigger: s.trigger_command,
    scale: s.session_scale,
    enrichment_version: s.enrichment_version
  })), null, 2));
});
" BATCH=20 VERSION=1
```

If the batch is empty, the pass is complete — report the count and stop.

## Step 2 — Read events per session

For each session in the batch, read its events and prior enrichment history:

```bash
curl -s "http://localhost:5051/api/sessions/SESSION_ID/events"
curl -s "http://localhost:5051/api/sessions/SESSION_ID/enrichments"
```

Focus on: `user_prompt` events (especially prompts 1–5), `tool_use` pattern, `stop` events. Skip `progress` and `pre_tool_use` — they are noise.

If `enrichments.history` is non-empty and `history[0].version >= VERSION`, skip this session.

## Step 2b — Read raw transcript (conditional)

Fetch raw only when the mode warrants it:

- **`raw_mode: always`** — fetch for every session
- **`raw_mode: fallback`** — fetch when filtered event count < 15, or when the session has no `user_prompt` events, or when the opening is ambiguous and you'd otherwise fall back to a low-confidence subtype

```bash
curl -s "http://localhost:5051/api/sessions/SESSION_ID/raw?limit=100"
```

Raw lines are the unprocessed Claude Code JSONL — each line is a JSON object with a `type` field. Useful types to look for:

| Type                          | What it tells you                                                          |
| ----------------------------- | -------------------------------------------------------------------------- |
| `user`                        | Full human message text — what the person actually typed                   |
| `assistant`                   | Full model response including `thinking` blocks (where present)            |
| `summary`                     | Compaction summary — signals this session resumed from a compacted context |
| `custom-title` / `agent-name` | User renamed the session via `/rename`                                     |

When reading raw lines: look at the first 10–20 lines for session opening context, then spot-check the last 10 for closing shape. The middle is mostly streamed assistant output — skip unless you need to verify a specific claim.

**Data quality checks to run when raw is available:**

1. **Prompt extraction fidelity** — does the first `user_prompt` event match the actual `user` message in the raw JSONL? If not, the transform missed or truncated something → `category: ingestion` requirement doc.
2. **Thinking blocks present?** — raw `assistant` entries with `type: thinking` are stripped by the events layer. If the session has thinking, the classification may benefit from it.
3. **Compaction resume** — a `summary` entry at position 0–2 means this session started from a compacted context. The `is_compaction_resume` field should be `true` on the registry entry. If it isn't, that's an ingestion gap.
4. **Tool call arguments** — raw `assistant` tool_use blocks include full input JSON. If the heuristic got `trigger_command` wrong, the raw tool call arguments will show the actual command.

## Step 3 — Classify

For each session produce a judgment:

- **Primary subtype** — best-fit tag from the taxonomy (see `references/taxonomy.md`)
- **Confidence** — 0.0–1.0
- **Up to 2 secondary tags** if genuinely ambiguous
- **notes** — 1–2 sentences referencing specific events

**Rules:**

- Weight prompts 2–5 over prompt 1. Opening prompts are often context loads, "yes", or handover pastes.
- `paste_handover` + immediate execution → look at what was decided, not what the agent did next.
- Fallbacks (`build.feature`, `orientation.quick_check`, `knowledge.general`) are valid only at confidence ≤ 0.55.
- If a subagent session slips through the batch filter, skip it and note it — do not classify it.

## Step 4 — Write enrichment pass

```bash
curl -s -X POST "http://localhost:5051/api/sessions/SESSION_ID/enrichments" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "enriched_at": "2026-05-06T12:00:00.000Z",
    "model": "claude-opus-4-7",
    "changes": {
      "session_tags": [{"tag": "build.shipped", "confidence": 0.88, "source": "llm"}],
      "session_subtype": "build.shipped"
    },
    "notes": "Clear feature shipped with git outcome. Prompts 2-4 confirm AC validation."
  }'
```

`changes` should contain only: `session_tags`, `session_subtype`. Do not include identity fields (`session_id`, `project_dir`, `status`, etc.).

## Step 5 — Spot code-change opportunities

After the batch, review observations for patterns that require code changes:

- Missing subtype in the taxonomy → `category: classifier`
- Heuristic producing wrong results for a clear pattern → `category: classifier`
- Events failing to parse or appearing malformed → `category: ingestion`
- A UI field that would aid classification but doesn't exist → `category: ui`
- A schema field needed that isn't on RegistryEntry → `category: schema`

Write a requirement doc for each opportunity found. See `docs/requirements/format.md` for the schema and `docs/requirements/_template.md` to copy.

## Step 6 — Report

End the pass with a summary:

| Metric                                 | Count |
| -------------------------------------- | ----- |
| Sessions fetched                       | N     |
| Sessions enriched                      | N     |
| Sessions skipped (already done)        | N     |
| Sessions skipped (subagent/subprocess) | N     |
| Raw transcript fetched                 | N     |
| Data quality issues found              | N     |
| Requirement docs written               | N     |

List any requirement docs written with their titles and categories.

If raw was fetched, summarise any data quality findings: prompt extraction gaps, missing `is_compaction_resume` flags, mismatched `trigger_command`, thinking blocks present.

## References

- **API endpoints + shapes** → `references/api.md`
- **Subtype taxonomy + classification guidance** → `references/taxonomy.md`
- **Requirement doc format** → `docs/requirements/format.md`
