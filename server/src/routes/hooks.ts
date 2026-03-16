import { Router } from 'express';
import type { Server } from 'socket.io';
import type { AngelEyeEvent, AngelEyeEventType } from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { writeEvent, getSessionEvents, archiveSession } from '../services/sessions.service.js';
import { readRegistry, updateRegistry } from '../services/registry.service.js';
import { classifySession, findFirstRealPrompt } from '../services/classifier.service.js';

const EVENT_MAP: Record<string, AngelEyeEventType> = {
  SessionStart: 'session_start',
  UserPromptSubmit: 'user_prompt',
  PostToolUse: 'tool_use',
  Stop: 'stop',
  SessionEnd: 'session_end',
  SubagentStart: 'subagent_start',
  SubagentStop: 'subagent_stop',
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

      await writeEvent(event);

      if (eventType === 'session_start') {
        const project =
          cwd !== undefined && cwd.length > 0 ? (cwd.split('/').filter(Boolean).pop() ?? cwd) : '';
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
        });
      } else if (eventType === 'stop') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        await updateRegistry(sessionId, {
          last_active: ts,
          ...(cwd !== undefined && { project_dir: cwd }),
          ...classification,
        });
      } else if (eventType === 'session_end') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        await updateRegistry(sessionId, { status: 'ended', last_active: ts, ...classification });
        await archiveSession(sessionId);
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
