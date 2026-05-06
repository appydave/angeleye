# Handover — AngelEye Enrichment Loop (2026-05-06)

## North Star

AngelEye becomes a self-improving system that gets continuously sharper at understanding past Claude Code sessions. Every enrichment pass costs less and reveals more than the one before. Three properties:

1. **Self-improving** — passes leave a permanent audit trail; recurring LLM judgments get promoted to deterministic code so the next pass is cheaper.
2. **Cheap to run** — runs from any machine via Tailscale, billed against whichever Claude account makes sense.
3. **Memory, not amnesia** — old judgments aren't overwritten; pass v1 vs v3 is comparable.

## Hard boundary

**The enrichment loop reads and enriches data. It does not change code.**

When the loop spots a code-change opportunity (new classifier rule, new schema field, new predicate, UI gap, ingestion drift), it writes a structured requirement document. A separate developer-agent session (on the primary machine) picks those up and does the actual code work.

The loop must not modify: `shared/src/angeleye.ts`, `server/src/services/`, any SKILL.md, any tests, any code commits. Its write surface is API-only: tag writes and sidecar/history writes. Code changes are out of scope.

## What's already in place (verified)

- **`GET /api/sessions/:id/events`** at `server/src/routes/sessions.ts:47` — returns the parsed event stream for a session, with live → archive fallback in `getSessionEvents` (`sessions.service.ts:18`). Tests at `sessions.test.ts:220`. Cross-machine clients can read events over HTTP today.
- **`POST /api/registry/llm-tags`** at `server/src/routes/sessions.ts:64` — bulk write LLM tags. Goes through the serialised registry write queue.
- **`POST /api/registry/session-kind`** at `sessions.ts:103` — bulk write session_kind classifications.
- **`ANGELEYE_API` env var convention** — every audit script in `scripts/audits/` reads `process.env.ANGELEYE_API ?? 'http://localhost:5051'`. The new skill follows the same pattern; cross-machine is `ANGELEYE_API=http://<tailscale-name>:5051`.
- **Three-field subtype model** — `subtype_heuristic` (deterministic), `session_tags` (LLM, source of truth when present), `session_subtype` (derived). Source of truth at `shared/src/angeleye.ts:208`.

## What's actually missing (the real Stream 1)

- **Audit fields on `RegistryEntry`**: `enrichment_version` and `enriched_at`. Required for L3 (refresh) selection — "anything older than the current technique generation gets re-evaluated".
- **Sidecar enrichment files** at `~/.claude/angeleye/enrichments/<session_id>.json`. Append-only `passes[]` array per session — model, skill commit, classifier commit, reasoning, signals weighted, tags assigned, diff from previous pass. Without this, every L1 pass overwrites the previous judgment and L2/L3 are impossible.
- **Sidecar HTTP endpoints**: `GET /api/sessions/:id/enrichment-history` (read) and `POST /api/sessions/:id/enrichment-pass` (append). Server is the only writer.
- **Append-only `enrichments.jsonl` log** at `~/.claude/angeleye/enrichments.jsonl`. One line per pass per session; cross-session aggregation surface ("show me everything machine-b enriched yesterday").
- **The new skill itself** at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/`. Replaces (does not extend) the `enrich-subtypes` skill. Owns L1/L2/L3 modes, methodology layer, capture-lessons step, and the hard-boundary above.

## Documents to read first

- **`docs/planning/enrichment-loop-design.md`** — full architectural design (three nested loops L1/L2/L3, multi-source data model, sidecar file format, registry deltas, cross-machine pattern). Read this first.
- **`docs/data-schema.md`** — refreshed to match current `shared/src/angeleye.ts`. _Before_ snapshot for any schema-delta proposals.
- **`docs/planning/BACKLOG.md`** — list of pending items (use it as a list; don't invoke Ralphy ceremonies around it).

## What to do next

Pick one of:

- **Add `enrichment_version` + `enriched_at` to `RegistryEntry`** in `shared/src/angeleye.ts`. Two optional fields, no migration needed. Smallest viable step. Unblocks the version-stamping side of every other piece.
- **Define the sidecar file format and writer.** Server-side service that opens/appends to `~/.claude/angeleye/enrichments/<id>.json`. Plus the two HTTP endpoints to read/write it.
- **Draft the new skill** at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/SKILL.md`. Methodology layer first; reviewable before infrastructure is built. Must explicitly include the hard boundary above and the requirement-doc output format.
- **Define the requirement-doc format** that the loop writes when it spots code-change opportunities. Path convention (suggest `docs/requirements/from-enrichment-loop/<date>-<short-title>.md`), schema (title, evidence sessions, proposed change, category: schema/classifier/predicate/UI/ingestion). This is the artifact the developer-agent will consume.

This is **not a Ralphy campaign**. No PR, no worktree, no SHIP. Just incremental work tracked as commits.
