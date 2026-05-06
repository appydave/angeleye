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

## What exists

- **`docs/planning/enrichment-loop-design.md`** — full architectural design (three loops L1/L2/L3, multi-source data model, sidecar file format, registry deltas, cross-machine pattern). Read this first.
- **`docs/data-schema.md`** — refreshed to match current `shared/src/angeleye.ts`. Use as the _before_ snapshot for any schema-delta proposals.
- **`docs/planning/BACKLOG.md`** — has Stream 1 infrastructure items (the path fix, sidecar writer, registry fields, events endpoint, etc.) plus the new skill as a separate item. Use it as a list; don't invoke Ralphy ceremonies around it.

## What to do next

Pick one of:

- **Implement the HTTP events endpoint** (`GET /api/sessions/<id>/events`). Smallest, highest-leverage piece of Stream 1 — unblocks cross-machine execution. Spec: returns parsed events for a session, internally reads live JSONL from `~/.claude/projects/<encoded>/<id>.jsonl` with `~/.claude/angeleye/archive/session-<id>.jsonl` as fallback.
- **Draft the new skill** at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/SKILL.md`. Methodology layer first; reviewable before infrastructure is built. Must explicitly include the hard boundary above. Replaces (does not extend) the broken `enrich-subtypes` skill.
- **Define the requirement-doc format** that the loop will write when it spots code-change opportunities. Path convention, schema (title, evidence sessions, proposed change, category: schema/classifier/predicate/UI/ingestion). This is the artifact the developer-agent will consume.

This is **not a Ralphy campaign**. No PR, no worktree, no SHIP. Just incremental work tracked as commits.
