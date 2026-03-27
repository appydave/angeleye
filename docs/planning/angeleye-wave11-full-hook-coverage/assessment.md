# Assessment: AngelEye Wave 11 — Full Hook Coverage

**Campaign**: angeleye-wave11-full-hook-coverage
**Date**: 2026-03-25 (single session)
**Results**: 2 complete, 0 failed (plus pre-committed code from earlier work)

## Results Summary

| Unit       | Feature                                                                            | Status                 |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------- |
| Pre-commit | Types, EVENT_MAP, payload extraction, schema auditor, tests (7 hooks + 25 auditor) | Committed (`62cdef97`) |
| WU01       | Install skill update (7→24 hooks with safety guardrails)                           | Done                   |
| WU02       | Wire settings.json (17 new hooks, 6 non-AngelEye preserved)                        | Done                   |

**Final test counts**: 316 server passing (6 pre-existing env.test.ts failures), 44 client passing. Typecheck clean. Lint clean.

## What Worked Well

- Requirements doc was exceptionally detailed — the implementation followed it almost directly with minimal decisions needed
- Schema auditor was a smart bonus addition (not in original requirements) — captures payload surprises without crashing or self-healing
- Safety guardrails for the install skill were well-considered: additive-only, preserve non-AngelEye hooks, documented blast radius
- Small campaign (2 WUs after pre-committed code) kept focus tight

## What Didn't Work

- Duplicate work across sessions — another Claude window independently implemented the same wave 11 changes. No harm done (we committed first), but this is a coordination gap when multiple sessions touch the same project
- Pre-commit hook caught lint errors (unused destructured vars) — the initial payload stripping approach used `const { _sid, _cwd, ...rest } = body` which ESLint rejects. Replaced with `Set.has()` filter approach

## Code Quality Audit Findings

### High severity (3)

- **H1**: `ORIGINAL_EVENTS` and `STRIP_FROM_PAYLOAD` Sets allocated per-request inside the handler — should be module-level constants
- **H2**: `ANGELEYE_EVENTS` constant in `constants.ts` is exported but never imported anywhere — dead code that can drift
- **H3**: `SessionSubtype` references parent types (PLANNING, SETUP, META) that don't exist in `SessionType`

### Medium severity (6)

- Race condition window in `user_prompt` first_real_prompt update (read-then-write outside write queue)
- `pii_flags` written to registry.json by classifier but not declared on `RegistryEntry` type
- Payload truncation only handles top-level strings — nested objects unbounded
- `COMMON_FIELDS` (auditor) and `STRIP_FROM_PAYLOAD` (hooks) are duplicate sets that can drift
- `healed` defaults can produce `project: undefined` bypassing the non-optional type via `as RegistryEntry` cast
- `summariseTool` Write branch returns `lines: 1` for empty content (misleading, not wrong)

### Low severity (5)

- `_hookName` param unused in `detectSurprises`
- `EVENT_MAP` and `ANGELEYE_EVENTS` can diverge (no compile-time check)
- `tool_result` on original events has no length cap (wave 11 events get 500 char cap)
- `detectSurprises` reports unexpected fields as `expected: 'missing'` (confusing label)
- `crypto.randomUUID()` used as global (Node 19+ only, fine for now)

## Test Quality Audit Findings

### Critical (3)

- `it.each(ALL_HOOKS)` test verifies `io.emit` was called but never reads the JSONL — false positive risk if `writeEvent` fails silently
- `PostToolUseFailure` test doesn't assert `error` field was promoted (the `StopFailure` test does)
- No test verifies `payload` is NOT set for original 7 event types — if the `ORIGINAL_EVENTS` guard were removed, no test would catch it

### High (5)

- `summariseTool` branches for Edit, MultiEdit, and unknown tools are untested
- Bash command 300-char truncation not tested
- Truncation test checks length but not content preservation
- `auditPayload` integration wiring (hooks.ts → schema-auditor) never tested end-to-end

### Medium (7)

- Missing field coverage: `tool_use_id`, `tool_result`, `agent_id`, `agent_type` not tested
- Stop event classification integration not tested
- `detectSurprises` null handling untested
- Schema auditor `auditPayload` tests coupled to internal expectations map

## Key Learnings — Application

- The schema auditor approach (observe and record surprises, don't self-heal) is the right pattern for undocumented APIs — Claude Code doesn't publish formal hook payload schemas
- Hooks load at session start — changes to settings.json don't take effect until the next Claude Code session
- 24 curl commands per session is the cost of full telemetry — all fail-silent when server is down

## Key Learnings — Ralph Loop

- Pre-committed code made this a very small campaign (2 WUs) — the Extend mode was appropriate but the planning overhead was almost larger than the work
- For campaigns where most code is already written and only configuration/wiring remains, a simpler approach (just do it, skip the full Ralphy ceremony) would have been more efficient
- Duplicate work across sessions is a real risk — AngelEye itself should eventually detect and flag when two sessions are modifying the same files

## Promote to Main KDD?

- Schema auditor pattern (observe, record, don't self-heal) — worth documenting as a pattern for integrating with undocumented APIs
- Install skill safety guardrails (additive-only, identify by marker string, preserve foreign entries) — reusable pattern for any skill that modifies shared config files

## Suggestions for Next Campaign

### Quick fixes (from audits — could be a micro-campaign)

1. Move `ORIGINAL_EVENTS` and `STRIP_FROM_PAYLOAD` to module scope (H1 — trivial, measurable perf gain)
2. Delete `ANGELEYE_EVENTS` or wire it up (H2 — dead code)
3. Add `pii_flags?: string[]` to `RegistryEntry` type (M6)
4. Add missing test assertions: error field on PostToolUseFailure, no-payload on original events, summariseTool branches

### AGENTS.md improvements

- Update baseline to 316 server tests (was 170 at wave 10)
- Add note about duplicate session risk when multiple Claude windows touch the same project
- Add the schema auditor service to the service file structure section
