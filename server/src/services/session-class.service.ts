import type { AngelEyeEvent, SessionClass } from '@appystack/shared';

// Cwd matches a Paperclip workspace dir — Claude is running inside the platform.
const PAPERCLIP_WORKSPACE_RE = /\/\.paperclip\/instances\/[^/]+\/workspaces\/[a-f0-9-]{36}\/?$/i;

// Slash-commands that trigger orchestrator skills (Ralphy, BMAD lifecycle, etc).
// Match with or without the appydave: namespace prefix.
const ORCHESTRATOR_TRIGGER_RE =
  /^\/(appydave:)?(ralphy|bmad-(pm|sm|dev|dr|sat|ux-designer|e0)|bmad-story-lifecycle)$/i;

// Tool-use to user-prompt ratio at which we promote a session from dialog to
// agent_run. Empirical starting point — calibrate after backfill if borderline
// cases prove it wrong. See requirement doc 2026-05-07-schema-session-class.md.
const TOOL_TO_PROMPT_AGENT_RUN_THRESHOLD = 30;

/**
 * Cheap cwd check usable at session_start — before events arrive.
 */
export function detectMachineSignalFromCwd(cwd: string | undefined | null): boolean {
  if (!cwd) return false;
  return PAPERCLIP_WORKSPACE_RE.test(cwd);
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
