---
name: angeleye-dreaming
description: Reflection pass over AngelEye's own enrichment history and observations. Reads recent enrichments and observations, finds patterns the live loop missed, surfaces taxonomy gaps and classifier inconsistencies, and writes requirement docs when patterns repeat. Inspired by Anthropic's "Dreaming" feature for self-improving agents. Use when you want AngelEye to reflect on its own classification work and propose improvements.
---

# AngelEye Dreaming

## What this is

A reflection pass over AngelEye's own classification history. The live enrichment loop classifies one session at a time and forgets. This skill steps back and reads the _aggregate_ — what the loop has been doing, what patterns repeat, where it's been inconsistent, and what should change.

Inspired by Anthropic's [Dreaming](https://www.roic.ai/news/anthropic-unveils-dreaming-feature-to-help-ai-agents-self-improve-05-06-2026) (May 2026): agents review past sessions, prune outdated data, reinforce successful strategies. This skill is the AngelEye equivalent.

## Hard boundary

**This skill writes requirement docs and observations. It does not modify code, taxonomy files, or implement requirement docs itself.** The output of dreaming is _proposals_ — humans (or a separate developer-agent skill) ship the changes.

Never modify: `shared/src/`, `server/src/`, tests, the live taxonomy, existing enrichments.

## Arguments

```
/angeleye-dreaming [window_days]
```

- `window_days` — how far back to reflect (default: 7). Shorter windows (1-2 days) for faster rolling reflection, longer windows (30 days) for periodic deep audits.

## Step 1 — Pull aggregate data

Read three sources for the time window:

```bash
# Enrichment history (every classification ever made in window)
curl -s "http://100.82.235.39:5051/api/enrichments?since_days=N"  # if endpoint exists
# Or read directly from the enrichments log:
tail -n 5000 ~/.claude/angeleye/enrichments.jsonl

# Observations log
cat docs/intelligence/observations.jsonl

# Open requirement docs (don't duplicate)
ls docs/requirements/*.md | grep -v resolved
```

If the enrichments-since endpoint doesn't exist, fall back to scanning the log file directly. Look for entries with `enriched_at` within the window.

## Step 2 — Look for patterns

For each pattern type, scan the data:

### A. Heuristic-vs-LLM disagreements

Read the registry entries the loop classified. Where the heuristic and the LLM-set subtype differ:

- If the same disagreement happens 3+ times for the same heuristic value → **the heuristic is broken**. Write/update a `classifier` requirement doc.
- If disagreement is sporadic → not enough signal yet, just log an observation.

Example: heuristic says `orientation.exploration`, LLM says `build.bmad_orchestrator` for sessions starting with `/appydave:bmad-story-lifecycle`. We saw this happen once. If it happens 3+ times, dreaming should auto-promote it.

### B. Heuristic values not in taxonomy

Scan registry for `subtype_heuristic` values. Compare against the taxonomy entries in `references/taxonomy.md`. Any heuristic value missing from the taxonomy is a `taxonomy_gap` — write a `classifier` doc proposing to either add the entry or remap the heuristic.

### C. Tool patterns repeating across sessions

Scan tool counts across enriched sessions. Patterns:

- A new MCP tool class appearing for the first time → log `new_tool_class` observation
- A specific tool firing in volume across many sessions (e.g. `mcp__playwright__browser_*`, `CronCreate`, `ScheduleWakeup`) → consider proposing a `has_X` predicate via a `schema` requirement doc

### D. Project-level shifts

- A new project appearing in the corpus → log `new_project` observation
- A project's session shape changing (e.g. session counts spiking, or scale distribution shifting from light to marathon) → log `cross_session_pattern` observation

### E. Notes contradictions

Scan enrichment notes across sessions of the same subtype. If notes describe wildly different things → the subtype might be too broad. Log a `methodology_insight` observation suggesting the subtype could be split.

### F. Confidence drift

For each subtype, compute average confidence over the window. If a subtype that used to score 0.85+ now averages 0.55 → either the LLM is hedging more, or the pattern is changing. Worth an observation.

### G. Existing observations that have repeated 3+ times

Read `observations.jsonl`. If the same `category` + similar description has been logged 3+ times for the same root cause → auto-promote to a requirement doc.

## Step 3 — Decide what's actionable

Each pattern is one of:

| Action                             | When                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| Write a new requirement doc        | Pattern repeated 3+ times, code change is clear, scope is small |
| Update an existing requirement doc | Same root cause as an open doc — append evidence to it          |
| Log a fresh observation            | Pattern is new, not yet repeated — track for next dreaming pass |
| Skip                               | One-off, no clear action, no value in logging                   |

**Don't be greedy.** Most patterns won't repeat. If you write 10 requirement docs per pass, you're noise-generating. Aim for 0-3 high-quality docs per weekly pass, plus 5-15 observations.

## Step 4 — Write outputs

For each new requirement doc, follow `docs/requirements/format.md`. Path: `docs/requirements/<YYYY-MM-DD>-<slug>.md`. Lead with the proposed change, then evidence, then acceptance criteria.

For observations, append one JSON line to `docs/intelligence/observations.jsonl` with the appropriate category from the enrichment loop categories list.

For each existing requirement doc you're appending evidence to, edit the `evidence_sessions:` frontmatter and the Evidence table.

## Step 5 — Report

End the pass with:

| Metric                   | Count |
| ------------------------ | ----- |
| Days reflected           | N     |
| Enrichments scanned      | N     |
| Patterns surfaced        | N     |
| Requirement docs written | N     |
| Requirement docs updated | N     |
| Observations logged      | N     |

Then a short narrative: what's the loop getting right, what's it getting wrong, what should change soonest.

## When to use what model

- **Sonnet 4.6** is fine for routine weekly reflection — pattern matching, scanning aggregates
- **Opus 4.7** is worth it for monthly deep reflection or when the corpus has shifted significantly (new projects, new tools, new workflows). Opus catches subtler cross-pattern reasoning the routine pass might miss.

## How this fits the broader self-learning architecture

This skill is **Layer 2** of a four-layer self-learning system. See `docs/planning/angeleye-self-learning-system.md` for the full architecture.

- Layer 1: nightly enrichment routine (Sonnet, automated)
- **Layer 2: weekly dreaming routine (this skill, Opus, eventually automated)**
- Layer 3: multi-model routing (Sonnet first, Opus on low-confidence)
- Layer 4: human-feedback loop (UI corrections become few-shot examples)

## Future automation

Once trust is established, this skill can be invoked by a Claude Code routine on a weekly cron schedule (e.g. Sundays at midnight). Until then, invoke manually via `/angeleye-dreaming` and review outputs before committing.

## References

- Enrichment loop skill: `.claude/skills/angeleye-enrichment-loop/`
- Taxonomy: `.claude/skills/angeleye-enrichment-loop/references/taxonomy.md`
- Requirement format: `docs/requirements/format.md`
- Observations log: `docs/intelligence/observations.jsonl`
- Self-learning architecture: `docs/planning/angeleye-self-learning-system.md`
