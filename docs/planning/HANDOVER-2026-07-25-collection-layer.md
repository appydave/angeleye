# Handover — 2026-07-25 — collection layer / AngelSentinel

**Read this first if you're picking up cold.** Self-contained. Absolute paths throughout. No chat access needed.

---

## 1. Where things stand

Everything is committed and pushed. **Nothing is lost if this conversation closes.** Six repos touched: `brains`, `angeleye`, `dark-factory`, `switchboard`, `appydave-plugins`, `kiros-sentinal` — all clean, all pushed to `origin/main`.

Two pre-existing uncommitted files were deliberately left alone (not from this work): `switchboard/.env.example`, `kiros-sentinal/node_modules/.bin/esbuild`.

### The one live risk

**The AngelEye collector on M4 Mini is running under `nohup npm run dev -w server` — it will NOT survive a reboot.** There is no launchd service (that's the whole point of §5 of the split spec). M4 was unreachable over Tailscale at the end of this session (asleep or off-tailnet), so its state is **unverified**.

Restart on M4 if needed:

```bash
ssh davidcruwys@100.82.235.39
cd ~/dev/ad/apps/angeleye && nohup npm run dev -w server > ~/.claude/angeleye/server-dev.log 2>&1 &
```

Health check either machine — **check BOTH, "installed" ≠ "collecting"**:

```bash
curl -s localhost:5051/api/hooks/supported    # expect 31 events / 29 registered
python3 -c "import json,os;h=json.load(open(os.path.expanduser('~/.claude/settings.json')))['hooks'];print(len([e for e,g in h.items() if any('5051' in (k.get('command','')+k.get('url','')) for gg in g for k in gg.get('hooks',[]))]))"   # expect 29
```

---

## 2. What got done

|                                             |                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Brain refreshed** to Claude Code v2.1.220 | Opus 5 + `DirectoryAdded` (31st hook event). Docs page still says 30 — the shipped binary's `HOOK_EVENT_REGISTRY` is the tie-breaker, now recorded in the refresh manifest.                                                                                                                                        |
| **`DirectoryAdded` ingested** by AngelEye   | `EVENT_MAP` + type union + tests + install skill + both machines' `settings.json`. Verified end-to-end against the live server. 56 tests pass.                                                                                                                                                                     |
| **HTTP-transport rejection overturned**     | The 2026-05-13 "SessionStart drops under HTTP" was **not a defect** — `SessionStart` only accepts `command`/`mcp_tool`. There is no upstream fix to wait for. A hybrid was always available. `docs/architecture/hook-transport.md` corrected, incl. its migration script, which would have re-broken SessionStart. |
| **Collection layer specced**                | `docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md`                                                                                                                                                                                                                                             |
| **Two brain gaps closed**                   | `hooks/patterns.md` → "Degraded dependencies" (with measurements); `plugins/manifest-reference.md` §1.3 → `userConfig` × shell-form restriction.                                                                                                                                                                   |
| **`appysentinal` → `appysentinel`**         | 12 dangling paths + a 404ing GitHub URL across 5 repos. Historical session-name tags deliberately left.                                                                                                                                                                                                            |
| **M4 recovered**                            | Was dark ~4 weeks _and_ had **zero** hooks registered. Collector restarted, 29 hooks wired, `buggered` hook removed.                                                                                                                                                                                               |

---

## 3. The measurements that should drive the next decision

Benchmarked on Roamy (base M4), 50 iterations, against the live server:

| Hook body                  |  ms/fire |
| -------------------------- | -------: |
| bare fork (`/bin/echo`)    |     1.67 |
| write one file (spool)     | **2.16** |
| `curl` → **live** AngelEye |   **51** |
| `curl` → dead port         |      6.5 |

`curl` write-out: `connect=0.26ms, total=48.6ms`. **~48ms of every hook fire is the server doing synchronous work while the session blocks.** Across 195 real sessions (median 30 events, p90 314, max 1648) that is **1.5s / 16s / 84s** of added session latency.

**This is a latency problem that exists right now, with the server healthy** — separate from the resilience problem.

---

## 4. Decisions locked (do not re-litigate)

- **Sentinel captures only — no interpretation on the ingest path.** David: _"no real business intelligence… bringing together stuff you don't get with sessions longer term (>30 days) and the hooks as they fire."_ The product is **long-term retention**. ⚠️ Follow-on: `session-class.service.ts` runs synchronously on ingest and IS interpretation — revisit its placement.
- **Two apps.** AngelSentinel is **new** (scaffold from `create-appysentinel`, published v0.2.3, core v0.4.0). AngelEye persists as the **viewer**, losing only ingestion.
- **Transport: spool, leaning strongly.** David: _"Happy to go with it. I'm not wedded to HTTP."_ Now backed by measurement (~23× cheaper) as well as resilience.
- **Do NOT build a circuit breaker.** Measured saving ~5ms of a 6.5ms call. Written up as an anti-pattern.

---

## 5. Next work, in recommended order

**① Daemonise the collector — do this first.**
Smallest piece, and it's the one actively costing data. Template exists: `~/dev/ad/apps/appysentinel/packages/template/scripts/{install-service.sh,launchd.plist}`. Does **not** require the Sentinel split — it can wrap today's server. Stops the bleeding on both machines.

**② Make the receiver answer immediately (202 + work off the response path).**
**51ms → ~6.5ms with zero hook changes.** Independent of every other decision, and it de-risks ③ by keeping HTTP viable as a fallback.

**③ Spec the AngelSentinel build.**
`create-appysentinel` scaffold + recipes. Note the recipes were derived from AngelEye: `hook-receiver` is documented as _"(AngelEye pattern)"_, `jsonl-store` as _"(AngelEye / FliHub pattern)"_. Prior forensic analysis already written at `~/dev/ad/apps/appysentinel/docs/forensic-angeleye.md`. **Port 5082 is free; no Sentinel is registered in `~/.config/appydave/apps.json` yet — reserve it.**

**④ Spec the `angeleye-collect` plugin.**
Shape is in §2.3 of the collection-layer spec. Kills the machine-local install skill (which is **not in git** — that's why M4 drifted).

### Must not be skipped

**Spool retention / janitor policy.** The one way the recommended design can hurt you: a permanently dead Sentinel fills the disk. Needs a size cap + eviction rule. _Recommendation: cap by age (e.g. 7 days) AND count, evict oldest, log evictions loudly — a silent eviction reproduces the exact failure mode we're fixing._

### Cheap unknowns — test early, they may simplify things

- Does `"async": true` still deliver stdin? If yes it takes hooks off the critical path entirely and composes with either transport.
- Does empty stdout make `WorktreeCreate` safe to register? Spooling writes nothing to stdout, which is what made it dangerous under curl. **Test deliberately — do not infer.**
- Do `Setup` / `SubagentStart` / `TaskCreated` really reject `http`? The brain's matrix says yes; the docs page only states it for `SessionStart`. Keep all four on `command` until tested.

---

## 6. Key paths

```
~/dev/ad/apps/angeleye/docs/requirements/collection-layer-plugin-and-sentinel-2026-07-25.md   ← the spec
~/dev/ad/apps/angeleye/docs/requirements/angelsentinel-split-spec-2026-06-08.md               ← June split (Q2/Q3 now answered)
~/dev/ad/apps/angeleye/docs/architecture/hook-transport.md                                    ← corrected diagnosis + hybrid
~/dev/ad/apps/appysentinel/                                                                   ← boilerplate (note: -el, not -al)
~/dev/ad/apps/appysentinel/docs/forensic-angeleye.md                                          ← prior analysis of AngelEye
~/dev/ad/brains/anthropic-claude/claude-code/hooks/                                           ← 31-event canonical spec
~/.claude/skills/angeleye-install/SKILL.md                                                    ← ⚠️ NOT in git, machine-local
```

---

## 7. Nothing is blocked on David

No open question prevents ①–④ from being written. Every decision needed to start is either locked in §4 or has a stated recommendation in §5.
