# IMPLEMENTATION_PLAN.md — AngelEye Wave 8: Rule-Based Intelligence

**Goal**: Add rule-based session classification to RegistryEntry. Every session gets `is_junk`, `session_type`, `tool_pattern`, `first_edited_dir`, and `first_real_prompt` — computed from existing events, no LLM required. Observer shows session_id, filters junk, and displays session type + first real prompt as subtitle.
**Started**: 2026-03-15
**Target**: 663 existing sessions classified; live hook sessions classified on arrival; Observer upgraded; 145+ tests passing.

## Summary

- Total: 5 | Complete: 5 | In Progress: 0 | Pending: 0 | Failed: 0

## Pending

## In Progress

## Complete

- [x] IN01 — Extend shared schema: add SessionType, ToolPattern types + new optional fields to RegistryEntry
- [x] IN02 — Build classifier.service.ts: is_junk (8-rule cascade), session_type, tool_pattern, first_edited_dir, first_real_prompt — 47 unit tests
- [x] IN03 — Hook integration: classify on stop/session_end, capture first_real_prompt on first user_prompt
- [x] IN04 — POST /api/classify endpoint + force flag + Settings "Classify Sessions" button
- [x] IN05 — Observer UI: session_id (copyable), session_type badge, first_real_prompt subtitle, junk filter toggle

## Failed / Needs Retry

## Notes & Decisions

- Sequential: IN01 → IN02 → IN03 + IN04 parallel → IN05
- IN02 is the core — the classifier logic is pure functions, fully testable, no I/O
- IN03 and IN04 can run in parallel once IN02 is done
- IN05 can start after IN01 (UI only needs the types)
- LLM-based auto_label / auto_tags deferred to B012b (separate wave)
- session_id shown in Observer is the Claude Code UUID — copyable for cross-referencing
- Junk filter: toggle in Observer header, defaults to ON (junk hidden by default)
- first_real_prompt: skip pastes (>500 chars OR starts with known injection patterns), single-char prompts, context handover injections
- tool_pattern: count tool calls in session events, dominant type wins; threshold = >40% of calls
- session_type assignment: project_dir + tool_pattern composite (not tools alone — validated at 55-70% tools-only vs 89-95% composite)
- is_junk rules (in cascade order):
  1. total_events == 1 AND prompt.length <= 2
  2. total_events == 1 AND cwd contains "/tmp"
  3. session_id starts with "agent-"
  4. total_events == 1 AND prompt starts with hook test patterns ("Hello how can I")
  5. total_events <= 3 AND no tool_use events AND prompt.length <= 5
     Rule: if 5+ words in single prompt → NOT junk (protect meaningful one-shots)
