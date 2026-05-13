import { Router } from 'express';
import type { Server } from 'socket.io';
import type { AngelEyeEvent, AngelEyeEventType } from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { appendFile } from 'node:fs/promises';
import {
  writeEvent,
  getSessionEvents,
  archiveSession,
  backupUpstreamJSONL,
} from '../services/sessions.service.js';
import { readRegistry, updateRegistry, _unknownHooksPath } from '../services/registry.service.js';
import { classifySession, findFirstRealPrompt } from '../services/classifier.service.js';
import { auditPayload } from '../services/schema-auditor.service.js';
import { detectTeammate } from '../services/teammate-detection.service.js';
import { detectSubprocess } from '../services/subprocess-detection.service.js';
import {
  computeSessionClass,
  detectMachineSignalFromCwd,
  canonicalProjectFromCwd,
} from '../services/session-class.service.js';

const EVENT_MAP: Record<string, AngelEyeEventType> = {
  // Original 7
  SessionStart: 'session_start',
  UserPromptSubmit: 'user_prompt',
  PostToolUse: 'tool_use',
  Stop: 'stop',
  SessionEnd: 'session_end',
  SubagentStart: 'subagent_start',
  SubagentStop: 'subagent_stop',
  // Wave 11 — full hook coverage (17 new)
  PostToolUseFailure: 'tool_failure',
  StopFailure: 'stop_failure',
  WorktreeCreate: 'worktree_create',
  WorktreeRemove: 'worktree_remove',
  CwdChanged: 'cwd_changed',
  PreToolUse: 'pre_tool_use',
  InstructionsLoaded: 'instructions_loaded',
  PreCompact: 'pre_compact',
  PostCompact: 'post_compact',
  PermissionRequest: 'permission_request',
  Notification: 'notification',
  TeammateIdle: 'teammate_idle',
  TaskCompleted: 'task_completed',
  ConfigChange: 'config_change',
  Elicitation: 'elicitation',
  ElicitationResult: 'elicitation_result',
  FileChanged: 'file_changed',
};

function summariseTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Record<string, unknown> {
  if (toolName === 'Bash') return { command: String(toolInput.command ?? '').slice(0, 300) };
  if (toolName === 'Write')
    return {
      file: toolInput.file_path,
      lines: String(toolInput.content ?? '').split('\n').length,
    };
  if (toolName === 'Read') return { file: toolInput.file_path };
  if (toolName === 'Edit' || toolName === 'MultiEdit') return { file: toolInput.file_path };
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__');
    return { mcp_server: parts[1], mcp_tool: parts.slice(2).join('__') };
  }
  return { keys: Object.keys(toolInput).slice(0, 5) };
}

export function createHooksRouter(io: Server): Router {
  const router = Router();

  router.post('/hooks/:event', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;

      // Stop hook guard — MUST be checked first to prevent infinite loops
      if (body.stop_hook_active === true) {
        res.status(200).json({ continue: true });
        return;
      }

      const hookEventName =
        typeof body.hook_event_name === 'string' ? body.hook_event_name : req.params.event;

      const eventType = EVENT_MAP[hookEventName];
      if (!eventType) {
        logger.warn({ hookEventName }, 'Unknown hook event name — ignoring');
        const entry = {
          hook_event_name: hookEventName,
          seen_at: new Date().toISOString(),
          payload_keys: Object.keys(body).slice(0, 20),
          session_id: typeof body.session_id === 'string' ? body.session_id : 'unknown',
        };
        appendFile(_unknownHooksPath(), JSON.stringify(entry) + '\n', 'utf-8').catch(() => {});
        res.status(200).json({ continue: true });
        return;
      }

      const sessionId = typeof body.session_id === 'string' ? body.session_id : 'unknown';
      const ts = new Date().toISOString();
      const cwd = typeof body.cwd === 'string' ? body.cwd : undefined;
      const agentId = typeof body.agent_id === 'string' ? body.agent_id : undefined;

      const event: AngelEyeEvent = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts,
        source: 'hook',
        event: eventType,
        ...(cwd !== undefined && { cwd }),
        ...(agentId !== undefined && { agent_id: agentId }),
      };

      // Attach event-specific payload fields
      if (eventType === 'user_prompt') {
        const promptText =
          typeof body.prompt === 'string'
            ? body.prompt
            : typeof body.user_prompt === 'string'
              ? body.user_prompt
              : undefined;
        if (promptText !== undefined) event.prompt = promptText;
      }

      if (eventType === 'tool_use') {
        if (typeof body.tool_name === 'string') {
          event.tool = body.tool_name;
        }
        if (typeof body.tool_use_id === 'string') {
          event.tool_use_id = body.tool_use_id;
        }
        const toolInput =
          body.tool_input !== null &&
          typeof body.tool_input === 'object' &&
          !Array.isArray(body.tool_input)
            ? (body.tool_input as Record<string, unknown>)
            : {};
        if (typeof body.tool_name === 'string') {
          event.tool_summary = summariseTool(body.tool_name, toolInput);
        }
        if (typeof body.tool_result === 'string') {
          event.result = body.tool_result;
        }
      }

      if (eventType === 'stop' || eventType === 'subagent_stop') {
        if (typeof body.reason === 'string') {
          event.reason = body.reason;
        }
        if (typeof body.last_assistant_message === 'string') {
          event.last_message = body.last_assistant_message;
        }
      }

      if (eventType === 'subagent_start' || eventType === 'subagent_stop') {
        if (typeof body.agent_type === 'string') {
          event.agent_type = body.agent_type;
        }
      }

      // Wave 11 — new events: store raw payload with large-field truncation
      const ORIGINAL_EVENTS = new Set([
        'session_start',
        'user_prompt',
        'tool_use',
        'stop',
        'session_end',
        'subagent_start',
        'subagent_stop',
      ]);
      const STRIP_FROM_PAYLOAD = new Set([
        'session_id',
        'cwd',
        'hook_event_name',
        'transcript_path',
        'permission_mode',
        'agent_id',
        'agent_type',
        'stop_hook_active',
      ]);
      if (!ORIGINAL_EVENTS.has(eventType)) {
        event.payload = Object.fromEntries(
          Object.entries(body)
            .filter(([k]) => !STRIP_FROM_PAYLOAD.has(k))
            .map(([k, v]) => [k, typeof v === 'string' && v.length > 500 ? v.slice(0, 500) : v])
        );
        if (eventType === 'tool_failure' || eventType === 'stop_failure') {
          if (typeof body.error === 'string') event.error = body.error;
        }
      }

      // Non-blocking schema audit (runs for all 24 events)
      auditPayload(hookEventName, eventType, body).catch(() => {});

      await writeEvent(event);

      if (eventType === 'session_start') {
        // Project name: canonicalise harness-hosted sessions (Paperclip, ALS
        // delamain) so they don't accumulate as UUID/hex pseudo-projects.
        // Fall through to the default last-path-segment derivation otherwise.
        const defaultProject =
          cwd !== undefined && cwd.length > 0 ? (cwd.split('/').filter(Boolean).pop() ?? cwd) : '';
        const project = canonicalProjectFromCwd(cwd) ?? defaultProject;
        // Detect Mechanism B subagents (Agent Teams). Best-effort at SessionStart —
        // the JSONL may not yet contain the teammate-message line. Backfill script
        // catches misses. See known-issues.md#subagent-detection.
        const teammate = detectTeammate(sessionId, cwd);
        // Initial session_class — default to 'dialog' so stale-active sessions
        // (where session_end never fires) still have a usable class. session_end
        // refinement upgrades to 'agent_run' or 'machine_signal' with full event
        // context. Deterministic cases (subagent leg, Paperclip cwd) are set
        // here at session_start so they're never wrong even if session_end runs.
        const initial_class = teammate.is_subagent
          ? ('subagent_leg' as const)
          : detectMachineSignalFromCwd(cwd)
            ? ('machine_signal' as const)
            : ('dialog' as const);
        await updateRegistry(sessionId, {
          session_id: sessionId,
          project,
          project_dir: cwd ?? '',
          started_at: ts,
          last_active: ts,
          name: null,
          tags: [],
          workspace_id: null,
          status: 'active',
          source: 'hook',
          session_kind: teammate.is_subagent ? 'subagent' : 'main',
          ...(teammate.teammate_id !== undefined && { teammate_id: teammate.teammate_id }),
          session_class: initial_class,
        });
      } else if (eventType === 'stop') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        // Re-detect teammate in case SessionStart fired before the wrapper was in JSONL.
        // Then, if not a teammate, check for headless skill subprocess (Mechanism C).
        // See known-issues.md#subprocess-session-mechanism-3
        const registry = await readRegistry();
        const existing = registry[sessionId];
        const kindUpdate: {
          session_kind?: 'subagent' | 'subprocess';
          teammate_id?: string | null;
        } = {};
        if (existing?.session_kind === undefined || existing.session_kind === 'main') {
          const t = detectTeammate(sessionId, cwd);
          if (t.is_subagent) {
            kindUpdate.session_kind = 'subagent';
            kindUpdate.teammate_id = t.teammate_id ?? null;
          } else if (detectSubprocess(allEvents).is_subprocess) {
            kindUpdate.session_kind = 'subprocess';
          }
        }
        await updateRegistry(sessionId, {
          last_active: ts,
          ...(cwd !== undefined && { project_dir: cwd }),
          ...classification,
          ...kindUpdate,
        });
      } else if (eventType === 'session_end') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        // Silent-session filter: no user_prompt → mark junk + override subtype.
        // Catches T3/OpenCode capability probes, human-opened-and-closed, scheduler
        // pings — anything where Claude started but no user actually interacted.
        const hasNoUserPrompt = !allEvents.some((e) => e.event === 'user_prompt');
        const silentOverride = hasNoUserPrompt
          ? { is_junk: true, session_subtype: 'meta.silent_session' }
          : {};
        // Compute final session_class with full event context. computeSessionClass
        // returns 'machine_signal' for zero-prompt sessions, so it stays consistent
        // with the silent_session override above.
        const registryNow = await readRegistry();
        const existingNow = registryNow[sessionId];
        const session_class = computeSessionClass({
          events: allEvents,
          cwd,
          session_kind: existingNow?.session_kind,
          trigger_command: classification.trigger_command,
        });
        await updateRegistry(sessionId, {
          status: 'ended',
          last_active: ts,
          ...classification,
          session_class,
          ...silentOverride,
        });
        await archiveSession(sessionId);
        // Back up upstream JSONL before Claude Code purges it — fire-and-forget.
        // Skip for machine_signal: zero-prompt sessions (AppyCtrl probes etc.)
        // have no upstream JSONL to back up; the call would just emit "not found"
        // warnings every ~5 min, drowning real failures in the logs.
        if (session_class !== 'machine_signal') {
          backupUpstreamJSONL(sessionId, cwd ?? '').catch((err) =>
            logger.warn({ err, sessionId }, 'backupUpstreamJSONL failed (non-fatal)')
          );
        }
      } else {
        await updateRegistry(sessionId, {
          last_active: ts,
          ...(cwd !== undefined && { project_dir: cwd }),
        });

        // On user_prompt: capture first_real_prompt early if not yet set
        if (eventType === 'user_prompt') {
          const registry = await readRegistry();
          const existing = registry[sessionId];
          if (!existing?.first_real_prompt) {
            const result = findFirstRealPrompt([event]);
            if (result !== undefined) {
              await updateRegistry(sessionId, { first_real_prompt: result });
            }
          }
        }
      }

      io.emit(SOCKET_EVENTS.ANGELEYE_EVENT, event);

      res.status(200).json({ continue: true });
    } catch (err) {
      logger.error({ err }, 'Unexpected error in hooks endpoint — returning continue anyway');
      res.status(200).json({ continue: true });
    }
  });

  return router;
}
