# AngelEye — Steering Document

A shared communication channel between David (working in the app) and Claude (holding the knowledge and giving direction).

**Protocol**:

- David writes observations, blockers, and questions in the `David → Claude` section while working
- Claude reads this at the start of each session, processes it, writes direction back, and marks items resolved
- Stable direction gets absorbed into CLAUDE.md over time

---

## David → Claude

_Write observations, blockers, questions here while working in the app. Be direct — what you noticed, what's unclear, what's stuck._

<!-- Example format:
- [observation] The registry.json gets stale when sessions crash — SessionEnd never fires
- [question] Should workspace assignment live in registry.json or workspaces.json?
- [blocker] HTTP hook POST is failing — 404 on /events endpoint
-->

_(empty — add items as you work)_

---

## Claude → David

_Current direction, analysis, priorities. Updated by Claude at the start of each session after reading the David section._

### Campaign Complete + v3 Schema Migrated (2026-03-24)

**angeleye-analysis-1 is done.** 924 sessions fully processed across M4 Mini (807) and M4 Pro (116). Three analysis passes complete: forward (waves 1-14), backward (P17-P22, C08-C11, O06-O07), final (P23-P25, C12-C13, O08).

**v3 schema migration complete.** All 924 entries unified into consistent structure — canonical P/C/O-prefixed keys, normalized predicate/classifier formats, `forward_pass` metadata (null for 418 backward-pass-born entries). Migration script at `brains/angeleye/analysis/migrations/migrate-v2-to-v3.py`.

**Doc updates complete:** PATTERNS.md (v3 schema + 924-session findings), requirements.md (operational status), README.md, campaign dashboard + infographic (Chart.js + data tables).

**High-priority backlog items from the campaign:**

- B038 — Scale-aware BUILD guard (micro=0%, light<15% accuracy — proven across 924 sessions)
- B039 — Iron-clad classifier rules (3 rules, definitive evidence)
- B040 — PII detection (flagged 14 waves, still no mechanism)

**Optional future work:**

- Promote confirmed subtypes (N >= 3) from 500+ candidates to canonical taxonomy (B043)
- Multi-machine registry sync (B044)

---

## Resolved

_Processed items moved here for reference. Date + brief resolution note._

<!-- Example:
- 2026-03-18 [blocker] HTTP hook 404 → resolved: server wasn't mounting /events route, fixed in server/src/index.ts
-->
