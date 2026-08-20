# Handover — AngelEye staleness fixes (2026-08-20)

## Launch line

```
cd /Users/davidcruwys/dev/ad/apps/angeleye
```

```
claude --permission-mode auto --model 'claude-opus-5' -n angeleye-dev "You must be running in /Users/davidcruwys/dev/ad/apps/angeleye — verify your cwd before anything else and STOP if it differs. Read /Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/HANDOVER-2026-08-20-staleness-fixes.md in full and execute it in the order given in its section 8. STOP after queued items Q1 and Q2 are committed and report before starting anything in section 7. Do not start, restart or kill any dev server from the Bash tool. Do not begin the collection-layer plugin or Sentinel build. Do not treat the three shipped commits as verified — no real hook event has reached them."
```

---

## 1. Governing frame

This work is **platform-drift correctness**, not a refactor and not a rebuild.

AngelEye reads and writes Claude Code's own data files, so a Claude Code change silently turns
working code into wrong code. Everything below exists because a belief encoded in the source stopped
matching the platform, and nothing failed loudly when it did.

**What this is not:** it is _not_ the collection-layer rebuild. The plugin + spool + Sentinel design
is specced, unchanged, and deliberately not started — see §7.

**The sequencing rule that was established and should hold:** transport and schema decisions were
blocked behind the external comparison so they would not be built twice; the path-encoding fix was
not, because it was causing ongoing permanent data loss. Comparison has now reported and changed
nothing, so the block is lifted.

---

## 2. State of play

**Two surveys, both committed:**

- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/staleness-review.md` — age map of every
  subsystem, 16 findings ranked, each CONFIRMED or SUSPECTED, plus an explicit "what this did not
  establish" section.
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/collection-layer-comparison.md` —
  AngelEye's built collector _and_ the specced plugin vs `Ax-For/session-observer` and
  `o11y-dev/opentelemetry-hooks`. Verdicts and the "does this change the plugin design" answer are
  in its §8–10.

**Three code commits, all pushed to `origin/main`:**

| Commit    | What landed                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `682fec5` | `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/claude-paths.ts` — Claude Code's real project-dir encoding, replacing four inline copies of a wrong rule                                                   |
| `6c2808a` | `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/routes/hooks.ts` — payload carve-out removed; `tool_response`, `duration_ms`, `prompt_id`, `session_title` captured; `reason` moved to SessionEnd                   |
| `d80f065` | `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/claude-sessions.service.ts` + `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/routes/live-sessions.ts` — reads Claude Code's own live session registry |

**The pipeline is dark.** Nothing listens on 5051. `~/.claude/angeleye/registry.json` has not moved
since `2026-08-01T05:07:13` — 19 days. The 29 `curl … || true` hooks in
`/Users/davidcruwys/.claude/settings.json` fire into a closed port every session and `|| true`
converts every failure into a `hook_success` in the transcript.

**Consequence that governs §8:** none of the three commits has been exercised by a real hook event.
They are unit-tested and mutation-verified, not verified in the app.

---

## 3. Corrections to bank — decided, not yet applied

All four are in `/Users/davidcruwys/dev/ad/apps/angeleye/CLAUDE.md`, which is always-on context, so
each wrong line taxes every future session in this repo.

| File + location                 | Says                                                                   | Truth (verified against installed 2.1.235 + live data)                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` line ~30            | "28 events wired, not 30"                                              | **31 known / 29 wired.** `EVENT_MAP` matches Claude Code's 31 events exactly. `settings.json` holds exactly 29. Code was right; the doc is wrong on both numbers                  |
| `CLAUDE.md` "Key facts"         | "`progress` entries are the most numerous type (~75%)"                 | **0 of 136,447** entries across all 456 live JSONLs. The type no longer exists                                                                                                    |
| `CLAUDE.md` "Key facts"         | "Auto-slug lives in `system/turn_duration`"                            | No slug field there or anywhere. Superseded by the `ai-title` entry type                                                                                                          |
| `CLAUDE.md` "Known Open Issues" | subagent detection "not yet at ingest"; `session_kind` "not yet added" | **Both shipped months ago.** `hooks.ts:269`/`:308` call `detectTeammate`; `shared/src/angeleye.ts:302-303` has the fields; registry holds 606 main / 102 subagent / 13 subprocess |

Also stale, same facts: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/known-issues.md`
rows `subagent-detection` and `session-kind-field` (move to Resolved), and
`/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/hook-transport.md` line ~224 ("30 hook
events … 28 wired") which contradicts line ~154 of the same file (29 — correct).

The 33% teammate-wrapper figure quoted in both `CLAUDE.md` and `known-issues.md` is now **8%**
(38/456 files). That is corpus turnover, not a detection regression — do not "fix" the detector.

---

## 4. Queued work

### Q1 — Answer `202` immediately, do the work off the response path

`/Users/davidcruwys/dev/ad/apps/angeleye/server/src/routes/hooks.ts`, the `POST /hooks/:event`
handler. It currently does registry read/update, JSONL write, session-class resolution and socket
broadcast **before** responding.

Measured in the spec (§3 of the requirements doc below): **51 ms per fire against a healthy server,
~48 ms of which is this synchronous work**, while the session waits. p90 session = 314 events =
**~16 s of wall-clock**. Responding first takes it to ~6.5 ms without touching a single hook.

The spec explicitly says this "stands on its own" regardless of the spool decision. It is the
cheapest available win and it is **not** part of the plugin rebuild.

Watch the ordering constraint: `session_end` currently archives the session and triggers
`backupUpstreamJSONL` — those must still happen, just not before the response.

### Q2 — Apply §3 corrections, and read `ai-title`

Docs half is mechanical. The code half:

- `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/sessions.service.ts:87` —
  `KNOWN_UPSTREAM_TYPES` is missing `ai-title` (and `mode`, `bridge-session`, `queue-operation`,
  `file-history-delta`, `atis-latch`, `pr-link`, `frame-link`), so they are logged as "unknown"
  forever at `~/.claude/angeleye/schema-observations.jsonl`.
- `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/backfill.service.ts:15` —
  `extractCustomTitle` matches only `type === 'custom-title'`. Claude Code now also writes
  `{"type":"ai-title","aiTitle":"…","sessionId":"…"}` — **1,619 of them in the live corpus**, an
  LLM-written session title AngelEye ignores while its own enrichment loop derives the same thing.
  `grep -rn "ai-title\|aiTitle" server/src client/src shared/src` returns nothing today.

Decide precedence explicitly and write it down: `custom-title` (user-chosen) should beat `ai-title`
(machine-chosen). Do not silently let the last-wins loop pick.

---

## 5. Open questions — carry, do not answer

1. **Do subagent / headless sessions get a `~/.claude/sessions/<pid>.json` file?** Every observed row
   across two samples was `kind: "interactive"`, and none were running at either sample. Until this
   is settled, **a missing file must not be read as "not a subagent."** Recorded in the module docs
   of `claude-sessions.service.ts`.
2. **Is the file removed on process exit, or reaped later?** Inferred as "removed on exit" from
   population (16 files, 16 live PIDs, while far more than 16 sessions ran in the window) — never
   observed directly. Watch one session exit to settle it.
3. **Five hook events registered since March/June have never once been ingested** —
   `elicitation`, `elicitation_result`, `file_changed`, `setup`, `worktree_remove`. "Never triggered
   by David" and "silently broken" are indistinguishable from here. `FileChanged` at zero across five
   months of heavy Edit/Write is the one worth doubting. **Premature to chase** until the pipeline
   runs again — with the collector dead, everything reads as zero.
4. **Should `prompt_id` replace the timestamp heuristics in
   `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/correlator.service.ts`?** Almost
   certainly yes, but **premature**: `6c2808a` only started capturing `prompt_id` and no event
   carrying one has been ingested yet. Revisit with a week of real data.
5. **Suite flakiness** — see §6.

---

## 6. Gotchas

**The test-agrees-with-itself trap — this repo has had it twice.** Both bugs fixed this session
survived because a test re-derived its expectation using the same expression under test, or asserted
a payload shape the platform never sends:

- `angeleye-data.test.ts` computed the expected path with `projectDir.replace(/\//g,'-')` against
  dot-free fixtures — green through any wrong encoding.
- `hooks.test.ts` _sent_ a `reason` on Stop and asserted it was promoted — so the dead read looked
  correct forever.

**Rule: expectations are literals, and fixtures come from real observed payloads.** New tests follow
this; hold the line.

**The pipeline being dark poisons every measurement.** Any "AngelEye shows no X" observation since
2026-08-01 means _no ingestion_, not _no X_. Do not draw conclusions from empty results until the
collector runs.

**Do not run dev servers from the Bash tool.** Project rule in
`/Users/davidcruwys/dev/ad/apps/angeleye/CLAUDE.md` — it leaks `PORT` into the Overmind/tmux session
invisibly and persistently. Diagnose with `lsof`, log files and source. Ask David to run
`./scripts/start.sh` (or `! ./scripts/start.sh` in-session).

**`shared/` must be rebuilt after touching `shared/src/`.** The server imports the built
`@appystack/shared`, not the source. A stale `dist` produced a phantom
`hooks.ts:65 directory_added is not assignable` error that looked like a code fault for a whole
session. `npm run build --workspace=@appystack/shared`.

**The suite is intermittently flaky and it pre-dates this session's work.** Measured six consecutive
full runs each way: clean HEAD failed **1/6**, with the new commits **2/6** — indistinguishable at
that sample size. Symptoms: `server/src/app.test.ts` `GET /health` returning **401** when no `401`
exists anywhere in the source, and `validate.test.ts` + `events.test.ts` failing together. All pass
in isolation. Smells like cross-file interference around the real server bind in `index.ts`.
**A single green run proves nothing here** — run it several times before believing a result.

**`server/src/mcp/angeleye-mcp.test.ts` fails and `npm run typecheck` errors** because
`@modelcontextprotocol/sdk` is not installed. Pre-existing, arrived with the MCP commit from the
other machine. Not caused by this session's work; filter it out rather than chasing it.

**Claude Code purges `~/.claude/projects/` at roughly 30 days.** 456 JSONLs remain, 44 of 75 project
dirs are empty, against 18,304 registry rows. A `~/.claude/projects/` directory disappeared _during_
this session. AngelEye's own archive is the long-term source of truth.

**Untracked in the working tree and not created by this session:** `/Users/davidcruwys/dev/ad/apps/angeleye/AGENTS.md`
and `/Users/davidcruwys/dev/ad/apps/angeleye/.agents/`. Left alone deliberately. Establish where they
came from before committing or deleting them.

---

## 7. What was ruled out

**Do not re-litigate these.** Reasoning and evidence are in
`/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/collection-layer-comparison.md`.

- **OpenTelemetry traces/spans as AngelEye's schema** — spans are immutable once ended; AngelEye's
  registry is mutated continuously by enrichment and classification. Also implies an OTLP backend
  with no consumer on a single-user local machine.
- **Adopting `opentelemetry-hooks` itself** — 11 of 31 Claude events (AngelEye wires 29), and a
  Python per-fire hook costs ~13× a bare fork (measured proxy: `python3 -c pass` 34.9 ms vs
  `/bin/echo` 2.6 ms on this machine).
- **`session-observer`'s read-on-demand, no-hooks architecture** — elegant, and forfeits everything
  older than the ~30-day purge, which is AngelEye's entire reason to exist.
- **A circuit breaker in a hook wrapper** (spec §3 C) — measured saving is ~5 ms of a 6.5 ms
  dead-port call. Buys a staleness bug for nothing.
- **Changing the spool design.** Spec §3 option D (spool to disk, maildir, Sentinel drains) survived
  the comparison and came out stronger. The one addition to make is a delivery-health record plus a
  `doctor`-style status command, so going dark is loud — recorded in the requirements doc's update
  block.

**Not started, deliberately:** the collection-layer plugin, the spool, and AngelSentinel. Spec at
`/Users/davidcruwys/dev/ad/apps/angeleye/docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`.
It is a week-plus build. **Do not start it in the same session as Q1/Q2.**

---

## 8. Suggested order

1. **Ask David to bring the server up** (`! ./scripts/start.sh`). Everything else is worth more
   afterwards, and it is the only way the three shipped commits stop being unverified.
2. **Verify `6c2808a` against a real hook event** — the weakest of the three. Confirm a real
   `PostToolUse` writes a populated `tool_response` and `duration_ms`, and that `prompt_id` appears
   on `user_prompt` / `tool_use` / `stop`. Check
   `~/.claude/angeleye/sessions/session-<id>.jsonl` directly. If `tool_response` arrives in a shape
   the tests did not anticipate, the tests stay green and the data is still wrong — that is exactly
   the original failure mode.
3. **Check `GET http://localhost:5051/api/live-sessions`.** `alive_unknown_to_angeleye` should fall
   from 17 toward 0 as ingestion catches up. That number is the collector-health signal.
4. **Q1** — respond `202`, move the work off the response path.
5. **Q2** — apply the §3 corrections and read `ai-title`.
6. **STOP and report.**

**Do not**, in this session: start the plugin/Sentinel build; rewrite `correlator.service.ts`; chase
the five never-ingested hook events (§5.3); or install `@modelcontextprotocol/sdk` unless David asks —
it arrived from the other machine and is his call.

---

## Related

- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/staleness-review.md`
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/collection-layer-comparison.md`
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/known-issues.md`
- `/Users/davidcruwys/dev/ad/apps/angeleye/docs/architecture/hook-transport.md`
- `/Users/davidcruwys/dev/ad/brains/security/scan-log.md` — injection scan for the two external repos
