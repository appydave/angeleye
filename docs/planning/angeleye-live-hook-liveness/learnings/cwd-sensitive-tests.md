## Learning: workflow-type test is cwd-sensitive — use `npm test`, not `--workspace server` / `--root`

- **hard_won**: true
- **impact**: high
- **campaign_origin**: angeleye-live-hook-liveness
- **saved_time**: ~30 min (prevents a phantom "regression" investigation)
- **detail**: `server/src/services/workflow-type.service.ts → loadWorkflowTypes()` resolves its config dir as `resolve(process.cwd(), 'src', 'config', 'workflows')`. The test `workflow-type.service.test.ts > "loads 2 types with correct ids from actual config dir"` therefore depends on the runner's cwd being `server/`.
  - `npm test` (root) and `npm test --workspace server` **cd into `server/`** → cwd correct → loader finds the 2 real configs → green.
  - `npx vitest run --root server ...` keeps cwd at the **repo root** → `src/config/workflows` doesn't exist there → `readdir` throws → loader returns `[]` → `toHaveLength(2)` fails.
  - Net: a passing suite can look like "1 failed" purely from how you invoked vitest. ALWAYS verify counts with the canonical `npm test` before treating a failure as real.
- **Corollary**: AGENTS.md "Build & Run Commands" should prefer `npm test` for the whole-suite gate; reserve `npm test --workspace server` for speed but know it (mostly) cd's correctly too — the trap is `npx vitest --root`.
