# Wave 1b Learnings

**Wave**: 1b (larger sessions — 158KB to 504KB)
**Date**: 2026-03-22

## Application Learnings

### BUILD over-classification confirmed at scale

Across all 8 wave 1 sessions: **6 of 7 BUILD-classified sessions were wrong** (86% misclassification rate). Only signal-studio (W1-06) was genuinely BUILD. The 85% BUILD figure in the registry is not just over-classification — it's catastrophically wrong for non-product sessions.

| Session             | Registry    | Analysed                     | Correct? |
| ------------------- | ----------- | ---------------------------- | -------- |
| W1-05 lars          | ORIENTATION | orientation.cold_start       | Yes      |
| W1-08 angeleye      | BUILD       | orientation.cold_start       | **No**   |
| W1-02 brains        | BUILD       | orientation.morning_triage   | **No**   |
| W1-07 thumbrack     | BUILD       | test.uat_debug_hybrid        | **No**   |
| W1-01 brains        | BUILD       | knowledge.methodology_design | **No**   |
| W1-06 signal-studio | BUILD       | build.migration              | Yes      |
| W1-04 supportsignal | BUILD       | research.workflow_design     | **No**   |
| W1-03 supportsignal | ORIENTATION | knowledge.advisory           | **No**   |

### New subtypes proposed (wave 1b additions)

- `knowledge.methodology_design` — sessions producing analytical frameworks, research methodologies, schema designs (no application code)
- `knowledge.advisory` — persistent advisor sessions where Claude reviews work done in other sessions. User pastes terminal output for review.
- `build.migration` — schema/data migration work (rename fields, update types across layers)
- `research.workflow_design` — deep cross-codebase research producing design documents, not code

### The "advisory" conversation role is real and detectable

W1-03 is a clear advisory session. Signals:

- User pastes output from other Claude sessions
- Claude reviews and catches errors (e.g., Bob skipping readiness check gate)
- Zero application code written
- Session spans multiple days (persistent advisor)
- 111 Reads, 0 Edits to application code

This validates the Conversation Role angle from the framework. Advisory sessions are distinguishable from primary sessions.

### File size is noise — confirmed again

W1-03 is 504KB but only 269 events. The size comes from a single subagent_stop event containing a ~95KB MCP research report inline. File size tells you about Claude's verbosity and tool output bloat, not session complexity.

### Bash read/write split is critical

W1-04: 72 of 73 Bash calls were read-only, yet classified as "bash-heavy" → BUILD. The existing composite rule `Bash >= 50% AND no Playwright → INFRASTRUCTURE_WORK` fails because it doesn't check intent. Proposed split:

- Read-only: find, ls, cat, head, tail, wc, grep, open, pwd, echo (when no redirect)
- Write-capable: npm, git (commit/push/merge), mkdir, touch, rm, sed -i, echo >, mv, cp

### Skill invocations as session type signals

- `/bmad-oversight` → advisory session
- `/bmad-help` + `/sprint-planning` → orientation or research (not BUILD)
- `/ralphy` → BUILD (campaign execution)
- `/capture-context` → closing ceremony marker
- `/focus` + `/radar` → morning triage

Skill in first 5 events is already a composite classifier rule, but the specific skill matters more than the generic signal.

### Session pivot pattern confirmed

W1-04 started as ORIENTATION (BMAD skill invocation, sprint status) then pivoted to deep RESEARCH after a 93-minute gap. The pivot is conscious and intentional — a new question emerges after the routine work completes.

## Loop Meta-Learnings

### Larger files handled well

4 agents on 158-504KB files completed in ~2 minutes. The chunked reading strategy (first 150, last 80, middle samples) worked. No agent ran out of context.

### Wave 1a learnings improved wave 1b quality

Agents applied the "challenge BUILD" instruction and the Bash read/write distinction. All 4 agents produced richer analysis than wave 1a. The AGENTS.md learnings section is effective.

### Agent classification consistency

Dot notation standardisation from wave 1a learnings was partially applied — W1-04 used `research.workflow-design` (hyphen) instead of `research.workflow_design` (underscore). Minor but worth noting for the schema: pick one and enforce.

### 8 sessions is a good calibration batch size

Produced 7 new subtype candidates, confirmed BUILD over-classification, validated the advisory role concept, and identified 3 classifier improvements. Diminishing returns would likely set in around 15-20 sessions at this analytical depth.
