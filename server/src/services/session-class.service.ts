import type { AngelEyeEvent, SessionClass } from '@appystack/shared';

// Cwd matches a Paperclip workspace dir — Claude is running inside the platform.
const PAPERCLIP_WORKSPACE_RE = /\/\.paperclip\/instances\/[^/]+\/workspaces\/[a-f0-9-]{36}\/?$/i;

// Cwd matches an ALS delamain worker worktree — dispatcher-driven worker leg.
// See docs/requirements/2026-05-13-detect-als-delamain-workers.md.
const ALS_DELAMAIN_WORKER_RE = /\/\.worktrees\/delamain\/[^/]+\//i;

// Trigger commands that mark orchestrator skills (Ralphy, BMAD lifecycle, etc).
// trigger_command is stored without the leading `/` (e.g. 'ralphy',
// 'appydave:bmad-story-lifecycle'). Match with or without appydave: prefix.
const ORCHESTRATOR_TRIGGER_RE =
  /^(appydave:)?(ralphy|bmad-(pm|sm|dev|dr|sat|ux-designer|e0|story-lifecycle))$/i;

// Tool-use to user-prompt ratio at which we promote a session from dialog to
// agent_run. Calibrated against the heaviest Ralphy session in the corpus
// (08fbfe17 = 3565 tool_use / 183 user_prompt = 19.48). Threshold of 10 gives
// clear separation between dialog (<5 typical) and agent_run (>10) without
// requiring an exact ratio fit. Re-tune if borderline cases surface.
const TOOL_TO_PROMPT_AGENT_RUN_THRESHOLD = 10;

/**
 * Cheap cwd check usable at session_start — before events arrive.
 */
export function detectMachineSignalFromCwd(cwd: string | undefined | null): boolean {
  if (!cwd) return false;
  return PAPERCLIP_WORKSPACE_RE.test(cwd) || ALS_DELAMAIN_WORKER_RE.test(cwd);
}

/**
 * Resolve a canonical project name when cwd matches a known harness pattern.
 * Returns null when no harness pattern matches — caller should fall through to
 * the default project-name derivation (last path segment of cwd).
 *
 * Without this, harness-hosted sessions accumulate as pseudo-projects under
 * UUIDs or hex IDs (e.g. `cfcc0c4b-...` for Paperclip workspaces, `d-0b426...`
 * for ALS delamain workers), polluting project enumerations.
 */
export function canonicalProjectFromCwd(cwd: string | undefined | null): string | null {
  if (!cwd) return null;
  if (PAPERCLIP_WORKSPACE_RE.test(cwd)) return 'paperclip';
  if (ALS_DELAMAIN_WORKER_RE.test(cwd)) return 'als-delamain';
  return null;
}

/**
 * Compute the final session_class from events + cwd + existing classification.
 * Used at session_end and by the backfill endpoint.
 *
 * Precedence:
 *   1. subagent_leg     — session_kind === 'subagent' (Agent Teams leg)
 *   2. machine_signal   — Paperclip workspace cwd OR zero user_prompt events
 *   3. agent_run        — trigger_command matches orchestrator OR tool/prompt ≥ 30
 *   4. dialog           — default for anything else
 */
export function computeSessionClass(input: {
  events: AngelEyeEvent[];
  cwd?: string;
  session_kind?: 'main' | 'subagent' | 'subprocess';
  trigger_command?: string | null;
}): SessionClass {
  if (input.session_kind === 'subagent') return 'subagent_leg';

  if (detectMachineSignalFromCwd(input.cwd)) return 'machine_signal';

  const userPromptCount = input.events.filter((e) => e.event === 'user_prompt').length;
  if (userPromptCount === 0) return 'machine_signal';

  if (input.trigger_command && ORCHESTRATOR_TRIGGER_RE.test(input.trigger_command)) {
    return 'agent_run';
  }

  const toolUseCount = input.events.filter((e) => e.event === 'tool_use').length;
  if (toolUseCount / userPromptCount >= TOOL_TO_PROMPT_AGENT_RUN_THRESHOLD) {
    return 'agent_run';
  }

  return 'dialog';
}
