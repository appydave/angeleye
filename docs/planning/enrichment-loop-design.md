# Enrichment Loop — Design

**Status**: design captured 2026-05-06
**Owner**: AngelEye (first-class skill, lives at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/`)
**Predecessor skill**: `enrich-subtypes` (single-pass, broken paths, never iterated)

---

## North Star

**AngelEye becomes a self-improving system that gets continuously sharper at understanding past Claude Code sessions — so every pass over the data costs less and reveals more than the one before.**

Three properties operationalize that:

1. **Self-improving** — every pass leaves a permanent audit trail; patterns the LLM judges over and over get promoted to deterministic code so the next pass is cheaper.
2. **Cheap to run** — runs from any machine via Tailscale, billed against whichever Claude account makes sense; deterministic-where-possible to keep LLM tokens for the genuinely ambiguous calls.
3. **Memory, not amnesia** — old judgments don't get overwritten when new ones arrive; pass v1 vs v3 is comparable, so the system can detect where it changed its mind.

Success state: questions like _"how has my BMAD work changed over the last 3 months?"_ or _"which of my sessions were probably stuck but I didn't realize it?"_ get honest answers because the system has been quietly improving its read on the work the whole time.

---

## What this is not

To prevent scope drift:

- **Not a Ralphy campaign.** No PR, no worktree merge, no SHIP. Ralphy's lifecycle bones (BACKLOG, librarian-style learnings) are borrowed informally — its mode/profile/wave framework is not the operating model.
- **Not a generic "Analysis profile" skill.** The skill is AngelEye-specific by design. Classifier rules, registry schema, predicates, workflow model are all AngelEye's; the skill knows them directly rather than translating through a generic abstraction.
- **Not feature work.** Code that lands here is infrastructure for the loop, not new product capability.

---

## The three nested loops

| Loop                      | Cadence                                                           | What it does                                                                                                                                                                                                  | Cost                                                            |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **L1 — Enrichment pass**  | Per session-batch (e.g. 50 sessions of `build.bmad_orchestrator`) | LLM evaluates each session, writes tags + reasoning back. Population is selected by predicate (`subtype`, `trigger_command`, `workflow_role`, etc.)                                                           | LLM tokens proportional to batch × per-session reasoning length |
| **L2 — Self-improvement** | After each L1 pass                                                | Harvest: which patterns recurred? Which can be promoted to deterministic classifier rules? Which need new schema fields? Which call for skill prompt changes? Output: PRs against classifier / schema / skill | Human review + small code change                                |
| **L3 — Refresh**          | When skill or classifier version bumps materially                 | Re-evaluate sessions whose `enrichment_version` predates the current technique generation. Compare new judgment to old — record diffs.                                                                        | LLM tokens × stale population size                              |

L1 alone is what `enrich-subtypes` was attempting (badly). L2 and L3 require infrastructure that doesn't exist today.

---

## Multi-source data model

The loop is **not just AngelEye data** — it reads three layers, each with a different role.

| Source                     | Path                                                          | Role                                                             | When canonical                                                |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Claude Code raw events** | `~/.claude/projects/<encoded-project-dir>/<session_id>.jsonl` | Ground truth — what actually happened                            | Always primary while file exists                              |
| **AngelEye archive**       | `~/.claude/angeleye/archive/session-<session_id>.jsonl`       | Long-term snapshot — survives Claude Code's auto-purge           | Fallback when live file gone                                  |
| **AngelEye registry**      | `~/.claude/angeleye/registry.json`                            | Index of derived features (predicates, tags, scale, classifiers) | Always — but it's an _index_, not a substitute for raw events |

**Critical correction to today's `enrich-subtypes` skill**: it reads from `~/.claude/angeleye/sessions/` (a path that doesn't exist) then falls back to archive. Effective behaviour today is archive-only — silently misses live sessions. The fix is to point at `~/.claude/projects/<encoded>/` first.

**Encoded-path convention**: Claude Code flattens project directory paths into the JSONL filename, e.g. `/Users/davidcruwys/dev/ad/apps/angeleye` becomes a directory like `-Users-davidcruwys-dev-ad-apps-angeleye/`. The mapping logic must match Claude Code's encoding.

---

## The missing data layer — sidecar enrichment files

Today the only persistent output of an LLM pass is a tag + confidence + source flag in `registry.json`. **Everything else is lost**: reasoning, model used, signals weighted, skill version, classifier version, prior judgments.

This makes L2 and L3 impossible. L2 has nothing to harvest from beyond the final tag. L3 can't compare passes because v1's judgment was overwritten by v2.

### Proposed: per-session sidecar JSON

**Path**: `~/.claude/angeleye/enrichments/<session_id>.json`

**Structure**:

```json
{
  "session_id": "31ee1261-7985-49f2-b3cc-d910c414370f",
  "passes": [
    {
      "pass_id": "v1-2026-05-06-bmad-orchestrators",
      "ran_at": "2026-05-06T15:30:00Z",
      "ran_by": "machine-a",
      "model": "claude-opus-4-7",
      "skill_commit": "b19311ba",
      "classifier_commit": "652f5d61",
      "tags": [{ "tag": "build.bmad_orchestrator", "confidence": 0.95 }],
      "reasoning": "trigger_command appydave:bmad-story-lifecycle is the deterministic orchestrator signal; subagent_start_count of 7 confirms full lifecycle ran.",
      "signals_weighted": ["trigger_command", "subagent_start_count", "first_real_prompt"],
      "diff_from_previous": null
    },
    {
      "pass_id": "v2-2026-08-15-refresh",
      "ran_at": "2026-08-15T09:12:00Z",
      "ran_by": "machine-b",
      "model": "claude-opus-4-8",
      "skill_commit": "abc123",
      "classifier_commit": "def456",
      "tags": [
        { "tag": "build.bmad_orchestrator", "confidence": 0.97 },
        { "tag": "build.shipped", "confidence": 0.65 }
      ],
      "reasoning": "Same primary tag. Added secondary tag — trace shows the lifecycle ended with bmad-ship, which the v2 classifier recognises as a shipping outcome.",
      "signals_weighted": [
        "trigger_command",
        "subagent_start_count",
        "has_git_outcome",
        "closing_style"
      ],
      "diff_from_previous": "Added build.shipped secondary tag (v2 classifier surfaces shipping outcomes that v1 didn't track)."
    }
  ]
}
```

**Key properties**:

- **Append-only**. New passes append to `passes[]`. Old passes never change.
- **Self-contained per session.** No cross-session writes; no race conditions; one file per session.
- **Holds the audit trail.** Reasoning, model, skill version, classifier version — everything you'd need to defend or revisit a judgment.
- **Independent of registry.** Registry stays compact; sidecar bears the unbounded data.

### Companion: append-only enrichment log

**Path**: `~/.claude/angeleye/enrichments.jsonl`

One line per pass per session. Cheap to grep, easy to aggregate.

```json
{ "ts": "...", "session_id": "...", "pass_id": "...", "model": "...", "tags": [...] }
```

Use cases: "show me everything machine-b enriched yesterday", "find passes where confidence dropped", "count which tags were assigned this week".

---

## Registry schema deltas

Two new fields on `RegistryEntry`. Minimal additions — registry stays the index, sidecar is the audit.

### Before (current state)

```ts
interface RegistryEntry {
  session_id: string;
  // ... existing fields ...
  session_tags?: SessionTag[]; // current best tags (overwritten on update)
  subtype_heuristic?: SessionSubtype; // deterministic-classifier output
  session_subtype?: SessionSubtype; // derived
}
```

### After

```ts
interface RegistryEntry {
  session_id: string;
  // ... existing fields ...
  session_tags?: SessionTag[]; // current best tags
  subtype_heuristic?: SessionSubtype;
  session_subtype?: SessionSubtype;

  // NEW
  enrichment_version?: string; // technique generation, e.g. "2026-w1"
  enriched_at?: string; // ISO timestamp of latest pass
}
```

**Why these two**:

- `enrichment_version` is the L3 selector — "anything older than the current technique generation gets re-evaluated". Could be calendar-weeked (`2026-w19`), commit-stamped (`enr-abc123`), or named (`bmad-pass-1`). Convention TBD; field accommodates any string scheme.
- `enriched_at` is a secondary L3 filter — "anything not touched in 60 days, regardless of version". Useful for orphan sweeps.

**Why not more**: every other piece of audit data — model, reasoning, signals weighted, prior tags — lives in the sidecar. Registry stays compact and queryable. The two fields are enough to _select_ sessions for refresh; the sidecar tells the _story_.

---

## Cross-machine execution

**Goal**: run the loop from machine B (different Claude account) against machine A's data, billed against machine B's account.

### Three patterns considered

| Pattern                                                         | Token cost lands on | Fit                             |
| --------------------------------------------------------------- | ------------------- | ------------------------------- |
| SSH from B → run `claude` on A                                  | Machine A           | ❌ defeats the purpose          |
| Run on B, mount A's data via SSHFS or Tailscale                 | Machine B           | ⚠️ works but couples to a mount |
| Run on B, AngelEye exposes HTTP `GET /api/sessions/<id>/events` | Machine B           | ✅ no filesystem coupling       |

### Chosen: HTTP-driven, no mount

The loop talks only to the AngelEye HTTP API. No direct filesystem reads. From machine B, set `ANGELEYE_API=http://<machine-a-tailscale-name>:5051` and the skill works identically — Tailscale handles the network, AngelEye serves the data.

### What's needed

- **`GET /api/sessions/<id>/events`** — returns the parsed event stream for a session. Internally reads live JSONL with archive fallback. Doesn't expose the raw filesystem path.
- **`POST /api/registry/llm-tags`** — already exists. Used to write tags back. Already supports queued writes safely.
- **Sidecar endpoints** — `GET /api/sessions/<id>/enrichment-history` returns the sidecar; `POST /api/sessions/<id>/enrichment-pass` appends a new pass. Server is the only writer; clients (skill from machine B) only see HTTP.
- **Skill respects `ANGELEYE_API` env var** — defaults to `http://localhost:5051`, overrides for cross-machine.

---

## Software-development triggers from the loop

The loop is not just consumer of code — it generates code-change asks. Four trigger types:

1. **New Anthropic capability ships.** New Claude Code event types (or new fields on existing events) need handling at ingest, predicate computation, and possibly classifier rules.
2. **New data shapes emerge from how AngelEye is used.** New patterns of work (new orchestration frameworks, new skill compositions) need new subtypes, new predicates, new visualizations.
3. **Pattern promotion (L2 in action).** LLM enrichment finds a deterministic pattern. Promote to classifier code; add a rule; remove the LLM cost. Today's BMAD orchestrator/agent split via `trigger_command` is a worked example.
4. **Schema and infrastructure asks the loop generates for itself.** L3 needs `enrichment_version`. Cross-machine needs the events endpoint. Better archive/live merging needs reconciliation logic. The loop iteratively de-frictions itself.

Each pass should produce a small list of code-change tickets. They land in BACKLOG.md (or a successor register).

---

## Stream 1 — infrastructure work units

These are AngelEye-the-application changes that block or enable the loop. Not the skill itself — the skill goes in Stream 2 below. These are roughly ordered by dependency (1 unblocks 2 and 6; 2 unblocks 5; etc.).

| #   | Work unit                                                                               | Surface                                                                     | Notes                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fix live-JSONL path                                                                     | skill code (eventually)                                                     | Today's `enrich-subtypes` reads `~/.claude/angeleye/sessions/` (dead). Live path is `~/.claude/projects/<encoded>/<id>.jsonl`. Encoded-path mapping logic needs to match Claude Code. |
| 2   | Sidecar enrichment file format + writer                                                 | server (`server/src/services/`) + new dir `~/.claude/angeleye/enrichments/` | Append-only per-session JSON. Schema as specified above.                                                                                                                              |
| 3   | `enrichment_version` + `enriched_at` on `RegistryEntry`                                 | `shared/src/angeleye.ts` + classifier output + types                        | Two optional fields, no migration needed (optional = backward-compatible).                                                                                                            |
| 4   | `GET /api/sessions/<id>/events` endpoint                                                | `server/src/routes/`                                                        | Returns parsed events. Internally: live JSONL → archive fallback. Removes filesystem coupling for clients.                                                                            |
| 5   | `GET /api/sessions/<id>/enrichment-history` + `POST /api/sessions/<id>/enrichment-pass` | `server/src/routes/`                                                        | Read/write sidecar. Server-only writer.                                                                                                                                               |
| 6   | Append-only `enrichments.jsonl` log                                                     | `server/src/services/`                                                      | Cross-session aggregation surface. One line per pass.                                                                                                                                 |
| 7   | Skill respects `ANGELEYE_API` env var                                                   | skill code                                                                  | Defaults to `http://localhost:5051`; cross-machine sets to Tailscale URL.                                                                                                             |
| 8   | Update `data-schema.md` to document the above                                           | `docs/data-schema.md`                                                       | After Stream 1 lands; capture sidecar shape, new endpoints, new fields.                                                                                                               |

Stream 2 — **the new skill at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/`** — gets a separate set of work units once Stream 1 has the bones in place. Skill scope: SKILL.md + supporting refs, methodology layer (predicates, lens patterns, capture-lessons step), L1/L2/L3 mode flags.

Minimum to run a first L1 pass cross-machine: items 1, 3, 4, 7. Items 2, 5, 6 enable L2/L3. Item 8 closes the loop on documentation.

---

## Open questions

1. **`enrichment_version` convention.** Calendar-weeked (`2026-w19`), commit-stamped (`enr-abc123`), or named (`bmad-pass-1`)? Field accepts any — but a convention helps comparison. Suggest: short string + free-form description in sidecar.
2. **Sidecar dir vs database.** JSON files per session is simple but sidecar count grows with session count (~2,200 today, growing). At what scale should this become SQLite? Likely a future-self problem; not blocking.
3. **First L1 pass target.** BMAD orchestrators (72 sessions) is the natural first target — small, deterministic predicate (`subtype === 'build.bmad_orchestrator'`), high value (these anchor your workflow model). RuFlo (324 in `appyctrl`) is the second-best because it's larger and richer.
4. **Skill iteration discipline.** Each L1 pass should append a "Lessons" entry to the skill's SKILL.md. Concrete change today's broken `enrich-subtypes` shows we need: a structural step in the skill that captures "what surprised me, what should change next time."

---

## Sequence to first running pass

1. ✅ Refresh `data-schema.md` to current state (committed `a77b3b0c`).
2. ⏳ This design doc captured.
3. ⏳ Stream 1 items added to BACKLOG.md (or designated register).
4. → Implement Stream 1 minimum (items 1, 3, 4, 7 — skill path fix, registry fields, events endpoint, env var).
5. → Author the new skill at `apps/angeleye/.claude/skills/angeleye-enrichment-loop/`.
6. → Cross-machine smoke test from machine B over Tailscale on a 5-row trial.
7. → First real L1 pass on BMAD orchestrators (72 sessions, billed to machine B's account).
8. → L2 harvest from pass 1: what patterns can we promote to classifier rules?
9. → Implement Stream 1 remaining (sidecars, log, history endpoints — items 2, 5, 6).
10. → Continue with Ralphy (65 sessions), then RuFlo (324 sessions).

---

## References

- `shared/src/angeleye.ts` — canonical type model
- `docs/data-schema.md` — schema reference (refreshed 2026-05-06)
- `docs/architecture/known-issues.md` — pre-existing issues, several relevant to this loop
- `~/dev/ad/brains/anthropic-claude/claude-code/observability.md` — Claude Code session naming, JSONL format, hook reference
- `apps/angeleye/.claude/skills/enrich-subtypes/SKILL.md` — predecessor skill (broken paths, never iterated; do not extend in place)
