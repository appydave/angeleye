# Handover — AngelEye Enrichment Loop (2026-05-06, session 2)

## What was built this session

All five items from the previous handover are done:

| Step | What                                                                    | Commit  |
| ---- | ----------------------------------------------------------------------- | ------- |
| 1    | `enrichment_version` + `enriched_at` on `RegistryEntry`                 | 3eb6d50 |
| 2    | Sidecar writer + `enrichments.jsonl` (`enrichment.service.ts`)          | 028b812 |
| 3    | `GET/POST /api/sessions/:id/enrichments` endpoints + 32 tests           | b0c52cf |
| 4    | Requirement-doc format (`docs/requirements/format.md` + `_template.md`) | 071e7b8 |
| 5    | `angeleye-enrichment-loop` skill (replaces broken `enrich-subtypes`)    | 24da9b1 |

The infrastructure is functionally complete. The skill is usable today.

## Known hardening gaps (from delivery review)

A `/appydave:delivery-review` was run after step 3. The session ended before applying the patches. These are real issues — fix them before running the loop at volume:

| ID      | Issue                                                                          | Fix                                                                                                                         |
| ------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| DVR-002 | No sidecar write queue — concurrent POSTs lose data                            | Add `Map<sessionId, Promise<void>>` queue in `enrichment.service.ts`, same pattern as `writeQueue` in `registry.service.ts` |
| DVR-004 | Non-atomic sidecar write — crash mid-write wipes history                       | Use `tmp + rename` pattern (same as `_doUpdateRegistry`)                                                                    |
| DVR-005 | No `enrichment.service.test.ts`                                                | Create service-level tests: empty history, corrupt sidecar, log append, second pass accumulates                             |
| DVR-006 | `JSON.parse` doesn't validate array — non-array sidecar causes TypeError       | Add `Array.isArray(parsed) ? parsed : []` guard                                                                             |
| DVR-007 | `sessionId` used raw in filesystem path — path traversal risk                  | Add `if (!/^[a-zA-Z0-9_-]+$/.test(sessionId))` guard in route                                                               |
| DVR-008 | Input validation gaps — NaN version, whitespace enriched_at, non-ISO timestamp | `Number.isInteger(version) && version > 0`, `.trim()`, `!isNaN(Date.parse(...))`                                            |
| DVR-009 | Test "syncs registry fields" doesn't check registry                            | After POST, assert `entry.enrichment_version` and `entry.enriched_at` on registry row                                       |

Two items were intentionally deferred (need skill usage to resolve):

- **DVR-001**: `changes` field says "written to registry" but route doesn't apply them. Design decision: apply directly OR rename to `observed_changes`. Resolve after first real loop run.
- **DVR-003**: `changes` allow-list undefined. Can't define it until the skill establishes what it writes.

## What to do next

**Option A — Harden first, then run**
Apply the 7 patches above (DVR-002 through DVR-009). ~1–2 hours. Then run `/angeleye-enrichment-loop 5 1` as a smoke test.

**Option B — Run first, harden after**
Run `/angeleye-enrichment-loop 5 1` now against a small batch to validate the skill works end-to-end. The concurrent-write risk (DVR-002) is low for a single-agent manual run. Fix hardening gaps after the smoke test confirms the loop works.

**Recommendation**: Option B. The concurrent-write risk doesn't apply to a manual single-agent run. Running first confirms the `changes` design question (DVR-001) with real data before hardening.

## Hard boundary reminder

The enrichment loop reads and enriches data only. When it spots code-change opportunities, it writes to `docs/requirements/`. It never touches `shared/src/`, `server/src/services/`, tests, or skills.

## Infrastructure reference

- Skill: `.claude/skills/angeleye-enrichment-loop/SKILL.md`
- Requirement-doc format: `docs/requirements/format.md`
- Enrichment service: `server/src/services/enrichment.service.ts`
- API endpoints: `GET/POST /api/sessions/:id/enrichments` (in `server/src/routes/sessions.ts`)
- Server: `http://localhost:5051`
