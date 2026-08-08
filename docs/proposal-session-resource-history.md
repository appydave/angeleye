# Proposal — Session Resource History

**Status**: proposed, 2026-08-07. Nothing built.
**Origin**: a 3-day disk investigation on mac-mini-m4 that concluded the disk was never the problem —
the machine was un-rebootable because ~34 live sessions each cost a manual rescue. Swap grew
unbounded as a result. A reboot then returned ~50 GiB in seconds, against ~29 GiB from three days of
cleanup.
**Related**: `/Users/davidcruwys/dev/ad/brains/mac-os/handover-disk-space-2026-08-06.md` §_Reopened
2026-08-07_, and `/Users/davidcruwys/dev/ad/apps/appyradar-sentinal/docs/proposal-drift-detection.md`
(the sibling proposal, whose facts/findings split this mirrors).

---

## ⚠️ Read before designing against this

**AngelEye's internals were observed only from the outside during unrelated disk work.** The file
layout below was read with `ls`; nothing in AngelEye's source was examined and no maintainer was
consulted.

- **Observed** (verified by listing `/Users/davidcruwys/.claude/angeleye/`): `registry.json`,
  `sessions/`, `raw-transcripts/`, `archive/`, `enrichments/` + `enrichments.jsonl`,
  `event-index.tsv` + `event-index.meta.json`, `workspaces.json`, `workflows.json`,
  `affinity-groups.json`, `audit/`, `diagnostics-snapshot.json`, `last-sync.json`, `preferences.json`,
  `schema-observations.jsonl`, and ~12 dated `registry.json.bak-*` files.
- **Observed**: `registry.json` parses as a collection of **~2,088 sessions**.
- **ASSUMED, NOT VERIFIED**: that the registry is keyed by session id; that sessions carry a `cwd`;
  that there is an ingest path a sampler could write to; that `event-index.tsv` is append-only; that
  enrichment runs on a schedule.

**Whoever builds this must verify all of the above first.** If the registry's shape differs, the
reconciliation step in §3 is the part that changes.

---

## Problem

Three distinct populations of Claude session run on this machine, and **nothing sees all three**:

1. **Terminal sessions** David launched — visible to him, but only while the terminal is open.
2. **Machine-spawned sessions** — KyberAgent, Buzz harness agents, `.od/projects` jobs, Captain's Log
   enrichment. **These respawn themselves and David does not know they exist.**
3. **Closed sessions** — gone from `ps` entirely, but they ran, and they are what he asks about
   ("what was I doing 30 or 40 sessions ago").

Consequences, all observed:

- **Memory has no owner.** 30.06 GB across all processes, and no way to attribute it.
- **Reboot cost is unknown until you try.** The blocker was "~34 sessions to rescue" — a number
  nobody had until a crash forced a manual reconstruction.
- **A crash report had to be rebuilt by hand** from transcript timestamps, because no system retained
  what had been running.

---

## What is measured versus inferred

Everything in this table was **measured on 2026-08-07**, not assumed.

| Signal                              | Source                                                | Confidence                                                                   |
| ----------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| **`tty == "??"` ⇒ machine-spawned** | `ps -o tty=`                                          | **Measured.** The discriminator that makes population 2 visible              |
| **Session name**                    | `argv`, `-n <name>` (e.g. `-n kbde-swag`)             | **Measured.** Present only on launch-line sessions; ad-hoc `claude` has none |
| **Terminal pane**                   | `ITERM_SESSION_ID` / `TERM_SESSION_ID` in process env | **Measured**                                                                 |
| `cwd`                               | `lsof -a -p <pid> -d cwd`                             | **Measured**                                                                 |
| `rss`, start time, tty              | `ps -o rss=,lstart=,tty=`                             | **Measured**                                                                 |
| Session id of a running process     | —                                                     | ⚠️ **NOT AVAILABLE.** See below                                              |

### ⚠️ There is no exact process → session-id join

A `claude` process **does not hold its transcript `.jsonl` open**. `lsof` on a live process returns
no session file. This was tested directly.

The available join is **`cwd` + `tty` + start time**, which is **correlational**. Two sessions started
in the same directory within the same minute cannot be distinguished. **Design for a probabilistic
match with an explicit confidence field — do not model it as a foreign key.**

### ⚠️ Node costs nearly twice what Claude does

|                                     |   Procs |      Memory |
| ----------------------------------- | ------: | ----------: |
| Interactive `claude` (has a tty)    |       8 |     3.49 GB |
| Machine-spawned `claude` (`tty ??`) |       2 |     0.65 GB |
| **`node`**                          | **122** | **6.32 GB** |
| All processes                       |         |    30.06 GB |

Those `node` processes are MCP servers, dev servers and agent-SDK children — many _belong_ to a
session without being one. **A sampler that counts only `claude` explains under a third of the
memory and will read as authoritative while doing so.** Attribute `node` to a session via parent PID
where possible, and report the unattributed remainder rather than dropping it.

---

## Design — sample for cost, transcripts for history

**This is the load-bearing decision.** The two sources answer different questions and must not be
conflated.

### Sampling → cost (what is running now, and what it is using)

A periodic snapshot of the process table. Cheap, and the only way to get memory.

```
ts | pid | ppid | kind | tty | machine_spawned | rss_mb | cwd | name | iterm_session_id | started_at | session_id | match_confidence
```

`kind` ∈ `claude` | `node` | `other`. `session_id` is the correlational match; `match_confidence`
records how it was reached (`name` > `cwd+tty+time` > `none`).

⚠️ **Sampling misses any session that opens and closes between two samples.** A 5-minute sampler is
blind to a 3-minute session and will report a clean population that was never true. **This is not a
tuning problem — it is a property of sampling.** Do not present sampled counts as a complete history.

### Transcripts → history (what ran, ever)

Session transcripts under `/Users/davidcruwys/.claude/projects/<encoded-cwd>/<session-id>.jsonl`
survive the process. File creation and modification times give an exact interval, retroactively,
for sessions that are long gone.

**This is why a crash report reconstructed 33 sessions across two days while `ps` showed 10.**

> **Sample for cost. Transcripts for history.** Neither substitutes for the other. A system that
> conflates them under-reports and looks authoritative doing it.

---

## Build order

1. **Verify the assumptions in the box at the top.** If `registry.json` is not keyed as assumed,
   step 3 changes shape. Do this before writing code.
2. **Sampler only, no reconciliation.** Append the row shape above every N minutes. Immediately
   useful on its own — it is the first time memory has an owner. Leave `session_id` null.
3. **Reconcile against the registry.** Match sampled rows to known sessions by name first, then
   `cwd`+`tty`+time. Populate `match_confidence`; **never silently upgrade a guess to a fact.**
4. **Transcript backfill.** Walk `~/.claude/projects/` for start/end intervals so closed sessions
   appear. This is what answers "30 or 40 sessions ago".
5. **`node` attribution by parent PID**, with an explicit unattributed bucket.

---

## The drift rule this unlocks — AppyRadar's, not AngelEye's

**`sessions.unbounded`** — session count climbing while uptime grows.

That is the **reboot signal**, and it is the one metric that would have caught this a week early. It
belongs in AppyRadar because it is a _rate over a fleet-wide fact_, not a session-level detail —
AppyRadar keeps counts per machine as `facts` rows and already has the time-series design for exactly
this. See its proposal, §_Which rules does the store make possible_.

**Observed 2026-08-07**: 27 tty sessions returned within **30 minutes** of a reboot. The rule would
have fired the same morning.

---

## Explicitly out of scope

- **Bulk session-park.** The _action_ — park N sessions, emit a resume script, reboot safely — is the
  highest-value build in this whole area, and it is a separate piece of work. This proposal only
  makes the population visible. The `sesh` plugin already holds the parts (`session-park`,
  `session-checkpoint`, `session-handover`, `session-rescue`); what is missing is the bulk operation.
- **Killing or parking anything automatically.** This system observes. Ending a session is a
  judgement call with unsaved work at stake.
- **Fleet-wide sampling.** Start on the M4. Sampling teammates' process tables is a scope and privacy
  decision that has not been made — the same open question flagged for AppyRadar's drift detectors.
- **The time series store itself** — decided and documented in AppyRadar's proposal (SQLite,
  `state/history.db`), deliberately unbuilt.
- **Alerting, push notification, any web interface.**

---

## Caveats worth carrying

- **`-n` names only exist on launch-line sessions.** An ad-hoc `claude` in a terminal has no name and
  never will. Do not design a UI that assumes every row is nameable.
- **`ITERM_SESSION_ID` is iTerm-specific.** It is absent under Terminal.app, `tmux`, or a
  launchd-spawned process. It is a bonus signal, not a spine.
- **`tmux` was 0 at measurement time**, so the tmux path is untested. Assume nothing about it.
- **The registry has ~12 dated `.bak` files.** Something has repeatedly rewritten it — understand
  that history before adding a writer.
- **Absence and presence must not look identical.** A session missing from a sample because it was
  never sampled must be distinguishable from one that was sampled and found gone. This exact defect
  occurred three times in AppyRadar's code (`disk_alert:'ok'` for never-measured machines,
  `track()` reading empty-as-failure, `drift_findings` counting online-but-unchecked as clean).
  **Make them different types, not different values.**
