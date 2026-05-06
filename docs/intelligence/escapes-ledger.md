# AngelEye Escapes Ledger

**Started:** 2026-05-07
**Purpose:** Canonical evidence ledger for **escapes** — sessions that should have been filtered, tagged, or classified differently at ingestion but slipped through into the main enrichment queue. Each escape category is recorded with deterministic detection rules, evidence, and corpus-wide counts.

This is a **provenance-chain document** — every claim cites a session_id and a deterministic detection rule. Re-running the rules reproduces the counts.

---

## Why escapes matter

When the ingestion or classifier filter misses something, the bad data flows into:

- The enrichment queue (wasting LLM cycles on non-user sessions)
- The AngelEye UI (cluttering "what David did" with platform noise)
- Cross-session analytics (skewing project velocity, tool usage patterns)

David wants alerts. Alerts need evidence. This doc is the evidence.

---

## Detection rules

Each rule is a deterministic check against `/api/sessions?limit=200` (paged) data. No LLM judgment. Rules can be re-run any time to refresh counts.

### E1: UUID-shaped project name (Paperclip workspace leak)

**Rule:** `session_kind === 'main'` AND `project` matches `^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`.

**What it usually means:** session ran inside a Paperclip workspace (`~/.paperclip/instances/*/workspaces/<uuid>/`). Paperclip is David's multi-agent platform — these sessions are platform-driven, not direct user work.

**Why it's an escape:** the session is being treated as a regular main session and getting enriched, but it's actually platform infrastructure noise.

### E2: Main session with `teammate_id` (Agent Teams leak)

**Rule:** `session_kind === 'main'` AND `teammate_id` is set.

**What it usually means:** the session is part of a Claude Code Agent Teams orchestration where the parent didn't get classified as such, or a leg was promoted to main incorrectly.

**Why it's an escape:** subagent legs polluting main classification.

### E3: silent_session subtype but not junk

**Rule:** `session_subtype === 'meta.silent_session'` AND `is_junk !== true`.

**What it usually means:** the silent-session filter ran (subtype was set) but the `is_junk` flag wasn't applied. Inconsistent state.

**Why it's an escape:** these will appear in the enrichment queue despite being silent — defeats the filter.

### E4: Heuristic-LLM major disagreement (proposed)

**Rule:** `subtype_heuristic` set AND `session_subtype` set AND they belong to different top-level families (e.g. heuristic says `build.*` but LLM says `meta.*`).

**Why it's an escape:** indicates the heuristic is producing wrong results in a way that needed manual override — likely a classifier improvement opportunity.

### E5: Project field looks like a transient path (proposed)

**Rule:** `session_kind === 'main'` AND `project` starts with `tmp`, `temp`, `staging`, `_bmad-output`, or matches `^[A-Za-z]{1,3}-\d+$` (likely throwaway).

**Why it's an escape:** session ran in a temporary directory; not real project work.

---

## Current evidence (scan run: 2026-05-07)

| Escape                            | Count              | Out of total | Rate  |
| --------------------------------- | ------------------ | ------------ | ----- |
| **E1: UUID project (Paperclip)**  | **8**              | 2433         | 0.33% |
| E2: main + teammate_id            | 0                  | 2433         | 0.00% |
| E3: silent_session not junk       | 0                  | 2433         | 0.00% |
| E4: heuristic-LLM family mismatch | (not yet computed) | —            | —     |
| E5: transient path                | (not yet computed) | —            | —     |

E2 and E3 being 0 is good — those filters are working as designed.

E1 is the active concern.

---

## E1 evidence — Paperclip workspace leaks

All 8 sessions found, with citations:

| session_id                             | project (UUID)                       | project_dir                                                                                       |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `7addf7ed-f4ad-4f7d-b390-8dd82a453214` | cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57` |
| `b32962e2-c999-4b9b-bfcb-04bd3240cadc` | 8fd2ea7b-2e4c-4d16-ab25-081937f39e4c | `/Users/davidcruwys/.paperclip/instances/default/workspaces/8fd2ea7b-2e4c-4d16-ab25-081937f39e4c` |
| `b653e697-bb5c-4f47-a009-07742a5eb24e` | 54ea7cf7-e406-4042-85ec-066c58e61c12 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/54ea7cf7-e406-4042-85ec-066c58e61c12` |
| `392a775c-...`                         | 8fd2ea7b-2e4c-4d16-ab25-081937f39e4c | `/Users/davidcruwys/.paperclip/instances/default/workspaces/8fd2ea7b...`                          |
| `f64f60e3-...`                         | cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/cfcc0c4b...`                          |
| `1ede25a0-...`                         | 8fd2ea7b-2e4c-4d16-ab25-081937f39e4c | `/Users/davidcruwys/.paperclip/instances/default/workspaces/8fd2ea7b...`                          |
| `0510b580-...`                         | 8fd2ea7b-2e4c-4d16-ab25-081937f39e4c | `/Users/davidcruwys/.paperclip/instances/default/workspaces/8fd2ea7b...`                          |
| `631ec536-...`                         | cfcc0c4b-9da7-4efd-9cd3-e83c3b3adb57 | `/Users/davidcruwys/.paperclip/instances/default/workspaces/cfcc0c4b...`                          |

**Pattern:** only 3 distinct workspace UUIDs, but 8 sessions across them. Each workspace has multiple sessions over time. Paperclip is generating recurring sessions per workspace.

**Recommended fix (would be a requirement doc):** at ingestion, when `project_dir` matches `/.paperclip/instances/*/workspaces/<uuid>$`, set:

- `session_kind: 'subprocess'` (Paperclip is hosting Claude as a subprocess)
- `project: 'paperclip'` (replace the UUID with the platform name)
- `is_junk: true` if they're autonomous platform runs without user interaction (TBD per session)

---

## How alerting works

**Per-batch alert (immediate):** the enrichment loop's Step 6 report should include an "Escapes flagged this batch" row. If non-zero, batch report calls them out. If new categories surface, log to `observations.jsonl`.

**Cross-batch alert (weekly):** the dreaming pass re-runs the full corpus scan, compares to last week's counts. Spike detection: if any category jumps by ≥ 50% over baseline, write a requirement doc.

**Threshold for action:** any new escape category appearing for the first time → immediate investigation. Existing categories rising over time → requirement doc proposing the ingestion fix.

---

## How to add a new escape category

1. Define the deterministic detection rule (regex, predicate, or condition over registry fields)
2. Run it against the full corpus to get the current count
3. Add the rule + count to "Detection rules" and "Current evidence" tables above
4. Add a section with example session evidence
5. Update the enrichment loop skill to compute the rule per batch

---

## Citations + reproducibility

- Source: `http://100.82.235.39:5051/api/sessions?limit=200&after=<cursor>` (paged)
- Detection script: in-line Node + regex, deterministic, re-runnable
- Each evidence entry cites a specific session_id; full session_dir is queryable from the registry

This doc is canonical. Conversations that produced it are not authoritative.
