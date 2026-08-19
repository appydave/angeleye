---
id: req-2026-07-25-collection-layer
title: The collection layer — an AngelEye plugin that survives a dead server, and the Sentinel it feeds
category: ingestion
status: open
created_at: 2026-07-25T18:40:00+07:00
supersedes_partially: req-2026-06-08-angelsentinel-split (transport + install mechanics only; the split itself stands)
evidence_sources:
  - ~/dev/ad/brains/anthropic-claude/claude-code/plugins/ (manifest + hooks wrapper contract, v2.1.220)
  - ~/dev/ad/brains/anthropic-claude/claude-code/hooks/ (31-event canonical spec)
  - ~/dev/ad/apps/appysentinel (Sentinel boilerplate — published, recipes exist)
  - ~/dev/ad/apps/angeleye/docs/requirements/angelsentinel-split-spec-2026-06-08.md
  - live fleet audit 2026-07-25 (Roamy + M4 Mini)
  - ~/dev/ad/apps/angeleye/docs/architecture/collection-layer-comparison.md (external prior art, 2026-08-19)
requested_by: david
---

> **Scope.** Design-and-prep document. **Nothing here is implemented.** Claims are tagged
> `verified(path)` / `inference` / `unknown`. §6 records the decisions — **Q2 and Q3 were settled by
> David on 2026-07-25**; Q1 (transport) is leaning spool with the discussion open.

> **Update 2026-08-19 — checked against external prior art.**
> `docs/architecture/collection-layer-comparison.md` compares this design against
> [`o11y-dev/opentelemetry-hooks`](https://github.com/o11y-dev/opentelemetry-hooks) (hook-transport
> machinery, MIT) and [`Ax-For/session-observer`](https://github.com/Ax-For/session-observer) (MIT).
> **Nothing here changed.** §3 option D (spool to disk) is reinforced — the mature project in this
> space independently arrived at disk buffering, and its retry loop depends on the buffer surviving a
> failed export. The maildir-over-append choice is now evidence-backed: their append design pays a
> per-write lock this design avoids. The rejected circuit breaker (§3 C) appears nowhere.
> **One addition to make**, from `otel_hook.py`'s `_DiagnosticExporter` + `doctor` command: §3 judges
> options on whether events _survive_, and D's "a growing `incoming/` is the down-signal" never names
> who reads it. A bounded delivery-health record plus one status command is the missing piece — it is
> the direct fix for the four-week M4 blackout, and it is orthogonal to the spool decision.
> The comparison also surfaced `~/.claude/sessions/*.json` — a live session registry Claude Code
> maintains itself (`status`, `name`, `kind`, `pid`, `bridgeSessionId`) that AngelEye does not read
> and that needs no hook at all.

---

## 0. TL;DR

Three problems, one root cause. **AngelEye's collection layer is glued to two things it should not depend on: the user's `settings.json`, and a dashboard process.**

| Symptom                                               | Root cause                                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| M4 Mini dark for ~4 weeks, silently                   | Collection lives in the dashboard process; no daemon; nothing notices                   |
| M4 had **zero** hooks registered                      | Install is a machine-local skill mutating `settings.json`; no versioning, no fleet sync |
| Dead server = 29 curl forks into the void per session | Transport assumes a live listener; `\|\| true` converts failure into silence            |

**The shape being proposed:**

```
  Claude Code session
        │  hooks declared by a VERSIONED PLUGIN (not a skill mutating settings.json)
        ▼
  local spool  ──────────────────────────────┐   ← capture cannot fail; no server in the hot path
        │                                    │
        ▼ (fsevents drain)                   │
  AngelSentinel  (launchd, always-on)        │   ← owns the store; restartable with zero loss
        │                                    │
        ├── read API ──▶ AngelEye (viewer)   │   ← ingestion here gets DEPRECATED
        └── deliver ────▶ (fleet, later)  ◀──┘   ← centralised storage plugs in here
```

The single most important property: **"is the server up?" stops being a question the hook has to answer.**

---

## 1. What our brains already know about plugins

Good news — this is well covered. `~/dev/ad/brains/anthropic-claude/claude-code/plugins/` is a full vendored spec (contract + machine schema + curated layer), verified to v2.1.220.

**The facts that decide this design:**

| Fact                                                                                                                             | Source                                                 | Why it matters here                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| A plugin ships `hooks/hooks.json` — **identical shape to `settings.json` hooks**                                                 | verified(`plugins/manifest-reference.md` §3)           | Our 29 hook entries port over as-is. No rewrite.                                                                                |
| Plugin hooks **merge** with user hooks and **cannot be overridden from `settings.json`** — you disable the plugin to remove them | verified(`plugins/manifest-reference.md` §3)           | Clean lifecycle. `/plugin disable` is a real off-switch. No more orphaned entries.                                              |
| `plugin.json` is **optional** — default folders are auto-discovered                                                              | verified(`plugins/INDEX.md`)                           | Minimal plugin = a `hooks/` dir.                                                                                                |
| A malformed `hooks/hooks.json` blocks the **ENTIRE plugin**                                                                      | verified(`plugins/patterns.md`)                        | ⚠️ Must gate on `claude plugin validate --strict` in CI.                                                                        |
| `userConfig` prompts at enable-time; values reach hooks as `${user_config.KEY}` **and** as `CLAUDE_PLUGIN_OPTION_<KEY>` env vars | verified(`plugins/manifest-reference.md` §1.3)         | This is our endpoint/spool-dir configuration. Solves the hardcoded `localhost:5051`.                                            |
| ⚠️ `${user_config.*}` is **REJECTED in shell-form** hook commands since v2.1.207                                                 | verified(`claude-code/claude-code-recent-features.md`) | **The trap.** Our hooks are shell-form curl strings today. Fix: exec form (`args` array) or read the env var inside the script. |
| `${CLAUDE_PLUGIN_ROOT}` resolves the plugin dir in hook commands                                                                 | verified(`plugins/manifest-reference.md` §4)           | How the bundled script is located.                                                                                              |
| Editing a plugin's `hooks.json` needs **`/reload-plugins`** (not live-reload)                                                    | verified(`plugins/component-guide.md`)                 | Rollout note.                                                                                                                   |
| Marketplace distribution + git SHA pinning + `enabledPlugins` per scope                                                          | verified(`plugins/distribution-reference.md`)          | This is the fleet-sync fix.                                                                                                     |

### 1.1 The gaps — what the brains do NOT cover

Found while researching this. These are real holes, not nitpicks:

1. **No guidance on hook fan-out cost.** Nothing anywhere quantifies "you registered 29 hooks; `PreToolUse`+`PostToolUse` fire per tool call; a long session is hundreds of subprocess spawns." The hooks brain treats hooks as individually cheap and never addresses the aggregate. AngelEye is the fleet's heaviest hook consumer and this was never costed. `inference`

2. **Nothing on degraded-dependency hook design.** `hooks/patterns.md` has recipes and anti-patterns but says nothing about _"what should a hook do when the thing it talks to is down."_ That's the entire subject of §3 below, and it is generic knowledge — it belongs in the brain, not buried in an AngelEye doc. **✅ DONE 2026-07-25** — added as "Degraded dependencies" in `hooks/patterns.md`, carrying the measurements from §3 so the next reader gets the numbers, not the opinion.

3. **`userConfig` × shell-form restriction is not connected.** The brain has both facts (`plugins/manifest-reference.md` §1.3, and the v2.1.207 changelog entry) but never joins them into "if you want configurable hooks, you cannot use shell form." Anyone building a configurable hook plugin walks into it. **✅ DONE 2026-07-25** — cross-linked in `plugins/manifest-reference.md` §1.3 with the three ways through (read `$CLAUDE_PLUGIN_OPTION_*` inside the script being the cleanest, and the _only_ route for `sensitive` values).

4. **`bin/` PATH scope is ambiguous for hooks.** The brain says `bin/` executables are "added to the **Bash tool's** PATH". It does **not** say whether hook subprocesses inherit that PATH. `unknown` — so this design uses explicit `${CLAUDE_PLUGIN_ROOT}/bin/…` paths and never relies on bare-name resolution. Worth confirming and recording either way.

5. **No plugin-side service/daemon concept.** A plugin can ship executables and hooks; it has no notion of "install a launchd service." `verified(absence in plugins/manifest-reference.md)`. So daemonisation is the Sentinel's job, not the plugin's — they're separate installs. Worth stating explicitly because it's a natural thing to assume otherwise.

---

## 2. The AngelEye collection plugin

### 2.1 What it replaces

The `angeleye-install` skill currently hand-rolls what the plugin system does natively:

| Install skill does                                           | Plugin gives free                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Reads/merges/writes `~/.claude/settings.json`                | Declarative `hooks/hooks.json`, no user-file mutation            |
| Substring-matches `localhost:5051` to find "its own" entries | Ownership is structural — plugin hooks are separately namespaced |
| Hand-maintained fallback event list that silently goes stale | Versioned artifact, reviewed in a diff                           |
| Lives at `~/.claude/skills/…`, **not in git**, per machine   | Marketplace + SHA pinning → one source, all machines             |
| Uninstall = another skill run                                | `/plugin disable angeleye-collect`                               |

That last row is the M4 story: the skill was never run there, and nothing could tell.

### 2.2 The one real tradeoff: static hook list

Today the skill asks the server `GET /api/hooks/supported` and wires whatever it says. **A plugin's `hooks.json` is static** — it cannot ask anything at load time. `verified(plugins/manifest-reference.md §3)`

This looks like a regression. It isn't:

> The current design makes a **server** the source of truth for **client** configuration. That is precisely why M4 drifted — nothing reconciled the two, and no one could see the gap.

Invert it: **the plugin declares, the Sentinel validates.**

- Plugin ships the event list as a versioned artifact.
- Sentinel keeps `/api/hooks/supported` and gains a reconciliation check: _"plugin v1.2.0 declares 29 events; I support 31; you are 2 behind — `DirectoryAdded`, `MessageDisplay`."_
- Drift becomes **visible and reportable** instead of silent.

That check is also the natural home for a liveness/coverage warning surfaced in the AngelEye UI.

### 2.3 Shape

```
angeleye-collect/                     ← plugin name; own repo or a dir in an appydave marketplace
├── .claude-plugin/
│   └── plugin.json                   ← metadata + userConfig  (optional otherwise)
├── hooks/
│   └── hooks.json                    ← 29 entries, one per registered event
└── bin/
    └── angel-capture                 ← the ONE script every hook calls
```

`plugin.json` sketch — `userConfig` is what kills the hardcoded endpoint:

```json
{
  "name": "angeleye-collect",
  "description": "Capture Claude Code session telemetry for AngelSentinel.",
  "version": "0.1.0",
  "userConfig": {
    "spool_dir": {
      "type": "directory",
      "title": "Spool directory",
      "description": "Where hook events are written before the Sentinel drains them.",
      "default": "~/.claude/angeleye/spool"
    },
    "machine_id": {
      "type": "string",
      "title": "Machine name",
      "description": "Tags every event. Required for fleet-wide storage later.",
      "required": true
    }
  }
}
```

`hooks/hooks.json` — one entry per event, **exec form**, so `${CLAUDE_PLUGIN_ROOT}` passes as a single argument and we stay clear of the v2.1.207 shell-form restriction:

```json
{
  "description": "AngelEye session telemetry capture",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/bin/angel-capture",
            "args": ["PreToolUse"]
          }
        ]
      }
    ]
  }
}
```

`angel-capture` reads `CLAUDE_PLUGIN_OPTION_SPOOL_DIR` / `CLAUDE_PLUGIN_OPTION_MACHINE_ID` from its
environment rather than interpolating `${user_config.*}` into a command string — which sidesteps the
restriction entirely instead of tiptoeing around it. `inference`

**Still excluded** (unchanged, and the reasons still hold): `WorktreeCreate` (hard — Claude Code reads
hook stdout as the worktree path), `MessageDisplay` (soft — per-render volume).

---

## 3. Safe degrade — the decision that matters

> _"You don't want hooks running and pointing at a server that's dead."_

Four options. One is a trap and one is the answer.

### ⏱ Measured first — the numbers change the argument

Benchmarked on Roamy (base M4), 50 iterations each, against the live AngelEye server. `verified(2026-07-25)`

| Hook body                     | Cost per fire                                  |
| ----------------------------- | ---------------------------------------------- |
| bare fork (`/bin/echo`)       | **1.67 ms** ← the floor for any `command` hook |
| write one file (`cat > file`) | **2.16 ms**                                    |
| `curl` → **live** server      | **51 ms** ⚠️                                   |
| `curl` → **dead** port        | **6.5 ms**                                     |

Two things fall out of this, and both were counter to my prior assumptions:

1. **A live server costs ~8× a dead one.** `curl`'s own write-out: `connect=0.26 ms, total=48.6 ms`. The connection is instant; **~48 ms is the server doing synchronous work** — registry read/update, JSONL write, session-class resolution, socket broadcast — while the session waits.
2. **The fork is the floor, not the network.** A dead port costs 6.5 ms, of which ~1.7 ms is the fork. So skipping the request when the server is known-down saves ~5 ms. That kills option C below.

**Sized against real sessions** (195 sampled from the live store): median 30 events, p90 314, max 1648.

|        | events | @51 ms (today) | @2.2 ms (spool) |
| ------ | -----: | -------------: | --------------: |
| median |     30 |          1.5 s |           0.1 s |
| p90    |    314 |       **16 s** |           0.7 s |
| max    |   1648 |       **84 s** |           3.6 s |

Your heaviest sessions are paying well over a minute of wall-clock to the collector. That is a
latency problem that exists **right now, while the server is healthy** — entirely separate from the
resilience problem this section set out to solve.

### A. Today — `curl … || true`

Forks curl per event; `|| true` swallows every failure. **51 ms/fire against a healthy server.**
**The harm when it's down is not latency — it is silence.** You go dark and nothing tells you. That is what cost four weeks on M4.

### B. Native `http` hook type

No subprocess; Claude Code owns the request and **surfaces transport errors** — so it is not silent.
But `SessionStart` cannot use it (`command`/`mcp_tool` only, `verified(code.claude.com/docs/en/hooks)`), so it can never be the whole answer; and the errors it surfaces are user-facing noise when the Sentinel is intentionally off.

### C. Circuit breaker in a wrapper script — ⚠️ **the trap**

Tempting: script checks a breaker file, exits early when the Sentinel is known-dead.
**Measured saving: ~5 ms of a 6.5 ms dead-port call** — you still pay the 1.67 ms fork, and the failed connect to localhost was already instant. You'd buy complexity and a staleness bug (how long is the breaker good for?) to avoid a cost that barely exists. **Do not build this.**

### C2. Make the receiver answer immediately — worth doing _regardless_

Independent of transport: the server currently does its whole job before responding. Answering
`202` and doing the work off the response path takes **51 ms → ~6.5 ms** without touching a single
hook. If the spool decision stalls for any reason, **this one still stands on its own** and is the
cheapest win available.

### D. Spool to disk; Sentinel drains — ✅ **recommended**

The hook writes the event to a local file. The Sentinel watches the spool and drains it. **No network in the hot path at all.**

Use the maildir pattern — **one file per fire**, written to a temp name then `rename`d:

```
$SPOOL/incoming/<uuid>.json      ← atomic via write-then-rename
```

Why this wins:

| Property                                               | Effect                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Capture cannot fail**                                | Sentinel down / restarting / mid-upgrade / not yet installed → events still captured. The M4 failure class stops existing.                                                           |
| **Zero-loss restarts**                                 | You will iterate on this daemon a lot. Every restart currently loses whatever fired during it.                                                                                       |
| **Cheaper than curl**                                  | One `cat`-class fork, no connect, no HTTP.                                                                                                                                           |
| **Atomic by construction**                             | `rename(2)` is atomic; a half-written file is never visible under `incoming/`. No torn reads, no JSONL delimiter problem, no concurrent-append contention between parallel sessions. |
| **Sidesteps a question we'd otherwise have to answer** | One-file-per-fire means we never need to know whether Claude Code's hook stdin is compact or pretty-printed JSON. `unknown`, and now irrelevant.                                     |
| **Forward-compatible with fleet storage**              | Files are trivially shippable. Centralised storage becomes a Deliver-zone recipe reading the same spool.                                                                             |
| **Backpressure is visible**                            | A growing `incoming/` _is_ the "Sentinel is down" signal — monitorable, alertable, and self-healing on restart.                                                                      |

**Real-time is preserved**: the Sentinel watches `incoming/` with fsevents and drains on change — sub-100ms in practice, well inside dashboard tolerance. `inference`

**Costs, honestly:**

- Diverges from AppySentinel's blessed `hook-receiver` recipe, which is HTTP (`verified(appysentinel/docs/appysentinel-spec.md §358)`). A `spool-watcher` collect recipe would be new — though file-watching is already a first-class Collect pattern there, so this is within the grain, not against it.
- Two moving parts (writer, drainer) instead of one request. Mitigated by both being trivial.
- Needs a spool retention/janitor policy so a permanently-dead Sentinel can't fill the disk. **Must be specified before build.**

**Bonus, worth testing but do not assume:** with spooling the hook writes nothing to stdout, which is what made `WorktreeCreate` dangerous under curl (Claude Code read the curl response body as a worktree path). Whether an empty stdout makes `WorktreeCreate` _safe_ is `unknown` — test it deliberately, don't infer it.

**Also available and orthogonal:** command hooks support `"async": true` (`verified(hooks/configuration-reference.md §1)`), which takes the hook off the session's critical path entirely. Whether an async hook still receives stdin is `unknown` — verify before relying on it.

---

## 4. Sentinel compatibility

AppySentinel is further along than the June split spec assumed — this materially changes the build-vs-carve recommendation:

|                               | State (2026-07-25)                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `create-appysentinel`         | **published, v0.2.3** `verified(npm)`                                                            |
| `@appydave/appysentinel-core` | **published, v0.4.0** `verified(npm)`                                                            |
| `hook-receiver` recipe        | exists — documented as _"(AngelEye pattern)"_ `verified(appysentinel/docs/appysentinel-spec.md)` |
| `jsonl-store` recipe          | exists — documented as _"(AngelEye / FliHub pattern)"_ `verified(same)`                          |
| launchd service installer     | exists — `packages/template/scripts/{install-service.sh,launchd.plist}` `verified`               |
| Forensic analysis of AngelEye | already written — `appysentinel/docs/forensic-angeleye.md` `verified`                            |

The recipes AngelSentinel needs were **derived from AngelEye in the first place**. The June spec recommended carving out of existing code partly because the boilerplate wasn't ready. It is now.

AppySentinel's README states the thesis in our exact words:

> _"every project conflated data collection with the dashboard that displayed it. When the dashboard was down, collection stopped. … AppyRadar, AngelEye, and FliHub all hit this wall in different ways."_

**Port:** Sentinel range is `5082+` (increment 10 per Sentinel), registered in `~/.config/appydave/apps.json`. **5082 is free and there are no Sentinel entries registered yet** `verified(2026-07-25)`. Reserve it before building.

⚠️ **Broken path in the June spec:** it references `~/dev/ad/apps/appysentinal` throughout. The real path is **`appysentinel`** (`-el`, not `-al`). Every `evidence_sources` line and cross-reference in that document points at a directory that does not exist.

### 4.1 Deprecating AngelEye's ingestion

Phased, each phase independently shippable and reversible:

| Phase             | AngelEye                               | AngelSentinel                               | Plugin              |
| ----------------- | -------------------------------------- | ------------------------------------------- | ------------------- |
| **0 — today**     | ingests, stores, classifies, displays  | —                                           | — (install skill)   |
| **1 — parallel**  | unchanged                              | stands up, drains spool, owns its own store | ships; writes spool |
| **2 — invert**    | reads from Sentinel API; stops writing | sole writer                                 | unchanged           |
| **3 — deprecate** | `/hooks/*` → `410 Gone` + pointer      | unchanged                                   | unchanged           |

Phase 1 is safe because the two capture paths are independent — the spool does not disturb the existing curl hooks, so both can run until you trust the new one.

---

## 5. Centralised hook storage — what to do _now_

Not wanted today; cheap to stay compatible if we do three things at build time:

1. **Tag every event with `machine` at capture** — not at read. AppySentinel's Signal envelope already carries `machine` + `sentinel_id`; match it. Retrofitting machine identity onto historical events is guesswork.
2. **Never hardcode an endpoint in the plugin** — `userConfig` from day one, even while the only value is a local path.
3. **Keep the spool the seam.** Centralised storage becomes a Deliver-zone recipe that reads the same spool the local Sentinel drains. No plugin change, no hook change, no re-install across the fleet.

Nothing else is needed. Deliberately not designing the fleet layer.

---

## 6. Decisions — resolved 2026-07-25 unless marked open

**Q1 — Transport: spool or HTTP? → LEANING SPOOL, discussion open.**
David: _"Happy to go with it. I'm not wedded to HTTP."_ The measurements above strengthen the case
well beyond resilience — spool is ~23× cheaper per fire than the current path. Remaining question is
whether to ALSO do C2 (fast receiver) so the HTTP path stays viable as a fallback. **Recommend: yes,
do C2 anyway** — it is independent, cheap, and de-risks the spool work.

**Q2 — Does the Sentinel classify, or only capture? → ✅ CAPTURE ONLY.**
David, on what AngelEye is actually for:

> _"AngelEye just captures… there's no real business intelligence. It's just bringing together stuff
> you don't currently get with sessions that are longer term (so greater than 30 days) and the hooks
> as they fire."_

That settles it. The product is **long-term retention + aggregation**, not interpretation — Claude
Code's own session history ages out, and this is the durable record. So:

- **AngelSentinel = capture + retain + serve.** No interpretation on the ingest path.
- Classification/correlation are _"other stuff we might do later"_ — they stay in AngelEye and can run
  at read time. They are explicitly **not load-bearing**, which removes the entanglement that made
  this question hard.
- The June spec's placement of `session-class.service.ts` in the Sentinel should be **revisited** on
  this basis — it is interpretation, and it currently runs synchronously on the ingest path (part of
  the measured 48 ms).

**Q3 — Scaffold fresh or carve out? → ✅ TWO APPS, SENTINEL IS NEW.**
David: _"AngelEye was the old application, and it will probably still exist as an application, just
without all the internal receiving of hooks. And then… AngelEye Sentinel, which is what you would be
creating."_ Confirms the June naming and settles the build path: **AngelSentinel is a new app**
(scaffolded from `create-appysentinel`, which now exists); **AngelEye persists as the viewer**, losing
only its ingestion.

---

## 6b. Still open

**Spool retention / janitor policy.** The one way the recommended design can hurt you: a permanently
dead Sentinel fills the disk. Needs a cap + eviction rule before build. Not hard, must not be skipped.

**Does `async: true` still deliver stdin?** `unknown`. If yes, it takes hooks off the critical path
entirely and composes with either transport. Test early — it is cheap and could make the latency
question moot.

**Does an empty stdout make `WorktreeCreate` safe to register?** `unknown`. Spooling writes nothing to
stdout, which is what made it dangerous under curl. Test deliberately; do not infer.

---

## 7. Explicitly NOT decided here

Repo layout, workspace-vs-standalone, build tooling, and the AngelEye read-API surface. Those follow from Q1–Q3 and shouldn't be front-loaded. Spool retention/janitor policy is deferred to build but **must not be skipped** — it is the one way the recommended design can hurt you.
