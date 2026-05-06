# Handover — Classifier + RuFlo Investigation + Ghost Fix (2026-05-06)

**Author**: Claude (Sonnet 4.6) at end of 2026-05-06 afternoon session
**Audience**: next Claude session continuing AngelEye classifier work
**Status**: 2 commits landed, 710 tests passing. Two backfill scripts needed before enrichment resumes.

---

## What this session did

### Commit 1 — previous session's 8 classifier rules (committed clean)

Everything from the 2026-05-04→05 session was uncommitted. Committed as `b19311ba`:

- 8 classifier rules in `classifier.service.ts`
- Subprocess detection service
- Schema extensions (3 new subtypes, `session_kind: 'subprocess'`)
- New API endpoints, DiagnosticsView, 5 audit scripts, enrich-subtypes skill

### Commit 2 — RuFlo detection + ghost/probe split + Ralphy subtype (`652f5d61`)

**What changed and why:**

1. **Ghost rule bug fixed** — 59 k-lars sessions had `session_kind: 'subprocess'` correctly but ALSO got `meta.ghost_session` in their `session_tags` because the empty-ghost rule had no subprocess guard. Guard added: `if session_kind === 'subprocess', skip ghost/probe detection`.

2. **Ghost split into two subtypes**:
   - `meta.scheduled_probe` — only lifecycle events (instructions_loaded + session_start + session_end), ≤7 events. A scheduler (cron, /loop, AngelEye task) spawned Claude with no prompt.
   - `meta.ghost_session` — brief session (≤10 events) with non-lifecycle events but no user_prompt. Human opened Claude, did nothing, closed it.

3. **RuFlo detection predicate** — `has_ruflo_context`: true when `instructions_loaded` events include `.appydave/` paths or `CLAUDE.local.md`. Distinguishes RuFlo-enabled sessions from standard Claude Code.

4. **New subtypes added to `shared/src/angeleye.ts`**:
   - `build.ruflo_orchestrator` — RuFlo Mode B lead session (has_ruflo_context + subagent_start_count ≥ 1)
   - `build.bmad_orchestrator` — BMAD lifecycle lead (schema only; heuristic can't reliably distinguish orchestrator vs agent pane from prompt alone — LLM assigns this during enrichment)
   - `build.ralphy_campaign` — Ralphy-led parallel runs (/ralphy or /appydave:ralphy prefix)
   - `meta.scheduled_probe` — scheduler-spawned context-load-only session

5. **`classifySession` now accepts `sessionKind` param** — passed from `sync.service.ts` so the ghost guard has access to registry state.

---

## RuFlo investigation findings (for context)

Read from docs: `docs/planning/handover-2026-05-06-ruflo-deep-enrichment.md` (RuFlo architecture docs summary).

**Key facts confirmed from live session data + docs:**

- RuFlo is a config layer (not an AI). The 98 agents are role templates. Nothing runs autonomously.
- The "ghost" sessions in appyctrl are **scheduled probe sessions** — Claude spawned with no prompt, loads context, exits in 5-6 seconds. Timing is ~5 min intervals. NOT RuFlo doing autonomous work (RuFlo has no built-in scheduler).
- RuFlo Mode B sessions are identifiable: they load `CLAUDE.local.md` and `.appydave/*` files in addition to the standard CLAUDE.md trio.
- RuFlo subagents appear in AngelEye as separate teammate sessions (with subagent_start events in the lead session). They're NOT invisible — they're Mechanism B sessions detectable via `<teammate-message teammate_id="...">`.
- 4 distinct RuFlo session shapes from AngelEye's event stream:
  1. **Probe** — lifecycle only, <10s, no user_prompt
  2. **Sequential work** — Agent calls but no subagent_start (Phase 1 style: one agent at a time)
  3. **Fan-out orchestrator** — multiple subagent_start events + Agent calls (Phase 2/3)
  4. **Research leg** — read-heavy, may hit rate limit (pre_compact/stop_failure), no subagent_start

---

## Ghost session breakdown (audit run this session)

218 total sessions tagged `meta.ghost_session` in registry:

| Project                  | Count | Real cause                                                                      | Correct tag                       |
| ------------------------ | ----- | ------------------------------------------------------------------------------- | --------------------------------- |
| appyctrl                 | 116   | Scheduled probe invocations (~5 min interval)                                   | `meta.scheduled_probe`            |
| k-lars                   | 59    | omi-extract-haiku subprocess sessions — already have `session_kind: subprocess` | Remove ghost tag; keep subprocess |
| app.supportsignal.com.au | 13    | Mix — investigate                                                               | likely real ghosts                |
| brains                   | 10    | Mix                                                                             | likely real ghosts                |
| angeleye                 | 2     | Loop evaluation sessions with minimal events                                    | likely real ghosts                |
| other ~18 projects       | ~20   | Mix                                                                             | likely real ghosts                |

---

## What the next session must do FIRST (before any enrichment)

Two backfill scripts needed. Both fix tag data in-place — no classifier changes required.

### Script A — remove `meta.ghost_session` from subprocess sessions

**Problem**: 59 k-lars rows have `session_kind: 'subprocess'` AND `meta.ghost_session` in `session_tags`. The new classifier guard prevents future mis-tagging but doesn't fix existing tags. LLM tags win over heuristic so force re-sync won't clear them.

**What to write**: `scripts/audits/fix-subprocess-ghost-tags.ts`

Logic:

```
for each session in registry:
  if session_kind === 'subprocess' AND session_tags includes meta.ghost_session:
    remove meta.ghost_session from session_tags (keep other tags)
    POST /api/registry/llm-tags with cleaned tags
```

### Script B — retag appyctrl ghost → scheduled_probe

**Problem**: 116 appyctrl rows have `meta.ghost_session` in `session_tags`. Should be `meta.scheduled_probe`. LLM tags win, so re-sync won't fix them.

**What to write**: `scripts/audits/fix-scheduled-probe-tags.ts`

Logic:

```
for each session in registry:
  if project === 'appyctrl' AND session_tags[0].tag === 'meta.ghost_session':
    check if only lifecycle events (instructions_loaded + session_start + session_end)
    if yes: replace meta.ghost_session with meta.scheduled_probe (same confidence 0.95)
    POST /api/registry/llm-tags
```

(Or could filter by event_count ≤ 7 as a simpler proxy, since the probe shape is consistent.)

### Also pending from last session

- `npx tsx scripts/audits/backfill-secondary-tags.ts` — 13-row multi-tag backfill. Needs server running on port 5051. Run after Script A + B.

---

## Sequence for next session

```
1. Confirm server is up: lsof -i :5051 | grep LISTEN
2. Write + run scripts/audits/fix-subprocess-ghost-tags.ts (fixes 59 k-lars rows)
3. Write + run scripts/audits/fix-scheduled-probe-tags.ts  (fixes 116 appyctrl rows)
4. Run npx tsx scripts/audits/backfill-secondary-tags.ts   (13-row secondary tags)
5. Run npm run audit:registry to refresh diagnostics snapshot
6. Spot-check: verify a few appyctrl sessions now show meta.scheduled_probe
7. Resume enrichment if desired — all queues are drained, so this would be a deeper review pass
```

---

## Open architectural items (unchanged from last handover)

See `docs/architecture/known-issues.md` for detail. Status as of this session:

| ID                      | Status                                                        |
| ----------------------- | ------------------------------------------------------------- |
| project-field-uuid-leak | Open — Paperclip agent UUIDs leaking into project field       |
| paste-handover-pattern  | Open — truncated first_real_prompt for paste-opening sessions |
| bmad-chain-grouping     | Open — story-level grouping across BMAD lifecycle chains      |
| subproject-path-missing | Open — sub-brain detection inside brains/ monorepo            |

`build.bmad_orchestrator` is now in the schema but requires LLM enrichment to assign (heuristic can't distinguish orchestrator pane from agent pane by prompt alone).

---

## Memory feedback (auto-loads)

All 4 feedback memories from the previous session are saved and will auto-load:

- "go" = approval phrase (not "approve")
- Enrichment loop: write automatically, show full 6-column review table each batch
- Never compress table rows; canonical format: # | ID | Project | Before | After | Key signal
- Assign secondary tags when activities overlap; expect 5–15 per 50
