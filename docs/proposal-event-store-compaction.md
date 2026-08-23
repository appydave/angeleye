# Proposal — Event Store Compaction

**Status**: proposed, 2026-08-23. Nothing built. No data touched.
**Origin**: fallout from `598df1f`, which restored two dropped hook fields (`transcript_path`,
`permission_mode`) by promoting them to first-class on every event. That fix is correct, but it
added a ~110-byte string to every event AngelEye writes, which raised a fair question: how much of
the store is the same values repeated line after line, and is the JSONL shape wrong?
**Related**: `architecture/staleness-review.md#a1-17` (the bug that prompted this),
`data-schema.md` (the event schema this would change), `proposal-session-resource-history.md`
(sibling proposal, whose facts/findings split this mirrors).

---

## The recommendation in one line

**Compress `archive/`. Leave the event schema alone.** The repetition is load-bearing, and gzip
saves more than restructuring would, at zero fidelity cost.

---

## Measured, not estimated

One live session, 156 events, 180,861 bytes. Per-field share of total stored bytes:

| Field             |  Bytes | % of store | Varies _within_ a session?          |
| ----------------- | -----: | ---------: | ----------------------------------- |
| `transcript_path` | 13,066 |   **7.2%** | Effectively no                      |
| `session_id`      |  8,112 |   **4.5%** | No — and it is already the filename |
| `prompt_id`       |  7,701 |       4.3% | Yes, per turn                       |
| `cwd`             |  7,488 |       4.1% | **Yes**                             |
| `id`              |  6,864 |       3.8% | Yes, unique per event               |
| `permission_mode` |  3,458 |       1.9% | **Yes**                             |

Roughly **18%** of the store is a handful of near-constant values repeated on every line.

Store size at time of writing: **258 MB** — `sessions/` 144 MB, `archive/` 114 MB, plus an 8.1 MB
`registry.json`. 793 archive files.

**gzip -9 on 60 sampled archive files: 3,928 KB → 940 KB, 76.1% saved.**

---

## Why not restructure the events

Three reasons, heaviest first.

### 1. Two of the repeated fields are not constant, and treating them as constant is the bug we just fixed

`cwd` changes mid-session — AngelEye has a whole `cwd_changed` event _because it does_.
`permission_mode` changes whenever the user shift-tabs. Hoisting either to a session-level header or
the registry would discard real per-event signal.

That is precisely the failure recorded in `staleness-review.md#a1-17`: a field was dropped because
the code assumed it was available elsewhere, and the assumption was never checked against a stored
record. A compaction scheme built on "these values don't really change" would reintroduce the same
class of defect with a performance justification attached. **The 6% those two fields represent is
the least safe 6% in the store.**

### 2. Self-describing lines are the tool's best debugging affordance

`grep '"event":"stop"' *.jsonl` returning complete, independently parseable records is how the
A1-17 bug was found and how the fix was verified — the field counts in this document were produced
the same way. A header-record or delta-encoding scheme breaks `tail -1`, partial reads, `cat` across
files, and every ad-hoc grep, in exchange for ~18%.

For a **session-observation tool**, whose entire job is being interrogable after the fact, that is a
bad trade. The redundancy is what makes a single line survive being pulled out of its file.

### 3. Compression saves more, and costs nothing

76% of 114 MB is ~87 MB from `archive/` alone — more than an 18% saving across the entire store —
with no format change, no fidelity loss, no reader changes, and `zgrep` still working. Archive files
are closed by definition and never rewritten, so they are the natural target.

---

## What to build, if this is ever picked up

Scoped to `archive/` only. `sessions/` stays uncompressed — those files are appended to live.

1. Compress `archive/*.jsonl` → `.jsonl.gz`.
2. **Verify before deleting anything**: `zcat` each result, compare line count and byte count to the
   original, and only then remove the source. A compaction pass that loses a session to save disk is
   strictly worse than the disk it saved.
3. Teach the archive readers (`backfill.service.ts` and the enrichment scripts, which per
   `known-issues.md` should already be falling back to the archive) to accept `.gz`.
4. Leave the newest N days uncompressed so the common "what happened yesterday" grep stays cheap.

**`session_id` is a genuine free 4.5%** — it is fully redundant with the filename
`session-<id>.jsonl`. Recommend keeping it anyway, for reason 2 above: it is what lets a line stay
meaningful once it has been `cat`'d out of its file.

`transcript_path` at 7.2% is the only field with a real case for delta-encoding (write only when it
differs from the previous event). Still not recommended — 7% does not buy back the greppability, and
it reintroduces reader-carries-state complexity.

---

## What this did **not** establish

Stated explicitly, because the numbers above are narrower than they look.

1. **The per-field breakdown is ONE session** — 156 events in a code-heavy, tool-dense session in
   this repo. A session dominated by long assistant prose would shift the shares heavily toward
   `last_message` and make the envelope fields look proportionally smaller. The 18% figure is not a
   store-wide measurement, and no store-wide pass was run.
2. **The 76% gzip ratio is a 60-file sample** of `archive/`, not all 793. Sampled by `ls` order,
   which is not random.
3. **No growth rate was measured.** Nothing here says whether 258 MB is a problem that is getting
   worse, or a plateau. Without that, the urgency of this proposal is unknown — it is filed as a
   consideration, not a plan. **Measure growth before acting on any of it.**
4. **The cost of the A1-17 fix itself was not isolated.** `transcript_path` now writes on every
   event, but no before/after comparison of store growth was taken, because the fix landed hours
   before this was written.
5. **Nothing was benchmarked.** No read-path timing, no decompression cost, no measurement of
   whether the store size actually hurts any operation AngelEye performs today.
