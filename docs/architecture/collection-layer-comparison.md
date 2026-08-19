# Collection Layer — Comparison Against Two External Projects

**Date**: 2026-08-19
**Question**: does either project change how AngelEye should build its collection layer?
**Scope**: survey. No AngelEye collection code was changed in this pass.

**Three subjects, not two.** The comparison is against both the built and the specced AngelEye:

| #   | Subject                                       | Where                                                                    |
| --- | --------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | AngelEye's collection layer **as built**      | `server/src/routes/hooks.ts`, 29 curl hooks in `~/.claude/settings.json` |
| 2   | The AngelEye plugin **as specced, not built** | `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`   |
| 3   | The two external repos                        | below                                                                    |

Subject 2 is the one that matters for `opentelemetry-hooks`. That repo is hook-transport machinery, which is exactly the layer the spec is about — so it is judged against the design, not against the legacy implementation the spec already rejects.

| Repo                                                                              | Ref reviewed                   | Licence                           | Size                                                       |
| --------------------------------------------------------------------------------- | ------------------------------ | --------------------------------- | ---------------------------------------------------------- |
| [`Ax-For/session-observer`](https://github.com/Ax-For/session-observer)           | `210014c` (2026-07-18)         | MIT (`LICENSE`, `package.json:6`) | 119 files, ~3.2k lines of shared/server JS                 |
| [`o11y-dev/opentelemetry-hooks`](https://github.com/o11y-dev/opentelemetry-hooks) | `5da0c69` v0.14.0 (2026-07-22) | MIT (`pyproject.toml:10`)         | 44 files, 6,218-line `otel_hook.py` + 3,137 lines of tests |

Both are MIT, so anything below is safe to adopt with attribution.

---

## 0. Security gate

Both repos were cloned to the session scratchpad — deliberately **not** `~/dev/upstream/repos/`, so the curated collection and its `repos.jsonl` registry are not churned by a throwaway comparison. Both clones were deleted after this document was written.

Prompt-injection scan run **before any file was read for content**, per the `appydave:prompt-injection-scanner` taxonomy. **Verdict: both CLEAN.** Logged at `~/dev/ad/brains/security/scan-log.md`.

Checks: categories 1–6 + 9 regex sweep (0 hits, both repos); zero-width/bidi/unicode sweep over all text files (0 hits); markdown image/link exfil sweep (0 external-host hits); outbound-URL inventory (session-observer: npm/eslint boilerplate in `package-lock.json` only; opentelemetry-hooks: OTel backend examples — Honeycomb, Datadog, Coralogix — all in docs/config samples); npm `pre`/`post` install lifecycle scripts (none in either).

One **LOW** note, recorded rather than acted on: `opentelemetry-hooks/.github/copilot-instructions.md:2,9` assigns a role ("You are an **OpenTelemetry Instrumentation Architect**") and directs an agent to fetch an external repo ("**CRITICAL**: … you must 'browse' or 'reference' … `o11y-dev/opentelemetry-skill`"). That is cat-2/cat-7 _shaped_, but it is contributor-facing Copilot config for agents working inside that repo, not content aimed at a reader. Treated as data; the external repo was not fetched. Separately it is a quality signal — it describes a **Go** codebase (`context.Context`, `trace.WithAttributes()`) while the repo is **Python**, so it is stale or copy-pasted.

No script, Makefile, `setup.sh`, or package-manager command from either repo was executed.

---

## 1. The short version

|                             | `session-observer`                                   | `opentelemetry-hooks`                              |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **Has a collection layer?** | **No.** Zero hooks. Reads JSONL from disk on demand. | Yes — one Python command per hook fire.            |
| **Solves safe degrade?**    | N/A                                                  | **Partially, and better than expected** — see §2.3 |
| **Claude event coverage**   | N/A                                                  | **11 of 31** (AngelEye: 29)                        |
| **Verdict**                 | **Steal one idea**                                   | **Steal two ideas**                                |

Neither is an adopt. Neither changes the plugin design's core decision. One of them validates it, and one of them hands over a mechanism the spec is missing.

---

## 2. Transport — the question that blocks two staleness fixes

### 2.1 Where AngelEye stands

**Built (subject 1)**: 29 `curl … || true` forks per session into `localhost:5051`. Measured in the spec (`§3`, 2026-07-25, Roamy): bare fork **1.67 ms**, file write **2.16 ms**, curl→live **51 ms**, curl→dead **6.5 ms**. Of the 51 ms, ~48 ms is the server doing synchronous work while the session waits. At p90 (314 events) that is **16 s of wall-clock per session, while healthy**.

**Specced (subject 2)**: option **D — spool to disk, Sentinel drains**. Maildir pattern, one file per fire, `write → rename` for atomicity. No network in the hot path. `|| true` silence stops being possible because a growing `incoming/` _is_ the down-signal.

### 2.2 What `session-observer` does — nothing, deliberately · **CONFIRMED**

It has no collection layer at all. `shared/source-adapters.js:24-31` declares Claude Code as a source whose `sessionGlob` is `~/.claude/projects/**/*.jsonl`; the server reads those files on request. There is no hook, no daemon, no write path. `grep -rn "settings.json"` across `server.js` and `shared/` returns nothing.

**This is a legitimate architecture, not a gap** — and it is worth naming because it is the one AngelEye rejected. Read-on-demand has zero session latency, zero install footprint, and cannot go dark. It also cannot see anything Claude Code does not persist to JSONL, and it inherits the ~30-day purge window that the staleness review measured (`staleness-review.md#a1-10`). AngelEye's whole reason for hooks is to capture what the purge destroys. So: no transport lesson here, and no evidence AngelEye is wrong to have hooks.

### 2.3 What `opentelemetry-hooks` does — and the one mechanism worth stealing · **CONFIRMED**

Architecture (`README.md:19-25`): `IDE Event → stdin JSON → otel-hook → OTel SDK → OTLP backend`. Explicitly _"No sidecar, no daemon — just a command your IDE calls."_

So at the top level it is **the same shape AngelEye already has and the spec already rejected** — a per-fire subprocess that talks to a network endpoint. But two layers underneath, it does something AngelEye does not.

**(a) Disk-backed buffering, flushed at Stop.** With `IDE_OTEL_BATCH_ON_STOP` set, each event is appended to `.state/batches/<generation_key>.jsonl` (`otel_hook.py:3573-3580`) and the whole batch is converted to a span tree at Stop (`otel_hook.py:4844+`).

**(b) — the important one — the buffer is only cleared when the export actually succeeded** (`otel_hook.py:4931-4934`):

```python
success = not flush or _force_flush_provider(authoritative_signal="traces")
if success:
    _clear_batch_events(gen_key)
```

If the OTLP endpoint is down, `_force_flush_provider` returns falsy, the batch file **stays on disk**, and it is retried on a later flush. Cleanup (`otel_hook.py:1761-1796`) only deletes an orphan batch whose owning session file no longer exists, and `_flush_stale_sessions` (`otel_hook.py:1799+`) re-emits sessions that never got a SessionEnd — an IDE crash is recovered rather than lost.

**This is a real degraded-dependency mechanism, and it is precisely the gap the spec names as uncovered** (`§1.1 gap 2`: _"Nothing on degraded-dependency hook design… what should a hook do when the thing it talks to is down"_). It is worth recording as prior art.

**Its limits, stated plainly** — retry lives inside a TTL. `_state_ttl_seconds()` defaults to **86,400 s / 24 h** (`otel_hook.py:1697-1701`). Past that, `_flush_stale_sessions` fires, attempts the emit, and removes the session file; a multi-day backend outage still loses data. AngelEye's spooled design has no such ceiling because the Sentinel owns the store rather than a remote backend.

**(c) Failure is visible.** `_DiagnosticExporter` (`otel_hook.py:2237-2264`) is a transparent decorator around the exporter that records every success/failure to `.state/delivery_health.json` (`_record_delivery_health`, `otel_hook.py:2207`), sanitising the endpoint and storing only the error _type_, _length_ and _sha256_ — never the message. A CLI `doctor` command (`otel_hook.py:6020-6030`) reads it back.

**This is the direct answer to the four-week M4 blackout.** The spec's framing is right — _"the harm when it's down is not latency — it is silence"_ (`§3.A`) — and this repo shows a shape for breaking the silence that costs almost nothing: wrap the writer, persist a bounded health record, expose one `doctor` command.

**(d) Cost — where it is worse than AngelEye.** `otel-hook` is a Python console script, so every fire pays interpreter startup. Measured on this machine (a proxy floor; **their code was not executed**):

| Command                               | Per-invocation |
| ------------------------------------- | -------------- |
| `/bin/echo` (fork floor)              | **2.57 ms**    |
| `python3 -c pass`                     | **34.89 ms**   |
| `python3 -c 'import json,os,time,re'` | **30.29 ms**   |

The transferable fact is the **ratio: a Python interpreter start is ~13× a bare fork.** Before `otel_hook.py` parses a byte of stdin it has spent roughly the same order of magnitude as AngelEye's entire round trip to a live server. Against the spec's 2.16 ms file-write target it is an order of magnitude worse. (These numbers are from a different harness than the spec's — `/bin/echo` measures 2.57 ms here vs 1.67 ms there — so use the ratio, not the absolute.)

### 2.4 Verdict on transport

**The spec's option D stands unchanged, and is reinforced.**

Three specific confirmations:

1. **Spooling to disk is the right instinct** — the most mature project in this space independently arrived at disk buffering, and its retry loop is built on the buffer surviving a failed export.
2. **The spec was right to choose maildir over append.** `opentelemetry-hooks` uses append-to-JSONL and therefore needs an explicit per-key lock file on every single write (`otel_hook.py:3577-3580`, `_acquire_lock`). The spec's _"no concurrent-append contention between parallel sessions"_ is not theoretical — it is a lock this repo pays for and AngelEye's design avoids.
3. **The spec was right to reject the circuit breaker (option C).** Nothing here implements one, despite being far more mature than AngelEye's collector.

**One addition to make.** The spec's §3 is entirely about _capture_ surviving; it has no requirement for _noticing_. Options A–D are all judged on whether events are lost, and D wins because a growing `incoming/` is a monitorable signal — but nothing in the spec says who reads it. `_DiagnosticExporter` + `delivery_health.json` + `doctor` is a concrete, cheap shape for that, and it is orthogonal to the spool decision.

---

## 3. Event coverage · **CONFIRMED**

|                           | Claude Code hook events subscribed                                          |
| ------------------------- | --------------------------------------------------------------------------- |
| **AngelEye (built)**      | **29** — all 31 minus `WorktreeCreate` (hard) and `MessageDisplay` (opt-in) |
| **`opentelemetry-hooks`** | **11** (`setup.sh:45-50`, `examples/claude-hooks.example.json`)             |
| **`session-observer`**    | **0** (no hooks)                                                            |

The 11: `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `PreCompact`, `PostCompact`, `Stop`.

Not subscribed, and therefore invisible to it: `PostToolBatch`, `StopFailure`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `ConfigChange`, `InstructionsLoaded`, `CwdChanged`, `FileChanged`, `DirectoryAdded`, `Elicitation`, `ElicitationResult`, `PermissionRequest`, `PermissionDenied`, `Setup`, `UserPromptExpansion`, `WorktreeRemove`, `MessageDisplay`.

**AngelEye is ahead here and should not narrow.** The gap is explained by scope: `opentelemetry-hooks` normalises eight different agents (Claude, Codex, Cursor, Copilot, Gemini, Antigravity, OpenCode, Windsurf) to one canonical event model (`otel_hook.py:1286`, `ClaudeEventAdapter` at `:1515`), so it can only subscribe to the intersection of what they all offer. AngelEye is single-target and can afford the full surface.

**No payload field was discovered that AngelEye is missing.** `ClaudeEventAdapter.response_fields` (`otel_hook.py:1517`) is `("last_assistant_message", "response", "assistant_response")` — AngelEye already reads `last_assistant_message` and the staleness review confirmed it populates 191/191. Their `tests/fixtures/contracts/claude.json:8` uses camelCase `lastAssistantMessage`/`stopMessage`, which does **not** match what Claude Code 2.1.235 emits on this machine; AngelEye's snake_case reads are empirically correct and should not be changed to match.

Neither repo found anything comparable to the payload losses the staleness review already logged (`tool_response`, `duration_ms`, `effort`, `prompt_id` — `staleness-review.md#a1-4`, `#a1-6`).

---

## 4. Schema — is OTel's trace/span model a better fit than AngelEye's? · **CONFIRMED**

### What each models

**`opentelemetry-hooks`** maps the agent session onto a genuine OTel trace tree: a `gen_ai.client.session` root span, a generation (turn) span per prompt, and one `gen_ai.client.hook.<event>` child span per event (`otel_hook.py:4900-4923`). It carries W3C trace context properly — `_make_trace_context` builds a real `SpanContext` from hex trace/span IDs (`otel_hook.py:4352`), `_parse_traceparent` / `_resolve_upstream_trace_context` (`:4279`, `:4307`) accept an upstream `traceparent`, and it emits span **links** for agent relationships (`_agent_relationship_links`, `:4457`). It follows OpenTelemetry GenAI semantic conventions (`_apply_genai_semconv`, `:4554`).

**`session-observer`** has its own much lighter tree in `shared/trace-model.js` — spans classified by `callType` into `tool` / `token` / `thinking` / `llm` (`trace-model.js:30-35`), bounds computed from event timestamps (`:45-58`). Derived from JSONL at read time; not OTel, not exported anywhere.

### The turn-correlation question

This is the sharp one, because AngelEye hand-rolls turn correlation in `correlator.service.ts` (untouched since 2026-03-28) while Claude Code has shipped `prompt_id` on 14 hook events since 2026-07-24 (`staleness-review.md#a1-6`).

**`opentelemetry-hooks` does not use `prompt_id` either.** `grep -rn "prompt_id"` across the whole repo returns **zero hits**. Its generation key comes from a Cursor-specific `generation_id` field, falling back to a counter held in a lock-protected session file (`_generation_key_from_data`, `otel_hook.py:3189-3195`; `_new_generation_key`, `:3363-3372`). The docstring is explicit: _"Extract generation key from **Cursor-specific** fields."_

That is the same hand-rolled shape as AngelEye's correlator, with more machinery around it. The repo's last release predates `prompt_id` by two days, so this is a timing artifact rather than a considered rejection — but the conclusion for AngelEye is unchanged: **`prompt_id` is a better key than anything either project has, and adopting it is a decision AngelEye can make on its own evidence.** No external validation available; nobody has done it yet.

### Verdict on schema

**OTel traces/spans are a worse fit for AngelEye than what it already has, with one caveat.**

Against it:

- OTel spans are **immutable once ended**. AngelEye's registry is mutated continuously after the fact — enrichment writes `session_tags`, classification refines `session_class` at `session_end`, backfill repairs old rows. That is a database access pattern, not a tracing one.
- A trace is **write-once, query-by-trace-id**. AngelEye's actual queries are "sessions in project X during week Y matching keyword Z" — which is what `/api/search` and the new `event-index.service.ts` are for.
- Adopting OTel implies an OTLP backend, i.e. the fleet-of-engineers problem. Single-user, local-first, one machine: it is infrastructure with no consumer.

For it:

- The **session → turn → event** three-level hierarchy is right, and AngelEye's flat event stream with a hand-rolled correlator is a weaker expression of the same idea. That is a modelling lesson, not a reason to import OTel.

---

## 5. Storage — what AngelEye's registry gains and gives up · **CONFIRMED**

|                           | Store                                                                          | Consequence                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AngelEye**              | `registry.json` (one JSON object, 18,304 rows) + per-session JSONL + archive   | Mutable, greppable, no daemon. Whole-file rewrite per update — the documented write-race (`known-issues.md#registry-write-race`) came from exactly this, and the fix was to serialise through one queue rather than change the store. |
| **`session-observer`**    | **None.** Parses JSONL per request.                                            | Cannot go stale, cannot corrupt, nothing to back up. Also cannot outlive Claude Code's ~30-day purge, and re-parses on every request.                                                                                                 |
| **`opentelemetry-hooks`** | Ephemeral `.state/` (sessions, batches, locks, health) + a remote OTLP backend | Correct for its problem. The local store is a buffer with a 24 h TTL, not a corpus. Ask it "what did I work on in June" and it has nothing — the backend owns history.                                                                |

**AngelEye gains**: durability past the upstream purge (the archive holds 760 raw JSONLs that no longer exist upstream), mutability for enrichment, and zero infrastructure.

**AngelEye gives up**: concurrent-write safety (bought back with a serialised queue), and indexed query — which the recent `event-index.service.ts` is already addressing.

**Neither repo suggests a change.** `session-observer` has no store to learn from; `opentelemetry-hooks` deliberately does not keep one. A single-user local corpus that must outlive a 30-day purge is a different problem from both, and the JSON+JSONL choice remains defensible.

---

## 6. The find neither repo actually uses — `~/.claude/sessions/*.json` · **CONFIRMED on this machine**

`session-observer/shared/source-adapters.js:26` declares:

```js
metadataSources: ["~/.claude/sessions/*.json"],
```

**The code does not read it.** `grep -rn "metadataSources"` returns 4 hits, all inside `source-adapters.js` itself — the declaration, a spread in `cloneAdapter` (`:38`), and a normalising guard (`:56`). Nothing consumes the array. Its `CLAUDE.md:118` claims _"Session titles come from … Claude Code metadata (`~/.claude/sessions/_.json`)"\* — that is a README claim the implementation does not honour, and it is exactly why this comparison checked.

**But the pointer was worth following.** That path exists on this machine and holds a live session registry Claude Code maintains itself:

```json
{
  "pid": 15481,
  "sessionId": "151c41a7-7942-4c6a-9f49-8e13a2a65feb",
  "cwd": "/Users/davidcruwys/dev/ad/apps/appydave-hackerthons/shape-copilot",
  "startedAt": 1786708104865,
  "procStart": "Fri Aug 14 11:48:20 2026",
  "version": "2.1.229",
  "kind": "interactive",
  "entrypoint": "cli",
  "messagingSocketPath": "/tmp/cc-socks/15481.sock",
  "name": "shape-copilot-80",
  "nameSource": "derived",
  "status": "idle",
  "updatedAt": 1786756819998,
  "statusUpdatedAt": 1786756819998,
  "bridgeSessionId": "session_01Pbem8GJcFsApxpJP5jAoqt"
}
```

Measured now: **16 session files, and all 16 PIDs are still alive** (`kill -0`). Fields observed across them: `pid`, `sessionId`, `cwd`, `startedAt`, `procStart`, `version`, `peerProtocol`, `kind`, `entrypoint`, `messagingSocketPath`, `name`, `nameSource`, `status`, `updatedAt`, `statusUpdatedAt`, `bridgeSessionId`, `nameSince`, `formerNames`. Statuses seen: `idle` (14), `shell` (1), `busy` (1). Versions span 2.1.226 → 2.1.235.

**Why this matters to AngelEye**, against problems already on the books:

| AngelEye problem                                                                                        | What this file gives                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Stale-active sessions where `session_end` never fires (`hooks.ts:271-276` defaults to `dialog` to cope) | `status` + `statusUpdatedAt`, and a `pid` that can be liveness-checked directly |
| Session naming via LLM enrichment                                                                       | `name`, `nameSource`, `nameSince`, `formerNames` — including rename history     |
| Three hand-rolled subagent/subprocess detection mechanisms                                              | `kind` and `entrypoint`, written by Claude Code                                 |
| `bridge-session` entries with no model (`staleness-review.md#a1-8`)                                     | `bridgeSessionId`, the join key                                                 |
| Per-session Claude Code version unknown                                                                 | `version`                                                                       |

It costs nothing to read, needs no hook, and is unaffected by both the dead pipeline and the transport decision. **`grep -rn "\.claude.*sessions" server/src` in AngelEye returns nothing** — this is entirely unexploited.

Caveat, stated because it decides how it can be used: this is a **live registry, not history**. All 16 PIDs are alive, so it appears to cover only running sessions. Whether Claude Code deletes the file at exit or leaves it to be reaped was **not** established — see §9.

---

## 7. What is reusable, and what is a worse fit

**Genuinely reusable**

1. **Delivery-health record + `doctor` command** (`opentelemetry-hooks/otel_hook.py:2198-2264`, `:6020`) — a transparent exporter decorator, a bounded sanitised health file, one CLI to read it. Small, MIT, and aimed squarely at the failure that cost four weeks on M4.
2. **"Clear the buffer only on confirmed success"** (`otel_hook.py:4931-4934`) — a one-line invariant, and the correct one for the Sentinel drain loop. Prior art for a spec gap.
3. **`~/.claude/sessions/*.json`** (§6) — a pointer from `session-observer`, verified independently here.

**A worse fit, and why**

- **OTel traces/spans as AngelEye's schema.** Immutable spans against a store that is mutated by enrichment; a remote backend with no consumer on a single-user machine. §4.
- **A Python per-fire hook.** ~13× the fork cost of a shell command, before doing any work. §2.3(d).
- **Multi-provider canonicalisation** (`ProviderEventAdapter`, `otel_hook.py:1286-1560`). Impressive, and the direct cause of the 11-of-31 coverage ceiling. AngelEye is single-target; adopting the abstraction would buy a constraint and no capability.
- **Read-on-demand with no collection** (`session-observer`). Elegant, and forfeits everything older than the ~30-day purge — which is AngelEye's entire reason to exist.

**Blunt where it applies**: `opentelemetry-hooks` is solving a fleet-of-engineers, ship-to-Datadog problem. Most of it is not evidence AngelEye is wrong. Two mechanisms and a modelling observation are the whole yield from 6,218 lines.

---

## 8. Does either change the plugin design already specced?

**No change to the core decision. One addition.**

| Spec decision                                           | Effect                                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§3 D — spool to disk, Sentinel drains**               | **Unchanged, reinforced.** Independent arrival at disk buffering; its retry depends on the buffer surviving.                                                                                                     |
| **Maildir over append-to-JSONL**                        | **Reinforced.** Their append design pays a per-write lock (`otel_hook.py:3577`); the spec's choice removes it.                                                                                                   |
| **§3 C — circuit breaker rejected**                     | **Reinforced.** The most mature project here implements nothing of the sort.                                                                                                                                     |
| **§2 — versioned plugin over `settings.json` mutation** | **Untouched.** `opentelemetry-hooks/setup.sh` writes `~/.claude/settings.json` directly — the same pattern AngelEye is leaving. Not a counter-example; it ships to eight agents with no plugin system in common. |
| **§1.1 gap 2 — degraded-dependency design**             | **Now has prior art.** §2.3(b) and (c).                                                                                                                                                                          |
| **ADD: capture is not enough; someone must notice**     | New. The spec judges A–D on whether events survive, and D's _"a growing `incoming/` is the down-signal"_ has no named reader. `delivery_health.json` + `doctor` is the shape.                                    |

Two AngelEye-side conclusions the comparison did **not** disturb, both from the staleness review: adopt `prompt_id` for turn correlation (§4 — nobody else has), and stop discarding payloads on `ORIGINAL_EVENTS` (§3 — nobody else found more fields either).

---

## 9. What this comparison did **not** establish

1. **Neither repo was executed.** No `setup.sh`, no `pip install`, no `npm install`, no test suite. Every claim about behaviour is from reading source. The Python startup numbers in §2.3(d) are a **proxy measured with the stock interpreter on this machine**, not a measurement of `otel_hook.py`, whose ~6k lines and OTel SDK imports would make the real figure higher, not lower.

2. **The `.state` retry path was read, not observed.** §2.3(b) traces `_flush_generation_unlocked` → `_force_flush_provider` → conditional `_clear_batch_events`, and the 24 h TTL from `_state_ttl_seconds`. I did not run it against a dead OTLP endpoint. Whether a multi-day outage loses data is **inferred from the cleanup code**, not demonstrated.

3. **`~/.claude/sessions/*.json` is a point-in-time observation.** 16 files, 16 live PIDs, one moment on one machine. I did **not** establish the lifecycle: whether the file is deleted at exit or reaped later, whether subagent or headless sessions get one at all (every observed row was `kind: "interactive"`, which may mean subagents are excluded _or_ merely that none were running), or whether `status` is reliable for a crashed process. All 16 being alive is consistent with both "only live sessions are listed" and "dead ones are cleaned promptly" — those look identical from a single sample. Before AngelEye depends on it, watch a session start and exit.

4. **Coverage claims are about the shipped examples.** The 11 events come from `setup.sh:45-50` and `examples/claude-hooks.example.json`. A user could wire `otel-hook` to more events by hand; whether `otel_hook.py` would handle them meaningfully was not tested.

5. **No repo history was reviewed.** Both were cloned `--depth 50`. Design rationale in older commits, issues, or PRs was not read — so "they never considered X" is never claimed, only "X is absent at this ref".

6. **`session-observer`'s frontend was not reviewed.** 88 JS/JSX files under `src/` were skipped as out of scope; the comparison covers `server.js` and `shared/` only. If there is a UI idea worth taking, this pass would not have found it.

---

## 10. Verdicts

| Repo                               | Verdict                                      | One line                                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`Ax-For/session-observer`**      | **Steal an idea**                            | No collection layer to learn from, but it pointed at `~/.claude/sessions/*.json` — a live session registry with `status`, `name`, `kind` and `bridgeSessionId` that AngelEye does not read (and neither, in the end, does it). |
| **`o11y-dev/opentelemetry-hooks`** | **Steal two ideas, ignore the architecture** | Take clear-buffer-only-on-confirmed-success and the delivery-health + `doctor` pattern; leave the OTel span model, the Python per-fire cost, and the 11-of-31 coverage ceiling.                                                |

**Plugin design**: unchanged. Option D survives contact, and the maildir choice is now evidence-backed rather than merely reasoned. The single addition is a liveness/health channel so that going dark is loud.

---

## Related

- `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md` — the plugin + Sentinel spec this compares against
- `docs/architecture/staleness-review.md` — platform drift; §A1-1 (dead pipeline), §A1-6 (`prompt_id`), §A1-8 (`bridge-session`)
- `docs/architecture/hook-transport.md` — the current curl transport and why HTTP hooks were rejected in May
- `~/dev/ad/brains/security/scan-log.md` — the injection scan for both repos
