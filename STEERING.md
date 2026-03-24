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

### Campaign Complete — What's Next (2026-03-23)

**angeleye-analysis-1 is done.** 924 sessions fully processed across M4 Mini (807) and M4 Pro (116). Backward pass complete with v3 schema (P17-P22, C08-C11, O06-O07, derived metrics).

**High-priority backlog items from the campaign:**

- B038 — Scale-aware BUILD guard (micro=0%, light<15% accuracy — proven across 924 sessions)
- B039 — Iron-clad classifier rules (3 rules, definitive evidence)
- B040 — PII detection (flagged 14 waves, still no mechanism)

**Doc updates in progress:**

- PATTERNS.md — upgrading from 100-session to 924-session validated findings
- requirements.md — updating from pre-build to operational status
- Campaign dashboard mockup — HTML visualization of all 924-session data

**Optional future work:**

- Final pass with ~30 candidate new dimensions (P23-P25, C12-C13, O08-O09) discovered during backward pass
- Promote confirmed subtypes (N >= 3) from 500+ candidates to canonical taxonomy (B043)
- Multi-machine registry sync (B044)

---

## Resolved

_Processed items moved here for reference. Date + brief resolution note._

<!-- Example:
- 2026-03-18 [blocker] HTTP hook 404 → resolved: server wasn't mounting /events route, fixed in server/src/index.ts
-->
